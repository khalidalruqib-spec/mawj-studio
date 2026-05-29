import {
  BadgeCheck,
  BadgeDollarSign,
  Brain,
  Captions,
  Clapperboard,
  Crown,
  Crop,
  ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  ListVideo,
  MessagesSquare,
  Mic2,
  MonitorUp,
  Palette,
  Replace,
  Scissors,
  ShieldCheck,
  Sparkles,
  Users,
  Volume2,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { StudioProject } from "@/lib/project-store";
import type { AspectRatio, Platform, VideoStyleId } from "@/lib/video-styles";
import type { AdCampaign } from "@/lib/ad-maker";
import type { AICommandAction } from "@/lib/ai-command";

export type Goal = "engagement" | "sales" | "education" | "awareness";
export type PanelId =
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
  | "exports"
  | "stock";

export type MediaAsset = {
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

export type ClipSuggestion = {
  id: string;
  label: string;
  start: number;
  end: number;
  duration: number;
  transcript: TranscriptSegment[];
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AICommandAction[];
  timestamp: number;
};

export type AIEngineState = {
  engine: string;
  confidence: number;
  targetCut: string;
  mode: string;
};

export type StudioFile = {
  file: File;
  url: string;
  durationSeconds: number;
};

export type TimelineLayer = {
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
  rotation?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
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
  opacity?: number;
  fit?: "cover" | "contain" | "fill";
  locked?: boolean;
  hidden?: boolean;
};

export type TimelineTrack = {
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

export type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  speaker: string;
  text: string;
  deleted?: boolean;
};

export type CaptionLine = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type BrandKitState = {
  logoName: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  captionStyle: string;
  intro: string;
  outro: string;
};

export type TemplatePreset = {
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

export type AiToolCategory = "create" | "captions" | "cleanup" | "clips" | "visual" | "business";

export type AiToolItem = {
  id: string;
  title: string;
  subtitle: string;
  category: AiToolCategory;
  badge: string;
  icon: LucideIcon;
  command?: string;
  actionId?: string;
  openPanel?: PanelId;
  needsMedia?: boolean;
};

export type UploadUrlResponse = {
  mode: "supabase" | "local-preview";
  bucket: string;
  path: string;
  token: string | null;
  project: StudioProject;
  error?: string;
};

export type TranscriptionMode = "python" | "openai" | "demo";

export type AutoTranscribeResponse = {
  mode: TranscriptionMode;
  model: string;
  text: string;
  transcript: TranscriptSegment[];
  captions: CaptionLine[];
  srt: string;
  error?: string;
};

export type TranscribeStatusResponse = {
  configured: boolean;
  provider?: "python-fastapi" | "openai" | "demo";
  model: string;
  directUploadLimitBytes: number;
  maxClientAudioSeconds: number;
};

export type AdMakerResponse = {
  campaign?: AdCampaign;
  model?: string;
  error?: string;
};

export const GOAL_LABELS: Record<Goal, string> = {
  engagement: "Engagement / تفاعل",
  sales: "Sales / مبيعات",
  education: "Education / تعليم",
  awareness: "Awareness / وعي",
};

export const PANELS: Array<{ id: PanelId; label: string; description: string; icon: LucideIcon }> = [
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
  { id: "stock", label: "Stock", description: "Photos/Videos", icon: ImageIcon },
];

export const CREATOR_STARTERS = [
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

export const AI_TOOL_CATEGORIES: Array<{ id: "all" | AiToolCategory; label: string; icon: LucideIcon }> = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "create", label: "Create", icon: WandSparkles },
  { id: "captions", label: "Captions", icon: Captions },
  { id: "cleanup", label: "Clean", icon: ShieldCheck },
  { id: "clips", label: "Clips", icon: Scissors },
  { id: "visual", label: "Visual", icon: Replace },
  { id: "business", label: "Business", icon: BadgeDollarSign },
];

export const AI_TOOLS: AiToolItem[] = [
  {
    id: "idea-to-video",
    title: "Idea to video",
    subtitle: "Prompt, hook, scenes, captions",
    category: "create",
    badge: "Agent",
    icon: Brain,
    command: "حوّل الفكرة الحالية إلى فيديو قصير للتيك توك مع هوك عربي وكابشن وخطة مشاهد",
  },
  {
    id: "auto-captions",
    title: "Auto subtitles",
    subtitle: "Arabic / English captions",
    category: "captions",
    badge: "STT",
    icon: Captions,
    command: "أضف كابشن عربي للفيديو مع أسلوب تيك توك واضح",
    openPanel: "captions",
    needsMedia: true,
  },
  {
    id: "dynamic-captions",
    title: "Dynamic captions",
    subtitle: "Karaoke, highlights, SRT",
    category: "captions",
    badge: "RTL",
    icon: MessagesSquare,
    openPanel: "captions",
  },
  {
    id: "edit-by-script",
    title: "Edit by transcript",
    subtitle: "Delete words, fillers, pauses",
    category: "cleanup",
    badge: "Text",
    icon: Mic2,
    command: "افتح تحرير الفيديو بالنص واحذف الحشو والسكتات الطويلة",
    openPanel: "transcript",
    needsMedia: true,
  },
  {
    id: "clean-audio",
    title: "Clean audio",
    subtitle: "Noise, echo, volume leveling",
    category: "cleanup",
    badge: "Voice",
    icon: Volume2,
    command: "حسن الصوت وأزل الضوضاء واضبط مستوى الصوت",
    openPanel: "audio",
    needsMedia: true,
  },
  {
    id: "remove-silence",
    title: "Remove silence",
    subtitle: "Tight pacing for shorts",
    category: "cleanup",
    badge: "Fast",
    icon: Scissors,
    command: "احذف كل فترات الصمت الطويلة ورتب الإيقاع للمقطع",
    actionId: "moments",
    openPanel: "transcript",
    needsMedia: true,
  },
  {
    id: "magic-clips",
    title: "AI clips",
    subtitle: "15s, 30s, 60s versions",
    category: "clips",
    badge: "Social",
    icon: ListVideo,
    command: "استخرج أفضل 5 لحظات وأنشئ نسخ 15 ثانية و30 ثانية و60 ثانية",
    actionId: "shorts",
    needsMedia: true,
  },
  {
    id: "social-resize",
    title: "Resize for social",
    subtitle: "TikTok, Reels, Shorts",
    category: "clips",
    badge: "9:16",
    icon: Crop,
    command: "حوّل المشروع إلى مقاس تيك توك 9:16 مع كابشن آمن عن الحواف",
  },
  {
    id: "remove-background",
    title: "Remove background",
    subtitle: "Blur, studio, office, color",
    category: "visual",
    badge: "AI",
    icon: Replace,
    command: "أزل خلفية الفيديو واستبدلها بخلفية ستوديو نظيفة",
    openPanel: "background",
    needsMedia: true,
  },
  {
    id: "titles-and-hashtags",
    title: "Titles + hashtags",
    subtitle: "Hooks, captions, CTA",
    category: "create",
    badge: "Copy",
    icon: WandSparkles,
    actionId: "titles",
  },
  {
    id: "video-summary",
    title: "Content brief",
    subtitle: "Summary and best angle",
    category: "create",
    badge: "Brief",
    icon: BadgeCheck,
    actionId: "summary",
  },
  {
    id: "ad-maker",
    title: "AI ad maker",
    subtitle: "Product ad, CTA, 3 lengths",
    category: "business",
    badge: "Ads",
    icon: BadgeDollarSign,
    command: "أنشئ نسخة إعلانية للمنتج مع هوك وCTA وكابشن عربي",
    openPanel: "ad-maker",
  },
  {
    id: "brand-kit",
    title: "Brand kit",
    subtitle: "Logo, colors, fonts, style",
    category: "business",
    badge: "Brand",
    icon: Palette,
    openPanel: "brand",
  },
];

export const SAMPLE_TRANSCRIPT: TranscriptSegment[] = [
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

export const TEMPLATE_PRESETS: TemplatePreset[] = [
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

export const CAPTION_TEMPLATES = [
  "Saudi Viral Bold",
  "Luxury Minimal",
  "Podcast Clean",
  "Karaoke Yellow",
  "Educational Cards",
];

export const BACKGROUND_OPTIONS = [
  "Transparent cutout",
  "Blur original video",
  "Studio gradient",
  "Podcast room",
  "Office background",
  "Classroom board",
  "Brand color",
];

export const AUDIO_TOOLS = [
  "Noise reduction",
  "Voice enhancement",
  "Echo reduction",
  "Auto volume leveling",
  "Silence removal",
];

export const MUSIC_LIBRARY = ["Energetic beat", "Luxury cinematic", "Podcast bed", "Corporate clean"];
export const SOUND_EFFECTS = ["Whoosh", "Pop", "Camera snap", "Cash register", "Soft hit"];

export const EXPORT_TIERS = [
  { name: "Free", quality: "720p", watermark: "Mawj watermark", price: "$0" },
  { name: "Creator", quality: "1080p", watermark: "No watermark", price: "$19/mo" },
  { name: "Pro", quality: "4K", watermark: "No watermark + team", price: "$49/mo" },
];

export const TEAM_ROLES = [
  { name: "Khalid", role: "Owner", access: "Full billing and export access" },
  { name: "Editor", role: "Editor", access: "Timeline, media, exports" },
  { name: "Client", role: "Client", access: "Preview links and comments" },
  { name: "Viewer", role: "Viewer", access: "Read-only project access" },
];

export const VERSION_HISTORY = [
  "v1 Raw upload",
  "v2 Captions and jump cuts",
  "v3 Brand kit applied",
  "v4 Client review link",
];
