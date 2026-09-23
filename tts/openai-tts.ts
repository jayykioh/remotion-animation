import {writeFile} from "node:fs/promises";
import type {TTSProvider, TTSRequest} from "./types";
import {getWavDuration} from "./wav";

export class OpenAITTSProvider implements TTSProvider {
  readonly name = "openai";

  async synthesize(request: TTSRequest) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required when TTS_PROVIDER=openai");

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: request.voice || process.env.OPENAI_TTS_VOICE || "cedar",
        input: request.text,
        instructions:
          process.env.OPENAI_TTS_INSTRUCTIONS ||
          "Speak clearly with an engaging documentary tone.",
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI TTS failed (${response.status}): ${detail.slice(0, 300)}`);
    }

    await writeFile(request.outputPath, new Uint8Array(await response.arrayBuffer()));
    return {
      provider: this.name,
      outputPath: request.outputPath,
      durationSeconds: await getWavDuration(request.outputPath),
    };
  }
}
