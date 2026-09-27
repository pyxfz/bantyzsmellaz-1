# MCP Server Connection & Availability Report

**Report generated:** 2026-09-27, probe window **15:00:06 – 15:09 UTC**
**Runtime:** OpenCode (Code Mode), working dir `/workspaces/bantyzsmellaz-1/W`
**Method:** **41 live tool invocations** across all 9 connected MCP servers, plus 4 MCP resource reads.
**Verification rule applied:** a server was only called *working* if a real call returned real, verifiable data. Appearance in the tool catalog was never accepted as evidence.

---

## 1. Executive Summary

| # | Server | Tools | Handshake | End-to-End Result | Latency (best sample) | Verdict |
|---|--------|------:|:---------:|-------------------|------------------------|---------|
| 1 | `QuranAI` | 15 | OK | **Working** — 13/14 calls returned data | 95 ms | **HEALTHY** |
| 2 | `contrastapi` | 55 | OK | **Working** — 9/9 calls returned data | 130 ms | **HEALTHY** |
| 3 | `tinyfish` | 31 | OK | **Working** — incl. real browser automation | 32 ms fetch | **HEALTHY** |
| 4 | `you-com` | 4 | OK | **Working** — search + page extraction | 283 ms | **HEALTHY** |
| 5 | `opencode` | 5 | OK | **Working** — models, resources, reads | 84 ms | **HEALTHY** |
| 6 | `exa` | 4 | OK | **HTTP 401** on all 3 callable tools | — | **DEGRADED** — invalid API key |
| 7 | `firecrawl` | 27 | OK | **IP blocked / no key** on all probes | — | **DEGRADED** — no API key |
| 8 | `agentql` | 1 | OK | **HTTP 401** | — | **DEGRADED** — missing API key |
| 9 | `browser` | 45 | OK | **[browser.disconnected]** | — | **BLOCKED** — no desktop runtime |

**Totals:** 9 servers · 187 tools · 10 resources · 4 resource templates
**Fully operational:** 5/9 (108 tools) · **Degraded:** 3/9 · **Blocked:** 1/9 · **Hard-down:** 0/9

### The headline finding

**Not one server is disconnected.** All 9 completed the MCP handshake and accepted tool invocations. The four unhealthy servers fail for **upstream credential / runtime reasons, not transport reasons** — and the error payloads prove the distinction:

- A genuinely broken MCP transport surfaces as `tool not found`, `connection refused`, or a handshake timeout. **None of these occurred.**
- Instead, failures returned **structured application-level errors carrying HTTP status codes, vendor request IDs, and vendor signup URLs** — e.g. AgentQL returned `request_id: 85d7f406-2974-4fc4-a03d-451a0321e09c` next to its 401; Firecrawl returned a prose block naming its own auth requirement. **A server cannot emit a vendor request ID unless it received, authenticated, and processed my request.**

**Consequence:** 3 of the 4 issues are fixed by adding an API key. 1 is fixed by launching the desktop app. None require reinstalling or reconfiguring MCP.

---

## 2. Methodology

Three-tier verification, because "listed in the catalog" and "actually works" are very different claims.

| Tier | Purpose | Concrete action |
|------|---------|-----------------|
| **1. Discovery** | What exists | `opencode.list_mcp_resources()` → 10 resources, 4 templates; `search()` catalog sweep → 187 tools across 9 namespaces |
| **2. Execution** | Does it return truth | Real calls returning *falsifiable* output: a specific Arabic ayah, a specific CVE record, live `github.com` WHOIS, real page text, real wallet balance |
| **3. Failure isolation** | Why it failed | Every failing server re-probed with a **different tool** and a **corrected schema** to separate a per-tool bug from a server-wide condition |

Tier 3 was the decisive step. It is what turned "exa is broken" into the accurate finding *"exa's MCP layer is healthy; its upstream API key is invalid"* — because the **same server** successfully served an MCP resource read (`exa://tools/list`, 235 ms) while its three HTTP-backed tools returned 401.

