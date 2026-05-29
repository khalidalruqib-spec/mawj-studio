import type {
  TemplateProject,
  TemplateTimelineLayer,
  TemplateTimelineTrack,
} from "@/lib/video-template-engine";
import type {
  BrowserRenderProgress,
  BrowserRenderResult,
} from "@/lib/browser-video-renderer";
import { resolveLayerFilter } from "@/lib/layer-filters";
import {
  TEMPLATE_FONT_PRESET_INPUT_KEY,
  normalizeTemplateFontWeight,
  resolveLayerFontFamily,
} from "@/lib/template-typography";

const FPS = 30;

type TemplateRenderOptions = {
  project: TemplateProject;
  onProgress?: (progress: BrowserRenderProgress) => void;
};

type LoadedAsset = HTMLImageElement | HTMLVideoElement;

export async function renderTemplateProject({
  project,
  onProgress,
}: TemplateRenderOptions): Promise<BrowserRenderResult> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Template rendering works in the browser only.");
  }

  if (!window.MediaRecorder) {
    throw new Error("This browser does not support video export. Try Chrome or Edge.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;

  const context = canvas.getContext("2d");
  if (!context || !canvas.captureStream) {
    throw new Error("Could not prepare template canvas renderer.");
  }

  const assets = await loadTemplateAssets(project.timeline);
  const stream = canvas.captureStream(FPS);
  const mimeType = pickRecorderMimeType();
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: project.aspectRatio === "9:16" ? 6_500_000 : 5_500_000,
  });

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const stopped = waitForRecorderStop(recorder);
  const startedAt = performance.now();
  const duration = Math.max(1, project.duration);

  recorder.start(250);

  await playVideoAssets(assets);

  await new Promise<void>((resolve) => {
    let animationFrame = 0;

    const tick = () => {
      const elapsed = Math.min(duration, (performance.now() - startedAt) / 1000);
      drawTemplateFrame(context, project, assets, elapsed);

      onProgress?.({
        percent: Math.min(99, Math.round((elapsed / duration) * 100)),
        label: "Rendering template project",
        elapsedSeconds: elapsed,
        outputSeconds: duration,
      });

      if (elapsed >= duration) {
        cancelAnimationFrame(animationFrame);
        resolve();
        return;
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
  });

  if (recorder.state !== "inactive") recorder.stop();
  await stopped;
  stopVideoAssets(assets);
  stream.getTracks().forEach((track) => track.stop());

  const resolvedMimeType = mimeType || "video/webm";
  const extension = resolvedMimeType.includes("mp4") ? "mp4" : "webm";
  const blob = new Blob(chunks, { type: resolvedMimeType });

  onProgress?.({
    percent: 100,
    label: "Template video ready",
    elapsedSeconds: duration,
    outputSeconds: duration,
  });

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName: `${safeFileName(project.name)}.${extension}`,
    mimeType: resolvedMimeType,
    durationSeconds: Math.round(duration),
    resolution: `${project.width}x${project.height}`,
  };
}

function drawTemplateFrame(
  context: CanvasRenderingContext2D,
  project: TemplateProject,
  assets: Map<string, LoadedAsset>,
  time: number,
) {
  context.clearRect(0, 0, project.width, project.height);
  context.fillStyle = "#050608";
  context.fillRect(0, 0, project.width, project.height);

  const activeLayers = project.timeline
    .flatMap((track) => track.layers)
    .filter((layer) => isLayerActive(layer, time))
    .sort((left, right) => getLayerZIndex(left.type) - getLayerZIndex(right.type));

  for (const layer of activeLayers) {
    drawLayer(context, layer, assets, time, project.inputs[TEMPLATE_FONT_PRESET_INPUT_KEY]);
  }
}

