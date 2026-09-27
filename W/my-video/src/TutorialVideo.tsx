import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

// ─── Theme ────────────────────────────────────────────────────────
const C = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceLight: "#1a1a2e",
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
};

const FONT = "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace";

// ─── Animated Text Components ─────────────────────────────────────

const SlideInText: React.FC<{
  children: React.ReactNode;
  frame: number;
  startFrame: number;
  direction?: "left" | "right" | "up" | "down";
  distance?: number;
  style?: React.CSSProperties;
}> = ({ children, frame, startFrame, direction = "up", distance = 40, style }) => {
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 90 },
    durationInFrames: 30,
  });

  const eased = interpolate(progress, [0, 1], [0, 1], {
    easing: Easing.out(Easing.cubic),
  });

  const transforms: Record<string, string> = {
    left: `translateX(${(1 - eased) * -distance}px)`,
    right: `translateX(${(1 - eased) * distance}px)`,
    up: `translateY(${(1 - eased) * distance}px)`,
    down: `translateY(${(1 - eased) * -distance}px)`,
  };

  return (
    <div
      style={{
        opacity: eased,
        transform: transforms[direction],
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const TypewriterText: React.FC<{
  text: string;
  frame: number;
  startFrame: number;
  speed?: number;
  color?: string;
  showCursor?: boolean;
  style?: React.CSSProperties;
}> = ({ text, frame, startFrame, speed = 2, color = C.text, showCursor = true, style }) => {
  const charsToShow = interpolate(
    frame,
    [startFrame, startFrame + text.length / speed],
    [0, text.length],
    { extrapolateRight: "clamp" }
  );

  const visible = Math.floor(charsToShow);
  const cursorOpacity = showCursor ? (Math.floor(frame / 6) % 2 === 0 ? 1 : 0) : 0;

  return (
    <span style={{ color, ...style }}>
      {text.substring(0, visible)}
      <span style={{ opacity: cursorOpacity, color: C.accent }}>|</span>
    </span>
  );
};

const FadeInText: React.FC<{
  children: React.ReactNode;
  frame: number;
  startFrame: number;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, frame, startFrame, duration = 20, delay = 0, style }) => {
  const opacity = interpolate(
    frame,
    [startFrame + delay, startFrame + delay + duration],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <div style={{ opacity, ...style }}>
      {children}
    </div>
  );
};

const ScaleInText: React.FC<{
  children: React.ReactNode;
  frame: number;
  startFrame: number;
  style?: React.CSSProperties;
}> = ({ children, frame, startFrame, style }) => {
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 10, stiffness: 120 },
    durationInFrames: 25,
  });

  const opacity = interpolate(frame, [startFrame, startFrame + 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const ProgressBar: React.FC<{
  progress: number;
  frame: number;
  startFrame: number;
  label: string;
  style?: React.CSSProperties;
}> = ({ progress, frame, startFrame, label, style }) => {
  const width = interpolate(frame, [startFrame, startFrame + 30], [0, 100], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{ width: "100%", ...style }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span style={{ color: C.textDim, fontSize: 14 }}>{label}</span>
        <span style={{ color: C.accent, fontSize: 14 }}>{Math.round(width)}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: 6,
          background: C.surface,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
            borderRadius: 3,
            transition: "none",
          }}
        />
      </div>
    </div>
  );
};

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

  const y = interpolate(frame, [startFrame, startFrame + 25], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        background: C.terminalBg,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          background: "#161b22",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: C.textDim,
            marginLeft: 12,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: 24, fontFamily: FONT, fontSize: 18, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Scene 1: Intro ───────────────────────────────────────────────
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
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
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        opacity: bgOpacity,
      }}
    >
      <SlideInText frame={frame} startFrame={20} direction="down" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            color: C.accent,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 32,
          }}
        >
          TUTORIAL
        </div>
      </SlideInText>

      <SlideInText frame={frame} startFrame={50} direction="up" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 88,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          How This Video
          <br />
          <span style={{ color: C.primaryLight }}>Was Made</span>
        </div>
      </SlideInText>

      <FadeInText frame={frame} startFrame={100} duration={30}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 26,
            color: C.textDim,
            textAlign: "center",
          }}
        >
          Zero API cost. Zero subscriptions. Just code.
        </div>
      </FadeInText>

      <FadeInText frame={frame} startFrame={140} duration={30}>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 32,
            justifyContent: "center",
          }}
        >
          {["1920x1080", "60 FPS", "50 Seconds", "$0.00"].map((item, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "12px 24px",
                fontFamily: FONT,
                fontSize: 18,
                color: C.text,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </FadeInText>
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
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 32,
      }}
    >
      <SlideInText frame={frame} startFrame={240} direction="left" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Step 1
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Create a new project
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: C.textDim,
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          We use <span style={{ color: C.accent }}>bun</span> — the fast all-in-one JavaScript runtime. A single command scaffolds a new TypeScript project.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={300}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bun init -y"
            frame={frame}
            startFrame={320}
            speed={3}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 16 }}>
          <FadeInText frame={frame} startFrame={360} duration={15}>
            <span> + .gitignore</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={375} duration={15}>
            <span> + index.ts</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={390} duration={15}>
            <span> + tsconfig.json</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={405} duration={15}>
            <span> + README.md</span>
          </FadeInText>
        </div>
        <FadeInText frame={frame} startFrame={430} duration={20}>
          <div style={{ color: C.success, marginTop: 16 }}> 6 packages installed [2.25s]</div>
        </FadeInText>
      </Terminal>
    </div>
  );
};

