---
title: "9. Misinformation and Hallucination"
description: "OWASP LLM09 — confident falsehoods, deepfake fraud and the limits of grounding."
---

**OWASP Rank:** #9 (LLM09) · **Severity:** Medium

## 9.1 Description

Misinformation from LLMs poses a core vulnerability for applications relying on accurate outputs. LLMs
can generate content that is factually incorrect, inappropriate, or unsafe — often with high confidence
and authoritative tone. When users or downstream systems act on this false information without
verification, it can lead to harmful decisions.

## 9.2 Real-World Incidents

- AI systems generating fake legal cases that were cited in court filings.
- Medical AI systems providing incorrect treatment recommendations.
- Financial AI systems generating inaccurate market analysis.
- Deepfake fraud: A finance worker at British engineering giant Arup made 15 wire transfers totaling
  $25.6 million after a video conference with AI-generated deepfake colleagues.
- UC San Diego researchers demonstrated adversarial perturbations that bypass deepfake detectors with
  86% success rates.

## 9.3 Why It Matters

Unlike traditional software bugs, hallucinations are inherent to how LLMs generate text. They cannot be
fully eliminated, only mitigated. The combination of confident tone and plausible-sounding falsehood
makes misinformation particularly dangerous, especially in high-stakes domains like healthcare,
finance, and legal systems.

## 9.4 Mitigation Strategies

- Ground outputs with strict RAG from verified sources
- Implement confidence scoring and cross-validation
- Use multiple models for verification
- Implement human oversight for high-stakes decisions
- Deploy fact-checking and citation verification layers
- Use retrieval-augmented generation to anchor responses in verified data
- Implement clear disclaimers about AI-generated content limitations
