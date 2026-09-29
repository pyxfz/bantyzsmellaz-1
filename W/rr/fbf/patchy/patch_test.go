package main

// patch_test.go — unit and integration tests for the ad-gate scanner and the
// patch operation.
//
// The tests build synthetic "binaries" rather than touching a real 130 MB
// Freebuff install, so the suite runs in milliseconds and cannot damage a
// working installation. The real binary is exercised separately by the manual
// integration test in the README.

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// gate builds a synthetic ad gate identical in shape to the real one.
func gate(name, flag, settings string, ret bool) string {
	b := "!0"
	if !ret {
		b = "!1"
	}
	return name + `=()=>{if(` + flag + `)return` + b + `;return ` + settings + `().adsEnabled??!1}`
}

// writeFixture creates a padded file large enough to clear the plausibility
// floor, with the gate embedded at a known offset, and returns the path plus
// the absolute offset of the byte inside the gate's `!0;` literal.
func writeFixture(t *testing.T, body string) (path string, gateStart, patchOff int64) {
	t.Helper()
	dir := t.TempDir()
	path = filepath.Join(dir, "freebuff")

	// Pad well past minPlausibleBinarySize (5 MiB) with inert bytes. The
	// padding also forces the scanner to traverse multiple chunks once the
	// chunk size is reduced in tests, exercising the carry logic.
	const pad = 6 << 20
	buf := make([]byte, 0, pad+len(body)+16)
	for len(buf) < pad {
		buf = append(buf, "AAAAAAAAAAAAAAAAAAAAAAAA"...)
	}
	buf = append(buf, body...)

	if err := os.WriteFile(path, buf, 0o755); err != nil {
		t.Fatalf("write fixture: %v", err)
	}
	return path, int64(pad), -1
}

// patchOffsetOf recomputes the absolute offset of the rewrite byte for a
// fixture, mirroring what inspectFile should report.
func patchOffsetOf(t *testing.T, path string) int64 {
	t.Helper()
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.PatchOffset <= 0 {
		t.Fatalf("expected a patch offset, got %d (state %s)", rep.PatchOffset, rep.State)
	}
	return rep.PatchOffset
}

// ---------------------------------------------------------------------------
// Scanner and anchor detection
// ---------------------------------------------------------------------------

// TestGateDetection covers the real-world variations observed across Freebuff
// releases. In 0.1.0 the gate was OP/RA/Jv; in 0.1.6 it is wP/GA/Tv. Both must
// be detected, because the minifier renames identifiers on every build.
func TestGateDetection(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"0.1.0 identifiers", "var " + gate("OP", "RA", "Jv", true) + ";var z=1;"},
		{"0.1.6 identifiers", "var " + gate("wP", "GA", "Tv", true) + ";var z=1;"},
		{"single char names", "var " + gate("a", "b", "c", true) + ";var z=1;"},
		{"long names", "var " + gate("someLongName", "anotherFlag", "settingsReader", true) + ";var z=1;"},
		{"dollar in names", "var " + gate("a$1", "b$2", "c$3", true) + ";var z=1;"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			path, _, _ := writeFixture(t, tc.body)
			rep, err := inspectFile(path, "", "")
			if err != nil {
				t.Fatalf("inspect: %v", err)
			}
			if rep.State != StateUnpatched {
				t.Fatalf("state = %s, want %s", rep.State, StateUnpatched)
			}
			if len(rep.Spans) != 1 {
				t.Fatalf("got %d gate sites, want 1", len(rep.Spans))
			}
		})
	}
}

// TestAlreadyPatchedDetected ensures a patched binary is classified as such
// rather than as unpatched, which is what makes the tool idempotent.
func TestAlreadyPatchedDetected(t *testing.T) {
	path, _, _ := writeFixture(t, "var "+gate("wP", "GA", "Tv", false)+";var z=1;")
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.State != StatePatched {
		t.Fatalf("state = %s, want %s", rep.State, StatePatched)
	}
	if rep.PatchOffset != 0 {
		t.Fatalf("patched file should not advertise a patch offset, got %d", rep.PatchOffset)
	}
}

