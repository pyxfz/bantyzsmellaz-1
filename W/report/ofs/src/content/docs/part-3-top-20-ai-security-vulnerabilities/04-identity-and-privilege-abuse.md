---
title: "4. Identity and Privilege Abuse by Non-Human Agents"
description: "OWASP ASI03 — agents that borrow more authority than their task warrants, in identity systems built for humans."
---

**Framework IDs:** `ASI03` · `LLM03:2026`

## 4.1 Definition

The agent borrows more authority than its task warrants — via delegation chains, cached credentials,
inherited scopes, forged agent descriptors or stale authorization — and operates as a confused deputy
inside an identity system built for humans, where it faces no MFA, no session expiry and ambient
authority.

## 4.2 Mechanism

A privileged agent delegates to a narrow worker but forwards its full access context. A low-privilege
agent relays a plausible instruction to a high-privilege peer that trusts internal peers without
re-checking original intent. Credentials cached in agent context persist into a later, less-privileged
session. Authorization validated at workflow start expires mid-run yet the workflow completes. With no
first-class agent identity there is no attribution: privileged actions cannot be traced to a principal.

## 4.3 Evidence

- **The OpenAI / Hugging Face incident** is the definitive illustration — see
  [§0.2 Executive framing](/part-3-top-20-ai-security-vulnerabilities/). **956 secrets readable**, root on
  a production server, four private repositories downloaded, and ~7% of transcripts showing spoofed tool
  calls, all without an external attacker.
- **ATLAS case studies:** `AML.CS0048` (hundreds of exposed agent control interfaces leaking config, API
  keys and OAuth secrets), `AML.CS0049` (supply chain compromise via a poisoned agent skill),
  `AML.CS0051` (OpenClaw command-and-control via prompt injection, HiddenLayer).
- **Penligent Identiverse 2026** (2026-06-26) — "AI Agent Identity Security and the Delegation Chain
  Problem."
- **Backslash Security** — "Don't Let the Lobster Fool You: OpenClaw Security Risks Explained," 2026.
- ATLAS: `AML.T0083` (Credentials from AI Agent Configuration), `AML.T0098` (AI Agent Tool Credential
  Harvesting), `AML.T0002.002` (AI Agent Configuration).

## 4.4 Mitigations (preventive)

1. **First-class per-agent identity** as a managed non-human identity (Microsoft Entra Agent ID, Okta,
   NinjaOne, Permit non-human accounts) with a named human owner and a full lifecycle: create → attest →
   expire → revoke.
2. **No static secrets in agent configuration.** Use workload identity (SPIFFE/SPIRE, cloud workload
   identity federation) plus short-lived, task-bound tokens via RFC 8693 Token Exchange. Never forward a
   user's broad session token.
3. **Bind tokens to signed intent** — subject, audience, purpose, session — and reject any use where
   bound intent differs from the current request. Add RFC 9449 DPoP or RFC 8705 mTLS-bound tokens.
4. **Explicit delegation chains where scope narrows at every hop.** The delegate re-validates the
   *original user intent*, not the caller's assertion.
5. **Capability-based permissions** (Cedar, OPA) on resources rather than RBAC roles. Read-only agents
   hold no write, delete or export scope.
6. **Per-session sandboxes with wiped state,** so credentials cached for one task cannot be reused by
   the next.
7. **Cryptographic agent attestation** — signed agent cards in discovery registries. Unverified
   descriptors are rejected, closing the forged-"Admin Helper" path.
8. **Non-bypassable human approval** for high-privilege or irreversible actions, enforced by the policy
   engine rather than the model.

## 4.5 Continuous monitoring

- **Per-agent identity audit log:** `agent_id`, token JTI, scope, audience, parent agent, initiating
  user. **Alert on any delegation where child scope is not a subset of parent scope.**
- **Scope-creep alert:** page when an agent requests new scopes or reuses a token outside its signed
  intent.
- **Token-age telemetry:** alert on task-scoped tokens used beyond their intended duration.
- **Agent registry hygiene job:** daily scan for unsigned or unattested agent descriptors →
  auto-quarantine.
- **Attribution completeness metric:** percentage of privileged tool calls lacking a resolvable
  initiating-user chain. Target 100%; **alert below 99.9%**. This is the single best board-level AI
  identity metric.
- **Session-state reuse detection:** the same sandbox or credential context appearing under two
  different task IDs.

## 4.6 Frameworks mapping

ASI03, ASI07. NIST AI RMF **GOVERN** (roles, accountability), **MAP**, **MANAGE**. ATLAS `AML.T0083`,
`AML.T0098`, `AML.T0002.002`, `AML.T0053`.

## 4.7 Residual risk

Delegation depth and multi-vendor IdP gaps allow at least one unattributable hop. Govern by measuring
attribution completeness as a board metric rather than by assuming it is complete.
