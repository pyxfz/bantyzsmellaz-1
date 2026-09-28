---
title: "6. Excessive Agency"
description: "OWASP LLM06 — over-permissioned agents taking real-world actions without human oversight."
---

**OWASP Rank:** #6 (LLM06) — rising to #3 in 2026 · **Severity:** High

## 6.1 Description

Excessive agency occurs when an LLM-based system is granted too much autonomy, functionality, or
permission, enabling it to take real-world actions without sufficient human oversight. This
vulnerability enables damaging actions to be performed in response to unexpected or ambiguous LLM
outputs, regardless of whether the cause is hallucination, prompt injection, or a poorly performing
model.

## 6.2 Real-World Incidents

- AI agents sending sensitive data based on manipulated prompts.
- Autonomous systems deleting files or making unauthorized API calls.
- AI agents with access to deployment systems making unauthorized changes.
- The OWASP 2026 update elevated excessive agency from #6 to #3, reflecting the evolution from chatbots
  to agentic systems that call APIs and run code.

## 6.3 Why It Matters

As AI systems evolve from simple chatbots to autonomous agents that can call tools, access databases,
and execute code, the potential blast radius of any single erroneous or manipulated output grows
exponentially. The OWASP Top 10 for Agentic Applications (December 2025) ranks Agent Behavior
Hijacking, Tool Misuse and Exploitation, and Identity and Privilege Abuse as the top three agentic
risks.

## 6.4 Mitigation Strategies

- Apply the principle of least privilege to all AI agent permissions
- Implement just-in-time (JIT) ephemeral tokens for tool access
- Require human-in-the-loop (HITL) authorization for sensitive actions
- Limit the functionality, permissions, and autonomy of plugins to minimum necessary levels
- Implement automated circuit breakers for anomalous agent behavior
- Use capability-based security models
- Maintain comprehensive audit logs of all agent actions
