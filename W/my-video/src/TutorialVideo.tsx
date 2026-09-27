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
  primary: "#6366f1",
  primaryLight: "#818cf8",
  accent: "#22d3ee",
  success: "#4ade80",
  warning: "#fbbf24",
  text: "#f1f5f9",
  textDim: "#94a3b8",
  border: "#1e293b",
  terminalBg: "#0d1117",
};

const FONT = "ui-monospace, 'SF Mono', 'Cascadia Code', Menlo, monospace";

// ─── Optimized Animation Components ───────────────────────────────

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
    durationInFrames: 25,
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
    <div style={{ opacity: eased, transform: transforms[direction], ...style }}>
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
  style?: React.CSSProperties;
}> = ({ text, frame, startFrame, speed = 2, color = C.text, style }) => {
  const charsToShow = interpolate(
    frame,
    [startFrame, startFrame + text.length / speed],
    [0, text.length],
    { extrapolateRight: "clamp" }
  );

  const visible = Math.floor(charsToShow);
  const cursorOpacity = Math.floor(frame / 6) % 2 === 0 ? 1 : 0;

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

  return <div style={{ opacity, ...style }}>{children}</div>;
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
    durationInFrames: 15,
  });

  const y = interpolate(frame, [startFrame, startFrame + 20], [20, 0], {
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
        <div style={{ fontFamily: FONT, fontSize: 14, color: C.textDim, marginLeft: 12 }}>
          {title}
        </div>
      </div>
      <div style={{ padding: 24, fontFamily: FONT, fontSize: 18, lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Scene 1: Intro (0-200 frames) ────────────────────────────────
const Intro: React.FC = () => {
  const frame = useCurrentFrame();

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
      }}
    >
      <SlideInText frame={frame} startFrame={10} direction="down" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 28,
            color: C.accent,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          TUTORIAL
        </div>
      </SlideInText>

      <SlideInText frame={frame} startFrame={35} direction="up" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 80,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          How This Video
          <br />
          <span style={{ color: C.primaryLight }}>Was Made</span>
        </div>
      </SlideInText>

      <FadeInText frame={frame} startFrame={70} duration={25}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 24,
            color: C.textDim,
            textAlign: "center",
          }}
        >
          Zero API cost. Zero subscriptions. Just code.
        </div>
      </FadeInText>

      <FadeInText frame={frame} startFrame={100} duration={25}>
        <div style={{ marginTop: 40, display: "flex", gap: 24, justifyContent: "center" }}>
          {["1920x1080", "60 FPS", "40 Seconds", "$0.00"].map((item, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "10px 20px",
                fontFamily: FONT,
                fontSize: 16,
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

// ─── Scene 2: bun init (200-500 frames) ───────────────────────────
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
        gap: 24,
      }}
    >
      <SlideInText frame={frame} startFrame={200} direction="left" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
            fontWeight: 700,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Create a new project
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 18,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          We use <span style={{ color: C.accent }}>bun</span> — the fast all-in-one JavaScript runtime.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={250}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bun init -y"
            frame={frame}
            startFrame={270}
            speed={3}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 12 }}>
          <FadeInText frame={frame} startFrame={310} duration={12}>
            <span> + .gitignore</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={325} duration={12}>
            <span> + index.ts</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={340} duration={12}>
            <span> + tsconfig.json</span>
          </FadeInText>
        </div>
        <FadeInText frame={frame} startFrame={360} duration={15}>
          <div style={{ color: C.success, marginTop: 12 }}> 6 packages installed [2.25s]</div>
        </FadeInText>
      </Terminal>
    </div>
  );
};

// ─── Scene 3: bun add (500-800 frames) ───────────────────────────
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
        gap: 24,
      }}
    >
      <SlideInText frame={frame} startFrame={500} direction="left" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
            fontWeight: 700,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Install Remotion
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 18,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          <span style={{ color: C.accent }}>Remotion</span> renders code to video using headless Chrome.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={550}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bun add remotion @remotion/cli react react-dom"
            frame={frame}
            startFrame={570}
            speed={4}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 12 }}>
          <FadeInText frame={frame} startFrame={640} duration={12}>
            <span>Resolving dependencies...</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={660} duration={12}>
            <span>Resolved, downloaded and extracted [885]</span>
          </FadeInText>
        </div>
        <div style={{ marginTop: 8 }}>
          <FadeInText frame={frame} startFrame={690} duration={12}>
            <span style={{ color: C.success }}>installed remotion@4.0.529</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={710} duration={12}>
            <span style={{ color: C.accent }}>241 packages installed [29.76s]</span>
          </FadeInText>
        </div>
      </Terminal>
    </div>
  );
};

