/**
 * Design tokens for the OpenCode install video.
 * Single source of truth — no magic numbers in scene components.
 */

export const COLOR = {
  bg: "#05060a",
  bgSoft: "#0b0d14",
  panel: "#0e1119",
  panelBorder: "#1e2330",

  fg: "#e9edf5",
  fgDim: "#9aa3b8",
  fgMuted: "#5d6577",

  accent: "#4af0c8",
  accentDim: "#1f8f78",
  gold: "#ffd166",
  violet: "#a78bfa",
  rose: "#fb7185",
  sky: "#60a5fa",
  lime: "#a3e635",
} as const;

export const FONT = {
  mono: '"JetBrains Mono", "Fira Code", "DejaVu Sans Mono", monospace',
  sans: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif',
} as const;

/** Remotion's documented house curve — the "premium smooth" default. */
export const EASE = {
  house: [0.16, 1, 0.3, 1] as const,
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Scene durations in frames @ 60fps. */
export const DUR = {
  title: 132, // 2.2s
  prereq: 132,
  install: 168,
  firstRun: 150,
  mcpConfig: 210,
  mcpTypes: 168,
  bunFrameworks: 180,
  render: 198,
  outro: 126,
} as const;

/** Syntax colours for the code/terminal blocks. */
export const SYNTAX = {
  prompt: COLOR.accent,
  cmd: COLOR.fg,
  flag: COLOR.gold,
  string: COLOR.lime,
  key: COLOR.sky,
  punct: COLOR.fgMuted,
  comment: COLOR.fgMuted,
  commentKey: COLOR.fgMuted,
  value: COLOR.gold,
  output: COLOR.fgDim,
  ok: COLOR.accent,
  warn: COLOR.gold,
  err: COLOR.rose,
} as const;