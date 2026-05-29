"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Captions,
  Cloud,
  Copy,
  Crop,
  Download,
  FolderOpen,
  BringToFront,
  ImageIcon,
  Layers3,
  LayoutTemplate,
  Loader2,
  Plus,
  Redo2,
  Save,
  Scissors,
  SendToBack,
  SlidersHorizontal,
  Trash2,
  Type,
  Undo2,
  UploadCloud,
  WandSparkles,
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
import { convertVideoToGifWithFFmpeg, extractAudioMp3WithFFmpeg } from "@/lib/ffmpeg-renderer";
import {
  renderTemplateProject,
  renderTemplateProjectThumbnail,
} from "@/lib/browser-template-renderer";
import {
  prepareMediaForTranscription,
  type PreparedTranscriptionFile,
} from "@/lib/browser-transcription-audio";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";
import {
  deleteExportRecord,
  deleteMediaRecord,
  getLatestProjectSnapshot,
  listExportRecords,
  listMediaRecords,
  storeExportRecord,
  storeMediaFile,
  type StoredMediaRecord,
} from "@/lib/media-db";
import { isUsableMediaDuration, resolveMediaDuration } from "@/lib/media-duration";
import {
  PLATFORM_LABELS,
  VIDEO_STYLES,
  type AspectRatio,
  type LanguageMode,
  type Platform,
  type VideoStyle,
  type VideoStyleId,
} from "@/lib/video-styles";
import {
  type AdCampaign,
  type AdTone,
  type AdVariant,
} from "@/lib/ad-maker";
import { storeCustomVideoTemplate } from "@/lib/custom-video-template-store";
import type {
  TemplateLayer,
  TemplateProject,
  TemplateScene,
  TemplateTimelineLayer,
  TemplateTimelineTrack,
  VideoTemplate,
  VideoTemplateInput,
} from "@/lib/video-template-engine";
import { convertScenesToTimeline } from "@/lib/video-template-engine";
import {
  createBlankVideoProject,
  createVideoProjectFromEditorTimeline,
  createVideoProjectFromMediaAssets,
  createVideoProjectFromTemplateProject,
  videoProjectToEditorTimeline,
  type MediaAssetInput,
} from "@/lib/video-project-bridge";
import type { VideoProject } from "@/lib/video-project-model";
import { useVideoProjectStore } from "@/lib/video-project-store";
import {
  resolveLocalAICommand,
  type AICommandAction,
  type AICommandContext,
  type AICommandResponse,
} from "@/lib/ai-command";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND } from "@/lib/brand";
import {
  BACKGROUND_OPTIONS,
  CAPTION_TEMPLATES,
  PANELS,
  SAMPLE_TRANSCRIPT,
  TEMPLATE_PRESETS,
} from "@/components/studio/foundation";
import type {
  AdMakerResponse,
  AIEngineState,
  AssistantMessage,
  AutoTranscribeResponse,
  BrandKitState,
  CaptionLine,
  ClipSuggestion,
  Goal,
  MediaAsset,
  PanelId,
  StudioFile,
  TemplatePreset,
  TimelineLayer,
  TimelineTrack,
  TranscribeStatusResponse,
  TranscriptionMode,
  TranscriptSegment,
  UploadUrlResponse,
  AiToolItem,
} from "@/components/studio/foundation";
import { AssetIcon, StatusPill, ToolbarButton } from "@/components/studio/ui";
import { formatBytes, formatDuration, normalizeHexColor } from "@/components/studio/utils";
import { ProjectMetrics, TimelineEditor, VideoPreview } from "@/components/studio/preview";
import { AiStudioPanel } from "@/components/studio/panels/ai-tools";
import { TranscriptPanel } from "@/components/studio/panels/transcript";
import { CaptionsPanel } from "@/components/studio/panels/captions";
import { BackgroundPanel } from "@/components/studio/panels/background";
import { AudioPanel } from "@/components/studio/panels/audio";
import { TemplatesPanel } from "@/components/studio/panels/templates";
import { AdMakerPanel } from "@/components/studio/panels/ad-maker";
import { BrandKitPanel } from "@/components/studio/panels/brand";
import { DashboardPanel } from "@/components/studio/panels/projects";
import { CollaborationPanel } from "@/components/studio/panels/collaboration";
import { ExportsPanel, type ExportHistoryItem } from "@/components/studio/panels/exports";
import { LayerInspector, ProjectSettingsPanel, type LayerAlignmentAction } from "@/components/studio/panels/settings";
import { AssistantPanel } from "@/components/studio/panels/assistant";
import { StockMediaPanel } from "@/components/studio/panels/stock";
import { useProjectPersistence } from "@/components/studio/hooks/use-project-persistence";
import { useTemplateDraftLoader } from "@/components/studio/hooks/use-template-draft-loader";

const DEFAULT_IMAGE_CLIP_DURATION_SECONDS = 6;
const BRAND_KIT_STORAGE_KEY = "mawj-brand-kit-v1";
const DEFAULT_BRAND_KIT: BrandKitState = {
  logoName: "mawj-logo.svg",
  primaryColor: "#8ef7c2",
  secondaryColor: "#a78bfa",
  font: "IBM Plex Sans Arabic",
  captionStyle: "Saudi Viral Bold",
  intro: "2s animated logo",
  outro: "Follow / CTA screen",
};

