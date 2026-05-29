import { Eye, EyeOff, Layers3, Lock, SlidersHorizontal, Trash2, Unlock, UploadCloud } from "lucide-react";
import { FORMAT_PRESETS, PLATFORM_LABELS, VIDEO_STYLES, type AspectRatio, type LanguageMode, type Platform, type VideoStyle, type VideoStyleId } from "@/lib/video-styles";
import { LAYER_BLEND_MODE_OPTIONS } from "@/lib/layer-blend-modes";
import { TEMPLATE_FONT_PRESETS } from "@/lib/template-typography";
import type { TemplateAnimation, TemplateAnimationType } from "@/lib/video-template-engine";
import { GOAL_LABELS } from "../foundation";
import type { Goal, TimelineLayer } from "../foundation";
import { EmptyMini, Field, PanelHeading } from "../ui";

const TEXT_STYLE_PRESETS: Array<{
  id: string;
  label: string;
  detail: string;
  patch: Partial<TimelineLayer>;
}> = [
  {
    id: "tiktok-caption",
    label: "كابشن تيك توك",
    detail: "أبيض ثقيل بحد أسود",
    patch: {
      fontSize: 72,
      fontWeight: "900",
      lineHeight: 1.05,
      textColor: "#ffffff",
      color: "#ffffff",
      textStrokeColor: "#000000",
      textStrokeWidth: 10,
      textShadowBlur: 0,
      textShadowOffsetX: 0,
      textShadowOffsetY: 0,
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 8,
      align: "center",
      direction: "auto",
    },
  },
  {
    id: "luxury-title",
    label: "عنوان فاخر",
    detail: "ذهبي مع ظل سينمائي",
    patch: {
      fontSize: 68,
      fontWeight: "900",
      lineHeight: 1.1,
      textColor: "#f8e7b0",
      color: "#f8e7b0",
      textStrokeColor: "#050608",
      textStrokeWidth: 3,
      textShadowColor: "#000000",
      textShadowBlur: 22,
      textShadowOffsetX: 0,
      textShadowOffsetY: 10,
      backgroundColor: "transparent",
      borderRadius: 0,
      padding: 16,
      align: "center",
      direction: "auto",
    },
  },
  {
    id: "clean-lower-third",
    label: "شريط نظيف",
    detail: "صندوق أبيض للشرح",
    patch: {
      fontSize: 44,
      fontWeight: "600",
      lineHeight: 1.25,
      textColor: "#111827",
      color: "#111827",
      textStrokeWidth: 0,
      textShadowBlur: 0,
      textShadowOffsetX: 0,
      textShadowOffsetY: 0,
      backgroundColor: "#ffffff",
      borderRadius: 28,
      padding: 36,
      align: "center",
      direction: "auto",
    },
  },
  {
    id: "cta-pill",
    label: "زر دعوة",
    detail: "CTA واضح وقابل للقراءة",
    patch: {
      fontSize: 50,
      fontWeight: "900",
      lineHeight: 1.1,
      textColor: "#050608",
      color: "#050608",
      textStrokeWidth: 0,
      textShadowColor: "#000000",
      textShadowBlur: 18,
      textShadowOffsetX: 0,
      textShadowOffsetY: 12,
      backgroundColor: "#8ef7c2",
      borderRadius: 60,
      padding: 42,
      align: "center",
      direction: "auto",
    },
  },
];

const ANIMATION_OPTIONS: Array<{ value: "none" | TemplateAnimationType; label: string }> = [
  { value: "none", label: "None" },
  { value: "fadeIn", label: "Fade" },
  { value: "slideUp", label: "Slide up" },
  { value: "slideDown", label: "Slide down" },
  { value: "slideLeft", label: "Slide left" },
  { value: "slideRight", label: "Slide right" },
  { value: "zoomIn", label: "Zoom in" },
  { value: "zoomOut", label: "Zoom out" },
  { value: "pop", label: "Pop" },
  { value: "bounce", label: "Bounce" },
];

const MEDIA_FILTER_PRESETS: Array<{
  id: string;
  label: string;
  detail: string;
  patch: Pick<TimelineLayer, "brightness" | "contrast" | "saturation" | "blur">;
}> = [
  {
    id: "clean-product",
    label: "Product clean",
    detail: "واضح ومشرق للمنتجات",
    patch: { brightness: 108, contrast: 112, saturation: 118, blur: 0 },
  },
  {
    id: "food-pop",
    label: "Food pop",
    detail: "ألوان أقوى للأكل",
    patch: { brightness: 104, contrast: 114, saturation: 148, blur: 0 },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    detail: "تباين ناعم وإشباع أقل",
    patch: { brightness: 96, contrast: 124, saturation: 88, blur: 0 },
  },
  {
    id: "soft-blur",
    label: "Soft blur",
    detail: "خلفية ناعمة للنصوص",
    patch: { brightness: 92, contrast: 105, saturation: 96, blur: 10 },
  },
];

