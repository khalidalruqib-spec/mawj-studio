"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND } from "@/lib/brand";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  Check,
  Clock3,
  Code2,
  Crown,
  Database,
  Eye,
  FileVideo2,
  Film,
  Layers3,
  MessageSquareQuote,
  Mic,
  Newspaper,
  Scale,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tags,
  Upload,
  UploadCloud,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  buildTemplateInputs,
  createProjectFromTemplate,
  renderTemplatePreview,
  type TemplateAnimationType,
  type TemplateLayer,
  type TemplateUserInputs,
  type VideoTemplate,
  type VideoTemplateInput,
} from "@/lib/video-template-engine";

/* ─────────────────────────────────────────────────────────────────────
   Category metadata — colour, icon, Arabic label
───────────────────────────────────────────────────────────────────── */

type CategoryMeta = {
  label: string;
  icon: LucideIcon;
  accent: string;           // hex used for accents inside cards
  gradFrom: string;         // CSS colour for header gradient start
};

const CATEGORY_META: Record<string, CategoryMeta> = {
  "All":                    { label: "الكل",            icon: Sparkles,       accent: "#7ef2bc", gradFrom: "rgba(126,242,188,0.18)" },
  "TikTok / Reels":         { label: "تيك توك / ريلز",  icon: Zap,            accent: "#7ef2bc", gradFrom: "rgba(126,242,188,0.18)" },
  "Product Ads":            { label: "إعلانات المنتجات", icon: ShoppingBag,    accent: "#fbbf24", gradFrom: "rgba(251,191,36,0.18)"  },
  "Personal Branding":      { label: "براند شخصي",      icon: Crown,          accent: "#a78bfa", gradFrom: "rgba(167,139,250,0.18)" },
  "Course Announcements":   { label: "إعلان دورة",      icon: BookOpen,       accent: "#38bdf8", gradFrom: "rgba(56,189,248,0.18)"  },
  "Event Announcements":    { label: "فعاليات",          icon: Calendar,       accent: "#fb923c", gradFrom: "rgba(251,146,60,0.18)"  },
  "News Style":             { label: "أخبار",            icon: Newspaper,      accent: "#ff647c", gradFrom: "rgba(255,100,124,0.18)" },
  "Podcast Clips":          { label: "بودكاست",          icon: Mic,            accent: "#c084fc", gradFrom: "rgba(192,132,252,0.18)" },
  "Real Estate":            { label: "عقار",             icon: Building2,      accent: "#d4af37", gradFrom: "rgba(212,175,55,0.18)"  },
  "Restaurants":            { label: "مطاعم",            icon: Users,          accent: "#34d399", gradFrom: "rgba(52,211,153,0.18)"  },
  "Educational Videos":     { label: "تعليمي",           icon: BookOpen,       accent: "#38bdf8", gradFrom: "rgba(56,189,248,0.18)"  },
  "Lecture Summaries":      { label: "ملخص محاضرة",     icon: MessageSquareQuote, accent: "#60a5fa", gradFrom: "rgba(96,165,250,0.18)" },
  "Legal Services":         { label: "خدمات قانونية",   icon: Scale,          accent: "#94a3b8", gradFrom: "rgba(148,163,184,0.18)" },
  "Business Services":      { label: "خدمات أعمال",     icon: Database,       accent: "#60a5fa", gradFrom: "rgba(96,165,250,0.18)" },
  "Before / After":         { label: "قبل وبعد",         icon: ArrowRight,     accent: "#7ef2bc", gradFrom: "rgba(126,242,188,0.18)" },
  "YouTube Shorts":         { label: "يوتيوب شورتس",    icon: Film,           accent: "#ff647c", gradFrom: "rgba(255,100,124,0.18)" },
  "Clinics":                { label: "عيادات",           icon: BadgeCheck,     accent: "#2dd4bf", gradFrom: "rgba(45,212,191,0.18)"  },
};

function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? {
    label: category,
    icon: Sparkles,
    accent: "#7ef2bc",
    gradFrom: "rgba(126,242,188,0.16)",
  };
}

/* Featured template IDs — shown with a ★ badge */
const FEATURED_IDS = new Set([
  "tiktok-3-reasons",
  "capcut-flash-sale",
  "capcut-karaoke-captions",
  "tiktok-pov-story",
  "capcut-news-alert",
  "ugc-testimonial",
  "tiktok-hook-sprint",
  "market-real-estate-tour",
  "market-restaurant-story-menu",
  "market-business-promo",
  "market-podcast-launch",
]);

type TemplatePackFilter = "all" | "market" | "featured" | "classic";
type TemplateSortOption = "recommended" | "newest" | "duration-asc" | "duration-desc" | "editable-desc";
type AspectRatioFilter = "All" | VideoTemplate["aspectRatio"];

