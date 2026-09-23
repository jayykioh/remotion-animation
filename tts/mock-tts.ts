import type {TTSProvider, TTSRequest} from "./types";
import {writeSilentWav} from "./wav";

export class MockTTSProvider implements TTSProvider {
  readonly name = "mock";

  async synthesize(request: TTSRequest) {
    const wordCount = request.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 1;
    const durationSeconds = Math.max(1.2, wordCount / 2.6 + 0.45);
    await writeSilentWav(request.outputPath, durationSeconds);
    return {provider: this.name, outputPath: request.outputPath, durationSeconds};
  }
}