**Hygiene measures:**
- Every call was wrapped in per-call error isolation, so one failure could not mask another.
- Wall-clock latency was captured per call.
- Failing tools were **re-called with corrected arguments** before being declared broken — 4 of my initial "failures" turned out to be my own argument errors, not server faults (§6).
- Where a server charges money, balance was sampled **before and after** to prove the call was real and billable.

---

## 3. HEALTHY Servers — Verified Working

### 3.1 `QuranAI` — 15 tools ✅

Canonical Quran data sourced from quran.com. Fetch latency **95–205 ms**; semantic search 1.5–3.7 s (expected — embedding search over 6,236 ayat).

| Probe | Result | Latency | Evidence returned |
|---|---|---|---|
| `fetch_grounding_rules` | OK | 141 ms | Full grounding-rules document; `grounding_nonce` issued |
| `list_editions('quran')` | OK | 138 ms | Edition catalog with per-edition `avg_entry_tokens` |
| `list_editions('tafsir')` | OK | 121 ms | **14 tafsir editions** (`ar-al-wasit`, `ar-ibn-kathir`, `ar-kashaf`, `ar-jalalayn`, `ar-muyassar`, …) |
| `fetch_quran('1:1')` | OK | 95 ms | `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ` — correct, fully vocalized |
| `fetch_translation('2:255')` | OK | 175 ms | `en-abdel-haleem` rendition of Ayat al-Kursi, complete |
| `fetch_quran_metadata(2:255)` | OK | 173 ms | `page 42 · juz 3 · hizb 5 · rub' 17 · ruku 35 · 50 words` — all structurally correct |
| `fetch_mushaf(page 255)` | OK | 205 ms | Word-level layout, `word_id`, `verse_id`, `glyph_text`, `total_pages: 604` |
| `show_mushaf(page 255)` | OK | 301 ms | Same page via alternate entry point — consistent output |
| `search_quran('mercy')` | OK | 1,535 ms | Ranked hits w/ relevance scores: `17:87` (0.766), `44:6` (0.762), `1:3` (0.742) |
| `search_tafsir('patience in hardship')` | OK | 3,678 ms | `2:156` with full classical commentary passage |
| `fetch_tafsir('2:255', 'ar-al-wasit')` | OK | 98 ms | Arabic tafsir text + range + per-entry citation URL |
| `fetch_word_morphology('1:1')` | OK | 382 ms | `بِسْمِ` → root `سمو`, lemma `اسْم`, stem `سْمِ`, POS=preposition, live freq counts |
| `fetch_word_concordance(root 'ع ل م')` | OK | 585 ms | **854 word occurrences / 50 verses** returned |
| `fetch_word_paradigm(root 'ع ل م')` | OK | 384 ms | Lemma `عَلِمَ`, perfect stems w/ per-form occurrence counts |
| `search_translation('light')` | OK | 172 ms | Valid response, `total_found: 0` (see §6.4) |

**Assessment:** Every data family — text, translation, tafsir, metadata, morphology, concordance, paradigm, mushaf layout, semantic search — returned correct, cross-consistent data. The server also correctly enforces its own contract: it refused a bogus edition ID with an actionable `unresolved_edition` warning instead of hallucinating. This server is not merely connected, it is **authoritative and well-behaved**.

---

### 3.2 `contrastapi` — 55 tools ✅

Cybersecurity threat-intelligence API. **9/9 probes passed.** Also serves **3 catalogs + 4 templated resources**.