export function ProfessionalVideoStudio() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const imageLayerInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const restoredMediaOnceRef = useRef(false);
  const restoredBrandIdentityRef = useRef(false);
  const keyboardActionsRef = useRef<{
    canDelete: boolean;
    canNudge: boolean;
    deleteSelectedLayer: () => void;
    duplicateSelectedLayer: () => void;
    moveSelectedLayerBackward: () => void;
    moveSelectedLayerForward: () => void;
    nudgeSelectedLayer: (deltaX: number, deltaY: number) => void;
    redoTimeline: () => void;
    undoTimeline: () => void;
  }>({
    canDelete: false,
    canNudge: false,
    deleteSelectedLayer: () => {},
    duplicateSelectedLayer: () => {},
    moveSelectedLayerBackward: () => {},
    moveSelectedLayerForward: () => {},
    nudgeSelectedLayer: () => {},
    redoTimeline: () => {},
    undoTimeline: () => {},
  });
  const [activePanel, setActivePanel] = useState<PanelId>("editor");
  const [studioFile, setStudioFile] = useState<StudioFile | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [styleId, setStyleId] = useState<VideoStyleId>("viral-saudi");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("arabic");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [brandName, setBrandName] = useState<string>(BRAND.displayName);
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [templateProject, setTemplateProject] = useState<TemplateProject | null>(null);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [recentProjects, setRecentProjects] = useState<StudioProject[]>([]);
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>(() => createDefaultTimeline());
  const timelineTracksRef = useRef<TimelineTrack[]>(timelineTracks);
  const [selectedLayerId, setSelectedLayerId] = useState("clip-main");
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>(SAMPLE_TRANSCRIPT);
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [captions, setCaptions] = useState<CaptionLine[]>(() => transcriptToCaptions(SAMPLE_TRANSCRIPT));
  const [captionTemplate, setCaptionTemplate] = useState(CAPTION_TEMPLATES[0]);
  const [backgroundMode, setBackgroundMode] = useState(BACKGROUND_OPTIONS[1]);
  const [activeAudioTools, setActiveAudioTools] = useState<Record<string, boolean>>({});
  const [brandKit, setBrandKit] = useState<BrandKitState>(DEFAULT_BRAND_KIT);
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
  const [clipSuggestions, setClipSuggestions] = useState<ClipSuggestion[]>([]);
  const [isAssistantRunning, setIsAssistantRunning] = useState(false);
  const [assistantEngineState, setAssistantEngineState] = useState<AIEngineState | null>(null);
  const [exportTier, setExportTier] = useState("Creator");
  const [exportFormat, setExportFormat] = useState("MP4");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAdGenerating, setIsAdGenerating] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode | null>(null);
  const [transcriptionNotice, setTranscriptionNotice] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [renderProgress, setRenderProgress] = useState<BrowserRenderProgress | null>(null);
  const [renderResult, setRenderResult] = useState<BrowserRenderResult | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryItem[]>([]);
  const exportHistoryUrlsRef = useRef<string[]>([]);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("Autosave ready");
  const engineProject = useVideoProjectStore((state) => state.currentProject);
  const setEngineProject = useVideoProjectStore((state) => state.setCurrentProject);
  const selectEngineLayer = useVideoProjectStore((state) => state.selectLayer);
  const setEnginePlayhead = useVideoProjectStore((state) => state.setPlayhead);
  const setEngineZoom = useVideoProjectStore((state) => state.setZoom);
  const undoEngineProject = useVideoProjectStore((state) => state.undo);
  const redoEngineProject = useVideoProjectStore((state) => state.redo);
  const enginePastCount = useVideoProjectStore((state) => state.past.length);
  const engineFutureCount = useVideoProjectStore((state) => state.future.length);

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

  const localStorageBytes = useMemo(
    () =>
      mediaAssets.reduce((total, asset) => total + asset.size, 0) +
      exportHistory.reduce((total, item) => total + item.size, 0),
    [exportHistory, mediaAssets],
  );

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
    if (!engineProject) return;
    syncEditorTimelineFromEngineProject(engineProject);
  }, [engineProject]);

  useEffect(() => {
    timelineTracksRef.current = timelineTracks;
  }, [timelineTracks]);

  useEffect(() => {
    const stored = getStoredBrandIdentity();
    if (stored?.brandName) setBrandName(stored.brandName);
    if (stored?.brandKit) setBrandKit(stored.brandKit);
    restoredBrandIdentityRef.current = true;
  }, []);

  useEffect(() => {
    if (!restoredBrandIdentityRef.current) return;
    persistStoredBrandIdentity({ brandName, brandKit });
  }, [brandKit, brandName]);

  const restorePersistedMedia = useCallback(async (isCancelled: () => boolean) => {
    const records = await listMediaRecords();
    if (isCancelled() || !records.length) return;

    const restoredAssets = records.slice(0, 12).map(storedMediaRecordToAsset);
    setMediaAssets((assets) => {
      if (assets.length) return assets;
      return restoredAssets;
    });

    const firstVideoAsset = restoredAssets.find((asset) => asset.kind === "video");
    if (!studioFile && firstVideoAsset) {
      const durationSeconds = Math.max(1, Math.round(firstVideoAsset.durationSeconds ?? 60));
      setStudioFile({
        file: firstVideoAsset.file,
        url: firstVideoAsset.url,
        durationSeconds,
      });
      setActiveProject(null);
      setTemplateProject(null);
      setEngineProject(
        createVideoProjectFromMediaAssets({
          name: firstVideoAsset.name,
          aspectRatio,
          assets: restoredAssets.map(mediaAssetToBridgeAsset),
          primaryVideoAssetId: firstVideoAsset.id,
          durationSeconds,
        }),
        { resetHistory: true },
      );
      setPlan(null);
      setPreviewTime(0);
      setTimelineTracks(createTimelineForAssets(restoredAssets, firstVideoAsset.id));
    }

    const restoredImageAssets = restoredAssets.filter((asset) => asset.kind === "image");
    if (!studioFile && !firstVideoAsset && !templateProject && restoredImageAssets.length) {
      const durationSeconds = getImageStoryboardDuration(restoredImageAssets.length);
      const restoredPlan = createImageStoryboardPlan({
        assets: restoredImageAssets,
        durationSeconds,
        platform,
        aspectRatio,
        styleId,
        brandName,
        goal,
      });
      const restoredProject = createImageStoryboardTemplateProject({
        assets: restoredImageAssets,
        plan: restoredPlan,
        brandName,
        aspectRatio,
        styleName: activeStyle.arabicName,
        goal,
      });
      const restoredTracks = templateTimelineToEditorTracks(restoredProject.timeline);
      const firstEditableLayer =
        restoredTracks.flatMap((track) => track.layers).find((layer) => layer.type === "image") ??
        restoredTracks.flatMap((track) => track.layers)[0] ??
        null;

      setTemplateProject(restoredProject);
      setEngineProject(createVideoProjectFromTemplateProject(restoredProject), { resetHistory: true });
      setTimelineTracks(restoredTracks);
      setSelectedLayerId(firstEditableLayer?.id ?? "");
      selectEngineLayer(firstEditableLayer?.id ?? null);
      setCaptions(planToCaptions(restoredPlan));
      setPlan(restoredPlan);
      setPreviewTime(0);
      setActivePanel("editor");
    }

    setProjectStatus(`${records.length} media assets restored from browser storage`);
  }, [
    activeStyle.arabicName,
    aspectRatio,
    brandName,
    goal,
    platform,
    selectEngineLayer,
    setEngineProject,
    studioFile,
    styleId,
    templateProject,
  ]);

  const autosaveSnapshot = useMemo<Record<string, unknown>>(
    () => ({
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
    }),
    [
      aspectRatio,
      brandKit,
      brandName,
      captions,
      engineProject,
      goal,
      languageMode,
      platform,
      styleId,
      templateProject,
      timelineTracks,
      transcript,
    ],
  );

  useProjectPersistence({
    renderResultUrl: renderResult?.url,
    restoredMediaOnceRef,
    onRestoreMedia: restorePersistedMedia,
    autosaveSnapshot,
    autosaveProjectId: engineProject?.id ?? "mawj-local-autosave",
    autosaveProjectName: brandName || engineProject?.name || "Mawj Studio",
  });

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      setRecentProjects(data.projects ?? []);
    } catch {
      setRecentProjects([]);
    }
  }, []);

  const loadExportHistory = useCallback(async () => {
    try {
      const records = await listExportRecords();
      const nextHistory = records.slice(0, 12).map((record) => ({
        ...record,
        url: URL.createObjectURL(record.blob),
      }));

      exportHistoryUrlsRef.current.forEach(revokeObjectUrl);
      exportHistoryUrlsRef.current = nextHistory.map((record) => record.url);
      setExportHistory(nextHistory);
    } catch {
      exportHistoryUrlsRef.current.forEach(revokeObjectUrl);
      exportHistoryUrlsRef.current = [];
      setExportHistory([]);
    }
  }, []);

  useEffect(() => {
    if (activePanel === "dashboard") {
      void loadProjects();
    }
    if (activePanel === "exports" || activePanel === "dashboard") {
      void loadExportHistory();
    }
  }, [activePanel, loadExportHistory, loadProjects]);

  useEffect(() => () => {
    exportHistoryUrlsRef.current.forEach(revokeObjectUrl);
    exportHistoryUrlsRef.current = [];
  }, []);

  function clearRenderedOutput() {
    setRenderResult((currentResult) => {
      revokeObjectUrl(currentResult?.url);
      return null;
    });
    setRenderProgress(null);
  }

  function persistExportResult(result: BrowserRenderResult, projectName = brandName || BRAND.displayName) {
    void storeExportRecord({
      id: createLayerId("export"),
      fileName: result.fileName,
      mimeType: result.mimeType,
      blob: result.blob,
      size: result.blob.size,
      durationSeconds: result.durationSeconds,
      resolution: result.resolution,
      projectName,
      createdAt: Date.now(),
    })
      .then(loadExportHistory)
      .catch(() => undefined);
  }

  function deleteExportHistoryItem(id: string) {
    void deleteExportRecord(id)
      .then(loadExportHistory)
      .then(() => setProjectStatus("Export removed from local history"))
      .catch(() => setError("Could not delete this local export."));
  }

  function syncEditorTimelineFromEngineProject(project: VideoProject) {
    const nextTracks = videoProjectToEditorTimeline(project);
    const nextSelectedLayerId =
      project.selectedLayerId ??
      nextTracks.flatMap((track) => track.layers)[0]?.id ??
      "";

    setTimelineTracks(nextTracks);
    timelineTracksRef.current = nextTracks;
    setSelectedLayerId(nextSelectedLayerId);
  }

  function commitTimeline(nextTracks: TimelineTrack[] | ((current: TimelineTrack[]) => TimelineTrack[])) {
    const resolvedTracks = typeof nextTracks === "function" ? nextTracks(timelineTracksRef.current) : nextTracks;
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

    setTimelineTracks(resolvedTracks);
    timelineTracksRef.current = resolvedTracks;
    useVideoProjectStore.getState().setCurrentProject(syncedProject);
    clearRenderedOutput();
    setProjectStatus("Autosaved timeline changes");
  }

  function undoTimeline() {
    if (!enginePastCount) return;
    undoEngineProject();
    const project = useVideoProjectStore.getState().currentProject;
    if (project) syncEditorTimelineFromEngineProject(project);
    clearRenderedOutput();
    setProjectStatus("Undo applied");
  }

  function redoTimeline() {
    if (!engineFutureCount) return;
    redoEngineProject();
    const project = useVideoProjectStore.getState().currentProject;
    if (project) syncEditorTimelineFromEngineProject(project);
    clearRenderedOutput();
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

  function updateTimelineLayerTiming(
    layerId: string,
    patch: Pick<TimelineLayer, "start" | "duration">,
  ) {
    setSelectedLayerId(layerId);
    selectEngineLayer(layerId);
    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                start: patch.start,
                duration: patch.duration,
              }
            : layer,
        ),
      })),
    );
  }

  function updateTimelineLayerGeometry(
    layerId: string,
    patch: Pick<TimelineLayer, "x" | "y" | "width" | "height">,
  ) {
    setSelectedLayerId(layerId);
    selectEngineLayer(layerId);
    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                ...patch,
              }
            : layer,
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
                layer.id === layerId
                  ? {
                      ...layer,
                      ...toTemplateTimelinePatch(patch),
                    }
                  : layer,
              ),
            })),
            updatedAt: new Date().toISOString(),
          }
        : project,
    );
    setProjectStatus("Preview layer position updated");
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
    timelineTracksRef.current = tracks;
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

  function openImageStoryboardProject(imageAssets: MediaAsset[], status?: string) {
    const storyboardAssets = imageAssets.filter((asset) => asset.kind === "image");
    if (!storyboardAssets.length) return;

    const durationSeconds = getImageStoryboardDuration(storyboardAssets.length);
    const storyboardPlan = createImageStoryboardPlan({
      assets: storyboardAssets,
      durationSeconds,
      platform,
      aspectRatio,
      styleId,
      brandName,
      goal,
    });
    const storyboardProject = createImageStoryboardTemplateProject({
      assets: storyboardAssets,
      plan: storyboardPlan,
      brandName,
      aspectRatio,
      styleName: activeStyle.arabicName,
      goal,
    });

    applyTemplateProject(storyboardProject, {
      plan: storyboardPlan,
      captions: planToCaptions(storyboardPlan),
      status: status ?? `${storyboardAssets.length} image${storyboardAssets.length > 1 ? "s" : ""} opened as an editable video`,
      message: `جهزت الصور كمشروع فيديو قابل للتعديل مدته ${durationSeconds} ثانية. كل صورة أصبحت مشهد مستقل وتقدر تحركها وتغير توقيتها وتصدرها.`,
    });
    setActiveProject(null);
    setPreviewTime(0);
    setIsPlaying(false);
  }

  function resetStudioProject() {
    const assetsToRemove = mediaAssets;

    videoRef.current?.pause();
    revokeObjectUrl(studioFile?.url);
    assetsToRemove.forEach((asset) => revokeObjectUrl(asset.url));
    void Promise.all(assetsToRemove.map((asset) => deleteMediaRecord(asset.id))).catch(() => undefined);

    const nextTracks = createDefaultTimeline();
    const blankProject = createBlankVideoProject({ name: brandName || BRAND.displayName, aspectRatio });

    setStudioFile(null);
    setMediaAssets([]);
    setActiveProject(null);
    setTemplateProject(null);
    setActiveTemplateId(null);
    setPlan(null);
    setTranscript([]);
    setTranscriptSearch("");
    setCaptions([]);
    setClipSuggestions([]);
    setAssistantEngineState(null);
    setTranscriptionMode(null);
    setTranscriptionNotice("");
    setError("");
    setIsPlaying(false);
    setPreviewTime(0);
    setTimelineTracks(nextTracks);
    timelineTracksRef.current = nextTracks;
    setSelectedLayerId("clip-main");
    setEngineProject(blankProject, { resetHistory: true });
    selectEngineLayer("clip-main");
    clearRenderedOutput();
    setActivePanel("editor");
    setProjectStatus("New empty project ready");
  }

  useTemplateDraftLoader({
    onLoad: applyTemplateProject,
    onError: () => setProjectStatus("Could not load template project"),
  });

  async function handleFiles(files?: FileList | File[]) {
    if (!files?.length) return;

    const filesArray = Array.from(files);
    setProjectStatus("Optimizing uploaded media for the editor...");
    const preparedFiles = await Promise.all(filesArray.map(prepareStudioFileForUpload));
    const incomingAssets: MediaAsset[] = preparedFiles.map(createMediaAssetFromFile);

    const firstVideoAsset = incomingAssets.find((asset) => asset.kind === "video") ?? null;
    const incomingImageAssets = incomingAssets.filter((asset) => asset.kind === "image");
    const allAssets = [...incomingAssets, ...mediaAssets];
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
          assets: allAssets.map(mediaAssetToBridgeAsset),
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

    if (
      !firstVideoAsset &&
      incomingImageAssets.length &&
      !studioFile &&
      (!templateProject || templateProject.templateId === "image-storyboard-generated")
    ) {
      openImageStoryboardProject(
        allAssets.filter((asset) => asset.kind === "image"),
        `${incomingImageAssets.length} image${incomingImageAssets.length > 1 ? "s" : ""} loaded into an editable video storyboard`,
      );
      setError("");
      return;
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

  async function captureDuration() {
    const video = videoRef.current;
    if (!studioFile || !video) return;

    const duration = await resolveMediaDuration(video, studioFile.durationSeconds);
    if (!isUsableMediaDuration(duration)) return;

    const roundedDuration = Math.max(1, Math.round(duration));
    setStudioFile((currentFile) =>
      currentFile ? { ...currentFile, durationSeconds: roundedDuration } : currentFile,
    );
    setMediaAssets((assets) =>
      assets.map((asset) =>
        asset.file === studioFile.file ? { ...asset, durationSeconds: roundedDuration } : asset,
      ),
    );
    commitTimeline((tracks) => syncPrimaryVideoDuration(tracks, studioFile.file.name, roundedDuration));
  }

  useEffect(() => {
    if (!isPlaying || studioFile || !templateProject) return;

    const intervalId = window.setInterval(() => {
      setPreviewTime((currentTime) => {
        const nextTime = Math.min(templateProject.duration, roundTimelineSeconds(currentTime + 0.1));
        setEnginePlayhead(nextTime);

        if (nextTime >= templateProject.duration) {
          setIsPlaying(false);
        }

        return nextTime;
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isPlaying, setEnginePlayhead, studioFile, templateProject]);

  function addMediaAssetToTimeline(asset: MediaAsset) {
    if (asset.kind === "image") {
      if (!studioFile && (!templateProject || templateProject.templateId === "image-storyboard-generated")) {
        const nextImageAssets = uniqueMediaAssetsById([asset, ...mediaAssets]).filter(
          (item) => item.kind === "image",
        );

        openImageStoryboardProject(
          nextImageAssets,
          `${asset.name} opened in an editable image video storyboard`,
        );
        setError("");
        return;
      }

      const imageLayer = createEditableImageLayer({
        asset,
        aspectRatio,
        previewTime,
      });

      appendEditableLayersToProject([imageLayer], imageLayer.id);
      setProjectStatus(`${asset.name} added as an editable image layer`);
      return;
    }

    if (asset.kind === "video" && !studioFile && !templateProject) {
      selectVideoAssetAsSource(asset, uniqueMediaAssetsById([asset, ...mediaAssets]));
      setError("");
      return;
    }

    commitTimeline((tracks) => addAssetsToTimeline(tracks, [asset]));
    setProjectStatus(`${asset.name} added to timeline`);
  }

  async function addExternalMediaAssetToTimeline(asset: MediaAsset) {
    const preparedAsset = await materializeExternalMediaAsset(asset);
    upsertMediaAsset(preparedAsset);
    if (preparedAsset.file.size > 0) {
      void persistUploadedMedia(
        [preparedAsset],
        preparedAsset.kind === "video" && !studioFile && !templateProject ? preparedAsset.id : null,
      );
    }
    addMediaAssetToTimeline(preparedAsset);
  }

  async function saveExternalMediaAsset(asset: MediaAsset) {
    const preparedAsset = await materializeExternalMediaAsset(asset);
    upsertMediaAsset(preparedAsset);
    if (preparedAsset.file.size > 0) void persistUploadedMedia([preparedAsset], null);
    setProjectStatus(`${preparedAsset.name} saved to media bin`);
  }

  function upsertMediaAsset(asset: MediaAsset) {
    setMediaAssets((assets) => [asset, ...assets.filter((item) => item.id !== asset.id)]);
  }

  async function materializeExternalMediaAsset(asset: MediaAsset) {
    const existingAsset = mediaAssets.find((item) => item.id === asset.id);
    if (existingAsset && (existingAsset.file.size > 0 || existingAsset.url.startsWith("blob:"))) {
      return existingAsset;
    }

    if (asset.file.size > 0 || asset.url.startsWith("blob:")) return asset;

    setProjectStatus(`Downloading stock ${asset.kind} for local editing...`);

    try {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error("Stock media download failed.");

      const blob = await response.blob();
      if (!blob.size) throw new Error("Stock media download was empty.");

      const mimeType = blob.type || asset.file.type || getDefaultMimeType(asset.kind);
      const file = new File([blob], asset.name, { type: mimeType });

      return {
        ...asset,
        file,
        url: URL.createObjectURL(blob),
        size: blob.size,
      };
    } catch {
      setProjectStatus(`Using streamed ${asset.kind}. Local download was unavailable.`);
      return asset;
    }
  }

  async function addImageLayerFromFiles(files?: FileList | File[]) {
    const imageFiles = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setError("Choose an image file to add it as an editable layer.");
      return;
    }

    setProjectStatus("Optimizing image layers for fast preview...");
    const preparedFiles = await Promise.all(imageFiles.map(prepareStudioFileForUpload));
    const incomingAssets: MediaAsset[] = preparedFiles.map(createMediaAssetFromFile);
    const imageLayers = incomingAssets.map((asset, index) =>
      createEditableImageLayer({
        asset,
        aspectRatio,
        previewTime: previewTime + index * 0.25,
      }),
    );

    setMediaAssets((assets) => [...incomingAssets, ...assets]);
    void persistUploadedMedia(incomingAssets, null);

    if (!studioFile && (!templateProject || templateProject.templateId === "image-storyboard-generated")) {
      openImageStoryboardProject(
        uniqueMediaAssetsById([...incomingAssets, ...mediaAssets]).filter((asset) => asset.kind === "image"),
        `${incomingAssets.length} image${incomingAssets.length > 1 ? "s" : ""} opened in an editable video storyboard`,
      );
      setActivePanel("editor");
      setError("");
      return;
    }

    appendEditableLayersToProject(imageLayers, imageLayers.at(-1)?.id ?? imageLayers[0]?.id);
    setActivePanel("editor");
    setError("");
    setProjectStatus(`${imageLayers.length} editable image layer${imageLayers.length > 1 ? "s" : ""} added`);
  }

  function addCtaLayer() {
    const ctaLayers = createEditableCtaLayers({
      aspectRatio,
      previewTime,
      brandColor: brandKit.primaryColor,
      goal,
    });
    const textLayer = ctaLayers.find((layer) => layer.type === "text") ?? ctaLayers.at(-1);

    appendEditableLayersToProject(ctaLayers, textLayer?.id);
    setActivePanel("editor");
    setProjectStatus("Editable CTA layers added to preview and timeline");
  }

  function appendEditableLayersToProject(layers: TimelineLayer[], nextSelectedLayerId?: string) {
    if (!layers.length) return;

    const nextTracks = appendLayersToOverlayTrack(timelineTracks, layers);

    setTemplateProject((project) =>
      project ? appendTimelineLayersToTemplateProject(project, layers) : project,
    );
    commitTimeline(nextTracks);

    const layerId = nextSelectedLayerId ?? layers.at(-1)?.id;
    if (layerId) {
      setSelectedLayerId(layerId);
      selectEngineLayer(layerId);
    }
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

  function clearActiveTemplateProject() {
    const templateName = templateProject?.name ?? "Template project";

    videoRef.current?.pause();
    setStudioFile(null);
    setActiveProject(null);
    setTemplateProject(null);
    setActiveTemplateId(null);
    setPlan(null);
    setCaptions([]);
    setIsPlaying(false);
    setPreviewTime(0);
    setAssistantEngineState(null);

    const nextTracks = createDefaultTimeline();
    commitTimeline(nextTracks);
    setSelectedLayerId("clip-main");
    selectEngineLayer("clip-main");
    setProjectStatus(`${templateName} cleared from preview and timeline`);
  }

  function syncTemplateProjectTimeline(nextTracks: TimelineTrack[]) {
    setTemplateProject((project) => {
      if (!project) return project;

      const editorLayers = new Map(
        nextTracks.flatMap((track) => track.layers.map((layer) => [layer.id, layer] as const)),
      );
      const editorLayerOrder = new Map(
        nextTracks.flatMap((track) => track.layers).map((layer, index) => [layer.id, index] as const),
      );
      const syncedTimeline = project.timeline.map((track) => ({
        ...track,
        layers: track.layers
          .filter((layer) => editorLayers.has(layer.id))
          .map((layer) => {
            const editorLayer = editorLayers.get(layer.id);
            if (!editorLayer) return layer;
            const patch = toTemplateTimelinePatch(editorLayer);

            return {
              ...layer,
              ...patch,
              absoluteStart: editorLayer.start,
            };
          })
          .sort(
            (left, right) =>
              (editorLayerOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
              (editorLayerOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER),
          ),
      }));

      if (!syncedTimeline.some((track) => track.layers.length > 0)) {
        return null;
      }

      return {
        ...project,
        timeline: syncedTimeline,
        updatedAt: new Date().toISOString(),
      };
    });
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
    syncTemplateProjectTimeline(nextTracks);
    commitTimeline(nextTracks);
    setSelectedLayerId(nextLayer?.id ?? "");
    selectEngineLayer(nextLayer?.id ?? null);
    setProjectStatus(`${asset.name} deleted from media and timeline`);
  }

  function selectVideoAssetAsSource(asset: MediaAsset, availableAssets: MediaAsset[] = mediaAssets) {
    if (asset.kind !== "video") return;
    const durationSeconds = Math.round(asset.durationSeconds ?? 60);
    setStudioFile({ file: asset.file, url: asset.url, durationSeconds });
    setActiveProject(null);
    setTemplateProject(null);
    setEngineProject(
      createVideoProjectFromMediaAssets({
        name: asset.name,
        aspectRatio,
        assets: uniqueMediaAssetsById([asset, ...availableAssets]).map(mediaAssetToBridgeAsset),
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
          "No Python AI service or OpenAI key is configured yet. Showing demo captions until PYTHON_AI_SERVICE_URL or OPENAI_API_KEY is added.",
        );
        setProjectStatus("Demo captions shown because no transcription provider is configured");
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
        data.mode === "python"
          ? `Arabic captions ready with Python Whisper ${data.model}`
          : data.mode === "openai"
            ? `Auto captions ready with ${data.model}`
            : "Demo captions ready. Add PYTHON_AI_SERVICE_URL or OPENAI_API_KEY for real video transcription.",
      );
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          data.mode === "python"
            ? `Whisper/Python captioning complete: ${data.captions.length} caption lines generated from the video audio.`
            : data.mode === "openai"
              ? `Auto-caption complete: ${data.captions.length} caption lines generated from the video audio.`
              : "Demo captions generated. Add PYTHON_AI_SERVICE_URL or OPENAI_API_KEY on Vercel for real audio transcription.",
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
    commitTimeline((tracks) =>
      ensureCaptionLayer(tracks, data.captions, targetDuration, getActiveCaptionStylePatch()),
    );
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
      let project: StudioProject | null = null;
      let planningWithoutUpload = false;

      try {
        project = await ensureProjectUploaded();
      } catch (uploadError) {
        const now = new Date().toISOString();
        planningWithoutUpload = true;
        project = {
          id: crypto.randomUUID(),
          title: `${brandName || "Untitled"} · ${activeStyle.arabicName}`,
          status: "draft",
          styleId,
          platform,
          aspectRatio,
          sourceFileName: studioFile.file.name,
          sourceFileSize: studioFile.file.size,
          sourceMimeType: studioFile.file.type || "video/mp4",
          sourceDurationSeconds: studioFile.durationSeconds,
          storageBucket: "browser-local",
          storagePath: null,
          editPlan: null,
          createdAt: now,
          updatedAt: now,
        };
        setActiveProject(project);
        setProjectStatus("Supabase upload skipped. Generating plan from local metadata...");
        setAssistantMessages((messages) =>
          [
            createAssistantMessage(
              "assistant",
              `تعذر رفع الفيديو للسحابة، بكمل الخطة محليًا من بيانات الملف. ${uploadError instanceof Error ? cleanOpenAIError(uploadError.message) : ""}`.trim(),
            ),
            ...messages,
          ].slice(0, 12),
        );
      }

      const response = await fetch("/api/edit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          projectUrl: planningWithoutUpload ? null : project.storagePath,
          fileName: studioFile.file.name,
          durationSeconds: studioFile.durationSeconds,
          mediaCount: mediaAssets.length || 1,
          imageCount: mediaAssets.filter((asset) => asset.kind === "image").length,
          audioCount: mediaAssets.filter((asset) => asset.kind === "audio").length,
          hasCloudUpload: !planningWithoutUpload,
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
      const planCaptions = planToCaptions(data.plan);

      setPlan(data.plan);
      setCaptions(planCaptions);
      clearRenderedOutput();
      commitTimeline((tracks) =>
        ensureCaptionLayer(
          tracks,
          planCaptions,
          data.plan.targetDurationSeconds,
          getActiveCaptionStylePatch(),
        ),
      );
      setProjectStatus("AI edit plan ready");
      setAssistantMessages((messages) => [
        createAssistantMessage(
          "assistant",
          `Generated: ${data.plan.title}. Suggested ${data.plan.targetDurationSeconds}s output.`,
          [{ type: "EXTRACT_CLIPS", label: "Edit plan generated" }],
        ),
        ...messages,
      ].slice(0, 12));
      if (data.project) {
        setActiveProject(data.project);
      } else if (project) {
        setActiveProject({
          ...project,
          status: "planned",
          editPlan: data.plan,
          updatedAt: new Date().toISOString(),
        });
      }
      await loadProjects();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unexpected AI planning error.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateImageStoryboard(imageAssets: MediaAsset[]) {
    if (!imageAssets.length) {
      setError("ارفع صورة واحدة على الأقل عشان أحولها إلى فيديو.");
      setProjectStatus("Image storyboard needs uploaded images");
      return;
    }

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
	    } catch {
	      openImageStoryboardProject(
	        imageAssets,
	        "Generated a local image storyboard because the AI planner was unavailable",
	      );
	      setError("");
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
    if (!studioFile && templateProject) {
      setIsPlaying((playing) => {
        const shouldPlay = !playing;
        if (shouldPlay && previewTime >= templateProject.duration) {
          setPreviewTime(0);
          setEnginePlayhead(0);
        }
        return shouldPlay;
      });
      return;
    }

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
      clearRenderedOutput();
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
        persistExportResult(result, templateProject.name);
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
    clearRenderedOutput();
    setRenderProgress({
      percent: 0,
      label: "Preparing render",
      elapsedSeconds: 0,
      outputSeconds: renderPlan.targetDurationSeconds,
    });
    setProjectStatus("Rendering export...");

    try {
      const result = await renderEditedVideo({
        sourceFile: studioFile.file,
        sourceUrl: studioFile.url,
        sourceFileName: studioFile.file.name,
        sourceDurationSeconds: studioFile.durationSeconds,
        aspectRatio,
        style: activeStyle,
        brandName,
        plan: renderPlan,
        timelineTracks,
        onProgress: setRenderProgress,
      });
      setRenderResult(result);
      persistExportResult(result, renderPlan.title);
      setProjectStatus(`${exportTier} ${exportFormat} export ready`);
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not render video.");
    } finally {
      setIsRendering(false);
    }
  }

  async function exportClipSuggestion(clip: ClipSuggestion) {
    if (!studioFile) {
      setError("ارفع فيديو أولاً حتى أقدر أصدّر المقطع المحدد.");
      return;
    }

    const clipPlan = createClipExportPlan({
      clip,
      style: activeStyle,
      aspectRatio,
      brandName,
    });

    setIsRendering(true);
    setError("");
    clearRenderedOutput();
    setRenderProgress({
      percent: 0,
      label: `Preparing ${clip.label}`,
      elapsedSeconds: 0,
      outputSeconds: clip.duration,
    });
    setProjectStatus(`Exporting ${clip.label} with FFmpeg cuts...`);

    try {
      const result = await renderEditedVideo({
        sourceFile: studioFile.file,
        sourceUrl: studioFile.url,
        sourceFileName: `${clip.label}-${studioFile.file.name}`,
        sourceDurationSeconds: studioFile.durationSeconds,
        aspectRatio,
        style: activeStyle,
        brandName,
        plan: clipPlan,
        timelineTracks,
        onProgress: setRenderProgress,
      });
      setRenderResult(result);
      persistExportResult(result, `${clip.label} · ${brandName || BRAND.displayName}`);
      setProjectStatus(`${clip.label} export ready`);
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not export selected clip.");
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

  function duplicateSelectedLayer() {
    if (!selectedLayer) {
      setProjectStatus("Select a timeline layer before duplicating.");
      return;
    }

    const duplicateLayer = createDuplicateTimelineLayer(selectedLayer);
    const nextTracks = timelineTracks.map((track) => ({
      ...track,
      layers: track.layers.flatMap((layer) =>
        layer.id === selectedLayer.id ? [layer, duplicateLayer] : [layer],
      ),
    }));

    setTemplateProject((project) =>
      project ? duplicateTemplateProjectLayer(project, selectedLayer.id, duplicateLayer) : project,
    );
    commitTimeline(nextTracks);
    setSelectedLayerId(duplicateLayer.id);
    selectEngineLayer(duplicateLayer.id);
    setProjectStatus(`${selectedLayer.name} duplicated`);
  }

  function moveSelectedLayerOrder(direction: "forward" | "backward") {
    if (!selectedLayer) {
      setProjectStatus("Select a timeline layer before reordering.");
      return;
    }

    let didMove = false;
    const nextTracks = timelineTracks.map((track) => {
      const index = track.layers.findIndex((layer) => layer.id === selectedLayer.id);
      if (index === -1) return track;

      const targetIndex = direction === "forward" ? index + 1 : index - 1;
      if (targetIndex < 0 || targetIndex >= track.layers.length) return track;

      const layers = [...track.layers];
      const [layer] = layers.splice(index, 1);
      layers.splice(targetIndex, 0, layer);
      didMove = true;

      return { ...track, layers };
    });

    if (!didMove) {
      setProjectStatus(direction === "forward" ? "Layer already on top" : "Layer already behind");
      return;
    }

    syncTemplateProjectTimeline(nextTracks);
    commitTimeline(nextTracks);
    setSelectedLayerId(selectedLayer.id);
    selectEngineLayer(selectedLayer.id);
    setProjectStatus(direction === "forward" ? "Layer moved forward" : "Layer moved backward");
  }

  function moveSelectedLayerForward() {
    moveSelectedLayerOrder("forward");
  }

  function moveSelectedLayerBackward() {
    moveSelectedLayerOrder("backward");
  }

  function nudgeSelectedLayer(deltaX: number, deltaY: number) {
    if (!selectedLayer) return;

    const canvas = getAspectCanvasDimensions(aspectRatio);
    const geometry = getTimelineLayerGeometry(selectedLayer, aspectRatio);
    updateTimelineLayerGeometry(selectedLayer.id, {
      x: clampTimelineNumber(geometry.x + deltaX, 0, Math.max(0, canvas.width - geometry.width)),
      y: clampTimelineNumber(geometry.y + deltaY, 0, Math.max(0, canvas.height - geometry.height)),
      width: geometry.width,
      height: geometry.height,
    });
    setProjectStatus(`Layer nudged ${deltaX || ""}${deltaY ? `/${deltaY}` : ""}px`);
  }

  function alignSelectedLayer(action: LayerAlignmentAction) {
    if (!selectedLayer) return;

    const canvas = getAspectCanvasDimensions(aspectRatio);
    const safeMargins = getSafeMarginsForAspect(aspectRatio);
    const geometry = getTimelineLayerGeometry(selectedLayer, aspectRatio);
    const nextGeometry = { ...geometry };

    if (action === "center-x") {
      nextGeometry.x = Math.round((canvas.width - geometry.width) / 2);
    }

    if (action === "center-y") {
      nextGeometry.y = Math.round((canvas.height - geometry.height) / 2);
    }

    if (action === "safe-width") {
      nextGeometry.x = safeMargins.left;
      nextGeometry.width = Math.max(1, canvas.width - safeMargins.left - safeMargins.right);
    }

    if (action === "safe-bottom") {
      nextGeometry.y = Math.max(safeMargins.top, canvas.height - safeMargins.bottom - geometry.height);
    }

    updateTimelineLayerGeometry(selectedLayer.id, nextGeometry);
    setProjectStatus(`Layer aligned: ${action}`);
  }

  function deleteSelectedLayer() {
    if (!selectedLayer) {
      if (templateProject) {
        clearActiveTemplateProject();
      }
      return;
    }

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

    syncTemplateProjectTimeline(nextTracks);
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
    const textLayer = createEditableTextLayer({
      aspectRatio,
      previewTime,
      defaultText:
        goal === "sales"
          ? "عرض خاص لفترة محدودة"
          : goal === "education"
            ? "أهم نقطة في المقطع"
            : "اكتب عنوانك هنا",
    });

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "overlay"
          ? {
              ...track,
              layers: [...track.layers, textLayer],
            }
          : track,
      ),
    );
    setSelectedLayerId(textLayer.id);
    selectEngineLayer(textLayer.id);
    setActivePanel("editor");
    setProjectStatus("Editable text layer added to preview and timeline");
  }

  keyboardActionsRef.current = {
    canDelete: Boolean(selectedLayer || templateProject),
    canNudge: Boolean(selectedLayer),
    deleteSelectedLayer,
    duplicateSelectedLayer,
    moveSelectedLayerBackward,
    moveSelectedLayerForward,
    nudgeSelectedLayer,
    redoTimeline,
    undoTimeline,
  };

  useEffect(() => {
    function handleKeyboardShortcuts(event: KeyboardEvent) {
      if (isEditorTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const usesModifier = event.metaKey || event.ctrlKey;
      const actions = keyboardActionsRef.current;

      if (usesModifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          actions.redoTimeline();
        } else {
          actions.undoTimeline();
        }
        return;
      }

      if (usesModifier && key === "y") {
        event.preventDefault();
        actions.redoTimeline();
        return;
      }

      if (usesModifier && key === "d") {
        event.preventDefault();
        actions.duplicateSelectedLayer();
        return;
      }

      if (usesModifier && event.key === "]") {
        event.preventDefault();
        actions.moveSelectedLayerForward();
        return;
      }

      if (usesModifier && event.key === "[") {
        event.preventDefault();
        actions.moveSelectedLayerBackward();
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
        if (!actions.canNudge) return;
        const distance = event.shiftKey ? 50 : 10;
        const deltaX = event.key === "ArrowLeft" ? -distance : event.key === "ArrowRight" ? distance : 0;
        const deltaY = event.key === "ArrowUp" ? -distance : event.key === "ArrowDown" ? distance : 0;

        event.preventDefault();
        actions.nudgeSelectedLayer(deltaX, deltaY);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (!actions.canDelete) return;
        event.preventDefault();
        actions.deleteSelectedLayer();
      }
    }

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, []);

  function markTranscriptDeleted(segmentId: string) {
    const segment = transcript.find((item) => item.id === segmentId);
    if (!segment) return;

    const nextTranscript = transcript.map((item) =>
      item.id === segmentId ? { ...item, deleted: !item.deleted } : item,
    );
    const keptSegments = getKeptTranscriptSegments(nextTranscript);

    if (!keptSegments.length) {
      setProjectStatus("لا يمكن حذف كل مقاطع الترانسكربت");
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            "ما أقدر أحذف كل الجمل؛ لازم يبقى مقطع واحد على الأقل حتى نقدر نصدّر فيديو فعلي.",
          ),
          ...messages,
        ].slice(0, 12),
      );
      return;
    }

    const deletedSegments = getDeletedTranscriptSegments(nextTranscript);
    const hasCuts = deletedSegments.length > 0;
    const targetDuration = studioFile?.durationSeconds ?? totalTimelineSeconds;
    const nextPlan = hasCuts
      ? createTranscriptCutPlan({
          transcript: nextTranscript,
          deletedSegments,
          style: activeStyle,
          aspectRatio,
          brandName,
          durationSeconds: targetDuration,
        })
      : null;
    const nextCaptions = hasCuts
      ? createOutputCaptionsFromTranscript(nextTranscript)
      : transcriptToCaptions(keptSegments);

    setTranscript(nextTranscript);
    setCaptions(nextCaptions);
    setPlan((currentPlan) => nextPlan ?? (currentPlan?.id.startsWith("transcript-cut-") ? null : currentPlan));
    commitTimeline((tracks) =>
      ensureCaptionLayer(
        syncTranscriptCutMarkers(tracks, deletedSegments),
        nextCaptions,
        nextPlan?.targetDurationSeconds ?? targetDuration,
        getActiveCaptionStylePatch(),
      ),
    );
    clearRenderedOutput();
    setProjectStatus(
      hasCuts
        ? `تم تجهيز ${deletedSegments.length} قصّة نصية للتصدير`
        : "تم إلغاء قص الترانسكربت واستعادة الكابشن",
    );
    setAssistantMessages((messages) =>
      [
        createAssistantMessage(
          "assistant",
          hasCuts
            ? `تم تجهيز قص فعلي من الترانسكربت. التصدير القادم سيحافظ على ${keptSegments.length} مقطع ويقص:\n${deletedSegments
                .slice(0, 6)
                .map((item) => `• ${formatDuration(item.start)}–${formatDuration(item.end)}`)
                .join("\n")}`
            : "رجّعت كل مقاطع الترانسكربت. التصدير القادم سيستخدم الفيديو بدون قص نصي.",
          hasCuts ? [{ type: "REMOVE_SILENCE", label: `${deletedSegments.length} transcript cuts` }] : undefined,
        ),
        ...messages,
      ].slice(0, 12),
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
    const activeTranscript = transcript.filter((seg) => !seg.deleted && !seg.id.startsWith("silence-gap-"));
    const sorted = [...activeTranscript].sort((a, b) => a.start - b.start);
    const gaps: Array<{ start: number; end: number }> = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = sorted[i].end;
      const gapEnd = sorted[i + 1].start;
      const gap = gapEnd - gapStart;
      if (gap > 0.5) {
        gaps.push({ start: gapStart, end: gapEnd });
      }
    }

    if (!gaps.length) {
      setProjectStatus("No silence detected in current transcript");
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            "ما لقيت فجوات صمت أطول من 0.5 ثانية في النص الحالي. شغّل Auto-caption على الفيديو الحقيقي للحصول على كشف أدق.",
          ),
          ...messages,
        ].slice(0, 12),
      );
      return;
    }

    const silenceMarkers: TimelineLayer[] = gaps.map((gap) => ({
      id: crypto.randomUUID(),
      type: "effect",
      name: `Silence ${formatDuration(gap.start)}–${formatDuration(gap.end)}`,
      start: gap.start,
      duration: gap.end - gap.start,
      color: "#60a5fa",
    }));
    const silenceSegments: TranscriptSegment[] = gaps.map((gap, index) => ({
      id: `silence-gap-${Math.round(gap.start * 1000)}-${index}`,
      start: gap.start,
      end: gap.end,
      speaker: "Silence",
      text: `صمت محذوف ${formatDuration(gap.start)}–${formatDuration(gap.end)}`,
      deleted: true,
    }));

    const nextTranscript = [
      ...transcript.filter((segment) => !segment.id.startsWith("silence-gap-")),
      ...silenceSegments,
    ].sort((a, b) => a.start - b.start);
    const nextPlan = createSilenceRemovalPlan({
      transcript: sorted,
      gaps,
      style: activeStyle,
      aspectRatio,
      brandName,
    });
    const nextCaptions = createOutputCaptionsFromTranscript(nextTranscript);

    setTranscript(nextTranscript);
    setPlan(nextPlan);
    setCaptions(nextCaptions);

    commitTimeline((tracks) =>
      ensureCaptionLayer(
        tracks.map((track) =>
          track.kind === "effects"
            ? { ...track, layers: [...track.layers.filter((layer) => !layer.name.startsWith("Silence ")), ...silenceMarkers] }
            : track,
        ),
        nextCaptions,
        nextPlan.targetDurationSeconds,
        getActiveCaptionStylePatch(),
      ),
    );
    clearRenderedOutput();
    setProjectStatus(`تم تحديد ${gaps.length} فترة صمت للحذف`);
    setAssistantMessages((messages) =>
      [
        createAssistantMessage(
          "assistant",
          `تم تحديد ${gaps.length} فترة صمت للحذف:\n${gaps
            .map((gap) => `• ${formatDuration(gap.start)}–${formatDuration(gap.end)}`)
            .join("\n")}\n\nتم تجهيز خطة قص حقيقية، والتصدير القادم سيستخدم FFmpeg لقص هذه الفجوات من الفيديو.`,
          [{ type: "REMOVE_SILENCE", label: `${gaps.length} silence gaps selected` }],
        ),
        ...messages,
      ].slice(0, 12),
    );
  }

  function applyBackgroundReplacement(mode = backgroundMode) {
    setBackgroundMode(mode);
    const backgroundLayer = createBackgroundReplacementLayer({
      mode,
      aspectRatio,
      duration: Math.max(1, totalTimelineSeconds),
      brandColor: brandKit.primaryColor,
    });

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "effects"
          ? {
              ...track,
              layers: [
                backgroundLayer,
                ...track.layers.filter((layer) => !layer.id.startsWith("background-replacement-")),
              ],
            }
          : track,
      ),
    );
    setSelectedLayerId(backgroundLayer.id);
    selectEngineLayer(backgroundLayer.id);
    setProjectStatus(`${mode} background applied to preview, timeline, and export`);
  }

  function applyAudioEnhancementChain() {
    const enabledTools = [
      "Noise reduction",
      "Voice enhancement",
      "Echo reduction",
      "Auto volume leveling",
    ];
    const duration = Math.max(1, totalTimelineSeconds);

    setActiveAudioTools((tools) => ({
      ...tools,
      "Noise reduction": true,
      "Voice enhancement": true,
      "Echo reduction": true,
      "Auto volume leveling": true,
    }));

    const audioLayer: TimelineLayer = {
      id: "audio-enhancement-chain",
      type: "effect",
      name: `Audio cleanup chain · ${enabledTools.join(" + ")}`,
      content: enabledTools.join(", "),
      start: 0,
      duration,
      color: "#7dd3fc",
    };

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "effects"
          ? {
              ...track,
              layers: [
                ...track.layers.filter((layer) => layer.id !== audioLayer.id),
                audioLayer,
              ],
            }
          : track,
      ),
    );
    setSelectedLayerId(audioLayer.id);
    selectEngineLayer(audioLayer.id);
    setProjectStatus("Audio enhancement chain will be applied during export");
  }

  function generateCaptionsFromTranscript() {
    const nextCaptions = transcriptToCaptions(transcript.filter((segment) => !segment.deleted));
    setCaptions(nextCaptions);
    commitTimeline((tracks) =>
      ensureCaptionLayer(
        tracks,
        nextCaptions,
        studioFile?.durationSeconds ?? totalTimelineSeconds,
        getActiveCaptionStylePatch(),
      ),
    );
    setActivePanel("captions");
    setProjectStatus("Captions generated from transcript");
  }

  function applyCaptionTemplate(nextTemplate: string, nextAspectRatio = aspectRatio) {
    setCaptionTemplate(nextTemplate);
    const stylePatch = getCaptionStylePatch(nextTemplate, nextAspectRatio, brandKit.primaryColor);

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "caption"
          ? {
              ...track,
              layers: track.layers.map((layer) =>
                layer.type === "caption" ? { ...layer, ...stylePatch } : layer,
              ),
            }
          : track,
      ),
    );
    setProjectStatus(`${nextTemplate} caption style applied`);
  }

  function applyBrandKitToTimeline() {
    const normalizedBrandKit = normalizeBrandKit(brandKit);
    const brandLabel = brandName.trim() || BRAND.displayName;
    const nextCaptionTemplate = normalizedBrandKit.captionStyle.trim() || captionTemplate;
    const captionStylePatch = getCaptionStylePatch(nextCaptionTemplate, aspectRatio, normalizedBrandKit.primaryColor);
    const durationSeconds = Math.max(1, totalTimelineSeconds, studioFile?.durationSeconds ?? 0, templateProject?.duration ?? 0);
    const brandBugLayer = createBrandBugTimelineLayer({
      brandName: brandLabel,
      brandKit: normalizedBrandKit,
      aspectRatio,
      durationSeconds,
    });

    setBrandKit(normalizedBrandKit);
    setCaptionTemplate(nextCaptionTemplate);
    commitTimeline((tracks) => applyBrandKitToEditorTracks(tracks, normalizedBrandKit, brandBugLayer, captionStylePatch));
    setTemplateProject((project) =>
      project
        ? applyBrandKitToTemplateProject({
            project,
            brandName: brandLabel,
            brandKit: normalizedBrandKit,
            captionStylePatch,
          })
        : project,
    );
    setSelectedLayerId(brandBugLayer.id);
    selectEngineLayer(brandBugLayer.id);
    setAssistantMessages((messages) =>
      [
        createAssistantMessage(
          "assistant",
          `تم تطبيق هوية ${brandLabel}: الألوان والكابشن وطبقة البراند أصبحت عناصر قابلة للتعديل داخل التايملاين.`,
        ),
        ...messages,
      ].slice(0, 12),
    );
    setProjectStatus("Brand kit applied to editable timeline");
  }

  function getActiveCaptionStylePatch() {
    return getCaptionStylePatch(captionTemplate, aspectRatio, brandKit.primaryColor);
  }

  function updateCaption(id: string, text: string) {
    const nextCaptions = captions.map((caption) => (caption.id === id ? { ...caption, text } : caption));
    setCaptions(nextCaptions);
    syncCaptionTextToTimeline(id, text, nextCaptions);
    clearRenderedOutput();
  }

  function updateCaptionTiming(id: string, patch: Pick<CaptionLine, "start" | "end">) {
    const nextCaptions = captions.map((caption) => {
      if (caption.id !== id) return caption;

      const nextStart = clampCaptionTime(patch.start);
      const nextEnd = Math.max(nextStart + 0.2, clampCaptionTime(patch.end));

      return {
        ...caption,
        start: roundTimelineSeconds(nextStart),
        end: roundTimelineSeconds(nextEnd),
      };
    });

    setCaptions(nextCaptions);
    syncCaptionTimingToTimeline(id, nextCaptions);
    clearRenderedOutput();
  }

  function addManualCaption() {
    const start = roundTimelineSeconds(Math.max(0, previewTime || captions.at(-1)?.end || 0));
    const caption: CaptionLine = {
      id: createLayerId("manual-cap"),
      start,
      end: roundTimelineSeconds(start + 3),
      text: "اكتب الكابشن هنا",
    };
    const nextCaptions = [...captions, caption].sort((left, right) => left.start - right.start);

    setCaptions(nextCaptions);
    setTranscriptionMode(null);
    setTranscriptionNotice("Manual caption added. Edit text and timing, then export SRT or burn it in.");
    syncCaptionListToTimeline(nextCaptions, "Manual caption added", captionLayerId(caption.id));
    setActivePanel("captions");
    clearRenderedOutput();
  }

  function deleteCaption(id: string) {
    const nextCaptions = captions.filter((caption) => caption.id !== id);

    setCaptions(nextCaptions);
    syncCaptionListToTimeline(nextCaptions, "Caption deleted");
    clearRenderedOutput();
  }

  function syncCaptionListToTimeline(nextCaptions: CaptionLine[], status: string, selectedCaptionLayerId?: string) {
    const targetDuration = Math.max(
      studioFile?.durationSeconds ?? 0,
      templateProject?.duration ?? 0,
      totalTimelineSeconds,
      ...nextCaptions.map((caption) => caption.end),
    );

    commitTimeline((tracks) => ensureCaptionLayer(tracks, nextCaptions, targetDuration, getActiveCaptionStylePatch()));
    if (selectedCaptionLayerId) {
      setSelectedLayerId(selectedCaptionLayerId);
      selectEngineLayer(selectedCaptionLayerId);
    }
    setProjectStatus(status);
  }

  function syncCaptionTextToTimeline(id: string, text: string, nextCaptions: CaptionLine[]) {
    let didUpdate = false;

    const nextTracks = timelineTracks.map((track) => {
      if (track.kind !== "caption") return track;

      return {
        ...track,
        layers: track.layers.map((layer) => {
          if (layer.id !== captionLayerId(id)) return layer;
          didUpdate = true;
          return {
            ...layer,
            content: text,
            name: text.trim() ? text : layer.name,
          };
        }),
      };
    });

    commitTimeline(
      didUpdate
        ? nextTracks
        : ensureCaptionLayer(
            nextTracks,
            nextCaptions,
            studioFile?.durationSeconds ?? totalTimelineSeconds,
            getActiveCaptionStylePatch(),
          ),
    );
    setProjectStatus("Caption text synced to timeline");
  }

  function syncCaptionTimingToTimeline(id: string, nextCaptions: CaptionLine[]) {
    const nextCaption = nextCaptions.find((caption) => caption.id === id);
    if (!nextCaption) return;

    let didUpdate = false;
    const nextTracks = timelineTracks.map((track) => {
      if (track.kind !== "caption") return track;

      return {
        ...track,
        layers: track.layers.map((layer) => {
          if (layer.id !== captionLayerId(id)) return layer;
          didUpdate = true;
          return {
            ...layer,
            start: nextCaption.start,
            duration: Math.max(0.2, nextCaption.end - nextCaption.start),
          };
        }),
      };
    });

    commitTimeline(
      didUpdate
        ? nextTracks
        : ensureCaptionLayer(
            nextTracks,
            nextCaptions,
            studioFile?.durationSeconds ?? totalTimelineSeconds,
            getActiveCaptionStylePatch(),
          ),
    );
    setProjectStatus("Caption timing synced to timeline");
  }

  function downloadSrt() {
    const srt = captions
      .map(
        (caption, index) =>
          `${index + 1}\n${secondsToSrt(caption.start)} --> ${secondsToSrt(caption.end)}\n${caption.text}\n`,
      )
      .join("\n");
    const blob = new Blob([srt], { type: "text/plain;charset=utf-8" });
    const durationSeconds = Math.max(1, Math.round(Math.max(0, ...captions.map((caption) => caption.end))));
    const result: BrowserRenderResult = {
      blob,
      url: URL.createObjectURL(blob),
      fileName: "mawj-captions.srt",
      mimeType: "text/plain;charset=utf-8",
      durationSeconds,
      resolution: "SRT subtitles",
      textPreview: srt.slice(0, 4000),
    };

    setRenderResult(result);
    persistExportResult(result, `${brandName || BRAND.displayName} captions`);
    setProjectStatus("SRT captions export ready");
    setActivePanel("exports");
  }

  async function exportThumbnail() {
    if (!studioFile && !templateProject) {
      setError("افتح فيديو أو قالب قبل تصدير الصورة المصغرة.");
      return;
    }

    setError("");
    setProjectStatus("Preparing thumbnail...");

    try {
      if (templateProject) {
        const thumbnail = await renderTemplateProjectThumbnail({
          project: templateProject,
          time: previewTime,
        });
        const result: BrowserRenderResult = {
          blob: thumbnail.blob,
          url: thumbnail.url,
          fileName: thumbnail.fileName,
          mimeType: "image/png",
          durationSeconds: 1,
          resolution: thumbnail.resolution,
        };
        setRenderResult(result);
        persistExportResult(result, `${templateProject.name} thumbnail`);
        setProjectStatus(`Thumbnail exported: ${thumbnail.resolution}`);
        setActivePanel("exports");
        return;
      }

      if (!studioFile) return;

      const blob = await createSourceVideoThumbnail({
        sourceUrl: studioFile.url,
        time: previewTime,
        aspectRatio,
      });
      const result: BrowserRenderResult = {
        blob,
        url: URL.createObjectURL(blob),
        fileName: `${withoutFileExtension(studioFile.file.name)}-thumbnail.png`,
        mimeType: "image/png",
        durationSeconds: 1,
        resolution: getThumbnailResolutionLabel(aspectRatio),
      };
      setRenderResult(result);
      persistExportResult(result, `${brandName || BRAND.displayName} thumbnail`);
      setProjectStatus("Thumbnail exported from current preview frame");
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not export thumbnail.");
    }
  }

  async function exportMp3() {
    const source = getDerivedExportSource(renderResult, studioFile, "audio");
    const sourceBlob = source?.blob ?? null;
    const sourceName = source?.fileName ?? "mawj-video.mp4";
    const outputSeconds = Math.max(
      1,
      renderResult?.durationSeconds ?? studioFile?.durationSeconds ?? templateProject?.duration ?? totalTimelineSeconds,
    );

    if (!sourceBlob) {
      setError("ارفع فيديو أو صدّر ملف فيديو أولاً قبل استخراج MP3.");
      return;
    }

    setIsRendering(true);
    setError("");
    setProjectStatus("Extracting MP3 audio...");
    clearRenderedOutput();
    setRenderProgress({
      percent: 0,
      label: "Preparing MP3 export",
      elapsedSeconds: 0,
      outputSeconds,
    });

    try {
      const blob = await extractAudioMp3WithFFmpeg(sourceBlob, sourceName, (percent) => {
        setRenderProgress({
          percent,
          label: "Extracting MP3 audio",
          elapsedSeconds: Math.round((percent / 100) * outputSeconds),
          outputSeconds,
        });
      });
      const url = URL.createObjectURL(blob);
      const result: BrowserRenderResult = {
        blob,
        url,
        fileName: `${withoutFileExtension(sourceName)}-audio.mp3`,
        mimeType: "audio/mpeg",
        durationSeconds: Math.round(outputSeconds),
        resolution: "MP3 · 192 kbps",
      };
      setRenderResult(result);
      persistExportResult(result, `${brandName || BRAND.displayName} audio`);
      setProjectStatus("MP3 audio export ready");
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not extract MP3 audio.");
    } finally {
      setIsRendering(false);
    }
  }

  async function exportGif() {
    const source = getDerivedExportSource(renderResult, studioFile, "video");
    const sourceBlob = source?.blob ?? null;
    const sourceName = source?.fileName ?? "mawj-video.mp4";
    const outputSeconds = Math.max(
      1,
      Math.min(8, renderResult?.durationSeconds ?? studioFile?.durationSeconds ?? templateProject?.duration ?? totalTimelineSeconds),
    );

    if (!sourceBlob) {
      setError("ارفع فيديو أو صدّر ملف فيديو أولاً قبل إنشاء GIF.");
      return;
    }

    setIsRendering(true);
    setError("");
    setProjectStatus("Creating GIF preview...");
    clearRenderedOutput();
    setRenderProgress({
      percent: 0,
      label: "Preparing GIF export",
      elapsedSeconds: 0,
      outputSeconds,
    });

    try {
      const blob = await convertVideoToGifWithFFmpeg(
        sourceBlob,
        sourceName,
        {
          durationSeconds: outputSeconds,
          fps: 12,
          width: aspectRatio === "16:9" ? 640 : 480,
        },
        (percent) => {
          setRenderProgress({
            percent,
            label: "Rendering GIF preview",
            elapsedSeconds: Math.round((percent / 100) * outputSeconds),
            outputSeconds,
          });
        },
      );
      const url = URL.createObjectURL(blob);
      const result: BrowserRenderResult = {
        blob,
        url,
        fileName: `${withoutFileExtension(sourceName)}-preview.gif`,
        mimeType: "image/gif",
        durationSeconds: Math.round(outputSeconds),
        resolution: aspectRatio === "16:9" ? "GIF · 640px wide" : "GIF · 480px wide",
      };
      setRenderResult(result);
      persistExportResult(result, `${brandName || BRAND.displayName} GIF`);
      setProjectStatus("GIF preview export ready");
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create GIF preview.");
    } finally {
      setIsRendering(false);
    }
  }

  async function importSrtFile(file: File) {
    try {
      const text = await file.text();
      const importedCaptions = parseSrtCaptions(text);

      if (!importedCaptions.length) {
        setError("ملف SRT لا يحتوي على كابشن صالح.");
        return;
      }

      const targetDuration = Math.max(
        studioFile?.durationSeconds ?? 0,
        templateProject?.duration ?? 0,
        totalTimelineSeconds,
        ...importedCaptions.map((caption) => caption.end),
      );

      setCaptions(importedCaptions);
      setTranscript(importedCaptions.map(captionToTranscriptSegment));
      setTranscriptionMode(null);
      setTranscriptionNotice(`${file.name} imported as editable captions.`);
      setActivePanel("captions");
      clearRenderedOutput();
      commitTimeline((tracks) =>
        ensureCaptionLayer(tracks, importedCaptions, targetDuration, getActiveCaptionStylePatch()),
      );
      setProjectStatus(`${importedCaptions.length} SRT captions imported and synced to timeline`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not import this SRT file.");
    }
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
    await Promise.all([loadProjects(), loadExportHistory()]);
    setProjectStatus("Dashboard refreshed");
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
    commitTimeline((tracks) =>
      ensureCaptionLayer(
        applyTemplateToTimeline(tracks, template, durationSeconds),
        templateCaptions,
        durationSeconds,
        getCaptionStylePatch(template.captionTemplate, template.aspectRatio, brandKit.primaryColor),
      ),
    );
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

  function saveCurrentProjectAsCustomTemplate() {
    const customTemplate = createCustomTemplateFromTimeline({
      tracks: timelineTracksRef.current,
      brandName,
      brandKit,
      aspectRatio,
      durationSeconds: Math.max(1, studioFile?.durationSeconds ?? 0, templateProject?.duration ?? 0, totalTimelineSeconds),
    });

    storeCustomVideoTemplate(customTemplate);
    setActiveTemplateId(customTemplate.id);
    setProjectStatus(`${customTemplate.name} saved to your custom templates`);
    setAssistantMessages((messages) =>
      [
        createAssistantMessage(
          "assistant",
          `تم حفظ المشروع كقالب مخصص: ${customTemplate.name}. افتح /templates واختر فلتر "قوالبي" لاستخدامه كـ Template Engine قابل للتعديل.`,
        ),
        ...messages,
      ].slice(0, 12),
    );
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
    const variantCaptions = adVariantToCaptions(variant);
    setCaptions(variantCaptions);
    setPlan(
      createAdCampaignEditPlan({
        campaign,
        variant,
        brandName,
        aspectRatio,
      }),
    );
    commitTimeline((tracks) =>
      ensureCaptionLayer(
        applyAdVariantToTimeline(tracks, variant),
        variantCaptions,
        variant.durationSeconds,
        getCaptionStylePatch("Offer Pop", aspectRatio, brandKit.primaryColor),
      ),
    );
    setActivePanel("editor");
  }

  function ensureRequiredLocalActions(
    command: string,
    actions: AICommandAction[],
    context: AICommandContext,
  ) {
    const local = resolveLocalAICommand(command, context);
    const mustCreateStoryboard = local.actions.some((action) => action.type === "CREATE_IMAGE_STORYBOARD");

    if (!mustCreateStoryboard || actions.some((action) => action.type === "CREATE_IMAGE_STORYBOARD")) {
      return actions;
    }

    return [
      local.actions.find((action) => action.type === "CREATE_IMAGE_STORYBOARD")!,
      ...actions,
    ].slice(0, 5);
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

      const actions = ensureRequiredLocalActions(command, data.actions, context);
      await executeAssistantActions(actions);
      setAssistantEngineState({
        engine: data.engine,
        confidence: data.confidence,
        targetCut: data.targetCut,
        mode: data.mode,
      });
      setAssistantMessages((messages) => [
        createAssistantMessage("assistant", data.message, actions),
        ...messages,
      ].slice(0, 12));
      setProjectStatus(`AI assistant executed ${actions.length} action${actions.length === 1 ? "" : "s"}`);
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

      if (action.type === "CREATE_IMAGE_STORYBOARD") {
        await generateImageStoryboard(mediaAssets.filter((asset) => asset.kind === "image"));
      }

      if (action.type === "ADD_ARABIC_CAPTIONS") {
        if (studioFile) {
          await transcribeVideo();
        } else if (templateProject || plan) {
          generateCaptionsFromTranscript();
          setActivePanel("captions");
          setProjectStatus("Captions created from the current editable storyboard");
        } else if (mediaAssets.some((asset) => asset.kind === "image")) {
          await generateImageStoryboard(mediaAssets.filter((asset) => asset.kind === "image"));
        } else {
          setError("ارفع فيديو للصوت أو صور عشان أنشئ كابشن مناسب.");
        }
      }

      if (action.type === "REMOVE_SILENCE") {
        removeLongPauses();
        setActivePanel("transcript");
      }

      if (action.type === "EXTRACT_CLIPS") {
        handleAiAction("shorts");
        handleAiAction("moments");
        setActivePanel("editor");
      }

      if (action.type === "IMPROVE_AUDIO") {
        applyAudioEnhancementChain();
        setActivePanel("audio");
        setAssistantMessages((messages) =>
          [
            createAssistantMessage(
              "assistant",
              "فعّلت سلسلة تحسين الصوت داخل المشروع: Noise reduction + Voice enhancement + Echo reduction + Auto volume leveling. مرحلة المعالجة العميقة على الخادم ستأتي لاحقًا، لكن التايملاين الآن يحمل إعدادات الصوت بوضوح.",
              [action],
            ),
            ...messages,
          ].slice(0, 12),
        );
      }

      if (action.type === "REMOVE_BACKGROUND") {
        applyBackgroundReplacement("Blur original video");
        setActivePanel("background");
        setAssistantMessages((messages) =>
          [
            createAssistantMessage(
              "assistant",
              "طبقت خلفية Blur original video على المعاينة والتصدير. الإزالة الدقيقة للشخص بخادم AI ستأتي لاحقًا، لكن الخلفية الآن تأثير فعلي وليس زر صوري.",
              [action],
            ),
            ...messages,
          ].slice(0, 12),
        );
      }

      if (action.type === "CREATE_AD_VERSION") {
        setActivePanel("ad-maker");
        await generateAdVersion();
      }

      if (action.type === "APPLY_PRO_STYLE") {
        setStyleId("premium-brand");
        applyCaptionTemplate("Luxury Minimal");
        setActivePanel("brand");
      }

      if (action.type === "ADD_TEXT_HOOK") {
        addTextLayer();
      }
    }
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="min-w-0 rounded-lg transition hover:opacity-90"
              title="الصفحة الرئيسية"
            >
              <BrandLockup size="sm" />
            </Link>
          </div>

          <div className="hidden items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 xl:flex">
            <StatusPill label="Upload" active={Boolean(studioFile || mediaAssets.length || templateProject)} />
            <StatusPill label="Timeline" active={timelineTracks.some((track) => track.layers.length)} />
            <StatusPill label="AI" active={Boolean(plan)} />
            <StatusPill label="Render" active={Boolean(renderResult)} />
          </div>

          <div className="flex items-center gap-2">
            <Link href="/templates" className="btn-ghost hidden sm:inline-flex">
              <LayoutTemplate className="h-4 w-4" aria-hidden="true" />
              <span>Templates</span>
            </Link>
            <button
              type="button"
              onClick={resetStudioProject}
              className="icon-button"
              aria-label="New empty project"
              title="New empty project"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
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
              className="btn-ghost"
            >
              {isGenerating || isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <WandSparkles className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {isUploading ? "Saving" : isGenerating ? "Generating…" : "Generate"}
              </span>
            </button>
            <button
              type="button"
              onClick={renderVideo}
              disabled={(!studioFile && !templateProject) || isRendering || isGenerating || isUploading}
              className="btn-brand"
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
                      className="nav-btn"
                    >
                      <Icon className="nav-btn-icon h-4 w-4 shrink-0" aria-hidden="true" />
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
                    className={`nav-btn w-full${active ? " active" : ""}`}
                  >
                    <Icon className="nav-btn-icon h-4 w-4 shrink-0" aria-hidden="true" />
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
              onChange={(event) => {
                void handleFiles(event.target.files ?? undefined);
                event.currentTarget.value = "";
              }}
            />
            <input
              ref={imageLayerInputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                void addImageLayerFromFiles(event.target.files ?? undefined);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDrop={(event) => {
                event.preventDefault();
                handleFiles(event.dataTransfer.files);
              }}
              onDragOver={(event) => event.preventDefault()}
              className="drop-zone mb-3 flex min-h-32 w-full flex-col items-center justify-center gap-2 p-4 text-center"
            >
              <UploadCloud className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
              <span className="text-sm font-black">Drag media here</span>
              <span className="text-xs font-semibold text-[var(--muted)]">Video · Audio · Images</span>
            </button>
            <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="rounded-lg border border-[var(--line)] bg-black/20 p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <MediaAssetPreview asset={asset} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black">{asset.name}</p>
                      <p className="text-[11px] font-semibold text-[var(--muted)]">
                        {asset.kind} · {formatBytes(asset.size)}
                        {asset.durationSeconds ? ` · ${formatDuration(asset.durationSeconds)}` : ""}
                        {asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}
                        {asset.persisted ? " · saved" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => addMediaAssetToTimeline(asset)}
                      className="toolbar-btn justify-center text-[11px]"
                    >
                      Timeline
                    </button>
                    {asset.kind === "video" ? (
                      <button
                        type="button"
                        onClick={() => selectVideoAssetAsSource(asset)}
                        className="toolbar-btn justify-center text-[11px]"
                      >
                        Preview
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addMediaAssetToTimeline(asset)}
                        className="toolbar-btn justify-center text-[11px]"
                      >
                        {asset.kind === "image" &&
                        !studioFile &&
                        (!templateProject || templateProject.templateId === "image-storyboard-generated")
                          ? "Open video"
                          : "Layer"}
                      </button>
                    )}
                    {(asset.kind === "video" || asset.kind === "audio") ? (
                      <button
                        type="button"
                        onClick={() => transcribeVideo(asset)}
                        disabled={isTranscribing}
                        className="btn-brand col-span-2 min-h-9 text-[11px]"
                      >
                        {isTranscribing ? "Captioning…" : "Auto-caption"}
                      </button>
                    ) : null}
                    {asset.kind === "image" ? (
                      <button
                        type="button"
                        onClick={() => generateImageStoryboard(mediaAssets.filter((item) => item.kind === "image"))}
                        disabled={isGenerating}
                        className="btn-brand col-span-2 min-h-9 text-[11px]"
                      >
                        {isGenerating ? "Making video…" : "Make video from images"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => deleteMediaAsset(asset)}
                      className="toolbar-btn danger col-span-2 justify-center text-[11px]"
                    >
                      Delete
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
              mediaCount={mediaAssets.length}
              exportCount={exportHistory.length}
              storageBytes={localStorageBytes}
              projectStatus={projectStatus}
              onRefresh={refreshProjectList}
              onUpdate={updateProjectRecord}
              onDelete={deleteProjectRecord}
            />
          ) : activePanel === "templates" ? (
            <TemplatesPanel
              activeTemplateId={activeTemplateId}
              onApply={applyTemplatePreset}
              onSaveCurrent={saveCurrentProjectAsCustomTemplate}
            />
          ) : activePanel === "collaboration" ? (
            <CollaborationPanel />
          ) : (
            <>
              <section className="panel overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ToolbarButton label="Undo" icon={Undo2} onClick={undoTimeline} disabled={!enginePastCount} />
                    <ToolbarButton label="Redo" icon={Redo2} onClick={redoTimeline} disabled={!engineFutureCount} />
                    <ToolbarButton label="Trim" icon={Scissors} onClick={trimSelectedLayer} />
                    <ToolbarButton label="Split" icon={Crop} onClick={splitSelectedLayer} />
                    <ToolbarButton label="Merge" icon={Layers3} onClick={mergeVideoLayers} />
                    <ToolbarButton label="Text" icon={Type} onClick={addTextLayer} />
                    <ToolbarButton label="Image" icon={ImageIcon} onClick={() => imageLayerInputRef.current?.click()} />
                    <ToolbarButton label="CTA" icon={Plus} onClick={addCtaLayer} />
                    <ToolbarButton label="Duplicate" icon={Copy} onClick={duplicateSelectedLayer} disabled={!selectedLayer} />
                    <ToolbarButton label="Forward" icon={BringToFront} onClick={moveSelectedLayerForward} disabled={!selectedLayer} />
                    <ToolbarButton label="Backward" icon={SendToBack} onClick={moveSelectedLayerBackward} disabled={!selectedLayer} />
                    <ToolbarButton label="Update" icon={Save} onClick={saveProjectSnapshot} />
                    <ToolbarButton
                      label={selectedLayer ? "Delete" : "Clear"}
                      icon={Trash2}
                      onClick={deleteSelectedLayer}
                      disabled={!selectedLayer && !templateProject}
                      tone="danger"
                    />
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
                    onClearTemplateProject={clearActiveTemplateProject}
                    timelineTracks={timelineTracks}
                    selectedLayerId={selectedLayerId}
                    onSelectLayer={selectTimelineLayer}
                    onUpdateLayerGeometry={updateTimelineLayerGeometry}
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
                onUpdateLayerTiming={updateTimelineLayerTiming}
              />
            </>
          )}
        </section>

        <aside className="space-y-4">
          <AssistantPanel
            command={assistantCommand}
            messages={assistantMessages}
            clipSuggestions={clipSuggestions}
            isRunning={isAssistantRunning}
            onCommandChange={setAssistantCommand}
            onRunCommand={runAssistantCommand}
            onExportClip={exportClipSuggestion}
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
      return (
        <AiStudioPanel
          plan={plan}
          mediaCount={mediaAssets.length}
          hasSource={Boolean(studioFile || templateProject)}
          isRunning={isAssistantRunning}
          onRunTool={runAiTool}
        />
      );
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
          onTemplateChange={applyCaptionTemplate}
          onCaptionChange={updateCaption}
          onCaptionTimingChange={updateCaptionTiming}
          onAddCaption={addManualCaption}
          onDeleteCaption={deleteCaption}
          onAutoTranscribe={() => transcribeVideo()}
          onImportSrt={(file) => void importSrtFile(file)}
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
          onApply={() => applyBackgroundReplacement(backgroundMode)}
        />
      );
    }

    if (activePanel === "audio") {
      return (
        <AudioPanel
          activeTools={activeAudioTools}
          onToggle={(tool) => setActiveAudioTools((tools) => ({ ...tools, [tool]: !tools[tool] }))}
          onApply={applyAudioEnhancementChain}
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
      return (
        <BrandKitPanel
          brandKit={brandKit}
          onChange={setBrandKit}
          brandName={brandName}
          onBrandNameChange={setBrandName}
          onApply={applyBrandKitToTimeline}
        />
      );
    }

    if (activePanel === "stock") {
      return (
        <StockMediaPanel
          onAddToTimeline={(asset) => void addExternalMediaAssetToTimeline(asset)}
          onAddToMediaBin={(asset) => void saveExternalMediaAsset(asset)}
        />
      );
    }

    if (activePanel === "exports") {
      return (
        <ExportsPanel
          tier={exportTier}
          format={exportFormat}
          renderResult={renderResult}
          renderProgress={renderProgress}
          exportHistory={exportHistory}
          isRendering={isRendering}
          aspectRatio={aspectRatio}
          onTierChange={setExportTier}
          onFormatChange={setExportFormat}
          onRender={renderVideo}
          onDownloadSrt={downloadSrt}
          onExportThumbnail={exportThumbnail}
          onExportMp3={exportMp3}
          onExportGif={exportGif}
          onRefreshHistory={() => void loadExportHistory()}
          onDeleteHistoryItem={deleteExportHistoryItem}
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
        <LayerInspector
          layer={selectedLayer}
          onChange={updateSelectedLayer}
          onAlign={alignSelectedLayer}
          onDelete={deleteSelectedLayer}
        />
      </>
    );
  }

  function handleAiAction(actionId: string) {
    if (actionId === "shorts") {
      const total = Math.max(1, studioFile?.durationSeconds ?? totalTimelineSeconds);
      const suggestions = createClipSuggestions({ total, plan, transcript });
      setClipSuggestions(suggestions);

      const clips: TimelineLayer[] = suggestions.map((clip, index) => ({
        id: clip.id,
        type: "effect" as const,
        name: `${clip.label} · ${formatDuration(clip.start)}–${formatDuration(clip.end)}`,
        start: clip.start,
        duration: clip.duration,
        color: index === 0 ? "#8ef7c2" : index === 1 ? "#a78bfa" : "#fbbf24",
      }));

      commitTimeline((tracks) =>
        tracks.map((track) =>
          track.kind === "effects"
            ? {
                ...track,
                layers: [
                  ...track.layers.filter((layer) => !layer.id.startsWith("clip-")),
                  ...clips,
                ],
              }
            : track,
        ),
      );
      const summary = suggestions
        .map((clip) => `${formatDuration(clip.start)}-${formatDuration(clip.end)} (${clip.label})`)
        .join("، ");
      setProjectStatus(`تم تحديد ${suggestions.length} مقاطع: ${summary}`);
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            `تم تحديد ${suggestions.length} مقاطع:\n${suggestions
              .map((clip) => `• ${formatDuration(clip.start)}-${formatDuration(clip.end)} ثانية (${clip.label})`)
              .join("\n")}\n\nتقدر تصدر أي نسخة مباشرة من أزرار Ready clips في لوحة المساعد.`,
            [{ type: "EXTRACT_CLIPS", label: "3 clip ranges prepared" }],
          ),
          ...messages,
        ].slice(0, 12),
      );
    }

    if (actionId === "titles") {
      // Use real plan/transcript data when available
      const baseTitle = plan?.title ?? (transcript.length ? transcript[0].text.slice(0, 60).trim() : null);
      const hook = plan?.hook ?? null;
      const platformTag =
        platform === "tiktok" ? "#تيك_توك"
        : platform === "instagram" ? "#ريلز"
        : platform === "shorts" ? "#شورتس"
        : "#سوشال";

      const titles = baseTitle
        ? [
            baseTitle,
            hook ?? `لا تفوّت هذا المقطع`,
            `${baseTitle.slice(0, 36)} | جرب هذا`,
          ]
        : [
            "لا تكمل قبل ما تشوف هذا المقطع كاملاً",
            "الطريقة الأسرع لتحويل فيديو عادي لمحتوى يشد الانتباه",
            "ارفع الفيديو واضغط Generate للحصول على عناوين مخصصة",
          ];

      const hashtags = `#صناعة_المحتوى #مونتاج #محتوى_رقمي ${platformTag} #موج_ستوديو`;

      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            `عناوين مقترحة${baseTitle ? "" : " (ارفع فيديو للحصول على عناوين مخصصة)"}:\n• ${titles.join("\n• ")}\n\nهاشتاقات: ${hashtags}`,
          ),
          ...messages,
        ].slice(0, 12),
      );
    }

    if (actionId === "summary") {
      const summaryText = plan
        ? `الفيديو: "${plan.title}". المدة المقترحة ${plan.targetDurationSeconds}s. الـ Hook: "${plan.hook}". الخلاصة: ${plan.summary}`
        : transcript.length
          ? `المحتوى يغطي: "${transcript
              .slice(0, 2)
              .map((s) => s.text)
              .join(" ")
              .slice(0, 140)}..."\n\nالزاوية الأقوى: تحويل سريع مع كابشن عربي واضح ودعوة مباشرة للتفاعل.`
          : `ارفع فيديو أو صور ثم اضغط Generate لتحليل المحتوى واقتراح أفضل زاوية للمنصة.`;

      setAssistantMessages((messages) =>
        [createAssistantMessage("assistant", summaryText), ...messages].slice(0, 12),
      );
    }

    if (actionId === "moments") {
      const total = Math.max(15, studioFile?.durationSeconds ?? totalTimelineSeconds);

      // Derive moment timestamps from plan timeline, transcript, or duration estimates
      let hookEnd: number;
      let valueStart: number;
      let valueEnd: number;
      let ctaStart: number;

      if (plan?.timeline?.length) {
        const hookItem = plan.timeline[0];
        hookEnd = hookItem.end ?? Math.min(4, total * 0.15);

        const valueItem =
          plan.timeline.find((t) => t.intensity === "high" && t.start > hookEnd) ??
          plan.timeline[1] ??
          null;
        valueStart = valueItem?.start ?? hookEnd;
        valueEnd = valueItem?.end ?? Math.min(valueStart + 10, total * 0.75);

        const ctaItem = plan.timeline.at(-1);
        ctaStart = ctaItem?.start ?? Math.max(hookEnd + 5, total - 6);
      } else if (transcript.length) {
        const sorted = [...transcript].sort((a, b) => a.start - b.start);
        hookEnd = sorted[0]?.end ?? Math.min(3, total * 0.1);
        valueStart = hookEnd;
        valueEnd = sorted[Math.min(2, sorted.length - 1)]?.end ?? Math.min(hookEnd + 10, total * 0.7);
        ctaStart = sorted.at(-1)?.start ?? Math.max(hookEnd + 5, total - 6);
      } else {
        hookEnd = Math.min(3, total * 0.12);
        valueStart = hookEnd;
        valueEnd = Math.min(hookEnd + 10, total * 0.7);
        ctaStart = Math.max(hookEnd + 5, total - 6);
      }

      const momentLayers: TimelineLayer[] = [
        {
          id: crypto.randomUUID(),
          type: "effect" as const,
          name: `Hook 0–${formatDuration(hookEnd)}`,
          start: 0,
          duration: Math.max(1, hookEnd),
          color: "#fbbf24",
        },
        {
          id: crypto.randomUUID(),
          type: "effect" as const,
          name: `Value ${formatDuration(valueStart)}–${formatDuration(valueEnd)}`,
          start: valueStart,
          duration: Math.max(1, valueEnd - valueStart),
          color: "#8ef7c2",
        },
        {
          id: crypto.randomUUID(),
          type: "effect" as const,
          name: `CTA ${formatDuration(ctaStart)}`,
          start: ctaStart,
          duration: Math.max(2, total - ctaStart),
          color: "#a78bfa",
        },
      ].filter((layer) => layer.start >= 0 && layer.start < total && layer.duration > 0);

      commitTimeline((tracks) =>
        tracks.map((track) =>
          track.kind === "effects"
            ? { ...track, layers: [...track.layers, ...momentLayers] }
            : track,
        ),
      );

      const source = plan ? "AI plan" : transcript.length ? "transcript" : "duration estimate";
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            `أفضل اللحظات (من ${source}):\n• Hook 0–${formatDuration(hookEnd)} — اجذب الانتباه\n• Value ${formatDuration(valueStart)}–${formatDuration(valueEnd)} — القيمة الأساسية\n• CTA ${formatDuration(ctaStart)}+ — دعوة للتفاعل\n\nتم تمييزها على الـ timeline.`,
            [{ type: "EXTRACT_CLIPS", label: `Moments marked from ${source}` }],
          ),
          ...messages,
        ].slice(0, 12),
      );
    }
  }

  async function runAiTool(tool: AiToolItem) {
    const imageAssets = mediaAssets.filter((asset) => asset.kind === "image");
    const hasAnyMedia = Boolean(studioFile ?? mediaAssets.length ?? templateProject);

    // Guard: tools that require media show a helpful message instead of failing silently
    if (tool.needsMedia && !hasAnyMedia) {
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            `${tool.title}: ارفع فيديو أو صوت أو صور أولاً لتفعيل هذه الأداة.`,
          ),
          ...messages,
        ].slice(0, 12),
      );
      setActivePanel("editor");
      return;
    }

    if (tool.id === "idea-to-video" && !studioFile && imageAssets.length) {
      setPlatform("tiktok");
      setAspectRatio("9:16");
      setStyleId("viral-saudi");
      await generateImageStoryboard(imageAssets);
      return;
    }

    if (tool.id === "magic-clips" && !studioFile && imageAssets.length && !templateProject) {
      await generateImageStoryboard(imageAssets);
      return;
    }

    if (tool.id === "auto-captions") {
      if (studioFile) {
        await transcribeVideo();
        return;
      }

      if (imageAssets.length && !templateProject) {
        await generateImageStoryboard(imageAssets);
        return;
      }

      generateCaptionsFromTranscript();
      setActivePanel("captions");
      setProjectStatus("Captions created for the editable project");
      return;
    }

    if (tool.id === "dynamic-captions") {
      generateCaptionsFromTranscript();
      applyCaptionTemplate("Karaoke Yellow");
      setActivePanel("captions");
      setProjectStatus("Dynamic caption style applied");
      return;
    }

    if (tool.id === "clean-audio") {
      setActivePanel("audio");
      setProjectStatus("ميزة تحسين الصوت تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro.");
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            "ميزة تحسين الصوت تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro. فتحت لك لوحة الصوت للتحكم اليدوي الحالي.",
          ),
          ...messages,
        ].slice(0, 12),
      );
      return;
    }

    if (tool.id === "remove-silence") {
      removeLongPauses();
      setActivePanel("transcript");
      return;
    }

    if (tool.id === "social-resize") {
      setPlatform("tiktok");
      setAspectRatio("9:16");
      setStyleId("viral-saudi");
      applyCaptionTemplate("Saudi Viral Bold", "9:16");
      setProjectStatus("Project resized for TikTok/Reels/Shorts safe margins");
      return;
    }

    if (tool.id === "remove-background") {
      setActivePanel("background");
      setProjectStatus("ميزة إزالة الخلفية تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro.");
      setAssistantMessages((messages) =>
        [
          createAssistantMessage(
            "assistant",
            "ميزة إزالة الخلفية من الفيديو تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro. فتحت لك لوحة الخلفية للتجهيز اليدوي.",
          ),
          ...messages,
        ].slice(0, 12),
      );
      return;
    }

    // Open the panel first so the user sees the destination
    if (tool.openPanel) {
      setActivePanel(tool.openPanel);
    }

    // actionId takes priority over command to avoid duplicate timeline writes
    if (tool.actionId) {
      handleAiAction(tool.actionId);
      return;
    }

    // Command fallback: run through the full AI assistant pipeline
    if (tool.command) {
      await runAssistantCommand(tool.command);
      return;
    }

    setProjectStatus(`${tool.title} ready`);
  }
}

