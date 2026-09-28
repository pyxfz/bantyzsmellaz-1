---
title: "1. Prompt Injection"
description: "OWASP LLM01 — direct and indirect prompt injection, real-world incidents and mitigation strategies."
---

**OWASP Rank:** #1 (LLM01) · **Severity:** Critical · **Also known as:** the "SQL Injection of AI"

## 1.1 Description

Prompt injection occurs when an attacker crafts malicious input that manipulates an LLM into
performing unintended actions, overriding system instructions, or leaking sensitive data. It exploits
the fundamental inability of language models to reliably distinguish between system instructions and
user-supplied data.

There are two primary forms:

- **Direct Prompt Injection (Jailbreaking):** The attacker directly inputs malicious prompts to
  overwrite or bypass the system prompt, gaining unauthorized access to backend systems or sensitive
  functionality.
- **Indirect Prompt Injection:** The attacker embeds malicious instructions within external content
  (websites, documents, emails) that the LLM processes as part of its normal operation, causing the
  model to execute the hidden instructions.

## 1.2 Real-World Incidents

- **Bing Chat / Sydney (Feb 2023):** Stanford student Kevin Liu used prompt injection to extract the
  hidden system prompt and internal codename "Sydney" from Microsoft's Bing Chat, demonstrating how
  easily guardrails could be bypassed.
- **CVE-2025-53773:** Hidden prompt injection in pull request descriptions enabled remote code
  execution with GitHub Copilot, scoring 9.6 on the CVSS scale.
- **EchoLeak (Microsoft 365 Copilot):** A zero-click prompt injection vulnerability that could access
  and silently exfiltrate enterprise data without any user interaction.
- **OWASP Statement:** "There is no fool-proof prevention within the LLM" — prompt injection has topped
  the OWASP list since its first release in 2023 and remains fundamentally unsolved.

## 1.3 Why It Matters

LLMs process natural language as both instructions and data simultaneously. This architectural reality
means that any text processed by the model — whether from a user, a document, or a webpage — can
potentially be interpreted as an instruction. Larger, more capable models have not demonstrated
improved resistance.

## 1.4 Mitigation Strategies

- Implement robust access control policies for backend systems
- Integrate human oversight into LLM-directed processes
- Use input validation and sanitization layers before prompts reach the model
- Deploy AI-powered prompt inspection and filtering tools
- Apply the principle of least privilege to LLM tool access
- Implement Google's CaMeL (Capabilities for Machine Learning) architectural approach for data-flow
  isolation
