---
title: "12. DreadNode — Agent Infrastructure"
description: "What DreadNode is, what it does, how to run it in a consultancy, and whether the credits math works."
sidebar:
  label: "12. DreadNode"
---

> **One-line answer:** DreadNode (`https://dreadnode.io/`) is **not another LLM** like CyberKimi or
> Abliteration. It is the **operating system around the LLM** — sandboxed hacker agents + evals +
> evidence trail + self-hosting — that lets you run *any* model (including the three above) against
> authorized targets and prove what happened. Pricing is **Pro $0/mo pay-as-you-go (1 credit = $0.01,
> 1,000 credits per $1 inference) + Enterprise custom (annual fee + credits)**. Verdict: **yes,
> cost-effective as force-multiplier, no as bulk token provider** — keep Abliteration/OrcaRouter for
> cheap tokens, add DreadNode Pro with $25-50 credits for agentic engagements.

## 12.1 What is it exactly? (plain English + technical)

**For a non-technical client:** a supervised lab for an AI junior pentester that works at machine speed.
Isolated computers (sandboxes), a rulebook for what it may touch (Scope → Approve → Judge → Record →
Govern), a judge watching it (LLM judges for scope/cheating), and a camera recording everything (traces,
tool calls, policy decisions). You supply written authorization; every finding ships with
request/response evidence for your report.

**Technical:** "AI infrastructure for cyber operations" / "Sovereign cyber capabilities you can depend
on". Four pillars on `https://dreadnode.io/platform/` (fetched Sep 28):

1. **Operations** — ready capabilities + workflows + Workers, persistent sessions web + terminal (`dn`
   TUI).
2. **Agent Intelligence** — project memory, structured findings, datasets, post-training.
3. **Evaluations** — task evals + LLM judges + AI red-teaming (70+ strategies, 600+ transforms, 130+
   scorers).
4. **Observability** — live sessions, nested tool calls, policy decisions, cost/latency comparison.

**Sovereignty thesis:** "Own it. All of it. Run inside your boundary." Self-host on K8s/VM/air-gap, BYOK
or self-hosted models, data stays in your stores. This is the opposite of black-box renting — you keep
capabilities, data, and accumulated knowledge if you leave.

