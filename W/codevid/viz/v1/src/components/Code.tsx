import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLOR, FONT } from "../tokens";

const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);

/** Syntax colour roles, mapped to tokens once. */
export const ROLE = {
  key: COLOR.sky,
  str: COLOR.lime,
  punc: COLOR.fgMuted,
  flag: COLOR.gold,
  cmd: COLOR.fg,
  cm: COLOR.fgMuted,
  url: COLOR.violet,
  num: COLOR.gold,
  ok: COLOR.accent,
  fg: COLOR.fg,
  dim: COLOR.fgDim,
} as const;

export type Role = keyof typeof ROLE;

export type Frag = {
  readonly s: string;
  readonly r?: Role;
  readonly b?: boolean;
};

export type CodeLine = {
  /** A line is either one plain string, or a list of coloured fragments. */
  readonly f: readonly Frag[];
  /** Frames to wait before this line appears. */
  readonly delay?: number;
};

/** A single-colour line: `plainLine("text", "ok", delayFrames)`. */
export const plainLine = (s: string, r: Role = "fg", delay?: number): CodeLine => ({
  f: [{ s, r }],
  delay,
});

/** A single-colour line with an indent. */
export const ind = (s: string, r: Role = "fg", indent = 2): CodeLine => ({
  f: [{ s: " ".repeat(indent) + s, r }],
});

export const t = (s: string, r: Role = "fg"): Frag => ({ s, r });

/** Build a line from fragments. */
export const L = (frags: readonly Frag[], delay?: number): CodeLine => ({
  f: frags,
  delay,
});

/** Shorthand builders for the common shapes. */
export const key = (name: string, delay?: number): CodeLine =>
  L([t(`"${name}"`, "key"), t(": ", "punc")], delay);

export const kv = (
  name: string,
  value: string,
  vRole: Role = "str",
  delay?: number,
): CodeLine => L([t(`"${name}"`, "key"), t(": ", "punc"), t(`"${value}"`, vRole)], delay);

export const kvNum = (name: string, value: string, delay?: number): CodeLine =>
  L([t(`"${name}"`, "key"), t(": ", "punc"), t(value, "num")], delay);

export const kvArr = (name: string, items: readonly string[], delay?: number): CodeLine =>
  L(
    [
      t(`"${name}"`, "key"),
      t(": [", "punc"),
      ...items.flatMap((it, i) => [
        t(`"${it}"`, "str"),
        ...(i < items.length - 1 ? [t(", ", "punc")] : []),
      ]),
      t("]", "punc"),
    ],
    delay,
  );

export const cm = (s: string, delay?: number): CodeLine =>
  L([t("// ", "cm"), t(s, "cm")], delay);

/** An intentionally empty line — a visual pause in the code. */
export const gap = (delay?: number): CodeLine => L([], delay);

/**
 * Syntax-highlighted code panel. Lines reveal on the frame clock with a
 * gutter whose active-row marker tracks the newest revealed line.
 */
export const Code: React.FC<{
  readonly lines: readonly CodeLine[];
  readonly fontSize?: number;
  readonly width?: number;
  /** Frames to wait before the panel itself appears. */
  readonly from?: number;
  readonly fileName?: string;
  readonly gutter?: boolean;
  readonly padTop?: number;
}> = ({
  lines,
  fontSize = 25,
  width = 1180,
  from = 0,
  fileName,
  gutter = true,
  padTop = 22,
}) => {
  const delay = from;
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 200, mass: 0.6 },
    durationInFrames: Math.round(0.55 * fps),
  });

  // Resolve reveal timing for every line up front.
  // Each line's start is its own delay, resolved sequentially from the last.
  let cursor = 0;
  const timed = lines.map((l) => {
    cursor += l.delay ?? 5;
    return { l, start: cursor };
  });

  let lastVisible = -1;
  timed.forEach(({ l, start }, i) => {
    if (frame - start >= 0) lastVisible = i;
  });

  return (
    <div
      style={{
        width,
        backgroundColor: COLOR.panel,
        border: `1px solid ${COLOR.panelBorder}`,
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
        opacity: interpolate(enter, [0, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${interpolate(enter, [0, 1], [26, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: HOUSE,
        })}px`,
      }}
    >
      {fileName ? (
        <div
          style={{
            height: 40,
            backgroundColor: COLOR.bgSoft,
            borderBottom: `1px solid ${COLOR.panelBorder}`,
            display: "flex",
            alignItems: "center",
            paddingLeft: 16,
            fontFamily: FONT.mono,
            fontSize: 15,
            color: COLOR.fgMuted,
            gap: 9,
          }}
        >
          <span style={{ color: COLOR.rose }}>●</span>
          <span style={{ color: COLOR.gold }}>●</span>
          <span style={{ color: COLOR.accent }}>●</span>
          <span style={{ marginLeft: 10 }}>{fileName}</span>
        </div>
      ) : null}
      <div style={{ padding: `${padTop}px 24px 26px` }}>
        {timed.map(({ l, start }, i) => {
          const p = spring({
            frame: frame - start,
            fps,
            config: { damping: 200, mass: 0.5 },
            durationInFrames: Math.round(0.32 * fps),
          });
          const isActive = i === lastVisible;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                height: `${fontSize * 1.62}px`,
                opacity: interpolate(p, [0, 1], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                translate: `${interpolate(p, [0, 1], [18, 0], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: HOUSE,
                })}px 0px`,
              }}
            >
              {gutter ? (
                <div
                  style={{
                    width: 44,
                    textAlign: "right",
                    paddingRight: 18,
                    color: isActive ? COLOR.accent : COLOR.fgMuted,
                    opacity: isActive ? 0.95 : 0.4,
                    fontFamily: FONT.mono,
                    fontSize: fontSize * 0.82,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {i + 1}
                </div>
              ) : null}
              <span
                style={{
                  whiteSpace: "pre",
                  fontFamily: FONT.mono,
                  fontSize,
                }}
              >
                {l.f.length === 0
                  ? " "
                  : l.f.map((x, xi) => (
                      <span
                        key={xi}
                        style={{
                          color: ROLE[x.r ?? "fg"],
                          fontWeight: x.b ? 700 : 400,
                        }}
                      >
                        {x.s}
                      </span>
                    ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { HOUSE as HOUSE_EASE };