"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  BadgeDollarSign,
  Bot,
  Brain,
  Captions,
  Clapperboard,
  Clock3,
  Cloud,
  Command,
  CreditCard,
  Crown,
  Crop,
  Download,
  FileAudio2,
  Film,
  FolderOpen,
  Gauge,
  History,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  LayoutTemplate,
  Link2,
  ListVideo,
  Loader2,
  MessagesSquare,
  Mic2,
  MonitorUp,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Replace,
  Rocket,
  Save,
  Scissors,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  UploadCloud,
  Users,
  Volume2,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { EditPlan } from "@/lib/edit-plan";
import type { StudioProject } from "@/lib/project-store";
import {
  getCaptionForTime,
  getPreviewFilter,
  renderEditedVideo,
  type BrowserRenderProgress,
  type BrowserRenderResult,
} from "@/lib/browser-video-renderer";
import { renderTemplateProject } from "@/lib/browser-template-renderer";
import {
  prepareMediaForTranscription,
  type PreparedTranscriptionFile,
} from "@/lib/browser-transcription-audio";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";
import {
  deleteMediaRecord,
  getLatestProjectSnapshot,
  listMediaRecords,
  storeMediaFile,
  storeProjectSnapshot,
  type StoredMediaRecord,
} from "@/lib/media-db";
import {
  FORMAT_PRESETS,
  PLATFORM_LABELS,
  VIDEO_STYLES,
  type AspectRatio,
  type LanguageMode,
  type Platform,
  type VideoStyle,
  type VideoStyleId,
} from "@/lib/video-styles";
import {
  AD_TONES,
  type AdCampaign,
  type AdTone,
  type AdVariant,
} from "@/lib/ad-maker";
import type {
  TemplateProject,
  TemplateScene,
  TemplateTimelineTrack,
} from "@/lib/video-template-engine";
import { convertScenesToTimeline } from "@/lib/video-template-engine";
import {
  createBlankVideoProject,
  createVideoProjectFromEditorTimeline,
  createVideoProjectFromMediaAssets,
  createVideoProjectFromTemplateProject,
  type MediaAssetInput,
} from "@/lib/video-project-bridge";
import type { VideoProject } from "@/lib/video-project-model";
import { useVideoProjectStore } from "@/lib/video-project-store";
import {
  getTimelineCanvasHeight,
  getTimelineCanvasWidth,
  hitTestTimeline,
  renderTimelineCanvas,
  type TimelineCanvasRenderPayload,
} from "@/lib/timeline-canvas-renderer";
import {
  resolveLocalAICommand,
  type AICommandAction,
  type AICommandContext,
  type AICommandResponse,
} from "@/lib/ai-command";

type Goal = "engagement" | "sales" | "education" | "awareness";
type PanelId =
  | "editor"
  | "ai"
  | "transcript"
  | "captions"
  | "background"
  | "audio"
  | "templates"
  | "ad-maker"
  | "brand"
  | "dashboard"
  | "collaboration"
  | "exports";

type MediaAsset = {
  id: string;
  name: string;
  file: File;
  url: string;
  kind: "video" | "audio" | "image";
  size: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  persisted?: boolean;
};

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AICommandAction[];
  timestamp: number;
};

type AIEngineState = {
  engine: string;
  confidence: number;
  targetCut: string;
  mode: string;
};

type StudioFile = {
  file: File;
  url: string;
  durationSeconds: number;
};

type TimelineLayer = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "caption" | "effect" | "shape" | "background" | "waveform";
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
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
};

type TimelineTrack = {
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
  layers: TimelineLayer[];
};

type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  speaker: string;
  text: string;
  deleted?: boolean;
};

type CaptionLine = {
  id: string;
  start: number;
  end: number;
  text: string;
};

type BrandKitState = {
  logoName: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  captionStyle: string;
  intro: string;
  outro: string;
};

type TemplatePreset = {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  platform: Platform;
  aspectRatio: AspectRatio;
  styleId: VideoStyleId;
  goal: Goal;
  captionTemplate: string;
  backgroundMode: string;
  audioTools: string[];
  hook: string;
  captions: string[];
  timeline: Array<{
    trackKind: TimelineTrack["kind"];
    type: TimelineLayer["type"];
    name: string;
    start: number;
    duration: number;
    color: string;
  }>;
};

type UploadUrlResponse = {
  mode: "supabase" | "local-preview";
  bucket: string;
  path: string;
  token: string | null;
  project: StudioProject;
  error?: string;
};

type AutoTranscribeResponse = {
  mode: "openai" | "demo";
  model: string;
  text: string;
  transcript: TranscriptSegment[];
  captions: CaptionLine[];
  srt: string;
  error?: string;
};

type TranscribeStatusResponse = {
  configured: boolean;
  model: string;
  directUploadLimitBytes: number;
  maxClientAudioSeconds: number;
};

type AdMakerResponse = {
  campaign?: AdCampaign;
  model?: string;
  error?: string;
};

const GOAL_LABELS: Record<Goal, string> = {
  engagement: "Engagement / تفاعل",
  sales: "Sales / مبيعات",
  education: "Education / تعليم",
  awareness: "Awareness / وعي",
};

const PANELS: Array<{ id: PanelId; label: string; description: string; icon: LucideIcon }> = [
  { id: "editor", label: "Editor", description: "Timeline", icon: Clapperboard },
  { id: "ai", label: "AI Studio", description: "Clips", icon: Brain },
  { id: "transcript", label: "Transcript", description: "Text edit", icon: Mic2 },
  { id: "captions", label: "Captions", description: "Subtitles", icon: Captions },
  { id: "background", label: "BG Remove", description: "Replace", icon: Replace },
  { id: "audio", label: "Audio", description: "Enhance", icon: Volume2 },
  { id: "templates", label: "Templates", description: "Formats", icon: LayoutTemplate },
  { id: "ad-maker", label: "Ad Maker", description: "AI ads", icon: BadgeDollarSign },
  { id: "brand", label: "Brand Kit", description: "Identity", icon: Palette },
  { id: "dashboard", label: "Dashboard", description: "Projects", icon: LayoutDashboard },
  { id: "collaboration", label: "Collab", description: "Team", icon: Users },
  { id: "exports", label: "Export", description: "MP4/SRT", icon: MonitorUp },
];

const CREATOR_STARTERS = [
  {
    label: "فكرة إلى فيديو",
    detail: "اكتب فكرة وسيجهز مقاس وكابشن وهوك",
    command: "حوّل فكرة إلى فيديو قصير للتيك توك مع عنوان جذاب وكابشن عربي",
  },
  {
    label: "صور منتج إلى إعلان",
    detail: "ارفع صور المنتج ثم ابنِ إعلان 30 ثانية",
    command: "أنشئ نسخة إعلانية 30 ثانية من صور المنتج مع CTA وكابشن عربي",
  },
  {
    label: "فيديو طويل إلى مقاطع",
    detail: "استخرج أفضل لحظات للسوشال",
    command: "استخرج أفضل 5 لحظات من الفيديو الطويل للريلز والشورتس",
  },
  {
    label: "تنظيف + كابشن",
    detail: "جهّز صوت واضح وترجمة عربية",
    command: "نظف الصوت وأضف كابشن عربي واحذف الصمت",
  },
];

const SAMPLE_TRANSCRIPT: TranscriptSegment[] = [
  {
    id: "tr-1",
    start: 0,
    end: 4,
    speaker: "Speaker 1",
    text: "اليوم بنوريكم كيف نحول فيديو خام إلى إعلان قصير يشد الانتباه من أول ثانية.",
  },
  {
    id: "tr-2",
    start: 4,
    end: 9,
    speaker: "Speaker 1",
    text: "يعني بصراحة الفكرة مو بس قص، نحتاج عنوان قوي وكابشن واضح وإيقاع مناسب للمنصة.",
  },
  {
    id: "tr-3",
    start: 9,
    end: 16,
    speaker: "Speaker 1",
    text: "بعدها نطلع ثلاث نسخ: خمس عشرة ثانية، ثلاثين ثانية، وستين ثانية حسب هدف الحملة.",
  },
  {
    id: "tr-4",
    start: 16,
    end: 23,
    speaker: "Speaker 1",
    text: "وفي النهاية نضيف هوية البراند ونصدر نسخة جاهزة للتيك توك والريلز والشورتس.",
  },
];

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "tiktok-hook-sprint",
    name: "TikTok Hook Sprint",
    category: "Creator",
    description: "9:16 hook, jump cuts, big Arabic captions, and a 30s social cut.",
    icon: Zap,
    platform: "tiktok",
    aspectRatio: "9:16",
    styleId: "viral-saudi",
    goal: "engagement",
    captionTemplate: "Saudi Viral Bold",
    backgroundMode: "Blurred vertical fill",
    audioTools: ["Noise reduction", "Voice enhancement", "Auto volume leveling"],
    hook: "لا تكمل قبل ما تشوف النتيجة.",
    captions: ["أول 3 ثواني لازم تمسك الانتباه.", "قصينا الصمت وخلينا الإيقاع أسرع.", "احفظ المقطع وطبقه على محتواك."],
    timeline: [
      { trackKind: "overlay", type: "text", name: "0-3s punch hook", start: 0, duration: 3, color: "#facc15" },
      { trackKind: "effects", type: "effect", name: "Jump cut rhythm", start: 3, duration: 14, color: "#fb7185" },
      { trackKind: "caption", type: "caption", name: "Karaoke captions", start: 0, duration: 30, color: "#fb923c" },
    ],
  },
  {
    id: "product-ugc-ad",
    name: "UGC Product Ad",
    category: "Ads",
    description: "Problem, product reveal, benefits, proof, CTA for TikTok and Reels.",
    icon: BadgeDollarSign,
    platform: "instagram",
    aspectRatio: "9:16",
    styleId: "product-drop",
    goal: "sales",
    captionTemplate: "Offer Pop",
    backgroundMode: "Studio gradient",
    audioTools: ["Noise reduction", "Voice enhancement", "Auto volume leveling"],
    hook: "المشكلة أبسط مما تتوقع.",
    captions: ["ابدأ بالمشكلة اللي يحس فيها العميل.", "اعرض المنتج كحل واضح.", "اختم بعرض أو دعوة طلب مباشرة."],
    timeline: [
      { trackKind: "overlay", type: "text", name: "Problem headline", start: 0, duration: 4, color: "#facc15" },
      { trackKind: "overlay", type: "text", name: "Benefit callouts", start: 5, duration: 12, color: "#8ef7c2" },
      { trackKind: "effects", type: "effect", name: "Product zooms", start: 4, duration: 18, color: "#36d399" },
      { trackKind: "overlay", type: "text", name: "CTA end card", start: 24, duration: 5, color: "#c084fc" },
    ],
  },
  {
    id: "luxury-brand-film",
    name: "Luxury Brand Film",
    category: "Brand",
    description: "Cinematic pacing, clean typography, and premium color treatment.",
    icon: Crown,
    platform: "instagram",
    aspectRatio: "9:16",
    styleId: "premium-brand",
    goal: "awareness",
    captionTemplate: "Luxury Minimal",
    backgroundMode: "Studio gradient",
    audioTools: ["Voice enhancement", "Echo reduction", "Auto volume leveling"],
    hook: "تفاصيل صغيرة تصنع فرق كبير.",
    captions: ["خلي البراند يظهر بثقة وهدوء.", "استخدم لقطات قريبة ونص قليل.", "اختم برسالة واضحة وسهلة التذكر."],
    timeline: [
      { trackKind: "effects", type: "effect", name: "Cinematic color grade", start: 0, duration: 45, color: "#d7b56d" },
      { trackKind: "overlay", type: "text", name: "Minimal title", start: 1, duration: 5, color: "#fff0b8" },
      { trackKind: "overlay", type: "image", name: "Logo outro", start: 38, duration: 5, color: "#c084fc" },
    ],
  },
  {
    id: "podcast-clip",
    name: "Podcast Clip",
    category: "Podcast",
    description: "Quote card, filler cleanup, pause removal, and readable captions.",
    icon: Mic2,
    platform: "shorts",
    aspectRatio: "9:16",
    styleId: "podcast-cuts",
    goal: "engagement",
    captionTemplate: "Podcast Clean",
    backgroundMode: "Podcast room",
    audioTools: ["Noise reduction", "Voice enhancement", "Echo reduction"],
    hook: "الجملة هذي تختصر الموضوع.",
    captions: ["ابدأ بأقوى اقتباس من الضيف.", "احذف الترددات والسكتات الطويلة.", "خلي العنوان ثابت وواضح."],
    timeline: [
      { trackKind: "overlay", type: "text", name: "Quote card", start: 0, duration: 6, color: "#7dd3fc" },
      { trackKind: "effects", type: "effect", name: "Filler cleanup markers", start: 6, duration: 22, color: "#60a5fa" },
      { trackKind: "caption", type: "caption", name: "Podcast captions", start: 0, duration: 42, color: "#fb923c" },
    ],
  },
  {
    id: "course-lesson-short",
    name: "Course Lesson Short",
    category: "Education",
    description: "Numbered lesson beats, topic split, summary, and final save CTA.",
    icon: Brain,
    platform: "shorts",
    aspectRatio: "9:16",
    styleId: "educational",
    goal: "education",
    captionTemplate: "Educational Steps",
    backgroundMode: "Classroom",
    audioTools: ["Voice enhancement", "Auto volume leveling"],
    hook: "ثلاث نقاط تختصر عليك الدرس.",
    captions: ["النقطة الأولى: الفكرة الأساسية.", "النقطة الثانية: مثال سريع.", "النقطة الثالثة: تطبيق مباشر."],
    timeline: [
      { trackKind: "overlay", type: "text", name: "Step 1", start: 0, duration: 7, color: "#a78bfa" },
      { trackKind: "overlay", type: "text", name: "Step 2", start: 8, duration: 7, color: "#7dd3fc" },
      { trackKind: "overlay", type: "text", name: "Step 3", start: 16, duration: 7, color: "#8ef7c2" },
      { trackKind: "overlay", type: "text", name: "Summary card", start: 25, duration: 6, color: "#facc15" },
    ],
  },
  {
    id: "restaurant-offer-reel",
    name: "Restaurant Offer Reel",
    category: "Local business",
    description: "Food closeups, menu labels, branch/location card, and offer CTA.",
    icon: Sparkles,
    platform: "snapchat",
    aspectRatio: "9:16",
    styleId: "restaurant-ad",
    goal: "sales",
    captionTemplate: "Food Pop",
    backgroundMode: "Blurred vertical fill",
    audioTools: ["Auto volume leveling", "Noise reduction"],
    hook: "اللقطة هذي تكفي تفتح الشهية.",
    captions: ["اعرض أقرب لقطة للأكل أولاً.", "أظهر اسم الصنف أو العرض.", "اختم بالموقع والطلب."],
    timeline: [
      { trackKind: "effects", type: "effect", name: "Food saturation boost", start: 0, duration: 28, color: "#ff9f1c" },
      { trackKind: "overlay", type: "text", name: "Menu label", start: 4, duration: 8, color: "#ffe066" },
      { trackKind: "overlay", type: "text", name: "Branch and offer CTA", start: 22, duration: 6, color: "#c084fc" },
    ],
  },
  {
    id: "business-trust-explainer",
    name: "Business Trust Explainer",
    category: "B2B",
    description: "Formal 16:9/9:16 explainer with trust cues, proof, and clean captions.",
    icon: ShieldCheck,
    platform: "instagram",
    aspectRatio: "16:9",
    styleId: "educational",
    goal: "awareness",
    captionTemplate: "Formal Clean",
    backgroundMode: "Office",
    audioTools: ["Voice enhancement", "Echo reduction", "Auto volume leveling"],
    hook: "القرار الصحيح يبدأ بمعلومة واضحة.",
    captions: ["عرّف المشكلة بدون مبالغة.", "قدّم الدليل أو الأرقام المهمة.", "اختم بخطوة تواصل واضحة."],
    timeline: [
      { trackKind: "overlay", type: "text", name: "Authority lower third", start: 0, duration: 8, color: "#7dd3fc" },
      { trackKind: "effects", type: "effect", name: "Clean corporate grade", start: 0, duration: 45, color: "#a78bfa" },
      { trackKind: "overlay", type: "text", name: "Proof card", start: 12, duration: 10, color: "#8ef7c2" },
    ],
  },
];

const AI_ACTIONS = [
  {
    id: "shorts",
    title: "Extract best clips",
    detail: "Detect highlights and create 15s, 30s, 60s versions.",
    icon: Scissors,
  },
  {
    id: "titles",
    title: "Generate titles",
    detail: "Titles, descriptions, hooks, CTAs, and hashtags.",
    icon: WandSparkles,
  },
  {
    id: "summary",
    title: "Summarize video",
    detail: "Creator brief, ad angle, and platform recommendations.",
    icon: BadgeCheck,
  },
  {
    id: "moments",
    title: "Suggest moments",
    detail: "Best moments for TikTok, Reels, and Shorts.",
    icon: Gauge,
  },
];

