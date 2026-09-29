package main

// patch.go — the core of the tool: locating the ad gate inside a 136 MB
// self-extracting executable, rewriting one byte, and proving the result is
// correct.
//
// # Why a byte patch and not a config change
//
// Freebuff ships an `adsEnabled` boolean in its settings file and even
// registers an `/ads:disable` slash command. Both are dead code. The gate
// looks like this in the shipped bundle:
//
//	OP = () => { if (RA) return !0; return Jv().adsEnabled ?? !1 }
//
// `RA` is a "is this the Freebuff build" flag computed as
// `Z$().FREEBUFF_MODE === "true"`. The binary's own environment shim `Z$()`
// hard-codes `FREEBUFF_MODE:"true"` as a *string literal* — it does not read
// `process.env.FREEBUFF_MODE` — so `RA` is a compile-time constant `true` and
// the settings lookup on the second line can never execute. Flipping the
// literal `!0` to `!1` short-circuits the gate to a constant `false`, which
// disables every ad surface at once.
//
// # Why this is a safe edit
//
// The Freebuff binary is a Bun single-file executable. Bun appends the bundled
// JavaScript to the ELF in *plaintext* (not compressed), which is why the
// minified source can be grepped with `grep -aob` and read with `dd`. Editing
// bytes inside a plaintext payload is therefore safe provided the edit is the
// same length as the original, so that no offset in the file shifts. `!0` and
// `!1` are both two bytes, so the rewrite is length-preserving by construction.
//
// The installer verifies a SHA-256 of the *downloaded tarball* against
// `package.json#binaryChecksums` at download time only. It does not re-verify
// the extracted binary on subsequent runs, so a post-install edit is not
// detected or reverted. See THEORY.md for the full write-up.

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"regexp"
	"sort"
	"strconv"
	"time"
)

// ---------------------------------------------------------------------------
// Anchors — structure-based, not symbol-based
// ---------------------------------------------------------------------------
//
// # Why this section is a regular expression
//
// The obvious anchor is the literal `OP=()=>{if(RA)return!0;`, but that is
// wrong in a way that only shows up on the next release. The gate's three
// identifiers (`OP`, `RA`, `Jv` in 0.1.0) are *minifier-generated* and are
// re-derived on every build. Observed on this host:
//
//	0.1.0   OP=()=>{if(RA)return!0;return Jv().adsEnabled??!1}
//	0.1.6   wP=()=>{if(GA)return!0;return Tv().adsEnabled??!1}
//
// Same gate, same behaviour, entirely different bytes. A tool that hard-codes
// the 0.1.0 literals silently stops working the day the CLI self-updates —
// which it does automatically, and which happened here before this tool was
// even finished.
//
// So the anchor matches the gate's *shape* instead. The three parts that are
// stable across builds are:
//
//	1. it is a zero-argument arrow assigned to an identifier
//	2. it short-circuits a build-flag test to `true`
//	3. the fallback path reads the persisted `adsEnabled` setting
//
// The minifier can rename every identifier freely and the pattern still
// matches, because `[A-Za-z0-9_$]+` accepts any minified name. What cannot
// change without changing the product's behaviour is the presence of
// `return!0;return X().adsEnabled??!1` itself, since that sequence *is* the
// bug being fixed.

// gateUnpatchedRe matches the ad gate in its vulnerable, pre-patch form.
// Capture group 1 is the gate function's name, group 2 is the build flag.
var gateUnpatchedRe = regexp.MustCompile(
	`([A-Za-z0-9_$]+)=\(\)=>\{if\(([A-Za-z0-9_$]+)\)return!0;return [A-Za-z0-9_$]+\(\)\.adsEnabled\?\?!1\}`)

// gatePatchedRe is the same gate after this tool has rewritten it.
var gatePatchedRe = regexp.MustCompile(
	`([A-Za-z0-9_$]+)=\(\)=>\{if\(([A-Za-z0-9_$]+)\)return!1;return [A-Za-z0-9_$]+\(\)\.adsEnabled\?\?!1\}`)

