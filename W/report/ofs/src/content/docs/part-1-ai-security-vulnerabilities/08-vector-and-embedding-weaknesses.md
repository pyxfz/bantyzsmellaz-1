---
title: "8. Vector and Embedding Weaknesses"
description: "OWASP LLM08 — RAG and vector-database attack surface: poisoning, inversion, cross-tenant mixing."
---

**OWASP Rank:** #8 (LLM08) · **Severity:** Medium-High

## 8.1 Description

Vector and embedding weaknesses affect systems that use Retrieval-Augmented Generation (RAG) and vector
databases. These include lack of access control on vector stores, malicious or poisoned embeddings,
embedding inversion attacks, cross-tenant data mixing, and vector collision attacks.

## 8.2 Real-World Incidents

- Malicious documents injected into RAG knowledge bases, causing LLMs to retrieve and act on poisoned
  context.
- Cross-tenant data mixing in shared vector databases, exposing one user's data to another.
- Embedding inversion attacks reconstructing original text from vector representations.
- Vector collision attacks where one embedding tricks the system into retrieving a different document.

## 8.3 Why It Matters

RAG systems are becoming the dominant architecture for enterprise AI, combining LLMs with live data
stores. The vector databases that power RAG were not designed with security as a primary concern,
creating novel attack surfaces. Poisoned retrieval data can manipulate LLM outputs without ever
touching the model itself.

## 8.4 Mitigation Strategies

- Implement strict access controls on vector stores
- Segment memory and vector data per tenant
- Track data provenance for all embedded documents
- Implement zero-trust for RAG document ingestion
- Use cryptographic verification of vector store contents
- Regularly audit vector databases for poisoned or manipulated embeddings
- Implement embedding inversion detection
