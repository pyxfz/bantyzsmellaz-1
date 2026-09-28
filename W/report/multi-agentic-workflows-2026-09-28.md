# Multi-Agentic Workflows in OpenCode V2 — Execution Guide

**Date:** 2026-09-28
**Target:** OpenCode `v2.0.18` (V2 API only)
**Sources (all V2 docs, fetched as source of truth):** `https://opencode.ai/v2/docs/agents/`, `/commands/`, `/tools/`, `/permissions/`, `/skills/`, `/cli/`, `/config/`, plus `llms.txt` index
**Local state:** no custom `agents/`, `commands/`, or `skills/` yet — all examples below are ready to create

## 1. Mental model

V2 has no orchestrator plugin (you removed `oh-my-openagent`). Multi-agent = **one primary session + one or more child sessions** launched through the built-in `subagent` tool.

- **Primary agents** (`build`, `plan`, custom `mode: primary|all`): own the user session.
- **Subagents** (`general`, `explore`, custom `mode: subagent|all`): run only inside a child session with fresh context, own model, own permissions.
- Parent never shares context automatically — the child returns a text result (or failure) to the parent. Design prompts to demand file+line references and actionable summaries.
- Default nesting depth is **1**: a subagent cannot launch its own subagent. `general` explicitly denies `subagent` launches.

Builtins (`/v2/docs/agents/`):

| Agent | Mode | Use for |
|---|---|---|
| `build` | primary | Default coding, edit+shell allowed |
| `plan` | primary | Read-only planning, may write `~/.opencode/plan` files |
| `general` | subagent | Broad research / multi-step, cannot spawn children |
| `explore` | subagent | Read/grep/glob/webfetch/websearch only, no edits |

## 2. The four execution paths

### A. Natural-language delegation (simplest, TUI / `run`)

Just name the agent in the prompt. The primary model picks the `subagent` tool.

```text
Use the explore subagent to map the auth flow and return key files.
Use the reviewer subagent to review my current changes.
```

Works in TUI, `opencode run "…"`, and `mini`. No config needed for builtins.

### B. `subagent` tool — foreground vs background

From `/v2/docs/tools/`:

```text
Ask the explore subagent to map the authentication flow and return the key files.
```

- **Foreground** (default): parent waits. Good for plan-then-act, review gates.
- **Background** (`background: true`): returns immediately with `sessionID`; parent keeps working, gets notified on completion. Pass `sessionID` back to continue the same child conversation (multi-turn delegation).
- Only `mode: subagent|all` targets are callable. Permission checked as `subagent` + agent ID as resource.

Use background for fan-out: launch 2–4 explores in parallel, then synthesize.

### C. Slash commands with `subagent: true` (repeatable workflows)

From `/v2/docs/commands/`. A command is a prompt template; `subagent: true` forces a background child.

```md title=".opencode/commands/audit.md"
---
description: Audit changes
agent: general
subagent: true
---

Audit $ARGUMENTS for bugs and missing tests.
```

| `subagent` value | Behavior |
|---|---|
| `true` | Always background child, even if agent is `primary` |
| `false` | Always current session, even if agent is `subagent` |
| omitted | Child only when selected agent is `mode: subagent` |

Model priority for the child: command `model` → agent `model` → parent session model.

Shell blocks (`!` + backticks) expand **before** submission, outside permission flow — only use trusted commands:

```md title=".opencode/commands/review-diff.md"
Review this diff:

!`git diff --stat && git diff`
```

### D. `opencode run` / scripts / CI (headless fan-out)

From `/v2/docs/cli/`:

```bash
opencode run "Explain this repository"
opencode --standalone  # private server, isolates experiments
opencode mini --help   # minimal UI, same sessions backend
```

Combine with commands: `opencode run "/audit src/auth.ts"` in scripts. Each `run` is its own session; use it for nightly audits, parallel CI shards, or driving separate worktrees.

## 3. Minimum wiring: agents + permissions

Create a reviewer once, reuse everywhere.

```md title=".opencode/agents/reviewer.md"
---
description: Reviews changes for correctness and regressions
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

Review the current changes. List findings in severity order with file and line references.
```