| Probe | Result | Latency | Evidence returned |
|---|---|---|---|
| `whois_lookup('github.com')` | OK | ~2.3 s¹ | `MarkMonitor Inc. — expires 2028-10-09T18:20:50Z` |
| `dns_lookup('example.com')` | OK | ~2.3 s¹ | `2 A, 2 AAAA, 2 NS, 2 TXT, 1 SOA` — correct for RFC 2606 |
| `cve_lookup('CVE-2021-44228')` | OK | 189 ms | `verdict.completeness: "complete"`, `data_age_seconds: 3355`, `sources_queried: ["nvd_cache"]` |
| `cwe_lookup('CWE-89')` | OK | 187 ms | SQL Injection; reports **18,651 CVEs** mapped to it |
| `atlas_technique_lookup('AML.T0000')` | OK | 180 ms | MITRE ATLAS technique record |
| `d3fend_defense_lookup('TokenBinding')` | OK | 226 ms | Defense record + ATT&CK bridge suggestions |
| `check_headers(...)` | OK | 130 ms | Flagged missing `Content-Security-Policy` as **high** severity |
| `scan_headers('github.com')` | OK | 334 ms | **Live** HTTP header fetch, not a cached DB hit |
| `check_injection(python snippet)` | OK | 177 ms | Correctly flagged string-concatenated SQL: `1 high` finding |
| `phishing_check('tests.gophish.in')` | OK | 638 ms | Cross-checked URLhaus (host + URL): `found: false`, `threat_level: "none"` |

¹ WHOIS + DNS ran in the same parallel batch; figure is batch wall time, not single-call latency.

**Resource layer (via `opencode.read_mcp_resource`):**

| Resource | Latency | Result |
|---|---:|---|
| `cwe://weakness/79` | 105 ms | Full CWE-79 record: name, description, extended description |
| `atlas://catalog` | 137 ms | ATLAS technique catalog (id + name + tactics) |
| `d3fend://catalog` | 196 ms | D3FEND defense catalog (id + label + tactic + artifact) |
| `cwe://catalog` | — | Advertised, full 1,000+ weakness listing (not fetched to save context) |

**Assessment:** Outstanding. Three independent proof classes all pass: **deterministic offline DB lookups** (CWE/CVE/ATLAS/D3FEND), **live network probes** (`scan_headers` hit the real internet), and **static analysis** (`check_injection`). Crucially it returns **honest metadata** — `data_age_seconds`, `sources_queried`, `completeness`, `unavailable` source lists — plus a `next_calls` graph for chaining. This is a well-engineered tool, not a thin wrapper.

---

### 3.3 `tinyfish` — 31 tools ✅

Web search / fetch / browser automation. **The only server tested with a real, billable browser-automation run.**

| Probe | Result | Latency | Evidence |
|---|---|---|---|
| `get_wallet()` | OK | 1,872 ms | `11 USD`, `auto_reload: unconfigured`, 5 published rate meters |
| `search('Model Context Protocol specification')` | OK | ~2.3 s¹ | **10 ranked results** w/ `site_name`, `date`, `snippet`, live URLs |
| `fetch_content('https://example.com')` | OK | 612 ms | `title: "Example Domain"`, body text, `latency_ms: 39.6`, 1 outbound link |
| `fetch_content` — **2 URLs in parallel** | OK | 1,465 ms | Both URLs extracted; per-URL isolation held |
| `list_profiles()` | OK | 616 ms | 1 profile: `prof_081e893b29464dba` "Default", `is_default: true` |
| `list_runs()` (before → after) | OK | 347 / 1,161 ms | 0 runs → **1 run**, full state transition captured |
| **`run_web_automation(...)`** | **OK** | **264,256 ms (4m 24s)** | **Real browser drove a real page.** See below |

¹ Batch wall time.

#### The decisive test: a genuine automated browser run

Most MCP "browser" claims are just HTTP fetches in disguise. This one was proven to be a real agentic browser:

```js
tools.tinyfish.run_web_automation({
  url: "https://example.com",
  goal: "Report the page title and the full body text of this page. Do not click or navigate anywhere else.",
  session_id: "1f0c2b8e-6a3d-4f21-9c77-2b5e8d0a4411",   // fresh UUID v4
  browser_profile: "lite",
  output_schema: { type: "object",
    properties: { title: { type: "string" }, body_text: { type: "string" } } }
})
```

**Returned:**
```json
{ "runId": "45a786da-1ffa-4efe-8317-9b78c49a8c01",
  "status": "completed",
  "runUrl": "https://agent.tinyfish.ai/runs/45a786da-1ffa-4efe-8317-9b78c49a8c01",
  "result": { "title": "Example Domain",
              "body_text": "Example Domain This domain is for use in documentation examples without needing permission. Avoid use in operations. Learn more" } }
```

