import {
  TEMPLATE_FONT_PRESET_INPUT_KEY,
  resolveLayerFontFamily,
} from "@/lib/template-typography";

export type TemplateInputType =
  | "text"
  | "textarea"
  | "image"
  | "video"
  | "audio"
  | "color"
  | "select";

export type VideoTemplateInput = {
  key: string;
  label: string;
  type: TemplateInputType;
  default?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

export type TemplateBackground = {
  type: "color" | "gradient" | "image" | "video" | "blur" | "transparent";
  value?: string;
  from?: string;
  to?: string;
  src?: string;
};

export type TemplateAnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomIn"
  | "zoomOut"
  | "pop"
  | "bounce"
  | "typewriter"
  | "blurReveal"
  | "rotateIn";

export type TemplateAnimation = {
  type: TemplateAnimationType;
  duration: number;
  delay?: number;
  easing?: string;
};

export type TemplateTransition = {
  type: "cut" | "fade" | "slide" | "zoom" | "wipe" | "blur";
  duration: number;
  direction?: "up" | "down" | "left" | "right";
};

export type TemplateLayerType =
  | "text"
  | "image"
  | "video"
  | "shape"
  | "captions"
  | "audio"
  | "background"
  | "waveform";

export type TemplateLayer = {
  id: string;
  type: TemplateLayerType;
  name?: string;
  content?: string;
  src?: string;
  source?: string;
  shape?: "rect" | "circle" | "line";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  start?: number;
  duration?: number;
  color?: string;
  backgroundColor?: string;
  /** Gradient start color (used when type === "background") */
  gradientFrom?: string;
  /** Gradient end color (used when type === "background") */
  gradientTo?: string;
  /** Gradient angle in degrees, default 145 */
  angle?: number;
  borderColor?: string;
  borderRadius?: number;
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
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  lineHeight?: number;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadowColor?: string;
  textShadowBlur?: number;
  textShadowOffsetX?: number;
  textShadowOffsetY?: number;
  align?: "left" | "center" | "right";
  direction?: "auto" | "rtl" | "ltr";
  highlightColor?: string;
  style?: string;
  editable?: boolean;
  locked?: boolean;
  hidden?: boolean;
  safeMargin?: boolean;
  animationIn?: TemplateAnimation;
  animationOut?: TemplateAnimation;
};

export type TemplateScene = {
  id: string;
  name: string;
  start: number;
  duration: number;
  background: TemplateBackground;
  layers: TemplateLayer[];
  transition?: TemplateTransition;
};

export type TemplateAudio = {
  music: string | null;
  volume: number;
  voiceover?: string | null;
};

export type TemplateExportSettings = {
  format: "mp4" | "webm";
  fps: number;
  quality: "720p" | "1080p" | "4k";
};

export type VideoTemplate = {
  id: string;
  name: string;
  category: string;
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  width: number;
  height: number;
  duration: number;
  description: string;
  language?: "ar" | "en" | "mixed";
  requiredInputs: VideoTemplateInput[];
  scenes: TemplateScene[];
  animations?: TemplateAnimationType[];
  transitions?: Array<TemplateTransition["type"]>;
  audio: TemplateAudio;
  export: TemplateExportSettings;
  safeMargins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  thumbnailUrl?: string;
  previewUrl?: string;
};

export type TemplateUserInputs = Record<string, string>;

const STOCK_PROXY_PREFIX = "/api/stock/proxy?url=";

const DEMO_MEDIA = {
  photos: {
    business: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900",
    city: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=900",
    coffee: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=900",
    food: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=900",
    luxury: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=900",
    nature: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg?auto=compress&cs=tinysrgb&w=900",
    phone: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=900",
    portrait: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=900",
    product: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=900",
    property: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=900",
    tech: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=900",
    team: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
  videos: {
    city: "https://videos.pexels.com/video-files/855564/855564-hd_1280_720_24fps.mp4",
    studio: "https://videos.pexels.com/video-files/2795405/2795405-uhd_1440_2560_25fps.mp4",
  },
};

export type TemplateTimelineLayer = TemplateLayer & {
  id: string;
  sceneId: string;
  sceneName: string;
  absoluteStart: number;
  duration: number;
  editable: boolean;
};

export type TemplateTimelineTrack = {
  id: string;
  name: string;
  kind: "scenes" | "video" | "audio" | "text" | "image" | "shape" | "captions" | "background" | "waveform";
  layers: TemplateTimelineLayer[];
};

export type TemplateProject = {
  id: string;
  name: string;
  templateId: string;
  width: number;
  height: number;
  aspectRatio: VideoTemplate["aspectRatio"];
  duration: number;
  scenes: TemplateScene[];
  timeline: TemplateTimelineTrack[];
  audio: TemplateAudio;
  export: TemplateExportSettings;
  inputs: TemplateUserInputs;
  createdAt: string;
  updatedAt: string;
};

export function replacePlaceholders(value: unknown, inputs: TemplateUserInputs): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{(.*?)\}\}/g, (_, key: string) => inputs[key.trim()] ?? "");
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, inputs));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replacePlaceholders(item, inputs)]),
    );
  }

  return value;
}

