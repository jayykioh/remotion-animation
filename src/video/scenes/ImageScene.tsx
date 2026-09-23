import React from "react";
import {Img, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../../director/schema";
import {SceneFrame} from "../SceneFrame";

export const ImageScene: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({fps, frame, config: {damping: 20, stiffness: 90}});
  const zoom = interpolate(frame, [0, Math.max(scene.durationInFrames - 1, 1)], [1.08, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});

  return (
    <SceneFrame scene={scene} theme={theme}>
      <div style={{position: "absolute", inset: "11% 7% 25%", borderRadius: 40, overflow: "hidden", background: `linear-gradient(145deg, ${theme.accent}, #222838 55%, ${theme.foreground})`, transform: `scale(${0.92 + enter * 0.08})`}}>
        {scene.imageUrl ? <Img src={scene.imageUrl} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`}} /> : (
          <div style={{width: "100%", height: "100%", position: "relative", transform: `scale(${zoom})`}}>
            <div style={{position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.16)", right: -120, top: -80}} />
            <div style={{position: "absolute", width: 280, height: 700, background: "rgba(0,0,0,0.2)", transform: "rotate(24deg)", left: 130, top: -100}} />
            <div style={{position: "absolute", left: 60, bottom: 60, right: 60, fontSize: 90, lineHeight: 0.94, fontWeight: 900, textTransform: "uppercase"}}>{scene.keywords[0] || scene.headline}</div>
          </div>
        )}
      </div>
      <div style={{position: "absolute", left: "7%", right: "7%", bottom: "15%", fontSize: 46, lineHeight: 1.05, fontWeight: 800, opacity: enter}}>{scene.headline}</div>
    </SceneFrame>
  );
};
