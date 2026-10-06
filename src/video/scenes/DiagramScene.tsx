import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

export const DiagramScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const groupedKeywords = scene.keywords.reduce<string[]>((groups, keyword) => {
    const previous = groups.at(-1);
    if (previous && /^\p{Lu}[\p{L}\p{N}-]*$/u.test(previous) && /^\p{Lu}[\p{L}\p{N}-]*$/u.test(keyword)) {
      groups[groups.length - 1] = `${previous} ${keyword}`;
    } else {
      groups.push(keyword);
    }
    return groups;
  }, []);
  const nodes = (groupedKeywords.length >= 3 ? groupedKeywords : ["Input", ...groupedKeywords, "Outcome"]).slice(0, 4);
  const lineProgress = interpolate(frame, [8, 42], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <SceneFrame scene={scene} theme={theme}>
      <div style={{marginTop: "16%", fontSize: 60, fontWeight: 850, letterSpacing: -2}}>{scene.headline}</div>
      <div style={{position: "relative", marginTop: "15%", display: "flex", flexDirection: "column", gap: 40}}>
        <div style={{position: "absolute", top: 68, bottom: 68, left: 47, width: 5, background: theme.muted, transformOrigin: "top", transform: `scaleY(${lineProgress})`}} />
        {nodes.map((node, index) => {
          const enter = spring({fps, frame: frame - index * 8, config: {damping: 18, stiffness: 110}});
          return (
            <div key={`${node}-${index}`} style={{display: "flex", alignItems: "center", gap: 28, opacity: enter, transform: `translateX(${(1 - enter) * 70}px)`}}>
              <div style={{width: 100, height: 100, flexShrink: 0, borderRadius: 28, backgroundColor: index === nodes.length - 1 ? theme.accent : theme.foreground, color: theme.background, display: "grid", placeItems: "center", fontSize: 32, fontWeight: 900, zIndex: 2}}>{index + 1}</div>
              <div style={{fontSize: 44, fontWeight: 800, textTransform: "uppercase"}}>{node}</div>
            </div>
          );
        })}
      </div>
    </SceneFrame>
  );
};
