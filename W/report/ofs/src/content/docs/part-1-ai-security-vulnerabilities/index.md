---
title: "Part I — Overview"
description: Scope, severity legend and numbered contents for the Top 10 security vulnerabilities facing AI systems.
---

**Report date:** September 27, 2026
**Author:** AI Security Research Report
**Sources:** OWASP GenAI Security Project, Mindgard, SentinelOne, Cloudflare, Trend Micro, MITRE ATLAS, NIST AI RMF

## 0.1 About this part

This part is the top-10 list of security vulnerabilities that face AI systems in 2026, ordered by the
OWASP GenAI LLM Top 10. Each of the ten sections below follows the same shape — **what the
vulnerability is**, **real-world incidents that prove it**, **why it matters**, and **mitigation
strategies** you can act on.

The list is defensive-first: it describes how these failures happen so that builders, reviewers and
security teams can design systems that resist them. Prompt injection has topped the OWASP list since
its first release in 2023 and remains fundamentally unsolved.

## 0.2 How to read this part

- **Sections 1–10** are the vulnerabilities themselves, in OWASP severity order.
- **Section 11** holds the summary/severity matrix, the frameworks referenced throughout, and the full source list.
- Each section is numbered `x.1`–`x.4` so the table of contents on the right can jump straight to a subsection.

## 0.3 Severity legend

| Severity | Meaning |
|---|---|
| Critical | Exploitable in production today with severe impact; no fool-proof in-model prevention exists |
| High | High likelihood and significant blast radius; mitigation is architectural |
| Medium-High | Requires specific conditions or privileged context; impact still material |
| Medium | Common but generally lower blast radius; often a cost or correctness issue |

## 0.4 Contents

1. [Prompt Injection](/part-1-ai-security-vulnerabilities/01-prompt-injection/)
2. [Sensitive Information Disclosure](/part-1-ai-security-vulnerabilities/02-sensitive-information-disclosure/)
3. [Supply Chain Vulnerabilities](/part-1-ai-security-vulnerabilities/03-supply-chain-vulnerabilities/)
4. [Data and Model Poisoning](/part-1-ai-security-vulnerabilities/04-data-and-model-poisoning/)
5. [Improper Output Handling](/part-1-ai-security-vulnerabilities/05-improper-output-handling/)
6. [Excessive Agency](/part-1-ai-security-vulnerabilities/06-excessive-agency/)
7. [System Prompt Leakage](/part-1-ai-security-vulnerabilities/07-system-prompt-leakage/)
8. [Vector and Embedding Weaknesses](/part-1-ai-security-vulnerabilities/08-vector-and-embedding-weaknesses/)
9. [Misinformation and Hallucination](/part-1-ai-security-vulnerabilities/09-misinformation-and-hallucination/)
10. [Unbounded Consumption](/part-1-ai-security-vulnerabilities/10-unbounded-consumption/)
11. [Summary Table, Frameworks & Sources](/part-1-ai-security-vulnerabilities/11-summary-frameworks-and-sources/)