// rewriteFrom and rewriteTo are the length-preserving replacement applied
// inside the gate. Both are three bytes; the middle byte is the boolean
// literal (`0` for `true`, `1` for `false` in minified JS).
var (
	rewriteFrom = []byte(`!0;`)
	rewriteTo   = []byte(`!1;`)
)

// rewriteOffsetInGate returns the index, *within the actual matched gate text*,
// of the single byte that must be rewritten.
//
// # Why the offset must be derived from the real match
//
// An earlier version of this tool computed the offset from a fixed sample
// string (`X=()=>{if(Y)return!0;...`) and added it to the match's absolute
// position. That is wrong, and it corrupted a real binary during development:
//
//	sample prefix:  X=()=>{if(Y)      -> 11 bytes before `return`
//	real   prefix:  wP=()=>{if(GA)    -> 14 bytes before `return`
//
// The minifier's identifier lengths differ between builds, so a fixed relative
// offset lands 3 bytes early — writing `1` over the `n` of `return` and
// producing `retur1!0;`, a syntax error that would stop the CLI booting.
//
// The fix is to search for the `!0;` literal inside the text that was actually
// matched. That is correct for any identifier length, on any build.
func rewriteOffsetInGate(matched []byte) (int, error) {
	if len(rewriteFrom) != len(rewriteTo) {
		// A length change would shift every byte after the edit and corrupt
		// the embedded module graph. Refuse rather than risk it.
		return 0, fmt.Errorf("internal: rewrite %q/%q are not the same length", rewriteFrom, rewriteTo)
	}
	idx := bytes.Index(matched, rewriteFrom)
	if idx < 0 {
		return 0, fmt.Errorf("internal: matched gate %q does not contain %q", matched, rewriteFrom)
	}
	// `rewriteFrom` is "!0;" so the digit sits one byte past its start.
	return idx + 1, nil
}

// ---------------------------------------------------------------------------
// State model
// ---------------------------------------------------------------------------

// PatchState describes what a candidate file looks like relative to the gate.
type PatchState string

const (
	// StatePatched means the gate already returns false. Nothing to do.
	StatePatched PatchState = "patched"
	// StateUnpatched means the gate returns true and can be rewritten.
	StateUnpatched PatchState = "unpatched"
	// StateUnknown means the file is not a recognisable Freebuff build: the
	// gate signature is absent, so the tool will not touch it.
	StateUnknown PatchState = "unknown"
)

// FileReport is the result of inspecting one candidate file. It doubles as the
// JSON payload shape for --json.
type FileReport struct {
	Path    string     `json:"path"`
	Size    int64      `json:"size"`
	Mode    string     `json:"mode"`
	ModTime time.Time  `json:"modTime"`
	SHA256  string     `json:"sha256"`
	State   PatchState `json:"state"`
	// Spans are the exact byte ranges of the ad gate as found in the file.
	// The patch offset is derived from the matched text rather than from a
	// fixed distance, because minified identifier lengths vary per build.
	Spans []span `json:"gateSites,omitempty"`
	// PatchOffset is the absolute file offset of the byte that carries the
	// gate's boolean literal. Populated only when the file is unpatched.
	PatchOffset int64 `json:"patchOffset,omitempty"`
	// Version and Target come from the sibling freebuff-metadata.json and are
	// purely informational.
	Version string `json:"version,omitempty"`
	Target  string `json:"target,omitempty"`
	// Notes carries human-readable remarks such as a version skew warning.
	Notes []string `json:"notes,omitempty"`
	// Verified is set after a successful post-patch re-scan.
	Verified bool `json:"verified,omitempty"`
}

// ---------------------------------------------------------------------------
// Single-pass scanner
// ---------------------------------------------------------------------------

