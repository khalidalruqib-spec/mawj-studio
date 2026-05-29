import type { EditPlan } from "@/lib/edit-plan";
import { trimVideoWithFFmpeg, type FFmpegCut } from "@/lib/ffmpeg-renderer";
import { resolveMediaDuration } from "@/lib/media-duration";
import type { AspectRatio, VideoStyle } from "@/lib/video-styles";

const FPS = 30;

export type BrowserRenderProgress = {
  percent: number;
  label: string;
  elapsedSeconds: number;
  outputSeconds: number;
};

export type BrowserRenderResult = {
  blob: Blob;
  url: string;
  fileName: string;
  mimeType: string;
  durationSeconds: number;
  resolution: string;
};

type RenderEditedVideoOptions = {
  sourceFile?: File;
  sourceUrl: string;
  sourceFileName: string;
  sourceDurationSeconds: number;
  aspectRatio: AspectRatio;
  style: VideoStyle;
  brandName: string;
  plan: EditPlan | null;
  timelineTracks?: RenderTimelineTrack[];
  onProgress?: (progress: BrowserRenderProgress) => void;
};

type RenderTimelineLayer = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "caption" | "effect" | "shape" | "background" | "waveform";
  name: string;
  start: number;
  duration: number;
  color: string;
  content?: string;
  src?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  fit?: "cover" | "contain" | "fill";
};

type RenderTimelineTrack = {
  layers: RenderTimelineLayer[];
};

type AudioEnhancementSettings = {
  enabled: boolean;
  noiseReduction: boolean;
  voiceEnhancement: boolean;
  echoReduction: boolean;
  volumeLeveling: boolean;
};