// ─── Scene 3: bun add remotion ────────────────────────────────────
const BunAdd: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 32,
      }}
    >
      <SlideInText frame={frame} startFrame={600} direction="left" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Step 2
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Install Remotion
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: C.textDim,
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          <span style={{ color: C.accent }}>Remotion</span> is a React-based framework for creating videos programmatically. It renders your code into frames using headless Chrome.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={660}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bun add remotion @remotion/cli @remotion/bundler @remotion/renderer react react-dom"
            frame={frame}
            startFrame={680}
            speed={4}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 16 }}>
          <FadeInText frame={frame} startFrame={780} duration={15}>
            <span>bun add v1.4.2 (744846f84)</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={800} duration={15}>
            <span>Resolving dependencies...</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={820} duration={15}>
            <span>Resolved, downloaded and extracted [885]</span>
          </FadeInText>
        </div>
        <div style={{ marginTop: 12 }}>
          <FadeInText frame={frame} startFrame={850} duration={15}>
            <span style={{ color: C.success }}>installed remotion@4.0.529</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={870} duration={15}>
            <span style={{ color: C.success }}>installed @remotion/cli@4.0.529</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={890} duration={15}>
            <span style={{ color: C.success }}>installed react@19.3.0</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={910} duration={15}>
            <span style={{ color: C.accent }}>241 packages installed [29.76s]</span>
          </FadeInText>
        </div>
      </Terminal>
    </div>
  );
};

// ─── Scene 4: Project Structure ───────────────────────────────────
const ProjectStructure: React.FC = () => {
  const frame = useCurrentFrame();

  const items = [
    { name: "src/", type: "dir", indent: 0, desc: "Source code" },
    { name: "index.ts", type: "file", indent: 1, desc: "Entry point — registers the video" },
    { name: "Root.tsx", type: "file", indent: 1, desc: "Composition definition" },
    { name: "MyVideo.tsx", type: "file", indent: 1, desc: "Main video content" },
    { name: "TutorialVideo.tsx", type: "file", indent: 1, desc: "This tutorial video" },
    { name: "out/", type: "dir", indent: 0, desc: "Rendered output" },
    { name: "video.mp4", type: "file", indent: 1, desc: "Main video output" },
    { name: "tutorial.mp4", type: "file", indent: 1, desc: "Tutorial output" },
    { name: "package.json", type: "file", indent: 0, desc: "Dependencies" },
    { name: "tsconfig.json", type: "file", indent: 0, desc: "TypeScript config" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 32,
      }}
    >
      <SlideInText frame={frame} startFrame={1080} direction="left" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Step 3
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Project structure
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: C.textDim,
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          Each video is a <span style={{ color: C.accent }}>Composition</span> — a React component that defines scenes, animations, and timing.
        </div>
      </SlideInText>

      <Terminal title="File Explorer" frame={frame} startFrame={1140}>
        {items.map((item, i) => {
          const itemOpacity = spring({
            frame: frame - 1160 - i * 10,
            fps: 60,
            config: { damping: 14 },
            durationInFrames: 15,
          });

          const itemX = interpolate(frame, [1160 + i * 10, 1175 + i * 10], [-20, 0], {
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
              <span style={{ color: C.textDim, width: item.indent * 24 }} />
              <span
                style={{
                  color: item.type === "dir" ? "#60a5fa" : C.text,
                  fontWeight: item.type === "dir" ? 700 : 400,
                }}
              >
                {item.name}
              </span>
              {item.desc && (
                <span style={{ color: C.textDim, fontSize: 14, marginLeft: 16 }}>
                  — {item.desc}
                </span>
              )}
            </div>
          );
        })}
      </Terminal>
    </div>
  );
};