const MEDIA_FRAMING_PRESETS: Array<{
  id: string;
  label: string;
  detail: string;
  patch: Pick<TimelineLayer, "mediaZoom" | "mediaOffsetX" | "mediaOffsetY">;
}> = [
  {
    id: "center",
    label: "Center",
    detail: "توسيط بدون قص إضافي",
    patch: { mediaZoom: 1, mediaOffsetX: 0, mediaOffsetY: 0 },
  },
  {
    id: "product-closeup",
    label: "Close-up",
    detail: "تقريب للمنتج أو الوجه",
    patch: { mediaZoom: 1.35, mediaOffsetX: 0, mediaOffsetY: 0 },
  },
  {
    id: "top-focus",
    label: "Top focus",
    detail: "تركيز أعلى الصورة",
    patch: { mediaZoom: 1.18, mediaOffsetX: 0, mediaOffsetY: -55 },
  },
  {
    id: "bottom-focus",
    label: "Bottom focus",
    detail: "تركيز أسفل الصورة",
    patch: { mediaZoom: 1.18, mediaOffsetX: 0, mediaOffsetY: 55 },
  },
];

const LAYER_BORDER_PRESETS: Array<{
  id: string;
  label: string;
  detail: string;
  patch: Pick<TimelineLayer, "borderColor" | "borderWidth">;
}> = [
  {
    id: "none",
    label: "No border",
    detail: "إزالة الإطار",
    patch: { borderColor: "#ffffff", borderWidth: 0 },
  },
  {
    id: "white-frame",
    label: "White frame",
    detail: "إطار واضح للصور",
    patch: { borderColor: "#ffffff", borderWidth: 10 },
  },
  {
    id: "brand-neon",
    label: "Brand neon",
    detail: "لون موج للكابشن",
    patch: { borderColor: "#8ef7c2", borderWidth: 8 },
  },
  {
    id: "soft-dark",
    label: "Soft dark",
    detail: "تحديد هادي وداكن",
    patch: { borderColor: "#111827", borderWidth: 6 },
  },
];

const LAYER_SHADOW_PRESETS: Array<{
  id: string;
  label: string;
  detail: string;
  patch: Pick<TimelineLayer, "shadowColor" | "shadowBlur" | "shadowOffsetX" | "shadowOffsetY">;
}> = [
  {
    id: "none",
    label: "No shadow",
    detail: "بدون عمق بصري",
    patch: { shadowColor: "#000000", shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0 },
  },
  {
    id: "soft-depth",
    label: "Soft depth",
    detail: "ظل ناعم للصور",
    patch: { shadowColor: "#000000", shadowBlur: 28, shadowOffsetX: 0, shadowOffsetY: 18 },
  },
  {
    id: "floating-card",
    label: "Floating card",
    detail: "عمق واضح للقوالب",
    patch: { shadowColor: "#000000", shadowBlur: 42, shadowOffsetX: 0, shadowOffsetY: 28 },
  },
  {
    id: "brand-glow",
    label: "Brand glow",
    detail: "إضاءة بلون موج",
    patch: { shadowColor: "#8ef7c2", shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0 },
  },
];

