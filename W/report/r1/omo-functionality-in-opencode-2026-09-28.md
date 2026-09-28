# OMO Functions Removed — How to Get Them Back in Native OpenCode V2

**Date:** 2026-09-28
**Context:** `oh-my-openagent@5.0.1` removed (V1-only `{id,server}`, incompatible with OpenCode `v2.0.18`). No downgrade per owner.
**Question:** what did OMO actually do, and what is the native V2 replacement for each function?
**Method:** OMO docs + repo + agent deep-dives fetched via TinyFish/Exa (`ohmyopenagent.com/docs` → `omo.dev/docs`, `github.com/code-yeongyu/oh-my-openagent`, `glukhov.org` agent catalogue, `ulw-plan`/`ulw-execute` SKILL.md, orchestration guide); OpenCode V2 docs fetched as source of truth (`/agents/`, `/commands/`, `/tools/`, `/permissions/`, `/skills/`, `/mcp-servers/`, `/models/`, `/cli/`, `/config/`).

## 1. Executive summary

OMO was 10 systems in one package. About 70% maps cleanly to native V2 config (agents + commands + skills + MCP + models). About 30% has no one-click equivalent and needs a deliberate workflow substitute.

| OMO system | Native V2 verdict |
|---|---|
| Sisyphus/Atlas orchestration + parallel background agents | ✅ `subagent` tool (foreground/background) + custom orchestrator agent + `subagent:true` commands |
| Prometheus/Metis/Momus planning + `/ulw-plan` → `/start-work`/`/ulw-execute` | ✅ `plan` agent + custom `planner`/`reviewer` subagents + plan commands; manual approval gate |
| Category model routing + fallback chains | ⚠️ Partial — per-agent/command `model`, no auto-fallback; encode routing in prompts |
| `/init-deep` hierarchical AGENTS.md + auto-injection + conditional rules | ✅ `AGENTS.md` + `instructions`/`references` (manual, no generator) |
| Kibitzer memory sidecar | ⚠️ Partial — skill + markdown memory dir, no automatic sidecar |
| Hashline / LSP / AST-grep / tmux tools | ⚠️ Partial — `read/edit/grep/glob/shell` + MCP servers you add; no hash-anchored edits |
| Built-in MCPs (Exa websearch, Context7, grep.app, LSP) | ✅ Add them yourself in `mcp.servers` (2 minutes each) |
| Skill-embedded MCPs + OAuth | ✅ V2 MCP `oauth` + skill dirs (static config, no runtime injection) |
| Hooks (todo-continuation, compaction preserve, comment-checker, etc.) | ⚠️ Partial — bake into agent `system` prompts + `session.hook` via your own plugin, or accept manual discipline |
| Ralph loop `/ulw-loop`, `mass ulw` graphs, IntentGate keywords | ❌ No native equivalent — closest is explicit fan-out + re-prompt loops |
| Boulder/goal/todo state, `--worktree --make-pr --ship` | ⚠️ Partial — git worktrees + `shell` + manual todos; no built-in goal tracker |

If you only do three things, do these: (1) recreate `reviewer` + `planner` + `orchestrator` agents, (2) re-add the three MCPs, (3) adopt the plan-then-execute command pair below.

## 2. What OMO actually was (function inventory)

From `npm view` (`Batteries-Included … Multi-Model Orchestration, Parallel Background Agents, Crafted LSP/AST Tools`), repo package list (`rules-engine`, `delegate-core`, `ast-grep-mcp`, `git-bash-mcp`, `lsp-core`, `model-core`, `tmux-core`, `team-core`, `memory-core`, `isolation-core`, `telemetry-core`, `skills-loader-core`, `agents-md-core`, …), and docs:

**Orchestration:** Sisyphus (main, ~1,100-line Claude-mechanical prompt), Atlas (todo-list driver), `task(category)` category delegation, `call_omo_agent(name)` direct call, background parallelism with per-provider/model concurrency caps, Team Mode graphs, `mass ulw` DAG.

**Planning:** Prometheus interview planner (`/ulw-plan`, `@plan`, Tab), Metis gap analysis (high-temp), Momus ruthless review + independent Oracle review (dual gate), decision-complete plans under `.omo/plans/`, drafts under `.omo/drafts/`, Boulder state (`.omo/boulder.json`), handoff to `$start-work`/`/ulw-execute [--worktree] [--make-pr] [--ship]`.

**Execution:** Hephaestus (GPT-5.3-codex-only deep worker), Sisyphus-Junior (category-spawned contractor), Ultrawork keyword mode (`ulw`/`ultrawork` IntentGate injection), Ralph loop (`/ulw-loop` until 100%), goal + phased-todo discipline, evidence ledger, worktree discipline.

