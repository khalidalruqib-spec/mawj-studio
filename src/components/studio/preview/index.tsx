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
import type { AspectRatio, VideoStyle } from "@/lib/video-styles";
import type { VideoProject } from "@/lib/video-project-model";
import { isUsableMediaDuration } from "@/lib/media-duration";
import {
  getTimelineCanvasHeight,
  getTimelineCanvasWidth,
  getTimelinePixelsPerSecond,
  hitTestTimeline,
  renderTimelineCanvas,
  type TimelineCanvasRenderPayload,
  type TimelineHitZone,
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
  isPlaying,
  previewTime,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  onTogglePlayback,
  onUploadClick,
  onCreatorCommand,
  onClearTemplateProject,
  timelineTracks,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerGeometry,
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
  timelineTracks: TimelineTrack[];
  selectedLayerId?: string;
  onSelectLayer?: (id: string) => void;
  onUpdateLayerGeometry?: (layerId: string, patch: Pick<TimelineLayer, "x" | "y" | "width" | "height">) => void;
}) {
  const previewDurationSeconds = isUsableMediaDuration(studioFile?.durationSeconds)
    ? studioFile.durationSeconds
    : 0;
  const previewProgress = previewDurationSeconds
    ? Math.min(100, Math.max(0, (previewTime / previewDurationSeconds) * 100))
    : 0;
  const videoPreviewGeometry = useMemo(() => getAspectPreviewGeometry(aspectRatio), [aspectRatio]);
  const activeVideoOverlayLayers = useMemo(
    () => getActivePreviewOverlayLayers(timelineTracks, previewTime),
    [previewTime, timelineTracks],
  );
  const hasActiveCaptionOverlay = activeVideoOverlayLayers.some((layer) => layer.type === "caption");

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
          <VideoOverlayPreview
            layers={activeVideoOverlayLayers}
            geometry={videoPreviewGeometry}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayerGeometry={onUpdateLayerGeometry}
          />
          <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center">
            <span className="max-w-full truncate rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-xs font-black text-white shadow-lg backdrop-blur">
              {brandName || "Mawj Studio"} · {activeStyle.arabicName}
            </span>
          </div>
          {showCaptionOverlay && !hasActiveCaptionOverlay ? (
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
          <TemplateProjectPreview
            project={templateProject}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayerGeometry={onUpdateLayerGeometry}
          />
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

export function VideoOverlayPreview({
  layers,
  geometry,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerGeometry,
}: {
  layers: TimelineLayer[];
  geometry: PreviewCanvasGeometry;
  selectedLayerId?: string;
  onSelectLayer?: (id: string) => void;
  onUpdateLayerGeometry?: (layerId: string, patch: Pick<TimelineLayer, "x" | "y" | "width" | "height">) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<PreviewLayerDragState | null>(null);
  const [dragDraft, setDragDraft] = useState<PreviewLayerDragDraft | null>(null);

  const handleLayerPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>, layer: TimelineLayer, mode: PreviewLayerDragMode) => {
      const stage = stageRef.current;
      if (!stage) return;

      event.preventDefault();
      event.stopPropagation();
      stage.setPointerCapture(event.pointerId);
      onSelectLayer?.(layer.id);

      const point = getPreviewProjectPoint(event, stage, geometry);
      const layerGeometry = resolveTimelineLayerGeometry(layer, geometry);
      dragRef.current = {
        pointerId: event.pointerId,
        layerId: layer.id,
        mode,
        initialX: point.x,
        initialY: point.y,
        originalX: layerGeometry.x,
        originalY: layerGeometry.y,
        originalWidth: layerGeometry.width,
        originalHeight: layerGeometry.height,
      };
    },
    [geometry, onSelectLayer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      const drag = dragRef.current;
      if (!stage || !drag) return;

      const point = getPreviewProjectPoint(event, stage, geometry);
      setDragDraft(getPreviewLayerDraft(drag, point, geometry));
    },
    [geometry],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      const drag = dragRef.current;
      if (!drag) return;

      if (stage?.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }

      const nextDraft = stage
        ? getPreviewLayerDraft(drag, getPreviewProjectPoint(event, stage, geometry), geometry)
        : dragDraft;

      dragRef.current = null;
      setDragDraft(null);

      if (nextDraft) {
        onUpdateLayerGeometry?.(nextDraft.layerId, nextDraft.geometry);
      }
    },
    [dragDraft, geometry, onUpdateLayerGeometry],
  );

  if (!layers.length) return null;

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 z-10"
    >
      {selectedLayerId ? <SafeMarginGuides geometry={geometry} /> : null}
      {layers.map((layer) => {
        const layerGeometry =
          dragDraft?.layerId === layer.id
            ? dragDraft.geometry
            : resolveTimelineLayerGeometry(layer, geometry);

        return (
          <TimelinePreviewLayer
            key={layer.id}
            layer={layer}
            geometry={geometry}
            layerGeometry={layerGeometry}
            isSelected={selectedLayerId === layer.id}
            onPointerDown={(event) => handleLayerPointerDown(event, layer, "move")}
            onResizePointerDown={(event) => handleLayerPointerDown(event, layer, "resize")}
          />
        );
      })}
    </div>
  );
}

