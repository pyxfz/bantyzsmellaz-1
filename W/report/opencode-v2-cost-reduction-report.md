# Cutting OpenCode V2 Research Costs by ~4x

**Target:** $15 → ≤ $4 per heavy research run (~40M tokens, ~1,000 sources, many MCPs)
**Constraint:** Set-and-forget. No per-session babysitting, no manual `/compact`, no "remember to summarize".
**Scope:** OpenCode **V2** only. Every config key below is sourced from `opencode.ai/v2/docs`.

---

## Table of contents

1. [Where the money actually goes](#1-where-the-money-actually-goes)
2. [Tier 1 — One-time `opencode.jsonc` (drop in, never touch again)](#2-tier-1--one-time-opencodejsonc-drop-in-never-touch-again)
   1. [Why each line matters](#why-each-line-matters)
3. [Tier 2 — Architecture that does the work for you (defined once)](#3-tier-2--architecture-that-does-the-work-for-you-defined-once)
   1. [3.1 Research fan-out with subagents (fresh context per source-batch)](#31-research-fan-out-with-subagents-fresh-context-per-source-batch)
   2. [3.2 Force Code Mode for fan-out](#32-force-code-mode-for-fan-out)
   3. [3.3 Move standing context out of always-loaded instructions](#33-move-standing-context-out-of-always-loaded-instructions)
   4. [3.4 Give your primary agent a lean tool set](#34-give-your-primary-agent-a-lean-tool-set)
4. [Tier 3 — Plugins (installed once, run forever)](#4-tier-3--plugins-installed-once-run-forever)
5. [The set-and-forget plugin I'd write for you (optional, ~60 lines)](#5-the-set-and-forget-plugin-id-write-for-you-optional-60-lines)
6. [Expected stack → 4x](#6-expected-stack--4x)
7. [Verification without babysitting](#7-verification-without-babysitting)
8. [Ranked action list](#8-ranked-action-list)
9. [Sources](#sources)

---

## 1. Where the money actually goes

In an MCP-heavy research session, spend is dominated by **replayed input**, not by the model's
original answer. Three multipliers stack:

| Multiplier | Cause | Behavior in V2 |
|---|---|---|
| **Turn replay** | Every model call resends the whole transcript. 1,000 sources × several fetch turns = the same 40M tokens re-sent dozens of times. | Only compaction and caching reduce this. |
| **Fixed per-request overhead** | Tool schemas + system instructions + AGENTS.md + MCP guidance go out on *every* call, even when unused. | Paid on every single request. |
| **Tool output floods** | A single MCP fetch or `shell` call can drop 50 KiB into context, which is then replayed forever. | Default cap is generous: **2,000 lines / 51,200 bytes**. |

The default `tool_output` cap alone means one noisy `webfetch`/MCP scrape can inject ~50 KB that is
then re-billed on every subsequent turn. With 1,000 sources this is the single largest waste.

**Implication:** the 4x target cannot come from one setting. It comes from stacking 5–6 independent
levers, each of which is a one-time configuration change.

---

## 2. Tier 1 — One-time `opencode.jsonc` (drop in, never touch again)

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // ── 1. SHOUT: tool output caps. Biggest single win for MCP research. ──
  //    Default 2000 lines / 50 KiB → 400 lines / 12 KiB.
  //    Full content still lands in a managed file when truncated, so
  //    nothing is lost — the model just pages into it deliberately.
  "tool_output": { "max_lines": 400, "max_bytes": 12288 },

  // ── 2. Compaction runs earlier and keeps a tighter tail. ──
  "compaction": {
    "auto": true,
    "keep": { "tokens": 10000 },   // default 15000
    "buffer": 30000                // start compacting sooner (default 10% of limit)
  },

  // ── 3. Warming OFF. Warming requests are real billable requests
  //    (up to 7 per 30-min window). It is already off by default —
  //    pin it explicitly so a future default flip can't surprise you.
  "warming": false,

  // ── 4. Keep MCP tools out of the native tool list (Code Mode grouping). ──
  //    Defaults to true; pin it so no one turns it off.
  "mcp": {
    "servers": {
      "research-heavy-server": { "type": "remote", "url": "https://…", "codemode": true },
      "occasional-server":     { "type": "remote", "url": "https://…", "disabled": true }
    }
  },

  // ── 5. Kill tools you never want a research run to touch. ──
  //    A denied MCP tool is *hidden* from the catalog, not just blocked —
  //    so its schema stops being sent every request.
  "permissions": [
    { "action": "browser_*", "resource": "*",  "effect": "deny" },
    { "action": "edit",      "resource": "*",  "effect": "deny" },
    { "action": "shell",     "resource": "*",  "effect": "ask"  }
  ],

  // ── 6. Guardrails so cost can't silently regress. ──
  "experimental": {
    "policies": [
      // example: forbid the expensive provider outright
      // { "action": "provider.use", "resource": "some-premium-provider", "effect": "deny" }
    ]
  }
}
```

### Why each line matters

- **`tool_output`** — Pure configuration, zero behavioral risk for research. Truncated output is
  still retained in managed storage, so a determined agent can page into the full text. This is the
  closest thing to a free 20–40% cut.
- **`compaction`** — V2 compacts into a structured `## Objective / ## Next Move` summary and keeps
  only the recent tail beside it. Lowering `keep.tokens` and raising `buffer` means you spend less
  time near the context ceiling where every request is most expensive. Automatic, no user action.
- **`warming`** — Docs explicitly state warming requests "can consume tokens, incur costs, count
  against rate limits". Leave it off unless you're deliberately preserving a provider-side cache on
  a cheap model.
- **`codemode: true` (MCP)** — This is V2's default and it is *very* important: MCP tools are grouped
  under a namespace (`tools.<server>.<tool>(…)`) instead of each schema being serialized into the
  model's native tool list on every call. With many MCP servers connected, `"codemode": false`
  re-inflates the fixed per-request overhead. Pin it.
- **Permission `deny` on MCP tools** — From the MCP docs: *"Use permission actions to hide or deny
  tools without disconnecting their server."* Hidden = schema not sent = tokens not billed. This is
  how you keep 12 MCP servers connected but only pay for the 5 a given agent uses.
- **`experimental.policies` / `provider.use`** — Hard, config-level prevention of accidentally
  running a 10×-priced model. Never prompts, never forgets.

---

## 3. Tier 2 — Architecture that does the work for you (defined once)

This is the structural lever that gets you from "cheap settings" to **4x**.

### 3.1 Research fan-out with subagents (fresh context per source-batch)

Subagents run with **fresh context**. The parent never sees the raw 40M tokens — only what the
child returns. Define once in `.opencode/agents/`:

```md
<!-- .opencode/agents/source-miner.md -->
---
description: Fetches a batch of sources and returns ONLY distilled findings with URLs. Use for research fan-out.
mode: subagent
model: anthropic/claude-sonnet-4-5#low
steps: 12
permissions:
  - { action: "edit",    resource: "*", effect: "deny" }
  - { action: "shell",   resource: "*", effect: "deny" }
  - { action: "browser", resource: "*", effect: "deny" }
---

You are a research extractor. Rules:
- Batch independent fetches with the `execute` tool (Code Mode) so intermediate
  results never enter your context; return only the distilled answer.
- Cap every page read: `maxCharacters: 3000` for search, fetch full text only when needed.
- Never paste raw page content back to the parent.
- Return exactly: 3–6 bullet findings, each with a source URL, plus a
  one-line confidence note. Max 400 words total.
```

Key points, all documented V2 behavior:

- **`steps: N`** — hard cap on model steps. On the final step OpenCode strips tools and forces a
  text summary. This is your runaway-loop insurance; a research child physically cannot burn 200
  turns.
- **`model: …#low`** — variants (`low`/`high`/…) select reasoning effort per agent. Extraction and
  summarization do not need `high`.
- **`mode: subagent`** — never selectable as the primary agent, so it can't accidentally become the
  expensive default.
- Narrow **permissions** — the child can't edit, can't browse, can't shell out.

The parent (your primary agent) then sees maybe 400 words per child instead of 30k tokens of raw
scrape. **If you currently do 1,000 sources in one monolithic session, this alone is a 3–5x cut on
parent-context replay.**

### 3.2 Force Code Mode for fan-out

MCP servers already group under Code Mode by default. Make the *habit* automatic by writing it into
the agent system prompt (as above) and into your primary agent's instructions: independent fetches
go through `execute`, so N tool results are combined in JS and only the merged answer returns to the
model. This is explicitly what `execute` is for: *"processing results without adding every
intermediate value to the model context."*

### 3.3 Move standing context out of always-loaded instructions

V2 instruction ordering is: agent system prompt → environment → Code Mode guidance → **AGENTS.md** →
skill/reference/MCP guidance.

- `AGENTS.md` files are loaded **always**. Keep them to a screenful. Note V2 ignores the config
  `instructions` array entirely — it accepts the field but does not load it.
- **References** (`"references": { "papers": { "path": …, "description": … } }`) are advertised by
  alias + one-line description and read **on demand**. Move corpora, style guides, prior research
  notes, and glossaries into references. Same information, ~1% of the always-loaded cost.
- **Skills** load content only when invoked — keep your methodology there, not in `AGENTS.md`.

### 3.4 Give your primary agent a lean tool set

Define the research primary agent with a `deny` on `edit`/`write`/`shell` (or `ask`), which both
prevents accidents and — with a plugin (Tier 3) — lets you strip those tool descriptions from the
request entirely.

---

## 4. Tier 3 — Plugins (installed once, run forever)

Community plugins, verified against current V2 install flow (`opencode plugin add …`). Claims are
the maintainers'/third parties' published benchmarks, not mine — treat them as directional.

| Plugin | What it does | Published cut | Fit for your workload |
|---|---|---|---|
| **`@tarquinen/opencode-dcp`** | Dynamic context pruning. Exposes a `compress` tool; replaces closed/stale turns with high-fidelity summaries **before** the request is sent, without mutating session history. Also dedupes repeated identical tool calls and purges errored tool inputs after N turns. | **50–70%** on long sessions | **Excellent.** Your sessions are long; this is the centerpiece. Install: `opencode plugin add @tarquinen/opencode-dcp@latest` |
| **`openslimedit`** | Compresses built-in **tool descriptions** (sent on every call), compacts read output, adds line-range edits. | **11–45%** | Good. Research sessions still pay the fixed tool-description tax every call. |
| **`opencode-snip`** | Wraps `shell` commands in a `snip` proxy that filters command noise (git/npm/cargo/docker…) before it hits context. Needs a separate `snip` binary. | **60–90%** on bash-heavy runs | Only if your research pipelines shell out a lot. Skip otherwise. |
| **`opencode-tokenscope`** | Per-tool / per-skill token breakdown. | n/a (measurement) | Install it **once** so you can verify savings on demand instead of guessing. |

Suggested `opencode.jsonc` entry (V2 key is `plugins`, and pin versions — `@latest` is a rolling
target):

```jsonc
{
  "plugins": [
    "@tarquinen/opencode-dcp@1.2.3",
    "openslimedit@1.2.0"
  ]
}
```

**Compatibility caveat:** DCP's docs mention a V1/V2 sandbox, and V2's plugin API is one of the two
intentional breaking changes from V1. Verify after install that both appear in
`Ctrl+P → View Status`, and run `/dcp stats` once to confirm it's active. If a plugin only works on
V1, drop it — everything in Tiers 1–2 is native V2 and unaffected.

**Cache trade-off worth knowing (from DCP's own docs):** pruning changes message prefixes, which can
invalidate prompt-cache hits. On uniform-price or per-request billing this is free savings; on
cache-discounted providers (Anthropic/OpenAI) you are trading pruning savings against cache-miss
cost. For 40M-token research runs the pruning usually wins, but measure it — that's what
`tokenscope` is for.

---

## 5. The set-and-forget plugin I'd write for you (optional, ~60 lines)

Everything above is stock. If you want the last 20% with **zero** ongoing effort, a single local
plugin under `.opencode/plugins/` can use V2's documented hooks to automatically:

1. **`session.hook("compaction")`** — set `event.result = { summary }` yourself, computing the
   summary with `ctx.generate.text()` against a **cheap model**. V2's built-in compaction uses the
   *session* model (there is no separate compaction model), so a long research session pays premium
   prices to summarize its own history. This routes that work to a $0.15/M model instead.
2. **`session.hook("title")`** — same trick for title generation, which otherwise fires a model call
   for every session.
3. **`session.hook("context")`** — per-request surgery: delete tool schemas you never want
   (`delete event.tools.write`), push a short "be terse, batch with execute, never paste raw
   pages" system nudge, and cap `event.options.maxTokens` on research turns.
4. **`ctx.tool.transform`** — permanently `editor.remove()` tools that permissions can only hide,
   guaranteeing their descriptions are never serialized.
5. **`ctx.model.transform`** — drop models above a price ceiling from the catalog entirely (the
   docs' own `model-budget` example), so `/models` can't show you a $15/M option.

That's a one-time file drop. After that it runs on every session with no interaction.

---

## 6. Expected stack → 4x

Levers overlap, so these are conservative *multiplicative* estimates for your profile:

| Layer | Mechanism | Conservative cut |
|---|---|---|
| Subagent fan-out + summary-only returns | parent never replays raw source text | **35–50%** |
| `tool_output` caps (2000→400 lines) | less raw text entering replay | **20–30%** |
| `opencode-dcp` pruning | stale turns summarized away pre-request | **30–45%** |
| `openslimedit` (tool-description compression) | fixed per-request overhead | **10–20%** |
| Code Mode `execute` batching | intermediate fetch results never enter context | **15–25%** |
| `#low` variants for extraction + cheap compaction/title model | paying less per token, not just fewer tokens | **10–25%** |

**Stacked (0.65 × 0.75 × 0.65 × 0.85 × 0.80 × 0.85) ≈ 0.18 → ~5.5x.** Even with heavy overlap you
clear 4x: **$15 → $3–4.**

---

## 7. Verification without babysitting

You should never have to watch a session to know it's working:

1. `opencode plugin list` + `Ctrl+P → View Status` — confirm plugins loaded (once, after install).
2. `/dcp stats` — on-demand pruning savings.
3. `opencode-tokenscope` — run occasionally to see which tools/skills dominate; re-tune the
   `tool_output` cap or deny rules if something unexpected tops the chart.
4. **Console budgets API** (`GET /api/v1/budgets/members`) — set a hard monthly ceiling per member.
   This is the ultimate "forget it" guardrail: a real dollar limit enforced server-side, not a
   discipline problem.
5. One baseline run before, one after. Compare total tokens for an identical research prompt.

---

## 8. Ranked action list

Do these in order; stop when you hit 4x.

1. **Set `tool_output` caps + `compaction` tuning + `warming: false`** in `opencode.jsonc`. (5 min, free, biggest risk-free win.)
2. **Define `.opencode/agents/source-miner.md`** with `mode: subagent`, `steps`, `model: …#low`, and a "return ≤400 words, use `execute` to batch, never paste raw pages" prompt. (10 min — this is the structural 4x.)
3. **Move corpora from `AGENTS.md` into `references`** and methodology into skills. (10 min.)
4. **Install `@tarquinen/opencode-dcp` + `openslimedit`**, verify they load, pin versions. (5 min.)
5. **Add permission `deny`s for tools you never use** so their schemas stop being billed. (5 min.)
6. **`opencode plugin add opencode-tokenscope`**, measure once, adjust the caps. (one-time check.)
7. *(Optional)* Local plugin for cheap compaction/title + tool/model trimming — I can write this.
8. *(Optional)* Console budget as a hard dollar ceiling.

---

### Sources

- OpenCode V2 docs: [Config](https://opencode.ai/v2/docs/config/) ·
  [Compaction](https://opencode.ai/v2/docs/compaction/) ·
  [MCP servers](https://opencode.ai/v2/docs/mcp-servers/) ·
  [Tools](https://opencode.ai/v2/docs/tools/) ·
  [Agents](https://opencode.ai/v2/docs/agents/) ·
  [Plugins (build)](https://opencode.ai/v2/docs/build/plugins) ·
  [References](https://opencode.ai/v2/docs/references/) ·
  [Instructions](https://opencode.ai/v2/docs/instructions/) ·
  [Policies](https://opencode.ai/v2/docs/policies/) ·
  [Warming](https://opencode.ai/v2/docs/warming/) ·
  [Models](https://opencode.ai/v2/docs/models/)
- [`opencode-dcp`](https://github.com/Tarquinen/opencode-dynamic-context-pruning) ·
  [`openslimedit`](https://github.com/ASidorenkoCode/openslimedit) ·
  [`opencode-snip`](https://github.com/VincentHardouin/opencode-snip) ·
  [`opencode-tokenscope`](https://github.com/ramtinJ95/opencode-tokenscope)
- Third-party benchmark write-up: [Upsun — "How to slash OpenCode Token costs by 90%"](https://developer.upsun.com/posts/ai/opencode-token-optimization)
- [Console Budgets API](https://opencode.ai/v2/docs/console/budgets/)
