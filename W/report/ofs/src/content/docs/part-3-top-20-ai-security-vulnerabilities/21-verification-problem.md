---
title: "21. The Verification Problem"
description: "Why published defence numbers cannot be trusted — silent failures, adaptive attacks, and how to procure, test and audit AI defences."
---

This section exists because it changes how every mitigation above should be procured, tested and audited.

## 21.1 Why published defence numbers cannot be trusted

Several 2026 papers document that **the published evidence base for AI defences is frequently wrong** —
not optimistic, but incorrectly measured.

- **arXiv:2609.10548** — "When Passing Tests Hides Vulnerabilities: An Empirical Study of Silent Failures
  in Agentic Systems." *(Note: the arXiv ID originally supplied by the research cluster was incorrect;
  this is the verified identifier.)*
- **arXiv:2609.32691** — "Silent Failures in Agentic Security Evaluation" reports that a published
  **21.7% attack success rate was really 1.2%** because of a tool-identity versus argument-level scoring
  error, and that an open model reported at 62.8% in fact **registers 0%**. Defence numbers in the
  literature are frequently untrustworthy.
- **arXiv:2606.15057** (AutoDojo) — adaptive black-box indirect-prompt-injection generation across 10
  defences and 5 models finds that **"standard static benchmarks often significantly overestimate defense
  efficacy"** and that most defences either sacrifice considerable utility or are insecure.
- **arXiv:2606.26479** — adaptive, defence-aware attacks **broke twelve out-of-band defences at over 90%
  success.** Independent reproduction of one defence on AgentDojo cut mean attack success from 25.8% to
  4.2%.
- **arXiv:2606.30783** (SecFid) — across 1,168 examples and 48 configurations, the best fidelity was 96.5%
  at 47.8% security, while the most secure defence reached 99.3% security at 71.0–73.9% fidelity. **The
  security-fidelity frontier cannot be won outright; it must be traded deliberately.**

## 21.2 The operational consequence

Do not accept a vendor's attack-success-rate figure as evidence. Demand:

1. A **named benchmark** (AgentDojo, AutoDojo, Promptfoo) and the exact configuration.
2. **Adaptive rather than static** attack generation.
3. The **utility cost** alongside the security number.
4. Your own **internal red-team regression** as the acceptance gate — which is what the
   [90-day plan](/part-3-top-20-ai-security-vulnerabilities/22-summary-matrix-and-roadmap/) builds.

## 21.3 The D3FEND structural gap

There is a related structural gap: **MITRE D3FEND currently returns zero defences for AI-native technique
keywords.** Roughly 80% of ATLAS techniques have no ATT&CK bridge and therefore no off-the-shelf D3FEND
countermeasure. Controls must be built bespoke, and the gap recorded rather than papered over.

## 21.4 Residual risk

If the published numbers are unreliable, the only trustworthy measure of a control is your own regression
suite under adaptive attack. Treat any control that has not been tested that way as unverified, however
it was procured.
