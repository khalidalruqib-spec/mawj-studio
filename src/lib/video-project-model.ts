import { z } from "zod";
import { LAYER_BLEND_MODES, type LayerBlendMode } from "@/lib/layer-blend-modes";

export const ASSET_TYPES = ["video", "image", "audio", "music", "font", "lottie"] as const;
export const LAYER_TYPES = [
  "video",
  "image",
  "text",
  "audio",
  "captions",
  "shape",
  "background",
  "waveform",
  "lottie",
  "sticker",
] as const;
export const TRACK_TYPES = ["video", "audio", "text", "image", "captions", "effects"] as const;
export const ANIMATION_TYPES = [
  "fadeIn",
  "fadeOut",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "zoomIn",
  "zoomOut",
  "pop",
  "bounce",
  "typewriter",
  "blurReveal",
] as const;
export const TRANSITION_TYPES = ["cut", "fade", "slide", "zoom", "wipe", "blur"] as const;
export const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "4:5"] as const;
export const BACKGROUND_TYPES = ["color", "gradient", "image", "video", "blur", "transparent"] as const;

export type AssetType = (typeof ASSET_TYPES)[number];
export type LayerType = (typeof LAYER_TYPES)[number];
export type TrackType = (typeof TRACK_TYPES)[number];
export type AnimationType = (typeof ANIMATION_TYPES)[number];
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export type AspectRatio = (typeof ASPECT_RATIOS)[number];
export type BackgroundType = (typeof BACKGROUND_TYPES)[number];

export interface VideoProject {
  id: string;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  aspectRatio: AspectRatio;
  assets: Asset[];
  scenes: Scene[];
  tracks: Track[];
  layers: Layer[];
  selectedItemId?: string;
  selectedLayerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  name: string;
  src: string;
  duration?: number;
  width?: number;
  height?: number;
  size?: number;
  mimeType?: string;
}

export interface Scene {
  id: string;
  name: string;
  start: number;
  duration: number;
  background?: Background;
  transitionIn?: Transition;
  transitionOut?: Transition;
  layerIds: string[];
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  order: number;
  muted?: boolean;
  locked?: boolean;
  hidden?: boolean;
  items: TimelineItem[];
}

export interface TimelineItem {
  id: string;
  layerId: string;
  trackId: string;
  type: LayerType;
  start: number;
  duration: number;
  end: number;
  zIndex: number;
  locked: boolean;
  hidden: boolean;
}

export interface Layer {
  id: string;
  type: LayerType;
  assetId?: string;
  content?: string;
  src?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  zIndex: number;
  start: number;
  duration: number;
  editable: boolean;
  locked: boolean;
  hidden: boolean;
  style?: LayerStyle;
  effects?: Effect[];
  keyframes?: Keyframe[];
  animationIn?: Animation;
  animationOut?: Animation;
}

export interface LayerStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  color?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  borderColor?: string;
  borderWidth?: number;
  shadow?: string;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  blendMode?: LayerBlendMode;
  align?: "left" | "center" | "right";
  direction?: "ltr" | "rtl" | "auto";
  fit?: "cover" | "contain" | "fill";
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  mediaZoom?: number;
  mediaOffsetX?: number;
  mediaOffsetY?: number;
}

export interface Keyframe {
  id: string;
  time: number;
  properties: Partial<KeyframeProperties>;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface KeyframeProperties {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

export interface Effect {
  id: string;
  type: string;
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface Animation {
  type: AnimationType;
  duration: number;
  delay?: number;
  easing?: string;
}

export interface Transition {
  type: TransitionType;
  duration: number;
}

export interface Background {
  type: BackgroundType;
  value?: string;
  from?: string;
  to?: string;
  src?: string;
}

export interface SafeMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const layerStyleSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.string().optional(),
  lineHeight: z.number().positive().optional(),
  color: z.string().optional(),
  textStrokeColor: z.string().optional(),
  textStrokeWidth: z.number().min(0).optional(),
  textShadowColor: z.string().optional(),
  textShadowBlur: z.number().min(0).optional(),
  textShadowOffsetX: z.number().optional(),
  textShadowOffsetY: z.number().optional(),
  backgroundColor: z.string().optional(),
  borderRadius: z.number().min(0).optional(),
  padding: z.number().min(0).optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().min(0).optional(),
  shadow: z.string().optional(),
  shadowColor: z.string().optional(),
  shadowBlur: z.number().min(0).optional(),
  shadowOffsetX: z.number().optional(),
  shadowOffsetY: z.number().optional(),
  blendMode: z.enum(LAYER_BLEND_MODES).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  direction: z.enum(["ltr", "rtl", "auto"]).optional(),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
  brightness: z.number().min(0).optional(),
  contrast: z.number().min(0).optional(),
  saturation: z.number().min(0).optional(),
  blur: z.number().min(0).optional(),
  mediaZoom: z.number().positive().optional(),
  mediaOffsetX: z.number().optional(),
  mediaOffsetY: z.number().optional(),
});

export const keyframePropertiesSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().optional(),
  scaleX: z.number().positive().optional(),
  scaleY: z.number().positive().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const keyframeSchema = z.object({
  id: z.string().min(1),
  time: z.number().min(0),
  properties: keyframePropertiesSchema,
  easing: z.enum(["linear", "easeIn", "easeOut", "easeInOut"]).optional(),
});

export const effectSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  enabled: z.boolean(),
  params: z.record(z.string(), z.unknown()),
});

