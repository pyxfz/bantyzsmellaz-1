## C2 — Motion mechanics

> All API signatures, defaults and file paths in this brief were read directly from Remotion's own
> documentation **and** from the Agent Skills installed into a real project during this research
> (`npx skills add remotion-dev/skills`, 12 skills, version 4.0.533).

### Verdict
- **Frame-pure determinism** is the keystone: every frame is a pure function of an integer frame index, with zero hidden state. That is what makes rendering reproducible, seekable, parallelisable and diffable.
- **Easing and spring physics** are the perceptual engine. Remotion's documented defaults are `mass=1`, `damping=10`, `stiffness=100`, `overshootClamping=false`; the doc's own guidance is *"to disable the default bounce, increase the damping parameter."*
- **Perceptual polish** adds motion blur at a 180° shutter angle, GPU-only properties, clamped interpolation and perceptual scale output.

### One-paragraph explanation of "smooth code motion"
Smooth code-rendered motion comes from **deterministic frame functions** (Remotion, Motion Canvas and Manim all compute `frame → pixels` with no hidden state), driven by **exact easing curves** and **analytic spring solutions**, all authored in **frame space** rather than milliseconds so time-remapping preserves easing shape. Perceptual polish adds motion blur, clamped interpolation, `transform`/`opacity`-only compositing, seeded randomness for reproducible noise, and choreography locked to a single beat clock. The result reads as "expensive" because the twelve classic animation principles are being obeyed by mathematics rather than by keyframe guesswork.

### Mechanics table
| Technique | Primitive | Exact formula / constant | Why it looks smooth |
|---|---|---|---|
| Frame purity | `useCurrentFrame()`, `useVideoConfig()` | 0-indexed frames; relative to the nearest `<Sequence from>` | Reproducible, seekable, parallel |
| Cubic-bezier | `Easing.bezier(x1,y1,x2,y2)` | `B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃` | C² continuity, hardware-accelerated |
| Spring easing | `Easing.spring({damping})` | Remotion's recommended no-bounce push: `damping: 200` | Organic, no visible overshoot |
| Physics spring | `spring({frame, fps, config})` | `x(t) = e^(−ζω₀t)[A cos(ω₁t) + B sin(ω₁t)]`, `ζ = damping / (2√(mass·stiffness))` | Overshoot-and-settle reads as physical mass |
| Spring defaults | `spring()` | `mass=1`, `damping=10`, `stiffness=100`, `overshootClamping=false` | Balanced bounce out of the box |
| Normalised time | `fps` from `useVideoConfig()` | `t = frame / fps`; author in frames, never ms | Time-remap preserves easing shape |
| Interpolation + clamp | `interpolate(in, [i0,i1], [o0,o1], {easing})` | **Default extrapolation is `extend`, not clamp** — must opt in | Prevents runaway values |
| Perceptual scale | `output: 'perceptual-scale'` | Compensates for linear scale reading smaller as it grows | Scale-ups look correct |
| Motion blur | `<CameraMotionBlur shutterAngle samples>` | `shutterAngle` **defaults to 180**; 180°/90° are the film/TV norms at 24–60 fps | Real camera feel |
| Frame-driven blur | `<HtmlInCanvasMotionBlur>` (4.0.529+) | `samples` **defaults to 8**, range 1–64; `0` shutter disables | Blur without hand-rolling canvas code |
| Colour | `interpolateColors(..., {easing})` | OKLab/OKLCH/Lab/LCH supported (4.0.439+) | No sRGB hue shift through grey |
| Seeded randomness | `random('key')` | Deterministic PRNG; `random(1)` always returns `0.07301638228818774` | Same pixels across threads and renders |
| Posterisation | `posterize: n` | Samples every n-th frame | Deliberate stop-motion look |
| Variable fonts | `loadVariableFont()` → `axes` | `wght`/`wdth`/`opsz` ranges | Weight morph with no glyph swap |
| GPU-only props | `scale` / `translate` / `rotate` shorthands | Prefer these over `transform` strings | Skips layout and paint |

