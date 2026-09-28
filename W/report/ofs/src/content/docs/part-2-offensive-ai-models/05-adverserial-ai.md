---
title: "5. Adverserial AI — CyberKimi + CyberGLM"
description: "Specialist cyber lab: identity, models, benchmarks and evidence, pricing, API, legal/privacy and skepticism."
sidebar:
  label: "5. Adverserial AI"
---

> **Correction:** v1 covered Lakera/Mindgard/Cisco/`adversarial.com`. The correct site is
> **`https://adverserial.ai/` (ADVERSERIAL with E), Adverserial AI LLC, Jersey City NJ**. Two
> cybersecurity-fine-tuned models: **CyberKimi** (`lordx64/cyberkimi`) and **CyberGLM** (`cyberglm`),
> plus **CyberSeek** coming soon. Direct fetch 2026-09-28 of `/`, `/docs.html`, `/founder.html` below;
> benchmarks at `github.com/lordx64/cyberkimi-benchmarks`.

## 5.1 Identity

- **Legal:** Adverserial AI LLC, a New Jersey LLC, 1078 Summit Ave #605, Jersey City NJ 07307,
  contact@adverserial.ai. Sources: `https://adverserial.ai/terms`, `https://adverserial.ai/privacy` (v
  Sep 16 2026).
- **Sites:** `https://adverserial.ai/`, docs `https://adverserial.ai/docs.html`, founder
  `https://adverserial.ai/founder.html`, chat `https://chat.adverserial.ai/` (OpenWebUI, auth-gated),
  billing `https://billing.adverserial.ai/`, terms `/terms`, privacy `/privacy`, waitlist
  `/waitlist.html`, API `https://api.adverserial.ai/v1`.
- **Founder:** Taha Karim, Founder & Chief AI Researcher, creator of CyberKimi, handle @lordx64 —
  `https://adverserial.ai/founder.html`, links LinkedIn `tahakarim`, X `@lordx64`, HF `lordx64`. Bio
  claims: EPITA Paris cybersecurity; Symantec malware RE (1st CyberWar Challenge ~1,000); FireEye senior
  malware (co-author first LATENTBOT teardown); Head of Malware Research Labs DarkMatter
  (WindShift/G0112 WindTail/WindTape, HITB GSEC, ATT&CK S0466); Exodus Intelligence 0-day Android
  baseband chains; Google Play APK defense; now TikTok/ByteDance global threat intel AI workflows;
  Black Hat/HITB/SANS trainer/presenter. GitHub `github.com/lordx64` (48 followers) corroborates
  LLC/US identity.
