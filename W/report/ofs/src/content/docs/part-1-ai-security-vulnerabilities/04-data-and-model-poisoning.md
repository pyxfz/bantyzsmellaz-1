---
title: "4. Data and Model Poisoning"
description: "OWASP LLM04 — backdoors and bias injected through training data and model parameters."
---

**OWASP Rank:** #4 (LLM04) · **Severity:** High

## 4.1 Description

Data poisoning occurs when an attacker manipulates pre-training, fine-tuning, or embedding data to
introduce vulnerabilities, backdoors, or biases into the model. Model poisoning involves direct,
targeted changes to model parameters themselves. Both can cause the model to produce incorrect,
biased, or malicious outputs while appearing normal during standard testing.

## 4.2 Real-World Incidents

- Malware binaries deliberately mislabeled as "benign" in antivirus training data, teaching the model
  to ignore similar threats.
- "Sleeper" behaviors injected through training data that activate only on specific trigger inputs.
- Backdoored image recognition systems that classify images incorrectly when certain patterns are
  present.
- Spam emails labeled as "ham" during training, causing spam filters to let similar future emails
  through.

## 4.3 Why It Matters

Poisoned models can remain dormant and undetected until triggered, making them extremely dangerous. The
lack of visibility into data curation allows attackers to inject malicious samples that compromise
model integrity across the entire data lifecycle. Federated learning environments are particularly
vulnerable to Byzantine attacks from colluding nodes.

## 4.4 Mitigation Strategies

- Limit training data to trusted, validated sources
- Use automated tools to scan training data for abnormalities
- Implement data versioning to track changes over time
- Employ differential privacy or federated learning to limit single-data-point impact
- Use cryptographic verification of datasets
- Implement zero-trust for RAG documents
- Conduct regular model auditing and red teaming
