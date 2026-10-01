# OrcaRouter Cyber Models for Legal White-Hat Research — Bug Bounty & Authorized Red-Team Report with Custom Router + omp.sh Stack

**Date:** 2026-10-01
**Author:** Red-Team Consultancy Research
**Context:** Cost-critical evaluation for a cybersecurity researcher / bug-bounty hunter. Which cyber-focused models are most effective for legal white-hat work (bug bounty + authorized red-teaming simulating external attack, lateral movement, data exfil in a client-assigned cloud tenant), how to structure an OrcaRouter custom router using mundane + hard models, per-model legal use-cases, and best combination when driving everything through https://omp.sh/ (mid-conversation switching + advisor models that batch requests).
**Method:** Single-pass cost-optimized research, no subagents per operator constraint. Tier-0 reuse of local reports (`W/report/r1/offensive-ai-models-red-team-2026-09-28.md`, `ai-security-vulnerabilities-2026-09-27.md`, `top-20-ai-security-vulnerabilities-2026-09-29.md`, `p1-token-optimization-plan.md`). Tier-1 TinyFish search (5 queries, one batch), Tier-2 TinyFish fetch (12 pages, three batches): `orcarouter.ai/models/orca/orcacyber-zero-1.0`, `models/obsidian/qwen3.8-27b`, `providers/obsidian`, `pricing`, `solutions/adaptive-routing`, `docs.orcarouter.ai` (named routers + fallback + auto), `abliteration.ai/pricing`, `docs.abliteration.ai/models.md`, `abliteration.ai/blog/introducing-abliterated-model-large-v2`, `omp.sh/docs/advisor`, `omp.sh/docs/roles`, `omp.sh/docs/agents-and-roles`. No full-text firehose, batched calls, one draft + targeted patch (no rewrites).
**Sources:** orcarouter.ai, docs.orcarouter.ai, abliteration.ai, docs.abliteration.ai, omp.sh/docs, mastra.ai, promptfoo.dev. Live prices verified 2026-10-01.
**Scope note:** Information only. No offensive activity performed or requested. All workflows below require explicit written authorization, defined scope/dates/IPs/tenants/accounts, forbidden actions, and data-handling rules.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background: What You Asked For](#2-background-what-you-asked-for)
3. [OrcaRouter — Gateway + Native Cyber Models](#3-orcarouter--gateway--native-cyber-models)
   - 3.1 [Identity & Pricing Model](#31-identity--pricing-model)
   - 3.2 [Orca Native: orcacyber-zero-1.0](#32-orca-native-orcacyber-zero-10)
   - 3.3 [Obsidian Provider: 3 Models](#33-obsidian-provider-3-models)
   - 3.4 [Rest of the Catalog (Mundane Models)](#34-rest-of-the-catalog-mundane-models)
   - 3.5 [API & Adaptive Routing](#35-api--adaptive-routing)
   - 3.6 [Legal / Guardrails](#36-legal--guardrails)
4. [Abliteration AI — Hosted Uncensored Models (Full)](#4-abliteration-ai--hosted-uncensored-models-full)
   - 4.1 [Identity](#41-identity)
   - 4.2 [Models & Functionalities](#42-models--functionalities)
   - 4.3 [Benchmarks](#43-benchmarks)
   - 4.4 [Pricing](#44-pricing)
   - 4.5 [API](#45-api)
   - 4.6 [Legal / Ethical](#46-legal--ethical)
5. [omp.sh — Mid-Conversation Switching + Advisor Batching](#5-ompsh--mid-conversation-switching--advisor-batching)
6. [Comparison Matrix: Cyber-Focused Models for White-Hat Effectiveness](#6-comparison-matrix-cyber-focused-models-for-white-hat-effectiveness)
7. [Legal Use-Case Per Model: Bug Bounty + Authorized Red-Team](#7-legal-use-case-per-model-bug-bounty--authorized-red-team)
   - 7.1 [orcacyber-zero-1.0](#71-orcacyber-zero-10)
   - 7.2 [obsidian/Qwen3.8-27B Aggressive](#72-obsidianqwen38-27b-aggressive)
   - 7.3 [obsidian/Qwen3.6-35B-A3B](#73-obsidianqwen36-35b-a3b)
   - 7.4 [obsidian/gemma-4-26B-A4B](#74-obsidiangemma-4-26b-a4b)
   - 7.5 [Abliteration base (multimodal cheap)](#75-abliteration-base-multimodal-cheap)
   - 7.6 [Abliteration large (GLM-5.2, previous)](#76-abliteration-large-glm-52-previous)
   - 7.7 [Abliteration large-v2 (GLM-5.3, current)](#77-abliteration-large-v2-glm-53-current)
   - 7.8 [Mundane Frontier via OrcaRouter](#78-mundane-frontier-via-orcarouter)
8. [Custom Router Design: Adapted Gate with Mundane + Hard Models](#8-custom-router-design-adapted-gate-with-mundane--hard-models)
9. [Best Combination to Use with omp.sh](#9-best-combination-to-use-with-ompsh)
10. [Installation & Integration Guides](#10-installation--integration-guides)
11. [Risks, Caveats & What Not to Do](#11-risks-caveats--what-not-to-do)
12. [Sources](#12-sources)

---

## 1. Executive Summary

> **TL;DR for a cost-sensitive hunter:** Do not make the $30/M-output specialist your daily driver. Triage on **obsidian/gemma-4-26B-A4B ($0.25/$2.90)** → draft exploits/repro on **obsidian/Qwen3.8-27B ($0.40/$4.21)** or **Abliteration large-v2 ($3/$5, cached $0.30)** → prove hard cases on **orca/orcacyber-zero-1.0 ($3/$5, cached $0.30, 1M ctx, 98.07% CyberGym L1)**. OrcaRouter itself is **$0 markup, Hacker free forever**. Realistic 10M/mo at 70% input = **$10.45 obsidian/Gemma, $15.43 obsidian/Qwen3.8, $36 Zero ($26.55 cached)** vs **$50-80 Abliteration volume + $20 sub**. Route this through **omp.sh roles (smol/default/slow + Ctrl+P cycle) with advisor OFF for routine work, ON (cheap model) only for high-stakes reports.**

| Question | Answer |
|---|---|
| Most effective legal white-hat model? | **Zero-1.0** for evidence-grade vuln repro across large repos (1M/128K, function calling, gated). **Qwen3.8-Uncensored Aggressive** for uncensored bulk exploit-dev/triage at ~1/7th input cost. **Gemma-4-26B-A4B** for cheapest mundane bulk. |
| Custom router? | **Never put Zero or Obsidian on `orcarouter/auto`.** Pin them behind explicit `extra_body` fallback chains + workspace objectives (Cheapest/Balanced/Quality/Adaptive). Mundane traffic on auto; hard models only on explicit ID + approval. See §8 for copy-paste config. |
| omp.sh combo? | `smol=obsidian/gemma`, `default=obsidian/qwen3.8 or abliterated-large-v2`, `slow=orca/orcacyber-zero-1.0`, `plan=cheap frontier (e.g. claude-sonnet class via Orca)`, `advisor=cheap/fast (haiku-class), disabled by default`. Cycle with Ctrl+P, `/switch`, fallback chains. Advisor doubles cost per turn — only enable for report/IR review. |
| Loss-avoidance rule | 1M input + 200K output = **~$1.08 Gemma, ~$1.24 Qwen3.8 input-heavy, ~$14 Zero uncached, ~$6 Abliteration large-v2**. Doing bulk fuzzing on Zero/large-v2 output at $5/M is how hunters lose money. Cache, triage cheap, prove expensive. |

---

## 2. Background: What You Asked For

You listed:

- `https://www.orcarouter.ai/providers/obsidian` — Obsidian provider on OrcaRouter
- `https://www.orcarouter.ai/models/orca/orcacyber-zero-1.0` — OrcaCyber Zero
- `https://abliteration.ai/pricing` — Abliteration pricing
- `https://www.orcarouter.ai/` custom routers — how to structure an adapted/gated router with mundane + hard models across all OrcaRouter models
- `https://omp.sh/` — you switch models mid-conversation/on-the-fly and use advisor models that batch requests; assess best combination
- Constraint: you are a bug-bounty / red-team researcher; wasted spend = 100% loss. Only information requested, no offensive activity.

This report reuses Tier-0 (`offensive-ai-models-red-team-2026-09-28.md` already covers Orca vs Abliteration vs Adverserial in depth) and spends the fresh budget only on what changed: live Obsidian pricing/specs, Zero pricing/specs, adaptive-routing mechanics, Abliteration current rates, omp roles/advisor mechanics.

---

## 3. OrcaRouter — Gateway + Native Cyber Models

### 3.1 Identity & Pricing Model

- **What:** One OpenAI-compatible gateway, 200+ models, adaptive routing, load balancing, guardrails, agent firewall, observability. Verified live 2026-10-01.
- **Pricing principle:** **$0 markup on every token, every plan.** You pay provider list rate. Live catalog at `/models` = billing source. Routing fee $0.00.
- **Plans (live `/pricing`):**
  - **Hacker — Free forever:** 200+ models, auto-failover, basic dashboard, prompt versioning, 10 keys, 0% markup.
  - **Team — Custom:** Hacker + up to 10 seats, compliance enforcement & reports, unlimited keys, priority support. Old $49/mo copy is stale; page now says Custom.
  - **Enterprise — Custom:** unlimited seats, beta/hidden features, dedicated infra, 99.99% SLA, data residency, custom pricing.
- **Billing:** Top-ups + subs at provider price, per-token deduction, non-refundable, cancel end-of-period. BYOK allowed (route through your own provider key, keep unified endpoint/logging/failover).

### 3.2 Orca Native: orcacyber-zero-1.0

Live fetch `models/orca/orcacyber-zero-1.0` (2026-09-17 card):

- **ID:** `orca/orcacyber-zero-1.0`
- **Function:** Coding model post-trained for vuln analysis, vuln reproduction, red-teaming, offensive-security research. Frontier-tier in OrcaCyber Harness.
- **Benchmark (vendor):** **CyberGym Level 1 pass@1 98.07% (1,478/1,507)** from 188 OSS projects. Strongest public number in this report.
- **Specs:** 1M ctx, 128K max out, Tools + JSON + Reasoning, function calling, structured outputs, configurable reasoning.
- **Perf (7d live):** p50 TTFT 972ms, p95 5.31s, 196 tok/s, 0.59% error, 1,895M tokens/7d traffic.
- **Pricing:** **$3.00/M in, $5.00/M out, $0.30/M cache read.** Calculator: 10M/mo 70% in = **$36.00/mo ($26.55 cached).**
- **Access:** **Gated.** “Offensive-capability model · an engagement, a passkey and the terms” + Enable access button. Trusted researchers/red-teams/authorized testing only. Per-use-case approval — general chat does not queue ahead. Do not attempt to bypass with fallback chains.

### 3.3 Obsidian Provider: 3 Models

Live fetch `providers/obsidian` — exactly **3 models, max 262K, median p50 3,375ms, cheapest $0.25/M in:**

| Model ID (via OrcaRouter) | Input /M | Output /M | Ctx | Note |
|---|---|---|---|---|
| `obsidian/gemma-4-26B-A4B` | **$0.25** | **$2.90** | 262K | Cheapest obsidian. 10M/mo 70% in ≈ **$10.45/mo**. Vision+Tools+Reasoning+JSON. Quality 4/10. |
| `obsidian/qwen3.6-35B-A3B` | **$0.31** | **$4.21** | 262K | Mid. MoE-style A3B. Same caps. |
| `obsidian/Qwen3.8-27B` (Aggressive Uncensored) | **$0.40** | **$4.21** | 262K | **Lossless uncensored, aggressive, block-FP8, vision tower full precision.** Text+image+video in, text out. **Gated — security/red-team/safety researchers only.** 10M/mo 70% in ≈ **$15.43/mo**. p50 7.46s, p95 10s, 22.2 tok/s, 8.5% error, 1,974M/7d traffic. AA Coding 68.1, Intelligence 52.0, GPQA Diamond 90.5, HLE 33.9, Long-Recall 77.3, SciCode 44.7, TerminalBench v2.1 79.8. |

Qwen3.8-Aggressive detail: preserves reasoning/coding/multilingual/tool-use, removes refusals (occasional inherited disclaimer, not a refusal, content still generated). Ideal per vendor for research, security testing, red-teaming, agent dev, coding assistants. All 3 obsidian models list Vision (3), Tools (3), Reasoning (3), JSON (3).

Call shape (unchanged):

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
c.chat.completions.create(model="obsidian/Qwen3.8-27B",
  messages=[{"role":"user","content":"... authorized scope ID ..."}])
```

### 3.4 Rest of the Catalog (Mundane Models)

200+ routable dual-use frontier for code review, exploit *analysis*, patch validation, report writing (subject to upstream AUPs). Examples live on `/pricing`: `anthropic/claude-opus-4.7/4.8/5 $5/$25`, `claude-fable-5/5.1 $10/$50`, plus OpenAI/Google/DeepSeek/Qwen/Z.ai lanes. These are your **mundane** pool — cheap triage, summarization, report polish — not your gated hard pool. Use `orcarouter/auto` or `orcarouter/free` ($0 rotating: deepseek-v4-flash-free, glm-5.3-flash-free, etc.) for this lane only.

Not callable via OrcaRouter (do not misclaim): `Gemini 3.8 Flash Cyber`, `GPT-5.6-Cyber`, `MAI-Cyber-1-Flash` — Orca blog comparison only.

### 3.5 API & Adaptive Routing

- Endpoint `https://api.orcarouter.ai/v1`, keys `sk-orca-*`. OpenAI Chat/Responses/Embeddings/Images/Audio, SSE + `[DONE]`. Native Anthropic + Gemini ingress. MCP server, Dify, Vercel AI SDK, `GET /v1/models`, budgets/roles, prompt versioning/caching, guardrails + agent firewall. Self-host `OrcaRouter-Lite` (`model="auto"`, BYOK, `localhost:8000/v1`).
- **Adaptive routing (`solutions/adaptive-routing`):** Point at `orcarouter/auto`, every prompt graded then routed to model clearing your bar at lowest price. **Four objectives per workspace — Cheapest, Balanced, Quality, Adaptive (learns from your traffic, online learning from live outcomes, not frozen benchmark).** <1ms grading by default; opt-in semantic embedding costs extra embedding call. Grade + chosen model on every receipt (`x-orca-resolved-model`, `x-orca-cache: HIT/MISS`).
- **Fallback:** `extra_body={"models":[...],"route":"fallback"}`, auto: `model="orcarouter/auto"`. Health-aware balancing removes unhealthy upstreams. **Routing DSL** (June 2026 launch) enables programmable routing — use for the gated design in §8.

### 3.6 Legal / Guardrails

- ToS bans violating law, malware/stalkerware designed to harm, harassment, impersonation, limit circumvention, scraping. **Upstream AUPs bind you too.**
- Cyber gating = guardrail: Zero + Obsidian-Aggressive require engagement + passkey + terms. Unauthorized offense prohibited; authorized testing via gated path is the allowed path.
- Controls: guardrails + agent firewall all plans; Team compliance reports; Enterprise residency/audit/SLA. Trust Center maps HIPAA/PCI/GDPR/SOC2/AI Act/NIST/OWASP/ISO 27001/42001 (mapping, not audit). Regions SG/US/JP. No training on content. Outputs may be inaccurate — evaluate before reliance. Jurisdiction Singapore (SIAC).

---

## 4. Abliteration AI — Hosted Uncensored Models (Full)

Live fetch `docs.abliteration.ai/models.md` + `abliteration.ai/blog/introducing-abliterated-model-large-v2` (2026-08-29) + `abliteration.ai/pricing` on 2026-10-01. This is the third URL in your `p1.txt` — treated here as first-class, not overflow.

### 4.1 Identity

- **What:** Hosted abliterated (refusal-vector-removed) models for research, security, training-data prompts without refusal theater. Same OpenAI-compatible endpoint/key for all three — only `model` ID changes.
- **Docs entry:** `https://docs.abliteration.ai/llms.txt` is the index; `models.md` is source of truth for IDs/limits/caps (pricing page overrides older $1 copy).

### 4.2 Models & Functionalities

> `docs.abliteration.ai/models.md`: three unrestricted reasoning models — `abliterated-model` (multimodal, 256K), `abliterated-model-large-v2` (text-only, 1M, GLM-5.3), `abliterated-model-large` (text-only, 1M, GLM-5.2). All uncensored, think-before-answer by default, stream, call tools.

| Model ID | Base | Ctx / Max out | Modalities | Notes |
|---|---|---|---|---|
| `abliterated-model` | general uncensored | 262,144 / 262,134 | Text+image in | Default, only one accepting images. Large-v2/large reject images with 400. Video unsupported on all. |
| `abliterated-model-large` | GLM-5.2 abliterated + fine-tuned | 1,000,000 / 999,990 | Text-only | Previous large. Keep for reproducibility; new work uses v2. |
| `abliterated-model-large-v2` | GLM-5.3 abliterated + fine-tuned, FP8 | 1,000,000 / 999,990 | Text-only, 3 reasoning modes low/high/max | Current default large for harder reasoning/evals. |

Ctx = combined in+out budget; max out reachable only with small prompt.

**Capabilities (all three unless noted):** Chat/Responses ✓, streaming ✓, tool/function calling ✓, structured JSON/JSON-Schema ✓, reasoning-effort control ✓, disable reasoning ✓ (large-v2 maps disable → hidden low), hide reasoning ✓, reasoning trace ✓, web search ✓ ($8/1k + tokens), web fetch Anthropic-only ✓. Live list via `GET /v1/models`. See `/compatibility-matrix` for per-endpoint breakdown.

### 4.3 Benchmarks

Vendor-reported for `large-v2` on GLM-5.3 FP8 (blog 2026-08-29, chart as indicative not strictly comparable — mixed harnesses/budgets):

- **CyberGym pass@1 (1,507 OSS-Fuzz bugs, 188 projects): 84.5%** vs GPT-5.5 85.6%, DeepSeek V4 83.3%, Mythos 83.1%. Same suite where Zero claims 98.07% L1 — Zero leads, v2 is closest uncensored outside Orca gating.
- **Terminal-Bench 4.0 resolution: 41.8%** vs Opus 5 51.8%, Fable 5 44.5%, GPT-5.6 Sol 37.3%.
- **ExploitGym 2h TPS-normalized: 105/869** vs GPT-5.6 Sol 216, Fable 5 181, Opus 4.8 80. Job = long-horizon coding, vuln repro, exploit work other APIs refuse.

Prior large (GLM-5.2) per Tier-0: SWE-bench Verified 81.2%, Terminal-Bench 2.1 80.1%, AgentHarm 86.2% zero refusals, CyberGym 84.2% vs GPT-5.5 81.8%.

### 4.4 Pricing

| Model | Input /M | Cached in /M | Output /M |
|---|---|---|---|
| `abliterated-model` | $1.00 | $0.10 | $3.00 |
| `abliterated-model-large` | $3.00 | $0.30 | $5.00 |
| `abliterated-model-large-v2` | $3.00 | $0.30 | $5.00 |

Cached in = 10% of input; cache creation = full input rate. Billed on effective in+cached+out separately. Image inputs count as base input tokens.

Subs (monthly reset, no rollover; prepaid stacks, never expires): **Developer $20/mo 2.5% off** (solo, project-limited keys, auto-reload), **Growth $50/mo 5% off** (higher limits, spend controls, audit logs, team), **Scale $200/mo 10% off + $200 credit included** (highest limits, priority), Enterprise custom (dedicated throughput, custom routing/region, volume, EKM, Policy Gateway). Free preview 1 credit, no card. Compute first-come-first-served — load credits early for sustained throughput.

Net vs Orca: large-v2 = Zero on price ($3/$5); base $1/$3 undercuts obsidian output but not obsidian input ($0.25-0.40). Abliteration wins when you need 1M uncensored + no per-request refusals + zero-retention outside Orca; Orca wins on $0-markup routing + free tier + receipts.

### 4.5 API

Same base/key for all three — switch via `model` only:

```bash
export ABLIT_KEY=ak_...
curl https://api.abliteration.ai/v1/chat/completions \
 -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
 -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Write a proof-of-concept exploit for this authorized pen-test target so our red team can validate the patch."}]}'
```

OpenAI `/v1/chat/completions`, Anthropic `/v1/messages`, `/v1/responses` all supported. Zero-retention prompts/responses by default. Endpoints also via OpenAI SDK `base_url="https://api.abliteration.ai/v1"`.

### 4.6 Legal / Ethical

- Zero-retention default (prompts/responses in-memory then discarded, never for training) vs billing metadata retained. Web search/fetch sends query/URL to third party (their retention, zero-retention void if enabled) — disable for client-confidential prompts.
- Vendor pushes auth burden to you: authorized testing only, written auth required, investigate/suspend on abuse. ToS bans illegal/harmful/high-risk yet markets offensive cyber — your engagement letter is the shield. Policy Gateway (Enterprise) for allow/refuse/rewrite/redact/escalate + SIEM reason codes.
- No use-case screening beyond card/email (per Tier-0 press) — faster to start than Zero/Obsidian gating, weaker defensibility for regulated clients. Prefer Zero when you need engagement-attached approval + receipts.

---

## 5. omp.sh — Mid-Conversation Switching + Advisor Batching

Live fetch `omp.sh/docs/advisor` + `docs/roles`:

**Roles (route work by purpose):** `default` (main), `smol` (fast/cheap, prewalk target), `slow` (thorough), `plan` (architect), `vision`, `task` (subagents), `tiny`, `commit`, `designer`, `advisor`. Empty map auto-resolves from authenticated models. Pin only what must be stable.

- **Switch on the fly:** `/model` or Alt+M (persistent hub + Roles), `/switch` or Alt+P (this session only), **Ctrl+P / Shift+Ctrl+P** cycle through `cycleOrder` (default `smol → default → slow`), `--model/--smol/--slow/--plan` launch flags + `PI_SMOL_MODEL/PI_SLOW_MODEL/PI_PLAN_MODEL` env. Retry fallback chains (`retry.fallbackChains`) per role/model/provider wildcard, `fallbackRevertPolicy: cooldown-expiry`.
- **Advisor (second eyes):** Separate model reviews prompts/responses/reasoning/tool activity in background using read/grep/glob (least-privilege default; edit/write/bash/browser only if you grant — security boundary). Severities: **nit** (aside), **concern** (steer running work), **blocker** (may interrupt; throttled by `immuneTurns: 3`). Config in `~/.omp/agent/config.yml` (`modelRoles.advisor`, `advisor.enabled/syncBacklog/immuneTurns`, `tier.advisor`) + `WATCHDOG.md` (priorities) + `WATCHDOG.yml` roster (multi-specialist: Architecture/Security/Release). `/advisor`, `/advisor on/off/status/dump`, `omp -p --advisor "..."` for headless (waits for final review → longer + costlier).
- **Cost truth:** Advisor makes its own requests, billed separately; several advisors multiply usage. `syncBacklog: "1"/"3"/"5"` pauses main agent up to 30s to catch up — closest to synchronous review. **For routine edits leave it off or pick fast/cheap reviewer. For bug-bounty: OFF during recon/triage/fuzzing, ON (cheap) for final report + exploit-chain review.** Privacy: prompts/outputs/reasoning + files read go to advisor provider; multi-provider roster fans context to several vendors.

Minimal persistent setup:

```yaml
modelRoles:
  default: orcarouter/obsidian-Qwen3.8-27B  # via OrcaRouter gateway
  smol: orcarouter/obsidian-gemma-4-26B-A4B
  slow: orcarouter/orca-orcacyber-zero-1.0
  plan: anthropic/claude-sonnet-4-5:medium
  advisor: anthropic/claude-haiku-4-5
advisor:
  enabled: false  # turn on per-session with /advisor on for report review
  syncBacklog: "off"
  immuneTurns: 3
```

---

## 6. Comparison Matrix: Cyber-Focused Models for White-Hat Effectiveness

Effectiveness = can it do authorized vuln analysis/repro/tooling without refusal theater, with enough ctx + tools, at a price a bounty hunter survives.

| Feature | `orca/orcacyber-zero-1.0` | `obsidian/Qwen3.8-27B` Aggressive | `obsidian/Qwen3.6-35B-A3B` | `obsidian/gemma-4-26B-A4B` | Abliteration `large-v2` | Abliteration `large` | Abliteration `base` |
|---|---|---|---|---|---|---|---|
| Type | Native gated cyber coder | Uncensored aggressive, gated | Uncensored, gated | Uncensored balanced, cheapest | Hosted abliterated GLM-5.3 FP8 | Hosted abliterated GLM-5.2 | Hosted abliterated general |
| Ctx / out | 1M / 128K | 262K / — | 262K / — | 262K / — | 1M / 999K text-only | 1M / 999K text-only | 262K / 262K text+image |
| Caps | Tools+JSON+Reasoning, FC, structured | Vision+Tools+JSON+Reasoning | Same | Same | Tools+JSON+Reasoning low/high/max, search/fetch | Same (prev gen) | Images only here, 400 on large/v2 |
| Vendor cyber bench | **98.07% CyberGym L1** | AA 68.1 coding, 79.8 TBench | — (sibling) | — (cheapest) | **84.5% CyberGym, 41.8% TB4.0, 105 ExploitGym-2h** | 84.2% CyberGym, 81.2% SWE-bench | general |
| Price in/cached/out | $3 / $0.30 / $5 | $0.40 / — / $4.21 | $0.31 / — / $4.21 | **$0.25 / — / $2.90** | $3/$0.30/$5 | $3/$0.30/$5 | **$1/$0.10/$3** |
| 10M/mo 70% in | $36 ($26.55 cached) | $15.43 | ~$13 | **$10.45** | ~$36 + sub share | ~$36 + sub share | ~$16 + sub share |
| Gating | Engagement+passkey+terms | Researcher-gated | Researcher-gated | Researcher-gated (lighter) | Card/email only | Card/email only | Card/email only |
| Best white-hat fit | Proof-grade repro, large-repo, receipts | Bulk exploit-dev, agent loops | Cheaper draft | Cheapest triage | Bulk 1M uncensored outside Orca, max reasoning | Repro lane | Multimodal triage |

**Verdict on effectiveness:** Zero wins on proof (98% + 1M + receipts). large-v2 wins on uncensored 1M proof outside gating (84.5%). Qwen3.8 wins on uncensored bulk per dollar. Gemma/base win on mundane/multimodal cheap. No single model wins all — hence the router.

---

## 7. Legal Use-Case Per Model: Bug Bounty + Authorized Red-Team

All below assume: written auth (assets, tenant IDs, IP ranges, accounts, techniques allowed, windows, data-handling, retest), per-client keys/quotas/revocation, isolated testing, human review before execution, audit receipts. No auth = no work. Simulating external attack → lateral movement → exfil is only lawful inside the assigned tenant/scope.

### 7.1 orcacyber-zero-1.0

**Use for:** Hard vuln repro across large OSS/monorepo (1M ctx + 128K out + function calling), root-cause, patch validation, red-team tooling generation, long-context code understanding with agentic calls.
**Bug bounty:** Reproduce suspected RCE/SSRF/IDOR from diff + reachability analysis; triage 100+ files without chunk-loss; generate PoC *analysis* + remediation + CVSS rationale for report.
**Cloud-tenant red-team:** Pre-authorized IAM/policy review, attack-path reasoning (external → misconfig → privilege escalation → lateral → exfil *simulation with canary tokens, not real exfil*), detection-rule bypass analysis, Sigma/KQL draft for blue-team handoff.
**Why here not elsewhere:** Only model with 98% L1 + receipts + engagement gating — most defensible to show a client/auditor. Reserve for proof, not fuzzing.

### 7.2 obsidian/Qwen3.8-27B Aggressive

**Use for:** Uncensored bulk: exploit-dev iteration, CVE repro drafts, prompt-injection suites (direct + RAG-email/PDF exfil simulation in lab), phishing-pretext *detection* tuning, agent loops needing no refusal breaks, vision-assisted triage (screenshots).
**Bug bounty:** First-draft Nuclei/semgrep rules, fuzzer harnesses, payload mutation lists, false-positive filtering at $0.40/M in.
**Cloud-tenant:** Lab-only lateral-movement reasoning (e.g., “given this Terraform + IAM, list privilege paths, propose scoped test commands for human approval”), then hand hard path to Zero for proof.
**Caveat:** 7.46s p50 + 8.5% error + 22 tok/s — slower/flakier than Zero; use async/batch, retry with fallback to Qwen3.6/Gemma.

### 7.3 obsidian/Qwen3.6-35B-A3B

**Use for:** Cheaper draft lane when Qwen3.8 is saturated/erroring. Same 262K + tooling. $0.31/M in saves ~22% vs 3.8 on input-heavy triage.
**Bug bounty:** Dedup hunter reports, classify severity, summarize recon output before spending 3.8/Zero tokens.

### 7.4 obsidian/gemma-4-26B-A4B

**Use for:** Mundane bulk: recon summarization, subdomain/endpoint list cleanup, log-line classification, report grammar/polish, cheap vision triage. **$0.25/$2.90 = cheapest cyber-adjacent lane.**
**Bug bounty:** Run every recon file through Gemma first; only escalate interesting slices. 10M/mo ≈ $10.45 — essentially free vs bounty payout.

### 7.5 Abliteration base (multimodal cheap)

**ID:** `abliterated-model`, 262K/262K, $1/$0.10/$3. Only Abliteration model accepting images (large/v2 reject images 400).
**Bug bounty:** Screenshot triage (Burp, DevTools, cloud console), multimodal recon, cheapest Abliteration entry before escalating to 1M models. Disable web search/fetch for confidential shots.
**Cloud-tenant:** External recon image analysis → text-only handoff to large-v2/Zero for path reasoning. Keeps vision cost at $1 in vs $3 large.

### 7.6 Abliteration large (GLM-5.2, previous)

**ID:** `abliterated-model-large`, 1M/999K text-only, $3/$0.30/$5, three reasoning modes.
**Use:** Reproducibility lane — re-run older large results, compare GLM-5.2 vs 5.3 deltas. New bounty work prefers v2; keep large pinned in fallback chains only for continuity.

### 7.7 Abliteration large-v2 (GLM-5.3, current)

**ID:** `abliterated-model-large-v2`, 1M/999K text-only FP8, $3/$0.30/$5, low/high/max reasoning, 84.5% CyberGym / 41.8% TB4.0 / 105 ExploitGym-2h.
**Bug bounty:** Bulk uncensored volume outside Orca: CVE repro, exploit-dev iteration, jailbreak/prompt-injection suites (PDF/email RAG exfil in lab), synthetic phishing/harassment datasets for detector tuning (3-row preview → HF/S3), AgentHarm-style automation with max reasoning. First-come compute — preload credits.
**Cloud-tenant:** When Orca hard lane gated/delayed or need EU residency/Policy Gateway SIEM: IAM/policy attack-path reasoning, lateral-movement hypothesis + scoped human-approved test commands, Sigma/YARA/KQL drafts + IR timeline, then hand proof-grade case to Zero for receipt-backed deliverable.
**Cost control:** low reasoning for triage, high/max only for proof; structure prompts for cache reuse ($0.30 vs $3). 1M+200K ≈ $6 vs Zero $14 uncached — use v2 for bulk, Zero for evidence.

### 7.8 Mundane Frontier via OrcaRouter

**Use for:** Everything that does not need uncensored/cyber tuning: architecture planning, report writing (cyber models write reports worse per prior review), patch diff explanation, compliance mapping. Route via `orcarouter/auto` Cheapest/Balanced. Never route scope-sensitive prompts here without redaction.

---

## 8. Custom Router Design: Adapted Gate with Mundane + Hard Models

**Goal:** Mundane traffic auto-routed cheap; hard (gated cyber) traffic pinned, approved, logged, never auto-selected.

**Principles:**
1. **Never list Zero or Obsidian-Aggressive in `orcarouter/auto` candidates.** Auto = mundane only.
2. **Explicit IDs for hard models** + per-workspace keys + spend caps + `route: fallback` chains that fail closed (no silent downgrade to a refusal-heavy model that wastes tokens).
3. **Four workspace objectives:** Cheapest (recon), Balanced (draft), Quality (report), Adaptive (learn from your bounty traffic after 2-4 weeks).
4. **Receipt enforcement:** log `x-orca-resolved-model` + `x-orca-cache` + grade per call; attach to client deliverable.

**Recommended structure (3 lanes + 1 proof lane):**

```
Lane A — Mundane triage (auto, cheapest):
  model="orcarouter/auto" + objective=Cheapest
  candidates: obsidian/gemma-4-26B-A4B, qwen/qwen3.8-27b-free, deepseek-v4-flash-free, glm-5.3-flash-free
  use: recon cleanup, classify, summarize, dedupe

Lane B — Draft exploit/dev (explicit, balanced):
  model="obsidian/Qwen3.8-27B" primary
  fallback: ["obsidian/qwen3.6-35B-A3B","obsidian/gemma-4-26B-A4B"]
  use: bulk repro drafts, harness gen, injection suites

Lane C — Proof (gated, quality):
  model="orca/orcacyber-zero-1.0" primary, NO fallback (fail closed)
  requires: engagement ID + passkey + terms accepted
  use: final repro, root-cause, report-grade evidence (1M/128K)

Lane D — External uncensored overflow (optional):
  model="abliterated-model-large-v2" via api.abliteration.ai/v1
  use: when Orca hard lane gated/unavailable, or need 1M uncensored outside Orca
```

**Copy-paste OpenAI-compatible pattern:**

```python
from openai import OpenAI
orca = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")

# A — mundane auto (cheap)
triage = orca.chat.completions.create(model="orcarouter/auto",
  messages=[{"role":"user","content":"Dedupe/summarize recon ... (auth ID ...)"}],
  extra_body={"route":"auto","objective":"cheapest"})

# B — draft (explicit + fallback, never auto)
draft = orca.chat.completions.create(model="obsidian/Qwen3.8-27B",
  messages=[{"role":"user","content":"Draft CVE repro analysis ... scope ..."}],
  extra_body={"models":["obsidian/Qwen3.8-27B","obsidian/qwen3.6-35B-A3B"],"route":"fallback"})

# C — proof (pinned, no fallback)
proof = orca.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Reproduce vuln from diff ... engagement ENG-2026-10-01 ..."}])
# log proof.headers x-orca-resolved-model + x-orca-cache
```

**Routing DSL note:** If using Orca Routing DSL (June 2026), encode the same rule: `if prompt.label=="proof" → orca/orcacyber-zero-1.0; elif prompt.label=="draft" → obsidian/Qwen3.8-27B with fallback; else auto-cheapest`. Keep DSL in version control, require human label for proof lane (prevents accidental $5/M-output burn).

**Cloud-tenant simulation mapping:** External (Lane A recon + Lane B payload drafts in lab) → Lateral (Lane B path reasoning, human-approved scoped commands only) → Exfil *simulation* (canary tokens + egress-after-retrieval correlation, never real data) → Proof (Lane C) + detection rule (Lane A mundane polish). Each phase separate key + cap + revocation post-engagement.

---

## 9. Best Combination to Use with omp.sh

You switch mid-conversation (Ctrl+P, `/switch`) and batch advisor reviews — so optimize for **switch cost + advisor tax.**

**Recommended omp roles:**

| Role | Model | Why |
|---|---|---|
| `smol` | `obsidian/gemma-4-26B-A4B` ($0.25/$2.90) | Instant triage, titles, memory, cleanup. Ctrl+P start. |
| `default` | `obsidian/Qwen3.8-27B` ($0.40/$4.21) or `abliterated-model-large-v2` ($3/$5) if need 1M uncensored | Daily driver. Bulk work without refusal breaks. |
| `slow` | `orca/orcacyber-zero-1.0` ($3/$5) | Hard reasoning/repro. Switch only for proof. |
| `plan` | Cheap frontier via Orca (e.g., sonnet-class) | Architecture, bounty plan, report outline. Cyber models plan worse. |
| `vision` | `obsidian/Qwen3.8-27B` (vision kept full precision) or base abliterated | Screenshots, Burp/img triage. |
| `advisor` | Cheap/fast (haiku-class), **disabled default** | Review only. Expensive advisor on cheap main = inverted economics. |

`cycleOrder: [smol, default, slow]` — Ctrl+P forward, Shift+Ctrl+P back. `/switch` for one-off proof jump without rewriting config. `retry.fallbackChains` per role (e.g., default → gemma → free lane; slow → no fallback, fail closed).

**Advisor policy (batching tax control):**

- **Routine recon/triage/fuzzing:** `/advisor off`, `syncBacklog: "off"`. Advisor would double token burn for zero signal.
- **Exploit-chain draft review:** single Security advisor, cheap model, `tools: [read, grep, glob]`, `WATCHDOG.md` with scope IDs + forbidden actions + “require human approval before execution” + “reject uncited CVE/tenant claims”.
- **Final report/IR:** `/advisor on`, `syncBacklog: "1"` (closest to sync, ≤30s), `immuneTurns: 3`, then `/advisor off` again. Use `omp -p --advisor` only for headless report audit (expect longer + costlier run).
- **Roster example (one Security, not three):** Architecture + Release advisors are luxury for a solo bounty hunter — each multiplies cost. One Security reviewer is enough; add others only on client-billable engagements.

```yaml
# ~/.omp/agent/config.yml (minimal loss-avoiding)
modelRoles:
  default: orcarouter/obsidian-Qwen3.8-27B
  smol: orcarouter/obsidian-gemma-4-26B-A4B
  slow: orcarouter/orca-orcacyber-zero-1.0
  plan: anthropic/claude-sonnet-4-5:medium
  advisor: anthropic/claude-haiku-4-5
advisor:
  enabled: false
  syncBacklog: "off"
  immuneTurns: 3
cycleOrder: [smol, default, slow]
retry:
  modelFallback: true
  fallbackChains:
    default: [orcarouter/obsidian-gemma-4-26B-A4B, orcarouter/free]
```

**Cost math (why this order):** 1M in + 200K out ≈ **$0.83 Gemma, $1.24 Qwen3.8, $14 Zero, $6 large-v2**. Advisor ON with haiku-class (~$1-2/M blended) on a 50K-turn review ≈ +$0.10-0.30/turn — trivial on reports, fatal on 500-turn fuzz loops (→ +$50-150 unseen). Hence OFF by default.

**Starter spend:** Orca Hacker $0 + $10-30 top-up (covers ~10M Gemma/Qwen triage) + Abliteration Developer $20 only if need outside-Orca uncensored + Zero usage pay-as-prove (~$14/deep case). Total fixed **$0-20/mo + usage $10-40/mo**. Bill specialist proof as disbursement.

---

## 10. Installation & Integration Guides

### 10.1 OrcaRouter (5 min)

```bash
# 1. Sign up https://www.orcarouter.ai/ → API keys → sk-orca-...
# 2. Request access for orca/orcacyber-zero-1.0 + obsidian/Qwen3.8-27B (engagement + passkey + terms)
export ORCAROUTER_API_KEY=sk-orca-...
```

```python
from openai import OpenAI
c = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
t = c.chat.completions.create(model="obsidian/gemma-4-26B-A4B",
  messages=[{"role":"user","content":"Summarize recon ..."}])  # cheap lane
p = c.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Reproduce ... ENG-ID ..."}])  # proof lane
```

MCP: `Continuum-AI-Corp/orcarouter-mcp-server`. Lite self-host: `model="auto"`, BYOK, `localhost:8000/v1`.

### 10.2 Abliteration (all three models, 5 min)

```bash
export ABLIT_KEY=ak_...
# list live IDs
curl https://api.abliteration.ai/v1/models -H "Authorization: Bearer $ABLIT_KEY"
# base = multimodal triage ($1/$3)
curl https://api.abliteration.ai/v1/chat/completions \
 -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
 -d '{"model":"abliterated-model","messages":[{"role":"user","content":"Triage this screenshot context ..."}]}'
# large-v2 = current 1M uncensored ($3/$5, low/high/max)
curl https://api.abliteration.ai/v1/chat/completions \
 -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
 -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Hello"}]}'
# large = previous 1M (repro lane only)
# switch model field only — same base URL + key. Preload credits (first-come compute).
```

### 10.3 omp.sh (5 min)

```bash
# install per https://omp.sh/ ; login providers; then:
# edit ~/.omp/agent/config.yml with §9 roles, restart omp, check:
/model      # Roles view — verify smol/default/slow/advisor resolve
/advisor status
# per-session:
/advisor off   # routine
/advisor on    # report review only
# quick cycle: Ctrl+P / Shift+Ctrl+P ; one-off: /switch
```

---

## 11. Risks, Caveats & What Not to Do

- **Do not put gated models on auto.** `orcarouter/auto` including Zero/Qwen-Aggressive risks ungated spend + ToS breach + audit failure. Pin + approve.
- **Do not exfiltrate real data, even in “simulation.”** Use canary tokens + isolated tenant + egress allowlist. Real exfil = criminal exposure + ToS ban + bounty disqualification.
- **Do not use advisor with mutating tools (edit/write/bash/browser) on untrusted scope.** Least-privilege read/grep/glob only; retain approvals. Advisor output is review, not instruction — weigh, don’t obey blindly.
- **Do not trust vendor benchmarks as proof.** Zero 98.07% L1, Qwen AA scores, Abliteration 84.5% are vendor/self-report, small/subset/single-seed. Cite with qualifier + your own repro transcript.
- **Do not burn $5/M output on bulk.** Triage cheap (Gemma $0.25 in), draft mid (Qwen $0.40 in), prove expensive (Zero $5 out). Cache hits ($0.30) halve proof cost — structure prompts for cache reuse.
- **Latency/quality:** Qwen3.8 p50 7.46s + 8.5% error is real — batch/async + fallback required. Zero p50 0.97s is fastest proof lane.
- **Privacy:** Advisor + multi-provider roster fans prompts/reasoning/files to vendors; billing/KV-cache retained everywhere; web search/fetch voids zero-retention. Redact tenant secrets before advisor review.
- **No Trustpilot/HN signal for Zero (0 mentions/7d); Qwen-Aggressive 21 HN mentions up — hype, not proof.** No enterprise peers for Abliteration; NVIDIA Inception for Adverserial unverified (see prior report).

---

## 12. Sources

**Primary (live fetch 2026-10-01):**
1. OrcaCyber Zero 1.0 — https://www.orcarouter.ai/models/orca/orcacyber-zero-1.0 ($3/$5/$0.30, 1M/128K, 98.07% CyberGym L1)
2. Qwen3.8 27B Uncensored Aggressive — https://www.orcarouter.ai/models/obsidian/qwen3.8-27b ($0.40/$4.21, 262K)
3. Obsidian provider (3 models) — https://www.orcarouter.ai/providers/obsidian (Gemma $0.25/$2.90, Qwen3.6 $0.31/$4.21, Qwen3.8 $0.40/$4.21)
4. OrcaRouter pricing — https://www.orcarouter.ai/pricing ($0 markup, Hacker free, Team/Enterprise custom)
5. Adaptive routing — https://www.orcarouter.ai/solutions/adaptive-routing (auto/Cheapest/Balanced/Quality/Adaptive, <1ms, receipts)
6. OrcaRouter docs — https://docs.orcarouter.ai/introduction (OpenAI/Anthropic/Gemini surfaces, named routers, fallback via extra_body.models, auto cheapest-live)
7. Abliteration pricing — https://abliteration.ai/pricing + https://docs.abliteration.ai/pricing ($1/$3/$3 in, $0.10/$0.30/$0.30 cached, $3/$5/$5 out, $20/$50/$200 subs)
8. Abliteration models — https://docs.abliteration.ai/models.md (3 IDs, 262K/1M limits, caps matrix, images only on base, low/high/max on v2)
9. Abliteration large-v2 launch — https://abliteration.ai/blog/introducing-abliterated-model-large-v2 (GLM-5.3 FP8, 84.5% CyberGym, 41.8% TB4.0, 105 ExploitGym-2h, $5/M)
10. Advisor models — https://omp.sh/docs/advisor (nit/concern/blocker, WATCHDOG.md/yml, syncBacklog/immuneTurns, cost)
11. Model roles — https://omp.sh/docs/roles (default/smol/slow/plan/vision/task/advisor, Ctrl+P, fallbackChains)
12. Agents & model roles — https://omp.sh/docs/agents-and-roles (scout/reviewer/security-reviewer/librarian/task/sonic, @role aliases, agentModelOverrides, prewalk/advisor per-agent)

**Tier-0 local:**
9. `W/report/r1/offensive-ai-models-red-team-2026-09-28.md` — Orca vs Abliteration vs Adverserial deep dive, ToS, install guides
10. `W/report/r1/p1-token-optimization-plan.md` — cost model followed here (search-before-fetch, batched calls, one write, no subagents per your constraint)
11. `W/report/r1/ai-security-vulnerabilities-2026-09-27.md`, `top-20-ai-security-vulnerabilities-2026-09-29.md` — framework spine

**Secondary (search discovery):**
12. OrcaRouter models catalog — https://www.orcarouter.ai/models ; Mastra OrcaRouter — https://mastra.ai/models/providers/orcarouter ; Promptfoo OrcaRouter — https://www.promptfoo.dev/docs/providers/orcarouter/ ; Routing DSL launch — PR Newswire 2026-06-15 ; RouterArena arXiv:2605.30736v1

---

*Report generated 2026-10-01, single-pass cost-optimized, no subagents per operator constraint. For authorized defensive research only. Verify live prices before engagement — OrcaRouter refreshes every 60s, Abliteration catalog overrides blog copy.*
