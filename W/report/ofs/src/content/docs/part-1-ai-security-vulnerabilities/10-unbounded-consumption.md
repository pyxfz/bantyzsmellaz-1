---
title: "10. Unbounded Consumption"
description: "OWASP LLM10 — denial of wallet, resource exhaustion and the cost of a breach."
---

**OWASP Rank:** #10 (LLM10) · **Severity:** Medium

## 10.1 Description

Unbounded consumption refers to the risk of runaway inference costs, resource exhaustion, or denial of
service caused by crafted prompts that drive excessive model computation. Attackers can exploit the
fact that LLMs consume variable resources depending on input complexity, leading to financial DoS or
service degradation.

## 10.2 Real-World Incidents

- Flood of queries or huge prompts causing service outages.
- "Sponge" inputs designed to maximize computational cost per query.
- Automated loops that repeatedly call LLM APIs, driving costs to unsustainable levels.
- DDoS-like attacks targeting AI infrastructure, exhausting GPU resources.

## 10.3 Why It Matters

LLM inference costs scale with input and output length. Unlike traditional DoS attacks that target
network bandwidth, unbounded consumption attacks exploit the computational nature of AI inference. The
average total cost of a data breach rose to $4.44 million in 2025, with high shadow AI usage increasing
breach costs by $670,000 per breach on average.

## 10.4 Mitigation Strategies

- Enforce strict API rate limits per user and IP address
- Implement hard cost ceilings and budgets
- Deploy automated circuit breakers for anomalous usage patterns
- Validate and sanitize inputs to prevent resource-exhausting prompts
- Continuously monitor resource usage for suspicious spikes
- Implement tiered access with different resource quotas
- Use input length limits and complexity scoring