// ─── Scene 5: Write Code ──────────────────────────────────────────
const WriteCode: React.FC = () => {
  const frame = useCurrentFrame();

  const codeLines = [
    { text: "export const MyVideo: React.FC = () => {", color: "#a78bfa" },
    { text: "  const frame = useCurrentFrame();", color: "#22d3ee" },
    { text: "  const { fps } = useVideoConfig();", color: "#22d3ee" },
    { text: "", color: C.text },
    { text: "  const scale = spring({", color: "#fbbf24" },
    { text: "    frame,", color: C.text },
    { text: "    fps,", color: C.text },
    { text: "    config: { damping: 12 },", color: C.text },
    { text: "  });", color: "#fbbf24" },
    { text: "", color: C.text },
    { text: "  const opacity = interpolate(", color: "#60a5fa" },
    { text: "    frame, [0, 20], [0, 1]", color: C.text },
    { text: "  );", color: "#60a5fa" },
    { text: "", color: C.text },
    { text: "  return (", color: "#a78bfa" },
    { text: "    <div style={{ opacity, transform: `scale(${scale})` }}>", color: C.text },
    { text: "      Hello World", color: "#4ade80" },
    { text: "    </div>", color: C.text },
    { text: "  );", color: "#a78bfa" },
    { text: "};", color: "#a78bfa" },
  ];

  const visibleChars = interpolate(frame, [1500, 1750], [0, 600], {
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
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 32,
      }}
    >
      <SlideInText frame={frame} startFrame={1440} direction="left" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Step 4
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Write the video code
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: C.textDim,
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          Videos are just <span style={{ color: C.accent }}>React components</span>. Use <span style={{ color: C.warning }}>spring()</span> for smooth animations and <span style={{ color: C.primaryLight }}>interpolate()</span> for frame-based transitions.
        </div>
      </SlideInText>

      <Terminal title="MyVideo.tsx" frame={frame} startFrame={1500}>
        <div style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>
          {renderedLines.map((line, i) => (
            <div key={line.key} style={{ display: "flex" }}>
              <span
                style={{
                  color: C.textDim,
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
  );
};

// ─── Scene 6: Render Command ──────────────────────────────────────
const RenderCommand: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 32,
      }}
    >
      <SlideInText frame={frame} startFrame={2040} direction="left" distance={60}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          Step 5
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            marginBottom: 16,
          }}
        >
          Render to MP4
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
            color: C.textDim,
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          One command renders your composition to video. Remotion captures each frame with <span style={{ color: C.accent }}>headless Chrome</span> and encodes with <span style={{ color: C.accent }}>FFmpeg</span>.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={2100}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bunx remotion render src/index.ts MyVideo out/video.mp4 --concurrency=2"
            frame={frame}
            startFrame={2120}
            speed={4}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 20 }}>
          <FadeInText frame={frame} startFrame={2220} duration={15}>
            <span>Bundling 100%</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={2240} duration={15}>
            <span>Composition MyVideo</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={2260} duration={15}>
            <span>Codec h264</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={2280} duration={15}>
            <span>Output out/video.mp4</span>
          </FadeInText>
        </div>
        <div style={{ marginTop: 20 }}>
          <FadeInText frame={frame} startFrame={2320} duration={20}>
            <span style={{ color: C.accent }}>Rendered 450/450 frames</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={2350} duration={20}>
            <span style={{ color: C.success }}>Encoded 450/450</span>
          </FadeInText>
        </div>
        <FadeInText frame={frame} startFrame={2380} duration={20}>
          <div style={{ color: C.warning, marginTop: 16 }}> out/video.mp4 784.3 kB</div>
        </FadeInText>
      </Terminal>
    </div>
  );
};

