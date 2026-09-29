package main

// options.go — command-line flags, the terminal logger, and small formatting
// helpers shared across the tool.

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"os"
	"strings"
	"time"
	"unicode/utf8"
)

// stringSlice is a flag.Value that accumulates repeated --path arguments, so
// the user can target several explicit binaries in one invocation.
type stringSlice []string

func (s *stringSlice) String() string { return strings.Join(*s, ",") }

func (s *stringSlice) Set(v string) error {
	*s = append(*s, v)
	return nil
}

// options holds every parsed flag.
type options struct {
	// paths, when non-empty, restricts operation to these explicit binaries
	// instead of auto-discovering installs.
	paths stringSlice
	// backup names a specific backup for rollback; empty means newest.
	backup string
	// home overrides the home directory used for discovery (useful in tests
	// against a fixture tree).
	home string
	// DryRun reports what would change without writing.
	DryRun bool
	// JSON emits machine-readable output instead of human text.
	JSON bool
	// Verbose enables debug-level logging.
	Verbose bool
	// Quiet suppresses non-error output.
	Quiet bool
	// KeepBackups is how many backups to retain per install directory.
	KeepBackups int
	// Strict refuses to act on a match that came only from the heuristic
	// rung of the ladder, so a user who wants certainty declines to patch on
	// an association rather than a structural identification.
	Strict bool
}

// parseFlags builds and runs the flag set for the given arguments.
func parseFlags(args []string) (*options, error) {
	o := &options{}
	fs := flag.NewFlagSet("freebuff-adstrip", flag.ContinueOnError)
	fs.Var(&o.paths, "path", "operate on this specific binary (repeatable)")
	fs.StringVar(&o.backup, "backup", "", "backup file to roll back from (default: newest)")
	fs.StringVar(&o.home, "home", "", "override home directory for discovery")
	fs.BoolVar(&o.DryRun, "dry-run", false, "report actions without writing")
	fs.BoolVar(&o.DryRun, "n", false, "alias for --dry-run")
	fs.BoolVar(&o.JSON, "json", false, "emit JSON instead of text")
	fs.BoolVar(&o.Verbose, "verbose", false, "enable debug logging")
	fs.BoolVar(&o.Verbose, "v", false, "alias for --verbose")
	fs.BoolVar(&o.Quiet, "quiet", false, "suppress non-error output")
	fs.IntVar(&o.KeepBackups, "keep", 5, "backups to retain per directory")
	fs.BoolVar(&o.Strict, "strict", false,
		"refuse heuristic matches; only act on structurally certain ones")
	// Silence the flag package's own usage dump; printUsage is custom.
	fs.SetOutput(io.Discard)
	if err := fs.Parse(args); err != nil {
		return nil, err
	}
	return o, nil
}

// Logger is the minimal output surface the rest of the tool programs against.
// Keeping it an interface lets the JSON mode route Printf output away and
// emit a single structured document instead.
type Logger interface {
	Printf(format string, args ...any)
	Println(args ...any)
	Infof(format string, args ...any)
	Warn(format string, args ...any)
	Errorf(format string, args ...any)
	Debug(format string, args ...any)
	emitJSON(v any)
}

// terminalLogger writes human-readable output to stdout/stderr.
type terminalLogger struct {
	verbose bool
	quiet   bool
	json    bool
}

func newLogger(verbose, quiet, asJSON bool) Logger {
	return &terminalLogger{verbose: verbose, quiet: quiet, json: asJSON}
}

// Printf writes to stdout unless quiet mode is on. In JSON mode the human
// stream is suppressed so stdout carries only the JSON document.
func (l *terminalLogger) Printf(format string, args ...any) {
	if l.quiet || l.json {
		return
	}
	fmt.Fprintf(os.Stdout, format+"\n", args...)
}

func (l *terminalLogger) Println(args ...any) {
	if l.quiet || l.json {
		return
	}
	fmt.Fprintln(os.Stdout, args...)
}

func (l *terminalLogger) Infof(format string, args ...any) {
	if l.quiet || l.json {
		return
	}
	fmt.Fprintf(os.Stdout, format+"\n", args...)
}

// Warn and Errorf always go to stderr so they survive stdout redirection and
// remain visible in JSON mode.
func (l *terminalLogger) Warn(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "warning: "+format+"\n", args...)
}

func (l *terminalLogger) Errorf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, "error: "+format+"\n", args...)
}

func (l *terminalLogger) Debug(format string, args ...any) {
	if !l.verbose {
		return
	}
	fmt.Fprintf(os.Stderr, "debug: "+format+"\n", args...)
}

// emitJSON writes a single pretty-printed JSON document to stdout.
func (l *terminalLogger) emitJSON(v any) {
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(v)
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

// humanBytes renders a byte count with a binary unit suffix.
func humanBytes(n int64) string {
	const unit = 1024
	if n < unit {
		return fmt.Sprintf("%d B", n)
	}
	div, exp := int64(unit), 0
	for m := n / unit; m >= unit; m /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %ciB", float64(n)/float64(div), "KMGTPE"[exp])
}

// shortHash trims a hex digest to 10 characters for display, matching the
// length used in backup filenames.
func shortHash(h string) string {
	if len(h) > 10 {
		return h[:10]
	}
	return h
}

// formatSpans renders a list of gate byte ranges compactly, e.g. "99,214,653"
// or "1, 2, 3" when there are several.
func formatSpans(spans []span) string {
	if len(spans) == 0 {
		return "(none)"
	}
	parts := make([]string, len(spans))
	for i, s := range spans {
		parts[i] = fmt.Sprintf("%d", s.Start)
	}
	return strings.Join(parts, ", ")
}

// nowISO returns the current UTC time in RFC3339, used in JSON documents.
func nowISO() string { return time.Now().UTC().Format(time.RFC3339) }

// suffixIf appends a suffix to s when cond is non-empty.
func suffixIf(cond, suffix string) string {
	if cond == "" {
		return ""
	}
	return suffix
}

// runeLen is a small guard for width calculations; kept for completeness of
// the formatting layer and used by any future display work.
func runeLen(s string) int { return utf8.RuneCountInString(s) }
