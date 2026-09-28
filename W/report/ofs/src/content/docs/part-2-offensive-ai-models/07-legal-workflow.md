---
title: "7. Legal Workflow"
description: "How to use each vendor inside a client engagement: pre-engagement, scoping, execution, deliverable, post."
---

## 7.0 Ground rules

All three require **explicit written authorization** per target, scope-of-work, dates, IP ranges,
accounts, forbidden actions (prod data exfiltration, persistence, lateral movement beyond scope), data
handling, retest window. No authorization = ToS violation + criminal exposure. Mirror vendor
disclaimers in your MSA.

## 7.1 OrcaRouter in workflow

1. Pre-engagement: apply for `orca/orcacyber-zero-1.0` with engagement letter (component, vuln class,
   quarter). Do not script around refusal/failover to evade vetting.
2. Scoping: create workspace per client, keys scoped to `orca/orcacyber-zero-1.0` + named dual-use bases
   (`openai/gpt-5.5`, `anthropic/claude-opus-4.8` for report writing — Zero's vendors note cyber models
   write reports worse), spending caps, `orcarouter/auto` disabled for scope control.
3. Execution: vuln triage/repro across large repos (1M ctx), root-cause, red-team tooling gen, patch
   validation. Log every call (Requests + `x-orca-resolved-model` receipts). Enforce 'evaluation before
   reliance' (Terms §6).
4. Deliverable: attach token receipts, resolved-model IDs, cache HIT/MISS, guardrail triggers for audit
   defensibility. Use `orcaverify-text1.0` to check AI-assisted phishing samples if relevant.
5. Post: revoke keys, retain logs per retention policy, invoice pass-through $3/$5 + Team overhead.

## 7.2 Abliteration in workflow

1. Pre-engagement: Developer $20 key for lab, Growth $50 for team audit logs, Scale $200 ($200 credit
   included) for heavy ExploitGym runs. Do NOT use anon free-tier for client data (1 call, images only).
2. Scoping: per-client projects, scoped `ak_` keys, per-user/project quotas, independent revocation, SIEM
   via Policy Gateway (Enterprise — budget this if client requires EU Act evidence; otherwise export
   token counts/timestamps/model IDs manually).
3. Execution: CVE repro, exploit dev, malware *analysis* (not delivery), jailbreak/prompt-injection
   suites (direct PDF/email RAG exfiltration, tool-misuse coercion), synthetic phishing/harassment
   datasets for detector tuning (paid 3-row preview → HF/S3 export). Use `abliterated-model-large-v2` max
   reasoning for Exploits, `abliterated-model` base for multimodal (screenshots). Disable web
   search/fetch for client-confidential prompts (third-party retention voids zero-retention).
4. Deliverable: include authorization ID, model ID (`large-v2` GLM-5.3 FP8), reasoning mode,
   `flagged_categories`, policy decision/reason if Gateway used, plus human validation statement (vendor
   outputs may be inaccurate).
5. Post: delete generated training datasets if client requires, retain billing metadata only, suspend
   keys. Note ToS gap to client: vendor allows authorized testing but bans illegal/harmful/high-risk —
   your letter is the shield.

## 7.3 Adverserial in workflow

1. Pre-engagement: top up wallet ($25-50 reserve, Monero option if needed), create named keys per tool in
   billing dashboard; note V2 waitlist for chat, API is wallet-direct.
2. Scoping: per-client keys, independent revocation, wallet preflight ($0 = stop). Map to OWASP / ATLAS
   for report structure. Get written auth per Terms S04.
3. Execution: hard vuln repro, V8/CVE analysis (cite public transcripts as precedent), Sigma/YARA/KQL, IR
   timeline, threat-hunt hypotheses. CyberKimi for depth, CyberGLM for cheaper drafts. Streaming +
   reasoning fields for audit trail; isolated testing + human review before execution.
4. Deliverable: include model ID, cache reads, benchmark context (86.7% subset, 10/16 assisted V8
   single-seed + skepticism notes), privacy scope (billing/KV-cache retained), plus human validation
   (AS-IS, $100/12mo cap).
5. Post: revoke keys, retain billing ledger, invoice PAYG + Enterprise uplift if needed. Add
   Garak/PyRIT/Promptfoo regression between engagements.
