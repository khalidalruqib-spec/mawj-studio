export type TimelineCanvasLayer = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "caption" | "effect" | "shape" | "background" | "waveform";
  name: string;
  start: number;
  duration: number;
  color: string;
  muted?: boolean;
  locked?: boolean;
  hidden?: boolean;
};

export type TimelineCanvasTrack = {
  id: string;
  name: string;
  kind:
    | "video"
    | "audio"
    | "overlay"
    | "caption"
    | "effects"
    | "scenes"
    | "text"
    | "image"
    | "shape"
    | "background"
    | "waveform";
  layers: TimelineCanvasLayer[];
};

export type TimelineCanvasRenderPayload = {
  tracks: TimelineCanvasTrack[];
  selectedLayerId: string;
  totalSeconds: number;
  playheadSeconds: number;
  zoom: number;
  width: number;
  height: number;
  dpr: number;
};

export type TimelineHitZone = {
  layerId: string;
  trackId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type TimelineContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const HEADER_WIDTH = 142;
const RULER_HEIGHT = 36;
const TRACK_HEIGHT = 56;
const TRACK_GAP = 8;
const CLIP_HEIGHT = 38;
const TIMELINE_PADDING = 24;

export function getTimelinePixelsPerSecond(zoom: number) {
  return Math.max(18, 42 * zoom);
}

export function getTimelineCanvasWidth(totalSeconds: number, zoom: number) {
  return Math.max(
    820,
    HEADER_WIDTH + TIMELINE_PADDING * 2 + Math.ceil(totalSeconds * getTimelinePixelsPerSecond(zoom)),
  );
}

export function getTimelineCanvasHeight(trackCount: number) {
  return RULER_HEIGHT + TRACK_GAP + trackCount * (TRACK_HEIGHT + TRACK_GAP) + TIMELINE_PADDING;
}

export function getTimelineSecondFromX(x: number, zoom: number, totalSeconds: number) {
  const seconds = (x - HEADER_WIDTH - TIMELINE_PADDING) / getTimelinePixelsPerSecond(zoom);
  return clamp(seconds, 0, totalSeconds);
}

export function getTimelineTrackIdFromY(payload: Pick<TimelineCanvasRenderPayload, "tracks">, y: number) {
  const trackIndex = Math.floor((y - RULER_HEIGHT - TRACK_GAP) / (TRACK_HEIGHT + TRACK_GAP));
  if (trackIndex < 0 || trackIndex >= payload.tracks.length) return null;

  const trackY = RULER_HEIGHT + TRACK_GAP + trackIndex * (TRACK_HEIGHT + TRACK_GAP);
  if (y < trackY || y > trackY + TRACK_HEIGHT) return null;

  return payload.tracks[trackIndex]?.id ?? null;
}

export function renderTimelineCanvas(
  context: TimelineContext,
  payload: TimelineCanvasRenderPayload,
) {
  const dpr = Math.max(1, payload.dpr || 1);
  context.canvas.width = Math.max(1, Math.floor(payload.width * dpr));
  context.canvas.height = Math.max(1, Math.floor(payload.height * dpr));
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  context.clearRect(0, 0, payload.width, payload.height);
  drawTimelineBackground(context, payload);
  drawRuler(context, payload);
  drawTracks(context, payload);
  drawPlayhead(context, payload);
}

export function getTimelineHitZones(payload: TimelineCanvasRenderPayload): TimelineHitZone[] {
  const pxPerSecond = getTimelinePixelsPerSecond(payload.zoom);

  return payload.tracks.flatMap((track, trackIndex) => {
    const trackY = RULER_HEIGHT + TRACK_GAP + trackIndex * (TRACK_HEIGHT + TRACK_GAP);
    const clipY = trackY + (TRACK_HEIGHT - CLIP_HEIGHT) / 2;

    return track.layers.map((layer) => ({
      layerId: layer.id,
      trackId: track.id,
      x: HEADER_WIDTH + TIMELINE_PADDING + layer.start * pxPerSecond,
      y: clipY,
      width: Math.max(10, layer.duration * pxPerSecond),
      height: CLIP_HEIGHT,
    }));
  });
}

export function hitTestTimeline(
  payload: TimelineCanvasRenderPayload,
  point: { x: number; y: number },
) {
  return getTimelineHitZones(payload)
    .slice()
    .reverse()
    .find(
      (zone) =>
        point.x >= zone.x &&
        point.x <= zone.x + zone.width &&
        point.y >= zone.y &&
        point.y <= zone.y + zone.height,
    ) ?? null;
}

function drawTimelineBackground(context: TimelineContext, payload: TimelineCanvasRenderPayload) {
  const gradient = context.createLinearGradient(0, 0, payload.width, payload.height);
  gradient.addColorStop(0, "#07090f");
  gradient.addColorStop(1, "#0d111c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, payload.width, payload.height);

  context.fillStyle = "#0b0f19";
  context.fillRect(0, 0, HEADER_WIDTH, payload.height);

  context.strokeStyle = "rgba(255,255,255,0.09)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(HEADER_WIDTH + 0.5, 0);
  context.lineTo(HEADER_WIDTH + 0.5, payload.height);
  context.stroke();
}

function drawRuler(context: TimelineContext, payload: TimelineCanvasRenderPayload) {
  const pxPerSecond = getTimelinePixelsPerSecond(payload.zoom);
  const secondCount = Math.ceil(payload.totalSeconds);

  context.fillStyle = "#0d1320";
  context.fillRect(HEADER_WIDTH, 0, payload.width - HEADER_WIDTH, RULER_HEIGHT);
  context.fillStyle = "rgba(255,255,255,0.62)";
  context.font = '700 11px "Geist", "Inter", system-ui, sans-serif';
  context.textBaseline = "middle";
  context.textAlign = "left";

  for (let second = 0; second <= secondCount; second += 1) {
    const x = HEADER_WIDTH + TIMELINE_PADDING + second * pxPerSecond;
    const major = second % 5 === 0;

    context.strokeStyle = major ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)";
    context.lineWidth = major ? 1.2 : 1;
    context.beginPath();
    context.moveTo(x + 0.5, major ? 8 : 18);
    context.lineTo(x + 0.5, payload.height - 6);
    context.stroke();

    if (major) {
      context.fillText(`${second}s`, x + 6, RULER_HEIGHT / 2);
    }
  }

  context.fillStyle = "rgba(255,255,255,0.70)";
  context.font = '800 11px "Geist", "Inter", system-ui, sans-serif';
  context.fillText("Canvas timeline", 16, RULER_HEIGHT / 2);
}

function drawTracks(context: TimelineContext, payload: TimelineCanvasRenderPayload) {
  const zones = getTimelineHitZones(payload);
  const zoneByLayerId = new Map(zones.map((zone) => [zone.layerId, zone]));

  payload.tracks.forEach((track, trackIndex) => {
    const y = RULER_HEIGHT + TRACK_GAP + trackIndex * (TRACK_HEIGHT + TRACK_GAP);
    const even = trackIndex % 2 === 0;

    context.fillStyle = even ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)";
    roundRect(context, HEADER_WIDTH + 8, y, payload.width - HEADER_WIDTH - 16, TRACK_HEIGHT, 10);
    context.fill();

    drawTrackHeader(context, track, y);

    for (const layer of track.layers) {
      const zone = zoneByLayerId.get(layer.id);
      if (!zone) continue;
      drawClip(context, layer, zone, payload.selectedLayerId === layer.id);
    }
  });
}