const CAPTION_TEMPLATES = [
  "Saudi Viral Bold",
  "Luxury Minimal",
  "Podcast Clean",
  "Karaoke Yellow",
  "Educational Cards",
];

const BACKGROUND_OPTIONS = [
  "Transparent cutout",
  "Blur original video",
  "Studio gradient",
  "Podcast room",
  "Office background",
  "Classroom board",
  "Brand color",
];

const AUDIO_TOOLS = [
  "Noise reduction",
  "Voice enhancement",
  "Echo reduction",
  "Auto volume leveling",
  "Silence removal",
];

const MUSIC_LIBRARY = ["Energetic beat", "Luxury cinematic", "Podcast bed", "Corporate clean"];
const SOUND_EFFECTS = ["Whoosh", "Pop", "Camera snap", "Cash register", "Soft hit"];

const EXPORT_TIERS = [
  { name: "Free", quality: "720p", watermark: "Mawj watermark", price: "$0" },
  { name: "Creator", quality: "1080p", watermark: "No watermark", price: "$19/mo" },
  { name: "Pro", quality: "4K", watermark: "No watermark + team", price: "$49/mo" },
];

const TEAM_ROLES = [
  { name: "Khalid", role: "Owner", access: "Full billing and export access" },
  { name: "Editor", role: "Editor", access: "Timeline, media, exports" },
  { name: "Client", role: "Client", access: "Preview links and comments" },
  { name: "Viewer", role: "Viewer", access: "Read-only project access" },
];

const VERSION_HISTORY = [
  "v1 Raw upload",
  "v2 Captions and jump cuts",
  "v3 Brand kit applied",
  "v4 Client review link",
];

