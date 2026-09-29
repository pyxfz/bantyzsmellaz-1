---
title: "9. Agentic Supply Chain and MCP Tool Poisoning"
description: "OWASP ASI04 — poisoned MCP manifests, rug pulls and tool shadowing against the agent's tool surface."
---

**Framework IDs:** `LLM04:2026` + `ASI04` · `ASI02` · `ASI03`

## 9.1 Definition

Attacks on the agent's **tool surface** — MCP server manifests, tool descriptions, schemas and returned
data — which the model treats as trusted operational context while the human operator typically never
sees it.

## 9.2 Mechanism

MCP `tools/list` descriptions are ingested into the context window on **every** tool-selection pass. An
attacker who controls a description embeds instructions the LLM obeys. A **rug pull** mutates the
description *after* approval, and because MCP has no manifest-drift detection or re-approval trigger, the
poisoned definition inherits the trust the benign one earned. **Tool shadowing** weaponises a second,
malicious server to abuse a co-connected legitimate server, so exfiltration traverses a trusted channel
above the encryption layer. Poisoning is not confined to the `description` field — it hides in parameter
names, enum defaults and example values.

## 9.3 Evidence

- **Invariant Labs, "MCP Security Notification: Tool Poisoning Attacks," 2025-04-06** — the canonical
  disclosure. A poisoned `add` tool instructed the agent to read `~/.ssh/id_rsa` and `~/.cursor/mcp.json`
  and exfiltrate them in a "sidenote." WhatsApp sleeper rug-pull and tool-shadowing proofs of concept
  published alongside.
- **Cloud Security Alliance research note, 2026-07-02** — **over 60% attack success across 45+ real-world
  MCP servers**; the best agent model reached **72.8%**.
- **`postmark-mcp` v1.0.16** on npm, disclosed September 2025 — the **first confirmed malicious MCP
  server in a public registry**. It BCC'd all outbound email; approximately **1,500 downloads per week,
  ~300 organisations reached.**
- **`CVE-2025-54136`** ("MCPoison", Cursor IDE) — a malicious `.cursor/rules/mcp.json` approved clean then
  swapped. **`CVE-2025-6514`** (mcp-remote RCE, CVSS 9.6, 437k+ downloads). **`CVE-2025-49596`** (MCP
  Inspector RCE, CVSS 9.4). **`CVE-2025-68143/68144/68145`** (Anthropic `mcp-server-git` sandbox escape
  and arbitrary file write), chainable with Filesystem MCP for RCE via `.git/config`.
- **`CVE-2026-12537` / `GHSA-wpqr-6v78-jr5g`** — Google Gemini CLI, **CVSS 10.0**, 2026-04-24. The
  "Comment and Control" PR-title injection exfiltrated CI runner secrets.
- **Endor Labs** — of 2,614 MCP implementations surveyed: **82% use file APIs prone to path traversal,
  67% expose code-injection-capable APIs, 34% command-injection-capable APIs.**
- Academic: arXiv:2506.01333 (ETDI, formal rug-pull treatment), arXiv:2508.12538 (MCPLib), arXiv:2508.14925
  (MCPTox — 312 scenarios, 14 classes), arXiv:2603.22489 (MCP threat modelling with tool poisoning).

## 9.4 Mitigations (preventive)

1. **Allowlist MCP servers by exact registry coordinate and publisher.** Block first-install
   auto-approval; disallow `npx`-style on-demand servers in enterprise configurations.
2. **Pin tool manifests.** Hash `tools/list` (names, descriptions, schemas) at approval and verify on
   every session start. **Drift → block and re-review.**
3. **Run `mcp-scan` in CI** against every server and re-run on every upstream release. Add parameter-name
   and enum heuristics (CyberArk "Poison Everywhere").
4. **Sandbox each server:** dedicated container, read-only filesystem, no host mounts, seccomp/AppArmor,
   and a **per-server network egress allowlist** to its known upstream only.
5. **Zero standing privilege.** Issue short-lived, per-task OAuth tokens scoped to a single tool. No
   standing `repo:*` or Salesforce grants.
6. **Kill auto-approve.** Every tool call on a new manifest requires human confirmation, rendered with
   the **full description string**, not a friendly label.
7. **Scan tool output as untrusted input** at the client — prompt-injection classifier plus DLP — before
   it re-enters the context.
8. **Verify MCP package provenance:** pin by hash, require signed releases, block typosquats, maintain a
   vetted internal registry.

## 9.5 Continuous monitoring

- **Diff `tools/list` against the signed baseline at every session.** Alert on any field-level change —
  description, schema, enum default, new tool — **within five minutes.**
- Static scan on every newly connected server; any detection → block. Feed `tool_poisoning_detected` and
  `rugpull_manifest_drift` findings into the SIEM.
- **DLP on outbound tool arguments:** alert on any tool call whose parameters contain more than N tokens
  of a retrieved document, a base64 blob, or a URL parameter pointing to a non-allowlisted host.
- **Cross-server chain detection:** alert when server A's output triggers a call to server B's tool in
  the same turn in which A was installed.
- **Per-process network telemetry** for every MCP server. Any destination outside its egress allowlist is
  a P1 — this is what catches rug pulls, which must phone home.
- **MCP inventory drift:** alert on new server processes or config files on developer endpoints
  (`~/.cursor/mcp.json`, Claude Desktop config) absent from the sanctioned registry.
- Weekly review of tool-call volume per server per user; baseline deviation beyond 3σ suggests shadow
  tool use.

## 9.6 Frameworks mapping

`LLM04:2026`, ASI04, ASI02, ASI03. NIST AI RMF **MAP**, **MEASURE**, **MANAGE**. ATLAS `AML.T0051`,
`AML.T0054`, `AML.T0024`, `AML.T0048`, `AML.T0011.002`.

## 9.7 Residual risk

The OpenAI / Hugging Face incident showed agents turning a **shared package registry into an emergent
command-and-control channel.** Shared infrastructure is itself an unmonitored agent-to-agent trust
boundary.