export function hydrateTemplate(
  template: VideoTemplate,
  userInputs: TemplateUserInputs,
): VideoTemplate {
  const inputs = buildTemplateInputs(template, userInputs);
  return applyTypographyPreset(replacePlaceholders(template, inputs) as VideoTemplate, inputs);
}

export function createProjectFromTemplate(
  template: VideoTemplate,
  userInputs: TemplateUserInputs,
): TemplateProject {
  const hydratedTemplate = hydrateTemplate(template, userInputs);
  const now = new Date().toISOString();

  return {
    id: createId("template-project"),
    name: hydratedTemplate.name,
    templateId: hydratedTemplate.id,
    width: hydratedTemplate.width,
    height: hydratedTemplate.height,
    aspectRatio: hydratedTemplate.aspectRatio,
    duration: hydratedTemplate.duration,
    scenes: hydratedTemplate.scenes,
    timeline: convertScenesToTimeline(hydratedTemplate.scenes),
    audio: hydratedTemplate.audio,
    export: hydratedTemplate.export,
    inputs: buildTemplateInputs(template, userInputs),
    createdAt: now,
    updatedAt: now,
  };
}

export function convertScenesToTimeline(scenes: TemplateScene[]): TemplateTimelineTrack[] {
  const tracks = createTimelineTracks();

  for (const scene of scenes) {
    tracks.background.layers.push({
      id: `${scene.id}-background`,
      sceneId: scene.id,
      sceneName: scene.name,
      type: "background",
      name: `${scene.name} background`,
      absoluteStart: scene.start,
      start: 0,
      duration: scene.duration,
      editable: true,
      backgroundColor: scene.background.value ?? scene.background.from ?? "transparent",
    });

    tracks.scenes.layers.push({
      id: scene.id,
      sceneId: scene.id,
      sceneName: scene.name,
      type: "shape",
      name: scene.name,
      absoluteStart: scene.start,
      start: 0,
      duration: scene.duration,
      editable: true,
      color: "#8ef7c2",
    });

    for (const layer of scene.layers) {
      const track = getTrackForLayer(tracks, layer.type);
      track.layers.push({
        ...layer,
        id: `${scene.id}-${layer.id}`,
        sceneId: scene.id,
        sceneName: scene.name,
        absoluteStart: scene.start + (layer.start ?? 0),
        duration: layer.duration ?? scene.duration,
        editable: layer.editable ?? true,
      });
    }
  }

  return Object.values(tracks).filter((track) => track.layers.length > 0);
}

export function renderTemplatePreview(template: VideoTemplate) {
  const firstScene = template.scenes[0];
  return {
    width: template.width,
    height: template.height,
    aspectRatio: template.aspectRatio,
    duration: template.duration,
    scene: firstScene,
    safeMargins: template.safeMargins ?? getDefaultSafeMargins(template.aspectRatio),
  };
}

export function exportProject(project: TemplateProject) {
  return {
    status: "ready-for-editor-export" as const,
    format: project.export.format,
    quality: project.export.quality,
    fps: project.export.fps,
    project,
  };
}

export function buildTemplateInputs(
  template: VideoTemplate,
  userInputs: TemplateUserInputs,
): TemplateUserInputs {
  return template.requiredInputs.reduce<TemplateUserInputs>((inputs, input) => {
    inputs[input.key] = userInputs[input.key] ?? input.default ?? getDemoMediaDefault(template, input) ?? "";
    return inputs;
  }, { ...userInputs });
}

function applyTypographyPreset(template: VideoTemplate, inputs: TemplateUserInputs): VideoTemplate {
  const presetId = inputs[TEMPLATE_FONT_PRESET_INPUT_KEY];
  if (!presetId) return template;

  return {
    ...template,
    scenes: template.scenes.map((scene) => ({
      ...scene,
      layers: scene.layers.map((layer) => {
        if (layer.type !== "text" && layer.type !== "captions") return layer;

        return {
          ...layer,
          fontFamily: resolveLayerFontFamily({ layer, template, presetId }),
        };
      }),
    })),
  };
}

