import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

export const CustomMotionScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = spring({fps, frame: frame - 6, config: {damping: 14, stiffness: 105}});

  return (
    <SceneFrame scene={scene} theme={theme}>
      {[0, 1, 2, 3, 4].map((index) => {
        const travel = interpolate(frame, [0, Math.max(1, scene.durationInFrames)], [-250 - index * 80, 1400 + index * 35], {extrapolateLeft: "extend", extrapolateRight: "extend"});
        return <div key={index} style={{position: "absolute", width: 120 + index * 34, height: 120 + index * 34, borderRadius: index % 2 ? 28 : "50%", border: `6px solid ${index === 2 ? theme.accent : theme.foreground}`, opacity: 0.12 + index * 0.06, left: `${8 + index * 15}%`, top: travel, transform: `rotate(${frame * (index + 1) * 0.6}deg)`}} />;
      })}
      <div style={{marginTop: "48%", position: "relative", zIndex: 2, transform: `scale(${0.75 + title * 0.25})`, opacity: title}}>
        <div style={{fontSize: 30, color: theme.accent, textTransform: "uppercase", letterSpacing: 6, fontWeight: 900}}>{scene.keywords.join(" / ")}</div>
        <div style={{fontSize: 94, lineHeight: 0.96, letterSpacing: -4, fontWeight: 900, marginTop: 28}}>{scene.headline}</div>
      </div>
    </SceneFrame>
  );
};
