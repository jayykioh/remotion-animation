import React from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import type {RenderPlan, RenderScene} from "../../director/schema";
import {FONT_FAMILY} from "./SceneFrame";

export const CaptionLayer: React.FC<{
  captions: RenderScene["captions"];
  theme: RenderPlan["theme"];
  projectType?: NonNullable<RenderPlan["production"]>["projectType"];
}> = ({captions, theme, projectType}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const active = captions.find((caption) => time >= caption.startSeconds && time < caption.endSeconds);
  if (!active) return null;
  const storyMode = projectType === "animated-story";

  return (
    <div
      style={{
        position: "absolute",
        left: "7%",
        right: "7%",
        bottom: storyMode ? "3.8%" : "6%",
        display: "flex",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: storyMode ? 980 : 920,
          padding: storyMode ? "38px 30px 22px" : "18px 26px",
          borderRadius: storyMode ? 0 : 16,
          background: storyMode ? "linear-gradient(180deg, transparent, rgba(5,5,9,0.88) 42%)" : "rgba(0,0,0,0.72)",
          border: storyMode ? "none" : `1px solid ${theme.accent}66`,
          color: theme.foreground,
          fontFamily: FONT_FAMILY,
          fontSize: storyMode ? 42 : 34,
          fontWeight: 700,
          lineHeight: 1.2,
          textAlign: "center",
          boxShadow: storyMode ? "none" : "0 16px 60px rgba(0,0,0,0.32)",
          textShadow: storyMode ? "0 3px 16px rgba(0,0,0,0.95)" : undefined,
        }}
      >
        {active.words?.length
          ? active.words.map((word, index) => {
              const isActive = time >= word.startSeconds && time < word.endSeconds;
              return <React.Fragment key={`${word.startSeconds}-${index}`}><span style={{color: isActive ? theme.accent : theme.foreground}}>{word.text}</span>{index < active.words!.length - 1 ? " " : ""}</React.Fragment>;
            })
          : active.text}
      </div>
    </div>
  );
};
