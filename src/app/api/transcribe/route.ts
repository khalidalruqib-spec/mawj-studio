import { NextResponse } from "next/server";
import { transcribeMediaFile, type TranscriptionLanguage } from "@/lib/transcription";

const SUPPORTED_LANGUAGES = new Set(["ar", "en", "auto"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const languageInput = String(formData.get("language") ?? "auto");
  const durationSeconds = Number(formData.get("durationSeconds") ?? 60);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload a video or audio file to transcribe." }, { status: 400 });
  }

  if (!file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Automatic captions need a video or audio file." }, { status: 400 });
  }

  const language = (SUPPORTED_LANGUAGES.has(languageInput) ? languageInput : "auto") as TranscriptionLanguage;

  try {
    const result = await transcribeMediaFile({
      file,
      language,
      durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : 60,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not transcribe this media file." },
      { status: 502 },
    );
  }
}
