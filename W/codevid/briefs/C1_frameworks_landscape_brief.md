## C1 — Engine landscape

### Verdict
- **Remotion (v4.0.533, verified on npm)** is the most complete code-driven video framework for React/TS: frame-pure model (`useCurrentFrame`, `interpolate`, `spring`), bundled FFmpeg, `@remotion/three` for R3F, and first-party Agent Skills. Licensing is **source-available, free for individuals and companies ≤3 people**, then paid.
- **Motion Canvas (v3.17.2, MIT)** uses generator functions (`yield`/`yield*`) for timeline control — better for math/explainer work, no React dependency, smaller ecosystem.
- **Manim CE (Python, MIT)** and **3b1b/ManimGL (Python, MIT)** remain the reference for LaTeX/math animation; Cairo (CPU, stable) vs OpenGL (GPU, faster).
- **Blender (bpy, GPL)** is the only code path to production-grade 3D; headless CLI + FFmpeg out.
- **Interactive libraries (Framer Motion, GSAP, Motion One, Anime.js, react-spring, Rive, Lottie) are traps for deterministic frame rendering** — they depend on the browser event loop / WAAPI. They must be driven frame-by-frame manually or not used.

### Table: Name | Lang | Model | Renderer | License | Best for
| Name | Lang | Model | Renderer | License | Best for |
|---|---|---|---|---|---|
| Remotion v4.0.533 | TS/React | Frame-pure (`useCurrentFrame`, `interpolate`, `spring`, `Sequence`, `Series`) | Chromium headless + bundled FFmpeg | Source-available; free ≤3 people | Motion graphics, productized video, AI-agent pipelines |
| Motion Canvas v3.17.2 | TS | Generator (`function*`, `yield`, `tween`, `all`, `chain`, `sequence`) | Canvas 2D / WebGL | MIT | Explainer/math vector animation, voiceover sync |
| Manim CE | Python | Imperative scene (`self.play`, `Create`, `Transform`) | Cairo (CPU) default | MIT | Math/LaTeX explainers, precise geometry |
| 3b1b/ManimGL | Python | Imperative + OpenGL | OpenGL (GPU) | MIT | 3b1b-style videos, faster preview |
| Blender | Python (`bpy`) | Imperative + Geometry Nodes | EEVEE Next / Cycles | GPL-3.0 | High-end 3D motion, photoreal, physics |
| `@remotion/three` + R3F | TS/React | Frame-pure via `useCurrentFrame` inside `<ThreeCanvas>` | Three.js WebGL / WebGPU | Same as Remotion | 3D inside the Remotion pipeline |
| canvas-record v5.13.0 | TS/JS | Frame-by-frame `recorder.step()` | WebCodecs / WASM FFmpeg / MP4Wasm | MIT | Browser-side canvas/WebGL/WebGPU capture |
| glsl-to-mp4 | Python/GLSL | Shader-per-frame (seed-driven) | ModernGL → ffmpeg pipe | MIT (shaders CC-BY-NC-SA) | Shadertoy-style GLSL → video |
| Motion One | TS/JS | **Archived Nov 2024** — WAAPI polyfill | DOM (WAAPI) | MIT | Not for video rendering |
| Framer Motion / Motion v14 | TS/React | Spring/transition (React cycle) | DOM | MIT | UI animation, not frame-deterministic |
| GSAP v3.15.0 | TS/JS | Timeline/tween (global ticker) | DOM/Canvas/WebGL | Free core | Complex sequencing, not frame-pure |
| Rive (`.riv`) | TS/WASM/C++ | State machine (visual editor) | Canvas/WebGL | Runtime MIT, editor proprietary | Interactive runtime, not offline video |
| Lottie / dotLottie v2.44.0 | TS/JS | JSON (pre-baked from After Effects) | Canvas/SVG | MIT | Pre-baked vector animation |
| Playwright v1.59+ | TS/JS | Browser automation capture | Chromium/Firefox/WebKit | Apache-2.0 | Test videos, not generative |