export async function renderEditedVideo({
  sourceFile,
  sourceUrl,
  sourceFileName,
  sourceDurationSeconds,
  aspectRatio,
  style,
  brandName,
  plan,
  timelineTracks = [],
  onProgress,
}: RenderEditedVideoOptions): Promise<BrowserRenderResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("محرك الرندر يعمل داخل المتصفح فقط.");
  }

  const video = document.createElement("video");
  video.src = sourceUrl;
  video.preload = "auto";
  video.playsInline = true;

  const dimensions = getRenderDimensions(aspectRatio);

  await waitForVideoEvent(video, "loadedmetadata");

  const realDuration = await resolveMediaDuration(video, Math.max(1, sourceDurationSeconds));
  const ffmpegCuts = getPlanCuts(plan, realDuration);
  const hasTimelineOverlays = hasRenderableTimelineOverlays(timelineTracks);

  if (sourceFile && ffmpegCuts.length > 0 && !hasTimelineOverlays) {
    try {
      const outputSeconds = ffmpegCuts.reduce((total, cut) => total + Math.max(0, cut.end - cut.start), 0);
      const blob = await trimVideoWithFFmpeg(sourceFile, ffmpegCuts, (percent) => {
        onProgress?.({
          percent,
          label: "Cutting video with FFmpeg",
          elapsedSeconds: Math.round((percent / 100) * outputSeconds),
          outputSeconds,
        });
      });

      onProgress?.({
        percent: 100,
        label: "FFmpeg cut ready",
        elapsedSeconds: outputSeconds,
        outputSeconds,
      });

      return {
        blob,
        url: URL.createObjectURL(blob),
        fileName: `${safeBaseName(sourceFileName)}-mawj-cut.mp4`,
        mimeType: "video/mp4",
        durationSeconds: Math.max(1, Math.round(outputSeconds)),
        resolution: `${dimensions.width}x${dimensions.height}`,
      };
    } catch (caughtError) {
      console.warn("FFmpeg render failed; falling back to canvas renderer.", caughtError);
      onProgress?.({
        percent: 3,
        label: "FFmpeg unavailable, falling back to browser render",
        elapsedSeconds: 0,
        outputSeconds: plan?.targetDurationSeconds ?? realDuration,
      });
    }
  }

  if (!window.MediaRecorder) {
    throw new Error("المتصفح الحالي لا يدعم تصدير الفيديو. جرّب Chrome أو Edge.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext("2d");
  if (!context || !canvas.captureStream) {
    throw new Error("تعذر تجهيز Canvas لتصدير الفيديو.");
  }

  const playbackRate = getPlaybackRate(style.pace);
  const cutSourceSeconds = ffmpegCuts.reduce((total, cut) => total + Math.max(0, cut.end - cut.start), 0);
  const desiredSourceSeconds = Math.max(4, Math.min(plan?.targetDurationSeconds ?? realDuration, 60));
  const sourceSeconds = ffmpegCuts.length > 0 ? Math.min(realDuration, cutSourceSeconds) : Math.min(realDuration, desiredSourceSeconds);
  const outputSeconds = sourceSeconds / playbackRate;
  const overlayImages = await loadTimelineOverlayImages(timelineTracks);

  const canvasStream = canvas.captureStream(FPS);
  const stream = new MediaStream(canvasStream.getVideoTracks());
  const audioEnhancement = getAudioEnhancementSettings(timelineTracks);
  const audio = connectAudioToStream(video, stream, audioEnhancement);
  const mimeType = pickRecorderMimeType();
  const chunks: Blob[] = [];
  const recorderOptions: MediaRecorderOptions = {
    videoBitsPerSecond: aspectRatio === "9:16" ? 6_500_000 : 5_500_000,
    audioBitsPerSecond: 128_000,
  };

  if (mimeType) {
    recorderOptions.mimeType = mimeType;
  }

  const recorder = new MediaRecorder(stream, recorderOptions);
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = waitForRecorderStop(recorder);

  try {
    if (audio?.context.state === "suspended") {
      await audio.context.resume();
    }

    video.currentTime = ffmpegCuts[0]?.start ?? 0;
    video.playbackRate = playbackRate;
    drawEditedFrame(context, video, {
      style,
      brandName,
      plan,
      timelineTracks,
      overlayImages,
      outputTime: 0,
      outputSeconds,
      aspectRatio,
    });

    recorder.start(250);
    await video.play();

    await new Promise<void>((resolve, reject) => {
      let animationFrame = 0;
      const renderStart = performance.now();
      const tick = () => {
        if (video.error) {
          reject(new Error("تعذر قراءة الفيديو أثناء الرندر."));
          return;
        }

        const elapsedOutputSeconds = ffmpegCuts.length > 0
          ? Math.min(outputSeconds, (performance.now() - renderStart) / 1000)
          : Math.min(outputSeconds, Math.max(0, video.currentTime) / playbackRate);

        if (ffmpegCuts.length > 0) {
          const targetSourceTime = getSourceTimeForCutOutput(ffmpegCuts, elapsedOutputSeconds * playbackRate);
          const currentCut = getCutForSourceTime(ffmpegCuts, targetSourceTime);
          const isOutsideCut =
            !currentCut ||
            video.currentTime < currentCut.start - 0.08 ||
            video.currentTime > currentCut.end + 0.08;
          const drift = Math.abs(video.currentTime - targetSourceTime);

          if (isOutsideCut || drift > 0.35) {
            video.currentTime = targetSourceTime;
          }
        }

        drawEditedFrame(context, video, {
          style,
          brandName,
          plan,
          timelineTracks,
          overlayImages,
          outputTime: elapsedOutputSeconds,
          outputSeconds,
          aspectRatio,
        });

        onProgress?.({
          percent: Math.min(99, Math.round((elapsedOutputSeconds / outputSeconds) * 100)),
          label: "Rendering edited video",
          elapsedSeconds: elapsedOutputSeconds,
          outputSeconds,
        });

        if (elapsedOutputSeconds >= outputSeconds || (!ffmpegCuts.length && video.ended)) {
          cancelAnimationFrame(animationFrame);
          resolve();
          return;
        }

        animationFrame = requestAnimationFrame(tick);
      };

      animationFrame = requestAnimationFrame(tick);
    });

    video.pause();

    if (recorder.state !== "inactive") {
      recorder.stop();
    }

    await stopped;
  } finally {
    video.pause();
    canvasStream.getTracks().forEach((track) => track.stop());
    stream.getTracks().forEach((track) => track.stop());
    audio?.cleanup();
    await audio?.context.close().catch(() => undefined);
  }

  const resolvedMimeType = mimeType || "video/webm";
  const blob = new Blob(chunks, { type: resolvedMimeType });
  const extension = resolvedMimeType.includes("mp4") ? "mp4" : "webm";
  const fileName = `${safeBaseName(sourceFileName)}-mawj-edit.${extension}`;

  onProgress?.({
    percent: 100,
    label: "Edited video ready",
    elapsedSeconds: outputSeconds,
    outputSeconds,
  });

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    mimeType: resolvedMimeType,
    durationSeconds: Math.round(outputSeconds),
    resolution: `${dimensions.width}x${dimensions.height}`,
  };
}

