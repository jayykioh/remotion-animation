import type {CSSProperties, ReactNode} from "react";
import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../director/schema";

export const FONT_FAMILY = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export const SceneFrame: React.FC<{
  scene: RenderScene;
  theme: RenderPlan["theme"];
  children: ReactNode;
  style?: CSSProperties;
  hideChrome?: boolean;
}> = ({scene, theme, children, style, hideChrome = false}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const legacyEdgeOpacity = interpolate(
    frame,
    [0, 8, Math.max(9, durationInFrames - 8), durationInFrames - 1],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        color: theme.foreground,
        fontFamily: FONT_FAMILY,
        padding: "7%",
        overflow: "hidden",
        opacity: scene.beat ? 1 : legacyEdgeOpacity,
        ...style,
      }}
    >
      {!hideChrome && !scene.beat && <div
        style={{
          position: "absolute",
          top: "4.2%",
          left: "7%",
          right: "7%",
          display: "flex",
          justifyContent: "space-between",
          color: theme.muted,
          fontSize: 20,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        <span>{scene.type.replace(/-/gu, " ")}</span>
        <span>{scene.id}</span>
      </div>}
      {children}
    </AbsoluteFill>
  );
};
