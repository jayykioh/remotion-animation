import {writeFile} from "node:fs/promises";
import type {TTSProvider, TTSRequest} from "./types";
import {getWavDuration} from "./wav";

export class LocalHttpTTSProvider implements TTSProvider {
  readonly name = "local-http";

  async synthesize(request: TTSRequest) {
    const baseUrl = process.env.LOCAL_TTS_BASE_URL;
    if (!baseUrl) throw new Error("LOCAL_TTS_BASE_URL is required when TTS_PROVIDER=local-http");
    const endpoint = `${baseUrl.replace(/\/$/u, "")}/audio/speech`;
    const apiKey = process.env.LOCAL_TTS_API_KEY;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? {Authorization: `Bearer ${apiKey}`} : {}),
      },
      body: JSON.stringify({
        model: process.env.LOCAL_TTS_MODEL || "tts-1",
        voice: request.voice || process.env.LOCAL_TTS_VOICE || "nu-nhe-nhang",
        input: request.text,
        speed: request.direction?.pace === "slow" ? 0.9 : request.direction?.pace === "fast" ? 1.08 : 1,
        response_format: "wav",
      }),
      signal: AbortSignal.timeout(Number(process.env.LOCAL_TTS_TIMEOUT_MS || 120000)),
    });
    if (!response.ok) throw new Error(`Local TTS failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    await writeFile(request.outputPath, new Uint8Array(await response.arrayBuffer()));
    return {provider: this.name, outputPath: request.outputPath, durationSeconds: await getWavDuration(request.outputPath)};
  }
}
