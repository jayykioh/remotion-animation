import React from "react";
import type {RenderPlan, RenderScene} from "../../director/schema";
import {ChartScene} from "./scenes/ChartScene";
import {CustomMotionScene} from "./scenes/CustomMotionScene";
import {DiagramScene} from "./scenes/DiagramScene";
import {ImageScene} from "./scenes/ImageScene";
import {KineticTypographyScene} from "./scenes/KineticTypographyScene";
import {StoryIllustrationScene} from "./scenes/StoryIllustrationScene";

export const SceneRenderer: React.FC<{scene: RenderScene; theme: RenderPlan["theme"]}> = ({scene, theme}) => {
  if (scene.type === "chart") return <ChartScene scene={scene} theme={theme} />;
  if (scene.type === "diagram") return <DiagramScene scene={scene} theme={theme} />;
  if (scene.type === "image") return <ImageScene scene={scene} theme={theme} />;
  if (scene.type === "custom-motion") return <CustomMotionScene scene={scene} theme={theme} />;
  if (scene.type === "story-illustration") return <StoryIllustrationScene scene={scene} theme={theme} />;
  return <KineticTypographyScene scene={scene} theme={theme} />;
};