**Model routing:** categories (`visual-engineering`, `artistry`, `ultrabrain`, `deep`, `unspecified-high/low`, `quick`, `writing`, `architect`), per-agent defaults + fallback chains (e.g. Sisyphus: Opus → Kimi K2.5 → GPT-5.4 → GLM-5), provider priority (native > Kimi > Copilot > …), `isGptModel()` prompt switching (Claude-mechanical vs GPT-principled), per-agent temperature.

**Context:** `/init-deep` (generates `AGENTS.md` at every tree level), directory `AGENTS.md` walk-up auto-injection, `.claude/rules/` conditional injection by `globs`, Kibitzer cheap-model memory sidecar over git markdown repo, wisdom accumulation.

**Tools:** Hashline (`11#VK|` hash-anchored edits; Grok edit success 6.7% → 68.3%), LSP (diagnostics/symbols/references/rename), ast-grep, git-bash-mcp, tmux interactive bash, `background_output` wait, `team_*` primitives, `skill_mcp` per-session isolated clients, malformed-arg repair, batched parallel calls.

**MCPs:** Tier 1 built-in (websearch/Exa, context7, grep_app, lsp) runtime-injected (invisible to `opencode mcp list`); Tier 2 Claude `.mcp.json` loader with `${VAR}` expansion; Tier 3 skill-embedded MCPs with full OAuth 2.1 (RFC 9728/8414/8707/7591, PKCE, auto-refresh).

**Skills/hooks:** ~17 shared skills (`ulw-plan`, `ulw-execute`, `frontend-ui-ux`, …), hooks table (task-resume-info, delegate-task-retry, empty-task-response-detector, todo-continuation-enforcer, compaction-todo-preserver, unstable-agent-babysitter, comment-checker, interactive-bash-session, non-interactive-env, claude-code-hooks, …), Claude Code compat shims (commands/skills/agents/MCPs/hooks/plugins toggles).

## 3. Native replacements, function by function

### 3.1 Orchestration (Sisyphus/Atlas → parent + `subagent` tool)

Native primitive (`/tools/`): `subagent` starts a child with `{agentID, description, prompt}`, foreground (wait) or `background:true` (returns `sessionID`, notify on finish, re-prompt by ID). Depth limit 1; `general` cannot spawn.

Recreate the orchestrator as config, not code (`/agents/` + `/permissions/`):

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "orchestrator": {
      "description": "Plans, delegates in parallel, verifies — never implements directly",
      "mode": "primary",
      "system": "You are the orchestrator. Never edit code yourself. Decompose, dispatch to explore/general/reviewer in parallel, verify each result, synthesize. Every child prompt must state TASK/DELIVERABLE/SCOPE/VERIFY.",
      "permissions": [
        { "action": "subagent", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "explore", "effect": "allow" },
        { "action": "subagent", "resource": "general", "effect": "allow" },
        { "action": "subagent", "resource": "reviewer", "effect": "allow" }
      ]
    },
    "reviewer": {
      "description": "Read-only review with file+line findings",
      "mode": "subagent",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    }
  }
}
```

Usage (TUI or `opencode run`):

```text
Use the explore subagent to map the auth flow; use the general subagent to gather docs. Synthesize when both finish.
```

What you lose vs OMO: automatic `task(category)` routing, per-provider concurrency caps, `mass ulw` DAGs, Team Mode viz. Substitute with explicit parallel prompts and 2–4 children max.

### 3.2 Planning (Prometheus/Metis/Momus → plan agents + approval gate)

Native: `plan` (primary, edit-denied except `~/.opencode/plan`), custom subagents, `question` tool for interviews, commands with `agent`+`model`.

```md title=".opencode/agents/planner.md"
---
description: Interview-style planner, read-only, produces decision-complete plan
mode: subagent
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---
You are the planner. Explore read-only in parallel, ask ONLY owner-decisions via the question tool, then write ONE plan with phases, acceptance criteria, QA commands, and dependency order. Never implement. End with: approve to write plan, then run /execute-plan.
```

```md title=".opencode/commands/plan.md"
---
description: Plan without implementing
agent: planner
---
Plan $ARGUMENTS. Explore first, interview only on genuine forks, output phases + acceptance + QA. Do not implement.
```

```md title=".opencode/commands/execute-plan.md"
---
description: Execute the approved plan step by step
agent: build
---
Execute the approved plan in phases. Register todos, run tests after each phase, report evidence. Stop on ambiguity and ask.
```

Dual-review gate (Momus+Oracle substitute): add `plan-reviewer` subagent (`temperature`-like low randomness via terse prompt: "Be ruthless, OK or REJECT with reasons") and require two passes in your workflow text. No automatic enforcement — the checklist *is* the enforcement.

Boulder/goal substitute: keep `plan.md` + a `PROGRESS.md` checklist in repo; update both each turn. No `.omo/boulder.json` equivalent exists natively.

### 3.3 Model routing (categories + fallbacks → explicit per-agent models)

OMO categories were presets (`quick` → Haiku/Flash/Nano; `deep` → GPT-5.3-Codex → Opus; `ultrabrain` → GPT-5.4 xhigh; `visual-engineering` → Gemini Pro; `writing` → Flash; …) with fallback chains and provider priority. V2 has no categories and no fallback: child uses command `model` → agent `model` → parent session model (`/models/`, `/agents/`).

Translation:

```jsonc
{
  "agents": {
    "explore-fast": { "description": "Cheap grep/search", "mode": "subagent", "model": "anthropic/claude-haiku-4-5" },
    "reviewer": { "description": "High-accuracy review", "mode": "subagent", "model": "openai/gpt-5.4#high" },
    "writer": { "description": "Docs/prose", "mode": "subagent", "model": "google/gemini-3-flash" }
  },
  "commands": {
    "deep-task": { "template": "Do $ARGUMENTS thoroughly.", "agent": "general", "model": "openai/gpt-5.4#high", "subagent": true }
  }
}
```

Also: per-model `#variant` (`#low/#high/#max` where catalog supports it), custom `providers.*.models.*.variants` with `reasoningEffort`, and `opencode run --model …` for one-shot overrides. For rate-limit resilience OMO had (foreground fallback), V2 has none — new session or manual `/models` switch is the procedure.

