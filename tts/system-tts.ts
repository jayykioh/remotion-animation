import {spawn} from "node:child_process";
import {unlink, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {basename, dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import type {TTSProvider, TTSRequest} from "./types";
import {getWavDuration} from "./wav";

const run = (command: string, args: string[]) =>
  new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {stdio: ["ignore", "pipe", "pipe"], shell: false});
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited with ${code}: ${stderr.trim()}`));
    });
  });

export class SystemTTSProvider implements TTSProvider {
  readonly name = "system";

  async synthesize(request: TTSRequest) {
    if (process.platform === "win32") {
      const textPath = join(tmpdir(), `${basename(request.outputPath)}-${process.pid}.txt`);
      await writeFile(textPath, request.text, "utf8");
      const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), "system-tts.ps1");
      const shell = process.env.ComSpec?.toLowerCase().includes("cmd")
        ? "powershell.exe"
        : "powershell.exe";
      try {
        await run(shell, [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          scriptPath,
          "-InputTextPath",
          textPath,
        "-OutputPath",
        request.outputPath,
        ...(request.voice ? ["-VoiceName", request.voice] : []),
      ]);
      } finally {
        await unlink(textPath).catch(() => undefined);
      }
    } else if (process.platform === "linux") {
      await run("espeak", ["-w", request.outputPath, request.text]);
    } else {
      throw new Error("System TTS currently supports Windows and Linux with espeak");
    }

    return {
      provider: this.name,
      outputPath: request.outputPath,
      durationSeconds: await getWavDuration(request.outputPath),
    };
  }
}
