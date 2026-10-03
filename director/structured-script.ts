export interface StructuredStoryBeat {
  label: string;
  narration: string;
  visualIntent: string;
}

export interface StructuredStory {
  title?: string;
  scenes: StructuredStoryBeat[];
}

const clean = (value: string) => value
  .replace(/\\\s*$/gmu, "")
  .replace(/^\s*>\s?/gmu, "")
  .replace(/\*\*/gu, "")
  .replace(/^\s+|\s+$/gu, "")
  .replace(/\n{3,}/gu, "\n\n");

const readField = (body: string, field: "Lời kể" | "Hình ảnh") => {
  const next = field === "Lời kể" ? "Hình ảnh" : null;
  const pattern = next
    ? new RegExp(`(?:\\*\\*)?${field}:?(?:\\*\\*)?\\s*([\\s\\S]*?)(?=^\\s*(?:\\*\\*)?${next}:?(?:\\*\\*)?\\s*$)`, "imu")
    : new RegExp(`(?:\\*\\*)?${field}:?(?:\\*\\*)?\\s*([\\s\\S]*)$`, "imu");
  return clean(body.match(pattern)?.[1] || "");
};

export const parseStructuredStory = (script: string): StructuredStory | null => {
  const source = script.replace(/\r\n?/gu, "\n");
  const marker = /^\s*(?:#{1,6}\s*)?(?:\*\*)?(Scene\s+\d+|Kết)(?:\*\*)?\s*$/gimu;
  const matches = [...source.matchAll(marker)];
  if (matches.length < 2) return null;

  const firstMarker = matches[0].index || 0;
  const title = clean(source.slice(0, firstMarker).split("\n").find((line) => /^\s*#{1,6}\s+/u.test(line))?.replace(/^\s*#{1,6}\s+/u, "") || "");
  const scenes = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const body = source.slice(start, end);
    let narration = readField(body, "Lời kể");
    let visualIntent = readField(body, "Hình ảnh");

    if (!narration && match[1].toLowerCase() === "kết") {
      const visualStart = body.search(/^\s*(?:Màn hình|Hình ảnh|Visual)\b/imu);
      narration = clean(visualStart >= 0 ? body.slice(0, visualStart) : body);
      visualIntent = clean(visualStart >= 0 ? body.slice(visualStart) : "End on a suspenseful visual reveal.");
    }

    return {label: match[1], narration, visualIntent};
  }).filter((scene) => scene.narration.length > 0);

  return scenes.length >= 2 ? {title: title || undefined, scenes} : null;
};
