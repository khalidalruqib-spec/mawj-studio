"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  FileVideo2,
  ImageIcon,
  Layers3,
  Search,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import {
  buildTemplateInputs,
  createProjectFromTemplate,
  renderTemplatePreview,
  type TemplateLayer,
  type TemplateUserInputs,
  type VideoTemplate,
  type VideoTemplateInput,
} from "@/lib/video-template-engine";

const CATEGORIES = [
  "All",
  "Product Ads",
  "TikTok / Reels",
  "YouTube Shorts",
  "Podcast Clips",
  "Educational Videos",
  "Lecture Summaries",
  "Real Estate",
  "Restaurants",
  "Legal Services",
  "Event Announcements",
  "News Style",
  "Course Announcements",
  "Before / After",
  "Personal Branding",
];

export function TemplateBrowser({ templates }: { templates: VideoTemplate[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [inputValues, setInputValues] = useState<TemplateUserInputs>({});

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesCategory = category === "All" || template.category === category;
      const matchesQuery =
        !normalizedQuery ||
        template.name.toLowerCase().includes(normalizedQuery) ||
        template.description.toLowerCase().includes(normalizedQuery) ||
        template.category.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [category, query, templates]);

  function openTemplateForm(template: VideoTemplate) {
    setSelectedTemplate(template);
    setInputValues(buildTemplateInputs(template, {}));
  }

  function closeTemplateForm() {
    setSelectedTemplate(null);
    setInputValues({});
  }

  function updateInput(key: string, value: string) {
    setInputValues((values) => ({ ...values, [key]: value }));
  }

  function updateFileInput(input: VideoTemplateInput, file?: File) {
    if (!file) return;
    updateInput(input.key, URL.createObjectURL(file));
  }

  function useTemplate() {
    if (!selectedTemplate) return;

    const project = createProjectFromTemplate(selectedTemplate, inputValues);
    window.sessionStorage.setItem("mawj-template-project-draft", JSON.stringify(project));
    window.localStorage.setItem("mawj-template-project-draft", JSON.stringify(project));
    router.push(`/?templateProject=${encodeURIComponent(project.id)}`);
  }

  return (
    <main className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--brand)] text-black">
              <Layers3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-black">Video Template Engine</h1>
              <p className="text-sm font-semibold text-[var(--muted)]">
                JSON templates that hydrate into editable Mawj Studio projects
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-black transition hover:border-[var(--brand)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to editor
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1680px] px-4 py-5 sm:px-6">
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="panel p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search templates by name, category, or use case"
                className="control-input pl-9"
              />
            </div>
          </div>
          <div className="panel p-3">
            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="control-select pl-9"
                aria-label="Filter templates by category"
              >
                {CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onUse={() => openTemplateForm(template)}
            />
          ))}
        </div>

        {!filteredTemplates.length ? (
          <div className="panel mt-6 grid min-h-48 place-items-center p-6 text-center">
            <div>
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--brand)]" aria-hidden="true" />
              <p className="text-base font-black">No templates found</p>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                Try another category or search term.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {previewTemplate ? (
        <PreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />
      ) : null}

      {selectedTemplate ? (
        <TemplateFormModal
          template={selectedTemplate}
          values={inputValues}
          onClose={closeTemplateForm}
          onUpdate={updateInput}
          onFileChange={updateFileInput}
          onSubmit={useTemplate}
        />
      ) : null}
    </main>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: VideoTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  return (
    <article className="panel overflow-hidden">
      <div className="relative bg-black">
        <img
          src={template.thumbnailUrl}
          alt={`${template.name} thumbnail`}
          className={`w-full object-cover ${
            template.aspectRatio === "16:9" ? "aspect-video" : "aspect-[4/5]"
          }`}
        />
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="rounded-md bg-black/65 px-2 py-1 text-xs font-black text-white backdrop-blur">
            {template.category}
          </span>
          <span className="rounded-md bg-black/65 px-2 py-1 text-xs font-black text-white backdrop-blur">
            {template.aspectRatio}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black">{template.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-[var(--muted)]">
              {template.description}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-black/25 px-2 py-1 text-xs font-black text-[var(--brand)]">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            {template.duration}s
          </span>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2 text-center text-[11px] font-black text-[var(--muted)]">
          <span className="rounded-md border border-[var(--line)] bg-black/20 px-2 py-2">
            {template.width}x{template.height}
          </span>
          <span className="rounded-md border border-[var(--line)] bg-black/20 px-2 py-2">
            {template.scenes.length} scenes
          </span>
          <span className="rounded-md border border-[var(--line)] bg-black/20 px-2 py-2">
            {template.requiredInputs.length} inputs
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPreview}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-sm font-black transition hover:border-[var(--brand)]"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            Preview
          </button>
          <button
            type="button"
            onClick={onUse}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Use Template
          </button>
        </div>
      </div>
    </article>
  );
}

