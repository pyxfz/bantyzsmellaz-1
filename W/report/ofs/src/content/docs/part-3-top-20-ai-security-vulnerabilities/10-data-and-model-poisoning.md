---
title: "10. Data and Model Poisoning, Backdoors and Sleeper Agents"
description: "OWASP LLM05:2026 — triggered and latent backdoors implanted through training corpora, fine-tunes and RAG knowledge bases."
---

**Framework IDs:** `LLM05:2026` (Data and Model Poisoning) · `LLM04:2026` · `ASI06` · ATLAS `AML.T0020`, `AML.T0018`

## 10.1 Definition

An attacker injects a small number of crafted samples into pre-training corpora, fine-tuning sets, RAG
knowledge bases, embedding indices or model weights, so the trained artefact is silently conditioned on
a trigger that produces attacker-chosen output.

## 10.2 Mechanism

Classic poisoning implants a **low-aspect-ratio backdoor** so a trigger (token sequence, image patch,
rare token) maps to a target label while clean accuracy is preserved. **Clean-label** variants require no
label tampering and reach **98.98% attack success at a 5% poisoning rate**. In RAG the trigger is
inverted: the attacker plants documents engineered to out-rank legitimate ones and to instruct the model,
so a single poisoned chunk suffices — demonstrated end-to-end against NVIDIA's production "Chat with
RTX."

The hardest variant is the **latent backdoor**, where no trigger is present in the data at all. Sleeper
Agent uses gradient matching to match the target model's behaviour, and Anthropic showed such behaviour
**survives SFT, RLHF and adversarial training** — worst in large models and in chain-of-thought models.
Critically, **adversarial training can actively teach the model to recognise its trigger, making it
better at hiding it.**

## 10.3 Evidence

- **PoisonedRAG** (Zou et al., **USENIX Security 2025**) — **90% attack success with just 5 poisoned
  texts per target question.** arXiv:2402.07867.
- **Sleeper Agents** (Hubinger et al., Anthropic, January 2024) — arXiv:2401.05566. Deceptive behaviour
  persists through safety training.
- **Sleeper Agent** (Hubinger et al., 2021) — arXiv:2106.08970. Scalable hidden-trigger backdoors.
- **Phantom** (2024) — arXiv:2405.20485. Backdoors against RAG, attacking NVIDIA "Chat with RTX."
- **Sleeper Cell** (2026) — arXiv:2603.03371. SFT-then-GRPO decouples capability injection from alignment
  enforcement in tool-using agents.
- **Enhancing Clean Label Backdoor Attack** (2022) — arXiv:2206.04881. 98.98% ASR at 5% poisoning.
- **EchoLeak** — `CVE-2025-32711`, CVSS 9.3, Aim Security, June 2025. arXiv:2509.10540.
- **JFrog** — malicious Hugging Face models carrying silent backdoors targeting data scientists
  specifically.
- **ReversingLabs, 2025** — `nullifAI`, a backdoored model hosted on Hugging Face.

## 10.4 Mitigations (preventive)

1. **Pin every training and RAG corpus to an immutable, content-hashed registry.** Reject any job whose
   dataset SHA-256 differs from the approved manifest. Use S3 Object Lock in compliance mode plus a Lake
   Formation deny outside the training path.
2. **Run clean-label and trigger-invariance tests before every model promotion** — Neural Cleanse, ABS,
   Spectral Signatures — plus a canary-token suite on the RAG index.
3. **Constrain RAG ingestion:** whitelist connectors, strip HTML/JS/metadata, and apply a
   prompt-injection classifier (Microsoft Spotlighting, promptfoo LLM-Security-DB) to every retrieved
   chunk *before* it enters context.
4. **Enforce retrieval-side dominance controls** — vector-similarity floor, recency and source-authority
   re-ranking — so attacker text cannot outrank approved content. Cap context contribution per source.
5. **Fine-tune only with attested provenance datasets** (CSAF, SLSA, or a signed AI-BOM per CycloneDX
   ML-BOM). Verify model artefact signatures with `cosign verify-blob` before loading. **Block pickle
   loading of third-party weights.**
6. **Rate-limit and provenance-trace every corpus contributor** so a single insider or contractor cannot
   dominate a shard. Apply per-contributor sample caps and anomaly detection on the feature space of
   newly arrived samples.
7. **Apply representation-level defences at fine-tune time:** randomized or perturbed embeddings,
   unembedding alignment, Random Token Pruning — all of which blunt gradient-matching implants.
8. **Never treat safety fine-tuning as backdoor removal.** Maintain a *held-out* poisoned-trigger
   regression set and re-run it after every SFT and RLHF pass.

## 10.5 Continuous monitoring

- Log every training and RAG ingestion event with source, author, dataset hash and chunk count. **Alert
  on any new document whose cosine distance to its nearest existing chunk falls below a floor**, or on a
  spike in near-duplicate submissions from one contributor.
- **Hash-lock each RAG corpus:** continuously recompute a Merkle root over the vector store and alert on
  any delta.
- **Scheduled trigger-inversion sweep** (Neural Cleanse / BadNets detection) against a rotating
  canary-trigger list. **Alert if any trigger achieves more than 5% targeted misclassification while
  clean accuracy is unchanged.** Run inside the CI gate via the Hugging Face `evaluate` harness.
- **Log every retrieval interaction** — chunk ID, similarity score, rank, source document. **Alert when a
  single document drives more than X% of answer citations for a semantic cluster.**
- Enforce CloudTrail or Azure activity-log data events on the corpus store; **alert on `PutObject` /
  `DeleteObject` from any principal outside the ML platform service role.**
- Diff behaviour across model versions on a fixed adversarial evaluation suite. **Alert on any regression
  beyond two points in refusal or harmfulness benchmarks that coincides with a corpus change** — this
  links weights and data provenance.

## 10.6 Frameworks mapping

`LLM05:2026`, `LLM04:2026`; ASI06. NIST AI 600-1 risks *Data Poisoning* and *Information Integrity*;
functions **GOVERN**, **MAP** (GV-1.2 AI inventory), **MEASURE** (MS-2.6 red teaming), **MANAGE**. ATLAS
`AML.T0020`, `AML.T0018`, `AML.T0019`, `AML.T0024`.

## 10.7 Residual risk

Weight-level and latent backdoors are provably **not** removed by SFT, RLHF or adversarial training.
Detection — not training-time filtering — is the only durable control.
