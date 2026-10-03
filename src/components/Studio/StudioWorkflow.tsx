"use client";

import type {DirectorPlan} from "../../../director/schema";
import {
  DEFAULT_STUDIO_FORM,
  PROJECT_TYPES,
  STYLE_PACKS,
  VOICES,
  type StudioFormState,
} from "@/types/studio";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clapperboard,
  Cpu,
  FileText,
  Film,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  Mic2,
  Monitor,
  MonitorPlay,
  Smartphone,
  Sparkles,
  Square,
  Type as TypeIcon,
  Upload,
  WandSparkles,
} from "lucide-react";
import React, {useEffect, useMemo, useRef, useState} from "react";

const STEPS = [
  {label: "Dự án", description: "Mục tiêu và tỷ lệ"},
  {label: "Kịch bản", description: "Nội dung và ngôn ngữ"},
  {label: "Giọng & Visual", description: "Audio và phong cách"},
  {label: "Kiểm duyệt", description: "Storyboard và render"},
] as const;

type ProviderStatus = Record<string, boolean>;

const providerLabel: Record<string, string> = {
  auto: "Auto local",
  system: "Local",
  openai: "OpenAI",
  fpt: "FPT.AI",
  elevenlabs: "ElevenLabs",
  "local-http": "Local TTS",
};

interface SceneMeta {
  label: string;
  icon: React.ComponentType<{className?: string}>;
  badgeBg: string;
  textCol: string;
}

const SCENE_TYPE_META: Record<string, SceneMeta> = {
  "story-illustration": {
    label: "Story Illustration",
    icon: Sparkles,
    badgeBg: "bg-purple-500/10 border-purple-500/20",
    textCol: "text-purple-300",
  },
  diagram: {
    label: "Diagram & Data",
    icon: BarChart3,
    badgeBg: "bg-sky-500/10 border-sky-500/20",
    textCol: "text-sky-300",
  },
  "custom-motion": {
    label: "Custom Motion",
    icon: Clapperboard,
    badgeBg: "bg-amber-500/10 border-amber-500/20",
    textCol: "text-amber-300",
  },
  image: {
    label: "Image Frame",
    icon: ImageIcon,
    badgeBg: "bg-rose-500/10 border-rose-500/20",
    textCol: "text-rose-300",
  },
  text: {
    label: "Typography Beat",
    icon: TypeIcon,
    badgeBg: "bg-emerald-500/10 border-emerald-500/20",
    textCol: "text-emerald-300",
  },
};

const sceneTypeMeta = (type: string): SceneMeta =>
  SCENE_TYPE_META[type] ?? {
    label: type.replace(/-/g, " "),
    icon: Film,
    badgeBg: "bg-white/5 border-white/10",
    textCol: "text-neutral-400",
  };