function PreviewModal({ template, onClose }: { template: VideoTemplate; onClose: () => void }) {
  return (
    <ModalFrame title={template.name} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LiveTemplatePreview template={template} />
        <aside className="space-y-3">
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="text-xs font-black text-[var(--brand)]">Template JSON</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">
              {template.description}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="mb-2 text-xs font-black text-[var(--brand)]">Scenes</p>
            <div className="space-y-2">
              {template.scenes.map((scene) => (
                <div key={scene.id} className="rounded-md bg-black/25 p-2">
                  <p className="text-xs font-black">{scene.name}</p>
                  <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">
                    {scene.start}s - {scene.start + scene.duration}s · {scene.layers.length} layers
                  </p>
                </div>
              ))}
            </div>
          </div>
          <img
            src={template.previewUrl}
            alt={`${template.name} preview`}
            className="w-full rounded-lg border border-[var(--line)] object-cover"
          />
        </aside>
      </div>
    </ModalFrame>
  );
}

function TemplateFormModal({
  template,
  values,
  onClose,
  onUpdate,
  onFileChange,
  onSubmit,
}: {
  template: VideoTemplate;
  values: TemplateUserInputs;
  onClose: () => void;
  onUpdate: (key: string, value: string) => void;
  onFileChange: (input: VideoTemplateInput, file?: File) => void;
  onSubmit: () => void;
}) {
  return (
    <ModalFrame title={`Use ${template.name}`} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="panel border-[var(--line)] bg-[var(--panel-soft)] p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {template.requiredInputs.map((input) => (
              <DynamicInput
                key={input.key}
                input={input}
                value={values[input.key] ?? input.default ?? ""}
                onUpdate={onUpdate}
                onFileChange={onFileChange}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg border border-[var(--line)] bg-black/20 px-4 py-2 text-sm font-black transition hover:border-[var(--brand)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-black text-black transition hover:bg-white"
            >
              <FileVideo2 className="h-4 w-4" aria-hidden="true" />
              Create editable project
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <LiveTemplatePreview template={{ ...template, ...renderTemplatePreview(template) }} />
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="text-xs font-black text-[var(--brand)]">What happens next</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
              Mawj hydrates placeholders, creates scenes, converts every layer into timeline tracks,
              then opens the result in the editor as a normal editable project.
            </p>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

function DynamicInput({
  input,
  value,
  onUpdate,
  onFileChange,
}: {
  input: VideoTemplateInput;
  value: string;
  onUpdate: (key: string, value: string) => void;
  onFileChange: (input: VideoTemplateInput, file?: File) => void;
}) {
  if (input.type === "textarea") {
    return (
      <label className="block md:col-span-2">
        <InputLabel input={input} />
        <textarea
          value={value}
          onChange={(event) => onUpdate(input.key, event.target.value)}
          placeholder={input.placeholder}
          className="min-h-32 w-full resize-none rounded-lg border border-[var(--line)] bg-black/25 p-3 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)]"
        />
      </label>
    );
  }

  if (input.type === "select") {
    return (
      <label className="block">
        <InputLabel input={input} />
        <select
          value={value}
          onChange={(event) => onUpdate(input.key, event.target.value)}
          className="control-select"
        >
          {(input.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (input.type === "image" || input.type === "video" || input.type === "audio") {
    return (
      <label className="block">
        <InputLabel input={input} />
        <span className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] bg-black/25 p-3 text-center transition hover:border-[var(--brand)]">
          {input.type === "image" ? (
            <ImageIcon className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
          ) : (
            <UploadCloud className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
          )}
          <span className="text-xs font-black">
            {value ? "Asset attached" : `Upload ${input.type}`}
          </span>
          <input
            type="file"
            accept={input.type === "image" ? "image/*" : input.type === "video" ? "video/*" : "audio/*"}
            className="sr-only"
            onChange={(event) => onFileChange(input, event.target.files?.[0])}
          />
        </span>
      </label>
    );
  }

  return (
    <label className="block">
      <InputLabel input={input} />
      <input
        type={input.type === "color" ? "color" : "text"}
        value={value}
        onChange={(event) => onUpdate(input.key, event.target.value)}
        placeholder={input.placeholder}
        className={input.type === "color" ? "h-11 w-full rounded-lg border border-[var(--line)] bg-black/25 p-1" : "control-input"}
      />
    </label>
  );
}

function InputLabel({ input }: { input: VideoTemplateInput }) {
  return (
    <span className="mb-2 block text-xs font-black text-[var(--muted)]">
      {input.label}
      {input.required ? <span className="text-[var(--brand)]"> *</span> : null}
    </span>
  );
}

function LiveTemplatePreview({ template }: { template: VideoTemplate }) {
  const preview = renderTemplatePreview(template);
  const scene = preview.scene;

  return (
    <div className="panel grid min-h-[420px] place-items-center overflow-hidden bg-black p-4">
      <div
        className={`relative overflow-hidden rounded-lg bg-black shadow-2xl ${
          template.aspectRatio === "16:9"
            ? "aspect-video w-full"
            : "aspect-[9/16] max-h-[620px] w-full max-w-[350px]"
        }`}
      >
        <PreviewBackground scene={scene} />
        <SafeMarginOverlay template={template} />
        {scene.layers.map((layer) => (
          <PreviewLayer key={layer.id} layer={layer} template={template} />
        ))}
      </div>
    </div>
  );
}

function PreviewBackground({ scene }: { scene: ReturnType<typeof renderTemplatePreview>["scene"] }) {
  if (scene.background.type === "gradient") {
    return (
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(145deg, ${cleanPreviewValue(scene.background.from) || "#111827"}, ${cleanPreviewValue(scene.background.to) || "#000000"})`,
        }}
      />
    );
  }

  if (scene.background.type === "image" || scene.background.type === "video") {
    return (
      <div className="absolute inset-0 bg-[var(--panel-soft)]">
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(142,247,194,0.18),rgba(167,139,250,0.12))]" />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0"
      style={{ background: cleanPreviewValue(scene.background.value) || "#111827" }}
    />
  );
}

function PreviewLayer({ layer, template }: { layer: TemplateLayer; template: VideoTemplate }) {
  const style = layerToPreviewStyle(layer, template);

  if (layer.type === "text" || layer.type === "captions") {
    return (
      <div
        className="absolute grid place-items-center overflow-hidden text-center font-black leading-tight"
        style={{
          ...style,
          color: cleanPreviewValue(layer.color) || "#ffffff",
          fontSize: `${Math.max(10, (layer.fontSize ?? 42) * 0.18)}px`,
          direction: layer.direction === "ltr" ? "ltr" : "rtl",
        }}
      >
        <span className="line-clamp-3 px-1">
          {previewText(layer.content ?? (layer.type === "captions" ? "Auto captions" : layer.id))}
        </span>
      </div>
    );
  }

  if (layer.type === "image" || layer.type === "video") {
    return (
      <div
        className="absolute grid place-items-center border border-white/20 bg-white/10 text-center text-[10px] font-black text-white/80"
        style={{ ...style, borderRadius: layer.borderRadius ? `${layer.borderRadius / 12}px` : "10px" }}
      >
        {layer.type === "image" ? "IMAGE" : "VIDEO"}
      </div>
    );
  }

  if (layer.type === "waveform") {
    return (
      <div className="absolute flex items-center gap-1" style={style}>
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="w-1 rounded-full bg-[var(--brand)]"
            style={{ height: `${20 + ((index * 17) % 44)}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="absolute"
      style={{
        ...style,
        background: cleanPreviewValue(layer.color) || "rgba(255,255,255,0.2)",
        borderRadius: layer.borderRadius ? `${layer.borderRadius / 10}px` : "10px",
        opacity: layer.opacity ?? 0.9,
      }}
    />
  );
}

function SafeMarginOverlay({ template }: { template: VideoTemplate }) {
  const margins = template.safeMargins;
  if (!margins) return null;

  return (
    <div
      className="pointer-events-none absolute border border-dashed border-white/25"
      style={{
        left: `${(margins.left / template.width) * 100}%`,
        right: `${(margins.right / template.width) * 100}%`,
        top: `${(margins.top / template.height) * 100}%`,
        bottom: `${(margins.bottom / template.height) * 100}%`,
      }}
    />
  );
}

function ModalFrame({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/72 p-4 backdrop-blur">
      <div className="mx-auto max-w-6xl rounded-lg border border-[var(--line)] bg-[var(--panel)] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-base font-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="icon-button"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function layerToPreviewStyle(layer: TemplateLayer, template: VideoTemplate): React.CSSProperties {
  return {
    left: `${((layer.x ?? 0) / template.width) * 100}%`,
    top: `${((layer.y ?? 0) / template.height) * 100}%`,
    width: `${((layer.width ?? template.width) / template.width) * 100}%`,
    height: `${((layer.height ?? template.height) / template.height) * 100}%`,
  };
}

function cleanPreviewValue(value?: string) {
  if (!value || value.includes("{{")) return undefined;
  return value;
}

function previewText(value: string) {
  return value.replace(/\{\{(.*?)\}\}/g, (_, key: string) => key.trim());
}