function drawTrackHeader(context: TimelineContext, track: TimelineCanvasTrack, y: number) {
  const accent = getTrackAccent(track.kind);
  context.fillStyle = "rgba(255,255,255,0.04)";
  roundRect(context, 10, y, HEADER_WIDTH - 20, TRACK_HEIGHT, 10);
  context.fill();

  context.fillStyle = accent;
  roundRect(context, 20, y + 14, 6, TRACK_HEIGHT - 28, 6);
  context.fill();

  context.fillStyle = "#f8fafc";
  context.font = '850 12px "Geist", "Inter", system-ui, sans-serif';
  context.textBaseline = "middle";
  context.textAlign = "left";
  context.fillText(trimText(context, track.name, HEADER_WIDTH - 52), 34, y + 22);

  context.fillStyle = "rgba(255,255,255,0.48)";
  context.font = '650 10px "Geist", "Inter", system-ui, sans-serif';
  context.fillText(`${track.layers.length} layers`, 34, y + 39);
}

function drawClip(
  context: TimelineContext,
  layer: TimelineCanvasLayer,
  zone: TimelineHitZone,
  selected: boolean,
) {
  const color = normalizeCanvasColor(layer.color, getLayerFallbackColor(layer.type));
  const gradient = context.createLinearGradient(zone.x, zone.y, zone.x + zone.width, zone.y + zone.height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, shadeColor(color, -18));

  context.save();
  context.globalAlpha = layer.hidden ? 0.28 : layer.muted ? 0.45 : 1;
  roundRect(context, zone.x, zone.y, zone.width, zone.height, 7);
  context.fillStyle = gradient;
  context.fill();

  context.strokeStyle = selected ? "#ffffff" : "rgba(255,255,255,0.16)";
  context.lineWidth = selected ? 2.5 : 1;
  context.stroke();

  if (selected) {
    context.shadowColor = "rgba(142,247,194,0.55)";
    context.shadowBlur = 14;
    context.strokeStyle = "rgba(142,247,194,0.80)";
    context.lineWidth = 4;
    context.stroke();
    context.shadowBlur = 0;
  }

  if (zone.width > 28) {
    context.fillStyle = getReadableTextColor(color);
    context.font = '850 11px "Geist", "Inter", system-ui, sans-serif';
    context.textBaseline = "middle";
    context.textAlign = "left";
    const statusPrefix = `${layer.locked ? "LOCK " : ""}${layer.hidden ? "HIDE " : ""}`;
    context.fillText(trimText(context, `${statusPrefix}${layer.name}`, zone.width - 18), zone.x + 9, zone.y + zone.height / 2);
  }

  context.restore();
}