export function ProjectSettingsPanel({
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

export function LayerInspector({
  layer,
  aspectRatio,
  onChange,
  onDelete,
}: {
  layer: TimelineLayer | null;
  aspectRatio: AspectRatio;
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
  const locked = Boolean(layer.locked);
  const supportsBorderRadius = layer.type === "text" || layer.type === "caption" || layer.type === "shape" || layer.type === "image" || layer.type === "video";
  const supportsBackgroundColor = layer.type === "text" || layer.type === "caption" || layer.type === "shape";
  const supportsRotation = supportsBorderRadius;
  const supportsQuickPosition = supportsBorderRadius;
  const supportsAnimation = supportsBorderRadius;
  const supportsBlendMode = supportsBorderRadius;
  const dimensions = getInspectorDimensions(aspectRatio);
  const safeMargins = getInspectorSafeMargins(aspectRatio);
  const { horizontal, vertical, sizing, formats } = createLayerLayoutActions(layer, dimensions, safeMargins);

  return (
    <section className="panel p-4">
      <PanelHeading icon={Layers3} title="Layer inspector" />
      <Field label="Layer name">
        <input
          value={layer.name}
          disabled={locked}
          onChange={(event) => onChange({ name: event.target.value })}
          className="control-input disabled:cursor-not-allowed disabled:opacity-50"
        />
      </Field>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange({ locked: !layer.locked })}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${
            layer.locked
              ? "border-amber-300/40 bg-amber-500/15 text-amber-200"
              : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--brand)]"
          }`}
        >
          {layer.locked ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Unlock className="h-4 w-4" aria-hidden="true" />}
          {layer.locked ? "Locked" : "Unlocked"}
        </button>
        <button
          type="button"
          onClick={() => onChange({ hidden: !layer.hidden })}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-black transition ${
            layer.hidden
              ? "border-sky-300/40 bg-sky-500/15 text-sky-100"
              : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--brand)]"
          }`}
        >
          {layer.hidden ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          {layer.hidden ? "Hidden" : "Visible"}
        </button>
      </div>
      {locked ? (
        <p className="mb-3 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs font-bold leading-5 text-amber-100">
          This layer is locked. Unlock it to edit position, timing, media, or text.
        </p>
      ) : null}
      {layer.type === "text" || layer.type === "caption" ? (
        <Field label="Text content">
          <textarea
            value={layer.content ?? layer.name}
            disabled={locked}
            onChange={(event) => onChange({ content: event.target.value, name: event.target.value.slice(0, 42) || layer.name })}
            dir="auto"
            className="min-h-24 w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </Field>
      ) : null}
      {layer.type === "image" || layer.type === "video" ? (
        <>
          <Field label="Replace media">
            <label className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--line-strong)] bg-[var(--panel-soft)] p-3 text-center transition ${locked ? "cursor-not-allowed opacity-50" : "hover:border-[var(--brand)]"}`}>
              <UploadCloud className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
              <span className="text-xs font-black">{layer.src ? "Media attached" : "Upload replacement"}</span>
              <input
                type="file"
                accept={layer.type === "image" ? "image/*" : "video/*"}
                disabled={locked}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onChange({ src: URL.createObjectURL(file), name: file.name });
                }}
              />
            </label>
          </Field>
          <Field label="Media fit">
            <select
              value={layer.fit ?? "cover"}
              disabled={locked}
              onChange={(event) => onChange({ fit: event.target.value as TimelineLayer["fit"] })}
              className="control-select disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="cover">Cover - fill frame</option>
              <option value="contain">Contain - show all</option>
              <option value="fill">Fill - stretch</option>
            </select>
          </Field>
          <div>
            <p className="mb-2 text-xs font-black text-[var(--muted)]">Crop and pan</p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {MEDIA_FRAMING_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onChange(preset.patch)}
                  className="min-h-14 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-xs font-black text-white" dir="auto">
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold leading-4 text-[var(--muted)]" dir="auto">
                    {preset.detail}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Zoom"
                value={layer.mediaZoom ?? 1}
                disabled={locked}
                step={0.05}
                onChange={(mediaZoom) => onChange({ mediaZoom: clampInspectorNumber(mediaZoom, 0.2, 4) })}
              />
              <NumberField
                label="Pan X"
                value={layer.mediaOffsetX ?? 0}
                disabled={locked}
                onChange={(mediaOffsetX) => onChange({ mediaOffsetX: clampInspectorNumber(mediaOffsetX, -100, 100) })}
              />
              <NumberField
                label="Pan Y"
                value={layer.mediaOffsetY ?? 0}
                disabled={locked}
                onChange={(mediaOffsetY) => onChange({ mediaOffsetY: clampInspectorNumber(mediaOffsetY, -100, 100) })}
              />
            </div>
            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ mediaZoom: 1, mediaOffsetX: 0, mediaOffsetY: 0 })}
              className="mt-2 min-h-9 w-full rounded-lg border border-[var(--line)] bg-black/20 px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset crop and pan
            </button>
          </div>
          <div>
            <p className="mb-2 text-xs font-black text-[var(--muted)]">Visual filters</p>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {MEDIA_FILTER_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onChange(preset.patch)}
                  className="min-h-14 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-xs font-black text-white" dir="auto">
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold leading-4 text-[var(--muted)]" dir="auto">
                    {preset.detail}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberField
                label="Brightness %"
                value={layer.brightness ?? 100}
                disabled={locked}
                onChange={(brightness) => onChange({ brightness: clampInspectorNumber(brightness, 0, 220) })}
              />
              <NumberField
                label="Contrast %"
                value={layer.contrast ?? 100}
                disabled={locked}
                onChange={(contrast) => onChange({ contrast: clampInspectorNumber(contrast, 0, 220) })}
              />
              <NumberField
                label="Saturation %"
                value={layer.saturation ?? 100}
                disabled={locked}
                onChange={(saturation) => onChange({ saturation: clampInspectorNumber(saturation, 0, 260) })}
              />
              <NumberField
                label="Blur px"
                value={layer.blur ?? 0}
                disabled={locked}
                onChange={(blur) => onChange({ blur: clampInspectorNumber(blur, 0, 80) })}
              />
            </div>
            <button
              type="button"
              disabled={locked}
              onClick={() => onChange({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })}
              className="mt-2 min-h-9 w-full rounded-lg border border-[var(--line)] bg-black/20 px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset visual filters
            </button>
          </div>
        </>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Start" value={layer.start} disabled={locked} onChange={(start) => onChange({ start })} />
        <NumberField label="Duration" value={layer.duration} disabled={locked} onChange={(duration) => onChange({ duration })} />
        <NumberField label="X" value={layer.x ?? 0} disabled={locked} onChange={(x) => onChange({ x })} />
        <NumberField label="Y" value={layer.y ?? 0} disabled={locked} onChange={(y) => onChange({ y })} />
        <NumberField label="Width" value={layer.width ?? 0} disabled={locked} onChange={(width) => onChange({ width })} />
        <NumberField label="Height" value={layer.height ?? 0} disabled={locked} onChange={(height) => onChange({ height })} />
      </div>
      {supportsQuickPosition ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[var(--muted)]">Canvas align</p>
          <div className="grid grid-cols-3 gap-2">
            {horizontal.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={locked}
                onClick={() => onChange(action.patch)}
                className="min-h-12 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-xs font-black transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-white" dir="auto">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted)]" dir="auto">{action.detail}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {vertical.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={locked}
                onClick={() => onChange(action.patch)}
                className="min-h-12 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-xs font-black transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-white" dir="auto">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted)]" dir="auto">{action.detail}</span>
              </button>
            ))}
          </div>
          <p className="pt-1 text-xs font-black text-[var(--muted)]">Smart sizing</p>
          <div className="grid grid-cols-2 gap-2">
            {sizing.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={locked}
                onClick={() => onChange(action.patch)}
                className="min-h-12 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-xs font-black transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-white" dir="auto">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted)]" dir="auto">{action.detail}</span>
              </button>
            ))}
          </div>
          <p className="pt-1 text-xs font-black text-[var(--muted)]">Format presets</p>
          <div className="grid grid-cols-2 gap-2">
            {formats.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={locked}
                onClick={() => onChange(action.patch)}
                className="min-h-12 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 py-1 text-xs font-black transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-white" dir="auto">{action.label}</span>
                <span className="mt-0.5 block text-[10px] font-bold text-[var(--muted)]" dir="auto">{action.detail}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <NumberField
          label="Opacity %"
          value={Math.round((layer.opacity ?? 1) * 100)}
          disabled={locked}
          onChange={(opacity) => onChange({ opacity: clampInspectorNumber(opacity, 0, 100) / 100 })}
        />
        {supportsBlendMode ? (
          <NumberField
            label="Stack"
            value={layer.zIndex ?? 0}
            disabled={locked}
            onChange={(zIndex) => onChange({ zIndex: clampInspectorNumber(zIndex, 0, 999) })}
          />
        ) : null}
        {supportsBlendMode ? (
          <Field label="Blend mode">
            <select
              value={layer.blendMode ?? "normal"}
              disabled={locked}
              onChange={(event) => onChange({ blendMode: event.target.value as TimelineLayer["blendMode"] })}
              className="control-select disabled:cursor-not-allowed disabled:opacity-50"
            >
              {LAYER_BLEND_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.detail}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {supportsBorderRadius ? (
          <NumberField
            label="Radius"
            value={layer.borderRadius ?? 0}
            disabled={locked}
            onChange={(borderRadius) => onChange({ borderRadius: clampInspectorNumber(borderRadius, 0, 240) })}
          />
        ) : null}
        {supportsBorderRadius ? (
          <NumberField
            label="Border px"
            value={layer.borderWidth ?? 0}
            disabled={locked}
            onChange={(borderWidth) => onChange({ borderWidth: clampInspectorNumber(borderWidth, 0, 80) })}
          />
        ) : null}
        {supportsRotation ? (
          <NumberField
            label="Rotation"
            value={layer.rotation ?? 0}
            disabled={locked}
            onChange={(rotation) => onChange({ rotation: clampInspectorNumber(rotation, -360, 360) })}
          />
        ) : null}
      </div>
      {supportsBorderRadius ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[var(--muted)]">Border presets</p>
          <div className="grid grid-cols-2 gap-2">
            {LAYER_BORDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={locked}
                onClick={() => onChange(preset.patch)}
                className="min-h-14 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-xs font-black text-white" dir="auto">
                  {preset.label}
                </span>
                <span className="mt-1 block text-[10px] font-bold leading-4 text-[var(--muted)]" dir="auto">
                  {preset.detail}
                </span>
              </button>
            ))}
          </div>
          <Field label="Border color">
            <input
              type="color"
              value={resolveInspectorColorInputValue(layer.borderColor, "#ffffff")}
              disabled={locked}
              onChange={(event) => onChange({ borderColor: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
        </div>
      ) : null}
      {supportsBorderRadius ? (
        <div className="space-y-2">
          <p className="text-xs font-black text-[var(--muted)]">Shadow presets</p>
          <div className="grid grid-cols-2 gap-2">
            {LAYER_SHADOW_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                disabled={locked}
                onClick={() => onChange(preset.patch)}
                className="min-h-14 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="block text-xs font-black text-white" dir="auto">
                  {preset.label}
                </span>
                <span className="mt-1 block text-[10px] font-bold leading-4 text-[var(--muted)]" dir="auto">
                  {preset.detail}
                </span>
              </button>
            ))}
          </div>
          <Field label="Shadow color">
            <input
              type="color"
              value={resolveInspectorColorInputValue(layer.shadowColor, "#000000")}
              disabled={locked}
              onChange={(event) => onChange({ shadowColor: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Blur"
              value={layer.shadowBlur ?? 0}
              disabled={locked}
              onChange={(shadowBlur) => onChange({ shadowBlur: clampInspectorNumber(shadowBlur, 0, 120) })}
            />
            <NumberField
              label="X"
              value={layer.shadowOffsetX ?? 0}
              disabled={locked}
              onChange={(shadowOffsetX) => onChange({ shadowOffsetX: clampInspectorNumber(shadowOffsetX, -120, 120) })}
            />
            <NumberField
              label="Y"
              value={layer.shadowOffsetY ?? 0}
              disabled={locked}
              onChange={(shadowOffsetY) => onChange({ shadowOffsetY: clampInspectorNumber(shadowOffsetY, -120, 120) })}
            />
          </div>
        </div>
      ) : null}
      {supportsAnimation ? (
        <AnimationControls layer={layer} locked={locked} onChange={onChange} />
      ) : null}
      {layer.type === "text" || layer.type === "caption" ? (
        <div className="space-y-3">
          <Field label="Font family">
            <select
              value={resolveInspectorFontValue(layer)}
              disabled={locked}
              onChange={(event) => onChange({ fontFamily: event.target.value })}
              className="control-select disabled:cursor-not-allowed disabled:opacity-50"
            >
              {TEMPLATE_FONT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.cssStack}>
                  {preset.label} — {preset.description}
                </option>
              ))}
            </select>
          </Field>
          <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
            <p
              className="text-xl font-black leading-snug"
              dir={layer.direction ?? "auto"}
              style={{
                color: layer.textColor ?? layer.color,
                fontFamily: resolveInspectorFontValue(layer),
                fontWeight: normalizeInspectorFontWeight(layer.fontWeight),
                lineHeight: layer.lineHeight ?? 1.15,
                textAlign: layer.align ?? "center",
                WebkitTextStroke: resolveInspectorTextStroke(layer, 1),
                textShadow: resolveInspectorTextShadow(layer, 0.3),
              }}
            >
              {layer.content ?? layer.name}
            </p>
            <p className="mt-2 text-[10px] font-bold text-[var(--muted)]">
              Live typography sample
            </p>
          </div>
          <Field label="Text presets">
            <div className="grid grid-cols-2 gap-2">
              {TEXT_STYLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={locked}
                  onClick={() => onChange(preset.patch)}
                  className="min-h-16 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-right transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="block text-xs font-black text-white" dir="auto">
                    {preset.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-bold leading-4 text-[var(--muted)]" dir="auto">
                    {preset.detail}
                  </span>
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Font size" value={layer.fontSize ?? 48} disabled={locked} onChange={(fontSize) => onChange({ fontSize })} />
            <NumberField
              label="Line height"
              value={layer.lineHeight ?? 1.15}
              disabled={locked}
              step={0.05}
              onChange={(lineHeight) => onChange({ lineHeight: clampInspectorNumber(lineHeight, 0.8, 2.2) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Padding"
              value={layer.padding ?? 16}
              disabled={locked}
              onChange={(padding) => onChange({ padding: clampInspectorNumber(padding, 0, 160) })}
            />
            <Field label="Font weight">
              <select
                value={layer.fontWeight ?? "bold"}
                disabled={locked}
                onChange={(event) => onChange({ fontWeight: event.target.value })}
                className="control-select disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="normal">Normal</option>
                <option value="600">Semi Bold</option>
                <option value="bold">Bold</option>
                <option value="900">Black</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Align">
              <div className="grid grid-cols-3 gap-1">
                {(["right", "center", "left"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    disabled={locked}
                    onClick={() => onChange({ align })}
                    className={`min-h-10 rounded-md border px-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      (layer.align ?? "center") === align
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Direction">
              <select
                value={layer.direction ?? "auto"}
                disabled={locked}
                onChange={(event) => onChange({ direction: event.target.value as TimelineLayer["direction"] })}
                className="control-select disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="auto">Auto</option>
                <option value="rtl">RTL Arabic</option>
                <option value="ltr">LTR English</option>
              </select>
            </Field>
          </div>
          <Field label="Text color">
            <input
              type="color"
              value={layer.textColor ?? layer.color}
              disabled={locked}
              onChange={(event) => onChange({ textColor: event.target.value, color: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Outline color">
              <input
                type="color"
                value={resolveInspectorColorInputValue(layer.textStrokeColor, "#000000")}
                disabled={locked}
                onChange={(event) => onChange({ textStrokeColor: event.target.value })}
                className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>
            <NumberField
              label="Outline px"
              value={layer.textStrokeWidth ?? 4}
              disabled={locked}
              onChange={(textStrokeWidth) => onChange({ textStrokeWidth: clampInspectorNumber(textStrokeWidth, 0, 40) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Shadow color">
              <input
                type="color"
                value={resolveInspectorColorInputValue(layer.textShadowColor, "#000000")}
                disabled={locked}
                onChange={(event) => onChange({ textShadowColor: event.target.value })}
                className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </Field>
            <NumberField
              label="Shadow blur"
              value={layer.textShadowBlur ?? 0}
              disabled={locked}
              onChange={(textShadowBlur) => onChange({ textShadowBlur: clampInspectorNumber(textShadowBlur, 0, 80) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="Shadow X"
              value={layer.textShadowOffsetX ?? 0}
              disabled={locked}
              onChange={(textShadowOffsetX) => onChange({ textShadowOffsetX: clampInspectorNumber(textShadowOffsetX, -80, 80) })}
            />
            <NumberField
              label="Shadow Y"
              value={layer.textShadowOffsetY ?? 0}
              disabled={locked}
              onChange={(textShadowOffsetY) => onChange({ textShadowOffsetY: clampInspectorNumber(textShadowOffsetY, -80, 80) })}
            />
          </div>
          <BackgroundColorField layer={layer} locked={locked} onChange={onChange} />
        </div>
      ) : (
        <>
          <Field label="Layer color">
            <input
              type="color"
              value={resolveInspectorColorInputValue(layer.backgroundColor ?? layer.color)}
              disabled={locked}
              onChange={(event) =>
                onChange(
                  layer.type === "shape"
                    ? { color: event.target.value, backgroundColor: event.target.value }
                    : { color: event.target.value },
                )
              }
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Field>
          {supportsBackgroundColor ? <BackgroundColorField layer={layer} locked={locked} onChange={onChange} /> : null}
        </>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={locked}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm font-black text-red-100 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete selected layer
      </button>
    </section>
  );
}

function resolveInspectorFontValue(layer: TimelineLayer) {
  return layer.fontFamily ?? TEMPLATE_FONT_PRESETS[0].cssStack;
}

function normalizeInspectorFontWeight(weight?: string) {
  if (weight === "normal") return 500;
  if (weight === "bold") return 900;
  return weight ?? 900;
}

function resolveInspectorTextStroke(layer: TimelineLayer, scale = 1) {
  const width = Math.max(0, (layer.textStrokeWidth ?? 4) * scale);
  if (!width) return undefined;
  return `${width}px ${layer.textStrokeColor ?? "rgba(0,0,0,0.66)"}`;
}

function resolveInspectorTextShadow(layer: TimelineLayer, scale = 1) {
  const blur = Math.max(0, (layer.textShadowBlur ?? 0) * scale);
  const offsetX = (layer.textShadowOffsetX ?? 0) * scale;
  const offsetY = (layer.textShadowOffsetY ?? 0) * scale;

  if (!blur && !offsetX && !offsetY) return undefined;
  return `${offsetX}px ${offsetY}px ${blur}px ${layer.textShadowColor ?? "rgba(0,0,0,0.72)"}`;
}

function getInspectorDimensions(aspectRatio: AspectRatio) {
  if (aspectRatio === "16:9") return { width: 1920, height: 1080 };
  if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
  return { width: 1080, height: 1920 };
}

function getInspectorSafeMargins(aspectRatio: AspectRatio) {
  if (aspectRatio === "9:16") return { top: 160, bottom: 260, left: 70, right: 70 };
  if (aspectRatio === "1:1") return { top: 90, bottom: 120, left: 80, right: 80 };
  return { top: 84, bottom: 104, left: 120, right: 120 };
}

function createLayerLayoutActions(
  layer: TimelineLayer,
  dimensions: { width: number; height: number },
  safeMargins: { top: number; bottom: number; left: number; right: number },
) {
  const layerWidth = Math.max(1, layer.width ?? dimensions.width * 0.74);
  const layerHeight = Math.max(1, layer.height ?? dimensions.height * 0.12);
  const centerX = Math.round((dimensions.width - layerWidth) / 2);
  const centerY = Math.round((dimensions.height - layerHeight) / 2);
  const safeWidth = Math.max(1, dimensions.width - safeMargins.left - safeMargins.right);
  const safeHeight = Math.max(1, dimensions.height - safeMargins.top - safeMargins.bottom);
  const rightX = Math.round(clampInspectorNumber(dimensions.width - safeMargins.right - layerWidth, 0, Math.max(0, dimensions.width - layerWidth)));
  const bottomY = Math.round(clampInspectorNumber(dimensions.height - safeMargins.bottom - layerHeight, 0, Math.max(0, dimensions.height - layerHeight)));
  const titleHeight = Math.round(dimensions.height * 0.12);
  const captionHeight = Math.round(dimensions.height * 0.14);
  const lowerThirdHeight = Math.round(dimensions.height * 0.18);
  const heroHeight = Math.round(safeHeight * 0.6);
  const squareSize = Math.round(Math.min(safeWidth, safeHeight * 0.54));

  return {
    horizontal: [
      { label: "Left", detail: "يسار آمن", patch: { x: safeMargins.left } },
      { label: "Center X", detail: "توسيط أفقي", patch: { x: centerX } },
      { label: "Right", detail: "يمين آمن", patch: { x: rightX } },
    ],
    vertical: [
      { label: "Top", detail: "أعلى آمن", patch: { y: safeMargins.top } },
      { label: "Center Y", detail: "توسيط عمودي", patch: { y: centerY } },
      { label: "Bottom", detail: "أسفل آمن", patch: { y: bottomY } },
    ],
    sizing: [
      { label: "Safe width", detail: "عرض مناسب للنص", patch: { x: safeMargins.left, width: safeWidth } },
      { label: "Safe frame", detail: "داخل الهوامش", patch: { x: safeMargins.left, y: safeMargins.top, width: safeWidth, height: safeHeight } },
      { label: "Full width", detail: "عرض الكادر", patch: { x: 0, width: dimensions.width } },
      { label: "Full frame", detail: "املأ الكادر", patch: { x: 0, y: 0, width: dimensions.width, height: dimensions.height } },
    ],
    formats: [
      {
        label: "Title block",
        detail: "عنوان علوي آمن",
        patch: { x: safeMargins.left, y: safeMargins.top, width: safeWidth, height: titleHeight },
      },
      {
        label: "Caption block",
        detail: "كابشن سفلي واضح",
        patch: { x: safeMargins.left, y: Math.round(dimensions.height - safeMargins.bottom - captionHeight), width: safeWidth, height: captionHeight },
      },
      {
        label: "Hero media",
        detail: "مساحة رئيسية للصور",
        patch: { x: safeMargins.left, y: safeMargins.top, width: safeWidth, height: heroHeight },
      },
      {
        label: "Square focus",
        detail: "منتج أو صورة مربعة",
        patch: { x: Math.round((dimensions.width - squareSize) / 2), y: Math.round((dimensions.height - squareSize) / 2), width: squareSize, height: squareSize },
      },
      {
        label: "Lower third",
        detail: "شريط معلومات سفلي",
        patch: { x: safeMargins.left, y: Math.round(dimensions.height - safeMargins.bottom - lowerThirdHeight), width: safeWidth, height: lowerThirdHeight },
      },
      {
        label: "CTA pill",
        detail: "زر دعوة للتفاعل",
        patch: {
          x: Math.round(dimensions.width * 0.18),
          y: Math.round(dimensions.height - safeMargins.bottom - dimensions.height * 0.08),
          width: Math.round(dimensions.width * 0.64),
          height: Math.round(dimensions.height * 0.08),
        },
      },
    ],
  };
}

function AnimationControls({
  layer,
  locked,
  onChange,
}: {
  layer: TimelineLayer;
  locked: boolean;
  onChange: (patch: Partial<TimelineLayer>) => void;
}) {
  return (
    <Field label="Layer animation">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={resolveAnimationSelectValue(layer.animationIn)}
          disabled={locked}
          onChange={(event) =>
            onChange({
              animationIn: createInspectorAnimation(event.target.value, layer.animationIn?.duration),
            })
          }
          className="control-select disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ANIMATION_OPTIONS.map((option) => (
            <option key={`in-${option.value}`} value={option.value}>
              In · {option.label}
            </option>
          ))}
        </select>
        <select
          value={resolveAnimationSelectValue(layer.animationOut)}
          disabled={locked}
          onChange={(event) =>
            onChange({
              animationOut: createInspectorAnimation(event.target.value, layer.animationOut?.duration),
            })
          }
          className="control-select disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ANIMATION_OPTIONS.map((option) => (
            <option key={`out-${option.value}`} value={option.value}>
              Out · {option.label}
            </option>
          ))}
        </select>
        <NumberField
          label="In duration"
          value={layer.animationIn?.duration ?? 0}
          disabled={locked || resolveAnimationSelectValue(layer.animationIn) === "none"}
          onChange={(duration) =>
            onChange({
              animationIn: {
                type: resolveConcreteAnimationType(layer.animationIn, "fadeIn"),
                duration: clampInspectorNumber(duration, 0, 3),
              },
            })
          }
        />
        <NumberField
          label="Out duration"
          value={layer.animationOut?.duration ?? 0}
          disabled={locked || resolveAnimationSelectValue(layer.animationOut) === "none"}
          onChange={(duration) =>
            onChange({
              animationOut: {
                type: resolveConcreteAnimationType(layer.animationOut, "fadeOut"),
                duration: clampInspectorNumber(duration, 0, 3),
              },
            })
          }
        />
      </div>
    </Field>
  );
}

function resolveAnimationSelectValue(animation?: TemplateAnimation) {
  if (!animation?.duration) return "none";
  return animation.type;
}

function createInspectorAnimation(value: string, previousDuration?: number): TemplateAnimation {
  if (value === "none") return { type: "fadeIn", duration: 0 };
  return {
    type: value as TemplateAnimationType,
    duration: previousDuration && previousDuration > 0 ? previousDuration : 0.45,
  };
}

function resolveConcreteAnimationType(animation: TemplateAnimation | undefined, fallback: TemplateAnimationType) {
  return animation?.duration ? animation.type : fallback;
}

function BackgroundColorField({
  layer,
  locked,
  onChange,
}: {
  layer: TimelineLayer;
  locked: boolean;
  onChange: (patch: Partial<TimelineLayer>) => void;
}) {
  return (
    <Field label="Background color">
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="color"
          value={resolveInspectorColorInputValue(layer.backgroundColor, "#050608")}
          disabled={locked}
          onChange={(event) => onChange({ backgroundColor: event.target.value })}
          className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="button"
          disabled={locked}
          onClick={() => onChange({ backgroundColor: "transparent" })}
          className="min-h-11 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 text-xs font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </Field>
  );
}

function clampInspectorNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function resolveInspectorColorInputValue(value: string | undefined, fallback = "#8ef7c2") {
  if (!value || value.includes("{{") || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value;
}

export function NumberField({
  label,
  value,
  disabled = false,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="control-input disabled:cursor-not-allowed disabled:opacity-50"
      />
    </Field>
  );
}
