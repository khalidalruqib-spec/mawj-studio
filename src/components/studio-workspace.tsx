"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Captions,
  ChevronDown,
  Clock3,
  Download,
  Film,
  Gauge,
  Layers3,
  Loader2,
  Maximize2,
  Music2,
  PanelRight,
  Pause,
  Play,
  Ratio,
  Scissors,
  Settings2,
  Sparkles,
  UploadCloud,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { EditPlan } from "@/lib/edit-plan";
import type { StudioProject } from "@/lib/project-store";
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
  type VideoStyleId,
} from "@/lib/video-styles";

const GOAL_LABELS = {
  engagement: "تفاعل",
  sales: "مبيعات",
  education: "تعليم",
  awareness: "وعي",
} as const;

type Goal = keyof typeof GOAL_LABELS;

type StudioFile = {
  file: File;
  url: string;
  durationSeconds: number;
};

type UploadUrlResponse = {
  mode: "supabase" | "local-preview";
  bucket: string;
  path: string;
  token: string | null;
  project: StudioProject;
  error?: string;
};

export function StudioWorkspace() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [studioFile, setStudioFile] = useState<StudioFile | null>(null);
  const [styleId, setStyleId] = useState<VideoStyleId>("viral-saudi");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [languageMode, setLanguageMode] = useState<LanguageMode>("arabic");
  const [goal, setGoal] = useState<Goal>("engagement");
  const [brandName, setBrandName] = useState("Mawj Studio");
  const [plan, setPlan] = useState<EditPlan | null>(null);
  const [activeProject, setActiveProject] = useState<StudioProject | null>(null);
  const [recentProjects, setRecentProjects] = useState<StudioProject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [storageStatus, setStorageStatus] = useState("No project saved yet");

  const activeStyle = useMemo(
    () => VIDEO_STYLES.find((style) => style.id === styleId) ?? VIDEO_STYLES[0],
    [styleId],
  );

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      const data = await response.json();
      setRecentProjects(data.projects ?? []);
    } catch {
      setRecentProjects([]);
    }
  }, []);

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("ارفع ملف فيديو فقط.");
      return;
    }

    const url = URL.createObjectURL(file);
    setStudioFile({ file, url, durationSeconds: 60 });
    setActiveProject(null);
    setPlan(null);
    setStorageStatus("Ready to save source video");
    setError("");
  }

  function captureDuration() {
    const duration = videoRef.current?.duration;
    if (!studioFile || !duration || Number.isNaN(duration)) return;
    setStudioFile({ ...studioFile, durationSeconds: Math.round(duration) });
  }

  async function generatePlan() {
    if (!studioFile) {
      setError("ارفع الفيديو أولاً.");
      return;
    }

    setIsGenerating(true);
    setError("");

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
      if (!response.ok) throw new Error(data.error ?? "تعذر توليد خطة المونتاج.");
      setPlan(data.plan);
      if (data.project) setActiveProject(data.project);
      await loadProjects();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "صار خطأ غير متوقع.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function ensureProjectUploaded() {
    if (!studioFile) throw new Error("ارفع الفيديو أولاً.");
    if (activeProject?.status === "uploaded" || activeProject?.status === "planned") {
      return activeProject;
    }

    setIsUploading(true);
    setStorageStatus("Creating project...");

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
        throw new Error(projectData.error ?? "تعذر إنشاء المشروع.");
      }

      let project = projectData.project as StudioProject;
      setActiveProject(project);
      setStorageStatus("Requesting upload URL...");

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
        throw new Error(uploadData.error ?? "تعذر تجهيز رابط الرفع.");
      }

      if (uploadData.mode === "supabase") {
        if (!uploadData.token || !hasSupabaseBrowserEnv()) {
          throw new Error("أضف NEXT_PUBLIC_SUPABASE_* حتى يتم رفع الفيديو من المتصفح.");
        }

        setStorageStatus("Uploading source video to Supabase...");
        const supabase = createSupabaseBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from(uploadData.bucket)
          .uploadToSignedUrl(uploadData.path, uploadData.token, studioFile.file, {
            contentType: studioFile.file.type || "video/mp4",
          });

        if (uploadError) throw new Error(uploadError.message);
        setStorageStatus("Source video stored in Supabase");
      } else {
        setStorageStatus("Local preview mode: project saved without cloud upload");
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

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]">
        <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand)] text-black">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-lg font-black leading-5">Mawj Studio</p>
              <p className="text-xs font-semibold text-[var(--muted)]">AI Video Editing Platform</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 text-xs font-bold md:flex">
            <StatusPill label="Upload" active={Boolean(studioFile)} />
            <StatusPill label="Plan" active={Boolean(plan)} />
            <StatusPill label="Render" active={false} />
          </div>

          <button
            type="button"
            onClick={generatePlan}
            disabled={isGenerating || isUploading}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGenerating || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <WandSparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {isUploading ? "Saving..." : isGenerating ? "Generating..." : "Generate edit"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1520px] gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
        <aside className="space-y-4">
          <section className="panel p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h1 className="text-xl font-black">استوديو المونتاج</h1>
              <Film className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files[0]);
              }}
              onDragOver={(event) => event.preventDefault()}
              className="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] px-4 py-5 text-center transition hover:border-[var(--brand)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                <UploadCloud className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="text-sm font-black">
                {studioFile ? studioFile.file.name : "ارفع فيديو خام"}
              </span>
                <span className="text-xs font-semibold text-[var(--muted)]">
                  MP4, MOV, M4V · حتى ساعتين في النسخة القادمة
                </span>
            </button>

            <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
              <p className="text-xs font-black text-[var(--muted)]">Storage</p>
              <p className="mt-1 text-sm font-bold leading-6">{storageStatus}</p>
              {activeProject ? (
                <p className="mt-2 text-xs font-semibold text-[var(--muted)]">
                  Project: {activeProject.id.slice(0, 8)} · {activeProject.status}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
                {error}
              </p>
            ) : null}
          </section>

          <section className="panel p-4">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              <h2 className="text-sm font-black">Styles</h2>
            </div>

            <div className="space-y-2">
              {VIDEO_STYLES.map((style) => {
                const Icon = style.icon;
                const selected = style.id === styleId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setStyleId(style.id)}
                    className={`w-full rounded-lg border p-3 text-right transition ${
                      selected
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--line-strong)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${style.accent} text-black`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black">{style.arabicName}</span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                          {style.description}
                        </span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                <Ratio className="h-4 w-4" aria-hidden="true" />
                {aspectRatio} · {PLATFORM_LABELS[platform]}
              </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative grid min-h-[520px] place-items-center overflow-hidden rounded-lg bg-black">
                {studioFile ? (
                  <video
                    ref={videoRef}
                    src={studioFile.url}
                    onLoadedMetadata={captureDuration}
                    onEnded={() => setIsPlaying(false)}
                    className={`max-h-[640px] w-full ${
                      aspectRatio === "9:16"
                        ? "aspect-[9/16] max-w-[360px]"
                        : aspectRatio === "1:1"
                          ? "aspect-square max-w-[520px]"
                          : "aspect-video max-w-[880px]"
                    } bg-black object-contain`}
                  />
                ) : (
                  <div className="grid place-items-center px-6 text-center">
                    <div className="space-y-4">
                      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white/8 text-[var(--brand)]">
                        <ClapperIcon />
                      </span>
                      <div>
                        <p className="text-2xl font-black">Drop raw footage</p>
                        <p className="mt-2 text-sm font-semibold text-white/55">
                          اختر ستايل مونتاج، ثم ولّد خطة جاهزة للريلز والشورتس.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/70 px-3 py-2 backdrop-blur">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    disabled={!studioFile}
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-black transition hover:bg-[var(--brand)] disabled:opacity-40"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>

                  <div className="mx-3 h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-2/5 rounded-full bg-[var(--brand)]" />
                  </div>

                  <span className="text-xs font-black text-white/70">
                    {studioFile ? formatDuration(studioFile.durationSeconds) : "00:00"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Metric label="AI confidence" value={plan ? `${plan.confidence}%` : "--"} icon={Gauge} />
                <Metric label="Target cut" value={plan ? `${plan.targetDurationSeconds}s` : "--"} icon={Clock3} />
                <Metric label="Captions" value={activeStyle.captionPreset} icon={Captions} />
                <Metric label="Music" value={activeStyle.musicMood} icon={Music2} />
              </div>
            </div>
          </div>

          <Timeline plan={plan} />
        </section>

        <aside className="space-y-4">
          <section className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              <h2 className="text-sm font-black">Recent projects</h2>
            </div>

            {recentProjects.length ? (
              <div className="space-y-2">
                {recentProjects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setActiveProject(project);
                      setPlan(project.editPlan ?? null);
                      setStyleId(project.styleId);
                      setPlatform(project.platform);
                      setAspectRatio(project.aspectRatio);
                      setStorageStatus(
                        project.storagePath
                          ? `Saved: ${project.storagePath}`
                          : "Project exists without source upload",
                      );
                    }}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-right transition hover:border-[var(--brand)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-black">{project.title}</p>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black">
                        {project.status}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-[var(--muted)]">
                      {project.sourceFileName}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyPanel compact />
            )}
          </section>

          <section className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              <h2 className="text-sm font-black">Project settings</h2>
            </div>

            <div className="space-y-3">
              <Field label="Brand">
                <input
                  value={brandName}
                  onChange={(event) => setBrandName(event.target.value)}
                  className="control-input"
                />
              </Field>

              <Field label="Platform">
                <SelectShell>
                  <select
                    value={platform}
                    onChange={(event) => setPlatform(event.target.value as Platform)}
                    className="control-select"
                  >
                    {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </SelectShell>
              </Field>

              <Field label="Format">
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAspectRatio(preset.id as AspectRatio)}
                      className={`min-h-11 rounded-lg border px-2 text-xs font-black transition ${
                        aspectRatio === preset.id
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      {preset.id}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Language">
                <SelectShell>
                  <select
                    value={languageMode}
                    onChange={(event) => setLanguageMode(event.target.value as LanguageMode)}
                    className="control-select"
                  >
                    <option value="arabic">Arabic</option>
                    <option value="english">English</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </SelectShell>
              </Field>

              <Field label="Goal">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(GOAL_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGoal(value as Goal)}
                      className={`min-h-11 rounded-lg border px-2 text-xs font-black transition ${
                        goal === value
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                          : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <section className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <PanelRight className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              <h2 className="text-sm font-black">AI edit brief</h2>
            </div>

            {plan ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                  <p className="text-xs font-bold text-[var(--muted)]">Hook</p>
                  <p className="mt-2 text-lg font-black leading-7">{plan.hook}</p>
                </div>
                <p className="text-sm font-semibold leading-7 text-[var(--muted)]">{plan.summary}</p>
                <div className="grid grid-cols-2 gap-2">
                  <SmallSetting label="Resolution" value={plan.renderSettings.resolution} />
                  <SmallSetting label="FPS" value={`${plan.renderSettings.fps}`} />
                  <SmallSetting label="Loudness" value={plan.renderSettings.loudness} />
                  <SmallSetting label="Margins" value="Safe" />
                </div>
              </div>
            ) : (
              <EmptyPanel />
            )}
          </section>

          <section className="panel p-4">
            <div className="mb-4 flex items-center gap-2">
              <Download className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
              <h2 className="text-sm font-black">Exports</h2>
            </div>

            {plan ? (
              <div className="space-y-2">
                {plan.exportVariants.map((variant) => (
                  <div
                    key={variant.platform}
                    className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black">{variant.platform}</p>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-black">
                        {variant.duration}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[var(--muted)]">
                      {variant.caption}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel compact />
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

function Timeline({ plan }: { plan: EditPlan | null }) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
          <h2 className="text-sm font-black">Timeline</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <Scissors className="h-4 w-4" aria-hidden="true" />
          Auto-cut plan
        </div>
      </div>

      {plan ? (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-4">
            {plan.timeline.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{item.label}</p>
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {item.start}s-{item.end}s
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      item.intensity === "high"
                        ? "bg-red-300"
                        : item.intensity === "medium"
                          ? "bg-[var(--brand)]"
                          : "bg-sky-300"
                    }`}
                    style={{ width: `${Math.max(20, ((item.end - item.start) / plan.targetDurationSeconds) * 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-[var(--muted)]">{item.action}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
            <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
              <div className="mb-3 flex items-center gap-2">
                <Captions className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                <p className="text-sm font-black">Caption script</p>
              </div>
              <div className="space-y-2">
                {plan.captions.map((caption) => (
                  <div key={`${caption.at}-${caption.text}`} className="grid grid-cols-[46px_minmax(0,1fr)] gap-3 rounded-md bg-black/20 p-2">
                    <span className="text-xs font-black text-[var(--brand)]">{caption.at}s</span>
                    <p className="text-sm font-bold leading-6">{caption.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                <p className="text-sm font-black">Tool stack</p>
              </div>
              <div className="space-y-2">
                {plan.aiTools.map((tool) => (
                  <div key={tool.name} className="rounded-md bg-black/20 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black">{tool.name}</p>
                      <span className="text-[var(--brand)]">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{tool.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-5 text-center">
          <div>
            <Scissors className="mx-auto h-8 w-8 text-[var(--brand)]" aria-hidden="true" />
            <p className="mt-3 text-sm font-black">Timeline appears after Generate edit</p>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-md px-3 py-1.5 ${
        active ? "bg-[var(--brand)] text-black" : "text-[var(--muted)]"
      }`}
    >
      {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--muted)]">
        <Icon className="h-4 w-4" aria-hidden />
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

function EmptyPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid place-items-center rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-4 text-center ${compact ? "min-h-28" : "min-h-44"}`}>
      <div>
        <Maximize2 className="mx-auto h-6 w-6 text-[var(--brand)]" aria-hidden="true" />
        <p className="mt-2 text-xs font-black text-[var(--muted)]">Waiting for edit plan</p>
      </div>
    </div>
  );
}

function ClapperIcon() {
  return <Film className="h-8 w-8" aria-hidden="true" />;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
}