// scanChunk is the read granularity for the streaming scan. Freebuff's binary
// is ~130 MB, so streaming in 8 MiB chunks keeps peak memory flat regardless
// of how large the file is, while still amortising syscalls.
const scanChunk = 8 << 20

// span is a half-open byte range [Start, End) within a scanned file.
//
// The scanner reports spans rather than bare start offsets because the patch
// offset must be computed from the *matched text*, not from a fixed distance
// from the match start. See rewriteOffsetInGate for why that distinction
// matters.
//
// The JSON tags keep the emitted field names lower-case so `--json` output is
// idiomatic and consistent with the rest of the document.
type span struct {
	Start int64 `json:"start"`
	End   int64 `json:"end"`
}

// matcher is the interface the streaming scanner programmes against. It lets
// the same single-pass machinery serve both the SHA-256 computation and the
// pattern search, and keeps the search strategy swappable (literal vs regexp)
// without duplicating the chunking logic.
type matcher interface {
	// name identifies the matcher in the results map.
	name() string
	// find returns the span of every match within buf, relative to the start
	// of buf.
	find(buf []byte) []span
	// maxLen is an upper bound on match length, used to size the carry-over
	// window between chunks. Over-estimating is safe; under-estimating would
	// miss boundary-straddling matches.
	maxLen() int
}

// literalMatcher finds fixed byte sequences.
type literalMatcher struct {
	label  string
	needle []byte
}

func (m literalMatcher) name() string { return m.label }
func (m literalMatcher) maxLen() int  { return len(m.needle) }

func (m literalMatcher) find(b []byte) []span {
	var out []span
	for off := 0; off+len(m.needle) <= len(b); {
		i := bytes.Index(b[off:], m.needle)
		if i < 0 {
			break
		}
		start := off + i
		out = append(out, span{Start: int64(start), End: int64(start + len(m.needle))})
		off += i + 1
	}
	return out
}

// regexpMatcher finds regular-expression matches. Go's regexp package is
// leftmost-first and non-overlapping, which is exactly the semantics wanted.
//
// A raw regexp scan across a 130 MB bundle is far too slow (measured at ~19 s
// for a single pass on this host), because the engine walks the whole input
// character by character. Every matcher therefore carries a *prefilter*: a
// rare fixed substring that must appear inside any real match. The scanner's
// fast bytes.Index pass locates prefilter occurrences, and the regexp is then
// evaluated only in the small window around each one.
// `.adsEnabled??!1}` occurs a handful of times in the bundle rather than
// thousands, which turns a full regexp walk into a handful of evaluations.
type regexpMatcher struct {
	label string
	re    *regexp.Regexp
	// prefilter is a literal that every match must contain.
	prefilter []byte
	// back is how far before a prefilter hit the regexp is evaluated.
	back int
	// forward is how far past a prefilter hit the regexp is evaluated.
	forward int
}

func (m regexpMatcher) name() string { return m.label }
func (m regexpMatcher) maxLen() int  { return 512 } // generous bound

// find evaluates the regexp only near prefilter hits, returning match spans
// relative to the start of b. Overlapping evaluation windows are de-duplicated
// by start offset so a hit seen through two windows is reported once.
func (m regexpMatcher) find(b []byte) []span {
	if len(m.prefilter) == 0 {
		return nil
	}
	var out []span
	seen := map[int64]bool{}
	for off := 0; off+len(m.prefilter) <= len(b); {
		i := bytes.Index(b[off:], m.prefilter)
		if i < 0 {
			break
		}
		hit := off + i
		lo := hit - m.back
		if lo < 0 {
			lo = 0
		}
		hi := hit + m.forward
		if hi > len(b) {
			hi = len(b)
		}
		for _, loc := range m.re.FindAllIndex(b[lo:hi], -1) {
			start := int64(lo + loc[0])
			if !seen[start] {
				seen[start] = true
				out = append(out, span{Start: start, End: int64(lo + loc[1])})
			}
		}
		// Resume past this prefilter occurrence. A gate can only contain one
		// `.adsEnabled??!1}` (it is the last element of the match), so there is
		// no need to rescan overlapping regions for the same gate.
		off = hit + len(m.prefilter)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Start < out[j].Start })
	return out
}

