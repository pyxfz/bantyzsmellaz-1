---
title: "1. Executive Summary"
description: "TL;DR comparison of OrcaRouter, Abliteration AI and Adverserial AI — entry cost, best use and legal fit."
---

## 1.1 TL;DR

> All three are **generators** (produce offensive analysis under authorization), not defensive
> scanners. **OrcaRouter Cyber Zero ($3/$5)** and **Abliteration Large-v2 ($5/$5)** are cheap volume
> workhorses; **Adverserial CyberKimi ($8/$30)** is the premium specialist with public vuln-repro
> evidence (CyberGym 86.7%, ExploitBench V8 transcripts) but ~6× output cost. Cheapest production
> stack remains **Abliteration Developer $20/mo + OrcaRouter free tier (~$56-80/mo per 10M tokens)**. Use
> Adverserial PAYG wallet selectively for hard cases (V8 repro, 1M-ctx hunts), not as daily driver.

## 1.2 Vendor comparison

| Family | What it really is | Entry cost | Best for | Legal fit |
|---|---|---|---|---|
| **OrcaRouter** `orca/orcacyber-zero-1.0` + Qwen-Uncensored | OpenAI-compatible gateway, 200+ models, 1 native cyber model (gated) + uncensored open-weights | Free tier + $3/$5 per 1M for Zero; Qwen $0.33/$2.40; free $0 models | Governed offensive vuln repro, multi-model routing, audit logs | Strong — per-engagement approval, Team compliance, SG jurisdiction |
| **Abliteration AI** `abliterated-model-large-v2` | Hosted abliterated (refusal-vector removed) GLM-5.3, 1M ctx, no per-request refusals | $20/mo Dev, $3/$3 base, $5/$5 large-v2 | Exploit dev, CVE repro, jailbreak/prompt-injection testing, synthetic training data | Usable with strict controls — vendor pushes auth burden to you, zero-retention, Delaware ToS bans illegal use |
| **Adverserial AI** `lordx64/cyberkimi` + `cyberglm` | Specialist cyber lab (NJ LLC, solo-founder-led), Kimi-K3-ablated + cyber-tuned, 1M ctx, privacy-first, public benchmarks | PAYG wallet only ($8/$0.80/$30 CyberKimi; $4/$0.40/$15 CyberGLM); memberships $29/$149/$349 now legacy/V2-waitlist | Hard vuln repro, V8 exploit analysis, Sigma/YARA/KQL, IR/threat-hunt, red+blue reasoning | Strongest ToS wording — explicit auth-first, human-review mandatory, no-logging claim with billing/KV-cache nuances |

## 1.3 The one-line buy

If you only buy one thing this quarter: **Abliteration Developer $20 + OrcaRouter free/Hacker tier**.
Add Adverserial $25-50 PAYG top-up as specialist reserve for cases needing evidence-backed repro.