Prompt-family lesson from OMO (Claude-mechanical vs GPT-principled) still applies: keep Claude subagent `system` detailed/checklisted, GPT ones concise/principled. `isGptModel()` auto-switching has no native equivalent — maintain two agent files if you mix families.

### 3.4 Context (init-deep / AGENTS.md / rules / memory)

| OMO | Native |
|---|---|
| `/init-deep` generator | ❌ None — author `AGENTS.md` by hand per directory; keep each scoped (project → src → component) |
| Walk-up `AGENTS.md` injection | ✅ Native project instructions (`AGENTS.md`); use `instructions` + `references` in config for extra paths |
| `.claude/rules` conditional by globs | ⚠️ Emulate with skills: one skill per domain with clear `description` so model loads it only when relevant |
| Kibitzer memory sidecar | ⚠️ Emulate: `MEMORY.md` + `memory/` dir + a `recorder` skill ("append learnings, read before starting"); no automatic nudges |

Minimal memory skill:

```markdown title=".opencode/skills/memory/SKILL.md"
---
name: Memory
description: Record and recall durable project learnings
---
Before starting, read MEMORY.md and memory/*.md. After finishing, append new pitfalls/patterns with date. Keep entries short, factual, file-referenced.
```

### 3.5 Tools (Hashline / LSP / AST / tmux)

- **Edits:** native `read/edit/write/patch` + `grep/glob` (`/tools/`). No hash-anchored safety — substitute with small diffs, `git diff` review before commit, and `snapshots` (undo) enabled.
- **LSP/AST:** no built-in LSP MCP. Add what you need: local LSP MCP via `mcp.servers` stdio, or `ast-grep` CLI via `shell` permission (`ast-grep --pattern …`). OMO's IDE-quality rename/references become `grep` + `read` + careful `edit`.
- **Shell/tmux:** native `shell` with `background:true` for dev servers/builds (notified on finish). Long `tail -f` style waits → background + explicit check-ins. No tmux pane management natively.
- **Repair/batch:** no malformed-arg repair or 20-reads-one-roundtrip batching. Keep tool args minimal and parallelize via `execute` (Code Mode) or multiple `subagent` children instead.

### 3.6 MCPs (the easiest win — 10 minutes)

OMO injected Exa/Context7/grep.app/LSP invisibly. In V2 declare them (`/mcp-servers/`):

```bash
opencode mcp add context7 --global --url https://mcp.context7.com/mcp
opencode mcp list
/opencode → /mcps  # OAuth sign-in when needed
```

```jsonc
{
  "mcp": {
    "servers": {
      "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp" },
      "exa-search": { "type": "remote", "url": "https://mcp.exa.ai/mcp", "oauth": false, "headers": { "Authorization": "Bearer {env:EXA_API_KEY}" } },
      "grep-app": { "type": "remote", "url": "https://mcp.grep.app/mcp", "oauth": false }
    }
  }
}
```