// gateMatchers returns the standard matcher set for classifying a binary.
//
// `prefilter` is `.adsEnabled??!1}`, the tail common to both gate variants.
// The back/forward window is sized to comfortably contain the longest gate
// form observed (the 0.1.x shape is ~50 bytes) with generous headroom.
func gateMatchers() []matcher {
	const (
		prefilter = `.adsEnabled??!1}`
		back      = 200
		forward   = 64
	)
	return []matcher{
		regexpMatcher{
			label: "gate-unpatched", re: gateUnpatchedRe,
			prefilter: []byte(prefilter), back: back, forward: forward,
		},
		regexpMatcher{
			label: "gate-patched", re: gatePatchedRe,
			prefilter: []byte(prefilter), back: back, forward: forward,
		},
	}
}

// scanFile streams a file exactly once and simultaneously computes its SHA-256
// and locates every occurrence of the supplied patterns.
//
// A single pass matters here: hashing 130 MB and searching it separately would
// read the file twice. The carry window between chunks is sized to the largest
// matcher's bound so a pattern straddling a chunk boundary is still found, and
// boundary matches are de-duplicated by only reporting matches that start at
// or after the current chunk's own base offset.
func scanFile(path string, ms ...matcher) (shaHex string, hits map[string][]span, size int64, err error) {
	f, err := os.Open(path)
	if err != nil {
		return "", nil, 0, err
	}
	defer f.Close()

	st, err := f.Stat()
	if err != nil {
		return "", nil, 0, err
	}
	if st.IsDir() {
		return "", nil, 0, fmt.Errorf("%s is a directory", path)
	}
	size = st.Size()

	maxLen := 0
	for _, m := range ms {
		if m.maxLen() > maxLen {
			maxLen = m.maxLen()
		}
	}
	// Carry over enough of the previous chunk to catch boundary-straddling
	// matches. One byte beyond the longest match is enough to hold a match
	// that starts on the final byte of the carry.
	overlap := maxLen + 1

	h := sha256.New()
	hits = make(map[string][]span, len(ms))
	// reported tracks absolute match starts already recorded, so the
	// overlapping carry window between chunks cannot produce duplicates.
	reported := make(map[string]bool)

	buf := make([]byte, scanChunk)
	carry := make([]byte, 0, overlap)
	carryBase := int64(0) // file offset of carry[0]
	var base int64        // file offset of buf[0]

	for {
		n, readErr := f.ReadAt(buf, base)
		if n > 0 {
			h.Write(buf[:n])

			// Prepend the previous chunk's tail so a pattern spanning the
			// boundary is contiguous in memory.
			window := make([]byte, 0, len(carry)+n)
			window = append(window, carry...)
			window = append(window, buf[:n]...)

			for _, m := range ms {
				for _, sp := range m.find(window) {
					abs := span{Start: carryBase + sp.Start, End: carryBase + sp.End}
					// De-duplicate by absolute position rather than by
					// comparing against the current chunk's base offset.
					//
					// The obvious-looking test `abs.Start >= base` is
					// wrong: it discards a match that legitimately
					// *begins* in the carry region and extends into the
					// new chunk, which is exactly the chunk-boundary case
					// the carry exists to handle. Such a match was never
					// reported, because the previous iteration's window
					// ended before it was complete.
					if reported[m.name()+"\x00"+strconv.FormatInt(abs.Start, 10)] {
						continue
					}
					reported[m.name()+"\x00"+strconv.FormatInt(abs.Start, 10)] = true
					hits[m.name()] = append(hits[m.name()], abs)
				}
			}

			// Retain the tail for the next iteration.
			keep := overlap
			if keep > len(window) {
				keep = len(window)
			}
			carry = append(carry[:0], window[len(window)-keep:]...)
			carryBase += int64(len(window) - keep)

			base += int64(n)
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return "", nil, 0, readErr
		}
		if base >= size {
			break
		}
	}

	return hex.EncodeToString(h.Sum(nil)), hits, size, nil
}