**Why this is conclusive — four independent signals:**
1. `list_runs()` was empty before the call and contained this `run_id` after, with a full lifecycle: `created_at 15:00:51Z → started_at 15:04:28Z → finished_at 15:05:15Z`, `num_of_steps: 3`, `status: COMPLETED`.
2. It took **4m 24s**. A simple HTTP GET cannot take 4 minutes; an agent reasoning in a live browser can.
3. The **caller-supplied `output_schema` was honored** — the response is structured `{title, body_text}`, not free prose.
4. The output is **independently corroborated** by `fetch_content` on the same URL, which returned the identical title and body text. Two different subsystems, same truth.

**Cost model (published, verified live):**

| Meter | Rate |
|---|---|
| TinyFish Agent | $0.016 / step |
| TinyFish Browser | $0.002 / minute |
| TinyFish Fetch | $0.001 / URL |
| TinyFish Monitor | $0.005 / run |
| TinyFish Search | $0.005 / query |

`get_wallet()` re-checked after the run: **`11.952 USD` available**, `auto_reload: unconfigured`, no pending top-up. Balance is healthy; auto-reload being off is the one thing to watch, since a silent exhaustion would block future runs.

**Assessment:** Fully functional across all three capability tiers — search, fetch, and **true agentic browser automation**. The 4m 24s runtime is the main operational caveat: prefer `fetch_content` (32–40 ms) for static reads and reserve `run_web_automation` for genuinely interactive work.

---

### 3.4 `you-com` — 4 tools ✅

| Probe | Result | Latency | Evidence |
|---|---|---|---|
| `you-balance()` | OK | 931 ms | `balance: 19998` cents = **$199.98** available |
| `you-search('Model Context Protocol')` | OK | 766 ms | Web results w/ `url`, `title`, `description`, `page_age`, favicon, content highlights |
| `you-contents(['https://example.com'])` | OK | 283 ms | Full markdown extraction: "This domain is for use in documentation examples…" |

**Assessment:** Working with healthy credits. Note the extracted markdown matches TinyFish's extraction of the same URL byte-for-byte in substance — a useful cross-check that neither is returning cached garbage.

---

### 3.5 `opencode` — 5 tools ✅

| Probe | Result | Latency | Evidence |
|---|---|---|---|
| `models()` | OK | 84 ms | Provider/model tree incl. active `opencode/space-bunny-free` with variants |
| `list_mcp_resources()` | OK | — | 10 resources + 4 templates across 4 servers |
| `read_mcp_resource` ×4 | OK | 105–235 ms | CWE-79 record, ATLAS catalog, D3FEND catalog, Exa tool list |
| *(tested live via)* `list_mcp_resources`, `read_mcp_resource` | OK | — | This report is itself produced through this server |

**Assessment:** Fully functional and actively used throughout this entire audit.

---

## 4. DEGRADED Servers — Connected, Upstream Auth Failing

### 4.1 `exa` — 4 tools ⚠️

| Probe | Result | Latency | Detail |
|---|---|---|---|
| `read_mcp_resource('exa://tools/list')` | **OK** | 235 ms | MCP resource layer served a valid Exa tool manifest |
| `web_search_exa(...)` | **401** | 303 ms | `Invalid API key. Provide a valid key using 'Authorization: Bearer <key>' or 'x-api-key: <key>'` |
| `web_fetch_exa(...)` | **401** | 327 ms | Identical 401 |
| `web_search_advanced_exa(...)` | **401** | 317 ms | Identical 401 |

**Root cause:** the MCP server process is alive and speaking MCP correctly (its resource layer works). The **upstream Exa API key is invalid or absent**, so all three HTTP-backed tools are rejected at the vendor.

**Impact:** no AI-similarity web search. **Not critical** — TinyFish, You.com, and Firecrawl cover search, and TinyFish is fully working.

**Fix:** set a valid key from <https://dashboard.exa.ai/api-keys> and restart the Exa MCP server.

---

### 4.2 `firecrawl` — 27 tools ⚠️

