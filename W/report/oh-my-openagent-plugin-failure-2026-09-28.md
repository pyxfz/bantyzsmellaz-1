# oh-my-openagent Plugin Failure on OpenCode v2.0.18 — Diagnosis & Fix

**Date:** 2026-09-28
**Host:** Linux, OpenCode `v2.0.18`, plugin `oh-my-openagent@latest` resolved to `5.0.1`
**Scope:** `~/.config/opencode/opencode.json`, `cli.json`, `tui.json`, `~/.local/share/opencode/log/opencode.log`

## 1. Executive summary

The plugin cannot work on this host. It is a **V1-only plugin** running on a **V2-only loader**.

- Installed export (`dist/index.js`): `{ id: "oh-my-openagent", server: [Function] }` — V1 `PluginModule` shape.
- V2 loader requires: `{ id, setup(ctx) }` or `{ id, effect }` via `Plugin.define()` from `@opencode/plugin`.
- Result: every server start logs `failed to load plugin` and the plugin is silently unavailable (no agents, skills, tools).
- Secondary issues: wrong config keys spread across three files (`plugin` vs `plugins`, invalid `tui.json`, server plugin misplaced in `cli.json`).

No config edit alone will make `5.0.1` load on `2.0.18`. You must either downgrade OpenCode to V1, or disable the plugin on V2 until upstream ports it.

## 2. Evidence (local, verified)

### 2.1 Loader error — `~/.local/share/opencode/log/opencode.log`

Repeated on every boot:

```text
msg="loading plugin" id=oh-my-openagent entrypoint=file:///home/vscode/.cache/opencode/npm/oh-my-openagent@latest/1790519771903/node_modules/oh-my-openagent/dist/index.js
level=WARN message="failed to load plugin" target=oh-my-openagent
cause="Cause([Fail(PluginModule.LoadError: Plugin must export a default definition with an id and an effect or setup function. (cause: SchemaError(Missing key
  at ["default"]["effect"]
Missing key
  at ["default"]["setup"])))])"
```

### 2.2 Actual export shape — node import

```js
keys: [ 'default', 'omoPlugin' ]
default keys: [ 'id', 'server' ]
default: {"id":"oh-my-openagent","server":"[Function serverPlugin]"}
```

`effect` and `setup` are both absent. This exactly matches the schema error above.

`package.json` confirms V1 lineage: `depends on @opencode-ai/plugin` (V1 package name; V2 renamed to `@opencode/plugin`), `version 5.0.1`, `dist-tags { latest: 5.0.1, beta: 5.0.1 }`.

### 2.3 CLI state — `opencode v2.0.18`

```text
$ opencode plugin list
ID                VERSION  SOURCE
-                 -        oh-my-openagent        # server: no version, failed
-                 5.0.1    oh-my-openagent@latest # TUI side: cached only

$ opencode plugin check
Server
  oh-my-openagent (check failed)
TUI
  oh-my-openagent@latest 5.0.1 (current)
```

Server = failed, TUI = cached but `Invalid V2 TUI plugin module` per upstream issues.

### 2.4 Config files (all three are wrong in different ways)