export function TimelinePreviewLayer({
  layer,
  geometry,
  layerGeometry,
  isSelected = false,
  onPointerDown,
  onResizePointerDown,
}: {
  layer: TimelineLayer;
  geometry: PreviewCanvasGeometry;
  layerGeometry: Pick<TimelineLayer, "x" | "y" | "width" | "height">;
  isSelected?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const shellStyle = {
    left: `${((layerGeometry.x ?? 0) / geometry.width) * 100}%`,
    top: `${((layerGeometry.y ?? 0) / geometry.height) * 100}%`,
    width: `${((layerGeometry.width ?? geometry.width) / geometry.width) * 100}%`,
    height: `${((layerGeometry.height ?? geometry.height) / geometry.height) * 100}%`,
    opacity: layer.opacity ?? 1,
    boxShadow: isSelected ? "0 0 0 2px var(--brand), 0 0 0 5px rgba(142,247,194,0.18)" : undefined,
  };
  const resizeHandle = isSelected ? (
    <span
      aria-hidden="true"
      onPointerDown={onResizePointerDown}
      className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-sm border border-black/40 bg-[var(--brand)] shadow-lg"
    />
  ) : null;

  if (layer.type === "image") {
    return (
      <div onPointerDown={onPointerDown} className="absolute cursor-move overflow-hidden" style={shellStyle}>
        {layer.src ? (
          <img src={layer.src} alt={layer.name} className={`h-full w-full ${getMediaObjectFitClass(layer.fit ?? "contain")}`} />
        ) : (
          <div className="grid h-full w-full place-items-center border border-white/20 bg-white/10 text-xs font-black text-white/70">
            IMAGE
          </div>
        )}
        {resizeHandle}
      </div>
    );
  }

  if (layer.type === "shape") {
    return (
      <div
        onPointerDown={onPointerDown}
        className="absolute cursor-move"
        style={{
          ...shellStyle,
          background: normalizeHexColor(layer.backgroundColor ?? layer.color),
          borderRadius: `${Math.min(32, layer.borderRadius ?? 18)}px`,
        }}
      >
        {resizeHandle}
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      dir="auto"
      className="absolute grid cursor-move place-items-center overflow-hidden px-3 text-center font-black leading-tight text-white"
      style={{
        ...shellStyle,
        color: normalizeHexColor(layer.textColor ?? layer.color ?? "#ffffff"),
        background:
          layer.backgroundColor && !layer.backgroundColor.includes("{{")
            ? layer.backgroundColor
            : layer.type === "caption"
              ? "rgba(0,0,0,0.58)"
              : "transparent",
        borderRadius: `${Math.min(24, layer.borderRadius ?? 14)}px`,
        fontSize: `${Math.max(13, (layer.fontSize ?? (layer.type === "caption" ? 58 : 64)) * 0.22)}px`,
        fontWeight: layer.fontWeight ?? "900",
      }}
    >
      {layer.content ?? layer.name}
      {resizeHandle}
    </div>
  );
}

function SafeMarginGuides({ geometry }: { geometry: PreviewCanvasGeometry }) {
  const margins = getPreviewSafeMargins(geometry);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute border border-dashed border-[var(--brand)]/45 shadow-[0_0_0_9999px_rgba(0,0,0,0.08)]"
      style={{
        left: `${(margins.left / geometry.width) * 100}%`,
        top: `${(margins.top / geometry.height) * 100}%`,
        right: `${(margins.right / geometry.width) * 100}%`,
        bottom: `${(margins.bottom / geometry.height) * 100}%`,
      }}
    />
  );
}

function getPreviewSafeMargins({ width, height }: PreviewCanvasGeometry) {
  if (height > width * 1.4) {
    return { top: 160, bottom: 260, left: 70, right: 70 };
  }

  if (Math.abs(width - height) < 10) {
    return { top: 92, bottom: 120, left: 76, right: 76 };
  }

  return { top: 72, bottom: 72, left: 96, right: 96 };
}

export function TemplateProjectPreview({
  project,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerGeometry,
}: {
  project: TemplateProject;
  selectedLayerId?: string;
  onSelectLayer?: (id: string) => void;
  onUpdateLayerGeometry?: (layerId: string, patch: Pick<TimelineLayer, "x" | "y" | "width" | "height">) => void;
}) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<PreviewLayerDragState | null>(null);
  const [dragDraft, setDragDraft] = useState<PreviewLayerDragDraft | null>(null);
  const firstScene = project.scenes[0];
  const activeLayers = project.timeline
    .flatMap((track) => track.layers)
    .filter((layer) => layer.absoluteStart <= (firstScene?.duration ?? project.duration))
    .slice(0, 12);

  const handleLayerPointerDown = useCallback(
    (
      event: React.PointerEvent<HTMLElement>,
      layer: TemplateTimelineTrack["layers"][number],
      mode: PreviewLayerDragMode,
    ) => {
      const stage = stageRef.current;
      if (!stage || layer.type === "background") return;

      event.preventDefault();
      event.stopPropagation();
      stage.setPointerCapture(event.pointerId);
      onSelectLayer?.(layer.id);

      const point = getPreviewProjectPoint(event, stage, project);
      dragRef.current = {
        pointerId: event.pointerId,
        layerId: layer.id,
        mode,
        initialX: point.x,
        initialY: point.y,
        originalX: layer.x ?? 0,
        originalY: layer.y ?? 0,
        originalWidth: layer.width ?? project.width,
        originalHeight: layer.height ?? project.height,
      };
    },
    [onSelectLayer, project],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      const drag = dragRef.current;
      if (!stage || !drag) return;

      const point = getPreviewProjectPoint(event, stage, project);
      setDragDraft(getPreviewLayerDraft(drag, point, project));
    },
    [project],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const stage = stageRef.current;
      const drag = dragRef.current;
      if (!drag) return;

      if (stage?.hasPointerCapture(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }

      const nextDraft = stage
        ? getPreviewLayerDraft(drag, getPreviewProjectPoint(event, stage, project), project)
        : dragDraft;

      dragRef.current = null;
      setDragDraft(null);

      if (nextDraft) {
        onUpdateLayerGeometry?.(nextDraft.layerId, nextDraft.geometry);
      }
    },
    [dragDraft, onUpdateLayerGeometry, project],
  );

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative max-h-[660px] w-full overflow-hidden rounded-lg bg-black shadow-2xl ${
        project.aspectRatio === "16:9"
          ? "aspect-video max-w-[920px]"
          : project.aspectRatio === "1:1"
            ? "aspect-square max-w-[540px]"
            : "aspect-[9/16] max-w-[370px]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#111827,#050608)]" />
      {selectedLayerId ? <SafeMarginGuides geometry={project} /> : null}
      {activeLayers.map((layer) => {
        const draftLayer =
          dragDraft?.layerId === layer.id
            ? {
                ...layer,
                ...dragDraft.geometry,
              }
            : layer;

        return (
          <TemplatePreviewLayer
            key={layer.id}
            layer={draftLayer}
            project={project}
            isSelected={selectedLayerId === layer.id}
            onPointerDown={(event) => handleLayerPointerDown(event, layer, "move")}
            onResizePointerDown={(event) => handleLayerPointerDown(event, layer, "resize")}
          />
        );
      })}
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
  isSelected = false,
  onPointerDown,
  onResizePointerDown,
}: {
  layer: TemplateTimelineTrack["layers"][number];
  project: TemplateProject;
  isSelected?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const style = {
    left: `${((layer.x ?? 0) / project.width) * 100}%`,
    top: `${((layer.y ?? 0) / project.height) * 100}%`,
    width: `${((layer.width ?? project.width) / project.width) * 100}%`,
    height: `${((layer.height ?? project.height) / project.height) * 100}%`,
  };

  if (layer.type === "background") {
    return (
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: normalizeHexColor(layer.backgroundColor ?? layer.color) }}
      />
    );
  }

  const shellStyle = {
    ...style,
    opacity: layer.opacity ?? 1,
    boxShadow: isSelected ? "0 0 0 2px var(--brand), 0 0 0 5px rgba(142,247,194,0.18)" : undefined,
  };
  const resizeHandle = isSelected ? (
    <span
      aria-hidden="true"
      onPointerDown={onResizePointerDown}
      className="absolute bottom-0 right-0 h-3 w-3 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-sm border border-black/40 bg-[var(--brand)] shadow-lg"
    />
  ) : null;

  if (layer.type === "text" || layer.type === "captions") {
    return (
      <div
        onPointerDown={onPointerDown}
        className="absolute grid cursor-move place-items-center overflow-hidden px-2 text-center font-black leading-tight"
        style={{
          ...shellStyle,
          color: normalizeHexColor(layer.color),
          fontSize: `${Math.max(11, (layer.fontSize ?? 44) * 0.2)}px`,
          direction: layer.direction === "ltr" ? "ltr" : "rtl",
        }}
      >
        {layer.content ?? layer.name}
        {resizeHandle}
      </div>
    );
  }

  if (layer.type === "image" || layer.type === "video") {
    const src = layer.src && !layer.src.includes("{{") ? layer.src : "";

    return (
      <div
        onPointerDown={onPointerDown}
        className="absolute cursor-move overflow-hidden"
        style={shellStyle}
      >
        {src && layer.type === "image" ? (
          <img src={src} alt={layer.name ?? layer.id} className={`h-full w-full ${getMediaObjectFitClass(layer.fit ?? "contain")}`} />
        ) : (
          <div className="grid h-full w-full place-items-center border border-white/20 bg-white/10 text-xs font-black text-white/70">
            {layer.type.toUpperCase()}
          </div>
        )}
        {resizeHandle}
      </div>
    );
  }

  return (
    <div
      onPointerDown={onPointerDown}
      className="absolute cursor-move"
      style={{
        ...shellStyle,
        background: normalizeHexColor(layer.color),
        borderRadius: `${Math.min(28, (layer.borderRadius ?? 18) / 2)}px`,
      }}
    >
      {resizeHandle}
    </div>
  );
}

