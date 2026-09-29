package main

// usage.go — the help text, kept in its own file so the usage block reads as
// documentation rather than as control flow inside main().

import "fmt"

// printUsage writes the top-level help. Subcommand-specific help is not
// provided; the commands are few and the flags are shared, so a single
// reference page is clearer than several.
func printUsage() {
	fmt.Print(`freebuff-adstrip — remove sponsored text ads from the Freebuff CLI

USAGE
  freebuff-adstrip [command] [flags]

COMMANDS
  status       Report installed Freebuff binaries and their patch state.
               This is the default command.
  patch        Back up each binary and rewrite its ad gate so ads are off.
  rollback     Restore a binary from a backup (newest, or --backup).
  doctor       Report whether the patch is still in place and flag risks.
  version      Print the tool version.
  help         Show this message.

FLAGS
  --path <p>       Operate on a specific binary instead of auto-discovery.
                   May be repeated to target several binaries.
  --backup <f>     Backup file to roll back from. Default: the newest one.
  --home <d>       Override the home directory used for discovery.
  -n, --dry-run    Report what would change without writing anything.
  --keep <N>       Backups to retain per directory (default 5).
  --json           Emit a single JSON document instead of text.
  -v, --verbose    Enable debug logging on stderr.
      --quiet      Suppress non-error output.

EXIT CODES
  0  Success, or status found every install patched.
  1  A patch/rollback failed, or status found an unpatched install, or
     doctor found a problem.
  2  Usage error.

EXAMPLES
  # See what is installed and whether ads are currently enabled.
  freebuff-adstrip

  # Preview the change without writing.
  freebuff-adstrip patch --dry-run

  # Remove ads everywhere, keeping five backups per install.
  freebuff-adstrip patch --keep 5

  # Patch a binary in a non-standard location.
  freebuff-adstrip patch --path /opt/freebuff/freebuff

  # Check that the patch is still in place (good for cron/CI).
  freebuff-adstrip doctor && echo "still patched"

  # Undo, restoring the most recent backup.
  freebuff-adstrip rollback

NOTES
  The edit rewrites a single byte in place, so file size and all internal
  offsets are preserved. Backups are hash-verified before any write. The
  installer checksums only at download time, so a self-update or reinstall
  will restore the ads; re-run 'patch' after any upgrade.
`)
}
