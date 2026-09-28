---
title: "9. Recommendation"
description: "Winner for offensive generation, the cost math, and a concrete starter stack under $150/month."
---

## 9.1 Winner for offensive generation

**Why this pair still wins on cost per useful finding:**

- Entry $20 (Abliteration Developer, 2.5% discount) + $0 (OrcaRouter Hacker free) = **$20/mo to start**,
  vs Adverserial PAYG with no free tier and $8/$30 CyberKimi (6× output cost).
- Per-token: Abliteration large-v2 $5/$5 (cached $0.30-0.50) with 1M ctx and vendor-claimed 84.5%
  CyberGym / 2× ExploitBench; OrcaRouter Zero $3/$5 (cached $0.30) with 98.07% CyberGym L1;
  Qwen-Uncensored $0.33/$2.40 for triage. Realistic 10M/mo mixed (70% in, 50% cache hit) = **$36 Orca
  Zero + $40-60 Abliteration = $56-80/mo total** before sub. Same 10M output-heavy on Adverserial
  CyberKimi = **$200-300+** (output $30/M dominates). Use Adverserial selectively, not for bulk.
- Zero-retention (Abliteration) + receipts/budgets/roles (OrcaRouter) = cheapest audit-defensible combo
  without Enterprise contracts.
- OpenAI-compat all three → one codebase (`base_url` swap), Promptfoo/Garak/PyRIT/Mastra/OpenCode/Strix +
  Adverserial Claude/Codex/OpenCode/Hermes configs.

**When to pick which generator:**

- Use **Abliteration large-v2** when you need uncensored jailbreak/injection/exploit-dev/phishing
  synthesis with max reasoning and don't want per-request refusals breaking automation. Best raw
  cost-per-attack-step.
- Use **OrcaRouter Zero** when you need gated, engagement-scoped vuln repro across large repos with
  compliance reports for regulated clients (banks, infra). Best defensibility-per-dollar. Use
  Qwen-Uncensored/Free for cheap triage before spending large-v2/Zero tokens.
- Use **Adverserial CyberKimi** when you need specialist depth + evidence you can show a client (public
  CyberGym/ExploitBench transcripts, Sigma/YARA/KQL + IR workflow, 1M ctx, privacy-first claim). Best
  proof-per-engagement despite $8/$30. Use **CyberGLM $4/$15** for cheaper mid-tier drafts while in
  development.
- Self-host community abliterated weights (`dealignai/GLM-5.3-ABLITERATED-NVFP4`, `huihui BaronLLM`) +
  vLLM when you have GPU and need $0 marginal cost for lab fuzzing — but add your own logging (no vendor
  receipts).

## 9.2 Revised best cost-effective method

- **Daily driver (volume): Abliteration + OrcaRouter.** Start every engagement with Qwen-free triage →
  Abliteration large-v2 for bulk exploit/jailbreak/injection work → OrcaRouter Zero for gated repro
  needing receipts. Keeps you under $100/mo.
- **Specialist reserve (proof): Adverserial PAYG $25-50 top-up.** Invoke CyberKimi only for hard cases:
  V8-style repro requiring transcript-backed methodology, 1M-ctx log/code hunts, Sigma/YARA/KQL + IR
  deliverables where you need to cite public benchmarks (86.7% CyberGym, 10/16 assisted V8) and
  auth-first ToS. Bill through as disbursement + your $15-50k human audit + 15-25% compliance uplift.
  Never use $30/M output for bulk fuzzing — use $5/M large-v2 or $0.33/M Qwen instead.
- **Math:** 1M input + 200K output on Kimi = $8 + $6 = $14 per deep case; same on large-v2 = $5 + $1 =
  $6; on Qwen triage = <$1. Route accordingly: triage cheap, prove expensive.
- If client mandates no-logging + DPA/region/air-gap, quote Adverserial Enterprise (dedicated capacity,
  private weights, SSO) as pass-through — same pattern as Abliteration Enterprise Gateway / OrcaRouter
  Team.

## 9.3 Concrete starter stack

1. Abliteration Developer $20/mo (large-v2 for exploits, base for multimodal) — scoped `ak_` per client.
2. OrcaRouter Hacker $0 + $30 top-up (Zero for gated repro, Qwen-free for triage, Verify $2/M for
   AI-content checks) — scoped `sk-orca-*` per workspace, caps on.
3. Adverserial PAYG $25 top-up reserve (CyberKimi for hard repro + report-grade evidence, CyberGLM for
   mid-tier) — named keys per tool, wallet preflight on.
4. Total fixed: **$20/mo + usage ~$30-60/mo + $25 reserve**. Charge client $6k-45k per audit per
   SecurityWall anchor. Margin covers Scale $200 upgrade ($200 credit included, 10% discount) when you
   hit limits.
5. Upgrade triggers: need Policy Gateway SIEM with reason codes → Abliteration Enterprise; need Team
   compliance reports/audit → OrcaRouter Team Custom; need dedicated capacity/private weights/SSO/DPA →
   Adverserial Enterprise pass-through.

This is the cheapest stack that gives you 1M-context uncensored volume (Abliteration/Orca) +
evidence-backed specialist (Adverserial) with zero-retention/no-log claims + receipts.
