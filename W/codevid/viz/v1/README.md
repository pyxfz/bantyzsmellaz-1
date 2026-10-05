# v1 — OpenCode Setup Walkthrough (60 fps)

A programmatic motion-graphics video that teaches how to install OpenCode,
configure MCP servers, install frameworks with Bun, and render an MP4.

Built with Remotion 4.0.533. Every frame is a pure function of its frame
index, so renders are byte-identical and cost $0.

## Output

- `../out/opencode-setup.mp4` — 1920×1080, 60 fps, H.264, 24.4 s, 3.6 MB
- Composition id: `OpenCodeSetup` (also a full-length composition)

## Scenes

| # | Id | Seconds | Content |
|---|---|---|---|
| 1 | `Title` | 2.2 | Wordmark draw-on, three capability pills |
| 2 | `Prereq` | 2.2 | Terminal + one API key |
| 3 | `Install` | 2.8 | `curl -fsSL … \| bash`, plus bun/npm/brew/docker |
| 4 | `FirstRun` | 2.5 | `/models` with the free Zen list |
| 5 | `McpConfig` | 3.5 | `opencode.json` with remote + local servers |
| 6 | `McpTypes` | 2.8 | The five servers on this machine, context caveat |
| 7 | `Bun` | 3.0 | `bun install -g`, `create-video`, `remotion add` |
| 8 | `Render` | 3.3 | Typecheck → still → render, $0.00 total |
| 9 | `Outro` | 2.1 | Four commands, zero dollars |

## Commands

```bash
bunx --bun create-video@latest --yes --blank .   # scaffold (--yes needs a template flag)
npx skills add remotion-dev/skills               # upstream agent skills
npx remotion studio                              # free instant preview
npx tsc --noEmit                                 # typecheck
npx remotion still Render out/check.png --frame=100
npx remotion render OpenCodeSetup out/opencode-setup.mp4 \
  --codec h264 --crf 18 --pixel-format yuv420p --concurrency 2
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt \
  -show_entries format=duration -of default=noprint_wrappers=1 out/opencode-setup.mp4
```

## Structure

```
src/
  tokens.ts              design tokens — colours, fonts, durations, easing
  scenes.tsx             the nine scenes
  Video.tsx              timeline wiring, scene schedule
  Root.tsx               composition registration
  components/
    Stage.tsx            backdrop, Heading, Pill, Progress rail
    Terminal.tsx         window chrome, character-by-character typing
    Code.tsx             syntax-highlighted panel with line reveal
```

## Motion notes

- House curve `Easing.bezier(0.16, 1, 0.3, 1)` on every entrance.
- Springs with `damping: 200` for no-bounce arrivals.
- Particles use `random(seed)`, so the field is identical on every render.
- Only `transform`/`opacity` are animated — no layout-triggering properties.
- Only the line currently being typed owns the terminal caret.

## Verified output

```
codec_name=h264  width=1920  height=1080
r_frame_rate=60/1  nb_frames=1464  duration=24.400000
pix_fmt=yuvj420p  size=3.6 MB  bit_rate=1166911
```

Note: ffprobe reports `yuvj420p` even when `yuv420p` is requested.
