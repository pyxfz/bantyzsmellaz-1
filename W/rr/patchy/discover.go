package main

// discover.go — locating every Freebuff installation on the machine.
//
// # How Freebuff lays itself out
//
// The npm package called "freebuff" is a thin launcher. On first run it
// downloads a platform-specific archive from codebuff.com, verifies its
// SHA-256 against `binaryChecksums` in its own package.json, extracts it, and
// execs the result. From launcher.js:
//
//	const configDir  = configDirOverride || path.join(homeDir, '.config', 'manicode')
//	const binaryName = process.platform === 'win32' ? `${packageName}.exe` : packageName
//	const binaryPath = path.join(configDir, binaryName)
//
// On Linux that resolves to:
//
//	~/.config/manicode/freebuff              <-- the only thing we patch
//	~/.config/manicode/freebuff-metadata.json <-- {"version","target"}
//
// So the binary we care about is a *sibling of the config directory*, named
// exactly `freebuff`, and it may be overridden with FREEBUFF_CONFIG_DIR.
//
// # Why we scan more than one location
//
// A machine can legitimately have several of these at once:
//
//   - the default ~/.config/manicode
//   - a FREEBUFF_CONFIG_DIR override pointing elsewhere
//   - a second Unix account (e.g. a service account or a container sidecar)
//     with its own home directory
//   - an XDG_CONFIG_HOME relocation
//
// Patching only the first one found would leave ads live in the others, which
// is exactly the kind of partial fix that looks successful and is not. This
// file therefore enumerates all plausible locations and reports every one.

import (
	"encoding/json"
	"fmt"
	"os"
	"os/user"
	"path/filepath"
	"sort"
	"strings"
)

// binaryName is the filename the launcher extracts on non-Windows platforms.
// It is derived from the npm package name, which is "freebuff".
const binaryName = "freebuff"

// configDirName is the directory the launcher uses under a home directory.
const configDirName = "manicode"

// metadataName is the sidecar file recording the installed version and target.
const metadataName = "freebuff-metadata.json"

// Install is a discovered Freebuff installation.
type Install struct {
	// Path is the absolute path of the executable to patch.
	Path string `json:"path"`
	// ConfigDir is the containing directory.
	ConfigDir string `json:"configDir"`
	// Origin explains *why* we looked here, which is useful when several
	// candidates exist and the user needs to know which one matters.
	Origin string `json:"origin"`
	// Home is the owning account's home directory, when known.
	Home string `json:"home,omitempty"`
	// User is the owning account name, when resolvable.
	User string `json:"user,omitempty"`
	// Version and Target come from freebuff-metadata.json.
	Version string `json:"version,omitempty"`
	Target  string `json:"target,omitempty"`
	// Report holds the classification of the binary itself.
	Report FileReport `json:"report"`
}

// candidateDir is one place we think a config directory might live.
type candidateDir struct {
	path   string
	origin string
	home   string
	owner  string
}

// candidateDirs enumerates every plausible Freebuff config directory.
//
// The order is meaningful: more-specific, higher-confidence sources come
// first, so that when the same directory is reachable by two routes it is
// reported once with the most informative origin.
func candidateDirs(homeOverride string) []candidateDir {
	seen := map[string]bool{}
	var out []candidateDir

	add := func(dir, origin, home, owner string) {
		if dir == "" {
			return
		}
		dir = filepath.Clean(dir)
		key := dir
		if seen[key] {
			return
		}
		seen[key] = true
		out = append(out, candidateDir{path: dir, origin: origin, home: home, owner: owner})
	}

	// 1. Explicit override, exactly as the launcher reads it.
	if v := strings.TrimSpace(os.Getenv("FREEBUFF_CONFIG_DIR")); v != "" {
		add(v, "FREEBUFF_CONFIG_DIR", "", "")
	}

	// 2. The current user's home directory. Resolved via --home when supplied
	//    so the tool can be exercised against a fixture tree in tests.
	home := homeOverride
	if home == "" {
		if h, err := os.UserHomeDir(); err == nil {
			home = h
		}
	}
	currentUser := ""
	if u, err := user.Current(); err == nil {
		currentUser = u.Username
	}
	if home != "" {
		add(filepath.Join(home, ".config", configDirName), "default home", home, currentUser)

		// 3. XDG relocation, if the user moved their config tree.
		if x := strings.TrimSpace(os.Getenv("XDG_CONFIG_HOME")); x != "" {
			add(filepath.Join(x, configDirName), "XDG_CONFIG_HOME", home, currentUser)
		}
	}

	// 4. Other Unix accounts. These are real installs that would keep serving
	//    ads, and they are easy to forget. Only the standard homes are probed
	//    and the set is small, so this stays cheap.
	for _, h := range otherHomes() {
		if h == home {
			continue
		}
		add(filepath.Join(h, ".config", configDirName), "other account", h, "")
	}

	return out
}

