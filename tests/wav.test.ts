import assert from "node:assert/strict";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {getWavDuration, writeSilentWav} from "../tts/wav";

test("mock WAV duration can be measured", async () => {
  const directory = await mkdtemp(join(tmpdir(), "video-agent-"));
  const path = join(directory, "sample.wav");
  await writeSilentWav(path, 1.75);
  const duration = await getWavDuration(path);
  assert.ok(Math.abs(duration - 1.75) < 0.01);
});
