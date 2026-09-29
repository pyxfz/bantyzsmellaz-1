# How Freebuff's text ads work, and why the patch is shaped this way

This is the analysis behind `freebuff-adstrip`. Everything here was derived by
reading the shipped binary on a Linux host; byte offsets are given so each claim
can be re-verified.

---

## 1. The npm package is not the program

The thing you install is a launcher, not the CLI:

```
~/.bun/install/global/node_modules/freebuff/
├── index.js        1 KB    createLauncher(...) bootstrap
├── launcher.js    59 KB    download, verify, extract, exec
├── http.js        15 KB    release download client
└── package.json          binaryChecksums per platform
```

On first run it downloads an archive from `codebuff.com`, verifies its SHA-256
against `binaryChecksums` in its own `package.json`, extracts it, and execs the
result. From `launcher.js:260`:

```js
function createConfig(packageName) {
  const homeDir = os.homedir()
  const configDir = configDirOverride || path.join(homeDir, '.config', 'manicode')
  const binaryName = process.platform === 'win32' ? `${packageName}.exe` : packageName
  return { configDir, binaryName, binaryPath: path.join(configDir, binaryName), ... }
}
```

So on Linux there is exactly one file that matters:

```
~/.config/manicode/freebuff              # ~130 MB Bun single-file executable
~/.config/manicode/freebuff-metadata.json # {"version":"0.1.6","target":"linux-x64"}
```

**There is no ad code in the npm package.** `grep -ri "ad\|sponsor"` across it
returns only the README line "Freebuff is supported by text ads."

---

## 2. Where the ads actually live

The Bun executable embeds the entire minified JavaScript bundle in
**plaintext**, appended to the ELF. That is why the source is greppable:

```bash
grep -aob 'adsEnabled' ~/.config/manicode/freebuff
```

This is also why a byte patch is viable: the payload is not compressed, so
editing it in place does not require re-serialising anything.

### 2.1 Identifiers are unstable

The minifier renames every identifier on each build. Observed on this host:

| Version | Gate | Build flag | Settings reader |
|---|---|---|---|
| 0.1.0 | `OP` | `RA` | `Jv` |
| 0.1.6 | `wP` | `GA` | `Tv` |

The gate's *behaviour* is identical; only the names changed. This is the single
most important fact for tool design, and it is discussed in §7.

---

## 3. The ad pipeline

### 3.1 The gate

```js
// 0.1.0, offset 99214653
OP = () => { if (RA) return !0; return Jv().adsEnabled ?? !1 }
```

`!0` is minified `true`, `!1` is minified `false`. This function is the master
switch for ads; it has one definition and nine call sites, covering inline
chat ads, the waiting-room ad, the dock panel, partner placements, and
sponsored proposals.

### 3.2 Why the setting is dead code

```js
// offset 96436050
RA = Z$().FREEBUFF_MODE === "true"

// offset 94552942
Z$ = () => ({ ...Ox(), SystemRoot: process.env.SystemRoot, /* ... */
              FREEBUFF_MODE: "true",              // <-- literal, not process.env
              FREEBUFF_CONFIG_DIR: process.env.FREEBUFF_CONFIG_DIR, ... })
```

`Ox()` is a plain `process.env` pass-through and does not carry
`FREEBUFF_MODE`. Because the object spread comes first and `FREEBUFF_MODE:"true"`
is a later literal key, the literal always wins. `RA === true` unconditionally,
so `OP()` is always `true` and `Jv().adsEnabled` is never evaluated.

A user-visible symptom confirms this. The slash-command filter reads:

```js
// offset 99769251
jM = wM(() => { let HA = OP();
  return kgA(Qt).filter((R$) => {
    if (R$.id === "ads:enable")  return !cH && !HA;   // never listed
    if (R$.id === "ads:disable") return !cH &&  HA;   // always listed
    return !0 }) })
```

`/ads:enable` can never appear, because `HA` is permanently `true`.
`/ads:disable` is offered, writes `adsEnabled:false` to disk, prints
"Ads disabled." — and changes nothing.

The settings file does accept and echo the key back, which is exactly why the
switch looks legitimate:

```js
// offset 97841090 — the validator
if (typeof $.adsEnabled === "boolean") A.adsEnabled = $.adsEnabled;
```

Stored, displayed, never read.

### 3.3 Fetching: the ad auction

