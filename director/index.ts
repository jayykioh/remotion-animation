import {HeuristicDirector} from "./heuristic-director";
import {OpenAIDirector} from "./openai-director";
import {GeminiDirector} from "./gemini-director";
import type {DirectorProvider} from "./types";

export const createDirector = (name = process.env.LLM_PROVIDER || "heuristic"): DirectorProvider => {
  if (name === "heuristic") return new HeuristicDirector();
  if (name === "openai") return new OpenAIDirector();
  if (name === "gemini") return new GeminiDirector();
  throw new Error(`Unknown LLM provider: ${name}. Use heuristic, openai, or gemini.`);
};

export * from "./schema";
export * from "./types";
export * from "./structured-script";
export * from "./profiles";
export * from "./progression";
