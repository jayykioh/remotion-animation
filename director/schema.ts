import {z} from "zod";

export const SceneTypeSchema = z.enum([
  "kinetic-typography",
  "chart",
  "diagram",
  "image",
  "custom-motion",
  "story-illustration",
]);

export type SceneType = z.infer<typeof SceneTypeSchema>;

export const ChartDatumSchema = z.object({
  label: z.string().min(1),
  value: z.number().finite(),
});

export const NarrativeBeatSchema = z.object({
  role: z.enum(["hook", "context", "escalation", "evidence", "turn", "resolution"]),
  intensity: z.number().min(0).max(1),
  progress: z.number().min(0).max(1),
  emphasis: z.array(z.string().min(1)).max(3),
  continuityKey: z.string().min(1),
  transition: z.enum(["cut", "dissolve", "push", "wipe", "match-cut"]),
});

export const DirectorSceneSchema = z.object({
  id: z.string().min(1),
  narration: z.string().min(1),
  headline: z.string().min(1),
  type: SceneTypeSchema,
  visualIntent: z.string().min(1),
  keywords: z.array(z.string()).min(1).max(6),
  style: z.enum(["dramatic", "editorial", "energetic", "calm", "technical"]),
  estimatedDurationSeconds: z.number().min(1).max(30),
  beat: NarrativeBeatSchema.optional(),
  chartData: z.array(ChartDatumSchema).max(8).optional(),
  imageUrl: z.string().url().optional(),
  voiceDirection: z
    .object({
      emotion: z.enum(["warm", "calm", "dramatic", "mysterious", "reflective", "urgent"]),
      pace: z.enum(["slow", "medium", "fast"]),
      energy: z.number().min(0).max(1),
      instructions: z.string().min(1),
    })
    .optional(),
  storyboard: z
    .object({
      setting: z.enum(["interior", "exterior", "city", "nature", "abstract", "archival"]),
      focus: z.string().min(1),
      supportingObjects: z.array(z.string()).max(5),
      action: z.enum(["reveal", "enter", "move", "transform", "compare", "focus"]),
      camera: z.enum(["wide", "medium", "close-up", "push-in", "pan"]),
      lighting: z.enum(["low-key", "warm", "daylight", "spotlight"]),
    })
    .optional(),
  illustration: z.object({
    atmosphere: z.array(z.enum(["rain", "fog", "snow", "dust", "none"])),
    environment: z.enum(["mountain", "interior", "city", "abstract"]),
    elements: z.array(z.object({
      emoji: z.string(),
      size: z.number(),
      x: z.number(),
      y: z.number(),
      animation: z.enum(["none", "float", "sweep", "pulse"]),
      triggerWord: z.string().optional()
    }))
  }).optional()
});

export const DirectorPlanSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1),
  format: z.enum(["9:16", "16:9", "1:1"]),
  fps: z.number().int().min(24).max(60),
  theme: z.object({
    background: z.string(),
    foreground: z.string(),
    accent: z.string(),
    muted: z.string(),
  }),
  production: z
    .object({
      projectType: z.enum(["fast-summary", "animated-story", "documentary", "history-explainer"]),
      stylePack: z.enum(["editorial-dark", "paper-collage", "cinematic", "storybook-noir", "clean-infographic"]),
      language: z.enum(["vi", "en"]),
      voiceProvider: z.string().optional(),
      voiceId: z.string().optional(),
    })
    .optional(),
  scenes: z.array(DirectorSceneSchema).min(1).max(40),
});

export type DirectorPlan = z.infer<typeof DirectorPlanSchema>;
export type DirectorScene = z.infer<typeof DirectorSceneSchema>;

export const CaptionSchema = z.object({
  text: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().positive(),
  words: z
    .array(
      z.object({
        text: z.string(),
        startSeconds: z.number().min(0),
        endSeconds: z.number().positive(),
      }),
    )
    .optional(),
});

export const RenderSceneSchema = DirectorSceneSchema.extend({
  durationSeconds: z.number().positive(),
  durationInFrames: z.number().int().positive(),
  audioSrc: z.string().optional(),
  timing: z
    .object({
      leadInSeconds: z.number().min(0).max(2),
      narrationSeconds: z.number().positive(),
      tailSeconds: z.number().min(0).max(2),
    })
    .optional(),
  captions: z.array(CaptionSchema),
});

export const RenderPlanSchema = DirectorPlanSchema.omit({scenes: true}).extend({
  scenes: z.array(RenderSceneSchema).min(1),
  totalDurationInFrames: z.number().int().positive(),
  ttsProvider: z.string(),
});

export type RenderPlan = z.infer<typeof RenderPlanSchema>;
export type RenderScene = z.infer<typeof RenderSceneSchema>;

export const getDimensions = (format: DirectorPlan["format"]) => {
  if (format === "16:9") return {width: 1920, height: 1080};
  if (format === "1:1") return {width: 1080, height: 1080};
  return {width: 1080, height: 1920};
};
