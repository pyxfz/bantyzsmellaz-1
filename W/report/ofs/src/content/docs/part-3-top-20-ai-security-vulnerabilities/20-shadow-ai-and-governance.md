---
title: "20. Shadow AI, Governance Gaps and AI-SPM"
description: "NIST AI RMF GOVERN — the ungoverned AI estate that has no inventory, no owner and no policy, and therefore contains every other risk."
---

**Framework IDs:** NIST AI RMF **GOVERN** · `LLM04:2026` · `LLM03:2026` · CSA AICM / MAESTRO

## 20.1 Definition

Enterprises adopt AI faster than they can govern it — employees use unsanctioned chatbots and personal
accounts, developers pull open-weight models into production, and business units license AI SaaS outside
procurement — leaving no inventory, no owner and no policy to govern the other nineteen risks.

## 20.2 Mechanism

**Because there is no AI asset inventory, there is no attack surface list.** No one knows which corpus
feeds which fine-tune (enabling [§10](/part-3-top-20-ai-security-vulnerabilities/10-data-and-model-poisoning/) ),
which model was trained on whose PII (enabling [§11](/part-3-top-20-ai-security-vulnerabilities/11-training-data-extraction-and-inference/) ),
or which assistant holds an OAuth token to M365 or Salesforce. The gap is directly monetised.

## 20.3 Evidence

- **IBM, *Cost of a Data Breach 2025*** — global average **$4.44M**; shadow AI adds approximately
  **$670,000**; **1 in 5** organisations experienced a shadow-AI-related breach; **97%** of organisations
  reporting an AI-related breach lacked AI access controls. https://www.ibm.com/reports/data-breach
- **Netskope, *Cloud and Threat Report: Generative AI*** — **30× year-on-year increase** in data sent to
  GenAI applications; **98%** of organisations use them.
- **Cloud Security Alliance, May 2026**, *The Invisible Enterprise: Shadow AI and the Ungoverned Frontier*
  — Reco 2025: **91%** of enterprise AI tools operate outside IT control, averaging **269 shadow AI
  applications per 1,000 employees**. Menlo Security 2025: 68% year-on-year surge; **57%** of shadow-AI
  users entered sensitive company data.
- **Kiteworks** — **83%** of organisations have no technical control preventing data exposure to AI tools;
  only **17%** have one. **27%** report that more than 30% of their AI-processed data contains private
  information.
- **PagerDuty, June 2026** — **66%** of office professionals used AI tools they believed were not
  permitted; **88%** had shared work information with public AI tools.
- **ISACA 2026 AI Pulse Poll** — only **38%** of organisations have a formal, comprehensive AI policy, up
  from 28%.
- **CycloneDX** ML-BOM specification — the emerging standard for machine-learning bills of materials.

## 20.4 Mitigations (preventive)

1. **Build a discover-first AI inventory.** CASB/SSE discovery for cloud AI services (Netskope, Zscaler,
   Microsoft Purview), EDR plus GitHub/SonarQube scanning for open-weight model pulls, and IdP audit logs
   for OAuth grants to `chatgpt.com`, `claude.ai`, `gemini.google.com`, `api.anthropic.com` and unknown
   ASPS in Okta or Entra.
2. **Deploy an AI gateway / AI firewall as the sanctioned path** (Microsoft AI Gateway, LiteLLM, an
   OpenAI-compatible proxy) enforcing per-tool DLP, PII masking and model allow-lists — so unsanctioned
   use is **blocked, not merely discouraged**.
3. **Assign named model owners and a risk tier** per AI system in a registry. Require security sign-off —
   threat model plus ATLAS-informed abuse cases — before production.
4. **Enforce sandboxed execution and zero-trust scoping for agents:** scoped tokens, no standing
   credentials, approval gates on tool calls.
5. **Publish a permitted-AI allow-list tied to a code of AI conduct**, with DLP and CASB enforcement — and
   **make the compliant path faster than the workaround** (pre-approved free tiers, SSO-connected internal
   assistants).
6. **Standardise CycloneDX AI/ML-BOM generation in CI** covering models, datasets, embeddings and prompts,
   with SBOM-style attestation for every model promoted to production.
7. **Run a quarterly AI red-team and prompt-injection exercise** (promptfoo, PyRIT, Garak) against every
   registered AI system, with a defined remediation SLA.
8. **Map controls to CSA AICM/MAESTRO and NIST AI RMF** so shadow-AI risk is auditable rather than
   advisory. Obtain board-level sign-off on the AI risk register.

## 20.5 Continuous monitoring

- **Continuous CASB/SSE discovery** for AI application usage. Alert when the count of distinct AI apps per
  1,000 employees exceeds the approved baseline, or when any new AI app category appears.
- **Alert on any IdP-issued OAuth token to an unsanctioned AI domain**, and on any AI app receiving more
  than N records per week of DLP-classified sensitive data.
- Monitor proxy and secure web gateway telemetry for AI domains not on the allow-list; alert on first
  occurrence and on volume thresholds (e.g. more than 1MB to any unapproved AI endpoint).
- **Track the "shadow AI ratio" monthly** = (unsanctioned AI apps discovered) ÷ (sanctioned AI apps
  registered). **Alert on a rising trend or a ratio above 0.5**, reviewed in the security steering
  committee.
- **Alert on open-weight model weights entering production without an AI-BOM attestation** — a CI policy
  gate (OPA/conftest, GitHub Advanced Security) on `safetensors` and pickle additions to build manifests.
- **Periodic re-attestation:** alert when any registered AI system's owner, model version or data lineage
  is more than 90 days stale, and re-run the exploitation test.

## 20.6 Frameworks mapping

NIST AI RMF **GOVERN** — GV-1.2 (legal and regulatory requirements), GV-3.2 (policies for AI risk),
**GV-6.1** (third-party and AI inventory) are the operative controls; NIST AI 600-1 MAP-1.6 and MEASURE.
`LLM04:2026`, `LLM03:2026`. CSA **AICM / MAESTRO**. OWASP AI Security and Governance Checklist.

## 20.7 Residual risk

Inventory is a lagging indicator. A determined insider or a fast-growing business unit can operate an
ungoverned AI system for months before discovery — so **discovery must be paired with technical blocking at
the gateway**, not left as a reporting exercise.