export function StudioWorkflow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<StudioFormState>(DEFAULT_STUDIO_FORM);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<DirectorPlan | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [busy, setBusy] = useState<"draft" | "render" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProviderStatus>({auto: true, system: true});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("video-agent-studio-draft");
    if (saved) {
      try {
        setForm({...DEFAULT_STUDIO_FORM, ...JSON.parse(saved)});
      } catch {
        localStorage.removeItem("video-agent-studio-draft");
      }
    }
    setHydrated(true);
    fetch("/api/workflow/config")
      .then((response) => response.json())
      .then((data) => {
        const nextProviders = data.providers || {auto: true, system: true};
        setProviders(nextProviders);
        setForm((current) => current.voiceOptionId === "fpt-banmai" && !nextProviders.fpt
          ? {...current, voiceOptionId: "auto-draft-vi"}
          : current);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem("video-agent-studio-draft", JSON.stringify(form));
  }, [form, hydrated]);

  const selectedVoice = useMemo(
    () => VOICES.find((voice) => voice.id === form.voiceOptionId) || VOICES[0],
    [form.voiceOptionId],
  );
  const availableVoices = VOICES.filter((voice) => voice.language === form.language);
  const wordCount = form.script.trim() ? form.script.trim().split(/\s+/u).length : 0;
  const estimatedMinutes = Math.max(1, Math.round(wordCount / 145));

  const update = <Key extends keyof StudioFormState>(key: Key, value: StudioFormState[Key]) => {
    setForm((current) => ({...current, [key]: value}));
    setDraft(null);
    setVideoUrl(null);
    setError(null);
  };

  const chooseLanguage = (language: "vi" | "en") => {
    const firstVoice = VOICES.find((voice) => voice.language === language);
    setForm((current) => ({...current, language, voiceOptionId: firstVoice?.id || current.voiceOptionId}));
    setDraft(null);
    setVideoUrl(null);
  };

  const canContinue =
    step === 0 ? form.title.trim().length > 1 :
    step === 1 ? form.script.trim().length >= 20 :
    step === 2 ? Boolean(selectedVoice) : true;

  const voiceId = selectedVoice.provider === "elevenlabs"
    ? form.elevenLabsVoiceId || selectedVoice.voiceId
    : selectedVoice.voiceId;

  const payload = {
    ...form,
    voiceProvider: selectedVoice.provider,
    voiceId,
  };

  const createDraft = async () => {
    setBusy("draft");
    setError(null);
    try {
      const response = await fetch("/api/workflow/draft", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tạo draft");
      setDraft(data.plan);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo draft");
    } finally {
      setBusy(null);
    }
  };

  const renderVideo = async () => {
    setBusy("render");
    setError(null);
    try {
      const response = await fetch("/api/workflow/render", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Render thất bại");
      setVideoUrl(data.videoUrl);
      setOutputPath(data.outputPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Render thất bại");
    } finally {
      setBusy(null);
    }
  };

  const importScript = async (file?: File) => {
    if (!file) return;
    if (!/\.(md|txt)$/iu.test(file.name)) {
      setError("Chỉ hỗ trợ file .md hoặc .txt trong bước này.");
      return;
    }
    update("script", await file.text());
    if (!form.title) update("title", file.name.replace(/\.[^.]+$/u, ""));
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="h-14 border-b border-border/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between bg-background/80 backdrop-blur-2xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border text-foreground grid place-items-center shadow-xs">
            <Film className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-sm text-foreground">Video Agent Studio</span>
            <span className="hidden sm:inline-flex rounded-full bg-surface-2 border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Remotion Engine
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tự động lưu</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground bg-surface-1 border border-border/60 rounded-md px-2 py-0.5">
            {form.format}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1520px] grid min-h-[calc(100dvh-56px)] lg:grid-cols-[240px_minmax(0,1fr)_390px]">
        <aside className="border-b lg:border-b-0 lg:border-r border-border/60 p-4 lg:p-6 bg-surface-1/30">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3 hidden lg:block px-2">
            Quy trình
          </div>
          <nav aria-label="Quy trình tạo video" className="grid grid-cols-4 gap-1.5 lg:grid-cols-1 lg:gap-1 relative">
            <div className="hidden lg:block absolute left-[19px] top-6 bottom-6 w-px bg-border/40" aria-hidden="true" />
            {STEPS.map((item, index) => {
              const active = index === step;
              const complete = index < step;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  className={`relative min-h-[44px] rounded-xl p-2.5 text-left flex items-center gap-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    active
                      ? "bg-surface-2 border border-border text-foreground shadow-xs"
                      : "border border-transparent text-muted-foreground hover:bg-surface-1 hover:text-foreground disabled:hover:bg-transparent disabled:opacity-40"
                  }`}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={`relative z-10 h-6 w-6 shrink-0 rounded-full grid place-items-center text-xs font-medium transition-colors ${
                      active
                        ? "bg-foreground text-background font-semibold"
                        : complete
                        ? "bg-surface-2 text-foreground border border-border"
                        : "bg-surface-1 text-muted-foreground/60 border border-border/50"
                    }`}
                  >
                    {complete ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="hidden lg:block min-w-0">
                    <span className={`block text-xs font-medium truncate ${active ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                    <span className="block text-[11px] text-muted-foreground/70 truncate mt-0.5">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 p-5 sm:p-8 lg:p-10 overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">Bước {step + 1} / {STEPS.length}</div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {step === 0 && "Mục tiêu & Định dạng dự án"}
                {step === 1 && "Nội dung kịch bản video"}
                {step === 2 && "Giọng đọc & Visual style"}
                {step === 3 && "Storyboard & Render thành phẩm"}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-2xl">
                {step === 0 && "Thông tin này giúp Director phân bổ nhịp kể, tỷ lệ khung hình và template animation phù hợp."}
                {step === 1 && "Dán kịch bản hoặc import Markdown/TXT. Cấu trúc nội dung gốc luôn được bảo toàn."}
                {step === 2 && "Chọn giọng đọc TTS và visual phong cách đồ họa. Provider chưa có API key có thể dùng local draft."}
                {step === 3 && "Kiểm tra storyboard phân cảnh từng scene, đạo cụ, voice direction trước khi kích hoạt render."}
              </p>
            </div>

            {step === 0 && (
              <div className="space-y-7">
                <div>
                  <label htmlFor="project-title" className="block text-xs font-medium text-foreground mb-2">Tên dự án video</label>
                  <input
                    id="project-title"
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="Ví dụ: Vì sao Apple đã trở lại"
                    className="h-11 w-full rounded-xl border border-border bg-surface-1 px-4 text-sm text-foreground outline-none transition-all focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50"
                  />
                </div>
                <fieldset>
                  <legend className="text-xs font-medium text-foreground mb-2.5">Loại hình sản xuất</legend>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {PROJECT_TYPES.map((type) => {
                      const isSelected = form.projectType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => update("projectType", type.id)}
                          className={`rounded-xl border p-4 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            isSelected
                              ? "border-foreground/40 bg-surface-2 text-foreground shadow-xs ring-1 ring-foreground/20"
                              : "border-border/80 bg-surface-1 text-muted-foreground hover:border-border hover:bg-surface-2"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/90"}`}>{type.label}</span>
                            {isSelected ? (
                              <span className="h-4 w-4 rounded-full bg-foreground text-background grid place-items-center">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            ) : (
                              <span className="h-4 w-4 rounded-full border border-border" />
                            )}
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">{type.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-xs font-medium text-foreground mb-2.5">Tỷ lệ khung hình</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      {id: "9:16", label: "9:16 Dọc", sub: "TikTok / Shorts / Reels", icon: Smartphone},
                      {id: "16:9", label: "16:9 Ngang", sub: "YouTube / Landscape", icon: Monitor},
                      {id: "1:1", label: "1:1 Vuông", sub: "Square / Social Feed", icon: Square},
                    ].map(({id, label, sub, icon: Icon}) => {
                      const isSelected = form.format === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => update("format", id as StudioFormState["format"])}
                          className={`rounded-xl border p-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            isSelected
                              ? "border-foreground/40 bg-surface-2 text-foreground ring-1 ring-foreground/20 shadow-xs"
                              : "border-border/80 bg-surface-1 text-muted-foreground hover:border-border hover:bg-surface-2"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon className={`h-4 w-4 ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
                            <span className="text-xs font-mono font-medium">{id}</span>
                          </div>
                          <div className={`mt-2 text-xs font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>{label}</div>
                          <div className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="inline-flex rounded-xl bg-surface-1 p-1 border border-border/80">
                  {(["vi", "en"] as const).map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => chooseLanguage(language)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.language === language
                          ? "bg-foreground text-background shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {language === "vi" ? "Tiếng Việt" : "English"}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-surface-1 overflow-hidden focus-within:border-foreground/30 transition-all duration-200">
                  <div className="h-11 border-b border-border/60 px-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="font-medium">Script Canvas</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 text-foreground hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-md px-2 py-1"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import .md / .txt</span>
                    </button>
                    <input ref={fileRef} type="file" accept=".md,.txt,text/plain,text/markdown" onChange={(event) => importScript(event.target.files?.[0])} className="hidden" />
                  </div>
                  <textarea
                    value={form.script}
                    onChange={(event) => update("script", event.target.value)}
                    placeholder="Dán nội dung kịch bản hoàn chỉnh vào đây..."
                    className="w-full min-h-[400px] resize-y bg-transparent p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 font-sans"
                  />
                  <div className="h-10 border-t border-border/60 px-4 sm:px-5 flex items-center justify-between text-xs text-muted-foreground/70">
                    <span>{wordCount.toLocaleString()} từ</span>
                    <span>Ước tính khoảng ~{estimatedMinutes} phút đọc</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <fieldset>
                  <legend className="text-xs font-medium text-foreground mb-2.5">
                    Giọng đọc ({form.language === "vi" ? "Tiếng Việt" : "English"})
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {availableVoices.map((voice) => {
                      const configured = providers[voice.provider] ?? false;
                      const isSelected = form.voiceOptionId === voice.id;
                      return (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => update("voiceOptionId", voice.id)}
                          className={`rounded-xl border p-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            isSelected
                              ? "border-foreground/40 bg-surface-2 text-foreground ring-1 ring-foreground/20 shadow-xs"
                              : "border-border/80 bg-surface-1 text-muted-foreground hover:border-border hover:bg-surface-2"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Mic2 className={`h-4 w-4 ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
                              <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/90"}`}>{voice.label}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium rounded-full px-2 py-0.5 ${
                              configured
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-surface-2 text-muted-foreground border border-border"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />
                              {configured ? "Sẵn sàng" : voice.provider === "local-http" ? "Server off" : "Cần key"}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground line-clamp-1">{voice.detail}</div>
                          <div className="mt-1 text-[11px] text-muted-foreground/60">{providerLabel[voice.provider]} · {voice.quality}</div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedVoice.provider === "elevenlabs" && (
                    <div className="mt-3">
                      <label htmlFor="elevenlabs-voice-id" className="block text-xs font-medium text-foreground mb-1.5">ElevenLabs Voice ID</label>
                      <input
                        id="elevenlabs-voice-id"
                        value={form.elevenLabsVoiceId}
                        onChange={(event) => update("elevenLabsVoiceId", event.target.value)}
                        placeholder="Dùng ELEVENLABS_VOICE_ID trong .env nếu để trống"
                        className="h-10 w-full rounded-xl border border-border bg-surface-1 px-3.5 text-xs text-foreground outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground/50"
                      />
                    </div>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="text-xs font-medium text-foreground mb-2.5">Visual Style Pack</legend>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {STYLE_PACKS.map((style) => {
                      const isSelected = form.stylePack === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => update("stylePack", style.id)}
                          className={`rounded-xl border p-3.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                            isSelected
                              ? "border-foreground/40 bg-surface-2 text-foreground ring-1 ring-foreground/20 shadow-xs"
                              : "border-border/80 bg-surface-1 text-muted-foreground hover:border-border hover:bg-surface-2"
                          }`}
                        >
                          <div className="flex gap-1.5 mb-3" aria-hidden="true">
                            {style.colors.map((color) => (
                              <span key={color} className="h-3.5 flex-1 rounded-sm border border-border/40 shadow-xs" style={{backgroundColor: color}} />
                            ))}
                          </div>
                          <div className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-foreground/90"}`}>{style.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground leading-normal">{style.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="rounded-xl border border-border bg-surface-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-foreground/80" />
                        <span className="text-sm font-medium text-foreground">AI Director Engine</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">OpenAI phân tích ngữ nghĩa sâu hơn; Heuristic chạy local tức thì không cần API key.</p>
                    </div>
                    <select
                      value={form.llmProvider}
                      onChange={(event) => update("llmProvider", event.target.value as StudioFormState["llmProvider"])}
                      className="h-10 rounded-xl border border-border bg-surface-2 px-3 text-xs text-foreground outline-none focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20 cursor-pointer"
                    >
                      <option value="heuristic">Local Heuristic (Mặc định · Không cần key)</option>
                      <option value="gemini">Google Gemini 1.5 (Nhanh & Rẻ)</option>
                      <option value="openai">OpenAI GPT (Semantic director)</option>
                    </select>
                  </div>
                  {form.llmProvider === "openai" && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-surface-2 border border-border p-3 text-xs text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        Cần khai báo <code className="font-mono text-foreground">OPENAI_API_KEY</code> và <code className="font-mono text-foreground">LLM_PROVIDER=openai</code> trong file <code className="font-mono text-foreground">.env</code> để kích hoạt.
                      </div>
                    </div>
                  )}
                  {form.llmProvider === "gemini" && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-surface-2 border border-border p-3 text-xs text-muted-foreground">
                      <KeyRound className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        Cần khai báo <code className="font-mono text-foreground">GOOGLE_GENERATIVE_AI_API_KEY</code> trong file <code className="font-mono text-foreground">.env</code> để kích hoạt.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                {!draft ? (
                  <div className="rounded-2xl border border-border bg-surface-1 p-8 sm:p-10 text-center shadow-xs">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-surface-2 border border-border grid place-items-center mb-4">
                      <WandSparkles className="h-6 w-6 text-foreground" aria-hidden="true" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">Tạo Storyboard Scene Plan</h2>
                    <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">
                      AI Director sẽ phân tích nội dung script thành từng scene độc lập với visual, voice direction và nhịp timing trước khi render.
                    </p>
                    <button
                      type="button"
                      onClick={createDraft}
                      disabled={busy !== null}
                      className="mt-6 min-h-[42px] rounded-xl bg-foreground px-5 font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background text-xs"
                    >
                      {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>Khởi tạo Draft Plan</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">Storyboard Scene Plan</h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">{draft.scenes.length} phân cảnh · {draft.format} · {draft.fps} FPS</p>
                      </div>
                      <button
                        type="button"
                        onClick={createDraft}
                        disabled={busy !== null}
                        className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        Tạo lại
                      </button>
                    </div>

                    <div className="space-y-2">
                      {draft.scenes.map((scene, index) => {
                        const meta = sceneTypeMeta(scene.type);
                        const IconComponent = meta.icon;
                        return (
                          <div
                            key={scene.id}
                            className="rounded-xl border border-border bg-surface-1 p-3.5 flex gap-3.5 transition-colors hover:border-border/80 hover:bg-surface-2"
                          >
                            <div className="h-8 w-8 rounded-lg bg-surface-2 border border-border/80 grid place-items-center text-xs font-mono font-medium text-foreground/80 shrink-0" title={`Scene ${index + 1}`}>
                              {String(index + 1).padStart(2, "0")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-foreground">{scene.headline}</span>
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${meta.badgeBg} ${meta.textCol}`}>
                                  <IconComponent className="h-3 w-3" />
                                  <span>{meta.label}</span>
                                </span>
                                {scene.voiceDirection && (
                                  <span className="rounded-md bg-surface-2 border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground" title="Voice direction">
                                    {scene.voiceDirection.emotion} · {scene.voiceDirection.pace}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{scene.narration}</p>
                            </div>
                            <div className="text-[11px] font-mono tabular-nums text-muted-foreground/70 shrink-0 pt-0.5">
                              ~{scene.estimatedDurationSeconds.toFixed(1)}s
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={renderVideo}
                      disabled={busy !== null}
                      className="w-full min-h-[48px] rounded-xl bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {busy === "render" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CirclePlay className="h-4 w-4" />}
                      <span>{busy === "render" ? "Đang xử lý TTS & Render Remotion..." : "Duyệt draft và Render Video"}</span>
                    </button>
                  </>
                )}
              </div>
            )}

            {error && <div role="alert" className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 p-3.5 text-xs leading-relaxed text-destructive-foreground whitespace-pre-wrap">{error}</div>}

            <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-5">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                disabled={step === 0 || busy !== null}
                className="h-10 rounded-xl px-3.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại</span>
              </button>
              {step < 3 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.min(3, current + 1))}
                  disabled={!canContinue}
                  className="h-10 rounded-xl bg-foreground px-4 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-35 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        <aside className="border-t lg:border-t-0 lg:border-l border-border/60 bg-surface-1/40 p-4 sm:p-6 lg:p-7 overflow-y-auto relative">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Cinema Canvas</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-muted-foreground bg-surface-2 border border-border/60 px-2 py-0.5 rounded">
                {form.format} · 30 FPS
              </span>
              <MonitorPlay className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
          </div>

          <div className={`relative z-10 mx-auto mt-5 overflow-hidden rounded-2xl border border-border bg-neutral-950 shadow-2xl transition-all duration-300 ${form.format === "9:16" ? "aspect-[9/16] max-h-[460px]" : form.format === "1:1" ? "aspect-square" : "aspect-video"}`}>
            {videoUrl ? (
              <video src={videoUrl} controls className="h-full w-full object-contain bg-black" />
            ) : (
              <div
                className="h-full flex flex-col justify-between p-5 relative overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse at top left, ${STYLE_PACKS.find((style) => style.id === form.stylePack)?.colors[0]}44, #000000 80%)`,
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-foreground/70">
                  <span className="bg-surface-2 border border-border/60 px-2 py-0.5 rounded-full">{form.projectType.replace(/-/gu, " ")}</span>
                  <span>CANVAS PREVIEW</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{form.language === "vi" ? "Dự án" : "Project"}</div>
                  <div className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-foreground line-clamp-3">
                    {form.title || "Untitled video project"}
                  </div>
                  <div className="mt-3 h-0.5 w-12 rounded-full bg-foreground/40" />
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{wordCount} từ</span>
                  <span className="truncate max-w-[130px]">{selectedVoice.label}</span>
                </div>
              </div>
            )}
          </div>

          <dl className="relative z-10 mt-6 divide-y border-t border-border/60 text-xs">
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-muted-foreground">Loại hình</dt>
              <dd className="text-right text-foreground font-medium">{PROJECT_TYPES.find((item) => item.id === form.projectType)?.label}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-muted-foreground">Giọng đọc</dt>
              <dd className="text-right text-foreground font-medium truncate max-w-[180px]">{selectedVoice.label}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-muted-foreground">Visual Style</dt>
              <dd className="text-right text-foreground font-medium">{STYLE_PACKS.find((item) => item.id === form.stylePack)?.label}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <dt className="text-muted-foreground">Director Engine</dt>
              <dd className="text-right text-foreground font-medium">{form.llmProvider === "openai" ? "OpenAI GPT" : form.llmProvider === "gemini" ? "Google Gemini" : "Local Heuristic"}</dd>
            </div>
          </dl>

          {outputPath && (
            <div className="relative z-10 mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Render video hoàn tất</span>
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-emerald-200/70 break-all">{outputPath}</div>
              {videoUrl && (
                <a
                  href={videoUrl}
                  download
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-foreground font-medium hover:underline underline-offset-4"
                >
                  <span>Tải video về máy</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
