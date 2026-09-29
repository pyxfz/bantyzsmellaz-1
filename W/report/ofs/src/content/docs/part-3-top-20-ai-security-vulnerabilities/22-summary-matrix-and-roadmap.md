---
title: "22. Summary Matrix and the 30-60-90 Day Roadmap"
description: "Severity, blast radius and time-to-mitigate for all twenty risks, plus the sequenced 90-day implementation programme."
---

## 22.1 Summary matrix — severity, blast radius and time to mitigate

| # | Vulnerability | Primary ID | Severity | Blast radius | Time to first mitigation |
|---:|---|---|---|---|---|
| 1 | Prompt Injection (direct & indirect) | `LLM01:2026` | Critical | System-wide | Days (egress controls); weeks (architecture) |
| 2 | Agent Goal Hijack & Tool Misuse | `ASI01`, `ASI02` | Critical | Per-agent workflow | Weeks |
| 3 | Memory & Context Poisoning | `ASI06` | High | Persistent, cross-session | Weeks |
| 4 | Identity & Privilege Abuse (NHI) | `ASI03` | Critical | Enterprise-wide | Months (identity programme) |
| 5 | Excessive Agency & Unbounded Autonomy | `LLM03:2026` | Critical | Organisational | Weeks (autonomy ladder) |
| 6 | Unexpected Code Execution by Agents | `ASI05` | Critical | Host-level | Days (sandboxing) |
| 7 | Human-Agent Trust Exploitation | `ASI09` | High | Decision integrity | Months (process change) |
| 8 | AI Supply Chain Vulnerabilities | `LLM04:2026` | High | Model integrity | Weeks |
| 9 | Agentic Supply Chain & MCP Tool Poisoning | `ASI04` | Critical | Agent fleet | Days (manifest pinning) |
| 10 | Data & Model Poisoning, Backdoors | `LLM05:2026` | Critical | Model integrity, persistent | Months |
| 11 | Training-Data Extraction & MIA | `LLM02:2026` | High | Privacy, regulatory | Months |
| 12 | RAG, Vector Store & Embedding Weaknesses | `LLM09:2026` | Critical | Cross-tenant data | Days (patch Chroma); weeks (ACLs) |
| 13 | Disclosure via Prompts, Logs & Traces | `LLM02:2026` | Critical | Compliance, breach notification | Days (stop persisting bodies) |
| 14 | Improper Output Handling | `LLM10:2026` | High | Application layer | Days (CI gates) |
| 15 | System Prompt Leakage & Hidden Context | `LLM08:2026` | Medium-High | Credential pivot | Days (remove secrets from prompts) |
| 16 | Misinformation, Hallucination, Confabulation | `LLM07:2026` | High | Decision integrity, legal | Weeks |
| 17 | Unbounded Consumption | `LLM06:2026` | High | Financial | **Hours** (budget caps) |
| 18 | Model Theft & Extraction | `LLM04:2026` | High | IP, competitive | Weeks |
| 19 | AI Social Engineering & Deepfake Fraud | ATLAS `AML.T0073` | Critical | Direct financial loss | **Days** (callback policy) |
| 20 | Shadow AI & Governance Gaps | NIST GOVERN | High | Encompasses all others | Months |

## 22.2 If only five things get done this quarter

Per-tenant spend caps (#17), mandatory out-of-band callback for payments (#19), MCP manifest pinning
(#9), retrieval-time ACL enforcement plus the Chroma upgrade (#12), and stop persisting prompt bodies
(#13). **Three of the five are a single day of work.**

## 22.3 Days 0–30 — Inventory and Logging

- Complete an **AI-BOM**: models, providers, SDKs, agents, MCP servers, vector stores, credentials —
  **including shadow AI** discovered via CASB/SSE and IdP audit logs.
- Patch or isolate **`CVE-2026-45829`** (Chroma) and check for `CVE-2025-6514` (`mcp-remote`).
- Deploy the [AI log schema](/part-3-top-20-ai-security-vulnerabilities/23-log-schema-detection-and-response/)
  on the **top 10 systems by risk**.
- Establish SIEM ingest with 30-day retention; baseline behavioural models per agent.
- **Set per-tenant token buckets and hard spend caps.** *(Hours of work, immediate effect.)*
- Publish the **out-of-band callback policy** and stop it being an exception.
- Pin all MCP tool manifests against a signed baseline.

**Owners:** AI Platform Lead, SOC Engineering, Treasury/Finance.
**Exit criteria:** inventory complete enough to answer "what AI touches our data?"; every production model
has a named owner; no system without a spend cap.

## 22.4 Days 31–60 — Guardrails and Detection

- Deploy a **runtime gateway** in front of production LLM traffic: virtual keys, budgets, PII and secret
  redaction, input and output guardrails.
- Bring the **12 SIEM use cases** to life, ATLAS-mapped.
- Sign off the **D3FEND countermeasure mapping**, recording explicitly where no defence exists.
- Publish the on-call **runbook and severity matrix**; wire agent kill switches.
- Enforce the **autonomy ladder**; move every agent to L1 by default and record exceptions.
- Deploy **per-agent identity** for the top 20 agents, with attribution completeness above 99.9%.
- Roll out **retrieval-time ACL enforcement** on all shared vector stores.

**Owners:** CISO delegate, Detection Engineering, IAM.
**Exit criteria:** every critical use case has a tested detection; no agent runs above L1 without a signed
exception.

## 22.5 Days 61–90 — Purple Team and Response

- Two full **purple-team exercises** against a production-representative agent: indirect injection via a
  planted document, tool-argument tampering, memory poisoning, privilege escalation.
- Rehearse all **four incident response playbooks** — tabletop for three, live for one.
- Map the AI risk register to **EU AI Act Annex III, Art. 12 and Art. 14**, and to **Colorado SB 26-189**
  ahead of 1 January 2027.
- Obtain **signed residual-risk acceptance** from business owners for every agent above L1.
- Stand up the **weekly automated red-team regression in CI**, gating every prompt, model, tool-permission
  and guardrail change.

**Owners:** Head of Application Security, AI Governance Board.
**Exit criteria:** residual risks accepted in writing; mean time to add a detection is measured and
trending down.