// inspectFile builds a FileReport for one candidate path. It performs no
// writes; it only classifies.
func inspectFile(path, version, target string) (FileReport, error) {
	st, err := os.Stat(path)
	if err != nil {
		return FileReport{Path: path}, err
	}

	rep := FileReport{
		Path:    path,
		Size:    st.Size(),
		Mode:    st.Mode().String(),
		ModTime: st.ModTime(),
		Version: version,
		Target:  target,
	}

	// Cheap size sanity check first. A genuine Freebuff binary is ~136 MB; a
	// few-KB file cannot contain the gate and scanning it would be noise.
	if st.Size() < minPlausibleBinarySize {
		rep.State = StateUnknown
		rep.Notes = append(rep.Notes, fmt.Sprintf(
			"file is only %d bytes; too small to be a Freebuff binary", st.Size()))
		return rep, nil
	}

	sum, hits, _, err := scanFile(path, gateMatchers()...)
	if err != nil {
		return rep, err
	}
	rep.SHA256 = sum

	unpatched := hits["gate-unpatched"]
	patched := hits["gate-patched"]

	switch {
	case len(unpatched) > 0:
		rep.State = StateUnpatched
		rep.Spans = unpatched
		// Derive the rewrite offset from the bytes actually matched rather
		// than from a fixed distance, because the minifier's identifier
		// lengths vary between builds.
		first, err := readSpan(path, unpatched[0])
		if err != nil {
			return rep, err
		}
		rel, err := rewriteOffsetInGate(first)
		if err != nil {
			return rep, err
		}
		rep.PatchOffset = unpatched[0].Start + int64(rel)
		if len(unpatched) > 1 {
			// Should not happen in a shipped build, but if it did, patching
			// only the first site would leave a live gate behind.
			rep.Notes = append(rep.Notes, fmt.Sprintf(
				"warning: %d gate sites found; all will be patched", len(unpatched)))
		}
		if len(patched) > 0 {
			rep.Notes = append(rep.Notes, fmt.Sprintf(
				"note: build contains both patched (%d) and unpatched (%d) gate sites",
				len(patched), len(unpatched)))
		}
	case len(patched) > 0:
		rep.State = StatePatched
		rep.Spans = patched
		rep.Verified = true
	default:
		rep.State = StateUnknown
		rep.Notes = append(rep.Notes,
			"ad-gate signature not found; the build may have restructured its ad logic. File left untouched.")
	}

	return rep, nil
}

// readSpan reads the exact bytes a scan matched, so callers can reason about
// the real text rather than a reconstruction of it.
func readSpan(path string, sp span) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	n := sp.End - sp.Start
	if n <= 0 || n > 4096 {
		return nil, fmt.Errorf("implausible span length %d", n)
	}
	buf := make([]byte, n)
	if _, err := f.ReadAt(buf, sp.Start); err != nil && err != io.EOF {
		return nil, err
	}
	return buf, nil
}

// minPlausibleBinarySize guards against scanning obviously wrong files. The
// smallest real Freebuff build is well over 100 MB; 5 MB is a wide margin.
const minPlausibleBinarySize = 5 << 20

// ---------------------------------------------------------------------------
// The patch operation
// ---------------------------------------------------------------------------

