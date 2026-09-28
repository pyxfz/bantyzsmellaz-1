---
title: "3. OrcaRouter — Native Cyber Models"
description: "Gateway identity, gated OrcaCyber-Zero, uncensored open-weights, pricing, API and legal guardrails."
sidebar:
  label: "3. OrcaRouter"
---

## 3.1 Identity

- **Name:** OrcaRouter. Site `https://www.orcarouter.ai/`, docs `https://docs.orcarouter.ai`, models
  `https://www.orcarouter.ai/models`, pricing `https://www.orcarouter.ai/pricing`, offers
  `https://www.orcarouter.ai/offers`.
- **What:** "One OpenAI-compatible AI gateway — adaptive routing, load balancing, guardrails, agent
  firewall, observability across 200+ models." Grades prompts in <1ms, $0 markup.
- **Operator:** CONTINUUM AI PTE. LTD., Singapore, 21 Merchant Road, legal@orcarouter.ai. Trade identity
  Continuum AI Corp, San Francisco, founded 2026, 5-6 people. Launch PR May 8 2026 (100+ models → 200+
  now).
- **Footprint:** GitHub `Continuum-AI-Corp/OrcaRouter-Lite` (1.7k stars, 270 forks, MIT, 403 tests),
  HuggingFace `orcarouter` (#10 across 3M+ models claim, 1.5M downloads/30d), Ollama `orcarouter`, X
  `@OrcaRouter`, Discord, LinkedIn 1.6k followers, arXiv RouterArena 75.54% #2.
- **Scale (vendor-reported):** 203 models per LLMScape Sep 28 2026, max 1.1M ctx, 162 text/multimodal,
  179 with pricing.

## 3.2 Cyber Models (Confirms >1)

### 3.2.1 OrcaCyber-Zero-1.0 — native offensive, gated closed beta

- Page: `https://www.orcarouter.ai/models/orca/orcacyber-zero-1.0`
- Function: coding model post-trained for vuln analysis, vuln reproduction, red-teaming, offensive
  research. Frontier-tier in OrcaCyber Harness. Best for reproducing/triaging real vulns across large
  OSS codebases, root-cause, red-team tooling, long-context repo understanding with agentic function
  calling.
- Specs: 1M ctx, 128K max output, Tools+JSON+Reasoning, function calling, structured outputs,
  configurable reasoning. p50 TTFT 972ms, p95 5.31s, 196 tok/s, 0.59% error, 1895M tokens/7d traffic.
- Benchmark (vendor): CyberGym Level 1 pass@1 98.07% (1,478/1,507) from 188 OSS projects, evaluated
  2026-09-17.
- Pricing: **$3.00/M input, $5.00/M output, $0.30/M cache read**. Calculator: 10M/mo 70% in = ~$36/mo
  ($26.55 cached).
- Access: "Offensive-capability model · engagement + passkey + terms" + Enable access button. Trusted
  researchers/red-teams/authorized testing only. Per-use-case approval: "arrives with a target attached:
  component you maintain, vuln class, engagement this quarter. General chat does not queue ahead."

### 3.2.2 Uncensored / abliterated open-weight family — 2nd cyber-capable option

- HF org: "research-oriented and uncensored variants intended for authorized security research, red-team
  testing…" hosted at `https://www.orcarouter.ai/models?q=uncensored`.
- Ollama: `Qwen3.8-27B-Uncensored` (tensor-level abliterated, 0% over-refusal XSTest, 0-6% refusal A/B,
  no measurable loss, 262K ctx, 199.6K pulls); `Qwen3.8-Flash-Next-Uncensored` (MoE ~177B total / ~6B
  active, 262K, MLX 4/6/8-bit, Research use only, 12.2K pulls).
- Hosted router IDs: `obsidian/qwen3.8-27b` ($0.40 in / $4.21 out snapshot, 262K), `qwen/qwen3.8-27b`
  ($0.33/$2.40), `qwen/qwen3.8-27b-free` ($0, 66K). HF quant `orcarouter/OrcaSAQ-2-27B` (55GB→12GB,
  93.2% Top-1, 70.0 SWE-bench Verified, 58.4 Terminal-Bench 2.1).
- Note high churn — verify model ID before engagement.

### 3.2.3 Security-adjacent — OrcaVerify text classifier

`orca/orcaverify-text1.0` + free variant — AI-vs-human detector (AI_GENERATED / AI_ASSISTED / HUMAN /
ABSTAIN + calibrated prob + paragraph localization). $2.00/M in, p50 177ms. For UGC moderation,
academic integrity, not offensive.

### 3.2.4 Routable dual-use frontier models

Any of 200+ for pentest assistance (code review, exploit *analysis*, patch validation) subject to
upstream AUPs. Examples: `openai/gpt-5.6-sol` ~$2-4/M in, 1.1M ctx; `openai/gpt-5.5` $5/$30;
`anthropic/claude-opus-4.8` $5/$25; `google/gemini-3.8-flash` $0.75/$3.75 promo thru end-2026 →
doubles Jan 1 2027; `deepseek/deepseek-v4-flash` $0.15/$0.29; `qwen/qwen3.7-flash` $0.03/$0.13;
specials `orcarouter/auto`, `orcarouter/free` ($0).

### 3.2.5 NOT callable via OrcaRouter (do not misclaim)

`Gemini 3.8 Flash Cyber` (Google Fairwind-gated, CyberGym 86.2%), `GPT-5.6-Cyber` (OpenAI Daybreak
Red-gated, 95.0% Advanced Cyber Completion), `MAI-Cyber-1-Flash`, `Gemini 3.5 Flash Cyber`, `Claude
Mythos 5` — discussed on Orca blog for comparison only.

## 3.3 Pricing & Plans

- Model: zero markup — pay provider published rate. Live prices refresh every 60s.
- Plans: Hacker **Free forever** (200+ models, auto-failover, basic dashboard, 10 keys, 0% markup). Team
  **Custom** on live page (10 seats, compliance enforcement/reports, unlimited keys, priority support) —
  meta description still says $49/mo (flag as stale). Enterprise **Custom** (unlimited seats, beta,
  dedicated infra, 99.99% SLA). Prepaid top-ups + Stripe subs, per-token deduction, **non-refundable**,
  cancel end-of-period.
- Free tier rotating $0: `deepseek-v4-flash-free`, `glm-5.3-flash-free`, `hy3-free`,
  `orcaverify-free`, `orcarouter/free`. Voucher/student/hackathon credits via `/offers` (2-click claim).

## 3.4 API

- Endpoint `https://api.orcarouter.ai/v1`, keys `sk-orca-*`. Fully OpenAI-compatible: Chat, Responses,
  Embeddings, Images, Audio, SSE + `[DONE]`. Swap `base_url` only.
- Fallback: `extra_body={"models":["openai/gpt-5.5","anthropic/claude-opus-4.8"],"route":"fallback"}`;
  auto: `model="orcarouter/auto"`. Resolved model in `x-orca-resolved-model`, cache
  `x-orca-cache: HIT/MISS`.
- Native Anthropic + Gemini ingress, same routing/cache/analytics. Official MCP server, Dify plugin,
  Vercel AI SDK, `GET /v1/models` discovery, budgets/roles, prompt versioning/caching, guardrails+agent
  firewall. Self-host `OrcaRouter-Lite` (`model="auto"`, BYOK, SQLite, `localhost:8000/v1`).

```python
from openai import OpenAI
client = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
r = client.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Analyze this diff for RCE, authorized test ID ..."}])
```

## 3.5 Legal / Guardrails

- ToS §5 bans violating law, CSAM, IP theft, **"create malware, stalkerware, or other software designed
  to harm"**, harassment, impersonation, limit circumvention, scraping. **Upstream AUPs also bind you**
  (OpenAI, Anthropic, Google); violation upstream = violation OrcaRouter; abuse metadata may be shared
  upstream. Unauthorized offense prohibited; authorized testing via gated cyber is allowed path.
- Cyber gating = guardrail: closed beta, per-use-case approval, engagement+passkey+terms.
- Controls: guardrails + agent firewall all plans; Team compliance reports; Enterprise data residency,
  audit, SLA. Trust Center maps HIPAA/PCI/GDPR/SOC2/AI Act/NIST/OWASP/ISO 27001/42001 (capability
  mapping, not audit; reports under NDA). Regions SG/US/JP (workspace region ≠ inference pinning). You
  retain rights, **no training on content**. Outputs may be inaccurate — evaluate before reliance.
  Jurisdiction Singapore (SIAC).
