import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

export const ChartScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = scene.chartData?.length ? scene.chartData : [{label: "Signal", value: 100}];
  const max = Math.max(1, ...data.map((datum) => Math.abs(datum.value)));

  return (
    <SceneFrame scene={scene} theme={theme}>
      <div style={{marginTop: "16%", fontSize: 62, lineHeight: 1.05, letterSpacing: -2, fontWeight: 850}}>{scene.headline}</div>
      <div style={{height: "48%", display: "flex", alignItems: "flex-end", gap: 24, marginTop: "10%", borderBottom: `2px solid ${theme.muted}55`}}>
        {data.map((datum, index) => {
          const progress = spring({fps, frame: frame - index * 5, config: {damping: 18, stiffness: 90}});
          const height = Math.max(8, (Math.abs(datum.value) / max) * 100 * progress);
          return (
            <div key={`${datum.label}-${index}`} style={{height: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center"}}>
              <div style={{fontSize: 30, fontWeight: 800, marginBottom: 14, opacity: progress}}>{datum.value}</div>
              <div style={{width: "100%", maxWidth: 130, height: `${height}%`, minHeight: 8, background: index === data.length - 1 ? theme.accent : theme.foreground, borderRadius: "14px 14px 0 0"}} />
              <div style={{position: "absolute", marginTop: 28, transform: "translateY(56px)", color: theme.muted, fontSize: 20, textAlign: "center", maxWidth: 140}}>{datum.label}</div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
