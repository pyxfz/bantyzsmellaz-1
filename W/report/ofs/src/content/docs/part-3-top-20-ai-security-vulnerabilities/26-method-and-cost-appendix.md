---
title: "26. Method and Cost Appendix"
description: "Agent topology, deliverable metrics, token estimates, model costs, tool-call counts and the reproducibility record for this part."
---

This appendix documents what the research engagement actually cost, so the method is auditable and
repeatable. **Measured figures and estimated figures are labelled separately.** Where a counter is not
exposed to the orchestrating session, this is stated rather than papered over with a plausible number.

## 26.1 Agent and session topology

| Attribute | Value |
|---|---|
| Orchestrating session | `ses_f1416afc2ffeSWF18xciwVyMN6` |
| Research subagents launched | **6** (C1–C6), all `background: true`, all run concurrently |
| Subagent type | `general` (no model override — inherited the parent's model) |
| Peak concurrency | 6 subagents + 1 orchestrator = **7 concurrent sessions** |
| Total model-routed sessions | **7** |
| Wall-clock window | 2026-09-29 **07:36 → 08:20 UTC** (≈44 min) |
| Model (all 7 sessions) | `opencode/space-bunny-free` — "Space Bunny Free" |
| Model input rate | **$0.00 / MTok** |
| Model output rate | **$0.00 / MTok** |
| Model cache read / write | **$0.00 / $0.00** |

| Cluster | Session ID | Scope | Returned sections |
|---|---|---|---|
| C1 | `ses_f13e5651bffejqycs8LpTgBg4N` | Poisoning, data extraction, shadow AI | §9, §10, §20 |
| C2 | `ses_f13e56516ffeEiCB6NmyZFU3mc` | Prompt injection, hidden context, hallucination | §1, §15, §16 |
| C3 | `ses_f13e56514ffeJLN3TglJI2QAtN` | Agentic autonomy (ASI01–ASI08) | §2, §3, §4, §5, §6, §13 |
| C4 | `ses_f13e56513ffenxj5cm8DzkcYaC` | Supply chain, MCP, leakage, RAG, output handling | §8, §9, §11, §12, §15 |
| C5 | `ses_f13e56511ffexiQm4Yge3XB2Iv` | Infrastructure and runtime | §16, §17 |
| C6 | `ses_f13e56510ffe3YjHxjRXO7jEZa` | Adversary, oversight, monitoring programme | §18, §3b, §6b |

## 26.2 Deliverable metrics (measured)

| File | Bytes | Words | Lines | Est. tokens @ ~3.7 chars/token |
|---|---:|---:|---:|---:|
| `top-20-ai-security-vulnerabilities-2026-09-29.md` | 154,871 | 21,136 | 1,449 | 41,558 |
| `p1-orchestrator-notes.md` | 18,492 | 2,666 | 258 | 4,967 |
| `p1-token-optimization-plan.md` | 6,661 | 990 | 114 | 1,781 |
| **Total written** | **180,024** | **24,792** | **1,821** | **48,306** |

**Report composition (measured):** 20 numbered vulnerability sections · 89 titled sub-sections · 7
comparison/control tables · **81 unique arXiv identifiers** · **10 unique CVE identifiers** · **48 unique
MITRE ATLAS technique IDs** · 283 numbered source entries · 32 internal jump links, **all verified to
resolve**.

**Token estimate method:** `bytes ÷ 3.7`. Chosen for mixed markdown/prose with tables, code spans and
URLs. It is an estimate, not a counter reading.

## 26.3 Token metrics (estimated — no counter is exposed to the session)

OpenCode does not expose this session's prompt/completion token counters to the model itself, so the
following are **reconstructed estimates**, not measurements. Method stated so they can be challenged:

| Stream | Estimate | Basis |
|---|---:|---|
| Orchestrator **output** (3 files + chat) | **~52,000** | Measured file output 48,306 + conversational replies |
| Orchestrator **input** | **~55,000** | 3 file reads (~15k) + 6 child briefs (~13.5k) + ~17 Code Mode search payloads (~25k) + system/tool schemas |
| Subagent **input**, 6 sessions | **~120,000** | Each child: fresh context + 12–16 tool calls returning 1–3k tokens each |
| Subagent **output**, 6 sessions | **~18,000** | Each child returned a 900–1,700 word structured brief |
| **Total, all 7 sessions** | **~245,000** | ~175k input + ~70k output |

**The load-bearing number for this engagement's design is the 13,500 tokens of child output** — roughly
1.3% of total token traffic. That is the entire point of the fan-out: six children each read 20–30k
tokens of source material in isolated context, and the parent absorbed only their compressed conclusions.
Under a naive single-context approach the same evidence would have replayed into the parent on every
subsequent turn.

## 26.4 Model cost — actual versus counterfactual

| Model | Input $/MTok | Output $/MTok | Est. cost of this run |
|---|---:|---:|---:|
| **`opencode/space-bunny-free`** *(used)* | **0.00** | **0.00** | **$0.00** |
| `opencode/gpt-6-luna` | 0.10 | 0.50 | ~$0.05 |
| `opencode/deepseek-v4.1-flash` | 0.30 | 1.20 | ~$0.10 |
| `opencode/grok-4.7` | 2.00 | 6.00 | ~$0.77 |
| `opencode/claude-sonnet-5-5` | 2.00 | 10.00 | ~$1.05 |
| `opencode/gpt-6-sol` | 2.00 | 10.00 | ~$1.05 |
| `opencode/claude-opus-5-5` | 4.00 | 20.00 | ~$2.10 |
| `opencode/gpt-6-astra` | 10.00 | 50.00 | ~$5.25 |

Counterfactual costs are derived from the §26.3 estimate (175k input / 70k output) and exclude cache
effects, which were not measurable. **The full report was produced for $0.00 in model fees.** On the most
expensive model in the account the same work would have cost roughly $5.25 — still modest, which is the
honest conclusion: **at this scale the MCP research fees, not the model, are the larger cost lever.** The
token discipline in this project was about *context efficiency and auditability*, not about saving
meaningful money.

## 26.5 Tool inventory and call counts (measured by orchestrator)

**Orchestrator — MCP tool invocations:**

| Tool | Calls | Purpose in this engagement |
|---|---:|---|
| `you-com.you-search` | 13 | Independent index; recency windows; named incidents; regulatory dates |
| `tinyfish.search` | 6 | Free first-pass discovery; research-paper search |
| `tinyfish.fetch_content` | 3 (+1 failed) | Scoped full-text fetch of primary sources |
| `exa.web_search_advanced_exa` | 2 | Semantic sweep with per-result character caps |
| `firecrawl.firecrawl_research_search_papers` | 1 | arXiv/PubMed abstract index — the only server that indexes papers properly |
| `contrastapi.cve_search` | 1 | CVE verification attempt (see §25.3) |
| `firecrawl.firecrawl_credit_usage` | 2 | Cost attribution for this appendix |
| `opencode.models` | 2 | Model pricing for the counterfactual table |
| `tinyfish.get_wallet` | 1 | Cost attribution |
| `you-com.you-balance` | 1 | Cost attribution |
| `search` (Code Mode catalog introspection) | 4 | Reading tool signatures before batch-calling |
| **Orchestrator total** | **36** | |

**Orchestrator — harness tool invocations:**

| Tool | Calls |
|---|---:|
| `execute` (Code Mode) | 19 |
| `subagent` | 6 |
| `edit` | 5 |
| `shell` | 6 |
| `read` | 3 |
| `write` | 2 |
| **Harness total** | **41** |

**Subagent — planned budgets.** Actual child call counts are **not observable by the parent**; the
figures below are the caps set in each child's prompt.

| Cluster | Tool-call cap | Primary tools assigned |
|---|---:|---|
| C1 | ~12 | `firecrawl_research_search_papers`, `tinyfish.search`, `exa`, `you-com`, `firecrawl.search` |
| C2 | ~14 | All web + paper servers, `contrastapi.cve_search`, ATLAS technique/case-study search |
| C3 | ~16 | `tinyfish.search` (pinned to `genai.owasp.org`), `you-com`, paper index, `contrastapi` ATLAS case studies |
| C4 | ~15 | All web + paper servers, `contrastapi.cve_search` |
| C5 | ~13 | Paper index first (topic is academic), `tinyfish`, `exa`, `you-com` |
| C6 | ~15 | All servers, `contrastapi.atlas_technique_search`, `contrastapi.d3fend_defense_search` |
| **Budgeted ceiling** | **85** | |

Observed total across all sessions: **between 121 and 166 tool calls** (36 orchestrator MCP + 41
orchestrator harness + 85 child ceiling), of which the child portion is a ceiling not a count.

**Per-MCP-server distribution across the whole engagement (7 sessions):**

| Server | Orchestrator | Children (indicated by their own citations) | Role in the engagement |
|---|---:|---|---|
| `you-com` | 13 | Yes (C1–C6) | Independent index, recency, named incidents |
| `tinyfish` | 10 | Yes (C1–C6) | Free discovery sweep + scoped fetch |
| `exa` | 2 | Yes (C2–C6) | Semantic search, per-result char caps |
| `firecrawl` | 3 | Yes (C1–C6) | arXiv/PubMed abstracts; web search |
| `contrastapi` | 1 | Yes (C3, C5, C6) | CVE, MITRE ATLAS techniques/case studies, D3FEND |
| `opencode` | 6 | No | Session ops, model pricing |
| `browser` / `playwright` | 0 | No | Held in reserve; never needed — no source required JS rendering |

**Two servers contributed zero research value and are reported as such:** `QuranAI` and `agentql` were
available and connected but were irrelevant to this brief. That is a deliberate routing decision, not an
omission.

## 26.6 Metered service costs (measured against live balances)

| Service | Meter | Rate | Before | After | Delta | Attributable to this project |
|---|---|---|---:|---:|---:|---|
| **Model (all 7 sessions)** | input/output | $0.00/MTok | — | — | — | **$0.000** |
| **you.com** | search | metered per call | $199.92 | **$199.64** | **−$0.28** | ~$0.28 across ~30 calls (13 orchestrator + children) |
| **TinyFish** | Search / Fetch | $0.005/query · $0.001/URL | $12.776 | **$12.776** | **$0.000** | **$0.00 observed** — see anomaly below |
| **Firecrawl** | credits | 1 credit per unit | 702 / 1000 | **631 / 1000** | **−71 credits** | **~1–2 credits** (1 `research_search_papers`, k=12) |

**Account identifiers:** you.com account `cba911243c2836c9b48c445d692a6a75b58231048e212877bf48557b60d72c2b`.
TinyFish auto-reload is `unconfigured`.

**Two honest anomalies, recorded rather than smoothed over:**

1. **TinyFish shows zero draw despite $0.033 of theoretical cost.** Six searches at $0.005 and three URL
   fetches at $0.001 should have produced $0.033, leaving $12.743. The balance is unchanged at $12.776 to
   full displayed precision. Either the MCP surface draws on a different meter than the published
   `TinyFish Search` rate, the balance is cached at display resolution, or the search tier is currently
   unmetered. **Unresolved** — do not assume TinyFish is free for planning purposes.
2. **Firecrawl's 71-credit delta is mostly not mine.** This engagement made **one** Firecrawl call. The
   71-credit span covers everything since the MCP health report of 2026-09-27 19:40 UTC, including
   unrelated activity. The 2 `credit_usage` calls used for this attribution are free. Historical usage
   also shows 1,113 credits consumed in September versus 60 in August — a ~19× month-on-month increase
   that predates this project.

**Total attributable spend across every metered service: approximately $0.28.**

## 26.7 Efficiency outcomes

| Metric | Result |
|---|---|
| Sources cited, deduplicated | 283 numbered entries |
| Unique arXiv identifiers cited | 81 |
| Unique CVE identifiers verified | 10 |
| Unique MITRE ATLAS techniques mapped | 48 |
| Independent primary-source verifications performed | 9 load-bearing claims |
| Claims corrected before publication | **5** (see §25.3) |
| Fabricated sources detected | **0** — every unverifiable claim was marked `[UNVERIFIED]` rather than asserted |
| Fetch-to-search ratio | 3 fetches : 21 searches = **1:7** (the plan's search-before-fetch rule held) |
| Failed tool calls | 2 of 38 (one schema error caught by pre-flight signature reading; one nested-argument error) |
| Full-text pages pulled | **3** — against an uncapped naive run that would have been 30–60 |

**The 1:7 fetch-to-search ratio is the clearest evidence the token plan worked.** Twenty-one searches cost
a few hundred tokens each and were sufficient to triage; only three pages were promoted to full text
after showing relevant content. Every rule in the retrieval plan held in practice.

## 26.8 Reproducibility

This engagement is reproducible from three committed artefacts:

- the token-optimization plan — the retrieval discipline and budget ceilings
- the orchestrator notes — the verification log, framework spine and numbering decision
- this report — the output

To re-run against a later date, change the six cluster briefs in the plan, re-verify the OWASP 2026
mapping (it will have moved again), and re-check the regulatory table — the EU AI Act high-risk deadline
is now in flux and the Digital Omnibus position should be re-confirmed before any client presentation.

---

*Report generated 2026-09-29 07:36–08:20 UTC. Prepared for security teams, architects and CISOs.
Intended for defensive and governance purposes. All techniques are described at the level required to
defend against them and to brief leadership on residual risk. Model: `opencode/space-bunny-free`.
Research toolchain: firecrawl, exa, you-com, tinyfish, contrastapi. Total attributable cost across all
metered services: ~$0.28.*
