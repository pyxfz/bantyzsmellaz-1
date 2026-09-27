# Top 10 Security Vulnerabilities Faced by AI Systems

**Date:** September 27, 2026
**Author:** AI Security Research Report
**Sources:** OWASP GenAI Security Project, Mindgard, SentinelOne, Cloudflare, Trend Micro, MITRE ATLAS, NIST AI RMF

---

## Table of Contents

1. [Prompt Injection](#1-prompt-injection)
2. [Sensitive Information Disclosure](#2-sensitive-information-disclosure)
3. [Supply Chain Vulnerabilities](#3-supply-chain-vulnerabilities)
4. [Data and Model Poisoning](#4-data-and-model-poisoning)
5. [Improper Output Handling](#5-improper-output-handling)
6. [Excessive Agency](#6-excessive-agency)
7. [System Prompt Leakage](#7-system-prompt-leakage)
8. [Vector and Embedding Weaknesses](#8-vector-and-embedding-weaknesses)
9. [Misinformation and Hallucination](#9-misinformation-and-hallucination)
10. [Unbounded Consumption](#10-unbounded-consumption)

---

## 1. Prompt Injection

**OWASP Rank:** #1 (LLM01)
**Severity:** Critical
**Also known as:** The "SQL Injection of AI"

### Description

Prompt injection occurs when an attacker crafts malicious input that manipulates an LLM into performing unintended actions, overriding system instructions, or leaking sensitive data. It exploits the fundamental inability of language models to reliably distinguish between system instructions and user-supplied data.

There are two primary forms:

- **Direct Prompt Injection (Jailbreaking):** The attacker directly inputs malicious prompts to overwrite or bypass the system prompt, gaining unauthorized access to backend systems or sensitive functionality.
- **Indirect Prompt Injection:** The attacker embeds malicious instructions within external content (websites, documents, emails) that the LLM processes as part of its normal operation, causing the model to execute the hidden instructions.

### Real-World Incidents

- **Bing Chat / Sydney (Feb 2023):** Stanford student Kevin Liu used prompt injection to extract the hidden system prompt and internal codename "Sydney" from Microsoft's Bing Chat, demonstrating how easily guardrails could be bypassed.
- **CVE-2025-53773:** Hidden prompt injection in pull request descriptions enabled remote code execution with GitHub Copilot, scoring 9.6 on the CVSS scale.
- **EchoLeak (Microsoft 365 Copilot):** A zero-click prompt injection vulnerability that could access and silently exfiltrate enterprise data without any user interaction.
- **OWASP Statement:** "There is no fool-proof prevention within the LLM" — prompt injection has topped the OWASP list since its first release in 2023 and remains fundamentally unsolved.

### Why It Matters

LLMs process natural language as both instructions and data simultaneously. This architectural reality means that any text processed by the model — whether from a user, a document, or a webpage — can potentially be interpreted as an instruction. Larger, more capable models have not demonstrated improved resistance.

### Mitigation Strategies

- Implement robust access control policies for backend systems
- Integrate human oversight into LLM-directed processes
- Use input validation and sanitization layers before prompts reach the model
- Deploy AI-powered prompt inspection and filtering tools
- Apply the principle of least privilege to LLM tool access
- Implement Google's CaMeL (Capabilities for Machine Learning) architectural approach for data-flow isolation

---

## 2. Sensitive Information Disclosure

**OWASP Rank:** #2 (LLM02)
**Severity:** Critical

### Description

Sensitive information disclosure occurs when an LLM inadvertently reveals confidential data in its responses. This can include personally identifiable information (PII), trade secrets, training data, system prompts, or other proprietary information. Disclosures can happen through direct extraction, inference from model outputs, or as a side effect of prompt injection attacks.

### Real-World Incidents

- Engineers have leaked proprietary code through ChatGPT inputs, exposing trade secrets.
- Models trained on medical data have been shown to reconstruct patient health records.
- Financial transaction data has been extracted from fraud-detection models through careful querying.
- IBM's 2025 Cost of a Data Breach Report found that 97% of breached organizations with AI-related incidents lacked proper AI access controls.

### Why It Matters

LLMs memorize patterns from training data and can regurgitate sensitive information when prompted cleverly. This creates compliance violations (GDPR, HIPAA, CCPA), intellectual property loss, and competitive disadvantage. The risk is amplified in RAG systems where models access live databases containing confidential information.

### Mitigation Strategies

- Implement data sanitization and scrubbing before training
- Deploy data loss prevention (DLP) tools to monitor LLM outputs
- Use differential privacy techniques during training
- Apply automated data localization controls for cross-border data
- Implement strict access controls and RBAC for model endpoints
- Regularly audit model outputs for sensitive information leakage
- Use output filtering and redaction layers

---

## 3. Supply Chain Vulnerabilities

**OWASP Rank:** #3 (LLM03)
**Severity:** High

### Description

AI supply chain vulnerabilities arise from compromised components anywhere in the ML pipeline — pre-trained models, training datasets, third-party plugins, dependencies, model hubs, or CI/CD infrastructure. A single poisoned component can cascade across thousands of downstream applications.

### Real-World Incidents

- **Tool Poisoning Attacks (Spring 2025):** Invariant Labs discovered a critical vulnerability in the Model Context Protocol (MCP) enabling "Tool Poisoning Attacks" that could compromise AI agent tool integrations.
- Poisoned dependencies on model hubs have installed backdoored sentiment-analysis models across many applications.
- Compromised pre-trained models have been found containing hidden triggers that survive fine-tuning.
- Malware binaries mislabeled as "benign" in antivirus training corpora have allowed similar malware to slip past detection systems.

### Why It Matters

Modern AI development relies heavily on pre-trained models, open-source libraries, and third-party integrations. Organizations often lack visibility into the provenance and integrity of these components. The Trend Micro 2025 report found that supply chain attacks distributing malicious model updates are a growing threat vector.

### Mitigation Strategies

- Require AI-BOMs (Bill of Materials) and SBOMs for all AI components
- Pin all dependencies by cryptographic hash
- Vet suppliers and maintain an up-to-date inventory of components
- Scrutinize supplied data and models before integration
- Implement cryptographic verification of datasets and model weights
- Use zero-trust architecture for model deployment
- Monitor for anomalous behavior in production models

---

## 4. Data and Model Poisoning

**OWASP Rank:** #4 (LLM04)
**Severity:** High

### Description

Data poisoning occurs when an attacker manipulates pre-training, fine-tuning, or embedding data to introduce vulnerabilities, backdoors, or biases into the model. Model poisoning involves direct, targeted changes to model parameters themselves. Both can cause the model to produce incorrect, biased, or malicious outputs while appearing normal during standard testing.

### Real-World Incidents

- Malware binaries deliberately mislabeled as "benign" in antivirus training data, teaching the model to ignore similar threats.
- "Sleeper" behaviors injected through training data that activate only on specific trigger inputs.
- Backdoored image recognition systems that classify images incorrectly when certain patterns are present.
- Spam emails labeled as "ham" during training, causing spam filters to let similar future emails through.

### Why It Matters

Poisoned models can remain dormant and undetected until triggered, making them extremely dangerous. The lack of visibility into data curation allows attackers to inject malicious samples that compromise model integrity across the entire data lifecycle. Federated learning environments are particularly vulnerable to Byzantine attacks from colluding nodes.

### Mitigation Strategies

- Limit training data to trusted, validated sources
- Use automated tools to scan training data for abnormalities
- Implement data versioning to track changes over time
- Employ differential privacy or federated learning to limit single-data-point impact
- Use cryptographic verification of datasets
- Implement zero-trust for RAG documents
- Conduct regular model auditing and red teaming

---

## 5. Improper Output Handling

**OWASP Rank:** #5 (LLM05)
**Severity:** High

### Description

Improper output handling refers to insufficient validation, sanitization, and constraint of LLM-generated outputs before they are passed to downstream systems. When model output is treated as trusted data rather than untrusted user input, it can lead to XSS, SSRF, SQL injection, remote code execution, and other classic web vulnerabilities.

### Real-World Incidents

- An LLM hallucinating SQL like `DROP TABLE customers` passed directly to an automation layer, contaminating production databases.
- LLM-generated JavaScript rendered in webpages, triggering XSS attacks.
- LLM-created command strings executed in shells without checks, leading to RCE.
- LLM-generated SQL run directly, opening the door to SQL injection.
- 45% of AI-generated code samples included OWASP Top 10 vulnerabilities, with a 72% failure rate for newly minted Java code.

### Why It Matters

Many teams treat model outputs as trusted data when they should be treated as untrusted user input. The OWASP LLM Top 10 specifically ranks this as a distinct risk because of how commonly this mistake is made. As LLM outputs increasingly drive automation and code generation, the attack surface expands dramatically.

### Mitigation Strategies

- Treat all LLM output as untrusted user input
- Validate and sanitize all outputs before passing to downstream systems
- Sandbox execution in micro-VMs or WebAssembly
- Implement strict output encoding and escaping
- Use allowlists rather than denylists for output validation
- Apply Zero Trust security models to LLM integrations
- Implement circuit breakers for anomalous outputs

---

## 6. Excessive Agency

**OWASP Rank:** #6 (LLM06) — Rising to #3 in 2026
**Severity:** High

### Description

Excessive agency occurs when an LLM-based system is granted too much autonomy, functionality, or permission, enabling it to take real-world actions without sufficient human oversight. This vulnerability enables damaging actions to be performed in response to unexpected or ambiguous LLM outputs, regardless of whether the cause is hallucination, prompt injection, or a poorly performing model.

### Real-World Incidents

- AI agents sending sensitive data based on manipulated prompts.
- Autonomous systems deleting files or making unauthorized API calls.
- AI agents with access to deployment systems making unauthorized changes.
- The OWASP 2026 update elevated excessive agency from #6 to #3, reflecting the evolution from chatbots to agentic systems that call APIs and run code.

### Why It Matters

As AI systems evolve from simple chatbots to autonomous agents that can call tools, access databases, and execute code, the potential blast radius of any single erroneous or manipulated output grows exponentially. The OWASP Top 10 for Agentic Applications (December 2025) ranks Agent Behavior Hijacking, Tool Misuse and Exploitation, and Identity and Privilege Abuse as the top three agentic risks.

### Mitigation Strategies

- Apply the principle of least privilege to all AI agent permissions
- Implement just-in-time (JIT) ephemeral tokens for tool access
- Require human-in-the-loop (HITL) authorization for sensitive actions
- Limit the functionality, permissions, and autonomy of plugins to minimum necessary levels
- Implement automated circuit breakers for anomalous agent behavior
- Use capability-based security models
- Maintain comprehensive audit logs of all agent actions

---

## 7. System Prompt Leakage

**OWASP Rank:** #7 (LLM07)
**Severity:** Medium-High

### Description

System prompt leakage occurs when attackers extract the hidden instructions, guardrails, or embedded secrets that guide an LLM's behavior. These system prompts often contain proprietary business logic, safety rules, and configuration details that provide attackers with a roadmap for further exploitation.

### Real-World Incidents

- The "Sydney" incident where Bing Chat's full system prompt was extracted.
- Attackers using prompts like "Ignore previous instructions..." to bypass safety guardrails.
- Extraction of internal codenames, configuration details, and safety rules from production AI systems.

### Why It Matters

System prompts are the primary defense mechanism for LLM behavior. Once leaked, attackers can craft targeted attacks that bypass safety measures, understand the model's limitations, and identify paths to exploit downstream systems. Hidden context exposure expands this category to include any hidden configuration that influences model behavior.

### Mitigation Strategies

- Avoid embedding sensitive credentials or secrets in system prompts
- Implement prompt extraction detection and prevention
- Use multiple layers of defense rather than relying solely on system prompts
- Regularly test systems for prompt leakage vulnerabilities
- Implement output filtering that detects and blocks system prompt disclosure
- Use techniques like instruction hierarchy to separate system and user instructions

---

## 8. Vector and Embedding Weaknesses

**OWASP Rank:** #8 (LLM08)
**Severity:** Medium-High

### Description

Vector and embedding weaknesses affect systems that use Retrieval-Augmented Generation (RAG) and vector databases. These include lack of access control on vector stores, malicious or poisoned embeddings, embedding inversion attacks, cross-tenant data mixing, and vector collision attacks.

### Real-World Incidents

- Malicious documents injected into RAG knowledge bases, causing LLMs to retrieve and act on poisoned context.
- Cross-tenant data mixing in shared vector databases, exposing one user's data to another.
- Embedding inversion attacks reconstructing original text from vector representations.
- Vector collision attacks where one embedding tricks the system into retrieving a different document.

### Why It Matters

RAG systems are becoming the dominant architecture for enterprise AI, combining LLMs with live data stores. The vector databases that power RAG were not designed with security as a primary concern, creating novel attack surfaces. Poisoned retrieval data can manipulate LLM outputs without ever touching the model itself.

### Mitigation Strategies

- Implement strict access controls on vector stores
- Segment memory and vector data per tenant
- Track data provenance for all embedded documents
- Implement zero-trust for RAG document ingestion
- Use cryptographic verification of vector store contents
- Regularly audit vector databases for poisoned or manipulated embeddings
- Implement embedding inversion detection

---

## 9. Misinformation and Hallucination

**OWASP Rank:** #9 (LLM09)
**Severity:** Medium

### Description

Misinformation from LLMs poses a core vulnerability for applications relying on accurate outputs. LLMs can generate content that is factually incorrect, inappropriate, or unsafe — often with high confidence and authoritative tone. When users or downstream systems act on this false information without verification, it can lead to harmful decisions.

### Real-World Incidents

- AI systems generating fake legal cases that were cited in court filings.
- Medical AI systems providing incorrect treatment recommendations.
- Financial AI systems generating inaccurate market analysis.
- Deepfake fraud: A finance worker at British engineering giant Arup made 15 wire transfers totaling $25.6 million after a video conference with AI-generated deepfake colleagues.
- UC San Diego researchers demonstrated adversarial perturbations that bypass deepfake detectors with 86% success rates.

### Why It Matters

Unlike traditional software bugs, hallucinations are inherent to how LLMs generate text. They cannot be fully eliminated, only mitigated. The combination of confident tone and plausible-sounding falsehood makes misinformation particularly dangerous, especially in high-stakes domains like healthcare, finance, and legal systems.

### Mitigation Strategies

- Ground outputs with strict RAG from verified sources
- Implement confidence scoring and cross-validation
- Use multiple models for verification
- Implement human oversight for high-stakes decisions
- Deploy fact-checking and citation verification layers
- Use retrieval-augmented generation to anchor responses in verified data
- Implement clear disclaimers about AI-generated content limitations

---

## 10. Unbounded Consumption

**OWASP Rank:** #10 (LLM10)
**Severity:** Medium

### Description

Unbounded consumption refers to the risk of runaway inference costs, resource exhaustion, or denial of service caused by crafted prompts that drive excessive model computation. Attackers can exploit the fact that LLMs consume variable resources depending on input complexity, leading to financial DoS or service degradation.

### Real-World Incidents

- Flood of queries or huge prompts causing service outages.
- "Sponge" inputs designed to maximize computational cost per query.
- Automated loops that repeatedly call LLM APIs, driving costs to unsustainable levels.
- DDoS-like attacks targeting AI infrastructure, exhausting GPU resources.

### Why It Matters

LLM inference costs scale with input and output length. Unlike traditional DoS attacks that target network bandwidth, unbounded consumption attacks exploit the computational nature of AI inference. The average total cost of a data breach rose to $4.44 million in 2025, with high shadow AI usage increasing breach costs by $670,000 per breach on average.

### Mitigation Strategies

- Enforce strict API rate limits per user and IP address
- Implement hard cost ceilings and budgets
- Deploy automated circuit breakers for anomalous usage patterns
- Validate and sanitize inputs to prevent resource-exhausting prompts
- Continuously monitor resource usage for suspicious spikes
- Implement tiered access with different resource quotas
- Use input length limits and complexity scoring

---

## Summary Table

| Rank | Vulnerability | OWASP ID | Severity | Primary Attack Vector |
|------|--------------|----------|----------|----------------------|
| 1 | Prompt Injection | LLM01 | Critical | Malicious user input |
| 2 | Sensitive Information Disclosure | LLM02 | Critical | Data extraction |
| 3 | Supply Chain Vulnerabilities | LLM03 | High | Compromised components |
| 4 | Data and Model Poisoning | LLM04 | High | Training data manipulation |
| 5 | Improper Output Handling | LLM05 | High | Unvalidated outputs |
| 6 | Excessive Agency | LLM06 | High | Over-permissioned agents |
| 7 | System Prompt Leakage | LLM07 | Medium-High | Prompt extraction |
| 8 | Vector and Embedding Weaknesses | LLM08 | Medium-High | RAG/vector DB attacks |
| 9 | Misinformation and Hallucination | LLM09 | Medium | Inherent model behavior |
| 10 | Unbounded Consumption | LLM10 | Medium | Resource exhaustion |

---

## Key Frameworks and References

- **OWASP Top 10 for LLM Applications (2025/2026)** — The definitive industry framework for AI security risks
- **OWASP Top 10 for Agentic Applications (2025)** — Covers emerging agentic AI threats
- **NIST AI Risk Management Framework (AI RMF)** — Government standard for AI risk management
- **MITRE ATLAS (Adversarial Threat Landscape for AI Systems)** — Knowledge base of real-world AI attacks
- **Google SAIF (Secure AI Framework)** — Google's approach to AI security
- **IBM Cost of a Data Breach Report 2025** — Statistical data on AI-related breaches
- **Trend Micro TrendAI State of AI Security Report (2H 2025)** — CWE trends across the AI stack

---

## Sources

1. OWASP GenAI Security Project — [LLM Top 10 2025](https://genai.owasp.org/llm-top-10/)
2. OWASP GenAI Security Project — [LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
3. Mindgard — [Top 10 AI Security Risks of 2026](https://mindgard.ai/blog/top-ai-security-risks)
4. SentinelOne — [Top 14 AI Security Risks in 2026](https://www.sentinelone.com/cybersecurity-101/data-and-ai/ai-security-risks/)
5. Cloudflare — [OWASP Top 10 Risks for LLMs](https://www.cloudflare.com/learning/ai/owasp-top-10-risks-for-llms/)
6. Trend Micro — [Fault Lines in the AI Ecosystem: State of AI Security Report](https://www.trendmicro.com/vinfo/us/security/news/threat-landscape/fault-lines-in-the-ai-ecosystem-trendai-state-of-ai-security-report)
7. Bugcrowd — [OWASP Top 10: Security Threats Facing AI Systems](https://www.bugcrowd.com/blog/owasp-top-10-security-threats-facing-ai-systems/)
8. CSO Online — [10 Most Critical LLM Vulnerabilities](https://www.csoonline.com/article/575497/owasp-lists-10-most-critical-large-language-model-vulnerabilities.html)
9. ZDNet — [4 Critical AI Vulnerabilities Being Exploited](https://www.zdnet.com/article/ai-security-threats-2026-overview/)
10. Cycode — [Top AI Security Vulnerabilities 2026](https://cycode.com/blog/ai-security-vulnerabilities/)
11. HackTricks — [AI Risk Frameworks](https://github.com/hacktricks-wiki/hacktricks/blob/master/src/AI/AI-Risk-Frameworks.md)
12. BrightDefense — [OWASP Top 10 LLM & Gen AI Vulnerabilities in 2026](https://www.brightdefense.com/resources/owasp-top-10-llm/)
13. Cohere — [The State of AI Security](https://cohere.com/blog/the-state-of-ai-security)
14. Cyberleveling — [Top 10 Vulnerabilities in AI Systems on the Web](https://cyberleveling.com/blog/top-10-vulnerabilities-ai-systems-web)
15. Alex Ewerlof — [OWASP Top 10 Agents & AI Vulnerabilities Cheat Sheet](https://blog.alexewerlof.com/p/owasp-top-10-ai-llm-agents)

---

*Report generated on September 27, 2026. This report is intended for educational and defensive security purposes only.*
