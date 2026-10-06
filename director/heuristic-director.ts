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

const STOP_WORDS = new Set([
  "the", "and", "that", "this", "with", "from", "into", "only", "then", "than", "more", "does", "not", "was", "were", "over",
  "của", "và", "là", "một", "những", "được", "trong", "khi", "sau", "đó", "này", "với", "cho", "đến",
]);

const pickKeywords = (text: string) => {
  const candidates = words(text).filter((word) => word.length > 2 && !STOP_WORDS.has(word.toLocaleLowerCase()));
  const scored = candidates.map((word, index) => ({
    word,
    index,
    score:
      (/[0-9%$€£]/u.test(word) ? 6 : 0) +
      (word === word.toUpperCase() ? 3 : 0) +
      (/^\p{Lu}/u.test(word) ? 2.4 : 0) +
      Math.min(word.length / 4, 3) -
      index * 0.01,
  }));
  const unique = [...new Map(scored.map((item) => [item.word.toLocaleLowerCase(), item])).values()];
  return unique.sort((a, b) => b.score - a.score).slice(0, 4).sort((a, b) => a.index - b.index).map((item) => item.word);
};

const classify = (text: string, index: number): SceneType => {
  const lower = text.toLowerCase();
  if (/\d+(?:[.,]\d+)?\s*(?:%|percent|triệu|tỷ|million|billion)|chart|graph|data|số liệu|doanh thu/u.test(lower)) return "chart";
  if (/because|therefore|process|step|first|second|then|because|vì|quy trình|bước|sau đó|dẫn đến/u.test(lower)) return "diagram";
  if (/photo|image|portrait|city|landscape|steve jobs|apple|nhân vật|thành phố|hình ảnh/u.test(lower)) return "image";
  if (/explode|transform|rush|launch|collapse|bounce|spin|biến đổi|bùng nổ|lao|sụp đổ/u.test(lower)) return "custom-motion";
  if (/kể|truyện|ma|cô gái|đèo|khúc cua|tài xế|bóng|sương|ghế/u.test(lower)) return "story-illustration";
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
  const normalized = text.replace(/\s+/gu, " ").trim();
  const sentenceSource = normalized.includes(":") ? normalized.slice(normalized.indexOf(":") + 1).trim() : normalized;
  const sentence = sentenceSource.split(/(?<=[.!?。！？])\s+/u)[0] || sentenceSource;
  const headline = sentence.split(/\s+/u).slice(0, 9).join(" ").replace(/[.!?。！？]+$/u, "");
  return headline.slice(0, 72) || "A new chapter";
};

const visualIntentFor = (narration: string, type: SceneType, keywords: string[]) => {
  const subject = keywords[0] || headlineFrom(narration);
  const support = keywords[1] || "the outcome";
  if (type === "chart") {
    const values = narration.match(/\d+(?:[.,]\d+)?/gu) ?? [];
    return `Build the quantities in spoken order, moving from ${values[0] || subject} toward ${values.at(-1) || support}; let the largest change land on the final number`;
  }
  if (type === "diagram") return `As the narration advances, connect ${subject} to ${support} one causal step at a time; finish on the resulting idea`;
  if (type === "image") return `Ground the beat in one editorial image focused on ${subject}; use a slow camera move to reveal ${support}`;
  if (type === "custom-motion") return `Transform the recurring ${subject} motif into ${support} at the sentence turn, then settle on the final phrase`;
  return `Reveal ${subject} first, introduce ${support} on the next spoken phrase, and hold the final idea as the visual landing point`;
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
      const keywords = pickKeywords(analysisText);
      const scary = /sợ|đêm|tối|mất|dấu chân|bàn thờ|im lặng|dark|fear|death|ghost/u.test(analysisText.toLowerCase());
      
      const atmosphere: ("rain" | "fog" | "snow" | "dust" | "none")[] = [];
      if (/mưa|rain|bão/i.test(analysisText)) atmosphere.push("rain");
      if (/sương|fog|khói/i.test(analysisText)) atmosphere.push("fog");
      if (atmosphere.length === 0) atmosphere.push("dust");

      let environment: "mountain" | "interior" | "city" | "abstract" = "abstract";
      if (/đèo|núi|đường|mountain/i.test(analysisText)) environment = "mountain";
      else if (/xe|gương|phòng|interior|trong/i.test(analysisText)) environment = "interior";
      else if (/nhà|phố|city/i.test(analysisText)) environment = "city";

      const elements: any[] = [];
      if (/cô gái|bóng|ma|người/i.test(analysisText)) elements.push({ emoji: "👤", size: 120, x: 50, y: 50, animation: "float", triggerWord: "bóng" });
      if (/xe tải|xe hơi/i.test(analysisText)) elements.push({ emoji: "🚚", size: 100, x: 20, y: 70, animation: "sweep", triggerWord: "xe" });
      if (/ghế|chỗ trống/i.test(analysisText)) elements.push({ emoji: "💺", size: 150, x: 50, y: 70, animation: "none", triggerWord: "ghế" });
      if (/đèn pha/i.test(analysisText)) elements.push({ emoji: "🔦", size: 80, x: 80, y: 60, animation: "pulse", triggerWord: "đèn" });

      return {
        id: `scene-${String(index + 1).padStart(2, "0")}`,
        narration,
        headline: headlineFrom(narration),
        type,
        visualIntent: beat.visualIntent || visualIntentFor(narration, type, keywords),
        keywords,
        style: scary ? "dramatic" : type === "chart" || type === "diagram" ? "technical" : index === 0 ? "dramatic" : "editorial",
        estimatedDurationSeconds: Math.min(14, Math.max(2.5, wordCount / 2.6 + 0.8)),
        ...(type === "chart" ? {chartData: chartDataFrom(narration)} : {}),
        ...(type === "story-illustration" ? { illustration: { atmosphere, environment, elements } } : {})
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