/* Scene palette — rotates through per-scene */
const SCENE_PALETTE = [
  "#7ef2bc", "#a78bfa", "#fbbf24", "#60a5fa",
  "#fb7185", "#34d399", "#fb923c", "#c084fc",
];

/* ─────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────── */

function countTemplateLayers(template: VideoTemplate) {
  return template.scenes.reduce((total, scene) => total + scene.layers.length, 0);
}

function countEditableLayers(template: VideoTemplate) {
  return template.scenes.reduce(
    (total, scene) => total + scene.layers.filter((layer) => layer.editable !== false).length,
    0,
  );
}

function countLayersByType(template: VideoTemplate, type: TemplateLayer["type"]) {
  return template.scenes.reduce(
    (total, scene) => total + scene.layers.filter((layer) => layer.type === type).length,
    0,
  );
}

function countMotionTypes(template: VideoTemplate) {
  const motionTypes = new Set<TemplateAnimationType>(template.animations ?? []);
  for (const scene of template.scenes) {
    for (const layer of scene.layers) {
      if (layer.animationIn?.type) motionTypes.add(layer.animationIn.type);
      if (layer.animationOut?.type) motionTypes.add(layer.animationOut.type);
    }
  }
  return motionTypes.size;
}

function isMarketTemplate(template: VideoTemplate) {
  return template.id.startsWith("market-");
}

function templatePackLabel(value: TemplatePackFilter) {
  const labels: Record<TemplatePackFilter, string> = {
    all: "كل الحزم",
    market: "Market Pack",
    featured: "مميز",
    classic: "كلاسيك",
  };
  return labels[value];
}

