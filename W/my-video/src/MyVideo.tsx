import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// ─── Theme ────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  primary: "#6366f1",
  primaryLight: "#818cf8",
  accent: "#22d3ee",
  success: "#4ade80",
  danger: "#f87171",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  border: "#1e293b",
};

const FONT = "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace";

// ─── Scene 1: Opening Title ──────────────────────────────────────
const OpeningTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
    durationInFrames: 40,
  });

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 32,
            color: COLORS.accent,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          THE VIRAL MYTH
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 96,
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          "You Need an
          <br />
          <span style={{ color: COLORS.primaryLight }}>Expensive LLM</span>
          <br />
          to Make Videos"
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            color: COLORS.textDim,
            opacity: subtitleOpacity,
          }}
        >
          — Every tech Twitter creator, 2026
        </div>
      </div>
    </div>
  );
};

// ─── Scene 2: The Claim ──────────────────────────────────────────
const TheClaim: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardOpacity = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14 },
    durationInFrames: 30,
  });

  const cardY = interpolate(frame, [60, 90], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const redXScale = spring({
    frame: frame - 120,
    fps,
    config: { damping: 8, stiffness: 150 },
    durationInFrames: 20,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 80,
      }}
    >
      <div
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 24,
          padding: 64,
          maxWidth: 1200,
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            transform: `scale(${redXScale})`,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: COLORS.danger,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 72,
              fontWeight: 900,
              color: "white",
            }}
          >
            ✕
          </div>
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: COLORS.danger,
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: 4,
          }}
        >
          The Claim
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.text,
            lineHeight: 1.3,
            marginBottom: 32,
          }}
        >
          Claude Opus 5.5
          <br />
          <span style={{ color: COLORS.textDim }}>at </span>
          <span style={{ color: COLORS.danger }}>$20/M tokens</span>
          <span style={{ color: COLORS.textDim }}> is required for</span>
          <br />
          pro-level motion graphics
        </div>

        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: COLORS.textDim,
            borderLeft: `4px solid ${COLORS.danger}`,
            paddingLeft: 24,
            lineHeight: 1.6,
          }}
        >
          "Opus 5.5 is absurdly good at motion design"
          <br />
          — Viral X/Twitter post, Sept 2026
        </div>
      </div>
    </div>
  );
};