### Deep findings (each verified against docs or installed skill text)
- `spring()` is ported from Reanimated 2 and uses an analytic underdamped solution. https://www.remotion.dev/docs/spring
- The docs' canonical example uses `config: {stiffness: 100}`; to remove the bounce they explicitly raise `damping`. https://www.remotion.dev/docs/spring
- `spring()` accepts `from`/`to` (defaults `0`→`1`), `reverse`, `durationInFrames`, `durationRestThreshold`, `overshootClamping`, `delay`. https://www.remotion.dev/docs/spring
- `useCurrentFrame()` returns a frame **relative to the enclosing `<Sequence from>`**; for the absolute timeline frame, call it in the top-level component and pass it down. https://www.remotion.dev/docs/use-current-frame
- Remotion's own AI guide recommends `Easing.bezier(0.16, 1, 0.3, 1)` as the house curve and states: *"Prefer `interpolate()` with `Easing` over `spring()` unless physics-based motion is explicitly requested."* https://www.remotion.dev/docs/ai/generate
- The installed markup skill is blunter: *"CSS `transition` or `animation` will not render correctly, they need to be refactored. Tailwind animation class will not render correctly, they need to be refactored."* — this is the single most common LLM failure mode. `.agents/skills/remotion-markup/SKILL.md`
- The same skill mandates keeping `interpolate()` **inline in the `style` prop** and using `scale`/`translate`/`rotate` over `transform` strings, so the Studio can edit keyframes. Use `transform` only for `skew()`, `perspective()` or order-sensitive chains.
- Multiple keyframes with per-segment easings: pass an array with `n-1` items to `easing`. `.agents/skills/remotion-markup/timing.md`
- Every timed component that supports it should get `premountFor={fps}` — one second of premounting. `<TransitionSeries.Transition>` does not accept it.
- `random()` requires a string or number; calling `random()` with no argument is a TypeScript error, and `Math.random()` raises an ESLint warning. `random(null)` is the documented escape hatch for genuine entropy. https://www.remotion.dev/docs/random
- `Easing` module: `back`, `bounce`, `ease`, `elastic`, `spring`, `linear`, `quad`, `cubic`, `poly` (quartic/quintic+), `bezier`, `circle`, `sin`, `exp`. https://www.remotion.dev/docs/easing
- Manim's `smooth(t, inflection=10)` is a **sigmoid**, not a cubic — for a CSS-like ease-in-out use `smoothstep` (`3t²−2t³`) or `smootherstep` (`6t⁵−15t⁴+10t³`). https://github.com/ManimCommunity/manim/blob/main/manim/utils/rate_functions.py
- Motion Canvas ships rhythm-locked spring presets (`BeatSpring`, `BounceSpring`, `JumpSpring`). https://motioncanvas.io/docs/tweening/

### Determinism rules for a generated video
1. Every animated value is a pure function of the frame integer. No `Date.now()`, no `performance.now()`, no `Math.random()`.
2. Noise and particles go through `random(seed)` with a seed derived from stable identifiers, not from a counter that shifts between runs.
3. Author in frames. Take `fps` from `useVideoConfig()`; convert with `frame / fps` only where seconds are genuinely needed.
4. Pass dynamic data as `--props` JSON; keep `calculateMetadata` pure.
5. Animate only `transform`-family properties and `opacity`; anything that triggers layout will look worse and render slower.
6. Pin `remotion`, every `@remotion/*` package, the Chrome version, and the fonts.
7. Keep all choreography derived from the composition frame so stagger offsets stay stable under scene reordering.

### Hidden shortcuts and gotchas
- **`interpolate` defaults to `extend`, not `clamp`** — values keep going outside your range unless you pass `extrapolateLeft: "clamp"` / `extrapolateRight: "clamp"`. The most common silent bug. https://www.remotion.dev/docs/interpolate
- **`spring()` returns `NaN`** when `stiffness` or `mass` are left undefined — always pass a full `config`.
- **`overshootClamping: true` kills the bounce** that reads as premium; reserve it for cases where overshoot would break layout.
- **Motion blur is destructive to colour and alpha** — the docs say to keep `samples` as low as possible and inspect the output. https://www.remotion.dev/docs/motion-blur/camera-motion-blur
- **`posterize` applied to a spring driver** produces stair-step motion; useful deliberately, fatal accidentally.
- **`sRGB` colour interpolation hue-shifts through grey** — interpolate in OKLab/OKLCH.
- **`transform` is ignored on `display: inline`** — split text needs `inline-block`.
- **`<CameraMotionBlur>` requires absolutely positioned children** so layers do not influence each other's layout.

### Sources
https://www.remotion.dev/docs/spring · /docs/interpolate · /docs/easing · /docs/random · /docs/use-current-frame · /docs/motion-blur/camera-motion-blur · /docs/motion-blur/html-in-canvas-motion-blur · /docs/google-fonts/load-variable-font · /docs/ai/generate · /docs/ai/skills · /docs/three · installed `.agents/skills/remotion-markup/{SKILL,timing,3d,transitions,motion-blur}.md` (v4.0.533) · https://github.com/ManimCommunity/manim/blob/main/manim/utils/rate_functions.py · https://motioncanvas.io/docs/tweening/ · https://joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/ · https://easings.net/