`~/.config/opencode/opencode.json` (current):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["oh-my-openagent"]
}
```

`~/.config/opencode/cli.json`:

```json
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "plugins": ["oh-my-openagent@latest"]
}
```

`~/.config/opencode/tui.json`:

```json
{
  "plugin": ["oh-my-openagent@latest"]
}
```

`~/.config/opencode/plugin-intent.txt` already notes:

```text
# Intended plugin (currently INCOMPATIBLE with opencode v2.0.18)
# oh-my-openagent@latest  ->  5.0.1
# Reason: ships default export {id, server}; opencode v2 requires {id, effect} or {id, setup}
```

## 3. Root cause

### Primary: V1 plugin API vs V2 loader (breaking change, intentional)

Per https://opencode.ai/v2/docs/migrate-v1 and https://opencode.ai/v2/docs/build/plugins:

> `V1 plugin implementations do not run in V2.` One of three intentional V2 breaks is the plugin API.

|  | V1 (what you have) | V2 (what 2.0.18 wants) |
|---|---|---|
| Package | `@opencode-ai/plugin` | `@opencode/plugin` |
| Export | `{ id, server: async (input) => Hooks }` | `Plugin.define({ id, setup(ctx) {...} })` or `{ id, effect }` |
| Hooks | `(input, output)` return-object | `(event)` mutable draft + `ctx.tool.transform`, `ctx.session.hook`, `ctx.event.subscribe`, etc. |
| TUI | `tui.json(c)` layered | single global `cli.json` |
| Config key | `plugin` (V1 tuple form) | `plugins` (string or `{package, options}`) |

V1 `server()` return value is treated as hooks; V2 `setup()` return value is treated as an unload disposer. There is no compat shim — unknown key `server` is ignored, then validation fails for missing `setup`/`effect`.

### Secondary: config key / file mistakes

1. `opencode.json` uses `"plugin"` (singular). V2 schema is `"plugins"` (plural). Confirmed by https://opencode.ai/v2/docs/plugins and https://opencode.ai/v2/docs/config. Singular key is ignored.
   - Also uses bare `"oh-my-openagent"` with no version tag; canonical form is `"oh-my-openagent@latest"` or `{ "package": ... }`.
2. `cli.json` `"plugins"` is for **terminal-only CLI plugins** (https://opencode.ai/v2/docs/cli/config). `oh-my-openagent` is a server plugin, not a CLI plugin — it does not belong here.
3. `tui.json` with `"plugin"` is invalid on V2. V2 migrated `tui.json(c)` → global `cli.json` (auto-migrated). This file is dead config and should be removed/ignored.

> Fixing #2 alone does not fix loading — issue #9107 explicitly notes: “renaming `plugin` to `plugins` does not change the error, because the failure is in the module's export shape, not its config entry.” Both layers must be addressed.

## 4. External corroboration (via attached research MCPs)

All four research surfaces agree; no workaround exists on V2 for 5.0.1:

- **TinyFish `search` + `fetch_content`** — found `code-yeongyu/oh-my-openagent#8485` (`@latest = v4.19.4 and 5.0.0-beta.78 is completely incompatible with V2`) and fetched full issue body with server error + TUI error + V1→V2 hook table.
- **Exa `web_search_exa`** — returned `https://opencode.ai/v2/docs/migrate-v1/` highlights: “V1 plugins will not work in V2”, “Rename `plugin` to `plugins`”, plus `oh-my-openagent#6169` (V2 port timeline request, still open).
- **Firecrawl `firecrawl_developer_search`** — returned `issue #8485`, `#8490`, `#8548` (`exports {id, server} instead of {id, setup}`), and playbook `OpenCode 2 plugin porting playbook`: “loader accepts default `{id,effect}` or `{id,setup}`; unknown keys are ignored”.
- **You.com `you-search`** — returned `#8485`, `#9107` (filed 2026-09-28 on `opencode 2.0.18` + `5.0.1`, identical `PluginModule.LoadError`), `#8548` (2.0.11), `#7847` (2.0 preview), `#8295` (2.0.3 beta). All share the same `Missing key at ["default"]["effect"]/["setup"]` signature.
- **Official docs fetched directly** (`webfetch`): `/v2/docs/build/plugins`, `/v2/docs/config`, `/v2/docs/plugins`, `/v2/docs/cli/config`, `/v2/docs/troubleshooting`, `/v2/docs/migrate-v1`.

Relevant upstream to watch: `code-yeongyu/oh-my-openagent#8485` (V2 support tracker), `#9107` (2.0.18 repro), `#6169` (port timeline). Community dual-host fork pattern exists (`oh-my-opencode-slim` `src/v2/setup.ts` adapter), but `oh-my-openagent@5.0.1` itself has no such adapter.

## 5. Fix — choose one path

### Path A (recommended if you need the plugin now): downgrade to OpenCode V1.18.x

The plugin works on V1. Keep V2 off PATH first (V1 and V2 share the `opencode` command).

```bash
# 1. Back up current V2 config
cp ~/.config/opencode/opencode.json ~/.config/opencode/opencode.json.v2.bak
cp ~/.config/opencode/cli.json ~/.config/opencode/cli.json.v2.bak 2>/dev/null

# 2. Remove V2 binary (pick your installer)
# npm:
npm remove -g @opencode/cli 2>/dev/null; npm install -g opencode-ai@1.18.31
# or curl/homebrew per https://opencode.ai/docs — ensure `opencode --version` shows 1.18.x

opencode --version
# expect: 1.18.x

# 3. Correct server config for V1 (plural key is also accepted on late V1; tuple form is legacy)
# ~/.config/opencode/opencode.json:
# {
#   "$schema": "https://opencode.ai/config.json",
#   "plugins": ["oh-my-openagent@latest"]
# }

# 4. Remove server plugin from terminal-only configs
# cli.json: delete "oh-my-openagent@latest" from "plugins" (leave file or remove key if empty)
# tui.json: delete file or remove "plugin" key — V1 uses tui.json for UI prefs, not "plugin"

# 5. Reinstall + restart
opencode plugin add oh-my-openagent@latest
opencode service restart
opencode service status
opencode api get /api/info

# 6. Verify — should be NO "failed to load plugin"
grep -i 'loading plugin\|failed to load plugin' ~/.local/share/opencode/log/opencode.log | tail -n 20
opencode plugin list
```