export function ProfessionalVideoStudio() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activePanel, setActivePanel] = useState<PanelId>("editor");
  const [studioFile, setStudioFile] = useState<StudioFile | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [styleId, setStyleId] = useState<VideoStyleId>("viral-saudi");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("arabic");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [brandName, setBrandName] = useState("Mawj Studio");
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [templateProject, setTemplateProject] = useState<TemplateProject | null>(null);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [recentProjects, setRecentProjects] = useState<StudioProject[]>([]);
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>(() => createDefaultTimeline());
  const [timelineUndo, setTimelineUndo] = useState<TimelineTrack[][]>([]);
  const [timelineRedo, setTimelineRedo] = useState<TimelineTrack[][]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("clip-main");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(SAMPLE_TRANSCRIPT);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [captions, setCaptions] = useState<CaptionLine[]>(() => transcriptToCaptions(SAMPLE_TRANSCRIPT));
  const [captionTemplate, setCaptionTemplate] = useState(CAPTION_TEMPLATES[0]);
  const [backgroundMode, setBackgroundMode] = useState(BACKGROUND_OPTIONS[1]);
  const [activeAudioTools, setActiveAudioTools] = useState<Record<string, boolean>>({});
  const [brandKit, setBrandKit] = useState<BrandKitState>({
    logoName: "mawj-logo.svg",
    primaryColor: "#8ef7c2",
    secondaryColor: "#a78bfa",
    font: "IBM Plex Sans Arabic",
    captionStyle: "Saudi Viral Bold",
    intro: "2s animated logo",
    outro: "Follow / CTA screen",
  });
  const [adProductName, setAdProductName] = useState("Premium Saudi coffee");
  const [adTone, setAdTone] = useState<AdTone>("luxury");
  const [adOutput, setAdOutput] = useState("");
  const [adCampaign, setAdCampaign] = useState<AdCampaign | null>(null);
  const [assistantCommand, setAssistantCommand] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>(() => [
    createAssistantMessage(
      "assistant",
      "جاهز. جرب: أضف كابشن عربي، احذف الصمت، استخرج أفضل 5 لحظات، أو أنشئ نسخة إعلانية.",
    ),
  ]);
  const [isAssistantRunning, setIsAssistantRunning] = useState(false);
  const [assistantEngineState, setAssistantEngineState] = useState<AIEngineState | null>(null);
  const [exportTier, setExportTier] = useState("Creator");
  const [exportFormat, setExportFormat] = useState("MP4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAdGenerating, setIsAdGenerating] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<"openai" | "demo" | null>(null);
  const [transcriptionNotice, setTranscriptionNotice] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [renderProgress, setRenderProgress] = useState<BrowserRenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<BrowserRenderResult | null>(null);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("Autosave ready");
  const engineProject = useVideoProjectStore((state) => state.currentProject);
  const setEngineProject = useVideoProjectStore((state) => state.setCurrentProject);
  const selectEngineLayer = useVideoProjectStore((state) => state.selectLayer);
  const setEnginePlayhead = useVideoProjectStore((state) => state.setPlayhead);
  const setEngineZoom = useVideoProjectStore((state) => state.setZoom);
  const undoEngineProject = useVideoProjectStore((state) => state.undo);
  const redoEngineProject = useVideoProjectStore((state) => state.redo);

  const activeStyle = useMemo(
    () => VIDEO_STYLES.find((style) => style.id === styleId) ?? VIDEO_STYLES[0],
    [styleId],
  );

  const previewFilter = useMemo(() => getPreviewFilter(styleId), [styleId]);
  const previewCaption = useMemo(() => {
    const captionLine = getCaptionLineForTime(captions, previewTime);
    return captionLine?.text ?? getCaptionForTime(plan, previewTime, activeStyle.arabicName);
  }, [activeStyle.arabicName, captions, plan, previewTime]);

  const filteredTranscript = useMemo(() => {
    const query = transcriptSearch.trim().toLowerCase();
    if (!query) return transcript;
    return transcript.filter((segment) => segment.text.toLowerCase().includes(query));
  }, [transcript, transcriptSearch]);

  const totalTimelineSeconds = useMemo(
    () =>
      Math.max(
        24,
        ...timelineTracks.flatMap((track) =>
          track.layers.map((layer) => layer.start + layer.duration),
        ),
      ),
    [timelineTracks],
  );

  const selectedLayer = useMemo(
    () =>
      timelineTracks
        .flatMap((track) => track.layers)
        .find((layer) => layer.id === selectedLayerId) ?? null,
    [selectedLayerId, timelineTracks],
  );

  const computedEngineState = useMemo<AIEngineState>(
    () => ({
      engine: getEditorEngineLabel({
        plan,
        templateProject,
        transcriptionMode,
        mediaCount: mediaAssets.length,
        engineProject,
      }),
      confidence: getEditorConfidence({
        plan,
        captionsCount: captions.length,
        mediaCount: mediaAssets.length,
        transcriptionMode,
      }),
      targetCut: getSuggestedTargetCut({
        plan,
        platform,
        goal,
        durationSeconds: studioFile?.durationSeconds ?? totalTimelineSeconds,
      }),
      mode: activePanel,
    }),
    [
      activePanel,
      captions.length,
      engineProject,
      goal,
      mediaAssets.length,
      plan,
      platform,
      studioFile?.durationSeconds,
      templateProject,
      totalTimelineSeconds,
      transcriptionMode,
    ],
  );

  const displayedEngineState = assistantEngineState ?? computedEngineState;

  useEffect(() => {
    if (useVideoProjectStore.getState().currentProject) return;

    setEngineProject(
      createVideoProjectFromEditorTimeline({
        baseProject: createBlankVideoProject({ name: brandName, aspectRatio }),
        name: brandName,
        aspectRatio,
        tracks: timelineTracks,
        durationSeconds: totalTimelineSeconds,
      }),
      { resetHistory: true },
    );
  }, [aspectRatio, brandName, setEngineProject, timelineTracks, totalTimelineSeconds]);

  useEffect(() => {
    return () => {
      if (renderResult?.url) URL.revokeObjectURL(renderResult.url);
    };
  }, [renderResult?.url]);

  useEffect(() => {
    let cancelled = false;

    listMediaRecords()
      .then((records) => {
        if (cancelled || !records.length) return;

        setMediaAssets((assets) => {
          if (assets.length) return assets;
          return records.slice(0, 12).map(storedMediaRecordToAsset);
        });
        setProjectStatus(`${records.length} media assets restored from browser storage`);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const snapshot: Record<string, unknown> = {
      brandName,
      styleId,
      platform,
      aspectRatio,
      languageMode,
      goal,
      timelineTracks,
      transcript,
      captions,
      brandKit,
      templateProject,
      engineProject,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("mawj-studio-autosave", JSON.stringify(snapshot));

    void storeProjectSnapshot({
      id: engineProject?.id ?? "mawj-local-autosave",
      name: brandName || engineProject?.name || "Mawj Studio",
      data: snapshot,
      updatedAt: Date.now(),
    }).catch(() => undefined);
  }, [
    aspectRatio,
    brandKit,
    brandName,
    captions,
    goal,
    languageMode,
    platform,
    engineProject,
    styleId,
    templateProject,
    timelineTracks,
    transcript,
  ]);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      setRecentProjects(data.projects ?? []);
    } catch {
      setRecentProjects([]);
    }
  }, []);

  useEffect(() => {
    if (activePanel === "dashboard") {
      void loadProjects();
    }
  }, [activePanel, loadProjects]);

  function clearRenderedOutput() {
    setRenderResult(null);
    setRenderProgress(null);
  }

  function commitTimeline(nextTracks: TimelineTrack[] | ((current: TimelineTrack[]) => TimelineTrack[])) {
    const resolvedTracks = typeof nextTracks === "function" ? nextTracks(timelineTracks) : nextTracks;
    const currentEngineProject = useVideoProjectStore.getState().currentProject;
    const syncedProject = createVideoProjectFromEditorTimeline({
      baseProject: currentEngineProject,
      name: brandName || currentEngineProject?.name || "Mawj Studio",
      aspectRatio,
      tracks: resolvedTracks,
      durationSeconds: Math.max(
        24,
        ...resolvedTracks.flatMap((track) => track.layers.map((layer) => layer.start + layer.duration)),
      ),
    });

    setTimelineUndo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineRedo([]);
    setTimelineTracks(resolvedTracks);
    useVideoProjectStore.getState().setCurrentProject(syncedProject);
    clearRenderedOutput();
    setProjectStatus("Autosaved timeline changes");
  }

  function undoTimeline() {
    const [previous, ...rest] = timelineUndo;
    if (!previous) return;
    setTimelineRedo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineUndo(rest);
    setTimelineTracks(previous);
    undoEngineProject();
    setProjectStatus("Undo applied");
  }

  function redoTimeline() {
    const [next, ...rest] = timelineRedo;
    if (!next) return;
    setTimelineUndo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineRedo(rest);
    setTimelineTracks(next);
    redoEngineProject();
    setProjectStatus("Redo applied");
  }

  function updateSelectedLayer(patch: Partial<TimelineLayer>) {
    if (!selectedLayer) return;
    const templatePatch = toTemplateTimelinePatch(patch);

    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.map((layer) =>
          layer.id === selectedLayer.id ? { ...layer, ...patch } : layer,
        ),
      })),
    );

    setTemplateProject((project) =>
      project
        ? {
            ...project,
            timeline: project.timeline.map((track) => ({
              ...track,
              layers: track.layers.map((layer) =>
                layer.id === selectedLayer.id
                  ? {
                      ...layer,
                      ...templatePatch,
                      absoluteStart:
                        patch.start !== undefined
                          ? patch.start
                          : layer.absoluteStart,
                    }
                  : layer,
              ),
            })),
            updatedAt: new Date().toISOString(),
        }
        : project,
    );

  }

  const applyTemplateProject = useCallback((
    project: TemplateProject,
    options?: {
      plan?: EditPlan;
      captions?: CaptionLine[];
      status?: string;
      message?: string;
    },
  ) => {
    const tracks = templateTimelineToEditorTracks(project.timeline);
    const firstEditableLayer =
      tracks.flatMap((track) => track.layers).find((layer) => layer.type === "text") ??
      tracks.flatMap((track) => track.layers)[0] ??
      null;
    const firstVideoLayer = project.timeline
      .flatMap((track) => track.layers)
      .find((layer) => layer.type === "video" && layer.src && !layer.src.includes("{{"));

    setTemplateProject(project);
    setEngineProject(createVideoProjectFromTemplateProject(project), { resetHistory: true });
    selectEngineLayer(firstEditableLayer?.id ?? null);
    setTimelineTracks(tracks);
    setTimelineUndo([]);
    setTimelineRedo([]);
    setSelectedLayerId(firstEditableLayer?.id ?? "clip-main");
    setCaptions(options?.captions ?? templateProjectToCaptions(project));
    setPlan(options?.plan ?? templateProjectToEditPlan(project));
    setBrandName(project.inputs.brandName || project.inputs.productName || project.name);
    setAspectRatio(project.aspectRatio === "4:5" ? "9:16" : project.aspectRatio);
    setActivePanel("editor");
    clearRenderedOutput();

    if (firstVideoLayer?.src) {
      setStudioFile({
        file: new File([""], `${project.name}.mp4`, { type: "video/mp4" }),
        url: firstVideoLayer.src,
        durationSeconds: project.duration,
      });
    } else {
      setStudioFile(null);
    }

    setProjectStatus(options?.status ?? `${project.name} opened as an editable template project`);
    setAssistantMessages((messages) => [
      createAssistantMessage(
        "assistant",
        options?.message ??
          `Template project loaded: ${project.name}. ${project.timeline.reduce((sum, track) => sum + track.layers.length, 0)} editable layers are now on the timeline.`,
      ),
      ...messages,
    ].slice(0, 12));
  }, [selectEngineLayer, setEngineProject]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw =
      window.sessionStorage.getItem("mawj-template-project-draft") ??
      window.localStorage.getItem("mawj-template-project-draft");

    if (!raw) return;

    window.setTimeout(() => {
      try {
        const project = JSON.parse(raw) as TemplateProject;
        applyTemplateProject(project);
        window.sessionStorage.removeItem("mawj-template-project-draft");
      } catch {
        setProjectStatus("Could not load template project");
      }
    }, 0);
  }, [applyTemplateProject]);

  async function handleFiles(files?: FileList | File[]) {
    if (!files?.length) return;

    const filesArray = Array.from(files);
    const incomingAssets: MediaAsset[] = filesArray.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      file,
      url: URL.createObjectURL(file),
      kind: getAssetKind(file),
      size: file.size,
    }));

    const firstVideoAsset = incomingAssets.find((asset) => asset.kind === "video") ?? null;
    setMediaAssets((assets) => [...incomingAssets, ...assets]);
    void persistUploadedMedia(incomingAssets, firstVideoAsset?.id ?? null);

    if (firstVideoAsset) {
      const initialDuration = firstVideoAsset.durationSeconds ?? 60;
      setStudioFile({ file: firstVideoAsset.file, url: firstVideoAsset.url, durationSeconds: initialDuration });
      setActiveProject(null);
      setTemplateProject(null);
      setEngineProject(
        createVideoProjectFromMediaAssets({
          name: firstVideoAsset.name,
          aspectRatio,
          assets: [...incomingAssets, ...mediaAssets].map(mediaAssetToBridgeAsset),
          primaryVideoAssetId: firstVideoAsset.id,
          durationSeconds: initialDuration,
        }),
        { resetHistory: true },
      );
      setPlan(null);
      setPreviewTime(0);
      clearRenderedOutput();
      setProjectStatus(
        incomingAssets.length > 1
          ? `${incomingAssets.length} media files loaded into the timeline`
          : "Source video loaded",
      );
    }

    commitTimeline((tracks) =>
      mediaAssets.length || !firstVideoAsset
        ? addAssetsToTimeline(tracks, incomingAssets)
        : createTimelineForAssets(incomingAssets, firstVideoAsset.id),
    );

    setError("");
  }

  async function persistUploadedMedia(assets: MediaAsset[], primaryVideoAssetId: string | null) {
    try {
      const records = await Promise.all(
        assets.map((asset) => storeMediaFile(asset.file, { id: asset.id })),
      );

      setMediaAssets((currentAssets) =>
        currentAssets.map((asset) => {
          const record = records.find((item) => item.id === asset.id);
          if (!record) return asset;

          return {
            ...asset,
            durationSeconds: record.durationSeconds,
            width: record.width,
            height: record.height,
            persisted: true,
          };
        }),
      );
      const primaryRecord = primaryVideoAssetId
        ? records.find((record) => record.id === primaryVideoAssetId && record.durationSeconds)
        : null;

      if (primaryRecord?.durationSeconds) {
        setStudioFile((currentFile) =>
          currentFile && currentFile.file.name === primaryRecord.name
            ? { ...currentFile, durationSeconds: Math.round(primaryRecord.durationSeconds ?? currentFile.durationSeconds) }
            : currentFile,
        );
      }

      commitTimeline((tracks) => applyStoredMediaMetadataToTimeline(tracks, records, primaryVideoAssetId));
      setProjectStatus(`${records.length} media assets saved in browser storage`);
    } catch {
      setProjectStatus("Media loaded. Browser storage is unavailable for this session.");
    }
  }

  function captureDuration() {
    const duration = videoRef.current?.duration;
    if (!studioFile || !duration || Number.isNaN(duration)) return;
    const roundedDuration = Math.round(duration);
    setStudioFile({ ...studioFile, durationSeconds: roundedDuration });
    commitTimeline((tracks) => syncPrimaryVideoDuration(tracks, studioFile.file.name, roundedDuration));
  }

  function addMediaAssetToTimeline(asset: MediaAsset) {
    commitTimeline((tracks) => addAssetsToTimeline(tracks, [asset]));
    setProjectStatus(`${asset.name} added to timeline`);
  }

  function clearSourceVideoState() {
    if (studioFile?.url) revokeObjectUrl(studioFile.url);
    videoRef.current?.pause();
    setStudioFile(null);
    setActiveProject(null);
    setTemplateProject(null);
    setPlan(null);
    setIsPlaying(false);
    setPreviewTime(0);
    clearRenderedOutput();
  }

  function deleteMediaAsset(asset: MediaAsset) {
    const isCurrentSource = studioFile?.url === asset.url || studioFile?.file.name === asset.name;
    const nextTracks = removeAssetFromTimeline(timelineTracks, asset, isCurrentSource);
    const nextLayer = nextTracks.flatMap((track) => track.layers)[0] ?? null;

    if (isCurrentSource) {
      clearSourceVideoState();
    }

    revokeObjectUrl(asset.url);
    setMediaAssets((assets) => assets.filter((item) => item.id !== asset.id));
    void deleteMediaRecord(asset.id).catch(() => undefined);
    commitTimeline(nextTracks);
    setSelectedLayerId(nextLayer?.id ?? "");
    selectEngineLayer(nextLayer?.id ?? null);
    setProjectStatus(`${asset.name} deleted from media and timeline`);
  }

  function selectVideoAssetAsSource(asset: MediaAsset) {
    if (asset.kind !== "video") return;
    const durationSeconds = Math.round(asset.durationSeconds ?? 60);
    setStudioFile({ file: asset.file, url: asset.url, durationSeconds });
    setActiveProject(null);
    setTemplateProject(null);
    setEngineProject(
      createVideoProjectFromMediaAssets({
        name: asset.name,
        aspectRatio,
        assets: mediaAssets.map(mediaAssetToBridgeAsset),
        primaryVideoAssetId: asset.id,
        durationSeconds,
      }),
      { resetHistory: true },
    );
    setPlan(null);
    setPreviewTime(0);
    clearRenderedOutput();
    commitTimeline((tracks) => syncPrimaryVideoDuration(tracks, asset.name, durationSeconds));
    setProjectStatus(`${asset.name} is now the preview source`);
  }

  async function transcribeVideo(asset?: MediaAsset) {
    const targetFile = asset?.file ?? studioFile?.file;
    const targetDuration = asset?.durationSeconds ?? studioFile?.durationSeconds ?? 60;

    if (!targetFile || (!targetFile.type.startsWith("video/") && !targetFile.type.startsWith("audio/"))) {
      setError("Upload a video or audio file first.");
      return;
    }

    setIsTranscribing(true);
    setError("");
    setTranscriptionNotice("");
    setProjectStatus("Reading video audio and generating captions...");

    try {
      const statusResponse = await fetch("/api/transcribe", { cache: "no-store" });
      const status = (await statusResponse.json()) as TranscribeStatusResponse;

      if (!status.configured) {
        const demo = createClientDemoTranscription(targetFile.name, targetDuration, languageMode);
        applyTranscriptionResult(demo, targetDuration);
        setTranscriptionNotice(
          "OpenAI key is not configured on Vercel yet. Showing demo captions until OPENAI_API_KEY is added.",
        );
        setProjectStatus("Demo captions shown because OPENAI_API_KEY is missing on Vercel");
        return;
      }

      const preparedFile = await prepareMediaForTranscription({
        file: targetFile,
        durationSeconds: targetDuration,
        onProgress: (progress) => {
          setProjectStatus(`Preparing audio for captions ${progress}%`);
        },
      });

      setTranscriptionNotice(getPreparedFileNotice(preparedFile));

      const formData = new FormData();
      formData.append("file", preparedFile.file, preparedFile.file.name);
      formData.append("durationSeconds", String(targetDuration));
      formData.append(
        "language",
        languageMode === "arabic" ? "ar" : languageMode === "english" ? "en" : "auto",
      );

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as AutoTranscribeResponse;
      if (!response.ok) throw new Error(data.error ?? "Could not generate automatic captions.");

      applyTranscriptionResult(data, targetDuration);
      setProjectStatus(
        data.mode === "openai"
          ? `Auto captions ready with ${data.model}`
          : "Demo captions ready. Add OPENAI_API_KEY for real video transcription.",
      );
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          data.mode === "openai"
            ? `Auto-caption complete: ${data.captions.length} caption lines generated from the video audio.`
            : "Demo captions generated. Add OPENAI_API_KEY on Vercel for real audio transcription.",
          [{ type: "ADD_ARABIC_CAPTIONS", label: "Captions generated" }],
        ),
        ...messages,
      ].slice(0, 12));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not transcribe this file.");
    } finally {
      setIsTranscribing(false);
    }
  }

  function applyTranscriptionResult(data: AutoTranscribeResponse, targetDuration: number) {
    setTranscript(data.transcript);
    setCaptions(data.captions);
    setTranscriptionMode(data.mode);
    setActivePanel("captions");
    clearRenderedOutput();
    commitTimeline((tracks) => ensureCaptionLayer(tracks, data.captions, targetDuration));
  }

  async function generatePlan() {
    const imageAssets = mediaAssets.filter((asset) => asset.kind === "image");

    if (!studioFile && imageAssets.length) {
      await generateImageStoryboard(imageAssets);
      return;
    }

    if (!studioFile) {
      setError("Upload a source video or images first.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setProjectStatus("AI is building an edit plan...");

    try {
      const project = await ensureProjectUploaded();
      const response = await fetch("/api/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          fileName: studioFile.file.name,
          durationSeconds: studioFile.durationSeconds,
          platform,
          aspectRatio,
          languageMode,
          styleId,
          brandName,
          goal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate edit plan.");

      setPlan(data.plan);
      setCaptions(planToCaptions(data.plan));
      clearRenderedOutput();
      setProjectStatus("AI edit plan ready");
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          `Generated: ${data.plan.title}. Suggested ${data.plan.targetDurationSeconds}s output.`,
          [{ type: "EXTRACT_CLIPS", label: "Edit plan generated" }],
        ),
        ...messages,
      ].slice(0, 12));
      if (data.project) setActiveProject(data.project);
      await loadProjects();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected AI planning error.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateImageStoryboard(imageAssets: MediaAsset[]) {
    const durationSeconds = getImageStoryboardDuration(imageAssets.length);

    setIsGenerating(true);
    setError("");
    setTemplateProject(null);
    setProjectStatus("AI is turning uploaded images into an editable video storyboard...");

    try {
      const response = await fetch("/api/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: imageAssets.map((asset) => asset.name).join(", "),
          durationSeconds,
          platform,
          aspectRatio,
          languageMode,
          styleId,
          brandName,
          goal,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not generate image video plan.");

      const nextPlan = data.plan as EditPlan;
      const nextCaptions = planToCaptions(nextPlan);
      const storyboardProject = createImageStoryboardTemplateProject({
        assets: imageAssets,
        plan: nextPlan,
        brandName,
        aspectRatio,
        styleName: activeStyle.arabicName,
        goal,
      });

      applyTemplateProject(storyboardProject, {
        plan: nextPlan,
        captions: nextCaptions,
        status: `Generated ${imageAssets.length} images into an editable video storyboard`,
        message: `Image video generated: ${imageAssets.length} uploaded images became ${storyboardProject.scenes.length} scenes with editable text, image layers, captions, and export-ready timing.`,
      });
      setActiveProject(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected image video generation error.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function ensureProjectUploaded() {
    if (!studioFile) throw new Error("Upload a source video first, or use Generate to turn images into a storyboard.");
    if (activeProject?.status === "uploaded" || activeProject?.status === "planned") {
      return activeProject;
    }

    setIsUploading(true);
    setProjectStatus("Saving project...");

    try {
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${brandName || "Untitled"} · ${activeStyle.arabicName}`,
          styleId,
          platform,
          aspectRatio,
          sourceFileName: studioFile.file.name,
          sourceFileSize: studioFile.file.size,
          sourceMimeType: studioFile.file.type || "video/mp4",
          sourceDurationSeconds: studioFile.durationSeconds,
        }),
      });
      const projectData = await projectResponse.json();
      if (!projectResponse.ok) {
        throw new Error(projectData.error ?? "Could not create project.");
      }

      let project = projectData.project as StudioProject;
      setActiveProject(project);
      setProjectStatus("Preparing upload URL...");

      const uploadResponse = await fetch(`/api/projects/${project.id}/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: studioFile.file.name,
          contentType: studioFile.file.type || "video/mp4",
        }),
      });
      const uploadData = (await uploadResponse.json()) as UploadUrlResponse;
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error ?? "Could not prepare upload.");
      }

      if (uploadData.mode === "supabase") {
        if (!uploadData.token || !hasSupabaseBrowserEnv()) {
          throw new Error("Add NEXT_PUBLIC_SUPABASE_* to upload videos from the browser.");
        }

        setProjectStatus("Uploading source to cloud storage...");
        const supabase = createSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from(uploadData.bucket)
          .uploadToSignedUrl(uploadData.path, uploadData.token, studioFile.file, {
            contentType: studioFile.file.type || "video/mp4",
          });

        if (uploadError) throw new Error(uploadError.message);
        setProjectStatus("Source stored in Supabase");
      } else {
        setProjectStatus("Local preview mode: project saved without cloud upload");
      }

      project = uploadData.project;
      setActiveProject(project);
      await loadProjects();
      return project;
    } finally {
      setIsUploading(false);
    }
  }

  async function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function handlePreviewTimeUpdate() {
    const nextTime = videoRef.current?.currentTime ?? 0;
    setPreviewTime(nextTime);
    setEnginePlayhead(nextTime);
  }

  function selectTimelineLayer(layerId: string) {
    setSelectedLayerId(layerId);
    selectEngineLayer(layerId);
  }

  async function renderVideo() {
    if (!studioFile && !templateProject) {
      setError("Upload a source video or generate an image storyboard first.");
      return;
    }

    if (templateProject) {
      setIsRendering(true);
      setError("");
      setRenderResult(null);
      setRenderProgress({
        percent: 0,
        label: "Preparing template render",
        elapsedSeconds: 0,
        outputSeconds: templateProject.duration,
      });
      setProjectStatus("Rendering template export...");

      try {
        const result = await renderTemplateProject({
          project: templateProject,
          onProgress: setRenderProgress,
        });
        setRenderResult(result);
        setProjectStatus(`${templateProject.name} template export ready`);
        setActivePanel("exports");
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Could not render template video.");
      } finally {
        setIsRendering(false);
      }
      return;
    }

    if (!studioFile) {
      setError("Upload a source video or generate an image storyboard first.");
      return;
    }

    const renderPlan =
      plan ??
      createCaptionRenderPlan({
        captions,
        style: activeStyle,
        aspectRatio,
        brandName,
        durationSeconds: studioFile?.durationSeconds ?? 0,
      });

    if (!renderPlan) {
      setError("Generate an AI edit plan or automatic captions first.");
      return;
    }

    setIsRendering(true);
    setError("");
    setRenderResult(null);
    setRenderProgress({
      percent: 0,
      label: "Preparing render",
      elapsedSeconds: 0,
      outputSeconds: renderPlan.targetDurationSeconds,
    });
    setProjectStatus("Rendering export...");

    try {
      const result = await renderEditedVideo({
        sourceUrl: studioFile.url,
        sourceFileName: studioFile.file.name,
        sourceDurationSeconds: studioFile.durationSeconds,
        aspectRatio,
        style: activeStyle,
        brandName,
        plan: renderPlan,
        onProgress: setRenderProgress,
      });
      setRenderResult(result);
      setProjectStatus(`${exportTier} ${exportFormat} export ready`);
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not render video.");
    } finally {
      setIsRendering(false);
    }
  }

  function splitSelectedLayer() {
    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.flatMap((layer) => {
          if (layer.id !== selectedLayerId || layer.duration < 4) return [layer];
          const splitAt = Math.max(1, Math.min(layer.duration - 1, Math.round(layer.duration / 2)));
          return [
            { ...layer, id: `${layer.id}-a`, name: `${layer.name} A`, duration: splitAt },
            {
              ...layer,
              id: `${layer.id}-b`,
              name: `${layer.name} B`,
              start: layer.start + splitAt,
              duration: layer.duration - splitAt,
            },
          ];
        }),
      })),
    );
  }

  function trimSelectedLayer() {
    if (!selectedLayer) return;
    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.map((layer) =>
          layer.id === selectedLayerId
            ? { ...layer, duration: Math.max(2, layer.duration - 2), name: `${layer.name} · trimmed` }
            : layer,
        ),
      })),
    );
  }

  function deleteSelectedLayer() {
    if (!selectedLayer) return;

    const sourceAsset = findSourceAssetForLayer(selectedLayer, mediaAssets, studioFile);
    const deletesSourceVideo = selectedLayer.type === "video" && Boolean(sourceAsset || isPrimarySourceLayer(selectedLayer, studioFile));
    const nextTracks = timelineTracks.map((track) => ({
      ...track,
      layers: track.layers.filter((layer) => {
        if (layer.id === selectedLayer.id) return false;
        if (!deletesSourceVideo) return true;
        if (sourceAsset && layer.id === sourceAsset.id) return false;
        return !["audio-main"].includes(layer.id);
      }),
    }));
    const nextLayer = nextTracks.flatMap((track) => track.layers)[0] ?? null;

    if (deletesSourceVideo) {
      clearSourceVideoState();
      if (sourceAsset) {
        revokeObjectUrl(sourceAsset.url);
        setMediaAssets((assets) => assets.filter((asset) => asset.id !== sourceAsset.id));
        void deleteMediaRecord(sourceAsset.id).catch(() => undefined);
      }
    }

    commitTimeline(nextTracks);
    setSelectedLayerId(nextLayer?.id ?? "");
    selectEngineLayer(nextLayer?.id ?? null);
    setProjectStatus(
      deletesSourceVideo
        ? `${selectedLayer.name} deleted from preview, media, and timeline`
        : `${selectedLayer.name} deleted from timeline`,
    );
  }

  function mergeVideoLayers() {
    const videoTrack = timelineTracks.find((track) => track.kind === "video");
    if (!videoTrack || videoTrack.layers.length < 2) {
      setProjectStatus("Need at least two video clips to merge");
      return;
    }

    commitTimeline((tracks) =>
      tracks.map((track) => {
        if (track.kind !== "video" || track.layers.length < 2) return track;
        const [first, second, ...rest] = track.layers;
        return {
          ...track,
          layers: [
            {
              ...first,
              id: crypto.randomUUID(),
              name: "Merged video sequence",
              start: Math.min(first.start, second.start),
              duration: first.duration + second.duration,
            },
            ...rest,
          ],
        };
      }),
    );
  }

  function addTextLayer() {
    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "overlay"
          ? {
              ...track,
              layers: [
                ...track.layers,
                {
                  id: crypto.randomUUID(),
                  type: "text",
                  name: "Hook title",
                  start: Math.max(0, Math.round(previewTime)),
                  duration: 5,
                  color: "#facc15",
                },
              ],
            }
          : track,
      ),
    );
  }

  function markTranscriptDeleted(segmentId: string) {
    const segment = transcript.find((item) => item.id === segmentId);
    setTranscript((items) =>
      items.map((item) => (item.id === segmentId ? { ...item, deleted: !item.deleted } : item)),
    );
    if (!segment) return;

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "effects"
          ? {
              ...track,
              layers: [
                ...track.layers,
                {
                  id: crypto.randomUUID(),
                  type: "effect",
                  name: `Text cut ${formatDuration(segment.start)}`,
                  start: segment.start,
                  duration: Math.max(0.5, segment.end - segment.start),
                  color: "#fb7185",
                },
              ],
            }
          : track,
      ),
    );
  }

  function removeFillerWords() {
    const fillerWords = ["يعني", "بصراحة", "اممم", "اه", "like", "you know"];
    setTranscript((items) =>
      items.map((segment) => ({
        ...segment,
        text: fillerWords.reduce(
          (text, word) => text.replaceAll(word, "").replace(/\s+/g, " ").trim(),
          segment.text,
        ),
      })),
    );
    setProjectStatus("Filler words removed from transcript");
  }

  function removeLongPauses() {
    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "effects"
          ? {
              ...track,
              layers: [
                ...track.layers,
                { id: crypto.randomUUID(), type: "effect", name: "Silence removal", start: 7, duration: 2, color: "#60a5fa" },
                { id: crypto.randomUUID(), type: "effect", name: "Long pause removed", start: 19, duration: 1.5, color: "#60a5fa" },
              ],
            }
          : track,
      ),
    );
    setProjectStatus("Long pauses marked for removal");
  }

  function generateCaptionsFromTranscript() {
    setCaptions(transcriptToCaptions(transcript.filter((segment) => !segment.deleted)));
    setActivePanel("captions");
    setProjectStatus("Captions generated from transcript");
  }

  function updateCaption(id: string, text: string) {
    setCaptions((items) => items.map((caption) => (caption.id === id ? { ...caption, text } : caption)));
    clearRenderedOutput();
  }

  function downloadSrt() {
    const srt = captions
      .map(
        (caption, index) =>
          `${index + 1}\n${secondsToSrt(caption.start)} --> ${secondsToSrt(caption.end)}\n${caption.text}\n`,
      )
      .join("\n");
    downloadTextFile("mawj-captions.srt", srt, "text/plain;charset=utf-8");
  }

  function saveProjectSnapshot() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "mawj-studio-manual-save",
      JSON.stringify({
        brandName,
        styleId,
        platform,
        aspectRatio,
        timelineTracks,
        transcript,
        captions,
        brandKit,
        engineProject,
        savedAt: new Date().toISOString(),
      }),
    );
    setProjectStatus("Project snapshot saved locally");
  }

  async function loadProjectSnapshot() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("mawj-studio-manual-save");
    const snapshot = raw
      ? JSON.parse(raw)
      : ((await getLatestProjectSnapshot().catch(() => null))?.data ?? null);

    if (!snapshot) {
      setProjectStatus("No local or browser-stored snapshot found");
      return;
    }

    const saved = snapshot as {
      brandName?: string;
      styleId?: VideoStyleId;
      platform?: Platform;
      aspectRatio?: AspectRatio;
      timelineTracks?: TimelineTrack[];
      transcript?: TranscriptSegment[];
      captions?: CaptionLine[];
      brandKit?: BrandKitState;
      engineProject?: VideoProject;
    };
    if (saved.brandName) setBrandName(saved.brandName);
    if (saved.styleId) setStyleId(saved.styleId);
    if (saved.platform) setPlatform(saved.platform);
    if (saved.aspectRatio) setAspectRatio(saved.aspectRatio);
    if (saved.timelineTracks) setTimelineTracks(saved.timelineTracks);
    if (saved.transcript) setTranscript(saved.transcript);
    if (saved.captions) setCaptions(saved.captions);
    if (saved.brandKit) setBrandKit(saved.brandKit);
    if (saved.engineProject) setEngineProject(saved.engineProject, { resetHistory: true });
    setProjectStatus("Local project snapshot loaded");
  }

  async function refreshProjectList() {
    await loadProjects();
    setProjectStatus("Project list refreshed");
  }

  async function updateProjectRecord(projectId: string) {
    const existing = recentProjects.find((project) => project.id === projectId);
    const isActive = activeProject?.id === projectId;
    const nextStatus: StudioProject["status"] = isActive
      ? plan
        ? "planned"
        : studioFile
          ? "uploaded"
          : "draft"
      : existing?.status ?? "draft";
    const nextTitle = isActive ? `${brandName || "Untitled"} · ${activeStyle.arabicName}` : existing?.title;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          status: nextStatus,
        }),
      });
      const data = (await response.json()) as { project?: StudioProject; error?: string };
      if (!response.ok || !data.project) throw new Error(data.error ?? "Could not update project.");

      setRecentProjects((projects) =>
        projects.map((project) => (project.id === projectId ? data.project! : project)),
      );
      if (activeProject?.id === projectId) setActiveProject(data.project);
      setProjectStatus(`${data.project.title} updated`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update project.");
    }
  }

  async function deleteProjectRecord(projectId: string) {
    const existing = recentProjects.find((project) => project.id === projectId);
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`Delete project "${existing?.title ?? projectId}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Could not delete project.");

      setRecentProjects((projects) => projects.filter((project) => project.id !== projectId));
      if (activeProject?.id === projectId) setActiveProject(null);
      setProjectStatus(`${existing?.title ?? "Project"} deleted`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not delete project.");
    }
  }

  function applyTemplatePreset(templateId: string) {
    const template = TEMPLATE_PRESETS.find((item) => item.id === templateId);
    if (!template) return;

    const durationSeconds = studioFile?.durationSeconds ?? 45;
    const templateCaptions = createTemplateCaptions(template, durationSeconds);

    setActiveTemplateId(template.id);
    setPlatform(template.platform);
    setAspectRatio(template.aspectRatio);
    setStyleId(template.styleId);
    setGoal(template.goal);
    setCaptionTemplate(template.captionTemplate);
    setBackgroundMode(template.backgroundMode);
    setActiveAudioTools(toEnabledTools(template.audioTools));
    setCaptions(templateCaptions);
    setPlan(
      createTemplateEditPlan({
        template,
        brandName,
        durationSeconds,
      }),
    );
    commitTimeline((tracks) => applyTemplateToTimeline(tracks, template, durationSeconds));
    setActivePanel("editor");
    setProjectStatus(`${template.name} applied to timeline, captions, format, audio, and render plan`);
    setAssistantMessages((messages) => [
      createAssistantMessage(
        "assistant",
        `Template applied: ${template.name}. Format ${template.aspectRatio}, style ${template.captionTemplate}, ${template.audioTools.length} audio tools enabled.`,
      ),
      ...messages,
    ].slice(0, 12));
  }

  async function generateAdVersion() {
    const productName = adProductName.trim();
    if (!productName) {
      setError("اكتب اسم المنتج أو الخدمة أولاً.");
      return;
    }

    setIsAdGenerating(true);
    setError("");
    setProjectStatus("Generating real AI ad campaign...");

    try {
      const response = await fetch("/api/ad-maker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          tone: adTone,
          brandName,
          platform,
          aspectRatio,
          goal,
          languageMode,
          durationSeconds: studioFile?.durationSeconds ?? 60,
          assetNames: mediaAssets.map((asset) => asset.name),
          transcriptPreview: transcript
            .filter((segment) => !segment.deleted)
            .slice(0, 10)
            .map((segment) => `${formatDuration(segment.start)} ${segment.text}`)
            .join("\n"),
        }),
      });
      const data = (await response.json()) as AdMakerResponse;
      if (!response.ok || !data.campaign) {
        throw new Error(data.error ?? "Could not generate AI ad campaign.");
      }

      const campaign = data.campaign;
      setAdCampaign(campaign);
      setAdOutput(formatAdCampaign(campaign));
      applyAdCampaignToProject(campaign);
      setProjectStatus(`AI Ad Maker generated and applied using ${data.model ?? "OpenAI"}`);
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          `AI Ad Maker: ${campaign.title}. Applied 30s version to timeline with captions and CTA.`,
          [{ type: "CREATE_AD_VERSION", label: "Ad timeline applied" }],
        ),
        ...messages,
      ].slice(0, 12));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? cleanOpenAIError(caughtError.message) : "Could not generate AI ad campaign.");
    } finally {
      setIsAdGenerating(false);
    }
  }

  function applyAdCampaignToProject(campaign: AdCampaign) {
    const variant = pickPrimaryAdVariant(campaign);
    if (!variant) return;

    setStyleId("product-drop");
    setGoal("sales");
    setCaptionTemplate("Offer Pop");
    setActiveAudioTools((tools) => ({
      ...tools,
      "Noise reduction": true,
      "Voice enhancement": true,
      "Auto volume leveling": true,
    }));
    setCaptions(adVariantToCaptions(variant));
    setPlan(
      createAdCampaignEditPlan({
        campaign,
        variant,
        brandName,
        aspectRatio,
      }),
    );
    commitTimeline((tracks) => applyAdVariantToTimeline(tracks, variant));
    setActivePanel("editor");
  }

  async function runAssistantCommand(commandOverride?: string) {
    const command = (commandOverride ?? assistantCommand).trim();
    if (!command) return;

    setAssistantCommand("");
    setIsAssistantRunning(true);
    setError("");
    setAssistantMessages((messages) => [createAssistantMessage("user", command), ...messages].slice(0, 12));

    const context = getAICommandContext({
      platform,
      aspectRatio,
      languageMode,
      goal,
      studioFile,
      mediaAssets,
      captions,
      activePanel,
      selectedLayer,
      totalTimelineSeconds,
    });

    try {
      const response = await fetch("/api/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command, context }),
      });
      const data = (await response.json()) as AICommandResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "AI command failed.");

      await executeAssistantActions(data.actions);
      setAssistantEngineState({
        engine: data.engine,
        confidence: data.confidence,
        targetCut: data.targetCut,
        mode: data.mode,
      });
      setAssistantMessages((messages) => [
        createAssistantMessage("assistant", data.message, data.actions),
        ...messages,
      ].slice(0, 12));
      setProjectStatus(`AI assistant executed ${data.actions.length} action${data.actions.length === 1 ? "" : "s"}`);
    } catch (caughtError) {
      const fallback = resolveLocalAICommand(command, context);
      await executeAssistantActions(fallback.actions);
      setAssistantEngineState({
        engine: fallback.engine,
        confidence: fallback.confidence,
        targetCut: fallback.targetCut,
        mode: fallback.mode,
      });
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          `${fallback.message} ${caughtError instanceof Error ? cleanOpenAIError(caughtError.message) : ""}`.trim(),
          fallback.actions,
        ),
        ...messages,
      ].slice(0, 12));
      setProjectStatus("AI assistant used local command engine");
    } finally {
      setIsAssistantRunning(false);
    }
  }

  async function executeAssistantActions(actions: AICommandAction[]) {
    for (const action of actions) {
      if (action.type === "SET_TIKTOK_FORMAT") {
        setPlatform(action.params?.platform === "shorts" ? "shorts" : "tiktok");
        setAspectRatio("9:16");
        setStyleId("viral-saudi");
        setActivePanel("editor");
      }

      if (action.type === "ADD_ARABIC_CAPTIONS") {
        await transcribeVideo();
      }

      if (action.type === "REMOVE_SILENCE") {
        removeLongPauses();
      }

      if (action.type === "EXTRACT_CLIPS") {
        handleAiAction("shorts");
        handleAiAction("moments");
      }

      if (action.type === "IMPROVE_AUDIO") {
        setActivePanel("audio");
        setActiveAudioTools((tools) => ({
          ...tools,
          "Noise reduction": true,
          "Voice enhancement": true,
          "Auto volume leveling": true,
        }));
      }

      if (action.type === "REMOVE_BACKGROUND") {
        setActivePanel("background");
        setBackgroundMode("Studio gradient");
      }

      if (action.type === "CREATE_AD_VERSION") {
        setActivePanel("ad-maker");
        await generateAdVersion();
      }

      if (action.type === "APPLY_PRO_STYLE") {
        setStyleId("premium-brand");
        setCaptionTemplate("Luxury Minimal");
        setActivePanel("brand");
      }

      if (action.type === "ADD_TEXT_HOOK") {
        addTextLayer();
      }
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-black">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-5">Mawj Studio</p>
              <p className="truncate text-xs font-semibold text-[var(--muted)]">
                AI content studio / استوديو مونتاج ذكي
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 text-xs font-bold xl:flex">
            <StatusPill label="Upload" active={Boolean(studioFile || mediaAssets.length || templateProject)} />
            <StatusPill label="Timeline" active={timelineTracks.some((track) => track.layers.length)} />
            <StatusPill label="AI" active={Boolean(plan)} />
            <StatusPill label="Render" active={Boolean(renderResult)} />
          </div>

          <div className="flex items-center gap-2">
            <Link href="/templates" className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-black transition hover:border-[var(--brand)]">
              <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Templates</span>
            </Link>
            <button type="button" onClick={saveProjectSnapshot} className="icon-button" aria-label="Save project">
              <Save className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={loadProjectSnapshot} className="icon-button" aria-label="Load project">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={generatePlan}
              disabled={isGenerating || isUploading || isRendering}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-black transition hover:bg-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              {isGenerating || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isUploading ? "Saving" : isGenerating ? "Generating" : "Generate"}
              </span>
            </button>
            <button
              type="button"
              onClick={renderVideo}
              disabled={(!studioFile && !templateProject) || isRendering || isGenerating || isUploading}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">{isRendering ? `${renderProgress?.percent ?? 0}%` : "Export"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1680px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[252px_minmax(0,1fr)_364px]">
        <aside className="space-y-4">
          <section className="panel p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-black">Workspace</p>
              <Cloud className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
            </div>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
              {PANELS.map((panel) => {
                const Icon = panel.icon;
                const active = activePanel === panel.id;
                if (panel.id === "templates") {
                  return (
                    <Link
                      key={panel.id}
                      href="/templates"
                      className="flex min-h-14 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-left text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-white"
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-black">{panel.label}</span>
                        <span className="block truncate text-[11px] font-semibold opacity-75">Open library</span>
                      </span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setActivePanel(panel.id)}
                    className={`flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                      active
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-white"
                        : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black">{panel.label}</span>
                      <span className="block truncate text-[11px] font-semibold opacity-75">{panel.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-black">Media bin</p>
              <button type="button" onClick={() => inputRef.current?.click()} className="icon-button" aria-label="Upload media">
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="video/*,audio/*,image/*"
              className="sr-only"
              onChange={(event) => handleFiles(event.target.files ?? undefined)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDrop={(event) => {
                event.preventDefault();
                handleFiles(event.dataTransfer.files);
              }}
              onDragOver={(event) => event.preventDefault()}
              className="mb-3 flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-4 text-center transition hover:border-[var(--brand)]"
            >
              <UploadCloud className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
              <span className="text-sm font-black">Drag media here</span>
              <span className="text-xs font-semibold text-[var(--muted)]">Video, audio, images</span>
            </button>
            <div className="space-y-2">
              {mediaAssets.slice(0, 8).map((asset) => (
                <div key={asset.id} className="rounded-lg border border-[var(--line)] bg-black/20 p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <AssetIcon kind={asset.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black">{asset.name}</p>
                      <p className="text-[11px] font-semibold text-[var(--muted)]">
                        {asset.kind} · {formatBytes(asset.size)}
                        {asset.durationSeconds ? ` · ${formatDuration(asset.durationSeconds)}` : ""}
                        {asset.persisted ? " · saved" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addMediaAssetToTimeline(asset)}
                      className="min-h-9 rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-2 text-[11px] font-black transition hover:border-[var(--brand)]"
                    >
                      Timeline
                    </button>
                    {asset.kind === "video" ? (
                      <button
                        type="button"
                        onClick={() => selectVideoAssetAsSource(asset)}
                        className="min-h-9 rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-2 text-[11px] font-black transition hover:border-[var(--brand)]"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addMediaAssetToTimeline(asset)}
                        className="min-h-9 rounded-md border border-[var(--line)] bg-[var(--panel-soft)] px-2 text-[11px] font-black transition hover:border-[var(--brand)]"
                      >
                        Layer
                      </button>
                    )}
                    {(asset.kind === "video" || asset.kind === "audio") ? (
                      <button
                        type="button"
                        onClick={() => transcribeVideo(asset)}
                        disabled={isTranscribing}
                        className="col-span-2 min-h-9 rounded-md bg-[var(--brand)] px-2 text-[11px] font-black text-black transition hover:bg-white disabled:opacity-60"
                      >
                        {isTranscribing ? "Captioning..." : "Auto-caption"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deleteMediaAsset(asset)}
                      className="col-span-2 min-h-9 rounded-md border border-red-400/40 bg-red-500/10 px-2 text-[11px] font-black text-red-100 transition hover:border-red-300"
                    >
                      Delete media
                    </button>
                  </div>
                </div>
              ))}
              {!mediaAssets.length ? <p className="text-xs font-semibold text-[var(--muted)]">No uploaded assets yet.</p> : null}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          {activePanel === "dashboard" ? (
            <DashboardPanel
              projects={recentProjects}
              projectStatus={projectStatus}
              onRefresh={refreshProjectList}
              onUpdate={updateProjectRecord}
              onDelete={deleteProjectRecord}
            />
          ) : activePanel === "templates" ? (
            <TemplatesPanel activeTemplateId={activeTemplateId} onApply={applyTemplatePreset} />
          ) : activePanel === "collaboration" ? (
            <CollaborationPanel />
          ) : (
            <>
              <section className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ToolbarButton label="Undo" icon={Undo2} onClick={undoTimeline} disabled={!timelineUndo.length} />
                    <ToolbarButton label="Redo" icon={Redo2} onClick={redoTimeline} disabled={!timelineRedo.length} />
                    <ToolbarButton label="Trim" icon={Scissors} onClick={trimSelectedLayer} />
                    <ToolbarButton label="Split" icon={Crop} onClick={splitSelectedLayer} />
                    <ToolbarButton label="Merge" icon={Layers3} onClick={mergeVideoLayers} />
                    <ToolbarButton label="Text" icon={Type} onClick={addTextLayer} />
                    <ToolbarButton label="Update" icon={Save} onClick={saveProjectSnapshot} />
                    <ToolbarButton label="Delete" icon={Trash2} onClick={deleteSelectedLayer} disabled={!selectedLayer} tone="danger" />
                    <ToolbarButton
                      label={isTranscribing ? "Captioning" : "Auto-caption"}
                      icon={isTranscribing ? Loader2 : Captions}
                      onClick={() => transcribeVideo()}
                      disabled={isTranscribing || !studioFile}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="range"
                      min="0.6"
                      max="2.4"
                      step="0.1"
                      value={timelineZoom}
                      onChange={(event) => {
                        const nextZoom = Number(event.target.value);
                        setTimelineZoom(nextZoom);
                        setEngineZoom(nextZoom);
                      }}
                      className="w-28 accent-[var(--brand)]"
                      aria-label="Timeline zoom"
                    />
                    {Math.round(timelineZoom * 100)}%
                  </div>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <VideoPreview
                    studioFile={studioFile}
                    templateProject={templateProject}
                    videoRef={videoRef}
                    aspectRatio={aspectRatio}
                    previewFilter={previewFilter}
                    previewCaption={previewCaption}
                    activeStyle={activeStyle}
                    brandName={brandName}
                    showCaptionOverlay={Boolean(plan || captions.length)}
                    isPlaying={isPlaying}
                    previewTime={previewTime}
                    onLoadedMetadata={captureDuration}
                    onTimeUpdate={handlePreviewTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onTogglePlayback={togglePlayback}
                    onUploadClick={() => inputRef.current?.click()}
                    onCreatorCommand={runAssistantCommand}
                  />
                  <ProjectMetrics
                    plan={plan}
                    activeStyle={activeStyle}
                    activePanel={activePanel}
                    projectStatus={projectStatus}
                    studioFile={studioFile}
                    engineProject={engineProject}
                    engineState={displayedEngineState}
                  />
                </div>
              </section>

              <TimelineEditor
                tracks={timelineTracks}
                selectedLayerId={selectedLayerId}
                zoom={timelineZoom}
                totalSeconds={totalTimelineSeconds}
                onSelectLayer={selectTimelineLayer}
              />
            </>
          )}
        </section>

        <aside className="space-y-4">
          <AssistantPanel
            command={assistantCommand}
            messages={assistantMessages}
            isRunning={isAssistantRunning}
            onCommandChange={setAssistantCommand}
            onRunCommand={runAssistantCommand}
          />
          {error ? (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
              {error}
            </p>
          ) : null}
          {renderSidePanel()}
        </aside>
      </div>
    </main>
  );

  function renderSidePanel() {
    if (activePanel === "ai") {
      return <AiStudioPanel plan={plan} onRun={handleAiAction} />;
    }

    if (activePanel === "transcript") {
      return (
        <TranscriptPanel
          transcript={filteredTranscript}
          query={transcriptSearch}
          onQueryChange={setTranscriptSearch}
          onDeleteSegment={markTranscriptDeleted}
          onRemoveFillers={removeFillerWords}
          onRemovePauses={removeLongPauses}
          onAutoTranscribe={() => transcribeVideo()}
          onGenerateCaptions={generateCaptionsFromTranscript}
          isTranscribing={isTranscribing}
          transcriptionMode={transcriptionMode}
          transcriptionNotice={transcriptionNotice}
        />
      );
    }

    if (activePanel === "captions") {
      return (
        <CaptionsPanel
          captions={captions}
          template={captionTemplate}
          onTemplateChange={setCaptionTemplate}
          onCaptionChange={updateCaption}
          onAutoTranscribe={() => transcribeVideo()}
          onDownloadSrt={downloadSrt}
          onBurnCaptions={renderVideo}
          isTranscribing={isTranscribing}
          transcriptionMode={transcriptionMode}
          transcriptionNotice={transcriptionNotice}
        />
      );
    }

    if (activePanel === "background") {
      return (
        <BackgroundPanel
          backgroundMode={backgroundMode}
          onChange={setBackgroundMode}
          onApply={() => setProjectStatus(`${backgroundMode} background queued`)}
        />
      );
    }

    if (activePanel === "audio") {
      return (
        <AudioPanel
          activeTools={activeAudioTools}
          onToggle={(tool) => setActiveAudioTools((tools) => ({ ...tools, [tool]: !tools[tool] }))}
          onApply={() => setProjectStatus("Audio enhancement chain applied")}
        />
      );
    }

    if (activePanel === "ad-maker") {
      return (
        <AdMakerPanel
          productName={adProductName}
          tone={adTone}
          output={adOutput}
          campaign={adCampaign}
          isGenerating={isAdGenerating}
          onProductNameChange={setAdProductName}
          onToneChange={setAdTone}
          onGenerate={generateAdVersion}
          onApply={() => {
            if (!adCampaign) return;
            applyAdCampaignToProject(adCampaign);
          }}
        />
      );
    }

    if (activePanel === "brand") {
      return <BrandKitPanel brandKit={brandKit} onChange={setBrandKit} brandName={brandName} onBrandNameChange={setBrandName} />;
    }

    if (activePanel === "exports") {
      return (
        <ExportsPanel
          tier={exportTier}
          format={exportFormat}
          renderResult={renderResult}
          renderProgress={renderProgress}
          isRendering={isRendering}
          aspectRatio={aspectRatio}
          onTierChange={setExportTier}
          onFormatChange={setExportFormat}
          onRender={renderVideo}
          onDownloadSrt={downloadSrt}
        />
      );
    }

    return (
      <>
        <ProjectSettingsPanel
          brandName={brandName}
          styleId={styleId}
          platform={platform}
          aspectRatio={aspectRatio}
          languageMode={languageMode}
          goal={goal}
          activeStyle={activeStyle}
          onBrandNameChange={setBrandName}
          onStyleChange={setStyleId}
          onPlatformChange={setPlatform}
          onAspectRatioChange={setAspectRatio}
          onLanguageChange={setLanguageMode}
          onGoalChange={setGoal}
        />
        <LayerInspector layer={selectedLayer} onChange={updateSelectedLayer} onDelete={deleteSelectedLayer} />
      </>
    );
  }

  function handleAiAction(actionId: string) {
    if (actionId === "shorts") {
      commitTimeline((tracks) =>
        tracks.map((track) =>
          track.kind === "effects"
            ? {
                ...track,
                layers: [
                  ...track.layers,
                  { id: crypto.randomUUID(), type: "effect", name: "15s clip", start: 0, duration: 15, color: "#8ef7c2" },
                  { id: crypto.randomUUID(), type: "effect", name: "30s clip", start: 3, duration: 30, color: "#a78bfa" },
                  { id: crypto.randomUUID(), type: "effect", name: "60s clip", start: 0, duration: 60, color: "#fbbf24" },
                ],
              }
            : track,
        ),
      );
      setProjectStatus("AI clip versions generated");
    }

    if (actionId === "titles") {
      setAssistantMessages((messages) => [
        createAssistantMessage("assistant", "Titles: لا تفوّت أول 3 ثواني | From raw footage to pro ad | Save this editing trick"),
        createAssistantMessage("assistant", "Hashtags: #صناعة_المحتوى #مونتاج #ريلز #تيك_توك"),
        ...messages,
      ].slice(0, 12));
    }

    if (actionId === "summary") {
      setAssistantMessages((messages) => [
        createAssistantMessage("assistant", "Summary: The strongest angle is a fast before/after transformation with Arabic captions and a direct CTA."),
        ...messages,
      ].slice(0, 12));
    }

    if (actionId === "moments") {
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          "Best moments: 0-3s hook, 9-16s value proof, 18-23s CTA. Suggested for TikTok/Reels/Shorts.",
          [{ type: "EXTRACT_CLIPS", label: "Best moments marked" }],
        ),
        ...messages,
      ].slice(0, 12));
    }
  }
}