```js
// 0.1.0, offset ~99329400
async function se(H) {
  let A = Of(); if (!A) return $A.warn("[ads] No auth token available"), null
  let { adTraceContext:$, chatSessionId:L } = BA.getState(),
      _ = H.allowSponsoredRoute ? su() : null,
      f = _ ? await Re(_) : null, I = vqA()
  return { url: `${I?f5:MJ}${I?"/api/ads":"/api/v1/ads"}`,
    init: { method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${A}`, "User-Agent":n4() },
      body: JSON.stringify({ ...H.provider?{provider:H.provider}:{},
        messages: zd$(), sessionId: L, device: q2(), ... }) } }
}
```

The base URL resolves to `https://www.codebuff.com`. The request body ships the
**entire chat transcript** (`zd$()`) plus device and user-agent data to the ad
auction endpoint.

### 3.4 The engine hook

`FqA` (0.1.0 offset 99333906, from `src/hooks/use-gravity-ad.ts`) does
eligibility, 60-second polling, de-duplication, click recording, and impression
recording. Its return value is consumed once:

```js
// offset 99764278 — the only call site
{ ads:_A, responseAds:SH, requestResponseAds:eH, recordClick:MA, recordImpression:gA }
  = FqA({ enabled: !aH && (RA || !cH), provider:"gravity", inline:!0,
          surface:"cli_chat", forceStart: RA,
          inlinePlacementId:"CLI-Chat-Inline",
          slotPlacementId:"Single-Ad-Unit-1", slotPaused: ZH !== null })
```

`forceStart: RA` bypasses the startup gate, and `enabled: RA || !cH` is true
for every non-subscriber — that is, always, for a free account.

### 3.5 Rendering: the exact block

The ads reach the screen through a render context, then one splice loop.

```js
// offset 99781910 — publish into the render context
dt({ ..., responseAds: yCH(NA, SH) })
ZT({ ..., onAdClick: iA, onAdImpression: kH, onResponseAdsNeeded: XA, ... })
```

```js
// offset 99698724 — THE AD BLOCK
a = wE((O) => O.context.responseAds[A])
{ onAdClick:p, onAdImpression:C, onResponseAdsNeeded:m } = wE(...)
S = jHH(H, B)                                    // normal message nodes
F = D5H({ nodeCount: S.length })                  // how many ads fit
if (SC.useEffect(() => { if (F > 0) m(A, F) }, [F,A,m]), !a || a.length === 0)
  return V(fL, { children: S })                   // early return: no ads

let q = aqA({ eligibleCount: F, poolSize: a.length }),
    x = zVA({ nodeCount: S.length, adCount: q }), N = [], Z = 0
return S.forEach((O, n) => {
  if (N.push(O), Z < x.length && x[Z] === n) {
    let b = QqA(a, Z)
    if (b) N.push(V(ce, { ad: b, width: Math.max(20, I - TLL),
                          variant:"inline", onClick: p, onImpression: C },
                    `response-ad-${A}-${Z}`))
    Z++
  }
}), V(fL, { children: N })
```

Slot positions come from `common/src/util/response-ad-positions.ts`:

```js
function D5H(H){ let A = Math.max(1, H.step ?? 3), $ = Math.max(1, H.firstAdAfterNodes ?? 2)
  return Math.max(0, Math.floor((H.nodeCount - $ - 1) / A) + 1) }
function zVA(H){ /* ... */ for (let D=0; D<I; D++) f.push(_ - 1 + D*L); return f }
```

With the defaults, ads land at node indices **1, 4, 7, 10, …** — one box every
third rendered node.

`ce` is `src/components/ad-banner.tsx`. Its `inline` variant is a four-row
bordered box: bold headline, muted body, a `cta` button, and a clickable
domain label. `Rv.useEffect(() => { _?.(H) }, [H, _])` fires the impression
beacon on mount.

### 3.6 Eligibility

```js
// offset 99123019
HFA = (H) => ({ id:H, variant:"ai", content:"", blocks:[], timestamp:a2(),
                metadata:{ allowInlineAds: !0 } })

// offset 99332900
function _k$(H){ return Lk$(H) && H.metadata?.allowInlineAds === !0 }
```

Every AI message created during a live run is stamped `allowInlineAds: true`.
The hydration path (`AFA`) strips the flag when reloading persisted history, so
ads appear in live sessions but not in replays.

### 3.7 Other surfaces