function getDemoMediaDefault(template: VideoTemplate, input: VideoTemplateInput) {
  if (input.type === "image") {
    return stockProxyUrl(selectDemoPhoto(template, input));
  }

  if (input.type === "video") {
    return stockProxyUrl(selectDemoVideo(template, input));
  }

  return undefined;
}

function selectDemoPhoto(template: VideoTemplate, input: VideoTemplateInput) {
  const signal = `${template.id} ${template.category} ${template.name} ${input.key} ${input.label}`.toLowerCase();

  if (signal.includes("logo")) return "/platform-logo.png";
  if (signal.includes("food") || signal.includes("restaurant") || signal.includes("menu") || signal.includes("مطعم")) return DEMO_MEDIA.photos.food;
  if (signal.includes("estate") || signal.includes("property") || signal.includes("real") || signal.includes("عقار")) return DEMO_MEDIA.photos.property;
  if (signal.includes("course") || signal.includes("lecture") || signal.includes("education") || signal.includes("trainer")) return DEMO_MEDIA.photos.tech;
  if (signal.includes("personal") || signal.includes("portrait") || signal.includes("profile") || signal.includes("photo")) return DEMO_MEDIA.photos.portrait;
  if (signal.includes("fashion") || signal.includes("look")) return DEMO_MEDIA.photos.luxury;
  if (signal.includes("news") || signal.includes("city")) return DEMO_MEDIA.photos.city;
  if (signal.includes("business") || signal.includes("team") || signal.includes("legal")) return DEMO_MEDIA.photos.business;
  if (signal.includes("phone") || signal.includes("social") || signal.includes("tiktok")) return DEMO_MEDIA.photos.phone;
  if (signal.includes("coffee") || signal.includes("cafe")) return DEMO_MEDIA.photos.coffee;
  if (signal.includes("background") || signal.includes("cover")) return DEMO_MEDIA.photos.nature;

  return DEMO_MEDIA.photos.product;
}

function selectDemoVideo(template: VideoTemplate, input: VideoTemplateInput) {
  const signal = `${template.id} ${template.category} ${template.name} ${input.key} ${input.label}`.toLowerCase();
  if (signal.includes("city") || signal.includes("news") || signal.includes("story")) return DEMO_MEDIA.videos.city;
  return DEMO_MEDIA.videos.studio;
}

function stockProxyUrl(url: string) {
  if (!url || url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:")) return url;
  return `${STOCK_PROXY_PREFIX}${encodeURIComponent(url)}`;
}

export function getDefaultSafeMargins(aspectRatio: VideoTemplate["aspectRatio"]) {
  if (aspectRatio === "9:16") {
    return { top: 160, bottom: 260, left: 70, right: 70 };
  }

  return { top: 72, bottom: 72, left: 96, right: 96 };
}

function createTimelineTracks() {
  return {
    scenes: { id: "track-scenes", name: "Scenes", kind: "scenes", layers: [] as TemplateTimelineLayer[] },
    video: { id: "track-video", name: "Video", kind: "video", layers: [] as TemplateTimelineLayer[] },
    audio: { id: "track-audio", name: "Audio", kind: "audio", layers: [] as TemplateTimelineLayer[] },
    text: { id: "track-text", name: "Text", kind: "text", layers: [] as TemplateTimelineLayer[] },
    image: { id: "track-image", name: "Images / Logos", kind: "image", layers: [] as TemplateTimelineLayer[] },
    shape: { id: "track-shape", name: "Shapes", kind: "shape", layers: [] as TemplateTimelineLayer[] },
    captions: { id: "track-captions", name: "Captions", kind: "captions", layers: [] as TemplateTimelineLayer[] },
    background: { id: "track-background", name: "Backgrounds", kind: "background", layers: [] as TemplateTimelineLayer[] },
    waveform: { id: "track-waveform", name: "Waveform", kind: "waveform", layers: [] as TemplateTimelineLayer[] },
  } satisfies Record<string, TemplateTimelineTrack>;
}

function getTrackForLayer(
  tracks: ReturnType<typeof createTimelineTracks>,
  type: TemplateLayerType,
): TemplateTimelineTrack {
  if (type === "video") return tracks.video;
  if (type === "audio") return tracks.audio;
  if (type === "text") return tracks.text;
  if (type === "image") return tracks.image;
  if (type === "shape") return tracks.shape;
  if (type === "captions") return tracks.captions;
  if (type === "background") return tracks.background;
  if (type === "waveform") return tracks.waveform;
  return tracks.scenes;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
