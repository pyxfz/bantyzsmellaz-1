---
title: "14. Improper Output Handling"
description: "OWASP LLM10:2026 rank #10 — model output treated as trusted input to SQL, a shell, a browser DOM, a template engine or a deserialiser."
---

**Framework IDs:** `LLM10:2026` (rank #10 — the largest fall, from fifth) · `ASI05`

## 14.1 Definition

Treating model output as trusted input to a downstream interpreter — SQL, a shell, a browser DOM, a
template engine, a deserialiser — rather than as untrusted user input.

## 14.2 Mechanism

Output is a **renderer** primitive, not a text primitive. A model asked for HTML, a query, or a script
will comply with attacker-shaped requests ("show me an `img onerror` example"), and the injection that
steers it is trivial. EchoLeak is the cleanest real proof: the model output a Markdown image reference,
the renderer fetched it, and the **legitimate, allowlisted** outbound request carried the stolen context.
The same pattern yields XSS, SQLi, SSRF and RCE — and it now arrives pre-written at unprecedented volume.

## 14.3 Evidence

- **Veracode, 2025 GenAI Code Security Report** — 100+ LLMs across 80+ coding tasks, SAST-scanned. **45%
  of AI-generated code samples failed security testing.** By class: **XSS (CWE-80) 86% failure, log
  injection (CWE-117) 88%, SQL injection (CWE-89) 20%, cryptographic failure 14%.** By language: **Java
  worse than 70% failure.** The October 2025 update found the best model with security-specific prompting
  still only ~66% secure. **The critical finding: newer and larger models showed no meaningful security
  improvement.** (Verified — see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **CodeRabbit** analysis of 470 pull requests: AI-authored PRs carry **1.7× more total issues and 2.74×
  more security-specific issues.** Veracode separately found vulnerabilities persist beyond one year in
  30–40% of codebases.
- **EchoLeak** (`CVE-2025-32711`) — model output as an exfiltration channel via renderer-side fetches.
- ATLAS `AML.CS0022` — ChatGPT package hallucination as a dependency-confusion vector.

## 14.4 Mitigations (preventive)

1. **Architectural rule: one context, one interpreter, no string concatenation.** Parameterised queries
   only — never template a prompt or completion into SQL.
2. **Never pass model output to a shell.** Use argument-array APIs (`subprocess.run([...], shell=False)`,
   `execFile`), fixed allowlisted binaries, and a container or namespace sandbox.
3. **Render model output as text by default.** If HTML or Markdown is required, sanitise server-side with
   DOMPurify (JavaScript) or Bleach (Python) on a strict allowlist, and deploy a strict **CSP with
   `script-src 'self'` and no `unsafe-inline`**.
4. **SSRF controls on every renderer and agent HTTP client:** resolve-then-pin the IP, block RFC1918 and
   `169.254.169.254`, enforce egress allowlists, disable redirects to private ranges, and require
   IMDSv2-only on any cloud workload an agent can reach.
5. **Block deserialisation of model output entirely.** If unavoidable, use data-only formats with JSON
   Schema validation — never `pickle`, `yaml.load`, or Java native deserialisation.
6. **Parameterise templates.** Never disable Jinja, Handlebars or ERB autoescaping for model-derived
   strings; use autoescape-by-default plus context sandboxing.
7. **Enforce output schemas at the gateway:** constrained decoding or JSON Schema with `strict: true`,
   plus a validator that rejects non-conforming responses before they reach any sink.
8. **Mandatory SAST, SCA and secret scanning in CI on all pull requests, including agent-authored ones.**
   Treat "AI-generated" as a reason for *more* scrutiny, not less.

## 14.5 Continuous monitoring

- Run SAST (Veracode, Snyk Code, SonarQube, Checkmarx) on every PR. **Baseline AI-authored diffs at 45%**;
  alert when a team's AI-Code Vulnerability Rate exceeds baseline by more than 10 percentage points
  monthly, and hard-block CWE-89, CWE-80 and CWE-79 on AI-touched lines.
- **Dependency-truth check in CI:** verify every referenced package and version exists in the registry and
  is at least 30 days old. This blocks hallucinated dependencies ("slopsquatting").
- CSP in report-only mode, then enforce. Alert on any `script-src` violation originating from an
  AI-rendered surface.
- **Egress proxy DLP on agent HTTP clients:** alert on any request to a link-local, RFC1918 or
  newly-registered domain issued by an LLM or agent process. This catches EchoLeak-class and
  shell-exfiltration patterns.
- **Sandbox telemetry (Falco/eBPF):** alert on `sh -c`, `eval`, `exec` or unexpected binary spawn from any
  process whose ancestry includes an agent runtime.
- **Prompt-injection guardrail score distribution:** alert if the share of prompts attempting to elicit
  SQL/HTML/shell payloads exceeds baseline. A rising curve is a pre-exploitation signal.
- Monthly PR audit comparing AI-authored versus human-authored issue density per repository; escalate
  teams trending toward or past 2.7×.

## 14.6 Frameworks mapping

`LLM10:2026`; ASI05. NIST AI RMF **MAP**, **MEASURE**, **MANAGE**; NIST SSDF (PO.3, PW.7, RV.1). ATLAS
`AML.T0051` as the delivery mechanism, with resulting XSS/SQLi/SSRF/RCE recorded under the corresponding
ATT&CK IDs.

## 14.7 Residual risk

Veracode's data shows security quality is **not correlated with model capability or size.** The control
must be a mandatory deterministic gate, because no model upgrade will fix it.
