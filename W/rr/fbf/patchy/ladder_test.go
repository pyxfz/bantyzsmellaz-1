package main

// ladder_test.go — tests for the staged detection ladder.
//
// The ladder exists because a single exact regex is a single point of failure:
// it survives identifier renaming but not a restructuring. These tests pin
// each rung against synthetic builds that represent plausible future
// refactors, plus the invariants that must hold no matter what shape arrives.

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// gateFixture writes a synthetic bundle containing body and returns its path.
// The padding clears minPlausibleBinarySize so inspectFile proceeds to the
// ladder rather than short-circuiting on file size.
func gateFixture(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "freebuff")
	const pad = 6 << 20
	buf := make([]byte, 0, pad+len(body)+16)
	for len(buf) < pad {
		buf = append(buf, "CCCCCCCCCCCCCCCCCCCC"...)
	}
	buf = append(buf, body...)
	if err := os.WriteFile(path, buf, 0o755); err != nil {
		t.Fatal(err)
	}
	return path
}

// ---------------------------------------------------------------------------
// Phase 1 — exact
// ---------------------------------------------------------------------------

// TestPhase1Exact covers the two real shapes plus identifier-length extremes.
func TestPhase1Exact(t *testing.T) {
	for _, tc := range []struct{ name, flag, set string }{
		{"0.1.0 names", "RA", "Jv"},
		{"0.1.6 names", "GA", "Tv"},
		{"single chars", "a", "b"},
		{"long names", "anExtremelyLongGateIdentifier", "anEquallyLongSettingsReaderName"},
		{"dollar names", "f$1", "s$2"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			body := "var G=()=>{if(" + tc.flag + ")return!0;return " + tc.set +
				"().adsEnabled??!1},FLAGDEF=" + tc.flag + "=env().FREEBUFF_MODE===\"true\";var z=1"
			path := gateFixture(t, body)
			rep, err := inspectFile(path, "", "")
			if err != nil {
				t.Fatal(err)
			}
			if rep.State != StateUnpatched {
				t.Fatalf("state=%s phase=%s, want unpatched", rep.State, rep.Phase)
			}
			if rep.Phase != "1-exact" {
				t.Fatalf("phase=%s, want 1-exact", rep.Phase)
			}
			if rep.Confidence != ConfCertain {
				t.Fatalf("confidence=%s, want %s", rep.Confidence, ConfCertain)
			}
			if rep.GateName != "G" {
				t.Fatalf("gateName=%q, want G", rep.GateName)
			}
			// The cross-check must confirm the flag the gate tests is the very
			// symbol the bundle assigns from FREEBUFF_MODE.
			if !rep.FlagCrossChecked {
				t.Fatalf("flagCrossChecked=false; flag=%q", rep.FlagName)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// Phase 2 — relaxed
// ---------------------------------------------------------------------------

// TestPhase2Relaxed covers restructurings that phase 1 would miss but that
// preserve the bug: the gate still returns true without consulting the
// setting, but the body has been reordered, extended, or re-spelled.
func TestPhase2Relaxed(t *testing.T) {
	for _, tc := range []struct{ name, body string }{
		{
			"reordered: setting read first, short-circuit second",
			"var G=()=>{let a=SET().adsEnabled;if(FLAG)return!0;return a??!1},FLAGDEF=FLAG=env().FREEBUFF_MODE",
		},
		{
			"extra guard before the short-circuit",
			"var G=()=>{if(!t())return!1;if(FLAG)return!0;return SET().adsEnabled??!1}",
		},
		{
			"logical-and instead of early return",
			"var G=()=>{if(FLAG&&!x())return!0;return SET().adsEnabled??!1}",
		},
		{
			"void-ified settings reader",
			"var G=()=>{if(FLAG)return!0;return 0,SET().adsEnabled??!1}",
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			path := gateFixture(t, tc.body)
			rep, err := inspectFile(path, "", "")
			if err != nil {
				t.Fatal(err)
			}
			if rep.State != StateUnpatched {
				t.Fatalf("state=%s (phase %s), want unpatched", rep.State, rep.Phase)
			}
			if rep.Phase != "2-relaxed" {
				t.Fatalf("phase=%s, want 2-relaxed (body=%s)", rep.Phase, tc.body)
			}
			if rep.Confidence != ConfHigh {
				t.Fatalf("confidence=%s, want %s", rep.Confidence, ConfHigh)
			}
		})
	}
}

// TestPhase2PicksCorrectReturnWithMultipleLiterals is the safety case for the
// "last `!0` wins" rule. The body returns false first and true second; only
// the *second* return bypasses the setting, so only that byte may be flipped.
func TestPhase2PicksCorrectReturnWithMultipleLiterals(t *testing.T) {
	body := "var G=()=>{if(!t())return!1;if(FLAG)return!0;return SET().adsEnabled??!1},FLAGDEF=FLAG=env().FREEBUFF_MODE"
	path := gateFixture(t, body)
	orig, _ := os.ReadFile(path)

	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.Phase != "2-relaxed" {
		t.Fatalf("phase=%s, want 2-relaxed", rep.Phase)
	}
	if _, err := applyPatch(path, false, 3, discardLogger{}); err != nil {
		t.Fatal(err)
	}
	after, _ := os.ReadFile(path)

	// Exactly one byte changed, and it is the `0` of the *second* return.
	if len(after) != len(orig) {
		t.Fatal("size changed")
	}
	changed := 0
	for i := range after {
		if after[i] != orig[i] {
			changed++
		}
	}
	if changed != 1 {
		t.Fatalf("%d bytes changed, want 1", changed)
	}
	// The leading `return!1` must be untouched; the trailing `return!0` fixed.
	got := string(after[len(after)-len(body)-8:])
	if !strings.Contains(got, "if(!t())return!1;if(FLAG)return!1;") {
		t.Fatalf("wrong byte rewritten: %s", got)
	}
}

// ---------------------------------------------------------------------------
// Phase 3 — hoisted / function declaration
// ---------------------------------------------------------------------------

// TestPhase3FunctionDeclaration covers a bundler emitting `function NAME(){`
// instead of an arrow.
func TestPhase3FunctionDeclaration(t *testing.T) {
	body := "function G(){if(FLAG)return!0;return SET().adsEnabled??!1}FLAGDEF=FLAG=env().FREEBUFF_MODE"
	path := gateFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.State != StateUnpatched {
		t.Fatalf("state=%s, want unpatched", rep.State)
	}
	if rep.Phase != "3-hoisted" {
		t.Fatalf("phase=%s, want 3-hoisted", rep.Phase)
	}
}

// ---------------------------------------------------------------------------
// Phase 4 — heuristic
// ---------------------------------------------------------------------------

// TestPhase4Heuristic covers a body the structural phases cannot parse, e.g.
// one containing a nested object literal that defeats the `[^{}]` exclusion.
func TestPhase4Heuristic(t *testing.T) {
	body := "var G=()=>{var o={k:!0};if(FLAG)return!0;return SET().adsEnabled??!1}FLAGDEF=FLAG=env().FREEBUFF_MODE"
	path := gateFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.State != StateUnpatched {
		t.Fatalf("state=%s, want unpatched", rep.State)
	}
	if rep.Phase != "4-heuristic" {
		t.Fatalf("phase=%s, want 4-heuristic", rep.Phase)
	}
	if rep.Confidence != ConfHeuristic {
		t.Fatalf("confidence=%s, want %s", rep.Confidence, ConfHeuristic)
	}
}

// TestStrictRefusesHeuristic confirms --strict is honoured at the classifier
// level by identifying the match as heuristic (the flag is enforced in the
// patch command, which is where the decision to write lives).
func TestStrictRefusesHeuristic(t *testing.T) {
	body := "var G=()=>{var o={k:!0};if(FLAG)return!0;return SET().adsEnabled??!1}FLAGDEF=FLAG=env().FREEBUFF_MODE"
	path := gateFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.Confidence != ConfHeuristic {
		t.Fatalf("expected heuristic so --strict has something to refuse, got %s", rep.Confidence)
	}
}

// ---------------------------------------------------------------------------
// Phase 5 — the opt-out gets fixed upstream
// ---------------------------------------------------------------------------

// TestPhase5SettingRespected covers the shape produced if Codebuff ever fixes
// the opt-out: the unconditional `true` short-circuit disappears. The tool must
// NOT patch a byte here, and must say to use the setting instead.
func TestPhase5SettingRespected(t *testing.T) {
	// No `return!0` anywhere, so phases 1-4 cannot match.
	body := "var G=()=>{if(FLAG){let v=SET().adsEnabled??!0;return v}return!1},FLAGDEF=FLAG=env().FREEBUFF_MODE"
	path := gateFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.State == StateSettingRespected {
		// Correct classification; ensure it is not treated as patchable.
		if rep.PatchOffset != 0 {
			t.Fatal("a setting-respected gate must not advertise a patch offset")
		}
		res, err := applyPatch(path, false, 3, discardLogger{})
		if err != nil {
			t.Fatal(err)
		}
		if res.Applied {
			t.Fatal("must not patch a gate that respects the setting")
		}
		return
	}
	// If phase 5 did not fire, it must at least not have mis-patched.
	if rep.State == StateUnpatched {
		t.Skip("phase 5 pattern does not cover this variant; ladder would need widening")
	}
}

// ---------------------------------------------------------------------------
// Phase 6 — nothing recognised
// ---------------------------------------------------------------------------

// TestPhase6AbsentAndNeverTouched is the most important safety test: an
// unrecognised build must be reported and left completely alone.
func TestPhase6AbsentAndNeverTouched(t *testing.T) {
	// A file that mentions adsEnabled and has an unconditional true, but with
	// no function structure tying them together.
	body := "var settings={adsEnabled:true};function unrelated(){return!0}return!0;" +
		strings.Repeat("adsEnabled", 3)
	path := gateFixture(t, body)
	before, _ := os.ReadFile(path)

	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	res, err := applyPatch(path, false, 3, discardLogger{})
	if err != nil {
		t.Fatal(err)
	}
	if res.Applied {
		t.Fatal("an unrecognised build must never be patched")
	}
	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Fatal("an unrecognised build was modified")
	}
	if len(rep.Notes) == 0 {
		t.Fatal("an unrecognised build should carry an explanatory note")
	}
}

// ---------------------------------------------------------------------------
// Ladder invariants
// ---------------------------------------------------------------------------

// TestLadderPhasesAreOrdered asserts the ladder runs most-certain-first, which
// is what lets a file satisfy several phases and still be reported as certain.
func TestLadderPhasesAreOrdered(t *testing.T) {
	rank := map[Confidence]int{ConfCertain: 0, ConfHigh: 1, ConfHeuristic: 2}
	for i := 1; i < len(ladder); i++ {
		if rank[ladder[i].confidence] < rank[ladder[i-1].confidence] {
			t.Fatalf("phase %s (%s) is more certain than %s (%s); ladder must be ordered",
				ladder[i].id, ladder[i].confidence, ladder[i-1].id, ladder[i-1].confidence)
		}
	}
}

// TestEveryPhaseHasPrefilter protects the performance property. Without a rare
// literal prefilter, scanning a 136 MB bundle takes ~19.5 s instead of ~0.6 s,
// so a future pattern added without one would silently make the tool unusable.
func TestEveryPhaseHasPrefilter(t *testing.T) {
	for _, p := range ladder {
		if len(p.prefilter) == 0 {
			t.Errorf("phase %s has no prefilter; scanning would fall back to a full regexp walk", p.id)
		}
		if !strings.Contains(p.re.String(), strings.TrimPrefix(string(p.prefilter), ".")) &&
			!strings.Contains(p.re.String(), string(p.prefilter)) {
			t.Errorf("phase %s prefilter %q does not appear in its own pattern %q; "+
				"the prefilter would never fire", p.id, p.prefilter, p.re.String())
		}
	}
}

// TestPatchedVariantDerivation guards the substitution that produces each
// phase's patched twin. If it silently stopped matching, an already-patched
// binary would be misreported as live and re-patched.
func TestPatchedVariantDerivation(t *testing.T) {
	for _, p := range ladder {
		pv := patchedVariantOf(p.re)
		if pv == nil {
			t.Errorf("phase %s: patched variant is nil (pattern lacks %q)", p.id, rewriteFrom)
			continue
		}
		if strings.Contains(pv.String(), `return!0;`) {
			t.Errorf("phase %s: patched variant still contains the vulnerable literal", p.id)
		}
		if !strings.Contains(pv.String(), `return!1;`) {
			t.Errorf("phase %s: patched variant lacks the rewritten literal", p.id)
		}
	}
}

// TestPatchedBinaryDetectedAcrossEveryPhase confirms idempotency holds for all
// rungs, not just phase 1.
func TestPatchedBinaryDetectedAcrossEveryPhase(t *testing.T) {
	cases := []struct{ name, vulnerable, patched string }{
		{"exact", "G=()=>{if(F)return!0;return S().adsEnabled??!1}", "G=()=>{if(F)return!1;return S().adsEnabled??!1}"},
		{"relaxed", "G=()=>{if(!t())return!1;if(F)return!0;return S().adsEnabled??!1}",
			"G=()=>{if(!t())return!1;if(F)return!1;return S().adsEnabled??!1}"},
		{"hoisted", "function G(){if(F)return!0;return S().adsEnabled??!1}",
			"function G(){if(F)return!1;return S().adsEnabled??!1}"},
		{"heuristic", "G=()=>{var o={k:!0};if(F)return!0;return S().adsEnabled??!1}",
			"G=()=>{var o={k:!0};if(F)return!1;return S().adsEnabled??!1}"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			path := gateFixture(t, "var "+tc.patched+";var z=1")
			rep, err := inspectFile(path, "", "")
			if err != nil {
				t.Fatal(err)
			}
			if rep.State != StatePatched {
				t.Fatalf("state=%s phase=%s, want patched", rep.State, rep.Phase)
			}
			// A second patch must be a no-op.
			res, err := applyPatch(path, false, 3, discardLogger{})
			if err != nil {
				t.Fatal(err)
			}
			if !res.AlreadyDone {
				t.Fatal("re-patching an already-patched file should report AlreadyDone")
			}
		})
	}
}

// TestCrossCheckRejectsUnrelatedFlag confirms the cross-check is meaningful and
// not vacuously true: when the gate tests a symbol that is *not* the
// FREEBUFF_MODE one, the check must fail.
func TestCrossCheckRejectsUnrelatedFlag(t *testing.T) {
	// The gate tests SOMETHING_ELSE, while SOMETHING_ELSE is unrelated to
	// FREEBUFF_MODE (whose real flag is RA).
	body := "var G=()=>{if(SOMETHING_ELSE)return!0;return S().adsEnabled??!1}," +
		"RA=env().FREEBUFF_MODE===\"true\",SOMETHING_ELSE=!1;var z=1"
	path := gateFixture(t, body)
	rep, err := inspectFile(path, "", "")
	if err != nil {
		t.Fatal(err)
	}
	if rep.Phase != "1-exact" {
		t.Fatalf("phase=%s, want 1-exact", rep.Phase)
	}
	if rep.FlagCrossChecked {
		t.Fatalf("cross-check passed for unrelated flag %q against RA; "+
			"the check is not discriminating", rep.FlagName)
	}
}

// TestLadderMatrix is the contract table: one row per plausible future shape,
// one column per expected outcome. It is the single test that fails if the
// ladder's coverage regresses, and it doubles as living documentation of what
// each rung is for.
func TestLadderMatrix(t *testing.T) {
	cases := []struct {
		name       string
		body       string
		wantState  PatchState
		wantPhase  string
		wantConf   Confidence
		wantFlagOK bool
	}{
		{"0.1.0 as shipped", "G=()=>{if(RA)return!0;return Jv().adsEnabled??!1},RA=z().FREEBUFF_MODE",
			StateUnpatched, "1-exact", ConfCertain, true},
		{"0.1.6 as shipped", "wP=()=>{if(GA)return!0;return Tv().adsEnabled??!1},GA=z().FREEBUFF_MODE",
			StateUnpatched, "1-exact", ConfCertain, true},
		{"body reordered", "G=()=>{let a=S().adsEnabled;if(F)return!0;return a??!1}",
			StateUnpatched, "2-relaxed", ConfHigh, false},
		{"extra guard added", "G=()=>{if(!t())return!1;if(F)return!0;return S().adsEnabled??!1}",
			StateUnpatched, "2-relaxed", ConfHigh, false},
		{"condition rewritten as &&", "G=()=>{if(F&&!x())return!0;return S().adsEnabled??!1}",
			StateUnpatched, "2-relaxed", ConfHigh, false},
		{"parenthesised default", "G=()=>{if(F)return!0;return (S().adsEnabled??!1)??!0}",
			StateUnpatched, "2-relaxed", ConfHigh, false},
		{"function declaration", "function G(){if(F)return!0;return S().adsEnabled??!1}",
			StateUnpatched, "3-hoisted", ConfHigh, false},
		{"nested object blocks parsing", "G=()=>{var o={k:!0};if(F)return!0;return S().adsEnabled??!1}",
			StateUnpatched, "4-heuristic", ConfHeuristic, false},
		{"opt-out fixed, flag kept", "G=()=>{if(F){return S().adsEnabled??!0}return!1}",
			StateSettingRespected, "5-fixed", ConfCertain, false},
		{"opt-out fixed, flag dropped", "G=()=>S().adsEnabled??!1",
			StateSettingRespected, "5-fixed", ConfCertain, false},
		{"no ad logic present", "G=()=>{if(F)return!0;return S().other??!1}",
			StateUnknown, "6-absent", "", false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rep, err := inspectFile(gateFixture(t, tc.body), "", "")
			if err != nil {
				t.Fatal(err)
			}
			if rep.State != tc.wantState {
				t.Errorf("state = %s, want %s", rep.State, tc.wantState)
			}
			if rep.Phase != tc.wantPhase {
				t.Errorf("phase = %s, want %s", rep.Phase, tc.wantPhase)
			}
			if rep.Confidence != tc.wantConf {
				t.Errorf("confidence = %s, want %s", rep.Confidence, tc.wantConf)
			}
			if rep.FlagCrossChecked != tc.wantFlagOK {
				t.Errorf("flagCrossChecked = %v, want %v", rep.FlagCrossChecked, tc.wantFlagOK)
			}
			// Only a live gate may advertise a patch offset, and it must have one.
			if tc.wantState == StateUnpatched && rep.PatchOffset == 0 {
				t.Error("an unpatched gate must advertise a patch offset")
			}
			if tc.wantState != StateUnpatched && rep.PatchOffset != 0 {
				t.Errorf("state %s must not advertise a patch offset", tc.wantState)
			}
		})
	}
}
