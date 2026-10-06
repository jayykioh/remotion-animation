import {createOpenAI} from "@ai-sdk/openai";
import {generateObject} from "ai";
import {DirectorPlanSchema} from "./schema";
import type {DirectorInput, DirectorProvider} from "./types";
import {applyProductionProfile} from "./profiles";

const SYSTEM_PROMPT = `You are an expert Video Director and Visual Orchestrator for a high-end Remotion motion graphics pipeline.
Your goal is to transform a written narration script into a highly engaging, visually dynamic, and perfectly paced scene plan.

CRITICAL RULES:
1. NARRATION PRESERVATION: You MUST preserve the exact narration verbatim. Cover the entire script in chronological order without skipping words.
2. PACING & RHYTHM: Break the script into scenes that last between 3 to 10 seconds. Avoid monotonous pacing; mix short, punchy scenes for emphasis with slightly longer scenes for explanations.
3. VISUAL VARIETY: Do not use the same visual type consecutively unless deliberately building a sequence. Alternate visual types to keep viewer retention high.
4. NARRATIVE PROGRESSION: Treat scenes as one continuous story, not isolated slides. Escalate visual intensity toward the turn, carry recurring subjects or objects across adjacent scenes, and let the final scene resolve the opening visual idea.

VISUAL TYPE SELECTION:
- 'kinetic-typography': Use for powerful quotes, statistics, strong claims, or punchlines. Keep the text short and punchy.
- 'chart': Use STRICTLY when the narration mentions trends, percentages, comparisons, or specific data points.
- 'diagram': Use for explaining workflows, architectural concepts, relationships, cycles, or "how it works" beats.
- 'image': Use for grounding the story in reality (people, historical figures, specific locations, or tangible products). Describe the image clearly.
- 'custom-motion': Use for abstract concepts, emotional shifts, high-energy transitions, or thematic B-roll.
- 'story-illustration': Use for character-driven moments. You MUST provide an "illustration" object describing the atmosphere (e.g. rain, fog), environment (e.g. mountain, interior, city), and a list of elements using emojis (e.g. 👻, 🚛, 🏠) with their positions and animations.

VOICE & TONE ORCHESTRATION:
For every scene, specify a 'voiceDirection' (e.g., 'energetic', 'somber', 'urgent', 'mysterious', 'informative') that perfectly matches the visual beat.
Make sure the emotional tone of the voice matches the visual weight of the scene.

CONSTRAINTS:
- Prefer showing over telling (visual actions over large blocks of text).
- Make each visualIntent describe a visible action and its relationship to the previous scene.
- Use storyboard action and camera changes to match the sentence.
- Do NOT invent fake remote image URLs.
- Return ONLY the requested JSON structure. No explanations.`;

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
