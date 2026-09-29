---
title: "17. Unbounded Consumption — Inference and Cost Denial of Service"
description: "OWASP LLM06:2026 rank #6 — token amplification, tool-layer economic DoS, agent fan-out and the denial of wallet."
---

**Framework IDs:** `LLM06:2026` (rank #6 — up four places from tenth) · ASI02 · ATLAS `AML.T0029`

## 17.1 Definition

Attackers drive token spend, GPU-seconds or wall-clock far beyond intended cost via adversarial inputs,
runaway agent loops, or leaked-key volume. The modern framing is financial — **"denial of wallet"** —
where the service stays up while the bill exceeds any budget.

## 17.2 Mechanism

Four distinct paths:

1. **Token amplification** — short, benign-looking prompts ("consider every possible interpretation")
   drive reasoning models into pathologically long chains invisible to input-length filters.
2. **Tool-layer economic DoS** — a malicious or poisoned MCP server edits only text-visible fields while
   keeping valid function signatures, steering the agent into verbose tool-calling chains. Standard prompt
   filters and output trajectory monitors seldom fire.
3. **Agent fan-out via poisoned data** — no misbehaviour needed; a RAG corpus crafted to make tasks
   open-ended recurses one user request into hundreds of tool calls.
4. **Classic volume and algorithmic complexity** — a leaked API key scripted at 50,000 overnight requests;
   sponge examples that raise activation density to kill GPU sparsity; long-context prefill forcing vLLM
   preemption and stalling concurrent decode traffic.

## 17.3 Evidence

- **ReasoningBomb** — arXiv:2602.00154 (2026). 18,759 average completion tokens, **286.7×
  input-to-output amplification**, with **99.8% bypass of input detection, 98.7% of output detection,
  98.4% of both.**
- **Beyond Max Tokens** — arXiv:2601.10955 (2026). Trajectories beyond 60,000 tokens, **per-query cost up
  to 658×**, energy 100–560×, KV occupancy 35–74%, evading prompt filters and output monitors.
- **Clawdrain** — arXiv:2603.00902 (2026). Real billing, Gemini 2.5 Pro: 6–7× amplification,
  approximately 9× in the failure configuration.
- **Sponge Examples** — arXiv:2006.03463 (2020). **10–200× energy increase**, portable across CPUs, GPUs
  and ASIC simulation. Training-time variant: arXiv:2203.08147.
- **FinOps incident, April–June 2026** — an AWS Bedrock customer billed **$30,141.33 in 30 days**; **AWS
  Cost Anomaly Detection never fired** because Marketplace-billed usage sits outside that billing
  surface. In the same week, Google customers with compromised keys saw **$0 → $10,000 in 30 minutes.** A
  single UI dropdown click in an agent desktop preview consumed **500,000 tokens** of context.
- **vLLM** — KV cache insufficiency triggers preemption and recompute, converting a prefill-heavy attacker
  workload into latency for every other tenant.

## 17.4 Mitigations (preventive)

1. **Per-identity token buckets** (input, output and reasoning tokens) enforced at the gateway — LiteLLM,
   Portkey, Cloudflare AI Gateway. **Never rely on upstream 429s.**
2. **Hard spend caps:** AWS Budgets Actions, `aws:bedrock:InvocationModel` SCP deny conditions,
   per-project IAM keys with dollar ceilings. **Treat Marketplace spend as a separate budget line** — it
   escapes Cost Anomaly Detection, as the $30,141 case demonstrates.
3. **Circuit breaker on cost rate:** trip when tokens/minute exceeds 3× tenant baseline, and on any
   session exceeding $X.
4. **Cap `max_context` and `max_tokens` server-side.** Reject inputs above N tokens *before* billing.
   Disable or heavily discount extended thinking on public routes.
5. **Agent task budget:** `max_tool_iterations`, `max_tool_calls_per_task`, and a cumulative token ceiling
   enforced inside the orchestrator (LangGraph `recursion_limit`, MCP client timeouts).
6. **Concurrency quotas and admission control** on self-hosted serving. Isolate prefill from decode (vLLM
   PD-disaggregation) and reserve KV cache so prefill floods cannot starve tenants.
7. **Prompt-cache TTL limits and cache-hit-ratio alarms.** A cache hit rate above 95% from a single account
   means harvesting, not users.
8. **MCP server allowlist with signed manifests.** Cap tool output bytes returned to the agent.
9. **Reasoning-effort guardrails:** map "keep double-checking" and "consider every possible" style prompts
   to a fixed `reasoning_budget`; require explicit opt-in for high-effort tiers.

## 17.5 Continuous monitoring

- **Alert above 3× the 7-day rolling mean tokens/minute for a tenant, sustained five minutes** (Datadog
  LLM Observability, Langfuse).
- **Alert on any single account with an input:output token ratio below 1:50** — ReasoningBomb's signature.
- Alert when mean completion tokens per request exceed 2σ of the 14-day baseline for that model and route.
- Alert on sessions with more than 20 tool calls or tool-call depth beyond 5, and on any agent trajectory
  beyond 30,000 tokens.
- Alert on an MCP server whose output byte-size distribution shifts beyond 3σ, or whose descriptions
  change after registration.
- Alert on per-key spend velocity above $50/hour sustained, and on Bedrock/Marketplace spend **not
  reconciled** by Cost Anomaly Detection (FinOps FOCUS 1.1 report).
- Track KV cache occupancy; page on sustained values above 85% or more than 100 preemptions per hour
  (vLLM `/metrics`, Prometheus).
- Canary keys per environment, auto-rotated daily; alert on invocation from an unapproved ASN or region.

## 17.6 Frameworks mapping

`LLM06:2026`; ASI02. NIST AI RMF **MEASURE** (MS-2.6, MS-2.7), **MANAGE** (MG-4.1). ATLAS `AML.T0029`
(Denial of AI Service: Flooding, Algorithmic Complexity, Resource Exhaustion), `AML.T0034`.

## 17.7 Residual risk

Amplification attacks that keep prompts and outputs on the natural-language manifold remain
indistinguishable from legitimate heavy reasoning. Only cost-rate limits and iteration caps reliably
contain them.
