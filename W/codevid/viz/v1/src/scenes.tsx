import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR, FONT } from "./tokens";
import { Heading, Pill, Stage } from "./components/Stage";
import { Code, L, cm, gap, key, plainLine, t } from "./components/Code";
import { Terminal, cmd, out } from "./components/Terminal";

const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);
const rise = (p: number, dist = 20) =>
  interpolate(p, [0, 1], [dist, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: HOUSE,
  });

/* ─────────────────────────────────────────────────────────── 1. TITLE */

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inP = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.7 },
    durationInFrames: Math.round(0.9 * fps),
  });
  const badge = spring({
    frame: frame - 14,
    fps,
    config: { damping: 200, mass: 0.5 },
  });

  // Draw-on of the wordmark: a mask width that tracks the frame.
  const markW = interpolate(frame, [Math.round(0.25 * fps), Math.round(1.5 * fps)], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: HOUSE,
  });

  const letters = "opencode";
  const shown = Math.ceil((markW / 100) * letters.length);

  return (
    <Stage>
      <ParticleField count={90} seed="title" />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            opacity: interpolate(badge, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${rise(badge, 14)}px`,
          }}
        >
          <Pill color={COLOR.accent}>SETUP WALKTHROUGH · 60 FPS</Pill>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: FONT.mono,
            fontSize: 116,
            fontWeight: 800,
            letterSpacing: -5,
            opacity: interpolate(inP, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {letters.split("").map((ch, i) => (
            <span
              key={i}
              style={{
                color: COLOR.accent,
                opacity: i < shown ? 1 : 0,
                translate: `0px ${interpolate(inP, [0, 1], [30, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: HOUSE,
                })}px`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>

        <div
          style={{
            fontSize: 32,
            color: COLOR.fgDim,
            opacity: interpolate(inP, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${rise(inP)}px`,
          }}
        >
          Install it. Wire up the MCPs. Ship a rendered video.
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            opacity: interpolate(badge, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${rise(badge)}px`,
          }}
        >
          <Pill color={COLOR.violet} delay={4}>
            bun
          </Pill>
          <Pill color={COLOR.sky} delay={8}>
            MCP servers
          </Pill>
          <Pill color={COLOR.gold} delay={12}>
            Remotion → MP4
          </Pill>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ─────────────────────────────────────────────────── 2. PREREQUISITES */

export const PrereqScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { n: "01", label: "A modern terminal", note: "WezTerm · Alacritty · Ghostty · Kitty" },
    { n: "02", label: "An API key or provider", note: "Or run entirely on free Zen models" },
    { n: "03", label: "Nothing else", note: "One script and you are done" },
  ];

  return (
    <Stage>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          gap: 54,
          padding: 90,
        }}
      >
        <Heading
          eyebrow="Before you start"
          title="Two prerequisites, one command"
          lede="OpenCode is an open source AI coding agent. It runs in the terminal, and the only real setup is having a terminal that renders ANSI properly."
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {items.map((it, i) => {
            const p = spring({
              frame: frame - 18 - i * 10,
              fps,
              config: { damping: 200, mass: 0.6 },
            });
            return (
              <div
                key={it.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  width: 1180,
                  padding: "26px 34px",
                  backgroundColor: COLOR.panel,
                  border: `1px solid ${COLOR.panelBorder}`,
                  borderRadius: 12,
                  opacity: interpolate(p, [0, 1], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                  translate: `0px ${rise(p, 26)}px`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 34,
                    color: COLOR.accent,
                    opacity: 0.55,
                    width: 64,
                  }}
                >
                  {it.n}
                </div>
                <div style={{ fontSize: 31, fontWeight: 650, width: 460 }}>{it.label}</div>
                <div style={{ fontSize: 22, color: COLOR.fgMuted, fontFamily: FONT.mono }}>
                  {it.note}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ─────────────────────────────────────────────────────── 3. INSTALL */

export const InstallScene: React.FC = () => {
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 22 }}>
        <Heading
          eyebrow="Step 01"
          title="Install OpenCode"
          lede="The install script is the recommended path. If you prefer a package manager, the npm package is opencode-ai — not opencode."
        />
        <div style={{ marginTop: 16 }}>
          <Terminal
            from={16}
            fontSize={27}
            width={1440}
            lines={[
              cmd("curl -fsSL https://opencode.ai/install | bash", { delay: 6 }),
              out("  ▸ downloading binary for linux-x64 …", { delay: 8 }),
              out("  ▸ installing to ~/.opencode/bin", { delay: 8 }),
              out("  ✓ opencode installed", { delay: 8, color: COLOR.accent }),
              { tokens: [], delay: 6 },
              cmd("opencode --version", { delay: 10 }),
              out("  2.1.4", { delay: 8 }),
            ]}
          />
        </div>
        <AltPaths from={46} />
      </AbsoluteFill>
    </Stage>
  );
};

/** Package-manager alternatives, revealed on their own clock. */
const AltPaths: React.FC<{ readonly from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });

  const alts: readonly [string, string, string][] = [
    ["bun", "bun install -g opencode-ai", COLOR.accent],
    ["npm", "npm install -g opencode-ai", COLOR.rose],
    ["brew", "brew install anomalyco/tap/opencode", COLOR.gold],
    ["docker", "docker run -it --rm ghcr.io/anomalyco/opencode", COLOR.violet],
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        opacity: interpolate(p, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${rise(p, 18)}px`,
      }}
    >
      {alts.map(([label, cmdText, color], i) => {
        const q = spring({
          frame: frame - 4 - i * 4,
          fps,
          config: { damping: 200, mass: 0.4 },
        });
        return (
          <div
            key={label}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: `1px solid ${color}44`,
              backgroundColor: `${color}10`,
              fontFamily: FONT.mono,
              fontSize: 17,
              color: COLOR.fgDim,
              opacity: interpolate(q, [0, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <span style={{ color, marginRight: 10 }}>{label}</span>
            {cmdText}
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────────────────────────────────── 4. FIRST RUN */

export const FirstRunScene: React.FC = () => {
  const models = [
    "nemotron-3-ultra-free",
    "mimo-v2.6-flash-free",
    "ling-3.1-flash-free",
    "space-bunny-free",
  ];

  return (
    <Stage>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", gap: 40, padding: 80 }}
      >
        <Heading
          eyebrow="Step 02"
          title="First run, zero paid models"
          lede="OpenCode Zen ships a set of free models. Connect once, then pick a free model in the TUI with /models and never touch a credit card."
        />

        <div style={{ display: "flex", gap: 26, alignItems: "stretch" }}>
          <Terminal
            from={14}
            fontSize={25}
            width={880}
            title="opencode"
            lines={[
              cmd("opencode", { delay: 4, prompt: "" }),
              out("  opencode v2.1.4 · connected to zen", { delay: 10, color: COLOR.accent }),
              { tokens: [], delay: 6 },
              plainLineCmd("/models", 12),
              out("  ── free models ─────────────", { delay: 8 }),
              out("  ● nemotron-3-ultra-free", { delay: 6, color: COLOR.accent }),
              out("    mimo-v2.6-flash-free", { delay: 4 }),
              out("    ling-3.1-flash-free", { delay: 4 }),
              out("    space-bunny-free", { delay: 4 }),
            ]}
          />

          <FreeNote from={40} models={models} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const plainLineCmd = (s: string, delay?: number) => ({
  tokens: [
    { text: "", color: COLOR.fg },
    { text: s, color: COLOR.gold, bold: true },
  ],
  delay,
});

const FreeNote: React.FC<{ readonly from: number; readonly models: readonly string[] }> = ({
  from,
  models,
}) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });

  return (
    <div
      style={{
        width: 520,
        padding: "34px 34px 30px",
        backgroundColor: COLOR.panel,
        border: `1px solid ${COLOR.accent}33`,
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        opacity: interpolate(p, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${rise(p, 28)}px`,
      }}
    >
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 18,
          letterSpacing: 2.6,
          color: COLOR.accent,
          textTransform: "uppercase",
        }}
      >
        Zero cost
      </div>
      <div style={{ fontSize: 26, lineHeight: 1.42, color: COLOR.fg }}>
        {models.length} free model IDs are available today — enough to write an entire
        codebase.
      </div>
      <div
        style={{
          height: 1,
          backgroundColor: COLOR.panelBorder,
          width: "100%",
        }}
      />
      <div style={{ fontSize: 19, color: COLOR.fgMuted, lineHeight: 1.5 }}>
        OpenCode lists each one as{" "}
        <span style={{ color: COLOR.gold, fontFamily: FONT.mono }}>"available for a
        limited time"</span>{" "}
        — treat the list as a snapshot, not a guarantee.
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────── 5. MCP CONFIG */

export const McpConfigScene: React.FC = () => {
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
        <Heading
          eyebrow="Step 03"
          title="Wire up MCP servers"
          lede="MCP servers give the agent tools. Add them under mcp in your config — JSON or JSONC, so comments are allowed. Config files merge rather than replace."
        />

        <div style={{ display: "flex", gap: 30, alignItems: "flex-start", marginTop: 6 }}>
          <Code
            from={14}
            fontSize={22}
            width={880}
            fileName="~/.config/opencode/opencode.json"
            lines={[
              plainLine('"$schema": "https://opencode.ai/config.json"', "key"),
              plainLine('"mcp": {', "key"),
              key("firecrawl", 8),
              L([t('  "type": "remote",', "punc")], 2),
              L([t('  "url": "https://mcp.firecrawl.dev/v2/mcp"', "str")], 2),
              L([t('  "headers": {', "punc")], 2),
              L([t('    "Authorization": "Bearer fc-…"', "str")], 2),
              L([t("  }", "punc")], 2),
              L([t("},", "punc")], 2),
              key("playwright", 10),
              L([t('  "type": "local",', "punc")], 2),
              L([t('  "command": ["playwright-mcp",', "str")], 2),
              L([t('    "--headless", "--browser", "chromium"]', "str")], 2),
              L([t("}", "punc")], 2),
              L([t("}", "punc")], 2),
            ]}
          />

          <McpFacts from={40} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const McpFacts: React.FC<{ readonly from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();

  const facts: readonly [string, string, string][] = [
    ["remote", "HTTP endpoint + headers", COLOR.sky],
    ["local", "command array + env vars", COLOR.accent],
    ["enabled", "false disables without deleting", COLOR.gold],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 470 }}>
      {facts.map(([k, v, c], i) => {
        const p = spring({
          frame: frame - i * 9,
          fps,
          config: { damping: 200, mass: 0.6 },
        });
        return (
          <div
            key={k}
            style={{
              padding: "20px 24px",
              backgroundColor: COLOR.panel,
              border: `1px solid ${c}33`,
              borderLeft: `3px solid ${c}`,
              borderRadius: 10,
              opacity: interpolate(p, [0, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: `0px ${rise(p, 20)}px`,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 21, color: c, marginBottom: 5 }}>
              {k}
            </div>
            <div style={{ fontSize: 19, color: COLOR.fgDim, lineHeight: 1.4 }}>{v}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ────────────────────────────────────────────────── 6. MCP CAVEAT */

export const McpTypesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const servers: readonly [string, string, string][] = [
    ["firecrawl", "web search · scrape · papers", COLOR.rose],
    ["tinyfish", "free search · fetch · automation", COLOR.accent],
    ["you-com", "independent web index", COLOR.violet],
    ["agentql", "structured page extraction", COLOR.gold],
    ["playwright", "on-demand dynamic pages", COLOR.sky],
  ];

  const warn = spring({
    frame: frame - Math.round(1.15 * fps),
    fps,
    config: { damping: 200, mass: 0.7 },
  });

  return (
    <Stage>
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", gap: 40, padding: 90 }}
      >
        <Heading
          eyebrow="Step 03 · continued"
          title="This machine's five servers"
          lede="Each MCP becomes a set of tools the model can call. Once configured, refer to a server by name in any prompt."
        />

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {servers.map(([name, desc, color], i) => {
            const p = spring({
              frame: frame - 20 - i * 7,
              fps,
              config: { damping: 200, mass: 0.5 },
            });
            const live = interpolate(p, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={name}
                style={{
                  width: 356,
                  padding: "22px 24px",
                  backgroundColor: COLOR.panel,
                  border: `1px solid ${color}33`,
                  borderRadius: 12,
                  opacity: live,
                  translate: `0px ${rise(p, 22)}px`,
                  scale: interpolate(p, [0, 1], [0.96, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: HOUSE,
                  }),
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: color,
                      boxShadow: `0 0 12px ${color}`,
                    }}
                  />
                  <div style={{ fontFamily: FONT.mono, fontSize: 22, color: color }}>
                    {name}
                  </div>
                </div>
                <div style={{ fontSize: 17, color: COLOR.fgMuted, lineHeight: 1.4 }}>
                  {desc}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            maxWidth: 1180,
            padding: "24px 30px",
            borderRadius: 12,
            border: `1px solid ${COLOR.gold}44`,
            backgroundColor: `${COLOR.gold}0f`,
            display: "flex",
            gap: 18,
            alignItems: "flex-start",
            opacity: interpolate(warn, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${rise(warn, 22)}px`,
          }}
        >
          <div style={{ fontSize: 26, lineHeight: 1 }}>⚠</div>
          <div style={{ fontSize: 21, color: COLOR.fgDim, lineHeight: 1.5 }}>
            Every MCP server{" "}
            <span style={{ color: COLOR.gold, fontWeight: 600 }}>adds to your context</span>.
            Be deliberate about which ones you enable — a handful of broad tools costs
            far more than several narrow ones.
          </div>
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ─────────────────────────────────────────── 7. BUN + FRAMEWORKS */

export const BunScene: React.FC = () => {
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 24 }}>
        <Heading
          eyebrow="Step 04"
          title="Bun installs the frameworks"
          lede="Bun is the fastest path in. It installs the agent's dependencies and scaffolds the video project in one command."
          accent={COLOR.accent}
        />

        <div style={{ display: "flex", gap: 28, alignItems: "flex-start", marginTop: 8 }}>
          <Code
            from={12}
            fontSize={22}
            width={790}
            fileName="terminal"
            lines={[
              plainLine("$ bun install -g opencode-ai", "cmd"),
              plainLine("  ✓ installed global binary", "ok", 10),
              gap(6),
              cm("scaffold a Remotion project", 6),
              plainLine("$ bunx --bun create-video@latest --yes --blank .", "cmd", 4),
              plainLine("  ✓ remotion 4.0.533 · react 19.2.3", "ok", 10),
              gap(6),
              cm("add packages — always version-matched", 6),
              plainLine("$ bunx remotion add @remotion/transitions", "cmd", 4),
              plainLine("$ bunx remotion add @remotion/media", "cmd", 4),
              plainLine("$ bunx remotion add @remotion/google-fonts", "cmd", 4),
              plainLine("  ✓ all @remotion/* pinned to 4.0.533", "ok", 10),
            ]}
          />

          <BunAside from={44} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const BunAside: React.FC<{ readonly from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();

  const notes: readonly [string, string, string][] = [
    ["--yes", "scaffold non-interactively in CI", COLOR.accent],
    ["remotion add", "keeps every @remotion/* on one version", COLOR.gold],
    ["bun vs npm", "faster installs, identical output", COLOR.violet],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 430 }}>
      {notes.map(([k, v, c], i) => {
        const p = spring({
          frame: frame - i * 8,
          fps,
          config: { damping: 200, mass: 0.6 },
        });
        return (
          <div
            key={k}
            style={{
              padding: "18px 22px",
              backgroundColor: COLOR.panel,
              border: `1px solid ${COLOR.panelBorder}`,
              borderLeft: `3px solid ${c}`,
              borderRadius: 10,
              opacity: interpolate(p, [0, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: `0px ${rise(p, 18)}px`,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 20, color: c, marginBottom: 4 }}>
              {k}
            </div>
            <div style={{ fontSize: 18, color: COLOR.fgMuted, lineHeight: 1.4 }}>{v}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────────────────────────────────── 8. RENDER */

export const RenderScene: React.FC = () => {
  return (
    <Stage>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 22 }}>
        <Heading
          eyebrow="Step 05"
          title="Render the MP4"
          lede="Typecheck first, then render. The frame is a pure function of its frame number, so every run is byte-identical — and it costs nothing."
          accent={COLOR.gold}
        />

        <div style={{ display: "flex", gap: 26, alignItems: "flex-start", marginTop: 6 }}>
          <Terminal
            from={12}
            fontSize={24}
            width={920}
            title="render"
            lines={[
              cmd("bunx tsc --noEmit", { delay: 4 }),
              out("  ✓ exit 0", { delay: 8, color: COLOR.accent }),
              { tokens: [], delay: 5 },
              cmd("bunx remotion still Intro out/check.png --frame=30", { delay: 8 }),
              out("  ✓ wrote out/check.png", { delay: 8, color: COLOR.accent }),
              { tokens: [], delay: 5 },
              cmd("bunx remotion render Intro out/video.mp4 \\", { delay: 8 }),
              cmd("  --codec h264 --crf 18 --pixel-format yuv420p", {
                delay: 4,
                prompt: "  ",
              }),
              out("  Rendered 1440/1440", { delay: 10 }),
              out("  ✓ out/video.mp4  ·  h264 yuv420p  ·  60 fps", {
                delay: 8,
                color: COLOR.accent,
              }),
            ]}
          />

          <RenderStats from={52} />
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

const RenderStats: React.FC<{ readonly from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();

  const stats: readonly [string, string, string][] = [
    ["60 fps", "the house curve on every move", COLOR.accent],
    ["CRF 18", "visually lossless, platform-safe", COLOR.gold],
    ["yuv420p", "mandatory for social platforms", COLOR.violet],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 500 }}>
      {stats.map(([k, v, c], i) => {
        const p = spring({
          frame: frame - i * 8,
          fps,
          config: { damping: 200, mass: 0.6 },
        });
        return (
          <div
            key={k}
            style={{
              padding: "20px 24px",
              backgroundColor: COLOR.panel,
              border: `1px solid ${c}33`,
              borderRadius: 10,
              opacity: interpolate(p, [0, 1], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: `0px ${rise(p, 18)}px`,
            }}
          >
            <div style={{ fontFamily: FONT.mono, fontSize: 24, color: c, marginBottom: 5 }}>
              {k}
            </div>
            <div style={{ fontSize: 18, color: COLOR.fgMuted, lineHeight: 1.4 }}>{v}</div>
          </div>
        );
      })}
      <Total from={frame - 34} />
    </div>
  );
};

/** Count-up total that lands on $0.00 with a spring overshoot. */
const Total: React.FC<{ readonly from: number }> = ({ from }) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 14, mass: 0.8 } });
  const value = interpolate(p, [0, 1], [12.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        marginTop: 6,
        padding: "24px 26px",
        borderRadius: 12,
        border: `1px solid ${COLOR.accent}44`,
        backgroundColor: `${COLOR.accent}12`,
        opacity: interpolate(p, [0, 0.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 16, color: COLOR.fgMuted, letterSpacing: 2 }}>
        TOTAL COST
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 52,
          fontWeight: 800,
          color: COLOR.accent,
          marginTop: 4,
        }}
      >
        ${value.toFixed(2)}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────── 9. OUTRO */

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.7 },
    durationInFrames: Math.round(0.8 * fps),
  });

  const steps = ["install", "connect MCPs", "scaffold with bun", "render"];

  return (
    <Stage>
      <ParticleField count={70} seed="outro" />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", gap: 34 }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: -1.4,
            opacity: interpolate(p, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${rise(p)}px`,
          }}
        >
          Four commands. Zero dollars.
        </div>

        <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
          {steps.map((s, i) => {
            const q = spring({
              frame: frame - 16 - i * 9,
              fps,
              config: { damping: 200, mass: 0.5 },
            });
            return (
              <React.Fragment key={s}>
                {i > 0 ? (
                  <div
                    style={{
                      width: 46,
                      height: 1,
                      backgroundColor: COLOR.accentDim,
                      transform: `scaleX(${interpolate(q, [0, 1], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: HOUSE,
                      })})`,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    padding: "12px 22px",
                    borderRadius: 999,
                    border: `1px solid ${COLOR.accent}44`,
                    backgroundColor: `${COLOR.accent}12`,
                    fontFamily: FONT.mono,
                    fontSize: 22,
                    color: COLOR.accent,
                    opacity: interpolate(q, [0, 1], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    translate: `0px ${rise(q, 14)}px`,
                  }}
                >
                  {s}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 18,
            fontFamily: FONT.mono,
            fontSize: 22,
            color: COLOR.fgMuted,
            opacity: interpolate(p, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          opencode.ai/docs · remotion.dev/docs
        </div>
      </AbsoluteFill>
    </Stage>
  );
};

/* ───────────────────────────────────────────── SHARED: PARTICLES */

/**
 * Seeded particle field. Positions come from `random(seed)`, so every render
 * produces the identical field — the determinism rule in action.
 */
const ParticleField: React.FC<{ readonly count: number; readonly seed: string }> = ({
  count,
  seed,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {Array.from({ length: count }).map((_, i) => {
        const x = random(`${seed}-x-${i}`) * 100;
        const y0 = random(`${seed}-y-${i}`) * 100;
        const drift = 0.4 + random(`${seed}-d-${i}`) * 0.6;
        const size = 1.5 + random(`${seed}-s-${i}`) * 2.4;
        const phase = random(`${seed}-p-${i}`) * Math.PI * 2;

        // Slow vertical drift + gentle sine sway, both frame-derived.
        const y = (y0 + frame / (fps * 26) * drift * 12) % 104;
        const sway = Math.sin(frame / (fps * 3.4) + phase) * 9;

        const twinkle = 0.16 + 0.34 * (0.5 + 0.5 * Math.sin(frame / (fps * 1.7) + phase));

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y - 2}%`,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: i % 5 === 0 ? COLOR.accent : COLOR.sky,
              opacity: twinkle,
              translate: `${sway}px 0px`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};