function drawLayer(
  context: CanvasRenderingContext2D,
  layer: TemplateTimelineLayer,
  assets: Map<string, LoadedAsset>,
  time: number,
  presetId?: string,
) {
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;
  const width = layer.width ?? context.canvas.width;
  const height = layer.height ?? context.canvas.height;
  const opacity = getAnimatedOpacity(layer, time);
  const transform = getLayerTransform(layer, time);
  const rotation = ((layer.rotation ?? 0) * Math.PI) / 180;

  context.save();
  context.globalAlpha = opacity * (layer.opacity ?? 1);

  // Apply transform for slide/zoom/pop/bounce animations and manual rotation.
  if (transform.tx !== 0 || transform.ty !== 0 || transform.scale !== 1 || rotation !== 0) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    context.translate(cx + transform.tx, cy + transform.ty);
    if (rotation !== 0) context.rotate(rotation);
    context.scale(transform.scale, transform.scale);
    context.translate(-cx, -cy);
  }

  if (layer.type === "background") {
    drawBackgroundLayer(context, layer);
  } else if (layer.type === "shape") {
    roundedRect(context, x, y, width, height, layer.borderRadius ?? 0);
    context.fillStyle = layer.color ?? layer.backgroundColor ?? "rgba(255,255,255,0.16)";
    context.fill();
  } else if (layer.type === "image" || layer.type === "video") {
    const asset = layer.src ? assets.get(layer.src) : null;
    if (asset) {
      context.filter = resolveLayerFilter(layer) ?? "none";
      drawMedia(context, asset, x, y, width, height, layer.fit ?? "cover", layer.borderRadius ?? 0, {
        zoom: layer.mediaZoom,
        offsetX: layer.mediaOffsetX,
        offsetY: layer.mediaOffsetY,
      });
      context.filter = "none";
    } else {
      drawMissingMedia(context, x, y, width, height, layer.type);
    }
  } else if (layer.type === "text" || layer.type === "captions") {
    drawTextLayer(context, layer, time, presetId);
  } else if (layer.type === "waveform") {
    drawWaveform(context, layer, time);
  }

  context.restore();
}

function drawBackgroundLayer(context: CanvasRenderingContext2D, layer: TemplateTimelineLayer) {
  const w = context.canvas.width;
  const h = context.canvas.height;

  // Gradient background
  const layerAny = layer as Record<string, unknown>;
  const fromColor = layer.gradientFrom ?? (typeof layerAny["from"] === "string" ? layerAny["from"] : undefined);
  const toColor   = layer.gradientTo   ?? (typeof layerAny["to"]   === "string" ? layerAny["to"]   : undefined);

  if (fromColor && toColor && !fromColor.includes("{{") && !toColor.includes("{{")) {
    const rawAngle = typeof layerAny["angle"] === "number" ? layerAny["angle"] : 145;
    const angle = rawAngle * (Math.PI / 180);
    const x0 = w / 2 - Math.cos(angle) * w / 2;
    const y0 = h / 2 - Math.sin(angle) * h / 2;
    const x1 = w / 2 + Math.cos(angle) * w / 2;
    const y1 = h / 2 + Math.sin(angle) * h / 2;
    const grad = context.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, fromColor);
    grad.addColorStop(1, toColor);
    context.fillStyle = grad;
    context.fillRect(0, 0, w, h);
    return;
  }

  const color = layer.backgroundColor ?? layer.color ?? "#111827";
  context.fillStyle = color.includes("{{") ? "#111827" : color;
  context.fillRect(0, 0, w, h);
}

/** Returns {tx, ty, scale} for the in-animation at this moment */
function getLayerTransform(layer: TemplateTimelineLayer, time: number) {
  const relTime = time - layer.absoluteStart;
  const animIn  = layer.animationIn;
  const animOut = layer.animationOut;

  // Default — no transform
  let tx = 0, ty = 0, scale = 1;

  if (animIn?.duration && relTime < animIn.duration) {
    const progress = Math.max(0, Math.min(1, relTime / animIn.duration));
    const ease = easeOut(progress);
    const invEase = 1 - ease;
    const canvas = { w: 1080, h: 1920 }; // typical 9:16; safe to over-travel

    switch (animIn.type) {
      case "slideUp":
        ty = invEase * canvas.h * 0.18;
        break;
      case "slideDown":
        ty = -invEase * canvas.h * 0.18;
        break;
      case "slideLeft":
        tx = invEase * canvas.w * 0.25;
        break;
      case "slideRight":
        tx = -invEase * canvas.w * 0.25;
        break;
      case "zoomIn":
        scale = 0.7 + ease * 0.3;
        break;
      case "zoomOut":
        scale = 1.3 - ease * 0.3;
        break;
      case "pop":
        scale = progress < 0.6
          ? 0.5 + (progress / 0.6) * 0.6  // grow fast
          : 1.1 - ((progress - 0.6) / 0.4) * 0.1; // slight overshoot settle
        break;
      case "bounce":
        scale = 1 + Math.sin(progress * Math.PI * 2.5) * 0.08 * (1 - progress);
        break;
      case "blurReveal":
        // Blur is not directly doable on canvas without a filter — simulate with scale
        scale = 0.92 + ease * 0.08;
        break;
      case "rotateIn":
        // Approximate — canvas rotate is global; skip per-layer rotation for now
        scale = 0.7 + ease * 0.3;
        break;
    }
    return { tx, ty, scale };
  }

  // Animate out transforms (simple zoom out for exit)
  const outStart = layer.duration - (animOut?.duration ?? 0);
  if (animOut?.duration && relTime > outStart) {
    const progress = Math.max(0, Math.min(1, (relTime - outStart) / animOut.duration));
    if (animOut.type === "zoomOut") scale = 1 - progress * 0.3;
    if (animOut.type === "slideUp") ty = -easeOut(progress) * 200;
    if (animOut.type === "slideDown") ty = easeOut(progress) * 200;
  }

  return { tx, ty, scale };
}

