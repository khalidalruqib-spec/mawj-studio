"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef } from "react";
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
import type { AIEngineState, PanelId, StudioFile, TimelineTrack } from "../foundation";
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
  isPlaying,
  previewTime,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onTogglePlayback,
  onUploadClick,
  onCreatorCommand,
  onClearTemplateProject,
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
  isPlaying: boolean;
  previewTime: number;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  onTogglePlayback: () => void;
  onUploadClick: () => void;
  onCreatorCommand: (commandOverride?: string) => void;
  onClearTemplateProject: () => void;
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
