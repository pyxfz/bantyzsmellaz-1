---
title: "3. Supply Chain Vulnerabilities"
description: "OWASP LLM03 — poisoned models, plugins and dependencies across the ML supply chain."
---

**OWASP Rank:** #3 (LLM03) · **Severity:** High

## 3.1 Description

AI supply chain vulnerabilities arise from compromised components anywhere in the ML pipeline —
pre-trained models, training datasets, third-party plugins, dependencies, model hubs, or CI/CD
infrastructure. A single poisoned component can cascade across thousands of downstream applications.

## 3.2 Real-World Incidents

- **Tool Poisoning Attacks (Spring 2025):** Invariant Labs discovered a critical vulnerability in the
  Model Context Protocol (MCP) enabling "Tool Poisoning Attacks" that could compromise AI agent tool
  integrations.
- Poisoned dependencies on model hubs have installed backdoored sentiment-analysis models across many
  applications.
- Compromised pre-trained models have been found containing hidden triggers that survive fine-tuning.
- Malware binaries mislabeled as "benign" in antivirus training corpora have allowed similar malware to
  slip past detection systems.

## 3.3 Why It Matters

Modern AI development relies heavily on pre-trained models, open-source libraries, and third-party
integrations. Organizations often lack visibility into the provenance and integrity of these
components. The Trend Micro 2025 report found that supply chain attacks distributing malicious model
updates are a growing threat vector.

## 3.4 Mitigation Strategies

- Require AI-BOMs (Bill of Materials) and SBOMs for all AI components
- Pin all dependencies by cryptographic hash
- Vet suppliers and maintain an up-to-date inventory of components
- Scrutinize supplied data and models before integration
- Implement cryptographic verification of datasets and model weights
- Use zero-trust architecture for model deployment
- Monitor for anomalous behavior in production models