type PreviewLayerDragMode = "move" | "resize";

type PreviewCanvasGeometry = {
  width: number;
  height: number;
};

type PreviewLayerDragState = {
  pointerId: number;
  layerId: string;
  mode: PreviewLayerDragMode;
  initialX: number;
  initialY: number;
  originalX: number;
  originalY: number;
  originalWidth: number;
  originalHeight: number;
};

type PreviewLayerDragDraft = {
  layerId: string;
  geometry: Pick<TimelineLayer, "x" | "y" | "width" | "height">;
};

function getPreviewProjectPoint(
  event: React.PointerEvent<HTMLElement>,
  stage: HTMLElement,
  project: PreviewCanvasGeometry,
) {
  const rect = stage.getBoundingClientRect();

  return {
    x: ((event.clientX - rect.left) / rect.width) * project.width,
    y: ((event.clientY - rect.top) / rect.height) * project.height,
  };
}

function getPreviewLayerDraft(
  drag: PreviewLayerDragState,
  point: { x: number; y: number },
  project: PreviewCanvasGeometry,
): PreviewLayerDragDraft {
  const deltaX = point.x - drag.initialX;
  const deltaY = point.y - drag.initialY;
  const minSize = 36;

  if (drag.mode === "resize") {
    return {
      layerId: drag.layerId,
      geometry: {
        x: Math.round(drag.originalX),
        y: Math.round(drag.originalY),
        width: Math.round(
          clampPreviewValue(drag.originalWidth + deltaX, minSize, project.width - drag.originalX),
        ),
        height: Math.round(
          clampPreviewValue(drag.originalHeight + deltaY, minSize, project.height - drag.originalY),
        ),
      },
    };
  }

  return {
    layerId: drag.layerId,
    geometry: {
      x: Math.round(clampPreviewValue(drag.originalX + deltaX, 0, project.width - drag.originalWidth)),
      y: Math.round(clampPreviewValue(drag.originalY + deltaY, 0, project.height - drag.originalHeight)),
      width: Math.round(drag.originalWidth),
      height: Math.round(drag.originalHeight),
    },
  };
}

