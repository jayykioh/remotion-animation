import type {DirectorPlan, DirectorScene} from "./schema";
import type {DirectorInput} from "./types";

const THEMES = {
  "editorial-dark": {background: "#0B0D12", foreground: "#F6F2EA", accent: "#FF5C35", muted: "#8F96A3"},
  "paper-collage": {background: "#EDE4D3", foreground: "#171512", accent: "#D94A32", muted: "#746D62"},
  cinematic: {background: "#080B10", foreground: "#F1EEE7", accent: "#D9AA55", muted: "#7E8794"},
  "storybook-noir": {background: "#090910", foreground: "#F4EFE6", accent: "#E9B85E", muted: "#77717E"},
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
  if (projectType === "animated-story") return "story-illustration";
  if (projectType === "documentary") return index % 3 === 1 ? "diagram" : "image";
  if (projectType === "history-explainer") return index % 2 === 0 ? "image" : "diagram";
  return index % 3 === 2 ? "custom-motion" : "kinetic-typography";
};

const storyboardFor = (scene: DirectorScene, index: number): NonNullable<DirectorScene["storyboard"]> => {
  const text = `${scene.narration} ${scene.visualIntent}`.toLowerCase();
  const storyObjects = [
    "mâm", "bát", "cháo", "hương", "cửa", "nhà", "đèn", "khói", "người", "phố",
    "tray", "bowl", "food", "incense", "door", "house", "light", "smoke", "person", "street",
  ].filter((object) => text.includes(object));
  const setting = /ngoài|vỉa hè|outside|exterior/u.test(text)
    ? "exterior"
    : /nhà|cửa|phòng|bếp|room|house|door|inside/u.test(text)
      ? "interior"
      : /thành phố|đường phố|city|street|building/u.test(text)
      ? "city"
      : /rừng|núi|sông|biển|forest|mountain|river|sea/u.test(text)
        ? "nature"
        : /năm \d{3,4}|lịch sử|archive|history/u.test(text)
          ? "archival"
          : "abstract";
  const objects = [...new Set([...storyObjects, ...scene.keywords])];
  return {
    setting,
    focus: objects[0] || scene.headline,
    supportingObjects: objects.slice(1, 5),
    action: /thay đổi|biến|transform|change/u.test(text) ? "transform" : index === 0 ? "reveal" : index % 2 ? "move" : "focus",
    camera: index % 3 === 0 ? "wide" : index % 3 === 1 ? "push-in" : "close-up",
    lighting: /đêm|tối|night|dark/u.test(text) ? "low-key" : index % 2 ? "spotlight" : "warm",
  };
};

const voiceDirectionFor = (scene: DirectorScene): NonNullable<DirectorScene["voiceDirection"]> => {
  const emotion = scene.style === "dramatic" ? "dramatic" : scene.style === "energetic" ? "urgent" : scene.style === "calm" ? "calm" : "reflective";
  const pace = scene.style === "energetic" ? "fast" : scene.style === "calm" || scene.style === "dramatic" ? "slow" : "medium";
  const energy = scene.style === "energetic" ? 0.82 : scene.style === "dramatic" ? 0.68 : 0.48;
  return {
    emotion,
    pace,
    energy,
    instructions: `Narrate in a ${emotion}, ${pace}-paced storytelling voice. Emphasize ${scene.keywords.slice(0, 2).join(" and ") || "the key moment"}.`,
  };
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
    scenes: plan.scenes.map((scene, index) => {
      const type = sceneTypeForProfile(scene, index, plan.scenes.length, projectType);
      return {
        ...scene,
        type,
        voiceDirection: scene.voiceDirection || voiceDirectionFor(scene),
        ...(type === "story-illustration" ? {storyboard: scene.storyboard || storyboardFor(scene, index)} : {}),
        visualIntent: `${scene.visualIntent}; follow the ${stylePack} visual language for a ${projectType} project`,
      };
    }),
  };
};
