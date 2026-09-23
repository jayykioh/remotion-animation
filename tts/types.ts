export interface TTSRequest {
  text: string;
  outputPath: string;
  voice?: string;
  language?: "vi" | "en";
  direction?: {
    emotion: "warm" | "calm" | "dramatic" | "mysterious" | "reflective" | "urgent";
    pace: "slow" | "medium" | "fast";
    energy: number;
    instructions: string;
  };
}

export interface TTSResult {
  provider: string;
  outputPath: string;
  durationSeconds: number;
  alignment?: Array<{
    text: string;
    startSeconds: number;
    endSeconds: number;
  }>;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(request: TTSRequest): Promise<TTSResult>;
}
