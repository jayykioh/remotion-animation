import {createGoogleGenerativeAI} from "@ai-sdk/google";
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
- story-illustration for character-driven narrative beats that need a setting, focal object and physical action
For every scene, provide voiceDirection that matches its emotional context. For story-illustration scenes, provide a concrete storyboard with setting, focus, supporting objects, action, camera and lighting. Prefer visual actions over displaying narration as large text.
Keep scenes between roughly 2 and 12 seconds. Use no more scenes than needed. Do not invent remote image URLs. Return the requested JSON structure only.`;

export class GeminiDirector implements DirectorProvider {
  readonly name = "gemini";

  async createPlan(input: DirectorInput) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER=gemini");

    const google = createGoogleGenerativeAI({apiKey});
    const result = await generateObject({
      model: google(process.env.GEMINI_LLM_MODEL || "gemini-1.5-flash"),
      system: SYSTEM_PROMPT,
      prompt: `Source: ${input.sourceName}\nFormat: ${input.format}\nFPS: ${input.fps}\n\nSCRIPT\n${input.script}`,
      schema: DirectorPlanSchema,
    });
    return applyProductionProfile(DirectorPlanSchema.parse(result.object), input);
  }
}
