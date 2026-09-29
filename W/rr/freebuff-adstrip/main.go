// Command freebuff-adstrip removes the sponsored-text-ad subsystem from a
// locally installed Freebuff CLI binary.
//
// # What it does
//
// Freebuff's npm package is a thin launcher that downloads a Bun-compiled
// executable to ~/.config/manicode/freebuff. That executable renders
// contextual text ads into the chat view. The tool:
//
//  1. discovers every Freebuff installation on the machine,
//  2. classifies each binary by locating its ad gate,
//  3. backs the binary up and verifies the backup by hash,
//  4. rewrites a single byte so the gate returns false,
//  5. re-scans to prove the edit took and did not change the file size.
//
// # Subcommands
//
//	status     report what is installed and whether it is patched (default)
//	patch      apply the ad-removal patch
//	rollback   restore a binary from a backup
//	doctor     report threats to the patch remaining in place
//	help       usage
//
// # Examples
//
//	freebuff-adstrip                      # status report
//	freebuff-adstrip patch                # patch all discovered installs
//	freebuff-adstrip patch --dry-run      # show what would change
//	freebuff-adstrip rollback             # undo, using the newest backup
//	freebuff-adstrip doctor               # check patch persistence
//
// # Safety model
//
// The edit is length-preserving (one byte in place), so no offset in the file
// shifts and the embedded module graph stays valid. Backups are hash-verified
// before any write. If the gate signature is not found the file is left
// untouched and reported as unrecognised rather than guessed at. Because the
// installer verifies checksums only at download time, `doctor` warns that a
// self-update or reinstall will silently restore the ads.
//
// The tool is idempotent: running it against an already-patched binary is a
// no-op that reports success.
package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
)

// version is the tool's own version, overridable at build time.
var version = "1.0.0"

func main() {
	// Subcommand is the first non-flag argument. Everything else is passed
	// through to the flag parser.
	args := os.Args[1:]
	cmd := "status"
	if len(args) > 0 && !strings.HasPrefix(args[0], "-") {
		cmd = args[0]
		args = args[1:]
	}

	opts, err := parseFlags(args)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(2)
	}

	log := newLogger(opts.Verbose, opts.Quiet, opts.JSON)

	switch cmd {
	case "status":
		os.Exit(runStatus(opts, log))
	case "patch":
		os.Exit(runPatch(opts, log))
	case "rollback":
		os.Exit(runRollback(opts, log))
	case "doctor":
		os.Exit(runDoctor(opts, log))
	case "help", "-h", "--help":
		printUsage()
		os.Exit(0)
	case "version", "-v", "--version":
		fmt.Println(version)
		os.Exit(0)
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", cmd)
		printUsage()
		os.Exit(2)
	}
}

// runStatus reports every discovered install and its patch state without
// modifying anything. It exits non-zero if any install is unpatched, so it can
// be used as a CI or monitoring check.
func runStatus(o *options, log Logger) int {
	installs, err := discoverInspections(o.paths, o.home, log)
	if err != nil {
		log.Errorf("discovery failed: %v", err)
		return 1
	}

	if o.JSON {
		log.emitJSON(map[string]any{
			"tool":      "freebuff-adstrip",
			"version":   version,
			"installs":  installs,
			"generated": nowISO(),
		})
		return statusExitCode(installs)
	}

	if len(installs) == 0 {
		log.Println("No Freebuff installations found.")
		log.Println("Searched: FREEBUFF_CONFIG_DIR, ~/.config/manicode,")
		log.Println("          XDG_CONFIG_HOME, and other accounts' ~/.config.")
		return 0
	}

	log.Printf("Found %d Freebuff installation(s).\n", len(installs))
	log.Println("")

	anyUnpatched := false
	for i, inst := range installs {
		if i > 0 {
			log.Println("")
		}
		renderInstall(log, inst)
		if inst.Report.State == StateUnpatched {
			anyUnpatched = true
		}
	}

	log.Println("")
	if anyUnpatched {
		log.Println("Result: ADS ENABLED in at least one install.")
		log.Println("Run 'freebuff-adstrip patch' to remove them.")
	} else {
		log.Println("Result: ads disabled in all installs.")
	}
	return statusExitCode(installs)
}

