## C6 — Stack selection & architecture

### Recommendation
- **Default: Remotion (React/TSX)** — the only stack with official AI-agent docs, Agent Skills, an instant preview loop (`@remotion/player`), Zod-parameterized compositions, and a verified free-render path. **License note: source-available, free for individuals and orgs ≤3 people** (C6's earlier "MIT core" framing was wrong).
- **Runner-up: Motion Canvas v3.17.2 (MIT)** — cleaner generator DSL, genuinely free license, but weaker AI tooling and a smaller ecosystem.
- **When to switch:**
  - **Manim CE (Python, MIT)** — math-heavy / LaTeX-first explainers only. Slower render, weaker transfer from JS-trained free models.
  - **Blender + `bpy` (GPL)** — true 3D / photoreal. Steep curve, GPU needed, free models are unreliable on `bpy`.
  - **three.js + ffmpeg / p5.js / SVG+Chrome** — niche, all lack agent tooling and a frame-pure model.
  - **Motion One** — never; archived Nov 2024.

### Comparison matrix
| Stack | Motion ceiling | LLM-friendliness | Render cost | License | Source |
|---|---|---|---|---|---|
| Remotion 4.0.533 | 2D motion graphics; 3D via `@remotion/three` | ★★★★★ official AI guide + Skills + Player | $0 local (measured: 8.2 s for 90 frames @1080×1920 on 2 vCPU) | Source-available, free ≤3 people | https://www.remotion.dev/docs/license/pricing |
| Motion Canvas 3.17.2 | 2D vector, timeline sync | ★★★☆☆ generator DSL, few AI guides | $0 | MIT | https://motioncanvas.io/docs/flow/ |
| Manim CE | Math/LaTeX, precise geometry | ★★☆☆☆ | CPU-only Cairo, slower | MIT | https://github.com/ManimCommunity/manim |
| ManimGL | 3D math, OpenGL | ★☆☆☆☆ (less maintained fork) | GPU | MIT | https://github.com/3b1b/manim |
| Blender + bpy | Full 3D, photoreal | ★☆☆☆☆ | GPU, minutes/frame | GPL-3.0 | https://docs.blender.org/ |
| Rive | Interactive runtime | ★★☆☆☆ | Paid cloud export required | Proprietary editor | https://rive.app/docs/editor/exporting/ |
| Godot headless | Game-style 2D/3D | ★★☆☆☆ | CPU/GPU | MIT | https://docs.godotengine.org/ |
| p5.js headless | Creative coding | ★★☆☆☆ | Legacy capture path | LGPL/BSD | — |

### LLM-friendly project architecture (this is the part that makes free models viable)
1. **Scene spec as a discriminated union** — `type SceneSpec = {kind: "title"|"chart"|"transition", props: TitleProps | ChartProps | TransitionProps}`, validated with Zod (`@remotion/zod-types` is published and version-matched).
2. **Component library of pure functions** — each scene takes only spec props; no inline magic numbers.
3. **A single `tokens.ts`** — colours, easings, durations, safe-area insets. This is what stops free models from inventing ugly values.
4. **`satisfies` type constraints** — compile-time rejection of malformed specs, which is the cheap substitute for a smarter model.
5. **Animation primitives only** — `interpolate(frame, [a,b], [x,y], {easing, extrapolateLeft:'clamp', extrapolateRight:'clamp'})` and `spring({frame, fps, config})`. Ban raw `frame/fps` math.
6. **Preview-first loop** — `@remotion/player` or `remotion studio` for iteration; render only when the frame is right.
7. **A skill/rules file** — Remotion ships exactly this; install rather than write your own.

### Free-model suitability (verified on OpenCode Zen, 2026-10-05)
| Model | Zen price (in/out per 1M) | Structured output | TSX ability | Notes |
|---|---|---|---|---|
| Nemotron 3 Ultra Free | Free / Free | good | good | used for all six research clusters in this project |
| Nemotron 3.5 Lightning Free | Free / Free | good | good | |
| Ling 3.1 Flash Free / 3.0 Flash Fin Free | Free / Free | good | good | |
| MiMo-V2.6 / V2.5 Flash Free | Free / Free | good | good | |
| Fledge Alpha Free, LongCat 2.5 Preview Free, Muse Spark 1.3 Contributor Free, Space Bunny Free, Big Pickle | Free / Free | mixed | mixed | all documented as "available for a limited time" |
| Jev 1.13 Free | Free | **excellent** (noul / choice / score) | n/a | Structured decisions, not code |

Source: https://opencode.ai/docs/zen/ (pricing + free-model notes fetched directly). Note the doc's own caveat that free models are **time-limited**, so treat this list as a snapshot dated 2026-10-05.

**Correction:** `Qwen3 Coder 480B` was **deprecated on Zen on February 6, 2026** and is not a viable free backbone.

### Effort reality
- **Remotion:** first polished 30–60 s video ≈ 2–4 h (setup, spec, 2–3 render/fix cycles); subsequent videos 30–60 min once a component library exists. *(Practitioner estimate, labelled as such — no official figure published.)*
- **Motion Canvas:** +30–50 % versus Remotion *(estimate)*.
- **Manim:** 2–3× for non-math content; render 2–5× slower *(estimate, consistent with its own performance docs)*.
- **Blender:** 5–10× for equivalent 2D motion, GPU mandatory *(estimate)*.
- **Measured in this project:** `npx remotion benchmark` on 2 vCPU reported **8.23 s ± 0.00** for a 90-frame 1080×1920 composition containing 120 seeded random elements, springs and bezier-eased titles.

### Failure modes to design against
- Off-by-one frame timing at scene boundaries.
- Layout that becomes cluttered when the model invents values → design tokens.
- Chromium font rendering differences between machines → bundle fonts.
- Springs with overshoot breaking a layout → `overshootClamping`.

### Delivery specs (vertical 9:16 primary)
- 1080×1920 for Shorts/Reels/TikTok; 1920×1080 for 16:9.
- 30 fps standard (60 fps accepted, re-encoded downstream).
- H.264 with **`yuv420p` mandatory**; CRF 18–20 for upload quality (Remotion's h264 default is 18).
- `-movflags +faststart` for streaming; AAC 192 kbps / 48 kHz.
- Keep critical text inside the centre ~70 % of the height on vertical platforms.
- **Verified output from this project's render:** `h264`, `1080x1920`, `30/1` fps, `yuvj420p`, 90 frames, 3.000 s, 238 kB.

### Sources
https://www.remotion.dev/docs/ai/generate · /docs/schemas · /docs/license/pricing · /docs/license/faq · /docs/performance · /docs/cli/render · /docs/encoding · /docs/interpolate · /docs/easing · /docs/three · /docs/ai/skills · https://motioncanvas.io/docs/flow/ · https://github.com/ManimCommunity/manim · https://docs.manim.community/en/stable/contributing/performance.html · https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html · https://rive.app/docs/editor/exporting/exporting-for-video-and-static-design · https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_dedicated_servers.html · https://opencode.ai/docs/zen/ · https://trac.ffmpeg.org/wiki/Encode/YouTube