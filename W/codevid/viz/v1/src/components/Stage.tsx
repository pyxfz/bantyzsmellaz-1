import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR, FONT } from "../tokens";

const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);

/** Full-frame backdrop: dark gradient + slow-drifting accent glows. */
export const Stage: React.FC<{ readonly children: React.ReactNode }> = ({
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLOR.bg,
        fontFamily: FONT.sans,
        color: COLOR.fg,
        overflow: "hidden",
      }}
    >
      {/* Slow vertical drift so the frame is never fully static. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 50% 0%, #101827 0%, #05060a 62%)",
        }}
      />
      <Glow
        color={COLOR.accent}
        size={900}
        x={-260 + Math.sin(frame / (fps * 9)) * 70}
        y={-220 + Math.cos(frame / (fps * 11)) * 60}
        opacity={0.13}
      />
      <Glow
        color={COLOR.violet}
        size={760}
        x={1620 + Math.cos(frame / (fps * 12)) * 70}
        y={760 + Math.sin(frame / (fps * 10)) * 60}
        opacity={0.1}
      />
      <Grid />
      <Vignette />
      {children}
    </AbsoluteFill>
  );
};

const Glow: React.FC<{
  readonly color: string;
  readonly size: number;
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
}> = ({ color, size, x, y, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: size / 2,
      background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
      opacity,
      filter: "blur(30px)",
    }}
  />
);

/** Faint technical grid — reads as "engineering", not decoration. */
const Grid: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `linear-gradient(${COLOR.panelBorder} 1px, transparent 1px), linear-gradient(90deg, ${COLOR.panelBorder} 1px, transparent 1px)`,
      backgroundSize: "64px 64px",
      opacity: 0.24,
      maskImage:
        "radial-gradient(75% 65% at 50% 45%, black 25%, transparent 100%)",
    }}
  />
);

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      boxShadow: "inset 0 0 260px 60px rgba(0,0,0,0.72)",
    }}
  />
);

/**
 * Scene heading: an eyebrow label, a big title, and an optional lede.
 * Everything springs in on a shared clock so the block lands as one gesture.
 */
export const Heading: React.FC<{
  readonly eyebrow: string;
  readonly title: string;
  readonly lede?: string;
  readonly align?: "left" | "center";
  readonly accent?: string;
}> = ({ eyebrow, title, lede, align = "center", accent = COLOR.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (delay: number) =>
    spring({
      frame: frame - delay,
      fps,
      config: { damping: 200, mass: 0.7 },
      durationInFrames: Math.round(0.6 * fps),
    });

  const e = rise(0);
  const t = rise(4);
  const l = rise(9);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align,
        gap: 14,
      }}
    >
      <Eyebrow text={eyebrow} accent={accent} progress={e} />
      <div
        style={{
          fontSize: 62,
          fontWeight: 800,
          letterSpacing: -1.6,
          lineHeight: 1.04,
          opacity: interpolate(t, [0, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: `0px ${interpolate(t, [0, 1], [22, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: HOUSE,
          })}px`,
        }}
      >
        {title}
      </div>
      {lede ? (
        <div
          style={{
            fontSize: 25,
            color: COLOR.fgDim,
            maxWidth: 1080,
            lineHeight: 1.45,
            opacity: interpolate(l, [0, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `0px ${interpolate(l, [0, 1], [14, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: HOUSE,
            })}px`,
          }}
        >
          {lede}
        </div>
      ) : null}
    </div>
  );
};

const Eyebrow: React.FC<{
  readonly text: string;
  readonly accent: string;
  readonly progress: number;
}> = ({ text, accent, progress }) => {
  const w = interpolate(progress, [0, 1], [0, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: HOUSE,
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity: interpolate(progress, [0, 0.4], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    >
      <div
        style={{
          width: w,
          height: 2,
          backgroundColor: accent,
        }}
      />
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 19,
          letterSpacing: 3.4,
          color: accent,
          textTransform: "uppercase",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Small pill used for badges and callouts. */
export const Pill: React.FC<{
  readonly children: React.ReactNode;
  readonly color?: string;
  readonly delay?: number;
}> = ({ children, color = COLOR.accent, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.5 },
  });
  return (
    <div
      style={{
        padding: "9px 18px",
        borderRadius: 999,
        border: `1px solid ${color}55`,
        backgroundColor: `${color}14`,
        color,
        fontFamily: FONT.mono,
        fontSize: 20,
        opacity: interpolate(p, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${interpolate(p, [0, 1], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: HOUSE,
        })}px`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Progress rail across the bottom showing scene position.
 * A single continuous element — the motion carries the eye.
 */
export const Progress: React.FC<{ readonly total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, total], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 4,
        backgroundColor: COLOR.panelBorder,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${p * 100}%`,
          backgroundColor: COLOR.accent,
          boxShadow: `0 0 22px ${COLOR.accent}aa`,
        }}
      />
    </div>
  );
};