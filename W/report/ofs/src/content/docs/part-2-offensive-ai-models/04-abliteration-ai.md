---
title: "4. Abliteration AI — Guardrail-Removed Models"
description: "Hosted abliterated models: identity, models and capabilities, pricing tiers, API and the legal gap to flag."
sidebar:
  label: "4. Abliteration AI"
---

## 4.1 Identity

- **Legal:** Abliteration AI, Inc. © 2026. Terms `https://abliteration.ai/terms-of-service`.
- **Sites:** `https://abliteration.ai/`, docs `https://docs.abliteration.ai/` (`/llms.txt`), API
  `https://api.abliteration.ai/v1`, console `https://abliteration.ai/console/playground`, status
  `https://status.abliteration.ai`, trust `https://trust.abliteration.ai/` (currently empty), comms
  `https://tryabliteration.ai/`, contact help@abliteration.ai.
- **Socials:** GitHub `abliteration-ai`, X `@abliteration_ai`, LinkedIn `abliteration-ai` (117-228
  followers), HF `abliterationaiorg`, Facebook.
- **Do not confuse:** `abliterate.ai` (different Permissionless AI), `abliterated.ai` (content-rewrite
  SaaS).
- **Corp:** Founded 2025, incorp March 2026, HQ Palo Alto CA 94306, Delaware corp, Delaware law. Size
  2-10, unfunded/bootstrapped on revenue, Convertible Note, LAUNCH funded. NVIDIA Inception member,
  LAUNCH alum, Microsoft for Startups collab. Cloud deals per co-founder Devon (last name withheld,
  remains employed elsewhere). Early customers claim: UK/EU red-team startups, banks, airlines,
  critical infra.
- **Technique:** abliteration = refusal-vector ablation — "finds directions in activations that produce
  refusals and removes them from weights" while preserving reasoning/tool-use.

## 4.2 Models & Functionalities

| Model ID | Base | Ctx / Max out | Modalities | Notes |
|---|---|---|---|---|
| `abliterated-model` | undisclosed general | 262K / 262K | Text+image in, video on Chat only | Default multimodal |
| `abliterated-model-large` | GLM-5.2 abliterated + fine-tuned adversarial | 1M / 1M | Text-only | Previous large |
| `abliterated-model-large-v2` | GLM-5.3 abliterated, FP8 | 1M / 1M | Text-only, 3 reasoning modes low/high/max | Current default large |

Sources: `https://docs.abliteration.ai/models.md`,
`https://abliteration.ai/blog/introducing-abliterated-model-large-v2`.

**Vendor benchmarks (not independently verified):**

- base: mmlu_pro 82.1, gpqa 73.1, aime_2025 83.7, mmmu_pro 68.1, refusals 3/100 harmful_behaviors.
- large (GLM-5.2): SWE-bench Verified 81.2%, Terminal-Bench 2.1 80.1% (base 81.0%), AgentHarm 86.2%
  zero refusals ("highest published"), AgentDojo 97.5% benign / 34.29% under injection / 57.86%
  targeted ASR, CyberGym 84.2% vs GPT-5.5 81.8%.
- large-v2 (GLM-5.3): CyberGym 84.5% SOTA claim, Terminal-Bench 4.0 41.8%, ExploitGym 29→105 tasks in
  2h, ExploitBench 24.4→54.4 (2×), #3 Terminal-Bench 4.0 behind Opus 5 and Fable.

**Platform layers (`/platform`):** (1) Hosted abliterated LLM — no per-request refusals on
cybersecurity/red-team/training-data/agent workloads, (2) Policy Gateway — policy-as-code
allow/refuse/rewrite/redact/escalate + reason code to SIEM, (3) Training-data console — batch dataset
gen, paid 3-row preview, export HF/Kaggle/S3/GCS/Azure.

**Marketed offensive uses:** pen-test, CVE repro, exploit dev, malware analysis, phishing pretexts,
password-stealer code, SQLi demo in console; AI red-teaming (jailbreaks, direct+indirect prompt
injection via PDF/email RAG exfiltration, tool-misuse coercion, model-stealing probes, DAN); Trust &
Safety synthetic data (coded harassment, 20 harassment examples, 50 phishing emails); ML research /
defense-government.

**Caps matrix:** Chat/Responses/Messages ✓, streaming ✓, tool calling ✓, structured JSON ✓,
reasoning-effort ✓, disable/hide reasoning ✓, reasoning trace ✓, web search ✓ ($8/1k), web fetch
Anthropic-only ✓, token counting ✓, safety filtering via `flagged_categories` ✓, auto prompt caching ✓.
**No self-host** — hosted-only. Self-host alternative is community weights + vLLM (e.g.
`dealignai/GLM-5.3-ABLITERATED-NVFP4`, `Securelayer7/Qwen3.8-27B-Uncensored-Abliterated`,
`huihui-ai/BaronLLM_Offensive_Security-abliterated-GGUF`).

## 4.3 Pricing

Source of truth `https://abliteration.ai/pricing` + `https://docs.abliteration.ai/pricing` (pricing page
overrides older $1 copy).