function createCustomTemplateFromTimeline({
  tracks,
  brandName,
  brandKit,
  aspectRatio,
  durationSeconds,
}: {
  tracks: TimelineTrack[];
  brandName: string;
  brandKit: BrandKitState;
  aspectRatio: AspectRatio;
  durationSeconds: number;
}): VideoTemplate {
  const normalizedBrandKit = normalizeBrandKit(brandKit);
  const dimensions = getTemplateDimensions(aspectRatio);
  const safeMargins = getStoryboardSafeMargins(aspectRatio);
  const templateName = `${brandName.trim() || BRAND.displayName} Custom Template`;
  const requiredInputs: VideoTemplateInput[] = [
    {
      key: "brandName",
      label: "Brand Name",
      type: "text",
      default: brandName.trim() || BRAND.displayName,
    },
    {
      key: "brandColor",
      label: "Brand Color",
      type: "color",
      default: normalizedBrandKit.primaryColor,
    },
    {
      key: "accentColor",
      label: "Accent Color",
      type: "color",
      default: normalizedBrandKit.secondaryColor,
    },
  ];
  const layers = timelineTracksToCustomTemplateLayers(tracks, requiredInputs);
  const duration = Math.max(6, Math.min(120, Math.round(durationSeconds || 18)));

  return {
    id: `custom-${slugifyTemplateId(templateName)}-${Date.now()}`,
    name: templateName,
    category: "Custom Templates",
    aspectRatio,
    width: dimensions.width,
    height: dimensions.height,
    duration,
    description: `Saved from Mawj Studio timeline with ${layers.length} editable layer${layers.length === 1 ? "" : "s"}.`,
    language: "mixed",
    requiredInputs,
    scenes: [
      {
        id: "custom-scene-1",
        name: "Saved editable scene",
        start: 0,
        duration,
        background: {
          type: "gradient",
          from: "{{brandColor}}",
          to: "{{accentColor}}",
        },
        layers,
        transition: {
          type: "fade",
          duration: 0.35,
        },
      },
    ],
    animations: ["fadeIn", "slideUp", "zoomIn", "pop"],
    transitions: ["cut", "fade"],
    audio: {
      music: null,
      volume: 1,
    },
    export: {
      format: "mp4",
      fps: 30,
      quality: "1080p",
    },
    safeMargins,
    thumbnailUrl: "",
    previewUrl: "",
  };
}

