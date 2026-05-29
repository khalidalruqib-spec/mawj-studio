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
import { resolveLayerFilter } from "@/lib/layer-filters";
import type { AspectRatio, VideoStyle } from "@/lib/video-styles";
import type { VideoProject } from "@/lib/video-project-model";
import { isUsableMediaDuration } from "@/lib/media-duration";
import {
  getTimelineCanvasHeight,
  getTimelineCanvasWidth,
  getTimelinePixelsPerSecond,
  getTimelineSecondFromX,
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
  onUpdateLayer,
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
  onUpdateLayer: (id: string, patch: Partial<TimelineLayer>) => void;
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
            onUpdateLayer={onUpdateLayer}
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
  onUpdateLayer,
}: {
  aspectRatio: AspectRatio;
  tracks: TimelineTrack[];
  currentTime: number;
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<TimelineLayer>) => void;
}) {
  const dimensions = useMemo(() => getPreviewDesignDimensions(aspectRatio), [aspectRatio]);
  const designWidth = dimensions.width;
  const designHeight = dimensions.height;
  const [interactionState, setInteractionState] = useState<PreviewInteractionState | null>(null);
  const [editingText, setEditingText] = useState<PreviewTextEditState | null>(null);
  const layers = tracks
    .flatMap((track) => track.layers)
    .filter((layer) => isRenderablePreviewLayer(layer, currentTime));
  const activeFrame = interactionState
    ? getPreviewInteractionFrame(interactionState, dimensions)
    : null;

  const startDrag = useCallback(
    (layer: TimelineLayer, event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSelectLayer(layer.id);
      if (layer.locked) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
      setInteractionState({
        mode: "move",
        layerId: layer.id,
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startLayerX: layer.x ?? 0,
        startLayerY: layer.y ?? 0,
        startLayerWidth: layer.width ?? designWidth,
        startLayerHeight: layer.height ?? Math.max(120, designHeight * 0.08),
        scaleX: bounds ? designWidth / bounds.width : 1,
        scaleY: bounds ? designHeight / bounds.height : 1,
        deltaX: 0,
        deltaY: 0,
      });
    },
    [designHeight, designWidth, onSelectLayer],
  );

  const startResize = useCallback(
    (layer: TimelineLayer, handle: ResizeHandle, event: React.PointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onSelectLayer(layer.id);
      if (layer.locked) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const bounds = event.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
      setInteractionState({
        mode: "resize",
        handle,
        layerId: layer.id,
        pointerId: event.pointerId,
        startPointerX: event.clientX,
        startPointerY: event.clientY,
        startLayerX: layer.x ?? 0,
        startLayerY: layer.y ?? 0,
        startLayerWidth: layer.width ?? designWidth,
        startLayerHeight: layer.height ?? Math.max(120, designHeight * 0.08),
        scaleX: bounds ? designWidth / bounds.width : 1,
        scaleY: bounds ? designHeight / bounds.height : 1,
        deltaX: 0,
        deltaY: 0,
      });
    },
    [designHeight, designWidth, onSelectLayer],
  );

  const moveInteraction = useCallback((event: React.PointerEvent<HTMLElement>) => {
    setInteractionState((state) => {
      if (!state || state.pointerId !== event.pointerId) return state;

      return {
        ...state,
        deltaX: (event.clientX - state.startPointerX) * state.scaleX,
        deltaY: (event.clientY - state.startPointerY) * state.scaleY,
      };
    });
  }, []);

  const endInteraction = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      setInteractionState((state) => {
        if (!state || state.pointerId !== event.pointerId) return state;

        const frame = getPreviewInteractionFrame(state, { width: designWidth, height: designHeight });
        onUpdateLayer(state.layerId, frame);
        return null;
      });
    },
    [designHeight, designWidth, onUpdateLayer],
  );
  const startTextEdit = useCallback(
    (layer: TimelineLayer) => {
      if (layer.locked) return;
      if (layer.type !== "text" && layer.type !== "caption") return;
      onSelectLayer(layer.id);
      setEditingText({
        layerId: layer.id,
        draft: layer.content ?? layer.name,
      });
    },
    [onSelectLayer],
  );
  const updateTextDraft = useCallback((layerId: string, draft: string) => {
    setEditingText((state) => (state?.layerId === layerId ? { ...state, draft } : state));
  }, []);
  const commitTextEdit = useCallback(
    (layer: TimelineLayer) => {
      setEditingText((state) => {
        if (!state || state.layerId !== layer.id) return state;

        const content = state.draft.trim() ? state.draft : layer.content ?? layer.name;
        onUpdateLayer(layer.id, {
          content,
          name: content.slice(0, 42) || layer.name,
        });

        return null;
      });
    },
    [onUpdateLayer],
  );
  const cancelTextEdit = useCallback(() => setEditingText(null), []);

  if (!layers.length) return null;

  return (
    <div className="absolute inset-0 z-10">
      {layers.map((layer) => (
        <TimelinePreviewLayer
          key={layer.id}
          layer={layer}
          dimensions={dimensions}
          currentTime={currentTime}
          selected={layer.id === selectedLayerId}
          interactionFrame={activeFrame?.layerId === layer.id ? activeFrame : null}
          onSelect={() => onSelectLayer(layer.id)}
          onPointerDown={(event) => startDrag(layer, event)}
          onPointerMove={moveInteraction}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
          onResizePointerDown={(handle, event) => startResize(layer, handle, event)}
          editingDraft={editingText?.layerId === layer.id ? editingText.draft : null}
          onStartTextEdit={() => startTextEdit(layer)}
          onChangeTextDraft={(draft) => updateTextDraft(layer.id, draft)}
          onCommitTextEdit={() => commitTextEdit(layer)}
          onCancelTextEdit={cancelTextEdit}
        />
      ))}
    </div>
  );
}