function getPlanCuts(plan: EditPlan | null, realDuration: number): FFmpegCut[] {
  if (!plan?.timeline.length) return [];

  return plan.timeline
    .map((item) => ({
      start: Math.max(0, Math.min(realDuration, item.start)),
      end: Math.max(0, Math.min(realDuration, item.end)),
      label: item.label,
    }))
    .filter((cut) => cut.end - cut.start > 0.1);
}

function getSourceTimeForCutOutput(cuts: FFmpegCut[], elapsedSourceSeconds: number) {
  let cursor = 0;

  for (const cut of cuts) {
    const duration = Math.max(0, cut.end - cut.start);
    if (elapsedSourceSeconds <= cursor + duration) {
      return cut.start + Math.max(0, elapsedSourceSeconds - cursor);
    }
    cursor += duration;
  }

  return cuts.at(-1)?.end ?? elapsedSourceSeconds;
}

function getCutForSourceTime(cuts: FFmpegCut[], sourceTime: number) {
  return cuts.find((cut) => sourceTime >= cut.start - 0.01 && sourceTime <= cut.end + 0.01) ?? null;
}

export function getPreviewFilter(styleId: VideoStyle["id"]) {
  return getCanvasFilter(styleId)
    .replaceAll("contrast(", "contrast(")
    .replaceAll("brightness(", "brightness(");
}

export function getCaptionForTime(plan: EditPlan | null, time: number, fallback: string) {
  if (!plan?.captions.length) return fallback;

  const sortedCaptions = [...plan.captions].sort((left, right) => left.at - right.at);
  let active = sortedCaptions[0];

  for (const caption of sortedCaptions) {
    if (caption.at <= time) {
      active = caption;
    } else {
      break;
    }
  }

  return active?.text || fallback;
}

function drawEditedFrame(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  {
    style,
    brandName,
    plan,
    timelineTracks,
    overlayImages,
    outputTime,
    outputSeconds,
    aspectRatio,
  }: {
    style: VideoStyle;
    brandName: string;
    plan: EditPlan | null;
    timelineTracks: RenderTimelineTrack[];
    overlayImages: Map<string, HTMLImageElement>;
    outputTime: number;
    outputSeconds: number;
    aspectRatio: AspectRatio;
  },
) {
  const { width, height } = context.canvas;
  const videoWidth = video.videoWidth || width;
  const videoHeight = video.videoHeight || height;
  const backgroundLayer = getActiveRenderBackgroundLayer(timelineTracks, outputTime);
  const motion = getMotionAmount(style.pace);
  const zoom = 1.035 + motion * Math.sin(outputTime * 1.45);

  context.save();
  context.fillStyle = "#050608";
  context.fillRect(0, 0, width, height);

  if (backgroundLayer) {
    drawRenderBackground(context, video, backgroundLayer);
  }

  context.filter = getCanvasFilter(style.id);

  if (backgroundLayer) {
    const frame = getBackgroundReplacementVideoFrame(width, height);
    roundedRect(context, frame.x, frame.y, frame.width, frame.height, frame.radius);
    context.save();
    context.shadowColor = "rgba(0,0,0,0.36)";
    context.shadowBlur = Math.round(width * 0.045);
    context.fillStyle = "rgba(0,0,0,0.24)";
    context.fill();
    context.restore();
    roundedRect(context, frame.x, frame.y, frame.width, frame.height, frame.radius);
    context.clip();
    drawVideoContain(context, video, frame.x, frame.y, frame.width, frame.height, zoom);
  } else {
    const drawScale = Math.max(width / videoWidth, height / videoHeight) * zoom;
    const drawWidth = videoWidth * drawScale;
    const drawHeight = videoHeight * drawScale;
    const panX = Math.sin(outputTime * 0.72) * width * motion * 0.24;
    const panY = Math.cos(outputTime * 0.48) * height * motion * 0.08;
    const drawX = (width - drawWidth) / 2 + panX;
    const drawY = (height - drawHeight) / 2 + panY;
    context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }
  context.restore();

  drawStyleWash(context, style.id);
  drawTopChrome(context, brandName, style.arabicName);
  drawCutPulse(context, plan, outputTime);
  drawHook(context, plan, outputTime, aspectRatio);
  const renderedOverlayTypes = drawTimelineOverlays(context, {
    tracks: timelineTracks,
    images: overlayImages,
    time: outputTime,
    aspectRatio,
  });
  if (!renderedOverlayTypes.has("caption")) {
    drawCaption(context, getCaptionForTime(plan, outputTime, style.arabicName), aspectRatio);
  }
  drawProgress(context, Math.min(1, outputTime / outputSeconds));
}

