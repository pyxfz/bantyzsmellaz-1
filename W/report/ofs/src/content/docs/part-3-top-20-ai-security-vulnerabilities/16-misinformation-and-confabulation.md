---
title: "16. Misinformation, Hallucination and Confabulation"
description: "OWASP LLM07:2026 — fluent, confident false output that a human accepts and acts on, and the cascading variants RAG does not catch."
---

**Framework IDs:** `LLM07:2026` (Misinformation) · `LLM02:2026` · `ASI08` · `ASI09`

## 16.1 Definition

Fluent, confident, false output that a human accepts and acts on. **Confabulation** is the newer term
for the specific mode in which the model adopts a plausible-sounding false premise supplied in the prompt
or context and then elaborates it consistently rather than challenging it.

## 16.2 Mechanism

Hallucination arises from ungrounded next-token generation. **Confabulation** arises when a false premise
is treated as given, and the model generates supporting detail, citations and statistics that *look*
verified. RAG helps only partially — retrieval can be overridden by a contradictory premise, and in
multi-step agentic pipelines an early unsupported claim is re-retrieved and amplified into a **cascading
hallucination.** A compounding factor that surprises most teams: **citation presence raises hallucination
rates even when the citation is fabricated.**

## 16.3 Evidence

- **arXiv:2607.11127** — legal-citation fabrication, 120 bilingual questions comparing GDPR against the
  Saudi PDPL. GDPR direct-retrieval accuracy was **94–100%**; **Saudi PDPL fabrication ran 60–77%**, and
  **91% of fabricated citations were asserted with confidence ≥ 0.8.** **Confidence is not a safety
  signal.**
- **arXiv:2601.15476** — "Reliability by design." 2,700 legal answers, 12 LLMs, 75 tasks, double-blind
  expert review. Standalone generative models showed a **False Citation Rate above 30%**. Basic RAG still
  leaves notable misgrounding. **Optimised RAG (embedding fine-tuning, re-ranking, self-correction)
  drives fabrication below 0.2%.**
- **arXiv:2602.05930** — **100 fabricated citations across 53 NeurIPS 2025 accepted papers (≈1% of
  5,290)**, each having passed 3–5 expert reviewers. Taxonomy: Total Fabrication 66%, Partial Attribute
  Corruption 27%, Identifier Hijacking 4%, Placeholder 2%, Semantic 1%. **100% were compound failure
  modes** — secondary characteristics dominated by Semantic Hallucination (63%) and Identifier Hijacking
  (29%), which create "a veneer of plausibility and false verifiability." (Verified — see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **arXiv:2606.13104** (AuthorityBench, 220,564 prompts) — citation presence raises hallucination by 3–22
  percentage points, reaching **35–77% in general knowledge** when a fabricated citation accompanies a
  true claim.
- **arXiv:2606.24902** — in a research-mathematics audit, **0 of 8 proofs** contained a confirmed
  fabricated citation, but **8 of 8** contained an unjustified load-bearing claim asserted as a "standard
  argument." **RAG and citation-checking do not catch this mode.**
- **arXiv:2606.04435** (CHARM) — formalises cascading hallucination as a distinct failure mode in
  multi-step agentic RAG.
- **Farquhar et al., *Nature* 633, 618–626 (2024)** — semantic entropy; uncertainty-aware hallucination
  detection without retraining.
- **Named incidents:** *Mata v. Avianca, Inc.*, 678 F. Supp. 3d 443 (S.D.N.Y. 2023) — fabricated cases,
  $5,000 Rule 11 sanction. *Moffatt v. Air Canada* (BC Civil Resolution Tribunal, February 2024) — the
  chatbot invented a bereavement-fare policy; the airline was held liable, CAD 812.02 awarded. LACBA,
  September 2025 — Special Master's sanctions over false citations. N.D. Mississippi sanctions order,
  2026-06-08 — four counsel removed over AI hallucinations.
- ATLAS treats hallucination as an attack surface: `AML.T0062` (Discover LLM Hallucinations) →
  `AML.T0060` (Publish Hallucinated Entities) → `AML.CS0022` (dependency confusion).

## 16.4 Mitigations (preventive)

1. **Never let a low-stakes output gate a high-stakes decision.** Classify every use case — advice,
   drafting, summarising, executing — and require human sign-off for the first three in regulated domains.
2. **Verbatim-grounding constraint:** require every consequential claim to quote retrieved source text
   with document ID and version, and forbid paraphrase-as-evidence. The PDPL study shows model confidence
   cannot substitute for this.
3. **Do RAG properly:** embedding fine-tuning plus cross-encoder re-ranking plus self-correction, and an
   explicit **"insufficient evidence → abstain"** path. This is the configuration that reaches sub-0.2%
   fabrication.
4. **Verify premises before generating** — RAG-based logical decomposition that checks each premise in the
   query *before* answering, and returns a contradiction prompt when one fails.
5. **Cascade breakers for multi-step agents:** stage-level fact verification, cross-stage consistency
   checks, confidence-propagation monitoring.
6. **Automated citation verification at ingestion** (Crossref, OpenAlex, case-law lookup) — mandatory, not
   optional. The NeurIPS data proves human peer review is not sufficient.
7. **Surface uncertainty:** semantic entropy or equivalent sampling-based disagreement scoring, with a
   forced abstention or escalation UI state above threshold.
8. **Output encirclement:** structured schemas with a required `confidence` and `supporting_quote` field
   per claim, making uncertainty impossible to omit downstream.

## 16.5 Continuous monitoring

- **Per-claim groundedness scoring on 100% of answers** in high-stakes flows. Every claim must resolve to
  a stored chunk hash. **Alert on groundedness below 0.85, or on any claim with confidence ≥ 0.8 and no
  supporting quote.**
- **Citation verification job:** resolve every emitted citation against Crossref/OpenAlex/authority APIs
  on write. **An unresolved or mismatched DOI or case citation is a P1.** This is precisely how you would
  have caught the NeurIPS 2025 and PDPL fabrication.
- **Premise-audit sampler:** an LLM-as-judge flags load-bearing claims asserted as "standard" or
  "fundamental" with no justification. Alert on one or more per answer. (Recall is ~50% but precision was
  100% in arXiv:2606.24902.)
- **Abstention-rate and calibration tracking:** plot stated versus measured confidence monthly; **alert on
  calibration drift beyond 10 percentage points.** This catches the "91% of fabrications at ≥0.8
  confidence" pattern.
- **Answer-approval override rate:** alert when a human reviewer edits or rejects more than 5% of AI
  recommendations in a workflow over a rolling seven days. This is the earliest reliable business signal
  that accuracy has degraded after a model, prompt or corpus change.
- **Cascade canary:** inject a known-false sentinel fact into a canary corpus and assert it is *never*
  repeated downstream. Alert on any echo.
- **Nightly domain regression suite** on your own vertical with a fabrication-rate SLO; block releases
  that regress it. Stack: Vectara, Patronus, Laminar for groundedness, plus a domain gold set in CI.

## 16.6 Frameworks mapping

`LLM07:2026`, `LLM02:2026`, `LLM09:2026`, `LLM06:2026`; ASI08, ASI09. NIST AI RMF **GOVERN** (use-case
tiering, human oversight), **MAP**, **MEASURE** (fabrication and calibration metrics), **MANAGE**
(abstention and escalation thresholds). EU AI Act Art. 13, Art. 14; for GPAI providers Art. 55.

## 16.7 Residual risk

Fabrication in low-resource jurisdictions and "premise smuggling" survive RAG and citation-checking by
design. A confident, fluent, undetected false premise entering a decision loop is the irreducible
exposure.
