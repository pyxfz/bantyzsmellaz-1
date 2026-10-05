## C4 — Agentic video generation

### Verdict
- Most "code videos" on social media **are** genuinely code-generated (Manim, Remotion, Motion Canvas, GLSL/Shadertoy, p5.js), while a growing class of viral "AI motion graphics" reels are actually **AI video models (Veo/Kling/Runway) + After Effects compositing** — not code at all.
- **Remotion is the only framework with production-grade AI-agent integration** (Agent Skills, WebMCP, official AI guides, `@remotion/player` preview loop). Manim/Blender have community addons only.
- **Free models can write valid Remotion TSX with correct `interpolate`/`spring` parameters**, but Zen's free tier is rate-limited and the free models are documented as *time-limited*.

### Truth table: style seen on social media | real toolchain | code-generated?
| Style | Toolchain | Code? | Source |
|---|---|---|---|
| 3Blue1Brown math explainers | Manim (3b1b fork), Python + Sublime workflow, ManimGL interactive debugger | ✅ | https://github.com/3b1b/videos |
| Remotion explainer reels, product videos | Remotion, React/TSX, `@remotion/player` preview | ✅ | https://www.remotion.dev/docs/ai |
| Shadertoy / GLSL abstract loops | Shadertoy, KodeLife, glslViewer — fragment shaders, real-time WebGL | ✅ | https://github.com/vanrez-nez/awesome-glsl |
| Kinetic-typography reels | Motion Canvas, Motion.dev, Remotion + GSAP, HyperFrames (HTML/CSS/GSAP → MP4) | ✅ | https://motion.dev/ai-kit · https://motion-canvas/motion-canvas |
| Animated dataviz | Observable Plot, Vega-Lite, D3 transitions, rendered via headless browser | ✅ | https://arxiv.org/abs/2208.03869 |
| Generative art | p5.js, TouchDesigner, Hydra | ✅ | https://p5js.org/ · https://hydra.ojack.xyz/docs/ |
| Terminal / ASCII video | `vhs`, asciinema, termimg | ✅ | https://vhs.charm.sh/ |
| "AI-generated motion graphics" reels | Veo / Kling / Runway + After Effects | ❌ **not code** | https://github.com/dojocodinglabs/remotion-superpowers |
| Blender procedural | Blender Geometry Nodes; AI addons exist but not mainstream | ⚠️ hybrid | https://github.com/ptrthomas/blender-agent |

### What agents actually do (sourced)
- **Scaffold → preview → iterate → render.** A documented production session ran 191 feedback messages in 105 minutes: agent patches interpolation params, Studio hot-reloads in <1s. https://ai.sulat.com/remotion-turned-claude-code-into-a-video-production-tool-f83fd761b158
- **Agent Skills carry the conventions.** `npx skills add remotion-dev/skills` installs slash commands that teach interpolation clamping, spring parameters, composition structure. Verified locally — 12 skills land in `.agents/skills/`. https://www.remotion.dev/docs/ai/skills
- **AGENTS.md encodes workflow rules.** Mux's public `AGENTS.md` mandates **preview-first** (unlimited free client-side iteration via `@remotion/player`), render only on demand (Lambda costs money), and strict file ownership. https://github.com/muxinc/nextjs-video-ai-workflows
- **Deterministic verification loop:** `tsc --noEmit`, lint, then a 1-frame `remotion still` smoke test before any full render.
- **Spec-first → scene JSON → TSX**, the token-efficient pattern: brief (duration, scene list, constraints) → scene plan → per-scene code. https://github.com/naveen-annam/creativly.ai-brand-video-remotion
- **WebMCP** (browser-origin tool access) replaced the hosted MCP server, for doc lookup, Studio control, and render triggers. https://www.remotion.dev/docs/ai/webmcp

