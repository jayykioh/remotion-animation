import {MockTTSProvider} from "./mock-tts";
import {OpenAITTSProvider} from "./openai-tts";
import {SystemTTSProvider} from "./system-tts";
import {ElevenLabsTTSProvider} from "./elevenlabs-tts";
import {FptTTSProvider} from "./fpt-tts";
import {LocalHttpTTSProvider} from "./local-http-tts";
import type {TTSProvider, TTSRequest, TTSResult} from "./types";

class AutoTTSProvider implements TTSProvider {
  readonly name = "auto";
  private fallbackToMock = false;

  async synthesize(request: TTSRequest): Promise<TTSResult> {
    if (this.fallbackToMock) return new MockTTSProvider().synthesize(request);
    try {
      return await new SystemTTSProvider().synthesize(request);
    } catch (error) {
      console.warn(`  Local TTS unavailable; using silent mock audio (${error instanceof Error ? error.message : String(error)})`);
      this.fallbackToMock = true;
      return new MockTTSProvider().synthesize(request);
    }
  }
}

export const createTTSProvider = (name = process.env.TTS_PROVIDER || "auto"): TTSProvider => {
  if (name === "auto") return new AutoTTSProvider();
  if (name === "system") return new SystemTTSProvider();
  if (name === "openai") return new OpenAITTSProvider();
  if (name === "elevenlabs") return new ElevenLabsTTSProvider();
  if (name === "fpt") return new FptTTSProvider();
  if (name === "local-http") return new LocalHttpTTSProvider();
  if (name === "mock") return new MockTTSProvider();
  throw new Error(`Unknown TTS provider: ${name}. Use auto, system, openai, elevenlabs, fpt, local-http, or mock.`);
};

export * from "./types";
