import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import type {RenderPlan} from "../../director/schema";
import {RenderPlanSchema} from "../../director/schema";
import {z} from "zod";
import {CaptionLayer} from "./CaptionLayer";
import {SceneRenderer} from "./SceneRenderer";

export interface VideoAgentProps {
  [key: string]: unknown;
  plan: RenderPlan;
}

export const VideoAgentPropsSchema = z.object({plan: RenderPlanSchema});

export const VideoAgent: React.FC<VideoAgentProps> = ({plan}) => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: plan.theme.background}}>
      {plan.scenes.map((scene) => {
        const start = from;
        from += scene.durationInFrames;
        return (
          <Sequence key={scene.id} from={start} durationInFrames={scene.durationInFrames} premountFor={plan.fps}>
            <SceneRenderer scene={scene} theme={plan.theme} />
            {scene.audioSrc ? <Audio src={staticFile(scene.audioSrc)} /> : null}
            <CaptionLayer captions={scene.captions} theme={plan.theme} projectType={plan.production?.projectType} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
