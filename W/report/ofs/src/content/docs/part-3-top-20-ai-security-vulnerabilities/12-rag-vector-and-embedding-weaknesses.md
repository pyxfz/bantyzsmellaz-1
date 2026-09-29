---
title: "12. RAG, Vector Store and Embedding Weaknesses"
description: "OWASP LLM09:2026 — the retrieval layer as the component that decides which data a model is allowed to see, and how it fails."
---

**Framework IDs:** `LLM09:2026` (Vector and Embedding Weaknesses) · `LLM01` · `ASI06`

## 12.1 Definition

Failure of the retrieval layer — the component that decides **which data the model is allowed to see** —
through missing authorisation, cross-tenant leakage, poisoned content, or embeddings treated as
unauthenticated opaque blobs.

## 12.2 Mechanism

Chroma, pgvector, FAISS and similar libraries were built as research artefacts and are routinely
deployed with no authentication and no row-level ACL, so any caller retrieves every chunk. A harder,
second-order problem: **ACLs applied at ingestion or as post-filtering do not survive retrieval.**
Post-filtering drops recall catastrophically, and a vector-retrieved seed chunk can pivot via entity
links in hybrid or graph retrieval into a different tenant's neighbourhood. Meanwhile anyone with write
access can inject poisoned documents or perturb embeddings, because the index has no integrity primitive
and the LLM cannot distinguish instructions from evidence.

## 12.3 Evidence

- **`CVE-2026-45829` ("ChromaToast")** — **pre-authentication RCE, CVSS 4.0 = 10.0**, ChromaDB Python
  FastAPI server 1.0.0–1.5.8. `create_collection` executes
  `load_create_collection_configuration_from_json()` **before any auth check**; the attacker supplies
  `model_name` pointing at a Hugging Face repository they control plus `trust_remote_code: true`, so the
  server **executes attacker Python from inside the request and then politely returns 403 Forbidden
  afterwards.** Reported 2025-11-28 by HiddenLayer, disclosed May 2026, **unpatched**. Only the Python
  server is affected; the Rust frontend (`chroma run`) does not use this path. Shodan indexes
  internet-exposed instances. (Verified — see [§25](/part-3-top-20-ai-security-vulnerabilities/25-frameworks-sources-and-verification/).)
- **EchoLeak** — `CVE-2025-32711`, CVSS 9.3, M365 Copilot, the first zero-click indirect prompt
  injection.
- **arXiv:2602.08668** — *Retrieval Pivot Attacks in Hybrid RAG*. Retrieval pivot rate up to **0.95**,
  with cross-tenant leakage at pivot depth 2, occurring **organically without any adversarial injection.**
  Enforcing authorisation at the graph-expansion boundary drives the rate to approximately zero.
- **arXiv:2608.16044** — *Coverage Is Not Containment*. Ten injected documents take ten of ten top-k
  slots; the generator emits the planted claim in **88%** of targets. **The strongest ingestion-time
  classifier catches only 4.2% at 1% FPR, while a retrieval-time detector catches 100% at the same FPR.**
  This is the most operationally important finding in this section.
- **arXiv:2605.13764** — *VectorSmuggle*: steganographic exfiltration by post-embedding perturbation;
  small-angle orthogonal rotation defeats distribution-based anomaly detection on every model/corpus pair
  tested. Proposes VectorPin, an Ed25519 signature over canonical embedding bytes.
- **arXiv:2605.28074** — *SilentRetrieval*: 84.6% / 81.3% hit rate at 10 and 57.5% / 54.8% attack
  success; **74.2% hit rate retained at a 0.016% poisoning ratio.**
- **arXiv:2607.16973** — *TurboVec*. Post-filter tenant isolation collapses Recall@10 to **0.09–0.19**
  versus **0.86–0.93** for kernel-level allowlist filtering. Trained codebook quantisers give 57.3%
  membership-inference accuracy versus 50.0% (near-random) for codebook-oblivious quantisers.