// otherHomes returns the home directories of other accounts on the box,
// derived from the passwd database via the home directory prefix rather than
// by walking the whole filesystem.
func otherHomes() []string {
	var homes []string
	for _, root := range []string{"/home", "/root"} {
		entries, err := os.ReadDir(root)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if !e.IsDir() {
				continue
			}
			// Skip well-known non-user directories.
			switch strings.ToLower(e.Name()) {
			case "vscode", "shared", "node_modules":
				continue
			}
			h := filepath.Join(root, e.Name())
			if st, err := os.Stat(h); err == nil && st.IsDir() {
				homes = append(homes, h)
			}
		}
	}
	// /root is only a home if it looks like one; on many images it is not a
	// login shell home. Keep it, the stat above already validated the dir.
	sort.Strings(homes)
	return homes
}

// discoverInspections finds every Freebuff installation and inspects it.
//
// When paths is non-empty those explicit paths are inspected instead, which
// is how the user targets a binary in an unusual location. Missing explicit
// paths are reported as errors rather than silently skipped.
func discoverInspections(paths []string, homeOverride string, log Logger) ([]Install, error) {
	if len(paths) > 0 {
		var out []Install
		for _, p := range paths {
			abs, err := filepath.Abs(p)
			if err != nil {
				return nil, fmt.Errorf("resolve %q: %w", p, err)
			}
			if _, err := os.Stat(abs); err != nil {
				return nil, fmt.Errorf("%s: %w", abs, err)
			}
			ver, tgt := readMetadata(filepath.Dir(abs))
			rep, err := inspectFile(abs, ver, tgt)
			if err != nil {
				return nil, err
			}
			out = append(out, Install{
				Path:      abs,
				ConfigDir: filepath.Dir(abs),
				Origin:    "explicit --path",
				Version:   ver,
				Target:    tgt,
				Report:    rep,
			})
		}
		return out, nil
	}

	var out []Install
	for _, cd := range candidateDirs(homeOverride) {
		bin := filepath.Join(cd.path, binaryName)
		st, err := os.Stat(bin)
		if err != nil || st.IsDir() {
			// Not an install we can act on. This is the common case and is
			// not an error: most probed directories simply do not exist.
			continue
		}
		ver, tgt := readMetadata(cd.path)
		owner := cd.owner
		if owner == "" {
			owner = lookupOwner(st)
		}
		rep, err := inspectFile(bin, ver, tgt)
		if err != nil {
			log.Warn("inspect %s: %v", bin, err)
			continue
		}
		out = append(out, Install{
			Path:      bin,
			ConfigDir: cd.path,
			Origin:    cd.origin,
			Home:      cd.home,
			User:      owner,
			Version:   ver,
			Target:    tgt,
			Report:    rep,
		})
	}
	return out, nil
}

// readMetadata reads freebuff-metadata.json, returning version and target.
// A missing or malformed sidecar is not an error; it only means the install
// is older than the sidecar was introduced.
func readMetadata(configDir string) (version, target string) {
	raw, err := os.ReadFile(filepath.Join(configDir, metadataName))
	if err != nil {
		return "", ""
	}
	var m struct {
		Version string `json:"version"`
		Target  string `json:"target"`
	}
	if err := json.Unmarshal(raw, &m); err != nil {
		return "", ""
	}
	return m.Version, m.Target
}

// lookupOwner maps a file's uid to an account name, best effort.
func lookupOwner(st os.FileInfo) string {
	type statUID interface{ Sys() any }
	su, ok := st.(statUID)
	if !ok {
		return ""
	}
	type sysT struct{ Uid uint32 }
	if s, ok := su.Sys().(*sysT); ok {
		if u, err := user.LookupId(itoa(s.Uid)); err == nil {
			return u.Username
		}
	}
	return ""
}

// itoa avoids importing strconv for a single use in a best-effort path.
func itoa(v uint32) string {
	if v == 0 {
		return "0"
	}
	var buf [10]byte
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	return string(buf[i:])
}

// discoverLaunchers finds the npm launcher packages, which matter because a
// reinstall or self-update through them will replace the patched binary.
//
// These are not patched; they are reported by `doctor` as a persistence risk.
func discoverLaunchers(homeOverride string) []string {
	var roots []string
	if homeOverride != "" {
		roots = append(roots, filepath.Join(homeOverride, ".bun", "install", "global", "node_modules"))
	} else if h, err := os.UserHomeDir(); err == nil {
		roots = append(roots, filepath.Join(h, ".bun", "install", "global", "node_modules"))
	}
	// A global npm root is a common alternative install path.
	if out, err := execCommand("npm", "root", "-g"); err == nil {
		if s := strings.TrimSpace(out); s != "" {
			roots = append(roots, s)
		}
	}
	seen := map[string]bool{}
	var found []string
	for _, r := range roots {
		pkg := filepath.Join(r, "freebuff")
		if seen[pkg] {
			continue
		}
		seen[pkg] = true
		if st, err := os.Stat(pkg); err == nil && st.IsDir() {
			found = append(found, pkg)
		}
	}
	return found
}

// settingsPath returns the Freebuff settings file for a config directory.
func settingsPath(configDir string) string {
	return filepath.Join(configDir, "settings.json")
}

// readSettings loads settings.json as a generic map so we can inspect
// `adsEnabled` without depending on its full schema.
func readSettings(configDir string) (map[string]any, bool) {
	raw, err := os.ReadFile(settingsPath(configDir))
	if err != nil {
		return nil, false
	}
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil, false
	}
	return m, true
}