// PatchResult records exactly what a patch run did, for reporting and for the
// --json payload.
type PatchResult struct {
	Path        string `json:"path"`
	Applied     bool   `json:"applied"`
	AlreadyDone bool   `json:"alreadyPatched"`
	Skipped     bool   `json:"skipped"`
	// WouldApply is set during a dry run to record what a real run would do,
	// so the summary can report a would-be count instead of "nothing to do".
	WouldApply  bool     `json:"wouldApply,omitempty"`
	Reason      string   `json:"reason,omitempty"`
	Changed     []int64  `json:"changedOffsets,omitempty"`
	BytesBefore string   `json:"sha256Before,omitempty"`
	BytesAfter  string   `json:"sha256After,omitempty"`
	SizeBefore  int64    `json:"sizeBefore"`
	SizeAfter   int64    `json:"sizeAfter"`
	BackupPath  string   `json:"backup,omitempty"`
	Notes       []string `json:"notes,omitempty"`
	Duration    string   `json:"duration,omitempty"`
}

// applyPatch rewrites the ad gate in the file at path.
//
// Safety properties, in order of execution:
//
//  1. Re-inspect immediately before writing, so a file that changed underneath
//     us (e.g. a self-update landing mid-run) is not clobbered blindly.
//  2. Back up first, and verify the backup hashes identically to the original.
//  3. Record the pre-patch size and hash.
//  4. Write exactly one byte per gate site, in place, via WriteAt — no
//     truncation, no rewrite, no temp file, so the inode, mode, and every
//     other offset are preserved.
//  5. fsync so the change survives a crash.
//  6. Re-scan and assert: the size is unchanged, the gate now reads `patched`,
//     and the previously-unpatched anchor is gone.
func applyPatch(path string, dryRun bool, keepBackups int, log Logger) (PatchResult, error) {
	start := time.Now()
	res := PatchResult{Path: path}

	rep, err := inspectFile(path, "", "")
	if err != nil {
		return res, err
	}
	res.SizeBefore = rep.Size
	res.BytesBefore = rep.SHA256

	switch rep.State {
	case StatePatched:
		res.AlreadyDone = true
		res.SizeAfter = rep.Size
		res.BytesAfter = rep.SHA256
		res.Duration = time.Since(start).String()
		return res, nil
	case StateUnknown:
		res.Skipped = true
		res.Reason = "ad-gate signature not found; file left untouched"
		res.Notes = rep.Notes
		res.Duration = time.Since(start).String()
		return res, nil
	}

	// Compute one rewrite offset per gate site, each derived from that site's
	// own matched bytes.
	targets := make([]int64, 0, len(rep.Spans))
	for _, sp := range rep.Spans {
		matched, rerr := readSpan(path, sp)
		if rerr != nil {
			return res, rerr
		}
		rel, rerr := rewriteOffsetInGate(matched)
		if rerr != nil {
			return res, rerr
		}
		targets = append(targets, sp.Start+int64(rel))
	}
	res.Changed = targets

	if dryRun {
		res.WouldApply = true
		res.Skipped = true
		res.Reason = "dry run: no bytes were written"
		res.SizeAfter = rep.Size
		res.Duration = time.Since(start).String()
		return res, nil
	}

	// --- backup ------------------------------------------------------------
	backupPath, err := makeBackup(path, keepBackups, log)
	if err != nil {
		return res, err
	}
	res.BackupPath = backupPath

	// --- write -------------------------------------------------------------
	f, err := os.OpenFile(path, os.O_RDWR, 0)
	if err != nil {
		return res, fmt.Errorf("open for write: %w", err)
	}
	payload := rewriteTo[1:2] // the single digit byte, '1'
	for _, off := range targets {
		if _, err := f.WriteAt(payload, off); err != nil {
			f.Close()
			return res, fmt.Errorf("write at %d: %w", off, err)
		}
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return res, fmt.Errorf("fsync: %w", err)
	}
	if err := f.Close(); err != nil {
		return res, fmt.Errorf("close: %w", err)
	}

	// --- verify ------------------------------------------------------------
	after, err := inspectFile(path, "", "")
	if err != nil {
		return res, err
	}
	res.SizeAfter = after.Size
	res.BytesAfter = after.SHA256
	res.Notes = append(res.Notes, rep.Notes...)

	if after.Size != res.SizeBefore {
		return res, fmt.Errorf("verification failed: size changed %d -> %d",
			res.SizeBefore, after.Size)
	}
	if after.State != StatePatched {
		return res, fmt.Errorf("verification failed: gate still reads %q", after.State)
	}
	if len(after.Spans) != len(targets) {
		return res, fmt.Errorf("verification failed: expected %d patched gate sites, found %d",
			len(targets), len(after.Spans))
	}

	res.Applied = true
	res.Duration = time.Since(start).String()
	return res, nil
}