### Deep findings (with source URLs)
- Remotion v4.0 bundled FFmpeg (v6.0) and dropped `ffmpegExecutable`; config moved to `@remotion/cli/config`; Node ≥16 required. https://www.remotion.dev/docs/4-0-migration
- Remotion **company license** since v4: free for individuals and orgs ≤3 people; ≥4 seats requires a Company License — Remotion for Creators **$25/mo per seat**, Remotion for Automators **$0.01 per render, $100/mo minimum**, Enterprise from **$500/mo**. Verified directly from the pricing page. https://www.remotion.dev/docs/license/pricing
- Remotion is **source-available, not OSI open source**; there is **no functional difference** between free and paid. https://www.remotion.dev/docs/license/faq
- **Agent Skills** install with `npx skills add remotion-dev/skills`; 12 skills are shipped (`remotion-best-practices`, `-create`, `-markup`, `-studio`, `-render`, `-maps`, `-captions`, `-saas`, `-interactivity`, `-docs`, `-multimedia`, `-upgrade`). Verified by installing them locally. https://www.remotion.dev/docs/ai/skills
- All `@remotion/*` packages are version-locked together (verified: every `@remotion/*` package resolves to `4.0.533`); `npx remotion add <pkg>` enforces the exact version.
- `@remotion/three` provides `<ThreeCanvas>` (WebGL) and `<ThreeWebGPUCanvas>` (Three.js `WebGPURenderer`, TSL node materials). `<Sequence>` inside a canvas **must** be `layout="none"`; SSR needs `"gl": "angle"`. https://www.remotion.dev/docs/three
- Motion Canvas flow generators: `yield` = "frame ready", `yield*` delegates to tweens, with flow generators `all`, `any`, `chain`, `sequence`, `delay`, `loop`. https://motioncanvas.io/docs/flow/
- Two Manim forks: `3b1b/manim` (ManimGL, OpenGL) vs `ManimCommunity/manim` (ManimCE, Cairo default). Both MIT; community edition recommended for docs/stability. https://github.com/3b1b/manim · https://github.com/ManimCommunity/manim
- Blender headless: `blender -b -P script.py --render-output //out_ -F FFMPEG -x 1 -a`. EEVEE Next (real-time raster) vs Cycles (path trace). https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html
- **canvas-record** records 2D/WebGL/WebGPU canvas per frame via `recorder.step()`; WebCodecs is 5–10× faster than WASM encoders, but caps at **~9.4M px/frame** (~4K 16:9 @30). https://github.com/dmnsgn/canvas-record
- **Motion One is archived** (read-only repo since Nov 2024) — do not build new pipelines on it. https://github.com/motiondivision/motionone

### Hidden shortcuts / gotchas
- `<Sequence layout="none">` is mandatory inside `<ThreeCanvas>` or the wrapper `<div>` breaks WebGL. https://www.remotion.dev/docs/three
- Headless SSR of WebGL needs `"chromiumOptions": {"gl": "angle"}`; a local config file does **not** apply to `renderMediaOnLambda()`. https://www.remotion.dev/docs/three
- `staticFile()` auto-encodes URI-unsafe characters in v4 — pre-encoding breaks it. https://www.remotion.dev/docs/4-0-migration
- Blender's `--render-output` must come **after** the `.blend` is loaded or it gets overwritten. https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html
- glsl-to-mp4's bundled shaders are **CC-BY-NC-SA** — not commercially usable. https://github.com/nabeel-oz/glsl-to-mp4
- Rive video export requires a **paid plan** + cloud render. https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design
- GSAP / Framer Motion / Rive / Lottie assume the browser event loop; forcing determinism means driving them manually, which defeats their purpose. https://www.remotion.dev/docs/third-party

### Free-model feasibility (what an LLM writes vs what must be hand-authored)
- **High confidence (LLM writes these):** Remotion compositions, `interpolate`/`spring` timing, `Sequence`/`Series`/`TransitionSeries` structure, design tokens, Motion Canvas generator scenes, Manim CE scenes, `bpy` scripts.
- **Medium:** `@remotion/three` / R3F scenes, ffmpeg filtergraph chains, canvas-record loops.
- **Low (hand-author):** Geometry Nodes graph construction, complex GLSL math, Blender Cycles node materials, Rive editor state machines.
- **License gate:** solo or ≤3-person use is fully free; a company of 4+ needs a paid license.

### Sources
https://www.remotion.dev/docs/remotion · /docs/use-current-frame/ · /docs/three/ · /docs/ai/skills · /docs/license/pricing · /docs/license/faq · /docs/4-0-migration · https://github.com/remotion-dev/remotion/releases · https://motioncanvas.io/docs/flow/ · https://github.com/motion-canvas/motion-canvas · https://github.com/3b1b/manim · https://github.com/ManimCommunity/manim · https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html · https://github.com/dmnsgn/canvas-record · https://github.com/nabeel-oz/glsl-to-mp4 · https://github.com/motiondivision/motionone · https://www.remotion.dev/docs/third-party · https://playwright.dev/docs/videos · https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design