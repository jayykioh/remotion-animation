import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../director/schema";
import {FONT_FAMILY} from "./SceneFrame";

export const CaptionLayer: React.FC<{
  captions: RenderScene["captions"];
  theme: RenderPlan["theme"];
}> = ({captions, theme}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const active = captions.find((caption) => time >= caption.startSeconds && time < caption.endSeconds);
  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "7%",
        right: "7%",
        bottom: "6%",
        display: "flex",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 920,
          padding: "18px 26px",
          borderRadius: 16,
          background: "rgba(0,0,0,0.72)",
          border: `1px solid ${theme.accent}66`,
          color: theme.foreground,
          fontFamily: FONT_FAMILY,
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "center",
          boxShadow: "0 16px 60px rgba(0,0,0,0.32)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};