| Surface | Trigger | Symbol |
|---|---|---|
| Waiting-room ad | last prompt contains `pr`/`merge`/`review`/… | `mqA` @99342409 |
| Dock panel | keyboard toggle | `Rf` / `use-dock-panel.ts` |
| Partner placements | placement auction | `Pk$`, `gqA` @99339544 |
| Sponsored proposals | poll + `/ads:accept` | `G5A` @99217314, 18 `sponsored-*.ts` |

All are gated on `OP()`, so the single-byte patch disables every one.

### 3.8 Endpoints

Base `https://www.codebuff.com`:

| Path | Purpose |
|---|---|
| `/api/v1/ads` | Ad auction |
| `/api/ads` | Sponsored-route auction |
| `/api/v1/ads/impression` | Impression beacon; returns `creditsGranted` |
| `/api/v1/ads/click` | Click beacon |
| `/api/v1/ads/policy` | Sponsored OS/sandbox policy |
| `/api/v1/ads/prefs` | Opt-out (sponsored proposals only) |
| `/api/v1/ads/agentic/offer` | Sponsored task offer |
| `/api/v1/ads/proposal` (+ `/{id}/{accept,state,dismiss,report,display}`) | Sponsored proposal lifecycle |

Third party: `https://zeroclick.dev/api/v2/impressions`.

---

## 4. Would removing the ad block break the CLI?

No. This is worth stating precisely, because the intuitive answer is wrong.

**The ad box is a leaf.** `ce` is referenced from three render sites, all
inside the ad subsystem. Nothing in chat, tools, streaming, or session
management imports it. Deleting the splice loop leaves `aqA`, `zVA`, `D5H`,
`QqA`, and `yCH` as dead code — not dangling references.

**No core call site reads `OP()`.** All nine call sites are ad-internal: the
sponsored-proposal poller, `FqA`'s own effects, the `NA` flag, the ad trace
context, and the slash-command filter.

**Session admission is ad-independent.** This is the decisive evidence,
because Freebuff gates CLI access server-side:

```js
// offset 96126888
sLA = "/api/v1/freebuff/session/admission"
rLA = "x-freebuff-instance-id";   dLA = "x-freebuff-model";
kLA = "x-freebuff-wallet-spend-limit";
jF  = "x-freebuff-acting-user-id"; H_A = "x-freebuff-include-unused-rate-limits";
A_A = "x-freebuff-compact-session";  $_A = "x-freebuff-multi-session";
L_A = "x-freebuff-heartbeat";        __A = "x-freebuff-takeover-instance-id";
```

Nine headers, zero ad headers. Blocking every `/api/v1/ads*` route does not
affect admission.

**The only coupling runs the other way.** `creditsGranted` is the sole
ad→economy link, and it is income: viewing ads credits the account. Suppressing
ads costs that income; it does not break anything.

**What does break:** deleting `FqA` alone, because the call site destructures
its return value and would throw `TypeError: FqA is not a function` during
render. Removing the engine requires unwinding the call site, the `setContext`
publish, the callbacks, and the render loop together.

---

## 5. Empirical verification

Patched and unpatched builds, same host, same auth, same prompt, one byte
apart:

**Unpatched** — a live ad in the transcript:

```text
╭──────────────────────────────────────────────────────────────────────╮
│ sieve - structured data from any website                        Ad   │
│ Describe what you want and sieve gives you a clean, auto-refreshed   │
│ endpoint — no brittle selectors, no babysitting.                    │
│  Learn more  scrape.usesieve.com                                    │
╰──────────────────────────────────────────────────────────────────────╯
```

**Patched** — zero matches for the same pattern.

The patched build's gate reads `wP=()=>{if(GA)return!1;return Tv()...`, and the
binary still executes (`--version` → `0.1.6`).

---

## 6. Why a byte patch rather than a network block

Blocking `www.codebuff.com/api/v1/ads*` would work but has two problems:
`www.codebuff.com` also serves the model API and session admission, so a blunt
host-level block breaks the CLI; and a path-level block needs a TLS-terminating
proxy in front of every request.

The gate is a boolean literal in plaintext. One byte, no offsets shifted, no
proxy, no network dependency, and the CLI keeps working.

---

## 7. Design lessons from building it

Two bugs were found and fixed during development. Both are now regression
tests, and both are instructive.

### 7.1 Symbol-based anchors rot on the first update