// TestNonFreebuffFileRefusedByStrict is the most important safety test.
//
// A file that merely mentions `adsEnabled` will legitimately trip phase 4, the
// heuristic rung, because an unconditional `return!0` sits shortly before an
// `adsEnabled` read. That is exactly what phase 4 exists to catch, and it is
// why the rung is labelled heuristic rather than certain.
//
// The safety guarantee is not "never match" — it is "never act on a
// heuristic match without the user opting in". This test pins that contract:
// the file is classified, reported as heuristic, and then refused.
func TestNonFreebuffFileRefusedByStrict(t *testing.T) {
	body := "var settings={adsEnabled:true};function adsEnabled(){return 1}" +
		strings.Repeat("x", 64) + "return!0;return something().adsEnabled??!1}"
	path, _, _ := writeFixture(t, body)
	before, _ := os.ReadFile(path)

	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	// The exact phases must not claim it; only the heuristic rung may.
	if rep.Phase != "4-heuristic" {
		t.Fatalf("phase = %s, want 4-heuristic", rep.Phase)
	}
	if rep.Confidence != ConfHeuristic {
		t.Fatalf("confidence = %s, want %s", rep.Confidence, ConfHeuristic)
	}
	// A heuristic match must be self-describing, so the user is never left
	// wondering why a file was acted on.
	if rep.PhaseDescription == "" {
		t.Fatal("a heuristic match must carry a phase description")
	}

	// Strict mode must refuse to write.
	res, err := applyPatchStrict(path, false, 3, discardLogger{})
	if err != nil {
		t.Fatalf("applyPatchStrict: %v", err)
	}
	if res.Applied {
		t.Fatal("strict mode patched a heuristic match")
	}
	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Fatal("strict mode modified a file it refused")
	}
}

// TestGenuinelyUnrelatedFileIsUnknown confirms that a file with no
// adsEnabled-plus-`return!0` association is reported unknown outright, so the
// ladder does not simply match everything.
func TestGenuinelyUnrelatedFileIsUnknown(t *testing.T) {
	body := "var settings={adsEnabled:true};function unrelated(){return 1}" +
		strings.Repeat("x", 64) + "return!0;" // no adsEnabled read after the true
	path, _, _ := writeFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.State != StateUnknown {
		t.Fatalf("state = %s, want %s", rep.State, StateUnknown)
	}
	if rep.PatchOffset != 0 {
		t.Fatal("unknown file must not advertise a patch offset")
	}
}

// TestSmallFileRejected verifies the plausibility floor spares tiny files a
// pointless 130 MB-style scan.
func TestSmallFileRejected(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "freebuff")
	if err := os.WriteFile(path, []byte(gate("OP", "RA", "Jv", true)), 0o755); err != nil {
		t.Fatal(err)
	}
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.State != StateUnknown {
		t.Fatalf("state = %s, want %s", rep.State, StateUnknown)
	}
}

// TestMultipleGateSitesAllReported guards against patching only the first
// site, which would leave a live gate behind.
func TestMultipleGateSitesAllReported(t *testing.T) {
	g := gate("g1", "RA", "Jv", true)
	path, _, _ := writeFixture(t, "var "+g+";var "+g+";var "+g)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.State != StateUnpatched {
		t.Fatalf("state = %s, want unpatched", rep.State)
	}
	if len(rep.Spans) != 3 {
		t.Fatalf("got %d sites, want 3", len(rep.Spans))
	}
}

// ---------------------------------------------------------------------------
// The rewrite offset — the bug this tool actually got wrong once
// ---------------------------------------------------------------------------

// TestPatchOffsetIndependentOfIdentifierLength is a regression test.
//
// During development the offset was computed from a fixed sample string,
// which produced a 3-byte error on 0.1.6 and wrote `retur1!0;` into a real
// 130 MB binary. This test pins the correct behaviour: the offset must be
// derived from the actual matched text, so identifier length cannot affect it.
func TestPatchOffsetIndependentOfIdentifierLength(t *testing.T) {
	// The digit we must rewrite is always the one in `!0;`. Locate it in the
	// fixture and assert inspectFile agrees, for wildly different name lengths.
	for _, tc := range []struct{ name, flag, set string }{
		{"a", "b", "c"},
		{"X", "Y", "Z"},
		{"OP", "RA", "Jv"},
		{"wP", "GA", "Tv"},
		{"aVeryLongGateName", "anEquallyLongFlagIdentifier", "andTheSettingsReaderToo"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := "var " + gate(tc.name, tc.flag, tc.set, true) + ";var z=1;"
			path, padOff, _ := writeFixture(t, body)

			rep, err := inspectFile(path, "", "")
			if err != nil {
				t.Fatalf("inspect: %v", err)
			}
			// Where the digit genuinely is, computed independently of the
			// production code path.
			want := int64(padOff) + int64(strings.Index(body, "!0;")+1)
			if rep.PatchOffset != want {
				t.Fatalf("patch offset = %d, want %d", rep.PatchOffset, want)
			}

			// Apply and confirm the resulting text is exactly the patched
			// gate, byte for byte.
			if _, err := applyPatch(path, false, 3, discardLogger{}); err != nil {
				t.Fatalf("applyPatch: %v", err)
			}
			raw, err := os.ReadFile(path)
			if err != nil {
				t.Fatal(err)
			}
			got := string(raw[padOff:])
			wantBody := "var " + gate(tc.name, tc.flag, tc.set, false) + ";var z=1;"
			if got != wantBody {
				t.Fatalf("post-patch text mismatch:\n got: %s\nwant: %s", got, wantBody)
			}
		})
	}
}