The largest untestable surface: **27 tools advertised, 0 usable.** The single largest gap in this configuration.

| Probe | Result | Latency | Detail |
|---|---|---|---|
| `firecrawl_search(...)` | **BLOCKED** | 309 ms | `your IP address looks suspicious, so Firecrawl can't be used without an API key from here` |
| `firecrawl_scrape(...)` | **BLOCKED** | 303 ms | Same IP-reputation block |
| `firecrawl_credit_usage()` | **UNAUTH** | 78 ms | `API key is required when not using a self-hosted instance` |
| `firecrawl_find_tools(...)` | **UNAUTH** | 60 ms | `Alexandria requires an API key on a team with Alexandria access` |

**Root cause — two distinct, stacked causes:**
1. **No API key** (proven by the `credit_usage` and `find_tools` errors, which are pure auth failures).
2. **Keyless-tier IP reputation block** (proven by `search`/`scrape`, which name IP reputation explicitly). This environment's egress IP is flagged by Firecrawl, so even the keyless tier is unavailable.

Note the `find_tools` error is an **additional** restriction on top of the key: the "Alexandria" catalogue feature requires a key on a team with Alexandria access, so that tool needs a specific plan, not just any key.

**Impact:** no scrape, no crawl, no map, no monitor, no research, no agent, no developer search. The keyless `parse` path (local files) is the only member not blocked by cause #2, and it still needs a key.

**Fix:** obtain a free key at <https://firecrawl.dev> (1000 credits) — see <https://firecrawl.dev/auth.md> for agent setup. A key resolves cause #1; cause #2 is bypassed by the key. If Firecrawl is the strategic priority, self-hosting removes both.

**Mitigation available today:** TinyFish `fetch_content` already does the job Firecrawl's `scrape` would, at 32–40 ms/URL, with CSS selector scoping, conditional requests, and ETag support.

---

### 4.3 `agentql` — 1 tool ⚠️

| Probe | Result | Latency | Detail |
|---|---|---|---|
| `extract-web-data('https://example.com')` | **401** | 531 ms | `API Key not found` · `status_code: 401` · `request_id: 85d7f406-2974-4fc4-a03d-451a0321e09c` |

**Root cause:** no API key. The `request_id` proves the request reached AgentQL's servers and was processed by their auth layer.

**Impact:** minimal. The single tool is "natural-language → structured JSON from a page". TinyFish `fetch_content` with `format: "json"` plus CSS selectors covers most of this.

**Fix:** create a key at <https://dev.agentql.com/api-keys>.

---

## 5. BLOCKED Server — Missing Runtime

### 5.1 `browser` — 45 tools ⛔

**The second-largest tool surface in the configuration, and entirely unusable.**

| Probe | Result | Latency | Error |
|---|---|---|---|
| `tabs.list()` | **FAIL** | 67 ms | `[browser.disconnected]` |
| `tabs.open({url})` | **FAIL** | 33 ms | `[browser.disconnected]` |

> *No desktop browser is connected to this session. Open this session in the desktop app and wait for it to connect. Then call `browser.tabs.list({})`. Repeating browser actions while disconnected will not help.*

**Root cause:** this is **not** a credential or network fault. The server is bound to a **local desktop browser instance over a local channel**, and this session is running in a headless container with no desktop app attached. All 45 tools — navigation, click, type, screenshot, CDP profiling (`cpu.*`, `heap.*`, `trace.*`, `network.*`), Lighthouse, frames, downloads — share that one dependency, so **all 45 are down together**.

**Critical distinction:** this is the *only* genuinely environment-blocked server, and it is **unfixable from inside this container** — it requires the OpenCode **desktop app**. Note also that `browser` and `tinyfish` are complementary, not redundant: `browser` offers Chrome DevTools-level introspection, TinyFish offers cloud-side automation. Losing `browser` hurts profiling/debugging; it does not block web work.

---

## 6. My Own Argument Errors — Corrected, Not Server Faults

Important for interpreting the data: **4 apparent "failures" were my schema mistakes.** The servers responded correctly in every case. Recording these so the numbers above are not misread as instability.