The first version anchored on the literal
`OP=()=>{if(RA)return!0;`. That worked — until the binary self-updated to 0.1.6
mid-development and the tool reported `UNKNOWN`. The gate was still there, just
named `wP`/`GA`/`Tv`.

The fix is to match the gate's *shape* with a regexp, using `[A-Za-z0-9_$]+`
for every identifier:

```go
var gateUnpatchedRe = regexp.MustCompile(
  `([A-Za-z0-9_$]+)=\(\)=>\{if\(([A-Za-z0-9_$]+)\)return!0;return [A-Za-z0-9_$]+\(\)\.adsEnabled\?\?!1\}`)
```

What survives minification is not the names but the structure: a zero-arg
arrow, a short-circuit on a build flag, and a fallback that reads
`adsEnabled`. That sequence *is* the bug, so it is the right thing to match.

### 7.4 A single exact pattern is still a single point of failure

The regexp above survives renaming but not *restructuring* — and a restructure
is exactly what a future release would produce if anyone touched this code. So
detection became a **staged ladder** rather than one pattern, with a
confidence label per rung and a cross-check on top:

| Phase | Confidence | Rationale |
|---|---|---|
| `1-exact` | certain | the known shape |
| `2-relaxed` | high | same arrow, body reordered or extended, either operand order |
| `3-hoisted` | high | `function NAME(){` instead of an arrow |
| `4-heuristic` | heuristic | `return!0` near an `adsEnabled` read, no function identified |
| `5-fixed` | certain | the opt-out is fixed upstream; use the setting, do not patch |
| `6-absent` | — | nothing matched; never touch the file |

The **flag cross-check** is the strongest single piece of evidence available.
`buildFlagRe` extracts the symbol the bundle assigns from `FREEBUFF_MODE`
(`GA=z().FREEBUFF_MODE`), and that is compared against the flag captured from
the gate. When they agree, the matched function is demonstrably the ad gate:

```console
ident   : gate=wP flag=GA  [flag confirmed = FREEBUFF_MODE symbol]
```

On a synthetic gate that tests an unrelated flag, the check correctly reports
`flagCrossChecked=false` — it discriminates rather than passing vacuously
(`TestCrossCheckRejectsUnrelatedFlag`).

**Phase 5 is the one that matters for the long run.** If Codebuff ever fixes the
opt-out, the short-circuit disappears and the setting starts working. Patching
a byte would then be wrong, so the tool detects that shape, refuses to patch,
and tells the user to set `adsEnabled:false` instead.

**When nothing matches**, the outcome is safe by construction: the file is left
untouched and `explain` prints the raw text around every `adsEnabled`
reference, which is the material needed to add a phase. That turns a future
"the tool broke" into a two-minute edit.

Verified on the real 136 MB binary across four simulated future refactors:

```text
rename       -> phase=1-exact      state=unpatched          size preserved
reorder      -> phase=2-relaxed    state=unpatched          size preserved
funcdecl     -> phase=3-hoisted    state=unpatched          size preserved
opt-out fixed-> phase=5-fixed      state=setting-respected  size preserved
```

### 7.2 Offsets must come from the matched text

The second version computed the rewrite offset from a fixed sample string:

```go
const sample = `X=()=>{if(Y)return!0;return Z().adsEnabled??!1}`
rel := bytes.Index([]byte(sample), rewriteFrom) + 1
target := matchStart + int64(rel)
```

This is wrong, because the sample's prefix length differs from the real match's:

```text
sample prefix:  X=()=>{if(Y)      11 bytes before `return`
real   prefix:  wP=()=>{if(GA)    14 bytes before `return`
```

The offset landed 3 bytes early and wrote `1` over the `n` of `return`,
producing `retur1!0;` — a syntax error in a 130 MB production binary.

Two things are worth noting about how this failed:

1. **The verifier caught it.** The post-write re-scan reported
   `verification failed: gate still reads "unknown"`, and the tool exited
   non-zero rather than declaring success.
2. **The backup made recovery trivial.** Restoring one file from a
   hash-verified copy returned the exact original.

The fix is to search for the `!0;` literal inside the bytes that were actually
matched:

```go
func rewriteOffsetInGate(matched []byte) (int, error) {
    idx := bytes.Index(matched, rewriteFrom)   // "!0;"
    if idx < 0 { return 0, fmt.Errorf(...) }
    return idx + 1, nil                        // the digit is one past "!"
}
```

Correct for any identifier length, on any build.

### 7.3 Three smaller performance/correctness fixes

