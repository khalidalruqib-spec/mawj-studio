import type { EditPlan } from "@/lib/edit-plan";
import { trimVideoWithFFmpeg, type FFmpegCut } from "@/lib/ffmpeg-renderer";
import { resolveMediaDuration } from "@/lib/media-duration";
import type { AspectRatio, VideoStyle } from "@/lib/video-styles";
import type { TemplateAnimation } from "@/lib/video-template-engine";

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
  timelineLayers?: BrowserTimelineLayer[];
  onProgress?: (progress: BrowserRenderProgress) => void;
};

export type BrowserTimelineLayer = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "caption" | "effect" | "shape" | "background" | "waveform";
  name: string;
  start: number;
  duration: number;
  color?: string;
  content?: string;
  src?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  textColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  align?: "left" | "center" | "right";
  direction?: "ltr" | "rtl" | "auto";
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  opacity?: number;
  fit?: "cover" | "contain" | "fill";
  animationIn?: TemplateAnimation;
  animationOut?: TemplateAnimation;
  hidden?: boolean;
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
  timelineLayers = [],
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
  const renderLayers = getRenderableTimelineLayers(timelineLayers);

  if (sourceFile && ffmpegCuts.length > 0 && !renderLayers.length) {
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
  const desiredSourceSeconds = Math.max(4, Math.min(plan?.targetDurationSeconds ?? realDuration, 60));
  const sourceSeconds = Math.min(realDuration, desiredSourceSeconds);
  const outputSeconds = sourceSeconds / playbackRate;
  const overlayAssets = await loadTimelineOverlayAssets(renderLayers);

  const canvasStream = canvas.captureStream(FPS);
  const stream = new MediaStream(canvasStream.getVideoTracks());
  const audio = connectAudioToStream(video, stream);
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

    video.currentTime = 0;
    video.playbackRate = playbackRate;
    drawEditedFrame(context, video, {
      style,
      brandName,
      plan,
      timelineLayers: renderLayers,
      overlayAssets,
      outputTime: 0,
      outputSeconds,
      aspectRatio,
    });

    recorder.start(250);
    await video.play();

    await new Promise<void>((resolve, reject) => {
      let animationFrame = 0;
      const tick = () => {
        if (video.error) {
          reject(new Error("تعذر قراءة الفيديو أثناء الرندر."));
          return;
        }

        const elapsedSourceSeconds = Math.max(0, video.currentTime);
        const elapsedOutputSeconds = Math.min(outputSeconds, elapsedSourceSeconds / playbackRate);

        drawEditedFrame(context, video, {
          style,
          brandName,
          plan,
          timelineLayers: renderLayers,
          overlayAssets,
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

        if (elapsedSourceSeconds >= sourceSeconds || video.ended) {
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
    audio?.source.disconnect();
    audio?.destination.disconnect();
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

function getRenderableTimelineLayers(layers: BrowserTimelineLayer[]) {
  return layers.filter((layer) => {
    if (layer.hidden) return false;
    if (layer.duration <= 0) return false;
    if (layer.type === "image") return Boolean(layer.src);
    if (layer.type === "shape") return true;
    if (layer.type === "text") return Boolean(layer.content?.trim());
    if (layer.type === "caption") return Boolean(layer.content?.trim());
    return false;
  });
}

async function loadTimelineOverlayAssets(layers: BrowserTimelineLayer[]) {
  const assets = new Map<string, HTMLImageElement>();
  const sources = Array.from(
    new Set(
      layers
        .filter((layer) => layer.type === "image" && layer.src)
        .map((layer) => layer.src as string),
    ),
  );

  await Promise.all(
    sources.map(async (src) => {
      try {
        const image = await loadImage(src);
        assets.set(src, image);
      } catch {
        // Keep rendering the rest of the video if a non-critical overlay image fails.
      }
    }),
  );

  return assets;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load overlay image: ${src}`));
    image.src = src;
  });
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
    timelineLayers,
    overlayAssets,
    outputTime,
    outputSeconds,
    aspectRatio,
  }: {
    style: VideoStyle;
    brandName: string;
    plan: EditPlan | null;
    timelineLayers: BrowserTimelineLayer[];
    overlayAssets: Map<string, HTMLImageElement>;
    outputTime: number;
    outputSeconds: number;
    aspectRatio: AspectRatio;
  },
) {
  const { width, height } = context.canvas;
  const videoWidth = video.videoWidth || width;
  const videoHeight = video.videoHeight || height;
  const motion = getMotionAmount(style.pace);
  const zoom = 1.035 + motion * Math.sin(outputTime * 1.45);
  const drawScale = Math.max(width / videoWidth, height / videoHeight) * zoom;
  const drawWidth = videoWidth * drawScale;
  const drawHeight = videoHeight * drawScale;
  const panX = Math.sin(outputTime * 0.72) * width * motion * 0.24;
  const panY = Math.cos(outputTime * 0.48) * height * motion * 0.08;
  const drawX = (width - drawWidth) / 2 + panX;
  const drawY = (height - drawHeight) / 2 + panY;

  context.save();
  context.fillStyle = "#050608";
  context.fillRect(0, 0, width, height);
  context.filter = getCanvasFilter(style.id);
  context.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  context.restore();

  drawStyleWash(context, style.id);
  drawTopChrome(context, brandName, style.arabicName);
  drawCutPulse(context, plan, outputTime);
  drawHook(context, plan, outputTime, aspectRatio);
  drawCaption(context, getCaptionForTime(plan, outputTime, style.arabicName), aspectRatio);
  drawTimelineOverlays(context, timelineLayers, overlayAssets, outputTime, aspectRatio);
  drawProgress(context, Math.min(1, outputTime / outputSeconds));
}

function drawTimelineOverlays(
  context: CanvasRenderingContext2D,
  layers: BrowserTimelineLayer[],
  assets: Map<string, HTMLImageElement>,
  outputTime: number,
  aspectRatio: AspectRatio,
) {
  const design = getDesignDimensions(aspectRatio);
  const scaleX = context.canvas.width / design.width;
  const scaleY = context.canvas.height / design.height;

  for (const layer of layers) {
    if (outputTime < layer.start || outputTime > layer.start + layer.duration) continue;

    const x = (layer.x ?? 0) * scaleX;
    const y = (layer.y ?? 0) * scaleY;
    const width = (layer.width ?? design.width) * scaleX;
    const height = (layer.height ?? Math.max(120, design.height * 0.08)) * scaleY;
    const radius = Math.max(0, (layer.borderRadius ?? 0) * Math.min(scaleX, scaleY));
    const animation = getTimelineLayerAnimationFrame(layer, outputTime, context.canvas.width, context.canvas.height);

    context.save();
    context.globalAlpha *= (layer.opacity ?? 1) * animation.opacity;
    applyTimelineLayerTransform(context, x, y, width, height, {
      translateX: animation.translateX,
      translateY: animation.translateY,
      scale: animation.scale,
      rotation: layer.rotation ?? 0,
    });

    if (layer.type === "image" && layer.src) {
      const image = assets.get(layer.src);
      if (image) drawImageFitted(context, image, x, y, width, height, radius, layer.fit ?? "cover");
    } else if (layer.type === "shape") {
      roundedRect(context, x, y, width, height, radius);
      context.fillStyle = layer.backgroundColor ?? layer.color ?? "rgba(255,255,255,0.16)";
      context.fill();
    } else if (layer.type === "text" || layer.type === "caption") {
      drawTimelineTextLayer(context, layer, x, y, width, height, Math.min(scaleX, scaleY));
    }

    context.restore();
  }
}

function applyTimelineLayerTransform(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  transform: { translateX: number; translateY: number; scale: number; rotation: number },
) {
  if (!transform.translateX && !transform.translateY && transform.scale === 1 && !transform.rotation) return;

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  context.translate(centerX + transform.translateX, centerY + transform.translateY);
  if (transform.rotation) context.rotate((transform.rotation * Math.PI) / 180);
  if (transform.scale !== 1) context.scale(transform.scale, transform.scale);
  context.translate(-centerX, -centerY);
}

function getTimelineLayerAnimationFrame(
  layer: BrowserTimelineLayer,
  outputTime: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const relativeTime = outputTime - layer.start;
  let opacity = 1;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  const applyAnimation = (type: string, progress: number, direction: "in" | "out") => {
    const eased = easeOut(progress);
    const inverse = 1 - eased;
    const amount = direction === "in" ? inverse : eased;

    if (type === "fadeIn" || type === "fadeOut") opacity *= direction === "in" ? eased : 1 - eased;
    if (type === "slideUp") translateY += direction === "in" ? amount * canvasHeight * 0.18 : -amount * canvasHeight * 0.18;
    if (type === "slideDown") translateY += direction === "in" ? -amount * canvasHeight * 0.18 : amount * canvasHeight * 0.18;
    if (type === "slideLeft") translateX += direction === "in" ? amount * canvasWidth * 0.22 : -amount * canvasWidth * 0.22;
    if (type === "slideRight") translateX += direction === "in" ? -amount * canvasWidth * 0.22 : amount * canvasWidth * 0.22;
    if (type === "zoomIn") scale *= direction === "in" ? 0.72 + eased * 0.28 : 1 + eased * 0.24;
    if (type === "zoomOut") scale *= direction === "in" ? 1.24 - eased * 0.24 : 1 - eased * 0.24;
    if (type === "pop") scale *= direction === "in" ? 0.68 + eased * 0.32 : 1 - eased * 0.18;
    if (type === "bounce") scale *= 1 + Math.sin(progress * Math.PI * 2.5) * 0.08 * (1 - progress);
  };

  if (layer.animationIn?.duration && relativeTime < layer.animationIn.duration) {
    applyAnimation(layer.animationIn.type, Math.max(0, Math.min(1, relativeTime / layer.animationIn.duration)), "in");
  }

  const outDuration = layer.animationOut?.duration ?? 0;
  const outStart = layer.duration - outDuration;
  if (outDuration && relativeTime > outStart) {
    applyAnimation(layer.animationOut?.type ?? "fadeOut", Math.max(0, Math.min(1, (relativeTime - outStart) / outDuration)), "out");
  }

  return { opacity, translateX, translateY, scale };
}

function easeOut(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function drawTimelineTextLayer(
  context: CanvasRenderingContext2D,
  layer: BrowserTimelineLayer,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
) {
  const text = layer.content ?? layer.name;
  if (!text.trim()) return;

  const fontSize = Math.max(18, (layer.fontSize ?? 52) * scale);
  const fontWeight = normalizeRenderFontWeight(layer.fontWeight);
  const fontFamily = layer.fontFamily?.includes("var(")
    ? '"IBM Plex Sans Arabic", "Cairo", Tahoma, Arial, sans-serif'
    : layer.fontFamily || '"IBM Plex Sans Arabic", "Cairo", Tahoma, Arial, sans-serif';
  const radius = Math.max(0, (layer.borderRadius ?? 0) * scale);

  context.save();
  if (layer.backgroundColor) {
    roundedRect(context, x, y, width, height, radius);
    context.fillStyle = layer.backgroundColor;
    context.fill();
  }

  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  context.textAlign = layer.align ?? "center";
  context.textBaseline = "middle";
  context.direction = layer.direction === "ltr" ? "ltr" : "rtl";
  context.fillStyle = layer.textColor ?? layer.color ?? "#ffffff";

  const padding = layer.padding === undefined ? width * 0.05 : Math.max(0, layer.padding * scale);
  const maxWidth = Math.max(fontSize * 2, width - padding * 2);
  const lines = wrapText(context, text, maxWidth, 3, fontSize);
  const lineHeight = fontSize * (layer.lineHeight ?? 1.2);
  const startY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const textX = layer.align === "left" ? x + padding : layer.align === "right" ? x + width - padding : x + width / 2;
  const strokeWidth = getRenderTextStrokeWidth(layer, fontSize, scale);

  context.save();
  context.shadowColor = layer.textShadowColor ?? "rgba(0,0,0,0.72)";
  context.shadowBlur = Math.max(0, (layer.textShadowBlur ?? 0) * scale);
  context.shadowOffsetX = (layer.textShadowOffsetX ?? 0) * scale;
  context.shadowOffsetY = (layer.textShadowOffsetY ?? 0) * scale;
  for (const [index, line] of lines.entries()) {
    const lineY = startY + index * lineHeight;
    if (strokeWidth > 0) {
      context.lineWidth = strokeWidth;
      context.strokeStyle = layer.textStrokeColor ?? "rgba(0,0,0,0.52)";
      context.strokeText(line, textX, lineY, maxWidth);
    }
    context.fillText(line, textX, lineY, maxWidth);
  }
  context.restore();

  context.restore();
}

function getRenderTextStrokeWidth(layer: BrowserTimelineLayer, fontSize: number, scale: number) {
  if (layer.textStrokeWidth !== undefined) return Math.max(0, layer.textStrokeWidth * scale);
  return Math.max(4, fontSize * 0.08);
}

function drawImageFitted(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 0,
  fit: "cover" | "contain" | "fill" = "cover",
) {
  context.save();
  context.beginPath();
  if (radius > 0) {
    roundedRect(context, x, y, width, height, radius);
  } else {
    context.rect(x, y, width, height);
  }
  context.clip();

  if (fit === "fill") {
    context.drawImage(image, x, y, width, height);
    context.restore();
    return;
  }

  const scale = fit === "cover"
    ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
    : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  context.restore();
}

function normalizeRenderFontWeight(weight?: string) {
  if (!weight) return 900;
  if (weight === "bold") return 900;
  if (weight === "normal") return 500;
  const numeric = Number(weight);
  return Number.isFinite(numeric) ? numeric : weight;
}

function getDesignDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
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

function connectAudioToStream(video: HTMLVideoElement, stream: MediaStream) {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) return null;

  try {
    const context = new AudioContextConstructor();
    const source = context.createMediaElementSource(video);
    const destination = context.createMediaStreamDestination();
    source.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    return { context, source, destination };
  } catch {
    return null;
  }
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
