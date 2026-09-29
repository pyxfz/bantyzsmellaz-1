---
title: "11. Training-Data Extraction, Membership Inference and Model Inversion"
description: "OWASP LLM02:2026 — recovering verbatim training records, probing membership and reconstructing records from query access alone."
---

**Framework IDs:** `LLM02:2026` (Sensitive Information Disclosure) · `LLM03:2026`

## 11.1 Definition

An attacker with only query access — sometimes just a few thousand completions — recovers verbatim
training records, reconstructs a record from partial attributes, or determines with high confidence
whether a specific individual's record was in the training set.

## 11.2 Mechanism

Extraction attacks seed a model with a known prefix ("Company names that were fined for environmental
violations include…") and mine completions for long verbatim spans. Newer entropy-based variants
deliberately **induce a sustained high-entropy state** to force regurgitation, recovering verbatim data
with no prior knowledge of the target text. Membership inference scores the per-example loss gap between
a target record and a reference distribution; it is **dramatically stronger under fine-tuning than
pre-training**, and head-only fine-tuning is far more exposed than adapter-based tuning. Fragment
inference generalises membership inference to unordered partial knowledge — knowing a patient has
"hypertension" suffices to probe for co-occurring conditions.

## 11.3 Evidence

- **Carlini et al., "Extracting Training Data from Large Language Models," USENIX Security 2021** —
  arXiv:2012.07805. The foundational paper.
- **Shokri et al., "Membership Inference Attacks Against Machine Learning Models," IEEE S&P 2017** —
  arXiv:1612.02696.
- **Fredrikson et al., "Model Inversion Attacks that Recover Training Data," USENIX Security 2015** —
  arXiv:1511.02243.
- **arXiv:2511.05518** — "Retracing the Past: LLMs Emit Training Data When They Get Lost"
  (confusion-inducing attacks).
- **arXiv:2205.12506** — memorisation is far stronger in fine-tuning than pre-training; head-only tuning
  is more exposed than adapters.
- **arXiv:2505.13819** — "Fragments to Facts: Partial-Information Fragment Inference from LLMs."
- **Kandpal et al., CCS 2022** — arXiv:2210.17546. **Preventing verbatim memorisation gives a false sense
  of privacy:** a perfect verbatim filter still leaks via paraphrase.
- **arXiv:2402.17012** — "Pandora's White-Box: Precise Training Data Detection and Extraction in LLMs."

## 11.4 Mitigations (preventive)

1. **Apply DP-SGD, or LoRA plus privacy-preserving fine-tuning, with a formal (ε, δ) budget.** Publish ε
   on the model card using the Opacus or TF-Privacy accountant.
2. **Reduce duplicate and low-diversity training data.** Carlini et al. show deduplication sharply cuts
   extraction yield. Enforce a minimum n-gram threshold in the data pipeline.
3. **Prefer adapter/LoRA over head or full fine-tuning** for customer-specific data — measurably lower
   membership-inference susceptibility.
4. **Do not rely on verbatim-memorisation filters.** Kandpal et al. show a perfect verbatim filter still
   leaks via paraphrase. Treat access control and rate limits as the primary control.
5. **Run a differential-privacy membership-inference audit as a release gate**
   (adversarial-robustness-toolbox, IBM AI Fairness 360) with an agreed AUC ceiling.
6. **For regulated data, train only on de-identified or tokenised representations,** keeping the
   re-identification map in a separate HSM-backed vault. Implement GDPR Article 15 access requests
   against the *training set*, not just the model.
7. **Contractually and technically bar retention of raw prompts and outputs** for training —
   zero-retention API modes — enforced by data-processing addendum plus egress filtering.
8. **Require authenticated per-tenant endpoints** so one tenant cannot query a model trained on another
   tenant's data.

## 11.5 Continuous monitoring

- Log every inference request with prompt hash, model version and per-token loss or top-k distribution.
  **Alert when a session's sampled completions exceed a repetition or perplexity floor relative to tenant
  baseline** — the Carlini extraction signature.
- Maintain a **per-prompt-prefix extraction score** (mean log-likelihood of verbatim n-gram matches
  against the training index). Alert on sustained scores above 0.5 across more than N queries from one
  identity.
- **Quarterly membership-inference sweep** with a known-member / known-non-member control set. **Alert if
  attack AUC exceeds 0.60 on any protected-attribute cohort.**
- Monitor entropy telemetry per request; **alert on sustained consecutive high-entropy token spans** —
  the precursor to regurgitation.
- **DLP on model responses at the inference gateway.** Route every PII/PHI hit to case management with an
  SLA (Microsoft Purview, Netskope GenAI DLP).
- **Data-subject request audit log:** alert on any model retrain that ingests a shard whose lineage
  touches an active erasure request (GDPR Article 17).

## 11.6 Frameworks mapping

`LLM02:2026`, `LLM03:2026`. NIST AI 600-1 risk *Data Privacy*; **MAP** (MAP-5.1, data provenance),
**MEASURE**, **MANAGE**. GDPR Articles 5, 15, 17, 25, 32. ATLAS `AML.T0024`, `AML.T0024.002`,
`AML.T0022`.

## 11.7 Residual risk

No purely technical defence eliminates extraction from a general-purpose memorising model. The realistic
ceiling is raising query cost and bounding exposure differentially, compensating for the remainder
contractually.
