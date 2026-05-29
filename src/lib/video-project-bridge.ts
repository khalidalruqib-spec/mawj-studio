import {
  createTimelineItem,
  getSafeMargins,
  getTrackForLayerType,
  type Animation,
  type Asset,
  type AspectRatio,
  type Background,
  type Layer,
  type LayerType,
  type TimelineItem,
  type Track,
  type TrackType,
  type VideoProject,
} from "@/lib/video-project-model";
import type {
  TemplateAnimation,
  TemplateLayer,
  TemplateProject,
  TemplateTimelineTrack,
} from "@/lib/video-template-engine";
import { resolveLayerFontFamily } from "@/lib/template-typography";

export type EditorTimelineLayerInput = {
  id: string;
  type:
    | "video"
    | "audio"
    | "text"
    | "image"
    | "caption"
    | "effect"
    | "shape"
    | "background"
    | "waveform";
  name: string;
  start: number;
  duration: number;
  color: string;
  muted?: boolean;
  content?: string;
  src?: string;
  sceneId?: string;
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
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
  opacity?: number;
  fit?: "cover" | "contain" | "fill";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  mediaZoom?: number;
  mediaOffsetX?: number;
  mediaOffsetY?: number;
  animationIn?: TemplateAnimation;
  animationOut?: TemplateAnimation;
  locked?: boolean;
  hidden?: boolean;
};

export type EditorTimelineTrackInput = {
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
  layers: EditorTimelineLayerInput[];
};

export type MediaAssetInput = {
  id: string;
  name: string;
  url: string;
  kind: "video" | "audio" | "image";
  size: number;
  mimeType?: string;
  duration?: number;
};

const DEFAULT_FPS = 30;
const DEFAULT_ASPECT_RATIO: AspectRatio = "9:16";

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
};

const TRACK_ORDER: TrackType[] = ["video", "image", "text", "captions", "audio", "effects"];

