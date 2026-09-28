---
title: "5. Improper Output Handling"
description: "OWASP LLM05 — unvalidated model output flowing into downstream systems as XSS, SSRF, SQLi or RCE."
---

**OWASP Rank:** #5 (LLM05) · **Severity:** High

## 5.1 Description

Improper output handling refers to insufficient validation, sanitization, and constraint of
LLM-generated outputs before they are passed to downstream systems. When model output is treated as
trusted data rather than untrusted user input, it can lead to XSS, SSRF, SQL injection, remote code
execution, and other classic web vulnerabilities.

## 5.2 Real-World Incidents

- An LLM hallucinating SQL like `DROP TABLE customers` passed directly to an automation layer,
  contaminating production databases.
- LLM-generated JavaScript rendered in webpages, triggering XSS attacks.
- LLM-created command strings executed in shells without checks, leading to RCE.
- LLM-generated SQL run directly, opening the door to SQL injection.
- 45% of AI-generated code samples included OWASP Top 10 vulnerabilities, with a 72% failure rate for
  newly minted Java code.

## 5.3 Why It Matters

Many teams treat model outputs as trusted data when they should be treated as untrusted user input. The
OWASP LLM Top 10 specifically ranks this as a distinct risk because of how commonly this mistake is
made. As LLM outputs increasingly drive automation and code generation, the attack surface expands
dramatically.

## 5.4 Mitigation Strategies

- Treat all LLM output as untrusted user input
- Validate and sanitize all outputs before passing to downstream systems
- Sandbox execution in micro-VMs or WebAssembly
- Implement strict output encoding and escaping
- Use allowlists rather than denylists for output validation
- Apply Zero Trust security models to LLM integrations
- Implement circuit breakers for anomalous outputs