function TimelinePreviewLayer({
  layer,
  dimensions,
  currentTime,
  selected,
  interactionFrame,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onResizePointerDown,
  editingDraft,
  onStartTextEdit,
  onChangeTextDraft,
  onCommitTextEdit,
  onCancelTextEdit,
}: {
  layer: TimelineLayer;
  dimensions: { width: number; height: number };
  currentTime: number;
  selected: boolean;
  interactionFrame: PreviewLayerFrame | null;
  onSelect: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown: (handle: ResizeHandle, event: React.PointerEvent<HTMLElement>) => void;
  editingDraft: string | null;
  onStartTextEdit: () => void;
  onChangeTextDraft: (draft: string) => void;
  onCommitTextEdit: () => void;
  onCancelTextEdit: () => void;
}) {
  const box = getTimelineLayerBox(layer, dimensions, interactionFrame);
  const locked = Boolean(layer.locked);
  const animatedStyle = getPreviewAnimatedStyle(layer, currentTime);
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
        className={`${baseClass} ${locked ? "cursor-not-allowed" : "cursor-pointer"} border-0 p-0`}
        style={{
          ...box,
          borderRadius: scalePreviewRadius(layer.borderRadius),
          border: resolvePreviewLayerBorder(layer, getPreviewFontScale(dimensions)),
          boxSizing: "border-box",
          opacity: (layer.opacity ?? 1) * animatedStyle.opacity,
          transform: resolvePreviewLayerTransform(layer, animatedStyle),
          transformOrigin: "center",
        }}
      >
        <img
          src={layer.src}
          alt={layer.name}
          className="h-full w-full"
          style={{
            objectFit: layer.fit ?? "cover",
            objectPosition: resolvePreviewMediaObjectPosition(layer),
            filter: resolveLayerFilter(layer, getPreviewFontScale(dimensions)),
            transform: `scale(${layer.mediaZoom ?? 1})`,
            transformOrigin: "center",
          }}
        />
        <ResizeHandles selected={selected && !locked} onResizePointerDown={onResizePointerDown} />
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
        className={`${baseClass} ${locked ? "cursor-not-allowed" : "cursor-pointer"} border-0 p-0`}
        style={{
          ...box,
          backgroundColor: layer.backgroundColor ?? layer.color,
          borderRadius: scalePreviewRadius(layer.borderRadius),
          border: resolvePreviewLayerBorder(layer, getPreviewFontScale(dimensions)),
          boxSizing: "border-box",
          opacity: (layer.opacity ?? 1) * animatedStyle.opacity,
          transform: resolvePreviewLayerTransform(layer, animatedStyle),
          transformOrigin: "center",
        }}
      >
        <ResizeHandles selected={selected && !locked} onResizePointerDown={onResizePointerDown} />
      </button>
    );
  }

  const text = layer.content ?? layer.name;
  if (!text.trim()) return null;

  const textAlign = layer.align ?? "center";
  const fontScale = getPreviewFontScale(dimensions);
  const textLayerStyle = {
    ...box,
    color: layer.textColor ?? layer.color,
    backgroundColor: layer.backgroundColor,
    borderRadius: scalePreviewRadius(layer.borderRadius),
    border: resolvePreviewLayerBorder(layer, fontScale),
    boxSizing: "border-box",
    padding: `${Math.max(0, (layer.padding ?? 8) * fontScale)}px`,
    fontFamily: layer.fontFamily,
    fontSize: `${Math.max(11, (layer.fontSize ?? 48) * fontScale)}px`,
    fontWeight: normalizeTemplateFontWeight(layer.fontWeight),
    lineHeight: layer.lineHeight ?? 1.15,
    justifyItems: textAlign === "right" ? "end" : textAlign === "left" ? "start" : "center",
    textAlign,
    opacity: (layer.opacity ?? 1) * animatedStyle.opacity,
    WebkitTextStroke: resolvePreviewTextStroke(layer, fontScale),
    textShadow: resolvePreviewTextShadow(layer, fontScale),
    transform: resolvePreviewLayerTransform(layer, animatedStyle),
    transformOrigin: "center",
  } satisfies React.CSSProperties;

  if (editingDraft !== null) {
    return (
      <textarea
        value={editingDraft}
        autoFocus
        aria-label={`Edit ${layer.name}`}
        onChange={(event) => onChangeTextDraft(event.target.value)}
        onBlur={onCommitTextEdit}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancelTextEdit();
          }

          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            onCommitTextEdit();
          }
        }}
        dir={layer.direction ?? "auto"}
        className={`${baseClass} resize-none border-0 p-2 text-center font-black leading-tight outline outline-2 outline-[var(--brand)]`}
        style={textLayerStyle}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Select ${layer.name}`}
      onClick={onSelect}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (locked) return;
        onStartTextEdit();
      }}
      {...pointerHandlers}
      className={`${baseClass} grid ${locked ? "cursor-not-allowed" : "cursor-pointer"} place-items-center border-0 px-2 text-center font-black leading-tight`}
      dir={layer.direction ?? "auto"}
      style={textLayerStyle}
    >
      {text}
      <ResizeHandles selected={selected && !locked} onResizePointerDown={onResizePointerDown} />
    </button>
  );
}

function ResizeHandles({
  selected,
  onResizePointerDown,
}: {
  selected: boolean;
  onResizePointerDown: (handle: ResizeHandle, event: React.PointerEvent<HTMLElement>) => void;
}) {
  if (!selected) return null;

  return (
    <>
      {RESIZE_HANDLES.map((handle) => (
        <span
          key={handle}
          aria-hidden="true"
          onPointerDown={(event) => onResizePointerDown(handle, event)}
          className={`absolute z-20 h-3 w-3 rounded-full border border-black bg-[var(--brand)] shadow-lg ${resizeHandleClass(handle)}`}
        />
      ))}
    </>
  );
}

function isRenderablePreviewLayer(layer: TimelineLayer, currentTime: number) {
  if (layer.hidden) return false;
  if (currentTime < layer.start || currentTime > layer.start + layer.duration) return false;
  if (layer.type === "image") return Boolean(layer.src);
  if (layer.type === "shape") return true;
  if (layer.type === "text") return Boolean(layer.content?.trim());
  if (layer.type === "caption") return Boolean(layer.content?.trim());
  return false;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se";

type PreviewInteractionState = {
  mode: "move" | "resize";
  handle?: ResizeHandle;
  layerId: string;
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startLayerX: number;
  startLayerY: number;
  startLayerWidth: number;
  startLayerHeight: number;
  scaleX: number;
  scaleY: number;
  deltaX: number;
  deltaY: number;
};

type PreviewLayerFrame = {
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type PreviewTextEditState = {
  layerId: string;
  draft: string;
};

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se"];
const MIN_PREVIEW_LAYER_SIZE = 80;

function getPreviewInteractionFrame(
  state: PreviewInteractionState,
  dimensions: { width: number; height: number },
): PreviewLayerFrame {
  if (state.mode === "move") {
    return clampPreviewFrame(
      {
        layerId: state.layerId,
        x: Math.round(state.startLayerX + state.deltaX),
        y: Math.round(state.startLayerY + state.deltaY),
        width: state.startLayerWidth,
        height: state.startLayerHeight,
      },
      dimensions,
    );
  }

  const handle = state.handle ?? "se";
  let x = state.startLayerX;
  let y = state.startLayerY;
  let width = state.startLayerWidth;
  let height = state.startLayerHeight;

  if (handle.includes("e")) {
    width = state.startLayerWidth + state.deltaX;
  }

  if (handle.includes("s")) {
    height = state.startLayerHeight + state.deltaY;
  }

  if (handle.includes("w")) {
    x = state.startLayerX + state.deltaX;
    width = state.startLayerWidth - state.deltaX;
  }

  if (handle.includes("n")) {
    y = state.startLayerY + state.deltaY;
    height = state.startLayerHeight - state.deltaY;
  }

  if (width < MIN_PREVIEW_LAYER_SIZE) {
    if (handle.includes("w")) x -= MIN_PREVIEW_LAYER_SIZE - width;
    width = MIN_PREVIEW_LAYER_SIZE;
  }

  if (height < MIN_PREVIEW_LAYER_SIZE) {
    if (handle.includes("n")) y -= MIN_PREVIEW_LAYER_SIZE - height;
    height = MIN_PREVIEW_LAYER_SIZE;
  }

  return clampPreviewFrame(
    {
      layerId: state.layerId,
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    },
    dimensions,
  );
}

function clampPreviewFrame(frame: PreviewLayerFrame, dimensions: { width: number; height: number }): PreviewLayerFrame {
  const width = Math.min(Math.max(MIN_PREVIEW_LAYER_SIZE, frame.width), dimensions.width);
  const height = Math.min(Math.max(MIN_PREVIEW_LAYER_SIZE, frame.height), dimensions.height);

  return {
    layerId: frame.layerId,
    width,
    height,
    x: Math.min(Math.max(0, frame.x), Math.max(0, dimensions.width - width)),
    y: Math.min(Math.max(0, frame.y), Math.max(0, dimensions.height - height)),
  };
}

function getTimelineLayerBox(
  layer: TimelineLayer,
  dimensions: { width: number; height: number },
  interactionFrame: PreviewLayerFrame | null,
) {
  const x = interactionFrame?.x ?? layer.x ?? 0;
  const y = interactionFrame?.y ?? layer.y ?? 0;
  const width = interactionFrame?.width ?? layer.width ?? dimensions.width;
  const height = interactionFrame?.height ?? layer.height ?? Math.max(120, dimensions.height * 0.08);

  return {
    left: `${(x / dimensions.width) * 100}%`,
    top: `${(y / dimensions.height) * 100}%`,
    width: `${(width / dimensions.width) * 100}%`,
    height: `${(height / dimensions.height) * 100}%`,
  };
}

function resizeHandleClass(handle: ResizeHandle) {
  const positions: Record<ResizeHandle, string> = {
    nw: "left-1 top-1 cursor-nwse-resize",
    ne: "right-1 top-1 cursor-nesw-resize",
    sw: "bottom-1 left-1 cursor-nesw-resize",
    se: "bottom-1 right-1 cursor-nwse-resize",
  };

  return positions[handle];
}

function getPreviewFontScale(dimensions: { width: number }) {
  return 100 / dimensions.width;
}

function getPreviewDesignDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function resolvePreviewMediaObjectPosition(layer: Pick<TimelineLayer, "mediaOffsetX" | "mediaOffsetY">) {
  const x = Math.min(100, Math.max(0, 50 + (layer.mediaOffsetX ?? 0) / 2));
  const y = Math.min(100, Math.max(0, 50 + (layer.mediaOffsetY ?? 0) / 2));
  return `${x}% ${y}%`;
}

function combinePreviewTransforms(...transforms: Array<string | undefined>) {
  const value = transforms.filter(Boolean).join(" ");
  return value || undefined;
}

function resolvePreviewLayerBorder(layer: Pick<TimelineLayer, "borderColor" | "borderWidth">, scale: number) {
  const width = Math.max(0, (layer.borderWidth ?? 0) * scale);
  if (!width) return undefined;
  return `${Math.max(1, width)}px solid ${layer.borderColor ?? "rgba(255,255,255,0.72)"}`;
}

function scalePreviewRadius(radius?: number) {
  return radius ? `${Math.max(4, radius * 0.2)}px` : undefined;
}

function resolvePreviewLayerTransform(
  layer: Pick<TimelineLayer, "rotation">,
  animation: { translateX: number; translateY: number; scale: number },
) {
  const transforms: string[] = [];
  if (animation.translateX) transforms.push(`translateX(${animation.translateX}%)`);
  if (animation.translateY) transforms.push(`translateY(${animation.translateY}%)`);
  if (animation.scale !== 1) transforms.push(`scale(${animation.scale})`);
  if (layer.rotation) transforms.push(`rotate(${layer.rotation}deg)`);
  return transforms.length ? transforms.join(" ") : undefined;
}

function getPreviewAnimatedStyle(layer: TimelineLayer, currentTime: number) {
  const relativeTime = currentTime - layer.start;
  let opacity = 1;
  let translateX = 0;
  let translateY = 0;
  let scale = 1;

  const applyAnimation = (type: string, progress: number, direction: "in" | "out") => {
    const eased = easePreview(progress);
    const inverse = 1 - eased;
    const amount = direction === "in" ? inverse : eased;

    if (type === "fadeIn" || type === "fadeOut") opacity *= direction === "in" ? eased : 1 - eased;
    if (type === "slideUp") translateY += direction === "in" ? amount * 28 : -amount * 28;
    if (type === "slideDown") translateY += direction === "in" ? -amount * 28 : amount * 28;
    if (type === "slideLeft") translateX += direction === "in" ? amount * 28 : -amount * 28;
    if (type === "slideRight") translateX += direction === "in" ? -amount * 28 : amount * 28;
    if (type === "zoomIn") scale *= direction === "in" ? 0.72 + eased * 0.28 : 1 + eased * 0.24;
    if (type === "zoomOut") scale *= direction === "in" ? 1.24 - eased * 0.24 : 1 - eased * 0.24;
    if (type === "pop") scale *= direction === "in" ? 0.7 + eased * 0.3 : 1 - eased * 0.18;
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

function easePreview(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function resolvePreviewTextStroke(layer: Pick<TimelineLayer, "textStrokeColor" | "textStrokeWidth">, scale: number) {
  const width = layer.textStrokeWidth ?? 4;
  if (width <= 0) return undefined;
  return `${Math.max(0.4, width * scale)}px ${layer.textStrokeColor ?? "rgba(0,0,0,0.66)"}`;
}

function resolvePreviewTextShadow(
  layer: Pick<TimelineLayer, "textShadowColor" | "textShadowBlur" | "textShadowOffsetX" | "textShadowOffsetY">,
  scale: number,
) {
  const blur = Math.max(0, (layer.textShadowBlur ?? 0) * scale);
  const offsetX = (layer.textShadowOffsetX ?? 0) * scale;
  const offsetY = (layer.textShadowOffsetY ?? 0) * scale;

  if (!blur && !offsetX && !offsetY) return undefined;
  return `${offsetX}px ${offsetY}px ${blur}px ${layer.textShadowColor ?? "rgba(0,0,0,0.72)"}`;
}

export function TemplatePreviewLayer({
  layer,
  project,
}: {
  layer: TemplateTimelineTrack["layers"][number];
  project: TemplateProject;
}) {
  const staticAnimation = { opacity: 1, translateX: 0, translateY: 0, scale: 1 };
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
          lineHeight: layer.lineHeight ?? 1.15,
          WebkitTextStroke: resolvePreviewTextStroke(layer, 0.2),
          textShadow: resolvePreviewTextShadow(layer, 0.2),
          backgroundColor: layer.backgroundColor,
          borderRadius: layer.borderRadius ? `${Math.max(4, layer.borderRadius * 0.2)}px` : undefined,
          border: resolvePreviewLayerBorder(layer, 0.2),
          boxSizing: "border-box",
          padding: `${Math.max(0, (layer.padding ?? 8) * 0.2)}px`,
          transform: resolvePreviewLayerTransform(layer, staticAnimation),
          transformOrigin: "center",
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
      <img
        src={src}
        alt={layer.name ?? layer.id}
        className="absolute"
        style={{
          ...style,
          objectFit: layer.fit ?? "cover",
          objectPosition: resolvePreviewMediaObjectPosition(layer),
          borderRadius: layer.borderRadius ? `${Math.max(4, layer.borderRadius * 0.2)}px` : undefined,
          border: resolvePreviewLayerBorder(layer, 0.2),
          boxSizing: "border-box",
          opacity: layer.opacity ?? 1,
          filter: resolveLayerFilter(layer, 0.2),
          transform: combinePreviewTransforms(resolvePreviewLayerTransform(layer, staticAnimation), `scale(${layer.mediaZoom ?? 1})`),
          transformOrigin: "center",
        }}
      />
    ) : (
      <div
        className="absolute grid place-items-center border border-white/20 bg-white/10 text-xs font-black text-white/70"
        style={{
          ...style,
          transform: resolvePreviewLayerTransform(layer, staticAnimation),
          transformOrigin: "center",
        }}
      >
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
        transform: resolvePreviewLayerTransform(layer, staticAnimation),
        transformOrigin: "center",
      }}
    />
  );
}

export function TimelineEditor({
  tracks,
  selectedLayerId,
  zoom,
  totalSeconds,
  currentTime,
  onSelectLayer,
  onUpdateLayer,
  onSeek,
}: {
  tracks: TimelineTrack[];
  selectedLayerId: string;
  zoom: number;
  totalSeconds: number;
  currentTime: number;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, patch: Partial<TimelineLayer>) => void;
  onSeek: (seconds: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const transferredRef = useRef(false);
  const [timelineDrag, setTimelineDrag] = useState<TimelineDragState | null>(null);
  const [timelineScrub, setTimelineScrub] = useState<TimelineScrubState | null>(null);
  const canvasWidth = useMemo(
    () => getTimelineCanvasWidth(totalSeconds, zoom),
    [totalSeconds, zoom],
  );
  const canvasHeight = useMemo(
    () => getTimelineCanvasHeight(tracks.length),
    [tracks.length],
  );
  const previewTracks = useMemo(
    () => (timelineDrag ? applyTimelineDragPreview(tracks, timelineDrag, totalSeconds) : tracks),
    [timelineDrag, totalSeconds, tracks],
  );
  const renderPayload = useMemo<TimelineCanvasRenderPayload>(
    () => ({
      tracks: previewTracks,
      selectedLayerId,
      totalSeconds,
      playheadSeconds: currentTime,
      zoom,
      width: canvasWidth,
      height: canvasHeight,
      dpr: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    }),
    [canvasHeight, canvasWidth, currentTime, previewTracks, selectedLayerId, totalSeconds, zoom],
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

  const handleTimelinePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const point = {
        x: (event.clientX - rect.left) * (canvasWidth / rect.width),
        y: (event.clientY - rect.top) * (canvasHeight / rect.height),
      };
      const hit = hitTestTimeline(renderPayload, point);
      if (!hit) {
        event.preventDefault();
        canvas.setPointerCapture(event.pointerId);
        setTimelineScrub({ pointerId: event.pointerId });
        onSeek(getTimelineSecondFromX(point.x, zoom, totalSeconds));
        return;
      }

      const layer = tracks
        .flatMap((track) => track.layers)
        .find((item) => item.id === hit.layerId);

      onSelectLayer(hit.layerId);
      if (!layer || layer.locked) return;

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      setTimelineDrag({
        layerId: layer.id,
        pointerId: event.pointerId,
        mode: getTimelineDragMode(hit.x, hit.width, point.x),
        startPointerX: event.clientX,
        scaleX: canvasWidth / rect.width,
        pxPerSecond: getTimelinePixelsPerSecond(zoom),
        start: layer.start,
        duration: layer.duration,
        deltaSeconds: 0,
      });
    },
    [canvasHeight, canvasWidth, onSeek, onSelectLayer, renderPayload, totalSeconds, tracks, zoom],
  );
  const handleTimelinePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (timelineScrub?.pointerId === event.pointerId) {
        const rect = canvas.getBoundingClientRect();
        const pointX = (event.clientX - rect.left) * (canvasWidth / rect.width);
        event.preventDefault();
        onSeek(getTimelineSecondFromX(pointX, zoom, totalSeconds));
        return;
      }

      if (!timelineDrag || timelineDrag.pointerId !== event.pointerId) return;
      event.preventDefault();
      setTimelineDrag({
        ...timelineDrag,
        deltaSeconds: ((event.clientX - timelineDrag.startPointerX) * timelineDrag.scaleX) / timelineDrag.pxPerSecond,
      });
    },
    [canvasWidth, onSeek, timelineDrag, timelineScrub, totalSeconds, zoom],
  );
  const handleTimelinePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (timelineScrub?.pointerId === event.pointerId) {
        event.preventDefault();
        setTimelineScrub(null);
        return;
      }

      if (!timelineDrag || timelineDrag.pointerId !== event.pointerId) return;

      event.preventDefault();
      const patch = getTimelineDragPatch(timelineDrag, totalSeconds);
      if (
        patch.start !== roundTimelineSeconds(timelineDrag.start) ||
        patch.duration !== roundTimelineSeconds(timelineDrag.duration)
      ) {
        onUpdateLayer(timelineDrag.layerId, patch);
      }
      setTimelineDrag(null);
    },
    [onUpdateLayer, timelineDrag, timelineScrub, totalSeconds],
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
            onPointerDown={handleTimelinePointerDown}
            onPointerMove={handleTimelinePointerMove}
            onPointerUp={handleTimelinePointerEnd}
            onPointerCancel={handleTimelinePointerEnd}
            tabIndex={0}
            role="img"
            aria-label="Canvas timeline. Drag clips to move timing, or drag edges to trim."
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

type TimelineDragMode = "move" | "trim-start" | "trim-end";

type TimelineDragState = {
  layerId: string;
  pointerId: number;
  mode: TimelineDragMode;
  startPointerX: number;
  scaleX: number;
  pxPerSecond: number;
  start: number;
  duration: number;
  deltaSeconds: number;
};

type TimelineScrubState = {
  pointerId: number;
};

function getTimelineDragMode(zoneX: number, zoneWidth: number, pointerX: number): TimelineDragMode {
  const edgeWidth = Math.min(12, Math.max(6, zoneWidth / 3));
  if (pointerX <= zoneX + edgeWidth) return "trim-start";
  if (pointerX >= zoneX + zoneWidth - edgeWidth) return "trim-end";
  return "move";
}

function applyTimelineDragPreview(
  tracks: TimelineTrack[],
  drag: TimelineDragState,
  totalSeconds: number,
): TimelineTrack[] {
  const patch = getTimelineDragPatch(drag, totalSeconds);

  return tracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) =>
      layer.id === drag.layerId
        ? {
            ...layer,
            ...patch,
          }
        : layer,
    ),
  }));
}

function getTimelineDragPatch(
  drag: TimelineDragState,
  totalSeconds: number,
): Pick<TimelineLayer, "start" | "duration"> {
  const delta = roundTimelineSeconds(drag.deltaSeconds);
  const minDuration = 0.5;

  if (drag.mode === "trim-start") {
    const maxStart = drag.start + drag.duration - minDuration;
    const start = clampTimelineSeconds(drag.start + delta, 0, maxStart);
    return {
      start,
      duration: roundTimelineSeconds(drag.duration - (start - drag.start)),
    };
  }

  if (drag.mode === "trim-end") {
    const duration = clampTimelineSeconds(drag.duration + delta, minDuration, Math.max(minDuration, totalSeconds - drag.start));
    return {
      start: roundTimelineSeconds(drag.start),
      duration,
    };
  }

  return {
    start: clampTimelineSeconds(drag.start + delta, 0, Math.max(0, totalSeconds - minDuration)),
    duration: roundTimelineSeconds(drag.duration),
  };
}

function roundTimelineSeconds(value: number) {
  return Math.round(value * 10) / 10;
}

function clampTimelineSeconds(value: number, min: number, max: number) {
  return roundTimelineSeconds(Math.min(max, Math.max(min, value)));
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