/** Cubic ease-out */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function drawTextLayer(
  context: CanvasRenderingContext2D,
  layer: TemplateTimelineLayer,
  time: number,
  presetId?: string,
) {
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;
  const width = layer.width ?? context.canvas.width;
  const height = layer.height ?? 120;
  const fontSize = layer.fontSize ?? 48;
  const fontWeight = normalizeTemplateFontWeight(layer.fontWeight);
  const fontFamily = resolveLayerFontFamily({ layer, presetId, canvas: true });
  const padding = layer.padding ?? width * 0.04;

  context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const rawText = resolveTemplateTextForRender(layer, time);
  const maxTextWidth = Math.max(fontSize * 2, width - padding * 2);
  const lines = wrapText(context, rawText, maxTextWidth, fontSize);
  const lineHeight = fontSize * (layer.lineHeight ?? 1.22);

  context.textAlign = layer.align ?? "center";
  context.textBaseline = "middle";
  context.direction = layer.direction === "ltr" ? "ltr" : "rtl";
  context.fillStyle = layer.color ?? "#ffffff";

  const textX = layer.align === "left" ? x + padding : layer.align === "right" ? x + width - padding : x + width / 2;
  const startY = y + Math.max(fontSize, (height - (lines.length - 1) * lineHeight) / 2);
  const shouldDrawPlaceholder = layer.type === "captions" && isAutoCaptionPlaceholder(layer);

  if (layer.backgroundColor && !layer.backgroundColor.includes("{{") && !shouldDrawPlaceholder) {
    context.save();
    context.globalAlpha *= 0.94;
    context.fillStyle = layer.backgroundColor;
    roundedRect(context, x, y, width, height, Math.min(48, layer.borderRadius ?? 28));
    context.fill();
    context.restore();
  }

  if (shouldDrawPlaceholder) {
    const pillPadding = Math.max(22, fontSize * 0.42);
    const pillHeight = Math.min(height, Math.max(fontSize * 1.9, lines.length * lineHeight + pillPadding));
    const pillY = y + (height - pillHeight) / 2;

    context.save();
    context.globalAlpha *= 0.94;
    context.fillStyle = "rgba(3, 7, 18, 0.62)";
    roundedRect(context, x, pillY, width, pillHeight, Math.min(34, layer.borderRadius ?? 28));
    context.fill();
    context.strokeStyle = "rgba(255,255,255,0.18)";
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  }

  for (const [index, line] of lines.entries()) {
    const strokeWidth = getTemplateTextStrokeWidth(layer, fontSize);
    context.save();
    context.shadowColor = layer.textShadowColor ?? "rgba(0,0,0,0.72)";
    context.shadowBlur = Math.max(0, layer.textShadowBlur ?? 0);
    context.shadowOffsetX = layer.textShadowOffsetX ?? 0;
    context.shadowOffsetY = layer.textShadowOffsetY ?? 0;

    if (strokeWidth > 0) {
      context.lineWidth = strokeWidth;
      context.strokeStyle = layer.textStrokeColor ?? "rgba(0,0,0,0.42)";
      context.strokeText(line, textX, startY + index * lineHeight, maxTextWidth);
    }
    context.fillText(line, textX, startY + index * lineHeight, maxTextWidth);
    context.restore();
  }
}