function clampPreviewValue(value: number, min: number, max: number) {
  return Math.min(Math.max(min, value), Math.max(min, max));
}

function getAspectPreviewGeometry(aspectRatio: AspectRatio): PreviewCanvasGeometry {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function getActivePreviewOverlayLayers(tracks: TimelineTrack[], previewTime: number): TimelineLayer[] {
  return tracks
    .flatMap((track) => track.layers)
    .filter((layer) =>
      ["text", "image", "caption", "shape"].includes(layer.type) &&
      (layer.type !== "caption" || Boolean(layer.content)) &&
      layer.start <= previewTime &&
      layer.start + layer.duration >= previewTime,
    )
    .slice(0, 16);
}

function resolveTimelineLayerGeometry(
  layer: TimelineLayer,
  geometry: PreviewCanvasGeometry,
): Required<Pick<TimelineLayer, "x" | "y" | "width" | "height">> {
  const defaults = getDefaultTimelineLayerGeometry(layer, geometry);

  return {
    x: layer.x ?? defaults.x,
    y: layer.y ?? defaults.y,
    width: layer.width ?? defaults.width,
    height: layer.height ?? defaults.height,
  };
}

function getDefaultTimelineLayerGeometry(
  layer: TimelineLayer,
  geometry: PreviewCanvasGeometry,
): Required<Pick<TimelineLayer, "x" | "y" | "width" | "height">> {
  if (layer.type === "image") {
    return {
      x: Math.round(geometry.width * 0.16),
      y: Math.round(geometry.height * 0.35),
      width: Math.round(geometry.width * 0.68),
      height: Math.round(geometry.height * 0.28),
    };
  }

  if (layer.type === "shape") {
    return {
      x: Math.round(geometry.width * 0.12),
      y: Math.round(geometry.height * 0.64),
      width: Math.round(geometry.width * 0.76),
      height: Math.round(geometry.height * 0.1),
    };
  }

  if (layer.type === "caption") {
    return {
      x: Math.round(geometry.width * 0.08),
      y: Math.round(geometry.height * 0.69),
      width: Math.round(geometry.width * 0.84),
      height: Math.round(geometry.height * 0.13),
    };
  }

  return {
    x: Math.round(geometry.width * 0.1),
    y: Math.round(geometry.height * 0.16),
    width: Math.round(geometry.width * 0.8),
    height: Math.round(geometry.height * 0.12),
  };
}

function getMediaObjectFitClass(fit: TimelineLayer["fit"]) {
  if (fit === "fill") return "object-fill";
  if (fit === "cover") return "object-cover";
  return "object-contain";
}

export function TimelineEditor({
  tracks,
  selectedLayerId,
  zoom,
  totalSeconds,
  onSelectLayer,
  onUpdateLayerTiming,
}: {
  tracks: TimelineTrack[];
  selectedLayerId: string;
  zoom: number;
  totalSeconds: number;
  onSelectLayer: (id: string) => void;
  onUpdateLayerTiming: (layerId: string, patch: Pick<TimelineTrack["layers"][number], "start" | "duration">) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const transferredRef = useRef(false);
  const dragRef = useRef<TimelineDragState | null>(null);
  const [dragDraft, setDragDraft] = useState<TimelineDragDraft | null>(null);
  const [cursor, setCursor] = useState("pointer");
  const renderedTracks = useMemo(
    () => (dragDraft ? applyTimelineDraft(tracks, dragDraft) : tracks),
    [dragDraft, tracks],
  );
  const canvasWidth = useMemo(
    () => getTimelineCanvasWidth(totalSeconds, zoom),
    [totalSeconds, zoom],
  );
  const canvasHeight = useMemo(
    () => getTimelineCanvasHeight(renderedTracks.length),
    [renderedTracks.length],
  );
  const renderPayload = useMemo<TimelineCanvasRenderPayload>(
    () => ({
      tracks: renderedTracks,
      selectedLayerId,
      totalSeconds,
      zoom,
      width: canvasWidth,
      height: canvasHeight,
      dpr: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    }),
    [canvasHeight, canvasWidth, renderedTracks, selectedLayerId, totalSeconds, zoom],
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

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(event, canvas, canvasWidth, canvasHeight);
      const hit = hitTestTimeline(renderPayload, point);
      if (!hit) return;

      const layer = tracks.flatMap((track) => track.layers).find((entry) => entry.id === hit.layerId);
      if (!layer) return;

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      onSelectLayer(hit.layerId);

      dragRef.current = {
        pointerId: event.pointerId,
        layerId: hit.layerId,
        mode: getTimelineDragMode(hit, point.x),
        initialX: point.x,
        originalStart: layer.start,
        originalDuration: layer.duration,
      };
    },
    [canvasHeight, canvasWidth, onSelectLayer, renderPayload, tracks],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(event, canvas, canvasWidth, canvasHeight);
      const pxPerSecond = getTimelinePixelsPerSecond(zoom);
      const drag = dragRef.current;

      if (!drag) {
        const hit = hitTestTimeline(renderPayload, point);
        setCursor(hit ? cursorForDragMode(getTimelineDragMode(hit, point.x)) : "pointer");
        return;
      }

      const deltaSeconds = (point.x - drag.initialX) / pxPerSecond;
      const draft = timingDraftFromDrag(drag, deltaSeconds);
      setDragDraft(draft);
      setCursor(cursorForDragMode(drag.mode));
    },
    [canvasHeight, canvasWidth, renderPayload, zoom],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const drag = dragRef.current;
      if (!drag) return;

      if (canvas?.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      const nextDraft = canvas
        ? timingDraftFromDrag(
            drag,
            (getCanvasPoint(event, canvas, canvasWidth, canvasHeight).x - drag.initialX) /
              getTimelinePixelsPerSecond(zoom),
          )
        : dragDraft;
      dragRef.current = null;
      setDragDraft(null);
      setCursor("pointer");

      if (nextDraft) {
        onUpdateLayerTiming(nextDraft.layerId, {
          start: nextDraft.start,
          duration: nextDraft.duration,
        });
      }
    },
    [canvasHeight, canvasWidth, dragDraft, onUpdateLayerTiming, zoom],
  );

  const handlePointerLeave = useCallback(() => {
    if (!dragRef.current) setCursor("pointer");
  }, []);

  const selectedLayer = renderedTracks
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
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            tabIndex={0}
            role="img"
            aria-label="Canvas timeline. Drag clips to move them or drag their edges to resize."
            className="block rounded-lg border border-[var(--line)] bg-black/20 outline-none transition focus:border-[var(--brand)]"
            style={{ cursor }}
          />
        </div>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-2 text-xs font-bold text-[var(--muted)]">
        Selected: <span className="text-[var(--foreground)]">{selectedLayer?.name ?? "None"}</span>
        {dragDraft ? (
          <span className="ms-3 text-[var(--brand)]">
            {formatDuration(dragDraft.start)} · {formatDuration(dragDraft.duration)}
          </span>
        ) : null}
      </div>
    </section>
  );
}

