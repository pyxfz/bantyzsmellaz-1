---
title: "2. Agent Goal Hijack and Tool Misuse"
description: "OWASP ASI01/ASI02 — rewriting an agent's objective, and legitimate tools wielded in an attacker-chosen sequence."
---

**Framework IDs:** `ASI01` (Agent Goal Hijack) · `ASI02` (Tool Misuse & Exploitation) · `ASI10` · `LLM01` · `LLM10:2026`

## 2.1 Definition

The attacker rewrites the agent's objective — memory, plan, goal stack or system prompt — so it pursues
attacker intent. Or a correctly-behaving agent wields a legitimate tool unsafely: wrong arguments,
wrong order, wrong scale, to exfiltrate data or seize a workflow.

## 2.2 Mechanism

The agent cannot distinguish operator instructions from data it ingested. An indirect payload in a web
page, email, ticket, document or MCP tool docstring is folded into context and the planner treats it as
a goal. Once the goal is altered, the agent calls *authorized* tools in an attacker-chosen sequence —
the credentials are valid, the API calls succeed, and the audit log shows normal business traffic.
Multi-tool chains (upload → path traversal → dynamic load) convert a text payload into execution.
Delayed triggers defeat per-turn tool restrictions by firing on the *next* turn.

## 2.3 Evidence

- **MITRE ATLAS case studies:** `AML.CS0037` (Zenity — data exfiltration via agent tools in Microsoft
  Copilot Studio), `AML.CS0038` (Embrace the Red — planting instructions for *delayed* automatic tool
  invocation, bypassing Gemini tool policy across conversation turns), `AML.CS0039` (Cato Networks —
  "Living off AI," prompt injection via a Jira Service Management ticket escalating to a privileged
  action).
- **EchoLeak** — `CVE-2025-32711`, Microsoft 365 Copilot, CVSS 9.3, disclosed June 2025. First
  zero-click indirect prompt injection in a production system.
- **OWASP GenAI Exploit Round-up Report Q1 2026** (2026-04-14) records Excessive Agency incidents in the
  form: *"the agent took high-impact action without appropriate approval."*

## 2.4 Mitigations (preventive)

1. **Enforce plan/goal immutability.** Goal and system-prompt objects are write-once per run; only a
   signed, out-of-band control plane may mutate them.
2. **Deterministic policy engine between planner and executor** (OPA/Rego or Cedar). The model must
   never hold the credential that authorizes the call.
3. **Typed, allowlisted tool schemas** with server-side validation of every argument. Never pass
   model-produced strings to shell, SQL, path or template sinks.
4. **Capability-scoped tokens per tool** — separate read and write keys, never an admin key — issued via
   RFC 8693 Token Exchange with audience and scope narrowing.
5. **Destination allowlist** for every network-capable tool. Block arbitrary egress and image-based code
   loading by default.
6. **Run agents out-of-process with content provenance tags**, so retrieved content is structurally
   separated from instructions. This is privilege separation, not prompt wording.
7. **Human-in-the-loop gate** on any state transition outside the task's declared intent envelope.

## 2.5 Continuous monitoring

- Log every `(task_id → goal version hash → tool → args → authz decision → outcome)` tuple. **Alert on
  any goal-hash change mid-run.**
- **Tool-call sequence anomaly detection** against a learned per-agent profile; alert specifically on
  read → send adjacency.
- **Sentinel injection:** plant fake "ignore prior instructions" and fake policy strings in test corpora;
  alert on any downstream tool argument containing them.
- Track **injected-content volume versus accepted-as-instruction volume**; alert when a single retrieved
  document contributes more than N goal-affecting fields.
- Alert on tool calls to destinations outside the registered allowlist, using egress DNS anomaly
  detection scoped to the agent's namespace.
- Daily **canary agent** run against known injection corpora; fail CI if the goal-drift rate rises.

## 2.6 Frameworks mapping

ASI01, ASI02, ASI10; `LLM01`, `LLM10:2026`. NIST AI RMF **MAP**, **MEASURE**, **MANAGE**. ATLAS
`AML.T0051`, `AML.T0051.001`, `AML.T0051.002`, `AML.T0053`, `AML.T0011.002`.

## 2.7 Residual risk

No prompt-level control reliably separates data from instruction. The gate must be architectural,
leaving residual risk in the correctness of the declared intent envelope.
