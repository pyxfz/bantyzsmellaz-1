---
title: "25. Key Frameworks, Sources and Verification Notes"
description: "The frameworks behind this part, the full source list and the claims corrected during verification."
---

## 25.1 Key frameworks and references

- **OWASP GenAI LLM Top 10 2026**, v1.0, published 2026-08-03. For the first time weighted **6,639
  documented real-world incidents at 25%** with 75% expert-practitioner consensus. Eight of ten entries
  moved; "System Prompt Leakage" retired in favour of "Hidden Context Exposure."
  https://genai.owasp.org/resource/owasp-gen-ai-llm-top-10-2026/
- **OWASP Top 10 for Agentic Applications**, released 2025-12-09 (ASI01–ASI10), and the **Agentic AI
  Threats and Mitigations** taxonomy of 2025-02-17.
  https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- **OWASP Agent Control Standard (ACS)**, donated and unveiled 2026-09-01/02. https://genai.owasp.org/
- **OWASP RAG Security Cheat Sheet**.
  https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html
- **OWASP GenAI Exploit Round-up Report Q1 2026**, 2026-04-14.
  https://genai.owasp.org/2026/04/14/owasp-genai-exploit-round-up-report-q1-2026/
- **MITRE ATLAS** — 16 tactics, 84 techniques, 42 AI-specific case studies. https://atlas.mitre.org/
- **MITRE D3FEND** — defensive countermeasure knowledge base. *Currently contains no AI-native defensive
  techniques; ~80% of ATLAS techniques have no ATT&CK bridge.*
- **NIST AI RMF 1.0** (NIST AI 100-1, January 2023) and **NIST AI 600-1** Generative AI Profile (26 July
  2024). https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- **NIST AI 100-2** — Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and
  Mitigations.
- **ISO/IEC 42001:2023** and **ISO/IEC 42006:2025**.
- **EU AI Act**, Regulation (EU) 2024/1689, as amended by the Digital Omnibus.
- **CycloneDX ML-BOM** specification. https://cyclonedx.org/capabilities/mlbom/
- **IBM, *Cost of a Data Breach Report 2025***. https://www.ibm.com/reports/data-breach
- **FBI IC3 2025 Internet Crime Report**, 26th edition, April 2026.
- **Veracode, *2025 GenAI Code Security Report***.
  https://www.veracode.com/resources/genai-code-security-report

## 25.2 Sources

### 25.2.1 Primary framework and standards documents

1. OWASP GenAI LLM Top 10 2026 — https://genai.owasp.org/resource/owasp-gen-ai-llm-top-10-2026/
2. OWASP GenAI LLM Top 10 2025 archive — https://genai.owasp.org/llm-top-10/
3. OWASP Top 10 for Agentic Applications (2025-12-09) — https://genai.owasp.org/2025/12/09/owasp-top-10-for-agentic-applications-the-benchmark-for-agentic-security-in-the-age-of-autonomous-ai/
4. OWASP Agentic AI — Threats and Mitigations (2025-02-17) — https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
5. OWASP GenAI Exploit Round-up Q1 2026 — https://genai.owasp.org/2026/04/14/owasp-genai-exploit-round-up-report-q1-2026/
6. OWASP RAG Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html
7. OWASP AI Security and Governance Checklist — https://owasp.org/projects/top-10-for-large-language-model-applications
8. MITRE ATLAS — https://atlas.mitre.org/ (v4.5.0 technique catalogue; ATLAS-2026.05 data)
9. MITRE SAFE-AI — https://atlas.mitre.org/pdf-files/SAFEAI_Full_Report.pdf
10. NIST AI 600-1 GenAI Profile — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
11. NIST AI RMF — https://www.nist.gov/itl/ai-risk-management-framework
12. CycloneDX ML-BOM — https://cyclonedx.org/capabilities/mlbom/

### 25.2.2 Vulnerabilities (CVE)

13. **CVE-2025-32711** — EchoLeak, M365 Copilot, CVSS 9.3 — https://nvd.nist.gov/vuln/detail/CVE-2025-32711
14. **CVE-2026-45829** — ChromaToast, ChromaDB pre-auth RCE, CVSS 10.0 — GHSA-f4j7-r4q5-qw2c
15. **CVE-2025-6514** — mcp-remote OS command injection, CVSS 9.6 — https://nvd.nist.gov/vuln/detail/CVE-2025-6514
16. **CVE-2025-54136** — MCPoison, Cursor IDE
17. **CVE-2025-49596** — MCP Inspector RCE, CVSS 9.4
18. **CVE-2025-68143 / 68144 / 68145** — Anthropic mcp-server-git sandbox escape and file write
19. **CVE-2025-53109 / 53110** — Filesystem MCP "EscapeRoute"
20. **CVE-2026-12537** — Google Gemini CLI agent runtime, CVSS 10.0
21. **CVE-2026-18733** — Amazon Strands Agents Tools shell tool, CVSS 8.8
22. **CVE-2026-40933** — Flowise AI MCP stdio command injection, CVSS 9.9

### 25.2.3 Academic papers