// runPatch applies the ad-removal patch to every discovered install that is
// not already patched. It is safe to run repeatedly.
func runPatch(o *options, log Logger) int {
	installs, err := discoverInspections(o.paths, o.home, log)
	if err != nil {
		log.Errorf("discovery failed: %v", err)
		return 1
	}
	if len(installs) == 0 {
		log.Println("No Freebuff installations found; nothing to patch.")
		return 0
	}

	var results []PatchResult
	failures := 0
	changed := 0
	// wouldChange counts installs a real (non-dry) run would modify, so the
	// dry-run summary can say what it would have done instead of claiming
	// there is nothing to do.
	wouldChange := 0

	for _, inst := range installs {
		if inst.Report.State == StateUnknown {
			log.Warn("skip %s: ad-gate signature not found (not a recognised build)", inst.Path)
			results = append(results, PatchResult{
				Path: inst.Path, Skipped: true,
				Reason: "unrecognised build; left untouched",
				Notes:  inst.Report.Notes,
			})
			continue
		}
		if inst.Report.State == StatePatched {
			log.Infof("already patched: %s", inst.Path)
			results = append(results, PatchResult{
				Path: inst.Path, AlreadyDone: true,
				SizeBefore: inst.Report.Size, SizeAfter: inst.Report.Size,
				BytesBefore: inst.Report.SHA256, BytesAfter: inst.Report.SHA256,
			})
			continue
		}

		if !o.JSON {
			log.Printf("patching %s ...\n", inst.Path)
			log.Printf("  gate at offset %d; flipping boolean literal to false",
				inst.Report.PatchOffset)
		}

		res, err := applyPatch(inst.Path, o.DryRun, o.KeepBackups, log)
		if err != nil {
			log.Errorf("patch %s: %v", inst.Path, err)
			failures++
			res.Reason = err.Error()
			results = append(results, res)
			continue
		}
		results = append(results, res)
		if res.Applied || res.WouldApply {
			wouldChange++
		}

		if res.Applied {
			changed++
			if !o.JSON {
				log.Printf("  OK: patched (%s)\n", res.Duration)
				if res.BackupPath != "" {
					log.Printf("  backup: %s\n", res.BackupPath)
				}
				log.Printf("  sha256: %s\n", shortHash(res.BytesBefore))
				log.Printf("     ->  %s\n", shortHash(res.BytesAfter))
			}
		} else if res.Skipped {
			if !o.JSON {
				log.Printf("  skipped: %s\n", res.Reason)
			}
		}
	}

	if o.JSON {
		log.emitJSON(map[string]any{
			"tool":      "freebuff-adstrip",
			"version":   version,
			"dryRun":    o.DryRun,
			"results":   results,
			"generated": nowISO(),
		})
	}

	log.Println("")
	switch {
	case failures > 0:
		log.Printf("Completed with %d failure(s); %d binary(ies) patched.", failures, changed)
		return 1
	case o.DryRun:
		if wouldChange > 0 {
			log.Printf("Dry run: %d binary(ies) would be patched. No bytes were written.", wouldChange)
		} else {
			log.Println("Dry run: all installs are already patched; nothing to do.")
		}
		return 0
	case changed == 0:
		log.Println("Nothing to do; all installs are already patched.")
		return 0
	default:
		log.Printf("Success: %d binary(ies) patched. Ads removed.", changed)
		log.Println("Use 'freebuff-adstrip doctor' to confirm the patch persists.")
		return 0
	}
}

// runRollback restores a binary from a backup. With no --backup flag it uses
// the most recent backup in the install's directory.
func runRollback(o *options, log Logger) int {
	installs, err := discoverInspections(o.paths, o.home, log)
	if err != nil {
		log.Errorf("discovery failed: %v", err)
		return 1
	}
	if len(installs) == 0 {
		log.Println("No Freebuff installations found.")
		return 0
	}

	anyFailed := false
	for _, inst := range installs {
		dir := filepath.Dir(inst.Path)
		backup := o.backup
		if backup == "" {
			backup = newestBackup(dir)
		}
		if backup == "" {
			log.Warn("no backup found for %s; nothing to roll back", inst.Path)
			continue
		}
		if st, err := os.Stat(backup); err != nil || st.IsDir() {
			log.Errorf("backup %s is not a readable file", backup)
			anyFailed = true
			continue
		}

		if !o.JSON {
			log.Printf("rolling back %s\n", inst.Path)
			log.Printf("  from: %s\n", backup)
		}
		res, err := revert(inst.Path, backup, o.DryRun, log)
		if err != nil {
			log.Errorf("rollback %s: %v", inst.Path, err)
			anyFailed = true
			continue
		}
		if res.Applied && !o.JSON {
			log.Printf("  OK: restored to unpatched state\n")
		}
	}

	if anyFailed {
		return 1
	}
	log.Println("Rollback complete.")
	return 0
}

