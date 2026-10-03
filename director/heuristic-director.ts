import type {DirectorPlan, DirectorScene, SceneType} from "./schema";
import type {DirectorInput, DirectorProvider} from "./types";
import {applyProductionProfile} from "./profiles";
import {parseStructuredStory} from "./structured-script";

const COLORS = {
  background: "#0B0D12",
  foreground: "#F6F2EA",
  accent: "#FF5C35",
  muted: "#8F96A3",
};

const cleanMarkdown = (script: string) =>
  script
    .replace(/^---[\s\S]*?---\s*/u, "")
    .replace(/^#{1,6}\s+/gmu, "")
    .replace(/^[-*+]\s+/gmu, "")
    .replace(/\[(.*?)\]\([^)]*\)/gu, "$1")
    .replace(/[\t ]+/gu, " ")
    .trim();

const splitScript = (script: string): string[] => {
  const paragraphs = cleanMarkdown(script)
    .split(/\n\s*\n/gu)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  for (const paragraph of paragraphs) {
    if (paragraph.length <= 220) {
      chunks.push(paragraph);
      continue;
    }

    const sentences = paragraph.split(/(?<=[.!?。！？])\s+/u);
    let current = "";
    for (const sentence of sentences) {
      const candidate = `${current} ${sentence}`.trim();
      if (candidate.length > 220 && current) {
        chunks.push(current);
        current = sentence;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [cleanMarkdown(script)];
};

const words = (text: string) => text.match(/[\p{L}\p{N}%$€£]+/gu) ?? [];

const pickKeywords = (text: string) => {
  const candidates = words(text).filter((word) => word.length > 2);
  const scored = candidates.map((word, index) => ({
    word,
    score:
      (/[0-9%$€£]/u.test(word) ? 6 : 0) +
      (word === word.toUpperCase() ? 3 : 0) +
      Math.min(word.length / 4, 3) -
      index * 0.01,
  }));
  return [...new Map(scored.sort((a, b) => b.score - a.score).map((item) => [item.word.toLowerCase(), item.word])).values()].slice(0, 4);
};

const classify = (text: string, index: number): SceneType => {
  const lower = text.toLowerCase();
  if (/\d+(?:[.,]\d+)?\s*(?:%|percent|triệu|tỷ|million|billion)|chart|graph|data|số liệu|doanh thu/u.test(lower)) return "chart";
  if (/because|therefore|process|step|first|second|then|because|vì|quy trình|bước|sau đó|dẫn đến/u.test(lower)) return "diagram";
  if (/photo|image|portrait|city|landscape|steve jobs|apple|nhân vật|thành phố|hình ảnh/u.test(lower)) return "image";
  if (/explode|transform|rush|launch|collapse|bounce|spin|biến đổi|bùng nổ|lao|sụp đổ/u.test(lower)) return "custom-motion";
  return index % 4 === 3 ? "custom-motion" : "kinetic-typography";
};

const chartDataFrom = (text: string) => {
  const matches = [...text.matchAll(/([\p{L}][\p{L}\s]{0,18})?\s*(\d+(?:[.,]\d+)?)/gu)].slice(0, 5);
  if (matches.length >= 2) {
    return matches.map((match, index) => ({
      label: match[1]?.trim().split(/\s+/u).slice(-2).join(" ") || `Value ${index + 1}`,
      value: Number(match[2].replace(",", ".")),
    }));
  }
  return [
    {label: "Before", value: 32},
    {label: "Shift", value: 58},
    {label: "After", value: 92},
  ];
};

const titleFrom = (script: string, sourceName: string) => {
  const firstLine = cleanMarkdown(script).split(/[.!?\n]/u)[0].trim();
  return firstLine.slice(0, 72) || sourceName.replace(/\.[^.]+$/u, "");
};

const headlineFrom = (text: string) => {
  const keys = pickKeywords(text);
  return (keys.length > 0 ? keys.join(" · ") : text).slice(0, 72);
};

export class HeuristicDirector implements DirectorProvider {
  readonly name = "heuristic";

  async createPlan(input: DirectorInput): Promise<DirectorPlan> {
    const structured = parseStructuredStory(input.script);
    const beats = structured?.scenes || splitScript(input.script).map((narration) => ({narration, visualIntent: ""}));
    const scenes: DirectorScene[] = beats.map((beat, index) => {
      const narration = beat.narration;
      const analysisText = `${narration} ${beat.visualIntent}`.trim();
      const type = classify(analysisText, index);
      const wordCount = Math.max(words(narration).length, 1);
      const scary = /sợ|đêm|tối|mất|dấu chân|bàn thờ|im lặng|dark|fear|death|ghost/u.test(analysisText.toLowerCase());
      return {
        id: `scene-${String(index + 1).padStart(2, "0")}`,
        narration,
        headline: headlineFrom(beat.visualIntent || narration),
        type,
        visualIntent: beat.visualIntent || `Turn the narration into a clear ${type.replace("-", " ")} beat`,
        keywords: pickKeywords(analysisText),
        style: scary ? "dramatic" : type === "chart" || type === "diagram" ? "technical" : index === 0 ? "dramatic" : "editorial",
        estimatedDurationSeconds: Math.min(14, Math.max(2.5, wordCount / 2.6 + 0.8)),
        ...(type === "chart" ? {chartData: chartDataFrom(narration)} : {}),
      };
    });

    return applyProductionProfile({
      version: 1,
      title: structured?.title || titleFrom(input.script, input.sourceName),
      format: input.format,
      fps: input.fps,
      theme: COLORS,
      scenes,
    }, input);
  }
}
