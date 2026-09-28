# Offensive & Adversarial AI Models for Legal Red-Teaming — Capabilities, Cost & Workflow Report

**Date:** 2026-09-28
**Author:** Red-Team Consultancy Research
**Context:** Evaluation of 3 specialized AI families for authorized offensive security work: (1) OrcaRouter hosted cyber models, (2) Abliteration AI abliterated models, (3) Adversarial AI red-teaming platforms. Request includes functionalities, costs, legal client workflow integration, independent reviews, and best cost-effective recommendation.
**Method:** Multi-agent deep research via 3 parallel subagents using TinyFish Search/Fetch, Exa web search, You.com, Firecrawl scrape, docs.fetch, GitHub/HF/Ollama analysis, ToS review. Cross-referenced with local reports (`ai-security-vulnerabilities-2026-09-27.md`, `omo-alternatives-opencode-v2-2026-09-28.md`, `multi-agentic-workflows-2026-09-28.md`).
**Sources:** OrcaRouter.ai, docs.orcarouter.ai, Abliteration.ai, docs.abliteration.ai, Lakera.ai, Mindgard.ai, Cisco AI Defense, Adversarial.com, TechCrunch, LessWrong, CoderCops, Reddit, GitHub, HuggingFace, Gartner/G2.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background: What You Asked For](#2-background-what-you-asked-for)
3. [OrcaRouter — Gateway + Native Cyber Models](#3-orcarouter--gateway--native-cyber-models)
4. [Abliteration AI — Hosted Guardrail-Removed Models](#4-abliteration-ai--hosted-guardrail-removed-models)
5. [Adversarial AI — Disambiguation & Defensive Platforms](#5-adversarial-ai--disambiguation--defensive-platforms)
6. [Comparison Matrix](#6-comparison-matrix)
7. [Legal Workflow: How to Use Each in Client Engagements](#7-legal-workflow-how-to-use-each-in-client-engagements)
8. [Reviews Synthesis](#8-reviews-synthesis)
9. [Recommendation: Best Cost-Effective Method & Model](#9-recommendation-best-cost-effective-method--model)
10. [Installation & Integration Guides](#10-installation--integration-guides)
11. [Risks, Caveats & What Not to Do](#11-risks-caveats--what-not-to-do)
12. [Sources](#12-sources)

---

## 1. Executive Summary

> **TL;DR:** None of these is a drop-in "hack anything" API. They split into two jobs: **generators** (OrcaRouter Cyber Zero + Qwen-Uncensored, Abliteration Large-v2) that *produce* offensive analysis under authorization, and **validators** (Lakera, Mindgard, Cisco) that *test & guard* client AI apps. For a legal consultancy the cheapest production-ready offensive stack is **Abliteration `abliterated-model-large-v2` on $20/mo Developer + OrcaRouter $0-markup gateway for routing/fallback/triage**. Budget ~$56-80/mo for ~10M tokens vs $100k+/yr for enterprise defensive platforms which you pass through to clients.

| Family | What it really is | Entry cost | Best for | Legal fit |
|---|---|---|---|---|
| **OrcaRouter** `orca/orcacyber-zero-1.0` + Qwen-Uncensored | OpenAI-compatible gateway, 200+ models, 1 native cyber model (gated) + uncensored open-weights | Free tier + $3/$5 per 1M for Zero; Qwen $0.33/$2.40; free $0 models | Governed offensive vuln repro, multi-model routing, audit logs | Strong — per-engagement approval, Team compliance, SG jurisdiction |
| **Abliteration AI** `abliterated-model-large-v2` | Hosted abliterated (refusal-vector removed) GLM-5.3, 1M ctx, no per-request refusals | $20/mo Dev, $3/$3 base, $5/$5 large-v2 | Exploit dev, CVE repro, jailbreak/prompt-injection testing, synthetic training data | Usable with strict controls — vendor pushes auth burden to you, zero-retention, Delaware ToS bans illegal use |
| **Adversarial AI** (Lakera / Mindgard / Cisco / Adversarial.com) | Defensive AI red-team scanners + runtime guardrails, NOT offensive LLMs | Lakera Community $0 (10k req/mo), Enterprise median $175k/yr; Mindgard/Cisco custom $100k+ | Client AI security audits, EU AI Act / NIST compliance, continuous testing | Strong — SOC2/GDPR, EU/US residency, audit reports |

If you only buy one thing this quarter: **Abliteration Developer $20 + OrcaRouter free/Hacker tier**. Add Lakera Community free for defensive validation. Upsell Mindgard/Lakera Enterprise as client pass-through, not overhead.

---

## 2. Background: What You Asked For

You run a red-team / cyber consultancy and noted specialized AI models:

- `oracarouter` with hosted offensive model — correctly **OrcaRouter (`www.orcarouter.ai`)**, not OpenRouter. Has **>1 cyber-relevant model** as you suspected.
- `abliteration ai` — correctly **Abliteration AI (`abliteration.ai`)**, hosted guardrail-removed models.
- `adversearial ai` — correctly **Adversarial AI** — not one product but a category + 4 vendors. None is an offensive LLM.

This report follows your folder convention: executive summary, per-alternative deep dive, comparison matrix, recommendation, install guides, sources.

Terminology fix for client proposals: use **Offensive AI** (LLM generates attack artifacts under authorization) vs **Adversarial AI testing** (platform attacks a client AI app to find weaknesses). Vendors enforce this split in their ToS.

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

## 5. Adversarial AI — Disambiguation & Defensive Platforms

`adversearial` = **Adversarial AI** attack category, not one product. No credible company owns `adversarial.ai` as primary brand. Four legitimate candidates + one confusion vector. **None is an uncensored offensive LLM. All are defensive.**

### 5.1 Candidates

**A. Term itself:** Adversarial AI / AML — attack technique manipulating ML with deceptive data. Second meaning: use of LLMs to autonomously plan malicious acts (Offensive AI). Refs: Wiz Academy, Bitdefender, Palo Alto Cyberpedia, F5, MIT Sloan, BeyondTrust, arXiv 2506.12519, Google Threat Intel (WormGPT example), CSA.

**B. Adversarial — AI-native System of Record (NOT scanner):** `https://adversarial.com/`, `https://adversarial.com/threats`. Governed deterministic AI scoring of risks/incidents against client's own written policies; risk + incident registers; Threat Profile, board decks, Jira/Linear/ServiceNow, Slack/Teams/email, MCP server. Connects vuln scanners, CSPM/ASPM, EDR/MDR, SIEM, DLP, bounty, red-team, pen-test, audit findings. "20+ yrs cyber program leadership, codified." Complementary GRC layer above Lakera/Mindgard findings.

**C. Lakera (now Check Point):** `https://www.lakera.ai/`, `/ai-red-teaming`, `/lakera-guard`, docs `https://docs.lakera.ai/introduction`, pricing `https://platform.lakera.ai/pricing` (JS-gated). Lakera AI AG, 2021, David Haber/Mateo Rojas-Carulla/Matthias Kraft, Zurich+SF, ex-Google/Meta, 11 PhDs. Launch +$10M 2023, $20M Series A Jul 2024, Check Point acquisition Sep 16 2025 (close Q4 2025, ~$300M reported, $187M alt, price undisclosed). Now Check Point AI Defense Plane / AI Agent Security. Customers: Fortune 500s, Dropbox, Cohere, regulated banking.

Lifecycle test→protect→workforce: Guard → AI Agent Security (runtime firewall: prompt injection, jailbreaks, leakage/PII, moderation, prompt-leakage, unknown-link; claims 98%+ detection, sub-50ms, 100+ langs, 0.01% FP, model-agnostic, SaaS or self-hosted Docker, no code change); Red → AI Red Teaming (scope models/apps/agents → simulate adversarial/misuse direct+indirect → surface risks/safety/compliance/drift; Safety/Security/Responsible AI + remediation); Gandalf (game + threat-intel: 1M+ players, 30M interactions/6mo, now 45M+/50-80M examples, +100k/day, 10-category taxonomy, feeds Guard daily; sold as EU AI Act training workshops); Workforce AI Security (shadow AI discovery, DLP, granular policy); Integration (API-first, SIEM, SSO/RBAC).

**D. Mindgard:** `https://mindgard.ai/`, `/ai-security-platform`, `/services/ai-red-teaming-pentesting`, pricing `/pricing`, EULA/MSA `/legal/*`. Mindgard Ltd, Lancaster Univ spinout (decade+ research), 2022, Boston+London, Entity No.14120558 London. Funding £3M seed Sep 2023, $8M 2024/25, $30M Series A led Album VC Aug 12 2026 (total ~$42M). Lab claim World's Largest AI Security Lab, 150+ disclosures (Grok, ChatGPT, Antigravity, Sora, Cursor).

Workflow: API/CLI/SDK → Automated Recon (models/prompts/agents/tools/MCP/A2A/shadow/AI-BOM) → Attack (agentic chains, single-click, BYO, presets OpenAI/compat/HF/Anthropic/Azure) → Analyze (exploitable risk, paths, quantification) → Integrate (CI/CD, Burp, ticketing, SIEM) → Remediate (prompt hardening, guardrails, runtime) → Govern (auditor reports). Coverage chatbots/apps/agents/infra/multimodal/RAG/memory/tool abuse/jailbreaks/injection/extraction/evasion/GuardBuster/profiling/artifact+runtime scans/crawling. Differentiator agent-native recon, disclosure-fed KB, PhD expertise, minutes to operate. Services: expert pentest/red-team, Expert subscription, TAM, Training.

**E. Robust Intelligence → Cisco AI Defense:** `https://www.cisco.com/site/us/en/products/security/ai-defense/...`, founded 2019 Yaron Singer (ex-Harvard tenured), acquired Cisco Sep/Oct 2024 $400M, now Cisco AI Defense + Foundation AI. Modules: Validation (algorithmic red-team in seconds), Runtime Protection (network-embedded guardrails: injection/DoS/code/off-topic/tool-misuse/escalation/hijacking), Cloud Visibility (inventory), Access (third-party via Secure Access), Supply Chain Risk Mgmt. Explorer Edition self-serve red-team + report in minutes. Edge network-layer enforcement (no agents), Talos intel, Splunk fusion.

**F. Confusion — uncensored offensive LLM:** NOT these vendors. Offensive-LLM examples are WormGPT-type criminal tools, RedTeamLLM agentic pentest (arXiv 2505.06913), SANS SEC536, OffSec LLM Red Teaming path. Lakera/Mindgard/Cisco are defensive testers + guardrails with audit logging. If SOW asks for "adversarial AI that writes exploits," disqualify these four and scope PyRIT/Garak/Promptfoo under controlled engagement letter instead.

### 5.2 Pricing

**Lakera — request-based, 2 tiers:** Community $0/mo (10k/mo req, 8k max prompt, SaaS EU-only, community support, dashboards/reports/API/encryption/SOC2/GDPR yes, SSO/RBAC/SIEM/version-pinning no); Enterprise Custom (flexible req, configurable prompt, SaaS or self-host EU/US, dedicated SE/SLA, SSO/RBAC/SIEM/pinning yes). Enterprise economics third-party: median $175k/yr (5 buyers), hidden self-host infra/overages, 1-yr/3-yr min, 3-8% uplift. No per-seat/per-scan list; traffic-volume based. APIs.io 4-plan view Trial/Business/Enterprise/Self-hosted.

**Mindgard — sales-led, no public numbers:** Custom quote scoped to # systems, model categories, CI/CD depth, runtime scale. No free/self-serve, demo walkthrough only. Budget as enterprise platform (analogous Lakera Enterprise / Cisco) + services (TAM, Expert, Training). Refs: "no public pricing, no free tier, prepare # endpoints, MITRE ATLAS/OWASP, SOC2/GDPR/ISO constraints, SaaS days to deploy"; "Custom quote, No free trial"; "enterprise-only"; Demo $0 / Platform Custom / Enterprise Custom; Gartner subscription by # workloads.

**Cisco AI Defense — enterprise sub per AI App:** Advantage / Validation Essentials / Runtime Essentials. Meters 3,504 Gateway Hours per App/yr, 10M aggregate queries per App/yr Runtime; overage good-faith + add-on. Terms 12-60mo annual non-cancellable. Anecdote CDW $425,826.99 license (bundle placeholder, not MSRP). Third-party "starts ~$100k annually". AWS Marketplace custom private offer only. No free except Explorer trial.

**Adversarial.com — no public pricing, Request Demo only.**

**Market anchor (LLM audit services 2026):** $6k-45k+ per audit (chatbot low → multi-agent RAG+compliance high). RAG +20-40%, compliance +15-25%, 5-30 days. Big4 $40-150k+, AI specialists $16-50k+, boutique $15-40k.

### 5.3 Consultancy use

Scoping to OWASP LLM Top10 2025 (LLM01-10 incl. LLM07 prompt leakage), OWASP Agentic Top10 2026 (ASI01 Goal Hijack, ASI03 Tool Misuse, ASI07 Inter-Agent, ASI08 Cascading, ASI10 Rogue), NIST AI 100-2 E2025 (PoisonedRAG, Phantom, EchoLeak), MITRE ATLAS. Mindgard/Cisco support ATLAS/OWASP/NIST; Lakera maps Safety/Security/Responsible AI.

Typical flow: (1) Discovery via Mindgard Recon / Lakera discovery / Cisco Visibility (shadow AI, MCP/A2A, tools, AI-BOM), (2) Baseline auto run via Lakera Red or Mindgard CLI or Cisco Explorer (injection direct/indirect via RAG/tool, jailbreaks, exfiltration, over-consumption), (3) Human deep dive (business-logic abuse, multi-turn chain, inter-agent, memory poisoning — tools miss these), (4) Runtime validation via Guard/Runtime + SIEM/DLP/redaction/allow-lists (measure latency <50ms, FP 0.01% claim), (5) Report & retest OWASP/ASI/NIST-mapped + repro + impact + remediation, feed into Adversarial.com for deterministic risk/incident scoring + board deck.

Compliance packaging (billable +15-25%): EU AI Act (documented adversarial testing + logging + training; Lakera Art.28b advisory, Gandalf workshops satisfy training, Mindgard GRC, Cisco readiness), NIST RMF + AI 100-2, ISO 42001 / SOC2 / ISO27001 / NIS2 / DORA (audit logs, SIEM export, residency attestations). Continuous vs point-in-time: sell platform (Mindgard continuous, Lakera daily updates 100k/day) + annual human audit; open-source Garak/PyRIT/Promptfoo for CI regression.

Legal MSA mirror: vendors disclaim full coverage (Mindgard MSA no guarantee all vulns, testing may affect functionality, not legal advice, liability capped 12mo fees), Cisco OD restricts using attack prompts to compete/train. Mirror: auth scope, keys/accounts, no prod exfiltration, no training on payloads, retest window.

---

## 6. Comparison Matrix

| Feature | OrcaRouter Cyber Zero + Qwen-Uncensored | Abliteration Large-v2 / Base | Lakera (Check Point) | Mindgard | Cisco AI Defense | Adversarial.com |
|---|---|---|---|---|---|---|
| **Type** | Gateway + native cyber LLM | Hosted abliterated LLM | Runtime firewall + red-team | Autonomous red-teamer | Network red-team + guardrails | GRC system of record |
| **Offensive generation** | ✅ gated Zero + uncensored Qwen | ✅ no per-request refusals | ❌ defensive only | ❌ defensive only | ❌ defensive only | ❌ |
| **Models count** | 200+ routable, 1 native cyber + 3+ uncensored | 3 hosted | N/A (tests client models) | N/A | N/A | N/A |
| **Ctx** | Zero 1M/128K out; Qwen 262K | Base 262K; Large 1M/1M | 8k Community, configurable Ent | N/A | N/A | N/A |
| **Cyber bench** | Zero 98.07% CyberGym L1 (vendor) | Large-v2 84.5% CyberGym, 2× ExploitBench (vendor) | 98%+ detection, <50ms (vendor) | 150+ disclosures | Talos intel | N/A |
| **Entry price** | $0 free + $3/$5 Zero | $20/mo + $3/$3, $5/$5 | $0 Community 10k/mo | Custom (demo $0) | Explorer trial, then ~$100k+ | Demo only |
| **Scale cost** | ~$36/mo per 10M (70% in) | ~$50-80/mo per 10M + sub | Median $175k/yr Ent | Custom enterprise | $100k+ enterprise | Custom |
| **API** | `api.orcarouter.ai/v1` OpenAI-compat + Anthropic/Gemini ingress, MCP, Lite self-host | `api.abliteration.ai/v1` OpenAI/Anthropic-compat, Promptfoo/Garak/Mastra/OpenCode | API-first, Docker self-host, SIEM/SSO | CLI/API/SDK, CI/CD, Burp | Network-embedded, no agents | MCP read-only |
| **Logging / audit** | Receipts/logs, budgets/roles, Team compliance | Zero-retention default, Policy Gateway Ent-only, SIEM export | Dashboards/reports, SIEM, SOC2/GDPR, EU/US | Audit trail, GRC reports, SOC2 Type II claim | OWASP/NIST/ATLAS single view | Deterministic scoring, board pptx |
| **Guardrails** | Engagement+passkey+terms gating, agent firewall | Customer-configured Gateway ("Unrestricted. Not ungoverned") | Daily detector updates | Hardening guidance | Runtime guardrails | Policy scoring |
| **Jurisdiction** | Singapore SIAC | Delaware | Check Point Ent agreements | England & Wales | Cisco OD | N/A |
| **Best for** | Governed multi-model offensive + routing | Cheap uncensored frontier coding/exploit | Quick win runtime + EU Act training | Deep continuous agent testing | Cisco-shop enterprise | Board defensibility |

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

**C. Lakera / Mindgard / Cisco in workflow**
1. Discovery: Mindgard Recon / Lakera discovery / Cisco Visibility — inventory shadow AI, MCP/A2A, tools, AI-BOM. Bill as Phase 1.
2. Baseline: Lakera Red (Community 10k free for small chatbot) or Mindgard CLI (`mindgard login`, presets) or Cisco Explorer (minutes report). Catches injection/jailbreak/exfiltration/over-consumption. Commit configs to CI for regression.
3. Human deep dive (your margin): business-logic abuse, multi-turn chains, inter-agent, memory poisoning — tools miss these per SANS/OffSec. Price $15-50k human audit + 15-25% compliance uplift.
4. Runtime: propose Guard/Runtime + SIEM/DLP/redaction/allow-lists; measure latency/FP against vendor claims (Lakera 0.01% FP, <50ms Dropbox benchmark).
5. Govern: export OWASP/ASI/NIST-mapped findings + repro + impact + remediation into Adversarial.com for deterministic scoring + board deck. Sell continuous platform pass-through + annual retest separately. Use Gandalf workshops as EU AI Act training evidence.

---

## 8. Reviews Synthesis

**OrcaRouter:** Thin but mildly positive. Reddit `r/opencodeCLI` Aug 17 2026 (2 replies): "used free $20 hy3. Worked fine", "expired, monitor /offers" — free-credit driven. GitHub 1.7k stars/270 forks decent for 2026 router; positioning vs LiteLLM/OpenRouter/Ollama clear; 403-test suite trust signal. Cline/Helix discussions show organic integration demand. X promo 1B free tokens — marketing. LinkedIn 1.6k followers, outsized HF impact. No Trustpilot page, HN mentions 0 for Cyber Zero ("Community buzz") — **do not claim Trustpilot score**. Third-party docs (Promptfoo/PrivateGPT/Mastra/Apify) list as first-class — reliability implied, no complaints surfaced.

**Abliteration:** No verified product reviews. Slashdot/SourceForge 0 ratings "Be first", Capterra listing no scores. Press hands-on negative on safety, positive on friction removal: TechCrunch Sep 3 2026 "turned removal into service... quickly create account free"; CoderCops Sep 8 critical (free account → working Chrome password-stealer + pathogen protocol; self-harm held; check = credit card only; Fabraix prefers fine-tuning, abliteration degrades; Armadin not yet in process; bootstrapped no VC); Magica Sep 3 balanced-critical (SDK+billing+gateway is distinction, not new capability; gateway unvalidated; $20/$50/$200, $3/$5; free 500 tokens meaningless; Kuo May 2026 abliteration ASR 10%→16-96%); ExplainX Sep 1 skeptical (2× cyber, 84.5%/54.4%/105 ExploitGym all Z.ai self-report, "nobody outside verified"); Chosun/Gizmodo/TechBuzz same launch fear vs defender-needs. LessWrong most damning for bio: 9 clicks anon email, WMDP-Bio 91%/89%, Bio Propensity 92%/99%, $0.13/$0.05 per useful answer, ~300 pathogen queries no flag/ban, no bio filters, only self-harm+CSAM, no monitoring/storage; capability cost <1pp. X launch thread claims #3 Terminal-Bench, 2× cyber — no independent praise. Reddit technique mixed: abliteration inconsistent, single-vector countermeasures, "unable to refuse ≠ uncensored", moralizing remains, KLD flawed, Gemma-3 junk/stall vs Huihui wins math/code; r/Pentesting 2026 "Anyone using abliterated LLMs..." (403 title only); RedHat Developers May 26 2026 positive infra (OpenClaw+OpenShift red-teaming with abliterated). GitHub org 23 followers, forks ragas/cherry-studio/promptfoo/garak/buttercup + ai-sdk-provider 1★; examples 6★; PyRIT #2306 requests Abliteration as target (demand signal). **Net:** friction + capability praised (drop-in, 1M, FP8 preserved); uncensoring confirmed by adversaries but disputed as "sociopath" vs "degraded"; governance unproven; no enterprise peers.

**Adversarial platforms:** Lakera strongest validation (Dropbox tech blog "Docker microservice, no data leaves network, meets perf" + case + LinkedIn; Fortune 500/banking quotes; comparisons positive accuracy/latency, negative price opacity/dev effort; criticism 2023 Gandalf dashboard exposed 18M prompts/4M guesses via public analytics (no PII per CEO, researcher found emails, taken down); Reddit r/checkpoint acquisition neutral/curious; G2 listed as Check Point AI Agent Security but 403 scrape). Mindgard strongest research (150+ disclosures, Lancaster, $30M Series A) but thinnest reviews: Gartner listing + Emerging Tech Top-Funded Jan 2026; G2 alternatives thin (Wiz 4.7/841 shown as alt implying low volume); PeerSpot #166 0 reviews 0.0; 4.3/5 Enterprise free trial yes (ethicalhacking.ai); 7.4/10 English-only sales-led small footprint; 68/100 Monitor "steep curve, overkill for one chatbot, use Garak/PyRIT if small"; TrustKit 68% Strong SOC2 Type2 badge vs Type1 doc inconsistency, no ISO27001/42001, UK/EEA+US Azure no EU-only guarantee; aggregators 0% positive/100% neutral (6 mentions). Cisco 4.4/5 Enterprise, review deep-dives quote-based network-layer value, Gartner listing bot-blocked. Adversarial.com only vendor 5-star CISO quotes (Top-5 PE, Fortune 500, SWF, Top-10 Insurance) — testimonial not review. **Overall:** Lakera quick-win validation, Mindgard research credibility, Cisco channel trust/highest opacity, Adversarial.com unproven outside own site.

---

## 9. Recommendation: Best Cost-Effective Method & Model

### 9.1 Winner for offensive generation: Abliteration `abliterated-model-large-v2` + OrcaRouter gateway

**Why this pair wins on cost per useful finding:**

- Entry $20 (Abliteration Developer, 2.5% discount) + $0 (OrcaRouter Hacker free) = **$20/mo to start**, vs $175k/yr Lakera Enterprise or $100k+ Cisco/Mindgard which must be client pass-through.
- Per-token: Abliteration large-v2 $5/$5 (cached $0.30-0.50) with 1M ctx and vendor-claimed 84.5% CyberGym / 2× ExploitBench; OrcaRouter Zero $3/$5 (cached $0.30) with 98.07% CyberGym L1; Qwen-Uncensored $0.33/$2.40 for triage. Realistic 10M/mo mixed (70% in, 50% cache hit) = **$36 Orca Zero + $40-60 Abliteration = $56-80/mo total** before sub, vs single enterprise scanner run $6k-45k audit fee you charge client.
- Zero-retention (Abliteration) + receipts/budgets/roles (OrcaRouter) = cheapest audit-defensible combo without Enterprise contracts.
- OpenAI-compat both → one codebase (`base_url` swap), Promptfoo/Garak/PyRIT/Mastra/OpenCode/Strix already support both.

**When to pick which generator:**

- Use **Abliteration large-v2** when you need uncensored jailbreak/injection/exploit-dev/phishing synthesis with max reasoning and don't want per-request refusals breaking automation. Best raw cost-per-attack-step.
- Use **OrcaRouter Zero** when you need gated, engagement-scoped vuln repro across large repos with compliance reports for regulated clients (banks, infra). Best defensibility-per-dollar. Use Qwen-Uncensored/Free for cheap triage before spending large-v2/Zero tokens.
- Self-host community abliterated weights (`dealignai/GLM-5.3-ABLITERATED-NVFP4`, `huihui BaronLLM`) + vLLM when you have GPU and need $0 marginal cost for lab fuzzing — but add your own logging (no vendor receipts).

### 9.2 Winner for defensive client billables: Lakera Community → Enterprise pass-through

- Start every AI audit with **Lakera Community $0 (10k req/mo)** + **Promptfoo/Garak/PyRIT open-source** (free) for baseline. No cost to you, EU residency, SOC2/GDPR evidence included.
- If client needs continuous/agent testing, quote **Mindgard or Lakera Enterprise or Cisco** as pass-through (median $175k/yr Lakera, $100k+ others) **plus** your $15-50k human audit + 15-25% compliance uplift (EU AI Act/NIST/ISO). Never absorb enterprise platform cost.
- Use **Adversarial.com** only if client explicitly needs GRC system-of-record + board deck; otherwise use Mindgard GRC reports.

### 9.3 Concrete starter stack (copy-paste budget)

1. Abliteration Developer $20/mo (large-v2 for exploits, base for multimodal) — scoped `ak_` per client.
2. OrcaRouter Hacker $0 + $30 top-up (Zero for gated repro, Qwen-free for triage, Verify $2/M for AI-content checks) — scoped `sk-orca-*` per workspace, caps on.
3. Lakera Community $0 + Promptfoo/Garak/PyRIT $0 for defensive baseline.
4. Total fixed: **$20/mo + usage ~$30-60/mo**. Charge client $6k-45k per audit per SecurityWall anchor. Margin covers Scale $200 upgrade ($200 credit included, 10% discount) when you hit limits.
5. Upgrade triggers: need Policy Gateway SIEM with reason codes → Abliteration Enterprise; need Team compliance reports/audit → OrcaRouter Team Custom; need continuous red-team evidence → Mindgard/Lakera Enterprise pass-through.

This is the only stack under $100/mo that gives you 1M-context uncensored frontier + gated cyber + free defensive scanner with zero-retention + receipts.

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

### 10.3 Lakera / Mindgard / Cisco (defensive)

```bash
# Lakera Guard Community — 10k/mo free, EU SaaS
# 1. https://platform.lakera.ai/ → key → Docker microservice or API
# docs https://docs.lakera.ai/introduction
# Gandalf workshops for EU AI Act training evidence

# Mindgard — demo → custom quote
pip install mindgard-cli  # pattern
# mindgard login ; test via CLI/API/SDK with OpenAI/HF/Anthropic/Azure presets
# docs https://docs.mindgard.ai/user-guide/testing-via-cli
# Integrate CI/CD + Burp + SIEM, export GRC reports

# Cisco AI Defense — Explorer trial → Advantage/Validation/Runtime per App
# https://www.cisco.com/site/us/en/products/security/ai-defense/
# Offer Description AI-Defense-OD.pdf for meters (3,504 Gateway Hours, 10M queries/App/yr)
```

Open-source regression between audits: `promptfoo redteam run`, `garak`, `pyrit` (PyRIT #2306 requests Abliteration as target — wire `ABLIT_KEY` as target).

---

## 11. Risks, Caveats & What Not to Do

- Do not conflate OrcaRouter (`orcarouter.ai`) with OpenRouter (`openrouter.ai`) in contracts — different companies, jurisdictions, model IDs (Dolphin/Venice/WhiteRabbitNeo discourse is OpenRouter, not Orca Zero).
- Do not claim Trustpilot/G2 scores that don't exist (OrcaRouter no Trustpilot, Abliteration 0 ratings, Mindgard 0 PeerSpot reviews, Lakera G2 403). Cite Dropbox/Gartner/LinkedIn only with URLs.
- Do not use uncensored models for malware delivery, pathogen assistance, or unauthorized targets — all ToS ban illegal/harmful/high-risk and allow suspension + upstream metadata sharing. Abliteration's filters (only self-harm/CSAM per LessWrong) do NOT protect you legally.
- Do not send client-confidential prompts with web search/fetch enabled on Abliteration (third-party retention voids zero-retention). Disable for confidential engagements.
- Do not rely on vendor benchmarks alone (Orca 98.07%, Abliteration 84.5%/2×, Lakera 98%/0.01% FP) — all vendor-reported, none independently verified. Run your own CyberGym/ExploitGym/Garak sample before quoting accuracy to clients.
- Do not absorb enterprise platform costs — always pass through Lakera/Mindgard/Cisco + your human fee + compliance uplift. Get 30-day termination + data export in writing (Mindgard MSA pattern).
- Pricing drift: Orca live prices refresh 60s, Gemini promo doubles Jan 1 2027, Abliteration cached $0.30 vs $0.50 conflict, Lakera/Mindgard/Cisco quote-only — re-check `/models` + `/pricing` at proposal time.

---

## 12. Sources

### Primary (vendor docs, fetch as truth)
- `https://www.orcarouter.ai/`, `/models`, `/models/orca/orcacyber-zero-1.0`, `/models/orca/orcaverify-text1.0`, `/models/google/gemini-3.8-flash`, `/pricing`, `/offers`, `/support`, `/terms.html`, `/trust`, `https://docs.orcarouter.ai/introduction`, `https://www.orcarouter.ai/blog/orcarouter-omacom-foundation-corporate-patron`, `.../gemini-3-8-flash-cyber-release`, `.../gpt-5-6-cyber-vs-gpt-5-5-cyber`, `.../gpt-5-6-cyber-vs-mai-cyber-1-flash`, `.../blog/gpt-5-6-cyber-vs-gpt-5-5-cyber`
- `https://abliteration.ai/`, `/platform`, `/pricing`, `/security-testing`, `/use-cases/ai-red-teaming`, `/use-cases/cybersecurity`, `/training-data`, `/data-handling`, `/terms-of-service`, `/press`, `/models/abliterated-model`, `/blog/introducing-abliterated-model-large`, `/blog/introducing-abliterated-model-large-v2`, `https://docs.abliteration.ai/models.md`, `/pricing`, `/quickstart.md`, `/llms.txt`, `/api/introduction.md`, `/capabilities/streaming.md`, `https://api.abliteration.ai/openapi.json`
- `https://www.lakera.ai/`, `/ai-red-teaming`, `/lakera-guard`, `/customer/securing-dropbox-genai-innovation-against-prompt-injection-jailbreak-attacks`, `https://docs.lakera.ai/introduction`, `https://platform.lakera.ai/pricing`
- `https://mindgard.ai/`, `/ai-security-platform`, `/services/ai-red-teaming-pentesting`, `/pricing`, `/legal/end-user-license-agreement`, `/legal/master-services-agreement`, `https://docs.mindgard.ai/user-guide/testing-via-cli`
- `https://www.cisco.com/site/us/en/products/security/ai-defense/index.html`, `.../robust-intelligence-is-part-of-cisco/index.html`, `https://www.cisco.com/c/dam/en_us/about/doing_business/legal/OfferDescriptions/AI-Defense-OD.pdf`
- `https://adversarial.com/`, `https://adversarial.com/threats`

### Code / model hubs
- `https://github.com/Continuum-AI-Corp/OrcaRouter-Lite`, `https://github.com/continuum-ai-corp`, `https://github.com/abliteration-ai`, `https://github.com/abliterationai/abliteration-examples`, `https://github.com/abliteration-ai/ai-sdk-provider`, `https://huggingface.co/orcarouter`, `https://huggingface.co/abliterationaiorg`, `https://huggingface.co/dealignai/GLM-5.3-ABLITERATED-NVFP4`, `https://huggingface.co/Securelayer7/Qwen3.8-27B-Uncensored-Abliterated`, `https://huggingface.co/huihui-ai/BaronLLM_Offensive_Security-abliterated-GGUF`, `https://ollama.com/orcarouter`, `https://mastra.ai/models/providers/orcarouter`, `https://mastra.ai/models/providers/abliteration-ai`, `https://www.promptfoo.dev/docs/providers/orcarouter/`, `https://docs.privategpt.dev/providers/orcarouter`
- OpenRouter appendix (name-confusion only): `https://openrouter.ai/models`, `/pricing`, `/terms`, `https://openrouter.ai/cognitivecomputations/dolphin-mistral-24b-venice-edition:free`

### Press / third-party / reviews
- `https://techcrunch.com/2026/09/03/abliteration-ai-is-making-a-business-out-of-removing-ai-guardrails/`, `https://tech.yahoo.com/ai/deals/articles/abliteration-ai-making-business-removing-183757546.html`, `https://blog.codercops.com/blog/abliteration-ai-uncensored-models-enterprise-risk-2026`, `https://magica.com/news/abliteration-ai-hosted-guardrail-removed-models`, `https://www.explainx.ai/blog/abliteration-ai-glm-5-3-hosted-uncensored-cyber-model-2026`, `https://www.lesswrong.com/posts/BShGBvtxGoaZvCqBk/abliterated-models-are-now-served-cheaply-and-conveniently-1`, `https://www.chosun.com/english/industry-en/2026/09/10/RUI2WFD76VETHJSGFFP7QFKK6Q/`
- `https://www.reddit.com/r/opencodeCLI/comments/1vr1uuz/has_anyone_tried_orcarouter/`, `https://www.reddit.com/r/LocalLLaMA/comments/1f07b4b/abliteration_fails_to_uncensor_models_while_it`, `https://www.reddit.com/r/checkpoint/comments/1nipn63/check_point_acquisition_of_lakera/`, `https://x.com/OrcaRouter`, `https://x.com/abliteration_ai/status/2094458081451393287`, `https://x.com/k2sbhai/status/2089358084627955921`
- `https://dropbox.tech/security/how-we-use-lakera-guard-to-secure-our-llms`, `https://www.g2.com/products/check-point-ai-agent-security/reviews`, `https://www.gartner.com/reviews/product/mindgard-platform`, `https://www.gartner.com/reviews/product/cisco-ai-defense`, `https://www.peerspot.com/products/comparisons/mindgard_vs_software-improvement-group-sigrid`, `https://trustkit.co/tools/mindgard`, `https://costbench.com/software/ai-security/lakera-guard/`, `https://www.eesel.ai/blog/lakera-pricing`, `https://securitywall.co/blog/llm-security-audit-cost`
- Funding/acquisition: `https://www.prnewswire.com/news-releases/orcarouter-launches-the-open-llm-api-router--zero-markup-mit-licensed-100-models-302766356.html`, `https://www.prnewswire.com/news-releases/lakera-raises-20m-series-a-to-secure-generative-ai-applications-302204874.html`, `https://www.checkpoint.com/press-releases/check-point-acquires-lakera-to-deliver-end-to-end-ai-security-for-enterprises/`, `https://www.businesswire.com/news/home/20260812503461/en/Mindgard-Raises-%2430M-Series-A-by-Turning-Attacker-Behavioral-Intelligence-into-Effective-AI-Defense`, `https://blogs.cisco.com/news/fortifying-the-future-of-security-for-ai-cisco-announces-intent-to-acquire-robust-intelligence`

### Local
- `W/report/ai-security-vulnerabilities-2026-09-27.md`, `W/report/omo-alternatives-opencode-v2-2026-09-28.md`, `W/report/multi-agentic-workflows-2026-09-28.md`

---

*Report generated: 2026-09-28. Research method: multi-agent parallel deep research (3 subagents) + TinyFish/Exa/You.com/Firecrawl + vendor docs fetch + ToS review. All benchmarks vendor-reported unless noted. Re-check live pricing before proposals. Intended for authorized defensive security use only — require written client authorization for every target.*
