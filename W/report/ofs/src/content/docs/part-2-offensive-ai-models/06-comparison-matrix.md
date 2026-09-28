---
title: "6. Comparison Matrix"
description: "OrcaRouter, Abliteration AI and Adverserial AI side by side across capability, cost, API, logging and jurisdiction."
---

## 6.1 Side-by-side

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
