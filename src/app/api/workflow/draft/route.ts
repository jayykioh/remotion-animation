import {createDirector} from "../../../../../director";
import {z} from "zod";

export const runtime = "nodejs";

const RequestSchema = z.object({
  title: z.string().max(120),
  script: z.string().min(20).max(30000),
  projectType: z.enum(["fast-summary", "animated-story", "documentary", "history-explainer"]),
  stylePack: z.enum(["editorial-dark", "paper-collage", "cinematic", "storybook-noir", "clean-infographic"]),
  format: z.enum(["9:16", "16:9", "1:1"]),
  language: z.enum(["vi", "en"]),
  llmProvider: z.enum(["heuristic", "openai"]),
  voiceProvider: z.string(),
  voiceId: z.string(),
});

export async function POST(request: Request) {
  try {
    const input = RequestSchema.parse(await request.json());
    const director = createDirector(input.llmProvider);
    const plan = await director.createPlan({
      script: input.script,
      sourceName: `${input.title || "untitled"}.md`,
      fps: 30,
      format: input.format,
      projectType: input.projectType,
      stylePack: input.stylePack,
      language: input.language,
      voiceProvider: input.voiceProvider,
      voiceId: input.voiceId,
    });
    return Response.json({plan, director: director.name});
  } catch (error) {
    return Response.json(
      {error: error instanceof Error ? error.message : "Could not create the draft"},
      {status: 400},
    );
  }
}