// ─── Scene 7: Result ──────────────────────────────────────────────
const Result: React.FC = () => {
  const frame = useCurrentFrame();

  const stats = [
    { label: "Resolution", value: "1920x1080", icon: "Full HD" },
    { label: "Frame Rate", value: "60 fps", icon: "Smooth" },
    { label: "Duration", value: "50 seconds", icon: "Short" },
    { label: "File Size", value: "1.3 MB", icon: "Tiny" },
    { label: "API Cost", value: "$0.00", icon: "Free" },
    { label: "Subscriptions", value: "None", icon: "Zero" },
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: `radial-gradient(ellipse at center, ${C.surface} 0%, ${C.bg} 70%)`,
        padding: 60,
        gap: 40,
      }}
    >
      <SlideInText frame={frame} startFrame={2520} direction="up" distance={40}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.success,
            textTransform: "uppercase",
            letterSpacing: 3,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Result
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 48,
            fontWeight: 700,
            color: C.text,
            textAlign: "center",
          }}
        >
          Professional quality video
        </div>
      </SlideInText>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {stats.map((stat, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const statOpacity = spring({
            frame: frame - 2580 - i * 15,
            fps: 60,
            config: { damping: 12 },
            durationInFrames: 20,
          });

          const statY = interpolate(frame, [2580 + i * 15, 2600 + i * 15], [30, 0], {
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          return (
            <div
              key={i}
              style={{
                opacity: statOpacity,
                transform: `translateY(${statY}px)`,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 28,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: C.textDim,
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
                  fontSize: 32,
                  fontWeight: 700,
                  color: stat.value === "$0.00" ? C.success : C.text,
                  marginBottom: 4,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: C.accent,
                }}
              >
                {stat.icon}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Scene 8: Outro ───────────────────────────────────────────────
const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [2880, 2900], [0, 1], {
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
        background: `radial-gradient(ellipse at center, #0f172a 0%, #020617 70%)`,
        opacity,
      }}
    >
      <SlideInText frame={frame} startFrame={2900} direction="up" distance={40}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: C.accent,
            marginBottom: 32,
            textTransform: "uppercase",
            letterSpacing: 4,
          }}
        >
          You Can Do This Too
        </div>
      </SlideInText>

      <SlideInText frame={frame} startFrame={2930} direction="up" distance={40}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 64,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.2,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          No expensive LLM.
          <br />
          No subscriptions.
          <br />
          <span style={{ color: C.success }}>Just code.</span>
        </div>
      </SlideInText>

      <ScaleInText frame={frame} startFrame={2960}>
        <div
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            borderRadius: 16,
            padding: "20px 48px",
          }}
        >
          <div
            style={{
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 700,
              color: "white",
            }}
          >
            Total Cost: $0.00
          </div>
        </div>
      </ScaleInText>
    </div>
  );
};

// ─── Main Composition ─────────────────────────────────────────────
export const TutorialVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const getSceneOpacity = (start: number, end: number) => {
    return interpolate(frame, [start, start + 15, end - 15, end], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", background: C.bg }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(0, 240) }}>
        <Intro />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(240, 600) }}>
        <BunInit />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(600, 1080) }}>
        <BunAdd />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(1080, 1440) }}>
        <ProjectStructure />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(1440, 2040) }}>
        <WriteCode />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(2040, 2520) }}>
        <RenderCommand />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(2520, 2880) }}>
        <Result />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(2880, 3000) }}>
        <Outro />
      </div>
    </div>
  );
};
