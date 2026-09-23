import {z} from "zod";

export const SceneTypeSchema = z.enum([
  "kinetic-typography",
  "chart",
  "diagram",
  "image",
  "custom-motion",
]);

export type SceneType = z.infer<typeof SceneTypeSchema>;

export const ChartDatumSchema = z.object({
  label: z.string().min(1),
  value: z.number().finite(),
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
  chartData: z.array(ChartDatumSchema).max(8).optional(),
  imageUrl: z.string().url().optional(),
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
      stylePack: z.enum(["editorial-dark", "paper-collage", "cinematic", "clean-infographic"]),
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
});

export const RenderSceneSchema = DirectorSceneSchema.extend({
  durationSeconds: z.number().positive(),
  durationInFrames: z.number().int().positive(),
  audioSrc: z.string().optional(),
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
