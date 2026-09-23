export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    providers: {
      system: true,
      openai: Boolean(process.env.OPENAI_API_KEY),
      fpt: Boolean(process.env.FPT_TTS_API_KEY),
      elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
      "local-http": Boolean(process.env.LOCAL_TTS_BASE_URL),
    },
  });
}