function drawStyleWash(context: CanvasRenderingContext2D, styleId: VideoStyle["id"]) {
  const { width, height } = context.canvas;
  const gradient = context.createLinearGradient(0, 0, width, height);
  const colors: Record<VideoStyle["id"], [string, string]> = {
    "viral-saudi": ["rgba(255, 79, 100, 0.20)", "rgba(255, 184, 107, 0.12)"],
    "premium-brand": ["rgba(215, 181, 109, 0.18)", "rgba(6, 8, 12, 0.20)"],
    "podcast-cuts": ["rgba(106, 216, 255, 0.15)", "rgba(0, 0, 0, 0.22)"],
    "product-drop": ["rgba(142, 247, 194, 0.14)", "rgba(54, 211, 153, 0.14)"],
    educational: ["rgba(167, 139, 250, 0.16)", "rgba(125, 211, 252, 0.12)"],
    "restaurant-ad": ["rgba(255, 159, 28, 0.18)", "rgba(255, 224, 102, 0.10)"],
  };

  gradient.addColorStop(0, colors[styleId][0]);
  gradient.addColorStop(1, colors[styleId][1]);
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function drawTopChrome(context: CanvasRenderingContext2D, brandName: string, styleName: string) {
  const { width, height } = context.canvas;
  const padding = Math.max(28, width * 0.04);
  const top = Math.max(24, height * 0.035);
  const fontSize = clamp(width * 0.025, 20, 34);
  const label = `${brandName.trim() || "Mawj Studio"} · ${styleName}`;

  context.save();
  context.font = `800 ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";
  const textWidth = Math.min(width - padding * 2, context.measureText(label).width + padding);
  const pillHeight = fontSize * 2.05;
  const x = (width - textWidth) / 2;
  roundedRect(context, x, top, textWidth, pillHeight, pillHeight / 2);
  context.fillStyle = "rgba(0, 0, 0, 0.52)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = "#f8fafc";
  context.fillText(label, width / 2, top + pillHeight / 2 + 1, textWidth - padding * 0.5);
  context.restore();
}

function drawHook(
  context: CanvasRenderingContext2D,
  plan: EditPlan | null,
  outputTime: number,
  aspectRatio: AspectRatio,
) {
  if (!plan?.hook || outputTime > 3.7) return;

  const { width, height } = context.canvas;
  const fontSize = clamp(width * (aspectRatio === "16:9" ? 0.035 : 0.054), 30, 68);
  const maxWidth = width * 0.82;
  const lines = wrapText(context, plan.hook, maxWidth, 2, fontSize);
  const lineHeight = fontSize * 1.18;
  const blockHeight = lines.length * lineHeight + fontSize * 0.9;
  const y = height * (aspectRatio === "16:9" ? 0.17 : 0.16);

  context.save();
  context.font = `950 ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";
  roundedRect(context, width * 0.08, y, width * 0.84, blockHeight, 28);
  context.fillStyle = "rgba(0, 0, 0, 0.55)";
  context.fill();

  context.fillStyle = "#ffffff";
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, y + fontSize * 0.68 + index * lineHeight, maxWidth);
  });

  context.fillStyle = "#8ef7c2";
  roundedRect(context, width * 0.31, y + blockHeight - 12, width * 0.38, 8, 8);
  context.fill();
  context.restore();
}