Notes: names normalize to `<server>_<tool>`; permission `context7_*: deny` hides without disconnecting; `codemode:false` keeps tools on native list; OAuth uses PKCE + dynamic registration, credentials stay out of config; use `{env:VAR}`, never raw secrets. Skill-embedded MCPs → move their servers to this static block. You already run Exa/Firecrawl/TinyFish/You.com/Contrast/AgentQL/Playwright — keep that set, add Context7 first (highest planning value).

### 3.7 Skills + hooks + compat

- **Skills:** native `.opencode/skills/<id>/SKILL.md` with `description` (advertise) + `skill` tool loading + `skill` permissions (`/skills/`). Port OMO's `ulw-plan`/`frontend-ui-ux` bodies directly; drop `mcp:` frontmatter into `mcp.servers` instead. IDs are path-derived, case-sensitive.
- **Hooks:** OMO's 20-hook table has no declarative equivalent. Closest: (a) encode `todo-continuation`/`comment-checker`/`compaction-preserve` as imperatives in every worker `system` prompt ("never declare done without test evidence; preserve todos across summaries"), (b) write your own V2 plugin with `ctx.session.hook("prompt"|"context"|"compaction")` + `ctx.tool.transform` if you need true enforcement (`/build/plugins/`).
- **Claude compat:** native discovery covers `.opencode/skills`, plus `.claude/skills` and `.agents/skills` compat paths — keep shared skills there if you also use Claude Code.

### 3.8 Worktrees / PR delivery (`--worktree --make-pr --ship`)

No native goal tracker. Manual equivalent:

```bash
git worktree add ../worktrees/task-xyz -b task/xyz
# run opencode in ../worktrees/task-xyz
git push -u origin task/xyz  # open PR, CI, review, merge, cleanup worktree
```

Optional: `"worktree": { "directory": "../worktrees" }` in config + a `/ship` command template encoding your repo's merge policy.

## 4. Recommended starter set (this workspace)

You have zero custom agents/commands/skills today. Create in order:

1. `.opencode/agents/reviewer.md` + `.opencode/agents/planner.md` (§3.1–3.2 snippets)
2. `.opencode/commands/plan.md` + `.opencode/commands/execute-plan.md` + `.opencode/commands/audit.md` (`agent: general, subagent: true`)
3. `.opencode/skills/memory/SKILL.md` + `MEMORY.md`
4. `mcp.servers`: `context7` first, then Exa/grep.app if not already covered by TinyFish/You.com/Firecrawl
5. `opencode.jsonc`: `orchestrator` allowlist + per-agent models for `explore-fast`/`reviewer`

Smoke test: `Use the explore subagent to map this repo, then have reviewer critique the map.` Proves fan-out + gate without any plugin.

## 5. Gaps to accept (no honest native equivalent)

- `mass ulw` multi-graph autonomy, Ralph `/ulw-loop` until-100%, IntentGate keyword auto-arming — use explicit loops ("continue until all todos have evidence, then stop").
- Automatic fallback chains on 429s — manual model switch.
- Hashline safety, built-in LSP/AST tools, tmux panes, malformed-arg repair.
- Boulder/ledger/goal daemons, PR-lifecycle automation.
- `isGptModel()` prompt auto-switching; GPT-native Hephaestus behavior (keep deep reasoning on a frontier model, don't force local).

## 6. Sources

- OMO: `omo.dev/docs` (What Is Oh My OpenAgent, orchestration, IntentGate), repo `code-yeongyu/oh-my-openagent` (packages list, `5.0.1` description), `glukhov.org` agent catalogue (Sisyphus/Prometheus/Metis/Momus/Hephaestus/Oracle/Librarian/Explore/Looker, categories, fallback chains), `ulw-plan` + `ulw-execute` SKILL.md + `full-workflow.md` (sticky plan mode, dual review, goal/todo discipline, worktree/PR flags), DeepWiki usage-workflows/ultrawork pages, `aiforpro.ai` + release notes (background agents, composite ULW keywords).
- OpenCode V2 (fetched): `/agents/`, `/commands/`, `/tools/`, `/permissions/`, `/skills/`, `/mcp-servers/`, `/models/`, `/cli/`, `/config/`, `llms.txt`.
- Prior local evidence: `W/report/oh-my-openagent-plugin-failure-2026-09-28.md`, `W/report/multi-agentic-workflows-2026-09-28.md`.
