import {HeuristicDirector} from "./heuristic-director";
import {OpenAIDirector} from "./openai-director";
import type {DirectorProvider} from "./types";

export const createDirector = (name = process.env.LLM_PROVIDER || "heuristic"): DirectorProvider => {
  if (name === "heuristic") return new HeuristicDirector();
  if (name === "openai") return new OpenAIDirector();
  throw new Error(`Unknown LLM provider: ${name}. Use heuristic or openai.`);
};

export * from "./schema";
export * from "./types";
export * from "./profiles";