function timelineTracksToCustomTemplateLayers(
  tracks: TimelineTrack[],
  requiredInputs: VideoTemplateInput[],
): TemplateLayer[] {
  const counters = { text: 0, media: 0 };
  return tracks
    .flatMap((track) => track.layers)
    .filter((layer) => layer.duration > 0)
    .filter((layer) => layer.type !== "effect" && layer.type !== "audio")
    .sort((left, right) => left.start - right.start || layerZOrder(left.type) - layerZOrder(right.type))
    .slice(0, 24)
    .map((layer) => timelineLayerToCustomTemplateLayer(layer, counters, requiredInputs))
    .filter((layer): layer is TemplateLayer => Boolean(layer));
}

function timelineLayerToCustomTemplateLayer(
  layer: TimelineLayer,
  counters: { text: number; media: number },
  requiredInputs: VideoTemplateInput[],
): TemplateLayer | null {
  const baseLayer = {
    id: sanitizeTemplateLayerId(layer.id),
    name: layer.name,
    start: roundTimelineSeconds(Math.max(0, layer.start)),
    duration: roundTimelineSeconds(Math.max(0.4, layer.duration)),
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    borderRadius: layer.borderRadius,
    opacity: layer.opacity,
    editable: true,
  };

  if (layer.type === "text" || layer.type === "caption") {
    const isBrandLayer = layer.id === "brand-kit-bug";
    const inputKey = isBrandLayer ? "brandName" : `${layer.type === "caption" ? "caption" : "text"}${++counters.text}`;
    if (!isBrandLayer) {
      requiredInputs.push({
        key: inputKey,
        label: layer.name || `Text ${counters.text}`,
        type: "textarea",
        default: layer.content || layer.name,
      });
    }

    return {
      ...baseLayer,
      id: `${baseLayer.id || layer.type}-${inputKey}`,
      type: layer.type === "caption" ? "captions" : "text",
      content: `{{${inputKey}}}`,
      color: layer.textColor ?? layer.color ?? "#ffffff",
      backgroundColor: layer.type === "caption" ? "{{brandColor}}" : layer.backgroundColor,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      align: "center",
      direction: "auto",
      animationIn: {
        type: layer.type === "caption" ? "pop" : "slideUp",
        duration: 0.45,
      },
    };
  }

  if (layer.type === "image" || layer.type === "video") {
    const inputKey = `${layer.type}${++counters.media}`;
    const defaultSource = layer.src && !layer.src.startsWith("blob:") && !layer.src.startsWith("data:") ? layer.src : undefined;
    requiredInputs.push({
      key: inputKey,
      label: layer.name || `${layer.type} ${counters.media}`,
      type: layer.type,
      default: defaultSource,
    });

    return {
      ...baseLayer,
      type: layer.type,
      src: `{{${inputKey}}}`,
      fit: layer.fit ?? (layer.type === "video" ? "cover" : "contain"),
      animationIn: {
        type: layer.type === "video" ? "fadeIn" : "zoomIn",
        duration: 0.55,
      },
    };
  }

  if (layer.type === "shape") {
    return {
      ...baseLayer,
      type: "shape",
      shape: "rect",
      color: "{{accentColor}}",
      backgroundColor: "{{accentColor}}",
      animationIn: {
        type: "pop",
        duration: 0.4,
      },
    };
  }

  if (layer.type === "background") {
    return {
      ...baseLayer,
      type: "background",
      color: "{{brandColor}}",
      backgroundColor: "{{brandColor}}",
      gradientFrom: "{{brandColor}}",
      gradientTo: "{{accentColor}}",
    };
  }

  if (layer.type === "waveform") {
    return {
      ...baseLayer,
      type: "waveform",
      color: "{{accentColor}}",
      backgroundColor: "rgba(255,255,255,0.08)",
    };
  }

  return null;
}

