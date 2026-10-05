## C5 — Advanced motion techniques & hidden shortcuts

### Verdict
- **CSS 2.5D first, real WebGL second.** `perspective` + `transform-style: preserve-3d` + layered `translateZ` gives parallax and extruded text with zero GPU and perfect determinism. `@remotion/three` gives true 3D but requires `useCurrentFrame()` (never `useFrame()`) and `"gl": "angle"` in headless.
- **Shaders are the smoothest motion of all**: time is `float t = float(frame) / fps`, so motion is frame-exact by construction, and loops are mathematically perfect.
- **The force multiplier is a data-driven scene spec**: one component tree + a JSON scene spec means the free model fills in *data*, not TSX. That is what makes a free model sufficient.

### Techniques table
| Technique | API | What it buys you | Determinism risk | Source |
|---|---|---|---|---|
| CSS 2.5D | `perspective`, `preserve-3d`, `rotateY`, `translateZ`, layered `text-shadow` | Parallax, extruded text, fake lighting | None (frame-deterministic CSS) | https://css-tricks.com/things-watch-working-css-3d/ |
| Real 3D | `@remotion/three` `<ThreeCanvas>`, `<ThreeWebGPUCanvas>`, R3F | Full Three.js scene graph, shaders, post-processing | **High** — `useFrame()` forbidden, `gl="angle"` required | https://www.remotion.dev/docs/three |
| Frame-driven motion blur | `<HtmlInCanvasMotionBlur samples shutterAngle>` (4.0.529+) | Film-accurate blur on animated HTML | None; costs render time | https://www.remotion.dev/docs/motion-blur/camera-motion-blur |
| Shader motion | GLSL, `t = frame/fps` | Infinite resolution, perfect loops | None if time is derived from frame | https://hydra.ojack.xyz/docs/ |
| Live-coding | Hydra | Modular patching, audio-reactive | Deterministic only if driven by frame clock | https://hydra.ojack.xyz/docs/ |
| SVG path morph | `flubber` `interpolate()`, `d3-interpolate-path` | Shape-to-shape tweening | Deterministic (pure math) | https://github.com/veltman/flubber |
| Stroke draw-on | `stroke-dasharray` + `stroke-dashoffset` | Hand-drawn reveals | Deterministic | MDN `stroke-dashoffset` |
| Rive state machine | `@rive-app/react`, `.riv` | Vector animation with states/blending | Deterministic only if driven by frame, not rAF | https://rive.app/docs/runtimes/react/react |
| Particles / flow fields | `random(seed)` or `mulberry32`, curl noise (Bridson 2007), simplex noise | Smoke, boids, flow fields | Low if seeded per particle+frame | https://github.com/ManimCommunity/manim |
| Kinetic typography | per-char stagger `spring({frame: frame - i*3})`, variable font `wght` axis | Per-character reveals, weight morph | Deterministic | https://www.remotion.dev/docs/google-fonts/load-variable-font |
| Transitions | `TransitionSeries`, `springTiming()`, `fade`/`slide`/`wipe`/`flip`/`clockWipe` | Pro scene glue, overlap → shorter timeline | Deterministic | https://www.remotion.dev/docs/transitions |
| Light leaks / effects | `@remotion/effects/light-leak` via `<Solid effects={[...]}>`, `createEffect()` | Film overlays at cut points | Deterministic | https://www.remotion.dev/docs/transitions |
| Audio sync | `getAudioData()`, `visualizeAudio({fps, frame, audioData})`, Tone.js `OfflineContext` | Waveforms, beat-synced motion | Deterministic if PCM decoded once | https://www.remotion.dev/docs/audio/visualization |
| Asset-free art | `<feTurbulence>`, `<feDisplacementMap>`, `<feColorMatrix>`, canvas gradients, `sharp` | Procedural textures, zero downloads | Deterministic | https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence |
| Scene spec | JSON scene catalog → one component tree | LLM writes data, not code | Deterministic | community pattern (folklore) |

