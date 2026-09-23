import {writeFile} from "node:fs/promises";
import type {TTSProvider, TTSRequest} from "./types";
import {getWavDuration} from "./wav";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class FptTTSProvider implements TTSProvider {
  readonly name = "fpt";

  async synthesize(request: TTSRequest) {
    const apiKey = process.env.FPT_TTS_API_KEY;
    if (!apiKey) throw new Error("FPT_TTS_API_KEY is required when TTS_PROVIDER=fpt");
    const response = await fetch("https://api.fpt.ai/hmi/tts/v5", {
      method: "POST",
      headers: {
        api_key: apiKey,
        voice: request.voice || process.env.FPT_TTS_VOICE || "banmai",
        speed: process.env.FPT_TTS_SPEED || (request.direction?.pace === "slow" ? "-1" : request.direction?.pace === "fast" ? "1" : "0"),
        format: "wav",
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: request.text,
    });
    if (!response.ok) throw new Error(`FPT TTS failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    const payload = (await response.json()) as {error: number; async?: string; message?: string};
    if (payload.error !== 0 || !payload.async) throw new Error(payload.message || "FPT TTS did not return an audio URL");

    let audioBytes: Uint8Array | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = await fetch(payload.async);
      if (candidate.ok) {
        const bytes = new Uint8Array(await candidate.arrayBuffer());
        if (bytes.length > 44) {
          audioBytes = bytes;
          break;
        }
      }
      await wait(2000);
    }
    if (!audioBytes) throw new Error("FPT TTS audio was not ready after 60 seconds");
    await writeFile(request.outputPath, audioBytes);
    return {provider: this.name, outputPath: request.outputPath, durationSeconds: await getWavDuration(request.outputPath)};
  }
}
