## C3 — Render pipeline internals

> Verified in this project on 2026-10-05: a 90-frame 1080×1920 composition rendered locally in **19.6 s wall clock** (including bundle + Chrome download) and **8.23 s** for the encode pass alone. Two consecutive renders produced **byte-identical SHA-256 output**.

### Verdict
- The pipeline is `code → bundle() → selectComposition() → renderMedia() → Chrome Headless Shell (Puppeteer) → per-frame JPEG/PNG screenshots → FFmpeg → MP4`. Chromium does all layout and paint; the Rust/WASM core coordinates frames and audio.
- **Free for individuals and companies ≤3 people** (source-available license, no functional difference from paid). Lambda is **AWS-billed only, no Remotion markup**: $0.001 for Hello World, $0.017 warm / $0.021 cold for a 1-minute video.
- **Determinism is not automatic.** Font fallback, `Date.now()`, `Math.random()`, GPU presence, Chrome version drift and network asset timing all break pixel-identical renders.

### Pipeline diagram
```
code → bundle() → selectComposition() → renderMedia() → Chrome Headless Shell (Puppeteer)
     → per-frame screenshots (JPEG q80 default) → FFmpeg (h264) → MP4
```

### Key facts table
| Concern | Concrete fact | Source |
|---|---|---|
| Render entry point | `renderMedia({composition, serveUrl, codec, outputLocation, concurrency, timeoutInMilliseconds?})`, default timeout **30,000 ms** | https://www.remotion.dev/docs/renderer/render-media |
| Frame gate | `delayRender()` / `continueRender(handle)` / `cancelRender()`; **30 s** default per handle, fails at 28,000 ms with an explicit message | https://www.remotion.dev/docs/delay-render/ |
| Timeout control | `timeoutInMilliseconds` on `renderMedia`/`renderFrames`/`selectComposition`/`renderMediaOnLambda`; `--timeout` CLI; `Config.setDelayRenderTimeoutInMilliseconds()` | https://www.remotion.dev/docs/timeout/ |
| Chrome binary | Chrome Headless Shell, downloaded into `node_modules/.remo/`, pinnable via `ensureBrowser({version})` | https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell |
| Chrome modes | `headless-shell` (default, faster) vs `chrome-for-testing` (GPU, more deps); **Lambda only supports headless-shell** | https://www.remotion.dev/docs/miscellaneous/chrome-headless-shell |
| Codecs | h264 (default), h265, vp8, vp9, av1, prores; **AV1 unavailable on Lambda and Linux ARM64** | https://www.remotion.dev/docs/encoding |
| Codec speed | h264/h265 fast; VP8 slow; VP9 and AV1 "very slow" | https://www.remotion.dev/docs/encoding |
| CRF | h264 default **18** (range 1–51); lower = better quality, larger file | https://www.remotion.dev/docs/encoding |
| Pixel format | `--pixel-format` accepts `yuv420p`, `yuva420p`, `yuv422p`, `yuv444p` and 10-bit variants | https://www.remotion.dev/docs/cli/render |
| Image format | `--image-format` `png`\|`jpeg`\|`none`, default **`jpeg`** (faster, no alpha) | https://www.remotion.dev/docs/cli/render |
| Props | `--props` takes a serialized JSON string or a **file path** (file is required on Windows shells) | https://www.remotion.dev/docs/cli/render |
| CLI overrides | `--width`, `--height`, `--fps` (4.0.424+), `--duration` (4.0.424+), `--concurrency` (`N` or `%`) | https://www.remotion.dev/docs/cli/render |
| Hardware acceleration | available from Remotion 4.0.228 | https://www.remotion.dev/docs/encoding |
| Lambda concurrency | `framesPerLambda` default chosen between **20 and ∞**; `concurrency = frameCount / framesPerLambda`; `concurrency: 1` renders on the main function from 4.0.517 | https://www.remotion.dev/docs/lambda/concurrency |
| Lambda cost, Hello World | **$0.001** warm (7.56 s), **$0.001** cold (11.02 s) | https://www.remotion.dev/docs/lambda/cost-example |
| Lambda cost, 1 min video | **$0.017** warm (18.91 s), **$0.021** cold (15.52 s) | https://www.remotion.dev/docs/lambda/cost-example |
| Lambda cost, 10 sec 4K | **$0.013** warm / **$0.014** cold | https://www.remotion.dev/docs/lambda/cost-example |
| Lambda config used | 2048 MB RAM, 10 GB disk, default concurrency, `us-east-1`, Remotion 4.0.381 | https://www.remotion.dev/docs/lambda/cost-example |
| Docker base | `node:22-bookworm-slim` + ~15 apt packages; **Alpine and nixOS unsupported** | https://www.remotion.dev/docs/docker |
| GPU in headless | disabled by default; `--gl=angle` / `swiftshader` / `egl` to enable; **Lambda has no GPU** | https://www.remotion.dev/docs/gpu |
| Benchmarking | `npx remotion benchmark src/index.ts [compositions] --runs 3 --concurrencies 2,4,8` | https://www.remotion.dev/docs/cli/benchmark |

