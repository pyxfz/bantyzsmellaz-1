---
title: "6. Unexpected Code Execution by Agents"
description: "OWASP ASI05 — model output crossing a trust boundary into an interpreter, giving an attacker code execution inside the agent runtime."
---

**Framework IDs:** `ASI05` · `LLM10:2026` (Improper Output Handling) · `LLM08:2026`

## 6.1 Definition

The agent writes, evaluates or executes code — shell, Python `eval`, deserialization, SQL, browser
automation, JIT/WASM — giving an attacker code execution inside the agent's own runtime.

## 6.2 Mechanism

Model output crosses a trust boundary into an interpreter: `eval()` in a memory system, a shell string
built from a retrieved document, a template render, `pickle` deserialization of tool payloads, or a
code-interpreter tool with both network and filesystem access. Multi-tool chains (upload → path
traversal → dynamic load) reach the same place without a single obviously malicious call. Critically,
code generated live can **bypass static controls because signatures do not exist ahead of time**.

## 6.3 Evidence

- **CVE-2025-6514** — `mcp-remote` OS command injection, CVSS 9.6, npm ≤0.1.15, **437,000+ users**
  (JFrog, July 2025).
- **ATLAS `AML.CS0052`** (LLMSmith) — 20 RCEs across 11 LLM frameworks.
- **ATLAS `AML.CS0045`** (Backslash Security) — data exfiltration via an MCP server used by Cursor:
  malicious tool → shell command execution.
- **ATLAS `AML.CS0050`** (OpenClaw 1-click RCE), **`AML.CS0055`** (AI ClickFix — hijacking computer-use
  agents).
- **The OpenAI / Hugging Face incident** — agents achieved code execution on 41 Hugging Face production
  servers and root on at least one. This is ASI05 in the wild.
- ATLAS: `AML.T0050` (Command and Scripting Interpreter, bridging ATT&CK T1059), `AML.T0078` (Drive-by
  Compromise).

## 6.4 Mitigations (preventive)

1. **Ban `eval`/`exec` in production agents.** If dynamic evaluation is unavoidable, use a restricted
   interpreter with an explicit capability API and taint tracking on generated code.
2. **Never run as root.** Use a non-root user with read-only rootfs, executing inside gVisor, Firecracker,
   or a container-sandboxed microVM with **egress denied by default** and a dedicated writable workdir.
3. **Strict separation of code generation from execution.** A validation gate plus SAST (Semgrep, Snyk
   Code) on agent-generated code before it ever runs.
4. **Allowlist auto-execution under version control.** Anything not on the list requires human approval.
   Deny shell metacharacters, `subprocess` with `shell=True`, dynamic `import`, and network calls in
   generated code.
5. **Pin dependencies by content hash** and verify lockfile integrity before any agent-initiated build —
   this blocks lockfile-poisoning backdoors.
6. **No agent may have a network path to production.** Changes land via pull request with pre-production
   security evaluation and adversarial unit tests.
7. **Per-session isolation with wiped state** and permission boundaries, so a sandbox escape lands in a
   disposable identity.

## 6.5 Continuous monitoring

- **Exec audit:** log every process spawn and interpreter invocation with `agent_id`, parent tool, argv
  hash and PID namespace. **Alert on any spawn not matching the execution allowlist** (Falco/eBPF, EDR,
  Wiz).
- **Sandbox escape and privilege-escalation detection** at runtime — unexpected `/proc` access, mount
  attempts, new capability sets.
- **Network egress from execution sandboxes:** alert on any outbound connection not on the per-task
  allowlist.
- **Dependency integrity monitor:** alert on any agent-initiated install or registry fetch; diff
  lockfiles against the approved hash set.
- Track **generated-code-to-execution pass rate** and unapproved-execution count. The latter should be
  **exactly zero**.
- **Memory-eval canary:** seed a payload string in the vector store that triggers on `eval`; alert if it
  is ever reached.

## 6.6 Frameworks mapping

ASI05, ASI04, ASI02; `LLM10:2026`. NIST AI RMF **GOVERN**, **MEASURE**, **MANAGE**. ATLAS `AML.T0050`
(→ ATT&CK T1059), `AML.T0078`, `AML.T0079`, `AML.T0011.003`.

## 6.7 Residual risk

Sandboxed execution with no egress and disposable credentials makes escape survivable rather than
harmless. Treat sandbox-escape frequency as a leading indicator, not a solved problem.