**A raw regexp scan over 130 MB took 19.5 s.** Adding a rare-literal
prefilter (`.adsEnabled`, which occurs a handful of times) and evaluating
the regexp only near those hits brought it to **0.6 s**, a 32× improvement,
with no change in results. `TestEveryPhaseHasPrefilter` guards the property,
including the subtler requirement that the prefilter actually appears in the
phase's own pattern.

**The chunk-boundary de-duplication was wrong.** The scanner reads in 8 MiB
chunks with a carry window, and matches were de-duplicated with
`if abs.Start >= base`. That discards a match that legitimately *begins* in the
carry and extends into the new chunk — precisely the case the carry exists to
handle. Such a match was never reported by the previous iteration, because that
iteration's window ended before the match was complete. The fix de-duplicates
by absolute start offset in a set instead, and
`TestGateAcrossChunkBoundary` pins it.

**A stray space in phase 1's regex disabled the whole rung.** Rewriting the
ladder by hand-editing escaped Go raw strings introduced `if\( (GA)` instead of
`if\((GA)`. Every real build still classified correctly — but as *phase 2*,
"high" confidence, instead of phase 1, "certain", and the flag cross-check
silently stopped firing. Nothing was incorrect; the tool was just less certain
than it should have been, which is the hardest kind of regression to notice by
using it. `TestPhase1Exact` and `TestLadderMatrix` now assert the phase, so the
next stray space fails the build rather than quietly downgrading confidence.

**A too-narrow prefilter window broke the cross-check.** The build-flag matcher's
back window was 16 bytes, which only clears a flag name of about ten
characters. Longer names produced no match, so the cross-check returned false
for large synthetic names. The window is now 256 bytes.

**The phase-2 body matcher excluded `;` as well as braces.** Minified bodies are
dense with `return!1;` statements, so excluding the semicolon meant the
relaxed phase could never traverse a real body. Excluding only `{` and `}`
stops the match at a nested block while still running through statement
separators.

### 7.5 Heuristic matching is allowed, acting on it is not

Phase 4 will match a file that merely has an unconditional `return!0` near an
`adsEnabled` read, with no enclosing function identified. That is a genuine
false-positive risk, and the resolution is not to forbid the rung but to gate
acting on it:

- the match is labelled `heuristic`, never `certain`
- `status` prints the phase and confidence so it is never invisible
- `--strict` refuses to write, and the refusal lives in `applyPatchWith`, not
  only in the CLI, so no caller can bypass it by accident
  (`TestNonFreebuffFileRefusedByStrict`)

An old test asserted such a file would be reported `unknown`. That encoded the
pre-ladder contract, where any non-exact file was unrecognised. Under a ladder
the honest expectation is: classified as heuristic, reported as such, and
refused. The test was updated to pin that contract instead.

---

## 8. Verification recipe

Every claim in this document can be reproduced:

```bash
BIN=~/.config/manicode/freebuff

# The bundle is plaintext, so it greps.
grep -aob 'adsEnabled'            "$BIN" | head
grep -aob 'FREEBUFF_MODE:"true"'  "$BIN" | head
grep -aob 'zeroclick.dev'         "$BIN" | head

# Read any region as text.
dd if="$BIN" bs=1 skip=99234101 count=64 | fold -w 190

# Byte-level diff against a backup.
cmp -l freebuff.adstrip-backup.*.bak "$BIN"
```

And with the tool:

```bash
freebuff-adstrip status
freebuff-adstrip patch --dry-run
freebuff-adstrip doctor
```

---

## 9. Caveats

- **Self-updates revert the patch.** The launcher checksums only at download
  time. `doctor` warns when a launcher package is present.
- **A restructured gate will not match.** If Codebuff rewrites the gate's logic
  rather than renaming it, the file is reported `UNKNOWN` and left alone. That
  is deliberate: guessing would risk corrupting the install. Update the regexp
  in `patch.go` when that happens.
- **Offsets are build-specific.** Always re-derive rather than reusing a
  literal; the tool does this automatically.
- **The referral banner is not an ad.** `✦ Refer friends → earn Freebucks` is
  `src/components/freebuff-referral-banner.tsx`, is not gated on `OP()`, and
  has no advertiser, impression beacon, or click tracking. It is left in place.
- **Terms of service.** This documents and removes behaviour on a local
  installation. Comply with Freebuff/Codebuff's terms; the tool exists because
  the product ships no working opt-out.
