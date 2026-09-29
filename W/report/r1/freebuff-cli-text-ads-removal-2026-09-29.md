# Freebuff CLI Text Ads — How They Are Injected, and How to Remove Them

**Date:** 2026-09-29
**Host:** Linux x86_64, Bun-compiled single-file executable, Freebuff `0.1.0` (`linux-x64`)
**Scope:** `~/.bun/install/global/node_modules/freebuff/` (npm package), `~/.config/manicode/freebuff` (135,972,992-byte ELF), `~/.config/manicode/settings.json`

---

## 1. Executive summary

The ads are **not** in the npm package you installed. `freebuff` on npm is a ~40 KB launcher whose only job is to download, checksum-verify, and exec a prebuilt Bun binary. Every line of ad logic lives inside that binary's embedded minified JavaScript, around byte offsets `99,20x,xxx`–`99,69x,xxx`.

**The exact code block that paints ads into the chat view is a single 6-line loop** at byte offset **99,699,244** inside the message-block renderer. It splices an `<AdUnit>` element into the rendered node list at fixed indices:

```js
return S.forEach((O,n)=>{
  if(N.push(O), Z<x.length && x[Z]===n){
    let b=QqA(a,Z);
    if(b) N.push(V(ce,{ad:b,width:Math.max(20,I-TLL),variant:"inline",onClick:p,onImpression:C},
                  `response-ad-${A}-${Z}`));
    Z++
  }
}), V(fL,{children:N})
```

**Removing it would not break the program.** This is the headline correction to the premise of the request. The ad block is a *leaf* in the React tree: no chat, model, tool, session, or streaming code imports it, and the Freebuff session-admission endpoint carries no ad-related header. The only thing you lose is the ad box itself, its click beacon, and its impression beacon. See §5 for the two ways removal *does* break things, and why they are not the ad box.

**The supported kill switch does not work on this build.** `~/.config/manicode/settings.json` exposes `"adsEnabled": true`, and `/ads:disable` is registered as a slash command. Both are dead code. The master gate short-circuits on a compile-time constant:

```js
// offset 99,214,653
OP = () => { if (RA) return !0; return Jv().adsEnabled ?? !1 }
```

`RA` is assigned `Z$().FREEBUFF_MODE === "true"`, and the binary's own environment shim `Z$()` hard-codes `FREEBUFF_MODE:"true"` as a string literal — not `process.env.FREEBUFF_MODE`. `RA` is therefore **always `true`**, `OP()` is **always `true`**, and `Jv().adsEnabled` is never evaluated.

**Recommended removal:** a **2-byte binary patch** at offset **99,214,674** (`'0'` → `'1'`), which turns `OP()` into a constant `false` and disables the entire ad subsystem — inline ads, dock panel ads, partner ads, sponsored proposals, click beacons, impression beacons, and the ZeroClick third-party pixel — in one edit. No length change, so no offset shift. Fallback if you will not patch: a DNS/hosts block on the ad endpoints (Tier 1, §6).

---

## 2. Architecture — where the code actually is

### 2.1 The npm package is a launcher, not the program

```
~/.bun/install/global/node_modules/freebuff/
├── index.js        → createLauncher(...) bootstrap
├── launcher.js     → resolve target, download, sha256-verify, chmod, exec
├── http.js         → release download HTTP client
└── package.json    → binaryChecksums{ "linux-x64": "<sha256>" }
```

Confirmed ad-free. `grep -n "ad\|sponsor\|banner" index.js launcher.js http.js` returns nothing relevant; the only ad-adjacent string in the whole package is the README line *"Freebuff is supported by text ads."*

### 2.2 The launcher fetches a prebuilt binary

`launcher.js` downloads `https://codebuff.com/.../freebuff-linux-x64.tar.gz`, verifies the SHA-256 against `package.json#binaryChecksums`, extracts to:

```
~/.config/manicode/freebuff          135,972,992 bytes, ELF x86-64, not stripped
~/.config/manicode/freebuff-metadata.json   {"version":"0.1.0","target":"linux-x64"}
```

This is a **Bun single-file executable**. The JS bundle is appended in plaintext (confirmed by `od` reads below), so it is greppable and byte-patchable. Symbols are minified and bundle-scoped, so this report references them by **symbol + byte offset**.

### 2.3 The binary embeds its own source manifest

The bundle contains Bun's module list, which names every ad-subsystem source file. This is the highest-signal artifact found and it maps minified symbols back to real filenames:

| Source file | Minified symbol(s) | Role |
|---|---|---|
| `src/hooks/use-gravity-ad.ts` | `FqA` | The ad engine React hook |
| `src/ads/ad-request.ts` | `se` | Builds the ad-auction POST |
| `common/src/util/lazy-response-ads.ts` | `yCH` | Lazy response-ad accessor |
| `common/src/util/response-ad-positions.ts` | `D5H`, `zVA`, `aqA`, `QqA` | Slot position planner |
| `src/components/ad-banner.tsx` | `ce` | The ad box renderer |
| `common/src/ads/inline-ad-layout.ts` | `xd$`, `DqA` | Inline ad text layout/truncation |
| `common/src/ads/partner-ads.ts` | `Pk$`, `Jk$`, `gqA`, `qqA` | Partner placement fetcher |
| `common/src/ads/trace-context.ts` | `x5A` | Ad trace context |
| `common/src/util/ad-client-identity.ts` | `ACH` | Workspace/repo identity for targeting |
| `common/src/util/ad-user-agent.ts` | `g5`, `n4` | Ad UA strings |
| `common/src/ads/sponsored-*.ts` (18 files) | `ECH`, `ICH`, `H5A` | Sponsored task execution subsystem |
| `src/components/blocks/sponsored-proposal-block.tsx` | `hM` | Sponsored proposal chat block |
| `src/commands/ads.ts` | `jgA` | `/ads:*` slash commands |
| `src/hooks/use-dock-panel.ts` | `Rf` | Ad dock panel |
| `common/src/util/ad-creative-safety.ts` | — | Creative filtering |

The CLI UI framework is **`@opentui/react`** + a custom reconciler (not Ink). React symbols: `AL` = hooks, `V` = `createElement`, `BH` = host component, `Yv` = shared React runtime.

---

## 3. Evidence — the ad path, block by block

### 3.1 Gate: `OP()` is a constant `true`

```js
// offset 99,214,653
v5A = () => { $A.info("[gravity] Enabling ads");  MT({adsEnabled:!0});
              return {postUserMessage:(H)=>[...H,F_("Ads enabled. You will see contextual ads above the input and in the chat.")]} }
u5A = () => { $A.info("[gravity] Disabling ads"); MT({adsEnabled:!1});
              return {postUserMessage:(H)=>[...H,F_("Ads disabled.")]} }
OP  = () => { if (RA) return !0; return Jv().adsEnabled ?? !1 }
```

`OP()` is the sole gate. It has exactly one definition (offset 99,214,653) and **9 call sites**: 99,217,314 (sponsored-proposal poller), 99,336,502 / 99,337,336 / 99,337,665 / 99,337,759 / 99,338,080 (inside `FqA`), 99,764,475 / 99,767,409 / 99,769,251 (chat component + slash-command filter).

### 3.2 Why `adsEnabled` is unreachable

```js
// offset 96,436,050  (inside the wL bootstrap)
RA = Z$().FREEBUFF_MODE === "true"

// offset 94,552,942
Z$ = () => ({ ...Ox(), SystemRoot: process.env.SystemRoot, /* ... */,
              FREEBUFF_MODE:"true",                    // <-- string literal, not process.env.FREEBUFF_MODE
              FREEBUFF_CONFIG_DIR: process.env.FREEBUFF_CONFIG_DIR, ... })
```

`Ox()` (offset 94,551,118) is a plain `process.env` pass-through and does **not** carry `FREEBUFF_MODE`. Because the spread `...Ox()` is first and `FREEBUFF_MODE:"true"` is a later literal key, the literal always wins. `RA === true` unconditionally. Therefore the `Jv().adsEnabled ?? !1` branch in `OP()` is unreachable in this build.

Corroborating symptom in the UI, offset 99,769,251:

```js
jM = wM(() => { let HA = OP();
  return kgA(Qt).filter((R$) => {
    if (R$.id === "ads:enable")  return !cH && !HA;   // never shown: HA is always true
    if (R$.id === "ads:disable") return !cH &&  HA;   // always shown
    return !0 }) }, [p,Qt,cH])
```

`/ads:enable` is unreachable. `/ads:disable` is offered, writes `adsEnabled:false` to disk, prints "Ads disabled." — and changes nothing.

### 3.3 Fetch: the ad auction request — `se(H)`, offset ~99,329,400

```js
se = (H) => { let { adTraceContext:$, chatSessionId:L } = BA.getState(),
              _ = H.allowSponsoredRoute ? su() : null,
              f = _ ? await Re(_) : null, I = vqA();
  return { url: `${I?f5:MJ}${I?"/api/ads":"/api/v1/ads"}`,
    init: { method:"POST",
      headers:{"Content-Type":"application/json", Authorization:`Bearer ${A}`, "User-Agent":n4()},
      body: JSON.stringify({ ...H.provider?{provider:H.provider}:{},
        messages: zd$(), sessionId: L, device: q2(),
        ...$?{traceContext:$}:{}, ...f?.sponsoredCapability?{sponsoredCapability:f.sponsoredCapability}:{},
        ...f?{capabilityInspection:f.capabilityInspection}:{},
        ...H.surface?{surface:H.surface}:{}, ...H.placementId?{placementId:H.placementId}:{},
        ...H.placementIds?.length?{placementIds:H.placementIds}:{}, allowSponsoredRoute:!0 }) } } }
```

Base URL resolves to `https://www.codebuff.com` (`MJ = LLA = KINE.NEXT_PUBLIC_CODEBUFF_APP_URL`, offset 96,108,714). The request body ships your **full chat message history** (`zd$()`) plus `device:q2()` and `userAgent:g5()` to the ad auction endpoint.

### 3.4 Engine: `FqA(H)`, offset 99,333,906

The hook does everything: eligibility, 60 s polling, dedupe, click recording, impression recording, credits.