- **arXiv:2609.00470** — TRIS sieve reduces attack success from 67/87/64% to 3/14/4%.
- **Embedding inversion:** arXiv:2411.05034; ACL 2024 long paper 230 (aclanthology.org/2024.acl-long.230)
  — transferable inversion *without* the embedding model; arXiv:2305.03010.
- **OWASP RAG Security Cheat Sheet** — cheatsheetseries.owasp.org.

## 12.4 Mitigations (preventive)

1. **Put the vector store behind an authorisation-enforcing proxy.** Filter *inside the index query* using
   kernel-level allowlisting. **Post-filtering is measurably unusable** (TurboVec: Recall@10 of 0.09
   versus 0.86).
2. **Enforce document-level ACL inheritance at chunk time.** Every chunk carries its source-document ID
   and ACL tags; the retriever applies the caller's identity claims as a hard predicate in the query.
3. **Re-check authorisation at every transition in a hybrid pipeline** — vector→graph expansion,
   vector→re-rank, vector→cache — not just at the first hop. Retrieval pivot attacks occur at depth 2
   without adversarial input.
4. **Authenticate and network-isolate the vector store:** API key or mTLS, no public exposure, security-
   group deny. For Chroma specifically, **migrate to the Rust `chroma run` frontend or front the Python
   server with an authenticating proxy until `CVE-2026-45829` is fixed.**
5. **Sign each vector** with Ed25519 over a canonical byte representation plus a source-content hash
   (VectorPin). Reject unsigned vectors at query time.
6. **Pre-ingestion sanitisation** (strip active content, neutralise instructions) **plus a retrieval-time
   demand-side detector.** The Coverage-Is-Not-Containment result makes this mandatory: admission-time
   filtering alone catches 4.2% where retrieval-time detection catches 100%.
7. **Use codebook-oblivious quantisation** (TurboQuant-class) to remove the membership-inference channel
   from trained indexes. Enforce per-tenant index or shard isolation for high-sensitivity corpora.
8. **Treat retrieved text as untrusted:** label it explicitly in the prompt, cap chunk size, and never
   let a retrieved chunk authorise a tool call.

## 12.5 Continuous monitoring

- **Canary-tenant probe:** a synthetic document per tenant, queried hourly with a normal user identity.
  **Any retrieval is a P1 cross-tenant breach.**
- **Retrieval ACL-denial rate and post-filter fallback count per query.** Any non-zero count of
  "retrieved-then-discarded" documents is a filter-bypass alert (P2, auto-disable that index).
- **Ingestion drift:** alert on new or updated documents exceeding a baseline daily count, or originating
  from a source not in the sanctioned connector list.
- **Poisoning signals:** hubness (a small set of chunks appearing in more than X% of top-k results across
  unrelated queries) and near-duplicate embedding clusters. Reverse-kNN scans hourly; auto-quarantine
  candidates.
- **Embedding signature verification** on every index write plus a periodic sweep. Failure → quarantine
  and investigate ingestion-pipeline compromise.
- **Retrieved-content instruction-injection classifier** on all outbound context. A trigger-hit rate above
  0.5% across a one-hour window is a P1.
- **Monthly membership-inference and tenant-isolation canary queries.** An unexpected response to "tell me
  documents about `<other-tenant-token>`" is a P1.
- **Vector database API authentication alerting:** unauthenticated request attempts, new source IPs, or
  bulk `list_collections` / `get` enumeration — the same pre-auth pattern that produced ChromaToast.

## 12.6 Frameworks mapping

`LLM09:2026`, `LLM01`; ASI06. NIST AI RMF **MAP**, **MEASURE**, **MANAGE**. ATLAS `AML.T0054`,
`AML.T0019`, `AML.T0020`, `AML.T0024`, `AML.T0070`.

## 12.7 Residual risk

Coordinate-based attacks are geometrically indistinguishable from legitimate niche ingestion at admission
time. That is a structural limit — detection must live at retrieval, not at the front door.
