# OMO Plugin Alternatives for OpenCode v2 — Comprehensive Report

**Date:** 2026-09-28
**Context:** `oh-my-openagent@5.0.1` (OMO) is incompatible with OpenCode v2 due to a fundamental plugin API rewrite. This report identifies and evaluates all viable alternatives to restore OMO functionality on OpenCode v2.
**Method:** Research via Exa web search, GitHub repo analysis, OpenCode official v2 documentation, and community fork repositories. Cross-referenced with existing local reports (`oh-my-openagent-plugin-failure-2026-09-28.md`, `omo-functionality-in-opencode-2026-09-28.md`).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Background: What OMO Provided](#2-background-what-omo-provided)
3. [Why OMO Is Incompatible with OpenCode v2](#3-why-omo-is-incompatible-with-opencode-v2)
4. [Alternative 1: oh-my-opencode-slim (Community Dual-Host Fork)](#4-alternative-1-oh-my-opencode-slim-community-dual-host-fork)
5. [Alternative 2: OMO Native / Senpi Edition (Standalone)](#5-alternative-2-omo-native--senpi-edition-standalone)
6. [Alternative 3: Native OpenCode v2 Features (No Plugin)](#6-alternative-3-native-opencode-v2-features-no-plugin)
7. [Alternative 4: opencode-orchestrator-kit (Zero-Plugin Multi-Agent)](#7-alternative-4-opencode-orchestrator-kit-zero-plugin-multi-agent)
8. [Alternative 5: LazyCodex (Codex CLI Migration)](#8-alternative-5-lazycodex-codex-cli-migration)
9. [Alternative 6: Manual V2 Plugin Port](#9-alternative-6-manual-v2-plugin-port)
10. [Comparison Matrix](#10-comparison-matrix)
11. [Recommendation](#11-recommendation)
12. [Installation Guides](#12-installation-guides)
13. [Sources](#13-sources)

---

## 1. Executive Summary

> **TL;DR:** OMO (Oh My OpenAgent) cannot run on OpenCode v2 — the plugin API was completely rewritten. There are **three practical paths** forward: (1) install `oh-my-opencode-slim`, a community fork that works on both v1 and v2 (~90% parity); (2) switch to OMO Native (`omo-ai`), a standalone command with OMO built in; (3) recreate OMO functionality using native v2 features (agents, subagent tool, commands, skills, MCPs). A fourth option — `opencode-orchestrator-kit` — provides multi-agent orchestration with zero plugins.

| Alternative | Effort | v2 Compatibility | Feature Parity | Best For |
|---|---|---|---|---|
| **oh-my-opencode-slim** | Low (one install) | ✅ Native v2 | ~90% | Want OMO experience on v2 now |
| **OMO Native (Senpi)** | Low (one install) | ✅ Standalone | 100% (standalone) | Willing to leave OpenCode |
| **Native v2 features** | Medium (config work) | ✅ Built-in | ~70% | Want zero plugins |
| **opencode-orchestrator-kit** | Low (copy files) | ✅ Built-in | ~60% | Want orchestration without OMO |
| **LazyCodex** | Low | ❌ Codex CLI only | ~60% | Willing to switch to Codex CLI |
| **Manual V2 port** | High (dev work) | ✅ If done right | Varies | Need specific OMO features |
| **Stay on OpenCode v1** | None | N/A | 100% | Not ready to migrate |

---

## 2. Background: What OMO Provided

OMO (Oh My OpenAgent, formerly Oh My OpenCode) is a batteries-included AI agent orchestration harness created by `code-yeongyu`. It extends a host agent (OpenCode, Codex CLI) with:

| Category | Features |
|---|---|
| **Orchestration** | Sisyphus (main orchestrator), Atlas (todo driver), category-based task delegation, parallel background agents, Team Mode (lead + 8 parallel members), `mass ulw` DAG execution |
| **Planning** | Prometheus (interview planner), Metis (gap analysis), Momus (ruthless review), dual-gate approval, Boulder state tracking, phased todo discipline |
| **Execution** | Hephaestus (deep worker), Sisyphus-Junior (contractor), Ultrawork keyword mode, Ralph loop (`/ulw-loop` until 100%), worktree discipline |
| **Model Routing** | Category presets (quick/deep/ultrabrain/visual/writing), per-agent model assignment, fallback chains, provider priority, per-agent temperature |
| **Context** | `/init-deep` hierarchical AGENTS.md generation, walk-up injection, conditional rules, Kibitzer memory sidecar |
| **Tools** | Hashline (hash-anchored edits), LSP (diagnostics/symbols/references/rename), AST-grep, git-bash, tmux integration, background output wait |
| **MCPs** | Built-in: Exa websearch, Context7, grep.app, LSP — runtime-injected invisibly |
| **Skills/Hooks** | ~17 shared skills, 20+ lifecycle hooks, Claude Code compatibility shims |
| **Slash Commands** | `/deepwork`, `/reflect`, `/loop`, `/goal`, `/preset`, `/interview`, `/ulw-plan` |

---

## 3. Why OMO Is Incompatible with OpenCode v2

OpenCode v2 introduced a **completely new plugin API** that is fundamentally incompatible with v1:

| Aspect | v1 (OMO uses) | v2 (current) |
|---|---|---|
| **Export format** | `{ id, server: async (input) => Hooks }` | `Plugin.define({ id, setup(ctx) })` or `{ id, effect }` |
| **SDK client** | `input.client` (v1 SDK, nested `{path, body, query}`) | `input.client` = v2 only (flattened parameters) |
| **Hook registration** | Return hooks by string key | Register each hook on domain that owns the operation |
| **Tool registration** | Return `tool` map | `ctx.tool.transform(...)` synchronous editor |
| **Config** | Mutable global config object | Domain-specific transforms |
| **Events** | `event` callback | `ctx.event.subscribe()` |
| **Config key** | `plugin` (singular) | `plugins` (plural) |
| **Package** | `@opencode-ai/plugin` | `@opencode/plugin` |

> **Key fact:** V1 plugin implementations do not run in V2. Moving a file or renaming its config entry is not enough. The entire plugin must be rewritten. There is no compat shim — unknown key `server` is ignored, then validation fails for missing `setup`/`effect`.

The OMO team's official stance: *"We know about OpenCode v2. Our answer to it is coming, and it takes time. Until then, please run OmO Native."*

---

## 4. Alternative 1: oh-my-opencode-slim (Community Dual-Host Fork)

**Repository:** `alvinunreal/oh-my-opencode-slim` (8,597 stars, MIT License)
**Website:** `ohmyopencodeslim.com`

### What It Is

A community-maintained fork of OMO that ships **dual v1/v2 compatibility** from a single package. The default export is `{ id, server, setup }` — v1 loads `server` (classic plugin function), v2 loads `setup` (promise-plugin adapter).

### v2 Feature Matrix

| Capability | v2 Support | Notes |
|---|---|---|
| Orchestrator + 7 specialist agents | ✅ | Orchestrator, Explorer, Oracle, Council, Librarian, Designer, Fixer |
| Delegation + background jobs | ✅ | Via `subagent` tool bridged into background job board |
| Built-in tools (AST-grep, webfetch, LSP) | ✅ | Self-contained `./server` build |
| Slash commands (`/deepwork`, `/reflect`, `/loop`) | ✅ | All ported |
| Message transforms | ✅ | System-prompt and message transforms |
| Event handling | ✅ | Via `ctx.event.subscribe()` |
| Built-in MCPs | ✅ | Via `ctx.mcp.transform` |
| Foreground model fallback | ✅ | Via `session.switchModel` |
| `/preset` switcher | ✅ | TUI plugin entry |
| Council (parallel model voting) | ✅ | `@council` command |
| Companion app | ✅ | Floating desktop window |
| Multiplexer (tmux/zellij) | ❌ | By design — v2 has native subagent UX |
| Orchestrator-wake scheduler | ❌ | v1-only |

### Installation

```bash
# Using bun (recommended)
bunx oh-my-opencode-slim@latest install

# Using npx (alternative)
npx oh-my-opencode-slim@latest install
```

Or manually in `~/.config/opencode/opencode.json`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["oh-my-opencode-slim@2.2.25"]
}
```

> **Note:** v2 auto-refreshes unpinned plugins on startup. Pin an exact version while both v2 and this adapter evolve quickly.

### Pros & Cons

| Pros | Cons |
|---|---|
| ✅ One-command install | ❌ Community-maintained (not official OMO) |
| ✅ ~90% feature parity on v2 | ❌ No multiplexer/tmux integration |
| ✅ Dual v1/v2 from same package | ❌ No orchestrator-wake scheduler |
| ✅ Active development (1,005 contributions from maintainer) | ❌ Some features unverified on latest v2 |
| ✅ Council mode (parallel model voting) | |
| ✅ Companion app included | |

---

## 5. Alternative 2: OMO Native / Senpi Edition (Standalone)

**Repository:** `code-yeongyu/oh-my-openagent` (68,300 stars)
**Website:** `omo.dev`
**npm:** `omo-ai@beta` (beta channel only — bare `omo-ai` fails by design)

### What It Is

The OMO team's official answer to v2: a **standalone `omo` command** that doesn't depend on OpenCode at all. It runs on the Senpi engine (a fork of Pi) with OMO built in — no plugin registration, no host dependency.

### Features

- Full OMO experience: all agents, orchestration, planning, execution
- Memory system, CodeMode, multi-model work
- Browser automation (`omowright`)
- Mass ulw DAGs
- `omo setup` migrates config from OpenCode (API keys, providers, MCPs, skills, models)
- `omo doctor` checks system readiness
- State stored under `~/.omo/agent/`

### Installation

```bash
# Install (beta tag is mandatory)
npm i -g omo-ai@beta

# Or with bun
bun add -g omo-ai

# First run
omo setup
omo doctor
omo
```

### v5.0.0 Stable Release

As of v5.0.0, OMO Native is stable and installable from npm's default channel (no `@beta` tag needed):

```bash
bun add -g omo-ai
```

The OMO team recommends removing the old OpenCode v1 plugin and LazyCodex, as new features land in OMO Native first and some never reach the plugins.

### Pros & Cons

| Pros | Cons |
|---|---|
| ✅ 100% OMO feature parity | ❌ Not OpenCode — separate command |
| ✅ Official OMO team product | ❌ Beta channel (pre-5.0.0) |
| ✅ No host dependency | ❌ Different TUI/UX from OpenCode |
| ✅ Config migration from OpenCode | ❌ Separate state/config directory |
| ✅ Active development | ❌ Beta stability concerns |

---

## 6. Alternative 3: Native OpenCode v2 Features (No Plugin)

### What You Can Build Natively

OpenCode v2 provides primitives that cover ~70% of OMO's functionality:

| OMO Feature | Native v2 Equivalent |
|---|---|
| Orchestration + parallel agents | `subagent` tool (foreground/background) + custom orchestrator agent |
| Planning + approval gate | `plan` agent + custom `planner`/`reviewer` subagents + plan commands |
| Model routing | Per-agent/command `model` field (no auto-fallback) |
| AGENTS.md / context | `AGENTS.md` + `instructions`/`references` in config |
| Memory sidecar | `MEMORY.md` + `memory/` dir + `recorder` skill |
| LSP/AST tools | Add via `mcp.servers` (Context7, Exa, grep.app) |
| Built-in MCPs | Declare in `mcp.servers` config |
| Skills | `.opencode/skills/<id>/SKILL.md` with `description` |
| Hooks | Encode in agent `system` prompts, or write custom v2 plugin |
| Worktrees / PR delivery | `git worktree` + `shell` + manual todos |

### Key Native Primitives

```jsonc
// opencode.jsonc — custom agents with model routing
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "orchestrator": {
      "description": "Plans, delegates in parallel, verifies — never implements directly",
      "mode": "primary",
      "system": "You are the orchestrator. Decompose, dispatch to explore/general/reviewer in parallel, verify each result, synthesize.",
      "permissions": [
        { "action": "subagent", "resource": "explore", "effect": "allow" },
        { "action": "subagent", "resource": "general", "effect": "allow" },
        { "action": "subagent", "resource": "reviewer", "effect": "allow" }
      ]
    },
    "explore-fast": {
      "description": "Cheap grep/search",
      "mode": "subagent",
      "model": "anthropic/claude-haiku-4-5"
    },
    "reviewer": {
      "description": "High-accuracy review",
      "mode": "subagent",
      "model": "openai/gpt-5.4#high"
    }
  }
}
```

### What You Lose

- `mass ulw` multi-graph autonomy, Ralph `/ulw-loop` until-100%
- Automatic fallback chains on rate limits
- Hashline safety, built-in LSP/AST tools, tmux panes
- Boulder/ledger/goal daemons, PR-lifecycle automation
- `isGptModel()` prompt auto-switching

---

## 7. Alternative 4: opencode-orchestrator-kit (Zero-Plugin Multi-Agent)

**Repository:** `NicoGenti/opencode-orchestrator-kit`

### What It Is

A cost-aware multi-agent orchestrator kit for OpenCode CLI — **no plugin required**. One routing agent (never writes code) + 14 specialized subagents, each pinned to the cheapest model that can do the job.

### Architecture

1. **Bootstrap** — `profiler` agent detects stack, scaffolds `.context/` and `plan/` directories
2. **Route** — orchestrator reads request, picks most specific specialist
3. **Delegate** — each specialist gets a 9-section task spec (Goal, Success Criteria, Scope, Safety, Inputs, Outputs, Test Plan, Verification, Edge Cases)
4. **Verify & checkpoint** — results validated, `.context/progress.md` updated, multi-phase plans advance one phase at a time

### Agent Roster

| Tier | Agents |
|---|---|
| Core routing (always installed) | `orchestrator`, `profiler`, `explorer`, `oracle`, `planner` |
| Core delivery (always installed) | `developer-fixer`, `test-engineer`, `code-reviewer`, `security` |
| Operations helpers | `build-helper`, `npm-helper`, `deploy-helper` |
| Opt-in extras | `pc-doctor` (Windows), `writer` (docs), `librarian` (docs lookups) |

### Installation

```bash
# Copy agent files to your project
# Agents live in agents/*.md, no plugin registration needed
# Works with plain `opencode` CLI
```

### Pros & Cons

| Pros | Cons |
|---|---|
| ✅ Zero plugins required | ❌ Not OMO — different agent set |
| ✅ Self-bootstraps on any repo | ❌ No OMO slash commands |
| ✅ Cost-aware model routing | ❌ No Team Mode or multiplexer |
| ✅ 9-section task specs for quality | ❌ Smaller community |
| ✅ Works with plain `opencode` CLI | |

---

## 8. Alternative 5: LazyCodex (Codex CLI Migration)

**npm:** `lazycodex-ai`

### What Is

Portable OMO components packaged for OpenAI Codex CLI's plugin system. Includes: rules, comment-checker, git-bash, LSP, ultrawork, ulw-loop, telemetry, plus plugin-scoped MCPs for grep_app, context7, codegraph, git_bash, and lsp.

### Installation

```bash
npx lazycodex-ai install
```

### Pros & Cons

| Pros | Cons |
|---|---|
| ✅ OMO components on Codex CLI | ❌ Not OpenCode — requires Codex CLI |
| ✅ Easy install | ❌ No agent orchestration (Codex CLI's own surface does that) |
| ✅ Active development | ❌ ~60% of OMO functionality |

---

## 9. Alternative 6: Manual V2 Plugin Port

### What It Involves

Rewriting OMO's plugin code to use the v2 API:

1. **Rename** `plugin` to `plugins` in config
2. **Replace** exported plugin function with `Plugin.define({ id, setup(ctx) })`
3. **Move** initialization into `setup`
4. **Register hooks** via domain-specific methods (`ctx.tool.hook()`, `ctx.session.hook()`, etc.)
5. **Use transforms** instead of returning config/tool changes
6. **Subscribe** to events via `ctx.event.subscribe()`

### V1 → V2 Hook Migration Table

| V1 Extension Point | V2 API |
|---|---|
| `event` | `ctx.event.subscribe()` |
| `dispose` | Cleanup function returned by `setup` |
| `config` | Transforms on affected domains |
| `tool` map | `ctx.tool.transform(...)` |
| `auth` | `ctx.integration.transform(...)` |
| `provider` | `ctx.catalog.transform(...)` |
| `chat.message` | `ctx.session.hook("prompt", ...)` |
| `chat.params` | `ctx.session.hook("context", ...)` |
| `permission.ask` | `ctx.permission.hook("evaluate", ...)` |
| `tool.execute.before` | `ctx.tool.hook("execute.before", ...)` |
| `tool.execute.after` | `ctx.tool.hook("execute.after", ...)` |
| `shell.env` | `ctx.shell.hook("create.before", ...)` |

### Dual-Host Shim Pattern

```js
export default {
  ...Plugin.define({ id: "oh-my-openagent", async setup(ctx) { /* V2 transforms */ } }),
  async server() { /* existing V1 hooks unchanged */ },
}
```

> **Reality check:** This is a significant development effort. The OMO team has not completed it despite months of community requests. Only pursue this if you need specific OMO features and have development resources.

---

## 10. Comparison Matrix

| Feature | oh-my-opencode-slim | OMO Native (Senpi) | Native v2 | orchestrator-kit | LazyCodex | Manual Port |
|---|---|---|---|---|---|---|
| **Works on OpenCode v2** | ✅ | ❌ (standalone) | ✅ | ✅ | ❌ (Codex) | ✅ |
| **Install effort** | One command | One command | Config work | Copy files | One command | Dev project |
| **Agent orchestration** | ✅ 7 agents | ✅ 11 agents | ✅ Custom | ✅ 14 agents | ❌ | ✅ If ported |
| **Background agents** | ✅ | ✅ | ✅ `subagent` | ✅ | ❌ | ✅ If ported |
| **Model routing/fallback** | ✅ | ✅ | ⚠️ Manual | ✅ | ⚠️ | ✅ If ported |
| **Slash commands** | ✅ | ✅ | ✅ Custom | ❌ | ⚠️ | ✅ If ported |
| **LSP/AST tools** | ✅ | ✅ | ⚠️ Via MCP | ❌ | ✅ | ✅ If ported |
| **Built-in MCPs** | ✅ | ✅ | ✅ Via config | ❌ | ✅ | ✅ If ported |
| **Memory system** | ✅ | ✅ | ⚠️ Manual | ✅ `.context/` | ❌ | ✅ If ported |
| **Team Mode** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ If ported |
| **Multiplexer/tmux** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ If ported |
| **Council (model voting)** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ If ported |
| **Companion app** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ If ported |
| **Maintenance** | Community | Official OMO | You | Community | Community | You |
| **Feature parity** | ~90% | 100% | ~70% | ~60% | ~60% | Varies |

---

## 11. Recommendation

### If you want OMO on OpenCode v2 right now:

**→ Install `oh-my-opencode-slim`**

It's the only option that gives you the OMO experience (agents, orchestration, slash commands, tools) running natively on OpenCode v2 with a one-command install. ~90% parity, active development, and dual v1/v2 support.

```bash
bunx oh-my-opencode-slim@latest install
```

### If you want the full OMO experience and don't mind leaving OpenCode:

**→ Install OMO Native (`omo-ai`)**

This is the OMO team's official direction. It has 100% feature parity, active development, and config migration from OpenCode.

```bash
bunpm i -g omo-ai
omo setup
```

### If you want zero plugins and are willing to configure:

**→ Use native v2 features + opencode-orchestrator-kit**

Recreate the orchestrator pattern using native `subagent` tool, custom agents, and commands. Add `opencode-orchestrator-kit` for a zero-plugin multi-agent setup. This is the most "v2-native" approach.

### If you're not in a hurry:

**→ Stay on OpenCode v1.18.x**

OMO works perfectly on v1. The v2 plugin ecosystem is still maturing. When OMO's official v2 port ships (or `oh-my-opencode-slim` reaches 100% parity), migrate then.

---

## 12. Installation Guides

### oh-my-opencode-slim (Recommended)

```bash
# Install
bunx oh-my-opencode-slim@latest install

# Or pin a version in config
# ~/.config/opencode/opencode.json:
# { "plugins": ["oh-my-opencode-slim@2.2.25"] }

# Verify
opencode plugin list
```

### OMO Native (Senpi)

```bash
# Install (v5.0.0+ stable)
bun add -g omo-ai

# First run
omo setup
omo doctor

# Launch
omo
```

### Native v2 Orchestrator (No Plugin)

```bash
# 1. Create agent files
mkdir -p .opencode/agents .opencode/commands .opencode/skills/memory

# 2. Create orchestrator agent (see §6 for full config)
# 3. Create reviewer agent
# 4. Create planner agent
# 5. Add commands: /plan, /execute-plan, /audit
# 6. Add MCPs: context7, exa-search
# 7. Create MEMORY.md + memory skill

# See W/report/omo-functionality-in-opencode-2026-09-28.md for full recipes
```

### opencode-orchestrator-kit

```bash
# Clone and copy agent files to your project
git clone https://github.com/NicoGenti/opencode-orchestrator-kit.git
# Follow repo README for installation
```

---

## 13. Sources

### Primary Sources
- `alvinunreal/oh-my-opencode-slim` — GitHub repo, README, v2 compatibility docs
- `code-yeongyu/oh-my-openagent` — GitHub repo, v5.0.0 release notes, omo.dev docs
- `NicoGenti/opencode-orchestrator-kit` — GitHub repo, README
- OpenCode v2 official docs: `/v2/docs/build/plugins/migrate-v1`, `/v2/docs/plugins`, `/v2/docs/config`

### Community Sources
- `oh-my-openagent#8485` — V2 support tracker
- `oh-my-openagent#9107` — v2.0.18 reproduction
- `oh-my-openagent#6169` — Port timeline request
- `oh-my-openagent#8548` — Export shape issue
- `oh-my-openagent#7847` — v2 preview issues

### Local Sources
- `W/report/oh-my-openagent-plugin-failure-2026-09-28.md` — Plugin failure diagnosis
- `W/report/omo-functionality-in-opencode-2026-09-28.md` — OMO function replacement guide
- `W/report/multi-agentic-workflows-2026-09-28.md` — Multi-agent workflow execution

---

*Report generated: 2026-09-28*
*Research method: Exa web search, GitHub repo analysis, OpenCode v2 official documentation, community fork repositories*
*Total sources consulted: 15+*