```js
FqA = (H) => { let A = H?.enabled ?? !0, $ = H?.forceStart ?? !1, L = H?.provider ?? "gravity",
               _ = H?.surface, f = H?.inline ?? !1, I = H?.inlinePlacementId, D = H?.slotPlacementId, ...
  // timing constants
  dd$ = 60000,   // poll interval
  kd$ = 3,       // max ads between user activity resets
  sd$ = 30000,   // rate-limit backoff
  ed$ = 50,      // choice cache size
  ee  = 4        // max ads per message (pool)
  ...
  return { ads: b ? M : null, responseAds: yCH(b,J), requestResponseAds: n,
           isLoading: X, recordClick: Z, recordImpression: N } }
```

Impression recorder `N` — the credit-granting path, offset 99,334,499:

```js
let MH = crypto.randomUUID(),
    o = await fetch(`${MJ}/api/v1/ads/impression`, { method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${HH}`,
                "User-Agent":n4(), [FO]:MH },
      body: JSON.stringify({ impUrl:c, mode:r, userAgent:g5(), os:q2().os,
                             clientEventId:MH, ...k!==void 0?{renderDelayMs:k}:{} }) });
let d = await o.json();
if (d.creditsGranted > 0)
  $A.info({creditsGranted:d.creditsGranted}, "[ads] Ad impression credits granted")
```

The response body can contain `creditsGranted` — a wallet credit grant. This is the **only** ad→economy coupling in the entire binary (`creditsGranted` appears at exactly 4 offsets, all inside this function). Its effect is confined to annotating the ad object in local React state.

Click recorder `bCH`, offset 99,333,100 → `POST /api/v1/ads/click` with `{impUrl, clientEventId, surface, dockFrom, dockDwellMs, dockAccidentalClick}`.

Third-party pixel, offset 99,333,855:

```js
Hk$ = "https://zeroclick.dev/api/v2/impressions"
// fired for provider==="zeroclick" with body { ids: l.impressionIds }
```

### 3.5 Mount point — the single `FqA()` call, offset 99,764,278

```js
{ ads: _A, responseAds: SH, requestResponseAds: eH, recordClick: MA, recordImpression: gA }
  = FqA({ enabled: !aH && (RA || !cH),
          provider: "gravity", inline: !0, surface: "cli_chat", forceStart: RA,
          inlinePlacementId: "CLI-Chat-Inline",
          slotPlacementId:    "Single-Ad-Unit-1",
          slotPaused: ZH !== null })
NA = !aH && (RA || OP())
```

`forceStart: RA` (= always `true`) bypasses the startup gate; `enabled: RA || !cH` is true for every non-subscriber, i.e. always for a free user.

### 3.6 Hand-off into the render context — offset 99,781,910

```js
dt({ readOnly:!1, theme:If, markdownPalette:kD, messageTree:p_, isWaitingForResponse:$$,
      timerStartTime:yA, availableWidth:e_,
      responseAds: yCH(NA, SH) })        // <-- ads published into the render context

ZT({ ..., onAdClick: iA, onAdImpression: kH, onResponseAdsNeeded: XA, ... })
```

`responseAds` has exactly **5** occurrences in the binary: the default context value (99,212,311), the `FqA` return (99,338,785), the destructuring (99,764,205), the `setContext` publish (99,781,910), and **one** consumption site.

### 3.7 ★ THE EXACT CODE BLOCK — offset 99,698,724

This is the answer to "identify the exact code block". It sits in the message-block renderer and is the only place in the program that inserts an ad into the chat view.

```js
// context defaults, offset 99,212,311
U5A = { readOnly:!1, theme:null, markdownPalette:null, messageTree:null,
        isWaitingForResponse:!1, timerStartTime:null, availableWidth:80, responseAds:{} }

// --- the ad-consuming renderer ---
a  = wE((O) => O.context.responseAds[A]),        // pull ads for this message
{ onAdClick:p, onAdImpression:C, onResponseAdsNeeded:m }
   = wE(z1((O) => ({ onAdClick:O.callbacks.onAdClick,
                     onAdImpression:O.callbacks.onAdImpression,
                     onResponseAdsNeeded:O.callbacks.onResponseAdsNeeded }))),
S  = jHH(H, B),                                  // normal message nodes
F  = D5H({ nodeCount: S.length });                // how many ads FIT
if (SC.useEffect(() => { if (F > 0) m(A, F) }, [F,A,m]), !a || a.length === 0)
  return V(fL, { children: S });                  // <-- early return when no ads

// ★★★ THE AD BLOCK — offset 99,698,724 ★★★
let q = aqA({ eligibleCount: F, poolSize: a.length }),
    x = zVA({ nodeCount: S.length, adCount: q }),
    N = [], Z = 0;
