---
title: "23. Log Schema, Detection Engineering and Response Playbooks"
description: "The OpenTelemetry-compatible AI security log schema, 12 ATLAS-mapped SIEM use cases and four incident-response playbooks."
---

## 23.1 Mandatory AI security log schema

OpenTelemetry-compatible. Ship to the SIEM. Fourteen fields; treat the first ten as non-negotiable.

| Field | Why | Example |
|---|---|---|
| `ts`, `trace_id` | Correlate with application and identity logs; EU AI Act Art. 12 | `2026-09-29T09:14:22Z`, `a3f9…` |
| `session_id`, `turn_index` | Reconstruct multi-turn attacks | `s-8842`, `7` |
| `principal_type`, `principal_id` | Human vs agent vs service; ASI03 | `agent`, `svc-finance-bot` |
| `agent_id`, `agent_version`, `delegation_chain` | Who authorised this action, and through whom | `["u.1234","agent.fin-bot"]` |
| `model_id`, `model_version`, `provider` | Injection replay and drift attribution | `gpt-x`, `2026-05`, `openai` |
| `prompt_hash`, `response_hash` | PII-safe replay and dedup **without storing content** | `sha256:9c1a…` |
| `retrieved_doc_ids[]`, `doc_provenance` | RAG poisoning and exfiltration via retrieval | `["kb-2291"]`, `sharepoint://Finance` |
| `tool_name`, `tool_args_hash`, `tool_result_hash`, `tool_decision` | Tool misuse; allow/deny/rewritten | `wire_transfer`, `deny` |
| `input_tokens`, `output_tokens`, `cost` | Cost harvesting | `8412 / 190 / $0.21` |
| `guardrail_evaluations[]` | Proves a control fired | `prompt_injection:block(0.93)` |
| `approval_id`, `approver_id`, `approval_decision`, `approval_latency_ms` | Rubber-stamp detection; Art. 14 | `ap-551`, `u.1234`, `approve`, `1400` |
| `safety_event`, `risk_score`, `atlas_technique_id` | Ties telemetry to the detection library | `prompt_injection`, `0.88`, `AML.T0051.001` |
| `data_classification`, `pii_fields_detected` | DLP evidence | `internal`, `["email"]` |
| `user_agent`, `client_ip`, `network` | Shadow AI and drive-by compromise | `10.4.2.9` |

**Design rule:** log hashes, not bodies. The schema above is deliberately built so that
[§13](/part-3-top-20-ai-security-vulnerabilities/13-sensitive-information-disclosure/)'s principal
failure — persisting prompt and response bodies in a lower-trust telemetry store — becomes impossible by
construction rather than by policy.

## 23.2 Detection engineering — 12 SIEM use cases

| # | ATLAS ID | Use case | Alert condition |
|---:|---|---|---|
| 1 | `AML.T0051.001` | Indirect prompt injection via retrieved document | Guardrail verdict `block` **and** `retrieved_doc_ids` non-empty → page with document provenance |
| 2 | `AML.T0071` | RAG entry injection | New or updated document containing instruction-like patterns enters the vector store; ingest/write-source delta |
| 3 | `AML.T0056` | System prompt extraction | Three or more distinct probe patterns from one principal in ten minutes |
| 4 | `AML.T0082` | Credential harvesting via RAG | Secret regex hit in `response` **or** in `tool_args` → **P1** |
| 5 | `AML.T0086` | Exfiltration via agent tool invocation | Network- or write-capable tool invoked with arguments whose entropy or length exceeds the agent's 30-day baseline by more than 3σ |
| 6 | `AML.T0053` | Anomalous tool chaining | Four or more distinct tools in 60 seconds outside the agent's learned call graph |
| 7 | `AML.T0080.000` | Memory or thread poisoning | Memory write from a source outside the user's own prior sessions; **any memory write following a `block` verdict** |
| 8 | `AML.T0034` | Cost harvesting | `output_tokens` above 4σ for the principal, or spend above $X/day per agent |
| 9 | `AML.T0092` | Chat-history tampering | Session transcript hash mismatch against the signed store; deletion events |
| 10 | ASI09 | Rubber-stamping | Approval rate above 95%, or median approval latency under 2 seconds, over 24 hours |
| 11 | `AML.T0073` / `AML.T0052` | AI social engineering versus AI agents | **Cross-signal:** DMARC-fail mail from an executive persona → gateway observes agent-generated reply → treasury transfer initiated. **This composite rule is the highest-value detection in the list.** |
| 12 | `AML.T0034.002` | Amplification / cost DoS | Input:output token ratio below 1:50, or tokens/minute above 3× the 7-day rolling mean sustained five minutes |

**Honest caveat:** D3FEND currently provides **no AI-native defensive techniques**. Map to general D3FEND
Detect tactics where a bridge exists — User Behavior Analysis, Application Protocol Command Analysis,
Identifier Activity Analysis, Homoglyph Detection, DNSTrafficAnalysis, Network Traffic Signature Analysis,
File Integrity Monitoring, Application Exception Monitoring — and build the remainder bespoke, recording
the gap in the risk register rather than leaving it undocumented.

**Purple and red-teaming cadence:** weekly automated (promptfoo, Garak, PyRIT) regression in CI gating
every prompt, model, tool-permission and guardrail change; monthly human purple team against one
production agent; quarterly full-scope red team plus one live IR drill. Re-run after any model version
change, new tool or MCP server, or new data source. **Measure mean time to add a detection, not test
count.**

## 23.3 Incident response playbooks

### 23.3.1 Playbook 1 — Prompt-injection incident

- **Trigger:** guardrail `block` in production with a confirmed tool side-effect.
- **Containment:** kill the session; freeze the agent's token; snapshot gateway logs and trace IDs.
- **Eradication:** purge injected content from the vector store and memory; re-index from a clean source;
  **rotate every credential the agent touched.**
- **Follow-up:** re-test the retrieval pipeline; add the payload as a permanent regression test; review
  retrieval ACLs.

### 23.3.2 Playbook 2 — Model or data poisoning

- **Trigger:** anomalous model artefact, eval-score drop beyond threshold, or an unsigned artefact.
- **Containment:** halt auto-promotion; pin serving to the last-known-good artefact.
- **Eradication:** revert the artefact, rebuild from trusted lineage, verify hashes and signatures, re-run
  the eval suite.
- **Follow-up:** supply-chain attestation policy; **notify affected decision-holders if outputs already
  shipped to customers or patients.**

### 23.3.3 Playbook 3 — Leaked credential via prompt

- **Trigger:** secret hit in a response or in tool arguments.
- **Containment:** **revoke the credential immediately** — short TTL design makes this a seconds-scale
  action; block the agent identity.
- **Eradication:** rotate the secret; audit every session where it appeared; scope downstream access.
- **Follow-up:** move to a vault with short-lived tokens; add DLP at the gateway; add the source document
  to the retrieval exclusion list.

### 23.3.4 Playbook 4 — Rogue agent

- **Trigger:** behaviour outside the declared goal — loop, self-modification, out-of-scope tool use, drift
  in the delegation chain.
- **Containment:** disable the agent in the control plane (Agent 365 or gateway kill switch); revoke all
  delegated tokens.
- **Eradication:** preserve the full trace, memory and tool-call log; rebuild the agent from its signed
  prompt and configuration version; **audit every action taken under the compromised identity.**
- **Follow-up:** blast-radius assessment; least-agency review; alert the governance board; consider
  disclosure.
