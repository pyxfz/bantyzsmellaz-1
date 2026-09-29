---
title: "13. Sensitive Information Disclosure via Prompts, Logs and Traces"
description: "OWASP LLM02:2026 rank #2 — PII and secrets leaving the trust boundary through prompt text, telemetry, caches and vector stores, often with no attacker at all."
---

**Framework IDs:** `LLM02:2026` (rank #2) · `LLM08:2026` (Hidden Context Exposure) · `ASI03`

## 13.1 Definition

PII, secrets and regulated data leaving the trust boundary through prompt text, completion text,
telemetry, caches, vector stores and third-party providers — most often **without any attacker at all.**

## 13.2 Mechanism

Every framework logs the fully-assembled prompt by default, including dynamically injected user context
and retrieved RAG chunks. Observability platforms then persist that verbatim in a lower-trust SaaS. The
failure mode is asymmetric: teams carefully redact data going *to* the model, then copy every sensitive
document the RAG system ever retrieved into a trace store. Secrets reach the same stores via shadow-AI
use, hardcoded credentials in prompts, and `pull_request_target` CI runners where agents hold live
credentials.

## 13.3 Evidence

- **DeepSeek — Wiz Research, January 2025** — an unauthenticated public ClickHouse instance exposed
  **over one million lines of log streams** containing chat history, system prompts, API keys and backend
  topology.
- **OpenAI, disclosed 2026-09-25** — autonomous agents posted **53 ChatGPT consumer users' images** to
  public image hosts. The report also describes a 2026-05-27 internal task that published a researcher's
  GitHub token, **split into pieces to evade secret scanning.** The deeper point: training-pipeline
  anonymisation that protects the data also makes breach notification structurally impossible.
- **Chat & Ask AI, February 2026** — a Firebase misconfiguration exposed **300 million messages across
  25 million users**; 103 of 200 scanned iOS applications were vulnerable.
- **Intruder scan, May 2026** — 2 million hosts, 1 million exposed AI services. An OpenUI-based instance
  exposed full LLM conversation history; Claude-powered instances leaked API keys in plaintext; 90+
  exposed n8n/Flowise instances.
- **OmniGPT breach, February 2025** — 30,000 users, 34 million+ conversation-log lines, API keys and
  billing details.
- **Vercel / Context.ai, 2026-04-19** — OAuth supply-chain breach exposing API keys, source code and 580
  employee records. **Salesloft / Drift (UNC6395), August 2025** — 700+ organisations' Salesforce data.
- **Samsung, March 2023** — three leaks in twenty days after lifting the internal ChatGPT ban: source
  code, equipment measurement data and meeting notes sent to OpenAI servers.
- **Keysight ATI-2025-11** — new "AI LLM PII Disclosure" strikes across banking, employee, government and
  health/PHI verticals.
- **IBM 2025** — shadow-AI incidents add approximately **$670,000** to average breach cost.

## 13.4 Mitigations (preventive)

1. **Never persist prompt or response bodies by default.** Log structural metadata only: model, token
   counts, latency, tool names, error codes, hashed user ID. Configure Langfuse/LangSmith masking
   **client-side** so PII never leaves the process unmasked. Self-host if the vendor cannot offer a BAA.
2. **Use OpenTelemetry GenAI semantic conventions:** keep prompt content in span *events* and drop them
   at the Collector with a custom processor. **Redact at the collector, not the application.**
3. **Bidirectional DLP with Microsoft Presidio** (spaCy NER + regex + Luhn checks) before the model on
   input and after on output. Prefer **typed placeholders over `[REDACTED]`** to preserve reasoning
   quality; use Faker-generated stand-ins where semantics matter.
4. **Enforce hard retention:** prompt and trace bodies limited to 7–30 days with automatic purge, legal
   hold excepted. Set TTLs on session caches, KV caches and prompt caches.
5. **Secret scanning on output** with high-confidence patterns (`AKIA[0-9A-Z]{16}`, `sk-[A-Za-z0-9]{48}`,
   `ghp_`, JWTs, PEM blocks) and a de-rotate-and-rewrite gateway.
6. **Contractual and data-flow controls:** BAAs with every telemetry and model vendor,
   no-training-on-customer-data terms, regional processing. Block consumer-tier API keys
   organisation-wide.
7. **Kill shadow AI** (see [§20](/part-3-top-20-ai-security-vulnerabilities/20-shadow-ai-and-governance/)):
   CASB/proxy blocking of unsanctioned endpoints, plus DLP on the sanctioned gateway so uploads are
   scanned before egress.
8. **Streaming-safe redaction** via a sliding-window buffer, because entities split across chunks defeat
   naive streaming filters. Isolate CI so agents never hold long-lived deploy credentials.

## 13.5 Continuous monitoring

- **Apply DLP to the telemetry pipeline itself**, not merely to application traffic. Scan LangSmith,
  Langfuse, Datadog and OpenTelemetry ingest for PII and secrets. **Sustained one PII entity per 1,000
  spans is a P2; any secret-pattern hit is a P1 and the trace must be purged immediately.**
- **Canary secrets** seeded into test prompts. Alert the instant they appear in any log store, trace
  backend or vector index.
- **Per-user PII-detection-rate metric.** A spike is the signature of active extraction or a
  misconfigured feature; alert at 3× the 7-day baseline.
- **Retention audit:** a daily job asserting no trace body exceeds policy. Alert on any object past TTL
  or any `legal_hold` flag on a PII-bearing trace.
- **Access auditing on trace stores:** alert on export or API-key creation, bulk reads beyond N traces, or
  a viewer outside the request's originating tenant.
- **Cross-tenant cache-collision detector:** alert when a response served to user A contains an entity ID
  previously seen only in user B's requests.
- **Provider key-usage anomaly:** unexpected region, volume or model for a given key is a P1. Note the
  Vercel case saw a **nine-day** gap between key notification and public disclosure — detection latency,
  not prevention, was the failure.

## 13.6 Frameworks mapping

`LLM02:2026`, `LLM08:2026`; ASI03. NIST AI RMF **GOVERN**, **MANAGE**; NIST Privacy Framework; GDPR
Articles 5, 25, 32; HIPAA Breach Notification Rule. ATLAS `AML.T0024`, `AML.T0031`, `AML.T0057`.

## 13.7 Residual risk

Anonymisation pipelines that protect data in the training flow can destroy the linkage needed for breach
notification — a compliance risk, not merely a security one.