function layerZOrder(type: TimelineLayer["type"]) {
  const order: Record<TimelineLayer["type"], number> = {
    background: 0,
    video: 1,
    image: 2,
    shape: 3,
    text: 4,
    caption: 5,
    waveform: 6,
    audio: 7,
    effect: 8,
  };

  return order[type] ?? 9;
}

function sanitizeTemplateLayerId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "layer";
}

function slugifyTemplateId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "mawj-template";
}

type StoredBrandIdentity = {
  brandName?: string;
  brandKit?: BrandKitState;
};

function getStoredBrandIdentity(): StoredBrandIdentity | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BRAND_KIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredBrandIdentity;
    return {
      brandName: typeof parsed.brandName === "string" ? parsed.brandName : undefined,
      brandKit: parsed.brandKit ? normalizeBrandKit(parsed.brandKit) : undefined,
    };
  } catch {
    return null;
  }
}

function persistStoredBrandIdentity(identity: StoredBrandIdentity) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRAND_KIT_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Local persistence should not block editing.
  }
}

function normalizeBrandKit(brandKit: BrandKitState): BrandKitState {
  return {
    ...DEFAULT_BRAND_KIT,
    ...brandKit,
    primaryColor: normalizeBrandColor(brandKit.primaryColor, DEFAULT_BRAND_KIT.primaryColor),
    secondaryColor: normalizeBrandColor(brandKit.secondaryColor, DEFAULT_BRAND_KIT.secondaryColor),
    font: brandKit.font.trim() || DEFAULT_BRAND_KIT.font,
    captionStyle: brandKit.captionStyle.trim() || DEFAULT_BRAND_KIT.captionStyle,
  };
}

