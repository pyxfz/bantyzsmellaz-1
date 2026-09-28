---
title: "2. Sensitive Information Disclosure"
description: "OWASP LLM02 — how LLMs leak PII, trade secrets and training data, and how to contain it."
---

**OWASP Rank:** #2 (LLM02) · **Severity:** Critical

## 2.1 Description

Sensitive information disclosure occurs when an LLM inadvertently reveals confidential data in its
responses. This can include personally identifiable information (PII), trade secrets, training data,
system prompts, or other proprietary information. Disclosures can happen through direct extraction,
inference from model outputs, or as a side effect of prompt injection attacks.

## 2.2 Real-World Incidents

- Engineers have leaked proprietary code through ChatGPT inputs, exposing trade secrets.
- Models trained on medical data have been shown to reconstruct patient health records.
- Financial transaction data has been extracted from fraud-detection models through careful querying.
- IBM's 2025 Cost of a Data Breach Report found that 97% of breached organizations with AI-related
  incidents lacked proper AI access controls.

## 2.3 Why It Matters

LLMs memorize patterns from training data and can regurgitate sensitive information when prompted
cleverly. This creates compliance violations (GDPR, HIPAA, CCPA), intellectual property loss, and
competitive disadvantage. The risk is amplified in RAG systems where models access live databases
containing confidential information.

## 2.4 Mitigation Strategies

- Implement data sanitization and scrubbing before training
- Deploy data loss prevention (DLP) tools to monitor LLM outputs
- Use differential privacy techniques during training
- Apply automated data localization controls for cross-border data
- Implement strict access controls and RBAC for model endpoints
- Regularly audit model outputs for sensitive information leakage
- Use output filtering and redaction layers
