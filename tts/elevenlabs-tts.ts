import type {TTSProvider, TTSRequest} from "./types";
import {getWavDuration, writePcm16Wav} from "./wav";

interface ElevenAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

const toWordAlignment = (alignment?: ElevenAlignment) => {
  if (!alignment) return undefined;
  const words: Array<{text: string; startSeconds: number; endSeconds: number}> = [];
  let text = "";
  let start = 0;
  let end = 0;
  alignment.characters.forEach((character, index) => {
    if (!text && character.trim()) start = alignment.character_start_times_seconds[index] ?? 0;
    if (/\s/u.test(character)) {
      if (text) words.push({text, startSeconds: start, endSeconds: end});
      text = "";
      return;
    }
    text += character;
    end = alignment.character_end_times_seconds[index] ?? end;
  });
  if (text) words.push({text, startSeconds: start, endSeconds: end});
  return words;
};

export class ElevenLabsTTSProvider implements TTSProvider {
  readonly name = "elevenlabs";

  async synthesize(request: TTSRequest) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = request.voice && request.voice !== "default" ? request.voice : process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required when TTS_PROVIDER=elevenlabs");
    if (!voiceId) throw new Error("ELEVENLABS_VOICE_ID is required, or choose a concrete ElevenLabs voice ID");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=pcm_24000`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json", "xi-api-key": apiKey},
        body: JSON.stringify({
          text: request.text,
          model_id: process.env.ELEVENLABS_MODEL || "eleven_v3",
          language_code: request.language || process.env.TTS_LANGUAGE || "vi",
        }),
      },
    );
    if (!response.ok) throw new Error(`ElevenLabs TTS failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
    const payload = (await response.json()) as {audio_base64: string; alignment?: ElevenAlignment; normalized_alignment?: ElevenAlignment};
    await writePcm16Wav(request.outputPath, new Uint8Array(Buffer.from(payload.audio_base64, "base64")));
    return {
      provider: this.name,
      outputPath: request.outputPath,
      durationSeconds: await getWavDuration(request.outputPath),
      alignment: toWordAlignment(payload.normalized_alignment || payload.alignment),
    };
  }
}
