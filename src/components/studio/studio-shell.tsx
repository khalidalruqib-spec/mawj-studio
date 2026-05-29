"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Captions,
  Cloud,
  ClipboardCopy,
  ClipboardPaste,
  Copy,
  Crop,
  Download,
  Eye,
  EyeOff,
  FolderOpen,
  Layers3,
  LayoutTemplate,
  Loader2,
  Lock,
  Megaphone,
  Plus,
  Redo2,
  Save,
  Scissors,
  SlidersHorizontal,
  Square,
  Trash2,
  Type,
  Undo2,
  Unlock,
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
import { renderTemplateProject } from "@/lib/browser-template-renderer";
import {
  prepareMediaForTranscription,
  type PreparedTranscriptionFile,
} from "@/lib/browser-transcription-audio";
import {
  createSupabaseBrowserClient,
  hasSupabaseBrowserEnv,
} from "@/lib/supabase/client";
import { TEMPLATE_FONT_PRESETS } from "@/lib/template-typography";
import {
  deleteMediaRecord,
  getLatestProjectSnapshot,
  listMediaRecords,
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
  editorLayerPatchToVideoLayerPatch,
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
  RenderCapabilities,
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
import { ExportsPanel } from "@/components/studio/panels/exports";
import { LayerInspector, ProjectSettingsPanel } from "@/components/studio/panels/settings";
import { AssistantPanel } from "@/components/studio/panels/assistant";
import { StockMediaPanel } from "@/components/studio/panels/stock";
import { useProjectPersistence } from "@/components/studio/hooks/use-project-persistence";
import { useTemplateDraftLoader } from "@/components/studio/hooks/use-template-draft-loader";


export function ProfessionalVideoStudio() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const restoredMediaOnceRef = useRef(false);
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
  const [timelineUndo, setTimelineUndo] = useState<TimelineTrack[][]>([]);
  const [timelineRedo, setTimelineRedo] = useState<TimelineTrack[][]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState("clip-main");
  const [layerClipboard, setLayerClipboard] = useState<{
    layer: TimelineLayer;
    trackId: string;
    trackKind: TimelineTrack["kind"];
  } | null>(null);
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
    font: TEMPLATE_FONT_PRESETS[0].cssStack,
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
  const [renderCapabilities, setRenderCapabilities] = useState<RenderCapabilities | null>(null);
  const [error, setError] = useState("");
  const [projectStatus, setProjectStatus] = useState("Autosave ready");
  const engineProject = useVideoProjectStore((state) => state.currentProject);
  const setEngineProject = useVideoProjectStore((state) => state.setCurrentProject);
  const selectEngineLayer = useVideoProjectStore((state) => state.selectLayer);
  const updateEngineLayer = useVideoProjectStore((state) => state.updateLayer);
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
  const selectedLayerStackInfo = useMemo(() => {
    const stack = getStackableTimelineLayers(timelineTracks);
    const layerIndex = stack.findIndex((entry) => entry.layer.id === selectedLayerId);
    if (layerIndex !== -1) {
      return {
        layerIndex,
        layerCount: stack.length,
      };
    }

    return null;
  }, [selectedLayerId, timelineTracks]);
  const canSendLayerBackward = Boolean(selectedLayerStackInfo && selectedLayerStackInfo.layerIndex > 0);
  const canBringLayerForward = Boolean(
    selectedLayerStackInfo && selectedLayerStackInfo.layerIndex < selectedLayerStackInfo.layerCount - 1,
  );
  const selectedLayerSplitOffset = getLayerSplitOffsetAtTime(selectedLayer, previewTime);
  const canSplitSelectedLayer = Boolean(selectedLayer && !selectedLayer.locked && selectedLayerSplitOffset !== null);

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
    let cancelled = false;

    async function loadRenderCapabilities() {
      try {
        const response = await fetch("/api/render-jobs", { method: "GET" });
        const data = (await response.json()) as { capabilities?: RenderCapabilities };
        if (!cancelled) setRenderCapabilities(data.capabilities ?? null);
      } catch {
        if (!cancelled) setRenderCapabilities(null);
      }
    }

    void loadRenderCapabilities();

    return () => {
      cancelled = true;
    };
  }, []);

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
      setTimelineUndo([]);
      setTimelineRedo([]);
      setTimelineTracks(createTimelineForAssets(restoredAssets, firstVideoAsset.id));
    }

    setProjectStatus(`${records.length} media assets restored from browser storage`);
  }, [aspectRatio, setEngineProject, studioFile]);

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
    syncTemplateProjectTimeline(resolvedTracks);
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
    if (selectedLayer.locked && !isLayerStatePatch(patch)) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }
    updateTimelineLayer(selectedLayer.id, patch);
  }

  function updateTimelineLayer(layerId: string, patch: Partial<TimelineLayer>) {
    const existingLayer = timelineTracks.flatMap((track) => track.layers).find((layer) => layer.id === layerId);
    if (existingLayer?.locked && !isLayerStatePatch(patch)) {
      setProjectStatus(`${existingLayer.name} is locked`);
      return;
    }

    const templatePatch = toTemplateTimelinePatch(patch);

    commitTimeline((tracks) =>
      tracks.map((track) => ({
        ...track,
        layers: track.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...patch } : layer,
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

    updateEngineLayer(layerId, editorLayerPatchToVideoLayerPatch(patch));
  }

  function moveTimelineLayerToTrack(layerId: string, targetTrackId: string, patch: Partial<TimelineLayer>) {
    let sourceLayer: TimelineLayer | null = null;
    let sourceTrackId: string | null = null;

    for (const track of timelineTracks) {
      const layer = track.layers.find((entry) => entry.id === layerId);
      if (layer) {
        sourceLayer = layer;
        sourceTrackId = track.id;
        break;
      }
    }

    if (!sourceLayer || !sourceTrackId) {
      setProjectStatus("Could not find the selected timeline layer");
      return;
    }

    if (sourceLayer.locked && !isLayerStatePatch(patch)) {
      setProjectStatus(`${sourceLayer.name} is locked`);
      return;
    }

    const targetTrack = timelineTracks.find((track) => track.id === targetTrackId);
    if (!targetTrack) {
      setProjectStatus("Could not find the target track");
      return;
    }

    if (!isTimelineLayerCompatibleWithTrack(sourceLayer, targetTrack)) {
      setProjectStatus(`${sourceLayer.name} cannot move to ${targetTrack.name}`);
      return;
    }

    if (sourceTrackId === targetTrackId) {
      updateTimelineLayer(layerId, patch);
      return;
    }

    const movedLayer = { ...sourceLayer, ...patch };
    const nextTracks = timelineTracks.map((track) => {
      if (track.id === sourceTrackId) {
        return {
          ...track,
          layers: track.layers.filter((layer) => layer.id !== layerId),
        };
      }

      if (track.id === targetTrackId) {
        return {
          ...track,
          layers: [...track.layers, movedLayer],
        };
      }

      return track;
    });

    commitTimeline(nextTracks);
    setSelectedLayerId(layerId);
    selectEngineLayer(layerId);
    setProjectStatus(`${sourceLayer.name} moved to ${targetTrack.name}`);
  }

  function applyBrandKitToSelectedLayer() {
    if (!selectedLayer || (selectedLayer.type !== "text" && selectedLayer.type !== "caption")) {
      setProjectStatus("Select a text or caption layer before applying Brand Kit");
      return;
    }

    if (selectedLayer.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }

    updateTimelineLayer(selectedLayer.id, {
      fontFamily: resolveBrandKitFontValue(brandKit.font),
      textColor: brandKit.primaryColor,
      color: brandKit.primaryColor,
    });
    setProjectStatus(`Brand Kit applied to ${selectedLayer.name}`);
  }

  function applyBrandKitToAllTextLayers() {
    const textLayers = timelineTracks
      .flatMap((track) => track.layers)
      .filter((layer) => (layer.type === "text" || layer.type === "caption") && !layer.locked);

    if (!textLayers.length) {
      setProjectStatus("No unlocked text or caption layers found");
      return;
    }

    const patch: Partial<TimelineLayer> = {
      fontFamily: resolveBrandKitFontValue(brandKit.font),
      textColor: brandKit.primaryColor,
      color: brandKit.primaryColor,
    };

    textLayers.forEach((layer) => updateTimelineLayer(layer.id, patch));
    setProjectStatus(`Brand Kit applied to ${textLayers.length} text layers`);
  }

  useEffect(() => {
    function handleEditorKeyDown(event: KeyboardEvent) {
      if (activePanel !== "editor" || isEditableKeyboardTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const commandPressed = event.metaKey || event.ctrlKey;

      if (commandPressed && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoTimeline();
        } else {
          undoTimeline();
        }
        return;
      }

      if (commandPressed && key === "d") {
        event.preventDefault();
        duplicateSelectedLayer();
        return;
      }

      if (commandPressed && key === "c") {
        event.preventDefault();
        copySelectedLayer();
        return;
      }

      if (commandPressed && key === "v") {
        event.preventDefault();
        pasteLayerFromClipboard();
        return;
      }

      if (!commandPressed && event.code === "Space") {
        event.preventDefault();
        void togglePlayback();
        return;
      }

      if (!commandPressed && key === "s") {
        event.preventDefault();
        splitSelectedLayer();
        return;
      }

      if (!commandPressed && (key === "j" || key === "l")) {
        event.preventDefault();
        const seekAmount = event.shiftKey ? 5 : 1;
        seekPreview(previewTime + (key === "l" ? seekAmount : -seekAmount));
        return;
      }

      if (event.key === "[" || event.key === "]") {
        event.preventDefault();
        reorderSelectedLayer(
          event.key === "]"
            ? commandPressed
              ? "front"
              : "forward"
            : commandPressed
              ? "back"
              : "backward",
        );
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedLayer) {
        event.preventDefault();
        deleteSelectedLayer();
        return;
      }

      const nudgeAmount = event.shiftKey ? 10 : 1;
      const movement: Record<string, { x: number; y: number } | undefined> = {
        ArrowLeft: { x: -nudgeAmount, y: 0 },
        ArrowRight: { x: nudgeAmount, y: 0 },
        ArrowUp: { x: 0, y: -nudgeAmount },
        ArrowDown: { x: 0, y: nudgeAmount },
      };
      const delta = movement[event.key];

      if (delta) {
        event.preventDefault();
        nudgeSelectedLayer(delta.x, delta.y);
      }
    }

    window.addEventListener("keydown", handleEditorKeyDown);
    return () => window.removeEventListener("keydown", handleEditorKeyDown);
  });

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

  useTemplateDraftLoader({
    onLoad: applyTemplateProject,
    onError: () => setProjectStatus("Could not load template project"),
  });

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
        nextTracks.flatMap((track) => track.layers.map((layer, index) => [layer.id, index] as const)),
      );
      const syncedLayerIds = new Set<string>();
      let syncedTimeline = project.timeline.map((track) => ({
        ...track,
        layers: track.layers
          .filter((layer) => editorLayers.has(layer.id))
          .map((layer) => {
            const editorLayer = editorLayers.get(layer.id);
            if (!editorLayer) return layer;
            syncedLayerIds.add(editorLayer.id);
            const patch = toTemplateTimelinePatch(editorLayer);

            return {
              ...layer,
              ...patch,
              absoluteStart: editorLayer.start,
            };
          })
          .sort((left, right) => (editorLayerOrder.get(left.id) ?? 0) - (editorLayerOrder.get(right.id) ?? 0)),
      }));

      const addedLayers = nextTracks.flatMap((track) =>
        track.layers
          .filter((layer) => !syncedLayerIds.has(layer.id))
          .map((layer) => ({
            trackKind: templateTrackKindForEditorLayer(layer),
            layer: editorLayerToTemplateTimelineLayer(layer, project),
          })),
      );

      if (addedLayers.length) {
        for (const addedLayer of addedLayers) {
          const trackIndex = syncedTimeline.findIndex((track) => track.kind === addedLayer.trackKind);

          if (trackIndex === -1) {
            syncedTimeline = [
              ...syncedTimeline,
              createTemplateTimelineTrack(addedLayer.trackKind, [addedLayer.layer]),
            ];
            continue;
          }

          syncedTimeline = syncedTimeline.map((track, index) =>
            index === trackIndex
              ? {
                  ...track,
                  layers: [...track.layers, addedLayer.layer],
                }
              : track,
          );
        }
      }

      if (!syncedTimeline.some((track) => track.layers.length > 0)) {
        return null;
      }

      return {
        ...project,
        duration: Math.max(
          project.duration,
          ...nextTracks.flatMap((track) => track.layers.map((layer) => layer.start + layer.duration)),
        ),
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

  function seekPreview(seconds: number) {
    const video = videoRef.current;
    const maxSeconds = Math.max(0, studioFile?.durationSeconds ?? totalTimelineSeconds);
    const nextTime = clampNumber(seconds, 0, maxSeconds || totalTimelineSeconds);

    if (video && Number.isFinite(video.duration)) {
      video.currentTime = clampNumber(nextTime, 0, video.duration);
    }

    setPreviewTime(nextTime);
    setEnginePlayhead(nextTime);
  }

  function selectTimelineLayer(layerId: string) {
    setSelectedLayerId(layerId);
    selectEngineLayer(layerId);
  }

  async function prepareRenderJobForExport() {
    try {
      const response = await fetch("/api/render-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: activeProject?.id,
          sourcePath: activeProject?.storagePath ?? undefined,
          format: mapExportFormatForJob(exportFormat),
          quality: mapExportTierForJob(exportTier),
          aspectRatio,
          burnCaptions: captions.length > 0,
          removeBackground: hasBackgroundReplacementEffect(timelineTracks),
          audioEnhancement: Object.entries(activeAudioTools)
            .filter(([, enabled]) => enabled)
            .map(([name]) => name),
        }),
      });

      const data = (await response.json()) as {
        capabilities?: RenderCapabilities;
        job?: { id: string; mode: string; engine: string };
      };

      setRenderCapabilities((current) => data.capabilities ?? current);
      if (response.ok && data.job) {
        setProjectStatus(
          data.job.mode === "production"
            ? `Render job ${data.job.id.slice(0, 8)} queued on ${data.job.engine}`
            : `Browser export prepared; render job ${data.job.id.slice(0, 8)} is tracking the local export`,
        );
      }
    } catch {
      setProjectStatus("Browser export continuing without render job tracking");
    }
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
        await prepareRenderJobForExport();
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
      await prepareRenderJobForExport();
      const result = await renderEditedVideo({
        sourceFile: studioFile.file,
        sourceUrl: studioFile.url,
        sourceFileName: studioFile.file.name,
        sourceDurationSeconds: studioFile.durationSeconds,
        aspectRatio,
        style: activeStyle,
        brandName,
        plan: renderPlan,
        timelineLayers: timelineTracks.flatMap((track) => track.layers),
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
    setRenderResult(null);
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
        onProgress: setRenderProgress,
      });
      setRenderResult(result);
      setProjectStatus(`${clip.label} export ready`);
      setActivePanel("exports");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not export selected clip.");
    } finally {
      setIsRendering(false);
    }
  }

  function splitSelectedLayer() {
    if (!selectedLayer) {
      setProjectStatus("Select a layer before splitting");
      return;
    }

    if (selectedLayer?.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }

    const splitOffset = getLayerSplitOffsetAtTime(selectedLayer, previewTime);
    if (splitOffset === null) {
      setProjectStatus("Move the playhead inside the selected layer to split it");
      return;
    }

    const firstLayerId = `${selectedLayer.id}-a-${crypto.randomUUID().slice(0, 6)}`;
    const secondLayerId = `${selectedLayer.id}-b-${crypto.randomUUID().slice(0, 6)}`;
    const nextTracks = timelineTracks.map((track) => ({
      ...track,
      layers: track.layers.flatMap((layer) => {
        if (layer.id !== selectedLayer.id) return [layer];
        return [
          {
            ...layer,
            id: firstLayerId,
            name: `${layer.name} A`,
            duration: splitOffset,
          },
          {
            ...layer,
            id: secondLayerId,
            name: `${layer.name} B`,
            start: roundTime(layer.start + splitOffset),
            duration: roundTime(layer.duration - splitOffset),
          },
        ];
      }),
    }));

    commitTimeline(nextTracks);
    setSelectedLayerId(secondLayerId);
    selectEngineLayer(secondLayerId);
    setProjectStatus(`${selectedLayer.name} split at ${formatDuration(previewTime)}`);
  }

  function trimSelectedLayer() {
    if (!selectedLayer) return;
    if (selectedLayer.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }

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
    if (!selectedLayer) {
      if (templateProject) {
        clearActiveTemplateProject();
      }
      return;
    }
    if (selectedLayer.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
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
    const textLayer = createManualTextLayer({
      start: Math.max(0, Math.round(previewTime)),
      aspectRatio,
    });
    const nextTracks = timelineTracks.map((track) =>
      track.kind === "overlay"
        ? {
            ...track,
            layers: [...track.layers, textLayer],
          }
        : track,
    );

    commitTimeline(nextTracks);
    setSelectedLayerId(textLayer.id);
    selectEngineLayer(textLayer.id);
    setProjectStatus("Editable text layer added and selected");
  }

  function addShapeLayer() {
    const shapeLayer = createManualShapeLayer({
      start: Math.max(0, roundTime(previewTime)),
      aspectRatio,
      brandColor: brandKit.primaryColor,
    });
    const targetTrack =
      timelineTracks.find((track) => track.kind === "overlay" || track.kind === "shape") ??
      timelineTracks.find((track) => track.kind === "text" || track.kind === "image");
    const nextTracks = targetTrack
      ? timelineTracks.map((track) =>
          track.id === targetTrack.id
            ? {
                ...track,
                layers: [...track.layers, shapeLayer],
              }
            : track,
        )
      : [
          ...timelineTracks,
          {
            id: `track-shape-${crypto.randomUUID().slice(0, 8)}`,
            name: "Shapes",
            kind: "shape" as const,
            layers: [shapeLayer],
          },
        ];

    commitTimeline(nextTracks);
    setSelectedLayerId(shapeLayer.id);
    selectEngineLayer(shapeLayer.id);
    setProjectStatus("Editable shape layer added and selected");
  }

  function addCtaLayerGroup() {
    const ctaLayers = createManualCtaLayers({
      start: Math.max(0, roundTime(previewTime)),
      aspectRatio,
      brandColor: brandKit.primaryColor,
    });
    const textLayer = ctaLayers.find((layer) => layer.type === "text") ?? ctaLayers[ctaLayers.length - 1];
    const targetTrack =
      timelineTracks.find((track) => track.kind === "overlay" || track.kind === "shape") ??
      timelineTracks.find((track) => track.kind === "text" || track.kind === "image");
    const nextTracks = targetTrack
      ? timelineTracks.map((track) =>
          track.id === targetTrack.id
            ? {
                ...track,
                layers: [...track.layers, ...ctaLayers],
              }
            : track,
        )
      : [
          ...timelineTracks,
          {
            id: `track-cta-${crypto.randomUUID().slice(0, 8)}`,
            name: "CTA",
            kind: "overlay" as const,
            layers: ctaLayers,
          },
        ];

    commitTimeline(nextTracks);
    setSelectedLayerId(textLayer.id);
    selectEngineLayer(textLayer.id);
    setProjectStatus("Editable CTA button added and selected");
  }

  function duplicateSelectedLayer() {
    if (!selectedLayer || !isDuplicableEditorLayer(selectedLayer)) {
      setProjectStatus("Select a text, image, shape, or caption layer to duplicate");
      return;
    }
    if (selectedLayer.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }

    const duplicate = duplicateTimelineLayer(selectedLayer, aspectRatio);
    const nextTracks = timelineTracks.map((track) => {
      const layerIndex = track.layers.findIndex((layer) => layer.id === selectedLayer.id);
      if (layerIndex === -1) return track;

      return {
        ...track,
        layers: [
          ...track.layers.slice(0, layerIndex + 1),
          duplicate,
          ...track.layers.slice(layerIndex + 1),
        ],
      };
    });

    commitTimeline(nextTracks);
    setSelectedLayerId(duplicate.id);
    selectEngineLayer(duplicate.id);
    setProjectStatus(`${selectedLayer.name} duplicated`);
  }

  function copySelectedLayer() {
    if (!selectedLayer || !isDuplicableEditorLayer(selectedLayer)) {
      setProjectStatus("Select a text, image, shape, or caption layer to copy");
      return;
    }

    const sourceTrack = timelineTracks.find((track) =>
      track.layers.some((layer) => layer.id === selectedLayer.id),
    );
    if (!sourceTrack) {
      setProjectStatus("Could not find the selected layer track");
      return;
    }

    setLayerClipboard({
      layer: { ...selectedLayer },
      trackId: sourceTrack.id,
      trackKind: sourceTrack.kind,
    });
    setProjectStatus(`${selectedLayer.name} copied`);
  }

  function pasteLayerFromClipboard() {
    if (!layerClipboard) {
      setProjectStatus("Copy a layer before pasting");
      return;
    }

    const targetTrack =
      timelineTracks.find((track) => track.id === layerClipboard.trackId) ??
      timelineTracks.find((track) => track.kind === layerClipboard.trackKind);

    if (!targetTrack) {
      setProjectStatus("Could not find a compatible track for paste");
      return;
    }

    const pastedLayer = createPastedTimelineLayer(layerClipboard.layer, aspectRatio, previewTime);
    const nextTracks = timelineTracks.map((track) =>
      track.id === targetTrack.id
        ? {
            ...track,
            layers: [...track.layers, pastedLayer],
          }
        : track,
    );

    commitTimeline(nextTracks);
    setSelectedLayerId(pastedLayer.id);
    selectEngineLayer(pastedLayer.id);
    setProjectStatus(`${pastedLayer.name} pasted at ${formatDuration(previewTime)}`);
  }

  function reorderSelectedLayer(direction: "forward" | "backward" | "front" | "back") {
    if (!selectedLayer) {
      setProjectStatus("Select a layer to change its order");
      return;
    }
    if (selectedLayer.locked) {
      setProjectStatus(`${selectedLayer.name} is locked`);
      return;
    }

    const stack = getStackableTimelineLayers(timelineTracks);
    const currentIndex = stack.findIndex((entry) => entry.layer.id === selectedLayer.id);
    if (currentIndex === -1) {
      setProjectStatus(`${selectedLayer.name} cannot be reordered`);
      return;
    }

    const [entry] = stack.splice(currentIndex, 1);
    const nextIndex =
      direction === "front"
        ? stack.length
        : direction === "back"
          ? 0
          : direction === "forward"
            ? Math.min(stack.length, currentIndex + 1)
            : Math.max(0, currentIndex - 1);

    if (nextIndex === currentIndex) {
      setProjectStatus(`${selectedLayer.name} is already at this layer edge`);
      return;
    }

    stack.splice(nextIndex, 0, entry);
    const zIndexById = new Map(stack.map((stackEntry, index) => [stackEntry.layer.id, index]));
    const nextTracks = timelineTracks.map((track) => ({
      ...track,
      layers: track.layers.map((layer) => ({
        ...layer,
        zIndex: zIndexById.get(layer.id) ?? layer.zIndex,
      })),
    }));

    commitTimeline(nextTracks);
    setSelectedLayerId(selectedLayer.id);
    selectEngineLayer(selectedLayer.id);
    setProjectStatus(`${selectedLayer.name} layer order updated`);
  }

  function nudgeSelectedLayer(deltaX: number, deltaY: number) {
    if (!selectedLayer || !isPositionableEditorLayer(selectedLayer) || selectedLayer.locked) return;

    const dimensions = getTemplateDimensions(aspectRatio);
    const width = selectedLayer.width ?? dimensions.width;
    const height = selectedLayer.height ?? Math.max(120, dimensions.height * 0.08);
    const nextX = clampNumber((selectedLayer.x ?? 0) + deltaX, 0, Math.max(0, dimensions.width - width));
    const nextY = clampNumber((selectedLayer.y ?? 0) + deltaY, 0, Math.max(0, dimensions.height - height));

    updateTimelineLayer(selectedLayer.id, { x: nextX, y: nextY });
  }

  function toggleSelectedLayerLocked() {
    if (!selectedLayer) {
      setProjectStatus("Select a layer to lock or unlock");
      return;
    }

    updateTimelineLayer(selectedLayer.id, { locked: !selectedLayer.locked });
    setProjectStatus(`${selectedLayer.name} ${selectedLayer.locked ? "unlocked" : "locked"}`);
  }

  function toggleSelectedLayerHidden() {
    if (!selectedLayer) {
      setProjectStatus("Select a layer to show or hide");
      return;
    }

    updateTimelineLayer(selectedLayer.id, { hidden: !selectedLayer.hidden });
    setProjectStatus(`${selectedLayer.name} ${selectedLayer.hidden ? "shown" : "hidden"}`);
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

    setTranscript((segments) =>
      [...segments.filter((segment) => !segment.id.startsWith("silence-gap-")), ...silenceSegments]
        .sort((a, b) => a.start - b.start),
    );
    setPlan(
      createSilenceRemovalPlan({
        transcript: sorted,
        gaps,
        style: activeStyle,
        aspectRatio,
        brandName,
      }),
    );

    commitTimeline((tracks) =>
      tracks.map((track) =>
        track.kind === "effects"
          ? { ...track, layers: [...track.layers, ...silenceMarkers] }
        : track,
      ),
    );
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

  function addEffectLayer(name: string, color: string, duration = Math.min(totalTimelineSeconds, 30)) {
    const effectLayer: TimelineLayer = {
      id: crypto.randomUUID(),
      type: "effect",
      name,
      start: 0,
      duration: Math.max(1, duration),
      color,
    };

    commitTimeline((tracks) => {
      let added = false;
      const nextTracks = tracks.map((track) => {
        if (track.kind !== "effects") return track;
        added = true;
        return {
          ...track,
          layers: [...track.layers, effectLayer],
        };
      });

      if (added) return nextTracks;

      return [
        ...nextTracks,
        {
          id: "track-effects",
          name: "AI Effects",
          kind: "effects",
          layers: [effectLayer],
        },
      ];
    });
  }

  function applyBackgroundReplacement(mode = backgroundMode) {
    setBackgroundMode(mode);
    addEffectLayer(`Background replacement · ${mode}`, "#36d399");
    setProjectStatus(`${mode} background effect applied to timeline`);
  }

  function applyAudioEnhancementChain() {
    setActiveAudioTools((tools) => ({
      ...tools,
      "Noise reduction": true,
      "Voice enhancement": true,
      "Echo reduction": true,
      "Auto volume leveling": true,
    }));
    addEffectLayer("Audio cleanup chain · noise/echo/leveling", "#7dd3fc");
    setProjectStatus("Audio enhancement chain applied to timeline");
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
      setProjectStatus(`AI Ad Maker generated and applied using ${data.provider ?? "AI"} ${data.model ?? ""}`.trim());
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
        setActivePanel("audio");
        setProjectStatus("ميزة تحسين الصوت تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro.");
        setAssistantMessages((messages) =>
          [
            createAssistantMessage(
              "assistant",
              "ميزة تحسين الصوت تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro. فتحت لك لوحة الصوت للتحكم اليدوي الحالي.",
              [action],
            ),
            ...messages,
          ].slice(0, 12),
        );
      }

      if (action.type === "REMOVE_BACKGROUND") {
        setActivePanel("background");
        setProjectStatus("ميزة إزالة الخلفية تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro.");
        setAssistantMessages((messages) =>
          [
            createAssistantMessage(
              "assistant",
              "ميزة إزالة الخلفية من الفيديو تحتاج معالجة خادم. سنضيفها قريبًا في Mawj Pro. فتحت لك لوحة الخلفية للتجهيز اليدوي.",
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
              className="drop-zone mb-3 flex min-h-32 w-full flex-col items-center justify-center gap-2 p-4 text-center"
            >
              <UploadCloud className="h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
              <span className="text-sm font-black">Drag media here</span>
              <span className="text-xs font-semibold text-[var(--muted)]">Video · Audio · Images</span>
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
                        Layer
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
                    <ToolbarButton label="Trim" icon={Scissors} onClick={trimSelectedLayer} disabled={!selectedLayer || selectedLayer.locked} />
                    <ToolbarButton label="Split" icon={Crop} onClick={splitSelectedLayer} disabled={!canSplitSelectedLayer} />
                    <ToolbarButton label="Merge" icon={Layers3} onClick={mergeVideoLayers} />
                    <ToolbarButton label="Text" icon={Type} onClick={addTextLayer} />
                    <ToolbarButton label="Shape" icon={Square} onClick={addShapeLayer} />
                    <ToolbarButton label="CTA" icon={Megaphone} onClick={addCtaLayerGroup} />
                    <ToolbarButton
                      label="Duplicate"
                      icon={Copy}
                      onClick={duplicateSelectedLayer}
                      disabled={!isDuplicableEditorLayer(selectedLayer) || selectedLayer?.locked}
                    />
                    <ToolbarButton
                      label="Copy"
                      icon={ClipboardCopy}
                      onClick={copySelectedLayer}
                      disabled={!isDuplicableEditorLayer(selectedLayer)}
                    />
                    <ToolbarButton
                      label="Paste"
                      icon={ClipboardPaste}
                      onClick={pasteLayerFromClipboard}
                      disabled={!layerClipboard}
                    />
                    <ToolbarButton
                      label={selectedLayer?.hidden ? "Show" : "Hide"}
                      icon={selectedLayer?.hidden ? Eye : EyeOff}
                      onClick={toggleSelectedLayerHidden}
                      disabled={!selectedLayer}
                    />
                    <ToolbarButton
                      label={selectedLayer?.locked ? "Unlock" : "Lock"}
                      icon={selectedLayer?.locked ? Unlock : Lock}
                      onClick={toggleSelectedLayerLocked}
                      disabled={!selectedLayer}
                    />
                    <ToolbarButton
                      label="Back"
                      icon={ArrowDown}
                      onClick={() => reorderSelectedLayer("backward")}
                      disabled={!canSendLayerBackward || selectedLayer?.locked}
                    />
                    <ToolbarButton
                      label="Forward"
                      icon={ArrowUp}
                      onClick={() => reorderSelectedLayer("forward")}
                      disabled={!canBringLayerForward || selectedLayer?.locked}
                    />
                    <ToolbarButton label="Update" icon={Save} onClick={saveProjectSnapshot} />
                    <ToolbarButton
                      label={selectedLayer ? "Delete" : "Clear"}
                      icon={Trash2}
                      onClick={deleteSelectedLayer}
                      disabled={Boolean(selectedLayer?.locked) || (!selectedLayer && !templateProject)}
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
                    timelineTracks={timelineTracks}
                    selectedLayerId={selectedLayerId}
                    isPlaying={isPlaying}
                    previewTime={previewTime}
                    onLoadedMetadata={captureDuration}
                    onTimeUpdate={handlePreviewTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    onTogglePlayback={togglePlayback}
                    onUploadClick={() => inputRef.current?.click()}
                    onCreatorCommand={runAssistantCommand}
                    onClearTemplateProject={clearActiveTemplateProject}
                    onSelectLayer={selectTimelineLayer}
                    onUpdateLayer={updateTimelineLayer}
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
                currentTime={previewTime}
                onSelectLayer={selectTimelineLayer}
                onUpdateLayer={updateTimelineLayer}
                onMoveLayer={moveTimelineLayerToTrack}
                onSeek={seekPreview}
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
          selectedLayerName={selectedLayer?.name}
          onBrandNameChange={setBrandName}
          onApplyToSelectedLayer={applyBrandKitToSelectedLayer}
          onApplyToAllTextLayers={applyBrandKitToAllTextLayers}
        />
      );
    }

    if (activePanel === "stock") {
      return (
        <StockMediaPanel
          onAddToTimeline={(asset) => {
            setMediaAssets((prev) => {
              const exists = prev.some((a) => a.id === asset.id);
              return exists ? prev : [asset, ...prev];
            });
            addMediaAssetToTimeline(asset);
          }}
          onAddToMediaBin={(asset) => {
            setMediaAssets((prev) => {
              const exists = prev.some((a) => a.id === asset.id);
              return exists ? prev : [asset, ...prev];
            });
            setProjectStatus(`${asset.name} added to media bin`);
          }}
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
          renderCapabilities={renderCapabilities}
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
        <LayerInspector
          layer={selectedLayer}
          aspectRatio={aspectRatio}
          onChange={updateSelectedLayer}
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
            ? { ...track, layers: [...track.layers, ...clips] }
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
              .join("\n")}\n\nتقدر تصدر نسخة 30s من زر Export 30s Clip في لوحة المساعد.`,
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
      setCaptionTemplate("Karaoke Yellow");
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
      setCaptionTemplate("Saudi Viral Bold");
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

function createDefaultTimeline(): TimelineTrack[] {
  return createTimelineForVideo("Source video", 36);
}

function createManualTextLayer({
  start,
  aspectRatio,
}: {
  start: number;
  aspectRatio: AspectRatio;
}): TimelineLayer {
  const box = getManualTextLayerBox(aspectRatio);
  const content = "اكتب عنوانك هنا";

  return {
    id: `text-${crypto.randomUUID()}`,
    type: "text",
    name: content,
    content,
    start,
    duration: 5,
    color: "#facc15",
    textColor: "#ffffff",
    fontFamily: TEMPLATE_FONT_PRESETS[1].cssStack,
    fontSize: aspectRatio === "16:9" ? 64 : 72,
    fontWeight: "900",
    align: "center",
    direction: "auto",
    backgroundColor: "rgba(5, 6, 8, 0.42)",
    borderRadius: 28,
    opacity: 1,
    ...box,
  };
}

function getManualTextLayerBox(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") {
    return { x: 160, y: 760, width: 1600, height: 170 };
  }

  if (aspectRatio === "1:1") {
    return { x: 90, y: 760, width: 900, height: 170 };
  }

  return { x: 70, y: 1280, width: 940, height: 190 };
}

function createManualShapeLayer({
  start,
  aspectRatio,
  brandColor,
}: {
  start: number;
  aspectRatio: AspectRatio;
  brandColor?: string;
}): TimelineLayer {
  const box = getManualShapeLayerBox(aspectRatio);
  const color = normalizeHexColor(brandColor ?? "#8ef7c2");

  return {
    id: `shape-${crypto.randomUUID()}`,
    type: "shape",
    name: "CTA badge shape",
    start,
    duration: 5,
    color,
    backgroundColor: color,
    borderRadius: aspectRatio === "16:9" ? 32 : 42,
    opacity: 0.86,
    ...box,
  };
}

function getManualShapeLayerBox(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") {
    return { x: 610, y: 780, width: 700, height: 130 };
  }

  if (aspectRatio === "1:1") {
    return { x: 220, y: 800, width: 640, height: 130 };
  }

  return { x: 140, y: 1420, width: 800, height: 150 };
}

function createManualCtaLayers({
  start,
  aspectRatio,
  brandColor,
}: {
  start: number;
  aspectRatio: AspectRatio;
  brandColor?: string;
}): TimelineLayer[] {
  const shapeBox = getManualShapeLayerBox(aspectRatio);
  const color = normalizeHexColor(brandColor ?? "#8ef7c2");
  const textInset = aspectRatio === "16:9" ? 34 : 42;
  const textLayer: TimelineLayer = {
    id: `cta-text-${crypto.randomUUID()}`,
    type: "text",
    name: "اطلب الآن",
    content: "اطلب الآن",
    start,
    duration: 5,
    color: "#050608",
    textColor: "#050608",
    fontFamily: TEMPLATE_FONT_PRESETS[1].cssStack,
    fontSize: aspectRatio === "16:9" ? 58 : 68,
    fontWeight: "900",
    align: "center",
    direction: "auto",
    backgroundColor: "transparent",
    borderRadius: 0,
    opacity: 1,
    x: shapeBox.x + textInset,
    y: shapeBox.y + Math.round(textInset * 0.52),
    width: shapeBox.width - textInset * 2,
    height: shapeBox.height - textInset,
  };
  const shapeLayer: TimelineLayer = {
    id: `cta-shape-${crypto.randomUUID()}`,
    type: "shape",
    name: "CTA button background",
    start,
    duration: 5,
    color,
    backgroundColor: color,
    borderRadius: aspectRatio === "16:9" ? 34 : 46,
    opacity: 0.92,
    ...shapeBox,
  };

  return [shapeLayer, textLayer];
}

function duplicateTimelineLayer(layer: TimelineLayer, aspectRatio: AspectRatio): TimelineLayer {
  const dimensions = getTemplateDimensions(aspectRatio);
  const width = layer.width ?? (layer.type === "image" ? dimensions.width * 0.45 : dimensions.width * 0.82);
  const height = layer.height ?? (layer.type === "image" ? dimensions.height * 0.28 : dimensions.height * 0.1);
  const offset = aspectRatio === "16:9" ? 42 : 56;

  return {
    ...layer,
    id: `${layer.type}-${crypto.randomUUID()}`,
    name: `${layer.name} copy`,
    x: clampNumber((layer.x ?? 0) + offset, 0, Math.max(0, dimensions.width - width)),
    y: clampNumber((layer.y ?? 0) + offset, 0, Math.max(0, dimensions.height - height)),
    width,
    height,
  };
}

function createPastedTimelineLayer(layer: TimelineLayer, aspectRatio: AspectRatio, start: number): TimelineLayer {
  return {
    ...duplicateTimelineLayer(layer, aspectRatio),
    start: roundTime(Math.max(0, start)),
    sceneId: undefined,
    locked: false,
    hidden: false,
  };
}

function isPositionableEditorLayer(layer: TimelineLayer | null) {
  return Boolean(
    layer &&
      (layer.type === "text" ||
        layer.type === "caption" ||
        layer.type === "image" ||
        layer.type === "shape"),
  );
}

function isDuplicableEditorLayer(layer: TimelineLayer | null) {
  return isPositionableEditorLayer(layer);
}

function getStackableTimelineLayers(tracks: TimelineTrack[]) {
  return tracks
    .flatMap((track) => track.layers)
    .map((layer, index) => ({ layer, fallbackIndex: index }))
    .filter(({ layer }) => isStackableEditorLayer(layer))
    .sort((left, right) => getLayerStackValue(left.layer, left.fallbackIndex) - getLayerStackValue(right.layer, right.fallbackIndex));
}

function getLayerStackValue(layer: TimelineLayer, fallbackIndex: number) {
  return Number.isFinite(layer.zIndex) ? layer.zIndex ?? fallbackIndex : fallbackIndex;
}

function isStackableEditorLayer(layer: TimelineLayer) {
  return layer.type === "video" || layer.type === "image" || layer.type === "text" || layer.type === "caption" || layer.type === "shape" || layer.type === "background";
}

function isTimelineLayerCompatibleWithTrack(layer: TimelineLayer, track: TimelineTrack) {
  if (track.kind === "video") return layer.type === "video";
  if (track.kind === "audio") return layer.type === "audio" || layer.type === "waveform";
  if (track.kind === "caption") return layer.type === "caption";
  if (track.kind === "effects") return layer.type === "effect" || layer.type === "shape" || layer.type === "background" || layer.type === "waveform";
  if (track.kind === "overlay") return layer.type === "text" || layer.type === "image" || layer.type === "shape" || layer.type === "caption";
  if (track.kind === "text") return layer.type === "text";
  if (track.kind === "image") return layer.type === "image";
  if (track.kind === "shape") return layer.type === "shape";
  if (track.kind === "background") return layer.type === "background";
  if (track.kind === "waveform") return layer.type === "waveform";
  return false;
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isEditableKeyboardTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

function isLayerStatePatch(patch: Partial<TimelineLayer>) {
  const keys = Object.keys(patch);
  return keys.length > 0 && keys.every((key) => key === "locked" || key === "hidden");
}

function getLayerSplitOffsetAtTime(layer: TimelineLayer | null, time: number) {
  if (!layer) return null;

  const minSegmentDuration = 0.5;
  const offset = roundTime(time - layer.start);
  if (offset < minSegmentDuration || layer.duration - offset < minSegmentDuration) {
    return null;
  }

  return offset;
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

function mapExportFormatForJob(format: string) {
  if (format === "GIF") return "gif";
  if (format === "MP3") return "mp3";
  if (format === "SRT") return "srt";
  if (format === "Thumbnail") return "thumbnail";
  return "mp4";
}

function mapExportTierForJob(tier: string) {
  if (tier === "Free") return "720p";
  if (tier === "Pro") return "4k";
  return "1080p";
}

function hasBackgroundReplacementEffect(tracks: TimelineTrack[]) {
  return tracks.some((track) =>
    track.layers.some((layer) => layer.type === "effect" && layer.name.startsWith("Background replacement")),
  );
}

function editorLayerToTemplateTimelineLayer(
  layer: TimelineLayer,
  project: TemplateProject,
): TemplateTimelineTrack["layers"][number] {
  const scene = findTemplateSceneForLayer(project.scenes, layer);
  const templateType = templateLayerTypeForEditorLayer(layer);
  const relativeStart = Math.max(0, roundTime(layer.start - scene.start));

  return {
    id: layer.id,
    sceneId: scene.id,
    sceneName: scene.name,
    type: templateType,
    name: layer.name,
    content: layer.content,
    src: layer.src,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    rotation: layer.rotation,
    start: relativeStart,
    absoluteStart: layer.start,
    duration: Math.max(0.1, layer.duration),
    zIndex: layer.zIndex,
    color: layer.textColor ?? layer.color,
    backgroundColor: layer.backgroundColor,
    borderRadius: layer.borderRadius,
    borderColor: layer.borderColor,
    borderWidth: layer.borderWidth,
    shadowColor: layer.shadowColor,
    shadowBlur: layer.shadowBlur,
    shadowOffsetX: layer.shadowOffsetX,
    shadowOffsetY: layer.shadowOffsetY,
    blendMode: layer.blendMode,
    padding: layer.padding,
    opacity: layer.opacity,
    brightness: layer.brightness,
    contrast: layer.contrast,
    saturation: layer.saturation,
    blur: layer.blur,
    mediaZoom: layer.mediaZoom,
    mediaOffsetX: layer.mediaOffsetX,
    mediaOffsetY: layer.mediaOffsetY,
    locked: layer.locked,
    hidden: layer.hidden,
    fontFamily: layer.fontFamily,
    fontSize: layer.fontSize,
    fontWeight: layer.fontWeight,
    lineHeight: layer.lineHeight,
    textStrokeColor: layer.textStrokeColor,
    textStrokeWidth: layer.textStrokeWidth,
    textShadowColor: layer.textShadowColor,
    textShadowBlur: layer.textShadowBlur,
    textShadowOffsetX: layer.textShadowOffsetX,
    textShadowOffsetY: layer.textShadowOffsetY,
    align: layer.align,
    direction: layer.direction,
    editable: true,
    animationIn: layer.animationIn ?? (
      templateType === "text" || templateType === "captions"
        ? { type: "slideUp", duration: 0.45 }
        : undefined
    ),
    animationOut: layer.animationOut,
  };
}

function findTemplateSceneForLayer(scenes: TemplateScene[], layer: TimelineLayer) {
  const matchingScene =
    scenes.find((scene) => scene.id === layer.sceneId) ??
    scenes.find((scene) => layer.start >= scene.start && layer.start < scene.start + scene.duration);

  return matchingScene ?? scenes[0] ?? {
    id: "scene-main",
    name: "Main Scene",
    start: 0,
    duration: Math.max(1, layer.duration),
    background: { type: "color" as const, value: "#050608" },
    layers: [],
  };
}

function createTemplateTimelineTrack(
  kind: TemplateTimelineTrack["kind"],
  layers: TemplateTimelineTrack["layers"],
): TemplateTimelineTrack {
  const label: Record<TemplateTimelineTrack["kind"], string> = {
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

  return {
    id: `track-${kind}`,
    name: label[kind],
    kind,
    layers,
  };
}

function templateTrackKindForEditorLayer(layer: TimelineLayer): TemplateTimelineTrack["kind"] {
  if (layer.type === "caption") return "captions";
  if (layer.type === "background") return "background";
  if (layer.type === "shape") return "shape";
  if (layer.type === "effect") return "shape";
  if (layer.type === "waveform") return "waveform";
  if (layer.type === "image") return "image";
  if (layer.type === "video") return "video";
  if (layer.type === "audio") return "audio";
  return "text";
}

function templateLayerTypeForEditorLayer(layer: TimelineLayer): TemplateTimelineTrack["layers"][number]["type"] {
  if (layer.type === "caption") return "captions";
  if (layer.type === "background") return "background";
  if (layer.type === "shape") return "shape";
  if (layer.type === "effect") return "shape";
  if (layer.type === "waveform") return "waveform";
  if (layer.type === "image") return "image";
  if (layer.type === "video") return "video";
  if (layer.type === "audio") return "audio";
  return "text";
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
      zIndex: layer.zIndex,
      color: normalizeHexColor(layer.color ?? layer.backgroundColor ?? colorForTemplateLayer(layer.type)),
      content: layer.content,
      src: layer.src,
      sceneId: layer.sceneId,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      lineHeight: layer.lineHeight,
      textColor: layer.color,
      textStrokeColor: layer.textStrokeColor,
      textStrokeWidth: layer.textStrokeWidth,
      textShadowColor: layer.textShadowColor,
      textShadowBlur: layer.textShadowBlur,
      textShadowOffsetX: layer.textShadowOffsetX,
      textShadowOffsetY: layer.textShadowOffsetY,
      align: layer.align,
      direction: layer.direction,
      backgroundColor: layer.backgroundColor,
      borderRadius: layer.borderRadius,
      shadowColor: layer.shadowColor,
      shadowBlur: layer.shadowBlur,
      shadowOffsetX: layer.shadowOffsetX,
      shadowOffsetY: layer.shadowOffsetY,
      blendMode: layer.blendMode,
      borderColor: layer.borderColor,
      borderWidth: layer.borderWidth,
      padding: layer.padding,
      opacity: layer.opacity,
      fit: layer.fit,
      brightness: layer.brightness,
      contrast: layer.contrast,
      saturation: layer.saturation,
      blur: layer.blur,
      mediaZoom: layer.mediaZoom,
      mediaOffsetX: layer.mediaOffsetX,
      mediaOffsetY: layer.mediaOffsetY,
      animationIn: layer.animationIn,
      animationOut: layer.animationOut,
      locked: layer.locked,
      hidden: layer.hidden,
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
    zIndex: patch.zIndex,
    color: patch.color ?? patch.textColor,
    backgroundColor: patch.backgroundColor,
    x: patch.x,
    y: patch.y,
    width: patch.width,
    height: patch.height,
    rotation: patch.rotation,
    fontFamily: patch.fontFamily,
    fontSize: patch.fontSize,
    fontWeight: patch.fontWeight,
    lineHeight: patch.lineHeight,
    textStrokeColor: patch.textStrokeColor,
    textStrokeWidth: patch.textStrokeWidth,
    textShadowColor: patch.textShadowColor,
    textShadowBlur: patch.textShadowBlur,
    textShadowOffsetX: patch.textShadowOffsetX,
    textShadowOffsetY: patch.textShadowOffsetY,
    align: patch.align,
    direction: patch.direction,
    borderRadius: patch.borderRadius,
    borderColor: patch.borderColor,
    borderWidth: patch.borderWidth,
    shadowColor: patch.shadowColor,
    shadowBlur: patch.shadowBlur,
    shadowOffsetX: patch.shadowOffsetX,
    shadowOffsetY: patch.shadowOffsetY,
    blendMode: patch.blendMode,
    padding: patch.padding,
    opacity: patch.opacity,
    fit: patch.fit,
    brightness: patch.brightness,
    contrast: patch.contrast,
    saturation: patch.saturation,
    blur: patch.blur,
    mediaZoom: patch.mediaZoom,
    mediaOffsetX: patch.mediaOffsetX,
    mediaOffsetY: patch.mediaOffsetY,
    animationIn: patch.animationIn,
    animationOut: patch.animationOut,
    locked: patch.locked,
    hidden: patch.hidden,
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

function resolveBrandKitFontValue(font: string) {
  const matchingPreset = TEMPLATE_FONT_PRESETS.find(
    (preset) => preset.cssStack === font || preset.cssStack.includes(font) || preset.canvasStack.includes(font),
  );
  return matchingPreset?.cssStack ?? TEMPLATE_FONT_PRESETS[0].cssStack;
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

/* ── Stock Media Panel ─────────────────────────────────────────────── */
