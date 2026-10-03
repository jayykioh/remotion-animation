import {spawn} from "node:child_process";
import {copyFile, mkdir, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";
import {z} from "zod";

export const runtime = "nodejs";
export const maxDuration = 600;

const RequestSchema = z.object({
  title: z.string().max(120),
  script: z.string().min(20).max(30000),
  projectType: z.enum(["fast-summary", "animated-story", "documentary", "history-explainer"]),
  stylePack: z.enum(["editorial-dark", "paper-collage", "cinematic", "storybook-noir", "clean-infographic"]),
  format: z.enum(["9:16", "16:9", "1:1"]),
  language: z.enum(["vi", "en"]),
  llmProvider: z.enum(["heuristic", "openai"]),
  voiceProvider: z.enum(["auto", "system", "openai", "elevenlabs", "fpt", "local-http", "mock"]),
  voiceId: z.string().max(200),
});

const slugify = (value: string) =>
  value.normalize("NFKD").replace(/[^a-zA-Z0-9]+/gu, "-").replace(/^-|-$/gu, "").toLowerCase() || "video";

const runPipeline = (root: string, args: string[]) =>
  new Promise<string>((resolvePromise, reject) => {
    const tsxCli = resolve(root, "node_modules", "tsx", "dist", "cli.mjs");
    const child = spawn(process.execPath, [tsxCli, "scripts/video.ts", ...args], {
      cwd: root,
      env: process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    const append = (chunk: Buffer) => {
      logs += chunk.toString();
      if (logs.length > 20000) logs = logs.slice(-20000);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise(logs);
      else reject(new Error(logs.trim() || `Render process exited with ${code}`));
    });
  });

export async function POST(request: Request) {
  try {
    const input = RequestSchema.parse(await request.json());
    const root = process.cwd();
    const id = `${slugify(input.title)}-${Date.now().toString(36)}`;
    const scriptDir = join(root, "scripts", "imported");
    const publicDir = join(root, "public", "renders");
    const outputDir = join(root, "output");
    await Promise.all([
      mkdir(scriptDir, {recursive: true}),
      mkdir(publicDir, {recursive: true}),
      mkdir(outputDir, {recursive: true}),
    ]);
    const scriptPath = join(scriptDir, `${id}.md`);
    await writeFile(scriptPath, `# ${input.title || "Untitled video"}\n\n${input.script}`, "utf8");
    const publicRelative = `public/renders/${id}.mp4`;
    const pipelineArgs = [
      scriptPath,
      "--llm", input.llmProvider,
      "--tts", input.voiceProvider,
      "--language", input.language,
      "--project-type", input.projectType,
      "--style", input.stylePack,
      "--output", publicRelative,
    ];
    if (input.voiceId) pipelineArgs.push("--voice", input.voiceId);
    await runPipeline(root, pipelineArgs);
    await copyFile(resolve(root, publicRelative), join(outputDir, `${id}.mp4`));
    return Response.json({id, videoUrl: `/renders/${id}.mp4`, outputPath: `output/${id}.mp4`});
  } catch (error) {
    return Response.json(
      {error: error instanceof Error ? error.message.slice(-2000) : "Render failed"},
      {status: 400},
    );
  }
}
