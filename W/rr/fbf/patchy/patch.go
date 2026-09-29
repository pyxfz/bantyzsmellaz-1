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
	"strings"
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

// # The staged ladder
//
// A single exact regex is a single point of failure. It survives renaming, but
// not a *restructuring* — and restructuring is what a future release would do
// if anyone ever touched this code. Rather than one brittle pattern, detection
// runs as a ladder of phases, each more permissive than the last, and the
// first phase that matches wins. A phase's confidence is reported so the user
// always knows how sure the tool is.
//
// The ladder is ordered from most to least certain, and every phase shares two
// invariants: (1) it must be anchored on a rare literal so scanning stays fast,
// and (2) it must never match a file that merely mentions `adsEnabled`.
//
//	Phase 1  exact      the known 0.1.x gate, byte-for-byte in shape
//	Phase 2  relaxed    same function, arbitrary body up to the adsEnabled read
//	Phase 3  hoisted    function-declaration form instead of an arrow
//	Phase 4  heuristic  an unconditional `return!0` anywhere before the read
//	Phase 5  fixed      the gate now respects the setting: nothing to patch
//	Phase 6  absent     unrecognised; report context and change nothing
//
// Phase 5 deserves a note: if Codebuff ever *fixes* the opt-out, the
// `if (FLAG) return !0` short-circuit disappears and the setting starts
// working. Patching a byte would then be wrong, so the tool recognises that
// shape and tells the user to use the setting instead.

// phase describes one rung of the detection ladder.
type phase struct {
	// id is a short stable identifier used in output and JSON.
	id string
	// confidence is how much to trust a match from this phase.
	confidence Confidence
	// re locates the gate. Group 1 is the gate's name and group 2, when
	// present, the build flag; both are used for cross-checking.
	re *regexp.Regexp
	// prefilter is a rare literal that must appear inside any real match.
	// Anchoring on it keeps the scan fast: a raw regexp walk over 130 MB
	// measured ~19.5 s, versus ~0.6 s with the prefilter.
	prefilter []byte
	// back and forward size the window the regexp is evaluated in.
	back, forward int
	// description is shown in `explain` output and in failure messages.
	description string
	// gateGroup, when >= 0, is the capture group holding the build flag.
	flagGroup int
}

// Confidence levels, ordered from most to least certain.
type Confidence string

const (
	// ConfCertain is phase 1: the exact known shape.
	ConfCertain Confidence = "certain"
	// ConfHigh is phases 2-3: structurally strong, semantically clear.
	ConfHigh Confidence = "high"
	// ConfHeuristic is phase 4: a loose association, patch with care.
	ConfHeuristic Confidence = "heuristic"
)

// idents is the character class for a minified JavaScript identifier. It
// covers every name esbuild/Bun can emit, including the `$` suffixes and
// numeric suffixes used to break collisions.
const idents = `[A-Za-z0-9_$]+`