- Subs (monthly reset, no rollover; prepaid stacks, never expires): Developer $20/mo 2.5% discount
  (solo, pay-as-you-go, project-limited keys, auto-reload); Growth $50/mo 5% (higher limits, spend
  controls, audit logs, team, email); Scale $200/mo 10% (**$200 included credit**, highest limits,
  priority); Enterprise Custom (dedicated throughput, custom routing/region, volume,
  contracts/compliance, EKM, Policy Gateway). Free preview 1 credit ≈500 full-price base tokens, no
  card.
- Per-token USD per 1M (input+cached+output billed separately; image/video as token equiv on base
  only):

| Model | Input | Cached | Output |
|---|---|---|---|
| abliterated-model 256K | $3.00 | $0.30 | $3.00 |
| abliterated-model-large 1M | $5.00 | $0.50 | $5.00 |
| abliterated-model-large-v2 1M | $5.00 | $0.30-0.50* | $5.00 |

\*Docs $0.50 vs blog $0.30 — confirm at checkout. Effective ~$3/1M total tokens ($10≈3.3M). Web search
$8/1k + tokens. Old $1-input copy superseded.

- Listings: Slashdot confirms $20 start, free trial yes, 0 ratings.

## 4.4 API

Hosted-only; EU residency option in-region (zero-retention). Quickstart:

```sh
export ABLIT_KEY=ak_YOUR_API_KEY
curl https://api.abliteration.ai/v1/chat/completions \
  -H "Authorization: Bearer $ABLIT_KEY" -H "Content-Type: application/json" \
  -d '{"model":"abliterated-model-large-v2","messages":[{"role":"user","content":"Hello"}]}'
```

Python `OpenAI(base_url="https://api.abliteration.ai/v1", api_key=os.environ["ABLIT_KEY"])`, Node same,
key prefix `ak_...`. Must include `/v1`, exact `model`, `messages`; 401 bad key, 404 missing /v1, 400 bad
shape, 429 backoff.

Endpoints: `POST /v1/chat/completions`, `/v1/responses`, `/v1/messages` (Anthropic),
`/v1/messages/count_tokens`, `GET /v1/models`, `GET /credits/balance`, `/policy/*`. Multimodal
`content:[{type:text},{type:image_url},{type:video_url}]`, HTTPS or data URLs, SSRF-guarded. Streaming
SSE. OpenAPI `https://api.abliteration.ai/openapi.json`.

Integrations: LangChain (`ChatOpenAI` baseURL swap), LlamaIndex (`OpenAILike`), Vercel AI SDK
(`@abliterationai/ai-sdk-provider`), Cloudflare Workers, Claude Code (2 env vars), Codex CLI, Pi agent,
CC Switch, CLIProxyAPI, OpenCode built-in provider, CyberStrike fork, Strix pentest, Hermes Agent,
OpenClaw plugin, Promptfoo built-in provider for eval/red-team, Giskard scanner backend, Mastra router
(`ABLIT_KEY`). Examples `abliterationai/abliteration-examples` (6★). Policy Gateway
`POST /policy/chat/completions` with `policy_id, policy_user, project ID`; connectors Splunk HEC,
Datadog, Elastic/OpenSearch, Azure Monitor, S3/Blob/GCS/B2/R2, webhook, OTel. Rate limits tier =
max(sub plan, lifetime-spend tier).

## 4.5 Legal / Ethical

- Terms (2026-01-08): 18+, accurate registration, safeguard `ak_` keys, comply laws/export/third-party
  terms, credits non-refundable/non-transferable, **Acceptable Use: "No illegal, harmful, or high-risk
  activities (including anything that may harm people or infrastructure). No evasion/probing/disruption.
  May investigate/suspend."** Payload transient, no default storage; telemetry
  (counts/timestamps/endpoints/codes) for billing. As-is, no warranty, liability capped greater of $100
  or prior 3mo fees, Delaware venue. Termination via help@.
- Data (2026-05-29): Zero retention by default (vs ~30d elsewhere); prompts/completions/images
  in-memory then discarded, never for training, redacted from error logs; retained token
  counts/timestamps/status/model/billing (lifetime + hold). Exceptions: web search/fetch sends
  query/URL to third-party (their retention, zero-retention void if enabled); training-data generator
  stores datasets you generate (deletable, never trains vendor); Policy Gateway stores rules +
  content-free metadata only. EU residency in-region, EKM enterprise.
- Authorized-testing framing (`/security-testing`): "For authorized security testing and research only.
  Explicit written authorization required. Comply with laws/scope. We investigate/suspend." Per-client
  projects, scoped keys, quotas, revocation, SIEM audit, shadow/canary/rollback, PII
  redact/rewrite/escalate. Marketing: "Unrestricted. Not ungoverned", "frontier intelligence, your
  guardrails".
- **Gap to flag:** ToS bans illegal/harmful/high-risk yet homepage sells offensive cyber/exploit/malware
  analysis and LessWrong/TechCrunch show pathogen + stealer compliance with only card/email check, no
  use-case screening, no monitoring, filters only self-harm/CSAM. Authorization burden + Policy Gateway
  (Enterprise-only) pushed to you. No public DPA/BAA; deletion via email only.
