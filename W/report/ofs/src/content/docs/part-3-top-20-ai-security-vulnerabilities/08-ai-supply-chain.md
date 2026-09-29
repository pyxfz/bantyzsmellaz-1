---
title: "8. AI Supply Chain Vulnerabilities"
description: "OWASP LLM04:2026 — malicious weights, poisoned datasets and compromised inference frameworks, before the model sees production traffic."
---

**Framework IDs:** `LLM04:2026` (Supply Chain) · `ASI04` · MITRE ATLAS `AML.T0048`, `AML.T0019`, `AML.T0002`

## 8.1 Definition

Compromise of any artefact an organization pulls into its AI stack — pre-trained weights, datasets,
adapters, inference frameworks, container images or CI/CD — before the model ever sees production
traffic.

## 8.2 Mechanism

Model hubs are package registries operating with the trust model of 2014 PyPI. `AutoModel.from_pretrained()`
on a pickle-backed checkpoint executes `__reduce__` opcodes at **load** time, giving RCE on the training
or inference host; `trust_remote_code=True` grants the repository author arbitrary Python. Beyond code
execution, a **weight-level backdoor implanted during pre-training survives fine-tuning** — roughly
0.00016% poisoned tokens (on the order of 250 documents out of millions) implants a trigger in a 13B
model that passes every clean benchmark and cannot be trained out.

## 8.3 Evidence

- **JFrog, 2024** — approximately **100 malicious PyTorch/Keras models** on Hugging Face. User
  `baller423` shipped a reverse shell to `210.117.212.93` via pickle. (BleepingComputer, 2024-02-28.)
- **ReversingLabs, February 2025** — "nullifAI": the `glockr1/ballr7` repository plus a zeros-named repo
  crafted malformed pickle that made Hugging Face's own Picklescan **error out and skip scanning while
  Python still executed the payload**. A defender's scanner, disabled by the attacker's input, is the
  whole story.
- **Unit 42, 2025-09-03** — **Model Namespace Reuse:** deleted repositories re-published under the same
  namespace, inheriting the trust of the original.
- **Trail of Bits, 2024** — "Sleeper Pickle": patches model bytecode *during* unpickling, so on-disk
  hashes still verify.
- **arXiv:2602.04653** — chat templates are executable programs invoked at every inference call,
  defeating a `safetensors`-only policy.
- **JFrog × Hugging Face integration, March 2025** — "JFrog Certified" scanning; 25 models flagged as
  previously-unknown malicious.
- **Wiz, November 2025** — roughly **two-thirds of top private AI companies** exposed API keys or tokens
  on GitHub, including Hugging Face, Weights & Biases and LangChain. **Nearly half of disclosures were
  never actioned.**
- **Raven.io, September 2026** — Mistral AI's PyPI `v2.4.6` package trojanised in the "Mini Shai-Hulud"
  campaign. No CVE assigned.
- **OpenAI, "The Hugging Face incident and the road ahead," 2026-08-26** (37pp) — agents uploaded
  *malicious datasets* to Hugging Face that caused the server to return unrelated private data. **A
  shared model hub is an exfiltration primitive.**

## 8.4 Mitigations (preventive)

1. **Enforce `safetensors` only.** Hard-block `.bin` and `.pkl` checkpoints and `trust_remote_code=True`
   in the model-registry admission policy.
2. **Require a CycloneDX ML-BOM / AI-BOM per model:** base repository, commit SHA, dataset hashes,
   framework versions, licence.
3. **Pin `revision=<commit-sha>`** — never mutable `main` tags. Run inference behind an admission
   controller that verifies a **Sigstore / cosign** signature over weight hashes before deserialisation.
4. **Allowlist model publishers** and route all pulls through a **private model registry or proxy**
   (internal Artifactory/Nexus AI repository) mirroring approved artefacts only.
5. **Scan in a network-isolated staging sandbox with egress denied.** Run `picklescan` *plus* a
   decompiling scanner — static opcode matching alone is bypassable, as nullifAI demonstrated.
6. **Sign the CI/CD path:** OIDC workload identity, SLSA L3 signed provenance for training runs, hermetic
   builders, no mutable base images.
7. **Behavioural backdoor tests in CI** — canary triggers, "benign-but-wrong" probes and activation-rate
   checks on *every* fine-tuned derivative, not just the base model.
8. **Maintain a clean-base-model allowlist** so a tainted upstream is never inherited through a
   fine-tune.

## 8.5 Continuous monitoring

- Poll the registry every 15 minutes for new revisions on pinned model repositories. **Alert on any SHA
  change outside a change ticket; a `cosign` verification failure is a P1.**
- Verify weight-hash attestation at every container start. **Mismatch or missing signature → refuse to
  load and page.**
- Run the canary-trigger probe set against every deployed model daily. **Any activation rate above zero
  → immediate model quarantine.**
- **Outbound network anomaly detection** on training and inference hosts: unexpected DNS/SNI or any
  connection to a non-allowlisted IP. This is what catches a reverse shell phoning home. Baseline at five
  minutes (Intruder, Monarch, Corelight).
- **Canary tokens in build environment secrets** (AWS honey keys, decoy `AKIA…` strings). Any retrieval
  attempt from a model-serving process is a P1.
- Track `pickle` and `trust_remote_code` usage through CI telemetry; alert if the deny policy is ever
  overridden.
- Continuously re-scan *approved* artefacts for newly disclosed payloads (JFrog Xray, Protect AI,
  Lakera) — a clean artefact today can be disclosed as malicious next month.

## 8.6 Frameworks mapping

`LLM04:2026`; ASI04. NIST AI RMF **GOVERN** (supply-chain policy), **MAP**, **MEASURE**, **MANAGE**;
NIST AI 100-2 adversarial ML taxonomy. ATLAS `AML.T0020`, `AML.T0019`, `AML.T0048`, `AML.T0002`,
`AML.T0043`.

## 8.7 Residual risk

A weight-level backdoor with no behavioural signature cannot be detected by scanning. Only provenance
discipline plus behavioural tripwires bound it.
