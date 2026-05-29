import type { AspectRatio } from "@/lib/video-styles";

export type RenderJobStatus = "queued" | "running" | "completed" | "failed";
export type RenderEngine = "browser-canvas" | "remotion-worker" | "ffmpeg-worker";
export type RenderMode = "demo" | "production";

export type RenderJobInput = {
  projectId?: string;
  sourcePath?: string;
  format: "mp4" | "gif" | "mp3" | "srt" | "thumbnail";
  quality: "720p" | "1080p" | "4k";
  aspectRatio: AspectRatio;
  burnCaptions: boolean;
  removeBackground: boolean;
  audioEnhancement: string[];
};

export type RenderJob = {
  id: string;
  status: RenderJobStatus;
  engine: RenderEngine;
  mode: RenderMode;
  input: RenderJobInput;
  ffmpegPlan: string[];
  progress: number;
  outputUrl: string | null;
  errorMessage: string | null;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
};

export type RenderCapabilities = {
  preferredEngine: RenderEngine;
  mode: RenderMode;
  browserFallbackAvailable: boolean;
  serverRenderAvailable: boolean;
  queueConfigured: boolean;
  outputStorageConfigured: boolean;
  warnings: string[];
  nextSteps: string[];
};

const renderJobs = new Map<string, RenderJob>();

export function listRenderJobs() {
  return [...renderJobs.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function createRenderJob(input: RenderJobInput) {
  const now = new Date().toISOString();
  const capabilities = getRenderCapabilities();
  const job: RenderJob = {
    id: crypto.randomUUID(),
    status: "queued",
    engine: capabilities.preferredEngine,
    mode: capabilities.mode,
    input,
    ffmpegPlan: buildFfmpegPlan(input),
    progress: 0,
    outputUrl: null,
    errorMessage: null,
    warnings: capabilities.warnings,
    createdAt: now,
    updatedAt: now,
  };

  renderJobs.set(job.id, job);
  return job;
}

export function getRenderCapabilities(): RenderCapabilities {
  const preferredEngine = normalizeRenderEngine(process.env.VIDEO_RENDER_ENGINE);
  const queueConfigured = Boolean(process.env.VIDEO_WORKER_QUEUE && process.env.VIDEO_WORKER_QUEUE !== "demo");
  const outputStorageConfigured = Boolean(process.env.RENDER_OUTPUT_BUCKET);
  const serverRenderAvailable = preferredEngine !== "browser-canvas" && queueConfigured && outputStorageConfigured;
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  if (!serverRenderAvailable) {
    warnings.push("Final exports currently use the browser canvas renderer. It works for previews and short clips, but it is not the production Remotion/cloud path yet.");
  }

  if (preferredEngine === "browser-canvas") {
    nextSteps.push("Set VIDEO_RENDER_ENGINE=remotion-worker when the Remotion worker is deployed.");
  }

  if (!queueConfigured) {
    nextSteps.push("Connect VIDEO_WORKER_QUEUE to a real queue such as BullMQ, Redis, Temporal, or a render worker endpoint.");
  }

  if (!outputStorageConfigured) {
    nextSteps.push("Configure RENDER_OUTPUT_BUCKET or Supabase/R2/S3 storage for final MP4 download URLs.");
  }

  return {
    preferredEngine,
    mode: serverRenderAvailable ? "production" : "demo",
    browserFallbackAvailable: true,
    serverRenderAvailable,
    queueConfigured,
    outputStorageConfigured,
    warnings,
    nextSteps,
  };
}

function normalizeRenderEngine(value: string | undefined): RenderEngine {
  if (value === "remotion-worker" || value === "ffmpeg-worker" || value === "browser-canvas") return value;
  return "browser-canvas";
}

function buildFfmpegPlan(input: RenderJobInput) {
  if (input.format === "srt") return ["write-subtitle-file"];

  const scale = getScaleFilter(input.quality, input.aspectRatio);
  const filters = [scale];

  if (input.burnCaptions) filters.push("subtitles=captions.srt:force_style='Alignment=2'");
  if (input.removeBackground) filters.push("chromakey=0x00FF00:0.20:0.10");

  if (input.format === "mp3") {
    return [
      "ffmpeg",
      "-i input.mp4",
      ...getAudioFilters(input.audioEnhancement),
      "-vn",
      "-codec:a libmp3lame",
      "-b:a 192k",
      "output.mp3",
    ];
  }

  if (input.format === "gif") {
    return ["ffmpeg", "-i input.mp4", "-vf", `${scale},fps=15`, "-loop", "0", "output.gif"];
  }

  if (input.format === "thumbnail") {
    return ["ffmpeg", "-ss", "00:00:02", "-i input.mp4", "-frames:v", "1", "-q:v", "2", "thumbnail.jpg"];
  }

  return [
    "ffmpeg",
    "-i input.mp4",
    "-vf",
    filters.join(","),
    ...getAudioFilters(input.audioEnhancement),
    "-c:v libx264",
    "-preset veryfast",
    "-crf 20",
    "-c:a aac",
    "-b:a 192k",
    "-movflags +faststart",
    "output.mp4",
  ];
}

function getScaleFilter(quality: RenderJobInput["quality"], aspectRatio: AspectRatio) {
  const size = {
    "720p": aspectRatio === "16:9" ? "1280:720" : aspectRatio === "1:1" ? "720:720" : "720:1280",
    "1080p": aspectRatio === "16:9" ? "1920:1080" : aspectRatio === "1:1" ? "1080:1080" : "1080:1920",
    "4k": aspectRatio === "16:9" ? "3840:2160" : aspectRatio === "1:1" ? "2160:2160" : "2160:3840",
  }[quality];

  return `scale=${size}:force_original_aspect_ratio=decrease,pad=${size}:(ow-iw)/2:(oh-ih)/2`;
}

function getAudioFilters(audioEnhancement: string[]) {
  if (!audioEnhancement.length) return [];

  const filters = [];
  if (audioEnhancement.includes("Noise reduction")) filters.push("afftdn");
  if (audioEnhancement.includes("Auto volume leveling")) filters.push("loudnorm=I=-14:TP=-1.5:LRA=11");
  if (audioEnhancement.includes("Voice enhancement")) filters.push("highpass=f=80,lowpass=f=12000");

  return filters.length ? ["-af", filters.join(",")] : [];
}