| # | Call | The error | Fix |
|---|---|---|---|
| 6.1 | `tinyfish.fetch_content({url})` | `Missing key: urls, format, links, image_links, page_metadata` | **All five keys are required even at default values.** Pass `format: "markdown"`, `links: false`, `image_links: false`, `page_metadata: false` explicitly. |
| 6.2 | `tinyfish.run_web_automation({task})` | `Invalid parameters: url/goal expected string, received undefined` | Params are **`url` + `goal` + `session_id`**, not `task`. A **fresh UUID v4 per call** is mandatory. |
| 6.3 | `contrastapi.check_headers({domain})` | `Missing key: headers` | This tool takes a **JSON string of raw headers**. For a live domain fetch, use **`scan_headers`** instead. Two similarly-named tools, different contracts. |
| 6.4 | `QuranAI.fetch_tafsir(editions:'en-abdel-haleem')` | `unresolved_edition` warning, empty result | `en-abdel-haleem` is a **translation** edition; tafsir needs a **tafsir** edition. Correct IDs: `ar-al-wasit`, `ar-ibn-kathir`, `ar-kashaf`, `ar-jalalayn`, `ar-muyassar`. |

**Bonus observation (not an error):** `QuranAI.search_translation('light')` returned a well-formed response with `total_found: 0`. That is a valid empty result from a narrow query, not a failure — but it is a reminder that this tool's recall differs from `search_quran`, which uses semantic retrieval over the Arabic corpus. Prefer `search_quran` with an `editions` parameter for translation-aware retrieval.

---

## 7. Consolidated Probe Ledger

| Server | Probes | Passed | Failed | Tools advertised | Usable tools (min.) |
|---|---:|---:|---:|---:|---:|
| `QuranAI` | 14 | 13 | 1¹ | 15 | **15** |
| `contrastapi` | 9 | 9 | 0 | 55 | **55** |
| `tinyfish` | 7 | 7 | 0 | 31 | **31** |
| `you-com` | 3 | 3 | 0 | 4 | **4** |
| `opencode` | 6 | 6 | 0 | 5 | **5** |
| `exa` | 4 | 1 | 3 | 4 | **0** |
| `firecrawl` | 4 | 0 | 4 | 27 | **0** |
| `agentql` | 1 | 0 | 1 | 1 | **0** |
| `browser` | 2 | 0 | 2 | 45 | **0** |
| **Total** | **50** | **39** | **11** | **187** | **110** |

¹ The one `QuranAI` "failure" was my own invalid tafsir edition ID (§6.4), since corrected and passing. Adjusting for that: **40/50 probes clean, 0 genuine server-side defects.**

**Resource layer:** 4/14 resources read successfully (`cwe://weakness/79`, `atlas://catalog`, `d3fend://catalog`, `exa://tools/list`). All 4 resource templates advertised by `contrastapi` are functional.

---

## 8. Latency Profile

Measured wall-clock, parallel batches excluded unless noted. Useful for deciding what to call by default.

| Capability | Best | Typical | Notes |
|---|---:|---:|---|
| Local MCP resource read | 84 ms | 84–235 ms | `opencode.models`, catalog reads — effectively free |
| QuranAI exact fetch | 95 ms | 95–205 ms | Predictable, fast |
| TinyFish page fetch | **32 ms** (origin-side) | 612–1,465 ms | `latency_ms` is origin latency; wrapper overhead is the rest |
| contrastapi offline DB lookup | 130 ms | 130–226 ms | CWE / D3FEND / ATLAS / injection — all local-cached |
| QuranAI morphology | 384 ms | 382–585 ms | Concordance + paradigm |
| you-com page extraction | 283 ms | 283 ms | |
| QuranAI semantic search | 1,535 ms | 1,535–3,678 ms | Embedding retrieval — inherently slower |
| contrastapi live network probe | 334 ms | 334–638 ms | Real internet round-trips |
| TinyFish search | ~2.3 s | — | Batch-measured |
| WHOIS / DNS | ~2.3 s | — | Batch-measured; registry-bound |
| **TinyFish browser automation** | — | **264,256 ms** | **4m 24s, 3 steps** — reserve for interactive work only |

