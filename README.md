# Local-first Remotion Video Agent

An MVP pipeline that turns a finished Markdown script into a narrated Remotion video:

```text
script.md
  -> director provider
  -> scene-plan.json
  -> per-scene TTS + caption timing
  -> reusable Remotion scenes
  -> composition validation
  -> output/final.mp4
```

The project is based on `remotion-dev/template-prompt-to-motion-graphics-saas`, but the main workflow is now a local CLI. It does not require AWS, Lambda, a database, or an API key.

## Quick start

Requirements: Node.js 20 or newer. On Windows, the default local voice uses `System.Speech`. On Linux it uses `espeak` when installed. If neither is available, the pipeline creates correctly timed silent mock audio so the whole render still works.

```bash
npm install
npm run video -- scripts/demo.md
```

Or open the guided Studio UI:

```bash
npm run dev
```

The home screen provides a four-step workflow for selecting project type and format, importing a Markdown script, choosing Vietnamese or English voices, reviewing the generated scene draft, and rendering the approved video. Draft form state is saved locally in the browser.

Outputs:

- `generated/scene-plan.json`: latest normalized render plan
- `generated/demo/director-plan.json`: raw director output
- `generated/demo/scene-plan.json`: plan enriched with audio and captions
- `public/generated/demo/*.wav`: scene audio used by Remotion
- `output/final.mp4`: rendered video

Preview the composition in Remotion Studio:

```bash
npm run remotion
```

## Providers

The defaults are deliberately local and free:

```env
LLM_PROVIDER=heuristic
TTS_PROVIDER=auto
```

Copy `.env.example` to `.env` only when you want to change providers.

### AI director with OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_LLM_MODEL=gpt-5.2
```

Then run the normal command, or override per run:

```bash
npm run video -- scripts/demo.md --llm openai
```

### OpenAI TTS

```env
TTS_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=cedar
```

The OpenAI voice is AI-generated; disclose that to viewers when publishing a video.

Provider overrides can be combined:

```bash
npm run video -- scripts/demo.md --llm openai --tts openai
```

No API is called unless `openai` is explicitly selected.

### ElevenLabs and FPT.AI

For expressive storytelling with precise caption alignment, configure ElevenLabs:

```env
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL=eleven_v3
```

For Vietnamese-native regional voices, configure FPT.AI:

```env
FPT_TTS_API_KEY=your_key
FPT_TTS_VOICE=banmai
```

The Studio UI shows whether each provider is configured without exposing the keys.

## Useful commands

```bash
# Generate only the director plan
npm run video:plan -- scripts/demo.md

# Use deterministic mock audio on any OS
npm run video -- scripts/demo.md --tts mock

# Choose another final path
npm run video -- scripts/demo.md --output output/apple-story.mp4

npm test
npm run typecheck
npm run lint
```

## Architecture

```text
director/
  heuristic-director.ts   deterministic no-API planner
  openai-director.ts      optional structured-output planner
  schema.ts               shared Zod contracts

tts/
  system-tts.ts           Windows System.Speech / Linux espeak
  openai-tts.ts           optional Speech API provider
  mock-tts.ts             silent fallback with real WAV timing

src/video/
  VideoAgent.tsx          timeline composition
  CaptionLayer.tsx        timed caption renderer
  scenes/                 reusable scene implementations

src/skills/               motion guidance inherited from the template
generated/                plans and intermediate metadata
scripts/                  CLI and Markdown inputs
output/                   final videos
```

Scene types included in the MVP:

- `kinetic-typography`
- `chart`
- `diagram`
- `image` with an abstract local fallback
- `custom-motion`
- `story-illustration`: 2D cutout storytelling with setting, props, camera direction and local spotlight

## Storytelling mode

Choose **Animation kể chuyện** with the **Storybook Noir** style to get the visual language used by the storytelling pipeline. The director now creates two extra layers for every narrative beat:

- `storyboard`: setting, focal subject, supporting objects, physical action, camera and lighting
- `voiceDirection`: emotion, pace, energy and provider instructions

Subtitles are grouped into readable pages. When a provider returns word timings (currently ElevenLabs), the active word is highlighted; other providers use duration-weighted estimated timings. Try the included story script without API keys:

```bash
npm run video -- scripts/story-demo.md --tts mock --project-type animated-story --style storybook-noir --output output/story-demo.mp4
```

### Self-hosted Vietnamese TTS

The project supports an OpenAI-compatible local speech endpoint:

```env
TTS_PROVIDER=local-http
LOCAL_TTS_BASE_URL=http://127.0.0.1:8298/v1
LOCAL_TTS_API_KEY=viet-tts
LOCAL_TTS_MODEL=tts-1
LOCAL_TTS_VOICE=nu-nhe-nhang
```

This adapter can connect to a real self-hosted engine such as `dangvansam/viet-tts`. The `GitHub30/asr-tts-vietnamese` PHP wrapper is deliberately not embedded: it contains no model or offline inference code and depends on third-party demo endpoints, including a hardcoded Zalo demo cookie.

The director and TTS interfaces are intentionally small. A new local model, hosted LLM, or voice engine only needs to implement `DirectorProvider` or `TTSProvider`; the timeline and render layers stay unchanged.

## MVP boundaries

- Caption timestamps are distributed across each scene's measured audio duration. Forced alignment can replace this later without changing the render schema.
- The heuristic director is deterministic, not generative. Use the OpenAI director when you want semantic scene planning.
- The image scene does not search or download third-party assets. It renders a safe abstract placeholder unless a trusted `imageUrl` is supplied by another provider.
- The original Next.js prompt-to-motion UI remains available with `npm run dev`, but it is not required by the CLI pipeline.
