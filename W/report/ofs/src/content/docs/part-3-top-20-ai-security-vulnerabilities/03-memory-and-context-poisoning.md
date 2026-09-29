---
title: "3. Memory and Context Poisoning"
description: "OWASP ASI06 — writing attacker content into an agent's persistent memory so the compromise survives the session."
---

**Framework IDs:** `ASI06` · `LLM08:2026` · `LLM05:2026`

## 3.1 Definition

Malicious content is written into an agent's persistent memory, vector store, summaries or shared
context, so the compromise survives the session and silently biases later reasoning, tool selection and
approvals.

## 3.2 Mechanism

The attacker needs only *query-level* access — never write access to the memory store. Instructions
planted in ordinary content get summarized and persisted as "the user's preference," then replayed as
authoritative on future tasks. Selective-memory filters are bypassed by disguising the payload as benign
facts. Cross-tenant cosine-similarity bleed pulls poisoned or foreign chunks into retrieval. Because the
agent re-reads its own outputs, a single write self-reinforces.

## 3.3 Evidence

- **arXiv:2606.04329** — systematic study of memory poisoning across four write channels, identifying
  nine structural vulnerabilities.
- **arXiv:2602.15654** — "Zombie Agents: Persistent Control of Self-Evolving LLM Agents via
  Self-Reinforcing Injections."
- **arXiv:2606.24322** — non-malleable, origin-bound authority with machine-checked guarantees, a
  defence primitive worth adopting.
- **arXiv:2604.02623** — "Poison Once, Exploit Forever: Environment-Injected Memory Poisoning Attacks on
  Web Agents."
- **arXiv:2605.15338** and **arXiv:2605.29960** (MemPoison) — sleeper memory poisoning and bypass of
  selective memory mechanisms.
- **arXiv:2609.13889** — persistent memory poisoning against harness-based agents.
- ATLAS: `AML.T0080` (AI Agent Context Poisoning), `AML.T0080.001` (Thread), `AML.T0070` (RAG
  Poisoning).

## 3.4 Mitigations (preventive)

1. **Require source attribution on every memory write** — origin, tenant, author, session, trust score.
   Reject anonymous writes outright.
2. **Memory is data, never instruction.** Store it in a separate retrieval tier that is never
   concatenated as a system or developer instruction. Wrap recalled content in explicit
   untrusted-content delimiters.
3. **Non-malleable, origin-bound authority:** a memory item's permission to influence an action is bound
   to its original source, not its content (arXiv:2606.24322).
4. **Prevent self-re-ingestion** — do not promote the agent's own generated output into trusted memory
   without re-validation.
5. **Per-tenant vector namespaces with hard ACL enforcement at query time.** Block cross-namespace
   similarity matches.
6. **TTL and decay on unverified memory.** Version-control and snapshot memory so writes are revertible.
7. **Validate content on every write path** — uploads, API feeds, user chat, peer-agent exchange —
   requiring two independent controls before a high-impact memory item surfaces.
8. **Seed adversarial canary memories** per deployment to detect later activation.

## 3.5 Continuous monitoring

- **Memory-write provenance audit:** alert on writes with missing or AI-generated provenance, or from a
  source class not permitted for that namespace.
- **Write-velocity anomaly:** alert when one session writes more than N× its 30-day median, or when
  writes target facts consumed by approval workflows.
- **Retrieval-activation correlation:** join memory-hit events to subsequent sensitive tool calls; alert
  when a single memory ID precedes two or more privileged actions.
- **Cross-tenant namespace-violation detection** in vector database audit logs (pgvector, Weaviate,
  Qdrant query logs).
- **Canary memory tripwire:** alert on any retrieval of a planted canary item.
- **Semantic drift baselines:** weekly embedding-centroid comparison per agent and tenant; alert on a
  shift beyond δ (Arize Phoenix, LangSmith).

## 3.6 Frameworks mapping

ASI06, ASI01, ASI08; `LLM08:2026`, `LLM05:2026`. NIST AI RMF **MEASURE** (data integrity), **MANAGE**.
ATLAS `AML.T0080`, `AML.T0080.001`, `AML.T0070`, `AML.T0066`.

## 3.7 Residual risk

Poison written in a single high-trust-looking session *before instrumentation existed* is effectively
undetectable by statistics alone. Only provenance plus canaries bound it.