export const animationSchema = z.object({
  type: z.enum(ANIMATION_TYPES),
  duration: z.number().positive(),
  delay: z.number().min(0).optional(),
  easing: z.string().optional(),
});

export const transitionSchema = z.object({
  type: z.enum(TRANSITION_TYPES),
  duration: z.number().min(0),
});

export const backgroundSchema = z.object({
  type: z.enum(BACKGROUND_TYPES),
  value: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  src: z.string().optional(),
});

export const assetSchema = z.object({
  id: z.string().min(1),
  type: z.enum(ASSET_TYPES),
  name: z.string().min(1),
  src: z.string().min(1),
  duration: z.number().min(0).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  size: z.number().min(0).optional(),
  mimeType: z.string().optional(),
});

export const layerSchema = z.object({
  id: z.string().min(1),
  type: z.enum(LAYER_TYPES),
  assetId: z.string().optional(),
  content: z.string().optional(),
  src: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
  scaleX: z.number().positive().optional(),
  scaleY: z.number().positive().optional(),
  opacity: z.number().min(0).max(1).optional(),
  zIndex: z.number(),
  start: z.number().min(0),
  duration: z.number().positive(),
  editable: z.boolean(),
  locked: z.boolean(),
  hidden: z.boolean(),
  style: layerStyleSchema.optional(),
  effects: z.array(effectSchema).optional(),
  keyframes: z.array(keyframeSchema).optional(),
  animationIn: animationSchema.optional(),
  animationOut: animationSchema.optional(),
});

export const timelineItemSchema = z
  .object({
    id: z.string().min(1),
    layerId: z.string().min(1),
    trackId: z.string().min(1),
    type: z.enum(LAYER_TYPES),
    start: z.number().min(0),
    duration: z.number().positive(),
    end: z.number().positive(),
    zIndex: z.number(),
    locked: z.boolean(),
    hidden: z.boolean(),
  })
  .refine((item) => item.end === item.start + item.duration, {
    message: "TimelineItem end must equal start + duration.",
    path: ["end"],
  });

export const trackSchema = z.object({
  id: z.string().min(1),
  type: z.enum(TRACK_TYPES),
  name: z.string().min(1),
  order: z.number().int(),
  muted: z.boolean().optional(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  items: z.array(timelineItemSchema),
});

export const sceneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  start: z.number().min(0),
  duration: z.number().positive(),
  background: backgroundSchema.optional(),
  transitionIn: transitionSchema.optional(),
  transitionOut: transitionSchema.optional(),
  layerIds: z.array(z.string().min(1)),
});

export const videoProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  fps: z.number().positive(),
  duration: z.number().positive(),
  aspectRatio: z.enum(ASPECT_RATIOS),
  assets: z.array(assetSchema),
  scenes: z.array(sceneSchema),
  tracks: z.array(trackSchema),
  layers: z.array(layerSchema),
  selectedItemId: z.string().optional(),
  selectedLayerId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export function createTimelineItem(input: Omit<TimelineItem, "end">): TimelineItem {
  return {
    ...input,
    end: input.start + input.duration,
  };
}

export function getLayerById(project: VideoProject, layerId: string) {
  return project.layers.find((layer) => layer.id === layerId) ?? null;
}

export function getTimelineItemById(project: VideoProject, itemId: string) {
  return project.tracks.flatMap((track) => track.items).find((item) => item.id === itemId) ?? null;
}

export function getTrackForLayerType(type: LayerType): TrackType {
  if (type === "audio" || type === "waveform") return "audio";
  if (type === "captions") return "captions";
  if (type === "text") return "text";
  if (type === "image" || type === "lottie" || type === "sticker") return "image";
  if (type === "background" || type === "shape") return "effects";
  return "video";
}

export function getSafeMargins(aspectRatio: AspectRatio): SafeMargins {
  if (aspectRatio === "9:16") {
    return { top: 160, bottom: 260, left: 70, right: 70 };
  }

  return { top: 72, bottom: 72, left: 96, right: 96 };
}