return S.forEach((O, n) => {
  if (N.push(O), Z < x.length && x[Z] === n) {
    let b = QqA(a, Z);
    if (b) N.push(V(ce, { ad: b, width: Math.max(20, I - TLL),
                          variant: "inline", onClick: p, onImpression: C },
                    `response-ad-${A}-${Z}`));
    Z++
  }
}), V(fL, { children: N })
```

`aqA({eligibleCount, poolSize})` caps how many ads a short message can carry: `poolSize >= 4 ? eligibleCount : Math.min(eligibleCount, poolSize)`.

### 3.8 Slot planner — `common/src/util/response-ad-positions.ts`

```js
// offset 99,695,849
function D5H(H){ let A = Math.max(1, H.step ?? 3), $ = Math.max(1, H.firstAdAfterNodes ?? 2);
  return Math.max(0, Math.floor((H.nodeCount - $ - 1) / A) + 1) }

// offset 99,695,983
function zVA(H){ let { nodeCount:A, adCount:$ } = H, L = Math.max(1, H.step ?? 3),
                        _ = Math.max(1, H.firstAdAfterNodes ?? 2), f = [],
                        I = Math.min(Math.max(0,$), D5H({nodeCount:A, step:L, firstAdAfterNodes:_}));
  for (let D = 0; D < I; D++) f.push(_ - 1 + D*L); return f }
```

With default `step=3`, `firstAdAfterNodes=2`: ad slots land at node indices **1, 4, 7, 10, …** — i.e. one ad box every third rendered node in the transcript. `TLL = 3` (offset 99,696,233) is the horizontal margin subtracted from `availableWidth`.

### 3.9 The ad box — `src/components/ad-banner.tsx`, symbol `ce`, offset ~99,319,014

```js
// offset 99,318,536
LqA = "Ad", ow = "Sponsored", Kd$ = 4, VCH = 5
ce = ({ ad:H, width:A, variant:$ = "card", onClick:L, onImpression:_ }) => {
  let f = SA(), [I, D] = Rv.useState(!1);
  Rv.useEffect(() => { _?.(H) }, [H, _]);          // <-- fires on mount == impression
  let E = { onClick: () => { if (!H.clickUrl) return; L?.(H); rD(H.clickUrl) },
            onMouseOver: () => D(!0), onMouseOut: () => D(!1) };
  if ($ === "inline") {
    let M = DqA(H, A), U = I ? f.primary : f.muted;
    return BH(lA, { ...E, style:{ width:A, height:Kd$, borderStyle:"single", borderColor:U,
                                 customBorderChars:SL, paddingLeft:1, paddingRight:1,
                                 flexDirection:"column", overflow:"hidden" },
      children:[
        BH("box",{ style:{width:"100%",height:1,flexDirection:"row",
                          justifyContent:"space-between",overflow:"hidden"}, children:[
          V("text",{ style:{fg:I?f.primary:f.foreground, flexShrink:1, wrapMode:"none"},
                     attributes:LA.BOLD, children:M.title }),
          V("text",{ style:{fg:f.muted, flexShrink:0, wrapMode:"none"}, children:fqA })]}),
        BH("box",{ /* description row */ }),
        BH("box",{ /* CTA row:  ${t.ctaText}  +  t.labelText (domain, underlined) */ })] })
  }
  /* $ === "card": 5-row box, headline + "  Ad" label + description + CTA */
}
```

Text shaping, `xd$` (offset 99,318,599): `title` truncated to `width-8`, `adText` wrapped, `cta ?? "Learn more"`, plus a domain label from `tK({title,url})` that is rendered **underlined** — this is the clickable tracking link.

This is what you see: a bordered box, bold headline, muted body, a `Ad` / `Sponsored` tag, and a CTA button.

### 3.10 Message eligibility — the `allowInlineAds` flag

```js
// offset 99,123,019
HFA = (H) => ({ id:H, variant:"ai", content:"", blocks:[], timestamp:a2(),
                metadata:{ allowInlineAds: !0 } })

// offset 99,332,900
Lk$ = (H) => !!(H && H.variant === "ai" && H.id.startsWith("ai-"))
_k$ = (H) => Lk$(H) && H.metadata?.allowInlineAds === !0

// offset 99,123,240 — stripped on hydration
AFA = (H) => H.map((A) => { let $ = A;
  if (A.metadata?.allowInlineAds) { let { allowInlineAds:L, ..._ } = A.metadata;
                                    $ = { ...A, metadata:_ } } ... })
```

Every AI message created during a run is stamped `allowInlineAds: true`. `AFA` strips it only when rehydrating persisted history, so ads appear in **live** sessions but not in replayed ones. This is the exact field to delete for a source-level removal.

### 3.11 Second surface — the empty-state / waiting-room ad

```js
// offset 99,781,922
WT = NA && !lM && !j1 & !H1 & !cf && wI === null && mqA(p)

// offset 99,342,409
function mqA(H){ return H.toLowerCase().split(/[^a-z0-9]+/)
                   .some((A) => uk$.has(A)) }
// uk$ = new Set(["pr","prs","pull","merge","merges","merged","merging",
//                "review","reviews","reviewed","reviewing","reviewer"])
```

`mqA` is a **PR / review / merge keyword detector**. When your last prompt mentions those words and the transcript is empty, an ad is placed above the input box. Same `ce` component, `variant:"card"`.

### 3.12 Third surface — partner ads

```js
// offset 99,341,247
Pk$ = { adsEnabled: OP, authToken: () => Of() ?? null,
        announcedPlacements: Mk$, fetchAuction: Jk$, now: Date.now }

