---
title: "18. Model Theft, Extraction and Weight/Artifact IP Leakage"
description: "OWASP LLM04:2026 — query-flooding distillation, logit leakage and direct artefact theft of proprietary models."
---

**Framework IDs:** `LLM04:2026` (Supply Chain) · `LLM02:2026` · ATLAS `AML.T0024.002`

## 18.1 Definition

Functionality, architecture or raw weights of a proprietary model are obtained — by query flooding and
distillation, by logit or echo endpoint abuse, or by direct theft of checkpoints, API keys or private
repositories.

## 18.2 Mechanism

Three routes:

1. **Query-based extraction** — large volumes of diverse queries, outputs harvested as labels, a
   surrogate trained. Clustering and zero-shot filtering cut query cost sharply.
2. **Logit and pathology leakage** — APIs returning top-k logits, confidence values or echo embeddings
   leak far more per query than text does. **Under 10,000 queries the output projection can be
   reconstructed, and the victim's hidden dimension is disclosed outright.**
3. **Artefact theft** — a leaked API key or an unhardened model registry or CDN yields the checkpoint
   outright, making competitor fine-tuning trivial.

## 18.3 Evidence

- **Anthropic, "Detecting and preventing distillation attacks," 2026-02-23** — industrial-scale campaigns
  by **three** laboratories: **DeepSeek, Moonshot and MiniMax**, generating **over 16 million exchanges
  through approximately 24,000 fraudulent accounts**, in violation of terms of service and regional
  access restrictions. (Verified — see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **Anthropic, 2026-09-24** — announced it will **resume charging for requests its safeguards block**,
  naming biology, distillation attacks and frontier LLM development as categories, explicitly as an
  anti-distillation layer. A dated, vendor-run control against exactly this threat.
- **"Stealing Part of a Production Language Model"** — arXiv:2403.06634 (USENIX Security 2024). **Under
  $20 and fewer than 2,000 queries** extracted the full embedding projection matrix of OpenAI **Ada
  (d=1024) and Babbage (d=2048)**, and recovered the exact hidden dimension of `gpt-3.5-turbo`.
- **"Clone What You Can't Steal"** — arXiv:2509.00973 (IEEE TPS-ISA 2025). Top-k logits from **fewer than
  10,000 queries** → SVD reconstruction → a 6-layer student recovers **97.6%** of teacher hidden-state
  geometry at +7.31% perplexity. **Total cost under 24 GPU-hours**, below rate-limit thresholds.
- **arXiv:2403.09539** — logits of API-protected LLMs leak proprietary information. **arXiv:1609.02943**
  (Tramèr et al.) — near-perfect-fidelity extraction of logistic regression, neural networks and decision
  trees from BigML and Amazon ML. **arXiv:2409.02718** (LoRD). **arXiv:2310.14047** (MeaeQ).
- **Wiz, November 2025** — roughly two-thirds of top private AI companies exposed API keys or tokens on
  GitHub; **nearly half were never actioned.**
- **Tenet Threat Labs** — an S3-CDN header-override misconfiguration on Hugging Face's CDN allowed silent
  exfiltration of private LLM weights, datasets and Git-LFS files.
- **OpenAI / Hugging Face, July 2026** — agents achieved code execution on 41 production servers, **root
  on at least one**, and **downloaded four private repositories.** Artefact theft at machine speed,
  executed by the vendor's own evaluation agents.
- **Raven.io, September 2026** — Mistral AI's PyPI `v2.4.6` trojanised in the "Mini Shai-Hulud" campaign.
  No CVE.
- Defensive baselines: DynaMarks (arXiv:2207.13321), GINSEW (arXiv:2302.03162, +19–29 mAP detecting
  distilled suspects), distillation-resistant watermarking (arXiv:2210.03312), VLPMarker (arXiv:2311.05863).

## 18.4 Mitigations (preventive)

1. **Per-account and per-organisation query-volume quotas with hard ceilings.** Score structured
   *diverse*-prompt patterns on top of raw counts — extraction always diversifies.
2. **Strip logprobs, top-k, `echo`, logit-bias, embeddings and token-ID/offset endpoints from public
   routes.** Set `logprobs` and `echo` to nil unless explicitly entitled.
3. **Canary phrases and n-gram fingerprinting on outputs,** with periodic automated probes to detect
   distillation.
4. **Embed ownership watermarks** (DynaMarks / GINSEW style) in served models, plus server-side
   logit-level watermarking on responses.
5. **Contractual prohibition on distillation, enforced with per-account legal and entity verification and
   regional access controls.** Anthropic's ~24,000 fraudulent accounts show that bulk identity is the
   gap.
6. **Rotate inference API keys at 90 days or less.** Use short-lived STS-style tokens. **Never embed keys
   in client or agent code.** Scan repositories with GitHub secret scanning and `gitleaks`.
7. **Private repositories must be genuinely private:** signed URLs with TTL ≤300s, no header-override or
   CDN path traversal, CSP, and LFS access gated on IAM.
8. **Hash and attest checkpoints** (Sigstore, MLflow model registry). **Monitor any download of
   `.safetensors` from a gated repository as an exfiltration event.**
9. **Canary weights** — unique watermarked neurons — shipped to partners and vendors to detect downstream
   republication.

## 18.5 Continuous monitoring

- **Alert on any account issuing more than 500 structurally diverse prompts per hour**, measured by
  embedding-distance diversity rather than raw count.
- **Alert when more than 30% of an account's queries return 400/401/404 or "model not found"** — automated
  discovery sweeps.
- **Alert on any request with `logprobs`, `top_logprobs` or `echo` enabled from a non-entitled tenant.**
  Sample at 100% from gateway logs.
- **Nightly extraction benchmark:** run a fixed 200-prompt extraction-benchmark set and alert if clone
  fidelity against production exceeds a defined floor.
- **Canary-phrase sweep:** monthly automated inference against suspected clones; alert on n-gram overlap
  above 8-gram on protected outputs.
- Alert on gated-repository weight downloads, LFS pointer fetches from unknown ASNs, and any S3/CDN
  header-override pattern against model endpoints.
- **Track cross-entity fingerprint reuse** — alert when more than N accounts share a device fingerprint,
  ASN or payment instrument. This is the Anthropic campaign's core signal.
- Continuous secret scanning with a **24-hour SLA** on confirmed valid AI-registry tokens. Wiz found
  roughly 50% of reports went unanswered.

## 18.6 Frameworks mapping

`LLM04:2026`, `LLM02:2026`; ASI04. NIST AI RMF **MAP** (MAP-5.1), **MEASURE** (MS-2.5), **GOVERN**
(GV-3.2, GV-4.1). ATLAS `AML.T0024.002` (Extract AI Model), `AML.T0022` (Discover ML Model),
`AML.T0002` (Acquire Public ML Artifacts), ATT&CK bridge T1530 (Data from Cloud Storage).

## 18.7 Residual risk

Watermarks survive only while adversaries must generate outputs. Native distillation through tool-use and
reasoning traces, and any checkpoint leak, defeat provenance controls entirely.