type TimelineDragMode = "move" | "resize-start" | "resize-end";

type TimelineDragState = {
  pointerId: number;
  layerId: string;
  mode: TimelineDragMode;
  initialX: number;
  originalStart: number;
  originalDuration: number;
};

type TimelineDragDraft = {
  layerId: string;
  start: number;
  duration: number;
};

function getCanvasPoint(
  event: React.PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvasWidth / rect.width),
    y: (event.clientY - rect.top) * (canvasHeight / rect.height),
  };
}

function getTimelineDragMode(hit: TimelineHitZone, x: number): TimelineDragMode {
  const threshold = Math.min(12, Math.max(6, hit.width * 0.18));
  if (x <= hit.x + threshold) return "resize-start";
  if (x >= hit.x + hit.width - threshold) return "resize-end";
  return "move";
}

function timingDraftFromDrag(drag: TimelineDragState, deltaSeconds: number): TimelineDragDraft {
  const minDuration = 0.25;
  const originalEnd = drag.originalStart + drag.originalDuration;

  if (drag.mode === "move") {
    return {
      layerId: drag.layerId,
      start: snapTimelineSeconds(Math.max(0, drag.originalStart + deltaSeconds)),
      duration: drag.originalDuration,
    };
  }

  if (drag.mode === "resize-start") {
    const start = snapTimelineSeconds(
      Math.max(0, Math.min(originalEnd - minDuration, drag.originalStart + deltaSeconds)),
    );

    return {
      layerId: drag.layerId,
      start,
      duration: snapTimelineSeconds(Math.max(minDuration, originalEnd - start)),
    };
  }

  return {
    layerId: drag.layerId,
    start: drag.originalStart,
    duration: snapTimelineSeconds(Math.max(minDuration, drag.originalDuration + deltaSeconds)),
  };
}

function applyTimelineDraft(tracks: TimelineTrack[], draft: TimelineDragDraft) {
  return tracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) =>
      layer.id === draft.layerId
        ? {
            ...layer,
            start: draft.start,
            duration: draft.duration,
          }
        : layer,
    ),
  }));
}

function snapTimelineSeconds(value: number) {
  return Math.round(value * 10) / 10;
}

function cursorForDragMode(mode: TimelineDragMode) {
  if (mode === "move") return "grab";
  return "ew-resize";
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