function sortTemplates(templates: VideoTemplate[], sortBy: TemplateSortOption) {
  return templates.slice().sort((left, right) => {
    if (sortBy === "duration-asc") return left.duration - right.duration || left.name.localeCompare(right.name);
    if (sortBy === "duration-desc") return right.duration - left.duration || left.name.localeCompare(right.name);
    if (sortBy === "editable-desc") {
      return countEditableLayers(right) - countEditableLayers(left) || right.scenes.length - left.scenes.length || left.name.localeCompare(right.name);
    }
    if (sortBy === "newest") {
      return Number(isMarketTemplate(right)) - Number(isMarketTemplate(left)) || left.name.localeCompare(right.name);
    }

    return (
      Number(FEATURED_IDS.has(right.id)) - Number(FEATURED_IDS.has(left.id)) ||
      Number(isMarketTemplate(right)) - Number(isMarketTemplate(left)) ||
      countMotionTypes(right) - countMotionTypes(left) ||
      left.name.localeCompare(right.name)
    );
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────── */

export function TemplateBrowser({ templates }: { templates: VideoTemplate[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioFilter>("All");
  const [templatePack, setTemplatePack] = useState<TemplatePackFilter>("all");
  const [sortBy, setSortBy] = useState<TemplateSortOption>("recommended");
  const [previewTemplate, setPreviewTemplate] = useState<VideoTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [inputValues, setInputValues] = useState<TemplateUserInputs>({});

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = templates.filter((t) => {
      const matchCat = category === "All" || t.category === category;
      const matchQ = !q || [t.name, t.description, t.category].some((v) => v.toLowerCase().includes(q));
      const matchAspect = aspectRatio === "All" || t.aspectRatio === aspectRatio;
      const matchPack =
        templatePack === "all" ||
        (templatePack === "market" && isMarketTemplate(t)) ||
        (templatePack === "featured" && FEATURED_IDS.has(t.id)) ||
        (templatePack === "classic" && !isMarketTemplate(t));
      return matchCat && matchQ && matchAspect && matchPack;
    });

    return sortTemplates(matches, sortBy);
  }, [aspectRatio, category, query, sortBy, templatePack, templates]);

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of templates) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    const known = Object.keys(CATEGORY_META).filter((k) => k !== "All" && counts.has(k));
    const extra = Array.from(counts.keys()).filter((k) => !CATEGORY_META[k]);
    return [
      { value: "All", label: "الكل", count: templates.length },
      ...known.map((v) => ({ value: v, label: getCategoryMeta(v).label, count: counts.get(v) ?? 0 })),
      ...extra.map((v) => ({ value: v, label: v, count: counts.get(v) ?? 0 })),
    ];
  }, [templates]);

  const aspectRatioOptions = useMemo(() => {
    const counts = new Map<VideoTemplate["aspectRatio"], number>();
    templates.forEach((template) => counts.set(template.aspectRatio, (counts.get(template.aspectRatio) ?? 0) + 1));
    const order: VideoTemplate["aspectRatio"][] = ["9:16", "16:9", "1:1", "4:5"];
    return [
      { value: "All" as const, label: "كل المقاسات", count: templates.length },
      ...order
        .filter((value) => counts.has(value))
        .map((value) => ({ value, label: value, count: counts.get(value) ?? 0 })),
    ];
  }, [templates]);

  const packOptions = useMemo(
    () => [
      { value: "all" as const, count: templates.length },
      { value: "market" as const, count: templates.filter(isMarketTemplate).length },
      { value: "featured" as const, count: templates.filter((template) => FEATURED_IDS.has(template.id)).length },
      { value: "classic" as const, count: templates.filter((template) => !isMarketTemplate(template)).length },
    ],
    [templates],
  );

  const hasActiveFilters = query || category !== "All" || aspectRatio !== "All" || templatePack !== "all" || sortBy !== "recommended";

  const marketplaceStats = useMemo(() => {
    const sceneCount = templates.reduce((n, t) => n + t.scenes.length, 0);
    const layerCount = templates.reduce((n, t) => n + countTemplateLayers(t), 0);
    const inputCount = templates.reduce((n, t) => n + t.requiredInputs.length, 0);
    const catCount   = new Set(templates.map((t) => t.category)).size;
    return [
      { label: "قالب جاهز",          value: templates.length, icon: Code2 },
      { label: "فئة محتوى",          value: catCount,         icon: Tags },
      { label: "مشهد قابل للتعديل",  value: sceneCount,       icon: Film },
      { label: "طبقة ديناميكية",     value: layerCount,       icon: Layers3 },
      { label: "مدخل مخصص",          value: inputCount,       icon: Database },
    ];
  }, [templates]);

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
    router.push(`/studio?templateProject=${encodeURIComponent(project.id)}`);
  }

  return (
    <main dir="rtl" lang="ar" className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--panel)]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLockup size="sm" mode="official" />
          </div>
          <button type="button" onClick={() => router.push("/studio")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            العودة للاستوديو
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1680px] px-4 py-6 sm:px-6">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
          <div className="relative overflow-hidden px-6 py-8 sm:px-8">
            {/* Background glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(126,242,188,0.14),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(167,139,250,0.10),transparent_50%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="badge badge-brand">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {BRAND.nameAr} · سوق القوالب
                  </span>
                  <span className="badge badge-muted" dir="ltr">/api/templates</span>
                  <span className="badge badge-violet">RTL + Arabic</span>
                </div>
                <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                  كل قالب = مشاهد + طبقات + حركات حقيقية
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--muted)] sm:text-base">
                  اختر قالب، عبّئ بيانات منتجك أو فيديوك، وبعدها يتحول مباشرةً إلى مشروع مونتاج قابل للتعديل الكامل داخل المحرر.
                </p>
                {/* How it works */}
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black">
                  {[
                    { n: "1", label: "اختر قالب" },
                    { n: "2", label: "عبّئ البيانات" },
                    { n: "3", label: "يتحول لمشروع مونتاج" },
                    { n: "4", label: "عدّل وصدّر" },
                  ].map((step, i, arr) => (
                    <span key={step.n} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brand)] text-[10px] text-black">{step.n}</span>
                      <span className="text-[var(--muted-strong)]">{step.label}</span>
                      {i < arr.length - 1 && <span className="text-[var(--line-strong)]">›</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                {marketplaceStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="flex min-h-20 flex-col justify-between rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                      <div className="flex items-start justify-between gap-1">
                        <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
                        <span className="text-2xl font-black leading-none text-white">{stat.value}</span>
                      </div>
                      <p className="text-[10px] font-black leading-4 text-[var(--muted)]">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Category Chips ─────────────────────────────────────────── */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {categoryOptions.map((item) => {
            const meta = getCategoryMeta(item.value);
            const Icon = meta.icon;
            const active = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-black transition ${
                  active
                    ? "border-transparent text-black"
                    : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                style={active ? { background: meta.accent, borderColor: meta.accent } : undefined}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
                <span className={`text-[11px] ${active ? "text-black/60" : "text-white/40"}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search + Marketplace Controls ─────────────────────────── */}
        <div className="mb-3 grid gap-2 lg:grid-cols-[1fr_auto_auto_auto]">
          <div className="panel relative min-w-0 overflow-hidden p-0">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] z-10" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم القالب أو الفئة أو الاستخدام..."
              className="control-input pr-9"
            />
          </div>
          <div className="panel relative overflow-hidden p-0">
            <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] z-10" aria-hidden="true" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="control-select min-w-44 pr-9"
              aria-label="تصفية حسب الفئة"
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label} ({item.count})</option>
              ))}
            </select>
          </div>
          <div className="panel relative overflow-hidden p-0">
            <Film className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] z-10" aria-hidden="true" />
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatioFilter)}
              className="control-select min-w-40 pr-9"
              aria-label="تصفية حسب المقاس"
            >
              {aspectRatioOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label} ({item.count})</option>
              ))}
            </select>
          </div>
          <div className="panel relative overflow-hidden p-0">
            <SlidersHorizontal className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)] z-10" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as TemplateSortOption)}
              className="control-select min-w-44 pr-9"
              aria-label="ترتيب القوالب"
            >
              <option value="recommended">الأقوى أولًا</option>
              <option value="newest">الأحدث</option>
              <option value="editable-desc">الأكثر قابلية للتعديل</option>
              <option value="duration-asc">الأقصر مدة</option>
              <option value="duration-desc">الأطول مدة</option>
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {packOptions.map((item) => {
            const active = templatePack === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTemplatePack(item.value)}
                className={`min-h-9 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand)] text-black"
                    : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {templatePackLabel(item.value)}
                <span className={`mr-1 ${active ? "text-black/60" : "text-white/40"}`}>{item.count}</span>
              </button>
            );
          })}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("All");
                setAspectRatio("All");
                setTemplatePack("all");
                setSortBy("recommended");
              }}
              className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-transparent px-3 py-1.5 text-xs font-black text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              تصفير الفلاتر
            </button>
          ) : null}
        </div>

        {/* ── Results header ─────────────────────────────────────────── */}
        {hasActiveFilters ? (
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-[var(--muted)]">
            <span>{filteredTemplates.length} قالب</span>
            {query && <span>· &quot;{query}&quot;</span>}
            {category !== "All" && <span>· {getCategoryMeta(category).label}</span>}
            {aspectRatio !== "All" && <span>· {aspectRatio}</span>}
            {templatePack !== "all" && <span>· {templatePackLabel(templatePack)}</span>}
          </div>
        ) : null}

        {/* ── Template Grid ──────────────────────────────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onUse={() => openTemplateForm(template)}
            />
          ))}
        </div>

        {!filteredTemplates.length && (
          <div className="empty-state panel mt-6 min-h-48">
            <Sparkles className="empty-state-icon h-8 w-8" aria-hidden="true" />
            <p className="empty-state-title">ما حصلنا قوالب مطابقة</p>
            <p className="empty-state-sub">جرّب فئة ثانية أو كلمة بحث مختلفة.</p>
          </div>
        )}
      </section>

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => { setPreviewTemplate(null); openTemplateForm(previewTemplate); }}
        />
      )}
      {selectedTemplate && (
        <TemplateFormModal
          template={selectedTemplate}
          values={inputValues}
          onClose={closeTemplateForm}
          onUpdate={updateInput}
          onFileChange={updateFileInput}
          onSubmit={useTemplate}
        />
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Template Card
───────────────────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  onPreview,
  onUse,
}: {
  template: VideoTemplate;
  onPreview: () => void;
  onUse: () => void;
}) {
  const meta = getCategoryMeta(template.category);
  const Icon = meta.icon;
  const isFeatured = FEATURED_IDS.has(template.id);
  const isMarket = isMarketTemplate(template);
  const layerCount = countTemplateLayers(template);
  const editableCount = countEditableLayers(template);
  const captionCount = countLayersByType(template, "captions");
  const motionCount = countMotionTypes(template);

  return (
    <article className="group panel overflow-hidden transition-all duration-200 hover:border-[var(--line-strong)] hover:shadow-[var(--shadow-lg)]">

      {/* Preview frame */}
      <div className="relative overflow-hidden bg-black">
        <TemplateMotionPreview template={template} compact />

        {/* Gradient overlay on hover */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

        {/* Top badges on preview */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 z-10">
          <span
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black text-black backdrop-blur-sm"
            style={{ background: meta.accent }}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {meta.label}
          </span>
          <div className="flex items-center gap-1.5">
            {isMarket && (
              <span className="flex items-center gap-1 rounded-lg bg-[var(--brand)]/90 px-2 py-1 text-[10px] font-black text-black backdrop-blur-sm">
                <Tags className="h-3 w-3" aria-hidden="true" />
                Market
              </span>
            )}
            {isFeatured && (
              <span className="flex items-center gap-1 rounded-lg bg-[#d4af37]/90 px-2 py-1 text-[10px] font-black text-black backdrop-blur-sm">
                <Star className="h-3 w-3" aria-hidden="true" />
                مميز
              </span>
            )}
            <span className="rounded-lg bg-black/65 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
              {template.aspectRatio}
            </span>
          </div>
        </div>

        {/* Bottom CTA overlay — appears on hover */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex translate-y-2 gap-2 p-3 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={onPreview}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-black/70 py-2 text-xs font-black text-white backdrop-blur-sm transition hover:bg-black/90"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            معاينة
          </button>
          <button
            type="button"
            onClick={onUse}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black transition hover:brightness-110"
            style={{ background: meta.accent }}
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            استخدام
          </button>
        </div>
      </div>

      {/* Scene timeline strip */}
      <SceneTimelineStrip template={template} />

      {/* Card body */}
      <div className="p-4 pt-0">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate text-base font-black tracking-tight">{template.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[var(--muted)]">
              {template.description}
            </p>
          </div>
          <span
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black"
            style={{ background: `${meta.accent}18`, color: meta.accent }}
          >
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {template.duration}s
          </span>
        </div>

        {/* Feature pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="badge badge-brand">
            <Code2 className="h-3 w-3" aria-hidden="true" />
            JSON
          </span>
          <span className="badge badge-muted">
            <Layers3 className="h-3 w-3" aria-hidden="true" />
            {editableCount} قابل للتعديل
          </span>
          <span className="badge badge-muted">
            <Film className="h-3 w-3" aria-hidden="true" />
            {template.scenes.length} مشاهد
          </span>
          <span className="badge badge-violet">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {motionCount} حركة
          </span>
          {captionCount > 0 && (
            <span className="badge badge-amber">
              كابشن تلقائي
            </span>
          )}
        </div>

        {/* Scene count bar */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <SceneStat label="مشاهد" value={template.scenes.length} />
          <SceneStat label="طبقات" value={layerCount} />
          <SceneStat label="مدخلات" value={template.requiredInputs.length} />
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onPreview} className="btn-ghost text-sm">
            <Eye className="h-4 w-4" aria-hidden="true" />
            معاينة
          </button>
          <button
            type="button"
            onClick={onUse}
            className="btn-brand text-sm"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            استخدام
          </button>
        </div>
      </div>
    </article>
  );
}

function SceneStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-2 text-center">
      <p className="text-base font-black leading-none text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black text-[var(--muted)]">{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Scene Timeline Strip
───────────────────────────────────────────────────────────────────── */

function SceneTimelineStrip({ template }: { template: VideoTemplate }) {
  const total = template.duration;

  return (
    <div className="px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-black text-[var(--muted)]">
        <span>مشاهد القالب</span>
        <span dir="ltr">{total}s</span>
      </div>

      {/* Proportional colored bar segments */}
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--panel-soft)]">
        {template.scenes.map((scene, i) => (
          <span
            key={scene.id}
            title={`${scene.name} (${scene.duration}s)`}
            className="h-full transition-all"
            style={{
              flex: Math.max(scene.duration, 1),
              background: SCENE_PALETTE[i % SCENE_PALETTE.length],
            }}
          />
        ))}
      </div>

      {/* Named scene pills */}
      <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
        {template.scenes.map((scene, i) => (
          <span
            key={scene.id}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black"
            style={{ background: `${SCENE_PALETTE[i % SCENE_PALETTE.length]}15`, color: SCENE_PALETTE[i % SCENE_PALETTE.length] }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: SCENE_PALETTE[i % SCENE_PALETTE.length] }}
            />
            {scene.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Preview Modal
───────────────────────────────────────────────────────────────────── */

function PreviewModal({
  template,
  onClose,
  onUse,
}: {
  template: VideoTemplate;
  onClose: () => void;
  onUse: () => void;
}) {
  const meta = getCategoryMeta(template.category);
  const motionCount = countMotionTypes(template);

  return (
    <ModalFrame title={template.name} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* Live preview */}
        <TemplateMotionPreview template={template} />

        {/* Sidebar */}
        <aside className="space-y-3">
          {/* Description */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{ background: `${meta.accent}20`, color: meta.accent }}
              >
                <meta.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-xs font-black" style={{ color: meta.accent }}>{meta.label}</span>
            </div>
            <p className="text-sm font-semibold leading-6 text-[var(--muted)]">{template.description}</p>
          </div>

          {/* Quick metrics */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "المشاهد", value: template.scenes.length },
              { label: "الطبقات", value: countTemplateLayers(template) },
              { label: "المدخلات", value: template.requiredInputs.length },
              { label: "الحركات", value: motionCount },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-center">
                <p className="text-xl font-black text-white">{m.value}</p>
                <p className="mt-0.5 text-[10px] font-black text-[var(--muted)]">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Scene breakdown */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="mb-3 text-xs font-black" style={{ color: meta.accent }}>تسلسل المشاهد</p>
            <div className="space-y-2">
              {template.scenes.map((scene, i) => {
                const color = SCENE_PALETTE[i % SCENE_PALETTE.length];
                const textLayers = scene.layers.filter((l) => l.type === "text" || l.type === "captions").length;
                const mediaLayers = scene.layers.filter((l) => l.type === "image" || l.type === "video").length;
                const shapeLayers = scene.layers.filter((l) => l.type === "shape").length;
                return (
                  <div key={scene.id} className="flex items-start gap-2.5 rounded-lg bg-black/20 p-2.5">
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black text-black"
                      style={{ background: color }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black">{scene.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-[var(--muted)]">
                        {scene.start}s – {scene.start + scene.duration}s · {scene.layers.length} طبقات
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {textLayers > 0 && <span className="badge badge-muted">{textLayers} نص</span>}
                        {mediaLayers > 0 && <span className="badge badge-brand">{mediaLayers} ميديا</span>}
                        {shapeLayers > 0 && <span className="badge badge-violet">{shapeLayers} شكل</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Required inputs */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="mb-2 text-xs font-black" style={{ color: meta.accent }}>المدخلات المطلوبة</p>
            <div className="flex flex-wrap gap-1.5">
              {template.requiredInputs.map((input) => (
                <span key={input.key} className="badge badge-muted">
                  {input.label}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button type="button" onClick={onUse} className="btn-brand w-full">
            <FileVideo2 className="h-4 w-4" aria-hidden="true" />
            استخدم هذا القالب
          </button>
        </aside>
      </div>
    </ModalFrame>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Template Form Modal
───────────────────────────────────────────────────────────────────── */

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
  const meta = getCategoryMeta(template.category);

  return (
    <ModalFrame title={`استخدام قالب: ${template.name}`} onClose={onClose}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

        {/* Inputs */}
        <div>
          {/* Scene strip reminder */}
          <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-3">
            <SceneTimelineStrip template={template} />
          </div>

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

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              إلغاء
            </button>
            <button type="button" onClick={onSubmit} className="btn-brand">
              <FileVideo2 className="h-4 w-4" aria-hidden="true" />
              إنشاء مشروع قابل للتعديل
            </button>
          </div>
        </div>

        {/* Preview sidebar */}
        <div className="space-y-3">
          <TemplateMotionPreview template={{ ...template, ...renderTemplatePreview(template) }} />

          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p className="mb-2 text-xs font-black" style={{ color: meta.accent }}>ماذا يحصل بعد الإنشاء؟</p>
            <div className="space-y-2">
              {[
                "يُحوَّل القالب إلى مشروع مونتاج حقيقي",
                "كل مشهد يتحول إلى tracks في الـ timeline",
                "النصوص والصور والألوان قابلة للتعديل",
                "صدّر بصيغة MP4 جاهزة للنشر",
              ].map((step) => (
                <div key={step} className="flex items-start gap-2 text-xs font-semibold text-[var(--muted)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brand)]" aria-hidden="true" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalFrame>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Dynamic Input
───────────────────────────────────────────────────────────────────── */

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
          onChange={(e) => onUpdate(input.key, e.target.value)}
          placeholder={input.placeholder}
          className="min-h-28 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-sm font-bold leading-6 outline-none transition focus:border-[var(--brand)] focus:shadow-[0_0_0_3px_var(--brand-ring)]"
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
          onChange={(e) => onUpdate(input.key, e.target.value)}
          className="control-select"
        >
          {(input.options ?? []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (input.type === "image" || input.type === "video" || input.type === "audio") {
    return (
      <label className="block cursor-pointer">
        <InputLabel input={input} />
        <span className="drop-zone flex min-h-20 flex-col items-center justify-center gap-2 text-center">
          {value ? (
            <>
              <BadgeCheck className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
              <span className="text-xs font-black text-[var(--brand)]">مرفق</span>
            </>
          ) : (
            <>
              {input.type === "image"
                ? <Upload className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
                : <UploadCloud className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
              }
              <span className="text-xs font-black">
                {input.type === "image" ? "ارفع صورة" : input.type === "video" ? "ارفع فيديو" : "ارفع صوت"}
              </span>
            </>
          )}
          <input
            type="file"
            accept={input.type === "image" ? "image/*" : input.type === "video" ? "video/*" : "audio/*"}
            className="sr-only"
            onChange={(e) => onFileChange(input, e.target.files?.[0])}
          />
        </span>
      </label>
    );
  }

  if (input.type === "color") {
    return (
      <label className="block">
        <InputLabel input={input} />
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onUpdate(input.key, e.target.value)}
            className="h-11 w-16 cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onUpdate(input.key, e.target.value)}
            className="control-input font-mono text-sm"
          />
        </div>
      </label>
    );
  }

  return (
    <label className="block">
      <InputLabel input={input} />
      <input
        type="text"
        value={value}
        onChange={(e) => onUpdate(input.key, e.target.value)}
        placeholder={input.placeholder}
        className="control-input"
      />
    </label>
  );
}

function InputLabel({ input }: { input: VideoTemplateInput }) {
  return (
    <span className="mb-2 block text-xs font-black text-[var(--muted)]">
      {input.label}
      {input.required && <span className="text-[var(--brand)]"> *</span>}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Motion Preview (CSS-based live preview of template scenes)
───────────────────────────────────────────────────────────────────── */

function TemplateMotionPreview({
  template,
  compact = false,
}: {
  template: VideoTemplate;
  compact?: boolean;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = template.scenes[sceneIndex] ?? template.scenes[0];

  useEffect(() => {
    if (template.scenes.length <= 1) return;
    const id = window.setInterval(
      () => setSceneIndex((i) => (i + 1) % template.scenes.length),
      compact ? 2000 : 2800,
    );
    return () => window.clearInterval(id);
  }, [compact, template.id, template.scenes.length]);

  if (!scene) return null;

  const frame = (
    <div
      className={`relative overflow-hidden bg-black shadow-2xl ${
        template.aspectRatio === "16:9"
          ? "aspect-video w-full"
          : compact
            ? "aspect-[4/5] w-full"
            : "aspect-[9/16] max-h-[620px] w-full max-w-[350px]"
      }`}
    >
      <PreviewBackground key={`${scene.id}-bg`} scene={scene} />
      <TemplateSceneChrome template={template} sceneName={scene.name} sceneIndex={sceneIndex} />
      {!compact && <SafeMarginOverlay template={template} />}
      {scene.layers.map((layer, i) => (
        <PreviewLayer
          key={`${scene.id}-${layer.id}-${sceneIndex}`}
          layer={layer}
          template={template}
          compact={compact}
          layerIndex={i}
        />
      ))}
      <SceneProgress count={template.scenes.length} activeIndex={sceneIndex} />
    </div>
  );

  if (compact) return frame;

  return (
    <div className="panel grid min-h-[420px] place-items-center overflow-hidden bg-black p-4">
      <div className="overflow-hidden rounded-xl">{frame}</div>
    </div>
  );
}

function PreviewBackground({ scene }: { scene: ReturnType<typeof renderTemplatePreview>["scene"] }) {
  if (scene.background.type === "gradient") {
    return (
      <div
        className="template-bg-drift absolute inset-0"
        style={{ background: `linear-gradient(145deg, ${cleanPreviewValue(scene.background.from) || "#111827"}, ${cleanPreviewValue(scene.background.to) || "#000000"})` }}
      />
    );
  }
  if (scene.background.type === "image" || scene.background.type === "video") {
    return (
      <div className="absolute inset-0 bg-[var(--panel-soft)]">
        <div className="template-bg-drift absolute inset-0 bg-[linear-gradient(145deg,rgba(142,247,194,0.20),rgba(167,139,250,0.16),rgba(251,191,36,0.10))]" />
        <div className="absolute inset-[10%] rounded-[2rem] border border-white/10 bg-white/5" />
      </div>
    );
  }
  return (
    <div
      className="template-bg-drift absolute inset-0"
      style={{ background: cleanPreviewValue(scene.background.value) || "#111827" }}
    />
  );
}

function PreviewLayer({
  layer,
  template,
  compact,
  layerIndex,
}: {
  layer: TemplateLayer;
  template: VideoTemplate;
  compact: boolean;
  layerIndex: number;
}) {
  const style = layerToPreviewStyle(layer, template);
  const motionClass = animationClass(layer.animationIn?.type, layerIndex);

  if (layer.type === "text" || layer.type === "captions") {
    return (
      <div
        className={`template-motion-layer ${motionClass} absolute grid place-items-center overflow-hidden text-center font-black leading-tight`}
        style={{
          ...style,
          color: cleanPreviewValue(layer.color) || "#ffffff",
          fontSize: `${Math.max(compact ? 8 : 10, (layer.fontSize ?? 42) * (compact ? 0.12 : 0.18))}px`,
          direction: layer.direction === "ltr" ? "ltr" : "rtl",
        }}
      >
        {layer.type === "captions" ? (
          <span className="rounded-md bg-black/65 px-2 py-1 shadow-xl backdrop-blur">
            {previewText(layer.content ?? "كابشن تلقائي")}
          </span>
        ) : (
          <span className="line-clamp-3 px-1 drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]">
            {previewText(layer.content ?? layer.name ?? layer.id)}
          </span>
        )}
      </div>
    );
  }

  if (layer.type === "image" || layer.type === "video") {
    return (
      <div
        className={`template-motion-layer ${motionClass} absolute grid place-items-center overflow-hidden border border-white/20 bg-white/10 text-center text-[10px] font-black text-white/80 shadow-2xl`}
        style={{ ...style, borderRadius: layer.borderRadius ? `${layer.borderRadius / 12}px` : "10px" }}
      >
        <div className="absolute inset-0 template-media-sheen bg-[linear-gradient(135deg,rgba(255,255,255,0.26),rgba(255,255,255,0.05),rgba(142,247,194,0.18))]" />
        <div className="absolute h-1/2 w-1/2 rounded-full border border-white/20 bg-white/10" />
        {layer.type === "video" ? (
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white">▶</span>
        ) : (
          <span className="relative rounded-md bg-black/50 px-2 py-1 text-white">
            {layer.id.toLowerCase().includes("logo") ? "LOGO" : "MEDIA"}
          </span>
        )}
      </div>
    );
  }

  if (layer.type === "waveform") {
    return (
      <div className={`template-motion-layer ${motionClass} absolute flex items-center gap-1`} style={style}>
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            className="template-wave-bar w-1 rounded-full bg-[var(--brand)]"
            style={{ height: `${20 + ((i * 17) % 44)}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`template-motion-layer ${motionClass} absolute`}
      style={{
        ...style,
        background: cleanPreviewValue(layer.color) || "rgba(255,255,255,0.2)",
        borderRadius: layer.borderRadius ? `${layer.borderRadius / 10}px` : "10px",
        opacity: layer.opacity ?? 0.9,
      }}
    />
  );
}

function TemplateSceneChrome({
  template,
  sceneName,
  sceneIndex,
}: {
  template: VideoTemplate;
  sceneName: string;
  sceneIndex: number;
}) {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2">
        <span className="rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
          {sceneIndex + 1} / {template.scenes.length}
        </span>
        <span className="max-w-[60%] truncate rounded-lg bg-black/60 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm">
          {sceneName}
        </span>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="pointer-events-none absolute bottom-6 left-3 right-3 z-30 flex items-center justify-between text-[10px] font-black text-white/80">
        <span className="truncate">{template.name}</span>
        <span>{template.duration}s</span>
      </div>
    </>
  );
}

function SceneProgress({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <div className="absolute inset-x-3 bottom-2.5 z-30 flex gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === activeIndex ? "bg-[var(--brand)]" : "bg-white/25"}`}
        />
      ))}
    </div>
  );
}

function SafeMarginOverlay({ template }: { template: VideoTemplate }) {
  const m = template.safeMargins;
  if (!m) return null;
  return (
    <div
      className="pointer-events-none absolute border border-dashed border-white/20"
      style={{
        left:   `${(m.left   / template.width)  * 100}%`,
        right:  `${(m.right  / template.width)  * 100}%`,
        top:    `${(m.top    / template.height) * 100}%`,
        bottom: `${(m.bottom / template.height) * 100}%`,
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Modal Frame
───────────────────────────────────────────────────────────────────── */

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mx-auto max-w-6xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-base font-black tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="icon-button" aria-label="إغلاق">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────────────────── */

function layerToPreviewStyle(layer: TemplateLayer, template: VideoTemplate): React.CSSProperties {
  return {
    left:   `${((layer.x      ?? 0)              / template.width)  * 100}%`,
    top:    `${((layer.y      ?? 0)              / template.height) * 100}%`,
    width:  `${((layer.width  ?? template.width)  / template.width)  * 100}%`,
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

function animationClass(type: TemplateAnimationType | undefined, index: number) {
  const delay = `template-delay-${Math.min(index, 5)}`;
  const map: Record<string, string> = {
    fadeIn:     "template-anim-fade",
    fadeOut:    "template-anim-fade",
    slideUp:    "template-anim-slide-up",
    slideDown:  "template-anim-slide-down",
    slideLeft:  "template-anim-slide-left",
    slideRight: "template-anim-slide-right",
    zoomIn:     "template-anim-zoom",
    zoomOut:    "template-anim-zoom",
    pop:        "template-anim-pop",
    bounce:     "template-anim-bounce",
    typewriter: "template-anim-type",
    blurReveal: "template-anim-blur",
    rotateIn:   "template-anim-rotate",
  };
  return `${map[String(type ?? "fadeIn")] ?? "template-anim-fade"} ${delay}`;
}
