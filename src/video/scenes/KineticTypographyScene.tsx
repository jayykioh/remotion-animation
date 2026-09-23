import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

export const KineticTypographyScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({fps, frame, config: {damping: 16, stiffness: 120}});
  const underline = interpolate(frame, [10, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneFrame scene={scene} theme={theme}>
      <div style={{marginTop: "24%", transform: `translateY(${(1 - entrance) * 90}px)`, opacity: entrance}}>
        <div style={{fontSize: 30, color: theme.accent, fontWeight: 800, letterSpacing: 5, textTransform: "uppercase"}}>
          {scene.keywords[0] || "Key idea"}
        </div>
        <div style={{fontSize: 102, lineHeight: 0.98, letterSpacing: -5, fontWeight: 900, marginTop: 28, textTransform: "uppercase"}}>
          {scene.headline}
        </div>
        <div style={{height: 10, width: `${underline * 100}%`, maxWidth: 600, backgroundColor: theme.accent, marginTop: 42}} />
      </div>
      <div style={{position: "absolute", right: "-18%", top: "54%", width: 520, height: 520, borderRadius: "50%", border: `2px solid ${theme.accent}55`, transform: `scale(${0.8 + entrance * 0.2})`}} />
    </SceneFrame>
  );
};
