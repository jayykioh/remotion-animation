import {createOpenAI} from "@ai-sdk/openai";
import {generateObject} from "ai";
import {DirectorPlanSchema} from "./schema";
import type {DirectorInput, DirectorProvider} from "./types";
import {applyProductionProfile} from "./profiles";

const SYSTEM_PROMPT = `You are the director for a modular Remotion video pipeline.
Transform a finished narration script into a concise scene plan. Preserve the narration verbatim and cover all of it in order.
Choose the strongest visual type for each beat:
- kinetic-typography for memorable claims or quotes
- chart only when the narration contains meaningful quantities or comparisons
- diagram for processes, causes, relationships, or sequences
- image for people, places, products, or concrete historical moments
- custom-motion for abstract change, energy, contrast, or transitions
Keep scenes between roughly 2 and 12 seconds. Use no more scenes than needed. Do not invent remote image URLs. Return the requested JSON structure only.`;

export class OpenAIDirector implements DirectorProvider {
  readonly name = "openai";

  async createPlan(input: DirectorInput) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required when LLM_PROVIDER=openai");

    const openai = createOpenAI({apiKey});
    const result = await generateObject({
      model: openai(process.env.OPENAI_LLM_MODEL || "gpt-5.2"),
      system: SYSTEM_PROMPT,
      prompt: `Source: ${input.sourceName}\nFormat: ${input.format}\nFPS: ${input.fps}\n\nSCRIPT\n${input.script}`,
      schema: DirectorPlanSchema,
    });
    return applyProductionProfile(DirectorPlanSchema.parse(result.object), input);
  }
}