Or JSONC in `opencode.jsonc` (`/v2/docs/config/` + `/agents/`):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agents": {
    "reviewer": {
      "description": "Reviews current changes",
      "mode": "subagent",
      "system": "Report findings in severity order.",
      "permissions": [{ "action": "edit", "resource": "*", "effect": "deny" }]
    }
  }
}
```

Parent allowlist — orchestrator pattern without a plugin:

```jsonc
{
  "agents": {
    "orchestrator": {
      "permissions": [
        { "action": "subagent", "resource": "*", "effect": "deny" },
        { "action": "subagent", "resource": "explore", "effect": "allow" },
        { "action": "subagent", "resource": "general", "effect": "allow" },
        { "action": "subagent", "resource": "reviewer", "effect": "allow" }
      ]
    }
  }
}
```

Rules (`/v2/docs/permissions/`): `{ action, resource, effect }`, last match wins, default `ask`. Global rules load first, agent rules append last. Child uses **its own** permissions, not a subset of the parent's. `general` denies `question` + `subagent`; `explore` allows only `read/glob/grep/webfetch/websearch` (+ `ask` on external dirs / `.env`).

Locations: global `~/.config/opencode/agents/<name>.md`, project `.opencode/agents/<name>.md` (nested path becomes ID: `team/reviewer.md` → `team/reviewer`). Same for `commands/` (`team/review.md` → `/team/review`). No server restart needed — files + config reload automatically.

## 4. Recipes (copy-paste)

### 1) Explore → Build (codebase onboarding)

```text
Ask the explore subagent to map how request timeouts are configured and return files + defaults.
[then, in same session]
Apply the 30s default change and run the relevant tests.
```

Why: explore has no edit rights, so it cannot accidentally mutate while mapping.

### 2) Parallel fan-out (background)

```text
Launch three background subagents: (1) explore auth flow, (2) explore DB migrations, (3) general to summarize open TODOs. Synthesize when all finish.
```

Each background child returns `sessionID`; re-prompt by ID for follow-ups instead of respawning.

### 3) Review gate (quality)

```text
Use the reviewer subagent to review my current changes before I commit.
```

Reviewer is `edit/shell: deny`, so findings are read-only by construction.

### 4) Plan → Execute (risky changes)

`/plan migration` switches current session to `plan` (read-only). Then:

```text
Hand this plan to build and implement it step by step, running tests after each step.
```

Or encode as command (`.opencode/commands/plan.md` with `agent: plan`).

### 5) Reusable skill for the team (`/v2/docs/skills/`)

```markdown title=".opencode/skills/git-release/SKILL.md"
---
name: Git Release
description: Prepare release notes, version bumps, and GitHub releases
---

## Workflow
1. Read `references/release-policy.md`.
2. Summarize merged changes since the previous tag.
3. Propose the version bump before changing files.
```

Model discovers skill by `description`, loads via `skill` tool (permission `skill` + ID). Skills add instructions, not tools — pair with subagents for execution.

## 5. Model + context rules that bite

- Subagent uses its `model` if set, else inherits parent session model. Set `model: provider/model#variant` on the agent or command when quality matters; command model beats agent model beats session model.
- Selecting a primary agent by ID does **not** change the session model. Set both explicitly for reproducibility.
- `steps: 8` caps model steps; on the final step tools are stripped and a text summary is forced. New user input resets the budget.
- Background children survive parent input — keep parent prompts small while children run; large parent context does not auto-share with children.

## 6. Verify + troubleshoot

```bash
# files discovered?
ls .opencode/agents/ .opencode/commands/ .opencode/skills/
# permissions effective?
grep -A5 '"agents"' opencode.jsonc
# headless smoke test
opencode run "Use the explore subagent to list the top-level docs and return filenames."
```

| Symptom | Cause | Fix |
|---|---|---|
| `subagent` never fires / asks every time | `subagent` permission `ask` or `deny` on parent | Allowlist agent ID (see §3) |
| Child edits files it shouldn't | Child uses its own permissions | Add `edit/shell: deny` on the subagent |
| Skill not offered | Missing `description`, wrong filename, or `skill` denied | Use `<id>/SKILL.md` or root `<id>.md`, exact case-sensitive ID, `skill: allow` |
| Command runs in wrong session | `subagent` flag vs agent mode mismatch | Set `subagent: true/false` explicitly |
| Need deeper than 1 level | Hard limit (depth 1) | Flatten: parent fans out, children never spawn |

## 7. What not to do (V2-specific)

- Do not port V1 `task`/`bash`/`permission` configs verbatim — V2 uses `subagent`/`shell`/`permissions` (`/v2/docs/permissions/` warning).
- Do not use legacy agent fields `temperature`, `tools`, `prompt`, `disable`, `maxSteps` — V2 ignores them; configure providers/models instead.
- Do not expect `oh-my-openagent`-style orchestration — on V2 that plugin fails load (`{id,server}` vs `{id,setup}`); the patterns above are the native replacement.
- Do not put secrets in `!` shell blocks in shared commands — they run pre-submission, outside approval flow.

## 8. Suggested next step for this workspace

You currently have zero custom agents/commands/skills. Create these three files to get full multi-agent coverage:

1. `.opencode/agents/reviewer.md` (§3 snippet)
2. `.opencode/commands/audit.md` (§2C snippet, `subagent: true`)
3. `.opencode/agents/orchestrator` allowlist in `opencode.jsonc` (§3 snippet)

Then run: `Use the explore subagent to map this repo, then have reviewer critique the map.` — foreground chain proving both delegation modes in one session.
