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
  Check,
  ChevronRight,
  CirclePlay,
  FileText,
  Film,
  Loader2,
  Mic2,
  MonitorPlay,
  Save,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";
import {useEffect, useMemo, useRef, useState} from "react";

const STEPS = [
  {label: "Project", description: "Mục tiêu và định dạng"},
  {label: "Script", description: "Nội dung và ngôn ngữ"},
  {label: "Voice & style", description: "Giọng đọc và visual"},
  {label: "Draft", description: "Duyệt scene và render"},
] as const;

type ProviderStatus = Record<string, boolean>;

const providerLabel: Record<string, string> = {
  system: "Local",
  openai: "OpenAI",
  fpt: "FPT.AI",
  elevenlabs: "ElevenLabs",
  "local-http": "Local TTS",
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
  const [providers, setProviders] = useState<ProviderStatus>({system: true});
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
      .then((data) => setProviders(data.providers || {system: true}))
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
      <header className="h-20 border-b border-border/60 px-5 lg:px-8 flex items-center justify-between bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground grid place-items-center shadow-[0_8px_30px_var(--color-ring)]">
            <Film className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">Video Agent Studio</div>
            <div className="text-xs text-muted-foreground">Local-first Remotion workflow</div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="h-4 w-4" aria-hidden="true" />
          Draft tự động lưu
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] grid min-h-[calc(100dvh-80px)] lg:grid-cols-[260px_minmax(0,1fr)_400px]">
        <aside className="border-b lg:border-b-0 lg:border-r border-border/60 p-5 lg:p-7">
          <nav aria-label="Quy trình tạo video" className="grid grid-cols-4 gap-2 lg:grid-cols-1 lg:gap-1 relative">
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
                  className={`relative min-h-[44px] rounded-xl p-2 lg:p-3 text-left flex items-center gap-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${active ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:bg-surface-1 hover:text-foreground disabled:hover:bg-transparent disabled:opacity-50"}`}
                  aria-current={active ? "step" : undefined}
                >
                  <span className={`relative z-10 h-7 w-7 shrink-0 rounded-full grid place-items-center text-xs font-semibold transition-colors duration-200 ${active ? "bg-accent text-accent-foreground" : complete ? "bg-emerald-400 text-emerald-950" : "bg-background border border-border"}`}>
                    {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                  </span>
                  <span className="hidden lg:block">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 p-5 sm:p-8 lg:p-10 overflow-y-auto">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <div className="text-xs uppercase tracking-[0.24em] text-accent">Bước {step + 1} / {STEPS.length}</div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.035em]">
                {step === 0 && "Bạn muốn tạo video dạng nào?"}
                {step === 1 && "Đưa script vào dự án"}
                {step === 2 && "Chọn giọng đọc và visual style"}
                {step === 3 && "Duyệt draft trước khi render"}
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-7 text-muted-foreground max-w-2xl">
                {step === 0 && "Thông tin này giúp director chọn nhịp kể, loại scene và tỷ lệ khung hình phù hợp."}
                {step === 1 && "Bạn có thể dán nội dung hoặc import file Markdown. Script gốc luôn được giữ nguyên trong scene plan."}
                {step === 2 && "Provider chưa có API key vẫn có thể được chọn, nhưng cần cấu hình trước khi render."}
                {step === 3 && "Director tạo scene plan trước. Bạn kiểm tra cấu trúc rồi mới chạy TTS và Remotion render."}
              </p>
            </div>

            {step === 0 && (
              <div className="space-y-8">
                <label className="block">
                  <span className="text-sm font-medium">Tên project</span>
                  <input
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="Ví dụ: Vì sao Apple đã trở lại"
                    className="mt-2 h-12 w-full rounded-xl border border-border bg-surface-1 px-4 text-base outline-none transition-all duration-200 focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground/50"
                  />
                </label>
                <fieldset>
                  <legend className="text-sm font-medium mb-3">Project type</legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PROJECT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => update("projectType", type.id)}
                        className={`min-h-[128px] rounded-2xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${form.projectType === type.id ? "border-accent bg-accent/10" : "border-border bg-surface-1 hover:border-border/80 hover:bg-surface-2"}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="font-semibold">{type.label}</span>
                          {form.projectType === type.id && <Check className="h-5 w-5 text-accent" aria-hidden="true" />}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-sm font-medium mb-3">Tỷ lệ video</legend>
                  <div className="grid grid-cols-3 gap-3">
                    {(["9:16", "16:9", "1:1"] as const).map((format) => (
                      <button key={format} type="button" onClick={() => update("format", format)} className={`min-h-[48px] rounded-xl border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${form.format === format ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface-1 hover:bg-surface-2 hover:border-border/80"}`}>{format}</button>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  {(["vi", "en"] as const).map((language) => (
                    <button key={language} type="button" onClick={() => chooseLanguage(language)} className={`min-h-[44px] px-5 rounded-full border text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${form.language === language ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-surface-1 hover:border-border/80"}`}>
                      {language === "vi" ? "Tiếng Việt" : "English"}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-border bg-surface-1 overflow-hidden focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/50 transition-all duration-200">
                  <div className="min-h-[56px] border-b border-border/60 px-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4" /> Script</div>
                    <button type="button" onClick={() => fileRef.current?.click()} className="min-h-[44px] flex items-center gap-2 text-sm text-accent hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-lg px-2 transition-colors">
                      <Upload className="h-4 w-4" /> Import .md / .txt
                    </button>
                    <input ref={fileRef} type="file" accept=".md,.txt,text/plain,text/markdown" onChange={(event) => importScript(event.target.files?.[0])} className="hidden" />
                  </div>
                  <textarea
                    value={form.script}
                    onChange={(event) => update("script", event.target.value)}
                    placeholder="Dán script hoàn chỉnh vào đây..."
                    className="w-full min-h-[430px] resize-y bg-transparent p-5 text-base leading-8 outline-none placeholder:text-muted-foreground/40"
                  />
                  <div className="min-h-[48px] border-t border-border/60 px-5 flex items-center justify-between text-xs text-muted-foreground/60">
                    <span>{wordCount.toLocaleString()} từ</span>
                    <span>Ước tính khoảng {estimatedMinutes} phút</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-9">
                <fieldset>
                  <legend className="text-sm font-medium mb-3">Voice cho {form.language === "vi" ? "tiếng Việt" : "English"}</legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {availableVoices.map((voice) => {
                      const configured = providers[voice.provider] ?? false;
                      return (
                        <button key={voice.id} type="button" onClick={() => update("voiceOptionId", voice.id)} className={`min-h-[112px] rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${form.voiceOptionId === voice.id ? "border-accent bg-accent/10" : "border-border bg-surface-1 hover:border-border/80 hover:bg-surface-2"}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3"><Mic2 className="h-5 w-5 text-muted-foreground" /><span className="font-semibold">{voice.label}</span></div>
                            <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-1 ${configured ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`}>{configured ? "Ready" : voice.provider === "local-http" ? "Server off" : "API key"}</span>
                          </div>
                          <div className="mt-3 text-sm text-muted-foreground">{voice.detail}</div>
                          <div className="mt-2 text-[11px] text-muted-foreground/60">{providerLabel[voice.provider]} · {voice.quality}</div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedVoice.provider === "elevenlabs" && (
                    <label className="block mt-4">
                      <span className="text-sm text-muted-foreground">ElevenLabs Voice ID</span>
                      <input value={form.elevenLabsVoiceId} onChange={(event) => update("elevenLabsVoiceId", event.target.value)} placeholder="Dùng ELEVENLABS_VOICE_ID trong .env nếu để trống" className="mt-2 h-[48px] w-full rounded-xl border border-border bg-surface-1 px-4 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-muted-foreground/40" />
                    </label>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium mb-3">Visual style foundation</legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {STYLE_PACKS.map((style) => (
                      <button key={style.id} type="button" onClick={() => update("stylePack", style.id)} className={`rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${form.stylePack === style.id ? "border-accent bg-accent/10" : "border-border bg-surface-1 hover:border-border/80 hover:bg-surface-2"}`}>
                        <div className="flex gap-1.5 mb-4" aria-hidden="true">{style.colors.map((color) => <span key={color} className="h-5 flex-1 rounded-md border border-border/40" style={{backgroundColor: color}} />)}</div>
                        <div className="font-semibold">{style.label}</div>
                        <div className="mt-1 text-sm text-muted-foreground/70">{style.description}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="flex items-center justify-between gap-5 rounded-2xl border border-border p-4 bg-surface-1 hover:bg-surface-2 transition-colors">
                  <span><span className="block text-sm font-medium">AI Director</span><span className="block mt-1 text-xs text-muted-foreground/70">OpenAI phân tích semantic tốt hơn; heuristic chạy local.</span></span>
                  <select value={form.llmProvider} onChange={(event) => update("llmProvider", event.target.value as StudioFormState["llmProvider"])} className="h-[44px] rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20">
                    <option value="heuristic">Local heuristic</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                {!draft ? (
                  <div className="rounded-3xl border border-border bg-surface-1 p-8 sm:p-10 text-center shadow-sm">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-accent/10 grid place-items-center mb-5">
                      <WandSparkles className="h-8 w-8 text-accent" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-semibold">Tạo scene plan trước</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Bước này chỉ phân tích script và tạo draft. Chưa gọi TTS và chưa render video.</p>
                    <button type="button" onClick={createDraft} disabled={busy !== null} className="mt-6 min-h-[48px] rounded-xl bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent-hover transition-colors disabled:opacity-50 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                      {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Tạo draft
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="font-semibold">Scene plan</h2><p className="mt-1 text-xs text-muted-foreground/70">{draft.scenes.length} scenes · {draft.format} · {draft.fps} fps</p></div>
                      <button type="button" onClick={createDraft} disabled={busy !== null} className="min-h-[44px] px-4 rounded-xl border border-border text-sm hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">Tạo lại</button>
                    </div>
                    <div className="space-y-2">
                      {draft.scenes.map((scene, index) => (
                        <div key={scene.id} className="rounded-2xl border border-border bg-surface-1 p-4 flex gap-4 transition-colors hover:border-border/80">
                          <div className="h-9 w-9 rounded-xl bg-surface-2 grid place-items-center text-xs text-muted-foreground shrink-0 font-medium">{String(index + 1).padStart(2, "0")}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><span className="font-medium text-foreground">{scene.headline}</span><span className="rounded-full bg-surface-2 px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{scene.type}</span></div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground/80 line-clamp-2">{scene.narration}</p>
                          </div>
                          <div className="text-xs tabular-nums text-muted-foreground/60">~{scene.estimatedDurationSeconds.toFixed(1)}s</div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={renderVideo} disabled={busy !== null} className="w-full min-h-[56px] rounded-2xl bg-accent text-accent-foreground font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                      {busy === "render" ? <Loader2 className="h-5 w-5 animate-spin" /> : <CirclePlay className="h-5 w-5" />}
                      {busy === "render" ? "Đang tạo TTS và render..." : "Duyệt draft và render video"}
                    </button>
                  </>
                )}
              </div>
            )}

            {error && <div role="alert" className="mt-6 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm leading-6 text-destructive-foreground whitespace-pre-wrap">{error}</div>}

            <div className="mt-10 flex items-center justify-between border-t border-border/60 pt-6">
              <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0 || busy !== null} className="min-h-[44px] rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"><ArrowLeft className="h-4 w-4" /> Quay lại</button>
              {step < 3 && <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1))} disabled={!canContinue} className="min-h-[48px] rounded-xl bg-foreground px-5 font-semibold text-background hover:bg-foreground/90 transition-colors disabled:opacity-35 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background">Tiếp tục <ArrowRight className="h-4 w-4" /></button>}
            </div>
          </div>
        </section>

        <aside className="border-t lg:border-t-0 lg:border-l border-border/60 bg-background-elevated p-5 lg:p-7 overflow-y-auto relative">
          {/* Subtle top/left gradient for depth */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-surface-1 to-transparent opacity-50" aria-hidden="true" />

          <div className="relative z-10 flex items-center justify-between"><span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Project preview</span><MonitorPlay className="h-4 w-4 text-muted-foreground/50" /></div>

          <div className={`relative z-10 mx-auto mt-6 overflow-hidden rounded-[26px] border border-border bg-background shadow-2xl transition-all duration-300 ${form.format === "9:16" ? "aspect-[9/16] max-h-[490px]" : form.format === "1:1" ? "aspect-square" : "aspect-video"}`}>
            {videoUrl ? (
              <video src={videoUrl} controls className="h-full w-full object-contain bg-black" />
            ) : (
              <div className="h-full flex flex-col justify-between p-6" style={{background: `linear-gradient(145deg, ${STYLE_PACKS.find((style) => style.id === form.stylePack)?.colors[0]}, var(--background))`}}>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-foreground/70"><span>{form.projectType.replace(/-/gu, " ")}</span><span>{form.format}</span></div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-accent">{form.language === "vi" ? "Bản nháp" : "Draft"}</div>
                  <div className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] break-words text-foreground shadow-sm">{form.title || "Untitled video project"}</div>
                  <div className="mt-5 h-1 w-24 rounded-full bg-accent" />
                </div>
                <div className="text-xs text-foreground/60">{wordCount} từ · {selectedVoice.label}</div>
              </div>
            )}
          </div>

          <dl className="relative z-10 mt-8 divide-y divide-border/60 text-sm">
            <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">Project type</dt><dd className="text-right text-foreground font-medium">{PROJECT_TYPES.find((item) => item.id === form.projectType)?.label}</dd></div>
            <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">Voice</dt><dd className="text-right text-foreground font-medium">{selectedVoice.label}</dd></div>
            <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">Style</dt><dd className="text-right text-foreground font-medium">{STYLE_PACKS.find((item) => item.id === form.stylePack)?.label}</dd></div>
            <div className="py-3 flex justify-between gap-4"><dt className="text-muted-foreground">Director</dt><dd className="text-right text-foreground font-medium">{form.llmProvider === "openai" ? "OpenAI" : "Local heuristic"}</dd></div>
          </dl>

          {outputPath && (
            <div className="relative z-10 mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
              <div className="flex items-center gap-2 font-medium"><Check className="h-4 w-4" /> Render hoàn tất</div>
              <div className="mt-2 text-xs text-emerald-200/60 break-all">{outputPath}</div>
              {videoUrl && <a href={videoUrl} download className="mt-3 min-h-[44px] inline-flex items-center gap-2 text-foreground underline underline-offset-4 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md">Tải video <ChevronRight className="h-4 w-4" /></a>}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