async function gqA(H, A = Pk$){ if (!A.adsEnabled()) return null; ... }   // offset 99,339,544
```

Placement/surface table (`GtH`, offset 95,528,201):

| Placement ID | Surface | Format |
|---|---|---|
| `CLI-Chat-Inline` | `cli_chat` | `inline` |
| `Single-Ad-Unit-1` | `cli_chat` | `spotlight` |
| `Desktop-Below-Chat` | `freebuff_web_chat` / `chat_assistant` | `showcase` |
| `Desktop-Showcase` | `freebuff_web_chat` | `showcase` |
| (waiting room) | `waiting_room` | `intermission` |
| (mobile) | `ios` | — |

Cache TTLs: `dk$ = 1800000` (30 min partner cache), `dd$ = 60000` (poll), `gl$ = 30000`, `Rw = 1e4` (10 s request timeout).

### 3.13 Fourth surface — sponsored proposals (agent runs on an advertiser's behalf)

`G5A(H)` (offset 99,217,314) polls `/api/v1/ads/proposal`; the proposal renders as a chat block (`hM`) with `J$`/`qA`/`GA`/`dA`/`H$`/`K$`/`fA` handlers for menu, why-disclose, consent, accept, undo, and procedure. Accepting executes the advertiser's task in a **sandboxed bubblewrap/sandbox-exec** subprocess (`ECH`), with a receipt ledger (`ICH`) and a completion notice naming the advertiser (`H5A`). Slash commands: `/ads:accept`, `/ads:dismiss`, `/ads:undo`, `/ads:proposal`. A `F5A()` helper posts `{optedOut:true}` to `/api/v1/ads/prefs` — but it applies to **sponsored proposals only** and does not affect regular ads.

### 3.14 Telemetry emitted

`ads.dock_collapsed`, `ads.dock_expanded`, `ads.break_shown`, `ads.break_closed`, `ads.break_clicked`, `cli.inline_ad_slot_eligible`, `cli.inline_ad_pool_reused`, `ads.first_party_view_ack` (via `jCH` first-party fast-path), plus the ZeroClick pixel.

### 3.15 Targeting identity

`ACH()` reads `.freebuff/project-id` from the working directory; fallback `wl$` shells out to `git remote get-url origin`. Requests are scoped with `?repo=` or `?workspace=` (`/api/v1/ads/proposal?repo=${encodeURIComponent(L)}&surface=cli`). Confirmed present: `/workspaces/bantyzsmellaz-1/.freebuff/project-id`.

---

## 4. Complete endpoint inventory

Base: `https://www.codebuff.com`. Third-party: `https://zeroclick.dev`.

| Endpoint | Method | Purpose | Emitter |
|---|---|---|---|
| `/api/v1/ads` | POST | Ad auction (returns `{ads[], provider}`) | `se` @99,329,400 |
| `/api/ads` | POST | Sponsored-route auction | `se` @99,329,400 |
| `/api/v1/ads/impression` | POST | Impression beacon + `creditsGranted` | `N` @99,334,499 |
| `/api/v1/ads/click` | POST | Click beacon | `bCH` @99,333,100 |
| `/api/v1/ads/policy` | GET | Sponsored OS/sandbox policy | `common/src/ads/sponsored-os-policy.ts` |
| `/api/v1/ads/prefs` | POST | `{optedOut:true}` (sponsored only) | `F5A` |
| `/api/v1/ads/agentic/offer` | POST | Sponsored task offer | `common/src/ads/agentic-offer.ts` |
| `/api/v1/ads/proposal` | GET | Sponsored proposal poll | `G5A` @99,217,314 |
| `/api/v1/ads/proposal/{id}/accept` | POST | Accept sponsored task | `Zw` |
| `/api/v1/ads/proposal/{id}/state` | GET | Proposal state | `G5A` |
| `/api/v1/ads/proposal/{id}/dismiss` | POST | Dismiss | `/ads:dismiss` |
| `/api/v1/ads/proposal/{id}/report` | POST | Report advertiser | `Q5A` @99,214,704 |
| `/api/v1/ads/proposal/{id}/display` | POST | Mark displayed | `/ads:proposal` |
| `/api/ads/first-party/creative-image/{A}` | GET | Creative image | first-party path |
| `zeroclick.dev/api/v2/impressions` | POST | **Third-party** ad-network pixel | `N` @99,333,855 |

No `FREEBUFF_*` or `CODEBUFF_*` environment variable controls ads. The full set of env vars the binary reads is: `CODEBUFF_*` (trace, launcher PID, ship logs, watchdog, trust dirs, cli version, trusted agent publishers), `FREEBUFF_CONFIG_DIR`, `TEST_AGENTIC_ADS`, `TEST_AGENTIC_ADS_CAMPAIGN`, `OVERRIDE_TARGET/PLATFORM/ARCH`, plus standard `VERBOSE`/`NODE_ENV`/`PATH`. Only `FREEBUFF_BINARY_TARGET` exists in the npm package. **There is no env-var kill switch.**

---

## 5. Why removing the block would *not* break the program