// TestRewriteIsLengthPreserving is the core safety invariant: a byte edit must
// not shift any offset in the file, or the embedded module graph breaks.
func TestRewriteIsLengthPreserving(t *testing.T) {
	path, _, _ := writeFixture(t, "var "+gate("wP", "GA", "Tv", true)+";var z=1;")
	before, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := applyPatch(path, false, 3, discardLogger{}); err != nil {
		t.Fatalf("applyPatch: %v", err)
	}
	after, err := os.Stat(path)
	if err != nil {
		t.Fatal(err)
	}
	if before.Size() != after.Size() {
		t.Fatalf("size changed: %d -> %d", before.Size(), after.Size())
	}
}

// ---------------------------------------------------------------------------
// Patch / rollback round trip
// ---------------------------------------------------------------------------

// TestPatchThenRollbackRestoresExactBytes proves the backup is a faithful
// rollback point, not merely "probably close".
func TestPatchThenRollbackRestoresExactBytes(t *testing.T) {
	path, _, _ := writeFixture(t, "var "+gate("wP", "GA", "Tv", true)+";var z=1;")
	orig, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}

	res, err := applyPatch(path, false, 3, discardLogger{})
	if err != nil {
		t.Fatalf("applyPatch: %v", err)
	}
	if !res.Applied {
		t.Fatal("expected the patch to be applied")
	}
	if res.BackupPath == "" {
		t.Fatal("expected a backup path")
	}

	backup, err := os.ReadFile(res.BackupPath)
	if err != nil {
		t.Fatalf("read backup: %v", err)
	}
	if string(backup) != string(orig) {
		t.Fatal("backup contents differ from the original file")
	}

	// Roll back and require byte-for-byte equality with the original.
	if _, err := revert(path, res.BackupPath, false, discardLogger{}); err != nil {
		t.Fatalf("revert: %v", err)
	}
	after, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(after) != string(orig) {
		t.Fatal("rollback did not restore the original bytes")
	}
}

// TestApplyPatchIdempotent ensures a second run is a no-op rather than a
// second edit, which matters for cron-style usage.
func TestApplyPatchIdempotent(t *testing.T) {
	path, _, _ := writeFixture(t, "var "+gate("wP", "GA", "Tv", true)+";var z=1;")
	if _, err := applyPatch(path, false, 3, discardLogger{}); err != nil {
		t.Fatal(err)
	}
	first, _ := os.ReadFile(path)

	res, err := applyPatch(path, false, 3, discardLogger{})
	if err != nil {
		t.Fatalf("second applyPatch: %v", err)
	}
	if !res.AlreadyDone {
		t.Fatal("second run should report AlreadyDone")
	}
	second, _ := os.ReadFile(path)
	if string(first) != string(second) {
		t.Fatal("second run modified the file")
	}
}

// TestDryRunWritesNothing is the guarantee users rely on to preview safely.
func TestDryRunWritesNothing(t *testing.T) {
	path, _, _ := writeFixture(t, "var "+gate("wP", "GA", "Tv", true)+";var z=1;")
	before, _ := os.ReadFile(path)

	res, err := applyPatch(path, true, 3, discardLogger{})
	if err != nil {
		t.Fatalf("dry run: %v", err)
	}
	if !res.WouldApply {
		t.Fatal("dry run should report WouldApply")
	}
	if res.BackupPath != "" {
		t.Fatal("dry run must not create a backup")
	}
	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Fatal("dry run modified the file")
	}
}

