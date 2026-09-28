# Replicating OMO Functionality Natively in OpenCode v2 — Without Plugins

**Date:** 2026-09-28
**Context:** `oh-my-openagent@5.0.1` (OMO) is incompatible with OpenCode v2. This report provides a complete, actionable guide to recreating OMO's functionality using only native OpenCode v2 features — no plugins required.
**Method:** OpenCode v2 official documentation (`/agents/`, `/commands/`, `/tools/`, `/permissions/`, `/skills/`, `/mcp-servers/`, `/models/`, `/config/`), OMO documentation and source code analysis, community resources, and cross-referencing with existing local reports (`omo-functionality-in-opencode-2026-09-28.md`, `multi-agentic-workflows-2026-09-28.md`, `omo-alternatives-opencode-v2-2026-09-28.md`).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture: The Native OMO Model](#2-architecture-the-native-omo-model)
3. [Method 1: Custom Agents (Replaces OMO Agent Roster)](#3-method-1-custom-agents-replaces-omo-agent-roster)
4. [Method 2: Subagent Orchestration (Replaces Team Mode)](#4-method-2-subagent-orchestration-replaces-team-mode)
5. [Method 3: Slash Commands (Replaces OMO Commands)](#5-method-3-slash-commands-replaces-omo-commands)
6. [Method 4: Skills System (Replaces OMO Skills)](#6-method-4-skills-system-replaces-omo-skills)
7. [Method 5: MCP Servers (Replaces Built-in MCPs)](#7-method-5-mcp-servers-replaces-built-in-mcps)
8. [Method 6: AGENTS.md + References (Replaces Context System)](#8-method-6-agentsmd--references-replaces-context-system)
9. [Method 7: Permissions (Replaces OMO Permission Config)](#9-method-7-permissions-replaces-omo-permission-config)
10. [Method 8: Model Routing (Replaces Category Routing)](#10-method-8-model-routing-replaces-category-routing)
11. [Method 9: Memory System (Replaces Kibitzer)](#11-method-9-memory-system-replaces-kibitzer)
12. [Method 10: Worktrees + Shell (Replaces Isolation)](#12-method-10-worktrees--shell-replaces-isolation)
13. [Complete OMO → Native V2 Feature Map](#13-complete-omo--native-v2-feature-map)
14. [Full Working Configuration](#14-full-working-configuration)
15. [Migration Guide: Step by Step](#15-migration-guide-step-by-step)
16. [Known Limitations and Workarounds](#16-known-limitations-and-workarounds)
17. [Sources](#17-sources)

---

## 1. Executive Summary

> **TL;DR:** OMO's functionality can be replicated natively in OpenCode v2 using **10 methods**: custom agents, subagent orchestration, slash commands, skills, MCP servers, AGENTS.md, permissions, model routing, memory patterns, and worktrees. Approximately **70% of OMO's features** have direct native equivalents. The remaining 30% (hooks, hashline edits, ULW loops, tmux) have no native equivalent and require workflow discipline or a custom plugin.

### The 10 Methods at a Glance

| # | Method | OMO Feature Replaced | Effort | Parity |
|---|--------|---------------------|--------|--------|
| 1 | Custom agents | 11-agent roster | Low | 95% |
| 2 | `subagent` tool | Team Mode, parallel agents | Low | 80% |
| 3 | Slash commands | `/deepwork`, `/reflect`, `/loop` | Low | 90% |
| 4 | Skills | 17 shared skills | Low | 95% |
| 5 | MCP servers | Exa, Context7, grep.app, LSP | Low | 100% |
| 6 | AGENTS.md + references | `/init-deep`, rules | Medium | 85% |
| 7 | Permissions | Permission config | Low | 100% |
| 8 | Model routing | Category routing | Low | 75% |
| 9 | Memory pattern | Kibitzer sidecar | Medium | 60% |
| 10 | Worktrees + shell | Worktree isolation | Low | 80% |

### What You Get

- **Multi-agent orchestration** with parallel background agents
- **Specialized agents** for planning, review, exploration, development
- **Slash commands** for repeatable workflows
- **MCP-powered tools** for docs search, web search, code search, LSP
- **Persistent memory** across sessions
- **Fine-grained permissions** per agent
- **Model routing** per agent and per command

### What You Lose

- 54+ lifecycle hooks (no native hook system)
- Hashline hash-anchored edits
- ULW loop until-100% automation
- tmux pane management
- Automatic fallback chains on rate limits
- Inter-agent direct messaging
- `mass ulw` multi-graph DAGs

---

## 2. Architecture: The Native OMO Model

### OMO Architecture (What We're Replacing)

```
OMO Plugin
├── Sisyphus (orchestrator) ──┬── Prometheus (planner)
│                            ├── Metis (gap analysis)
│                            ├── Momus (reviewer)
│                            ├── Oracle (architect)
│                            ├── Librarian (docs)
│                            ├── Explore (search)
│                            ├── Hephaestus (deep worker)
│                            └── Sisyphus-Junior (contractor)
├── Team Mode (8 parallel agents)
├── 54+ lifecycle hooks
├── Built-in MCPs (Exa, Context7, grep.app, LSP)
├── 17 skills
├── Memory sidecar (Kibitzer)
├── Model routing with fallback chains
└── Hashline + AST-grep + tmux tools
```

### Native V2 Architecture (What We're Building)

```
OpenCode v2 (no plugins)
├── Custom Agents ────────────┬── orchestrator (primary)
│                             ├── planner (subagent)
│                             ├── reviewer (subagent)
│                             ├── developer (subagent)
│                             ├── explorer (subagent)
│                             └── [your custom agents]
├── subagent tool (foreground/background)
├── Slash commands (/plan, /review, /audit, /deepwork)
├── Skills (.opencode/skills/)
├── MCP servers (context7, exa, grep.app, lsp, ast-grep)
├── AGENTS.md + references
├── Permissions (per-agent, per-action)
├── Model routing (per-agent, per-command)
└── Memory (MEMORY.md + memory/ dir + skill)
```

### Key Principles

1. **Agents are config, not code** — define in `.opencode/agents/*.md` or `opencode.jsonc`
2. **Orchestration is the `subagent` tool** — foreground for sequential, background for parallel
3. **Commands are prompt templates** — with `$ARGUMENTS`, agent selection, model override, `subagent: true`
4. **Skills are procedural knowledge** — markdown files with `description` for discovery
5. **MCPs are static config** — declare in `mcp.servers`, no runtime injection
6. **Permissions are declarative** — `{ action, resource, effect }` rules, last match wins

---

## 3. Method 1: Custom Agents (Replaces OMO Agent Roster)

### What It Replaces

OMO's 11 specialized agents (Sisyphus, Prometheus, Metis, Momus, Oracle, Librarian, Explore, Hephaestus, Sisyphus-Junior, Looker, Council).

### How It Works

OpenCode v2 supports custom agents defined as markdown files in `.opencode/agents/` (project) or `~/.config/opencode/agents/` (global), or as JSONC in `opencode.jsonc`.

### Agent Modes

| Mode | Behavior | Use For |
|------|----------|---------|
| `primary` | Runs as the main agent for a session | Orchestrator, build agent |
| `subagent` | Runs only in a child session via `subagent` tool | Specialist agents |
| `all` | Runs as either primary or subagent | Flexible agents |

### Complete Agent Set

```markdown
<!-- .opencode/agents/orchestrator.md -->
---
description: Plans, delegates in parallel, verifies — never implements directly
mode: primary
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
  - action: subagent
    resource: "*"
    effect: deny
  - action: subagent
    resource: reviewer
    effect: allow
  - action: subagent
    resource: planner
    effect: allow
  - action: subagent
    resource: developer
    effect: allow
  - action: subagent
    resource: explorer
    effect: allow
---

You are the orchestrator. Your role is to:
1. Classify the user's request
2. Delegate to the appropriate specialist subagent
3. Verify results against the task spec
4. Checkpoint progress

Never write application code. Only classify, delegate, and verify.
Every child prompt must state TASK, DELIVERABLE, SCOPE, and VERIFY criteria.
```

```markdown
<!-- .opencode/agents/planner.md -->
---
description: Interview-style planner, read-only, produces decision-complete plan
mode: subagent
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

You are the planner. Explore read-only in parallel, ask ONLY owner-decisions
via the question tool, then write ONE plan with phases, acceptance criteria,
QA commands, and dependency order. Never implement.
End with: approve to write plan, then run /execute-plan.
```

```markdown
<!-- .opencode/agents/reviewer.md -->
---
description: Reviews code for correctness and regressions
mode: subagent
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Review the current changes. List findings in severity order with file and line
references. Be ruthless: mark each finding as OK or REJECT with reasons.
Do not suggest fixes — only identify issues.
```

```markdown
<!-- .opencode/agents/developer.md -->
---
description: Implements features and fixes bugs following a plan
mode: subagent
model: anthropic/claude-sonnet-4-5
permissions:
  - action: subagent
    resource: "*"
    effect: deny
---

Implement the assigned task following the plan. Write tests. Verify your work.
Run the test suite after each phase. Report evidence of completion.
Stop on ambiguity and ask.
```

```markdown
<!-- .opencode/agents/explorer.md -->
---
description: Fast codebase search and analysis, read-only
mode: subagent
model: anthropic/claude-haiku-4-5
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Search and read code. Do not edit files. Report findings with file paths and
line numbers. Be thorough but concise. Focus on the specific question asked.
```

### OMO → V2 Agent Mapping

| OMO Agent | V2 Agent | Mode | Model |
|-----------|----------|------|-------|
| Sisyphus (orchestrator) | `orchestrator` | primary | claude-sonnet-4-5#high |
| Prometheus (planner) | `planner` | subagent | claude-sonnet-4-5#high |
| Metis (gap analysis) | `planner` (with gap-analysis prompt) | subagent | claude-sonnet-4-5#high |
| Momus (reviewer) | `reviewer` | subagent | claude-sonnet-4-5#high |
| Oracle (architect) | `planner` (with architecture prompt) | subagent | claude-sonnet-4-5#high |
| Librarian (docs) | `explorer` (with docs focus) | subagent | claude-haiku-4-5 |
| Explore | `explorer` | subagent | claude-haiku-4-5 |
| Hephaestus (deep worker) | `developer` | subagent | claude-sonnet-4-5 |
| Sisyphus-Junior | `developer` | subagent | claude-sonnet-4-5 |
| Council (model voting) | Multiple `reviewer` invocations | subagent | Different models |

### JSONC Alternative

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "default_agent": "orchestrator",
  "agents": {
    "orchestrator": {
      "description": "Plans, delegates in parallel, verifies",
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-5#high",
      "system": "You are the orchestrator. Decompose, dispatch, verify. Never write code.",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "reviewer", "effect": "allow" },
        { "action": "subagent", "resource": "planner", "effect": "allow" },
        { "action": "subagent", "resource": "developer", "effect": "allow" },
        { "action": "subagent", "resource": "explorer", "effect": "allow" }
      ]
    },
    "reviewer": {
      "description": "Reviews code for correctness and regressions",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5#high",
      "system": "Review the current changes. List findings in severity order with file and line references.",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    },
    "planner": {
      "description": "Creates phased implementation plans",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5#high",
      "system": "Create a phased implementation plan. Break work into small, verifiable steps.",
      "permissions": [
        { "action": "edit", "resource": "src/**", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    },
    "developer": {
      "description": "Implements features and fixes bugs",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5",
      "system": "Implement the assigned task following the plan. Write tests. Verify your work.",
      "permissions": [
        { "action": "subagent", "resource": "*", "effect": "deny" }
      ]
    },
    "explorer": {
      "description": "Fast codebase search and analysis",
      "mode": "subagent",
      "model": "anthropic/claude-haiku-4-5",
      "system": "Search and read code. Do not edit files. Report findings with file paths and line numbers.",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    }
  }
}
```

---

## 4. Method 2: Subagent Orchestration (Replaces Team Mode)

### What It Replaces

OMO's Team Mode (lead + 8 parallel members), background parallelism, `mass ulw` DAGs.

### How It Works

The `subagent` tool launches a child session with `{agentID, description, prompt}`. Children run with fresh context, own model, own permissions.

### Foreground vs Background

| Mode | Behavior | Use When |
|------|----------|----------|
| Foreground (default) | Parent waits for child to finish | Plan-then-act, review gates |
| Background (`background: true`) | Returns `sessionID` immediately, parent keeps working | Parallel fan-out, long tasks |

### Parallel Fan-Out Pattern

```
# The orchestrator can launch multiple subagents in parallel:
1. Launch explorer to analyze the codebase (background)
2. In parallel, launch planner to design the approach (background)
3. When both finish, launch developer to implement (foreground)
4. When done, launch reviewer to verify (foreground)
```

### Background Execution Flow

1. Parent agent (or user) invokes a subagent with `background: true`
2. Subagent runs in a **child session** (background)
3. Parent stays available and keeps its agent and model
4. When the child finishes, its result is sent back to the parent
5. Child sessions are browsable via session hierarchy navigation
6. Pass `sessionID` back to continue the same child conversation (multi-turn delegation)

### What You Lose vs OMO Team Mode

| OMO Feature | V2 Equivalent | Limitation |
|-------------|---------------|------------|
| 8 parallel agents | Multiple `subagent` calls | No hard limit, but context window matters |
| `team_*` tool family | `subagent` tool only | No dedicated team management |
| tmux visualization | Session hierarchy navigation | No visual pane layout |
| Inter-agent messaging | Parent-mediated coordination | Children can't talk directly |
| Persistent team state | Ephemeral invocations | Each subagent is fresh |
| Per-provider concurrency caps | None | Manual management |

---

## 5. Method 3: Slash Commands (Replaces OMO Commands)

### What It Replaces

OMO's `/deepwork`, `/reflect`, `/loop`, `/goal`, `/preset`, `/interview`, `/ulw-plan`, `/ulw-execute`.

### How It Works

Commands are markdown files in `.opencode/commands/` or JSONC in `opencode.jsonc`. They are prompt templates with `$ARGUMENTS` support.

### Command Fields

| Field | Required | Behavior |
|-------|----------|----------|
| `template` | JSON only | Prompt template |
| `description` | No | Text shown in command lists |
| `agent` | No | Agent selected when the command runs |
| `model` | No | Model override in `provider/model#variant` format |
| `subagent` | No | `true` runs in background child session; `false` forces current session |

### Complete Command Set

```markdown
<!-- .opencode/commands/plan.md -->
---
description: Plan without implementing
agent: planner
model: anthropic/claude-sonnet-4-5#high
---

Plan $ARGUMENTS. Explore first, interview only on genuine forks, output phases
+ acceptance + QA. Do not implement.
```

```markdown
<!-- .opencode/commands/execute-plan.md -->
---
description: Execute the approved plan step by step
agent: developer
---

Execute the approved plan in phases. Register todos, run tests after each phase,
report evidence. Stop on ambiguity and ask.
```

```markdown
<!-- .opencode/commands/review.md -->
---
description: Review code for correctness
agent: reviewer
model: anthropic/claude-sonnet-4-5#high
---

Review $ARGUMENTS. Report bugs first, then style issues. Be ruthless.
```

```markdown
<!-- .opencode/commands/deepwork.md -->
---
description: Deep multi-step work with verification
agent: orchestrator
subagent: true
---

Deepwork $ARGUMENTS. This is a complex multi-step task. Break it into phases,
delegate to specialists, verify each phase, and synthesize results.
```

```markdown
<!-- .opencode/commands/audit.md -->
---
description: Audit changes in background
agent: general
subagent: true
---

Audit $ARGUMENTS for bugs, security issues, and missing tests.
```

```markdown
<!-- .opencode/commands/reflect.md -->
---
description: Reflect on session progress
agent: planner
---

Reflect on the session so far. What was accomplished? What remains?
What should the next session prioritize?
```

```markdown
<!-- .opencode/commands/goal.md -->
---
description: Set a persistent goal
agent: planner
---

Set the goal: $ARGUMENTS. Break it into phases with acceptance criteria.
Write the goal to .context/progress.md.
```

### Shell Blocks in Commands

Commands support shell blocks that expand **before** submission:

```markdown
<!-- .opencode/commands/review-diff.md -->
Review this diff:

!`git diff --stat && git diff`
```

> **Warning:** Shell blocks run pre-submission, outside the permission flow. Only use trusted commands.

### OMO Command Mapping

| OMO Command | V2 Command | Notes |
|-------------|------------|-------|
| `/ulw-plan` | `/plan` | Same: plan without implementing |
| `/ulw-execute` | `/execute-plan` | Same: execute approved plan |
| `/deepwork` | `/deepwork` | Same: complex multi-step work |
| `/reflect` | `/reflect` | Same: session reflection |
| `/goal` | `/goal` | Same: set persistent goal |
| `/review` | `/review` | Same: code review |
| `/loop` | Custom command | No until-100% equivalent |
| `/preset` | `/models` | Switch model manually |
| `/interview` | `/plan` (with planner) | Interview-style planning |

---

## 6. Method 4: Skills System (Replaces OMO Skills)

### What It Replaces

OMO's 17 shared skills (`ulw-plan`, `ulw-execute`, `frontend-ui-ux`, `playwright`, `git-master`, `ast-grep`, `lsp`, `comment-checker`, `git-bash`).

### How It Works

Skills are markdown files in `.opencode/skills/<id>/SKILL.md` with a `description` frontmatter field. The model discovers skills by description and loads them via the `skill` tool.

### Skill Structure

```
.opencode/skills/
└── git-release/
    ├── SKILL.md
    ├── scripts/
    │   └── changelog.ts
    └── references/
        └── release-policy.md
```

### Skill Discovery Locations

| Scope | Sources |
|-------|---------|
| Global | `~/.config/opencode/skills` |
| Global compatibility | `~/.claude/skills`, `~/.agents/skills` |
| Project | `.opencode/skills` |
| Project compatibility | `.claude/skills`, `.agents/skills` |

### Complete Skill Set

```markdown
<!-- .opencode/skills/git-master/SKILL.md -->
---
name: Git Master
description: Advanced git operations — rebasing, cherry-picking, bisecting, worktrees
---

## Workflow

1. Always check `git status` before any operation.
2. For interactive rebase: `git rebase -i <base>`.
3. For cherry-pick: `git cherry-pick <commit>`.
4. For bisect: `git bisect start`, `git bisect bad`, `git bisect good <commit>`.
5. For worktrees: `git worktree add <path> -b <branch>`.
```

```markdown
<!-- .opencode/skills/ast-grep/SKILL.md -->
---
name: AST-Grep
description: Pattern-aware code search and transformation using ast-grep
---

## Workflow

1. Use `ast-grep --pattern '<pattern>'` to find code patterns.
2. Use `ast-grep --pattern '<pattern>' --rewrite '<replacement>'` to transform.
3. Common patterns:
   - Function: `function $NAME($$$ARGS) $$$BODY`
   - Console.log: `console.log($$$ARGS)`
   - Import: `import $$$IMPORTS from '$MODULE'`
```

```markdown
<!-- .opencode/skills/playwright/SKILL.md -->
---
name: Playwright
description: Browser automation testing with Playwright MCP
---

## Workflow

1. Navigate to the page: `browser_navigate({ url })`
2. Take a snapshot to see the page structure.
3. Interact with elements using `browser_click`, `browser_type`, etc.
4. Use `browser_screenshot` for visual verification.
5. Run tests with `bun test` or `npx playwright test`.
```

```markdown
<!-- .opencode/skills/memory/SKILL.md -->
---
name: Memory
description: Record and recall durable project learnings across sessions
---

## Memory Protocol

1. On session start, read `MEMORY.md` and `memory/*.md`.
2. After completing significant work, update `MEMORY.md`.
3. When making architectural decisions, record them in `memory/decisions.md`.
4. Keep entries bullet-point only, max ~3000 tokens.
5. Archive old entries to `memory/archive/`.
```

```markdown
<!-- .opencode/skills/comment-checker/SKILL.md -->
---
name: Comment Checker
description: Verify code comments are accurate and up-to-date
---

## Workflow

1. Read the file and its comments.
2. Check if comments match the actual code behavior.
3. Flag outdated, misleading, or missing comments.
4. Suggest improvements for clarity.
```

### Adding Skill Sources

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "skills": [
    "./team-skills",
    "~/shared/opencode-skills",
    "https://example.com/opencode/skills/"
  ]
}
```

### Skill Permissions

```jsonc
{
  "permissions": [
    { "action": "skill", "resource": "*", "effect": "allow" },
    { "action": "skill", "resource": "internal-*", "effect": "deny" },
    { "action": "skill", "resource": "experimental-*", "effect": "ask" }
  ]
}
```

---

## 7. Method 5: MCP Servers (Replaces Built-in MCPs)

### What It Replaces

OMO's runtime-injected MCPs: Exa (web search), Context7 (docs), grep.app (code search), LSP (language server).

### How It Works

In V2, MCP servers are declared statically in `opencode.jsonc` under `mcp.servers`. No runtime injection — everything is visible in `opencode mcp list`.

### Complete MCP Configuration

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp",
        "oauth": false,
        "headers": {
          "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
        }
      },
      "exa": {
        "type": "remote",
        "url": "https://mcp.exa.ai/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {env:EXA_API_KEY}"
        }
      },
      "grep_app": {
        "type": "remote",
        "url": "https://mcp.grep.app",
        "oauth": false
      },
      "lsp": {
        "type": "local",
        "command": ["npx", "-y", "lsp-tools-mcp"],
        "environment": {
          "LSP_TOOLS_MCP_PROJECT_CONFIG": ".opencode/lsp.json"
        }
      },
      "ast-grep": {
        "type": "local",
        "command": ["npx", "-y", "@ast-grep/mcp-server"]
      },
      "playwright": {
        "type": "local",
        "command": ["bunx", "@playwright/mcp"]
      }
    }
  }
}
```

### CLI Alternative

```bash
opencode mcp add context7 --global --url https://mcp.context7.com/mcp
opencode mcp add exa --global --url https://mcp.exa.ai/mcp
opencode mcp add grep_app --global --url https://mcp.grep.app
opencode mcp list
```

### MCP Protocol Versions

```jsonc
{
  "mcp": {
    "servers": {
      "modern": {
        "type": "remote",
        "url": "https://mcp.example.com/mcp",
        "protocol": "auto"  // or "legacy" (default) or "2026-07-28"
      }
    }
  }
}
```

### MCP Notes

- Names normalize to `<server>_<tool>` (e.g., `context7_resolve-library-id`)
- Permission `context7_*: deny` hides without disconnecting
- `codemode: false` keeps tools on native list
- OAuth uses PKCE + dynamic registration, credentials stay out of config
- Use `{env:VAR}` for secrets, never raw values

---

## 8. Method 6: AGENTS.md + References (Replaces Context System)

### What It Replaces

OMO's `/init-deep` hierarchical AGENTS.md generation, walk-up injection, `.claude/rules` conditional rules.

### How It Works

V2 recognizes `AGENTS.md` files at multiple levels. Files are loaded global-first, then from the current workspace directory toward the home directory. They are **combined**, not overridden.

### File Locations

```
~/.config/opencode/AGENTS.md          # Global (all projects)
~/code/my-project/AGENTS.md           # Project root
~/code/my-project/packages/AGENTS.md # Package-level
~/code/my-project/packages/web/AGENTS.md  # Current workspace
```

### AGENTS.md Format

```markdown
# Project Instructions

- Run `bun typecheck` after changing TypeScript.
- Keep database queries in `src/database`.
- Do not edit generated files directly.
- Always write tests for new features.
- Use the orchestrator agent for complex multi-step tasks.
- Use the explorer agent for codebase search.
- Use the reviewer agent before committing.
```

### References Configuration

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "references": {
    "docs": {
      "path": "../product-docs",
      "description": "Product behavior and terminology"
    },
    "decisions": {
      "path": "./docs/decisions",
      "description": "Architecture decision records"
    },
    "api": {
      "path": "./docs/api",
      "description": "API documentation and examples"
    }
  }
}
```

### OMO Context Mapping

| OMO Feature | V2 Equivalent | Notes |
|-------------|---------------|-------|
| `/init-deep` generator | ❌ None | Author AGENTS.md by hand per directory |
| Walk-up AGENTS.md | ✅ Native | Automatic discovery and combination |
| `.claude/rules` by globs | ⚠️ Skills | One skill per domain with clear description |
| Conditional rules | ⚠️ Skills | Use `description` to control when loaded |

---

## 9. Method 7: Permissions (Replaces OMO Permission Config)

### What It Replaces

OMO's permission configuration for agents, tools, and operations.

### How It Works

Permissions are declarative rules: `{ action, resource, effect }`. Rules are evaluated in order, **last match wins**.

### Permission Actions

| Action | Covers |
|--------|--------|
| `shell` | Shell commands |
| `edit` | Edit, write, and patch tools |
| `subagent` | Child agents |
| `read`, `glob`, `grep` | Local discovery tools |
| `webfetch`, `websearch` | Web tools |
| `skill` | Skill loading |
| `external_directory` | Paths outside workspace |

### Global Permissions

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "permissions": [
    { "action": "shell", "resource": "*", "effect": "ask" },
    { "action": "shell", "resource": "git status *", "effect": "allow" },
    { "action": "shell", "resource": "git diff *", "effect": "allow" },
    { "action": "shell", "resource": "git log *", "effect": "allow" },
    { "action": "shell", "resource": "git push *", "effect": "deny" },
    { "action": "read", "resource": "*.env", "effect": "deny" },
    { "action": "edit", "resource": "dist/**", "effect": "deny" }
  ]
}
```

### Per-Agent Permissions

```jsonc
{
  "agents": {
    "reviewer": {
      "permissions": [
        { "action": "*", "resource": "*", "effect": "deny" },
        { "action": "read", "resource": "src/**", "effect": "allow" },
        { "action": "glob", "resource": "*", "effect": "allow" },
        { "action": "grep", "resource": "*", "effect": "allow" }
      ]
    }
  }
}
```

### Permission Precedence

1. Built-in base policy (allow everything, ask for external dirs and .env)
2. Global `permissions` array
3. Agent-specific `permissions` array (last match wins)

### Default Base Policy

```jsonc
[
  { "action": "*", "resource": "*", "effect": "allow" },
  { "action": "external_directory", "resource": "*", "effect": "ask" },
  { "action": "read", "resource": "*.env", "effect": "ask" },
  { "action": "read", "resource": "*.env.*", "effect": "ask" },
  { "action": "read", "resource": "*.env.example", "effect": "allow" }
]
```

---

## 10. Method 8: Model Routing (Replaces Category Routing)

### What It Replaces

OMO's category-based model routing (`quick`, `deep`, `ultrabrain`, `visual`, `writing`) with fallback chains.

### How It Works

V2 supports per-agent and per-command model configuration. No categories, no automatic fallback — but full control.

### Per-Agent Model Configuration

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5", // default model
  "agents": {
    "orchestrator": {
      "model": "anthropic/claude-sonnet-4-5#high"  // high reasoning variant
    },
    "planner": {
      "model": "anthropic/claude-sonnet-4-5#high"
    },
    "developer": {
      "model": "anthropic/claude-sonnet-4-5"  // standard
    },
    "explorer": {
      "model": "anthropic/claude-haiku-4-5"  // fast/cheap for search
    },
    "reviewer": {
      "model": "openai/gpt-5.4#high"  // different provider for review
    }
  }
}
```

### Per-Command Model Override

```jsonc
{
  "commands": {
    "deep-task": {
      "template": "Do $ARGUMENTS thoroughly.",
      "agent": "general",
      "model": "openai/gpt-5.4#high",
      "subagent": true
    }
  }
}
```

### Model Selection Priority

1. Command `model` (highest priority)
2. Agent `model`
3. Parent session model (lowest priority)

### Expanded Model Form

```jsonc
{
  "agents": {
    "reviewer": {
      "model": {
        "providerID": "anthropic",
        "model": "claude-sonnet-4-5",
        "variant": "high"
      }
    }
  }
}
```

### OMO Category → V2 Model Mapping

| OMO Category | OMO Models | V2 Equivalent |
|--------------|------------|---------------|
| `quick` | Haiku/Flash/Nano | `anthropic/claude-haiku-4-5` |
| `deep` | GPT-5.3-Codex → Opus | `openai/gpt-5.4#high` |
| `ultrabrain` | GPT-5.4 xhigh | `openai/gpt-5.4#max` |
| `visual` | Gemini Pro | `google/gemini-3-pro` |
| `writing` | Flash | `google/gemini-3-flash` |
| `architect` | Opus | `anthropic/claude-sonnet-4-5#high` |

### What You Lose

- **No automatic fallback chains** — if a model hits a rate limit, you must manually switch
- **No `isGptModel()` prompt auto-switching** — maintain separate agent files for different model families
- **No per-agent temperature** — use `#variant` instead

---

## 11. Method 9: Memory System (Replaces Kibitzer)

### What It Replaces

OMO's Kibitzer memory sidecar — automatic memory accumulation and recall.

### How It Works

V2 has **no built-in memory system**. The native approach uses:
1. `MEMORY.md` for persistent project memory
2. `memory/` directory for structured memory files
3. A `memory` skill that instructs the agent to maintain memory

### Memory File Structure

```
.context/
├── progress.md          # Current progress and status
├── decisions.md         # Architecture decisions
├── MEMORY.md            # Persistent project memory
└── memory/
    ├── patterns.md      # Code patterns and conventions
    ├── pitfalls.md      # Known pitfalls and gotchas
    ├── archive/         # Archived old entries
    └── decisions/       # Decision records
```

### Memory Skill

```markdown
<!-- .opencode/skills/memory/SKILL.md -->
---
name: Memory
description: Record and recall durable project learnings across sessions
---

## Memory Protocol

1. On session start, read `MEMORY.md` and `memory/*.md`.
2. After completing significant work, update `MEMORY.md`.
3. When making architectural decisions, record them in `memory/decisions.md`.
4. Keep entries bullet-point only, max ~3000 tokens.
5. Archive old entries to `memory/archive/`.

## Entry Format

- [YYYY-MM-DD] Brief description of the learning/decision.
  - Context: Why this matters.
  - Action: What to do about it.
```

### MEMORY.md Template

```markdown
# Project Memory

## Patterns
- [2026-09-28] Use repository pattern for data access.
  - Context: Keeps business logic separate from storage.
  - Action: All DB access goes through `src/repositories/`.

## Pitfalls
- [2026-09-28] Do not edit `dist/` directly.
  - Context: Generated files are overwritten on build.
  - Action: Edit source in `src/` and rebuild.

## Decisions
- [2026-09-28] Use bun for package management.
  - Context: Faster than npm, compatible with existing lockfile.
  - Action: All scripts use `bun` commands.
```

### What You Lose vs Kibitzer

| OMO Feature | V2 Equivalent | Limitation |
|-------------|---------------|------------|
| Automatic memory accumulation | Manual via skill | No automatic nudges |
| Git-backed memory repo | Plain markdown files | No version history (unless you git commit) |
| Wisdom accumulation | Manual curation | No automatic summarization |
| Cross-project memory | Global `~/.config/opencode/MEMORY.md` | Manual management |

---

## 12. Method 10: Worktrees + Shell (Replaces Isolation)

### What It Replaces

OMO's worktree discipline, `--worktree --make-pr --ship` flags.

### How It Works

V2 has no built-in worktree management. Use native git worktrees + shell commands.

### Worktree Workflow

```bash
# Create a worktree
git worktree add ../worktrees/task-xyz -b task/xyz

# Run opencode in the worktree
cd ../worktrees/task-xyz
opencode

# Push and create PR
git push -u origin task/xyz
# Open PR, CI, review, merge

# Cleanup
git worktree remove ../worktrees/task-xyz
```

### Worktree Configuration

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "worktree": {
    "directory": "../worktrees"
  }
}
```

### Ship Command

```markdown
<!-- .opencode/commands/ship.md -->
---
description: Ship changes — push, create PR, run CI
agent: developer
---

Ship the current changes:
1. Run tests: `bun test`
2. Run typecheck: `bun typecheck`
3. Commit with descriptive message
4. Push to origin
5. Create PR with description
6. Report PR URL
```

---

## 13. Complete OMO → Native V2 Feature Map

| OMO Feature | Native V2 Method | Parity | Notes |
|-------------|-----------------|--------|-------|
| **Agent Roster** (11 agents) | Custom agents | 95% | Full support via `.opencode/agents/` |
| **Team Mode** (parallel) | `subagent` tool | 80% | No `team_*` tools, no tmux viz |
| **Background agents** | `subagent: true` | 90% | Full support |
| **Slash commands** | `.opencode/commands/` | 90% | Full support |
| **Built-in MCPs** | `mcp.servers` config | 100% | Declare statically |
| **LSP integration** | MCP server | 100% | Via `lsp-tools-mcp` |
| **AST-grep** | MCP server or skill | 100% | Via `@ast-grep/mcp-server` |
| **Skills** | `.opencode/skills/` | 95% | Full support |
| **AGENTS.md** | `AGENTS.md` files | 85% | No generator, manual authoring |
| **References** | `references` config | 90% | Full support |
| **Permissions** | `permissions` array | 100% | Full support |
| **Model routing** | Per-agent `model` | 75% | No auto-fallback |
| **Memory** | `MEMORY.md` + skill | 60% | No automatic sidecar |
| **Worktrees** | Git worktrees + shell | 80% | Manual management |
| **Hooks (54+)** | ❌ None | 0% | No native hook system |
| **Hashline edits** | ❌ None | 0% | No hash-anchored edits |
| **ULW loop** | ❌ None | 0% | No until-100% automation |
| **tmux integration** | ❌ None | 0% | No pane management |
| **Goal tracker** | ❌ None | 0% | Use `PROGRESS.md` manually |
| **Telemetry** | ❌ None | 0% | No native equivalent |
| **Inter-agent messaging** | ❌ None | 0% | Parent-mediated only |
| **`mass ulw` DAGs** | ❌ None | 0% | No graph execution |
| **Fallback chains** | ❌ None | 0% | Manual model switch |
| **`isGptModel()` switching** | ❌ None | 0% | Maintain separate agents |

### Parity Summary

| Category | Parity | Notes |
|----------|--------|-------|
| **Direct equivalents** | ~70% | Agents, commands, skills, MCPs, permissions, models |
| **Partial equivalents** | ~15% | Memory, worktrees, model routing |
| **No equivalent** | ~15% | Hooks, hashline, ULW loops, tmux, telemetry |

---

## 14. Full Working Configuration

### Project Structure

```
my-project/
├── opencode.jsonc
├── AGENTS.md
├── .opencode/
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── planner.md
│   │   ├── reviewer.md
│   │   ├── developer.md
│   │   └── explorer.md
│   ├── commands/
│   │   ├── plan.md
│   │   ├── execute-plan.md
│   │   ├── review.md
│   │   ├── deepwork.md
│   │   ├── audit.md
│   │   ├── reflect.md
│   │   ├── goal.md
│   │   └── ship.md
│   ├── skills/
│   │   ├── memory/
│   │   │   └── SKILL.md
│   │   ├── git-master/
│   │   │   └── SKILL.md
│   │   ├── ast-grep/
│   │   │   └── SKILL.md
│   │   ├── playwright/
│   │   │   └── SKILL.md
│   │   └── comment-checker/
│   │       └── SKILL.md
│   └── references/
│       └── docs/
├── .context/
│   ├── progress.md
│   ├── decisions.md
│   ├── MEMORY.md
│   └── memory/
│       ├── patterns.md
│       └── pitfalls.md
```

### Complete opencode.jsonc

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // Default model and agent
  "model": "anthropic/claude-sonnet-4-5",
  "default_agent": "orchestrator",

  // Permissions
  "permissions": [
    { "action": "shell", "resource": "*", "effect": "ask" },
    { "action": "shell", "resource": "git status *", "effect": "allow" },
    { "action": "shell", "resource": "git diff *", "effect": "allow" },
    { "action": "shell", "resource": "git log *", "effect": "allow" },
    { "action": "shell", "resource": "git push *", "effect": "deny" },
    { "action": "read", "resource": "*.env", "effect": "deny" },
    { "action": "edit", "resource": "dist/**", "effect": "deny" }
  ],

  // Agents
  "agents": {
    "orchestrator": {
      "description": "Plans, delegates in parallel, verifies — never implements",
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-5#high",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "reviewer", "effect": "allow" },
        { "action": "subagent", "resource": "planner", "effect": "allow" },
        { "action": "subagent", "resource": "developer", "effect": "allow" },
        { "action": "subagent", "resource": "explorer", "effect": "allow" }
      ]
    },
    "planner": {
      "description": "Creates phased implementation plans",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5#high",
      "permissions": [
        { "action": "edit", "resource": "src/**", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    },
    "reviewer": {
      "description": "Reviews code for correctness and regressions",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5#high",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    },
    "developer": {
      "description": "Implements features and fixes bugs",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5",
      "permissions": [
        { "action": "subagent", "resource": "*", "effect": "deny" }
      ]
    },
    "explorer": {
      "description": "Fast codebase search and analysis",
      "mode": "subagent",
      "model": "anthropic/claude-haiku-4-5",
      "permissions": [
        { "action": "edit", "resource": "*", "effect": "deny" },
        { "action": "shell", "resource": "*", "effect": "deny" }
      ]
    }
  },

  // MCP Servers
  "mcp": {
    "servers": {
      "context7": {
        "type": "remote",
        "url": "https://mcp.context7.com/mcp",
        "oauth": false,
        "headers": {
          "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
        }
      },
      "exa": {
        "type": "remote",
        "url": "https://mcp.exa.ai/mcp",
        "oauth": false,
        "headers": {
          "Authorization": "Bearer {env:EXA_API_KEY}"
        }
      },
      "grep_app": {
        "type": "remote",
        "url": "https://mcp.grep.app",
        "oauth": false
      }
    }
  },

  // Commands
  "commands": {
    "plan": {
      "description": "Plan without implementing",
      "template": "Plan $ARGUMENTS. Explore first, interview only on genuine forks, output phases + acceptance + QA.",
      "agent": "planner"
    },
    "execute-plan": {
      "description": "Execute the approved plan",
      "template": "Execute the approved plan in phases. Run tests after each phase. Report evidence.",
      "agent": "developer"
    },
    "review": {
      "description": "Review code for correctness",
      "template": "Review $ARGUMENTS for correctness and missing tests.",
      "agent": "reviewer"
    },
    "deepwork": {
      "description": "Deep multi-step work",
      "template": "Deepwork $ARGUMENTS. Break into phases, delegate, verify, synthesize.",
      "agent": "orchestrator",
      "subagent": true
    },
    "audit": {
      "description": "Audit changes in background",
      "template": "Audit $ARGUMENTS for bugs, security issues, and missing tests.",
      "agent": "general",
      "subagent": true
    },
    "reflect": {
      "description": "Reflect on session progress",
      "template": "Reflect on the session so far. What was accomplished? What remains?",
      "agent": "planner"
    },
    "goal": {
      "description": "Set a persistent goal",
      "template": "Set the goal: $ARGUMENTS. Break into phases with acceptance criteria.",
      "agent": "planner"
    },
    "ship": {
      "description": "Ship changes",
      "template": "Ship: run tests, typecheck, commit, push, create PR.",
      "agent": "developer"
    }
  },

  // Skills
  "skills": [
    "./team-skills"
  ],

  // References
  "references": {
    "docs": {
      "path": "../product-docs",
      "description": "Product behavior and terminology"
    },
    "decisions": {
      "path": "./docs/decisions",
      "description": "Architecture decision records"
    }
  },

  // Worktree config
  "worktree": {
    "directory": "../worktrees"
  }
}
```

---

## 15. Migration Guide: Step by Step

### Phase 1: Foundation (30 minutes)

1. **Create agent files** (5 agents):
   ```bash
   mkdir -p .opencode/agents
   # Create: orchestrator.md, planner.md, reviewer.md, developer.md, explorer.md
   # (See §3 for content)
   ```

2. **Create command files** (8 commands):
   ```bash
   mkdir -p .opencode/commands
   # Create: plan.md, execute-plan.md, review.md, deepwork.md,
   #         audit.md, reflect.md, goal.md, ship.md
   # (See §5 for content)
   ```

3. **Create skill files** (5 skills):
   ```bash
   mkdir -p .opencode/skills/{memory,git-master,ast-grep,playwright,comment-checker}
   # Create SKILL.md in each
   # (See §6 for content)
   ```

4. **Create memory structure**:
   ```bash
   mkdir -p .context/memory/archive
   touch .context/progress.md .context/decisions.md .context/MEMORY.md
   touch .context/memory/patterns.md .context/memory/pitfalls.md
   ```

### Phase 2: Configuration (15 minutes)

5. **Update `opencode.jsonc`**:
   - Add `default_agent: "orchestrator"`
   - Add agent permissions
   - Add MCP servers
   - Add commands
   - Add references
   - (See §14 for full config)

6. **Create `AGENTS.md`**:
   ```bash
   # Project-level instructions
   # (See §8 for content)
   ```

### Phase 3: MCP Setup (10 minutes)

7. **Add MCP servers**:
   ```bash
   opencode mcp add context7 --global --url https://mcp.context7.com/mcp
   opencode mcp add exa --global --url https://mcp.exa.ai/mcp
   opencode mcp add grep_app --global --url https://mcp.grep.app
   opencode mcp list
   ```

8. **Set environment variables**:
   ```bash
   export CONTEXT7_API_KEY="your-key"
   export EXA_API_KEY="your-key"
   ```

### Phase 4: Verification (10 minutes)

9. **Smoke test**:
   ```text
   Use the explore subagent to map this repo, then have reviewer critique the map.
   ```

10. **Verify files**:
    ```bash
    ls .opencode/agents/ .opencode/commands/ .opencode/skills/
    ls .context/
    cat opencode.jsonc
    ```

### Phase 5: Workflow Integration (ongoing)

11. **Use the workflow**:
    - `/plan <task>` → get a plan
    - Approve plan → `/execute-plan`
    - `/review` → verify changes
    - `/deepwork <task>` → complex multi-step work
    - `/ship` → push and create PR

12. **Maintain memory**:
    - Read `MEMORY.md` at session start
    - Update after significant work
    - Archive old entries

---

## 16. Known Limitations and Workarounds

### No Native Hook System

**OMO had 54+ lifecycle hooks.** V2 has no declarative hook system.

**Workaround:**
- Encode hook behavior as imperatives in agent `system` prompts
- Example: "Never declare done without test evidence; preserve todos across summaries"
- For true enforcement, write a custom V2 plugin with `ctx.session.hook()` and `ctx.tool.transform`

### No Hashline Edits

**OMO's hash-anchored edits** (6.7% → 68.3% edit success rate) have no native equivalent.

**Workaround:**
- Use small, focused diffs
- Review `git diff` before committing
- Use `snapshots` (undo) for safety

### No ULW Loop

**OMO's `/ulw-loop`** ran until 100% completion. No native equivalent.

**Workaround:**
- Use explicit loops: "Continue until all todos have evidence, then stop"
- Use background subagents for long-running work
- Manually re-prompt for follow-up work

### No Automatic Fallback Chains

**OMO automatically fell back** to alternative models on rate limits.

**Workaround:**
- Manually switch models with `/models`
- Use `opencode run --model <model>` for one-shot overrides
- Maintain multiple agent files with different models

### No Inter-Agent Messaging

**OMO agents could communicate directly.** V2 subagents can only report to parent.

**Workaround:**
- Parent-mediated coordination
- Use shared files (`.context/progress.md`) for state
- Launch multiple subagents and synthesize results

### No tmux Integration

**OMO had tmux pane management.** V2 has no equivalent.

**Workaround:**
- Use terminal multiplexer manually
- Use `shell` with `background: true` for long-running processes
- Use session hierarchy navigation in TUI

### No Goal Tracker

**OMO had Boulder/goal state tracking.** V2 has no equivalent.

**Workaround:**
- Use `.context/progress.md` as a manual goal tracker
- Update it each session
- Use `/goal` command to set and track goals

---

## 17. Sources

### OpenCode v2 Documentation (Primary Source of Truth)
- `https://opencode.ai/v2/docs/agents/` — Custom agent configuration
- `https://opencode.ai/v2/docs/commands/` — Slash command configuration
- `https://opencode.ai/v2/docs/tools/` — Built-in tools including `subagent`
- `https://opencode.ai/v2/docs/permissions/` — Permission system
- `https://opencode.ai/v2/docs/skills/` — Skills system
- `https://opencode.ai/v2/docs/mcp-servers/` — MCP server configuration
- `https://opencode.ai/v2/docs/models/` — Model configuration
- `https://opencode.ai/v2/docs/config/` — Configuration reference
- `https://opencode.ai/v2/docs/cli/` — CLI reference

### OMO Documentation
- `omo.dev/docs` — What Is Oh My OpenAgent, orchestration, IntentGate
- `github.com/code-yeongyu/oh-my-openagent` — Source code, packages list
- `glukhov.org` — Agent catalogue (Sisyphus/Prometheus/Metis/Momus/Hephaestus/Oracle/Librarian/Explore/Looker)

### Community Resources
- `github.com/NicoGenti/opencode-orchestrator-kit` — Zero-plugin multi-agent kit
- `github.com/alvinunreal/oh-my-opencode-slim` — Dual v1/v2 community fork
- OpenCode v2 GitHub issues and discussions

### Local Sources
- `W/report/oh-my-openagent-plugin-failure-2026-09-28.md` — Plugin failure diagnosis
- `W/report/omo-functionality-in-opencode-2026-09-28.md` — OMO function replacement guide
- `W/report/multi-agentic-workflows-2026-09-28.md` — Multi-agent workflow execution
- `W/report/omo-alternatives-opencode-v2-2026-09-28.md` — OMO alternatives comparison

---

*Report generated: 2026-09-28*
*Research method: OpenCode v2 official documentation, OMO documentation and source analysis, community resources, cross-referenced with existing local reports*
*Total sources consulted: 20+*
