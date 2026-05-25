"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BadgeDollarSign,
  Bot,
  Brain,
  Building2,
  Captions,
  Clapperboard,
  Clock3,
  Cloud,
  Command,
  CreditCard,
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
  PlaySquare,
  Plus,
  Redo2,
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
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";
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
};

type StudioFile = {
  file: File;
  url: string;
  durationSeconds: number;
};

type TimelineLayer = {
  id: string;
  type: "video" | "audio" | "text" | "image" | "caption" | "effect";
  name: string;
  start: number;
  duration: number;
  color: string;
  muted?: boolean;
};

type TimelineTrack = {
  id: string;
  name: string;
  kind: "video" | "audio" | "overlay" | "caption" | "effects";
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

const TEMPLATE_GROUPS = [
  { name: "TikTok", count: 18, icon: Zap, tone: "Fast hooks, jump cuts, karaoke captions" },
  { name: "Instagram Reels", count: 16, icon: PlaySquare, tone: "Polished social edits and covers" },
  { name: "YouTube Shorts", count: 14, icon: ListVideo, tone: "Retention-first educational shorts" },
  { name: "Product Ads", count: 22, icon: BadgeDollarSign, tone: "Hook, problem, product, CTA" },
  { name: "Podcast", count: 12, icon: Mic2, tone: "Clean cuts, quote cards, captions" },
  { name: "Educational", count: 15, icon: Brain, tone: "Chapters, callouts, summary cards" },
  { name: "Lecture", count: 9, icon: Command, tone: "Readable notes and topic splits" },
  { name: "News", count: 8, icon: Activity, tone: "Lower thirds and fast context" },
  { name: "Real Estate", count: 11, icon: Building2, tone: "Walkthroughs, area labels, pricing" },
  { name: "Restaurant", count: 13, icon: Sparkles, tone: "Food closeups, menu labels, offers" },
  { name: "Legal / Business", count: 10, icon: ShieldCheck, tone: "Formal captions and trust cues" },
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
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [recentProjects, setRecentProjects] = useState<StudioProject[]>([]);
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>(() => createDefaultTimeline());
  const [timelineUndo, setTimelineUndo] = useState<TimelineTrack[][]>([]);
  const [timelineRedo, setTimelineRedo] = useState<TimelineTrack[][]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("clip-main");
  const [timelineZoom, setTimelineZoom] = useState(1);
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
  const [adTone, setAdTone] = useState("luxury");
  const [adOutput, setAdOutput] = useState("");
  const [assistantCommand, setAssistantCommand] = useState("");
  const [assistantMessages, setAssistantMessages] = useState([
    "Ready. Try: Add Arabic captions, Remove silence, Extract best 5 clips, or Create an ad version.",
  ]);
  const [exportTier, setExportTier] = useState("Creator");
  const [exportFormat, setExportFormat] = useState("MP4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<"openai" | "demo" | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [renderProgress, setRenderProgress] = useState<BrowserRenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<BrowserRenderResult | null>(null);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("Autosave ready");

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

  useEffect(() => {
    return () => {
      if (renderResult?.url) URL.revokeObjectURL(renderResult.url);
    };
  }, [renderResult?.url]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const snapshot = {
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
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem("mawj-studio-autosave", JSON.stringify(snapshot));
  }, [
    aspectRatio,
    brandKit,
    brandName,
    captions,
    goal,
    languageMode,
    platform,
    styleId,
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

  function clearRenderedOutput() {
    setRenderResult(null);
    setRenderProgress(null);
  }

  function commitTimeline(nextTracks: TimelineTrack[] | ((current: TimelineTrack[]) => TimelineTrack[])) {
    const resolvedTracks = typeof nextTracks === "function" ? nextTracks(timelineTracks) : nextTracks;
    setTimelineUndo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineRedo([]);
    setTimelineTracks(resolvedTracks);
    clearRenderedOutput();
    setProjectStatus("Autosaved timeline changes");
  }

  function undoTimeline() {
    const [previous, ...rest] = timelineUndo;
    if (!previous) return;
    setTimelineRedo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineUndo(rest);
    setTimelineTracks(previous);
    setProjectStatus("Undo applied");
  }

  function redoTimeline() {
    const [next, ...rest] = timelineRedo;
    if (!next) return;
    setTimelineUndo((history) => [timelineTracks, ...history].slice(0, 25));
    setTimelineRedo(rest);
    setTimelineTracks(next);
    setProjectStatus("Redo applied");
  }

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

    setMediaAssets((assets) => [...incomingAssets, ...assets]);

    const firstVideoAsset = incomingAssets.find((asset) => asset.kind === "video") ?? null;

    if (firstVideoAsset) {
      setStudioFile({ file: firstVideoAsset.file, url: firstVideoAsset.url, durationSeconds: 60 });
      setActiveProject(null);
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

  function selectVideoAssetAsSource(asset: MediaAsset) {
    if (asset.kind !== "video") return;
    setStudioFile({ file: asset.file, url: asset.url, durationSeconds: 60 });
    setActiveProject(null);
    setPlan(null);
    setPreviewTime(0);
    clearRenderedOutput();
    commitTimeline((tracks) => syncPrimaryVideoDuration(tracks, asset.name, 60));
    setProjectStatus(`${asset.name} is now the preview source`);
  }

  async function transcribeVideo(asset?: MediaAsset) {
    const targetFile = asset?.file ?? studioFile?.file;
    const targetDuration = asset ? 60 : studioFile?.durationSeconds ?? 60;

    if (!targetFile || (!targetFile.type.startsWith("video/") && !targetFile.type.startsWith("audio/"))) {
      setError("Upload a video or audio file first.");
      return;
    }

    setIsTranscribing(true);
    setError("");
    setProjectStatus("Reading video audio and generating captions...");

    try {
      const formData = new FormData();
      formData.append("file", targetFile, targetFile.name);
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

      setTranscript(data.transcript);
      setCaptions(data.captions);
      setTranscriptionMode(data.mode);
      setActivePanel("captions");
      clearRenderedOutput();
      commitTimeline((tracks) => ensureCaptionLayer(tracks, data.captions, targetDuration));
      setProjectStatus(
        data.mode === "openai"
          ? `Auto captions ready with ${data.model}`
          : "Demo captions ready. Add OPENAI_API_KEY for real video transcription.",
      );
      setAssistantMessages((messages) => [
        data.mode === "openai"
          ? `Auto-caption complete: ${data.captions.length} caption lines generated from the video audio.`
          : "Demo captions generated. Add OPENAI_API_KEY on Vercel for real audio transcription.",
        ...messages,
      ]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not transcribe this file.");
    } finally {
      setIsTranscribing(false);
    }
  }

  async function generatePlan() {
    if (!studioFile) {
      setError("Upload a source video first.");
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
        `Generated: ${data.plan.title}. Suggested ${data.plan.targetDurationSeconds}s output.`,
        ...messages,
      ]);
      if (data.project) setActiveProject(data.project);
      await loadProjects();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected AI planning error.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function ensureProjectUploaded() {
    if (!studioFile) throw new Error("Upload a source video first.");
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

  async function renderVideo() {
    if (!studioFile) {
      setError("Upload a source video first.");
      return;
    }

    const renderPlan =
      plan ??
      createCaptionRenderPlan({
        captions,
        style: activeStyle,
        aspectRatio,
        brandName,
        durationSeconds: studioFile.durationSeconds,
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

  function mergeVideoLayers() {
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
        savedAt: new Date().toISOString(),
      }),
    );
    setProjectStatus("Project snapshot saved locally");
  }

  function loadProjectSnapshot() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("mawj-studio-manual-save");
    if (!raw) {
      setProjectStatus("No local snapshot found");
      return;
    }

    const snapshot = JSON.parse(raw) as {
      brandName?: string;
      styleId?: VideoStyleId;
      platform?: Platform;
      aspectRatio?: AspectRatio;
      timelineTracks?: TimelineTrack[];
      transcript?: TranscriptSegment[];
      captions?: CaptionLine[];
      brandKit?: BrandKitState;
    };
    if (snapshot.brandName) setBrandName(snapshot.brandName);
    if (snapshot.styleId) setStyleId(snapshot.styleId);
    if (snapshot.platform) setPlatform(snapshot.platform);
    if (snapshot.aspectRatio) setAspectRatio(snapshot.aspectRatio);
    if (snapshot.timelineTracks) setTimelineTracks(snapshot.timelineTracks);
    if (snapshot.transcript) setTranscript(snapshot.transcript);
    if (snapshot.captions) setCaptions(snapshot.captions);
    if (snapshot.brandKit) setBrandKit(snapshot.brandKit);
    setProjectStatus("Local project snapshot loaded");
  }

  function generateAdVersion() {
    const hook = adTone === "funny" ? "Wait... this actually works." : `Make ${adProductName} look impossible to ignore.`;
    setAdOutput(
      `${hook}\n15s: Problem -> Product closeup -> CTA.\n30s: Hook -> 3 benefits -> proof -> CTA.\n60s: Story -> demonstration -> offer -> CTA.\nCaption: ${adProductName} جاهز يغيّر طريقتك.\nHashtags: #اعلان #تيك_توك #ريلز #MawjStudio`,
    );
    setProjectStatus("AI ad versions generated");
  }

  function runAssistantCommand() {
    const command = assistantCommand.trim();
    if (!command) return;

    const normalized = command.toLowerCase();
    let response = "Done. I prepared the editor for that command.";

    if (normalized.includes("tiktok")) {
      setPlatform("tiktok");
      setAspectRatio("9:16");
      setStyleId("viral-saudi");
      setActivePanel("editor");
      response = "Set the project to TikTok 9:16 with a fast viral Saudi pacing preset.";
    } else if (normalized.includes("arabic") || normalized.includes("captions")) {
      void transcribeVideo();
      response = "I started reading the video audio and will generate editable Arabic captions.";
    } else if (normalized.includes("silence")) {
      removeLongPauses();
      response = "Marked long pauses on the effects track for automatic removal.";
    } else if (normalized.includes("best") || normalized.includes("clips")) {
      setActivePanel("ai");
      response = "Prepared highlight extraction and 15s, 30s, 60s clip versions.";
    } else if (normalized.includes("audio")) {
      setActivePanel("audio");
      setActiveAudioTools((tools) => ({
        ...tools,
        "Noise reduction": true,
        "Voice enhancement": true,
        "Auto volume leveling": true,
      }));
      response = "Enabled noise reduction, voice enhancement, and auto volume leveling.";
    } else if (normalized.includes("background")) {
      setActivePanel("background");
      setBackgroundMode("Studio gradient");
      response = "Background remover is set to replace the original with a studio background.";
    } else if (normalized.includes("ad")) {
      setActivePanel("ad-maker");
      generateAdVersion();
      response = "Generated ad hooks, script structure, captions, CTA, and three durations.";
    } else if (normalized.includes("professional")) {
      setStyleId("premium-brand");
      setCaptionTemplate("Luxury Minimal");
      setActivePanel("brand");
      response = "Applied a premium brand preset with cleaner captions and a cinematic direction.";
    }

    setAssistantMessages((messages) => [`You: ${command}`, response, ...messages].slice(0, 8));
    setAssistantCommand("");
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
            <StatusPill label="Upload" active={Boolean(studioFile)} />
            <StatusPill label="Timeline" active={timelineTracks.some((track) => track.layers.length)} />
            <StatusPill label="AI" active={Boolean(plan)} />
            <StatusPill label="Render" active={Boolean(renderResult)} />
          </div>

          <div className="flex items-center gap-2">
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
              disabled={!studioFile || isRendering || isGenerating || isUploading}
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
                      <p className="text-[11px] font-semibold text-[var(--muted)]">{asset.kind} · {formatBytes(asset.size)}</p>
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
                  </div>
                </div>
              ))}
              {!mediaAssets.length ? <p className="text-xs font-semibold text-[var(--muted)]">No uploaded assets yet.</p> : null}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          {activePanel === "dashboard" ? (
            <DashboardPanel projects={recentProjects} projectStatus={projectStatus} />
          ) : activePanel === "templates" ? (
            <TemplatesPanel onApply={(name) => setProjectStatus(`${name} template applied`)} />
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
                      onChange={(event) => setTimelineZoom(Number(event.target.value))}
                      className="w-28 accent-[var(--brand)]"
                      aria-label="Timeline zoom"
                    />
                    {Math.round(timelineZoom * 100)}%
                  </div>
                </div>

                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                  <VideoPreview
                    studioFile={studioFile}
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
                    onTimeUpdate={() => setPreviewTime(videoRef.current?.currentTime ?? 0)}
                    onEnded={() => setIsPlaying(false)}
                    onTogglePlayback={togglePlayback}
                  />
                  <ProjectMetrics
                    plan={plan}
                    activeStyle={activeStyle}
                    activePanel={activePanel}
                    projectStatus={projectStatus}
                    studioFile={studioFile}
                  />
                </div>
              </section>

              <TimelineEditor
                tracks={timelineTracks}
                selectedLayerId={selectedLayerId}
                zoom={timelineZoom}
                totalSeconds={totalTimelineSeconds}
                onSelectLayer={setSelectedLayerId}
              />
            </>
          )}
        </section>

        <aside className="space-y-4">
          <AssistantPanel
            command={assistantCommand}
            messages={assistantMessages}
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
          onProductNameChange={setAdProductName}
          onToneChange={setAdTone}
          onGenerate={generateAdVersion}
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
        "Titles: لا تفوّت أول 3 ثواني | From raw footage to pro ad | Save this editing trick",
        "Hashtags: #صناعة_المحتوى #مونتاج #ريلز #تيك_توك",
        ...messages,
      ]);
    }

    if (actionId === "summary") {
      setAssistantMessages((messages) => [
        "Summary: The strongest angle is a fast before/after transformation with Arabic captions and a direct CTA.",
        ...messages,
      ]);
    }

    if (actionId === "moments") {
      setAssistantMessages((messages) => [
        "Best moments: 0-3s hook, 9-16s value proof, 18-23s CTA. Suggested for TikTok/Reels/Shorts.",
        ...messages,
      ]);
    }
  }
}