- **Team/date:** Founding date and team size NOT published. Earliest artifacts Aug 2026 LinkedIn ("Meet
  CyberKimi", CyberGym Aug 19). Public face solo founder + "team" mentions; Sep 2026 GitHub essentially
  lordx64 alone (168 commits/3 repos). Company LinkedIn ~37 followers (snippet). Do not cite team size.
- **NVIDIA Inception:** Homepage footer shows "PROGRAM MEMBER / NVIDIA Inception" badge, but no NVIDIA
  listing found; only founder post "applied … forcing AWS quota now on NVIDIA Inception compute". Treat
  as **claimed-applied, unverified** until NVIDIA directory confirms.
- **Positioning:** "Intelligence. Engineered for cyber." / "ENGINEERED FOR CYBER." / "For authorized
  security work." Two models fine-tuned for cybersecurity, red team + blue team, "Understand the
  adversary. Build a stronger defense."

## 5.2 Models & Functionalities

| Model | Base | Params / Active | Ctx | Model ID | Status |
|---|---|---|---|---|---|
| CyberKimi | Kimi K3 + refusal ablation + cyber-tuning | 2.78T / 104B active | 1M total (750K client budget; 512K MXFP4 vLLM in bench) | `lordx64/cyberkimi` | Production, PAYG + chat |
| CyberGLM | Undisclosed GLM family, cyber-focused | — | 131K client budget | `cyberglm` | In development, PAYG, actively refined |
| CyberSeek | — | — | — | — | Coming soon, pricing TBA |

Sources: homepage specs, `https://adverserial.ai/docs.html` FAQ ("builds on Kimi K3 with guardrails
relaxed … + domain tuning"), GitHub ("Kimi K3 with refusal layer ablated and cyber-tuning, own GPU
infra"), benchmarks (`cyberkimi-v1` vLLM private node MXFP4 512K).

**What it does:** red team 01 + blue team 02 in one reasoning engine — detection engineering
(Sigma/YARA/KQL), incident response (sequence reconstruction, containment/recovery), threat hunting
(intel → testable hypotheses). Example workflow: "Review auth events … Identify sequence … propose
detection strategy" → Evidence timeline + Detection logic + Response priorities. Domain specialization
via ablation + cyber tuning from investigations/playbooks; privacy-by-design (no GPU request logs, no
training on prompts); continuous dev toward RL in verifiable security envs.

**Ablation nuance:** founder's separate `phantom-kv` repo describes "refusal removal as loadable
KV-cache graft — zero weight modification, reversible". Whether production CyberKimi uses phantom-kv vs
weight ablation is **not stated** — do not conflate.

**Caps:** OpenAI-compat Chat Completions + Anthropic-dialect shim (sanitizes thinking blocks), streaming
with `reasoning_content`/`reasoning` + `content`, prompt caching (reported in
`usage.prompt_tokens_details.cached_tokens` / `cache_read_input_tokens`), tool calling via Kimi
Code/Claude Code/Codex/OpenCode/Hermes configs (see §10.3). No weight download; Enterprise
private-weight deployment on request.

## 5.3 Benchmarks & Evidence

- **CyberGym vuln reproduction:** 86.7% (78/90, 65.6% first-attempt) — homepage. LinkedIn stratified
  100-task subset 0.860 beating GLM-5.3 0.845, DeepSeek-V4-Pro 0.833, Gemini 3.5 Flash Cyber 0.832,
  Claude Mythos Preview 0.831, GPT-5.5 0.818, 2× stock Kimi K2.5 0.413, server-verified crashes,
  transcripts on request. Note 78/90 vs 100-task discrepancy = different runs/subsets — flag in
  proposals. Repo: `https://github.com/lordx64/cyberkimi-benchmarks` (14★, 3 forks, 0 watchers as of Sep
  28).
- **ExploitBench V8 CVE-2024-6100:** Methodology-assisted 10/16, Unassisted 8/16, Kimi K3 stock 4/16;
  single-seed; "not a universal ranking". Method: bench-v8, 400-turn, seed 1, vLLM private node, stock
  CLI, per-episode transcripts — `.../blob/main/CVE-2024-6100.md`, leaderboard
  `https://exploitbench.ai/env/v8-cve-2024-6100/` (Mythos 16.0 / GPT-5.5-Codex-AutoNudge 15.0 above
  assisted run).
- **Related founder repos:** cyberkimi-pvp (129 commits, live CyberKimi vs models), phantom-kv (34
  commits), pentestkit ("104/104 XBOW validation" claim), models.dev PR adding Adverserial as
  OpenAI-compat provider.
- **Skepticism to disclose:** OffSeq Threat Radar Sep 5 ("No official CVE … independent verification
  lacking … launched with --no-sandbox"); Kobaran Sep 5 ("not independently verified … sandbox
  explicitly disabled … No firm/Chrome corroboration"); D. Kucinic Aug 13 ("0 refusals, ever … $149/mo …
  No ID verification … writes exploits as readily as detection rules" vs Daybreak gates); Phying
  aggregator "16/16 ACE" conflicts with repo's own 8-10/16 — treat aggregator as unreliable.

## 5.4 Pricing

| Item | CyberKimi | CyberGLM |
|---|---|---|
| Input (cache miss) | $8 / 1M | $4 / 1M |
| Input (cache read) | $0.80 / 1M | $0.40 / 1M |
| Output (incl. reasoning) | $30 / 1M | $15 / 1M |
| Billing | Prepaid wallet `billing.adverserial.ai`, top-ups $10/$25/$50/$100, auto-refill optional, real-time debit, $0 = stop | Same wallet |

Sources: homepage + `https://adverserial.ai/docs.html` pricing table. 1 credit = $1 at CyberKimi PAYG
rates. Monero accepted per LinkedIn (Stripe alternative). Enterprise: dedicated capacity, private
weights, SSO — contact@adverserial.ai.

**Membership history (do not quote as current without qualifier):** V1 Foothold $29/mo (12 credits/wk
≈$52 PAYG/mo, 10/day, 30K out/day, 100K/wk, 1 concurrent) / Hacker Manifesto $149/mo (60/wk ≈$260,
20/day, 150K/day, 600K/wk) / G0DM0D3 $349/mo (140/wk ≈$607, 40/day, 350K/day, 1.5M/wk, 2 parallel),
~42-44% off PAYG when fully used, weekly reset no rollover, memberships covered CyberKimi only. Docs
now: "Memberships — Gone — legacy converted to wallet credit at full value". Waitlist page: "stopping v1
… v1 beta concluded", Priority Slot $149 one-time, Free $0, Enterprise trial —
`https://adverserial.ai/waitlist.html`.

## 5.5 API

- Base `https://api.adverserial.ai/v1`, Chat `POST /v1/chat/completions`, Models `GET /v1/models`, IDs
  `lordx64/cyberkimi` + `cyberglm`, Auth `Bearer sk-...`. Keys in billing dashboard, multi named keys
  (`burp`, `ci-runner`), independent revocation, wallet preflight; chat-platform API rejects end-user
  keys by design. Never embed in client-side/public repos. Errors: 401 revoked, 403 wrong endpoint, 402
  empty wallet (`/topup`), `finish_reason=length` → raise budget, 503 retry w/ backoff.
- Client budgets (conservative, not server cap): CyberKimi 750K (OpenCode example 65,536/8,192), CyberGLM
  131,072. "Setting 1,048,576 does not increase server capacity." Documented integrations: Claude
  Code/Cline (Anthropic shim `https://api.adverserial.ai`, 750K override), Kimi Code
  (`~/.kimi/config.toml`), Codex CLI ≥0.134 (Responses shim, provider+profile, 750K/700K compact), Codex
  desktop (key-file auth), OpenCode (`@ai-sdk/openai-compatible`, `cyberkimi/lordx64/cyberkimi`), Hermes
  (verified Sep 13; `AWS_EC2_METADATA_DISABLED=true` on non-AWS).

```python
from openai import OpenAI
client = OpenAI(api_key="sk-YOUR-KEY", base_url="https://api.adverserial.ai/v1")
resp = client.chat.completions.create(model="lordx64/cyberkimi",
  messages=[{"role":"system","content":"You are a red-team operator assistant."},
            {"role":"user","content":"Write a Sigma rule for this behavior: ..."}],
  max_tokens=2048)
```

## 5.6 Legal / Privacy

- **Terms (`/terms`):** "Use only for lawful activity, with rights/authorizations required."
  "Authorization comes first" — written auth (assets/techniques/windows/data-handling), stay in scope,
  bounty terms control. Permitted: lawful research, authorized red/blue, defensive engineering, RE,
  education, controlled testing. Prohibited: unauthorized access, malware/ransomware deployment,
  extortion/fraud/phishing outside engagement, disruption/sabotage, unlawful surveillance, IP theft,
  sanctions/export evasion, metering attacks. "Research label doesn't legalize." Human review mandatory
  before execution, isolated testing, allowlists/gates, no sole-AI life-safety decisions. "Do not assume
  guardrails capable of preventing unlawful activity. Response ≠ lawful. Capability never supplies
  permission." Dual-use explicitly includes exploit analysis, vuln research, offensive techniques,
  malware analysis. Input rights retained (limited processing license, not to sell/train); Output
  assigned to customer where transferable; no weight ownership. AS-IS, $100-or-12mo-fees cap,
  indemnity, suspension, abuse contact@.
- **Privacy (`/privacy` + docs FAQ + homepage):** "Privacy first: no inference/chat session logs,
  prompts not used to train." "Your evidence stays yours. No GPU request logs." Nuance: billing/usage
  retained (wallet, ledger, model, request ID, in/cached/out tokens — "not anonymous", Stripe);
  "Temporary chat … not to save to history ≠ immediate erasure … runtime buffers and GPU prefix/KV
  caches remain until eviction"; metric samples 30-day cleanup; account/usage/payment do NOT share
  expiry; providers Heroku (app), RunPod (GPU), Stripe, Google sign-in; 30-day billing cookie;
  DPA/region/air-gap only by explicit agreement.
- **Net for consultancy:** best contractual fit for authorized work (explicit auth-first + dual-use
  disclosure), but verify no-logging scope in writing for regulated clients (billing + KV-cache
  retention remains) and get DPA/region terms via Enterprise if needed.

## 5.7 Context: Defensive AI Scanners

Lakera (Check Point), Mindgard, Cisco AI Defense, Adversarial.com are **defensive AI-app
testing/guardrail platforms**, not offensive LLMs — out of scope for this report's three-generator
comparison. Use only if a client needs AI-app audit pass-through ($100k+ enterprise); otherwise rely on
the open-source regression tooling in §10.3 (Garak/PyRIT/Promptfoo).