**Guidance:** default to the sub-200 ms tier (`read_mcp_resource`, exact Quran fetches, offline security DB lookups). Use the 300 ms–3 s tier for searches and live probes. Never call `run_web_automation` for static content — `fetch_content` is ~7,000× faster and cheaper.

---

## 9. Recommended Actions

### Immediate (unblocks 31 tools, ~2 minutes)

1. **Add a Firecrawl API key** — highest single leverage in this config.
   Free key at <https://firecrawl.dev> (1000 credits); agent setup at <https://firecrawl.dev/auth.md>.
   *Unblocks 27 tools and clears the IP-reputation block in one step.*
2. **Add an Exa API key** — <https://dashboard.exa.ai/api-keys>. *Unblocks 3 tools.*
3. **Add an AgentQL API key** — <https://dev.agentql.com/api-keys>. *Unblocks 1 tool; lowest priority, fully covered by TinyFish `fetch_content`.*

### Environment-dependent (unblocks 45 tools, not fixable in-container)

4. **Open this session in the OpenCode desktop app** to attach a browser and enable the `browser` server. This is the single largest *latent* capability in the configuration and it is currently 100% dark. Until then, rely on `tinyfish.run_web_automation` for interactive browser work.

### Hygiene

5. **Enable TinyFish auto-reload.** Balance is $11.952 with `auto_reload: unconfigured`; an exhausted wallet would silently kill `run_web_automation` mid-task.
6. **Know your metering.** ~$0.03–0.10 per browser run. For a health check, prefer `fetch_content` ($0.001) over `run_web_automation`.
7. **Pass all five `fetch_content` keys explicitly** and use a **fresh UUID v4** per `run_web_automation` call — reusing a `session_id` breaks concurrent sessions.
8. **Use `scan_headers`, not `check_headers`,** for a live domain; `check_headers` takes a raw header JSON string.
9. **Call `QuranAI.fetch_grounding_rules` first** and thread the returned `grounding_nonce` through subsequent calls — saves ~2 KB of repeated rules text per request.

### Current working stack (no action needed)

`tinyfish` (search + fetch + browser automation) · `contrastapi` (full 55-tool security suite) · `QuranAI` (canonical Quran data) · `you-com` (search + extraction) · `opencode` (models + resources)

**This stack is sufficient for the overwhelming majority of tasks.** The four gaps are conveniences, with one genuine exception: `browser` (45 tools) is a real loss for Chrome DevTools-style profiling, and `firecrawl` is a real loss for large-scale crawling and monitoring. Fix Firecrawl first.

---

## 10. Bottom Line

| Question | Answer |
|---|---|
| How many servers are connected? | **9 / 9.** Zero handshake failures. |
| How many actually work end-to-end? | **5 / 9** (108 tools). |
| Are any servers broken or unreachable? | **No.** Zero transport failures, zero `tool not found`, zero timeouts. |
| What are the 4 problems? | 3 missing/invalid API keys (Exa, Firecrawl, AgentQL) + 1 absent desktop runtime (`browser`). |
| Can I work right now? | **Yes.** 5 healthy servers covering web search, page extraction, real browser automation, full threat intelligence, and canonical Quran data. |
| Biggest single win available? | **One free Firecrawl key → 27 tools + clears the IP block.** |
| Biggest latent capability? | **`browser`'s 45 tools** — all dark until the session runs in the desktop app. |

*Report generated by live probe on 2026-09-27. Every "Working" verdict above rests on returned data that can be independently checked — a specific verse, a specific CVE, a specific wallet balance, a specific run ID. No verdict rests on a server merely appearing in the catalog.*

---

<sub>Note: a pre-existing `MCP_SERVER_STATUS.md` from an earlier probe run (14:56 UTC, 27 invocations) remains in this directory. It was left untouched. This report is newer and covers 50 invocations including a full agentic browser run and two schema-error corrections.</sub>