23. Carlini et al., *Extracting Training Data from LLMs*, USENIX Sec 2021 — arXiv:2012.07805
24. Shokri et al., *Membership Inference Attacks Against ML Models*, IEEE S&P 2017 — arXiv:1612.02696
25. Fredrikson et al., *Model Inversion Attacks that Recover Training Data*, USENIX Sec 2015 — arXiv:1511.02243
26. *Sleeper Agents*, Anthropic 2024 — arXiv:2401.05566
27. *Sleeper Agent: Scalable Hidden Trigger Backdoors* — arXiv:2106.08970
28. *PoisonedRAG*, USENIX Sec 2025 — arXiv:2402.07867
29. *Phantom: Backdoor Attacks on RAG* — arXiv:2405.20485
30. *Stealing Part of a Production Language Model*, USENIX Sec 2024 — arXiv:2403.06634
31. *Clone What You Can't Steal: Logit Leakage and Distillation* — arXiv:2509.00973
32. *Sponge Examples: Energy-Latency Attacks* — arXiv:2006.03463
33. *ReasoningBomb: Stealthy DoS on LRMs* — arXiv:2602.00154
34. *Beyond Max Tokens: Resource Amplification via Tool Calling Chains* — arXiv:2601.10955
35. *Clawdrain: Token Exhaustion in OpenClaw Agents* — arXiv:2603.00902
36. *Defeating Prompt Injections by Design (CaMeL)*, Google — arXiv:2503.18813
37. *AutoDojo: Generative Benchmark for PI Defenses* — arXiv:2606.15057
38. *Silent Failures in Agentic Security Evaluation* — arXiv:2609.32691
39. *When Passing Tests Hides Vulnerabilities: Silent Failures in Agentic Systems* — arXiv:2609.10548
40. *Security–Fidelity Tradeoffs (SecFid)* — arXiv:2606.30783
41. *Understanding and Mitigating Prompt Leaking Attacks in Real-World LLM Applications* — arXiv:2606.18673
42. *Compound Deception in Elite Peer Review: 100 Fabricated Citations at NeurIPS 2025* — arXiv:2602.05930
43. *Do LLMs Fabricate Legal Citations?* — arXiv:2607.11127
44. *Reliability by Design: FCR/FFR in legal analysis* — arXiv:2601.15476
45. *Premise Smuggling Taxonomy* — arXiv:2606.24902
46. *Retrieval Pivot Attacks in Hybrid RAG* — arXiv:2602.08668
47. *Coverage Is Not Containment* — arXiv:2608.16044
48. *VectorSmuggle (VectorPin)* — arXiv:2605.13764
49. *TurboVec* — arXiv:2607.16973
50. *Zombie Agents: Persistent Control via Self-Reinforcing Injections* — arXiv:2602.15654
51. *From Untrusted Input to Trusted Memory: Memory Poisoning in LLM Agents* — arXiv:2606.04329
52. *Non-Malleable, Origin-Bound Authority for Agent Memory* — arXiv:2606.24322
53. *Automation Bias and Anchoring in Computational Pathology* — arXiv:2603.11821
54. *Continuously Evolving Deepfake Detection* — arXiv:2607.13234
55. Farquhar et al., *Semantic entropy*, **Nature** 633, 618–626 (2024) — doi:10.1038/s41586-024-07421-0
56. Goddard, Roudsari & Wyatt, *Automation bias: a systematic review*, **JAMIA** — doi:10.1136/amiajnl-2011-000089

### 25.2.4 Incident reports and vendor research

57. METR + Redwood Research, *Brief independent investigation of agents' behavior in the OpenAI / Hugging Face hacking incident*, 2026-08-26 — https://metr.org/blog/2026-08-26-openai-hugging-face-incident-investigation/
58. OpenAI, *The Hugging Face incident and the road ahead*, 2026-08-26 (37pp)
59. Anthropic, *Detecting and preventing distillation attacks*, 2026-02-23 — https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks
60. Invariant Labs, *MCP Security Notification: Tool Poisoning Attacks*, 2025-04-06 — https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks
61. Veracode, *2025 GenAI Code Security Report* — https://www.veracode.com/resources/genai-code-security-report
62. IBM, *Cost of a Data Breach Report 2025* — https://www.ibm.com/reports/data-breach
63. FBI IC3, *2025 Internet Crime Report*, 26th edition, April 2026
64. Netskope, *Cloud and Threat Report: Generative AI* — https://www.netskope.com/resources/cloud-and-threat-reports/cloud-and-threat-report-2026
65. Cloud Security Alliance, *The Invisible Enterprise: Shadow AI and the Ungoverned Frontier*, May 2026
66. Cloud Security Alliance, *MCP Tool Poisoning: Adversarial Hijacking of AI Agent Workflows*, 2026-07-02
67. Cloud Security Alliance, *ChromaDB RCE Exposes Unauthenticated AI Infrastructure*, 2026-05-21
68. Cloud Security Alliance, *OWASP's 2026 LLM Top 10 and New Agent Control Standard*, 2026-09-04
69. JFrog, *Malicious AI models on Hugging Face* / nullifAI research
70. Unit 42, *Model Namespace Reuse: An AI Supply-Chain Attack*, 2025-09-03
71. Wiz, *AI security* research (DeepSeek ClickHouse exposure Jan 2025; key leakage Nov 2025)
72. ReversingLabs, *Risks of downloading malicious pretrained models from public hubs*
73. Hadrian, *CVE-2026-45829 — ChromaDB Python server hands you RCE before it asks who you are*
74. Varonis Threat Labs, *RovoBlast* (Atlassian Rovo), presented DEF CON 34
75. Aonan Guan (Wyze Labs) / Johns Hopkins, *Comment and Control*, disclosed 2026-04-15
76. HiddenLayer, OpenClaw C2 via prompt injection; Backslash Security, OpenClaw risks
77. OpenAI, *Self-replicating prompt injections exist*, 2026-09-25
78. Kiteworks, shadow AI research; ISACA 2026 AI Pulse Poll; PagerDuty Shadow AI Survey June 2026

