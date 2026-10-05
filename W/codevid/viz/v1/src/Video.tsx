import React from "react";
import { AbsoluteFill, Composition, Sequence } from "remotion";
import { DUR, FPS, HEIGHT, WIDTH } from "./tokens";
import {
  BunScene,
  FirstRunScene,
  InstallScene,
  McpConfigScene,
  McpTypesScene,
  OutroScene,
  PrereqScene,
  RenderScene,
  TitleScene,
} from "./scenes";
import { Progress } from "./components/Stage";

/** Scene order defines the running order and each scene's offset. */
const PLAN = [
  { id: "Title", label: "Title", duration: DUR.title, Scene: TitleScene },
  { id: "Prereq", label: "Prerequisites", duration: DUR.prereq, Scene: PrereqScene },
  { id: "Install", label: "Install", duration: DUR.install, Scene: InstallScene },
  { id: "FirstRun", label: "First run", duration: DUR.firstRun, Scene: FirstRunScene },
  { id: "McpConfig", label: "MCP config", duration: DUR.mcpConfig, Scene: McpConfigScene },
  { id: "McpTypes", label: "MCP servers", duration: DUR.mcpTypes, Scene: McpTypesScene },
  { id: "Bun", label: "Bun frameworks", duration: DUR.bunFrameworks, Scene: BunScene },
  { id: "Render", label: "Render", duration: DUR.render, Scene: RenderScene },
  { id: "Outro", label: "Outro", duration: DUR.outro, Scene: OutroScene },
] as const;

let acc = 0;
const SCHEDULE = PLAN.map((s) => {
  const from = acc;
  acc += s.duration;
  return { ...s, from, total: acc };
});

export const TOTAL = acc;

/**
 * Wraps a scene with its own progress rail. Built as a closure per scene so
 * the scene component never travels through `defaultProps` — Remotion
 * serialises props, and a React component in there arrives as `undefined`.
 */
const wrap = (Scene: React.FC, total: number): React.FC => {
  const Wrapped: React.FC = () => (
    <AbsoluteFill>
      <Scene />
      <Progress total={total} />
    </AbsoluteFill>
  );
  Wrapped.displayName = `Scene(${Scene.displayName ?? Scene.name})`;
  return Wrapped;
};

/** The full timeline used for the actual render. */
export const OpenCodeSetup: React.FC = () => (
  <>
    {SCHEDULE.map(({ id, label, Scene, from, duration }, i) => (
      <Sequence
        key={id}
        name={`${String(i + 1).padStart(2, "0")} · ${label}`}
        from={from}
        durationInFrames={duration}
        premountFor={FPS}
      >
        {(() => {
          const Wrapped = wrap(Scene, duration);
          return <Wrapped />;
        })()}
      </Sequence>
    ))}
  </>
);

/** Every scene registered standalone, for fast single-scene preview. */
export const SceneCompositions: React.FC = () => (
  <>
    {PLAN.map(({ id, Scene, duration }) => (
      <Composition
        key={id}
        id={id}
        component={wrap(Scene, duration)}
        durationInFrames={duration}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
    <Composition
      id="OpenCodeSetup"
      component={OpenCodeSetup}
      durationInFrames={TOTAL}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  </>
);

export { PLAN, SCHEDULE };