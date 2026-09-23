import type {RenderPlan} from "../../director/schema";

export const defaultPlan: RenderPlan = {
  version: 1,
  title: "Video Agent",
  format: "9:16",
  fps: 30,
  theme: {background: "#0B0D12", foreground: "#F6F2EA", accent: "#FF5C35", muted: "#8F96A3"},
  ttsProvider: "mock",
  totalDurationInFrames: 150,
  scenes: [
    {
      id: "scene-01",
      narration: "Turn a script into a finished motion story.",
      headline: "SCRIPT · MOTION · STORY",
      type: "kinetic-typography",
      visualIntent: "Introduce the pipeline",
      keywords: ["Script", "Motion", "Story"],
      style: "dramatic",
      estimatedDurationSeconds: 5,
      durationSeconds: 5,
      durationInFrames: 150,
      captions: [{text: "Turn a script into a finished motion story.", startSeconds: 0, endSeconds: 4.8}],
    },
  ],
};