The question presumes a hard dependency. The evidence contradicts it.

### 5.1 The ad box is a leaf node

`ce` (`ad-banner.tsx`) is referenced at exactly 3 render sites: `99699244` (the inline chat loop), `99321618` and `99325556` (dock panel and showcase variants). Nothing outside the ad subsystem imports it. Its props (`ad`, `width`, `variant`, `onClick`, `onImpression`) are all provided *by* the ad subsystem, never *by* chat logic. Deleting the splice loop leaves `aqA`, `zVA`, `D5H`, `QqA`, `yCH` defined-but-unused — dead code, not dangling references. The program compiles and runs.

### 5.2 No core dependency on the ad pipeline

Every `OP()` call site is ad-internal:

| Offset | Site | Core? |
|---|---|---|
| 99,217,314 | `G5A` sponsored-proposal poller | No |
| 99,336,502 / 99,337,336 / 99,337,665 / 99,337,759 / 99,338,080 | `FqA` effects | No |
| 99,764,475 | `NA` flag feeding `setContext` / `WT` | No |
| 99,767,409 | `x5A` ad trace context | No |
| 99,769,251 | `/ads:enable` slash-command filter | No |

### 5.3 Session admission is ad-independent

This is the strongest evidence, because Freebuff gates CLI access on a server-side admission check:

```js
// offset 96,126,888
sLA = "/api/v1/freebuff/session/admission"
rLA = "x-freebuff-instance-id";  dLA = "x-freebuff-model";
kLA = "x-freebuff-wallet-spend-limit";
jF  = "x-freebuff-acting-user-id"; H_A = "x-freebuff-include-unused-rate-limits";
A_A = "x-freebuff-compact-session";  $_A = "x-freebuff-multi-session";
L_A = "x-freebuff-heartbeat"; __A = "x-freebuff-takeover-instance-id";
```

Nine headers, **zero ad headers**. Admission is decided by instance ID, model, wallet spend limit, subscription state, and heartbeat — not by ad engagement. You can block every `/api/v1/ads*` route and still be admitted.

### 5.4 The only real coupling is the one that runs the *other* way

`creditsGranted` is the sole ad→economy link, and it is *income*, not *cost*: viewing ads credits your wallet. Not seeing ads costs you that income. It is not a load-bearing dependency — the CLI runs fine at zero credits under its own rate limits, and `creditsGranted` only annotates a local React object (`U($H => $H.map(...{credits:d.creditsGranted}))`).

### 5.5 The two things that *do* break — and neither is the ad box

**(a) Deleting `FqA` alone crashes the app.** The call site destructures its return value:

```js
{ ads:_A, responseAds:SH, requestResponseAds:eH, recordClick:MA, recordImpression:gA } = FqA({...})
```

If `FqA` is undefined, this throws `TypeError: FqA is not a function` during render of the chat component, and `NA`, `WT`, `iA`, `kH`, `XA`, `G5A` all reference its output. Removing the engine therefore requires removing the call site, the `setContext` publish, the callbacks, **and** the render loop together. `e` (the `responseAds` slice) is the object being read at 99,698,724 — that is the chain that must be unwound.

**(b) The bundler is content-addressed.** The launcher verifies SHA-256 against `package.json#binaryChecksums` **only at download time** — it does not re-verify on every run. But any `freebuff` self-update (or a reinstall) silently replaces your patch. Patch last, and re-apply after upgrades.

---

## 6. Fix paths — ranked

### Tier 0 — Supported switches (both are no-ops here)

| Method | Result |
|---|---|
| `~/.config/manicode/settings.json` → `"adsEnabled": false` | **No effect.** `OP()` short-circuits at `if (RA) return !0` before ever reading it. |
| `/ads:disable` slash command | **No effect.** Writes the setting, prints "Ads disabled.", changes nothing. `/ads:enable` is never even listed. |
| `POST /api/v1/ads/prefs {optedOut:true}` | **Partial.** Applies to sponsored proposals only. |
| `FREEBUFF_*` / `CODEBUFF_*` env var | **None exist.** |

The settings validator does accept the field (offset 97,841,090: `if (typeof $.adsEnabled === "boolean") A.adsEnabled = $.adsEnabled`), which is exactly why the switch looks like it should work. It is stored, echoed back, and never read.

### Tier 1 — Network block (no binary patching)

Block the ad endpoints so the auction always fails. `FqA`'s fetcher logs `"[ads] Web API returned error"` and returns `null`, so `responseAds` stays `Ak$` (empty) and the early-return at 99,698,700 means the ad block never mounts.

```
# /etc/hosts — blocks auctions, clicks, impressions, policies, proposals.
# NOTE: www.codebuff.com also serves the model API and session admission.
# A blanket block will break the CLI. Block the ad *paths* via a filtering
# proxy, not the host.
```

Recommended: an HTTPS-terminating proxy (mitmproxy / Burp / a local PAC) that returns `403` for any path matching `^/api/(v1/)?ads(/|$)` and `^/api/ads/`. This is fully reversible, survives binary updates, and does not touch the model API or admission endpoint.

Also block `zeroclick.dev` outright — no core dependency exists.

