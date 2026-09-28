---
title: "7. System Prompt Leakage"
description: "OWASP LLM07 — extracting hidden instructions, guardrails and embedded secrets."
---

**OWASP Rank:** #7 (LLM07) · **Severity:** Medium-High

## 7.1 Description

System prompt leakage occurs when attackers extract the hidden instructions, guardrails, or embedded
secrets that guide an LLM's behavior. These system prompts often contain proprietary business logic,
safety rules, and configuration details that provide attackers with a roadmap for further
exploitation.

## 7.2 Real-World Incidents

- The "Sydney" incident where Bing Chat's full system prompt was extracted.
- Attackers using prompts like "Ignore previous instructions…" to bypass safety guardrails.
- Extraction of internal codenames, configuration details, and safety rules from production AI
  systems.

## 7.3 Why It Matters

System prompts are the primary defense mechanism for LLM behavior. Once leaked, attackers can craft
targeted attacks that bypass safety measures, understand the model's limitations, and identify paths to
exploit downstream systems. Hidden context exposure expands this category to include any hidden
configuration that influences model behavior.

## 7.4 Mitigation Strategies

- Avoid embedding sensitive credentials or secrets in system prompts
- Implement prompt extraction detection and prevention
- Use multiple layers of defense rather than relying solely on system prompts
- Regularly test systems for prompt leakage vulnerabilities
- Implement output filtering that detects and blocks system prompt disclosure
- Use techniques like instruction hierarchy to separate system and user instructions