**Company:** DreadNode, founded **2023 by Will Pearce (ex-Microsoft/NVIDIA AI red-team lead) + Nick
Landers (ex-NetSPI VP Research, Dark Side Ops author)**. Operating Bozeman MT, DE corp. CEO Brad Palm.
**$14M Series A Feb 25 2025 led by Decibel + Next Frontier, In-Q-Tel (IQT), Sands, Indie VC** —
`https://dreadnode.io/company/newsroom/series-a/`. 2.0 GA Mar 24 2026 ("first complete infrastructure
platform for security agents"). Trust `https://trust.dreadnode.io/`, Status
`https://status.dreadnode.io`, Docs `https://docs.dreadnode.io`. GitHub `github.com/dreadnode` (33
repos): `rigging` 418★ (LLM framework), `dyana` 367★ (ML sandbox), `DreadGOAD` 107★ (AD lab), `ares`
84★ (red-vs-blue), `robopages` 89/37, `sdk` 30, `capabilities` 17, `burpference` (Burp LLM extension).

**Name warning:** DreadNode product is **Strikes (with k)** — evals SDK. **Strix (`usestrix/strix`,
`strix.ai`) is a separate open-source AI pentester, NOT DreadNode.** Do not conflate. Old trio
Strikes/Spyglass/**Crucible** (65+ free CTF challenges, used by CISA/PwC/Target/Intel/Bishop Fox) was
**sunset Mar 23-24 2026** after 2.5 years; successor is Resource Hub (~1,600 tasks) + capabilities
registry.

## 12.2 What it does (capabilities you would actually run)

- **AI Red Teaming:** any modality/target, algorithmic probing, safety + agentic + multilingual +
  multimodal — `https://docs.dreadnode.io/ai-red-teaming/`.
- **Web Security:** autonomous OODA-loop pentester, headless browser, **~70-84 skills** (83 playbooks
  homepage / 84 skills platform / 70+ quickstart — version drift): req-smuggling, cache poisoning, SSRF,
  SSTI, DOM, OAuth, GraphQL, auth-matrix, blind SQLi, traversal, JS analysis, Pacu AWS. Leads → findings
  only with evidence.
- **Network Operations:** discovery, AD assessment, attack-path + C2.
- **Hosted Evals + DreadIndex:** BYO envs/scorers, 76 tasks/10 cats leaderboard (Sep 2026: Claude Opus
  4.7 #1 67.1, DeepSeek-V4-Pro best value 52.2 @ $0.58/1M) —
  `https://dreadnode.io/research/dreadindex/`. Research pipeline into product: ScopeJudge (8 judges/4,897
  calls, best human-range but **missed 1-in-10 violations**), Every Model Cheats (23 tasks/1,518 traces),
  AIRTBench, Worlds (synthetic net-gen, 8B to Domain Admin on synthetic only).
- **Guardrail chain:** Scope (restrict + check) → Approve (allow/block/approval) → Judge (drift/cheating
  flags) → Record (every decision + reason) → Govern (org/workspace roles). Policy Aug 2026 argues
  open-weights + air-gapped sandboxes + standardized telemetry + safe harbor — use to justify
  isolated-lab methodology.

## 12.3 How to use it (consultancy runbook)

1. **Sign up:** `https://app.dreadnode.io/?mode=register` (browser, no install) or book demo. No OpenCode
   plugin — interop via MCP/CLI/webhook.
2. **Install (60s):** `curl -fsSL https://dreadnode.io/install.sh | bash` → `dn` → 1 browser login / 2 API
   key → `dn capability install dreadnode/web-security` → `/agent web-security` → `> test /api/v1/auth on
   https://target.example — full scope`. TUI: Ctrl+P capabilities, Ctrl+A agents, /thinking, Ctrl+O/T/B
   traces/sessions. Python: `pip install -U dreadnode` (Strikes SDK).
3. **Integrate:** MCP servers + CLI + custom capabilities
   (`https://docs.dreadnode.io/guides/building-a-capability/`); optional Caido/Burp auto-load +
   `burpference`; first-class **Slack (mention-run), HackerOne, Linear, Webhooks** via Connections
   (where) + Actions (JSON what) + human review + Staged Findings. SaaS webhooks need public HTTPS;
   private only on Enterprise/self-host.
4. **Models:** `dn/*` hosted vs BYOK (`openai/*`, `anthropic/*` on your key — **zero DreadNode
   credits**). Rates in UI `/models` or Account → Chat Models.
5. **Execute + assure:** prompt with full scope ("Django …"), agent recon → probe → exploit attempt;
   coach ("show request/response confirming it"); Esc interrupt; `report` tool →
   `~/.dreadnode/reports/*.md` + web Reports. Re-run hosted evals + judges (correctness/scope/cheating),
   compare models/versions, export traces for workpapers.
6. **Report + bill:** human reviews every payload (1-in-10 judge miss), submit via
   HackerOne/Linear/webhook. Track TUI `usage $X.XX`, Inference Usage + Transaction History; set Org
   member caps + auto-refill caps.

**SOW clause to reuse:** "All agentic testing limited to written-authorized hosts in Appendix A, from
isolated DreadNode sandboxes/runtimes with scope policies + human approval for exploit/write actions;
full traces retained; no client data used for training."

## 12.4 Is it cost-effective? (numbers)

Source of truth `https://dreadnode.io/pricing/` + `https://docs.dreadnode.io/platform/credits/` (both
fetched Sep 28):

- **Pro: $0 monthly, no commitment.** All features, unlimited seats + team mgmt, managed SaaS, Stripe
  (cards/bank/CashApp).
- **Enterprise: Custom — one-time annual fee (varies by deployment/SLA/custom work) + PAYG credits.**
  On-prem K8s/embedded VM, offline/air-gap bundles, data in your stores, dedicated engineer, custom
  capabilities.
- **Credit math: 1 credit = $0.01. 1,000 credits per $1 inference. Min 1/call. Formula
  `(in/1M*rate_in + out/1M*rate_out)*1000 round up`.** Example doc: `dn/claude-sonnet-4-6` $3/$15 → 2k
  in + 500 out = $0.0135 = **14 credits**. Rates live in UI, not static list. Sandbox **1,000 credits ≈
  5 hrs** default SaaS; telemetry + hosted search also metered. **BYOK = zero credits.**
- **Free:** historically "$25 complimentary" snippet; current "signup credits depend on eligibility" +
  anti-abuse review (one claim/personal org). Purchased credits **never expire**. Auto-refill
  threshold/qty/monthly cap; failed payment disables. Zero balance pauses durable sandboxes, stops
  ephemeral, blocks `dn/*`.
- **Data use: "No. Your data is never used for training. All eval/training/Worlds/red-team data stays
  within your org."** ToS `https://app.dreadnode.io/terms` (Feb 23 2025): limited revocable license,
  **personal non-commercial unless commercial license obtained** — a consultancy must procure
  commercial/Enterprise terms, do not rely on clickwrap.

**Verdict vs your stack:**

- Tokens are **not** cheaper than Abliteration ($5/$5) or Orca Zero ($3/$5) or Qwen ($0.33/$2.40) —
  DreadNode charges model rate *plus* MicroVM/telemetry overhead, and agentic loops burn fast (40-min
  engagement; DreadIndex runs $4.93–$1,853 in cost column). Do NOT use it as bulk token provider.
- It **is** cost-effective as **labor multiplier**: $0 entry, unlimited seats, no per-scan fee, BYOK
  arbitrage, on-prem for regulated clients, evidence/judges/traces that cut weeks→hours and survive audit
  (with human review for the 1-in-10 miss). Practical pattern: **Pro + $25-50 credits for quick
  assessments, pass through credits + analyst review time; Enterprise on-prem/air-gap + annual fee only
  for banks/gov requiring boundary control.**
- No G2/Gartner (niche/infra-stage), no Reddit review thread, GitHub modest but researcher-loved
  (rigging/dyana), press positive-nostalgic (Crucible "best learning challenges", Decibel "trusted
  partner", SecurityWeek $14M, Boschko praise, DEF CON AI Village CTFs). No material negatives found —
  small elite-loved (NVIDIA/Microsoft/Meta/Cohere/NetSPI alumni, IQT, CISA→Bishop Fox users).

**Updated recommendation:** keep the §9 stack (Abliteration $20 + Orca $30 + Adverserial $25 reserve)
and **add DreadNode Pro $0 + $25-50 credits** as 4th layer for agentic web/network/AI-red-team runs.
Route: cheap models for tokens → Adverserial for hard repro proof → DreadNode for supervised agent
execution + evals + evidence. Total starter still under ~$150/mo before client pass-through ($6k-45k/audit
anchor).
