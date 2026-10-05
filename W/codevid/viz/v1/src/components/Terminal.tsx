import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR, FONT, SYNTAX } from "../tokens";

export type Token = {
  readonly text: string;
  readonly color?: string;
  readonly bold?: boolean;
};

export type Line = {
  readonly tokens: readonly Token[];
  /** Frames after the previous line appears before this one starts. */
  readonly delay?: number;
  /** Per-character reveal speed in frames. 0 = instant. */
  readonly cps?: number;
  readonly dim?: boolean;
};

const plain = (s: string): Token[] => [{ text: s }];

export const line = (s: string, color?: string, delay?: number): Line => ({
  tokens: color ? [{ text: s, color }] : plain(s),
  delay,
});

/** A `$ command` line with the prompt coloured separately. */
export const cmd = (
  s: string,
  o: { delay?: number; cps?: number; prompt?: string } = {}
): Line => ({
  tokens: [
    { text: o.prompt ?? "$ ", color: SYNTAX.prompt, bold: true },
    { text: s, color: SYNTAX.cmd },
  ],
  delay: o.delay,
  // Frames per character. ~0.6 reads as brisk but still legible at 60fps.
  cps: o.cps ?? 0.6,
});

/** Dim / indented output line. */
export const out = (s: string, o: { delay?: number; color?: string } = {}): Line => ({
  tokens: [{ text: s, color: o.color ?? SYNTAX.output }],
  delay: o.delay,
  dim: true,
});

export const blank = (delay?: number): Line => ({ tokens: [], delay });

/** Blank line plus a comment. */
export const comment = (s: string, delay?: number): Line => ({
  tokens: [
    { text: "// ", color: SYNTAX.commentKey },
    { text: s, color: SYNTAX.comment },
  ],
  delay,
});

const CHAR_W = 0.6025; // JetBrains Mono advance width ratio
const CHAR_H = 1.32;

/**
 * A macOS-style terminal window. Lines appear progressively, character by
 * character, driven purely by the current frame — never by wall-clock timers.
 */
export const Terminal: React.FC<{
  readonly lines: readonly Line[];
  readonly from?: number;
  readonly fontSize?: number;
  readonly width?: number;
  readonly title?: string;
  readonly padding?: number;
}> = ({
  lines,
  from = 0,
  fontSize = 26,
  width = 1520,
  title = "bash",
  padding = 34,
}) => {
  const frame = useCurrentFrame() - from;
  const { fps } = useVideoConfig();

  // Staggered entrance: each line slides up as it is revealed.
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.6 },
    durationInFrames: Math.round(0.5 * fps),
  });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div
        style={{
          width,
          backgroundColor: COLOR.panel,
          border: `1px solid ${COLOR.panelBorder}`,
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02)`,
          opacity: interpolate(entrance, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0px ${interpolate(entrance, [0, 1], [26, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...([0.16, 1, 0.3, 1] as [number, number, number, number])),
          })}px`,
          scale: interpolate(entrance, [0, 1], [0.985, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...([0.16, 1, 0.3, 1] as [number, number, number, number])),
          }),
        }}
      >
        {/* Title bar with the three traffic lights */}
        <div
          style={{
            height: 42,
            backgroundColor: COLOR.bgSoft,
            borderBottom: `1px solid ${COLOR.panelBorder}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            gap: 8,
            flexDirection: "row",
          }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div
              key={c}
              style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c }}
            />
          ))}
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: COLOR.fgMuted,
              fontFamily: FONT.mono,
              fontSize: 14,
              marginRight: 52,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ padding, fontFamily: FONT.mono, fontSize }}>
          <TerminalBody lines={lines} fontSize={fontSize} />
        </div>
      </div>
    </div>
  );
};

const TerminalBody: React.FC<{
  readonly lines: readonly Line[];
  readonly fontSize: number;
}> = ({ lines, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pass 1 — resolve when each line starts and finishes typing.
  let cursorFrame = 0;
  const timing = lines.map((l) => {
    cursorFrame += l.delay ?? 10;
    const start = cursorFrame;
    const full = l.tokens.reduce((a, t) => a + t.text.length, 0);
    const cps = l.cps ?? 0;
    const revealFrames = cps > 0 ? full * cps : 0;
    cursorFrame += revealFrames;
    return { l, start, cps, revealFrames, end: start + revealFrames };
  });

  // Only the newest line that is mid-reveal owns the caret, so the terminal
  // never shows two blinking cursors at once.
  let caretIndex = -1;
  for (let i = timing.length - 1; i >= 0; i--) {
    const { start, cps, end } = timing[i];
    if (cps > 0 && frame > start && frame < end) {
      caretIndex = i;
      break;
    }
  }

  const rows: React.ReactNode[] = [];

  for (let i = 0; i < timing.length; i++) {
    const { l, start, cps, revealFrames } = timing[i];

    const age = frame - start;
    const isDone = age >= revealFrames;
    const owns = i === caretIndex;
    // A line with no typing speed is treated as an instant flash-in.
    const showCaret = owns || (cps === 0 && age >= 0 && age < 4);

    // Line entrance — a short, tight spring.
    const pop = spring({
      frame: age,
      fps,
      config: { damping: 200, mass: 0.5 },
      durationInFrames: Math.round(0.35 * fps),
    });

    // Reserve the row height even before the line is revealed, so the panel
    // never reflows while typing.
    const rowH = `${fontSize * ROW_H}px`;

    if (age < -1) {
      rows.push(<div key={i} style={{ height: rowH }} />);
      continue;
    }

    const chars =
      cps > 0
        ? isDone
          ? Infinity
          : Math.max(0, age / cps)
        : Infinity;

    rows.push(
      <div
        key={i}
        style={{
          height: rowH,
          opacity: interpolate(pop, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0px ${interpolate(pop, [0, 1], [8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })}px`,
          display: "flex",
          alignItems: "center",
          whiteSpace: "pre",
        }}
      >
        <span style={{ opacity: l.dim ? 0.62 : 1 }}>
          {l.tokens.map((t, ti) => (
            <TokenSpan key={ti} token={t} chars={chars} />
          ))}
        </span>
        {/* The caret sits only on the line currently being typed. */}
        <Caret visible={showCaret} />
      </div>,
    );
  }

  return <>{rows}</>;
};

/** Every row reserves its height up front so the panel never grows mid-type. */
const ROW_H = 1.62;

const TokenSpan: React.FC<{ readonly token: Token; readonly chars: number }> = ({
  token,
  chars,
}) => {
  if (chars === Infinity) {
    return (
      <span
        style={{
          color: token.color ?? "#e9edf5",
          fontWeight: token.bold ? 700 : 400,
        }}
      >
        {token.text}
      </span>
    );
  }
  return (
    <span
      style={{
        color: token.color ?? "#e9edf5",
        fontWeight: token.bold ? 700 : 400,
      }}
    >
      {token.text.slice(0, Math.max(0, Math.floor(chars)))}
    </span>
  );
};

const Caret: React.FC<{ readonly visible: boolean }> = ({ visible }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const blink = frame % Math.round(0.5 * fps) < Math.round(0.28 * fps);
  return (
    <span
      style={{
        display: "inline-block",
        width: 9,
        height: "1.05em",
        backgroundColor: COLOR.accent,
        marginLeft: 3,
        translate: "0px 0.18em",
        opacity: visible && blink ? 0.9 : 0,
      }}
    />
  );
};

export { CHAR_W, CHAR_H };