function normalizeBrandColor(value: string | undefined, fallback: string) {
  if (!value || value.includes("{{") || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value;
}

function applyBrandKitToEditorTracks(
  tracks: TimelineTrack[],
  brandKit: BrandKitState,
  brandBugLayer: TimelineLayer,
  captionStylePatch: Partial<TimelineLayer>,
): TimelineTrack[] {
  let hasOverlayTrack = false;

  const nextTracks = tracks.map((track) => {
    const styledLayers = track.layers
      .filter((layer) => layer.id !== brandBugLayer.id)
      .map((layer) => applyBrandKitToEditorLayer(layer, brandKit, captionStylePatch));

    if (track.kind !== "overlay") {
      return { ...track, layers: styledLayers };
    }

    hasOverlayTrack = true;
    return {
      ...track,
      layers: [...styledLayers, brandBugLayer],
    };
  });

  if (hasOverlayTrack) return nextTracks;

  return [
    ...nextTracks,
    {
      id: "track-brand-kit",
      name: "Brand Kit",
      kind: "overlay",
      layers: [brandBugLayer],
    },
  ];
}

function applyBrandKitToEditorLayer(
  layer: TimelineLayer,
  brandKit: BrandKitState,
  captionStylePatch: Partial<TimelineLayer>,
): TimelineLayer {
  if (layer.type === "caption") {
    return {
      ...layer,
      ...captionStylePatch,
      fontWeight: captionStylePatch.fontWeight ?? layer.fontWeight ?? "900",
    };
  }

  if (layer.type === "text") {
    return {
      ...layer,
      color: brandKit.primaryColor,
      textColor: layer.textColor ?? brandKit.primaryColor,
      backgroundColor: layer.backgroundColor ? brandKit.secondaryColor : layer.backgroundColor,
      fontWeight: layer.fontWeight ?? "900",
    };
  }

  if (layer.type === "shape") {
    return {
      ...layer,
      color: brandKit.secondaryColor,
      backgroundColor: brandKit.secondaryColor,
    };
  }

  if (layer.type === "background" && layer.backgroundColor !== "blur-original") {
    return {
      ...layer,
      color: brandKit.primaryColor,
      backgroundColor: `linear-gradient(145deg, ${brandKit.primaryColor}, ${brandKit.secondaryColor})`,
    };
  }

  return layer;
}

function createBrandBugTimelineLayer({
  brandName,
  brandKit,
  aspectRatio,
  durationSeconds,
}: {
  brandName: string;
  brandKit: BrandKitState;
  aspectRatio: AspectRatio;
  durationSeconds: number;
}): TimelineLayer {
  const dimensions = getTemplateDimensions(aspectRatio);
  const geometry = getBrandBugGeometry(dimensions.width, dimensions.height);

  return {
    id: "brand-kit-bug",
    type: "text",
    name: "Brand bug",
    start: 0,
    duration: durationSeconds,
    color: brandKit.primaryColor,
    textColor: getReadableTextColor(brandKit.primaryColor),
    backgroundColor: brandKit.primaryColor,
    content: brandName,
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
    fontSize: geometry.height > 95 ? 54 : 42,
    fontWeight: "950",
    borderRadius: Math.round(geometry.height / 2),
    opacity: 0.94,
  };
}

function applyBrandKitToTemplateProject({
  project,
  brandName,
  brandKit,
  captionStylePatch,
}: {
  project: TemplateProject;
  brandName: string;
  brandKit: BrandKitState;
  captionStylePatch: Partial<TimelineLayer>;
}): TemplateProject {
  const brandBugLayer = createBrandBugTemplateLayer(project, brandName, brandKit);
  let hasTextTrack = false;

  const nextTimeline = project.timeline.map((track) => {
    const styledLayers = track.layers
      .filter((layer) => layer.id !== brandBugLayer.id)
      .map((layer) => applyBrandKitToTemplateLayer(layer, brandKit, captionStylePatch));

    if (track.kind !== "text") {
      return { ...track, layers: styledLayers };
    }

    hasTextTrack = true;
    return {
      ...track,
      layers: [...styledLayers, brandBugLayer],
    };
  });

  return {
    ...project,
    timeline: hasTextTrack
      ? nextTimeline
      : [
          ...nextTimeline,
          {
            id: "track-brand-kit",
            name: "Brand Kit",
            kind: "text",
            layers: [brandBugLayer],
          },
        ],
    updatedAt: new Date().toISOString(),
  };
}

function applyBrandKitToTemplateLayer(
  layer: TemplateTimelineLayer,
  brandKit: BrandKitState,
  captionStylePatch: Partial<TimelineLayer>,
): TemplateTimelineLayer {
  if (layer.type === "captions") {
    return {
      ...layer,
      color: captionStylePatch.textColor ?? captionStylePatch.color ?? "#ffffff",
      backgroundColor: captionStylePatch.backgroundColor,
      fontSize: captionStylePatch.fontSize,
      fontWeight: captionStylePatch.fontWeight,
      borderRadius: captionStylePatch.borderRadius,
      opacity: captionStylePatch.opacity,
      highlightColor: brandKit.primaryColor,
    };
  }

  if (layer.type === "text") {
    return {
      ...layer,
      color: layer.color && layer.color !== "#ffffff" ? brandKit.primaryColor : layer.color,
      fontFamily: brandKit.font,
      fontWeight: layer.fontWeight ?? "900",
    };
  }

  if (layer.type === "shape") {
    return {
      ...layer,
      color: brandKit.secondaryColor,
      backgroundColor: brandKit.secondaryColor,
    };
  }

  if (layer.type === "background") {
    return {
      ...layer,
      color: brandKit.primaryColor,
      backgroundColor: brandKit.primaryColor,
      gradientFrom: brandKit.primaryColor,
      gradientTo: brandKit.secondaryColor,
    };
  }

  return layer;
}

function createBrandBugTemplateLayer(
  project: TemplateProject,
  brandName: string,
  brandKit: BrandKitState,
): TemplateTimelineLayer {
  const scene = project.scenes[0];
  const geometry = getBrandBugGeometry(project.width, project.height);

  return {
    id: "brand-kit-bug",
    type: "text",
    sceneId: scene?.id ?? "scene-brand-kit",
    sceneName: scene?.name ?? "Brand Kit",
    absoluteStart: 0,
    duration: Math.max(1, project.duration),
    editable: true,
    name: "Brand bug",
    content: brandName,
    x: geometry.x,
    y: geometry.y,
    width: geometry.width,
    height: geometry.height,
    color: brandKit.primaryColor,
    backgroundColor: brandKit.primaryColor,
    fontFamily: brandKit.font,
    fontSize: geometry.height > 95 ? 54 : 42,
    fontWeight: "950",
    align: "center",
    direction: "auto",
    borderRadius: Math.round(geometry.height / 2),
    opacity: 0.96,
  };
}

function getBrandBugGeometry(width: number, height: number) {
  const isVertical = height > width * 1.35;
  const safe = isVertical
    ? { top: 160, right: 70 }
    : Math.abs(width - height) < 10
      ? { top: 92, right: 76 }
      : { top: 72, right: 96 };
  const layerWidth = Math.round(isVertical ? Math.min(520, width * 0.48) : Math.min(420, width * 0.26));
  const layerHeight = Math.round(isVertical ? 92 : 74);

  return {
    x: Math.max(0, width - safe.right - layerWidth),
    y: safe.top,
    width: layerWidth,
    height: layerHeight,
  };
}

function getReadableTextColor(hexColor: string) {
  const normalized = normalizeBrandColor(hexColor, DEFAULT_BRAND_KIT.primaryColor).replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.6 ? "#06120d" : "#ffffff";
}

function createDefaultTimeline(): TimelineTrack[] {
  return createTimelineForVideo("Source video", 36);
}

function createImageStoryboardPlan({
  assets,
  durationSeconds,
  platform,
  aspectRatio,
  styleId,
  brandName,
  goal,
}: {
  assets: MediaAsset[];
  durationSeconds: number;
  platform: Platform;
  aspectRatio: AspectRatio;
  styleId: VideoStyleId;
  brandName: string;
  goal: Goal;
}): EditPlan {
  const brand = brandName.trim() || "Mawj Studio";
  const title = assets.length === 1 ? `فيديو صورة · ${brand}` : `فيديو صور · ${brand}`;
  const hook =
    goal === "sales"
      ? "حوّلنا الصور إلى إعلان قصير جاهز للنشر."
      : goal === "education"
        ? "حوّلنا الصور إلى شرح بصري سريع."
        : "حوّلنا الصور إلى فيديو متحرك قابل للتعديل.";
  const introEnd = Math.max(2, Math.min(4, Math.round(durationSeconds * 0.24)));
  const showcaseEnd = Math.max(introEnd + 2, Math.round(durationSeconds * 0.72));
  const ctaStart = Math.max(showcaseEnd, Math.round(durationSeconds * 0.78));

  return {
    id: `image-plan-${Date.now()}`,
    title,
    hook,
    summary: `تم بناء مشروع فيديو من ${assets.length} صورة بمدة ${durationSeconds} ثانية، مع مشاهد مستقلة وحركات دخول وخروج وكابشن قابل للتعديل.`,
    targetDurationSeconds: durationSeconds,
    styleId,
    confidence: 90,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "No source audio",
      safeMargins: aspectRatio === "9:16" ? "Top 160px / Bottom 260px" : "Standard safe zones",
    },
    timeline: [
      {
        id: "image-hook",
        label: "Opening image hook",
        start: 0,
        end: introEnd,
        action: "أول صورة تظهر بزوم ناعم وعنوان واضح داخل الهوامش الآمنة.",
        intensity: "high",
      },
      {
        id: "image-showcase",
        label: "Image sequence",
        start: introEnd,
        end: showcaseEnd,
        action: "كل صورة تتحول إلى مشهد مستقل مع حركة slide/zoom حتى لا يظهر الفيديو ثابتاً.",
        intensity: "medium",
      },
      {
        id: "image-cta",
        label: "CTA closing",
        start: ctaStart,
        end: durationSeconds,
        action: goal === "sales" ? "خاتمة بطلب واضح وسريع." : "خاتمة للحفظ أو المشاركة.",
        intensity: goal === "sales" ? "high" : "medium",
      },
    ],
    captions: [
      { at: 0, text: hook, emphasis: ["فيديو", "جاهز"] },
      { at: introEnd, text: assets.length > 1 ? "كل صورة صارت مشهد مستقل." : "الصورة صارت مشهد متحرك.", emphasis: ["مشهد"] },
      { at: ctaStart, text: goal === "sales" ? "أضف السعر والدعوة للطلب الآن." : "عدّل النص وانشر النسخة المناسبة.", emphasis: ["عدّل", "انشر"] },
    ],
    aiTools: [
      { name: "Image storyboard", status: "ready", detail: "تحويل الصور إلى مشاهد بزمن فعلي." },
      { name: "Animated captions", status: "ready", detail: "كابشن قابل للتعديل فوق الصور." },
      { name: "Export", status: "ready", detail: "تصدير MP4 من مشروع الصور." },
    ],
    exportVariants: [
      { platform: PLATFORM_LABELS[platform], duration: `${durationSeconds}s`, caption: "نسخة فيديو من الصور." },
      { platform: "MP4", duration: `${durationSeconds}s`, caption: "تصدير كامل مع النصوص والحركات." },
      { platform: "Thumbnail", duration: "1 frame", caption: "غلاف من أول مشهد." },
    ],
  };
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
          fit: asset.kind === "image" ? "contain" : undefined,
        })),
      ],
    };
  });
}