// The ladder. Phases 1-3 are compiled with a prefilter on `.adsEnabled`,
// which is rare enough in a 130 MB bundle to make evaluation effectively free.
//
// A note on the character classes: the body matchers exclude `{` and `}` but
// deliberately *allow* `;`. An earlier draft excluded semicolons as well, which
// silently broke phase 2 entirely — minified bodies are dense with `return!1;`
// statements, so excluding `;` meant no relaxed body could ever be traversed.
// Excluding only the braces correctly stops the match at a nested block while
// letting it run through ordinary statement separators.
//
// Phases 2 and 3 accept either order of the two ingredients. A refactor could
// hoist the settings read above the short-circuit
// (`let a=SET().adsEnabled;if(FLAG)return!0;return a??!1`) without changing the
// bug at all: the gate can still return true without consulting the setting.
var ladder = []phase{
	{
		id:         "1-exact",
		confidence: ConfCertain,
		re:         regexp.MustCompile(`(` + idents + `)=\(\)=>\{if\((` + idents + `)\)return!0;return ` + idents + `\(\)\.adsEnabled\?\?!1\}`),
		prefilter:  []byte(`.adsEnabled`),
		back:       200, forward: 80,
		flagGroup:   2,
		description: "exact known gate: NAME=()=>{if(FLAG)return!0;return SET().adsEnabled??!1}",
	},
	{
		id:         "2-relaxed",
		confidence: ConfHigh,
		re:         regexp.MustCompile(`(` + idents + `)=\(\)=>\{[^{}]{0,240}?(?:return!0;[^{}]{0,160}?\.adsEnabled|\.adsEnabled[^{}]{0,160}?return!0;)`),
		prefilter:  []byte(`.adsEnabled`),
		back:       320, forward: 320,
		flagGroup:   -1,
		description: "same arrow function, body reordered or extended, still short-circuits to true",
	},
	{
		id:         "3-hoisted",
		confidence: ConfHigh,
		re:         regexp.MustCompile(`function (` + idents + `)\(\)\{[^{}]{0,240}?(?:return!0;[^{}]{0,160}?\.adsEnabled|\.adsEnabled[^{}]{0,160}?return!0;)`),
		prefilter:  []byte(`.adsEnabled`),
		back:       320, forward: 320,
		flagGroup:   -1,
		description: "function-declaration form instead of an arrow",
	},
	{
		id:         "4-heuristic",
		confidence: ConfHeuristic,
		re:         regexp.MustCompile(`return!0;[^{}]{0,160}?\.adsEnabled`),
		prefilter:  []byte(`.adsEnabled`),
		back:       200, forward: 80,
		flagGroup:   -1,
		description: "an unconditional `return!0` shortly before an adsEnabled read, with no enclosing function identified",
	},
}

// phaseFixedGate detects the shape produced when the opt-out is *fixed*: a
// gate that reads the setting with no unconditional `true` short-circuit. It is
// not a patch target; it is a signal that the supported switch now works.
//
// Both plausible shapes are covered, because a fix could be written either way:
//
//	NAME=()=>{if(FLAG){return SET().adsEnabled??!0}return!1}   keep the flag
//	NAME=()=>SET().adsEnabled??!1                                drop it
//
// The pattern is deliberately loose about braces, because a real fix may nest
// an `if` block and a brace-excluding class would miss it. That is safe here
// for two reasons: this phase is only consulted after phases 1-4 have all
// failed, and a candidate is additionally rejected in code (see
// classifyFixedCandidate) if its text still contains an unconditional `return!0`.
var phaseFixedGateRe = regexp.MustCompile(
	`(` + idents + `)=\(\)=>[\s\S]{0,200}?\.adsEnabled\?\?![01]`)

// classifyFixedCandidate applies the real test for a phase-5 candidate: the
// matched text must not contain an unconditional `true` return. If it does, the
// gate is not actually fixed and the candidate is rejected.
func classifyFixedCandidate(matched []byte) bool {
	return !bytes.Contains(matched, []byte(`return!0`))
}

