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
  opacity?: number;
  fit?: "cover" | "contain" | "fill";
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  align?: "left" | "center" | "right";
  direction?: "auto" | "rtl" | "ltr";
  highlightColor?: string;
  style?: string;
  editable?: boolean;
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

const TEMPLATE_DEMO_PHOTOS = {
  nature: "https://images.pexels.com/photos/1261731/pexels-photo-1261731.jpeg?auto=compress&cs=tinysrgb&w=1200",
  city: "https://images.pexels.com/photos/2014422/pexels-photo-2014422.jpeg?auto=compress&cs=tinysrgb&w=1200",
  business: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200",
  food: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200",
  luxury: "https://images.pexels.com/photos/380769/pexels-photo-380769.jpeg?auto=compress&cs=tinysrgb&w=1200",
  retail: "https://images.pexels.com/photos/1072824/pexels-photo-1072824.jpeg?auto=compress&cs=tinysrgb&w=1200",
  portrait: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
  property: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1200",
  office: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1200",
  mobile: "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1200",
  cafe: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1200",
  professional: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

const TEMPLATE_DEMO_VIDEOS = {
  podcast: "https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4",
  studio: "https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_24fps.mp4",
  social: "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4",
};

function stockProxyUrl(url: string) {
  return `/api/stock/proxy?url=${encodeURIComponent(url)}`;
}

function getDemoMediaDefault(template: VideoTemplate, input: VideoTemplateInput) {
  if (input.default) return input.default;

  if (input.type === "video") {
    const key = `${template.id} ${template.category} ${input.key}`.toLowerCase();
    if (key.includes("podcast")) return stockProxyUrl(TEMPLATE_DEMO_VIDEOS.podcast);
    if (key.includes("tiktok") || key.includes("reels") || key.includes("short")) return stockProxyUrl(TEMPLATE_DEMO_VIDEOS.social);
    return stockProxyUrl(TEMPLATE_DEMO_VIDEOS.studio);
  }

  if (input.type === "image") {
    const key = `${template.id} ${template.category} ${input.key} ${input.label}`.toLowerCase();
    if (key.includes("logo")) return "/platform-logo.png";
    if (key.includes("food") || key.includes("restaurant") || key.includes("menu")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.food);
    if (key.includes("property") || key.includes("estate") || key.includes("gallery") || key.includes("real")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.property);
    if (key.includes("team") || key.includes("business") || key.includes("office")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.business);
    if (key.includes("trainer") || key.includes("guest") || key.includes("portrait") || key.includes("speaker")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.portrait);
    if (key.includes("screen") || key.includes("app") || key.includes("mobile")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.mobile);
    if (key.includes("fashion") || key.includes("collection") || key.includes("model")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.retail);
    if (key.includes("course") || key.includes("lecture")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.professional);
    if (key.includes("news") || key.includes("city")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.city);
    if (key.includes("event") || key.includes("poster")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.cafe);
    if (key.includes("after")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.luxury);
    if (key.includes("before")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.nature);
    if (key.includes("product")) return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.retail);
    return stockProxyUrl(TEMPLATE_DEMO_PHOTOS.office);
  }

  return "";
}

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
  return replacePlaceholders(template, inputs) as VideoTemplate;
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
    inputs[input.key] = userInputs[input.key] ?? getDemoMediaDefault(template, input);
    return inputs;
  }, {});
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
