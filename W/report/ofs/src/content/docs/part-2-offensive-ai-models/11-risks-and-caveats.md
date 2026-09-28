---
title: "11. Risks & Caveats"
description: "Name confusion, claims you must not make, legal exposure, data-handling traps and pricing hygiene."
---

## 11.1 Names and companies — do not conflate

- Do not conflate OrcaRouter (`orcarouter.ai`) with OpenRouter (`openrouter.ai`) or Adverserial
  (`adverserial.ai` with E) with Adversarial (`adversarial.com` / adversarial-ML category) in contracts
  — different companies, jurisdictions, model IDs.

## 11.2 Claims you must not make

- Do not claim Trustpilot/G2 scores that don't exist (OrcaRouter no Trustpilot, Abliteration 0 ratings,
  Adverserial no Trustpilot/Discord/G2 — only 14★ GitHub + founder-led social).
- Do not rely on vendor benchmarks alone (Orca 98.07%, Abliteration 84.5%/2×, Adverserial 86.7%/10-16
  V8) — all vendor-reported, small/single-seed, V8 <24h uncorroborated (OffSeq/Kobaran). Run your own
  sample + disclose skepticism before quoting accuracy to clients.
- Cite benchmarks with URLs and single-seed caveats.

## 11.3 Legal exposure

- Do not use uncensored models for malware delivery, pathogen assistance, or unauthorized targets — all
  ToS ban illegal/harmful/high-risk and allow suspension + upstream metadata sharing. Abliteration's
  filters (only self-harm/CSAM per LessWrong) and Adverserial's "capability ≠ permission" do NOT protect
  you legally without written auth.

## 11.4 Data-handling traps

- Do not send client-confidential prompts with web search/fetch enabled on Abliteration (third-party
  retention voids zero-retention).
- On Adverserial, note billing + KV-cache retention despite "no logs" marketing — get DPA/region in
  writing for regulated clients.

## 11.5 Pricing and scope hygiene

- Do not use legacy $29/$149/$349 Adverserial memberships in proposals — now legacy/wallet-credit + V2
  waitlist. Quote PAYG $8/$0.80/$30 Kimi, $4/$0.40/$15 GLM + top-ups.
- Do not absorb Enterprise costs — always pass through Adverserial dedicated/SSO/DPA + your human fee +
  compliance uplift.
- Pricing drift: Orca live prices refresh 60s, Gemini promo doubles Jan 1 2027, Abliteration cached
  $0.30 vs $0.50 conflict, Adverserial serving 512K vs 1M marketing vs 750K client budget — re-check
  `/models` + `/pricing` + `/docs.html` at proposal time.