function getTemplateTextStrokeWidth(layer: TemplateTimelineLayer, fontSize: number) {
  if (layer.textStrokeWidth !== undefined) return Math.max(0, layer.textStrokeWidth);
  return Math.max(4, fontSize * 0.08);
}

function resolveTemplateTextForRender(layer: TemplateTimelineLayer, time: number) {
  const rawText = layer.content ?? layer.name ?? "";
  const hasResolvedText = rawText.trim() && !rawText.includes("{{");
  const baseText = hasResolvedText
    ? rawText
    : layer.type === "captions"
      ? "[ captions appear here ]"
      : rawText.replace(/\{\{(.*?)\}\}/g, (_, key: string) => key.trim());

  if (layer.animationIn?.type !== "typewriter") return baseText;

  const relativeTime = Math.max(0, time - layer.absoluteStart - (layer.animationIn.delay ?? 0));
  const duration = Math.max(0.1, layer.animationIn.duration);
  const progress = Math.max(0, Math.min(1, relativeTime / duration));
  const chars = Array.from(baseText);
  const visibleCount = Math.max(1, Math.ceil(chars.length * progress));
  const cursor = progress < 1 ? "▌" : "";

  return `${chars.slice(0, visibleCount).join("")}${cursor}`;
}

function isAutoCaptionPlaceholder(layer: TemplateTimelineLayer) {
  const layerRecord = layer as TemplateTimelineLayer & { source?: string };
  const text = layer.content ?? "";

  return layer.type === "captions" && (layerRecord.source === "auto" || !text.trim() || text.includes("{{"));
}

function drawWaveform(context: CanvasRenderingContext2D, layer: TemplateTimelineLayer, time: number) {
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;
  const width = layer.width ?? 400;
  const height = layer.height ?? 100;
  const bars = 36;
  const gap = 6;
  const barWidth = Math.max(4, (width - gap * (bars - 1)) / bars);

  context.fillStyle = layer.color ?? "#8ef7c2";
  for (let index = 0; index < bars; index++) {
    const wave = 0.35 + Math.abs(Math.sin(time * 3 + index * 0.55)) * 0.65;
    const barHeight = height * wave;
    roundedRect(
      context,
      x + index * (barWidth + gap),
      y + (height - barHeight) / 2,
      barWidth,
      barHeight,
      barWidth / 2,
    );
    context.fill();
  }
}

async function loadTemplateAssets(timeline: TemplateTimelineTrack[]) {
  const sources = new Set(
    timeline
      .flatMap((track) => track.layers)
      .filter((layer) => (layer.type === "image" || layer.type === "video") && layer.src && !layer.src.includes("{{"))
      .map((layer) => layer.src as string),
  );
  const assets = new Map<string, LoadedAsset>();

  await Promise.all(
    [...sources].map(async (src) => {
      try {
        assets.set(src, await loadAsset(src));
      } catch {
        // The renderer draws a placeholder for missing local assets.
      }
    }),
  );

  return assets;
}

function loadAsset(src: string): Promise<LoadedAsset> {
  return new Promise((resolve, reject) => {
    if (src.startsWith("blob:") || src.startsWith("data:") || /\.(png|jpe?g|webp|gif|svg)$/i.test(src)) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
      return;
    }

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.onloadeddata = () => resolve(video);
    video.onerror = reject;
    video.src = src;
  });
}

async function playVideoAssets(assets: Map<string, LoadedAsset>) {
  await Promise.all(
    [...assets.values()].map(async (asset) => {
      if (asset instanceof HTMLVideoElement) {
        asset.currentTime = 0;
        await asset.play().catch(() => undefined);
      }
    }),
  );
}

function stopVideoAssets(assets: Map<string, LoadedAsset>) {
  for (const asset of assets.values()) {
    if (asset instanceof HTMLVideoElement) asset.pause();
  }
}

