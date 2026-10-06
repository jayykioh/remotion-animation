import "dotenv/config";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import {basename, dirname, extname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createDirector, parseStructuredStory, RenderPlanSchema, type RenderPlan} from "../director/index";
import {createTTSProvider} from "../tts/index";

interface CliOptions {
  scriptPath: string;
  planOnly: boolean;
  llm?: string;
  tts?: string;
  output?: string;
  voice?: string;
  language?: "vi" | "en";
  projectType?: "fast-summary" | "animated-story" | "documentary" | "history-explainer";
  stylePack?: "editorial-dark" | "paper-collage" | "cinematic" | "storybook-noir" | "clean-infographic";
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const parseArgs = (args: string[]): CliOptions => {
  const options: CliOptions = {scriptPath: "", planOnly: false};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--plan-only") options.planOnly = true;
    else if (arg === "--llm") options.llm = args[++index];
    else if (arg.startsWith("--llm=")) options.llm = arg.slice(6);
    else if (arg === "--tts") options.tts = args[++index];
    else if (arg.startsWith("--tts=")) options.tts = arg.slice(6);
    else if (arg === "--output") options.output = args[++index];
    else if (arg.startsWith("--output=")) options.output = arg.slice(9);
    else if (arg === "--voice") options.voice = args[++index];
    else if (arg.startsWith("--voice=")) options.voice = arg.slice(8);
    else if (arg === "--language") options.language = args[++index] as CliOptions["language"];
    else if (arg.startsWith("--language=")) options.language = arg.slice(11) as CliOptions["language"];
    else if (arg === "--project-type") options.projectType = args[++index] as CliOptions["projectType"];
    else if (arg.startsWith("--project-type=")) options.projectType = arg.slice(15) as CliOptions["projectType"];
    else if (arg === "--style") options.stylePack = args[++index] as CliOptions["stylePack"];
    else if (arg.startsWith("--style=")) options.stylePack = arg.slice(8) as CliOptions["stylePack"];
    else if (!arg.startsWith("-") && !options.scriptPath) options.scriptPath = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.scriptPath) {
    throw new Error("Usage: npm run video -- scripts/demo.md [--llm openai] [--tts openai] [--output output/final.mp4]");
  }
  return options;
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .toLowerCase() || "video";

type AlignedWord = {text: string; startSeconds: number; endSeconds: number};

const estimateWordAlignment = (text: string, durationSeconds: number): AlignedWord[] => {
  const words = text.split(/\s+/u).filter(Boolean);
  const totalWeight = words.reduce((sum, word) => sum + Math.max(2, word.length), 0);
  let cursor = 0;
  return words.map((word) => {
    const startSeconds = cursor;
    cursor += (Math.max(2, word.length) / Math.max(1, totalWeight)) * durationSeconds;
    return {text: word, startSeconds, endSeconds: cursor};
  });
};

const makeCaptionPages = (text: string, durationSeconds: number, alignment?: AlignedWord[]) => {
  const words = alignment?.length ? alignment : estimateWordAlignment(text, durationSeconds);
  const pages: Array<{text: string; startSeconds: number; endSeconds: number; words: AlignedWord[]}> = [];
  let current: AlignedWord[] = [];
  for (const word of words) {
    const pageDuration = current.length ? word.endSeconds - current[0].startSeconds : 0;
    if (current.length >= 7 || (current.length >= 4 && pageDuration > 2.2)) {
      pages.push({text: current.map((item) => item.text).join(" "), startSeconds: current[0].startSeconds, endSeconds: current.at(-1)!.endSeconds, words: current});
      current = [];
    }
    current.push(word);
  }
  if (current.length) pages.push({text: current.map((item) => item.text).join(" "), startSeconds: current[0].startSeconds, endSeconds: current.at(-1)!.endSeconds, words: current});
  return pages;
};

const timingForScene = (scene: RenderPlan["scenes"][number] | {beat?: RenderPlan["scenes"][number]["beat"]; narration: string}, narrationSeconds: number) => {
  const role = scene.beat?.role;
  const leadInSeconds = role === "hook" ? 0.18 : role === "turn" ? 0.28 : role === "resolution" ? 0.24 : 0.16;
  const punctuationPause = /[.!?…]\s*$/u.test(scene.narration) ? 0.16 : 0.08;
  const tailSeconds = Math.min(0.72, punctuationPause + (role === "resolution" ? 0.38 : role === "turn" ? 0.2 : 0.12));
  return {leadInSeconds, narrationSeconds, tailSeconds};
};

const assertNarrationCoverage = (script: string, plan: RenderPlan | {scenes: Array<{narration: string}>}) => {
  const normalize = (value: string) => value.replace(/\s+/gu, " ").trim().toLowerCase();
  const sourceWords = normalize(script).match(/[\p{L}\p{N}]+/gu) ?? [];
  const planText = normalize(plan.scenes.map((scene) => scene.narration).join(" "));
  const covered = sourceWords.filter((word) => planText.includes(word)).length;
  const ratio = sourceWords.length === 0 ? 0 : covered / sourceWords.length;
  if (ratio < 0.75) throw new Error(`Scene plan covers only ${Math.round(ratio * 100)}% of script tokens`);
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const absoluteScriptPath = resolve(process.cwd(), options.scriptPath);
  const script = (await readFile(absoluteScriptPath, "utf8")).trim();
  if (!script) throw new Error(`Script is empty: ${absoluteScriptPath}`);

  const fps = Number(process.env.VIDEO_FPS || 30);
  const format = process.env.VIDEO_FORMAT === "16:9" || process.env.VIDEO_FORMAT === "1:1" ? process.env.VIDEO_FORMAT : "9:16";
  const director = createDirector(options.llm);
  const structuredStory = parseStructuredStory(script);
  const narrationSource = structuredStory?.scenes.map((scene) => scene.narration).join("\n\n") || script;
  console.log(`1/5 Director (${director.name}) is planning scenes...`);
  const draftPlan = await director.createPlan({
    script,
    sourceName: basename(absoluteScriptPath),
    fps,
    format,
    projectType: options.projectType,
    stylePack: options.stylePack,
    language: options.language,
    voiceProvider: options.tts,
    voiceId: options.voice,
  });
  assertNarrationCoverage(narrationSource, draftPlan);

  const runId = slugify(basename(absoluteScriptPath, extname(absoluteScriptPath)));
  const generatedDir = join(projectRoot, "generated", runId);
  const publicAudioDir = join(projectRoot, "public", "generated", runId);
  await Promise.all([
    mkdir(generatedDir, {recursive: true}),
    mkdir(publicAudioDir, {recursive: true}),
    mkdir(join(projectRoot, "output"), {recursive: true}),
  ]);

  await writeFile(join(generatedDir, "director-plan.json"), JSON.stringify(draftPlan, null, 2));
  if (options.planOnly) {
    await writeFile(join(projectRoot, "generated", "scene-plan.json"), JSON.stringify(draftPlan, null, 2));
    console.log(`Plan written to generated/${runId}/director-plan.json`);
    return;
  }

  const tts = createTTSProvider(options.tts);
  console.log(`2/5 TTS (${tts.name}) is generating ${draftPlan.scenes.length} audio segment(s)...`);
  const providers = new Set<string>();
  const renderedScenes = [];
  for (const scene of draftPlan.scenes) {
    const audioFileName = `${scene.id}.wav`;
    const result = await tts.synthesize({
      text: scene.narration,
      outputPath: join(publicAudioDir, audioFileName),
      voice: options.voice,
      language: options.language,
      direction: scene.voiceDirection,
    });
    providers.add(result.provider);
    const timing = timingForScene(scene, result.durationSeconds);
    const durationSeconds = Math.max(timing.leadInSeconds + result.durationSeconds + timing.tailSeconds, 1.2);
    const captions = makeCaptionPages(scene.narration, result.durationSeconds, result.alignment).map((caption) => ({
      ...caption,
      startSeconds: caption.startSeconds + timing.leadInSeconds,
      endSeconds: caption.endSeconds + timing.leadInSeconds,
      words: caption.words.map((word) => ({
        ...word,
        startSeconds: word.startSeconds + timing.leadInSeconds,
        endSeconds: word.endSeconds + timing.leadInSeconds,
      })),
    }));
    renderedScenes.push({
      ...scene,
      durationSeconds,
      durationInFrames: Math.ceil(durationSeconds * draftPlan.fps),
      audioSrc: `generated/${runId}/${audioFileName}`,
      timing,
      captions,
    });
  }

  const renderPlan = RenderPlanSchema.parse({
    ...draftPlan,
    scenes: renderedScenes,
    totalDurationInFrames: renderedScenes.reduce((sum, scene) => sum + scene.durationInFrames, 0),
    ttsProvider: [...providers].join("+") || tts.name,
  });
  assertNarrationCoverage(narrationSource, renderPlan);
  await Promise.all([
    writeFile(join(generatedDir, "scene-plan.json"), JSON.stringify(renderPlan, null, 2)),
    writeFile(join(projectRoot, "generated", "scene-plan.json"), JSON.stringify(renderPlan, null, 2)),
  ]);

  console.log("3/5 Scene plan and captions validated.");
  console.log("4/5 Bundling and validating the Remotion composition...");
  const serveUrl = await bundle({
    entryPoint: join(projectRoot, "src", "remotion", "index.ts"),
    publicDir: join(projectRoot, "public"),
  });
  const inputProps = {plan: renderPlan};
  const composition = await selectComposition({serveUrl, id: "VideoAgent", inputProps});

  const outputLocation = resolve(projectRoot, options.output || join("output", "final.mp4"));
  await mkdir(dirname(outputLocation), {recursive: true});
  console.log(`5/5 Rendering ${renderPlan.totalDurationInFrames} frames to ${outputLocation}...`);
  let lastProgress = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps,
    onProgress: ({progress}) => {
      const percent = Math.floor(progress * 10) * 10;
      if (percent !== lastProgress) {
        lastProgress = percent;
        process.stdout.write(`  ${percent}%\n`);
      }
    },
  });

  console.log(`Done: ${outputLocation}`);
  console.log(`Plan: ${join(generatedDir, "scene-plan.json")}`);
};

main().catch((error) => {
  console.error(`Video pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