function drawCaption(context: CanvasRenderingContext2D, caption: string, aspectRatio: AspectRatio) {
  const { width, height } = context.canvas;
  const fontSize = clamp(width * (aspectRatio === "16:9" ? 0.032 : 0.052), 28, 58);
  const maxWidth = width * 0.84;
  const lines = wrapText(context, caption, maxWidth, 3, fontSize);
  const lineHeight = fontSize * 1.25;
  const blockHeight = lines.length * lineHeight + fontSize * 0.95;
  const y = height - blockHeight - height * 0.105;

  context.save();
  context.font = `900 ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";
  roundedRect(context, width * 0.07, y, width * 0.86, blockHeight, 30);
  context.fillStyle = "rgba(3, 5, 8, 0.72)";
  context.fill();
  context.strokeStyle = "rgba(255, 255, 255, 0.14)";
  context.lineWidth = 2;
  context.stroke();

  lines.forEach((line, index) => {
    context.lineWidth = Math.max(5, fontSize * 0.1);
    context.strokeStyle = "rgba(0, 0, 0, 0.75)";
    context.strokeText(line, width / 2, y + fontSize * 0.72 + index * lineHeight, maxWidth);
    context.fillStyle = "#ffffff";
    context.fillText(line, width / 2, y + fontSize * 0.72 + index * lineHeight, maxWidth);
  });
  context.restore();
}

function drawTimelineOverlays(
  context: CanvasRenderingContext2D,
  {
    tracks,
    images,
    time,
    aspectRatio,
  }: {
    tracks: RenderTimelineTrack[];
    images: Map<string, HTMLImageElement>;
    time: number;
    aspectRatio: AspectRatio;
  },
) {
  const renderedTypes = new Set<RenderTimelineLayer["type"]>();
  const projectDimensions = getProjectDimensions(aspectRatio);
  const scaleX = context.canvas.width / projectDimensions.width;
  const scaleY = context.canvas.height / projectDimensions.height;
  const layers = getRenderableTimelineLayers(tracks).filter(
    (layer) => layer.start <= time && layer.start + layer.duration >= time,
  );

  for (const layer of layers) {
    const geometry = resolveRenderLayerGeometry(layer, projectDimensions);
    const x = geometry.x * scaleX;
    const y = geometry.y * scaleY;
    const width = geometry.width * scaleX;
    const height = geometry.height * scaleY;
    const opacity = clamp(layer.opacity ?? 1, 0, 1);

    if (width <= 1 || height <= 1 || opacity <= 0) continue;

    context.save();
    context.globalAlpha = opacity;

    if (layer.type === "image") {
      const image = layer.src ? images.get(layer.src) : undefined;
      if (image) {
        drawFittedImage(context, image, x, y, width, height, layer.fit ?? "contain");
        renderedTypes.add(layer.type);
      }
      context.restore();
      continue;
    }

    if (layer.type === "shape") {
      roundedRect(context, x, y, width, height, Math.min(48, (layer.borderRadius ?? 18) * scaleX));
      context.fillStyle = normalizeCanvasColor(layer.backgroundColor ?? layer.color, "#8ef7c2");
      context.fill();
      renderedTypes.add(layer.type);
      context.restore();
      continue;
    }

    if (layer.type === "text" || layer.type === "caption") {
      drawTimelineTextLayer(context, layer, { x, y, width, height, scaleX, aspectRatio });
      renderedTypes.add(layer.type);
      context.restore();
      continue;
    }

    context.restore();
  }

  return renderedTypes;
}

function drawTimelineTextLayer(
  context: CanvasRenderingContext2D,
  layer: RenderTimelineLayer,
  {
    x,
    y,
    width,
    height,
    scaleX,
    aspectRatio,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    aspectRatio: AspectRatio;
  },
) {
  const text = layer.content ?? "";
  if (!text.trim()) return;

  const fontSize = clamp((layer.fontSize ?? (layer.type === "caption" ? 58 : 64)) * scaleX, 18, aspectRatio === "16:9" ? 54 : 62);
  const lineHeight = fontSize * 1.18;
  const maxLines = Math.max(1, Math.floor((height - fontSize * 0.65) / lineHeight));

  context.font = `${layer.fontWeight ?? "900"} ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  const lines = wrapText(context, text, width * 0.88, Math.min(4, maxLines), fontSize);
  const blockHeight = Math.min(height, lines.length * lineHeight + fontSize * 0.85);
  const blockY = y + (height - blockHeight) / 2;
  const background =
    layer.type === "caption"
      ? normalizeCanvasColor(layer.backgroundColor, "rgba(3, 5, 8, 0.68)")
      : layer.backgroundColor
        ? normalizeCanvasColor(layer.backgroundColor, "transparent")
        : "transparent";

  if (background !== "transparent") {
    roundedRect(context, x, blockY, width, blockHeight, Math.min(32, (layer.borderRadius ?? 18) * scaleX));
    context.fillStyle = background;
    context.fill();
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.direction = "rtl";

  lines.forEach((line, index) => {
    const baseline = blockY + fontSize * 0.62 + index * lineHeight;
    if (layer.type === "caption") {
      context.lineWidth = Math.max(4, fontSize * 0.09);
      context.strokeStyle = "rgba(0, 0, 0, 0.72)";
      context.strokeText(line, x + width / 2, baseline, width * 0.9);
    }
    context.fillStyle = normalizeCanvasColor(layer.textColor ?? layer.color, "#ffffff");
    context.fillText(line, x + width / 2, baseline, width * 0.9);
  });
}

function drawCutPulse(context: CanvasRenderingContext2D, plan: EditPlan | null, outputTime: number) {
  if (!plan?.timeline.length) return;

  const nearCut = plan.timeline.some(
    (item) => Math.abs(item.start - outputTime) < 0.18 && item.start > 0,
  );

  if (!nearCut) return;

  const { width, height } = context.canvas;
  context.save();
  context.strokeStyle = "rgba(142, 247, 194, 0.92)";
  context.lineWidth = Math.max(7, width * 0.008);
  context.strokeRect(0, 0, width, height);
  context.restore();
}

function drawProgress(context: CanvasRenderingContext2D, progress: number) {
  const { width, height } = context.canvas;
  const barWidth = width * 0.82;
  const barHeight = Math.max(8, height * 0.006);
  const x = (width - barWidth) / 2;
  const y = height - Math.max(32, height * 0.04);

  context.save();
  roundedRect(context, x, y, barWidth, barHeight, barHeight);
  context.fillStyle = "rgba(255, 255, 255, 0.22)";
  context.fill();
  roundedRect(context, x, y, Math.max(barHeight, barWidth * progress), barHeight, barHeight);
  context.fillStyle = "#8ef7c2";
  context.fill();
  context.restore();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  fontSize: number,
) {
  context.font = `900 ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }

    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) {
    const remaining = words.slice(lines.join(" ").split(" ").filter(Boolean).length).join(" ");
    lines.push(remaining || current);
  }

  return lines.map((line) => trimLineToWidth(context, line, maxWidth));
}

function trimLineToWidth(context: CanvasRenderingContext2D, line: string, maxWidth: number) {
  if (context.measureText(line).width <= maxWidth) return line;
  let trimmed = line;
  while (trimmed.length > 1 && context.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const resolvedRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + resolvedRadius, y);
  context.lineTo(x + width - resolvedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + resolvedRadius);
  context.lineTo(x + width, y + height - resolvedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - resolvedRadius, y + height);
  context.lineTo(x + resolvedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - resolvedRadius);
  context.lineTo(x, y + resolvedRadius);
  context.quadraticCurveTo(x, y, x + resolvedRadius, y);
  context.closePath();
}

function getRenderDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1280, height: 720 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 720, height: 1280 };
}

function getProjectDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function hasRenderableTimelineOverlays(tracks: RenderTimelineTrack[]) {
  return getRenderableTimelineLayers(tracks).length > 0 || hasRenderBackgroundLayers(tracks);
}

function getRenderableTimelineLayers(tracks: RenderTimelineTrack[]) {
  return tracks
    .flatMap((track) => track.layers)
    .filter((layer) => {
      if (!["text", "caption", "image", "shape"].includes(layer.type)) return false;
      if ((layer.type === "text" || layer.type === "caption") && !layer.content?.trim()) return false;
      if (layer.type === "image" && !layer.src) return false;
      return layer.duration > 0;
    });
}

function hasRenderBackgroundLayers(tracks: RenderTimelineTrack[]) {
  return tracks
    .flatMap((track) => track.layers)
    .some((layer) => layer.type === "background" && layer.duration > 0);
}

function getActiveRenderBackgroundLayer(tracks: RenderTimelineTrack[], time: number) {
  return tracks
    .flatMap((track) => track.layers)
    .find(
      (layer) =>
        layer.type === "background" &&
        layer.start <= time &&
        layer.start + layer.duration >= time,
    );
}

function getAudioEnhancementSettings(tracks: RenderTimelineTrack[]): AudioEnhancementSettings {
  const labels = tracks
    .flatMap((track) => track.layers)
    .filter((layer) => layer.type === "effect" || layer.type === "audio")
    .map((layer) => `${layer.name} ${layer.content ?? ""}`.toLowerCase());

  const has = (patterns: string[]) => labels.some((label) => patterns.some((pattern) => label.includes(pattern)));
  const fullChain = has(["audio cleanup chain", "audio enhancement chain"]);
  const noiseReduction = fullChain || has(["noise reduction", "noise"]);
  const voiceEnhancement = fullChain || has(["voice enhancement", "voice"]);
  const echoReduction = fullChain || has(["echo reduction", "echo"]);
  const volumeLeveling = fullChain || has(["auto volume leveling", "volume leveling", "leveling"]);

  return {
    enabled: noiseReduction || voiceEnhancement || echoReduction || volumeLeveling,
    noiseReduction,
    voiceEnhancement,
    echoReduction,
    volumeLeveling,
  };
}

async function loadTimelineOverlayImages(tracks: RenderTimelineTrack[]) {
  const sources = Array.from(
    new Set(
      getRenderableTimelineLayers(tracks)
        .filter((layer) => layer.type === "image" && layer.src)
        .map((layer) => layer.src as string),
    ),
  );
  const entries = await Promise.all(
    sources.map(async (src) => {
      try {
        return [src, await loadImage(src)] as const;
      } catch {
        return null;
      }
    }),
  );

  return new Map(entries.filter((entry): entry is readonly [string, HTMLImageElement] => Boolean(entry)));
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load overlay image."));
    image.src = src;
  });
}

function resolveRenderLayerGeometry(
  layer: RenderTimelineLayer,
  dimensions: { width: number; height: number },
) {
  const defaults = getDefaultRenderLayerGeometry(layer, dimensions);

  return {
    x: layer.x ?? defaults.x,
    y: layer.y ?? defaults.y,
    width: layer.width ?? defaults.width,
    height: layer.height ?? defaults.height,
  };
}

function getDefaultRenderLayerGeometry(
  layer: RenderTimelineLayer,
  { width, height }: { width: number; height: number },
) {
  if (layer.type === "image") {
    return {
      x: Math.round(width * 0.16),
      y: Math.round(height * 0.35),
      width: Math.round(width * 0.68),
      height: Math.round(height * 0.28),
    };
  }

  if (layer.type === "shape") {
    return {
      x: Math.round(width * 0.12),
      y: Math.round(height * 0.64),
      width: Math.round(width * 0.76),
      height: Math.round(height * 0.1),
    };
  }

  if (layer.type === "caption") {
    return {
      x: Math.round(width * 0.08),
      y: Math.round(height * 0.69),
      width: Math.round(width * 0.84),
      height: Math.round(height * 0.13),
    };
  }

  return {
    x: Math.round(width * 0.1),
    y: Math.round(height * 0.16),
    width: Math.round(width * 0.8),
    height: Math.round(height * 0.12),
  };
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawFittedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: RenderTimelineLayer["fit"],
) {
  if (fit === "fill") {
    context.drawImage(image, x, y, width, height);
    return;
  }

  if (fit !== "contain") {
    drawCoverImage(context, image, x, y, width, height);
    return;
  }

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;

  if (sourceRatio > targetRatio) {
    drawHeight = width / sourceRatio;
    drawY = y + (height - drawHeight) / 2;
  } else {
    drawWidth = height * sourceRatio;
    drawX = x + (width - drawWidth) / 2;
  }

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawRenderBackground(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  layer: RenderTimelineLayer,
) {
  const { width, height } = context.canvas;
  const background = layer.backgroundColor ?? layer.color;

  if (background === "blur-original" || layer.content === "Blur original video") {
    context.save();
    context.filter = "blur(28px) saturate(1.18) brightness(0.82)";
    const scale = Math.max(width / (video.videoWidth || width), height / (video.videoHeight || height)) * 1.16;
    const drawWidth = (video.videoWidth || width) * scale;
    const drawHeight = (video.videoHeight || height) * scale;
    context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    context.restore();
    context.fillStyle = "rgba(0,0,0,0.28)";
    context.fillRect(0, 0, width, height);
    return;
  }

  if (background?.startsWith("linear-gradient(")) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    const colors = extractGradientColors(background);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    return;
  }

  context.fillStyle = normalizeCanvasColor(background, "#050608");
  context.fillRect(0, 0, width, height);
}

function getBackgroundReplacementVideoFrame(width: number, height: number) {
  const marginX = Math.round(width * 0.075);
  const marginY = Math.round(height * 0.1);
  return {
    x: marginX,
    y: marginY,
    width: width - marginX * 2,
    height: height - marginY * 2,
    radius: Math.round(Math.min(width, height) * 0.045),
  };
}

function drawVideoContain(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  x: number,
  y: number,
  width: number,
  height: number,
  zoom: number,
) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight) * Math.max(1, Math.min(1.04, zoom));
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.fillStyle = "rgba(0,0,0,0.42)";
  context.fillRect(x, y, width, height);
  context.drawImage(video, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function extractGradientColors(value: string): [string, string] {
  const matches = value.match(/#[0-9a-f]{6}|rgba?\([^)]*\)/gi);
  return [
    matches?.[0] ?? "#050608",
    matches?.[1] ?? matches?.[0] ?? "#111827",
  ];
}

function normalizeCanvasColor(value: string | undefined, fallback: string) {
  if (!value || value.includes("{{")) return fallback;
  if (value === "transparent" || value.startsWith("rgba(") || value.startsWith("rgb(")) return value;
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  return fallback;
}

function getCanvasFilter(styleId: VideoStyle["id"]) {
  const filters: Record<VideoStyle["id"], string> = {
    "viral-saudi": "contrast(1.18) saturate(1.28) brightness(1.04)",
    "premium-brand": "contrast(1.12) saturate(0.92) brightness(0.98) sepia(0.12)",
    "podcast-cuts": "contrast(1.08) saturate(1.04) brightness(1.03)",
    "product-drop": "contrast(1.12) saturate(1.32) brightness(1.05)",
    educational: "contrast(1.07) saturate(1.08) brightness(1.05)",
    "restaurant-ad": "contrast(1.14) saturate(1.38) brightness(1.04)",
  };

  return filters[styleId];
}

function getPlaybackRate(pace: VideoStyle["pace"]) {
  const rates: Record<VideoStyle["pace"], number> = {
    calm: 0.98,
    balanced: 1.06,
    fast: 1.12,
    aggressive: 1.18,
  };

  return rates[pace];
}

function getMotionAmount(pace: VideoStyle["pace"]) {
  const motion: Record<VideoStyle["pace"], number> = {
    calm: 0.012,
    balanced: 0.022,
    fast: 0.035,
    aggressive: 0.052,
  };

  return motion[pace];
}

function pickRecorderMimeType() {
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function connectAudioToStream(
  video: HTMLVideoElement,
  stream: MediaStream,
  enhancement: AudioEnhancementSettings,
) {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return null;

  try {
    const context = new AudioContextConstructor();
    const source = context.createMediaElementSource(video);
    const destination = context.createMediaStreamDestination();
    const nodes = enhancement.enabled ? createAudioEnhancementNodes(context, enhancement) : [];
    let currentNode: AudioNode = source;

    for (const node of nodes) {
      currentNode.connect(node);
      currentNode = node;
    }

    currentNode.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

    return {
      context,
      cleanup: () => {
        source.disconnect();
        nodes.forEach((node) => node.disconnect());
        destination.disconnect();
      },
    };
  } catch {
    return null;
  }
}

function createAudioEnhancementNodes(
  context: AudioContext,
  enhancement: AudioEnhancementSettings,
) {
  const nodes: AudioNode[] = [];

  if (enhancement.noiseReduction) {
    const highPass = context.createBiquadFilter();
    highPass.type = "highpass";
    highPass.frequency.value = 85;
    highPass.Q.value = 0.72;
    nodes.push(highPass);

    const lowPass = context.createBiquadFilter();
    lowPass.type = "lowpass";
    lowPass.frequency.value = 12_500;
    lowPass.Q.value = 0.58;
    nodes.push(lowPass);
  }

  if (enhancement.voiceEnhancement) {
    const presence = context.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2_600;
    presence.Q.value = 0.92;
    presence.gain.value = 3.2;
    nodes.push(presence);

    const warmth = context.createBiquadFilter();
    warmth.type = "lowshelf";
    warmth.frequency.value = 180;
    warmth.gain.value = -1.4;
    nodes.push(warmth);
  }

  if (enhancement.echoReduction || enhancement.volumeLeveling) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = enhancement.echoReduction ? -32 : -24;
    compressor.knee.value = enhancement.echoReduction ? 18 : 24;
    compressor.ratio.value = enhancement.echoReduction ? 8 : 5;
    compressor.attack.value = 0.006;
    compressor.release.value = enhancement.echoReduction ? 0.18 : 0.24;
    nodes.push(compressor);
  }

  if (enhancement.volumeLeveling) {
    const gain = context.createGain();
    gain.gain.value = 1.08;
    nodes.push(gain);
  }

  return nodes;
}

function waitForVideoEvent(video: HTMLVideoElement, eventName: keyof HTMLMediaElementEventMap) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, handleEvent);
      video.removeEventListener("error", handleError);
    };

    const handleEvent = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("تعذر تحميل بيانات الفيديو."));
    };

    video.addEventListener(eventName, handleEvent, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });
}

function waitForRecorderStop(recorder: MediaRecorder) {
  return new Promise<void>((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => reject(new Error("تعذر تصدير الفيديو.")), {
      once: true,
    });
  });
}

function safeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  const safeName = withoutExtension
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return safeName || "mawj-video";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