### Deep findings (grouped, with sources)
- **2.5D/3D** — CSS 3D needs a shared ancestor with `preserve-3d`, otherwise siblings flatten and cannot intersect. https://css-tricks.com/things-watch-working-css-3d/ · `<ThreeCanvas>` injects Remotion's frame clock so animations live in JSX, not `useFrame()`. https://www.remotion.dev/docs/three · `<Sequence>` inside a canvas must be `layout="none"`; SSR needs `"gl": "angle"`. `useOffthreadVideoTexture()` gives an exact-frame `ImageTexture` during render.
- **Shaders** — Shadertoy uniforms are `iTime` (seconds), `iFrame`, `iResolution`; use `float t = float(iFrame) / fps` for frame-exact loops. Offline renderers (shadertoy-to-video-with-FBO, glslViewer) run headless OpenGL and dump frames. https://github.com/danilw/shadertoy-to-video-with-FBO
- **Vector/morph** — `flubber.interpolate(shapeA, shapeB)` returns `t => pathString`. https://github.com/veltman/flubber · In Remotion, `motion.path` must be re-implemented via `getPointAtLength()` + `interpolate()` (folklore).
- **Particles** — curl noise: `v = curl(Ψ)` with `Ψ = (noise1, noise2, noise3)`, partials by central differences (Bridson 2007, SIGGRAPH). Precomputing all trajectories at startup removes runtime RNG entirely (folklore).
- **Type** — `loadVariableFont()` returns `{ axes: { wght: {min,max} }, fontFamily }`; per-char stagger via `spring({frame: frame - i*3})`.
- **Transitions** — `TransitionSeries.Transition` **shortens** the timeline (two scenes play simultaneously: `60 + 60 - 15 = 105` frames); `TransitionSeries.Overlay` does **not** change duration. `springTiming().getDurationInFrames({fps})` returns the computed length. An overlay may not sit adjacent to another overlay or a transition. https://www.remotion.dev/docs/transitions/transitionseries
- **Audio** — `visualizeAudio()` returns an amplitude array for the current frame; use `useWindowedAudioData()` for large files. `ffmpeg -af loudnorm=I=-16:TP=-1.5:LRA=11` for EBU R128 broadcast loudness.
- **Asset-free** — `<feTurbulence type="turbulence" baseFrequency="0.05" numOctaves="2"/>` + `<feDisplacementMap scale="50"/>` = procedural clouds/marble at vector resolution.

### Hidden shortcuts (numbered, [documented] or [folklore])
1. **Data-driven scene spec** — one `<Composition>` reads a JSON array of scenes; the LLM outputs JSON, not TSX. [documented pattern]
2. **Fake 3D with layered 2D** — stack `translateZ` layers under `perspective: 1000px`, move layers at different speeds, extrude text with stacked `text-shadow`. [documented]
3. **`@remotion/player` for instant preview** — hot-reloads the spec in <100 ms versus a ~20 s render. [documented] https://www.remotion.dev/docs/player
4. **Pre-bake heavy loops** — render a 2 s particle loop once, replay via `<Img>`/`<Video>`. [folklore]
5. **Render sparse + optical-flow fill** — render at ½ fps, then `ffmpeg -vf minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir`. [folklore]
6. **SVG filters instead of raster ops** — `feTurbulence` + `feDisplacementMap` + `feColorMatrix` give noise, distortion and colour grading at vector resolution. [documented]
7. **`posterize: n` inside `interpolate`** — deliberately samples every n-th frame for a stop-motion look. [documented] https://www.remotion.dev/docs/interpolate
8. **`mpdecimate` dedup** — `ffmpeg -vf mpdecimate,setpts=N/FRAME_RATE/TB` drops duplicate frames before re-encoding. [folklore]
9. **Seed per (frame, particle), not per run** — `random('x-' + i + '-' + f)` gives deterministic parallel evaluation. [documented] https://www.remotion.dev/docs/random
10. **Variable font weight as a spring** — `fontWeight: spring({frame, config:{stiffness:300}, from:400, to:700})`. [documented]
11. **`output: 'perceptual-scale'`** on scale animations — compensates for the fact that linear scale reads as smaller at larger values. [documented] https://www.remotion.dev/docs/interpolate
12. **Light-leak overlays at cut points** — `<Solid effects={[lightLeak({progress})]}/>` inside `<TransitionSeries.Overlay>`. [documented]

### Traps to avoid
- **`useFrame()` from R3F** — runs on the wall clock, causes flicker during render. Forbidden. https://www.remotion.dev/docs/three
- **Missing `"gl": "angle"`** in headless renders — WebGL silently falls back to SwiftShader.
- **`Math.random()`** — non-deterministic across threads and renders; `random(seed)` instead. https://www.remotion.dev/docs/random
- **CSS `transition`/`animation` and Tailwind animation classes** — explicitly do **not** render correctly; they must be refactored into `interpolate()`. https://www.remotion.dev/docs/ai/skills
- **Loading fonts at render time over the network** — variance breaks frame sync; use `@remotion/google-fonts` or `@remotion/fonts`.
- **`transform` on `display: inline`** — silently ignored; needs `inline-block`.
- **h264 for transparent video** — drops alpha; use `prores` or `yuva420p`. https://www.remotion.dev/docs/encoding

### Sources
https://www.remotion.dev/docs/three · /docs/transitions · /docs/transitions/transitionseries · /docs/spring · /docs/interpolate · /docs/random · /docs/player · /docs/encoding · /docs/ai/skills · /docs/google-fonts/load-variable-font · /docs/audio/visualization · /docs/motion-blur/camera-motion-blur · https://css-tricks.com/things-watch-working-css-3d/ · https://github.com/veltman/flubber · https://github.com/danilw/shadertoy-to-video-with-FBO · https://github.com/ManimCommunity/manim · https://hydra.ojack.xyz/docs/ · https://rive.app/docs/runtimes/react/react · https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feTurbulence · https://www.ffmpeg-micro.com/blog/ffmpeg-loudnorm-filter-ebu-r128