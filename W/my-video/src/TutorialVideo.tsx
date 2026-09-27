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
  warning: "#fbbf24",
  danger: "#f87171",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  border: "#1e293b",
  terminalBg: "#0d1117",
  terminalGreen: "#4ade80",
  terminalBlue: "#60a5fa",
  terminalYellow: "#fbbf24",
  terminalPurple: "#a78bfa",
  terminalCyan: "#22d3ee",
};

const FONT = "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace";

// ─── Terminal Component ───────────────────────────────────────────
const Terminal: React.FC<{
  title: string;
  children: React.ReactNode;
  frame: number;
  startFrame: number;
}> = ({ title, children, frame, startFrame }) => {
  const { fps } = useVideoConfig();

  const opacity = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14 },
    durationInFrames: 20,
  });

  const y = interpolate(frame, [startFrame, startFrame + 20], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: COLORS.terminalBg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          background: "#161b22",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: COLORS.textDim,
            marginLeft: 12,
          }}
        >
          {title}
        </div>
      </div>
      {/* Content */}
      <div style={{ padding: 24, fontFamily: FONT, fontSize: 18, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Typing Text Component ────────────────────────────────────────
const TypingText: React.FC<{
  text: string;
  frame: number;
  startFrame: number;
  speed?: number;
  color?: string;
}> = ({ text, frame, startFrame, speed = 2, color = COLORS.text }) => {
  const charsToShow = interpolate(frame, [startFrame, startFrame + text.length / speed], [0, text.length], {
    extrapolateRight: "clamp",
  });

  const visible = Math.floor(charsToShow);
  const cursorOpacity = Math.floor(frame / 6) % 2 === 0 ? 1 : 0;

  return (
    <span style={{ color }}>
      {text.substring(0, visible)}
      <span style={{ opacity: cursorOpacity, color: COLORS.accent }}>|</span>
    </span>
  );
};

// ─── Scene 1: Intro ───────────────────────────────────────────────
const Intro: React.FC = () => {
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
            fontSize: 28,
            color: COLORS.accent,
            letterSpacing: 6,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          TUTORIAL
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 80,
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.1,
            marginBottom: 32,
          }}
        >
          How This Video
          <br />
          <span style={{ color: COLORS.primaryLight }}>Was Made</span>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: COLORS.textDim,
            opacity: subtitleOpacity,
          }}
        >
          Zero API cost. Zero subscriptions. Just code.
        </div>
      </div>
    </div>
  );
};

// ─── Scene 2: bun init ────────────────────────────────────────────
const BunInit: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 60,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: COLORS.success,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Step 1: Create Project
        </div>
        <Terminal title="Terminal — bash" frame={frame} startFrame={60}>
          <div style={{ color: COLORS.textDim }}>$</div>
          <div>
            <TypingText
              text="bun init -y"
              frame={frame}
              startFrame={70}
              speed={3}
              color={COLORS.terminalGreen}
            />
          </div>
          <div style={{ color: COLORS.textDim, marginTop: 12 }}>
            <TypingText
              text=" + .gitignore"
              frame={frame}
              startFrame={100}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text=" + index.ts"
              frame={frame}
              startFrame={115}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text=" + tsconfig.json"
              frame={frame}
              startFrame={130}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text=" + README.md"
              frame={frame}
              startFrame={150}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.terminalGreen, marginTop: 16 }}>
            <TypingText
              text=" 6 packages installed [2.25s]"
              frame={frame}
              startFrame={170}
              speed={5}
            />
          </div>
        </Terminal>
      </div>
    </div>
  );
};

// ─── Scene 3: bun add remotion ────────────────────────────────────
const BunAdd: React.FC = () => {
  const frame = useCurrentFrame();

  const installProgress = interpolate(frame, [220, 320], [0, 100], {
    extrapolateRight: "clamp",
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
        padding: 60,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: COLORS.success,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Step 2: Install Remotion
        </div>
        <Terminal title="Terminal — bash" frame={frame} startFrame={200}>
          <div style={{ color: COLORS.textDim }}>$</div>
          <div>
            <TypingText
              text="bun add remotion @remotion/cli @remotion/bundler @remotion/renderer react react-dom"
              frame={frame}
              startFrame={210}
              speed={4}
              color={COLORS.terminalGreen}
            />
          </div>
          <div style={{ color: COLORS.textDim, marginTop: 16 }}>
            <TypingText
              text="bun add v1.4.2 (744846f84)"
              frame={frame}
              startFrame={280}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text="Resolving dependencies..."
              frame={frame}
              startFrame={300}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text="Resolved, downloaded and extracted [885]"
              frame={frame}
              startFrame={320}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalGreen, marginTop: 12 }}>
            <TypingText
              text="installed remotion@4.0.529"
              frame={frame}
              startFrame={340}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalGreen }}>
            <TypingText
              text="installed @remotion/cli@4.0.529"
              frame={frame}
              startFrame={360}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalGreen }}>
            <TypingText
              text="installed react@19.3.0"
              frame={frame}
              startFrame={380}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalCyan, marginTop: 16 }}>
            <TypingText
              text="241 packages installed [29.76s]"
              frame={frame}
              startFrame={400}
              speed={5}
            />
          </div>
        </Terminal>
      </div>
    </div>
  );
};