function VideoPreview({
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
}) {
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
        <TemplateProjectPreview project={templateProject} />
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
            style={{
              width: studioFile
                ? `${Math.min(100, (previewTime / studioFile.durationSeconds) * 100)}%`
                : "0%",
            }}
          />
        </div>
        <span className="text-xs font-black text-white/70">
          {studioFile ? `${formatDuration(previewTime)} / ${formatDuration(studioFile.durationSeconds)}` : "00:00"}
        </span>
      </div>
    </div>
  );
}

function TemplateProjectPreview({ project }: { project: TemplateProject }) {
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

function TemplatePreviewLayer({
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
    return (
      <div
        className="absolute grid place-items-center overflow-hidden px-2 text-center font-black leading-tight"
        style={{
          ...style,
          color: normalizeHexColor(layer.color),
          fontSize: `${Math.max(11, (layer.fontSize ?? 44) * 0.2)}px`,
          direction: layer.direction === "ltr" ? "ltr" : "rtl",
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

function TimelineEditor({
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
    if (!canvas || typeof Worker === "undefined" || !("transferControlToOffscreen" in canvas)) {
      return;
    }

    try {
      const worker = new Worker(new URL("../workers/timeline.worker.ts", import.meta.url), {
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
      transferredRef.current = false;
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

function ProjectMetrics({
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

function AiStudioPanel({ plan, onRun }: { plan: EditPlan | null; onRun: (id: string) => void }) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Brain} title="AI video tools" />
      <div className="space-y-2">
        {AI_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onRun(action.id)}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-left transition hover:border-[var(--brand)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-black">{action.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--muted)]">{action.detail}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
      {plan ? (
        <div className="mt-4 rounded-lg border border-[var(--line)] bg-black/20 p-3">
          <p className="text-xs font-bold text-[var(--muted)]">Current AI brief</p>
          <p className="mt-2 text-sm font-black leading-6">{plan.hook}</p>
        </div>
      ) : null}
    </section>
  );
}

function TranscriptPanel({
  transcript,
  query,
  onQueryChange,
  onDeleteSegment,
  onRemoveFillers,
  onRemovePauses,
  onAutoTranscribe,
  onGenerateCaptions,
  isTranscribing,
  transcriptionMode,
  transcriptionNotice,
}: {
  transcript: TranscriptSegment[];
  query: string;
  onQueryChange: (query: string) => void;
  onDeleteSegment: (id: string) => void;
  onRemoveFillers: () => void;
  onRemovePauses: () => void;
  onAutoTranscribe: () => void;
  onGenerateCaptions: () => void;
  isTranscribing: boolean;
  transcriptionMode: "openai" | "demo" | null;
  transcriptionNotice: string;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Mic2} title="Text-based editing" />
      <button
        type="button"
        onClick={onAutoTranscribe}
        disabled={isTranscribing}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white disabled:opacity-60"
      >
        {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
        {isTranscribing ? "Reading video..." : "Auto-caption from video"}
      </button>
      {transcriptionMode ? (
        <p className="mb-3 rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-bold text-[var(--muted)]">
          Mode: {transcriptionMode === "openai" ? "real OpenAI transcription" : "demo fallback"}
        </p>
      ) : null}
      {transcriptionNotice ? (
        <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-bold leading-5 text-amber-100">
          {transcriptionNotice}
        </p>
      ) : null}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search transcript"
          className="control-input pl-9"
        />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <CompactButton label="Remove fillers" icon={Trash2} onClick={onRemoveFillers} />
        <CompactButton label="Remove pauses" icon={Scissors} onClick={onRemovePauses} />
        <CompactButton label="Make captions" icon={Captions} onClick={onGenerateCaptions} />
        <CompactButton label="Split topics" icon={ListVideo} onClick={onRemovePauses} />
      </div>
      <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
        {transcript.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => onDeleteSegment(segment.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              segment.deleted
                ? "border-red-400/40 bg-red-500/10 text-red-100"
                : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--brand)]"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[var(--brand)]">
                {formatDuration(segment.start)}-{formatDuration(segment.end)}
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)]">{segment.speaker}</span>
            </div>
            <p className="text-sm font-semibold leading-6" dir="rtl">{segment.text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function CaptionsPanel({
  captions,
  template,
  onTemplateChange,
  onCaptionChange,
  onAutoTranscribe,
  onDownloadSrt,
  onBurnCaptions,
  isTranscribing,
  transcriptionMode,
  transcriptionNotice,
}: {
  captions: CaptionLine[];
  template: string;
  onTemplateChange: (template: string) => void;
  onCaptionChange: (id: string, text: string) => void;
  onAutoTranscribe: () => void;
  onDownloadSrt: () => void;
  onBurnCaptions: () => void;
  isTranscribing: boolean;
  transcriptionMode: "openai" | "demo" | null;
  transcriptionNotice: string;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Captions} title="Automatic captions" />
      <button
        type="button"
        onClick={onAutoTranscribe}
        disabled={isTranscribing}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white disabled:opacity-60"
      >
        {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
        {isTranscribing ? "Transcribing..." : "Read video and generate captions"}
      </button>
      {transcriptionMode ? (
        <p className="mb-3 rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-bold text-[var(--muted)]">
          {transcriptionMode === "openai"
            ? "Captions were generated from the uploaded video's audio."
            : "Demo captions are active. Add OPENAI_API_KEY for real audio transcription."}
        </p>
      ) : null}
      {transcriptionNotice ? (
        <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-bold leading-5 text-amber-100">
          {transcriptionNotice}
        </p>
      ) : null}
      <div className="mb-3 grid grid-cols-1 gap-2">
        {CAPTION_TEMPLATES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onTemplateChange(item)}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              template === item
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <CompactButton label="Export SRT" icon={Download} onClick={onDownloadSrt} />
        <CompactButton label="Burn-in" icon={MonitorUp} onClick={onBurnCaptions} />
      </div>
      <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
        {captions.map((caption) => (
          <label key={caption.id} className="block rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2">
            <span className="mb-2 block text-[11px] font-black text-[var(--brand)]">
              {formatDuration(caption.start)}-{formatDuration(caption.end)}
            </span>
            <textarea
              value={caption.text}
              onChange={(event) => onCaptionChange(caption.id, event.target.value)}
              dir="rtl"
              className="min-h-20 w-full resize-none rounded-md border border-[var(--line)] bg-black/25 p-2 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)]"
            />
          </label>
        ))}
      </div>
    </section>
  );
}

function BackgroundPanel({
  backgroundMode,
  onChange,
  onApply,
}: {
  backgroundMode: string;
  onChange: (mode: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Replace} title="AI background remover" />
      <div className="space-y-2">
        {BACKGROUND_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              backgroundMode === option
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button type="button" onClick={onApply} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
        <WandSparkles className="h-4 w-4" aria-hidden="true" />
        Apply background
      </button>
    </section>
  );
}

function AudioPanel({
  activeTools,
  onToggle,
  onApply,
}: {
  activeTools: Record<string, boolean>;
  onToggle: (tool: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Volume2} title="Audio enhancement" />
      <div className="space-y-2">
        {AUDIO_TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onToggle(tool)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              activeTools[tool]
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {tool}
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <LibraryList title="Music library" items={MUSIC_LIBRARY} icon={Music2} />
      <LibraryList title="Sound effects" items={SOUND_EFFECTS} icon={FileAudio2} />
      <button type="button" onClick={onApply} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
        <Volume2 className="h-4 w-4" aria-hidden="true" />
        Apply audio chain
      </button>
    </section>
  );
}

function TemplatesPanel({
  activeTemplateId,
  onApply,
}: {
  activeTemplateId: string | null;
  onApply: (templateId: string) => void;
}) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <PanelHeading icon={LayoutTemplate} title="Template library" />
        <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand)]">
          Applies to timeline
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_PRESETS.map((template) => {
          const Icon = template.icon;
          const active = activeTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onApply(template.id)}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--brand)]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{template.aspectRatio}</span>
              </div>
              <p className="text-base font-black">{template.name}</p>
              <p className="mt-1 text-xs font-black text-[var(--brand)]">{template.category}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">{template.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="rounded-md bg-black/25 px-2 py-1 text-[11px] font-black">{PLATFORM_LABELS[template.platform]}</span>
                <span className="rounded-md bg-black/25 px-2 py-1 text-[11px] font-black">{template.captionTemplate}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AdMakerPanel({
  productName,
  tone,
  output,
  campaign,
  isGenerating,
  onProductNameChange,
  onToneChange,
  onGenerate,
  onApply,
}: {
  productName: string;
  tone: AdTone;
  output: string;
  campaign: AdCampaign | null;
  isGenerating: boolean;
  onProductNameChange: (name: string) => void;
  onToneChange: (tone: AdTone) => void;
  onGenerate: () => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={BadgeDollarSign} title="AI Ad Maker" />
      <Field label="Product name">
        <input value={productName} onChange={(event) => onProductNameChange(event.target.value)} className="control-input" />
      </Field>
      <Field label="Tone">
        <select value={tone} onChange={(event) => onToneChange(event.target.value as AdTone)} className="control-select">
          {AD_TONES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Rocket className="h-4 w-4" aria-hidden="true" />}
        {isGenerating ? "Generating real campaign..." : "Generate and apply ad"}
      </button>
      {campaign ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-3">
            <p className="text-sm font-black">{campaign.title}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-[var(--muted)]">{campaign.strategy}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {campaign.variants.map((variant) => (
              <div key={variant.id} className="rounded-lg border border-[var(--line)] bg-black/20 p-2">
                <p className="text-xs font-black text-[var(--brand)]">{variant.id}</p>
                <p className="mt-1 line-clamp-3 text-[11px] font-bold leading-5 text-[var(--muted)]">{variant.hook}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={onApply} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-[var(--brand)]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Apply selected campaign again
          </button>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-black/25 p-3 text-xs font-semibold leading-6 text-[var(--foreground)]">
            {output}
          </pre>
        </div>
      ) : (
        <EmptyMini label="Uses OpenAI to create 15s, 30s, and 60s ad scripts, captions, scenes, CTA, hashtags, then applies the 30s version to the timeline." />
      )}
    </section>
  );
}

function BrandKitPanel({
  brandKit,
  brandName,
  onChange,
  onBrandNameChange,
}: {
  brandKit: BrandKitState;
  brandName: string;
  onChange: (brandKit: BrandKitState) => void;
  onBrandNameChange: (name: string) => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Palette} title="Brand Kit" />
      <Field label="Brand name">
        <input value={brandName} onChange={(event) => onBrandNameChange(event.target.value)} className="control-input" />
      </Field>
      <Field label="Logo">
        <input value={brandKit.logoName} onChange={(event) => onChange({ ...brandKit, logoName: event.target.value })} className="control-input" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Primary">
          <input type="color" value={brandKit.primaryColor} onChange={(event) => onChange({ ...brandKit, primaryColor: event.target.value })} className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1" />
        </Field>
        <Field label="Secondary">
          <input type="color" value={brandKit.secondaryColor} onChange={(event) => onChange({ ...brandKit, secondaryColor: event.target.value })} className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1" />
        </Field>
      </div>
      <Field label="Font">
        <input value={brandKit.font} onChange={(event) => onChange({ ...brandKit, font: event.target.value })} className="control-input" />
      </Field>
      <Field label="Caption style">
        <input value={brandKit.captionStyle} onChange={(event) => onChange({ ...brandKit, captionStyle: event.target.value })} className="control-input" />
      </Field>
      <Field label="Intro / Outro">
        <div className="grid grid-cols-2 gap-2">
          <input value={brandKit.intro} onChange={(event) => onChange({ ...brandKit, intro: event.target.value })} className="control-input" />
          <input value={brandKit.outro} onChange={(event) => onChange({ ...brandKit, outro: event.target.value })} className="control-input" />
        </div>
      </Field>
    </section>
  );
}

function DashboardPanel({
  projects,
  projectStatus,
  onRefresh,
  onUpdate,
  onDelete,
}: {
  projects: StudioProject[];
  projectStatus: string;
  onRefresh: () => void;
  onUpdate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Projects" value={`${projects.length}`} icon={FolderOpen} />
        <DashboardCard label="Uploaded media" value="48 assets" icon={UploadCloud} />
        <DashboardCard label="Export history" value="19 renders" icon={History} />
        <DashboardCard label="Storage usage" value="38.2 GB" icon={Cloud} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <PanelHeading icon={LayoutDashboard} title="User projects" />
            <button
              type="button"
              onClick={onRefresh}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-black transition hover:border-[var(--brand)]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {projects.length ? projects.slice(0, 8).map((project) => (
              <div key={project.id} className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{project.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">
                    {project.sourceFileName} · {project.aspectRatio} · {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{project.status}</span>
                  <button
                    type="button"
                    onClick={() => onUpdate(project.id)}
                    className="min-h-9 rounded-md border border-[var(--line)] bg-black/20 px-3 text-[11px] font-black transition hover:border-[var(--brand)]"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(project.id)}
                    className="min-h-9 rounded-md border border-red-400/40 bg-red-500/10 px-3 text-[11px] font-black text-red-100 transition hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )) : (
              <EmptyMini label="No saved cloud projects yet. Upload a video and generate a plan to create one." />
            )}
          </div>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={CreditCard} title="Billing" />
          <div className="space-y-2">
            {EXPORT_TIERS.map((tier) => (
              <div key={tier.name} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{tier.name}</p>
                  <span className="text-xs font-black text-[var(--brand)]">{tier.price}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{tier.quality} · {tier.watermark}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-[var(--line)] bg-black/20 p-3 text-xs font-bold text-[var(--muted)]">
            {projectStatus}
          </p>
        </section>
      </div>
    </section>
  );
}

function CollaborationPanel() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="panel p-4">
        <PanelHeading icon={MessagesSquare} title="Client comments" />
        <div className="space-y-3">
          {[
            "0:03 Make the hook bigger and more direct.",
            "0:12 Add product price as a lower third.",
            "0:21 Client approved this CTA.",
          ].map((comment) => (
            <div key={comment} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
              <p className="text-sm font-bold leading-6">{comment}</p>
              <p className="mt-2 text-xs font-semibold text-[var(--muted)]">Timeline comment · open</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <section className="panel p-4">
          <PanelHeading icon={Share2} title="Preview link" />
          <button type="button" className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Share review link
          </button>
          <p className="text-xs font-semibold leading-5 text-[var(--muted)]">
            Secure client preview with comments, version history, and viewer-only access.
          </p>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={Users} title="Team roles" />
          <div className="space-y-2">
            {TEAM_ROLES.map((member) => (
              <div key={member.role} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <p className="text-sm font-black">{member.name} · {member.role}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{member.access}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={History} title="Version history" />
          <div className="space-y-2">
            {VERSION_HISTORY.map((version) => (
              <p key={version} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-xs font-black">
                {version}
              </p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ExportsPanel({
  tier,
  format,
  renderResult,
  renderProgress,
  isRendering,
  aspectRatio,
  onTierChange,
  onFormatChange,
  onRender,
  onDownloadSrt,
}: {
  tier: string;
  format: string;
  renderResult: BrowserRenderResult | null;
  renderProgress: BrowserRenderProgress | null;
  isRendering: boolean;
  aspectRatio: AspectRatio;
  onTierChange: (tier: string) => void;
  onFormatChange: (format: string) => void;
  onRender: () => void;
  onDownloadSrt: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={MonitorUp} title="Export center" />
      <div className="mb-3 grid grid-cols-3 gap-2">
        {EXPORT_TIERS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onTierChange(item.name)}
            className={`rounded-lg border p-2 text-center transition ${
              tier === item.name
                ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                : "border-[var(--line)] bg-[var(--panel-soft)]"
            }`}
          >
            <p className="text-xs font-black">{item.name}</p>
            <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">{item.quality}</p>
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-5 gap-2">
        {["MP4", "GIF", "MP3", "SRT", "Thumbnail"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFormatChange(item)}
            className={`min-h-10 rounded-lg border px-2 text-[11px] font-black transition ${
              format === item
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={format === "SRT" ? onDownloadSrt : onRender}
        disabled={isRendering}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black disabled:opacity-60"
      >
        {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isRendering ? `Rendering ${renderProgress?.percent ?? 0}%` : `Export ${format}`}
      </button>
      {isRendering ? (
        <div className="mb-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-[var(--muted)]">
            <span>{renderProgress?.label ?? "Rendering"}</span>
            <span>{renderProgress?.percent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${renderProgress?.percent ?? 0}%` }} />
          </div>
        </div>
      ) : null}
      {renderResult ? (
        <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-3">
          <video
            src={renderResult.url}
            controls
            className={`mx-auto mb-3 max-h-[420px] w-full rounded-lg bg-black object-contain ${
              aspectRatio === "9:16" ? "aspect-[9/16] max-w-[236px]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
            }`}
          />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <SmallSetting label="Output" value={renderResult.resolution} />
            <SmallSetting label="Length" value={formatDuration(renderResult.durationSeconds)} />
          </div>
          <a
            href={renderResult.url}
            download={renderResult.fileName}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-black transition hover:bg-[var(--brand)]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download edited file
          </a>
        </div>
      ) : null}
    </section>
  );
}

function ProjectSettingsPanel({
  brandName,
  styleId,
  platform,
  aspectRatio,
  languageMode,
  goal,
  activeStyle,
  onBrandNameChange,
  onStyleChange,
  onPlatformChange,
  onAspectRatioChange,
  onLanguageChange,
  onGoalChange,
}: {
  brandName: string;
  styleId: VideoStyleId;
  platform: Platform;
  aspectRatio: AspectRatio;
  languageMode: LanguageMode;
  goal: Goal;
  activeStyle: VideoStyle;
  onBrandNameChange: (name: string) => void;
  onStyleChange: (style: VideoStyleId) => void;
  onPlatformChange: (platform: Platform) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onLanguageChange: (language: LanguageMode) => void;
  onGoalChange: (goal: Goal) => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={SlidersHorizontal} title="Project settings" />
      <Field label="Brand">
        <input value={brandName} onChange={(event) => onBrandNameChange(event.target.value)} className="control-input" />
      </Field>
      <Field label="Style">
        <select value={styleId} onChange={(event) => onStyleChange(event.target.value as VideoStyleId)} className="control-select">
          {VIDEO_STYLES.map((style) => (
            <option key={style.id} value={style.id}>{style.arabicName}</option>
          ))}
        </select>
      </Field>
      <Field label="Platform">
        <select value={platform} onChange={(event) => onPlatformChange(event.target.value as Platform)} className="control-select">
          {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </Field>
      <Field label="Format">
        <div className="grid grid-cols-3 gap-2">
          {FORMAT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onAspectRatioChange(preset.id as AspectRatio)}
              className={`min-h-11 rounded-lg border px-2 text-xs font-black transition ${
                aspectRatio === preset.id
                  ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
              }`}
            >
              {preset.id}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Language">
          <select value={languageMode} onChange={(event) => onLanguageChange(event.target.value as LanguageMode)} className="control-select">
            <option value="arabic">Arabic</option>
            <option value="english">English</option>
            <option value="mixed">Mixed</option>
          </select>
        </Field>
        <Field label="Goal">
          <select value={goal} onChange={(event) => onGoalChange(event.target.value as Goal)} className="control-select">
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
        <p className="text-xs font-bold text-[var(--muted)]">Active preset</p>
        <p className="mt-1 text-sm font-black">{activeStyle.arabicName}</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted)]">{activeStyle.description}</p>
      </div>
    </section>
  );
}

function LayerInspector({
  layer,
  onChange,
  onDelete,
}: {
  layer: TimelineLayer | null;
  onChange: (patch: Partial<TimelineLayer>) => void;
  onDelete: () => void;
}) {
  if (!layer) {
    return (
      <section className="panel p-4">
        <PanelHeading icon={Layers3} title="Layer inspector" />
        <EmptyMini label="Select a layer on the timeline to edit text, timing, size, color, or media." />
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <PanelHeading icon={Layers3} title="Layer inspector" />
      <Field label="Layer name">
        <input value={layer.name} onChange={(event) => onChange({ name: event.target.value })} className="control-input" />
      </Field>
      {layer.type === "text" || layer.type === "caption" ? (
        <Field label="Text content">
          <textarea
            value={layer.content ?? layer.name}
            onChange={(event) => onChange({ content: event.target.value, name: event.target.value.slice(0, 42) || layer.name })}
            dir="auto"
            className="min-h-24 w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)]"
          />
        </Field>
      ) : null}
      {layer.type === "image" || layer.type === "video" ? (
        <Field label="Replace media">
          <label className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-3 text-center transition hover:border-[var(--brand)]">
            <UploadCloud className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
            <span className="text-xs font-black">{layer.src ? "Media attached" : "Upload replacement"}</span>
            <input
              type="file"
              accept={layer.type === "image" ? "image/*" : "video/*"}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onChange({ src: URL.createObjectURL(file), name: file.name });
              }}
            />
          </label>
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Start" value={layer.start} onChange={(start) => onChange({ start })} />
        <NumberField label="Duration" value={layer.duration} onChange={(duration) => onChange({ duration })} />
        <NumberField label="X" value={layer.x ?? 0} onChange={(x) => onChange({ x })} />
        <NumberField label="Y" value={layer.y ?? 0} onChange={(y) => onChange({ y })} />
        <NumberField label="Width" value={layer.width ?? 0} onChange={(width) => onChange({ width })} />
        <NumberField label="Height" value={layer.height ?? 0} onChange={(height) => onChange({ height })} />
      </div>
      {layer.type === "text" || layer.type === "caption" ? (
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Font size" value={layer.fontSize ?? 48} onChange={(fontSize) => onChange({ fontSize })} />
          <Field label="Text color">
            <input
              type="color"
              value={layer.textColor ?? layer.color}
              onChange={(event) => onChange({ textColor: event.target.value, color: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
            />
          </Field>
        </div>
      ) : (
        <Field label="Layer color">
          <input
            type="color"
            value={normalizeHexColor(layer.color)}
            onChange={(event) => onChange({ color: event.target.value })}
            className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
          />
        </Field>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100 transition hover:border-red-300"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete selected layer
      </button>
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="control-input"
      />
    </Field>
  );
}

function AssistantPanel({
  command,
  messages,
  isRunning,
  onCommandChange,
  onRunCommand,
}: {
  command: string;
  messages: AssistantMessage[];
  isRunning: boolean;
  onCommandChange: (command: string) => void;
  onRunCommand: (commandOverride?: string) => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Bot} title="AI assistant" />
      <div className="mb-3 flex gap-2">
        <input
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onRunCommand();
          }}
          placeholder="اكتب أمراً للـ AI..."
          dir="auto"
          className="control-input"
        />
        <button
          type="button"
          onClick={() => onRunCommand()}
          disabled={isRunning || !command.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-black disabled:opacity-50"
          aria-label="Run AI command"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <WandSparkles className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CREATOR_STARTERS.map((quickCommand) => (
          <button
            key={quickCommand.label}
            type="button"
            onClick={() => onRunCommand(quickCommand.command)}
            disabled={isRunning}
            className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-white disabled:opacity-50"
          >
            {quickCommand.label}
          </button>
        ))}
      </div>
      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {isRunning ? (
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-xs font-black text-[var(--brand)]">
            يفهم الأمر ويجهز الأكشنات...
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border p-2 text-xs font-semibold leading-5 ${
              message.role === "user"
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-white"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
            }`}
            dir="auto"
          >
            <p>{message.role === "user" ? `You: ${message.content}` : message.content}</p>
            {message.actions?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {message.actions.map((action) => (
                  <span
                    key={`${message.id}-${action.type}`}
                    className="rounded-md border border-[var(--brand)] bg-black/25 px-1.5 py-0.5 text-[10px] font-black text-[var(--brand)]"
                  >
                    ✓ {action.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return <span className={`rounded-md px-3 py-1.5 ${active ? "bg-[var(--brand)] text-black" : "text-[var(--muted)]"}`}>{label}</span>;
}

function PanelHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
      <h2 className="text-sm font-black">{title}</h2>
    </div>
  );
}

function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  tone = "default",
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition disabled:opacity-40 ${
        tone === "danger"
          ? "border-red-400/40 bg-red-500/10 text-red-100 hover:border-red-300"
          : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--brand)]"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function CompactButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-2 text-[11px] font-black transition hover:border-[var(--brand)]">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-2 block text-xs font-black text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--muted)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-black">{label}</p>
      </div>
      <p className="text-sm font-black leading-6">{value}</p>
    </div>
  );
}

function SmallSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-black/20 p-3">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function LibraryList({ title, items, icon: Icon }: { title: string; items: string[]; icon: LucideIcon }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
        <p className="text-xs font-black text-[var(--muted)]">{title}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-black">{item}</p>
        ))}
      </div>
    </div>
  );
}

function EmptyMini({ label }: { label: string }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-4 text-center">
      <p className="text-xs font-bold leading-5 text-[var(--muted)]">{label}</p>
    </div>
  );
}

function DashboardCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black text-[var(--muted)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function AssetIcon({ kind }: { kind: MediaAsset["kind"] }) {
  const Icon = kind === "audio" ? FileAudio2 : kind === "image" ? ImageIcon : Film;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />;
}

function createDefaultTimeline(): TimelineTrack[] {
  return createTimelineForVideo("Source video", 36);
}

function createImageStoryboardTemplateProject({
  assets,
  plan,
  brandName,
  aspectRatio,
  styleName,
  goal,
}: {
  assets: MediaAsset[];
  plan: EditPlan;
  brandName: string;
  aspectRatio: AspectRatio;
  styleName: string;
  goal: Goal;
}): TemplateProject {
  const now = new Date().toISOString();
  const dimensions = getTemplateDimensions(aspectRatio);
  const duration = getImageStoryboardDuration(assets.length, plan.targetDurationSeconds);
  const sceneDuration = duration / Math.max(1, assets.length);
  const safe = getStoryboardSafeMargins(aspectRatio);
  const textWidth = dimensions.width - safe.left - safe.right;
  const captionLines = plan.captions.length
    ? plan.captions
    : [{ at: 0, text: plan.hook, emphasis: [] }];
  const scenes: TemplateScene[] = assets.map((asset, index) => {
    const start = roundTime(index * sceneDuration);
    const end = index === assets.length - 1 ? duration : roundTime((index + 1) * sceneDuration);
    const caption = captionLines[index % captionLines.length]?.text ?? plan.hook;
    const isLast = index === assets.length - 1;

    return {
      id: `image-scene-${index + 1}`,
      name: isLast ? "CTA / Closing" : `Image scene ${index + 1}`,
      start,
      duration: Math.max(1, roundTime(end - start)),
      background: {
        type: "color",
        value: index % 2 === 0 ? "#050608" : "#111827",
      },
      transition: {
        type: index === 0 ? "fade" : "slide",
        duration: 0.45,
      },
      layers: [
        {
          id: `image-${asset.id}`,
          type: "image",
          name: asset.name,
          src: asset.url,
          x: 0,
          y: 0,
          width: dimensions.width,
          height: dimensions.height,
          fit: "cover",
          animationIn: {
            type: index % 2 === 0 ? "zoomIn" : "slideUp",
            duration: 0.6,
          },
          animationOut: {
            type: "fadeOut",
            duration: 0.35,
          },
        },
        {
          id: `wash-${index + 1}`,
          type: "shape",
          name: "Readable overlay",
          x: 0,
          y: 0,
          width: dimensions.width,
          height: dimensions.height,
          color: "#050608",
          opacity: 0.28,
          editable: true,
        },
        {
          id: `brand-${index + 1}`,
          type: "text",
          content: `${brandName.trim() || "Mawj Studio"} · ${styleName}`,
          x: safe.left,
          y: Math.max(36, safe.top - 98),
          width: textWidth,
          height: 72,
          fontSize: aspectRatio === "16:9" ? 34 : 42,
          fontWeight: "800",
          color: "#ffffff",
          align: "center",
          direction: "auto",
          animationIn: {
            type: "fadeIn",
            duration: 0.35,
          },
        },
        {
          id: `caption-${index + 1}`,
          type: "captions",
          content: caption,
          x: safe.left,
          y: dimensions.height - safe.bottom - (aspectRatio === "16:9" ? 132 : 210),
          width: textWidth,
          height: aspectRatio === "16:9" ? 128 : 200,
          fontSize: aspectRatio === "16:9" ? 44 : 58,
          fontWeight: "900",
          color: "#ffffff",
          highlightColor: "#8ef7c2",
          align: "center",
          direction: "auto",
          style: "karaoke",
          animationIn: {
            type: "slideUp",
            duration: 0.45,
          },
        },
        ...(isLast
          ? [
              {
                id: "image-storyboard-cta",
                type: "text" as const,
                content: goal === "sales" ? "اطلب الآن" : "احفظ المقطع",
                x: safe.left,
                y: dimensions.height - safe.bottom - (aspectRatio === "16:9" ? 34 : 72),
                width: textWidth,
                height: 72,
                fontSize: aspectRatio === "16:9" ? 40 : 54,
                fontWeight: "950",
                color: "#8ef7c2",
                align: "center" as const,
                direction: "auto" as const,
                animationIn: {
                  type: "pop" as const,
                  duration: 0.45,
                },
              },
            ]
          : []),
      ],
    };
  });

  return {
    id: `image-storyboard-${Date.now()}`,
    name: `${brandName.trim() || "Mawj"} Image Storyboard`,
    templateId: "image-storyboard-generated",
    width: dimensions.width,
    height: dimensions.height,
    aspectRatio,
    duration,
    scenes,
    timeline: convertScenesToTimeline(scenes),
    audio: {
      music: null,
      volume: 1,
    },
    export: {
      format: "mp4",
      fps: 30,
      quality: "1080p",
    },
    inputs: {
      brandName: brandName.trim() || "Mawj Studio",
      sourceType: "images",
      imageCount: String(assets.length),
    },
    createdAt: now,
    updatedAt: now,
  };
}

function getImageStoryboardDuration(imageCount: number, preferredDuration?: number) {
  if (preferredDuration && Number.isFinite(preferredDuration)) {
    return Math.max(8, Math.min(60, Math.round(preferredDuration)));
  }

  return Math.max(10, Math.min(45, imageCount * 4 + 4));
}

function getTemplateDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function getStoryboardSafeMargins(aspectRatio: AspectRatio) {
  if (aspectRatio === "9:16") return { top: 160, bottom: 260, left: 70, right: 70 };
  if (aspectRatio === "1:1") return { top: 90, bottom: 120, left: 80, right: 80 };
  return { top: 84, bottom: 104, left: 120, right: 120 };
}

function roundTime(seconds: number) {
  return Math.round(seconds * 100) / 100;
}

function createTimelineForAssets(assets: MediaAsset[], primaryVideoAssetId: string): TimelineTrack[] {
  const primaryVideo = assets.find((asset) => asset.id === primaryVideoAssetId && asset.kind === "video");
  const base = createTimelineForVideo(
    primaryVideo?.name ?? "Source video",
    primaryVideo?.durationSeconds ?? 60,
    primaryVideo?.url,
  );
  const extraAssets = assets.filter((asset) => asset.id !== primaryVideoAssetId);
  return addAssetsToTimeline(base, extraAssets);
}

function createTimelineForVideo(name: string, duration: number, sourceUrl?: string): TimelineTrack[] {
  const resolvedDuration = Math.max(12, Math.min(120, duration));
  return [
    {
      id: "track-video",
      name: "Video",
      kind: "video",
      layers: [{ id: "clip-main", type: "video", name, start: 0, duration: resolvedDuration, color: "#8ef7c2", src: sourceUrl }],
    },
    {
      id: "track-audio",
      name: "Audio",
      kind: "audio",
      layers: [{ id: "audio-main", type: "audio", name: "Source audio", start: 0, duration: resolvedDuration, color: "#7dd3fc" }],
    },
    {
      id: "track-overlays",
      name: "Text / Images",
      kind: "overlay",
      layers: [
        { id: "hook-title", type: "text", name: "Hook title", start: 0, duration: 4, color: "#facc15" },
        { id: "brand-bug", type: "image", name: "Brand bug", start: 0, duration: resolvedDuration, color: "#c084fc" },
      ],
    },
    {
      id: "track-captions",
      name: "Captions",
      kind: "caption",
      layers: [{ id: "caption-main", type: "caption", name: "Arabic captions", start: 0, duration: resolvedDuration, color: "#fb923c" }],
    },
    {
      id: "track-effects",
      name: "AI Effects",
      kind: "effects",
      layers: [{ id: "effect-color", type: "effect", name: "Color grade", start: 0, duration: resolvedDuration, color: "#f472b6" }],
    },
  ];
}

function addAssetsToTimeline(tracks: TimelineTrack[], assets: MediaAsset[]): TimelineTrack[] {
  return tracks.map((track) => {
    const matchingAssets = assets.filter((asset) =>
      track.kind === "video"
        ? asset.kind === "video"
        : track.kind === "audio"
          ? asset.kind === "audio"
          : track.kind === "overlay"
            ? asset.kind === "image"
            : false,
    );
    if (!matchingAssets.length) return track;
    const trackEnd = getTrackEnd(track);
    return {
      ...track,
      layers: [
        ...track.layers,
        ...matchingAssets.map((asset, index): TimelineLayer => ({
          id: asset.id,
          type: asset.kind as TimelineLayer["type"],
          name: asset.name,
          start: track.kind === "video" || track.kind === "audio" ? trackEnd + index * 2 : index * 2,
          duration:
            asset.kind === "video" || asset.kind === "audio"
              ? Math.max(1, Math.min(360, Math.round(asset.durationSeconds ?? (asset.kind === "video" ? 12 : 20))))
              : 8,
          color: asset.kind === "video" ? "#8ef7c2" : asset.kind === "audio" ? "#7dd3fc" : "#c084fc",
          src: asset.url,
          x: asset.kind === "image" ? 120 : 0,
          y: asset.kind === "image" ? 220 : 0,
          width: asset.kind === "image" ? 840 : undefined,
          height: asset.kind === "image" ? 840 : undefined,
        })),
      ],
    };
  });
}

function applyStoredMediaMetadataToTimeline(
  tracks: TimelineTrack[],
  records: StoredMediaRecord[],
  primaryVideoAssetId: string | null,
): TimelineTrack[] {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const primaryRecord = primaryVideoAssetId ? recordById.get(primaryVideoAssetId) : null;

  return tracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) => {
      const record = recordById.get(layer.id);

      if (record) {
        return {
          ...layer,
          duration:
            record.durationSeconds && (record.type === "video" || record.type === "audio")
              ? Math.max(1, Math.min(360, Math.round(record.durationSeconds)))
              : layer.duration,
          width: record.width ?? layer.width,
          height: record.height ?? layer.height,
        };
      }

      if (
        primaryRecord?.durationSeconds &&
        ["clip-main", "audio-main", "caption-main", "effect-color", "brand-bug"].includes(layer.id)
      ) {
        return {
          ...layer,
          name: layer.id === "clip-main" ? primaryRecord.name : layer.name,
          duration: Math.max(1, Math.min(360, Math.round(primaryRecord.durationSeconds))),
        };
      }

      return layer;
    }),
  }));
}

function syncPrimaryVideoDuration(tracks: TimelineTrack[], sourceName: string, duration: number): TimelineTrack[] {
  const resolvedDuration = Math.max(1, Math.min(360, duration));
  return tracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) => {
      if (layer.id === "clip-main") {
        return { ...layer, name: sourceName, duration: resolvedDuration };
      }

      if (["audio-main", "caption-main", "effect-color", "brand-bug"].includes(layer.id)) {
        return { ...layer, duration: resolvedDuration };
      }

      return layer;
    }),
  }));
}

function ensureCaptionLayer(tracks: TimelineTrack[], captions: CaptionLine[], durationSeconds: number): TimelineTrack[] {
  const captionDuration =
    captions.length > 0 ? Math.max(...captions.map((caption) => caption.end)) : durationSeconds;

  return tracks.map((track) =>
    track.kind === "caption"
      ? {
          ...track,
          layers: [
            {
              id: "caption-main",
              type: "caption" as const,
              name: `${captions.length} auto captions`,
              start: 0,
              duration: Math.max(1, captionDuration),
              color: "#fb923c",
            },
          ],
        }
      : track,
  );
}

function getTrackEnd(track: TimelineTrack) {
  return track.layers.reduce((end, layer) => Math.max(end, layer.start + layer.duration), 0);
}

function findSourceAssetForLayer(
  layer: TimelineLayer,
  mediaAssets: MediaAsset[],
  studioFile: StudioFile | null,
) {
  return mediaAssets.find((asset) => {
    if (asset.id === layer.id) return true;
    if (layer.src && asset.url === layer.src) return true;
    if (studioFile && asset.url === studioFile.url && layer.type === "video") return true;
    return asset.name === layer.name && asset.kind === layer.type;
  }) ?? null;
}

function isPrimarySourceLayer(layer: TimelineLayer, studioFile: StudioFile | null) {
  if (layer.type !== "video" || !studioFile) return false;
  return layer.id === "clip-main" || layer.src === studioFile.url || layer.name === studioFile.file.name;
}

function removeAssetFromTimeline(
  tracks: TimelineTrack[],
  asset: MediaAsset,
  isCurrentSource: boolean,
) {
  return tracks.map((track) => ({
    ...track,
    layers: track.layers.filter((layer) => {
      if (layer.id === asset.id) return false;
      if (layer.src && layer.src === asset.url) return false;
      if (layer.name === asset.name && layer.type === asset.kind) return false;
      if (isCurrentSource && ["clip-main", "audio-main"].includes(layer.id)) return false;
      return true;
    }),
  }));
}

function revokeObjectUrl(url?: string) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function createAssistantMessage(
  role: AssistantMessage["role"],
  content: string,
  actions?: AICommandAction[],
): AssistantMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    actions,
    timestamp: Date.now(),
  };
}

function getAICommandContext({
  platform,
  aspectRatio,
  languageMode,
  goal,
  studioFile,
  mediaAssets,
  captions,
  activePanel,
  selectedLayer,
  totalTimelineSeconds,
}: {
  platform: Platform;
  aspectRatio: AspectRatio;
  languageMode: LanguageMode;
  goal: Goal;
  studioFile: StudioFile | null;
  mediaAssets: MediaAsset[];
  captions: CaptionLine[];
  activePanel: PanelId;
  selectedLayer: TimelineLayer | null;
  totalTimelineSeconds: number;
}): AICommandContext {
  return {
    platform,
    aspectRatio,
    languageMode,
    goal,
    durationSeconds: studioFile?.durationSeconds ?? totalTimelineSeconds,
    hasVideo: Boolean(studioFile),
    mediaCount: mediaAssets.length,
    captionCount: captions.length,
    activePanel,
    selectedLayerName: selectedLayer?.name ?? null,
  };
}

function getEditorEngineLabel({
  plan,
  templateProject,
  transcriptionMode,
  mediaCount,
  engineProject,
}: {
  plan: EditPlan | null;
  templateProject: TemplateProject | null;
  transcriptionMode: "openai" | "demo" | null;
  mediaCount: number;
  engineProject: VideoProject | null;
}) {
  if (transcriptionMode === "openai") return "OpenAI captions";
  if (plan) return "AI edit planner";
  if (templateProject) return "Template engine";
  if (engineProject) return "Timeline engine";
  if (mediaCount) return "Media ingest";
  return "Ready";
}

function getEditorConfidence({
  plan,
  captionsCount,
  mediaCount,
  transcriptionMode,
}: {
  plan: EditPlan | null;
  captionsCount: number;
  mediaCount: number;
  transcriptionMode: "openai" | "demo" | null;
}) {
  if (plan) return Math.round(plan.confidence);
  if (transcriptionMode === "openai") return 88;
  if (captionsCount) return 78;
  if (mediaCount) return 72;
  return 64;
}

function getSuggestedTargetCut({
  plan,
  platform,
  goal,
  durationSeconds,
}: {
  plan: EditPlan | null;
  platform: Platform;
  goal: Goal;
  durationSeconds: number;
}) {
  if (plan) return `${plan.targetDurationSeconds}s ${goal}`;
  if (goal === "sales") return durationSeconds >= 30 ? "30s ad cut" : "15s ad cut";
  if (platform === "tiktok" || platform === "instagram") return "15s/30s social cuts";
  if (platform === "shorts") return "30s Shorts cut";
  return `${Math.max(15, Math.min(Math.round(durationSeconds), 45))}s creator cut`;
}

function transcriptToCaptions(transcript: TranscriptSegment[]): CaptionLine[] {
  return transcript.map((segment) => ({
    id: `cap-${segment.id}`,
    start: segment.start,
    end: segment.end,
    text: segment.text,
  }));
}

function planToCaptions(plan: EditPlan): CaptionLine[] {
  return plan.captions.map((caption, index) => ({
    id: `plan-cap-${index}`,
    start: caption.at,
    end: index < plan.captions.length - 1 ? plan.captions[index + 1].at : caption.at + 4,
    text: caption.text,
  }));
}

function createClientDemoTranscription(
  fileName: string,
  durationSeconds: number,
  languageMode: LanguageMode,
): AutoTranscribeResponse {
  const arabic = languageMode !== "english";
  const text = arabic
    ? `هذا كبشن تجريبي من ${fileName}. أضف مفتاح OpenAI في Vercel حتى يقرأ النظام صوت الفيديو الحقيقي ويولد الكابشن تلقائياً.`
    : `This is a demo caption for ${fileName}. Add the OpenAI key in Vercel so the system can read the real video audio.`;
  const transcript = roughClientTranscript(text, durationSeconds);

  return {
    mode: "demo",
    model: "missing-openai-key",
    text,
    transcript,
    captions: transcript.map((segment) => ({
      id: `cap-${segment.id}`,
      start: segment.start,
      end: segment.end,
      text: segment.text,
    })),
    srt: "",
  };
}

function roughClientTranscript(text: string, durationSeconds: number): TranscriptSegment[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunkSize = 9;
  const chunks: string[] = [];

  for (let index = 0; index < words.length; index += chunkSize) {
    chunks.push(words.slice(index, index + chunkSize).join(" "));
  }

  const duration = Math.max(6, durationSeconds);
  const segmentLength = duration / Math.max(1, chunks.length);

  return chunks.map((chunk, index) => ({
    id: `demo-tr-${index + 1}`,
    start: Number((index * segmentLength).toFixed(2)),
    end: Number(Math.min(duration, (index + 1) * segmentLength).toFixed(2)),
    speaker: "Speaker 1",
    text: chunk,
  }));
}

function getCaptionLineForTime(captions: CaptionLine[], time: number) {
  return captions.find((caption) => time >= caption.start && time <= caption.end) ?? null;
}

function getPreparedFileNotice(preparedFile: PreparedTranscriptionFile) {
  if (preparedFile.usedAudioExtraction) {
    return `${preparedFile.note} Original: ${formatBytes(preparedFile.originalSize)}, upload: ${formatBytes(preparedFile.file.size)}.`;
  }

  return preparedFile.note;
}

function createCaptionRenderPlan({
  captions,
  style,
  aspectRatio,
  brandName,
  durationSeconds,
}: {
  captions: CaptionLine[];
  style: VideoStyle;
  aspectRatio: AspectRatio;
  brandName: string;
  durationSeconds: number;
}): EditPlan | null {
  if (!captions.length) return null;

  const targetDurationSeconds = Math.max(
    4,
    Math.min(durationSeconds, Math.ceil(Math.max(...captions.map((caption) => caption.end)))),
  );

  return {
    id: `caption-render-${Date.now()}`,
    title: `${brandName || "Mawj Studio"} auto-caption render`,
    hook: captions[0]?.text ?? style.arabicName,
    summary: "Rendered from uploaded media with automatic captions.",
    targetDurationSeconds,
    styleId: style.id,
    confidence: 88,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: [
      {
        id: "caption-render",
        label: "Auto captions",
        start: 0,
        end: targetDurationSeconds,
        action: "Burn generated captions into the video export.",
        intensity: "medium",
      },
    ],
    captions: captions.map((caption) => ({
      at: caption.start,
      text: caption.text,
      emphasis: [],
    })),
    aiTools: [
      { name: "Automatic transcription", status: "ready", detail: "Video audio converted to editable captions." },
      { name: "Caption burn-in", status: "ready", detail: "Captions are rendered into the exported video." },
    ],
    exportVariants: [
      { platform: "MP4", duration: `${targetDurationSeconds}s`, caption: "Captioned social export." },
      { platform: "SRT", duration: `${targetDurationSeconds}s`, caption: "Editable subtitle file." },
      { platform: "Thumbnail", duration: "1 frame", caption: "Cover-ready still export." },
    ],
  };
}

function createTemplateCaptions(template: TemplatePreset, durationSeconds: number): CaptionLine[] {
  const targetDuration = Math.min(Math.max(18, durationSeconds), 45);
  const segmentDuration = targetDuration / template.captions.length;

  return template.captions.map((text, index) => ({
    id: `template-cap-${template.id}-${index}`,
    start: Number((index * segmentDuration).toFixed(2)),
    end: Number(Math.min(targetDuration, (index + 1) * segmentDuration).toFixed(2)),
    text,
  }));
}

function createTemplateEditPlan({
  template,
  brandName,
  durationSeconds,
}: {
  template: TemplatePreset;
  brandName: string;
  durationSeconds: number;
}): EditPlan {
  const targetDurationSeconds = Math.min(Math.max(18, Math.round(durationSeconds || 30)), 60);

  return {
    id: `template-plan-${template.id}-${Date.now()}`,
    title: `${template.name} · ${brandName || "Mawj Studio"}`,
    hook: template.hook,
    summary: `${template.description} Applied as a real timeline, caption, audio, and export preset.`,
    targetDurationSeconds,
    styleId: template.styleId,
    confidence: 90,
    renderSettings: {
      aspectRatio: template.aspectRatio,
      resolution: template.aspectRatio === "16:9" ? "1920x1080" : template.aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: template.timeline.map((item, index) => ({
      id: `template-step-${index}`,
      label: item.name,
      start: item.start,
      end: item.start + item.duration,
      action: `${item.name} using ${template.name}.`,
      intensity: index === 0 ? "high" : "medium",
    })),
    captions: createTemplateCaptions(template, targetDurationSeconds).map((caption) => ({
      at: caption.start,
      text: caption.text,
      emphasis: [],
    })),
    aiTools: [
      ...template.audioTools.map((tool) => ({
        name: tool,
        status: "ready" as const,
        detail: "Enabled by the selected template.",
      })),
      { name: "Template timeline", status: "ready", detail: "Overlay, caption, and effect layers were added to the project timeline." },
    ],
    exportVariants: [
      { platform: PLATFORM_LABELS[template.platform], duration: `${targetDurationSeconds}s`, caption: template.description },
      { platform: "MP4", duration: `${targetDurationSeconds}s`, caption: "Captioned edited export." },
      { platform: "SRT", duration: `${targetDurationSeconds}s`, caption: "Template captions as subtitle file." },
    ],
  };
}

function applyTemplateToTimeline(
  tracks: TimelineTrack[],
  template: TemplatePreset,
  durationSeconds: number,
): TimelineTrack[] {
  const templateDuration = Math.min(Math.max(18, durationSeconds), 60);

  return tracks.map((track) => {
    const generatedLayers = template.timeline
      .filter((item) => item.trackKind === track.kind)
      .map((item, index): TimelineLayer => ({
        id: `template-${template.id}-${track.kind}-${index}`,
        type: item.type,
        name: item.name,
        start: item.start,
        duration: Math.min(item.duration, Math.max(1, templateDuration - item.start)),
        color: item.color,
      }));

    const keptLayers = track.layers.filter((layer) => !isGeneratedEditingLayer(layer));

    if (track.kind === "caption") {
      return {
        ...track,
        layers: [
          ...keptLayers.filter((layer) => layer.id !== "caption-main"),
          {
            id: `template-${template.id}-caption-main`,
            type: "caption",
            name: `${template.captionTemplate} captions`,
            start: 0,
            duration: templateDuration,
            color: "#fb923c",
          },
          ...generatedLayers,
        ],
      };
    }

    return {
      ...track,
      layers: [...keptLayers, ...generatedLayers],
    };
  });
}

function toEnabledTools(tools: string[]) {
  return tools.reduce<Record<string, boolean>>((enabled, tool) => {
    enabled[tool] = true;
    return enabled;
  }, {});
}

function pickPrimaryAdVariant(campaign: AdCampaign) {
  return (
    campaign.variants.find((variant) => variant.id === "30s") ??
    campaign.variants.find((variant) => variant.id === "15s") ??
    campaign.variants[0] ??
    null
  );
}

function adVariantToCaptions(variant: AdVariant): CaptionLine[] {
  return variant.scenes.map((scene) => ({
    id: `ad-cap-${variant.id}-${scene.id}`,
    start: scene.start,
    end: scene.end,
    text: scene.caption,
  }));
}

function applyAdVariantToTimeline(tracks: TimelineTrack[], variant: AdVariant): TimelineTrack[] {
  return tracks.map((track) => {
    const keptLayers = track.layers.filter((layer) => !isGeneratedEditingLayer(layer));

    if (track.kind === "overlay") {
      return {
        ...track,
        layers: [
          ...keptLayers,
          ...variant.scenes.map((scene, index): TimelineLayer => ({
            id: `ad-scene-overlay-${variant.id}-${scene.id}`,
            type: "text",
            name: scene.overlay || `Ad scene ${index + 1}`,
            start: scene.start,
            duration: Math.max(1, scene.end - scene.start),
            color: index % 2 === 0 ? "#facc15" : "#8ef7c2",
          })),
        ],
      };
    }

    if (track.kind === "caption") {
      return {
        ...track,
        layers: [
          ...keptLayers.filter((layer) => layer.id !== "caption-main"),
          {
            id: `ad-scene-captions-${variant.id}`,
            type: "caption",
            name: `${variant.id} AI ad captions`,
            start: 0,
            duration: variant.durationSeconds,
            color: "#fb923c",
          },
        ],
      };
    }

    if (track.kind === "effects") {
      return {
        ...track,
        layers: [
          ...keptLayers,
          ...variant.scenes.map((scene, index): TimelineLayer => ({
            id: `ad-scene-effect-${variant.id}-${scene.id}`,
            type: "effect",
            name: scene.shotType || `Scene ${index + 1} pacing`,
            start: scene.start,
            duration: Math.max(1, scene.end - scene.start),
            color: index % 2 === 0 ? "#36d399" : "#a78bfa",
          })),
        ],
      };
    }

    return { ...track, layers: keptLayers };
  });
}

function createAdCampaignEditPlan({
  campaign,
  variant,
  brandName,
  aspectRatio,
}: {
  campaign: AdCampaign;
  variant: AdVariant;
  brandName: string;
  aspectRatio: AspectRatio;
}): EditPlan {
  return {
    id: `ad-plan-${Date.now()}`,
    title: `${campaign.title} · ${variant.id}`,
    hook: variant.hook || campaign.primaryHook,
    summary: campaign.strategy,
    targetDurationSeconds: variant.durationSeconds,
    styleId: "product-drop",
    confidence: 93,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: variant.scenes.map((scene, index) => ({
      id: scene.id || `scene-${index + 1}`,
      label: scene.overlay || `Scene ${index + 1}`,
      start: scene.start,
      end: scene.end,
      action: `${scene.visual} Voiceover: ${scene.voiceover}`,
      intensity: index === 0 ? "high" : "medium",
    })),
    captions: variant.scenes.map((scene) => ({
      at: scene.start,
      text: scene.caption,
      emphasis: [],
    })),
    aiTools: [
      { name: "AI Ad Maker", status: "ready", detail: `${brandName || "Mawj Studio"} campaign generated from product brief.` },
      { name: "Scene builder", status: "ready", detail: `${variant.scenes.length} timestamped scenes applied to the timeline.` },
      { name: "Caption writer", status: "ready", detail: "Arabic-first ad captions are ready for burn-in and SRT export." },
      { name: "Platform packaging", status: "ready", detail: campaign.platformNotes.join(" ") },
    ],
    exportVariants: campaign.variants.map((item) => ({
      platform: item.id,
      duration: `${item.durationSeconds}s`,
      caption: item.hook,
    })),
  };
}

function formatAdCampaign(campaign: AdCampaign) {
  const variants = campaign.variants
    .map((variant) => {
      const scenes = variant.scenes
        .map((scene) => `${formatDuration(scene.start)}-${formatDuration(scene.end)} ${scene.overlay}: ${scene.caption}`)
        .join("\n");

      return `${variant.id} · ${variant.hook}\n${variant.script}\nCTA: ${variant.cta}\n${scenes}`;
    })
    .join("\n\n");

  return [
    campaign.title,
    campaign.strategy,
    `Audience: ${campaign.targetAudience}`,
    `Hook: ${campaign.primaryHook}`,
    `CTA: ${campaign.cta}`,
    `Hashtags: ${campaign.hashtags.join(" ")}`,
    variants,
  ].join("\n\n");
}

function isGeneratedEditingLayer(layer: TimelineLayer) {
  return layer.id.startsWith("template-") || layer.id.startsWith("ad-scene-");
}

function cleanOpenAIError(message: string) {
  try {
    const parsed = JSON.parse(message) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // Keep the original message when it is not JSON.
  }

  return message.replace(/sk-[A-Za-z0-9_-]+/g, "sk-***");
}

function templateTimelineToEditorTracks(templateTracks: TemplateTimelineTrack[]): TimelineTrack[] {
  return templateTracks.map((track) => ({
    id: track.id,
    name: track.name,
    kind: mapTemplateTrackKind(track.kind),
    layers: track.layers.map((layer): TimelineLayer => ({
      id: layer.id,
      type: mapTemplateLayerType(layer.type),
      name: layer.content || layer.name || layer.id,
      start: layer.absoluteStart,
      duration: layer.duration,
      color: normalizeHexColor(layer.color ?? layer.backgroundColor ?? colorForTemplateLayer(layer.type)),
      content: layer.content,
      src: layer.src,
      sceneId: layer.sceneId,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      textColor: layer.color,
      backgroundColor: layer.backgroundColor,
      borderRadius: layer.borderRadius,
      opacity: layer.opacity,
    })),
  }));
}

function toTemplateTimelinePatch(patch: Partial<TimelineLayer>): Partial<TemplateTimelineTrack["layers"][number]> {
  const nextPatch: Partial<TemplateTimelineTrack["layers"][number]> = {
    name: patch.name,
    content: patch.content,
    src: patch.src,
    start: patch.start,
    duration: patch.duration,
    color: patch.color ?? patch.textColor,
    backgroundColor: patch.backgroundColor,
    x: patch.x,
    y: patch.y,
    width: patch.width,
    height: patch.height,
    fontSize: patch.fontSize,
    fontWeight: patch.fontWeight,
    borderRadius: patch.borderRadius,
    opacity: patch.opacity,
  };

  return Object.fromEntries(
    Object.entries(nextPatch).filter(([, value]) => value !== undefined),
  ) as Partial<TemplateTimelineTrack["layers"][number]>;
}

function templateProjectToCaptions(project: TemplateProject): CaptionLine[] {
  const captionLayers = project.timeline
    .flatMap((track) => track.layers)
    .filter((layer) => layer.type === "captions" || layer.type === "text")
    .slice(0, 8);

  if (!captionLayers.length) {
    return [
      {
        id: `template-caption-${project.id}`,
        start: 0,
        end: Math.min(project.duration, 4),
        text: project.name,
      },
    ];
  }

  return captionLayers.map((layer, index) => ({
    id: `template-caption-${layer.id}`,
    start: layer.absoluteStart,
    end: Math.min(project.duration, layer.absoluteStart + layer.duration),
    text: layer.content || layer.name || `Template layer ${index + 1}`,
  }));
}

function templateProjectToEditPlan(project: TemplateProject): EditPlan {
  return {
    id: `template-edit-${project.id}`,
    title: project.name,
    hook: project.scenes[0]?.name ?? project.name,
    summary: "Editable JSON video template converted into a Mawj Studio timeline project.",
    targetDurationSeconds: project.duration,
    styleId: "viral-saudi",
    confidence: 96,
    renderSettings: {
      aspectRatio: project.aspectRatio === "4:5" ? "9:16" : project.aspectRatio,
      resolution: `${project.width}x${project.height}`,
      fps: project.export.fps,
      loudness: "-14 LUFS",
      safeMargins: "Template safe margins",
    },
    timeline: project.scenes.map((scene) => ({
      id: scene.id,
      label: scene.name,
      start: scene.start,
      end: scene.start + scene.duration,
      action: `${scene.layers.length} editable layers from template JSON.`,
      intensity: "medium",
    })),
    captions: templateProjectToCaptions(project).map((caption) => ({
      at: caption.start,
      text: caption.text,
      emphasis: [],
    })),
    aiTools: [
      { name: "Template engine", status: "ready", detail: "Hydrated JSON placeholders into editable timeline layers." },
      { name: "Layer inspector", status: "ready", detail: "Text, media, timing, color, and geometry can be adjusted manually." },
      { name: "Template renderer", status: "ready", detail: "Canvas renderer exports template projects from scenes and layers." },
    ],
    exportVariants: [
      { platform: "MP4", duration: `${project.duration}s`, caption: "Template video export." },
      { platform: "SRT", duration: `${project.duration}s`, caption: "Caption export from template text layers." },
      { platform: "Thumbnail", duration: "1 frame", caption: "Template preview still." },
    ],
  };
}

function mapTemplateTrackKind(kind: TemplateTimelineTrack["kind"]): TimelineTrack["kind"] {
  if (kind === "text" || kind === "image") return "overlay";
  if (kind === "captions") return "caption";
  if (kind === "background" || kind === "shape" || kind === "scenes" || kind === "waveform") return "effects";
  return kind;
}

function mapTemplateLayerType(type: TemplateTimelineTrack["layers"][number]["type"]): TimelineLayer["type"] {
  if (type === "captions") return "caption";
  if (type === "background") return "background";
  if (type === "shape") return "shape";
  if (type === "waveform") return "waveform";
  if (type === "audio") return "audio";
  if (type === "video") return "video";
  if (type === "image") return "image";
  return "text";
}

function colorForTemplateLayer(type: TemplateTimelineTrack["layers"][number]["type"]) {
  const colors: Record<TemplateTimelineTrack["layers"][number]["type"], string> = {
    text: "#facc15",
    image: "#c084fc",
    video: "#8ef7c2",
    shape: "#a78bfa",
    captions: "#fb923c",
    audio: "#7dd3fc",
    background: "#64748b",
    waveform: "#36d399",
  };

  return colors[type];
}

function normalizeHexColor(value?: string) {
  if (!value || value.includes("{{") || !/^#[0-9a-f]{6}$/i.test(value)) return "#8ef7c2";
  return value;
}

function getAssetKind(file: File): MediaAsset["kind"] {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "video";
}

function mediaAssetToBridgeAsset(asset: MediaAsset): MediaAssetInput {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    kind: asset.kind,
    size: asset.size,
    mimeType: asset.file.type,
    duration: asset.durationSeconds,
  };
}

function storedMediaRecordToAsset(record: StoredMediaRecord): MediaAsset {
  return {
    id: record.id,
    name: record.name,
    file: new File([record.blob], record.name, { type: record.mimeType }),
    url: URL.createObjectURL(record.blob),
    kind: record.type,
    size: record.size,
    durationSeconds: record.durationSeconds,
    width: record.width,
    height: record.height,
    persisted: true,
  };
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function secondsToSrt(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${rest
    .toString()
    .padStart(2, "0")},${millis.toString().padStart(3, "0")}`;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