function drawMedia(
  context: CanvasRenderingContext2D,
  asset: LoadedAsset,
  x: number,
  y: number,
  width: number,
  height: number,
  fit: "cover" | "contain" | "fill",
  borderRadius = 0,
  framing: { zoom?: number; offsetX?: number; offsetY?: number } = {},
) {
  const sourceWidth = asset instanceof HTMLVideoElement ? asset.videoWidth : asset.naturalWidth;
  const sourceHeight = asset instanceof HTMLVideoElement ? asset.videoHeight : asset.naturalHeight;

  context.save();
  context.beginPath();
  if (borderRadius > 0) {
    roundedRect(context, x, y, width, height, borderRadius);
  } else {
    context.rect(x, y, width, height);
  }
  context.clip();

  if (!sourceWidth || !sourceHeight || fit === "fill") {
    const rect = resolveMediaDrawRect(x, y, width, height, width, height, framing);
    context.drawImage(asset, rect.x, rect.y, rect.width, rect.height);
    context.restore();
    return;
  }

  const zoom = Math.max(0.2, framing.zoom ?? 1);
  const scale = (fit === "cover" ? Math.max(width / sourceWidth, height / sourceHeight) : Math.min(width / sourceWidth, height / sourceHeight)) * zoom;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const rect = resolveMediaDrawRect(x, y, width, height, drawWidth, drawHeight, framing);
  context.drawImage(asset, rect.x, rect.y, rect.width, rect.height);
  context.restore();
}

function resolveMediaDrawRect(
  x: number,
  y: number,
  frameWidth: number,
  frameHeight: number,
  drawWidth: number,
  drawHeight: number,
  framing: { zoom?: number; offsetX?: number; offsetY?: number },
) {
  const zoom = Math.max(0.2, framing.zoom ?? 1);
  const width = drawWidth * (drawWidth === frameWidth ? zoom : 1);
  const height = drawHeight * (drawHeight === frameHeight ? zoom : 1);
  const overflowX = Math.max(0, width - frameWidth);
  const overflowY = Math.max(0, height - frameHeight);
  const offsetX = Math.min(100, Math.max(-100, framing.offsetX ?? 0)) / 100;
  const offsetY = Math.min(100, Math.max(-100, framing.offsetY ?? 0)) / 100;

  return {
    x: x + (frameWidth - width) / 2 - offsetX * overflowX * 0.5,
    y: y + (frameHeight - height) / 2 - offsetY * overflowY * 0.5,
    width,
    height,
  };
}

function drawMissingMedia(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  type: "image" | "video",
) {
  context.fillStyle = "rgba(255,255,255,0.10)";
  roundedRect(context, x, y, width, height, 32);
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.24)";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "800 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(type === "image" ? "IMAGE" : "VIDEO", x + width / 2, y + height / 2);
}

function isLayerActive(layer: TemplateTimelineLayer, time: number) {
  if (layer.hidden) return false;
  return time >= layer.absoluteStart && time <= layer.absoluteStart + layer.duration;
}

function getLayerZIndex(type: TemplateTimelineLayer["type"]) {
  const order: Record<TemplateTimelineLayer["type"], number> = {
    background: 0,
    video: 1,
    image: 2,
    shape: 3,
    waveform: 4,
    text: 5,
    captions: 6,
    audio: 7,
  };

  return order[type] ?? 10;
}

function getAnimatedOpacity(layer: TemplateTimelineLayer, time: number) {
  const relativeTime = time - layer.absoluteStart;
  if (layer.animationIn?.duration && relativeTime < layer.animationIn.duration) {
    return Math.max(0, Math.min(1, relativeTime / layer.animationIn.duration));
  }

  const outStart = layer.duration - (layer.animationOut?.duration ?? 0);
  if (layer.animationOut?.duration && relativeTime > outStart) {
    return Math.max(0, Math.min(1, (layer.duration - relativeTime) / layer.animationOut.duration));
  }

  return 1;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
) {
  context.font = `800 ${fontSize}px "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif`;
  const sourceLines = text.split(/\n/g);
  const lines: string[] = [];

  for (const sourceLine of sourceLines) {
    const words = sourceLine.split(/\s+/).filter(Boolean);
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (context.measureText(candidate).width <= maxWidth || !current) {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }

    if (current) lines.push(current);
  }

  return lines.slice(0, 5);
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

function waitForRecorderStop(recorder: MediaRecorder) {
  return new Promise<void>((resolve, reject) => {
    recorder.addEventListener("stop", () => resolve(), { once: true });
    recorder.addEventListener("error", () => reject(new Error("Could not export template video.")), {
      once: true,
    });
  });
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

function safeFileName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "mawj-template";
}