// ─── Scene 4: Project Structure ───────────────────────────────────
const ProjectStructure: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items = [
    { name: "src/", type: "dir", indent: 0 },
    { name: "index.ts", type: "file", indent: 1, desc: "Entry point" },
    { name: "Root.tsx", type: "file", indent: 1, desc: "Composition" },
    { name: "MyVideo.tsx", type: "file", indent: 1, desc: "Main video" },
    { name: "TutorialVideo.tsx", type: "file", indent: 1, desc: "This video" },
    { name: "out/", type: "dir", indent: 0 },
    { name: "video.mp4", type: "file", indent: 1, desc: "Output" },
    { name: "package.json", type: "file", indent: 0 },
    { name: "tsconfig.json", type: "file", indent: 0 },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 60,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1000 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: COLORS.success,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Step 3: Project Structure
        </div>
        <Terminal title="File Explorer" frame={frame} startFrame={450}>
          {items.map((item, i) => {
            const itemOpacity = spring({
              frame: frame - 460 - i * 8,
              fps,
              config: { damping: 14 },
              durationInFrames: 15,
            });

            const itemX = interpolate(frame, [460 + i * 8, 475 + i * 8], [-20, 0], {
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={i}
                style={{
                  opacity: itemOpacity,
                  transform: `translateX(${itemX}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "4px 0",
                }}
              >
                <span style={{ color: COLORS.textDim, width: item.indent * 24 }} />
                <span
                  style={{
                    color: item.type === "dir" ? COLORS.terminalBlue : COLORS.text,
                    fontWeight: item.type === "dir" ? 700 : 400,
                  }}
                >
                  {item.name}
                </span>
                {item.desc && (
                  <span style={{ color: COLORS.textDim, fontSize: 14, marginLeft: 16 }}>
                    — {item.desc}
                  </span>
                )}
              </div>
            );
          })}
        </Terminal>
      </div>
    </div>
  );
};

// ─── Scene 5: Write Code ──────────────────────────────────────────
const WriteCode: React.FC = () => {
  const frame = useCurrentFrame();

  const codeLines = [
    { text: "export const MyVideo: React.FC = () => {", color: COLORS.terminalPurple },
    { text: "  const frame = useCurrentFrame();", color: COLORS.terminalCyan },
    { text: "  const { fps } = useVideoConfig();", color: COLORS.terminalCyan },
    { text: "", color: COLORS.text },
    { text: "  const scale = spring({", color: COLORS.terminalYellow },
    { text: "    frame,", color: COLORS.text },
    { text: "    fps,", color: COLORS.text },
    { text: "    config: { damping: 12 },", color: COLORS.text },
    { text: "  });", color: COLORS.terminalYellow },
    { text: "", color: COLORS.text },
    { text: "  const opacity = interpolate(", color: COLORS.terminalBlue },
    { text: "    frame, [0, 20], [0, 1]", color: COLORS.text },
    { text: "  );", color: COLORS.terminalBlue },
    { text: "", color: COLORS.text },
    { text: "  return (", color: COLORS.terminalPurple },
    { text: "    <div style={{ opacity, transform: `scale(${scale})` }}>", color: COLORS.text },
    { text: "      Hello World", color: COLORS.terminalGreen },
    { text: "    </div>", color: COLORS.text },
    { text: "  );", color: COLORS.terminalPurple },
    { text: "};", color: COLORS.terminalPurple },
  ];

  const visibleChars = interpolate(frame, [560, 680], [0, 600], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  let charCount = 0;
  const renderedLines = codeLines.map((line, i) => {
    const lineStart = charCount;
    charCount += line.text.length;
    const visibleInLine = Math.max(0, Math.min(Math.floor(visibleChars) - lineStart, line.text.length));
    return { ...line, visible: visibleInLine, key: i };
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
        padding: 60,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: COLORS.success,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Step 4: Write the Code
        </div>
        <Terminal title="MyVideo.tsx" frame={frame} startFrame={550}>
          <div style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>
            {renderedLines.map((line, i) => (
              <div key={line.key} style={{ display: "flex" }}>
                <span
                  style={{
                    color: COLORS.textDim,
                    width: 36,
                    textAlign: "right",
                    marginRight: 20,
                    userSelect: "none",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ color: line.color }}>
                  {line.text.substring(0, line.visible)}
                  {i === renderedLines.length - 1 && (
                    <span style={{ opacity: Math.floor(frame / 6) % 2 === 0 ? 1 : 0 }}>|</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Terminal>
      </div>
    </div>
  );
};

// ─── Scene 6: Render Command ──────────────────────────────────────
const RenderCommand: React.FC = () => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [720, 850], [0, 100], {
    extrapolateRight: "clamp",
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
        padding: 60,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1200 }}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: COLORS.success,
            marginBottom: 20,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          Step 5: Render
        </div>
        <Terminal title="Terminal — bash" frame={frame} startFrame={700}>
          <div style={{ color: COLORS.textDim }}>$</div>
          <div>
            <TypingText
              text="bunx remotion render src/index.ts MyVideo out/video.mp4 --concurrency=2"
              frame={frame}
              startFrame={710}
              speed={4}
              color={COLORS.terminalGreen}
            />
          </div>
          <div style={{ color: COLORS.textDim, marginTop: 16 }}>
            <TypingText
              text="Bundling 100%"
              frame={frame}
              startFrame={780}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text="Composition MyVideo"
              frame={frame}
              startFrame={800}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text="Codec h264"
              frame={frame}
              startFrame={820}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.textDim }}>
            <TypingText
              text="Output out/video.mp4"
              frame={frame}
              startFrame={840}
              speed={8}
            />
          </div>
          <div style={{ color: COLORS.terminalCyan, marginTop: 16 }}>
            <TypingText
              text={`Rendered 450/450 frames`}
              frame={frame}
              startFrame={860}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalGreen, marginTop: 12 }}>
            <TypingText
              text="Encoded 450/450"
              frame={frame}
              startFrame={880}
              speed={6}
            />
          </div>
          <div style={{ color: COLORS.terminalYellow, marginTop: 16 }}>
            <TypingText
              text=" out/video.mp4 784.3 kB"
              frame={frame}
              startFrame={900}
              speed={6}
            />
          </div>
        </Terminal>
      </div>
    </div>
  );
};

// ─── Scene 7: Result ──────────────────────────────────────────────
const Result: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardOpacity = spring({
    frame: frame - 950,
    fps,
    config: { damping: 14 },
    durationInFrames: 25,
  });

  const cardY = interpolate(frame, [950, 975], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const stats = [
    { label: "Resolution", value: "1920x1080" },
    { label: "Frame Rate", value: "60 fps" },
    { label: "Duration", value: "15 seconds" },
    { label: "File Size", value: "766 KB" },
    { label: "API Cost", value: "$0.00" },
    { label: "Subscriptions", value: "None" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${COLORS.surface} 0%, ${COLORS.bg} 70%)`,
        padding: 60,
      }}
    >
      <div
        style={{
          opacity: cardOpacity,
          transform: `translateY(${cardY}px)`,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 24,
          padding: 48,
          width: "100%",
          maxWidth: 900,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: COLORS.success,
            marginBottom: 32,
            textTransform: "uppercase",
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          Result
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {stats.map((stat, i) => {
            const statOpacity = spring({
              frame: frame - 970 - i * 10,
              fps,
              config: { damping: 14 },
              durationInFrames: 15,
            });

            return (
              <div
                key={i}
                style={{
                  opacity: statOpacity,
                  background: COLORS.bg,
                  borderRadius: 12,
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 14,
                    color: COLORS.textDim,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 28,
                    fontWeight: 700,
                    color: stat.value === "$0.00" ? COLORS.success : COLORS.text,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Scene 8: Outro ───────────────────────────────────────────────
const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [1050, 1070], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = spring({
    frame: frame - 1050,
    fps,
    config: { damping: 12, stiffness: 80 },
    durationInFrames: 30,
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
        opacity,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: COLORS.accent,
            marginBottom: 24,
            textTransform: "uppercase",
            letterSpacing: 4,
          }}
        >
          You Can Do This Too
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 64,
            fontWeight: 800,
            color: COLORS.text,
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          No expensive LLM.
          <br />
          No subscriptions.
          <br />
          <span style={{ color: COLORS.success }}>Just code.</span>
        </div>
        <div
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
            borderRadius: 16,
            padding: "20px 48px",
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
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

// ─── Main Composition ─────────────────────────────────────────────
export const TutorialVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const getSceneOpacity = (start: number, end: number) => {
    return interpolate(frame, [start, start + 10, end - 10, end], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.bg }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(0, 150) }}>
        <Intro />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(150, 300) }}>
        <BunInit />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(300, 450) }}>
        <BunAdd />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(450, 550) }}>
        <ProjectStructure />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(550, 700) }}>
        <WriteCode />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(700, 850) }}>
        <RenderCommand />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(850, 1000) }}>
        <Result />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(1000, 1200) }}>
        <Outro />
      </div>
    </div>
  );
};
