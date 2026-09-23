export const PROJECT_TYPES = [
  {id: "fast-summary", label: "Tóm tắt nhanh", description: "Nhịp nhanh, headline mạnh, phù hợp Shorts và Reels."},
  {id: "animated-story", label: "Animation kể chuyện", description: "Chia câu chuyện thành các beat, hình ảnh và chuyển động giàu cảm xúc."},
  {id: "documentary", label: "Mini documentary", description: "Ảnh tư liệu, timeline, dữ kiện và nhịp kể chậm hơn."},
  {id: "history-explainer", label: "History explainer", description: "Nhân vật, mốc thời gian, bản đồ và quan hệ nguyên nhân kết quả."},
] as const;

export const STYLE_PACKS = [
  {id: "editorial-dark", label: "Editorial Dark", description: "Tương phản cao, typography mạnh", colors: ["#0B0D12", "#F6F2EA", "#FF5C35"]},
  {id: "paper-collage", label: "Paper Collage", description: "Ấm, thủ công, phù hợp storytelling", colors: ["#EDE4D3", "#171512", "#D94A32"]},
  {id: "cinematic", label: "Cinematic", description: "Tối, chậm, giàu chiều sâu", colors: ["#080B10", "#F1EEE7", "#D9AA55"]},
  {id: "storybook-noir", label: "Storybook Noir", description: "2D cutout, nền tối và spotlight kể chuyện", colors: ["#090910", "#F4EFE6", "#E9B85E"]},
  {id: "clean-infographic", label: "Clean Infographic", description: "Sạch, sáng, ưu tiên dữ liệu", colors: ["#F5F7FA", "#14213D", "#2563EB"]},
] as const;

export const VOICES = [
  {id: "fpt-banmai", provider: "fpt", voiceId: "banmai", language: "vi", label: "Ban Mai", detail: "Nữ miền Bắc · rõ, hợp tóm tắt", quality: "Vietnamese native"},
  {id: "fpt-lannhi", provider: "fpt", voiceId: "lannhi", language: "vi", label: "Lan Nhi", detail: "Nữ miền Nam · mềm và gần gũi", quality: "Vietnamese native"},
  {id: "fpt-leminh", provider: "fpt", voiceId: "leminh", language: "vi", label: "Lê Minh", detail: "Nam miền Bắc · trầm, documentary", quality: "Vietnamese native"},
  {id: "elevenlabs-vi", provider: "elevenlabs", voiceId: "default", language: "vi", label: "ElevenLabs V3", detail: "Biểu cảm cao · cần voice ID", quality: "Expressive"},
  {id: "openai-cedar-vi", provider: "openai", voiceId: "cedar", language: "vi", label: "Cedar", detail: "Đa ngôn ngữ · giọng ấm", quality: "Multilingual"},
  {id: "local-viettts-vi", provider: "local-http", voiceId: "nu-nhe-nhang", language: "vi", label: "VietTTS Local", detail: "Server mã nguồn mở chạy trên máy · không gửi script lên cloud", quality: "Self-hosted"},
  {id: "system-default-vi", provider: "system", voiceId: "", language: "vi", label: "Local draft voice", detail: "Không cần API · dùng để kiểm tra pipeline", quality: "Draft"},
  {id: "openai-cedar", provider: "openai", voiceId: "cedar", language: "en", label: "Cedar", detail: "Warm documentary narration", quality: "Natural"},
  {id: "openai-coral", provider: "openai", voiceId: "coral", language: "en", label: "Coral", detail: "Bright, energetic delivery", quality: "Natural"},
  {id: "elevenlabs-en", provider: "elevenlabs", voiceId: "default", language: "en", label: "ElevenLabs V3", detail: "Expressive storytelling · voice ID", quality: "Expressive"},
  {id: "system-default", provider: "system", voiceId: "", language: "en", label: "System voice", detail: "Local fallback · không cần API", quality: "Draft"},
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number]["id"];
export type StylePack = (typeof STYLE_PACKS)[number]["id"];
export type StudioLanguage = "vi" | "en";
export type StudioVoice = (typeof VOICES)[number];

export interface StudioFormState {
  title: string;
  projectType: ProjectType;
  format: "9:16" | "16:9" | "1:1";
  script: string;
  language: StudioLanguage;
  voiceOptionId: string;
  elevenLabsVoiceId: string;
  stylePack: StylePack;
  llmProvider: "heuristic" | "openai";
}

export const DEFAULT_STUDIO_FORM: StudioFormState = {
  title: "",
  projectType: "fast-summary",
  format: "9:16",
  script: "",
  language: "vi",
  voiceOptionId: "fpt-banmai",
  elevenLabsVoiceId: "",
  stylePack: "editorial-dark",
  llmProvider: "heuristic",
};
