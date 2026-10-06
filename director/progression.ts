import type {DirectorScene} from "./schema";

const turnPattern = /\b(?:but|yet|instead|until|then|however|nhưng|thay vì|cho đến khi|rồi)\b/iu;
const resolutionPattern = /\b(?:lesson|therefore|finally|result|means|bài học|cuối cùng|kết quả|nghĩa là)\b/iu;

const sharedKeyword = (scene: DirectorScene, rootMotif: string, previous?: DirectorScene) => {
  if (!previous) return rootMotif;
  const previousKeys = new Set(previous.keywords.map((keyword) => keyword.toLocaleLowerCase()));
  return scene.keywords.find((keyword) => previousKeys.has(keyword.toLocaleLowerCase()))
    || scene.storyboard?.focus
    || rootMotif;
};

export const orchestrateNarrative = (scenes: DirectorScene[]): DirectorScene[] => {
  const rootMotif = scenes[0]?.storyboard?.focus || scenes[0]?.keywords[0] || scenes[0]?.headline || "story";
  return scenes.map((scene, index) => {
    const previous = scenes[index - 1];
    const text = `${scene.narration} ${scene.visualIntent}`;
    const progress = (index + 1) / scenes.length;
    const role: NonNullable<DirectorScene["beat"]>["role"] = index === 0
      ? "hook"
      : index === scenes.length - 1 || resolutionPattern.test(text)
        ? "resolution"
        : scene.type === "chart" || /\d/u.test(text)
          ? "evidence"
          : turnPattern.test(text)
            ? "turn"
            : progress < 0.45
              ? "context"
              : "escalation";
    const punctuationLift = /[!?]/u.test(scene.narration) ? 0.1 : 0;
    const roleEnergy = role === "hook" ? 0.72 : role === "turn" ? 0.82 : role === "resolution" ? 0.58 : 0.5;
    const voiceEnergy = scene.voiceDirection?.energy ?? 0.5;
    const intensity = Math.min(1, Math.max(0.2, roleEnergy * 0.62 + voiceEnergy * 0.38 + punctuationLift));
    const continuityKey = sharedKeyword(scene, rootMotif, previous);
    const hasSharedMotif = Boolean(previous && previous.keywords.some((keyword) =>
      scene.keywords.some((current) => current.toLocaleLowerCase() === keyword.toLocaleLowerCase()),
    ));
    const transition: NonNullable<DirectorScene["beat"]>["transition"] = index === 0
      ? "cut"
      : hasSharedMotif
        ? "match-cut"
        : role === "turn"
          ? "push"
          : scene.type === "chart" || scene.type === "diagram"
            ? "wipe"
            : intensity < 0.58
              ? "dissolve"
              : "push";

    return {
      ...scene,
      beat: {
        role,
        intensity: Number(intensity.toFixed(2)),
        progress: Number(progress.toFixed(3)),
        emphasis: scene.keywords.slice(0, 3),
        continuityKey,
        transition,
      },
    };
  });
};