Success = `plugin list` shows version + source, log shows `loading plugin` without following `failed to load plugin`.

### Path B (stay on V2.0.18): disable plugin, wait for upstream port)

```bash
# 1. Remove from all three places
opencode plugin remove oh-my-openagent@latest 2>&1 || true

# edit ~/.config/opencode/opencode.json -> remove "plugin" key entirely, or set correct empty form:
# { "$schema": "https://opencode.ai/config.json", "plugins": [] }
# edit ~/.config/opencode/cli.json -> remove "oh-my-openagent@latest" (CLI-only plugins only)
# delete or empty ~/.config/opencode/tui.json (dead on V2; auto-migrated to cli.json)

# 2. Clear stale cache (forces clean re-resolve later)
rm -rf ~/.cache/opencode/npm/oh-my-openagent@latest

# 3. Restart + verify clean boot
opencode service restart
tail -n 50 ~/.local/share/opencode/log/opencode.log
opencode plugin list
opencode plugin check
# expect: no oh-my-openagent rows, no "failed to load plugin"
```

Then subscribe to `code-yeongyu/oh-my-openagent#8485` for the V2 port. When a V2-compatible version ships (watch for `@opencode/plugin` dependency + `setup` in release notes), re-add with the **correct V2 form**:

```jsonc
// ~/.config/opencode/opencode.jsonc — V2 only
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["oh-my-openagent@<v2-compatible-version>"]
}
```

```bash
opencode plugin add oh-my-openagent@<v2-compatible-version>
opencode service restart
grep -i 'loading plugin\|failed to load plugin' ~/.local/share/opencode/log/opencode.log | tail
```

### Path C (advanced, interim on V2): dual-support shim or slim fork

Only if you must stay on V2 *and* need orchestration now. Upstream docs (`/v2/docs/build/plugins/migrate-v1`) allow one package to serve both hosts:

```js
export default {
  ...Plugin.define({ id: "oh-my-openagent", async setup(ctx) { /* V2 transforms */ } }),
  async server() { /* existing V1 hooks unchanged */ },
}
```

Options: (a) maintain a local fork adding minimal `setup` next to `server` (load-green only; full harness needs a real port — see issue #7847 discussion), or (b) trial community dual-host build `oh-my-opencode-slim` which ships `src/v2/setup.ts` adapter (note: reduced parity — no foreground model fallback, no programmatic MCP registration, TUI default-agent caveats). This is out of scope for a config fix; treat as a development task.

## 6. Verification checklist (either path)

- [ ] `opencode --version` matches intended major (1.18.x for A, 2.0.18 for B)
- [ ] `~/.config/opencode/opencode.json` uses `"plugins"` (plural), no `"plugin"` key
- [ ] `cli.json` contains no server plugin; `tui.json` removed or plugin-free
- [ ] `opencode service restart` succeeds; `opencode service status` + `opencode api get /api/info` healthy
- [ ] `grep 'failed to load plugin' ~/.local/share/opencode/log/opencode.log` — empty after restart (Path A), or no `oh-my-openagent` lines at all (Path B)
- [ ] `opencode plugin list` reflects expected state

## 7. Files touched / to touch

- `~/.config/opencode/opencode.json` — fix `plugin` → `plugins`, pin version
- `~/.config/opencode/cli.json` — remove server plugin entry
- `~/.config/opencode/tui.json` — remove (V2 dead config)
- `~/.cache/opencode/npm/oh-my-openagent@latest/.../dist/index.js` — evidence only, do not hand-edit (overwritten on install)
- `~/.local/share/opencode/log/opencode.log` — source of truth for `role=server` plugin errors

## 8. Sources

- Local: `opencode.log` (`failed to load plugin` + `Missing key at ["default"]["effect"]/["setup"]`), `node` import showing `{id, server}`, `opencode plugin list/check`, `opencode.json` / `cli.json` / `tui.json`, `plugin-intent.txt`
- Docs: https://opencode.ai/v2/docs/migrate-v1, https://opencode.ai/v2/docs/build/plugins, https://opencode.ai/v2/docs/plugins, https://opencode.ai/v2/docs/config, https://opencode.ai/v2/docs/cli/config, https://opencode.ai/v2/docs/troubleshooting
- Issues (via TinyFish/Exa/Firecrawl/You.com): `code-yeongyu/oh-my-openagent#8485`, `#9107`, `#8548`, `#7847`, `#8295`, `#6169`