### Free-tier reality table
| Option | Free what | Limits | Cost risk | Source |
|---|---|---|---|---|
| Remotion license | Individuals and orgs ≤3 people | No render limits, no feature difference | Low if eligible | https://www.remotion.dev/docs/license/pricing |
| Local render | Unlimited on your hardware | CPU/RAM/Chrome deps; no horizontal scaling | **$0** | https://www.remotion.dev/docs/docker |
| OpenCode Zen free models | 12 free model IDs | "Available for a limited time"; ~200-request cap reported | **$0** | https://opencode.ai/docs/zen/ |
| Remotion Lambda | No Remotion fee, AWS only | Needs AWS account, IAM, S3 | Low–medium | https://www.remotion.dev/lambda |
| GitHub Actions (public) | 2,000 min/mo Linux runners | Public repos only | Low | https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration |
| Cloudflare Workers | 100k req/day | **10 ms CPU** on free tier, 128 MB memory — unusable for video | N/A | https://developers.cloudflare.com/workers/platform/limits/ |
| Cloudflare Pages | Static hosting | No server-side render | N/A | — |
| Koyeb / Oracle Always Free / Render free | **Not documented for Remotion** | Would need custom image + Chrome deps | Unverified, likely breaks | — |

### Determinism pitfalls and how to pin them
- **Font fallback/swap** — bundle fonts via `@remotion/fonts` or `@remotion/google-fonts`; `font-display: block` hides text rather than rendering fallback glyphs.
- **Wall-clock leakage** — `Date.now()`, `performance.now()`, `new Date()` must never reach an animated value; derive time from `useCurrentFrame()` and `fps`.
- **Unseeded randomness** — `Math.random()` differs per render and per worker thread; use `random(seed)`. https://www.remotion.dev/docs/random
- **GPU presence** — headless Chrome without a GPU uses SwiftShader, producing different pixels from a GPU machine. Force `--gl=swiftshader` consistently; Lambda has no GPU at all.
- **Chrome version drift** — auto-updates change rasterisation; pin with `ensureBrowser({version})` and lock `@remotion/renderer`.
- **Network asset timing** — fonts/images fetched at render time cause `delayRender` timeouts and frame variance; bundle all assets locally.
- **Concurrency memory pressure** — high `--concurrency` can cause video elements to skip loading and time out; prefer `<Video>` from `@remotion/media`.
- **Verified**: two identical consecutive renders of the same composition produced **identical SHA-256** hashes (`8597e421…b0a5`) on this machine.

### Perf notes
- *Documented*: default concurrency is **half your CPU threads**; tune with `npx remotion benchmark`.
- *Documented*: GPU-backed work (WebGL, canvas, CSS `filter: blur()`, gradients) requires a GPU or is severely slow on SwiftShader.
- *Measured here*: 90 frames at 1080×1920 on **2 vCPU / 7 GB RAM** → **19.6 s** total including bundling and first-run Chrome download; **8.23 s** on the warm benchmark run; output **238 kB**.
- *Measured here*: output is `h264`, `yuvj420p`, `30/1` fps, 90 frames, `3.000000 s` — note ffprobe reports `yuvj420p` (full-range JPEG-derived variant) even when `yuv420p` is requested; verify with ffprobe after every render if colour range matters.

### Sources
https://www.remotion.dev/docs/renderer/render-media · /docs/delay-render/ · /docs/timeout/ · /docs/miscellaneous/chrome-headless-shell · /docs/encoding · /docs/cli/render · /docs/quality · /docs/performance · /docs/docker · /docs/gpu · /docs/lambda/concurrency · /docs/lambda/cost-example · /docs/lambda/deployfunction · /docs/cli/benchmark · /docs/renderer/ensure-browser · /docs/miscellaneous/linux-dependencies · /docs/license/pricing · /docs/license/faq · https://github.com/remotion-dev/remotion/blob/main/LICENSE.md · https://opencode.ai/docs/zen/ · https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration · https://developers.cloudflare.com/workers/platform/limits/