// buildFlagRe extracts the name of the "is this the Freebuff build" flag. The
// assignment looks like `RA=Z$().FREEBUFF_MODE==="true"`. Matching the flag
// name and comparing it with the one captured from the gate is a strong
// cross-check that we found the right function rather than a coincidence.
var buildFlagRe = regexp.MustCompile(`(` + idents + `)=` + idents + `\(\)\.FREEBUFF_MODE`)

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
// The fix is to search the bytes that were actually matched. That is correct
// for any identifier length, on any build.
//
// # Why the *last* occurrence
//
// The looser phases may match a body containing several `!0` literals, e.g.
// `if(!a)return!1;if(FLAG)return!0;return SET().adsEnabled`. The one that
// matters is the `return!0` that sits *closest before* the `adsEnabled` read,
// because that is the return that bypasses the setting. Taking the last
// occurrence selects it. For the exact phase there is only one, so this choice
// is a no-op there.
func rewriteOffsetInGate(matched []byte) (int, error) {
	if len(rewriteFrom) != len(rewriteTo) {
		// A length change would shift every byte after the edit and corrupt
		// the embedded module graph. Refuse rather than risk it.
		return 0, fmt.Errorf("internal: rewrite %q/%q are not the same length", rewriteFrom, rewriteTo)
	}
	idx := bytes.LastIndex(matched, rewriteFrom)
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
// It maps one-to-one onto the detection ladder, so the state tells you which
// phase concluded the file's status.
type PatchState string

const (
	// StateUnpatched means a live gate was found and can be rewritten.
	StateUnpatched PatchState = "unpatched"
	// StatePatched means the gate already returns false. Nothing to do.
	StatePatched PatchState = "patched"
	// StateSettingRespected means the gate was found in a form with no
	// unconditional `true`: the opt-out appears to be fixed upstream, and the
	// supported `adsEnabled` setting is now the correct control. No byte patch
	// is applied in this state.
	StateSettingRespected PatchState = "setting-respected"
	// StateUnknown means no gate was recognised at all. The file is never
	// modified in this state.
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

	// --- ladder diagnostics -------------------------------------------------

	// Phase is the id of the ladder rung that classified this file, e.g.
	// "1-exact". Empty when no phase matched.
	Phase string `json:"phase,omitempty"`
	// Confidence is how much the matching phase's match can be trusted.
	Confidence Confidence `json:"confidence,omitempty"`
	// GateName is the ad gate function's identifier as found in the bundle.
	GateName string `json:"gateName,omitempty"`
	// FlagName is the build-flag identifier the gate tests.
	FlagName string `json:"flagName,omitempty"`
	// FlagCrossChecked is true when FlagName was independently confirmed to be
	// the symbol assigned from FREEBUFF_MODE. This is the strongest available
	// evidence that the right function was identified.
	FlagCrossChecked bool `json:"flagCrossChecked,omitempty"`
	// PhaseDescription explains what the matching phase looks for.
	PhaseDescription string `json:"phaseDescription,omitempty"`
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

// ladderMatchers turns the phase ladder into matcher objects for the
// single-pass scanner. One matcher is produced per phase, plus a detector for
// the "setting is now respected" shape and one for the already-patched form.
//
// The already-patched detector is derived by mechanically substituting the
// rewritten literal into each phase's pattern, so a phase that can find a
// vulnerable gate can also find its patched twin. Deriving it beats
// hand-maintaining a second regex per phase.
func ladderMatchers() []matcher {
	out := make([]matcher, 0, len(ladder)+2)
	for _, p := range ladder {
		out = append(out, regexpMatcher{
			label:     p.id,
			re:        p.re,
			prefilter: p.prefilter,
			back:      p.back,
			forward:   p.forward,
		})
	}
	// The patched twin of each phase.
	for _, p := range ladder {
		out = append(out, regexpMatcher{
			label:     p.id + ":patched",
			re:        patchedVariantOf(p.re),
			prefilter: p.prefilter,
			back:      p.back,
			forward:   p.forward,
		})
	}
	// The "opt-out appears fixed" shape.
	out = append(out, regexpMatcher{
		label:     "phase-fixed",
		re:        phaseFixedGateRe,
		prefilter: []byte(`.adsEnabled`),
		back:      320, forward: 80,
	})
	// The build-flag assignment, used to cross-check phase 1's capture.
	out = append(out, regexpMatcher{
		label:     "build-flag",
		re:        buildFlagRe,
		prefilter: []byte(`.FREEBUFF_MODE`),
		// The back window must clear the flag's own name, which is
		// arbitrarily long. An earlier 16-byte window silently failed for
		// names longer than about ten characters.
		back: 256, forward: 48,
	})
	return out
}

// patchedVariantOf returns the regex for the already-patched form of a phase.
//
// Every phase pattern is written with the literal `return!0;` in its
// vulnerable form, so the patched form is recovered by substituting the
// first `return!0;` with `return!1;`. Substituting rather than maintaining a
// parallel regex means the two can never drift apart.
func patchedVariantOf(re *regexp.Regexp) *regexp.Regexp {
	const from = `return!0;`
	const to = `return!1;`
	// re.String() round-trips the original source, so the substitution targets
	// the same literal the pattern was written with.
	//
	// All occurrences are replaced, not just the first. Phases 2 and 3 carry
	// two `return!0;` alternatives (one per operand order), and a patched gate
	// has `return!1;` in whichever position applies — so both branches of the
	// pattern must be rewritten for the twin to be correct.
	src := re.String()
	if !strings.Contains(src, from) {
		return nil
	}
	return regexp.MustCompile(strings.ReplaceAll(src, from, to))
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
//
// The ladder is walked in order and the *most certain* phase that matches wins.
// Walking in order rather than taking any match matters: a file that satisfies
// both the exact phase and the heuristic phase should be reported as exact, so
// the user sees "certain" rather than "heuristic".
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

	sum, hits, _, err := scanFile(path, ladderMatchers()...)
	if err != nil {
		return rep, err
	}
	rep.SHA256 = sum

	// Record the build-flag symbol for the cross-check below.
	detectBuildFlag(path, hits)

	// --- cross-check the build flag ---------------------------------------
	// Locate the symbol assigned from FREEBUFF_MODE. Phase 1 captures the flag
	// the gate tests; if the two agree, we have positive evidence that the
	// matched function really is the ad gate and not a coincidence.
	rep.FlagName = firstSubmatch(path, hits["build-flag"], buildFlagRe, 1)

	// --- walk the ladder ---------------------------------------------------
	var chosen *phase
	var chosenHits []span
	var chosenState PatchState
	// chosenRe is the regex that actually produced the chosen hits. It differs
	// from chosen.re when the file is already patched, because the ladder keeps
	// a derived "patched twin" of every pattern. Using the wrong one to pull
	// capture groups out of the matched bytes silently yields nothing.
	var chosenRe *regexp.Regexp

	for i := range ladder {
		p := &ladder[i]

		if sp := hits[p.id]; len(sp) > 0 {
			chosen, chosenHits, chosenState, chosenRe = p, sp, StateUnpatched, p.re
			break
		}
		if sp := hits[p.id+":patched"]; len(sp) > 0 {
			chosen, chosenHits, chosenState, chosenRe = p, sp, StatePatched, patchedVariantOf(p.re)
			break
		}
	}

	// No patch phase matched. Before giving up, check whether the gate has been
	// restructured into a form that respects the setting, which is the shape a
	// fixed opt-out would take.
	if chosen == nil {
		// Phase 5: the opt-out appears to be fixed upstream. Filter the loose
		// candidate list through the real test before believing any of it.
		var fixed []span
		for _, sp := range hits["phase-fixed"] {
			raw, err := readSpan(path, sp)
			if err != nil {
				continue
			}
			if classifyFixedCandidate(raw) {
				fixed = append(fixed, sp)
			}
		}
		if len(fixed) > 0 {
			rep.State = StateSettingRespected
			rep.Spans = fixed
			rep.Phase = "5-fixed"
			rep.PhaseDescription = "gate reads the setting with no unconditional true; " +
				"the opt-out appears to work upstream"
			rep.Confidence = ConfCertain
			rep.Notes = append(rep.Notes,
				"the ad gate no longer short-circuits to true; set adsEnabled:false "+
					"in settings.json instead of patching a byte")
			return rep, nil
		}
		rep.State = StateUnknown
		rep.Phase = "6-absent"
		rep.Notes = append(rep.Notes,
			"no phase of the detection ladder matched; the build may have "+
				"restructured its ad logic. File left untouched.")
		// Attach whatever evidence exists so `explain` has something to show.
		rep.Spans = hits["4-heuristic"]
		return rep, nil
	}

	rep.Phase = chosen.id
	rep.Confidence = chosen.confidence
	rep.PhaseDescription = chosen.description
	rep.Spans = chosenHits
	rep.State = chosenState
	rep.Verified = chosenState == StatePatched

	// Identify the gate and flag names, when the phase captured them.
	rep.GateName = firstSubmatch(path, chosenHits, chosenRe, 1)
	if chosen.flagGroup > 0 {
		rep.FlagName = firstSubmatch(path, chosenHits, chosenRe, chosen.flagGroup)
	}

	// The strongest available confirmation: the flag the gate tests is the same
	// symbol the bundle assigns from FREEBUFF_MODE.
	if rep.FlagName != "" {
		rep.FlagCrossChecked = strings.EqualFold(rep.FlagName, detectedBuildFlag)
	}

	if chosenState == StateUnpatched {
		// Derive the rewrite offset from the bytes actually matched rather than
		// from a fixed distance, because identifier lengths vary per build.
		first, err := readSpan(path, chosenHits[0])
		if err != nil {
			return rep, err
		}
		rel, err := rewriteOffsetInGate(first)
		if err != nil {
			return rep, err
		}
		rep.PatchOffset = chosenHits[0].Start + int64(rel)

		if len(chosenHits) > 1 {
			// Should not happen in a shipped build, but if it did, patching
			// only the first site would leave a live gate behind.
			rep.Notes = append(rep.Notes, fmt.Sprintf(
				"warning: %d gate sites found; all will be patched", len(chosenHits)))
		}
		if p := hits[chosen.id+":patched"]; len(p) > 0 {
			rep.Notes = append(rep.Notes, fmt.Sprintf(
				"note: build contains both patched (%d) and unpatched (%d) gate sites",
				len(p), len(chosenHits)))
		}
	}

	return rep, nil
}

// detectedBuildFlag holds the symbol the bundle assigns from FREEBUFF_MODE. It
// is populated by detectBuildFlag during the scan phase.
var detectedBuildFlag string

// detectBuildFlag records the build-flag symbol, called once per file before
// classification so the cross-check in inspectFile can use it.
func detectBuildFlag(path string, hits map[string][]span) {
	sp := hits["build-flag"]
	if len(sp) == 0 {
		detectedBuildFlag = ""
		return
	}
	detectedBuildFlag = firstSubmatch(path, sp, buildFlagRe, 1)
}

// firstSubmatch returns capture group n of the first match in sp, or "".
func firstSubmatch(path string, sp []span, re *regexp.Regexp, n int) string {
	if len(sp) == 0 {
		return ""
	}
	raw, err := readSpan(path, sp[0])
	if err != nil {
		return ""
	}
	m := re.FindSubmatch(raw)
	if m == nil || n >= len(m) || m[n] == nil {
		return ""
	}
	return string(m[n])
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
	return applyPatchWith(path, dryRun, keepBackups, false, log)
}

// applyPatchStrict behaves like applyPatch but refuses to act on a match that
// came only from the heuristic rung of the ladder. It is the engine behind
// `--strict`; living here rather than only in the CLI keeps the policy
// testable and makes it impossible for a caller to bypass by accident.
func applyPatchStrict(path string, dryRun bool, keepBackups int, log Logger) (PatchResult, error) {
	return applyPatchWith(path, dryRun, keepBackups, true, log)
}

// applyPatchWith is the shared implementation behind applyPatch and
// applyPatchStrict. See applyPatch for the full safety commentary; this wrapper
// exists only to thread the strict flag through.
func applyPatchWith(path string, dryRun bool, keepBackups int, strict bool, log Logger) (PatchResult, error) {
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
		res.Reason = "no ladder phase matched; file left untouched"
		res.Notes = rep.Notes
		res.Duration = time.Since(start).String()
		return res, nil
	case StateSettingRespected:
		// The gate has no unconditional `true`: the opt-out works upstream, so
		// the correct action is the settings file, not a byte edit.
		res.Skipped = true
		res.Reason = "gate respects the setting; use adsEnabled:false in settings.json"
		res.Notes = rep.Notes
		res.Duration = time.Since(start).String()
		return res, nil
	}

	// Strict mode: only act when the gate was identified structurally, not by
	// the heuristic association.
	if strict && rep.Confidence == ConfHeuristic {
		res.Skipped = true
		res.Reason = fmt.Sprintf(
			"refused: matched only by heuristic phase %s and --strict is set", rep.Phase)
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