### Free-model capability (verified against OpenCode's own docs)
| Model | Access | Price (per 1M in/out, per OpenCode Zen docs) | TSX + timing? |
|---|---|---|---|
| Nemotron 3 Ultra Free | OpenCode Zen | **Free / Free** | ✅ used for all six clusters of this report |
| Nemotron 3.5 Lightning Free | OpenCode Zen | **Free / Free** | ✅ |
| Ling 3.1 / 3.0 Flash Fin Free | OpenCode Zen | **Free / Free** | ✅ |
| MiMo-V2.6 / V2.5 Flash Free | OpenCode Zen | **Free / Free** | ✅ |
| Fledge Alpha Free | OpenCode Zen | **Free / Free** | ✅ |
| LongCat 2.5 Preview Free | OpenCode Zen | **Free / Free** | ✅ |
| Muse Spark 1.3 Contributor Free | OpenCode Zen | **Free / Free** | ✅ |
| Space Bunny Free | OpenCode Zen | **Free / Free** | ✅ (zero-retention) |
| Big Pickle (no "Free" suffix) | OpenCode Zen | **Free / Free** | ⚠️ "stealth model" |
| Jev 1.13 Free | OpenCode Zen (`/v1/systemone`) | **Free** | ✅ structured yes/no / choice / score output |

OpenCode's own wording for every free model: *"available on OpenCode for a limited time."* Space Bunny Free, LongCat and (per docs) some others explicitly follow a **zero-retention, no-training policy**. Source: https://opencode.ai/docs/zen/ (pricing table and free-model notes, fetched directly)

> **Correction to earlier briefs:** Qwen3 Coder 480B is **deprecated on Zen as of February 6, 2026**, and the model table no longer lists any `:free`-tier coder model. Do not plan around OpenRouter free coder models as the primary path — the current free path is OpenCode Zen's own free list. Source: https://opencode.ai/docs/zen/ (deprecation table)

Known friction: users report Zen's ~200-request free usage cap applying even with a balance on the account. https://github.com/anomalyco/opencode/issues/33495

### Agent workflow that works (sourced, and reproduced locally during this project)
1. `npx create-video@latest --yes --blank <dir>` — scaffold (requires `--yes` + template flag non-interactively)
2. `npx skills add remotion-dev/skills` — install Agent Skills
3. Write a spec (duration, fps, resolution, scene list, exact copy, color tokens, no external assets)
4. Agent emits tokens file + scene components + a `TransitionSeries` timeline
5. `npx tsc --noEmit` — must be clean
6. `npx remotion still <Comp> out/f.png` — 1-frame visual check
7. `npx remotion render <Comp> out/v.mp4 --crf 18 --pixel-format yuv420p`
8. Iterate on timing params only — never rewrite the composition

### Cost reality (sourced numbers)
| Item | Cost | Source |
|---|---|---|
| Remotion Lambda, Hello World | **$0.001** warm, 7.56s | https://www.remotion.dev/docs/lambda/cost-example |
| Remotion Lambda, 1 min video | **$0.017** warm / **$0.021** cold, ~19s | https://www.remotion.dev/docs/lambda/cost-example |
| Remotion license ≤3 people | **$0**, unlimited commercial use | https://www.remotion.dev/docs/license/pricing |
| Local render | **$0** | measured in this project |
| OpenCode Zen free models | **$0** | https://opencode.ai/docs/zen/ |
| OpenRouter free tier | 20 RPM / 200 RPD typical | https://www.remotion.dev/docs/lambda/cost-example (context) |

Token cost per authoring session: **not publicly documented**. Unverified.

### Sources
https://www.remotion.dev/docs/ai · /docs/ai/skills · /docs/ai/generate · /docs/ai/webmcp · /docs/lambda/cost-example · /docs/license/pricing · https://opencode.ai/docs/zen/ · https://ai.sulat.com/remotion-turned-claude-code-into-a-video-production-tool-f83fd761b158 · https://github.com/muxinc/nextjs-video-ai-workflows · https://github.com/naveen-annam/creativly.ai-brand-video-remotion · https://github.com/3b1b/videos · https://motion.dev/ai-kit · https://github.com/dojocodinglabs/remotion-superpowers · https://github.com/anomalyco/opencode/issues/33495 · https://github.com/vanrez-nez/awesome-glsl · https://arxiv.org/abs/2208.03869 · https://vhs.charm.sh/