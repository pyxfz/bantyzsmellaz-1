# Project 1 — Token Optimization Plan (executed before research)

**Created:** 2026-09-29 07:36 UTC
**Task:** `/W/report/r1/p1.txt` — top-20 AI security vulnerabilities for orgs integrating AI, with
mitigations, tooling and continuous monitoring, written as a client-presentable consultant report.

---

## 1. Cost model (why the plan is needed)

A naive "read every source in full" approach on this task is ~40–60M replayed input tokens. The report
itself only needs ~15–20k tokens of synthesis. The savings therefore come from *not pulling whole
documents into a long-lived parent context*, not from writing more concisely.

## 2. Tiers of retrieval (hard rule: never skip a tier)

| Tier | Action | Token cost | When used |
|---|---|---|---|
| 0 | Local files already on disk | 0 | Baselines, prior reports in `r1/` |
| 1 | **Search snippets only** | ~1–2k / search | Source discovery + relevance triage |
| 2 | **Targeted fetch** of one page, scoped | ~4–10k / page | Only pages that survive triage |
| 3 | Full-text fetch of everything | 20k+ / page | **Never** — banned for this task |

**Rule 1 — search before fetch.** No URL is fetched until a search result has shown the page contains
relevant material. The task file requires this explicitly (item 7).

**Rule 2 — no full-text in the parent.** Deep reading happens in child sessions with a fresh context.
A child returns a compressed structured brief (~800–1,200 tokens), not a document dump. Parent context
therefore grows by ~1k per cluster instead of ~30k.

**Rule 3 — subagent fan-out, one cluster per child.** 20 vulnerabilities are grouped into 6 clusters
by stack layer. Each cluster is one child. Children never see each other's output, so there is no
quadratic context growth.

**Rule 4 — batch the network calls.** Search and fetch calls run concurrently inside Code Mode
(`Promise.all`), not serially. One round trip per cluster instead of one per source.

**Rule 5 — cap the fan-out.** `firecrawl_search limit` 8–12, `exa numResults` 6–8,
`you-search count` 5–8, `tinyfish` default page. Enough to find sources, not enough to read a
firehose.

**Rule 6 — arXiv/PubMed via the paper index, not full text.** `firecrawl_research_search_papers`
returns title + abstract + ID, which is enough to cite a paper correctly. Abstracts are never fetched
in full unless a specific numeric result is needed.

**Rule 7 — reuse, don't re-derive.** `r1/ai-security-vulnerabilities-2026-09-27.md` (OWASP LLM Top 10)
is Tier 0. Its 10 sections are the verified core; the research budget goes into the 10 *additional*
vulnerabilities and into deepening mitigations/monitoring for all 20.

**Rule 8 — one write, no rewrites.** The report is drafted once from the compressed briefs. Rewriting
the 20-section report would re-replay ~20k tokens of my own output for no new information.

## 3. MCP allocation (avoid duplicate coverage, use each server's strength)

| Server | Assigned role | Why this one |
|---|---|---|
| `firecrawl` (web) | Framework/vendor source discovery | Good at authoritative domains, `includeDomains` filters |
| `firecrawl_research_search_papers` | Academic papers (arXiv/PubMed) | Only server that indexes paper abstracts properly |
| `exa` | Semantic + recency sweep, `textMaxCharacters` cap | Native per-result char cap = built-in token guard |
| `you-com` | Corroboration, `freshness` windows, news | Independent index, catches what the others miss |
| `tinyfish` | Cheapest first-pass search, `include_domains` | Free, so used for the widest discovery sweep |
| `browser`/`playwright` | On-demand verification of dynamic pages | Only if a source is JS-rendered and fetch fails |
| `opencode` | Session/ops plumbing | Not a research source |

Deduplication rule: a source found by two servers is fetched **once**.

## 4. Cluster decomposition (research fan-out budget)

20 vulnerabilities → 6 children, sized so no child exceeds ~15 tool calls:

- **C1 Foundation model & data layer** — poisoning, backdoors/sleeper agents, training-data extraction,
  membership inference, bias/eval integrity
- **C2 Application & prompt layer** — prompt injection (direct/indirect), jailbreak, context/agent
  memory poisoning, system-prompt leakage, misinformation/hallucination
- **C3 Agentic & autonomy layer** — excessive agency, tool misuse, agent hijacking, identity/privilege
  abuse, cascading multi-agent failure, human-oversight failure
- **C4 Supply chain & integration** — model/supply chain, MCP tool poisoning, framework/plugin vulns,
  RAG/vector-store weaknesses, improper output handling
- **C5 Infrastructure & runtime** — unbounded consumption, model theft/extraction, adversarial
  examples/evasion, data-plane leakage (prompts/logs/traces), insecure fine-tuning
- **C6 Governance, detection & response** — shadow AI, AI security posture/monitoring programmes,
  incident response, EU AI Act + NIST AI RMF + ISO 42001 compliance drivers, deepfake/social
  engineering

Each child returns: vulnerability definition · mechanism · **cited evidence (CVE / paper / incident)**
· mitigations (preventive) · **continuous monitoring signals (detective, with named telemetry)** ·
tools/frameworks · residual risk.

## 5. Pre-flight checks (cheapest possible)

- [x] `date -u` — report header needs an exact timestamp, free
- [x] Local report inventory (`find -name '*.md'`) — establishes Tier-0 baseline, free
- [ ] One cheap live call per MCP to confirm the server is actually up before spending on it
- [ ] Verify tool signatures in Code Mode before batch-calling (avoids signature-error retries)

## 6. Budget ceiling

- Discovery searches: **≤ 30** total
- Fetches: **≤ 25** pages, all Tier-2 scoped
- Subagents: **≤ 7** (6 clusters + 1 verification)
- Target: parent-context growth under ~60k tokens for the whole project.

## 7. Definition of done

1. 20 numbered vulnerabilities, each with a consistent 7-field structure.
2. Every vulnerability carries at least one **authentic, checkable** source (CVE, arXiv ID, named
   framework document, or dated incident) — not a blog roundup.
3. Mitigations are concrete enough to action: config key, control name, or named product.
4. Continuous-monitoring section per vulnerability: what to log, what to alert on, what tool does it.
5. Report follows the layout of the existing `r1/*.md` files: title, metadata block, horizontal rule,
   numbered TOC with jumpable anchors, numbered sections, summary table, frameworks, sources, closing line.
6. Header carries date **and time** UTC plus the model(s) used.
7. Written to `/workspaces/bantyzsmellaz-1/W/report/r1/`.