// runDoctor reports whether the patch is still in place and warns about the
// ways it can silently be undone.
func runDoctor(o *options, log Logger) int {
	installs, err := discoverInspections(o.paths, o.home, log)
	if err != nil {
		log.Errorf("discovery failed: %v", err)
		return 1
	}

	healthy := true
	if len(installs) == 0 {
		log.Println("No Freebuff installations found.")
		return 0
	}

	for _, inst := range installs {
		state := inst.Report.State
		status := "OK"
		if state != StatePatched {
			status = "ADS ENABLED"
			healthy = false
		}
		if !o.JSON {
			log.Printf("[%-10s] %s\n", status, inst.Path)
		}
	}

	// Warn about reinstall / self-update risk. The installer checksums only at
	// download time, so neither a self-update nor a manual `bun i -g freebuff`
	// will be detected; both replace the patched binary with a fresh copy.
	if launchers := discoverLaunchers(o.home); len(launchers) > 0 {
		if !o.JSON {
			log.Println("")
			log.Println("npm launcher package(s) present:")
			for _, l := range launchers {
				log.Printf("  %s", l)
			}
			log.Println("  A reinstall or self-update through these will replace the")
			log.Println("  patched binary and restore ads. Re-run 'patch' afterwards.")
		}
	}

	// Explain the settings key so users understand why adsEnabled alone is
	// insufficient.
	for _, inst := range installs {
		if s, ok := readSettings(inst.ConfigDir); ok {
			if _, has := s["adsEnabled"]; has {
				if !o.JSON {
					log.Println("")
					log.Printf("settings.json in %s has an adsEnabled key, but it is", inst.ConfigDir)
					log.Println("inert: the gate short-circuits before reading it. The byte")
					log.Println("patch is what actually disables ads.")
				}
			}
		}
	}

	if o.JSON {
		log.emitJSON(map[string]any{
			"tool":      "freebuff-adstrip",
			"version":   version,
			"healthy":   healthy,
			"launchers": discoverLaunchers(o.home),
			"generated": nowISO(),
		})
	}

	if healthy {
		log.Println("")
		log.Println("Doctor: all installs patched and healthy.")
		return 0
	}
	log.Println("")
	log.Println("Doctor: at least one install has ads enabled. Run 'patch'.")
	return 1
}

// statusExitCode returns 0 when every install is patched, 1 otherwise, so
// status can gate CI.
func statusExitCode(installs []Install) int {
	for _, inst := range installs {
		if inst.Report.State != StatePatched {
			return 1
		}
	}
	return 0
}

// renderInstall pretty-prints one installation for human-readable output.
func renderInstall(log Logger, inst Install) {
	r := inst.Report
	label := map[PatchState]string{
		StatePatched:   "PATCHED",
		StateUnpatched: "ADS ON",
		StateUnknown:   "UNKNOWN",
	}[r.State]

	log.Printf("  [%s] %s", label, inst.Path)
	if inst.Version != "" {
		log.Printf("      version : %s%s", inst.Version, suffixIf(inst.Target, " ("+inst.Target+")"))
	}
	log.Printf("      size    : %s", humanBytes(r.Size))
	log.Printf("      sha256  : %s", shortHash(r.SHA256))
	log.Printf("      found by: %s", inst.Origin)
	if inst.User != "" {
		log.Printf("      owner   : %s", inst.User)
	}
	switch r.State {
	case StatePatched:
		log.Printf("      gate    : returns false at %s", formatSpans(r.Spans))
	case StateUnpatched:
		log.Printf("      gate    : returns true at %s (byte to flip: %d)",
			formatSpans(r.Spans), r.PatchOffset)
	}
	for _, n := range r.Notes {
		log.Printf("      note    : %s", n)
	}
}

// execCommand runs a command and returns trimmed stdout, used for
// `npm root -g`. Failure is non-fatal to the caller.
func execCommand(name string, args ...string) (string, error) {
	out, err := exec.Command(name, args...).Output()
	if err != nil {
		return "", err
	}
	return string(out), nil
}

// sortedKeys is a small helper for deterministic map iteration in JSON-free
// output paths.
func sortedKeys(m map[string]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