function drawPlayhead(context: TimelineContext, payload: TimelineCanvasRenderPayload) {
  const pxPerSecond = getTimelinePixelsPerSecond(payload.zoom);
  const playheadSeconds = clamp(payload.playheadSeconds, 0, payload.totalSeconds);
  const playheadX = HEADER_WIDTH + TIMELINE_PADDING + playheadSeconds * pxPerSecond;

  context.strokeStyle = "rgba(239,68,68,0.95)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(playheadX, 0);
  context.lineTo(playheadX, payload.height);
  context.stroke();

  context.fillStyle = "#ef4444";
  context.beginPath();
  context.moveTo(playheadX - 6, 0);
  context.lineTo(playheadX + 6, 0);
  context.lineTo(playheadX, 10);
  context.closePath();
  context.fill();

  context.fillStyle = "rgba(239,68,68,0.92)";
  roundRect(context, Math.max(HEADER_WIDTH + 4, playheadX - 24), 14, 48, 18, 6);
  context.fill();
  context.fillStyle = "#ffffff";
  context.font = '850 10px "Geist", "Inter", system-ui, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${playheadSeconds.toFixed(1)}s`, Math.max(HEADER_WIDTH + 28, playheadX), 23);

  const totalWidth = Math.max(1, payload.totalSeconds * pxPerSecond);
  context.fillStyle = "rgba(142,247,194,0.9)";
  roundRect(context, HEADER_WIDTH + TIMELINE_PADDING, payload.height - 9, totalWidth, 4, 4);
  context.fill();
}

function getTrackAccent(kind: TimelineCanvasTrack["kind"]) {
  if (kind === "video") return "#8ef7c2";
  if (kind === "audio" || kind === "waveform") return "#7dd3fc";
  if (kind === "caption") return "#fb923c";
  if (kind === "overlay" || kind === "text" || kind === "image") return "#c084fc";
  return "#f472b6";
}

function getLayerFallbackColor(type: TimelineCanvasLayer["type"]) {
  if (type === "video") return "#8ef7c2";
  if (type === "audio" || type === "waveform") return "#7dd3fc";
  if (type === "caption") return "#fb923c";
  if (type === "text") return "#facc15";
  if (type === "image") return "#c084fc";
  return "#f472b6";
}

function normalizeCanvasColor(value: string | undefined, fallback: string) {
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value;
}

function shadeColor(hex: string, percent: number) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const amount = Math.round(2.55 * percent);
  const red = clamp((value >> 16) + amount, 0, 255);
  const green = clamp(((value >> 8) & 0x00ff) + amount, 0, 255);
  const blue = clamp((value & 0x0000ff) + amount, 0, 255);
  return `#${(0x1000000 + red * 0x10000 + green * 0x100 + blue).toString(16).slice(1)}`;
}

function getReadableTextColor(hex: string) {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const red = value >> 16;
  const green = (value >> 8) & 0x00ff;
  const blue = value & 0x0000ff;
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance > 0.58 ? "#050608" : "#ffffff";
}

function trimText(context: TimelineContext, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && context.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function roundRect(
  context: TimelineContext,
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