// revert restores a file from a backup produced by makeBackup.
//
// The patch is a single byte, so reverting is equally surgical: it rewrites
// that one byte back. If the recorded offset no longer holds (because the
// binary was replaced by a self-update, which also changes offsets), the tool
// falls back to a full restore from the backup, since a stale offset would
// otherwise corrupt a fresh binary.
func revert(target, backup string, dryRun bool, log Logger) (PatchResult, error) {
	res := PatchResult{Path: target}

	rep, err := inspectFile(target, "", "")
	if err != nil {
		return res, err
	}
	res.SizeBefore = rep.Size
	res.BytesBefore = rep.SHA256

	if rep.State == StateUnpatched {
		res.Skipped = true
		res.Reason = "target is not patched; nothing to revert"
		res.Duration = time.Now().String()
		return res, nil
	}

	if dryRun {
		res.Skipped = true
		res.Reason = "dry run: would restore from " + backup
		return res, nil
	}

	// Prefer a surgical byte revert when the gate geometry still matches.
	// As with patching, each offset is derived from that site's own matched
	// text rather than from a fixed distance.
	backOffsets := make([]int64, 0, len(rep.Spans))
	for _, sp := range rep.Spans {
		matched, rerr := readSpan(target, sp)
		if rerr != nil {
			return res, rerr
		}
		rel, rerr := rewriteOffsetInGate(matched)
		if rerr != nil {
			// A patched gate contains `!1;`, not `!0;`, so the search
			// against the literal for the vulnerable form fails. That is
			// expected here; fall back to locating the literal directly.
			rel = bytes.Index(matched, rewriteTo)
			if rel < 0 {
				continue // leave this site to the full-restore path
			}
			rel++
		}
		backOffsets = append(backOffsets, sp.Start+int64(rel))
	}

	surgical := len(backOffsets) == len(rep.Spans) && len(backOffsets) > 0
	if surgical {
		f, err := os.OpenFile(target, os.O_RDWR, 0)
		if err == nil {
			payload := rewriteFrom[1:2] // '0'
			for _, off := range backOffsets {
				if _, err := f.WriteAt(payload, off); err != nil {
					surgical = false
					f.Close()
					break
				}
			}
			if surgical {
				_ = f.Sync()
			}
			f.Close()
		} else {
			surgical = false
		}
	}

	if !surgical {
		// Geometry drifted (almost certainly a self-update). A full copy from
		// the backup is the only safe move.
		log.Warn("gate geometry changed; falling back to full restore from backup")
		if err := copyFile(backup, target); err != nil {
			return res, fmt.Errorf("full restore: %w", err)
		}
	}

	after, err := inspectFile(target, "", "")
	if err != nil {
		return res, err
	}
	res.SizeAfter = after.Size
	res.BytesAfter = after.SHA256
	if after.Size != res.SizeBefore {
		return res, fmt.Errorf("revert verification failed: size %d -> %d",
			res.SizeBefore, after.Size)
	}
	res.Applied = true
	return res, nil
}

// readGateBytes returns a printable slice of the bytes surrounding the gate,
// which makes `--json` output and debugging self-explanatory.
func readGateBytes(path string, offset int64, n int64) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	start := offset - 12
	if start < 0 {
		start = 0
	}
	buf := make([]byte, n)
	if _, err := f.ReadAt(buf, start); err != nil && err != io.EOF {
		return "", err
	}
	return string(buf), nil
}
