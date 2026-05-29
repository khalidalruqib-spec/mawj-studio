"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Clock3,
  Cloud,
  Command,
  Film,
  Gauge,
  Layers3,
  Pause,
  Play,
  Trash2,
  UploadCloud,
} from "lucide-react";
import type { EditPlan } from "@/lib/edit-plan";
import type { TemplateProject, TemplateTimelineTrack } from "@/lib/video-template-engine";
import { normalizeTemplateFontWeight, resolveLayerFontFamily } from "@/lib/template-typography";
import type { AspectRatio, VideoStyle } from "@/lib/video-styles";
import type { VideoProject } from "@/lib/video-project-model";
import { isUsableMediaDuration } from "@/lib/media-duration";
import {
  getTimelineCanvasHeight,
  getTimelineCanvasWidth,
  hitTestTimeline,
  renderTimelineCanvas,
  type TimelineCanvasRenderPayload,
} from "@/lib/timeline-canvas-renderer";
import { CREATOR_STARTERS } from "../foundation";
import type { AIEngineState, PanelId, StudioFile, TimelineLayer, TimelineTrack } from "../foundation";
import { Metric } from "../ui";
import { formatDuration, normalizeHexColor } from "../utils";

export function VideoPreview({
  studioFile,
  templateProject,
  videoRef,
  aspectRatio,
  previewFilter,
  previewCaption,
  activeStyle,
  brandName,
  showCaptionOverlay,
  timelineTracks,
  selectedLayerId,
  isPlaying,
  previewTime,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onTogglePlayback,
  onUploadClick,
  onCreatorCommand,
  onClearTemplateProject,
  onSelectLayer,
  onMoveLayer,
}: {
  studioFile: StudioFile | null;
  templateProject: TemplateProject | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio: AspectRatio;
  previewFilter: string;
  previewCaption: string;
  activeStyle: VideoStyle;
  brandName: string;
  showCaptionOverlay: boolean;
  timelineTracks: TimelineTrack[];
  selectedLayerId: string;
  isPlaying: boolean;
  previewTime: number;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  onTogglePlayback: () => void;
  onUploadClick: () => void;
  onCreatorCommand: (commandOverride?: string) => void;
  onClearTemplateProject: () => void;
  onSelectLayer: (id: string) => void;
  onMoveLayer: (id: string, patch: Pick<TimelineLayer, "x" | "y">) => void;
}) {
  const previewDurationSeconds = isUsableMediaDuration(studioFile?.durationSeconds)
    ? studioFile.durationSeconds
    : 0;
  const previewProgress = previewDurationSeconds
    ? Math.min(100, Math.max(0, (previewTime / previewDurationSeconds) * 100))
    : 0;

  return (
    <div className="relative grid min-h-[520px] place-items-center overflow-hidden rounded-lg bg-black">
      {studioFile ? (
        <div
          className={`relative max-h-[660px] w-full overflow-hidden rounded-lg bg-black shadow-2xl ${
            aspectRatio === "9:16"
              ? "aspect-[9/16] max-w-[370px]"
              : aspectRatio === "1:1"
                ? "aspect-square max-w-[540px]"
                : "aspect-video max-w-[920px]"
          }`}
        >
          <video
            ref={videoRef}
            src={studioFile.url}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            className="h-full w-full bg-black object-cover"
            style={{ filter: previewFilter }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.36),transparent_31%,transparent_61%,rgba(0,0,0,0.56))]" />
          <TimelinePreviewOverlay
            aspectRatio={aspectRatio}
            tracks={timelineTracks}
            currentTime={previewTime}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onMoveLayer={onMoveLayer}
          />
          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center">
            <span className="max-w-full truncate rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur">
              {brandName || "Mawj Studio"} · {activeStyle.arabicName}
            </span>
          </div>
          {showCaptionOverlay ? (
            <div className="pointer-events-none absolute inset-x-5 bottom-24 rounded-lg border border-white/10 bg-black/72 px-4 py-3 text-center shadow-xl backdrop-blur">
              <p className="text-balance text-lg font-black leading-7 text-white">{previewCaption}</p>
            </div>
          ) : null}
        </div>
      ) : templateProject ? (
        <div
          className={`relative w-full ${
            templateProject.aspectRatio === "16:9"
              ? "max-w-[920px]"
              : templateProject.aspectRatio === "1:1"
                ? "max-w-[540px]"
                : "max-w-[370px]"
          }`}
        >
          <TemplateProjectPreview project={templateProject} />
          <button
            type="button"
            onClick={onClearTemplateProject}
            className="absolute right-3 top-3 z-20 flex min-h-10 items-center gap-2 rounded-lg border border-red-300/30 bg-red-500/90 px-3 py-2 text-xs font-black text-white shadow-xl transition hover:bg-red-400"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            حذف التمبلت
          </button>
        </div>
      ) : (
        <div className="grid w-full max-w-3xl place-items-center px-6 text-center">
          <div className="w-full space-y-4">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white/8 text-[var(--brand)]">
              <Film className="h-8 w-8" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-black">ابدأ فيديو AI كامل</p>
              <p className="mt-2 text-sm font-semibold text-white/55">
                اختر مسار سريع أو ارفع ملفاتك، وبعدها يتحول كل شيء إلى مشروع قابل للتعديل.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CREATOR_STARTERS.map((starter) => (
                <button
                  key={starter.label}
                  type="button"
                  onClick={() => onCreatorCommand(starter.command)}
                  className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                >
                  <span className="block text-sm font-black">{starter.label}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-white/55">{starter.detail}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onUploadClick}
              className="mx-auto flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
            >
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
              ارفع فيديو أو صور
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/72 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onTogglePlayback}
          disabled={!studioFile}
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black transition hover:bg-[var(--brand)] disabled:opacity-40"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="mx-3 h-2 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-[width]"
            style={{ width: `${previewProgress}%` }}
          />
        </div>
        <span className="text-xs font-black text-white/70" dir="ltr">
          {studioFile ? `${formatDuration(previewTime)} / ${formatDuration(previewDurationSeconds)}` : "00:00"}
        </span>
      </div>
    </div>
  );
}

export function TemplateProjectPreview({ project }: { project: TemplateProject }) {
  const firstScene = project.scenes[0];
  const activeLayers = project.timeline
    .flatMap((track) => track.layers)
    .filter((layer) => layer.absoluteStart <= (firstScene?.duration ?? project.duration))
    .slice(0, 12);

  return (
    <div
      className={`relative max-h-[660px] w-full overflow-hidden rounded-lg bg-black shadow-2xl ${
        project.aspectRatio === "16:9"
          ? "aspect-video max-w-[920px]"
          : project.aspectRatio === "1:1"
            ? "aspect-square max-w-[540px]"
            : "aspect-[9/16] max-w-[370px]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#111827,#050608)]" />
      {activeLayers.map((layer) => (
        <TemplatePreviewLayer key={layer.id} layer={layer} project={project} />
      ))}
      <div className="absolute inset-x-4 top-4 flex justify-center">
        <span className="max-w-full truncate rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur">
          {project.name}
        </span>
      </div>
    </div>
  );
}

function TimelinePreviewOverlay({
  aspectRatio,
  tracks,
  currentTime,
  selectedLayerId,
  onSelectLayer,
  onMoveLayer,
}: {
  aspectRatio: AspectRatio;
  tracks: TimelineTrack[];
  currentTime: number;
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onMoveLayer: (id: string, patch: Pick<TimelineLayer, "x" | "y">) => void;
}) {
  const dimensions = getPreviewDesignDimensions(aspectRatio);
  const [dragState, setDragState] = useState<PreviewDragState | null>(null);
  const layers = tracks
    .flatMap((track) => track.layers)
    .filter((layer) => isRenderablePreviewLayer(layer, currentTime));
  const activeDrag = dragState
    ? {
        layerId: dragState.layerId,
        x: Math.round(dragState.startLayerX + dragState.deltaX),
        y: Math.round(dragState.startLayerY + dragState.deltaY),
      }
    : null;

  const startDrag = useCallback(
    (layer: TimelineLayer, event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSelectLayer(layer.id);
      event.currentTarget.setPointerCapture(event.pointerId);
      const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
      setDragState({
        layerId: layer.id,
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startLayerX: layer.x ?? 0,
        startLayerY: layer.y ?? 0,
        scaleX: bounds ? dimensions.width / bounds.width : 1,
        scaleY: bounds ? dimensions.height / bounds.height : 1,
        deltaX: 0,
        deltaY: 0,
      });
    },
    [dimensions.height, dimensions.width, onSelectLayer],
  );

  const moveDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    setDragState((state) => {
      if (!state || state.pointerId !== event.pointerId) return state;

      return {
        ...state,
        deltaX: (event.clientX - state.startPointerX) * state.scaleX,
        deltaY: (event.clientY - state.startPointerY) * state.scaleY,
      };
    });
  }, []);

  const endDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      setDragState((state) => {
        if (!state || state.pointerId !== event.pointerId) return state;

        const nextX = Math.round(state.startLayerX + state.deltaX);
        const nextY = Math.round(state.startLayerY + state.deltaY);
        onMoveLayer(state.layerId, { x: nextX, y: nextY });
        return null;
      });
    },
    [onMoveLayer],
  );

  if (!layers.length) return null;

  return (
    <div className="absolute inset-0 z-10">
      {layers.map((layer) => (
        <TimelinePreviewLayer
          key={layer.id}
          layer={layer}
          dimensions={dimensions}
          selected={layer.id === selectedLayerId}
          dragPosition={activeDrag?.layerId === layer.id ? activeDrag : null}
          onSelect={() => onSelectLayer(layer.id)}
          onPointerDown={(event) => startDrag(layer, event)}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      ))}
    </div>
  );
}

function TimelinePreviewLayer({
  layer,
  dimensions,
  selected,
  dragPosition,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  layer: TimelineLayer;
  dimensions: { width: number; height: number };
  selected: boolean;
  dragPosition: { x: number; y: number } | null;
  onSelect: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const box = getTimelineLayerBox(layer, dimensions, dragPosition);
  const baseClass =
    "absolute touch-none overflow-hidden transition outline-offset-2 " +
    (selected ? "outline outline-2 outline-[var(--brand)]" : "outline outline-1 outline-transparent hover:outline-white/45");
  const pointerHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };

  if (layer.type === "image") {
    if (!layer.src) return null;

    return (
      <button
        type="button"
        aria-label={`Select ${layer.name}`}
        onClick={onSelect}
        {...pointerHandlers}
        className={`${baseClass} cursor-pointer border-0 p-0`}
        style={box}
      >
        <img src={layer.src} alt={layer.name} className="h-full w-full object-cover" />
      </button>
    );
  }

  if (layer.type === "shape") {
    return (
      <button
        type="button"
        aria-label={`Select ${layer.name}`}
        onClick={onSelect}
        {...pointerHandlers}
        className={`${baseClass} cursor-pointer border-0 p-0`}
        style={{
          ...box,
          backgroundColor: layer.backgroundColor ?? layer.color,
          borderRadius: scalePreviewRadius(layer.borderRadius),
          opacity: layer.opacity ?? 1,
        }}
      />
    );
  }

  const text = layer.content ?? layer.name;
  if (!text.trim()) return null;

  const textAlign = layer.align ?? "center";
  const fontScale = getPreviewFontScale(dimensions);

  return (
    <button
      type="button"
      aria-label={`Select ${layer.name}`}
      onClick={onSelect}
      {...pointerHandlers}
      className={`${baseClass} grid cursor-pointer place-items-center border-0 px-2 text-center font-black leading-tight`}
      dir={layer.direction ?? "auto"}
      style={{
        ...box,
        color: layer.textColor ?? layer.color,
        backgroundColor: layer.backgroundColor,
        borderRadius: scalePreviewRadius(layer.borderRadius),
        fontFamily: layer.fontFamily,
        fontSize: `${Math.max(11, (layer.fontSize ?? 48) * fontScale)}px`,
        fontWeight: normalizeTemplateFontWeight(layer.fontWeight),
        justifyItems: textAlign === "right" ? "end" : textAlign === "left" ? "start" : "center",
        textAlign,
        opacity: layer.opacity ?? 1,
      }}
    >
      {text}
    </button>
  );
}

function isRenderablePreviewLayer(layer: TimelineLayer, currentTime: number) {
  if (currentTime < layer.start || currentTime > layer.start + layer.duration) return false;
  if (layer.type === "image") return Boolean(layer.src);
  if (layer.type === "shape") return true;
  if (layer.type === "text") return Boolean(layer.content?.trim());
  if (layer.type === "caption") return Boolean(layer.content?.trim());
  return false;
}

type PreviewDragState = {
  layerId: string;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startLayerX: number;
  startLayerY: number;
  scaleX: number;
  scaleY: number;
  deltaX: number;
  deltaY: number;
};

function getTimelineLayerBox(
  layer: TimelineLayer,
  dimensions: { width: number; height: number },
  dragPosition: { x: number; y: number } | null,
) {
  const x = dragPosition?.x ?? layer.x ?? 0;
  const y = dragPosition?.y ?? layer.y ?? 0;
  const width = layer.width ?? dimensions.width;
  const height = layer.height ?? Math.max(120, dimensions.height * 0.08);

  return {
    left: `${(x / dimensions.width) * 100}%`,
    top: `${(y / dimensions.height) * 100}%`,
    width: `${(width / dimensions.width) * 100}%`,
    height: `${(height / dimensions.height) * 100}%`,
  };
}

function getPreviewFontScale(dimensions: { width: number }) {
  return 100 / dimensions.width;
}

function getPreviewDesignDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function scalePreviewRadius(radius?: number) {
  return radius ? `${Math.max(4, radius * 0.2)}px` : undefined;
}

export function TemplatePreviewLayer({
  layer,
  project,
}: {
  layer: TemplateTimelineTrack["layers"][number];
  project: TemplateProject;
}) {
  const style = {
    left: `${((layer.x ?? 0) / project.width) * 100}%`,
    top: `${((layer.y ?? 0) / project.height) * 100}%`,
    width: `${((layer.width ?? project.width) / project.width) * 100}%`,
    height: `${((layer.height ?? project.height) / project.height) * 100}%`,
  };

  if (layer.type === "text" || layer.type === "captions") {
    const textAlign = layer.align ?? "center";

    return (
      <div
        className="absolute grid place-items-center overflow-hidden px-2 text-center font-black leading-tight"
        style={{
          ...style,
          color: normalizeHexColor(layer.color),
          fontFamily: resolveLayerFontFamily({ layer }),
          fontSize: `${Math.max(11, (layer.fontSize ?? 44) * 0.2)}px`,
          fontWeight: normalizeTemplateFontWeight(layer.fontWeight),
          backgroundColor: layer.backgroundColor,
          borderRadius: layer.borderRadius ? `${Math.max(4, layer.borderRadius * 0.2)}px` : undefined,
          direction: layer.direction === "ltr" ? "ltr" : "rtl",
          justifyItems: textAlign === "right" ? "end" : textAlign === "left" ? "start" : "center",
          textAlign,
        }}
      >
        {layer.content ?? layer.name}
      </div>
    );
  }

  if (layer.type === "image" || layer.type === "video") {
    const src = layer.src && !layer.src.includes("{{") ? layer.src : "";

    return src && layer.type === "image" ? (
      <img src={src} alt={layer.name ?? layer.id} className="absolute object-cover" style={style} />
    ) : (
      <div className="absolute grid place-items-center border border-white/20 bg-white/10 text-xs font-black text-white/70" style={style}>
        {layer.type.toUpperCase()}
      </div>
    );
  }

  if (layer.type === "background") {
    return (
      <div
        className="absolute inset-0"
        style={{ background: normalizeHexColor(layer.backgroundColor ?? layer.color) }}
      />
    );
  }

  return (
    <div
      className="absolute"
      style={{
        ...style,
        background: normalizeHexColor(layer.color),
        borderRadius: `${Math.min(28, (layer.borderRadius ?? 18) / 2)}px`,
        opacity: layer.opacity ?? 0.75,
      }}
    />
  );
}

export function TimelineEditor({
  tracks,
  selectedLayerId,
  zoom,
  totalSeconds,
  onSelectLayer,
}: {
  tracks: TimelineTrack[];
  selectedLayerId: string;
  zoom: number;
  totalSeconds: number;
  onSelectLayer: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const transferredRef = useRef(false);
  const canvasWidth = useMemo(
    () => getTimelineCanvasWidth(totalSeconds, zoom),
    [totalSeconds, zoom],
  );
  const canvasHeight = useMemo(
    () => getTimelineCanvasHeight(tracks.length),
    [tracks.length],
  );
  const renderPayload = useMemo<TimelineCanvasRenderPayload>(
    () => ({
      tracks,
      selectedLayerId,
      totalSeconds,
      zoom,
      width: canvasWidth,
      height: canvasHeight,
      dpr: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    }),
    [canvasHeight, canvasWidth, selectedLayerId, totalSeconds, tracks, zoom],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      process.env.NODE_ENV !== "production" ||
      !canvas ||
      typeof Worker === "undefined" ||
      !("transferControlToOffscreen" in canvas)
    ) {
      return;
    }

    try {
      const worker = new Worker(new URL("../../../workers/timeline.worker.ts", import.meta.url), {
        type: "module",
      });
      const offscreen = canvas.transferControlToOffscreen();
      transferredRef.current = true;
      workerRef.current = worker;
      worker.postMessage({ type: "INIT", canvas: offscreen }, [offscreen]);

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      workerRef.current = null;
      return;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    if (workerRef.current) {
      workerRef.current.postMessage({ type: "RENDER", payload: renderPayload });
      return;
    }

    if (transferredRef.current) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    renderTimelineCanvas(context, renderPayload);
  }, [canvasHeight, canvasWidth, renderPayload]);

  const handleTimelineClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - rect.left) * (canvasWidth / rect.width),
        y: (event.clientY - rect.top) * (canvasHeight / rect.height),
      };
      const hit = hitTestTimeline(renderPayload, point);
      if (hit) onSelectLayer(hit.layerId);
    },
    [canvasHeight, canvasWidth, onSelectLayer, renderPayload],
  );

  const selectedLayer = tracks
    .flatMap((track) => track.layers)
    .find((layer) => layer.id === selectedLayerId);

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
          <h2 className="text-sm font-black">Multi-track timeline</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <span className="rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--brand)]">
            Worker Canvas
          </span>
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatDuration(totalSeconds)}
        </div>
      </div>
      <div className="overflow-x-auto p-4" dir="ltr">
        <div className="min-w-[820px]" style={{ width: `${canvasWidth}px` }}>
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleTimelineClick}
            tabIndex={0}
            role="img"
            aria-label="Canvas timeline. Click a clip to select and edit it in the inspector."
            className="block cursor-pointer rounded-lg border border-[var(--line)] bg-black/20 outline-none transition focus:border-[var(--brand)]"
          />
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--muted)]">
        Selected: <span className="text-[var(--foreground)]">{selectedLayer?.name ?? "None"}</span>
      </div>
    </section>
  );
}

export function ProjectMetrics({
  activeStyle,
  activePanel,
  projectStatus,
  engineProject,
  engineState,
}: {
  plan: EditPlan | null;
  activeStyle: VideoStyle;
  activePanel: PanelId;
  projectStatus: string;
  studioFile: StudioFile | null;
  engineProject: VideoProject | null;
  engineState: AIEngineState;
}) {
  const timelineItemCount =
    engineProject?.tracks.reduce((sum, track) => sum + track.items.length, 0) ?? 0;

  return (
    <div className="space-y-3">
      <Metric label="Mode" value={activePanel} icon={Command} />
      <Metric label="Engine" value={`${engineState.engine} · ${engineProject?.layers.length ?? 0}/${timelineItemCount}`} icon={Layers3} />
      <Metric label="AI confidence" value={`${engineState.confidence}%`} icon={Gauge} />
      <Metric label="Target cut" value={engineState.targetCut} icon={Clock3} />
      <Metric label="Captions" value={activeStyle.captionPreset} icon={Captions} />
      <Metric label="Status" value={projectStatus} icon={Cloud} />
    </div>
  );
}