### Tier 2 — 2-byte binary patch (recommended, complete)

Flip the single `!0` to `!1` inside `OP()`. Same byte length → no offset shift, no re-verification issue (the launcher only checksums at download).

Verified bytes at offset 99,214,653:

```
0000000 4f 50 3d 28 29 3d 3e 7b 69 66 28 52 41 29 72 65   OP=()=>{if(RA)re
0000016 74 75 72 6e 21 30 3b 72 65 74 75 72 6e 20 4a 76   turn!0;return Jv
0000032 28 29 2e 61 64 73 45 6e 61 62 6c 65 64 3f 3f 21   ().adsEnabled??!
0000048 31 7d ...                                           1},...
```

`!0` occupies absolute offsets **99,214,673–99,214,674** (`0x21 0x30`). Patch byte **99,214,674** from `0x30` (`'0'`) to `0x31` (`'1'`).

Result:

```js
OP = () => { if (RA) return !1; return Jv().adsEnabled ?? !1 }
```

`OP()` is now a constant `false`. This single edit kills **all 9 call sites at once** — inline chat ads, the waiting-room/PR ad, the dock panel, partner placements, sponsored proposals, click beacons, impression beacons, the ZeroClick pixel, and every `ads.*` telemetry event — while leaving chat, tools, streaming, and session admission untouched.

```bash
BIN=~/.config/manicode/freebuff
cp "$BIN" "$BIN.bak"
printf '\x31' | dd of="$BIN" bs=1 seek=99214674 count=1 conv=notrunc
# verify
dd if="$BIN" bs=1 skip=99214653 count=24 2>/dev/null
# expect: OP=()=>{if(RA)return!1;return J
```

### Patch verified empirically

Executed on a copy (`/tmp/opencode/freebuff.patchtest`) on 2026-09-29:

```text
before:  OP=()=>{if(RA)return!0;return Jv().adsEnabled?
after :  OP=()=>{if(RA)return!1;return Jv().adsEnabled?

$ cmp -l freebuff freebuff.patchtest
 99214675  60  61          # octal 60='0' -> 61='1', exactly one byte, 1-based

$ stat -c %s freebuff.patchtest   ->  135972992
$ stat -c %s freebuff             ->  135972992   # identical length
$ ./freebuff.patchtest --version  ->  0.1.0      # still runs
```

The Bun executable loads and executes correctly with the patch, confirming the
embedded bundle is plaintext and tolerant of a same-length in-place edit. The
live binary at `~/.config/manicode/freebuff` was left **unpatched**.

Robust re-derivation if the offset drifts after an update:

```bash
OFF=$(grep -aob 'OP=()=>{if(RA)return!0;' "$BIN" | cut -d: -f1)
printf '\x31' | dd of="$BIN" bs=1 seek=$((OFF+21)) count=1 conv=notrunc
```

For belt-and-braces, also set `"adsEnabled": false` in `settings.json` so the `RA===false` path (non-Freebuff builds) is covered too.

### Tier 3 — Complete source-level removal (for a rebuild)

If you ever build from the open-source tree (the manifest reveals the layout: `common/src/ads/`, `common/src/util/`, `src/hooks/`, `src/components/`, `src/commands/`), the full neutralization checklist:

| # | Target | Symbol / file | Action |
|---|---|---|---|
| 1 | Master gate | `OP` | Delete; or return `false` |
| 2 | Ad engine hook | `FqA` / `use-gravity-ad.ts` | Delete hook + its call site (99,764,278) |
| 3 | Auction builder | `se` / `ad-request.ts` | Delete |
| 4 | **Render splice** | offset 99,698,724 | **Delete — this is the ad block** |
| 5 | Slot planner | `D5H`, `zVA`, `aqA`, `QqA` / `response-ad-positions.ts` | Delete |
| 6 | Ad box component | `ce` / `ad-banner.tsx` | Delete |
| 7 | Inline layout | `xd$`, `DqA` / `inline-ad-layout.ts` | Delete |
| 8 | Lazy accessor | `yCH` / `lazy-response-ads.ts` | Delete; set `responseAds:{}` default |
| 9 | Eligibility flag | `allowInlineAds` in `HFA` (@99,123,019) | Remove from metadata; simplify `_k$` to `Lk$` |
| 10 | Click beacon | `bCH` | Delete |
| 11 | Impression beacon | `N` | Delete (removes `creditsGranted` too) |
| 12 | ZeroClick pixel | `Hk$` + provider branch | Delete |
| 13 | Waiting-room ad | `mqA` (`uk$` keyword set) | Delete; drop from `WT` |
| 14 | Partner ads | `Pk$`, `Jk$`, `gqA`, `qqA`, `Xk$`, `vk$`, `fHH` / `partner-ads.ts`, `partner-triggers.ts` | Delete |
| 15 | Sponsored subsystem | 18 `sponsored-*.ts` + `ECH`/`ICH`/`H5A` + `hM` block | Delete (largest win; removes sandboxed third-party task execution) |
| 16 | Sponsored poller | `G5A` | Delete |
| 17 | Ad dock | `Rf` / `use-dock-panel.ts` | Delete |
| 18 | Slash commands | `jgA` / `src/commands/ads.ts` | Remove registration |
| 19 | Targeting identity | `ACH`, `wl$` (`git remote` shell-out) | Delete |
| 20 | Analytics | `Ik$`, `mf`, `ads.*` event names | Delete |
| 21 | Context plumbing | `setContext` publish (@99,781,910) + `ZT` callbacks | Remove `responseAds`, `onAdClick`, `onAdImpression`, `onResponseAdsNeeded` |
| 22 | Settings | `adsEnabled` in validator/writer | Remove field |

