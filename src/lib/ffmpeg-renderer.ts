import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const FFMPEG_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let ffmpegPromise: Promise<FFmpeg> | null = null;

export type FFmpegCut = {
  start: number;
  end: number;
  label: string;
};

export async function trimVideoWithFFmpeg(
  sourceFile: File,
  cuts: Array<{ start: number; end: number; label: string }>,
  onProgress?: (p: number) => void,
): Promise<Blob> {
  const safeCuts = normalizeCuts(cuts);

  if (!safeCuts.length) {
    onProgress?.(100);
    return sourceFile.slice(0, sourceFile.size, sourceFile.type || "video/mp4");
  }

  const ffmpeg = await getFFmpeg();
  onProgress?.(5);

  const inputName = "input.mp4";
  await ffmpeg.writeFile(inputName, await fetchFile(sourceFile));

  ffmpeg.on("progress", ({ progress }) => {
    const normalized = Number.isFinite(progress) ? progress : 0;
    onProgress?.(Math.min(95, Math.max(8, Math.round(normalized * 90))));
  });

  const partNames: string[] = [];

  for (const [index, cut] of safeCuts.entries()) {
    const outputName = `part${index}.mp4`;
    const duration = Math.max(0.1, cut.end - cut.start);

    await execTrimPart(ffmpeg, inputName, outputName, cut.start, duration);
    partNames.push(outputName);
    onProgress?.(Math.min(92, Math.round(((index + 1) / safeCuts.length) * 70) + 10));
  }

  if (partNames.length === 1) {
    const data = await ffmpeg.readFile(partNames[0]);
    onProgress?.(100);
    return fileDataToBlob(data);
  }

  const concatFile = partNames.map((part) => `file '${part}'`).join("\n");
  await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatFile));
  await ffmpeg.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "concat.txt",
    "-c",
    "copy",
    "output.mp4",
  ]);

  const data = await ffmpeg.readFile("output.mp4");
  onProgress?.(100);
  return fileDataToBlob(data);
}

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = loadFFmpeg();
  }

  return ffmpegPromise;
}

async function loadFFmpeg() {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  return ffmpeg;
}

async function execTrimPart(
  ffmpeg: FFmpeg,
  inputName: string,
  outputName: string,
  start: number,
  duration: number,
) {
  try {
    await ffmpeg.exec([
      "-i",
      inputName,
      "-ss",
      String(start),
      "-t",
      String(duration),
      "-c",
      "copy",
      "-avoid_negative_ts",
      "make_zero",
      outputName,
    ]);
    return;
  } catch {
    await ffmpeg.exec([
      "-i",
      inputName,
      "-ss",
      String(start),
      "-t",
      String(duration),
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-preset",
      "veryfast",
      "-movflags",
      "+faststart",
      outputName,
    ]);
  }
}

function normalizeCuts(cuts: FFmpegCut[]) {
  return cuts
    .map((cut) => ({
      ...cut,
      start: Math.max(0, Number(cut.start)),
      end: Math.max(0, Number(cut.end)),
    }))
    .filter((cut) => Number.isFinite(cut.start) && Number.isFinite(cut.end) && cut.end - cut.start > 0.1)
    .sort((left, right) => left.start - right.start);
}

function fileDataToBlob(data: Awaited<ReturnType<FFmpeg["readFile"]>>) {
  if (typeof data === "string") {
    return new Blob([data], { type: "video/mp4" });
  }

  const copy = new Uint8Array(data.length);
  copy.set(data);
  return new Blob([copy.buffer], { type: "video/mp4" });
}
