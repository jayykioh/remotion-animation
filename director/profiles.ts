import type {DirectorPlan, DirectorScene} from "./schema";
import type {DirectorInput} from "./types";

const THEMES = {
  "editorial-dark": {background: "#0B0D12", foreground: "#F6F2EA", accent: "#FF5C35", muted: "#8F96A3"},
  "paper-collage": {background: "#EDE4D3", foreground: "#171512", accent: "#D94A32", muted: "#746D62"},
  cinematic: {background: "#080B10", foreground: "#F1EEE7", accent: "#D9AA55", muted: "#7E8794"},
  "clean-infographic": {background: "#F5F7FA", foreground: "#14213D", accent: "#2563EB", muted: "#64748B"},
} as const;

const sceneTypeForProfile = (
  scene: DirectorScene,
  index: number,
  total: number,
  projectType: NonNullable<DirectorInput["projectType"]>,
): DirectorScene["type"] => {
  if (projectType === "fast-summary") return scene.type;
  if (scene.type === "chart") return "chart";
  if (projectType === "animated-story") {
    if (index === 0 || index === total - 1) return "custom-motion";
    return index % 2 === 0 ? "image" : "diagram";
  }
  if (projectType === "documentary") return index % 3 === 1 ? "diagram" : "image";
  if (projectType === "history-explainer") return index % 2 === 0 ? "image" : "diagram";
  return index % 3 === 2 ? "custom-motion" : "kinetic-typography";
};

export const applyProductionProfile = (plan: DirectorPlan, input: DirectorInput): DirectorPlan => {
  const projectType = input.projectType || "fast-summary";
  const stylePack = input.stylePack || "editorial-dark";
  const language = input.language || "en";
  return {
    ...plan,
    theme: THEMES[stylePack],
    production: {
      projectType,
      stylePack,
      language,
      voiceProvider: input.voiceProvider,
      voiceId: input.voiceId,
    },
    scenes: plan.scenes.map((scene, index) => ({
      ...scene,
      type: sceneTypeForProfile(scene, index, plan.scenes.length, projectType),
      visualIntent: `${scene.visualIntent}; follow the ${stylePack} visual language for a ${projectType} project`,
    })),
  };
};
