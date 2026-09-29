---
title: "24. Tooling Landscape and Compliance Drivers"
description: "Named tools by capability, the regulatory regimes that oblige AI logging and oversight, and the honest compliance position."
---

## 24.1 Tooling landscape

| Capability | Named tools |
|---|---|
| **LLM observability / tracing** | Langfuse (MIT), Arize Phoenix (OTel-native), MLflow (Apache 2.0), Helicone, Portkey, TruLens, Evidently, Opik (Apache 2.0); commercial: LangSmith, Confident AI, Galileo AI, Arthur AI |
| **AI gateway / runtime enforcement** | Portkey, Bifrost, NeuralTrust, Maxim; guardrail profiles: Google **Model Armor**, **CrowdStrike AIDR** |
| **Guardrails (input/output)** | **LLM Guard**, **NeMo Guardrails** (open source); **Lakera Guard** (Check Point), Guardrails AI, OpenAI Guardrails, **Protect AI Guardian** (model scanning) |
| **Red team / continuous testing** | **Promptfoo**, **NVIDIA Garak**, **Microsoft PyRIT**, **Giskard**, **DeepTeam**, **FuzzyAI** (CyberArk), Agentic Radar; commercial: **Mindgard** (DAST-AI) |
| **AI-SPM / posture / discovery** | **Wiz AI-SPM**, **Palo Alto Prisma AIRS**, **Microsoft Defender for Cloud**, **Orca Security**, **CrowdStrike Falcon Cloud Security**, **Zscaler AI-SPM**, Protect AI (Guardian/Recon/Layer), HiddenLayer, Lasso Security, Mend.io, Securiti AI, Holistic AI |
| **Agentic runtime governance** | Microsoft **Agent 365** (agent activity detection, restrict/disable), Onyx Security, Noma Security, 7AI |
| **MCP security** | `mcp-scan` (Invariant Labs), `mcp-audit`, JFrog Advanced Security, CyberArk |
| **Code security** | Veracode, Snyk Code, SonarQube, Checkmarx, Semgrep; CodeRabbit for AI-diff analysis |
| **DLP / data protection** | Microsoft Presidio, Microsoft Purview, Netskope GenAI DLP, Zscaler |
| **Discovery / CASB** | Netskope, Zscaler, Microsoft Purview |

## 24.2 Compliance drivers

| Regime | Status / date | What it obliges | Evidence an auditor wants |
|---|---|---|---|
| **EU AI Act** (Reg. (EU) 2024/1689, as amended) | In force 2024-08-01. Prohibitions and AI literacy **2025-02-02**; GPAI, governance and penalties **2025-08-02**. **High-risk obligations postponed by the Digital Omnibus: Annex III stand-alone systems → 2027-12-02; product-embedded (Annex I) → 2028-08-02.** Penalties to **€35M or 7%** of global turnover | **Art. 12** automatic logging over lifetime; **Art. 14** human oversight; Art. 9 risk management; Art. 11 technical documentation; Art. 15 accuracy, robustness, **cybersecurity**; Art. 43 conformity assessment; Art. 49 EU database registration; Art. 72 post-market monitoring; Art. 73 serious-incident reporting | The log schema; the approval register; the risk register; conformity assessment record; post-market monitoring plan and incident log |
| **NIST AI RMF 1.0** (NIST AI 100-1, Jan 2023) + **NIST AI 600-1** (26 Jul 2024) | Voluntary. Four functions, 19 categories, 72 subcategories; the GenAI Profile adds 12 risks and 200+ actions | Govern / Map / Measure / Manage outcomes, including Information Integrity, Human-AI Configuration and Value Chain | Mapped control-to-outcome evidence; MEASURE metrics with trend data. **There is no NIST certification** — any vendor claiming one is selling a private credential |
| **ISO/IEC 42001:2023** | Published 2023-12-18; first certifiable AI management system standard. **ISO/IEC 42006:2025** governs certification bodies; BS EN ISO/IEC 42001:2026 in the UK | Clauses 4–10 plus Annex A (A.2–A.10) controls; clause 6.1.4 AI system impact assessment | Statement of Applicability, AIMS scope, risk and impact assessments, internal audit and management review records, monitoring evidence |
| **ISO/IEC 27001:2022** | Current; 93 Annex A controls | No AI named. Apply **A.8.12 DLP**, **A.8.16 Monitoring activities**, **A.5.7 Threat intelligence**, **A.8.7 Malware** explicitly to AI systems | AI risks in the ISMS risk register; monitoring evidence mapped to A.8.16 |
| **Colorado SB 26-189 (ADMT)** | Signed 2026-05-14; obligations from **2027-01-01**. Replaced SB 24-205 | Documentation and disclosure duties. **The NIST/ISO safe harbour was explicitly *not* carried over** | Disclosures and documentation. **Do not claim a codified safe defence** |
| **FBI IC3 reporting** | Ongoing | AI-enabled fraud is now a tracked category — 22,364 complaints, $893M in 2025 | Incident response and reporting maturity; BEC-specific controls |

## 24.3 The honest compliance position

The EU high-risk deadline moved, which buys time — but the obligations that attach to it (Art. 12
logging, Art. 14 human oversight) are exactly the ones that require the
[90-day work](/part-3-top-20-ai-security-vulnerabilities/22-summary-matrix-and-roadmap/) to be done *now*.
Colorado's refusal to carry over the NIST/ISO safe harbour means alignment with those frameworks is
recommended practice, not legal protection.
