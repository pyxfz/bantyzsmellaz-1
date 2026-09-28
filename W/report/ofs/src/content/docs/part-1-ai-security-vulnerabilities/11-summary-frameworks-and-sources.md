---
title: "11. Summary, Frameworks & Sources"
description: "Severity matrix for the OWASP LLM Top 10, the frameworks behind this report and the full source list."
sidebar:
  label: "11. Summary & Sources"
---

## 11.1 Summary Table

| Rank | Vulnerability | OWASP ID | Severity | Primary Attack Vector |
|------|--------------|----------|----------|----------------------|
| 1 | Prompt Injection | LLM01 | Critical | Malicious user input |
| 2 | Sensitive Information Disclosure | LLM02 | Critical | Data extraction |
| 3 | Supply Chain Vulnerabilities | LLM03 | High | Compromised components |
| 4 | Data and Model Poisoning | LLM04 | High | Training data manipulation |
| 5 | Improper Output Handling | LLM05 | High | Unvalidated outputs |
| 6 | Excessive Agency | LLM06 | High | Over-permissioned agents |
| 7 | System Prompt Leakage | LLM07 | Medium-High | Prompt extraction |
| 8 | Vector and Embedding Weaknesses | LLM08 | Medium-High | RAG/vector DB attacks |
| 9 | Misinformation and Hallucination | LLM09 | Medium | Inherent model behavior |
| 10 | Unbounded Consumption | LLM10 | Medium | Resource exhaustion |

## 11.2 Key Frameworks and References

- **OWASP Top 10 for LLM Applications (2025/2026)** — The definitive industry framework for AI security
  risks
- **OWASP Top 10 for Agentic Applications (2025)** — Covers emerging agentic AI threats
- **NIST AI Risk Management Framework (AI RMF)** — Government standard for AI risk management
- **MITRE ATLAS (Adversarial Threat Landscape for AI Systems)** — Knowledge base of real-world AI
  attacks
- **Google SAIF (Secure AI Framework)** — Google's approach to AI security
- **IBM Cost of a Data Breach Report 2025** — Statistical data on AI-related breaches
- **Trend Micro TrendAI State of AI Security Report (2H 2025)** — CWE trends across the AI stack

## 11.3 Sources

1. OWASP GenAI Security Project — [LLM Top 10 2025](https://genai.owasp.org/llm-top-10/)
2. OWASP GenAI Security Project — [LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
3. Mindgard — [Top 10 AI Security Risks of 2026](https://mindgard.ai/blog/top-ai-security-risks)
4. SentinelOne — [Top 14 AI Security Risks in 2026](https://www.sentinelone.com/cybersecurity-101/data-and-ai/ai-security-risks/)
5. Cloudflare — [OWASP Top 10 Risks for LLMs](https://www.cloudflare.com/learning/ai/owasp-top-10-risks-for-llms/)
6. Trend Micro — [Fault Lines in the AI Ecosystem: State of AI Security Report](https://www.trendmicro.com/vinfo/us/security/news/threat-landscape/fault-lines-in-the-ai-ecosystem-trendai-state-of-ai-security-report)
7. Bugcrowd — [OWASP Top 10: Security Threats Facing AI Systems](https://www.bugcrowd.com/blog/owasp-top-10-security-threats-facing-ai-systems/)
8. CSO Online — [10 Most Critical LLM Vulnerabilities](https://www.csoonline.com/article/575497/owasp-lists-10-most-critical-large-language-model-vulnerabilities.html)
9. ZDNet — [4 Critical AI Vulnerabilities Being Exploited](https://www.zdnet.com/article/ai-security-threats-2026-overview/)
10. Cycode — [Top AI Security Vulnerabilities 2026](https://cycode.com/blog/ai-security-vulnerabilities/)
11. HackTricks — [AI Risk Frameworks](https://github.com/hacktricks-wiki/hacktricks/blob/master/src/AI/AI-Risk-Frameworks.md)
12. BrightDefense — [OWASP Top 10 LLM & Gen AI Vulnerabilities in 2026](https://www.brightdefense.com/resources/owasp-top-10-llm/)
13. Cohere — [The State of AI Security](https://cohere.com/blog/the-state-of-ai-security)
14. Cyberleveling — [Top 10 Vulnerabilities in AI Systems on the Web](https://cyberleveling.com/blog/top-10-vulnerabilities-ai-systems-web)
15. Alex Ewerlof — [OWASP Top 10 Agents & AI Vulnerabilities Cheat Sheet](https://blog.alexewerlof.com/p/owasp-top-10-ai-llm-agents)

---

*Report generated on September 27, 2026. This report is intended for educational and defensive security purposes only.*
