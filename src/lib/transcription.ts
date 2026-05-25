export type TranscriptionLanguage = "ar" | "en" | "auto";

export type TranscriptionSegment = {
  id: string;
  start: number;
  end: number;
  speaker: string;
  text: string;
};

export type TranscriptionCaption = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type TranscriptionResult = {
  mode: "openai" | "demo";
  model: string;
  text: string;
  transcript: TranscriptionSegment[];
  captions: TranscriptionCaption[];
  srt: string;
};

type OpenAITranscriptionResponse = {
  text?: string;
  segments?: Array<{
    id?: number | string;
    start?: number;
    end?: number;
    text?: string;
    speaker?: string;
  }>;
};

export async function transcribeMediaFile({
  file,
  language,
  durationSeconds,
}: {
  file: File;
  language: TranscriptionLanguage;
  durationSeconds: number;
}): Promise<TranscriptionResult> {
  const model = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";

  if (!process.env.OPENAI_API_KEY) {
    return buildDemoTranscription(file.name, durationSeconds, language, model);
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("model", model);

  if (language !== "auto") {
    formData.append("language", language);
  }

  if (model === "whisper-1") {
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");
  } else if (model === "gpt-4o-transcribe-diarize") {
    formData.append("response_format", "diarized_json");
    formData.append("chunking_strategy", "auto");
  } else {
    formData.append("response_format", "json");
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as OpenAITranscriptionResponse;
  const normalized = normalizeOpenAITranscription(data, durationSeconds);

  return {
    mode: "openai",
    model,
    text: normalized.text,
    transcript: normalized.segments,
    captions: normalized.segments.map(segmentToCaption),
    srt: segmentsToSrt(normalized.segments),
  };
}

function normalizeOpenAITranscription(data: OpenAITranscriptionResponse, durationSeconds: number) {
  const text = cleanText(data.text ?? data.segments?.map((segment) => segment.text).join(" ") ?? "");

  if (data.segments?.length) {
    const segments = data.segments
      .filter((segment) => cleanText(segment.text ?? ""))
      .map((segment, index) => ({
        id: `tr-${index + 1}`,
        start: clampTime(segment.start ?? index * 4, durationSeconds),
        end: clampTime(segment.end ?? index * 4 + 4, durationSeconds),
        speaker: segment.speaker ?? "Speaker 1",
        text: cleanText(segment.text ?? ""),
      }))
      .map((segment) => ({
        ...segment,
        end: Math.max(segment.start + 0.75, segment.end),
      }));

    if (segments.length) return { text, segments };
  }

  return {
    text,
    segments: roughSegmentsFromText(text, durationSeconds),
  };
}

function buildDemoTranscription(
  fileName: string,
  durationSeconds: number,
  language: TranscriptionLanguage,
  model: string,
): TranscriptionResult {
  const arabic = language !== "en";
  const text = arabic
    ? `هذا نص تجريبي من ${fileName}. عند تفعيل مفتاح OpenAI سيقرأ النظام صوت الفيديو ويحول الكلام إلى كابشن تلقائي قابل للتعديل والتصدير.`
    : `This is a demo transcript for ${fileName}. Add an OpenAI API key to read the video's audio and create editable automatic captions.`;
  const segments = roughSegmentsFromText(text, durationSeconds);

  return {
    mode: "demo",
    model,
    text,
    transcript: segments,
    captions: segments.map(segmentToCaption),
    srt: segmentsToSrt(segments),
  };
}

function roughSegmentsFromText(text: string, durationSeconds: number): TranscriptionSegment[] {
  const sentences = splitIntoCaptionLines(text);
  const wordCounts = sentences.map((sentence) => sentence.split(/\s+/).filter(Boolean).length || 1);
  const totalWords = wordCounts.reduce((total, count) => total + count, 0) || 1;
  let cursor = 0;

  return sentences.map((sentence, index) => {
    const segmentDuration = Math.max(1.8, (wordCounts[index] / totalWords) * Math.max(6, durationSeconds));
    const start = cursor;
    const end = Math.min(Math.max(start + segmentDuration, start + 1.5), Math.max(durationSeconds, start + 1.5));
    cursor = end;

    return {
      id: `tr-${index + 1}`,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      speaker: "Speaker 1",
      text: sentence,
    };
  });
}

function splitIntoCaptionLines(text: string) {
  const cleaned = cleanText(text);
  if (!cleaned) return ["No speech detected."];

  const sentenceMatches = cleaned
    .split(/(?<=[.!?؟。])\s+/)
    .flatMap((sentence) => chunkWords(sentence, 12))
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentenceMatches.length ? sentenceMatches : chunkWords(cleaned, 12);
}

function chunkWords(text: string, maxWords: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += maxWords) {
    chunks.push(words.slice(index, index + maxWords).join(" "));
  }

  return chunks;
}

function segmentToCaption(segment: TranscriptionSegment): TranscriptionCaption {
  return {
    id: `cap-${segment.id}`,
    start: segment.start,
    end: segment.end,
    text: segment.text,
  };
}

function segmentsToSrt(segments: TranscriptionSegment[]) {
  return segments
    .map(
      (segment, index) =>
        `${index + 1}\n${secondsToSrt(segment.start)} --> ${secondsToSrt(segment.end)}\n${segment.text}\n`,
    )
    .join("\n");
}

function secondsToSrt(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${rest
    .toString()
    .padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function clampTime(value: number, durationSeconds: number) {
  return Math.min(Math.max(0, Number(value.toFixed(2))), Math.max(1, durationSeconds));
}
