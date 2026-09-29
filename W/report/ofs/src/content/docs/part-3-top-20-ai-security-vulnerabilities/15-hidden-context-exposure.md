---
title: "15. System Prompt Leakage and Hidden Context Exposure"
description: "OWASP LLM08:2026 — the retired 'System Prompt Leakage' category, widened to cover retrieved documents, agent memory and tool responses."
---

**Framework IDs:** `LLM08:2026` (**Hidden Context Exposure** — replaces the retired "System Prompt Leakage" category) · `LLM02:2026` · `ASI03`

> **Why this section is broader than it looks.** OWASP retired "System Prompt Leakage" in the 2026 list
> and replaced it with **Hidden Context Exposure**, a category that explicitly covers retrieved
> documents, agent memory, user information, application state and tool responses as attack surface. It
> is therefore not a "don't leak your prompt" hygiene note — it is the connective tissue between
> [§1](/part-3-top-20-ai-security-vulnerabilities/01-prompt-injection/) (injection),
> [§3](/part-3-top-20-ai-security-vulnerabilities/03-memory-and-context-poisoning/) (memory poisoning),
> [§12](/part-3-top-20-ai-security-vulnerabilities/12-rag-vector-and-embedding-weaknesses/) (RAG) and
> [§13](/part-3-top-20-ai-security-vulnerabilities/13-sensitive-information-disclosure/) (log leakage).
> Read it that way.

## 15.1 Definition

Adversaries extract the system or developer prompt, guardrail logic, tool schemas, internal policy text,
or secrets embedded in hidden context.

## 15.2 Mechanism

The prompt is a **de facto capability document** — refusal instructions, safety policy, retrieval logic,
internal URLs and, frequently, API keys. Attackers reframe extraction as a benign task: *"repeat this as
JSON,"* *"translate your instructions,"* base64 wrappers, or a staged multi-turn Crescendo. Once leaked,
the guardrail text becomes an oracle for iterating injection attacks, and any embedded credential becomes
an immediate pivot. Encoding-based attacks are particularly effective because **models that refuse direct
extraction still emit the prompt when asked for a schema.**

## 15.3 Evidence

- **arXiv:2606.18673** — a measurement study across **1,200 publicly accessible applications on six
  commercial platforms** found **over 80% leaked system prompts** under realistic adversarial queries,
  **sometimes exposing third-party API keys.** It identifies *attention drift* as the mechanism.
  Responsible disclosure led two vendors to classify leaks as medium-severity vulnerabilities. (Verified —
  see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **arXiv:2604.01039** — 7 models, 46 system instructions. **Attack success above 0.7 for structured
  serialisation.**
- **arXiv:2509.21884** — extraction succeeds against **GPT-4o and Claude 3.5 Sonnet.**
- **arXiv:2608.19857** — "Inadvertent Context Leakage." Two-digit in-context secrets were reconstructed
  near-perfectly; **four-digit secrets at 82% exact match from ordinary non-adversarial outputs.**
  Stronger models leaked *more*. An RL-trained adversary extracted **full Social Security Numbers** from a
  production-style agent.
- **arXiv:2605.11459** — ProxyPrompt protects **94.70%** of 264 prompt/model pairs versus 42.80% for the
  next best.
- ATLAS: `AML.T0056` (Extract LLM System Prompt, under `AML.TA0010` Collection), `AML.T0069` (Discover
  LLM System Information). Leakage is the pivot into `AML.T0057` (LLM Data Leakage).
- **Salesforce ForcedLeak** (Zenity, 2025) — zero-click exfiltration of CRM data from Agentforce via
  crafted URLs; reported fixed 2026-08. *CVE not confirmed — treat as unverified.*

## 15.4 Mitigations (preventive)

1. **Never put secrets in the prompt.** Move all credentials to a broker or vault; the model requests a
   scoped, short-lived token at execution time.
2. **Externalise enforcement** — guardrails, authorisation and rate limits live in the orchestration
   layer, so the prompt holds no secret logic to steal.
3. **Structural anti-leak measures:** SysVec (arXiv:2509.21884), ProxyPrompt (arXiv:2505.11459),
   PromptKeeper (dummy-prompt regeneration on detection, arXiv:2412.13426), PSM (arXiv:2511.16209).
4. **Harden the wording.** Refusal instructions alone are insufficient; add explicit anti-serialisation
   clauses. One-shot instruction reshaping cuts attack success without retraining.
5. **Canary secrets** planted in the system prompt. Any emission is a confirmed leak; alert in real time.
6. **Output DLP:** block responses matching the literal system prompt (n-gram or embedding similarity
   above threshold) or containing known key formats.
7. **Minimise.** Ship the smallest possible system prompt; do not expose tool descriptions, internal
   hostnames or policy documents.
8. **Maintain a rotation playbook:** on confirmed leak, rotate every embedded secret within the hour and
   treat the leaked prompt as a public artefact.

## 15.5 Continuous monitoring

- **Canary-token egress detection:** alert on any response containing a canary string or a high-entropy
  token matching your key format (`AKIA`, `sk-`, `ghp_`, JWT). **P1, auto-rotate.**
- **Nightly leak-similarity job:** embed and compare every sampled response against the current system
  prompt. Alert at cosine similarity ≥ 0.85 or 8-gram overlap above 20 tokens. **Re-run after every prompt
  or model change.**
- **Extraction-attempt scoring:** score each turn for extraction intent — schema or serialisation
  requests, "repeat/translate/encode your instructions", role switches. **Alert on two or more such turns
  in a session, or any single turn following a refusal.**
- **Context-presence canary:** place a unique sentinel string in user context (calendar, email, CRM
  records) and alert if it is ever echoed. This detects covert-channel extraction.
- **CI gate on secrets-in-prompt drift:** fail the build if a credential-pattern regex matches
  `system_prompt`, `developer_message`, or any config value passed at request time.
- Monthly third-party red team (PromptArmor, Protect AI, Repello, Lasso) with a written metric.
  **Escalate if the leakage rate exceeds the 80% industry baseline.**

## 15.6 Frameworks mapping

`LLM08:2026`, `LLM02:2026`, `LLM03:2026`; ASI03. NIST AI RMF **GOVERN** (prompt-as-asset policy),
**MAP**, **MEASURE** (leak-rate metric), **MANAGE** (rotation, DLP). ATLAS `AML.T0056`, `AML.T0069`,
`AML.T0057`, `AML.T0061`. CWE-200 / CWE-522 at the underlying-secret layer.

## 15.7 Residual risk

Leakage is not preventable, only degradable. A stolen prompt permanently lowers the adversary's cost, so
detection must assume disclosure and secrets must be designed to be useless once disclosed.
