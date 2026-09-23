import React from "react";
import { Composition } from "remotion";
import { DynamicComp } from "./DynamicComp";
import {getDimensions} from "../../director/schema";
import {defaultPlan} from "../video/default-plan";
import {VideoAgent, VideoAgentPropsSchema} from "../video/VideoAgent";
import type {VideoAgentProps} from "../video/VideoAgent";

const defaultCode = `import { AbsoluteFill } from "remotion";
export const MyAnimation = () => <AbsoluteFill style={{ backgroundColor: "#000" }} />;`;

export const RemotionRoot: React.FC = () => {
  const dimensions = getDimensions(defaultPlan.format);
  return (
    <>
      <Composition<typeof VideoAgentPropsSchema, VideoAgentProps>
        id="VideoAgent"
        component={VideoAgent}
        schema={VideoAgentPropsSchema}
        durationInFrames={defaultPlan.totalDurationInFrames}
        fps={defaultPlan.fps}
        width={dimensions.width}
        height={dimensions.height}
        defaultProps={{plan: defaultPlan}}
        calculateMetadata={({props}) => {
          const nextDimensions = getDimensions(props.plan.format);
          return {
            durationInFrames: props.plan.totalDurationInFrames,
            fps: props.plan.fps,
            width: nextDimensions.width,
            height: nextDimensions.height,
          };
        }}
      />
      <Composition
        id="DynamicComp"
        component={DynamicComp}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ code: defaultCode }}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.durationInFrames as number,
          fps: props.fps as number,
        })}
      />
    </>
  );
};