// ─── Scene 4: Project Structure (800-1100 frames) ────────────────
const ProjectStructure: React.FC = () => {
  const frame = useCurrentFrame();

  const items = [
    { name: "src/", type: "dir", indent: 0, desc: "Source code" },
    { name: "index.ts", type: "file", indent: 1, desc: "Entry point" },
    { name: "Root.tsx", type: "file", indent: 1, desc: "Composition" },
    { name: "MyVideo.tsx", type: "file", indent: 1, desc: "Main video" },
    { name: "TutorialVideo.tsx", type: "file", indent: 1, desc: "This video" },
    { name: "out/", type: "dir", indent: 0, desc: "Output" },
    { name: "video.mp4", type: "file", indent: 1, desc: "Rendered" },
    { name: "package.json", type: "file", indent: 0, desc: "Dependencies" },
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
        gap: 24,
      }}
    >
      <SlideInText frame={frame} startFrame={800} direction="left" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
            fontWeight: 700,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Project structure
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 18,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          Each video is a <span style={{ color: C.accent }}>Composition</span> — a React component.
        </div>
      </SlideInText>

      <Terminal title="File Explorer" frame={frame} startFrame={850}>
        {items.map((item, i) => {
          const itemOpacity = spring({
            frame: frame - 870 - i * 8,
            fps: 60,
            config: { damping: 14 },
            durationInFrames: 12,
          });

          const itemX = interpolate(frame, [870 + i * 8, 882 + i * 8], [-15, 0], {
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
                padding: "3px 0",
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
                <span style={{ color: C.textDim, fontSize: 14, marginLeft: 12 }}>
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

// ─── Scene 5: Write Code (1100-1600 frames) ──────────────────────
const WriteCode: React.FC = () => {
  const frame = useCurrentFrame();

  const codeLines = [
    { text: "export const MyVideo: React.FC = () => {", color: "#a78bfa" },
    { text: "  const frame = useCurrentFrame();", color: "#22d3ee" },
    { text: "  const { fps } = useVideoConfig();", color: "#22d3ee" },
    { text: "", color: C.text },
    { text: "  const scale = spring({", color: "#fbbf24" },
    { text: "    frame, fps,", color: C.text },
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

  const visibleChars = interpolate(frame, [1150, 1400], [0, 500], {
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
        gap: 24,
      }}
    >
      <SlideInText frame={frame} startFrame={1100} direction="left" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
            fontWeight: 700,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Write the video code
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 18,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          Videos are <span style={{ color: C.accent }}>React components</span>. Use{" "}
          <span style={{ color: C.warning }}>spring()</span> for smooth animations.
        </div>
      </SlideInText>

      <Terminal title="MyVideo.tsx" frame={frame} startFrame={1150}>
        <div style={{ fontFamily: FONT, fontSize: 16, lineHeight: 1.8 }}>
          {renderedLines.map((line, i) => (
            <div key={line.key} style={{ display: "flex" }}>
              <span
                style={{
                  color: C.textDim,
                  width: 32,
                  textAlign: "right",
                  marginRight: 16,
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

// ─── Scene 6: Render Command (1600-2000 frames) ───────────────────
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
        gap: 24,
      }}
    >
      <SlideInText frame={frame} startFrame={1600} direction="left" distance={50}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
            fontWeight: 700,
            color: C.text,
            marginBottom: 12,
          }}
        >
          Render to MP4
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 18,
            color: C.textDim,
            lineHeight: 1.5,
            maxWidth: 480,
          }}
        >
          One command renders your composition to video with{" "}
          <span style={{ color: C.accent }}>headless Chrome</span> and{" "}
          <span style={{ color: C.accent }}>FFmpeg</span>.
        </div>
      </SlideInText>

      <Terminal title="Terminal — bash" frame={frame} startFrame={1650}>
        <div style={{ color: C.textDim }}>$</div>
        <div>
          <TypewriterText
            text="bunx remotion render src/index.ts MyVideo out/video.mp4"
            frame={frame}
            startFrame={1670}
            speed={4}
            color={C.success}
          />
        </div>
        <div style={{ color: C.textDim, marginTop: 16 }}>
          <FadeInText frame={frame} startFrame={1750} duration={12}>
            <span>Bundling 100%</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={1770} duration={12}>
            <span>Composition MyVideo</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={1790} duration={12}>
            <span>Codec h264</span>
          </FadeInText>
        </div>
        <div style={{ marginTop: 12 }}>
          <FadeInText frame={frame} startFrame={1820} duration={15}>
            <span style={{ color: C.accent }}>Rendered 450/450 frames</span>
          </FadeInText>
          <FadeInText frame={frame} startFrame={1850} duration={15}>
            <span style={{ color: C.success }}>Encoded 450/450</span>
          </FadeInText>
        </div>
        <FadeInText frame={frame} startFrame={1880} duration={15}>
          <div style={{ color: C.warning, marginTop: 12 }}> out/video.mp4 784.3 kB</div>
        </FadeInText>
      </Terminal>
    </div>
  );
};

// ─── Scene 7: Result (2000-2400 frames) ───────────────────────────
const Result: React.FC = () => {
  const frame = useCurrentFrame();

  const stats = [
    { label: "Resolution", value: "1920x1080" },
    { label: "Frame Rate", value: "60 fps" },
    { label: "Duration", value: "40 seconds" },
    { label: "File Size", value: "1.3 MB" },
    { label: "API Cost", value: "$0.00" },
    { label: "Subscriptions", value: "None" },
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
      <SlideInText frame={frame} startFrame={2000} direction="up" distance={30}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 20,
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
            fontSize: 44,
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
          gap: 16,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        {stats.map((stat, i) => {
          const statOpacity = spring({
            frame: frame - 2050 - i * 12,
            fps: 60,
            config: { damping: 12 },
            durationInFrames: 15,
          });

          const statY = interpolate(frame, [2050 + i * 12, 2065 + i * 12], [20, 0], {
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
                borderRadius: 14,
                padding: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 12,
                  color: C.textDim,
                  marginBottom: 6,
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
                  color: stat.value === "$0.00" ? C.success : C.text,
                }}
              >
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Scene 8: Outro (2400-2500 frames) ────────────────────────────
const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [2400, 2420], [0, 1], {
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
      <SlideInText frame={frame} startFrame={2420} direction="up" distance={30}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            color: C.accent,
            marginBottom: 24,
            textTransform: "uppercase",
            letterSpacing: 4,
          }}
        >
          You Can Do This Too
        </div>
      </SlideInText>

      <SlideInText frame={frame} startFrame={2440} direction="up" distance={30}>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 800,
            color: C.text,
            lineHeight: 1.2,
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          No expensive LLM.
          <br />
          No subscriptions.
          <br />
          <span style={{ color: C.success }}>Just code.</span>
        </div>
      </SlideInText>

      <FadeInText frame={frame} startFrame={2470} duration={20}>
        <div
          style={{
            display: "inline-block",
            background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
            borderRadius: 16,
            padding: "16px 40px",
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
      </FadeInText>
    </div>
  );
};

// ─── Main Composition (2500 frames = ~42 seconds at 60fps) ───────
export const TutorialVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const getSceneOpacity = (start: number, end: number) => {
    return interpolate(frame, [start, start + 12, end - 12, end], [0, 1, 1, 0], {
      extrapolateRight: "clamp",
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", background: C.bg }}>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(0, 200) }}>
        <Intro />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(200, 500) }}>
        <BunInit />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(500, 800) }}>
        <BunAdd />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(800, 1100) }}>
        <ProjectStructure />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(1100, 1600) }}>
        <WriteCode />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(1600, 2000) }}>
        <RenderCommand />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(2000, 2400) }}>
        <Result />
      </div>
      <div style={{ position: "absolute", width: "100%", height: "100%", opacity: getSceneOpacity(2400, 2500) }}>
        <Outro />
      </div>
    </div>
  );
};