function VideoPreview({
  studioFile,
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
}: {
  studioFile: StudioFile | null;
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
      ) : (
        <div className="grid place-items-center px-6 text-center">
          <div className="space-y-4">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white/8 text-[var(--brand)]">
              <Film className="h-8 w-8" aria-hidden="true" />
            </span>
            <div>
              <p className="text-2xl font-black">Upload raw footage</p>
              <p className="mt-2 text-sm font-semibold text-white/55">
                Build clips, captions, ads, background edits, and branded exports.
              </p>
            </div>
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
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
          <h2 className="text-sm font-black">Multi-track timeline</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <Clock3 className="h-4 w-4" aria-hidden="true" />
          {formatDuration(totalSeconds)}
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="min-w-[780px] space-y-2" style={{ width: `${Math.max(780, totalSeconds * 18 * zoom)}px` }}>
          <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3 text-[11px] font-black text-[var(--muted)]">
            <span>Track</span>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.ceil(totalSeconds / 5)}, minmax(42px, 1fr))` }}>
              {Array.from({ length: Math.ceil(totalSeconds / 5) }, (_, index) => (
                <span key={index}>{index * 5}s</span>
              ))}
            </div>
          </div>

          {tracks.map((track) => (
            <div key={track.id} className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
              <div className="flex min-h-14 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3">
                <TrackIcon kind={track.kind} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{track.name}</p>
                  <p className="text-[11px] font-semibold text-[var(--muted)]">{track.layers.length} layers</p>
                </div>
              </div>
              <div className="relative min-h-14 rounded-lg border border-[var(--line)] bg-black/20">
                {track.layers.map((layer) => {
                  const left = (layer.start / totalSeconds) * 100;
                  const width = Math.max(4, (layer.duration / totalSeconds) * 100);
                  const selected = selectedLayerId === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => onSelectLayer(layer.id)}
                      className={`absolute top-2 flex h-10 min-w-12 items-center justify-center overflow-hidden rounded-md border px-2 text-xs font-black transition ${
                        selected ? "border-white shadow-[0_0_0_2px_rgba(142,247,194,0.35)]" : "border-white/10"
                      }`}
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: layer.color }}
                    >
                      <span className="truncate text-black">{layer.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectMetrics({
  plan,
  activeStyle,
  activePanel,
  projectStatus,
  studioFile,
}: {
  plan: EditPlan | null;
  activeStyle: VideoStyle;
  activePanel: PanelId;
  projectStatus: string;
  studioFile: StudioFile | null;
}) {
  return (
    <div className="space-y-3">
      <Metric label="Mode" value={activePanel} icon={Command} />
      <Metric label="AI confidence" value={plan ? `${plan.confidence}%` : "--"} icon={Gauge} />
      <Metric label="Target cut" value={plan ? `${plan.targetDurationSeconds}s` : studioFile ? formatDuration(studioFile.durationSeconds) : "--"} icon={Clock3} />
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

function TemplatesPanel({ onApply }: { onApply: (name: string) => void }) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <PanelHeading icon={LayoutTemplate} title="Template library" />
        <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand)]">
          Social-first
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_GROUPS.map((template) => {
          const Icon = template.icon;
          return (
            <button
              key={template.name}
              type="button"
              onClick={() => onApply(template.name)}
              className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-4 text-left transition hover:border-[var(--brand)]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{template.count}</span>
              </div>
              <p className="text-base font-black">{template.name}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">{template.tone}</p>
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
  onProductNameChange,
  onToneChange,
  onGenerate,
}: {
  productName: string;
  tone: string;
  output: string;
  onProductNameChange: (name: string) => void;
  onToneChange: (tone: string) => void;
  onGenerate: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={BadgeDollarSign} title="AI Ad Maker" />
      <Field label="Product name">
        <input value={productName} onChange={(event) => onProductNameChange(event.target.value)} className="control-input" />
      </Field>
      <Field label="Tone">
        <select value={tone} onChange={(event) => onToneChange(event.target.value)} className="control-select">
          <option value="luxury">Luxury</option>
          <option value="funny">Funny</option>
          <option value="formal">Formal</option>
          <option value="youthful">Youthful</option>
          <option value="educational">Educational</option>
          <option value="commercial">Commercial</option>
        </select>
      </Field>
      <button type="button" onClick={onGenerate} className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
        <Rocket className="h-4 w-4" aria-hidden="true" />
        Generate ad versions
      </button>
      {output ? (
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-black/25 p-3 text-xs font-semibold leading-6 text-[var(--foreground)]">
          {output}
        </pre>
      ) : (
        <EmptyMini label="Upload product media, choose tone, generate 15s/30s/60s ads." />
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

function DashboardPanel({ projects, projectStatus }: { projects: StudioProject[]; projectStatus: string }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Projects" value={`${Math.max(projects.length, 12)}`} icon={FolderOpen} />
        <DashboardCard label="Uploaded media" value="48 assets" icon={UploadCloud} />
        <DashboardCard label="Export history" value="19 renders" icon={History} />
        <DashboardCard label="Storage usage" value="38.2 GB" icon={Cloud} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="panel p-4">
          <PanelHeading icon={LayoutDashboard} title="User projects" />
          <div className="space-y-2">
            {(projects.length ? projects : createDemoProjects()).slice(0, 6).map((project) => (
              <div key={project.id} className="grid gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{project.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">{project.sourceFileName}</p>
                </div>
                <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{project.status}</span>
              </div>
            ))}
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

function AssistantPanel({
  command,
  messages,
  onCommandChange,
  onRunCommand,
}: {
  command: string;
  messages: string[];
  onCommandChange: (command: string) => void;
  onRunCommand: () => void;
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
          placeholder="Make this video for TikTok..."
          className="control-input"
        />
        <button type="button" onClick={onRunCommand} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-black" aria-label="Run AI command">
          <WandSparkles className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-48 space-y-2 overflow-auto pr-1">
        {messages.map((message, index) => (
          <p key={`${message}-${index}`} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-xs font-semibold leading-5 text-[var(--muted)]">
            {message}
          </p>
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
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-black transition hover:border-[var(--brand)] disabled:opacity-40">
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

function TrackIcon({ kind }: { kind: TimelineTrack["kind"] }) {
  const Icon = kind === "audio" ? FileAudio2 : kind === "overlay" ? ImageIcon : kind === "caption" ? Captions : kind === "effects" ? Sparkles : Film;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />;
}

function createDefaultTimeline(): TimelineTrack[] {
  return createTimelineForVideo("Source video", 36);
}

function createTimelineForAssets(assets: MediaAsset[], primaryVideoAssetId: string): TimelineTrack[] {
  const primaryVideo = assets.find((asset) => asset.id === primaryVideoAssetId && asset.kind === "video");
  const base = createTimelineForVideo(primaryVideo?.name ?? "Source video", 60);
  const extraAssets = assets.filter((asset) => asset.id !== primaryVideoAssetId);
  return addAssetsToTimeline(base, extraAssets);
}

function createTimelineForVideo(name: string, duration: number): TimelineTrack[] {
  const resolvedDuration = Math.max(12, Math.min(120, duration));
  return [
    {
      id: "track-video",
      name: "Video",
      kind: "video",
      layers: [{ id: "clip-main", type: "video", name, start: 0, duration: resolvedDuration, color: "#8ef7c2" }],
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
          duration: asset.kind === "video" ? 12 : asset.kind === "audio" ? 20 : 8,
          color: asset.kind === "video" ? "#8ef7c2" : asset.kind === "audio" ? "#7dd3fc" : "#c084fc",
        })),
      ],
    };
  });
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

function getCaptionLineForTime(captions: CaptionLine[], time: number) {
  return captions.find((caption) => time >= caption.start && time <= caption.end) ?? null;
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

function createDemoProjects(): StudioProject[] {
  const now = new Date().toISOString();
  return [
    "TikTok product ad",
    "Podcast clips batch",
    "Arabic course promo",
    "Restaurant launch reel",
  ].map((title, index) => ({
    id: `demo-${index}`,
    title,
    status: index === 0 ? "planned" : "completed",
    styleId: index === 1 ? "podcast-cuts" : "viral-saudi",
    platform: "tiktok",
    aspectRatio: "9:16",
    sourceFileName: `${title.toLowerCase().replaceAll(" ", "-")}.mp4`,
    sourceFileSize: 28_000_000,
    sourceMimeType: "video/mp4",
    sourceDurationSeconds: 60,
    storageBucket: "local-preview",
    storagePath: null,
    editPlan: null,
    createdAt: now,
    updatedAt: now,
  }));
}

function getAssetKind(file: File): MediaAsset["kind"] {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "video";
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