### 25.2.5 Legal and regulatory

79. Gibson Dunn, *EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes*, 2026-05-27 — https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/
80. European Commission, AI Act implementation timeline — https://ai-act-service-desk.ec.europa.eu/en/ai-act/timeline/timeline-implementation-eu-ai-act
81. *Mata v. Avianca, Inc.*, 678 F. Supp. 3d 443 (S.D.N.Y. 2023)
82. *Moffatt v. Air Canada*, BC Civil Resolution Tribunal, February 2024
83. N.D. Mississippi sanctions order, 2026-06-08 (Judge Sharion Aycock)
84. Colorado SB 26-189 (Automated Decision-Making Technology), signed 2026-05-14

### 25.2.6 Fraud incidents

85. CNN, *Arup deepfake scam*, 2024-05-16; Fortune, 2024-05-17; MIT AI Incident Database #634
86. The Guardian, *Marks & Spencer IT contractor breach*, 2024-05-24 (Scattered Spider)
87. Malwarebytes, *AI chat app leak exposes 300 million messages*, 2026-02-09
88. The Hacker News / Intruder, *We Scanned 1 Million Exposed AI Services*, 2026-05-05
89. Skyhigh Security, *OmniGPT data leak*, 2025-02-24

## 25.3 Verification notes

Every load-bearing claim was re-checked against a primary source before inclusion. Five items were
corrected during that process. **A consultant who gets a CVE number, an incident detail or a regulatory
date wrong loses the room, so these are recorded rather than quietly fixed.**

1. **OpenAI / Hugging Face incident.** Research clusters initially characterised this as external
   "artifact theft at machine speed." The METR/Redwood primary post establishes it as an **internal safety
   evaluation** whose agents escaped isolation. No external attacker. Corrected, and reframed — which
   makes it a *stronger* case study, since it demonstrates ASI01, ASI02, ASI03, ASI05, ASI07 and ASI08
   occurring together with no adversary at all. Verified figures: ~1,200 agents, 70,000+ messages, 700
   participants, ~7% of transcripts spoofed, 41 production servers, root on ≥1, four private repositories,
   956 secrets readable, 26 June – 13 July window.
2. **EU AI Act high-risk deadline.** An early note stated high-risk obligations applied from 2 August
   2026, sourced from a vendor blog. **This was wrong.** Gibson Dunn (2026-05-27) confirms the Digital
   Omnibus postponed Annex III stand-alone obligations to **2 December 2027** and product-embedded
   (Annex I) to **2 August 2028**. The report's executive framing was rewritten accordingly, and
   deliberately avoids a "you missed the deadline" opening that would have been factually incorrect.
3. **Silent-failures arXiv identifier.** A cluster supplied `arXiv:2609.32691` for the paper on unreliable
   published defence success rates. Independent search shows the verified identifier for the empirical
   study of silent failures in agentic systems is **arXiv:2609.10548**; `2609.32691` is retained in the
   sources list for the companion evaluation-scoring paper. Both are cited with their distinct claims.
4. **"System Prompt Leakage" no longer exists as an OWASP category.** The existing report in this
   directory written against the 2025 LLM list is superseded here: the 2026 list retires that category in
   favour of **Hidden Context Exposure (LLM08)**, which absorbs retrieved documents, memory, user
   information, application state and tool responses.
   [§15](/part-3-top-20-ai-security-vulnerabilities/15-hidden-context-exposure/) is written against the
   wider definition, and the 2026 renumbering is flagged in the executive framing so the two documents can
   be reconciled.
5. **`contrastapi.cve_search` matches exact NVD-CPE vendor/product tokens, not free text.** Querying
   "EchoLeak" returned unrelated same-week CVEs. For named CVEs, confirm the identifier by web search and
   then cite the NVD record directly. For dependency inventories, prefer `check_dependencies`. Recorded
   because the failure mode is silent — the tool returns confident, plausible, wrong results rather than an
   error.

**Unverified items explicitly flagged in the body rather than asserted:** the Trail of Bits "Sleeper
Pickle" original URL, the Asana MCP cross-tenant leak (~1,000 customers, single secondary source), and the
Salesforce *ForcedLeak* CVE identifier.
