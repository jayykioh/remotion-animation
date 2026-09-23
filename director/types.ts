import type {DirectorPlan} from "./schema";

export interface DirectorInput {
  script: string;
  sourceName: string;
  fps: number;
  format: "9:16" | "16:9" | "1:1";
  projectType?: "fast-summary" | "animated-story" | "documentary" | "history-explainer";
  stylePack?: "editorial-dark" | "paper-collage" | "cinematic" | "storybook-noir" | "clean-infographic";
  language?: "vi" | "en";
  voiceProvider?: string;
  voiceId?: string;
}

export interface DirectorProvider {
  readonly name: string;
  createPlan(input: DirectorInput): Promise<DirectorPlan>;
}