function appendLayersToOverlayTrack(tracks: TimelineTrack[], layers: TimelineLayer[]): TimelineTrack[] {
  let didAppend = false;
  const nextTracks = tracks.map((track) => {
    if (track.kind !== "overlay") return track;

    didAppend = true;
    return {
      ...track,
      layers: [...track.layers, ...layers],
    };
  });

  if (didAppend) return nextTracks;

  return [
    ...tracks,
    {
      id: "track-overlays",
      name: "Text / Images",
      kind: "overlay",
      layers,
    },
  ];
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

function ensureCaptionLayer(
  tracks: TimelineTrack[],
  captions: CaptionLine[],
  durationSeconds: number,
  stylePatch: Partial<TimelineLayer> = {},
): TimelineTrack[] {
  const captionDuration =
    captions.length > 0 ? Math.max(...captions.map((caption) => caption.end)) : durationSeconds;
  const captionLayers = captions.length
    ? captions.map((caption, index) => ({
        ...captionToTimelineLayer(caption, index),
        ...stylePatch,
      }))
    : [
        {
          id: "caption-main",
          type: "caption" as const,
          name: "Arabic captions",
          start: 0,
          duration: Math.max(1, captionDuration),
          color: "#fb923c",
          ...stylePatch,
        },
      ];

  return tracks.map((track) =>
    track.kind === "caption"
      ? {
          ...track,
          layers: captionLayers,
        }
      : track,
  );
}

function createEditableTextLayer({
  aspectRatio,
  previewTime,
  defaultText,
}: {
  aspectRatio: AspectRatio;
  previewTime: number;
  defaultText: string;
}): TimelineLayer {
  const geometry = getDefaultEditableTextGeometry(aspectRatio);

  return {
    id: createLayerId("text"),
    type: "text",
    name: defaultText,
    start: Math.max(0, Math.round(previewTime * 10) / 10),
    duration: 5,
    color: "#ffffff",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    content: defaultText,
    fontSize: aspectRatio === "16:9" ? 52 : 68,
    fontWeight: "900",
    borderRadius: 22,
    opacity: 0.96,
    ...geometry,
  };
}

function createEditableImageLayer({
  asset,
  aspectRatio,
  previewTime,
}: {
  asset: MediaAsset;
  aspectRatio: AspectRatio;
  previewTime: number;
}): TimelineLayer {
  const geometry = getDefaultImageLayerGeometry(asset, aspectRatio);

  return {
    id: createLayerId("image"),
    type: "image",
    name: asset.name,
    start: Math.max(0, Math.round(previewTime * 10) / 10),
    duration: Math.max(5, Math.min(12, Math.round(asset.durationSeconds ?? 6))),
    color: "#c084fc",
    src: asset.url,
    opacity: 1,
    fit: "contain",
    ...geometry,
  };
}

function createEditableCtaLayers({
  aspectRatio,
  previewTime,
  brandColor,
  goal,
}: {
  aspectRatio: AspectRatio;
  previewTime: number;
  brandColor: string;
  goal: Goal;
}): TimelineLayer[] {
  const canvas = getAspectCanvasDimensions(aspectRatio);
  const safeMargins = getSafeMarginsForAspect(aspectRatio);
  const start = Math.max(0, Math.round(previewTime * 10) / 10);
  const width = canvas.width - safeMargins.left - safeMargins.right;
  const height = aspectRatio === "16:9" ? 106 : 132;
  const x = safeMargins.left;
  const y = Math.max(safeMargins.top, canvas.height - safeMargins.bottom - height - (aspectRatio === "16:9" ? 24 : 36));
  const ctaText =
    goal === "sales"
      ? "اطلب الآن"
      : goal === "education"
        ? "احفظ المقطع"
        : goal === "awareness"
          ? "اعرف المزيد"
          : "تابعنا الآن";
  const shapeId = createLayerId("cta-shape");
  const textId = createLayerId("cta-text");

  return [
    {
      id: shapeId,
      type: "shape",
      name: "CTA background",
      start,
      duration: 5,
      color: normalizeHexColor(brandColor),
      backgroundColor: normalizeHexColor(brandColor),
      borderRadius: aspectRatio === "16:9" ? 28 : 36,
      opacity: 0.94,
      x,
      y,
      width,
      height,
    },
    {
      id: textId,
      type: "text",
      name: ctaText,
      content: ctaText,
      start,
      duration: 5,
      color: "#ffffff",
      textColor: "#ffffff",
      backgroundColor: "transparent",
      borderRadius: 0,
      opacity: 1,
      fontSize: aspectRatio === "16:9" ? 46 : 62,
      fontWeight: "900",
      x,
      y: y + Math.round(height * 0.17),
      width,
      height: Math.round(height * 0.66),
    },
  ];
}

function getDefaultEditableTextGeometry(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") {
    return {
      x: 192,
      y: 172,
      width: 1536,
      height: 150,
    };
  }

  if (aspectRatio === "1:1") {
    return {
      x: 92,
      y: 158,
      width: 896,
      height: 150,
    };
  }

  return {
    x: 86,
    y: 260,
    width: 908,
    height: 190,
  };
}

function getDefaultImageLayerGeometry(asset: MediaAsset, aspectRatio: AspectRatio) {
  const canvas = getAspectCanvasDimensions(aspectRatio);
  const safeMargins = getSafeMarginsForAspect(aspectRatio);
  const maxWidth = canvas.width - safeMargins.left - safeMargins.right;
  const maxHeight = Math.round((canvas.height - safeMargins.top - safeMargins.bottom) * 0.54);
  const sourceWidth = asset.width && asset.width > 0 ? asset.width : 1;
  const sourceHeight = asset.height && asset.height > 0 ? asset.height : 1;
  const sourceRatio = sourceWidth / sourceHeight;

  let width = Math.min(maxWidth, Math.round(canvas.width * (aspectRatio === "16:9" ? 0.46 : 0.74)));
  let height = Math.round(width / sourceRatio);

  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * sourceRatio);
  }

  width = Math.max(160, Math.min(maxWidth, width));
  height = Math.max(160, Math.min(maxHeight, height));

  return {
    x: Math.round((canvas.width - width) / 2),
    y: Math.round(safeMargins.top + (canvas.height - safeMargins.top - safeMargins.bottom - height) * 0.38),
    width,
    height,
  };
}

function getTimelineLayerGeometry(layer: TimelineLayer, aspectRatio: AspectRatio) {
  const defaults = getDefaultLayerGeometry(layer, aspectRatio);

  return {
    x: layer.x ?? defaults.x,
    y: layer.y ?? defaults.y,
    width: layer.width ?? defaults.width,
    height: layer.height ?? defaults.height,
  };
}

function getDefaultLayerGeometry(layer: TimelineLayer, aspectRatio: AspectRatio) {
  const canvas = getAspectCanvasDimensions(aspectRatio);

  if (layer.type === "image") {
    return {
      x: Math.round(canvas.width * 0.16),
      y: Math.round(canvas.height * 0.35),
      width: Math.round(canvas.width * 0.68),
      height: Math.round(canvas.height * 0.28),
    };
  }

  if (layer.type === "shape") {
    return {
      x: Math.round(canvas.width * 0.12),
      y: Math.round(canvas.height * 0.64),
      width: Math.round(canvas.width * 0.76),
      height: Math.round(canvas.height * 0.1),
    };
  }

  if (layer.type === "caption") {
    return {
      x: Math.round(canvas.width * 0.08),
      y: Math.round(canvas.height * 0.69),
      width: Math.round(canvas.width * 0.84),
      height: Math.round(canvas.height * 0.13),
    };
  }

  return getDefaultEditableTextGeometry(aspectRatio);
}

function getAspectCanvasDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function getSafeMarginsForAspect(aspectRatio: AspectRatio) {
  if (aspectRatio === "9:16") {
    return { top: 160, bottom: 260, left: 70, right: 70 };
  }

  if (aspectRatio === "1:1") {
    return { top: 92, bottom: 120, left: 76, right: 76 };
  }

  return { top: 72, bottom: 72, left: 96, right: 96 };
}

function clampTimelineNumber(value: number, min: number, max: number) {
  return Math.round(Math.min(max, Math.max(min, value)));
}

function createLayerId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function captionToTimelineLayer(caption: CaptionLine, index: number): TimelineLayer {
  return {
    id: captionLayerId(caption.id),
    type: "caption",
    name: caption.text.trim() || `Caption ${index + 1}`,
    start: Math.max(0, caption.start),
    duration: Math.max(0.4, caption.end - caption.start),
    color: "#ffffff",
    textColor: "#ffffff",
    backgroundColor: "#000000",
    content: caption.text,
    fontSize: 58,
    fontWeight: "900",
    borderRadius: 22,
    opacity: 1,
  };
}

function getCaptionStylePatch(
  template: string,
  aspectRatio: AspectRatio,
  brandColor: string,
): Partial<TimelineLayer> {
  const normalizedTemplate = template.toLowerCase();
  const isWide = aspectRatio === "16:9";
  const brand = normalizeHexColor(brandColor);

  if (normalizedTemplate.includes("luxury") || normalizedTemplate.includes("formal")) {
    return {
      color: "#f8fafc",
      textColor: "#f8fafc",
      backgroundColor: "rgba(15, 23, 42, 0.62)",
      fontSize: isWide ? 38 : 48,
      fontWeight: "700",
      borderRadius: 14,
      opacity: 0.9,
    };
  }

  if (normalizedTemplate.includes("podcast")) {
    return {
      color: "#ffffff",
      textColor: "#ffffff",
      backgroundColor: "rgba(15, 23, 42, 0.82)",
      fontSize: isWide ? 42 : 54,
      fontWeight: "800",
      borderRadius: 20,
      opacity: 0.96,
    };
  }

  if (normalizedTemplate.includes("karaoke")) {
    return {
      color: "#facc15",
      textColor: "#facc15",
      backgroundColor: "rgba(3, 7, 18, 0.84)",
      fontSize: isWide ? 46 : 60,
      fontWeight: "950",
      borderRadius: 22,
      opacity: 1,
    };
  }

  if (normalizedTemplate.includes("education") || normalizedTemplate.includes("card")) {
    return {
      color: "#111827",
      textColor: "#111827",
      backgroundColor: "#f8fafc",
      fontSize: isWide ? 40 : 52,
      fontWeight: "900",
      borderRadius: 18,
      opacity: 0.97,
    };
  }

  if (normalizedTemplate.includes("offer") || normalizedTemplate.includes("food")) {
    return {
      color: "#ffffff",
      textColor: "#ffffff",
      backgroundColor: brand,
      fontSize: isWide ? 44 : 58,
      fontWeight: "950",
      borderRadius: 26,
      opacity: 0.96,
    };
  }

  return {
    color: "#ffffff",
    textColor: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    fontSize: isWide ? 44 : 58,
    fontWeight: "950",
    borderRadius: 24,
    opacity: 0.96,
  };
}

function captionToTranscriptSegment(caption: CaptionLine, index: number): TranscriptSegment {
  return {
    id: `srt-segment-${index + 1}-${Math.round(caption.start * 1000)}`,
    start: caption.start,
    end: caption.end,
    speaker: "SRT",
    text: caption.text,
  };
}

function captionLayerId(captionId: string) {
  return `caption-${captionId}`;
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

function getDerivedExportSource(
  renderResult: BrowserRenderResult | null,
  studioFile: StudioFile | null,
  mode: "audio" | "video",
) {
  const canUseRenderResult =
    renderResult &&
    !renderResult.mimeType.startsWith("image/") &&
    (mode === "audio" || !renderResult.mimeType.startsWith("audio/"));

  if (canUseRenderResult) {
    return {
      blob: renderResult.blob,
      fileName: renderResult.fileName,
    };
  }

  if (studioFile) {
    return {
      blob: studioFile.file,
      fileName: studioFile.file.name,
    };
  }

  return null;
}

function uniqueMediaAssetsById(assets: MediaAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    if (seen.has(asset.id)) return false;
    seen.add(asset.id);
    return true;
  });
}