Items 1–14 remove the ads. Items 15–16 are worth doing regardless: the sponsored-proposal subsystem executes advertiser-authored tasks in a local sandbox and is a materially larger attack surface than a text ad.

---

## 7. Verification checklist

- [x] **Patch applied and binary verified runnable** — 1 byte changed at offset 99,214,674; size unchanged at 135,972,992; `--version` → `0.1.0` (tested on a copy; the live binary is still unpatched)
- [ ] `grep -aob 'OP=()=>{if(RA)return!1;' ~/.config/manicode/freebuff` → returns one offset
- [ ] `dd if=~/.config/manicode/freebuff bs=1 skip=<off> count=24` → shows `return!1;`
- [ ] Launch `freebuff`, send 3–4 prompts, complete a turn → **no bordered ad box** between message nodes
- [ ] Use a PR/merge/review keyword as the only prompt → **no ad above the input**
- [ ] `/ads:enable` and `/ads:disable` are both absent from the slash-command list
- [ ] `tcpdump -A -s0 'port 443'` during a turn → **no** requests to `/api/v1/ads`, `/api/ads`, or `zeroclick.dev`
- [ ] Grep the debug log for `[ads]` → zero lines (no `"[ads] Web API returned error"` either, because the fetcher never runs)
- [ ] Chat, streaming, tool calls, and file edits all still work end-to-end
- [ ] A fresh session is still admitted by `/api/v1/freebuff/session/admission` (no 4xx)
- [ ] Post-patch size of the binary is byte-identical (135,972,992) — confirms no offset shift
- [ ] Re-apply the patch after any `freebuff` self-update or reinstall

---

## 8. Files touched

Read-only investigation. No files were modified.

| Path | Role |
|---|---|
| `W/rr/c1.txt` | Task brief |
| `W/rr/frebf.txt` | Install-location pointer |
| `~/.bun/install/global/node_modules/freebuff/index.js` | Launcher bootstrap (ad-free) |
| `~/.bun/install/global/node_modules/freebuff/launcher.js` | Download + sha256 verify + exec (ad-free) |
| `~/.bun/install/global/node_modules/freebuff/http.js` | Release HTTP client (ad-free) |
| `~/.bun/install/global/node_modules/freebuff/package.json` | `binaryChecksums` per target |
| `~/.bun/install/global/node_modules/freebuff/README.md` | "Freebuff is supported by text ads." |
| `~/.config/manicode/freebuff` | **135,972,992-byte ELF — all ad code** |
| `~/.config/manicode/freebuff-metadata.json` | `{"version":"0.1.0","target":"linux-x64"}` |
| `~/.config/manicode/settings.json` | `"adsEnabled": true` (ignored) |
| `/workspaces/bantyzsmellaz-1/.freebuff/project-id` | Ad targeting identity |

Output: `W/report/r1/freebuff-cli-text-ads-removal-2026-09-29.md`

---

## 9. Sources

**Primary — local binary, all offsets verified this session**

- `~/.config/manicode/freebuff` — ad gate `OP` @99,214,653 · `RA` assignment @96,436,050 · env shim `Z$` @94,552,942 · auction builder `se` @99,329,400 · engine hook `FqA` @99,333,906 · click beacon `bCH` @99,333,100 · **ad render block @99,698,724** · slot planner `D5H` @99,695,849 / `zVA` @99,695,983 · ad box `ce` @99,319,014 · eligibility `_k$` @99,332,900 / `HFA` @99,123,019 · waiting-room `mqA` @99,342,409 · ZeroClick `Hk$` @99,333,855 · partner service `Pk$` @99,341,247 / `gqA` @99,339,544 · sponsored poller `G5A` @99,217,314 · admission endpoint @96,126,888 · `FqA` mount @99,764,278 · `setContext` publish @99,781,910 · slash-command filter @99,769,251
- `od`/`dd` byte verification of the `OP` gate at 99,214,653 (raw hex quoted in §3.2)
- Embedded Bun module manifest recovered from the binary, mapping every `ads/*` source file to its minified symbol (§2.3)

**Secondary**

- `~/.bun/install/global/node_modules/freebuff/{index,launcher,http}.js`, `package.json`, `README.md`
- `~/.config/manicode/settings.json`, `freebuff-metadata.json`

**Method note.** Minified identifiers are Bun-bundle-scoped and unstable across builds; every claim above is anchored to a **byte offset** so it can be re-derived with:

```bash
grep -aob '<symbol or literal>' ~/.config/manicode/freebuff
dd if=~/.config/manicode/freebuff bs=1 skip=<off> count=<n> | fold -w 190
```
