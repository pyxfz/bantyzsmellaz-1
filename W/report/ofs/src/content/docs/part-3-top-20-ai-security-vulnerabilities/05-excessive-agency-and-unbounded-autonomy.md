---
title: "5. Excessive Agency and Unbounded Autonomy"
description: "OWASP LLM03:2026 rank #3 — functionality, permissions and autonomy beyond the task, and the autonomy ladder that caps them."
---

**Framework IDs:** `LLM03:2026` (rank #3 — the largest upward move in the 2026 list) · `ASI02` · `ASI08` · `ASI10`

## 5.1 Definition

The agent can act, decide, iterate and re-plan — and is granted functionality, permissions and autonomy
levels beyond its task, so a single error is amplified without a human checkpoint.

## 5.2 Mechanism

Excessive **functionality** (shell, database admin, payment, email-send) plus excessive **permissions**
plus excessive **autonomy** (loop-and-retry without approval) compound multiplicatively. A wrong
intermediate belief is not merely wrong — it is executed, retried, and delegated to peers, while the
user sees only the final result. Bulk-approval habits and planner/executor coupling remove the human
from the loop precisely when it matters.

## 5.3 Evidence

- **OWASP GenAI Exploit Round-up Report Q1 2026** (2026-04-14) — the canonical phrasing: *"The agent
  took high-impact action without appropriate approval."*
- **TechTarget, 2026** — "agents accumulate permissions far beyond what any individual task requires."
- **arXiv:2507.21146** — quantitative security benchmarking for multi-agent systems, providing
  blast-radius metrics aligned to OWASP ASI.
- **Anthropic's distillation campaigns** (see [§18](/part-3-top-20-ai-security-vulnerabilities/18-model-theft-and-extraction/))
  are simultaneously an excessive-agency story: ~24,000 fraudulent accounts operated at industrial
  scale.

## 5.4 Mitigations (preventive) — the autonomy ladder

Adopt an explicit ladder, cap each rung, and **default every agent to L1**:

| Rung | Capability | Conditions |
|---|---|---|
| **L0** | Read-only, advisory | No side effects possible |
| **L1** | Propose and await approval | **Default for all agents** |
| **L2** | Auto-execute low-impact, reversible actions | Per-task caps, logged |
| **L3** | Bounded autonomy inside a sandbox | Signed exception required; hard quotas |
| **L4** | Fully autonomous | **No production data, no money movement** |

Additional controls:

1. **Separate planner from executor** with an external policy engine between them. The planner can never
   authorize.
2. **Hard blast-radius caps:** maximum tool calls per task, objects touched, spend, recipients,
   wall-clock, retries, and peer fan-out.
3. **Circuit breakers** between planner and executor. Idempotency keys on every side-effecting call.
4. **Kill switch:** instant per-agent credential revocation at the gateway, not inside the agent.
5. **Quarantine-on-anomaly:** an agent exceeding variance thresholds is automatically downgraded one
   autonomy rung and routed to human review.
6. **Approve-nothing-by-default** for irreversible, external-facing, financial or permission-changing
   actions.
7. **Formal autonomy budget** reviewed quarterly. Cap expansion is gated on replay tests remaining under
   blast-radius thresholds.

## 5.5 Continuous monitoring

- **Actions-per-task distribution** per agent (tool calls, objects modified, spend, recipients). Alert
  at p99 of the trailing 30 days or on hitting a hard cap.
- **Retry and loop detection:** oscillating re-planning beyond K iterations in a task, or A→B→A
  delegation cycles → auto-throttle.
- **Approval-gate bypass attempts:** policy-engine denials, suppressed approval prompts, or approval
  granted more than X minutes after request. Track gate-bypass rate as a KPI with a target of **zero**.
- **Downstream fan-out metric:** distinct agents receiving a delegation within 60 seconds of one
  decision. Alert above baseline — this is the earliest cascading-failure signal.
- **Anomaly-based autonomy throttling:** auto-downgrade on deviation beyond 3σ from the agent's action
  profile.
- **"Unattended high-impact actions" per week** — the cleanest single executive KPI for this risk. Put
  it on the dashboard.

## 5.6 Frameworks mapping

`LLM03:2026`, ASI02, ASI08, ASI10. NIST AI RMF **MAP** (autonomy level selection), **MEASURE** (blast
radius), **MANAGE**. ATLAS `AML.T0034`, `AML.T0034.002`, `AML.T0053`.

## 5.7 Residual risk

Autonomy is a business decision with no technical floor. Residual risk equals the highest rung any team
has been granted without evidence.