export function createBlankVideoProject({
  name = "Mawj Studio",
  aspectRatio = DEFAULT_ASPECT_RATIO,
  durationSeconds = 36,
}: {
  name?: string;
  aspectRatio?: AspectRatio;
  durationSeconds?: number;
} = {}): VideoProject {
  const now = new Date().toISOString();
  const dimensions = ASPECT_DIMENSIONS[aspectRatio];

  return {
    id: createId("project"),
    name,
    width: dimensions.width,
    height: dimensions.height,
    fps: DEFAULT_FPS,
    duration: durationSeconds,
    aspectRatio,
    assets: [],
    scenes: [
      {
        id: "scene-main",
        name: "Main Scene",
        start: 0,
        duration: durationSeconds,
        background: { type: "color", value: "#050816" },
        layerIds: [],
      },
    ],
    tracks: createBaseTracks(),
    layers: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createVideoProjectFromTemplateProject(templateProject: TemplateProject): VideoProject {
  const now = new Date().toISOString();
  const layerSources = templateProject.timeline.flatMap((track) => track.layers);
  const assets = collectAssetsFromTemplateLayers(layerSources);
  const layers = layerSources.map((layer, index) => templateLayerToVideoLayer(layer, assets, index));
  const tracks = templateProject.timeline.map((track, index) =>
    templateTrackToVideoTrack(track, layers, index),
  );
  const selectedLayer = layers.find((layer) => layer.type === "text") ?? layers[0] ?? null;

  return {
    id: templateProject.id,
    name: templateProject.name,
    width: templateProject.width,
    height: templateProject.height,
    fps: templateProject.export.fps,
    duration: templateProject.duration,
    aspectRatio: templateProject.aspectRatio,
    assets,
    scenes: templateProject.scenes.map((scene) => ({
      id: scene.id,
      name: scene.name,
      start: scene.start,
      duration: scene.duration,
      background: scene.background,
      transitionOut: scene.transition
        ? {
            type: scene.transition.type,
            duration: scene.transition.duration,
          }
        : undefined,
      layerIds: layers
        .filter((layer) => layer.id.startsWith(`${scene.id}-`))
        .map((layer) => layer.id),
    })),
    tracks,
    layers,
    selectedLayerId: selectedLayer?.id,
    selectedItemId: selectedLayer ? findTimelineItemId(tracks, selectedLayer.id) : undefined,
    createdAt: templateProject.createdAt || now,
    updatedAt: now,
  };
}

export function createVideoProjectFromMediaAssets({
  name = "Mawj Studio",
  aspectRatio = DEFAULT_ASPECT_RATIO,
  assets: mediaAssets,
  primaryVideoAssetId,
  durationSeconds = 60,
}: {
  name?: string;
  aspectRatio?: AspectRatio;
  assets: MediaAssetInput[];
  primaryVideoAssetId?: string;
  durationSeconds?: number;
}): VideoProject {
  const project = createBlankVideoProject({ name, aspectRatio, durationSeconds });
  const assets = mediaAssets.map(mediaAssetToProjectAsset);
  const layers = mediaAssets.map((asset, index) =>
    mediaAssetToLayer({
      asset,
      project,
      index,
      primary: asset.id === primaryVideoAssetId,
      durationSeconds,
    }),
  );
  const tracks = createTracksFromLayers(layers);
  const selectedLayer = layers.find((layer) => layer.assetId === primaryVideoAssetId) ?? layers[0] ?? null;

  return {
    ...project,
    name,
    assets,
    layers,
    tracks,
    scenes: [
      {
        ...project.scenes[0],
        duration: Math.max(durationSeconds, ...layers.map((layer) => layer.start + layer.duration)),
        layerIds: layers.map((layer) => layer.id),
      },
    ],
    selectedLayerId: selectedLayer?.id,
    selectedItemId: selectedLayer ? findTimelineItemId(tracks, selectedLayer.id) : undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function createVideoProjectFromEditorTimeline({
  baseProject,
  name = "Mawj Studio",
  aspectRatio = DEFAULT_ASPECT_RATIO,
  tracks,
  durationSeconds,
}: {
  baseProject: VideoProject | null;
  name?: string;
  aspectRatio?: AspectRatio;
  tracks: EditorTimelineTrackInput[];
  durationSeconds?: number;
}): VideoProject {
  const now = new Date().toISOString();
  const base = baseProject ?? createBlankVideoProject({ name, aspectRatio, durationSeconds });
  const dimensions = ASPECT_DIMENSIONS[aspectRatio];
  const allEditorLayers = tracks.flatMap((track) => track.layers);
  const layers = allEditorLayers.map((layer, index) =>
    editorTimelineLayerToVideoLayer(layer, base, index),
  );
  const canonicalTracks = tracks.map((track, index) => editorTrackToVideoTrack(track, layers, index));
  const projectDuration = Math.max(
    durationSeconds ?? base.duration,
    1,
    ...layers.map((layer) => layer.start + layer.duration),
  );
  const sceneIds = new Set(allEditorLayers.map((layer) => layer.sceneId).filter(Boolean));
  const scenes = sceneIds.size
    ? Array.from(sceneIds).map((sceneId, index) => {
        const sceneLayers = allEditorLayers.filter((layer) => layer.sceneId === sceneId);
        const sceneStart = Math.min(...sceneLayers.map((layer) => layer.start));
        const sceneEnd = Math.max(...sceneLayers.map((layer) => layer.start + layer.duration));

        return {
          id: sceneId ?? `scene-${index + 1}`,
          name: `Scene ${index + 1}`,
          start: sceneStart,
          duration: Math.max(0.1, sceneEnd - sceneStart),
          background: { type: "color", value: "#050816" } satisfies Background,
          layerIds: sceneLayers.map((layer) => layer.id),
        };
      })
    : [
        {
          id: "scene-main",
          name: "Main Scene",
          start: 0,
          duration: projectDuration,
          background: { type: "color", value: "#050816" } satisfies Background,
          layerIds: layers.map((layer) => layer.id),
        },
      ];

  return {
    ...base,
    name,
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio,
    duration: projectDuration,
    scenes,
    tracks: canonicalTracks,
    layers,
    selectedLayerId: base.selectedLayerId,
    selectedItemId: base.selectedItemId,
    updatedAt: now,
  };
}

export function editorLayerPatchToVideoLayerPatch(
  patch: Partial<EditorTimelineLayerInput>,
): Partial<Layer> {
  const style = {
    fontFamily: patch.fontFamily,
    fontSize: patch.fontSize,
    fontWeight: patch.fontWeight,
    lineHeight: patch.lineHeight,
    color: patch.textColor ?? patch.color,
    textStrokeColor: patch.textStrokeColor,
    textStrokeWidth: patch.textStrokeWidth,
    textShadowColor: patch.textShadowColor,
    textShadowBlur: patch.textShadowBlur,
    textShadowOffsetX: patch.textShadowOffsetX,
    textShadowOffsetY: patch.textShadowOffsetY,
    backgroundColor: patch.backgroundColor,
    borderRadius: patch.borderRadius,
    borderColor: patch.borderColor,
    borderWidth: patch.borderWidth,
    padding: patch.padding,
    align: patch.align,
    direction: patch.direction,
    fit: patch.fit,
    brightness: patch.brightness,
    contrast: patch.contrast,
    saturation: patch.saturation,
    blur: patch.blur,
    mediaZoom: patch.mediaZoom,
    mediaOffsetX: patch.mediaOffsetX,
    mediaOffsetY: patch.mediaOffsetY,
  };
  const cleanStyle = removeUndefined(style);

  return removeUndefined({
    content: patch.content ?? patch.name,
    src: patch.src,
    x: patch.x,
    y: patch.y,
    width: patch.width,
    height: patch.height,
    rotation: patch.rotation,
    opacity: patch.opacity,
    locked: patch.locked,
    hidden: patch.hidden,
    start: patch.start,
    duration: patch.duration,
    animationIn: templateAnimationToProjectAnimation(patch.animationIn),
    animationOut: templateAnimationToProjectAnimation(patch.animationOut),
    style: Object.keys(cleanStyle).length ? cleanStyle : undefined,
  });
}

function createBaseTracks(): Track[] {
  return TRACK_ORDER.map((type, index) => ({
    id: `track-${type}`,
    type,
    name: defaultTrackName(type),
    order: index,
    items: [],
  }));
}

function createTracksFromLayers(layers: Layer[]): Track[] {
  const tracks = createBaseTracks();

  return tracks.map((track) => ({
    ...track,
    items: layers
      .filter((layer) => getTrackForLayerType(layer.type) === track.type)
      .map((layer) => layerToTimelineItem(layer, track.id)),
  }));
}

function templateTrackToVideoTrack(
  track: TemplateTimelineTrack,
  layers: Layer[],
  index: number,
): Track {
  const type = templateTrackTypeToProjectTrackType(track.kind);

  return {
    id: track.id,
    type,
    name: track.name,
    order: index,
    items: track.layers.map((layer, itemIndex) => {
      const matchingLayer = layers.find((entry) => entry.id === layer.id);
      const layerType = matchingLayer?.type ?? templateLayerTypeToProjectLayerType(layer.type);

      return createTimelineItem({
        id: `${layer.id}-item`,
        layerId: layer.id,
        trackId: track.id,
        type: layerType,
        start: layer.absoluteStart,
        duration: layer.duration,
        zIndex: matchingLayer?.zIndex ?? itemIndex,
        locked: false,
        hidden: false,
      });
    }),
  };
}

function editorTrackToVideoTrack(
  track: EditorTimelineTrackInput,
  layers: Layer[],
  index: number,
): Track {
  const type = editorTrackTypeToProjectTrackType(track);

  return {
    id: track.id,
    type,
    name: track.name,
    order: index,
    items: track.layers.map((layer, itemIndex) => {
      const matchingLayer = layers.find((entry) => entry.id === layer.id);
      const layerType = matchingLayer?.type ?? editorLayerTypeToProjectLayerType(layer.type);

      return createTimelineItem({
        id: `${layer.id}-item`,
        layerId: layer.id,
        trackId: track.id,
        type: layerType,
        start: layer.start,
        duration: Math.max(0.1, layer.duration),
        zIndex: matchingLayer?.zIndex ?? itemIndex,
        locked: layer.locked ?? matchingLayer?.locked ?? false,
        hidden: layer.hidden ?? matchingLayer?.hidden ?? false,
      });
    }),
  };
}

function layerToTimelineItem(layer: Layer, trackId: string): TimelineItem {
  return createTimelineItem({
    id: `${layer.id}-item`,
    layerId: layer.id,
    trackId,
    type: layer.type,
    start: layer.start,
    duration: layer.duration,
    zIndex: layer.zIndex,
    locked: layer.locked,
    hidden: layer.hidden,
  });
}

function templateLayerToVideoLayer(
  layer: TemplateTimelineTrack["layers"][number],
  assets: Asset[],
  index: number,
): Layer {
  const type = templateLayerTypeToProjectLayerType(layer.type);
  const asset = layer.src ? assets.find((entry) => entry.src === layer.src) : null;

  return {
    id: layer.id,
    type,
    assetId: asset?.id,
    content: layer.content ?? layer.name,
    src: layer.src,
    x: layer.x ?? 0,
    y: layer.y ?? 0,
    width: layer.width ?? defaultLayerSize(type).width,
    height: layer.height ?? defaultLayerSize(type).height,
    rotation: layer.rotation ?? 0,
    scaleX: 1,
    scaleY: 1,
    opacity: layer.opacity ?? 1,
    zIndex: index,
    start: layer.absoluteStart,
    duration: Math.max(0.1, layer.duration),
    editable: layer.editable,
    locked: false,
    hidden: false,
    style: {
      fontFamily: layer.fontFamily ?? defaultFontForDirection(layer.direction),
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      lineHeight: layer.lineHeight,
      color: layer.color,
      textStrokeColor: layer.textStrokeColor,
      textStrokeWidth: layer.textStrokeWidth,
      textShadowColor: layer.textShadowColor,
      textShadowBlur: layer.textShadowBlur,
      textShadowOffsetX: layer.textShadowOffsetX,
      textShadowOffsetY: layer.textShadowOffsetY,
      backgroundColor: layer.backgroundColor,
      borderRadius: layer.borderRadius,
      borderColor: layer.borderColor,
      borderWidth: layer.borderWidth,
      padding: layer.padding,
      align: layer.align,
      direction: layer.direction,
      fit: layer.fit,
      brightness: layer.brightness,
      contrast: layer.contrast,
      saturation: layer.saturation,
      blur: layer.blur,
      mediaZoom: layer.mediaZoom,
      mediaOffsetX: layer.mediaOffsetX,
      mediaOffsetY: layer.mediaOffsetY,
    },
    effects: layer.type === "waveform" ? [{ id: `${layer.id}-waveform`, type: "waveform", enabled: true, params: {} }] : undefined,
    animationIn: templateAnimationToProjectAnimation(layer.animationIn),
    animationOut: templateAnimationToProjectAnimation(layer.animationOut),
  };
}

function editorTimelineLayerToVideoLayer(
  layer: EditorTimelineLayerInput,
  baseProject: VideoProject,
  index: number,
): Layer {
  const previous = baseProject.layers.find((entry) => entry.id === layer.id);
  const type = editorLayerTypeToProjectLayerType(layer.type);
  const asset = findAssetForEditorLayer(layer, baseProject.assets);
  const dimensions = defaultEditorLayerBox(layer, type, baseProject.aspectRatio);

  return {
    id: layer.id,
    type,
    assetId: asset?.id ?? previous?.assetId,
    content: layer.content ?? (layer.type === "text" || layer.type === "caption" ? layer.name : previous?.content),
    src: layer.src ?? asset?.src ?? previous?.src,
    x: layer.x ?? previous?.x ?? dimensions.x,
    y: layer.y ?? previous?.y ?? dimensions.y,
    width: layer.width ?? previous?.width ?? dimensions.width,
    height: layer.height ?? previous?.height ?? dimensions.height,
    rotation: layer.rotation ?? previous?.rotation ?? 0,
    scaleX: previous?.scaleX ?? 1,
    scaleY: previous?.scaleY ?? 1,
    opacity: layer.opacity ?? previous?.opacity ?? 1,
    zIndex: previous?.zIndex ?? index,
    start: layer.start,
    duration: Math.max(0.1, layer.duration),
    editable: previous?.editable ?? true,
    locked: layer.locked ?? previous?.locked ?? false,
    hidden: layer.hidden ?? previous?.hidden ?? false,
    style: {
      ...previous?.style,
      fontFamily: layer.fontFamily ?? previous?.style?.fontFamily ?? defaultFontForDirection(layer.direction ?? "auto"),
      fontSize: layer.fontSize ?? previous?.style?.fontSize,
      fontWeight: layer.fontWeight ?? previous?.style?.fontWeight,
      lineHeight: layer.lineHeight ?? previous?.style?.lineHeight,
      color: layer.textColor ?? layer.color ?? previous?.style?.color,
      textStrokeColor: layer.textStrokeColor ?? previous?.style?.textStrokeColor,
      textStrokeWidth: layer.textStrokeWidth ?? previous?.style?.textStrokeWidth,
      textShadowColor: layer.textShadowColor ?? previous?.style?.textShadowColor,
      textShadowBlur: layer.textShadowBlur ?? previous?.style?.textShadowBlur,
      textShadowOffsetX: layer.textShadowOffsetX ?? previous?.style?.textShadowOffsetX,
      textShadowOffsetY: layer.textShadowOffsetY ?? previous?.style?.textShadowOffsetY,
      backgroundColor: layer.backgroundColor ?? previous?.style?.backgroundColor,
      borderRadius: layer.borderRadius ?? previous?.style?.borderRadius,
      borderColor: layer.borderColor ?? previous?.style?.borderColor,
      borderWidth: layer.borderWidth ?? previous?.style?.borderWidth,
      padding: layer.padding ?? previous?.style?.padding,
      align: layer.align ?? previous?.style?.align ?? "center",
      direction: layer.direction ?? previous?.style?.direction ?? "auto",
      fit: layer.fit ?? previous?.style?.fit ?? (type === "video" || type === "image" ? "cover" : undefined),
      brightness: layer.brightness ?? previous?.style?.brightness,
      contrast: layer.contrast ?? previous?.style?.contrast,
      saturation: layer.saturation ?? previous?.style?.saturation,
      blur: layer.blur ?? previous?.style?.blur,
      mediaZoom: layer.mediaZoom ?? previous?.style?.mediaZoom,
      mediaOffsetX: layer.mediaOffsetX ?? previous?.style?.mediaOffsetX,
      mediaOffsetY: layer.mediaOffsetY ?? previous?.style?.mediaOffsetY,
    },
    effects:
      layer.type === "effect"
        ? [
            {
              id: `${layer.id}-effect`,
              type: layer.name,
              enabled: true,
              params: { source: "editor-timeline" },
            },
          ]
        : previous?.effects,
    keyframes: previous?.keyframes,
    animationIn: templateAnimationToProjectAnimation(layer.animationIn) ?? previous?.animationIn,
    animationOut: templateAnimationToProjectAnimation(layer.animationOut) ?? previous?.animationOut,
  };
}

function mediaAssetToLayer({
  asset,
  project,
  index,
  primary,
  durationSeconds,
}: {
  asset: MediaAssetInput;
  project: VideoProject;
  index: number;
  primary: boolean;
  durationSeconds: number;
}): Layer {
  const type = asset.kind === "audio" ? "audio" : asset.kind;
  const size = defaultEditorLayerBox(
    {
      type,
    },
    type,
    project.aspectRatio,
  );

  return {
    id: `${asset.id}-layer`,
    type,
    assetId: asset.id,
    content: type === "audio" ? asset.name : undefined,
    src: asset.url,
    x: size.x,
    y: size.y,
    width: size.width,
    height: size.height,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    zIndex: index,
    start: primary ? 0 : index * 2,
    duration: Math.max(0.1, asset.duration ?? durationSeconds),
    editable: true,
    locked: false,
    hidden: false,
    style: {
      fit: type === "video" || type === "image" ? "cover" : undefined,
      direction: "auto",
    },
  };
}

function collectAssetsFromTemplateLayers(layers: TemplateTimelineTrack["layers"]): Asset[] {
  const sources = new Map<string, Asset>();

  layers.forEach((layer) => {
    if (!layer.src || layer.src.includes("{{")) return;
    if (sources.has(layer.src)) return;

    sources.set(layer.src, {
      id: createId("asset"),
      type: templateLayerAssetType(layer),
      name: layer.name ?? layer.id,
      src: layer.src,
    });
  });

  return Array.from(sources.values());
}

function mediaAssetToProjectAsset(asset: MediaAssetInput): Asset {
  return {
    id: asset.id,
    type: asset.kind,
    name: asset.name,
    src: asset.url,
    duration: asset.duration,
    size: asset.size,
    mimeType: asset.mimeType,
  };
}

function findAssetForEditorLayer(layer: EditorTimelineLayerInput, assets: Asset[]) {
  if (layer.src) {
    return assets.find((asset) => asset.src === layer.src || asset.id === layer.id || layer.id.startsWith(asset.id)) ?? null;
  }

  if (layer.type === "video") {
    return assets.find((asset) => asset.type === "video" && asset.name === layer.name) ?? assets.find((asset) => asset.type === "video") ?? null;
  }

  if (layer.type === "audio") {
    return assets.find((asset) => asset.type === "audio" && asset.name === layer.name) ?? assets.find((asset) => asset.type === "audio") ?? null;
  }

  if (layer.type === "image") {
    return assets.find((asset) => asset.type === "image" && asset.name === layer.name) ?? null;
  }

  return null;
}

function defaultEditorLayerBox(
  layer: Pick<EditorTimelineLayerInput, "type">,
  type: LayerType,
  aspectRatio: AspectRatio,
) {
  const dimensions = ASPECT_DIMENSIONS[aspectRatio];
  const safeMargins = getSafeMargins(aspectRatio);

  if (type === "text" || type === "captions") {
    return {
      x: safeMargins.left,
      y: type === "captions" ? dimensions.height - safeMargins.bottom - 260 : safeMargins.top + 80,
      width: dimensions.width - safeMargins.left - safeMargins.right,
      height: type === "captions" ? 220 : 160,
    };
  }

  if (type === "audio" || type === "waveform") {
    return { x: 0, y: 0, width: dimensions.width, height: 120 };
  }

  if (layer.type === "effect" || type === "shape" || type === "background") {
    return { x: 0, y: 0, width: dimensions.width, height: dimensions.height };
  }

  return { x: 0, y: 0, width: dimensions.width, height: dimensions.height };
}

function defaultLayerSize(type: LayerType) {
  if (type === "text" || type === "captions") return { width: 920, height: 160 };
  if (type === "audio" || type === "waveform") return { width: 1080, height: 120 };
  return { width: 1080, height: 1080 };
}

function defaultTrackName(type: TrackType) {
  const names: Record<TrackType, string> = {
    video: "Video Track",
    image: "Image Track",
    text: "Text Track",
    captions: "Captions Track",
    audio: "Audio Track",
    effects: "Effects Track",
  };

  return names[type];
}

function templateTrackTypeToProjectTrackType(kind: TemplateTimelineTrack["kind"]): TrackType {
  if (kind === "video") return "video";
  if (kind === "audio" || kind === "waveform") return "audio";
  if (kind === "captions") return "captions";
  if (kind === "text") return "text";
  if (kind === "image") return "image";
  return "effects";
}

function editorTrackTypeToProjectTrackType(track: EditorTimelineTrackInput): TrackType {
  if (track.kind === "video") return "video";
  if (track.kind === "audio" || track.kind === "waveform") return "audio";
  if (track.kind === "caption") return "captions";
  if (track.kind === "image") return "image";
  if (track.kind === "text") return "text";
  if (track.kind === "overlay") {
    return track.layers.every((layer) => layer.type === "image") ? "image" : "text";
  }

  return "effects";
}

function templateLayerTypeToProjectLayerType(type: TemplateLayer["type"]): LayerType {
  if (type === "captions") return "captions";
  return type;
}

function editorLayerTypeToProjectLayerType(type: EditorTimelineLayerInput["type"]): LayerType {
  if (type === "caption") return "captions";
  if (type === "effect") return "shape";
  return type;
}

function templateLayerAssetType(layer: TemplateLayer): Asset["type"] {
  if (layer.type === "audio") return "audio";
  if (layer.type === "video") return "video";
  if (layer.type === "image") return "image";
  return "image";
}

function templateAnimationToProjectAnimation(animation?: TemplateLayer["animationIn"]): Animation | undefined {
  if (!animation || animation.type === "rotateIn") return undefined;

  return {
    type: animation.type,
    duration: animation.duration,
    delay: animation.delay,
    easing: animation.easing,
  };
}

function defaultFontForDirection(direction?: "ltr" | "rtl" | "auto") {
  return resolveLayerFontFamily({ layer: { direction } });
}

function findTimelineItemId(tracks: Track[], layerId: string) {
  return tracks.flatMap((track) => track.items).find((item) => item.layerId === layerId)?.id;
}

function removeUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