// TestUnknownBuildSkipped confirms applyPatch refuses to touch a file whose
// gate it cannot identify.
func TestUnknownBuildSkipped(t *testing.T) {
	path, _, _ := writeFixture(t, strings.Repeat("nothing to see here ", 400000))
	before, _ := os.ReadFile(path)

	res, err := applyPatch(path, false, 3, discardLogger{})
	if err != nil {
		t.Fatalf("applyPatch: %v", err)
	}
	if !res.Skipped {
		t.Fatal("expected the unknown build to be skipped")
	}
	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Fatal("an unrecognised file was modified")
	}
}

// ---------------------------------------------------------------------------
// Backup management
// ---------------------------------------------------------------------------

// TestBackupPruning checks retention: the newest `keep` backups survive, the
// backup just created is always retained, and old ones are removed.
func TestBackupPruning(t *testing.T) {
	dir := t.TempDir()
	// Pre-create two older backups with lexicographically earlier timestamps.
	for _, name := range []string{
		backupPrefix + "20200101T000000Z.aaaaaaaaaa" + backupSuffix,
		backupPrefix + "20200102T000000Z.bbbbbbbbbb" + backupSuffix,
	} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte("old"), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	src := filepath.Join(dir, "freebuff")
	if err := os.WriteFile(src, []byte(strings.Repeat("z", 32)), 0o755); err != nil {
		t.Fatal(err)
	}

	newest, err := makeBackup(src, 2, discardLogger{})
	if err != nil {
		t.Fatalf("makeBackup: %v", err)
	}
	list, err := listBackups(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(list) != 2 {
		t.Fatalf("expected 2 retained backups, got %d: %v", len(list), list)
	}
	// The freshly created backup must never be the one pruned.
	found := false
	for _, p := range list {
		if p == newest {
			found = true
		}
	}
	if !found {
		t.Fatal("the newest backup was pruned")
	}
}

// TestNewestBackupOrdering confirms rollback picks the latest backup, relying
// on the fixed-width UTC timestamp in the name.
func TestNewestBackupOrdering(t *testing.T) {
	dir := t.TempDir()
	for _, n := range []string{
		backupPrefix + "20260929T100000Z.1111111111" + backupSuffix,
		backupPrefix + "20260929T120000Z.2222222222" + backupSuffix,
		backupPrefix + "20260929T110000Z.3333333333" + backupSuffix,
	} {
		if err := os.WriteFile(filepath.Join(dir, n), []byte("x"), 0o755); err != nil {
			t.Fatal(err)
		}
	}
	got := newestBackup(dir)
	want := filepath.Join(dir, backupPrefix+"20260929T120000Z.2222222222"+backupSuffix)
	if got != want {
		t.Fatalf("newestBackup = %s, want %s", got, want)
	}
}

// ---------------------------------------------------------------------------
// Chunk-boundary handling
// ---------------------------------------------------------------------------

// TestGateAcrossChunkBoundary places a gate so it straddles the scanner's
// chunk boundary, which is where an off-by-one in the carry window would
// silently lose the match.
func TestGateAcrossChunkBoundary(t *testing.T) {
	g := gate("wP", "GA", "Tv", true)
	// scanChunk is 8 MiB; place the gate so it starts just before a boundary
	// and therefore extends into the next chunk.
	body := "var " + g + ";var z=1;"
	padLen := int(scanChunk) - len(g)/2
	buf := make([]byte, 0, padLen+len(body))
	for len(buf) < padLen {
		buf = append(buf, "B"...)
	}
	buf = append(buf, body...)

	dir := t.TempDir()
	path := filepath.Join(dir, "freebuff")
	if err := os.WriteFile(path, buf, 0o755); err != nil {
		t.Fatal(err)
	}
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatalf("inspect: %v", err)
	}
	if rep.State != StateUnpatched {
		t.Fatalf("state = %s, want unpatched (gate spans a chunk boundary)", rep.State)
	}
	if len(rep.Spans) != 1 {
		t.Fatalf("got %d sites, want 1", len(rep.Spans))
	}
}

// discardLogger is a Logger that swallows output, keeping test output clean.
type discardLogger struct{}

func (discardLogger) Printf(string, ...any) {}
func (discardLogger) Println(...any)        {}
func (discardLogger) Infof(string, ...any)  {}
func (discardLogger) Warn(string, ...any)   {}
func (discardLogger) Errorf(string, ...any) {}
func (discardLogger) Debug(string, ...any)  {}
func (discardLogger) emitJSON(any)          {}
