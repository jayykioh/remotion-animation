import type {ReactNode} from "react";
import React from "react";
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../director/schema";

export const SceneTransition: React.FC<{
  scene: RenderScene;
  theme: RenderPlan["theme"];
  children: ReactNode;
}> = ({scene, theme, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const transition = scene.beat?.transition ?? "dissolve";
  const entranceFrames = Math.max(8, Math.round(fps * (transition === "dissolve" ? 0.42 : 0.3)));
  const progress = interpolate(frame, [0, entranceFrames], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = transition === "cut" ? 1 : interpolate(progress, [0, 1], [0.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = transition === "push" ? interpolate(progress, [0, 1], [110, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) : 0;
  const scale = transition === "match-cut" ? interpolate(progress, [0, 1], [1.08, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) : 1;
  const wipe = transition === "wipe" ? interpolate(progress, [0, 1], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) : 100;

  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", backgroundColor: theme.background}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          translate: `${translateX}px 0`,
          scale,
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </div>
      {transition !== "cut" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `linear-gradient(105deg, transparent 28%, ${theme.accent}38 50%, transparent 72%)`,
            opacity: interpolate(progress, [0, 0.42, 1], [0, (scene.beat?.intensity ?? 0.5) * 0.38, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            translate: `${interpolate(progress, [0, 1], [-55, 55], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}% 0`,
          }}
        />
      )}
    </div>
  );
};
