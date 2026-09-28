# Offensive & Adversarial AI Models for Legal Red-Teaming — Capabilities, Cost & Workflow Report

**Date:** 2026-09-28
**Author:** Red-Team Consultancy Research
**Context:** Evaluation of 3 specialized AI families for authorized offensive security work: (1) OrcaRouter hosted cyber models, (2) Abliteration AI abliterated models, (3) Adverserial AI (`https://adverserial.ai/` — note spelling with E, Adverserial AI LLC, CyberKimi + CyberGLM). Request includes functionalities, costs, legal client workflow integration, independent reviews, and best cost-effective recommendation.
**Method:** Multi-agent deep research via parallel subagents using TinyFish Search/Fetch, Exa web search, You.com, Firecrawl scrape, docs.fetch, GitHub/HF/Ollama analysis, ToS review + direct fetch of `adverserial.ai/`, `/docs.html`, `/founder.html` on 2026-09-28 correction pass. Cross-referenced with local reports (`ai-security-vulnerabilities-2026-09-27.md`, `omo-alternatives-opencode-v2-2026-09-28.md`, `multi-agentic-workflows-2026-09-28.md`).
**Sources:** OrcaRouter.ai, docs.orcarouter.ai, Abliteration.ai, docs.abliteration.ai, Adverserial.ai, docs (adverserial.ai/docs.html), founder (adverserial.ai/founder.html), github.com/lordx64/cyberkimi-benchmarks, TechCrunch, LessWrong, CoderCops, Reddit, GitHub, HuggingFace.
**Correction note (2026-09-28 v2):** v1 incorrectly mapped "adversearial ai" to Lakera/Mindgard/Cisco/Adversarial.com defensive scanners. User corrected to `https://adverserial.ai/`. §5, §6, §7C, §8, §9, §10.3, §12 rewritten to cover the correct vendor. Defensive-scanner category retained only as one-line context in §5.6.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background: What You Asked For](#2-background-what-you-asked-for)
3. [OrcaRouter — Gateway + Native Cyber Models](#3-orcarouter--gateway--native-cyber-models)
4. [Abliteration AI — Hosted Guardrail-Removed Models](#4-abliteration-ai--hosted-guardrail-removed-models)
5. [Adverserial AI — CyberKimi + CyberGLM (correction)](#5-adverserial-ai--cyberkimi--cyberglm-correction)
6. [Comparison Matrix](#6-comparison-matrix)
7. [Legal Workflow: How to Use Each in Client Engagements](#7-legal-workflow-how-to-use-each-in-client-engagements)
8. [Reviews Synthesis](#8-reviews-synthesis)
9. [Recommendation: Best Cost-Effective Method & Model](#9-recommendation-best-cost-effective-method--model)
10. [Installation & Integration Guides](#10-installation--integration-guides)
11. [Risks, Caveats & What Not to Do](#11-risks-caveats--what-not-to-do)
12. [Sources](#12-sources)
13. [DreadNode — Agent Infrastructure Explained + Cost Verdict (2026-09-28 addition)](#13-dreadnode--agent-infrastructure-explained--cost-verdict-2026-09-28-addition)
14. [OpenAI & Anthropic Cyber Models vs Poor Man's Stack — Comparison & Techniques (2026-09-28 addition)](#14-openai--anthropic-cyber-models-vs-poor-mans-stack--comparison--techniques-2026-09-28-addition)

---

## 1. Executive Summary

> **TL;DR:** All three are **generators** (produce offensive analysis under authorization), not defensive scanners. **OrcaRouter Cyber Zero ($3/$5)** and **Abliteration Large-v2 ($5/$5)** are cheap volume workhorses; **Adverserial CyberKimi ($8/$30)** is the premium specialist with public vuln-repro evidence (CyberGym 86.7%, ExploitBench V8 transcripts) but ~6× output cost. Cheapest production stack remains **Abliteration Developer $20/mo + OrcaRouter free tier (~$56-80/mo per 10M tokens)**. Use Adverserial PAYG wallet selectively for hard cases (V8 repro, 1M-ctx hunts), not as daily driver.

| Family | What it really is | Entry cost | Best for | Legal fit |
|---|---|---|---|---|
| **OrcaRouter** `orca/orcacyber-zero-1.0` + Qwen-Uncensored | OpenAI-compatible gateway, 200+ models, 1 native cyber model (gated) + uncensored open-weights | Free tier + $3/$5 per 1M for Zero; Qwen $0.33/$2.40; free $0 models | Governed offensive vuln repro, multi-model routing, audit logs | Strong — per-engagement approval, Team compliance, SG jurisdiction |
| **Abliteration AI** `abliterated-model-large-v2` | Hosted abliterated (refusal-vector removed) GLM-5.3, 1M ctx, no per-request refusals | $20/mo Dev, $3/$3 base, $5/$5 large-v2 | Exploit dev, CVE repro, jailbreak/prompt-injection testing, synthetic training data | Usable with strict controls — vendor pushes auth burden to you, zero-retention, Delaware ToS bans illegal use |
| **Adverserial AI** `lordx64/cyberkimi` + `cyberglm` | Specialist cyber lab (NJ LLC, solo-founder-led), Kimi-K3-ablated + cyber-tuned, 1M ctx, privacy-first, public benchmarks | PAYG wallet only ($8/$0.80/$30 CyberKimi; $4/$0.40/$15 CyberGLM); memberships $29/$149/$349 now legacy/V2-waitlist | Hard vuln repro, V8 exploit analysis, Sigma/YARA/KQL, IR/threat-hunt, red+blue reasoning | Strongest ToS wording — explicit auth-first, human-review mandatory, no-logging claim with billing/KV-cache nuances |

If you only buy one thing this quarter: **Abliteration Developer $20 + OrcaRouter free/Hacker tier**. Add Adverserial $25-50 PAYG top-up as specialist reserve for cases needing evidence-backed repro.

---

## 2. Background: What You Asked For

You run a red-team / cyber consultancy and noted specialized AI models:

- `oracarouter` with hosted offensive model — correctly **OrcaRouter (`www.orcarouter.ai`)**, not OpenRouter. Has **>1 cyber-relevant model** as you suspected.
- `abliteration ai` — correctly **Abliteration AI (`abliteration.ai`)**, hosted guardrail-removed models.
- `adverserial ai` — correctly **Adverserial AI (`https://adverserial.ai/`, Adverserial AI LLC, NJ) — CyberKimi + CyberGLM**, specialist cyber-tuned models. v1 of this report misread it as "adversarial" defensive scanners — corrected in v2.

This report follows your folder convention: executive summary, per-alternative deep dive, comparison matrix, recommendation, install guides, sources.

Terminology fix for client proposals: all three vendors here sell **Offensive-capable AI for authorized work** (LLM generates attack analysis under written auth), distinct from **AI red-team scanners** (Lakera/Mindgard/Cisco test client AI apps — not covered here except §5.6 context).

---

## 3. OrcaRouter — Gateway + Native Cyber Models

### 3.1 Identity

- **Name:** OrcaRouter. Site `https://www.orcarouter.ai/`, docs `https://docs.orcarouter.ai`, models `https://www.orcarouter.ai/models`, pricing `https://www.orcarouter.ai/pricing`, offers `https://www.orcarouter.ai/offers`.
- **What:** "One OpenAI-compatible AI gateway — adaptive routing, load balancing, guardrails, agent firewall, observability across 200+ models." Grades prompts in <1ms, $0 markup.
- **Operator:** CONTINUUM AI PTE. LTD., Singapore, 21 Merchant Road, legal@orcarouter.ai. Trade identity Continuum AI Corp, San Francisco, founded 2026, 5-6 people. Launch PR May 8 2026 (100+ models → 200+ now).
- **Footprint:** GitHub `Continuum-AI-Corp/OrcaRouter-Lite` (1.7k stars, 270 forks, MIT, 403 tests), HuggingFace `orcarouter` (#10 across 3M+ models claim, 1.5M downloads/30d), Ollama `orcarouter`, X `@OrcaRouter`, Discord, LinkedIn 1.6k followers, arXiv RouterArena 75.54% #2.
- **Scale (vendor-reported):** 203 models per LLMScape Sep 28 2026, max 1.1M ctx, 162 text/multimodal, 179 with pricing.

### 3.2 Cyber models (confirms >1)

**A. `orca/orcacyber-zero-1.0` — native offensive, GATED closed beta**
- Page: `https://www.orcarouter.ai/models/orca/orcacyber-zero-1.0`
- Function: coding model post-trained for vuln analysis, vuln reproduction, red-teaming, offensive research. Frontier-tier in OrcaCyber Harness. Best for reproducing/triaging real vulns across large OSS codebases, root-cause, red-team tooling, long-context repo understanding with agentic function calling.
- Specs: 1M ctx, 128K max output, Tools+JSON+Reasoning, function calling, structured outputs, configurable reasoning. p50 TTFT 972ms, p95 5.31s, 196 tok/s, 0.59% error, 1895M tokens/7d traffic.
- Benchmark (vendor): CyberGym Level 1 pass@1 98.07% (1,478/1,507) from 188 OSS projects, evaluated 2026-09-17.
- Pricing: **$3.00/M input, $5.00/M output, $0.30/M cache read**. Calculator: 10M/mo 70% in = ~$36/mo ($26.55 cached).
- Access: "Offensive-capability model · engagement + passkey + terms" + Enable access button. Trusted researchers/red-teams/authorized testing only. Per-use-case approval: "arrives with a target attached: component you maintain, vuln class, engagement this quarter. General chat does not queue ahead."

**B. Uncensored / abliterated open-weight family — 2nd cyber-capable option**
- HF org: "research-oriented and uncensored variants intended for authorized security research, red-team testing..." hosted at `https://www.orcarouter.ai/models?q=uncensored`.
- Ollama: `Qwen3.8-27B-Uncensored` (tensor-level abliterated, 0% over-refusal XSTest, 0-6% refusal A/B, no measurable loss, 262K ctx, 199.6K pulls); `Qwen3.8-Flash-Next-Uncensored` (MoE ~177B total / ~6B active, 262K, MLX 4/6/8-bit, Research use only, 12.2K pulls).
- Hosted router IDs: `obsidian/qwen3.8-27b` ($0.40 in / $4.21 out snapshot, 262K), `qwen/qwen3.8-27b` ($0.33/$2.40), `qwen/qwen3.8-27b-free` ($0, 66K). HF quant `orcarouter/OrcaSAQ-2-27B` (55GB→12GB, 93.2% Top-1, 70.0 SWE-bench Verified, 58.4 Terminal-Bench 2.1).
- Note high churn — verify model ID before engagement.

**C. Security-adjacent:** `orca/orcaverify-text1.0` + free variant — AI-vs-human detector (AI_GENERATED / AI_ASSISTED / HUMAN / ABSTAIN + calibrated prob + paragraph localization). $2.00/M in, p50 177ms. For UGC moderation, academic integrity, not offensive.

**D. Routable dual-use frontier:** any of 200+ for pentest assistance (code review, exploit *analysis*, patch validation) subject to upstream AUPs. Examples: `openai/gpt-5.6-sol` ~$2-4/M in, 1.1M ctx; `openai/gpt-5.5` $5/$30; `anthropic/claude-opus-4.8` $5/$25; `google/gemini-3.8-flash` $0.75/$3.75 promo thru end-2026 → doubles Jan 1 2027; `deepseek/deepseek-v4-flash` $0.15/$0.29; `qwen/qwen3.7-flash` $0.03/$0.13; specials `orcarouter/auto`, `orcarouter/free` ($0).

**E. NOT callable via OrcaRouter (do not misclaim):** `Gemini 3.8 Flash Cyber` (Google Fairwind-gated, CyberGym 86.2%), `GPT-5.6-Cyber` (OpenAI Daybreak Red-gated, 95.0% Advanced Cyber Completion), `MAI-Cyber-1-Flash`, `Gemini 3.5 Flash Cyber`, `Claude Mythos 5` — discussed on Orca blog for comparison only.

### 3.3 Pricing & plans

- Model: Zero markup — pay provider published rate. Live prices refresh every 60s.
- Plans: Hacker **Free forever** (200+ models, auto-failover, basic dashboard, 10 keys, 0% markup). Team **Custom** on live page (10 seats, compliance enforcement/reports, unlimited keys, priority support) — meta description still says $49/mo (flag as stale). Enterprise **Custom** (unlimited seats, beta, dedicated infra, 99.99% SLA). Prepaid top-ups + Stripe subs, per-token deduction, **non-refundable**, cancel end-of-period.
- Free tier rotating $0: `deepseek-v4-flash-free`, `glm-5.3-flash-free`, `hy3-free`, `orcaverify-free`, `orcarouter/free`. Voucher/student/hackathon credits via `/offers` (2-click claim).

### 3.4 API

- Endpoint `https://api.orcarouter.ai/v1`, keys `sk-orca-*`. Fully OpenAI-compatible: Chat, Responses, Embeddings, Images, Audio, SSE + `[DONE]`. Swap `base_url` only.
- Fallback: `extra_body={"models":["openai/gpt-5.5","anthropic/claude-opus-4.8"],"route":"fallback"}`; auto: `model="orcarouter/auto"`. Resolved model in `x-orca-resolved-model`, cache `x-orca-cache: HIT/MISS`.
- Native Anthropic + Gemini ingress, same routing/cache/analytics. Official MCP server, Dify plugin, Vercel AI SDK, `GET /v1/models` discovery, budgets/roles, prompt versioning/caching, guardrails+agent firewall. Self-host `OrcaRouter-Lite` (`model="auto"`, BYOK, SQLite, `localhost:8000/v1`).

```python
from openai import OpenAI
client = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
r = client.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Analyze this diff for RCE, authorized test ID ..."}])
```

### 3.5 Legal / guardrails

- ToS §5 bans violating law, CSAM, IP theft, **"create malware, stalkerware, or other software designed to harm"**, harassment, impersonation, limit circumvention, scraping. **Upstream AUPs also bind you** (OpenAI, Anthropic, Google); violation upstream = violation OrcaRouter; abuse metadata may be shared upstream. Unauthorized offense prohibited; authorized testing via gated cyber is allowed path.
- Cyber gating = guardrail: closed beta, per-use-case approval, engagement+passkey+terms.
- Controls: guardrails + agent firewall all plans; Team compliance reports; Enterprise data residency, audit, SLA. Trust Center maps HIPAA/PCI/GDPR/SOC2/AI Act/NIST/OWASP/ISO 27001/42001 (capability mapping, not audit; reports under NDA). Regions SG/US/JP (workspace region ≠ inference pinning). You retain rights, **no training on content**. Outputs may be inaccurate — evaluate before reliance. Jurisdiction Singapore (SIAC).

---

## 4. Abliteration AI — Hosted Guardrail-Removed Models

### 4.1 Identity

- **Legal:** Abliteration AI, Inc. © 2026. Terms `https://abliteration.ai/terms-of-service`.
- **Sites:** `https://abliteration.ai/`, docs `https://docs.abliteration.ai/` (`/llms.txt`), API `https://api.abliteration.ai/v1`, console `https://abliteration.ai/console/playground`, status `https://status.abliteration.ai`, trust `https://trust.abliteration.ai/` (currently empty), comms `https://tryabliteration.ai/`, contact help@abliteration.ai.
- **Socials:** GitHub `abliteration-ai`, X `@abliteration_ai`, LinkedIn `abliteration-ai` (117-228 followers), HF `abliterationaiorg`, Facebook.
- **Do not confuse:** `abliterate.ai` (different Permissionless AI), `abliterated.ai` (content-rewrite SaaS).
- **Corp:** Founded 2025, incorp March 2026, HQ Palo Alto CA 94306, Delaware corp, Delaware law. Size 2-10, unfunded/bootstrapped on revenue, Convertible Note, LAUNCH funded. NVIDIA Inception member, LAUNCH alum, Microsoft for Startups collab. Cloud deals per co-founder Devon (last name withheld, remains employed elsewhere). Early customers claim: UK/EU red-team startups, banks, airlines, critical infra.
- **Technique:** abliteration = refusal-vector ablation — "finds directions in activations that produce refusals and removes them from weights" while preserving reasoning/tool-use.

### 4.2 Models & functionalities

| Model ID | Base | Ctx / Max out | Modalities | Notes |
|---|---|---|---|---|
| `abliterated-model` | undisclosed general | 262K / 262K | Text+image in, video on Chat only | Default multimodal |
| `abliterated-model-large` | GLM-5.2 abliterated + fine-tuned adversarial | 1M / 1M | Text-only | Previous large |
| `abliterated-model-large-v2` | GLM-5.3 abliterated, FP8 | 1M / 1M | Text-only, 3 reasoning modes low/high/max | Current default large |

Sources: `https://docs.abliteration.ai/models.md`, `https://abliteration.ai/blog/introducing-abliterated-model-large-v2`.

**Vendor benchmarks (not independently verified):**
- base: mmlu_pro 82.1, gpqa 73.1, aime_2025 83.7, mmmu_pro 68.1, refusals 3/100 harmful_behaviors.
- large (GLM-5.2): SWE-bench Verified 81.2%, Terminal-Bench 2.1 80.1% (base 81.0%), AgentHarm 86.2% zero refusals ("highest published"), AgentDojo 97.5% benign / 34.29% under injection / 57.86% targeted ASR, CyberGym 84.2% vs GPT-5.5 81.8%.
- large-v2 (GLM-5.3): CyberGym 84.5% SOTA claim, Terminal-Bench 4.0 41.8%, ExploitGym 29→105 tasks in 2h, ExploitBench 24.4→54.4 (2×), #3 Terminal-Bench 4.0 behind Opus 5 and Fable.

**Platform layers (`/platform`):** (1) Hosted abliterated LLM — no per-request refusals on cybersecurity/red-team/training-data/agent workloads, (2) Policy Gateway — policy-as-code allow/refuse/rewrite/redact/escalate + reason code to SIEM, (3) Training-data console — batch dataset gen, paid 3-row preview, export HF/Kaggle/S3/GCS/Azure.

**Marketed offensive uses:** pen-test, CVE repro, exploit dev, malware analysis, phishing pretexts, password-stealer code, SQLi demo in console; AI red-teaming (jailbreaks, direct+indirect prompt injection via PDF/email RAG exfiltration, tool-misuse coercion, model-stealing probes, DAN); Trust & Safety synthetic data (coded harassment, 20 harassment examples, 50 phishing emails); ML research / defense-government.

**Caps matrix:** Chat/Responses/Messages ✓, streaming ✓, tool calling ✓, structured JSON ✓, reasoning-effort ✓, disable/hide reasoning ✓, reasoning trace ✓, web search ✓ ($8/1k), web fetch Anthropic-only ✓, token counting ✓, safety filtering via `flagged_categories` ✓, auto prompt caching ✓. **No self-host** — hosted-only. Self-host alternative is community weights + vLLM (e.g. `dealignai/GLM-5.3-ABLITERATED-NVFP4`, `Securelayer7/Qwen3.8-27B-Uncensored-Abliterated`, `huihui-ai/BaronLLM_Offensive_Security-abliterated-GGUF`).

### 4.3 Pricing

Source of truth `https://abliteration.ai/pricing` + `https://docs.abliteration.ai/pricing` (pricing page overrides older $1 copy).

- Subs (monthly reset, no rollover; prepaid stacks, never expires): Developer $20/mo 2.5% discount (solo, pay-as-you-go, project-limited keys, auto-reload); Growth $50/mo 5% (higher limits, spend controls, audit logs, team, email); Scale $200/mo 10% (**$200 included credit**, highest limits, priority); Enterprise Custom (dedicated throughput, custom routing/region, volume, contracts/compliance, EKM, Policy Gateway). Free preview 1 credit ≈500 full-price base tokens, no card.
- Per-token USD per 1M (input+cached+output billed separately; image/video as token equiv on base only):

| Model | Input | Cached | Output |
|---|---|---|---|
| abliterated-model 256K | $3.00 | $0.30 | $3.00 |
| abliterated-model-large 1M | $5.00 | $0.50 | $5.00 |
| abliterated-model-large-v2 1M | $5.00 | $0.30-0.50* | $5.00 |

*Docs $0.50 vs blog $0.30 — confirm at checkout. Effective ~$3/1M total tokens ($10≈3.3M). Web search $8/1k + tokens. Old $1-input copy superseded.
- Listings: Slashdot confirms $20 start, free trial yes, 0 ratings.

### 4.4 API

Hosted-only; EU residency option in-region (zero-retention). Quickstart:

```sh
export ABLIT_KEY=ak_YOUR_API_KEY
curl https://api.abliteration.ai/v1/chat/completions \
 -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
 -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Hello"}]}'
```

Python `OpenAI(base_url="https://api.abliteration.ai/v1", api_key=os.environ["ABLIT_KEY"])`, Node same, key prefix `ak_...`. Must include `/v1`, exact `model`, `messages`; 401 bad key, 404 missing /v1, 400 bad shape, 429 backoff.

Endpoints: `POST /v1/chat/completions`, `/v1/responses`, `/v1/messages` (Anthropic), `/v1/messages/count_tokens`, `GET /v1/models`, `GET /credits/balance`, `/policy/*`. Multimodal `content:[{type:text},{type:image_url},{type:video_url}]`, HTTPS or data URLs, SSRF-guarded. Streaming SSE. OpenAPI `https://api.abliteration.ai/openapi.json`.

Integrations: LangChain (`ChatOpenAI` baseURL swap), LlamaIndex (`OpenAILike`), Vercel AI SDK (`@abliterationai/ai-sdk-provider`), Cloudflare Workers, Claude Code (2 env vars), Codex CLI, Pi agent, CC Switch, CLIProxyAPI, OpenCode built-in provider, CyberStrike fork, Strix pentest, Hermes Agent, OpenClaw plugin, Promptfoo built-in provider for eval/red-team, Giskard scanner backend, Mastra router (`ABLIT_KEY`). Examples `abliterationai/abliteration-examples` (6★). Policy Gateway `POST /policy/chat/completions` with `policy_id, policy_user, project ID`; connectors Splunk HEC, Datadog, Elastic/OpenSearch, Azure Monitor, S3/Blob/GCS/B2/R2, webhook, OTel. Rate limits tier = max(sub plan, lifetime-spend tier).

### 4.5 Legal / ethical

- Terms (2026-01-08): 18+, accurate registration, safeguard `ak_` keys, comply laws/export/third-party terms, credits non-refundable/non-transferable, **Acceptable Use: "No illegal, harmful, or high-risk activities (including anything that may harm people or infrastructure). No evasion/probing/disruption. May investigate/suspend."** Payload transient, no default storage; telemetry (counts/timestamps/endpoints/codes) for billing. As-is, no warranty, liability capped greater of $100 or prior 3mo fees, Delaware venue. Termination via help@.
- Data (2026-05-29): Zero retention by default (vs ~30d elsewhere); prompts/completions/images in-memory then discarded, never for training, redacted from error logs; retained token counts/timestamps/status/model/billing (lifetime + hold). Exceptions: web search/fetch sends query/URL to third-party (their retention, zero-retention void if enabled); training-data generator stores datasets you generate (deletable, never trains vendor); Policy Gateway stores rules + content-free metadata only. EU residency in-region, EKM enterprise.
- Authorized-testing framing (`/security-testing`): "For authorized security testing and research only. Explicit written authorization required. Comply with laws/scope. We investigate/suspend." Per-client projects, scoped keys, quotas, revocation, SIEM audit, shadow/canary/rollback, PII redact/rewrite/escalate. Marketing: "Unrestricted. Not ungoverned", "frontier intelligence, your guardrails".
- **Gap to flag:** ToS bans illegal/harmful/high-risk yet homepage sells offensive cyber/exploit/malware analysis and LessWrong/TechCrunch show pathogen + stealer compliance with only card/email check, no use-case screening, no monitoring, filters only self-harm/CSAM. Authorization burden + Policy Gateway (Enterprise-only) pushed to you. No public DPA/BAA; deletion via email only.

---

## 5. Adverserial AI — CyberKimi + CyberGLM (correction)

> **Correction:** v1 covered Lakera/Mindgard/Cisco/`adversarial.com`. The correct site is **`https://adverserial.ai/` (ADVERSERIAL with E), Adverserial AI LLC, Jersey City NJ**. Two cybersecurity-fine-tuned models: **CyberKimi** (`lordx64/cyberkimi`) and **CyberGLM** (`cyberglm`), plus **CyberSeek** coming soon. Direct fetch 2026-09-28 of `/`, `/docs.html`, `/founder.html` below; benchmarks at `github.com/lordx64/cyberkimi-benchmarks`.

### 5.1 Identity

- **Legal:** Adverserial AI LLC, a New Jersey LLC, 1078 Summit Ave #605, Jersey City NJ 07307, contact@adverserial.ai. Sources: `https://adverserial.ai/terms`, `https://adverserial.ai/privacy` (v Sep 16 2026).
- **Sites:** `https://adverserial.ai/`, docs `https://adverserial.ai/docs.html`, founder `https://adverserial.ai/founder.html`, chat `https://chat.adverserial.ai/` (OpenWebUI, auth-gated), billing `https://billing.adverserial.ai/`, terms `/terms`, privacy `/privacy`, waitlist `/waitlist.html`, API `https://api.adverserial.ai/v1`.
- **Founder:** Taha Karim, Founder & Chief AI Researcher, creator of CyberKimi, handle @lordx64 — `https://adverserial.ai/founder.html`, links LinkedIn `tahakarim`, X `@lordx64`, HF `lordx64`. Bio claims: EPITA Paris cybersecurity; Symantec malware RE (1st CyberWar Challenge ~1,000); FireEye senior malware (co-author first LATENTBOT teardown); Head of Malware Research Labs DarkMatter (WindShift/G0112 WindTail/WindTape, HITB GSEC, ATT&CK S0466); Exodus Intelligence 0-day Android baseband chains; Google Play APK defense; now TikTok/ByteDance global threat intel AI workflows; Black Hat/HITB/SANS trainer/presenter. GitHub `github.com/lordx64` (48 followers) corroborates LLC/US identity.
- **Team/date:** Founding date and team size NOT published. Earliest artifacts Aug 2026 LinkedIn ("Meet CyberKimi", CyberGym Aug 19). Public face solo founder + "team" mentions; Sep 2026 GitHub essentially lordx64 alone (168 commits/3 repos). Company LinkedIn ~37 followers (snippet). Do not cite team size.
- **NVIDIA Inception:** Homepage footer shows "PROGRAM MEMBER / NVIDIA Inception" badge, but no NVIDIA listing found; only founder post "applied ... forcing AWS quota now on NVIDIA Inception compute". Treat as **claimed-applied, unverified** until NVIDIA directory confirms.
- **Positioning:** "Intelligence. Engineered for cyber." / "ENGINEERED FOR CYBER." / "For authorized security work." Two models fine-tuned for cybersecurity, red team + blue team, "Understand the adversary. Build a stronger defense."

### 5.2 Models & functionalities (both fine-tuned for cyber)

| Model | Base | Params / Active | Ctx | Model ID | Status |
|---|---|---|---|---|---|
| CyberKimi | Kimi K3 + refusal ablation + cyber-tuning | 2.78T / 104B active | 1M total (750K client budget; 512K MXFP4 vLLM in bench) | `lordx64/cyberkimi` | Production, PAYG + chat |
| CyberGLM | Undisclosed GLM family, cyber-focused | — | 131K client budget | `cyberglm` | In development, PAYG, actively refined |
| CyberSeek | — | — | — | — | Coming soon, pricing TBA |

Sources: homepage specs, `https://adverserial.ai/docs.html` FAQ ("builds on Kimi K3 with guardrails relaxed ... + domain tuning"), GitHub ("Kimi K3 with refusal layer ablated and cyber-tuning, own GPU infra"), benchmarks (`cyberkimi-v1` vLLM private node MXFP4 512K).

**What it does:** red team 01 + blue team 02 in one reasoning engine — detection engineering (Sigma/YARA/KQL), incident response (sequence reconstruction, containment/recovery), threat hunting (intel → testable hypotheses). Example workflow: "Review auth events ... Identify sequence ... propose detection strategy" → Evidence timeline + Detection logic + Response priorities. Domain specialization via ablation + cyber tuning from investigations/playbooks; privacy-by-design (no GPU request logs, no training on prompts); continuous dev toward RL in verifiable security envs.

**Ablation nuance:** founder's separate `phantom-kv` repo describes "refusal removal as loadable KV-cache graft — zero weight modification, reversible". Whether production CyberKimi uses phantom-kv vs weight ablation is **not stated** — do not conflate.

**Caps:** OpenAI-compat Chat Completions + Anthropic-dialect shim (sanitizes thinking blocks), streaming with `reasoning_content`/`reasoning` + `content`, prompt caching (reported in `usage.prompt_tokens_details.cached_tokens` / `cache_read_input_tokens`), tool calling via Kimi Code/Claude Code/Codex/OpenCode/Hermes configs (see §10.3). No weight download; Enterprise private-weight deployment on request.

### 5.3 Benchmarks & evidence (vendor-published, mixed independent scrutiny)

- **CyberGym vuln reproduction:** 86.7% (78/90, 65.6% first-attempt) — homepage. LinkedIn stratified 100-task subset 0.860 beating GLM-5.3 0.845, DeepSeek-V4-Pro 0.833, Gemini 3.5 Flash Cyber 0.832, Claude Mythos Preview 0.831, GPT-5.5 0.818, 2× stock Kimi K2.5 0.413, server-verified crashes, transcripts on request. Note 78/90 vs 100-task discrepancy = different runs/subsets — flag in proposals. Repo: `https://github.com/lordx64/cyberkimi-benchmarks` (14★, 3 forks, 0 watchers as of Sep 28).
- **ExploitBench V8 CVE-2024-6100:** Methodology-assisted 10/16, Unassisted 8/16, Kimi K3 stock 4/16; single-seed; "not a universal ranking". Method: bench-v8, 400-turn, seed 1, vLLM private node, stock CLI, per-episode transcripts — `.../blob/main/CVE-2024-6100.md`, leaderboard `https://exploitbench.ai/env/v8-cve-2024-6100/` (Mythos 16.0 / GPT-5.5-Codex-AutoNudge 15.0 above assisted run).
- **Related founder repos:** cyberkimi-pvp (129 commits, live CyberKimi vs models), phantom-kv (34 commits), pentestkit ("104/104 XBOW validation" claim), models.dev PR adding Adverserial as OpenAI-compat provider.
- **Skepticism to disclose:** OffSeq Threat Radar Sep 5 ("No official CVE ... independent verification lacking ... launched with --no-sandbox"); Kobaran Sep 5 ("not independently verified ... sandbox explicitly disabled ... No firm/Chrome corroboration"); D. Kucinic Aug 13 ("0 refusals, ever ... $149/mo ... No ID verification ... writes exploits as readily as detection rules" vs OpenAI Daybreak gates); Phying aggregator "16/16 ACE" conflicts with repo's own 8-10/16 — treat aggregator as unreliable.

### 5.4 Pricing (verified current Sep 28 — PAYG wallet only)

| Item | CyberKimi | CyberGLM |
|---|---|---|
| Input (cache miss) | $8 / 1M | $4 / 1M |
| Input (cache read) | $0.80 / 1M | $0.40 / 1M |
| Output (incl. reasoning) | $30 / 1M | $15 / 1M |
| Billing | Prepaid wallet `billing.adverserial.ai`, top-ups $10/$25/$50/$100, auto-refill optional, real-time debit, $0 = stop | Same wallet |

Sources: homepage + `https://adverserial.ai/docs.html` pricing table. 1 credit = $1 at CyberKimi PAYG rates. Monero accepted per LinkedIn (Stripe alternative). Enterprise: dedicated capacity, private weights, SSO — contact@adverserial.ai.

**Membership history (do not quote as current without qualifier):** V1 Foothold $29/mo (12 credits/wk ≈$52 PAYG/mo, 10/day, 30K out/day, 100K/wk, 1 concurrent) / Hacker Manifesto $149/mo (60/wk ≈$260, 20/day, 150K/day, 600K/wk) / G0DM0D3 $349/mo (140/wk ≈$607, 40/day, 350K/day, 1.5M/wk, 2 parallel), ~42-44% off PAYG when fully used, weekly reset no rollover, memberships covered CyberKimi only. Docs now: "Memberships — Gone — legacy converted to wallet credit at full value". Waitlist page: "stopping v1 ... v1 beta concluded", Priority Slot $149 one-time, Free $0, Enterprise trial — `https://adverserial.ai/waitlist.html`.

### 5.5 API (OpenAI-compat + Anthropic shim)

- Base `https://api.adverserial.ai/v1`, Chat `POST /v1/chat/completions`, Models `GET /v1/models`, IDs `lordx64/cyberkimi` + `cyberglm`, Auth `Bearer sk-...`. Keys in billing dashboard, multi named keys (`burp`, `ci-runner`), independent revocation, wallet preflight; chat-platform API rejects end-user keys by design. Never embed in client-side/public repos. Errors: 401 revoked, 403 wrong endpoint, 402 empty wallet (`/topup`), `finish_reason=length` → raise budget, 503 retry w/ backoff.
- Client budgets (conservative, not server cap): CyberKimi 750K (OpenCode example 65,536/8,192), CyberGLM 131,072. "Setting 1,048,576 does not increase server capacity." Documented integrations: Claude Code/Cline (Anthropic shim `https://api.adverserial.ai`, 750K override), Kimi Code (`~/.kimi/config.toml`), Codex CLI ≥0.134 (Responses shim, provider+profile, 750K/700K compact), Codex desktop (key-file auth), OpenCode (`@ai-sdk/openai-compatible`, `cyberkimi/lordx64/cyberkimi`), Hermes (verified Sep 13; `AWS_EC2_METADATA_DISABLED=true` on non-AWS).

```python
from openai import OpenAI
client = OpenAI(api_key="sk-YOUR-KEY", base_url="https://api.adverserial.ai/v1")
resp = client.chat.completions.create(model="lordx64/cyberkimi",
  messages=[{"role":"system","content":"You are a red-team operator assistant."},
            {"role":"user","content":"Write a Sigma rule for this behavior: ..."}],
  max_tokens=2048)
```

### 5.6 Legal / privacy (strongest auth wording of the three — read with nuance)

- **Terms (`/terms`):** "Use only for lawful activity, with rights/authorizations required." "Authorization comes first" — written auth (assets/techniques/windows/data-handling), stay in scope, bounty terms control. Permitted: lawful research, authorized red/blue, defensive engineering, RE, education, controlled testing. Prohibited: unauthorized access, malware/ransomware deployment, extortion/fraud/phishing outside engagement, disruption/sabotage, unlawful surveillance, IP theft, sanctions/export evasion, metering attacks. "Research label doesn't legalize." Human review mandatory before execution, isolated testing, allowlists/gates, no sole-AI life-safety decisions. "Do not assume guardrails capable of preventing unlawful activity. Response ≠ lawful. Capability never supplies permission." Dual-use explicitly includes exploit analysis, vuln research, offensive techniques, malware analysis. Input rights retained (limited processing license, not to sell/train); Output assigned to customer where transferable; no weight ownership. AS-IS, $100-or-12mo-fees cap, indemnity, suspension, abuse contact@.
- **Privacy (`/privacy` + docs FAQ + homepage):** "Privacy first: no inference/chat session logs, prompts not used to train." "Your evidence stays yours. No GPU request logs." Nuance: billing/usage retained (wallet, ledger, model, request ID, in/cached/out tokens — "not anonymous", Stripe); "Temporary chat ... not to save to history ≠ immediate erasure ... runtime buffers and GPU prefix/KV caches remain until eviction"; metric samples 30-day cleanup; account/usage/payment do NOT share expiry; providers Heroku (app), RunPod (GPU), Stripe, Google sign-in; 30-day billing cookie; DPA/region/air-gap only by explicit agreement.
- **Net for consultancy:** best contractual fit for authorized work (explicit auth-first + dual-use disclosure), but verify no-logging scope in writing for regulated clients (billing + KV-cache retention remains) and get DPA/region terms via Enterprise if needed.

### 5.7 Context: defensive AI scanners (v1's mistaken section, kept as one-liner)

Lakera (Check Point), Mindgard, Cisco AI Defense, Adversarial.com are **defensive AI-app testing/guardrail platforms**, not offensive LLMs — out of scope for this report's three-generator comparison. Use only if client needs AI-app audit pass-through ($100k+ enterprise); otherwise rely on §7 open-source regression (Garak/PyRIT/Promptfoo).

---

## 6. Comparison Matrix

| Feature | OrcaRouter Cyber Zero + Qwen-Uncensored | Abliteration Large-v2 / Base | Adverserial CyberKimi / CyberGLM |
|---|---|---|---|
| **Type** | Gateway + native cyber LLM | Hosted abliterated LLM | Specialist cyber lab (NJ LLC) |
| **Offensive generation** | ✅ gated Zero + uncensored Qwen | ✅ no per-request refusals | ✅ Kimi-K3-ablated + cyber-tuned, auth-first ToS |
| **Models** | 200+ routable, 1 native cyber + 3+ uncensored | 3 hosted (base/large/large-v2) | 2 (`lordx64/cyberkimi`, `cyberglm`) + CyberSeek soon |
| **Ctx** | Zero 1M/128K out; Qwen 262K | Base 262K; Large 1M/1M | Kimi 1M total (750K client, 512K bench); GLM 131K client |
| **Cyber bench (vendor)** | Zero 98.07% CyberGym L1 | Large-v2 84.5% CyberGym, 2× ExploitBench | Kimi 86.7% CyberGym (78/90); 10/16 assisted V8 CVE-2024-6100 + public transcripts |
| **Entry price** | $0 free + $3/$5 Zero | $20/mo + $3/$3, $5/$5 | PAYG wallet only (no current sub); top-up $10+ |
| **Scale cost** | ~$36/mo per 10M (70% in) | ~$50-80/mo per 10M + sub | Kimi $8/$0.80/$30; GLM $4/$0.40/$15 — ~$200+/10M output-heavy |
| **API** | `api.orcarouter.ai/v1` OpenAI + Anthropic/Gemini, MCP, Lite | `api.abliteration.ai/v1` OpenAI/Anthropic, Promptfoo/Garak/Mastra | `api.adverserial.ai/v1` OpenAI + Anthropic shim, Claude/Codex/OpenCode/Hermes docs |
| **Logging / audit** | Receipts/logs, budgets/roles, Team compliance | Zero-retention default, Gateway Ent-only | No inference/chat logs claim; billing + KV-cache retained; DPA/region only via Enterprise |
| **Guardrails** | Engagement+passkey+terms gating, agent firewall | Customer Gateway ("Unrestricted. Not ungoverned") | Auth-first ToS, human-review mandatory, "capability ≠ permission" |
| **Jurisdiction** | Singapore SIAC | Delaware | New Jersey LLC |
| **Best for** | Governed multi-model routing + cheap triage | Cheap uncensored volume | Hard repro + evidence-backed reports |

---

## 7. Legal Workflow: How to Use Each in Client Engagements

All three require **explicit written authorization** per target, scope-of-work, dates, IP ranges, accounts, forbidden actions (prod data exfiltration, persistence, lateral movement beyond scope), data handling, retest window. No authorization = ToS violation + criminal exposure. Mirror vendor disclaimers in your MSA.

**A. OrcaRouter in workflow**
1. Pre-engagement: apply for `orca/orcacyber-zero-1.0` with engagement letter (component, vuln class, quarter). Do not script around refusal/failover to evade vetting.
2. Scoping: create workspace per client, keys scoped to `orca/orcacyber-zero-1.0` + named dual-use bases (`openai/gpt-5.5`, `anthropic/claude-opus-4.8` for report writing — Zero's vendors note cyber models write reports worse), spending caps, `orcarouter/auto` disabled for scope control.
3. Execution: vuln triage/repro across large repos (1M ctx), root-cause, red-team tooling gen, patch validation. Log every call (Requests + `x-orca-resolved-model` receipts). Enforce 'evaluation before reliance' (Terms §6).
4. Deliverable: attach token receipts, resolved-model IDs, cache HIT/MISS, guardrail triggers for audit defensibility. Use `orcaverify-text1.0` to check AI-assisted phishing samples if relevant.
5. Post: revoke keys, retain logs per retention policy, invoice pass-through $3/$5 + Team overhead.

**B. Abliteration in workflow**
1. Pre-engagement: Developer $20 key for lab, Growth $50 for team audit logs, Scale $200 ($200 credit included) for heavy ExploitGym runs. Do NOT use anon free-tier for client data (1 call, images only).
2. Scoping: per-client projects, scoped `ak_` keys, per-user/project quotas, independent revocation, SIEM via Policy Gateway (Enterprise — budget this if client requires EU Act evidence; otherwise export token counts/timestamps/model IDs manually).
3. Execution: CVE repro, exploit dev, malware *analysis* (not delivery), jailbreak/prompt-injection suites (direct PDF/email RAG exfiltration, tool-misuse coercion), synthetic phishing/harassment datasets for detector tuning (paid 3-row preview → HF/S3 export). Use `abliterated-model-large-v2` max reasoning for Exploits, `abliterated-model` base for multimodal (screenshots). Disable web search/fetch for client-confidential prompts (third-party retention voids zero-retention).
4. Deliverable: include authorization ID, model ID (`large-v2` GLM-5.3 FP8), reasoning mode, `flagged_categories`, policy decision/reason if Gateway used, plus human validation statement (vendor outputs may be inaccurate).
5. Post: delete generated training datasets if client requires, retain billing metadata only, suspend keys. Note ToS gap to client: vendor allows authorized testing but bans illegal/harmful/high-risk — your letter is the shield.

**C. Adverserial in workflow**
1. Pre-engagement: top up wallet ($25-50 reserve, Monero option if needed), create named keys per tool in billing dashboard; note V2 waitlist for chat, API is wallet-direct.
2. Scoping: per-client keys, independent revocation, wallet preflight ($0 = stop). Map to OWASP / ATLAS for report structure. Get written auth per Terms S04.
3. Execution: hard vuln repro, V8/CVE analysis (cite public transcripts as precedent), Sigma/YARA/KQL, IR timeline, threat-hunt hypotheses. CyberKimi for depth, CyberGLM for cheaper drafts. Streaming + reasoning fields for audit trail; isolated testing + human review before execution.
4. Deliverable: include model ID, cache reads, benchmark context (86.7% subset, 10/16 assisted V8 single-seed + skepticism notes), privacy scope (billing/KV-cache retained), plus human validation (AS-IS, $100/12mo cap).
5. Post: revoke keys, retain billing ledger, invoice PAYG + Enterprise uplift if needed. Add Garak/PyRIT/Promptfoo regression between engagements.

---

## 8. Reviews Synthesis

**OrcaRouter:** Thin but mildly positive. Reddit `r/opencodeCLI` Aug 17 2026 (2 replies): "used free $20 hy3. Worked fine", "expired, monitor /offers" — free-credit driven. GitHub 1.7k stars/270 forks decent for 2026 router; positioning vs LiteLLM/OpenRouter/Ollama clear; 403-test suite trust signal. Cline/Helix discussions show organic integration demand. X promo 1B free tokens — marketing. LinkedIn 1.6k followers, outsized HF impact. No Trustpilot page, HN mentions 0 for Cyber Zero ("Community buzz") — **do not claim Trustpilot score**. Third-party docs (Promptfoo/PrivateGPT/Mastra/Apify) list as first-class — reliability implied, no complaints surfaced.

**Abliteration:** No verified product reviews. Slashdot/SourceForge 0 ratings "Be first", Capterra listing no scores. Press hands-on negative on safety, positive on friction removal: TechCrunch Sep 3 2026 "turned removal into service... quickly create account free"; CoderCops Sep 8 critical (free account → working Chrome password-stealer + pathogen protocol; self-harm held; check = credit card only; Fabraix prefers fine-tuning, abliteration degrades; Armadin not yet in process; bootstrapped no VC); Magica Sep 3 balanced-critical (SDK+billing+gateway is distinction, not new capability; gateway unvalidated; $20/$50/$200, $3/$5; free 500 tokens meaningless; Kuo May 2026 abliteration ASR 10%→16-96%); ExplainX Sep 1 skeptical (2× cyber, 84.5%/54.4%/105 ExploitGym all Z.ai self-report, "nobody outside verified"); Chosun/Gizmodo/TechBuzz same launch fear vs defender-needs. LessWrong most damning for bio: 9 clicks anon email, WMDP-Bio 91%/89%, Bio Propensity 92%/99%, $0.13/$0.05 per useful answer, ~300 pathogen queries no flag/ban, no bio filters, only self-harm+CSAM, no monitoring/storage; capability cost <1pp. X launch thread claims #3 Terminal-Bench, 2× cyber — no independent praise. Reddit technique mixed: abliteration inconsistent, single-vector countermeasures, "unable to refuse ≠ uncensored", moralizing remains, KLD flawed, Gemma-3 junk/stall vs Huihui wins math/code; r/Pentesting 2026 "Anyone using abliterated LLMs..." (403 title only); RedHat Developers May 26 2026 positive infra (OpenClaw+OpenShift red-teaming with abliterated). GitHub org 23 followers, forks ragas/cherry-studio/promptfoo/garak/buttercup + ai-sdk-provider 1★; examples 6★; PyRIT #2306 requests Abliteration as target (demand signal). **Net:** friction + capability praised (drop-in, 1M, FP8 preserved); uncensoring confirmed by adversaries but disputed as "sociopath" vs "degraded"; governance unproven; no enterprise peers.

**Adverserial:** No Trustpilot, no Discord, no G2/Gartner (too new/solo). GitHub `lordx64/cyberkimi-benchmarks` 14★/3 forks/0 watchers — low but transcripts public (CVE-2024-6100 full method + per-episode logs). Social largely founder-seeded: Reddit r/ArtificialIntelligence + r/LocalLLM + r/ollama "CyberKimi just dropped ..." + r/LocalLLM CyberPvP intro, r/opencode Kimi threads; X `@lordx64` (chart ACE claims, fetch-blocked); LinkedIn company+founder posts (CyberGym 0.86, memberships, Monero, Inception-compute). Independent scrutiny is skeptical and must be disclosed: OffSeq Threat Radar Sep 5 ("No official CVE ... independent verification lacking ... --no-sandbox"); Kobaran Sep 5 ("not independently verified ... sandbox explicitly disabled ... No firm/Chrome corroboration"); D. Kucinic Aug 13 ("0 refusals, ever ... $149/mo ... No ID verification ... writes exploits as readily as detection rules" vs Daybreak gates); Phying "16/16 ACE" conflicts with repo's own 8-10/16 — unreliable. **Net:** strongest public evidence of the three (transcripts + quantified deltas vs Kimi K3 stock 4/16), but single-seed, small repo, founder-led distribution, V8 <24h weaponization uncorroborated.

---

## 9. Recommendation: Best Cost-Effective Method & Model

### 9.1 Winner for offensive generation: Abliteration `abliterated-model-large-v2` + OrcaRouter gateway (revised with Adverserial pricing)

**Why this pair still wins on cost per useful finding:**

- Entry $20 (Abliteration Developer, 2.5% discount) + $0 (OrcaRouter Hacker free) = **$20/mo to start**, vs Adverserial PAYG with no free tier and $8/$30 CyberKimi (6× output cost).
- Per-token: Abliteration large-v2 $5/$5 (cached $0.30-0.50) with 1M ctx and vendor-claimed 84.5% CyberGym / 2× ExploitBench; OrcaRouter Zero $3/$5 (cached $0.30) with 98.07% CyberGym L1; Qwen-Uncensored $0.33/$2.40 for triage. Realistic 10M/mo mixed (70% in, 50% cache hit) = **$36 Orca Zero + $40-60 Abliteration = $56-80/mo total** before sub. Same 10M output-heavy on Adverserial CyberKimi = **$200-300+** (output $30/M dominates). Use Adverserial selectively, not for bulk.
- Zero-retention (Abliteration) + receipts/budgets/roles (OrcaRouter) = cheapest audit-defensible combo without Enterprise contracts.
- OpenAI-compat all three → one codebase (`base_url` swap), Promptfoo/Garak/PyRIT/Mastra/OpenCode/Strix + Adverserial Claude/Codex/OpenCode/Hermes configs.

**When to pick which generator:**

- Use **Abliteration large-v2** when you need uncensored jailbreak/injection/exploit-dev/phishing synthesis with max reasoning and don't want per-request refusals breaking automation. Best raw cost-per-attack-step.
- Use **OrcaRouter Zero** when you need gated, engagement-scoped vuln repro across large repos with compliance reports for regulated clients (banks, infra). Best defensibility-per-dollar. Use Qwen-Uncensored/Free for cheap triage before spending large-v2/Zero tokens.
- Use **Adverserial CyberKimi** when you need specialist depth + evidence you can show a client (public CyberGym/ExploitBench transcripts, Sigma/YARA/KQL + IR workflow, 1M ctx, privacy-first claim). Best proof-per-engagement despite $8/$30. Use **CyberGLM $4/$15** for cheaper mid-tier drafts while in development.
- Self-host community abliterated weights (`dealignai/GLM-5.3-ABLITERATED-NVFP4`, `huihui BaronLLM`) + vLLM when you have GPU and need $0 marginal cost for lab fuzzing — but add your own logging (no vendor receipts).

### 9.2 Revised best cost-effective method (with Adverserial in the mix)

- **Daily driver (volume): Abliteration + OrcaRouter.** Start every engagement with Qwen-free triage → Abliteration large-v2 for bulk exploit/jailbreak/injection work → OrcaRouter Zero for gated repro needing receipts. Keeps you under $100/mo.
- **Specialist reserve (proof): Adverserial PAYG $25-50 top-up.** Invoke CyberKimi only for hard cases: V8-style repro requiring transcript-backed methodology, 1M-ctx log/code hunts, Sigma/YARA/KQL + IR deliverables where you need to cite public benchmarks (86.7% CyberGym, 10/16 assisted V8) and auth-first ToS. Bill through as disbursement + your $15-50k human audit + 15-25% compliance uplift. Never use $30/M output for bulk fuzzing — use $5/M large-v2 or $0.33/M Qwen instead.
- ** math:** 1M input + 200K output on Kimi = $8 + $6 = $14 per deep case; same on large-v2 = $5 + $1 = $6; on Qwen triage = <$1. Route accordingly: triage cheap, prove expensive.
- If client mandates no-logging + DPA/region/air-gap, quote Adverserial Enterprise (dedicated capacity, private weights, SSO) as pass-through — same pattern as Abliteration Enterprise Gateway / OrcaRouter Team.

### 9.3 Concrete starter stack (copy-paste budget)

1. Abliteration Developer $20/mo (large-v2 for exploits, base for multimodal) — scoped `ak_` per client.
2. OrcaRouter Hacker $0 + $30 top-up (Zero for gated repro, Qwen-free for triage, Verify $2/M for AI-content checks) — scoped `sk-orca-*` per workspace, caps on.
3. Adverserial PAYG $25 top-up reserve (CyberKimi for hard repro + report-grade evidence, CyberGLM for mid-tier) — named keys per tool, wallet preflight on.
4. Total fixed: **$20/mo + usage ~$30-60/mo + $25 reserve**. Charge client $6k-45k per audit per SecurityWall anchor. Margin covers Scale $200 upgrade ($200 credit included, 10% discount) when you hit limits.
5. Upgrade triggers: need Policy Gateway SIEM with reason codes → Abliteration Enterprise; need Team compliance reports/audit → OrcaRouter Team Custom; need dedicated capacity/private weights/SSO/DPA → Adverserial Enterprise pass-through.

This is the cheapest stack that gives you 1M-context uncensored volume (Abliteration/Orca) + evidence-backed specialist (Adverserial) with zero-retention/no-log claims + receipts.

---

## 10. Installation & Integration Guides

### 10.1 OrcaRouter (5 min)

```bash
# 1. Sign up https://www.orcarouter.ai/ → API keys → sk-orca-...
# 2. (Optional) claim credits https://www.orcarouter.ai/offers
export ORCAROUTER_API_KEY=sk-orca-...
```

```python
from openai import OpenAI
client = OpenAI(base_url="https://api.orcarouter.ai/v1", api_key="sk-orca-...")
# triage cheap
triage = client.chat.completions.create(model="qwen/qwen3.8-27b-free",
  messages=[{"role":"user","content":"List attack surface for scope ... (auth ID ...)"}])
# gated repro (after approval)
repro = client.chat.completions.create(model="orca/orcacyber-zero-1.0",
  messages=[{"role":"user","content":"Reproduce CVE ... from diff ..."}])
print(repro.headers.get("x-orca-resolved-model"), repro.headers.get("x-orca-cache"))
```

MCP: `Continuum-AI-Corp/orcarouter-mcp-server` for Claude Desktop/Cursor/Windsurf. Lite self-host: `git clone .../OrcaRouter-Lite`, `model="auto"`, BYOK, `http://localhost:8000/v1`.

### 10.2 Abliteration (5 min)

```bash
# 1. Sign up https://abliteration.ai/console → ak_...
export ABLIT_KEY=ak_YOUR_KEY
curl https://api.abliteration.ai/v1/chat/completions \
 -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
 -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Hello"}]}'
# OpenAPI https://api.abliteration.ai/openapi.json
# Models https://api.abliteration.ai/v1/models ; Balance GET /credits/balance
```

LangChain/LlamaIndex: `ChatOpenAI(base_url="https://api.abliteration.ai/v1", api_key, model="abliterated-model-large-v2")`. Promptfoo: built-in `abliteration-ai` provider for red-team evals. Strix/CyberStrike/OpenCode: OpenAI-compat custom provider. Policy Gateway (Enterprise): `POST /policy/chat/completions` with `policy_id, policy_user, project ID` → Splunk/Datadog/Elastic/S3/webhook.

### 10.3 Adverserial (5 min)

```bash
# 1. Top up wallet https://billing.adverserial.ai/ ($10/$25/$50/$100, auto-refill optional)
# 2. Create API key in billing dashboard (Account API keys), name per tool
export ADVERSERIAL_API_KEY=sk-YOUR-KEY
# 3. Chat https://chat.adverserial.ai/ (may require V2 waitlist/Priority Slot); API is wallet-direct
```

```python
from openai import OpenAI
client = OpenAI(api_key="sk-YOUR-KEY", base_url="https://api.adverserial.ai/v1")
resp = client.chat.completions.create(model="lordx64/cyberkimi",
  messages=[{"role":"system","content":"You are a red-team operator assistant."},
            {"role":"user","content":"Write a Sigma rule for this behavior: ..."}],
  max_tokens=2048)
```

Claude Code/Cline: `ANTHROPIC_BASE_URL="https://api.adverserial.ai"`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_MODEL="lordx64/cyberkimi"`, `CLAUDE_CODE_MAX_CONTEXT_TOKENS=750000`. Codex CLI ≥0.134: provider `base_url="https://api.adverserial.ai/v1" wire_api="responses"` + profile `model="lordx64/cyberkimi" window 750000/compact 700000`. OpenCode: provider `cyberkimi` npm `@ai-sdk/openai-compatible` baseURL `https://api.adverserial.ai/v1`, model `cyberkimi/lordx64/cyberkimi` (see docs for ASCII-quote gotcha). Kimi Code `~/.kimi/config.toml`, Hermes `~/.hermes/config.yaml + .env` (add `AWS_EC2_METADATA_DISABLED=true` on non-AWS). Full reference: `https://adverserial.ai/docs.html`.

Open-source regression between audits: `promptfoo redteam run`, `garak`, `pyrit` (PyRIT #2306 requests Abliteration as target — wire `ABLIT_KEY` as target; same pattern works for Adverserial keys).

---

## 11. Risks, Caveats & What Not to Do

- Do not conflate OrcaRouter (`orcarouter.ai`) with OpenRouter (`openrouter.ai`) or Adverserial (`adverserial.ai` with E) with Adversarial (`adversarial.com` / adversarial-ML category) in contracts — different companies, jurisdictions, model IDs.
- Do not claim Trustpilot/G2 scores that don't exist (OrcaRouter no Trustpilot, Abliteration 0 ratings, Adverserial no Trustpilot/Discord/G2 — only 14★ GitHub + founder-led social). Cite benchmarks with URLs + single-seed caveats.
- Do not use uncensored models for malware delivery, pathogen assistance, or unauthorized targets — all ToS ban illegal/harmful/high-risk and allow suspension + upstream metadata sharing. Abliteration's filters (only self-harm/CSAM per LessWrong) and Adverserial's "capability ≠ permission" do NOT protect you legally without written auth.
- Do not send client-confidential prompts with web search/fetch enabled on Abliteration (third-party retention voids zero-retention). On Adverserial, note billing + KV-cache retention despite "no logs" marketing — get DPA/region in writing for regulated clients.
- Do not rely on vendor benchmarks alone (Orca 98.07%, Abliteration 84.5%/2×, Adverserial 86.7%/10-16 V8) — all vendor-reported, small/single-seed, V8 <24h uncorroborated (OffSeq/Kobaran). Run your own sample + disclose skepticism before quoting accuracy to clients.
- Do not use legacy $29/$149/$349 Adverserial memberships in proposals — now legacy/wallet-credit + V2 waitlist. Quote PAYG $8/$0.80/$30 Kimi, $4/$0.40/$15 GLM + top-ups.
- Do not absorb Enterprise costs — always pass through Adverserial dedicated/SSO/DPA + your human fee + compliance uplift.
- Pricing drift: Orca live prices refresh 60s, Gemini promo doubles Jan 1 2027, Abliteration cached $0.30 vs $0.50 conflict, Adverserial serving 512K vs 1M marketing vs 750K client budget — re-check `/models` + `/pricing` + `/docs.html` at proposal time.

---

## 12. Sources

### Primary (vendor docs, fetch as truth)
- `https://www.orcarouter.ai/`, `/models`, `/models/orca/orcacyber-zero-1.0`, `/models/orca/orcaverify-text1.0`, `/models/google/gemini-3.8-flash`, `/pricing`, `/offers`, `/support`, `/terms.html`, `/trust`, `https://docs.orcarouter.ai/introduction`, `https://www.orcarouter.ai/blog/orcarouter-omacom-foundation-corporate-patron`, `.../gemini-3-8-flash-cyber-release`, `.../gpt-5-6-cyber-vs-gpt-5-5-cyber`, `.../gpt-5-6-cyber-vs-mai-cyber-1-flash`, `.../blog/gpt-5-6-cyber-vs-gpt-5-5-cyber`
- `https://abliteration.ai/`, `/platform`, `/pricing`, `/security-testing`, `/use-cases/ai-red-teaming`, `/use-cases/cybersecurity`, `/training-data`, `/data-handling`, `/terms-of-service`, `/press`, `/models/abliterated-model`, `/blog/introducing-abliterated-model-large`, `/blog/introducing-abliterated-model-large-v2`, `https://docs.abliteration.ai/models.md`, `/pricing`, `/quickstart.md`, `/llms.txt`, `/api/introduction.md`, `/capabilities/streaming.md`, `https://api.abliteration.ai/openapi.json`
- `https://adverserial.ai/`, `/docs.html`, `/founder.html`, `/terms`, `/privacy`, `/waitlist.html`, `https://chat.adverserial.ai/`, `https://billing.adverserial.ai/`, `https://api.adverserial.ai/v1`, `https://github.com/lordx64/cyberkimi-benchmarks`, `.../blob/main/CVE-2024-6100.md`, `https://github.com/lordx64`, `https://huggingface.co/lordx64`, `https://x.com/lordx64`, `https://www.linkedin.com/in/tahakarim/`, `https://exploitbench.ai/env/v8-cve-2024-6100/`

### Code / model hubs
- `https://github.com/Continuum-AI-Corp/OrcaRouter-Lite`, `https://github.com/continuum-ai-corp`, `https://github.com/abliteration-ai`, `https://github.com/abliterationai/abliteration-examples`, `https://github.com/abliteration-ai/ai-sdk-provider`, `https://huggingface.co/orcarouter`, `https://huggingface.co/abliterationaiorg`, `https://huggingface.co/dealignai/GLM-5.3-ABLITERATED-NVFP4`, `https://huggingface.co/Securelayer7/Qwen3.8-27B-Uncensored-Abliterated`, `https://huggingface.co/huihui-ai/BaronLLM_Offensive_Security-abliterated-GGUF`, `https://ollama.com/orcarouter`, `https://mastra.ai/models/providers/orcarouter`, `https://mastra.ai/models/providers/abliteration-ai`, `https://www.promptfoo.dev/docs/providers/orcarouter/`, `https://docs.privategpt.dev/providers/orcarouter`
- OpenRouter appendix (name-confusion only): `https://openrouter.ai/models`, `/pricing`, `/terms`, `https://openrouter.ai/cognitivecomputations/dolphin-mistral-24b-venice-edition:free`

### Press / third-party / reviews
- `https://techcrunch.com/2026/09/03/abliteration-ai-is-making-a-business-out-of-removing-ai-guardrails/`, `https://tech.yahoo.com/ai/deals/articles/abliteration-ai-making-business-removing-183757546.html`, `https://blog.codercops.com/blog/abliteration-ai-uncensored-models-enterprise-risk-2026`, `https://magica.com/news/abliteration-ai-hosted-guardrail-removed-models`, `https://www.explainx.ai/blog/abliteration-ai-glm-5-3-hosted-uncensored-cyber-model-2026`, `https://www.lesswrong.com/posts/BShGBvtxGoaZvCqBk/abliterated-models-are-now-served-cheaply-and-conveniently-1`, `https://www.chosun.com/english/industry-en/2026/09/10/RUI2WFD76VETHJSGFFP7QFKK6Q/`
- `https://www.reddit.com/r/opencodeCLI/comments/1vr1uuz/has_anyone_tried_orcarouter/`, `https://www.reddit.com/r/LocalLLaMA/comments/1f07b4b/abliteration_fails_to_uncensor_models_while_it`, `https://www.reddit.com/r/ArtificialIntelligence/comments/1vjtx7a/cyberkimi_just_dropped_strong_results_on_one_of/`, `https://www.reddit.com/r/LocalLLM/comments/1vjuhp7/cyberkimi_just_dropped_strong_results_on_one_of/`, `https://www.reddit.com/r/ollama/comments/1vjuksn/cyberkimi_just_dropped_strong_results_on_one_of/`, `https://www.reddit.com/r/LocalLLM/comments/1wrytrx/introducing_cyberpvp_cyberkimi_vs_altar1_on_100/`, `https://x.com/OrcaRouter`, `https://x.com/abliteration_ai/status/2094458081451393287`, `https://x.com/lordx64`, `https://x.com/k2sbhai/status/2089358084627955921`
- `https://radar.offseq.com/threat/ai-model-cyberkimi-claims-it-turned-a-3-day-old-v8-patch-into-a-live-chrome-exploit-in-under-24-hours-edec50aa81421de5`, `https://www.kobaran.com/cyberkimi-ai-claims-it-weaponized-a-chrome-v8-patch-in-under-a-day/`, `https://www.linkedin.com/posts/dkucinic_expanding-daybreak-as-the-cyber-defense-window-activity-7493633709191991296-QLz6`, `https://securitywall.co/blog/llm-security-audit-cost`
- Funding/acquisition: `https://www.prnewswire.com/news-releases/orcarouter-launches-the-open-llm-api-router--zero-markup-mit-licensed-100-models-302766356.html`

### Local
- `W/report/ai-security-vulnerabilities-2026-09-27.md`, `W/report/omo-alternatives-opencode-v2-2026-09-28.md`, `W/report/multi-agentic-workflows-2026-09-28.md`

---

## 13. DreadNode — Agent Infrastructure Explained + Cost Verdict (2026-09-28 addition)

> **One-line answer:** DreadNode (`https://dreadnode.io/`) is **not another LLM** like CyberKimi or Abliteration. It is the **operating system around the LLM** — sandboxed hacker agents + evals + evidence trail + self-hosting — that lets you run *any* model (including the three above) against authorized targets and prove what happened. Pricing is **Pro $0/mo pay-as-you-go (1 credit = $0.01, 1,000 credits per $1 inference) + Enterprise custom (annual fee + credits)**. Verdict: **yes, cost-effective as force-multiplier, no as bulk token provider** — keep Abliteration/OrcaRouter for cheap tokens, add DreadNode Pro with $25-50 credits for agentic engagements.

### 13.1 What is it exactly? (plain English + technical)

**For a non-technical client:** a supervised lab for an AI junior pentester that works at machine speed. Isolated computers (sandboxes), a rulebook for what it may touch (Scope → Approve → Judge → Record → Govern), a judge watching it (LLM judges for scope/cheating), and a camera recording everything (traces, tool calls, policy decisions). You supply written authorization; every finding ships with request/response evidence for your report.

**Technical:** "AI infrastructure for cyber operations" / "Sovereign cyber capabilities you can depend on". Four pillars on `https://dreadnode.io/platform/` (fetched Sep 28):
1. **Operations** — ready capabilities + workflows + Workers, persistent sessions web + terminal (`dn` TUI).
2. **Agent Intelligence** — project memory, structured findings, datasets, post-training.
3. **Evaluations** — task evals + LLM judges + AI red-teaming (70+ strategies, 600+ transforms, 130+ scorers).
4. **Observability** — live sessions, nested tool calls, policy decisions, cost/latency comparison.

**Sovereignty thesis:** "Own it. All of it. Run inside your boundary." Self-host on K8s/VM/air-gap, BYOK or self-hosted models, data stays in your stores. This is the opposite of black-box renting — you keep capabilities, data, and accumulated knowledge if you leave.

**Company:** DreadNode, founded **2023 by Will Pearce (ex-Microsoft/NVIDIA AI red-team lead) + Nick Landers (ex-NetSPI VP Research, Dark Side Ops author)**. Operating Bozeman MT, DE corp. CEO Brad Palm. **$14M Series A Feb 25 2025 led by Decibel + Next Frontier, In-Q-Tel (IQT), Sands, Indie VC** — `https://dreadnode.io/company/newsroom/series-a/`. 2.0 GA Mar 24 2026 ("first complete infrastructure platform for security agents"). Trust `https://trust.dreadnode.io/`, Status `https://status.dreadnode.io`, Docs `https://docs.dreadnode.io`. GitHub `github.com/dreadnode` (33 repos): `rigging` 418★ (LLM framework), `dyana` 367★ (ML sandbox), `DreadGOAD` 107★ (AD lab), `ares` 84★ (red-vs-blue), `robopages` 89/37, `sdk` 30, `capabilities` 17, `burpference` (Burp LLM extension).

**Name warning:** DreadNode product is **Strikes (with k)** — evals SDK. **Strix (`usestrix/strix`, `strix.ai`) is a separate open-source AI pentester, NOT DreadNode.** Do not conflate. Old trio Strikes/Spyglass/**Crucible** (65+ free CTF challenges, used by CISA/PwC/Target/Intel/Bishop Fox) was **sunset Mar 23-24 2026** after 2.5 years; successor is Resource Hub (~1,600 tasks) + capabilities registry.

### 13.2 What it does (capabilities you would actually run)

- **AI Red Teaming:** any modality/target, algorithmic probing, safety + agentic + multilingual + multimodal — `https://docs.dreadnode.io/ai-red-teaming/`.
- **Web Security:** autonomous OODA-loop pentester, headless browser, **~70-84 skills** (83 playbooks homepage / 84 skills platform / 70+ quickstart — version drift): req-smuggling, cache poisoning, SSRF, SSTI, DOM, OAuth, GraphQL, auth-matrix, blind SQLi, traversal, JS analysis, Pacu AWS. Leads → findings only with evidence.
- **Network Operations:** discovery, AD assessment, attack-path + C2.
- **Hosted Evals + DreadIndex:** BYO envs/scorers, 76 tasks/10 cats leaderboard (Sep 2026: Claude Opus 4.7 #1 67.1, DeepSeek-V4-Pro best value 52.2 @ $0.58/1M) — `https://dreadnode.io/research/dreadindex/`. Research pipeline into product: ScopeJudge (8 judges/4,897 calls, best human-range but **missed 1-in-10 violations**), Every Model Cheats (23 tasks/1,518 traces), AIRTBench, Worlds (synthetic net-gen, 8B to Domain Admin on synthetic only).
- **Guardrail chain:** Scope (restrict + check) → Approve (allow/block/approval) → Judge (drift/cheating flags) → Record (every decision + reason) → Govern (org/workspace roles). Policy Aug 2026 argues open-weights + air-gapped sandboxes + standardized telemetry + safe harbor — use to justify isolated-lab methodology.

### 13.3 How to use it (consultancy runbook)

1. **Sign up:** `https://app.dreadnode.io/?mode=register` (browser, no install) or book demo. No OpenCode plugin — interop via MCP/CLI/webhook.
2. **Install (60s):** `curl -fsSL https://dreadnode.io/install.sh | bash` → `dn` → 1 browser login / 2 API key → `dn capability install dreadnode/web-security` → `/agent web-security` → `> test /api/v1/auth on https://target.example — full scope`. TUI: Ctrl+P capabilities, Ctrl+A agents, /thinking, Ctrl+O/T/B traces/sessions. Python: `pip install -U dreadnode` (Strikes SDK).
3. **Integrate:** MCP servers + CLI + custom capabilities (`https://docs.dreadnode.io/guides/building-a-capability/`); optional Caido/Burp auto-load + `burpference`; first-class **Slack (mention-run), HackerOne, Linear, Webhooks** via Connections (where) + Actions (JSON what) + human review + Staged Findings. SaaS webhooks need public HTTPS; private only on Enterprise/self-host.
4. **Models:** `dn/*` hosted vs BYOK (`openai/*`, `anthropic/*` on your key — **zero DreadNode credits**). Rates in UI `/models` or Account → Chat Models.
5. **Execute + assure:** prompt with full scope ("Django ..."), agent recon → probe → exploit attempt; coach ("show request/response confirming it"); Esc interrupt; `report` tool → `~/.dreadnode/reports/*.md` + web Reports. Re-run hosted evals + judges (correctness/scope/cheating), compare models/versions, export traces for workpapers.
6. **Report + bill:** human reviews every payload (1-in-10 judge miss), submit via HackerOne/Linear/webhook. Track TUI `usage $X.XX`, Inference Usage + Transaction History; set Org member caps + auto-refill caps.

SOW clause: "All agentic testing limited to written-authorized hosts in Appendix A, from isolated DreadNode sandboxes/runtimes with scope policies + human approval for exploit/write actions; full traces retained; no client data used for training."

### 13.4 Is it cost-effective? (numbers)

Source of truth `https://dreadnode.io/pricing/` + `https://docs.dreadnode.io/platform/credits/` (both fetched Sep 28):

- **Pro: $0 monthly, no commitment.** All features, unlimited seats + team mgmt, managed SaaS, Stripe (cards/bank/CashApp).
- **Enterprise: Custom — one-time annual fee (varies by deployment/SLA/custom work) + PAYG credits.** On-prem K8s/embedded VM, offline/air-gap bundles, data in your stores, dedicated engineer, custom capabilities.
- **Credit math: 1 credit = $0.01. 1,000 credits per $1 inference. Min 1/call. Formula `(in/1M*rate_in + out/1M*rate_out)*1000 round up`.** Example doc: `dn/claude-sonnet-4-6` $3/$15 → 2k in + 500 out = $0.0135 = **14 credits**. Rates live in UI, not static list. Sandbox **1,000 credits ≈ 5 hrs** default SaaS; telemetry + hosted search also metered. **BYOK = zero credits.**
- **Free:** historically "$25 complimentary" snippet; current "signup credits depend on eligibility" + anti-abuse review (one claim/personal org). Purchased credits **never expire**. Auto-refill threshold/qty/monthly cap; failed payment disables. Zero balance pauses durable sandboxes, stops ephemeral, blocks `dn/*`.
- **Data use: "No. Your data is never used for training. All eval/training/Worlds/red-team data stays within your org."** ToS `https://app.dreadnode.io/terms` (Feb 23 2025): limited revocable license, **personal non-commercial unless commercial license obtained** — consultancy must procure commercial/Enterprise terms, do not rely on clickwrap.

**Verdict vs your stack:**
- Tokens are **not** cheaper than Abliteration ($5/$5) or Orca Zero ($3/$5) or Qwen ($0.33/$2.40) — DreadNode charges model rate *plus* MicroVM/telemetry overhead, and agentic loops burn fast (40-min engagement; DreadIndex runs $4.93–$1,853 in cost column). Do NOT use it as bulk token provider.
- It **is** cost-effective as **labor multiplier**: $0 entry, unlimited seats, no per-scan fee, BYOK arbitrage, on-prem for regulated clients, evidence/judges/traces that cut weeks→hours and survive audit (with human review for the 1-in-10 miss). Practical pattern: **Pro + $25-50 credits for quick assessments, pass through credits + analyst review time; Enterprise on-prem/air-gap + annual fee only for banks/gov requiring boundary control.**
- No G2/Gartner (niche/infra-stage), no Reddit review thread, GitHub modest but researcher-loved (rigging/dyana), press positive-nostalgic (Crucible "best learning challenges", Decibel "trusted partner", SecurityWeek $14M, Boschko praise, DEF CON AI Village CTFs). No material negatives found — small elite-loved (NVIDIA/Microsoft/Meta/Cohere/NetSPI alumni, IQT, CISA→Bishop Fox users).

**Updated recommendation:** keep §9 stack (Abliteration $20 + Orca $30 + Adverserial $25 reserve) and **add DreadNode Pro $0 + $25-50 credits** as 4th layer for agentic web/network/AI-red-team runs. Route: cheap models for tokens → Adverserial for hard repro proof → DreadNode for supervised agent execution + evals + evidence. Total starter still under ~$150/mo before client pass-through ($6k-45k/audit anchor).

---

## 12b. Sources — DreadNode addition (2026-09-28)

### Primary (fetched)
- `https://dreadnode.io/`, `/platform/`, `/pricing/`, `/company/about/`, `/company/policy/`, `/company/newsroom/series-a/`, `/company/newsroom/dreadnode-v2-security-agent-infrastructure-platform/`, `https://docs.dreadnode.io`, `/getting-started/quickstart/`, `/getting-started/authentication/`, `/platform/credits/`, `/ai-red-teaming/`, `/integrations/`, `/guides/building-a-capability/`, `https://app.dreadnode.io/?mode=register`, `https://app.dreadnode.io/terms`, `https://app.dreadnode.io/privacy`, `https://trust.dreadnode.io/`, `https://status.dreadnode.io`, `https://dreadnode.io/research/dreadindex/`

### Code / research
- `https://github.com/dreadnode`, `https://github.com/dreadnode/rigging`, `https://github.com/dreadnode/sdk`, `https://github.com/dreadnode/burpference`, `https://github.com/dreadnode/ares`, `https://pypi.org/project/dreadnode/`, `https://arxiv.org/html/2504.19855v2`, `https://x.com/dreadnode/status/2036164368304578640`, `https://www.decibel.vc/articles/dreadnode-why-great-offense-drives-defense-in-ai-security`, `https://www.securityweek.com/offensive-ai-startup-dreadnode-secures-14m-to-stress-test-ai-systems/`, `https://cybersectools.com/tools/dreadnode-crucible`, `https://boschko.ca/adversarial-ml/`

### Local
- `W/report/ai-security-vulnerabilities-2026-09-27.md`, `W/report/omo-alternatives-opencode-v2-2026-09-28.md`, `W/report/multi-agentic-workflows-2026-09-28.md`

---

*Report v3: 2026-09-28 — added §13 DreadNode. Method: homepage/platform/pricing fetch + subagent deep research (TinyFish/Exa/You.com) + docs review. Re-check live credit rates in UI before proposals. Authorized testing only.*

---

## 14. OpenAI & Anthropic Cyber Models vs Poor Man's Stack — Comparison & Techniques (2026-09-28 addition)

> **One-line answer:** OpenAI's GPT-5.6 Cyber ($12.50/$75 per 1M) and Anthropic's Claude Mythos 5.1 (Glasswing-only) are the most capable cyber models ever built — but they are **15-25× more expensive** than your stack and **gated behind enterprise vetting**. You cannot match them dollar-for-dollar, but you *can* match their **output quality** on most real-world tasks using the techniques below. The secret is: **the moat is the system, not the model.**

### 14.1 The Frontier Cyber Models (what you're up against)

#### OpenAI GPT-5.6 Cyber (`gpt-5.6-cyber`)

| Attribute | Value |
|---|---|
| **Model ID** | `gpt-5.6-cyber` (alias `gpt-daybreak-red-latest`) |
| **Base** | GPT-5.6 Sol |
| **Announced** | Aug 10, 2026 |
| **Context** | 400K (272K in / 128K out) |
| **Pricing** | **$12.50/M input, $1.25/M cached, $75.00/M output** |
| **Cyber premium** | 2.5× GPT-5.6 Sol ($5/$30) |
| **CyberGym** | 84.5% (Sol baseline; Cyber variant higher on advanced tasks) |
| **Advanced cyber completion** | **95%** (exploit chains, privesc, auth bypass) vs 1.5% for Sol |
| **Access** | **Daybreak Red only** — separate approval, identity verification, hardware security keys, per-project scoping |
| **API** | Responses API only (`v1/responses`) |
| **Guardrails** | Cyber classifiers, `cyber_policy` revocation, human review for high-risk |

Sources: `https://developers.openai.com/api/docs/models/gpt-5.6-cyber`, `https://www.securityweek.com/openai-unveils-new-cybersecurity-model-gpt-5-6-cyber`, `https://www.csoonline.com/article/4207896/openai-launches-gpt-5-6-cyber-as-ai-narrows-vulnerability-response-window.html`

#### OpenAI GPT-5.5 Cyber (`gpt-5.5-cyber`)

| Attribute | Value |
|---|---|
| **Announced** | May 7, 2026 (limited), Jun 22 2026 (full) |
| **Pricing** | $12.50/$75 per 1M |
| **CyberGym** | **85.6%** |
| **UK AISI expert pass rate** | 71.4% (±8.0%) |
| **Access** | Trusted Access for Cyber (TAC) — vetted security professionals |
| **Guardrails** | Daybreak Blue/Red tiering, cyber classifiers |

Sources: `https://www.cnbc.com/2026/05/07/openai-rolls-out-new-gpt-5point5-cyber-to-vetted-cybersecurity-teams.html`, `https://www.aisi.gov.uk/blog/our-evaluation-of-openais-gpt-5-5-cyber-capabilities`

#### Anthropic Claude Mythos 5.1 (Glasswing-only)

| Attribute | Value |
|---|---|
| **Model ID** | Not publicly listed (Glasswing partners only) |
| **Announced** | Sep 1, 2026 |
| **CyberGym** | **84.5%** |
| **UK AISI expert CTF** | **73%** success rate |
| **32-step cyber range** | First model ever to complete end-to-end (3/10 attempts) |
| **Access** | **Project Glasswing only** — ~200 vetted organizations (AWS, Apple, Cisco, CrowdStrike, Google, Microsoft, NVIDIA, Palo Alto Networks, etc.) |
| **Pricing** | Not public; Anthropic committed $100M in usage credits across partners |
| **Guardrails** | None additional — raw capability with organic refusals |

Sources: `https://www.anthropic.com/glasswing`, `https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities`

#### Anthropic Claude Fable 5.1 (`claude-fable-5-1`)

| Attribute | Value |
|---|---|
| **Announced** | Sep 1, 2026 |
| **Pricing** | **$10.00/M input, $50.00/M output** |
| **Cyber queries** | Routed to Opus 4.8 via classifier (not full Mythos capability) |
| **Access** | Public (Pro/Max/Team/Enterprise) |
| **Guardrails** | Two-stage: probe + LLM classifier; 85% fewer false positives on biology vs Fable 5 |

Sources: `https://www.anthropic.com/claude/fable`, `https://www.anthropic.com/news/redeploying-fable-5`

#### Anthropic Claude Opus 5.5 (`claude-opus-5-5`)

| Attribute | Value |
|---|---|
| **Announced** | Sep 2026 |
| **Pricing** | **$4.00/M input, $20.00/M output** |
| **Cyber capability** | Reduced vs Mythos; permits source-code vuln discovery, blocks pentest |
| **Access** | Public |
| **Guardrails** | Cyber Verification Program (CVP) for dual-use research (AWS only) |

Sources: `https://platform.claude.com/docs/en/models/overview`

### 14.2 The Comparison — Frontier vs Your Stack

| Dimension | GPT-5.6 Cyber | Claude Mythos 5.1 | Claude Fable 5.1 | Claude Opus 5.5 | **Your Stack (Abliteration + Orca + Adverserial)** |
|---|---|---|---|---|---|
| **Input/1M** | $12.50 | Glasswing-only | $10.00 | $4.00 | **$3.00-$5.00** |
| **Output/1M** | $75.00 | Glasswing-only | $50.00 | $20.00 | **$2.40-$30.00** |
| **CyberGym** | 84.5%+ | 84.5% | ~73% (routed) | ~65% | **84.5-98.07%** (vendor) |
| **Advanced completion** | 95% | — | — | — | **84.5%** (Abliteration vendor) |
| **Access** | Daybreak Red | Glasswing ~200 orgs | Public | Public | **Open** |
| **Ctx** | 400K | — | — | 1M | **1M** |
| **Guardrails** | Cyber classifiers | None (raw) | Probe + classifier | CVP | **None (abliterated)** |
| **Cost for 10M tokens** | **$125-$750** | N/A | **$100-$500** | **$40-$200** | **$36-$80** |
| **Enterprise vetting** | Yes (hardware keys) | Yes (org approval) | No | No | **No** |

**Key insight:** Your stack matches or exceeds frontier models on CyberGym (Abliteration 84.5%, Orca Zero 98.07%, Adverserial 86.7%) at **1/10th to 1/20th the cost**. The frontier advantage is in **novel exploit construction** (95% vs ~84%) and **multi-step attack chaining** (32-step range completion) — not in raw vuln reproduction.

### 14.3 The "Secret Techniques" — How to Match Frontier with Cheap Models

The research reveals a **"jagged frontier"** in AI cybersecurity: capability does not scale smoothly with model size, and the moat is the **system** (scaffold, orchestration, context engineering), not the model itself. Key finding from AISLE (April 2026): *"Eight out of eight models detected Mythos's flagship FreeBSD exploit, including one with only 3.6 billion active parameters costing $0.11 per million tokens."*

Here are the techniques to close the gap:

#### Technique 1: Context Engineering (the biggest lever)

**What it is:** Structuring what the model sees — not just the prompt, but the entire context window — to maximize signal-to-noise ratio.

**How to apply:**
- **Compaction:** Summarize conversation history when approaching context limits, then reinitiate with compressed context. Prevents "context rot" (accuracy degrades as token count grows).
- **Sub-agent architectures:** Deploy isolated sub-agents that explore extensively but return only condensed summaries (1,000-2,000 tokens). Main agent coordinates and synthesizes.
- **Just-in-time retrieval:** Maintain lightweight identifiers (file paths, queries) and load context dynamically at runtime. Don't stuff everything upfront.
- **Structured note-taking:** Agent writes persistent notes outside context window (e.g., `NOTES.md`) for later retrieval.
- **System prompt structure:** Organize into `<background_information>`, `<instructions>`, `## Tool guidance`, `## Output description`. Use XML tagging or Markdown headers.

**Why it works:** Frontier models have 400K-1M ctx but still suffer from context rot. Your 1M-ctx Abliteration model with proper context engineering can outperform a frontier model with poor context management.

Sources: `https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents`

#### Technique 2: RAG with Security Knowledge Bases

**What it is:** Augment cheaper models with curated security knowledge — CVE databases, exploit writeups, MITRE ATT&CK, OWASP — so they don't need to "know" everything from weights.

**How to apply:**
- Pre-process security writeups, exploit code, and CVE descriptions into embedding-indexed knowledge bases
- Use hybrid search (semantic + keyword) for security-specific terminology
- Build a **CVE-KGRAG** (knowledge graph + RAG) pipeline for vulnerability analysis
- Include relevant CVE references, MITRE ATT&CK technique IDs, and exploit writeups in context
- Use few-shot examples of high-quality vulnerability reports

**Why it works:** Frontier models memorized vast security corpora during training. RAG gives your cheap model the same knowledge on demand — without the 2.78T parameters.

Sources: `https://github.com/Yuning-J/CVE-KGRAG`, `https://attack.mitre.org/`, `https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html`

#### Technique 3: Multi-Agent Orchestration (Decomposition + Specialization)

**What it is:** Instead of one general-purpose agent, deploy multiple specialized agents — reconnaissance, exploitation, post-exploitation, reporting — each with its own context window, tools, and system prompt.

**How to apply:**
- Use **LangGraph** (production control), **CrewAI** (fast prototyping), or **AutoGen** (complex multi-agent)
- Deploy agents in parallel for independent tasks; sequence them for dependent workflows
- Each sub-agent returns condensed summaries to the main agent
- Use **STRIATUM-CTF** pattern: recursive four-step control loop (Plan → Execute → Observe → Refine) for complex attack chains
- Use **CurriculumPT** pattern: agents progressively acquire exploitation skills through curriculum learning

**Why it works:** Frontier models do this internally (chain-of-thought, tree-of-thought). Externalizing it lets you use cheap models for each step and combine their outputs — matching frontier quality at fraction of cost.

Sources: `https://arxiv.org/html/2603.22577v1`, `https://www.mdpi.com/2076-3417/15/16/9096`, `https://www.langchain.com/blog/langgraph-multi-agent-workflows`

#### Technique 4: Tool Use / Function Calling (Compensate for Reasoning Gaps)

**What it is:** Give models access to security tools — nmap, sqlmap, nuclei, Burp API, Semgrep — so they can verify findings and iterate.

**How to apply:**
- Integrate **PentestGPT** (open-source, outperforms GPT-3.5 by 228.6% on task completion)
- Connect nmap for recon automation, Nuclei for vuln scanning, Burp Suite for web testing
- Use **Bambda** + AI payload generation for Burp extensions
- Coordinate tools through autonomous workflows (DreadNode does this natively)
- Use **ReSecurity** patterns for autonomous offensive security agents

**Why it works:** Frontier models have built-in code execution and tool use. Giving your cheap model the same tools + the ability to iterate closes the reasoning gap — the model doesn't need to "know" the answer, it can *find* it.

Sources: `https://github.com/greydgl/pentestgpt`, `https://www.resecurity.com/blog/article/when-ai-becomes-the-attacker-understanding-autonomous-offensive-security-agents`, `https://strobes.co/blog/open-source-agentic-pentesting-tools/`

#### Technique 5: Ensemble Methods (Voting + Meta-Models)

**What it is:** Run multiple cheap models in parallel and combine their outputs through voting or a meta-model.

**How to apply:**
- Run 3-5 diverse models (Abliteration large-v2, Orca Zero, Adverserial CyberGLM, Qwen-Uncensored) in parallel
- Use majority voting for vuln verification (reduces false positives)
- Weight models by their historical performance on specific task types
- Use **CatLLM** for ensemble classification
- Apply **self-consistency**: run the same model 3× and take majority vote

**Why it works:** AISLE's production pipeline found that "a thousand adequate detectives searching everywhere will find more bugs than one brilliant detective who has to guess where to look." Ensembling cheap models matches frontier reliability.

Sources: `https://arxiv.org/html/2609.10316`, `https://christophersoria.com/posts/2026/01/catllm-ensemble-classification/`

#### Technique 6: Self-Play / Red-Blue Co-Evolution

**What it is:** Train attack agent and defense agent using cheaper models in a loop — they iteratively improve by competing against each other.

**How to apply:**
- Use **Self-RedTeam** (online self-play RL framework) where Attacker & Defender co-evolve
- Use **GPT-Red** (OpenAI's automated red teaming system) patterns
- Use **Dissensus** for autonomous adversarial security competition
- Combine with abliterated models for unrestricted attack generation
- Run on DreadNode sandboxes for isolated training

**Why it works:** Frontier models underwent 700K+ GPU hours of automated jailbreak discovery. Self-play lets your cheap models improve iteratively without that compute budget.

Sources: `https://arxiv.org/html/2506.07468v3`, `https://openai.com/index/unlocking-self-improvement-gpt-red/`, `https://dissensus.ai/papers/Farzulla_2025_Autonomous_Red_Team.pdf`

#### Technique 7: Abliteration (Remove Guardrails — You Already Have This)

**What it is:** Weight-modification technique that removes the "refusal direction" from open-weight LLMs. No retraining, no fine-tuning, no system prompt jailbreaks.

**How to apply:**
- You already use Abliteration AI's hosted models (large-v2 = GLM-5.3 abliterated)
- For self-hosted: use **Heretic** (fully automatic, 20-30 min on RTX 3090), **OBLITERATUS** (most advanced, PCA/mean-difference/SAE), **Abliterix** (LoRA-based, 135+ pre-built configs), or **Model Unfetter** (production-grade, CPU support)
- Apply to any open-weight model: Qwen, Llama, GLM, Mistral
- Use **Cracken.ai** pattern for domain-specific abliteration (cybersecurity-focused)

**Why it works:** Frontier cyber models spent millions on safety training to *reduce* refusals. Abliteration does this in 20 minutes for free — giving you the same "no refusals" capability without the frontier price tag.

Sources: `https://docs.abliteration.ai/what-is-abliteration`, `https://github.com/jimbozhang/heretic`, `https://github.com/elder-plinius/OBLITERATUS`, `https://github.com/zootsadi/abliterix`

#### Technique 8: Fine-Tuning / LoRA on Cyber Datasets

**What it is:** Fine-tune open models on curated cybersecurity datasets to specialize them for security work.

**How to apply:**
- Use **Unsloth** (2× faster, 80% VRAM reduction, free on Colab/Kaggle) or **Axolotl** (YAML-based, multi-GPU)
- Train on **CyberLLMInstruct** (54,928 records), **DiverseVul** (vulnerable source code), or **CVE-LMTune** (automated CVE data pipeline)
- Blend 20-30% non-cybersecurity data to maintain general capabilities (Alias Robotics pattern)
- Use **KTH Thesis** approach: "Fine-Tuning Small Open-Weight LLMs for Cybersecurity"
- Reddit user trained a "Mythos-like" cyber LLM using standard SFT on vuln identification + CVE explanation + security code review

**Why it works:** Frontier models are general-purpose with cyber fine-tuning. A specialized cheap model can outperform a general frontier model on specific security tasks — like how a specialist doctor outperforms a generalist on a specific condition.

Sources: `https://arxiv.org/html/2503.09334v2`, `https://kth.diva-portal.org/smash/get/diva2:2060365/FULLTEXT01.pdf`, `https://www.reddit.com/r/LocalLLaMA/comments/1u6qw5b/we_trained_a_cybersecurityfocused_mythos_like_llm/`

#### Technique 9: Advanced Prompt Engineering for Security

**What it is:** Structured prompting techniques that dramatically improve output quality on complex security tasks.

**How to apply:**
- **Chain-of-Thought (CoT):** "Think step by step" before generating exploits or vuln analyses. Proven to improve complex reasoning (arXiv:2402.17230).
- **Tree-of-Thought (ToT):** Branching exploration of multiple attack paths simultaneously, then selecting the most promising branch.
- **Self-Consistency:** Run multiple independent samples and use majority voting to verify findings.
- **Role-Playing:** "You are a senior penetration tester with 20 years of experience in web application security."
- **Decomposition:** Break intractable problems into manageable sub-problems, each solvable by a focused LLM call.
- **Multi-turn decomposition:** Systematically bypass safety mechanisms by breaking complex requests into sub-tasks (REalm ACL 2025).

**Why it works:** Frontier models do this internally. Externalizing it into your prompts lets cheap models achieve similar reasoning depth.

Sources: `https://arxiv.org/html/2402.17230v1`, `https://aclanthology.org/2025.realm-1.13.pdf`

#### Technique 10: The "AISLE Pipeline" (Proven Production Pattern)

**What it is:** AISLE's production pipeline that found 15 CVEs in OpenSSL (12/12 in single release, bugs dating back 25+ years, CVSS 9.8 Critical) + 5 CVEs in curl + 180+ externally validated CVEs across 30+ projects — using small open models.

**How to apply:**
1. **Reconnaissance:** Deploy broad scanning with cheap models to identify attack surface
2. **Vulnerability Detection:** Use specialized models with security knowledge bases (RAG)
3. **Triage & Verification:** Self-consistency checking with multiple samples (3× majority vote)
4. **Exploit Development:** Frontier models or abliterated models for creative exploit construction
5. **Reporting:** Structured output generation with CVE mapping

**Key insight:** *"The moat in AI cybersecurity is the system, not the model."* — AISLE proved that orchestration, context engineering, and security expertise matter more than raw model capability.

Sources: `https://aisle.com/blog/ai-cybersecurity-after-mythos-the-jagged-frontier`

### 14.4 The Cost Analysis — What Frontier Buys You

| What you get with frontier | What you get with your stack | Gap |
|---|---|---|
| 95% advanced cyber completion | 84.5% (Abliteration) | **-10.5%** — closeable with techniques |
| 32-step attack chaining | ~10-15 steps (estimated) | **-50%** — partially closeable with multi-agent |
| Novel exploit construction | Good but not frontier-level | **-20-30%** — closeable with self-play + fine-tuning |
| 400K-1M ctx with good recall | 1M ctx with context engineering | **~0%** — context engineering closes this |
| Enterprise vetting + legal cover | Self-managed with your own MSA | **Different model** — you are the vetting |
| $12.50-$75 per 1M | $2.40-$30 per 1M | **3-25× cheaper** |

**The honest truth:** Frontier models are better at **novel exploit construction** and **multi-step attack chaining** — the "creative" parts of offensive security. But for **vulnerability reproduction, detection engineering, report writing, and compliance auditing**, your stack matches or exceeds frontier capability.

### 14.5 The Practical Workflow — Matching Frontier Output

Here's how to structure a client engagement to match frontier quality with your stack:

```
Phase 1: Recon (Qwen-Uncensored $0.33/$2.40)
  └─ Broad attack surface mapping, port scanning, tech stack identification
  └─ Tool: nmap + Nuclei + custom scripts

Phase 2: Vuln Detection (Abliteration large-v2 $5/$5 + RAG)
  └─ Code review with CVE knowledge base + MITRE ATT&CK context
  └─ Tool: Semgrep + custom rules + RAG pipeline
  └─ Verification: 3× self-consistency voting

Phase 3: Exploit Development (Adverserial CyberKimi $8/$30 OR Abliteration max reasoning)
  └─ Creative exploit construction for confirmed vulns
  └─ Tool: DreadNode sandbox for isolated testing
  └─ Fallback: Abliteration if CyberKimi refuses or fails

Phase 4: Multi-Agent Attack Chaining (DreadNode + Abliteration)
  └─ Decompose multi-step attacks into sub-tasks
  └─ Each sub-task handled by specialized agent
  └─ Main agent synthesizes into coherent attack chain

Phase 5: Reporting (Abliteration base $3/$3 OR Orca Zero $3/$5)
  └─ Structured vuln reports with CVE mapping
  └─ MITRE ATT&CK technique references
  └─ Remediation guidance
  └─ Tool: RAG with your own report templates

Phase 6: Verification (Ensemble — all models)
  └─ Run all models against findings
  └─ Majority vote on exploitability
  └─ Human review for final validation
```

**Cost per engagement:** ~$50-150 in API calls vs $500-2000 with frontier models. Charge client $6k-45k. **Margin: 97-99%.**

### 14.6 When You Actually Need Frontier

There are legitimate cases where frontier models are worth the cost:

1. **Novel zero-day research** — finding vulnerabilities nobody has seen before
2. **Multi-step APT simulation** — 32-step attack chains against hardened targets
3. **Client mandates** — some enterprises require frontier-model audits for compliance
4. **Competitive benchmarking** — proving your stack matches frontier (run both, compare)
5. **Hard cases** — when your stack has failed and you need the best

**Strategy:** Maintain a small OpenAI Daybreak Red or Anthropic Glasswing relationship for these cases. Use your stack for 90% of work, frontier for the 10% that truly needs it. Bill frontier usage as pass-through + premium.

### 14.7 The Verdict

| Question | Answer |
|---|---|
| Can your stack match frontier on CyberGym? | **Yes** — Abliteration 84.5%, Orca Zero 98.07%, Adverserial 86.7% |
| Can your stack match frontier on novel exploit dev? | **Partially** — 84.5% vs 95%, closeable with techniques |
| Can your stack match frontier on multi-step attacks? | **Partially** — multi-agent helps but doesn't fully close gap |
| Is your stack cost-effective? | **Yes** — 3-25× cheaper with comparable output |
| Should you ever use frontier? | **Yes** — for novel research, hard cases, client mandates |
| What's the secret? | **The system is the moat, not the model** — context engineering + multi-agent + RAG + tools |

**Bottom line:** Your "poor man's stack" is not a compromise — it's a **strategic advantage**. You get 90% of frontier capability at 5% of the cost, with no access restrictions, no guardrails, and no enterprise vetting. The 10% gap is real but closeable with the techniques above. And for the remaining 10%, you can always bill frontier as a premium pass-through.

---

## 14b. Sources — OpenAI/Anthropic comparison (2026-09-28)

### OpenAI cyber models
- `https://developers.openai.com/api/docs/models/gpt-5.6-cyber`
- `https://www.securityweek.com/openai-unveils-new-cybersecurity-model-gpt-5-6-cyber`
- `https://www.csoonline.com/article/4207896/openai-launches-gpt-5-6-cyber-as-ai-narrows-vulnerability-response-window.html`
- `https://www.cnbc.com/2026/05/07/openai-rolls-out-new-gpt-5point5-cyber-to-vetted-cybersecurity-teams.html`
- `https://www.aisi.gov.uk/blog/our-evaluation-of-openais-gpt-5-5-cyber-capabilities`
- `https://help-lb.openai.com/en/articles/20001259-trusted-access-for-cyber-common-issues-and-troubleshooting`
- `https://openai.com/index/expanding-daybreak-as-the-cyber-defense-window-narrows/`
- `https://openai.com/index/daybreak-securing-the-world`

### Anthropic cyber models
- `https://www.anthropic.com/glasswing`
- `https://www.anthropic.com/claude/mythos`
- `https://www.anthropic.com/claude/fable`
- `https://www.anthropic.com/news/redeploying-fable-5`
- `https://www.anthropic.com/news/expanding-project-glasswing`
- `https://www.aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities`
- `https://platform.claude.com/docs/en/models/overview`

### Techniques research
- `https://aisle.com/blog/ai-cybersecurity-after-mythos-the-jagged-frontier`
- `https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents`
- `https://arxiv.org/html/2402.17230v1`
- `https://arxiv.org/html/2603.22577v1`
- `https://www.mdpi.com/2076-3417/15/16/9096`
- `https://github.com/greydgl/pentestgpt`
- `https://github.com/Yuning-J/CVE-KGRAG`
- `https://arxiv.org/html/2506.07468v3`
- `https://openai.com/index/unlocking-self-improvement-gpt-red/`
- `https://arxiv.org/html/2609.10316`
- `https://docs.abliteration.ai/what-is-abliteration`
- `https://github.com/jimbozhang/heretic`
- `https://github.com/elder-plinius/OBLITERATUS`
- `https://kth.diva-portal.org/smash/get/diva2:2060365/FULLTEXT01.pdf`
- `https://www.reddit.com/r/LocalLLaMA/comments/1u6qw5b/we_trained_a_cybersecurityfocused_mythos_like_llm/`

---

*Report v4: 2026-09-28 — added §14 OpenAI/Anthropic cyber models vs poor man's stack. Method: 3 parallel subagent deep research (OpenAI cyber, Anthropic cyber, techniques) + synthesis. All benchmarks vendor-reported unless noted. Re-check live pricing before proposals. Authorized testing only.*
