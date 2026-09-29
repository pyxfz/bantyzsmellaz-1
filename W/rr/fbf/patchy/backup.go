package main

// backup.go — creating, pruning, and restoring backups of the Freebuff binary.
//
// A patch that cannot be undone is a patch nobody should run. Every write in
// this tool is preceded by a backup, and the backup is verified by hash before
// the write is allowed to proceed. Backups are named with a UTC timestamp and
// the pre-patch hash prefix, which makes both identity and ordering obvious
// from a directory listing alone:
//
//	freebuff.adstrip-backup.20260929T141302Z.841f0a76fd4c.bak
//	          └ timestamp (UTC)      └ first 10 hex of the original sha256
//
// The trailing `bak` extension and the `adstrip` infix ensure the tool's own
// files are never mistaken for a live binary by the launcher, and the newest
// backups are pruned to a configurable retention count so repeated runs do not
// accumulate 136 MB copies indefinitely.

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

// backupPrefix and backupSuffix bracket the timestamp+hash portion of a backup
// filename. They are also the glob used to enumerate existing backups.
const (
	backupPrefix = "freebuff.adstrip-backup."
	backupSuffix = ".bak"
)

// backupFor returns the backup path for a target binary and a given original
// hash, using a UTC timestamp so names sort chronologically.
func backupFor(target, originalSHA string, when time.Time) string {
	short := originalSHA
	if len(short) > 10 {
		short = short[:10]
	}
	name := fmt.Sprintf("%s%s.%s%s",
		backupPrefix,
		when.UTC().Format("20060102T150405Z"),
		short,
		backupSuffix)
	return filepath.Join(filepath.Dir(target), name)
}

// makeBackup copies target to a timestamped backup next to it and verifies
// the copy hashes identically to the original before returning.
//
// The verification is not ceremonial: it catches a truncated copy on a full
// disk, which would otherwise leave the user with a backup they cannot roll
// back to and no way to know until they needed it.
func makeBackup(target string, keep int, log Logger) (string, error) {
	sum, _, _, err := scanFile(target) // hash-only pass, no matchers
	if err != nil {
		return "", fmt.Errorf("hash original: %w", err)
	}

	dst := backupFor(target, sum, time.Now())
	if err := copyFile(target, dst); err != nil {
		return "", fmt.Errorf("create backup: %w", err)
	}

	// Verify the backup before the caller proceeds to modify the original.
	bSum, _, _, err := scanFile(dst)
	if err != nil {
		return "", fmt.Errorf("hash backup: %w", err)
	}
	if bSum != sum {
		os.Remove(dst)
		return "", fmt.Errorf("backup verification failed: original %s, copy %s", sum, bSum)
	}

	if st, err := os.Stat(dst); err == nil {
		if err := os.Chmod(dst, st.Mode().Perm()); err != nil {
			log.Warn("could not set mode on backup: %v", err)
		}
	}

	pruneBackups(filepath.Dir(target), keep, dst, log)
	return dst, nil
}

// copyFile copies src to dst preserving the source's permission bits. It does
// not attempt to preserve ownership or timestamps; a user-owned backup is
// sufficient for rollback and avoids requiring elevated privileges.
func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	st, err := in.Stat()
	if err != nil {
		return err
	}

	// Create with the source's mode so the copy is immediately executable and
	// usable as a drop-in replacement.
	out, err := os.OpenFile(dst, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, st.Mode().Perm())
	if err != nil {
		return err
	}

	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	if err := out.Sync(); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

// listBackups returns the backup files in a directory, oldest first.
func listBackups(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}
	var out []string
	for _, e := range entries {
		name := e.Name()
		if e.IsDir() {
			continue
		}
		if strings.HasPrefix(name, backupPrefix) && strings.HasSuffix(name, backupSuffix) {
			out = append(out, filepath.Join(dir, name))
		}
	}
	// The timestamp in the name is fixed-width and UTC, so lexical order is
	// chronological order. Sorting by name avoids depending on mtime, which
	// changes when a backup is copied or restored.
	sort.Strings(out)
	return out, nil
}

// newestBackup returns the most recent backup in a directory, or "".
func newestBackup(dir string) string {
	list, err := listBackups(dir)
	if err != nil || len(list) == 0 {
		return ""
	}
	return list[len(list)-1]
}

// pruneBackups keeps the newest `keep` backups and deletes the rest. The
// backup just created is always retained, even if keep is 0, so pruning can
// never destroy the only rollback point for the operation in flight.
func pruneBackups(dir string, keep int, protected string, log Logger) {
	if keep < 1 {
		keep = 1
	}
	list, err := listBackups(dir)
	if err != nil {
		return
	}
	excess := len(list) - keep
	for i := 0; i < excess; i++ {
		p := list[i]
		if p == protected {
			continue
		}
		if err := os.Remove(p); err != nil {
			log.Warn("prune %s: %v", filepath.Base(p), err)
		} else {
			log.Debug("pruned old backup %s", filepath.Base(p))
		}
	}
}

// sha256File is a small helper for reporting a file's digest in output.
func sha256File(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
