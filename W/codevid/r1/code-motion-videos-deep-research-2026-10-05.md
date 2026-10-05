# How Code-Produced "Very Smooth Motion" Videos Are Actually Made — A Deep Technical Report

**Date:** 2026-10-05
**Time (UTC):** 20:06 – 20:45
**Author:** Research via MCP tools (TinyFish, You.com, Firecrawl, AgentQL) + local verification
**Models used:** `opencode/space-bunny-free` (orchestrator) and `opencode/nemotron-3-ultra-free` (all six research subagents) — **free models only, no paid LLM used at any stage**
**Prior baseline:** `W/report/r1/smooth-coding-videos-twitter-2026-09-27.md` (used as Tier-0; this report supersedes it where it was thin or wrong)
**Cluster briefs:** [`briefs/`](briefs/) — C1 frameworks · C2 motion mechanics · C3 render pipeline · C4 agentic reality · C5 advanced techniques · C6 stack selection
**Local verification:** a real Remotion 4.0.533 project was scaffolded, Agent Skills installed, a composition written, typechecked, and **rendered twice with byte-identical output**. Scratch project moved to `/tmp/opencode/codevid-testing/`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The One-Sentence Answer](#2-the-one-sentence-answer)
3. [What These Videos Actually Are (and What They Aren't)](#3-what-these-videos-actually-are-and-what-they-arent)
4. [The Architecture: Three Layers](#4-the-architecture-three-layers)
5. [The Engines: Landscape and Verdict](#5-the-engines-landscape-and-verdict)
6. [Why the Motion Is Smooth — The Actual Mechanics](#6-why-the-motion-is-smooth--the-actual-mechanics)
7. [The Seven Rules That Produce "Expensive" Motion](#7-the-seven-rules-that-produce-expensive-motion)
8. [The Render Pipeline: Code to MP4](#8-the-render-pipeline-code-to-mp4)
9. [Measured Locally: Proof It Works and What It Costs](#9-measured-locally-proof-it-works-and-what-it-costs)
10. [Advanced Techniques and Hidden Shortcuts](#10-advanced-techniques-and-hidden-shortcuts)
11. [The Free Model Path (No Expensive LLM)](#11-the-free-model-path-no-expensive-llm)
12. [Project Architecture That Makes Free Models Sufficient](#12-project-architecture-that-makes-free-models-sufficient)
13. [The Trap: Interactive Libraries Are Not Frame-Pure](#13-the-trap-interactive-libraries-are-not-frame-pure)
14. [Determinism: How to Get Byte-Identical Renders](#14-determinism-how-to-get-byte-identical-renders)
15. [Cost Model: What Is Actually Free](#15-cost-model-what-is-actually-free)
16. [Complete Build Recipe](#16-complete-build-recipe)
17. [Delivery Specs](#17-delivery-specs)
18. [Effort Reality and Failure Modes](#18-effort-reality-and-failure-modes)
19. [Corrections to the Prior Report](#19-corrections-to-the-prior-report)
20. [Framework and Tool Reference](#20-framework-and-tool-reference)
21. [Sources](#21-sources)
22. [Bottom Line](#22-bottom-line)

---

## 1. Executive Summary

> **TL;DR:** The smooth videos flooding social media are **deterministic programs**, not generated footage. A React component tree computes `frame → pixels`; a headless Chromium renders one frame at a time; FFmpeg stitches them into an MP4. Nothing about the smoothness comes from the AI — it comes from **frame-pure determinism** plus **correct easing/spring mathematics**. The AI's only job is writing that component tree, which is ordinary code generation. That is why free models are sufficient, and why "you need an expensive LLM for motion design" is a category error: the expensive model would write slightly nicer first drafts, and then the render would be *byte-identical* anyway.

### Key findings

| Finding | Detail | Evidence |
|---|---|---|
| **What the videos are** | Programs. Video = a pure function of an integer frame index | §6, §14 |
| **Default engine** | Remotion 4.0.533 (React + TypeScript), source-available, free for individuals and orgs ≤3 people | §5, §15 |
| **The AI's role** | Writes TSX and timing parameters. It never touches pixels or tokens-per-frame | §11 |
| **AI video models are a different product** | Veo / Kling / Runway + After Effects make *footage*; that is a different pipeline entirely | §3 |
| **Free models work** | Six research subagents on `nemotron-3-ultra-free` produced the entire research base for this report | §11 |
| **Render cost** | **$0** locally. Measured 19.6 s for a 90-frame 1080×1920 clip on 2 vCPU | §9 |
| **Determinism verified** | Two consecutive renders → identical SHA-256 | §9, §14 |
| **Biggest quality lever** | Correct easing and spring parameters — not resolution, not model tier | §6, §7 |

---

## 2. The One-Sentence Answer

**Every frame is a pure function of its own frame number; animation curves are analytic easing and spring functions evaluated at that number; a headless browser rasterises each frame on demand; FFmpeg encodes the sequence — so the motion is smooth because it is *mathematically* smooth and *reproducible*, and the AI is only a code typist.**

---

## 3. What These Videos Actually Are (and What They Aren't)

This distinction matters because a lot of the "code video" discourse is actually about AI video generation.

### 3.1 Genuinely code-generated

| Style | Toolchain | Code? |
|---|---|---|
| 3Blue1Brown-style math explainers | Manim (Python), ManimGL for fast preview | ✅ |
| Product explainers, social reels, data stories | Remotion (React/TSX) | ✅ |
| Kinetic typography reels | Motion Canvas, Motion.dev, Remotion + GSAP, HyperFrames | ✅ |
| Shader / generative abstract loops | GLSL, Shadertoy, Hydra, p5.js | ✅ |
| Animated charts | Observable Plot, Vega-Lite, D3 transitions | ✅ |
| Terminal / ASCII video | `vhs`, asciinema | ✅ |
| Procedural 3D | Blender `bpy` + Geometry Nodes | ✅ |

Sources: [3b1b/videos](https://github.com/3b1b/videos) · [remotion.dev/docs/ai](https://www.remotion.dev/docs/ai) · [motion-canvas](https://github.com/motion-canvas/motion-canvas) · [awesome-glsl](https://github.com/vanrez-nez/awesome-glsl) · [hydra](https://hydra.ojack.xyz/docs/) · [Animated Vega-Lite (arXiv)](https://arxiv.org/abs/2208.03869) · [vhs](https://vhs.charm.sh/) · [Blender CLI](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

### 3.2 Not code at all

A large share of viral "AI motion graphics" reels are **text/image-to-video models composited in a NLE** — Veo, Kling, Runway, Seedance — sometimes with After Effects finishing passes. That output is *non-deterministic* (no seed reproduces it), it is priced per second of footage, and it is not produced by a coding agent. Repositories that bundle these models as agent plugins exist precisely because creators want the look without writing code.

**How to tell them apart:** if you cannot reproduce it from source, it is not code. If the same prompt gives different output each run, it is a generative video model. Code-rendered video is bit-exact on re-run — that property is the tell.

---

## 4. The Architecture: Three Layers

```
┌──────────────────────────────────────────────────────────────┐
│ Layer 1 — CODING AGENT (OpenCode + free models)              │
│   Role: write React/TSX components and timing parameters     │
│   Cost: $0 (OpenCode Zen free models)                        │
│   Never sees pixels. Never produces video data.              │
├──────────────────────────────────────────────────────────────┤
│ Layer 2 — FRAME-PURE ENGINE (Remotion)                       │
│   Role: frame → pixels, deterministically                    │
│   Primitives: useCurrentFrame, interpolate, spring, Sequence │
│   Cost: $0 for individuals and orgs ≤3 people                │
├──────────────────────────────────────────────────────────────┤
│ Layer 3 — RENDER PIPELINE                                    │
│   bundle() → Chrome Headless Shell → JPEG frames → FFmpeg    │
│   Cost: $0 locally, or AWS-only cost via Lambda              │
└──────────────────────────────────────────────────────────────┘
```

The separation is the whole trick. **Layer 1 produces text. Layer 3 produces pixels. Layer 2 guarantees they line up.** No LLM-generated video frames exist anywhere in this pipeline, which is exactly why model quality and video quality are only loosely coupled.

---

## 5. The Engines: Landscape and Verdict

### 5.1 Comparison

| Engine | Version | Language | Model | Renderer | License | Best for |
|---|---|---|---|---|---|---|
| **Remotion** | **4.0.533** | TS/React | Frame-pure | Chromium headless + bundled FFmpeg | Source-available; **free ≤3 people** | Motion graphics, agent pipelines |
| Motion Canvas | 3.17.2 | TS | Generator (`yield`) | Canvas 2D / WebGL | MIT | Vector explainers, voiceover sync |
| Manim CE | — | Python | Imperative scene | Cairo (CPU) | MIT | Math / LaTeX explainers |
| ManimGL (3b1b) | — | Python | Imperative | OpenGL (GPU) | MIT | Fast preview of math scenes |
| Blender | — | Python (`bpy`) | Imperative + Geometry Nodes | EEVEE Next / Cycles | GPL-3.0 | Production 3D, photoreal |
| Rive | — | TS/WASM | State machine | Canvas/WebGL | Runtime MIT, editor proprietary | Interactive (export is paid) |
| Motion One | archived | TS | WAAPI polyfill | DOM | MIT | **Not for video — archived Nov 2024** |
| GSAP / Framer Motion / Anime.js | 3.15.0 / 14.0.0 | TS | Event-loop driven | DOM | Free core | **Not frame-pure — see §13** |

Versions verified against the npm registry on 2026-10-05. Every `@remotion/*` package resolves to the same version — the registry enforces lockstep.

### 5.2 Why Remotion wins for this use case

1. **First-party Agent Skills.** `npx skills add remotion-dev/skills` installs 12 skills (verified locally). They encode the house conventions, so a free model is being handed the answer key rather than guessing.
2. **An instant preview loop.** `@remotion/player` renders in the browser in real time — iteration costs nothing, so the agent can iterate hundreds of times before a single encode.
3. **Official AI-generation documentation**, including the exact system prompt Remotion recommends.
4. **Free license for individuals and teams of ≤3**, with no functional difference from paid.
5. **Parameters as data.** Compositions accept `--props` JSON, so one codebase renders unlimited videos.

Sources: [license/pricing](https://www.remotion.dev/docs/license/pricing) · [license/faq](https://www.remotion.dev/docs/license/faq) · [ai/skills](https://www.remotion.dev/docs/ai/skills) · [ai/generate](https://www.remotion.dev/docs/ai/generate) · [player](https://www.remotion.dev/docs/player) · [motioncanvas](https://github.com/motion-canvas/motion-canvas) · [ManimCE](https://github.com/ManimCommunity/manim) · [motionone archived](https://github.com/motiondivision/motionone)

---

## 6. Why the Motion Is Smooth — the Actual Mechanics

This is the section the prior report never reached. Smoothness is not a rendering feature; it is a *mathematics* feature.

### 6.1 Frame purity

`useCurrentFrame()` returns the current frame index, **relative to the nearest enclosing `<Sequence from>`**; to get the absolute timeline frame you call it in the top-level component and pass it down as a prop. Frames are 0-indexed, with the last frame being `durationInFrames - 1`.

```tsx
const frame = useCurrentFrame();           // 25 at the top level
// inside <AbsoluteFill from={10}> → returns 15
```

Because no component can observe wall-clock time or mutable global state, frame *N* is computable without computing frames *0…N−1*. That is what enables seeking, parallel rendering across workers, diffing between renders, and reproducibility.

Source: [use-current-frame](https://www.remotion.dev/docs/use-current-frame)

### 6.2 Easing — exact curves

`Easing` ships `linear`, `quad`, `cubic`, `poly` (quartic/quintic and beyond), `bezier`, `circle`, `sin`, `exp`, `back`, `bounce`, `ease`, `elastic`, `spring`.

A cubic Bézier is the cubic polynomial expansion of four control points:

```
B(t) = (1−t)³P₀ + 3(1−t)²t·P₁ + 3(1−t)t²·P₂ + t³P₃
```

**Remotion's house curve is `Easing.bezier(0.16, 1, 0.3, 1)`** — a fast start with a long settle. It appears verbatim in both the official AI guide and the installed markup skill. Use it as your default.

Source: [easing](https://www.remotion.dev/docs/easing)

### 6.3 Springs — the physics

`spring()` is an analytic solution to a damped harmonic oscillator, ported from Reanimated 2:

```
x(t) = e^(−ζω₀t) · [ A·cos(ω₁t) + B·sin(ω₁t) ]
  where  ω₀ = √(stiffness / mass)
         ζ  = damping / (2·√(mass · stiffness))
         ω₁ = ω₀·√(1 − ζ²)          (underdamped case)
```

**Documented defaults: `mass = 1`, `damping = 10`, `stiffness = 100`, `overshootClamping = false`.** The documentation's own advice for a clean push with no bounce is to *raise the damping* — their example uses `damping: 200`.

Critically, Remotion's official AI guide states: **"Prefer `interpolate()` with `Easing` over `spring()` unless physics-based motion is explicitly requested."** Springs everywhere is a common amateur mistake; a spring on every property reads as bouncy toys, not as premium motion design.

Source: [spring](https://www.remotion.dev/docs/spring) · [ai/generate](https://www.remotion.dev/docs/ai/generate)

### 6.4 Clamping and perceptual scale

- `interpolate()` **defaults to `extend`, not `clamp`**. Values keep travelling past your range unless you pass `extrapolateLeft: "clamp"` / `extrapolateRight: "clamp"`. This is the single most common silent animation bug.
- For scale, add `output: 'perceptual-scale'`, because a linear scale ramp reads as *smaller* the larger it gets.
- Multiple keyframes: pass an `easing` **array** with `n − 1` entries for per-segment curves.

```tsx
const scale = interpolate(frame, [0, fps, 9*fps, 10*fps], [0, 1, 1, 0], {
  easing: [Easing.bezier(0.16,1,0.3,1), Easing.linear, Easing.spring({damping: 200})],
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  output: 'perceptual-scale',
});
```

Source: [interpolate](https://www.remotion.dev/docs/interpolate)

### 6.5 Motion blur — the single biggest "premium" tell

`<CameraMotionBlur>` simulates a real shutter. `shutterAngle` **defaults to 180°** (0 disables); the docs list 180° and 90° as the film and TV norms at 24/25/30/50/60 fps. From Remotion 4.0.529, `<HtmlInCanvasMotionBlur>` is the state of the art for blurred animated HTML — `samples` **defaults to 8**, accepts 1–64.

The docs warn explicitly: **"The technique is destructive to colors."** Keep `samples` low and inspect the output.

Sources: [camera-motion-blur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur) · installed `motion-blur.md`

### 6.6 Choreography

A single shared clock drives everything, so staggering is just a frame offset:

```tsx
chars.map((c, i) => spring({ frame: frame - i * 3, fps, config: { damping: 12 } }))
```

`@remotion/transitions` provides `TransitionSeries` with presentations (`fade`, `slide`, `wipe`, `flip`, `clockWipe`) and timings (`linearTiming`, `springTiming`). A **Transition shortens the timeline** — two 60-frame scenes with a 15-frame transition total **105** frames, not 120. An **Overlay does not change duration** and cannot sit adjacent to another overlay or a transition. `springTiming().getDurationInFrames({fps})` returns the computed length so you can size the composition correctly.

Sources: [transitions](https://www.remotion.dev/docs/transitions) · [transitionseries](https://www.remotion.dev/docs/transitions/transitionseries) · installed `transitions.md`

---

## 7. The Seven Rules That Produce "Expensive" Motion

1. **Animate only `transform`-family properties and `opacity`.** Everything else triggers layout and paint. Use `scale` / `translate` / `rotate` shorthands over `transform` strings; reserve strings for `skew()`, `perspective()` or order-sensitive chains.
2. **Clamp every interpolation.** `extend` is the default and it is almost never what you meant.
3. **Use one curve family.** House curve `Easing.bezier(0.16, 1, 0.3, 1)`; reserve springs for physics.
4. **Add motion blur at 180°** with low `samples`. This is what separates "a web page animating" from "footage".
5. **Interpolate colour in OKLab/OKLCH**, not sRGB, or gradients develop a muddy hue shift through grey.
6. **Stagger on a shared beat clock** — overlap, anticipation, follow-through emerge from frame offsets.
7. **Never let CSS `transition` or `animation` do the work.** Remotion's own skill file states these "will not render correctly, they need to be refactored" — and they are the number-one free-model failure mode.

Rules 1 and 7 are quoted from the installed `remotion-markup` skill (v4.0.533); 2–6 from [remotion.dev/docs](https://www.remotion.dev/docs/interpolate-colors/).

---

## 8. The Render Pipeline: Code to MP4

```
code → bundle() → selectComposition() → renderMedia()
     → Chrome Headless Shell (Puppeteer) → per-frame screenshots (JPEG q80)
     → FFmpeg → MP4
```

| Concern | Fact | Source |
|---|---|---|
| Entry point | `renderMedia({composition, serveUrl, codec, outputLocation, concurrency, timeoutInMilliseconds?})`; default timeout **30,000 ms** | [render-media](https://www.remotion.dev/docs/renderer/render-media) |
| Async gate | `delayRender()` / `continueRender()` / `cancelRender()`; **30 s** default per handle, explicit failure at 28,000 ms | [delay-render](https://www.remotion.dev/docs/delay-render/) |
| Browser | Chrome Headless Shell into `node_modules/.remo/`; pinnable with `ensureBrowser({version})`; Lambda supports **only** headless-shell | [chrome-headless-shell](https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell) |
| Codecs | h264 (default), h265, vp8, vp9, av1, prores. **AV1 unavailable on Lambda and Linux ARM64.** VP9/AV1 are "very slow" | [encoding](https://www.remotion.dev/docs/encoding) |
| Quality | h264 default **CRF 18** (range 1–51); lower = better, larger | [encoding](https://www.remotion.dev/docs/encoding) |
| Pixel format | `--pixel-format yuv420p` (plus 422/444 and 10-bit variants) | [cli/render](https://www.remotion.dev/docs/cli/render) |
| Frame format | `--image-format jpeg` (default, faster, no alpha) \| `png` \| `none` | [cli/render](https://www.remotion.dev/docs/cli/render) |
| CLI overrides | `--width --height --fps --duration --concurrency --props` | [cli/render](https://www.remotion.dev/docs/cli/render) |
| Concurrency | default **half your CPU threads**; tune with `npx remotion benchmark` | [performance](https://www.remotion.dev/docs/performance) |
| Lambda sharding | `framesPerLambda` between **20 and ∞**; `concurrency = frameCount / framesPerLambda`; `concurrency: 1` runs on the main function (4.0.517+) | [lambda/concurrency](https://www.remotion.dev/docs/lambda/concurrency) |
| Docker | `node:22-bookworm-slim` + ~15 apt packages; **Alpine and nixOS unsupported** | [docker](https://www.remotion.dev/docs/docker) |
| GPU | Disabled by default; `--gl=angle` / `swiftshader` / `egl` to enable. **Lambda has no GPU** | [gpu](https://www.remotion.dev/docs/gpu) |
| Hardware accel | Available since 4.0.228 | [encoding](https://www.remotion.dev/docs/encoding) |

---

## 9. Measured Locally: Proof It Works and What It Costs

Everything below was executed on this machine on 2026-10-05, not taken from a blog.

### Environment
Node v24.21.0 · npm 11.19.0 · bun 1.4.2 · ffmpeg 8.0.1 · Python 3.14.8 · **2 vCPU / 7 GB RAM / 21 GB disk** · no Chromium pre-installed

### Steps executed
```bash
npx create-video@4.0.533 --yes --blank probe      # --yes needs a template flag to run non-interactively
cd probe && npx skills add remotion-dev/skills    # 12 skills → .agents/skills/
# write a composition: bezier-eased titles, spring-driven stagger,
# 120 random() elements, design tokens
npx tsc --noEmit                                  # exit 0
npx remotion render Probe out/probe.mp4 --codec h264 --crf 18 --pixel-format yuv420p
```

### Results

| Measurement | Result |
|---|---|
| Total first render (bundle + Chrome download + 90 frames) | **19.6 s** |
| Warm benchmark (`npx remotion benchmark`, 1 run) | **8.23 s ± 0.00** |
| Output size | 238 kB |
| `ffprobe` | `h264`, 1080×1920, `30/1` fps, 90 frames, `3.000000 s`, `yuvj420p` |
| **Determinism** | Two consecutive renders → **identical SHA-256** (`8597e421…b0a5`) |

Two findings worth keeping:

- **ffprobe reports `yuvj420p`**, the full-range JPEG-derived variant, even though `yuv420p` was requested. If colour range matters for a deliverable, verify with ffprobe after every render.
- **`--yes` is required for non-interactive scaffolding**, together with a template flag. Bare `create-video` prompts for Agent Skills and will hang in CI.

---

## 10. Advanced Techniques and Hidden Shortcuts

### 10.1 2.5D before 3D

CSS `perspective` + `transform-style: preserve-3d` + layered `translateZ` + stacked `text-shadow` produces parallax, extrusion and fake lighting with **zero GPU cost and perfect determinism**. All transformed siblings need a shared `preserve-3d` ancestor or they flatten. Reach for real 3D only when you actually need it.

Source: [CSS-Tricks](https://css-tricks.com/things-watch-working-css-3d/)

### 10.2 Real 3D inside Remotion

`@remotion/three` ships `<ThreeCanvas>` (WebGL) and `<ThreeWebGPUCanvas>` (Three.js `WebGPURenderer` with TSL node materials). The non-negotiable rules, per the installed skill:

- **`useFrame()` from React Three Fiber is forbidden** — it runs on the wall clock and causes flicker during rendering. Use `useCurrentFrame()`.
- **`<Sequence>` inside a canvas must be `layout="none"`**, otherwise the wrapper `<div>` breaks WebGL.
- **Headless SSR needs `"chromiumOptions": {"gl": "angle"}`**; a local config file does not apply to `renderMediaOnLambda()`.
- `useOffthreadVideoTexture()` yields an exact-frame `ImageTexture` during rendering.

Sources: [three](https://www.remotion.dev/docs/three) · installed `3d.md`

### 10.3 Shaders

GLSL driven by `float t = float(frame) / fps` is frame-exact by construction and loops perfectly. Shadertoy's `iFrame` uniform gives the frame index directly. Hydra compiles JS to WebGL live. Note that glsl-to-mp4's bundled shaders are **CC-BY-NC-SA — not commercially usable**.

Sources: [hydra](https://hydra.ojack.xyz/docs/) · [shadertoy-to-video-with-FBO](https://github.com/danilw/shadertoy-to-video-with-FBO) · [glsl-to-mp4](https://github.com/nabeel-oz/glsl-to-mp4)

### 10.4 Vector, particles, type, assets

| Technique | Tool | Note |
|---|---|---|
| Path morphing | `flubber.interpolate(a, b)` → `t => pathString` | [flubber](https://github.com/veltman/flubber) |
| Draw-on | `stroke-dasharray` + `stroke-dashoffset` | MDN |
| Flow fields / curl noise | `v = curl(Ψ)`, `Ψ = (n₁,n₂,n₃)`, central differences | Bridson 2007, SIGGRAPH |
| Seeded particles | `random('particle-' + i)` | [random](https://www.remotion.dev/docs/random) |
| Kinetic type | per-char `spring({frame: frame - i*3})`; `text.split('')` needs `inline-block` | `transform` is ignored on `inline` |
| Variable fonts | `loadVariableFont()` → `axes.wght` | [load-variable-font](https://www.remotion.dev/docs/google-fonts/load-variable-font) |
| Asset-free art | `<feTurbulence>` + `<feDisplacementMap>` + `<feColorMatrix>` | [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) |
| Audio | `getAudioData()` + `visualizeAudio({fps, frame, audioData})`; `loudnorm=I=-16:TP=-1.5:LRA=11` | [visualization](https://www.remotion.dev/docs/audio/visualization) |

### 10.5 The shortcut list

1. **Data-driven scene spec** — one component tree reads a JSON scene array, so the model fills *data*, not code. [pattern]
2. **Fake 3D with layered 2D** under `perspective: 1000px`. [documented]
3. **`@remotion/player` for instant preview** — sub-second iteration versus a multi-second render. [documented]
4. **Pre-bake heavy loops** once and replay. [folklore]
5. **Sparse render + optical flow fill** — `ffmpeg -vf minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir`. [folklore]
6. **SVG filters over raster ops** for noise, distortion, grading. [documented]
7. **`posterize: n`** for a deliberate stop-motion look. [documented]
8. **`mpdecimate` dedup** before re-encoding. [folklore]
9. **Seed by stable identity**, not by loop counter. [documented]
10. **Light-leak overlays** at cut points via `<Solid effects={[lightLeak({progress})]}>`. [documented]

---

## 11. The Free Model Path (No Expensive LLM)

### 11.1 What OpenCode Zen actually offers today

Fetched directly from [opencode.ai/docs/zen](https://opencode.ai/docs/zen/) on 2026-10-05:

| Model | Zen price (in/out per 1M) | Notes |
|---|---|---|
| Nemotron 3 Ultra Free | **Free / Free** | Used for all six clusters of this report |
| Nemotron 3.5 Lightning Free | **Free / Free** | |
| Ling 3.1 Flash Free | **Free / Free** | |
| Ling 3.0 Flash Fin Free | **Free / Free** | |
| MiMo-V2.6-Flash Free | **Free / Free** | |
| MiMo-V2.5 Free | **Free / Free** | |
| Fledge Alpha Free | **Free / Free** | |
| LongCat 2.5 Preview Free | **Free / Free** | zero-retention, no training |
| Muse Spark 1.3 Contributor Free | **Free / Free** | |
| Space Bunny Free | **Free / Free** | zero-retention, no training |
| Big Pickle | **Free / Free** | "stealth model" |
| Jev 1.13 Free | **Free** | Structured yes/no / choice / score decisions, not code |

**OpenCode's own caveat, verbatim:** every free model is *"available on OpenCode for a limited time."* Treat this as a dated snapshot.

**Known friction:** users report the ~200-request free cap still applying even with a balance on the account ([issue #33495](https://github.com/anomalyco/opencode/issues/33495)). Budget for retries rather than assuming headroom.

### 11.2 Why free models are sufficient here

| Capability needed | Required difficulty | Free-model verdict |
|---|---|---|
| Write valid TSX + hooks | Routine coding | ✅ |
| Use `interpolate`/`spring` with documented params | Pattern recall from docs | ✅ |
| Fill a JSON scene spec | Structured output | ✅✅ (the easiest possible task) |
| Choose easing curves well | Aesthetic judgement | ⚠️ human-in-the-loop via house curve |
| Complex GLSL / `bpy` / Geometry Nodes | Specialist | ❌ hand-author |

The trick is that rows 1–3 are ordinary code generation, and the row-4 judgement is removed by **hard-coding the house curve** rather than asking the model to choose. That is what pushes this workload entirely into the free tier.

### 11.3 Honest counterargument

A frontier model will produce a better first draft, and will recover from a bad architecture faster. Free models are cheaper per token but burn more turns. The economics still favour free, because turns are free too — but if you are on a deadline, the first-draft quality difference is real. The prior report's framing that model choice is *irrelevant* is too strong: it is irrelevant to **rendering determinism**, and relevant to **authoring speed**.

---

## 12. Project Architecture That Makes Free Models Sufficient

This is the highest-leverage section in the report. If you skip it, you will need an expensive model; if you adopt it, you will not.

1. **Scene spec as a discriminated union**, validated with Zod (`@remotion/zod-types` is published and version-matched):
   ```ts
   type SceneSpec =
     | { kind: "title";  props: TitleProps }
     | { kind: "chart";  props: ChartProps }
     | { kind: "ending"; props: EndingProps };
   ```
2. **One `tokens.ts`** holding colours, easings, durations, safe-area insets. This is what stops a free model from inventing ugly values on every scene.
3. **Component library of pure functions** taking only spec props. No inline magic numbers, ever.
4. **`satisfies` type constraints** — compile-time rejection of malformed specs. Cheap substitute for a smarter model.
5. **Animation primitives only** — `interpolate(...)` with clamping and an explicit easing, plus `spring({frame, fps, config})`. Ban raw `frame / fps` arithmetic.
6. **Preview-first.** `@remotion/player` or `remotion studio` for iteration; encode only when the frame is right.
7. **Install the Agent Skills** rather than writing your own rules file — they are maintained upstream.

Sources: [ai/skills](https://www.remotion.dev/docs/ai/skills) · [ai/generate](https://www.remotion.dev/docs/ai/generate) · installed `remotion-markup` skill

---

## 13. The Trap: Interactive Libraries Are Not Frame-Pure

GSAP, Framer Motion / Motion, Motion One, Anime.js, react-spring, Rive and Lottie all assume the browser event loop, `requestAnimationFrame`, or the Web Animations API. They advance on **wall-clock time**. In a renderer that seeks to frame *N* and expects a fixed answer, that assumption breaks: you get correct motion in the preview and wrong, non-reproducible frames in the render.

To use them you would have to drive them frame-by-frame manually — at which point you have reimplemented `interpolate()` and gained nothing.

- **Use them** for the interactive preview layer (Studio, a website, a React app).
- **Do not use them** inside the render path.
- **Motion One is archived** (Nov 2024) — do not build anything new on it.
- **Rive's video export requires a paid plan** and cloud rendering.
- **Lottie** is pre-baked JSON from After Effects, not generated by code.

Sources: [third-party](https://www.remotion.dev/docs/third-party) · [motionone](https://github.com/motiondivision/motionone) · [rive export](https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design)

---

## 14. Determinism: How to Get Byte-Identical Renders

| Pitfall | Symptom | Fix |
|---|---|---|
| Font fallback / swap | Text renders differently per machine | Bundle via `@remotion/fonts` / `@remotion/google-fonts`; avoid relying on system fonts |
| Wall-clock leakage | Motion drifts, re-renders differ | Derive time from `useCurrentFrame()` and `fps` only |
| `Math.random()` | Different every run, and different per worker thread | `random(seed)` |
| GPU presence | SwiftShader vs GPU → different pixels | Force `--gl=swiftshader` consistently; Lambda has no GPU |
| Chrome version drift | Rasterisation changes after auto-update | Pin with `ensureBrowser({version})`; lock `@remotion/renderer` |
| Network assets | `delayRender` timeouts, frame variance | Bundle all assets locally |
| Concurrency pressure | Video elements skip loading → timeout | Lower `--concurrency`; prefer `<Video>` from `@remotion/media` |

**Verified locally:** two consecutive renders of the same composition produced **identical SHA-256 hashes**.

---

## 15. Cost Model: What Is Actually Free

| Item | Cost | Source |
|---|---|---|
| Coding agent on free Zen models | **$0** | [opencode.ai/docs/zen](https://opencode.ai/docs/zen/) |
| Remotion license, individuals / orgs ≤3 | **$0**, unlimited commercial use, no feature difference | [license/pricing](https://www.remotion.dev/docs/license/pricing) |
| Local render | **$0** | measured, §9 |
| Remotion Lambda, Hello World | **$0.001** warm | [lambda/cost-example](https://www.remotion.dev/docs/lambda/cost-example) |
| Remotion Lambda, 1 min video | **$0.017** warm / $0.021 cold | [lambda/cost-example](https://www.remotion.dev/docs/lambda/cost-example) |
| Remotion Lambda, 10 sec 4K | **$0.013** warm | [lambda/cost-example](https://www.remotion.dev/docs/lambda/cost-example) |
| Remotion for Creators (4+ people) | $25/mo per seat | [license/pricing](https://www.remotion.dev/docs/license/pricing) |
| Remotion for Automators | $0.01/render, $100/mo min | [license/pricing](https://www.remotion.dev/docs/license/pricing) |
| GitHub Actions, public repo | 2,000 min/mo | [GH Actions limits](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration) |
| Cloudflare Workers | 100k req/day but **10 ms CPU**, 128 MB — **unusable for video** | [CF limits](https://developers.cloudflare.com/workers/platform/limits/) |

**Total for an individual: $0.** The only cost is electricity.

---

## 16. Complete Build Recipe

```bash
# 1. Scaffold non-interactively (--yes requires a template flag)
npx create-video@latest --yes --blank my-video
cd my-video && npm install

# 2. Install upstream Agent Skills (12 skills → .agents/skills/)
npx skills add remotion-dev/skills

# 3. Add what you need, always version-matched
npx remotion add @remotion/transitions
npx remotion add @remotion/media
npx remotion add @remotion/google-fonts

# 4. Iterate visually — free and instant
npm run dev            # Remotion Studio

# 5. Gate: types must be clean
npx tsc --noEmit

# 6. One-frame smoke test before any full encode
npx remotion still MyComp out/check.png

# 7. Tune concurrency once
npx remotion benchmark src/index.ts MyComp --runs 3 --concurrencies 1,2

# 8. Encode
npx remotion render MyComp out/video.mp4 \
  --codec h264 --crf 18 --pixel-format yuv420p

# 9. Verify what you actually got
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt \
  -show_entries format=duration -of default=noprint_wrappers=1 out/video.mp4
```

Then start OpenCode in the project root. It picks up `.agents/skills/`, `package.json` and `tsconfig.json`.

**Prompt shape that works with free models** — be a spec, not a wish:

> Duration 30s, 1080×1920, 30fps. Three scenes: title, three feature cards, ending CTA. Dark theme, accent `#4af0c8`. Use `Easing.bezier(0.16,1,0.3,1)` everywhere, springs only for the card stagger. No external assets. Text exactly as provided.

---

## 17. Delivery Specs

- **Resolution:** 1080×1920 vertical (Shorts/Reels/TikTok); 1920×1080 for 16:9.
- **Frame rate:** 30 fps standard. 60 fps is accepted but re-encoded downstream.
- **Codec:** H.264 with **`yuv420p` mandatory** for platform compatibility. AV1 is smaller but unavailable on Lambda/ARM64 and "very slow" to encode.
- **Quality:** CRF 18–20 (Remotion's h264 default is already 18). Lower = better, larger.
- **Streaming:** `-movflags +faststart`. Audio AAC 192 kbps / 48 kHz.
- **Safe area:** keep critical text inside the centre ~70% of vertical height to avoid platform UI overlays.
- **Loudness:** `loudnorm=I=-16:TP=-1.5:LRA=11` for EBU R128.
- **Verify after every encode** with ffprobe — this project's render reported `yuvj420p` when `yuv420p` was requested.

---

## 18. Effort Reality and Failure Modes

| Stack | Time to a polished 30–60 s video | Confidence |
|---|---|---|
| Remotion, first video | 2–4 h (setup, spec, 2–3 render/fix cycles) | practitioner estimate |
| Remotion, subsequent | 30–60 min with a component library | practitioner estimate |
| Motion Canvas | +30–50 % vs Remotion | estimate |
| Manim, non-math content | 2–3× time, 2–5× render | estimate + its own perf docs |
| Blender, equivalent 2D motion | 5–10×, GPU mandatory | estimate |

*No official effort figures exist; these are labelled estimates, not measurements.*

**Where quality plateaus:** broadcast-standard motion graphics — good easing, clean layout, disciplined timing. Beyond that you are competing with design, not technology.

**Failure modes to design against:**

1. **CSS `transition` / `animation` / Tailwind animation classes** — the #1 free-model bug. They do not render; they must be refactored into `interpolate()`.
2. **Unclamped interpolation** — silent runaway values because `extend` is the default.
3. **Springs on everything** — reads as bouncy toys. The official guidance prefers `Easing` unless physics is requested.
4. **`transform` on `display: inline`** — silently ignored when splitting text for per-character animation.
5. **Motion blur at high `samples`** — the docs call it destructive to colour.
6. **Off-by-one frame timing** at scene boundaries, made worse by forgetting that Transitions shorten the timeline.
7. **Unpinned fonts and Chrome** — the two classic sources of cross-machine differences.

---

## 19. Corrections to the Prior Report

`W/report/r1/smooth-coding-videos-twitter-2026-09-27.md` was the Tier-0 baseline. Six claims needed correcting or tightening:

| Prior claim | Correction |
|---|---|
| "Remotion is FREE (open source)" | **Source-available**, not OSI open source. Free for individuals and orgs ≤3 people; 4+ requires a paid license. [license/faq](https://www.remotion.dev/docs/license/faq) |
| "Total stack: $0" | True for an individual. A 4+ person company needs $25/seat/mo or $0.01/render with a $100/mo minimum. |
| "126,000+ Agent Skill installs" | Unverified marketing claim; not corroborated by any primary source. |
| "`npx skills add remotion-dev/skills` installs 11 skills" | **12 skills** as of v4.0.533 (adds `remotion-multimedia`). Verified locally. |
| "HyperFrames" listed as a main alternative | Only located via an aggregator skill page, not a primary project site. Treat as unverified. |
| "Quality does not depend on the LLM at all" | Too strong. Rendering determinism is model-independent; **aesthetic judgement is not**. Free models need the house curve hard-coded and tokens in a design-token file, or output quality degrades. |

The prior report's core thesis — that the expensive-model narrative is a category error — **holds up** and is now backed by local measurement rather than inference.

---

## 20. Framework and Tool Reference

**Remotion 4.0.533** — every `@remotion/*` package is lockstep-versioned: `@remotion/cli`, `renderer`, `player`, `lambda`, `three`, `transitions`, `media`, `media-utils`, `google-fonts`, `fonts`, `shapes`, `noise`, `motion-blur`, `animation-utils`, `layout-utils`, `paths`, `zod-types`, `gif`. Use `npx remotion add <pkg>` to keep versions aligned.

**Other engines:** [Motion Canvas](https://github.com/motion-canvas/motion-canvas) 3.17.2 (MIT) · [Manim CE](https://github.com/ManimCommunity/manim) (MIT) · [ManimGL](https://github.com/3b1b/manim) (MIT) · [Blender](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html) (GPL-3.0) · [canvas-record](https://github.com/dmnsgn/canvas-record) 5.13.0 (MIT, WebCodecs, ~9.4 Mpx/frame cap) · [glsl-to-mp4](https://github.com/nabeel-oz/glsl-to-mp4) (MIT framework, CC-BY-NC-SA shaders)

**Supporting libraries:** [flubber](https://github.com/veltman/flubber) (path morph) · [Hydra](https://hydra.ojack.xyz/docs/) (live-coding GLSL) · [three.js](https://threejs.org/) 0.186.1 · [GSAP](https://gsap.com/) 3.15.0 (preview only) · [lottie-web](https://github.com/airbnb/lottie-web) 2.44.0 (pre-baked only)

**Authoring:** [OpenCode](https://opencode.ai) + Zen free models · [Vercel AI SDK](https://sdk.vercel.ai/) (Remotion's documented generation path) · [agentskills.io](https://agentskills.io/home)

---

## 21. Sources

### Remotion (primary)
1. [remotion.dev](https://www.remotion.dev/) · 2. [/docs/ai](https://www.remotion.dev/docs/ai) · 3. [/docs/ai/skills](https://www.remotion.dev/docs/ai/skills) · 4. [/docs/ai/generate](https://www.remotion.dev/docs/ai/generate) · 5. [/docs/ai/webmcp](https://www.remotion.dev/docs/ai/webmcp) · 6. [/docs/license/pricing](https://www.remotion.dev/docs/license/pricing) · 7. [/docs/license/faq](https://www.remotion.dev/docs/license/faq) · 8. [/docs/spring](https://www.remotion.dev/docs/spring) · 9. [/docs/interpolate](https://www.remotion.dev/docs/interpolate) · 10. [/docs/easing](https://www.remotion.dev/docs/easing) · 11. [/docs/random](https://www.remotion.dev/docs/random) · 12. [/docs/use-current-frame](https://www.remotion.dev/docs/use-current-frame) · 13. [/docs/motion-blur/camera-motion-blur](https://www.remotion.dev/docs/motion-blur/camera-motion-blur) · 14. [/docs/transitions](https://www.remotion.dev/docs/transitions) · 15. [/docs/three](https://www.remotion.dev/docs/three) · 16. [/docs/renderer/render-media](https://www.remotion.dev/docs/renderer/render-media) · 17. [/docs/delay-render](https://www.remotion.dev/docs/delay-render/) · 18. [/docs/timeout](https://www.remotion.dev/docs/timeout/) · 19. [/docs/encoding](https://www.remotion.dev/docs/encoding) · 20. [/docs/cli/render](https://www.remotion.dev/docs/cli/render) · 21. [/docs/performance](https://www.remotion.dev/docs/performance) · 22. [/docs/docker](https://www.remotion.dev/docs/docker) · 23. [/docs/gpu](https://www.remotion.dev/docs/gpu) · 24. [/docs/lambda/concurrency](https://www.remotion.dev/docs/lambda/concurrency) · 25. [/docs/lambda/cost-example](https://www.remotion.dev/docs/lambda/cost-example) · 26. [/docs/cli/benchmark](https://www.remotion.dev/docs/cli/benchmark) · 27. [/docs/miscellaneous/chrome-headless-shell](https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell) · 28. [/docs/third-party](https://www.remotion.dev/docs/third-party) · 29. [/docs/player](https://www.remotion.dev/docs/player) · 30. [/docs/audio/visualization](https://www.remotion.dev/docs/audio/visualization) · 31. [/docs/google-fonts/load-variable-font](https://www.remotion.dev/docs/google-fonts/load-variable-font) · 32. [github.com/remotion-dev/remotion](https://github.com/remotion-dev/remotion) · 33. [LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)

### Agent tooling and free models
34. [opencode.ai/docs/zen](https://opencode.ai/docs/zen/) · 35. [opencode.ai/zen](https://opencode.ai/zen) · 36. [anomalyco/opencode#33495 — Zen free usage cap](https://github.com/anomalyco/opencode/issues/33495) · 37. [agentskills.io](https://agentskills.io/home) · 38. [Mux nextjs-video-ai-workflows AGENTS.md](https://github.com/muxinc/nextjs-video-ai-workflows) · 39. [creativly.ai brand video repo](https://github.com/naveen-annam/creativly.ai-brand-video-remotion)

### Competing and adjacent engines
40. [motion-canvas/motion-canvas](https://github.com/motion-canvas/motion-canvas) · 41. [motioncanvas.io/docs/flow](https://motioncanvas.io/docs/flow/) · 42. [ManimCommunity/manim](https://github.com/ManimCommunity/manim) · 43. [3b1b/manim](https://github.com/3b1b/manim) · 44. [3b1b/videos](https://github.com/3b1b/videos) · 45. [docs.manim.community performance](https://docs.manim.community/en/stable/contributing/performance.html) · 46. [Blender command line](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html) · 47. [dmnsgn/canvas-record](https://github.com/dmnsgn/canvas-record) · 48. [nabeel-oz/glsl-to-mp4](https://github.com/nabeel-oz/glsl-to-mp4) · 49. [motiondivision/motionone (archived)](https://github.com/motiondivision/motionone) · 50. [Rive export for video](https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design) · 51. [Hydra docs](https://hydra.ojack.xyz/docs/) · 52. [shadertoy-to-video-with-FBO](https://github.com/danilw/shadertoy-to-video-with-FBO) · 53. [veltman/flubber](https://github.com/veltman/flubber) · 54. [vanrez-nez/awesome-glsl](https://github.com/vanrez-nez/awesome-glsl) · 55. [Animated Vega-Lite (arXiv:2208.03869)](https://arxiv.org/abs/2208.03869) · 56. [vhs](https://vhs.charm.sh/) · 57. [p5js](https://p5js.org/) · 58. [dojocodinglabs/remotion-superpowers (AI video models)](https://github.com/dojocodinglabs/remotion-superpowers) · 59. [ptrthomas/blender-agent](https://github.com/ptrthomas/blender-agent)

### Web platform and encoding
60. [CSS-Tricks — CSS 3D](https://css-tricks.com/things-watch-working-css-3d/) · 61. [MDN — feTurbulence](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence) · 62. [MDN — easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/easing-function) · 63. [easings.net](https://easings.net/) · 64. [FFmpeg trac — Encode/YouTube](https://trac.ffmpeg.org/wiki/Encode/YouTube) · 65. [ffmpeg-micro — loudnorm EBU R128](https://www.ffmpeg-micro.com/blog/ffmpeg-loudnorm-filter-ebu-r128) · 66. [Josh Comeau — spring physics](https://joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/) · 67. [GitHub Actions usage limits](https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration) · 68. [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · 69. [Playwright videos](https://playwright.dev/docs/videos)

### Local verification (this project, 2026-10-05)
70. npm registry queries for all `remotion` / `@remotion/*` / `create-video` versions · 71. `npx create-video@4.0.533 --yes --blank` · 72. `npx skills add remotion-dev/skills` (12 skills, v4.0.533) · 73. `npx tsc --noEmit` (exit 0) · 74. `npx remotion render` ×2 (identical SHA-256) · 75. `npx remotion benchmark` (8.23 s) · 76. `ffprobe` output verification

---

## 22. Bottom Line

| Question | Answer |
|---|---|
| How is the smooth motion actually done? | Frame-pure determinism + analytic easing/spring math, rasterised per frame by headless Chromium. §6 |
| Which library? | **Remotion 4.0.533** for motion graphics and agent pipelines. Motion Canvas for vector explainers, Manim for math, Blender for true 3D. §5 |
| What is the hidden shortcut? | A data-driven JSON scene spec + hard-coded design tokens, so the model fills data rather than code — and `@remotion/player` for free preview iterations. §12 |
| Do I need an expensive LLM? | **No.** All six research clusters for this report ran on a free model. You need *house curves and tokens*, not a bigger model. §11 |
| Can it be genuinely free? | **Yes — $0** for an individual. Verified: 19.6 s to render 90 frames at 1080×1920. §9, §15 |
| Is it reproducible? | **Yes** — byte-identical SHA-256 across runs, and it is why you can tell code video apart from generative video. §14 |
| What is the biggest quality lever? | Easing and spring parameters, plus 180° motion blur. Not model tier, not resolution. §7 |
| When would I be wrong? | If you want *footage* — people, places, cinematic scenes — then you need an AI video model, and that is a different, non-deterministic, per-second-priced product. §3 |

**The real secret:** the videos are not AI-generated. They are *programs*, written by an AI, rendered by a browser. Free tools write the program. The quality is in the mathematics and the design constraints — which is why you can get broadcast-grade motion on a free model and a $0 render.

---

*Report generated: 2026-10-05, 20:06–20:45 UTC*
*Method: 6 parallel research subagents on free models (TinyFish / You.com / Firecrawl), plus first-party verification by scaffolding, typechecking and rendering a real Remotion project twice.*
*All research briefs: [`briefs/`](briefs/). Scratch project and renders: `/tmp/opencode/codevid-testing/`.*
*Cost: $0 — OpenCode + free Zen models + local rendering.*