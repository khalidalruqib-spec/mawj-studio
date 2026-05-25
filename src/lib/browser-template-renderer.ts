import type {
  TemplateProject,
  TemplateTimelineLayer,
  TemplateTimelineTrack,
} from "@/lib/video-template-engine";
import type {
  BrowserRenderProgress,
  BrowserRenderResult,
} from "@/lib/browser-video-renderer";

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
    drawLayer(context, layer, assets, time);
  }
}

function drawLayer(
  context: CanvasRenderingContext2D,
  layer: TemplateTimelineLayer,
  assets: Map<string, LoadedAsset>,
  time: number,
) {
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;
  const width = layer.width ?? context.canvas.width;
  const height = layer.height ?? context.canvas.height;
  const opacity = getAnimatedOpacity(layer, time);

  context.save();
  context.globalAlpha = opacity * (layer.opacity ?? 1);

  if (layer.type === "background") {
    drawBackgroundLayer(context, layer);
  } else if (layer.type === "shape") {
    roundedRect(context, x, y, width, height, layer.borderRadius ?? 0);
    context.fillStyle = layer.color ?? layer.backgroundColor ?? "rgba(255,255,255,0.16)";
    context.fill();
  } else if (layer.type === "image" || layer.type === "video") {
    const asset = layer.src ? assets.get(layer.src) : null;
    if (asset) {
      drawMedia(context, asset, x, y, width, height, layer.fit ?? "cover");
    } else {
      drawMissingMedia(context, x, y, width, height, layer.type);
    }
  } else if (layer.type === "text" || layer.type === "captions") {
    drawTextLayer(context, layer);
  } else if (layer.type === "waveform") {
    drawWaveform(context, layer, time);
  }

  context.restore();
}

function drawBackgroundLayer(context: CanvasRenderingContext2D, layer: TemplateTimelineLayer) {
  const color = layer.backgroundColor ?? layer.color ?? "#111827";
  context.fillStyle = color.includes("{{") ? "#111827" : color;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

function drawTextLayer(context: CanvasRenderingContext2D, layer: TemplateTimelineLayer) {
  const x = layer.x ?? 0;
  const y = layer.y ?? 0;
  const width = layer.width ?? context.canvas.width;
  const height = layer.height ?? 120;
  const fontSize = layer.fontSize ?? 48;
  const fontWeight = layer.fontWeight ?? "800";
  const lines = wrapText(context, layer.content ?? layer.name ?? "", width * 0.92, fontSize);
  const lineHeight = fontSize * 1.22;

  context.font = `${fontWeight} ${fontSize}px "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif`;
  context.textAlign = layer.align ?? "center";
  context.textBaseline = "middle";
  context.direction = layer.direction === "ltr" ? "ltr" : "rtl";
  context.fillStyle = layer.color ?? "#ffffff";

  const textX = layer.align === "left" ? x + 24 : layer.align === "right" ? x + width - 24 : x + width / 2;
  const startY = y + Math.max(fontSize, (height - (lines.length - 1) * lineHeight) / 2);

  for (const [index, line] of lines.entries()) {
    context.lineWidth = Math.max(4, fontSize * 0.08);
    context.strokeStyle = "rgba(0,0,0,0.42)";
    context.strokeText(line, textX, startY + index * lineHeight, width * 0.92);
    context.fillText(line, textX, startY + index * lineHeight, width * 0.92);
  }
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
) {
  const sourceWidth = asset instanceof HTMLVideoElement ? asset.videoWidth : asset.naturalWidth;
  const sourceHeight = asset instanceof HTMLVideoElement ? asset.videoHeight : asset.naturalHeight;

  if (!sourceWidth || !sourceHeight || fit === "fill") {
    context.drawImage(asset, x, y, width, height);
    return;
  }

  const scale = fit === "cover" ? Math.max(width / sourceWidth, height / sourceHeight) : Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(asset, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
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