// ─── Scene 3: The Reality Pipeline ──────────────────────────────
const Pipeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const step1Opacity = spring({
    frame: frame - 180,
    fps,
    config: { damping: 14 },
    durationInFrames: 25,
  });

  const step2Opacity = spring({
    frame: frame - 210,
    fps,
    config: { damping: 14 },
    durationInFrames: 25,
  });

  const step3Opacity = spring({
    frame: frame - 240,
    fps,
    config: { damping: 14 },
    durationInFrames: 25,
  });

  const arrow1Opacity = interpolate(frame, [200, 215], [0, 1], {
    extrapolateRight: "clamp",
  });

  const arrow2Opacity = interpolate(frame, [230, 245], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 24,
          color: COLORS.success,
          marginBottom: 48,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        The Reality
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          width: "100%",
          maxWidth: 1600,
        }}
      >
        {/* Step 1 */}
        <div
          style={{
            flex: 1,
            opacity: step1Opacity,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🤖
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.primaryLight,
              marginBottom: 12,
            }}
          >
            AI Agent
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 18,
              color: COLORS.textDim,
              lineHeight: 1.5,
            }}
          >
            Writes React code
            <br />
            from your prompt
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 16,
              color: COLORS.success,
              marginTop: 16,
              fontWeight: 600,
            }}
          >
            ~$0.02/session
          </div>
        </div>

        {/* Arrow 1 */}
        <div
          style={{
            opacity: arrow1Opacity,
            fontSize: 40,
            color: COLORS.accent,
          }}
        >
          →
        </div>

        {/* Step 2 */}
        <div
          style={{
            flex: 1,
            opacity: step2Opacity,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            ⚛️
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.accent,
              marginBottom: 12,
            }}
          >
            Remotion
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 18,
              color: COLORS.textDim,
              lineHeight: 1.5,
            }}
          >
            Renders code to frames
            <br />
            via headless Chrome
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 16,
              color: COLORS.success,
              marginTop: 16,
              fontWeight: 600,
            }}
          >
            $0 (local)
          </div>
        </div>

        {/* Arrow 2 */}
        <div
          style={{
            opacity: arrow2Opacity,
            fontSize: 40,
            color: COLORS.accent,
          }}
        >
          →
        </div>

        {/* Step 3 */}
        <div
          style={{
            flex: 1,
            opacity: step3Opacity,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🎬
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.success,
              marginBottom: 12,
            }}
          >
            MP4 Output
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 18,
              color: COLORS.textDim,
              lineHeight: 1.5,
            }}
          >
            Pixel-perfect, deterministic
            <br />
            smooth 60fps video
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 16,
              color: COLORS.success,
              marginTop: 16,
              fontWeight: 600,
            }}
          >
            $0 render cost
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Scene 4: Code Typing ────────────────────────────────────────
const CodeTyping: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeLines = [
    { text: "const frame = useCurrentFrame();", color: COLORS.accent },
    { text: "const opacity = interpolate(", color: COLORS.primaryLight },
    { text: "  frame,", color: COLORS.text },
    { text: "  [startFrame, startFrame + 20],", color: COLORS.text },
    { text: "  [0, 1],", color: COLORS.text },
    { text: "  { extrapolateRight: 'clamp' }", color: COLORS.text },
    { text: ");", color: COLORS.primaryLight },
    { text: "", color: COLORS.text },
    { text: "const translateY = spring({", color: COLORS.accent },
    { text: "  frame: frame - startFrame,", color: COLORS.text },
    { text: "  fps,", color: COLORS.text },
    { text: "  config: { damping: 12 },", color: COLORS.text },
    { text: "});", color: COLORS.accent },
  ];

  const visibleChars = interpolate(frame, [300, 380], [0, 500], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const totalChars = codeLines.reduce((acc, l) => acc + l.text.length, 0);
  const currentVisible = Math.min(Math.floor(visibleChars), totalChars);

  let charCount = 0;
  const renderedLines = codeLines.map((line, i) => {
    const lineStart = charCount;
    charCount += line.text.length;
    const visibleInLine = Math.max(
      0,
      Math.min(currentVisible - lineStart, line.text.length)
    );
    return { ...line, visible: visibleInLine, key: i };
  });

  const cursorOpacity = Math.floor(frame / 8) % 2 === 0 ? 1 : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 80,
      }}
    >
      <div
        style={{
          background: "#0d1117",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: 48,
          width: "100%",
          maxWidth: 1100,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#28c840" }} />
          <div
            style={{
              fontFamily: FONT,
              fontSize: 16,
              color: COLORS.textDim,
              marginLeft: 16,
            }}
          >
            MyVideo.tsx
          </div>
        </div>

        {/* Code */}
        <div style={{ fontFamily: FONT, fontSize: 24, lineHeight: 1.8 }}>
          {renderedLines.map((line, i) => (
            <div key={line.key} style={{ display: "flex" }}>
              <span
                style={{
                  color: COLORS.textDim,
                  width: 40,
                  textAlign: "right",
                  marginRight: 24,
                  userSelect: "none",
                }}
              >
                {i + 1}
              </span>
              <span style={{ color: line.color }}>
                {line.text.substring(0, line.visible)}
                {i === renderedLines.length - 1 && (
                  <span style={{ opacity: cursorOpacity }}>|</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Scene 5: The Reveal ─────────────────────────────────────────
const TheReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [390, 400], [0, 1], {
    extrapolateRight: "clamp",
  });

  const line1Y = spring({
    frame: frame - 400,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 25,
  });

  const line2Y = spring({
    frame: frame - 415,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 25,
  });

  const line3Y = spring({
    frame: frame - 430,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 25,
  });

  const totalCostOpacity = spring({
    frame: frame - 440,
    fps,
    config: { damping: 10, stiffness: 100 },
    durationInFrames: 15,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, #0f172a 0%, #020617 70%)`,
        opacity: bgOpacity,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontSize: 24,
          color: COLORS.success,
          marginBottom: 48,
          textTransform: "uppercase",
          letterSpacing: 4,
        }}
      >
        The Truth
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.text,
            transform: `translateY(${line1Y}px)`,
            opacity: interpolate(line1Y, [0, 20], [1, 0]),
            marginBottom: 24,
          }}
        >
          The LLM writes <span style={{ color: COLORS.primaryLight }}>code</span>.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.text,
            transform: `translateY(${line2Y}px)`,
            opacity: interpolate(line2Y, [0, 20], [1, 0]),
            marginBottom: 24,
          }}
        >
          Remotion renders <span style={{ color: COLORS.accent }}>video</span>.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.text,
            transform: `translateY(${line3Y}px)`,
            opacity: interpolate(line3Y, [0, 20], [1, 0]),
            marginBottom: 48,
          }}
        >
          You pay <span style={{ color: COLORS.success }}>$0</span> in API costs.
        </div>

        <div
          style={{
            opacity: totalCostOpacity,
            transform: `scale(${0.8 + totalCostOpacity * 0.2})`,
            display: "inline-block",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            borderRadius: 16,
            padding: "20px 48px",
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 36,
              fontWeight: 800,
              color: "white",
            }}
          >
            Total Cost: $0.00
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Composition ────────────────────────────────────────────
export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing (at 30fps)
  const scene1End = 150; // 5 seconds
  const scene2End = 300; // 10 seconds
  const scene3End = 450; // 15 seconds
  const scene4End = 600; // 20 seconds
  const scene5End = 750; // 25 seconds

  const getSceneOpacity = (start: number, end: number) => {
    return interpolate(frame, [start, start + 10, end - 10, end], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.bg }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(0, scene1End) }}>
        <OpeningTitle />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(scene1End, scene2End) }}>
        <TheClaim />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(scene2End, scene3End) }}>
        <Pipeline />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(scene3End, scene4End) }}>
        <CodeTyping />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(scene4End, scene5End) }}>
        <TheReveal />
      </div>
    </div>
  );
};