function MediaAssetPreview({ asset }: { asset: MediaAsset }) {
  if (asset.kind === "image") {
    return (
      <span
        className="block h-12 w-12 shrink-0 rounded-md border border-white/10 bg-cover bg-center bg-no-repeat shadow-inner"
        style={{ backgroundImage: `url("${asset.url}")` }}
        aria-label={asset.name}
        role="img"
      />
    );
  }

  if (asset.kind === "video") {
    return (
      <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black shadow-inner">
        <video
          src={asset.url}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 grid place-items-center bg-black/20">
          <AssetIcon kind={asset.kind} />
        </span>
      </span>
    );
  }

  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
      <AssetIcon kind={asset.kind} />
    </span>
  );
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
  const imageCount = mediaAssets.filter((asset) => asset.kind === "image").length;
  const audioCount = mediaAssets.filter((asset) => asset.kind === "audio").length;

  return {
    platform,
    aspectRatio,
    languageMode,
    goal,
    durationSeconds: studioFile?.durationSeconds ?? totalTimelineSeconds,
    hasVideo: Boolean(studioFile),
    hasImages: imageCount > 0,
    mediaCount: mediaAssets.length,
    imageCount,
    audioCount,
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
  transcriptionMode: TranscriptionMode | null;
  mediaCount: number;
  engineProject: VideoProject | null;
}) {
  if (transcriptionMode === "python") return "Whisper Python captions";
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
  transcriptionMode: TranscriptionMode | null;
}) {
  if (plan) return Math.round(plan.confidence);
  if (transcriptionMode === "python") return 94;
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

function createSilenceRemovalPlan({
  transcript,
  gaps,
  style,
  aspectRatio,
  brandName,
}: {
  transcript: TranscriptSegment[];
  gaps: Array<{ start: number; end: number }>;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  brandName: string;
}): EditPlan {
  const speechSegments = [...transcript]
    .filter((segment) => !segment.deleted && segment.end - segment.start > 0.1)
    .sort((a, b) => a.start - b.start);

  let outputCursor = 0;
  const captions = speechSegments.map((segment) => {
    const caption = {
      at: Number(outputCursor.toFixed(2)),
      text: segment.text,
      emphasis: [],
    };
    outputCursor += Math.max(0, segment.end - segment.start);
    return caption;
  });
  const targetDurationSeconds = Math.max(1, Number(outputCursor.toFixed(2)));

  return {
    id: `silence-removal-${Date.now()}`,
    title: `${brandName || "Mawj Studio"} silence cut`,
    hook: speechSegments[0]?.text ?? "Silence removed cut",
    summary: `Removed ${gaps.length} long pause${gaps.length === 1 ? "" : "s"} from the transcript timeline.`,
    targetDurationSeconds,
    styleId: style.id,
    confidence: 90,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: speechSegments.map((segment, index) => ({
      id: `speech-cut-${segment.id}`,
      label: `Speech ${index + 1}`,
      start: segment.start,
      end: segment.end,
      action: `Keep speech and remove neighboring silence around ${formatDuration(segment.start)}.`,
      intensity: index === 0 ? "high" : "medium",
    })),
    captions,
    aiTools: [
      { name: "Remove silence", status: "ready", detail: `${gaps.length} long pauses marked for FFmpeg trimming.` },
      { name: "FFmpeg trim", status: "ready", detail: "Export will concatenate the kept speech ranges." },
    ],
    exportVariants: [
      { platform: "MP4", duration: `${Math.round(targetDurationSeconds)}s`, caption: "Speech-only cut with long pauses removed." },
      { platform: "SRT", duration: `${Math.round(targetDurationSeconds)}s`, caption: "Captions aligned to the shortened edit." },
    ],
  };
}

function createTranscriptCutPlan({
  transcript,
  deletedSegments,
  style,
  aspectRatio,
  brandName,
  durationSeconds,
}: {
  transcript: TranscriptSegment[];
  deletedSegments: TranscriptSegment[];
  style: VideoStyle;
  aspectRatio: AspectRatio;
  brandName: string;
  durationSeconds: number;
}): EditPlan {
  const keptSegments = getKeptTranscriptSegments(transcript);
  const captions = createPlanCaptionsFromTranscript(transcript);
  const targetDurationSeconds = Math.max(
    1,
    Number(keptSegments.reduce((total, segment) => total + Math.max(0, segment.end - segment.start), 0).toFixed(2)),
  );

  return {
    id: `transcript-cut-${Date.now()}`,
    title: `${brandName || "Mawj Studio"} text edit`,
    hook: keptSegments[0]?.text ?? "Text-based edit",
    summary: `Cut ${deletedSegments.length} transcript segment${deletedSegments.length === 1 ? "" : "s"} and kept ${Math.round(targetDurationSeconds)}s from ${Math.round(durationSeconds)}s.`,
    targetDurationSeconds,
    styleId: style.id,
    confidence: 93,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: keptSegments.map((segment, index) => ({
      id: `text-keep-${segment.id}`,
      label: `Text edit ${index + 1}`,
      start: segment.start,
      end: segment.end,
      action: `Keep transcript sentence and remove deleted ranges around ${formatDuration(segment.start)}.`,
      intensity: index === 0 ? "high" : "medium",
    })),
    captions,
    aiTools: [
      { name: "Text-based editing", status: "ready", detail: `${deletedSegments.length} transcript segments are excluded from export.` },
      { name: "FFmpeg trim", status: "ready", detail: "Export will concatenate the remaining transcript ranges." },
    ],
    exportVariants: [
      { platform: "MP4", duration: `${Math.round(targetDurationSeconds)}s`, caption: "Transcript-trimmed video export." },
      { platform: "SRT", duration: `${Math.round(targetDurationSeconds)}s`, caption: "Captions aligned to the shortened cut." },
    ],
  };
}

function getKeptTranscriptSegments(transcript: TranscriptSegment[]) {
  return [...transcript]
    .filter((segment) => !segment.deleted && !segment.id.startsWith("silence-gap-") && segment.end - segment.start > 0.1)
    .sort((a, b) => a.start - b.start);
}

function getDeletedTranscriptSegments(transcript: TranscriptSegment[]) {
  return [...transcript]
    .filter((segment) => segment.deleted && segment.end - segment.start > 0.1)
    .sort((a, b) => a.start - b.start);
}

function createPlanCaptionsFromTranscript(transcript: TranscriptSegment[]) {
  let outputCursor = 0;

  return getKeptTranscriptSegments(transcript).map((segment) => {
    const caption = {
      at: Number(outputCursor.toFixed(2)),
      text: segment.text,
      emphasis: [],
    };
    outputCursor += Math.max(0, segment.end - segment.start);
    return caption;
  });
}

function createOutputCaptionsFromTranscript(transcript: TranscriptSegment[]): CaptionLine[] {
  let outputCursor = 0;

  return getKeptTranscriptSegments(transcript).map((segment, index) => {
    const duration = Math.max(0.4, segment.end - segment.start);
    const start = Number(outputCursor.toFixed(2));
    const end = Number((outputCursor + duration).toFixed(2));
    outputCursor += duration;

    return {
      id: `cap-text-cut-${index}-${segment.id}`,
      start,
      end,
      text: segment.text,
    };
  });
}

function syncTranscriptCutMarkers(tracks: TimelineTrack[], deletedSegments: TranscriptSegment[]): TimelineTrack[] {
  const markers: TimelineLayer[] = deletedSegments.map((segment) => ({
    id: `transcript-cut-${segment.id}`,
    type: "effect",
    name: `Text cut ${formatDuration(segment.start)}–${formatDuration(segment.end)}`,
    start: segment.start,
    duration: Math.max(0.5, segment.end - segment.start),
    color: "#fb7185",
  }));

  return tracks.map((track) =>
    track.kind === "effects"
      ? {
          ...track,
          layers: [
            ...track.layers.filter(
              (layer) => !layer.id.startsWith("transcript-cut-") && !layer.name.startsWith("Text cut "),
            ),
            ...markers,
          ],
        }
      : track,
  );
}

function createClipSuggestions({
  total,
  plan,
  transcript,
}: {
  total: number;
  plan: EditPlan | null;
  transcript: TranscriptSegment[];
}): ClipSuggestion[] {
  const safeTotal = Math.max(1, total);
  const highIntensityStart =
    plan?.timeline.find((item) => item.intensity === "high" && item.start > 0)?.start ??
    Math.max(0, Math.round(safeTotal * 0.18));
  const ranges = [
    { label: "15s", start: plan?.timeline[0]?.start ?? 0, target: 15 },
    { label: "30s", start: highIntensityStart, target: 30 },
    { label: "60s", start: 0, target: 60 },
  ];

  return ranges
    .map((range) => {
      const targetDuration = Math.min(range.target, safeTotal);
      const preferredStart = range.target >= safeTotal ? 0 : range.start;
      const latestStart = Math.max(0, safeTotal - targetDuration);
      const start = Math.max(0, Math.min(preferredStart, latestStart));
      const end = Math.min(safeTotal, start + targetDuration);
      const duration = Math.max(0, end - start);
      const clipTranscript = transcript
        .filter((segment) => !segment.deleted && segment.end > start && segment.start < end)
        .map((segment) => ({
          ...segment,
          id: `${range.label}-${segment.id}`,
          start: Math.max(0, Number((segment.start - start).toFixed(2))),
          end: Math.max(0, Number((Math.min(segment.end, end) - start).toFixed(2))),
        }));

      return {
        id: `clip-${range.label}-${Math.round(start * 1000)}`,
        label: range.label,
        start,
        end,
        duration,
        transcript: clipTranscript,
      };
    })
    .filter((clip) => clip.duration >= 3);
}

function createClipExportPlan({
  clip,
  style,
  aspectRatio,
  brandName,
}: {
  clip: ClipSuggestion;
  style: VideoStyle;
  aspectRatio: AspectRatio;
  brandName: string;
}): EditPlan {
  return {
    id: `clip-export-${clip.id}`,
    title: `${brandName || "Mawj Studio"} ${clip.label} clip`,
    hook: clip.transcript[0]?.text ?? `${clip.label} creator cut`,
    summary: `A real FFmpeg cut from ${formatDuration(clip.start)} to ${formatDuration(clip.end)}.`,
    targetDurationSeconds: clip.duration,
    styleId: style.id,
    confidence: 92,
    renderSettings: {
      aspectRatio,
      resolution: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline: [
      {
        id: clip.id,
        label: clip.label,
        start: clip.start,
        end: clip.end,
        action: "Export this selected highlight as a real trimmed clip.",
        intensity: "high",
      },
    ],
    captions: clip.transcript.map((segment) => ({
      at: segment.start,
      text: segment.text,
      emphasis: [],
    })),
    aiTools: [
      { name: "FFmpeg trim", status: "ready", detail: "The exported file uses real source cut points." },
    ],
    exportVariants: [
      { platform: "MP4", duration: `${Math.round(clip.duration)}s`, caption: `${clip.label} highlight export.` },
    ],
  };
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
      fit: layer.fit,
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
    fit: patch.fit,
  };

  return Object.fromEntries(
    Object.entries(nextPatch).filter(([, value]) => value !== undefined),
  ) as Partial<TemplateTimelineTrack["layers"][number]>;
}

function createDuplicateTimelineLayer(layer: TimelineLayer): TimelineLayer {
  return {
    ...layer,
    id: createLayerDuplicateId(layer.id),
    name: `${layer.name} copy`,
    start: roundTimelineSeconds(layer.start + 0.5),
    x: layer.x === undefined ? layer.x : layer.x + 24,
    y: layer.y === undefined ? layer.y : layer.y + 24,
  };
}

function duplicateTemplateProjectLayer(
  project: TemplateProject,
  sourceLayerId: string,
  duplicateLayer: TimelineLayer,
): TemplateProject {
  let didDuplicate = false;
  const nextTimeline = project.timeline.map((track) => ({
    ...track,
    layers: track.layers.flatMap((layer) => {
      if (layer.id !== sourceLayerId) return [layer];

      didDuplicate = true;
      const sceneStart = layer.absoluteStart - (layer.start ?? 0);
      const duplicateTemplateLayer: TemplateTimelineTrack["layers"][number] = {
        ...layer,
        ...toTemplateTimelinePatch(duplicateLayer),
        id: duplicateLayer.id,
        name: duplicateLayer.name,
        absoluteStart: duplicateLayer.start,
        start: roundTimelineSeconds(Math.max(0, duplicateLayer.start - sceneStart)),
        duration: duplicateLayer.duration,
      };

      return [layer, duplicateTemplateLayer];
    }),
  }));

  if (!didDuplicate) return project;

  return {
    ...project,
    timeline: nextTimeline,
    updatedAt: new Date().toISOString(),
  };
}

function appendTimelineLayersToTemplateProject(
  project: TemplateProject,
  layers: TimelineLayer[],
): TemplateProject {
  const templateLayers = layers
    .map((layer) => timelineLayerToTemplateTimelineLayer(project, layer))
    .filter((layer): layer is TemplateTimelineTrack["layers"][number] => Boolean(layer));
  if (!templateLayers.length) return project;

  const additionsByKind = new Map<TemplateTimelineTrack["kind"], TemplateTimelineTrack["layers"]>();
  templateLayers.forEach((layer) => {
    const kind = templateLayerTypeToTrackKind(layer.type);
    additionsByKind.set(kind, [...(additionsByKind.get(kind) ?? []), layer]);
  });

  const usedKinds = new Set<TemplateTimelineTrack["kind"]>();
  const nextTimeline = project.timeline.map((track) => {
    const additions = additionsByKind.get(track.kind);
    if (!additions?.length) return track;

    usedKinds.add(track.kind);
    return {
      ...track,
      layers: [...track.layers, ...additions],
    };
  });

  additionsByKind.forEach((additions, kind) => {
    if (usedKinds.has(kind)) return;
    nextTimeline.push({
      id: `track-${kind}`,
      name: getTemplateTrackName(kind),
      kind,
      layers: additions,
    });
  });

  return {
    ...project,
    timeline: nextTimeline,
    updatedAt: new Date().toISOString(),
  };
}

function timelineLayerToTemplateTimelineLayer(
  project: TemplateProject,
  layer: TimelineLayer,
): TemplateTimelineTrack["layers"][number] | null {
  const type = timelineLayerTypeToTemplateLayerType(layer.type);
  if (!type) return null;

  const scene = findTemplateSceneForTimelineLayer(project, layer);
  const absoluteStart = Math.max(0, layer.start);

  return {
    id: layer.id,
    type,
    name: layer.name,
    content: layer.content,
    src: layer.src,
    sceneId: scene.id,
    sceneName: scene.name,
    absoluteStart,
    start: roundTimelineSeconds(Math.max(0, absoluteStart - scene.start)),
    duration: layer.duration,
    editable: true,
    color: layer.textColor ?? layer.color,
    backgroundColor: layer.backgroundColor,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    borderRadius: layer.borderRadius,
    opacity: layer.opacity,
    direction: layer.type === "text" || layer.type === "caption" ? "auto" : undefined,
    align: layer.type === "text" || layer.type === "caption" ? "center" : undefined,
    fit: layer.type === "image" ? (layer.fit ?? "contain") : undefined,
    shape: layer.type === "shape" ? "rect" : undefined,
  };
}

function findTemplateSceneForTimelineLayer(project: TemplateProject, layer: TimelineLayer): TemplateScene {
  return (
    project.scenes.find((scene) => layer.start >= scene.start && layer.start < scene.start + scene.duration) ??
    project.scenes[0] ?? {
      id: "manual-scene",
      name: "Manual scene",
      start: 0,
      duration: project.duration,
      background: { type: "transparent" },
      layers: [],
    }
  );
}

function timelineLayerTypeToTemplateLayerType(
  type: TimelineLayer["type"],
): TemplateTimelineTrack["layers"][number]["type"] | null {
  if (type === "caption") return "captions";
  if (type === "text" || type === "image" || type === "video" || type === "audio" || type === "shape" || type === "background" || type === "waveform") {
    return type;
  }

  return null;
}

function templateLayerTypeToTrackKind(type: TemplateTimelineTrack["layers"][number]["type"]): TemplateTimelineTrack["kind"] {
  if (type === "captions") return "captions";
  if (type === "text" || type === "image" || type === "video" || type === "audio" || type === "shape" || type === "background" || type === "waveform") {
    return type;
  }

  return "shape";
}

function getTemplateTrackName(kind: TemplateTimelineTrack["kind"]) {
  const names: Record<TemplateTimelineTrack["kind"], string> = {
    scenes: "Scenes",
    video: "Video",
    audio: "Audio",
    text: "Text",
    image: "Images / Logos",
    shape: "Shapes",
    captions: "Captions",
    background: "Backgrounds",
    waveform: "Waveform",
  };

  return names[kind];
}

function createLayerDuplicateId(sourceId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${sourceId}-copy-${crypto.randomUUID()}`;
  }

  return `${sourceId}-copy-${Date.now()}`;
}

function roundTimelineSeconds(value: number) {
  return Math.round(value * 10) / 10;
}

function clampCaptionTime(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(24 * 60 * 60, value));
}

function isEditorTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
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

function getAssetKind(file: File): MediaAsset["kind"] {
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "video";
}

function getDefaultMimeType(kind: MediaAsset["kind"]) {
  if (kind === "audio") return "audio/mpeg";
  if (kind === "image") return "image/jpeg";
  return "video/mp4";
}

function createBackgroundReplacementLayer({
  mode,
  aspectRatio,
  duration,
  brandColor,
}: {
  mode: string;
  aspectRatio: AspectRatio;
  duration: number;
  brandColor: string;
}): TimelineLayer {
  const dimensions = getAspectCanvasDimensions(aspectRatio);
  const palette = getBackgroundReplacementPalette(mode, brandColor);

  return {
    id: `background-replacement-${mode.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "custom"}`,
    type: "background",
    name: `Background · ${mode}`,
    content: mode,
    start: 0,
    duration,
    color: palette.color,
    backgroundColor: palette.backgroundColor,
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    opacity: 1,
  };
}

function getBackgroundReplacementPalette(mode: string, brandColor: string) {
  if (mode === "Brand color") {
    return { color: brandColor, backgroundColor: brandColor };
  }

  if (mode === "Office background") {
    return { color: "#0f172a", backgroundColor: "linear-gradient(135deg, #0f172a, #334155)" };
  }

  if (mode === "Classroom board") {
    return { color: "#064e3b", backgroundColor: "linear-gradient(135deg, #042f2e, #0f766e)" };
  }

  if (mode === "Podcast room") {
    return { color: "#312e81", backgroundColor: "linear-gradient(135deg, #111827, #312e81)" };
  }

  if (mode === "Studio gradient") {
    return { color: "#111827", backgroundColor: "linear-gradient(135deg, #050608, #8ef7c2)" };
  }

  if (mode === "Transparent cutout") {
    return { color: "#111827", backgroundColor: "linear-gradient(135deg, #050608, #1f2937)" };
  }

  return { color: "#0f172a", backgroundColor: "blur-original" };
}

async function prepareStudioFileForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  if (typeof window === "undefined" || typeof document === "undefined") return file;

  const optimized = await downscaleImageFile(file).catch(() => null);
  return optimized ?? file;
}

function downscaleImageFile(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);

    image.onload = () => {
      const maxDimension = 2160;
      const width = image.naturalWidth || 0;
      const height = image.naturalHeight || 0;
      const largestSide = Math.max(width, height);

      if (!width || !height || (largestSide <= maxDimension && file.size <= 3_000_000)) {
        cleanup();
        resolve(null);
        return;
      }

      const scale = Math.min(1, maxDimension / largestSide);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          cleanup();

          if (!blob || blob.size >= file.size) {
            resolve(null);
            return;
          }

          resolve(
            new File([blob], `${withoutFileExtension(file.name)}.webp`, {
              type: "image/webp",
              lastModified: file.lastModified,
            }),
          );
        },
        "image/webp",
        0.88,
      );
    };

    image.onerror = () => {
      cleanup();
      resolve(null);
    };

    image.src = url;
  });
}

function withoutFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "image";
}

function getThumbnailResolutionLabel(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return "1280x720 PNG";
  if (aspectRatio === "1:1") return "1080x1080 PNG";
  return "720x1280 PNG";
}

function createMediaAssetFromFile(file: File): MediaAsset {
  const kind = getAssetKind(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    file,
    url: URL.createObjectURL(file),
    kind,
    size: file.size,
    durationSeconds: kind === "image" ? DEFAULT_IMAGE_CLIP_DURATION_SECONDS : undefined,
  };
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
    durationSeconds: record.durationSeconds ?? (record.type === "image" ? DEFAULT_IMAGE_CLIP_DURATION_SECONDS : undefined),
    width: record.width,
    height: record.height,
    persisted: true,
  };
}


async function createSourceVideoThumbnail({
  sourceUrl,
  time,
  aspectRatio,
}: {
  sourceUrl: string;
  time: number;
  aspectRatio: AspectRatio;
}) {
  const dimensions = getAspectCanvasDimensions(aspectRatio);
  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create thumbnail canvas.");

  const video = await loadVideoFrame(sourceUrl, time);
  drawVideoCover(context, video, dimensions.width, dimensions.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not export thumbnail image."));
      }
    }, "image/png");
  });
}

function loadVideoFrame(sourceUrl: string, time: number) {
  return new Promise<HTMLVideoElement>((resolve, reject) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
    };

    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      const target = Math.max(0, Math.min(time || 0, Math.max(0, (video.duration || 1) - 0.05)));
      if (target <= 0.05) return;
      video.currentTime = target;
    };
    video.onloadeddata = () => {
      const target = Math.max(0, Math.min(time || 0, Math.max(0, (video.duration || 1) - 0.05)));
      if (target > 0.05) return;
      cleanup();
      resolve(video);
    };
    video.onseeked = () => {
      cleanup();
      resolve(video);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read the current video frame for thumbnail export."));
    };
    video.src = sourceUrl;
  });
}

function drawVideoCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
) {
  const sourceWidth = video.videoWidth || width;
  const sourceHeight = video.videoHeight || height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.fillStyle = "#050608";
  context.fillRect(0, 0, width, height);
  context.drawImage(video, x, y, drawWidth, drawHeight);
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

function parseSrtCaptions(content: string): CaptionLine[] {
  const normalizedContent = content
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .trim();
  if (!normalizedContent) return [];

  return normalizedContent
    .split(/\n{2,}/)
    .flatMap((block, blockIndex) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes("-->"));
      if (timingIndex === -1) return [];

      const [rawStart, rawEnd] = lines[timingIndex].split("-->").map((part) => part.trim());
      const start = srtTimeToSeconds(rawStart);
      const end = srtTimeToSeconds(rawEnd?.split(/\s+/)[0] ?? "");
      const text = lines.slice(timingIndex + 1).join("\n").trim();

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !text) {
        return [];
      }

      return [
        {
          id: `srt-${blockIndex + 1}-${Math.round(start * 1000)}`,
          start: roundTimelineSeconds(start),
          end: roundTimelineSeconds(end),
          text,
        },
      ];
    });
}

function srtTimeToSeconds(value: string) {
  const cleanValue = value.trim().replace(",", ".");
  const parts = cleanValue.split(":");
  if (parts.length < 2 || parts.length > 3) return Number.NaN;

  const [hoursPart, minutesPart, secondsPart] =
    parts.length === 3 ? parts : ["0", parts[0], parts[1]];
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);

  if (![hours, minutes, seconds].every(Number.isFinite)) return Number.NaN;

  return hours * 3600 + minutes * 60 + seconds;
}

/* ── Stock Media Panel ─────────────────────────────────────────────── */
