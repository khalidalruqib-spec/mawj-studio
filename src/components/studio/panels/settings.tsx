import { Eye, EyeOff, Layers3, Lock, SlidersHorizontal, Trash2, Unlock, UploadCloud } from "lucide-react";
import { FORMAT_PRESETS, PLATFORM_LABELS, VIDEO_STYLES, type AspectRatio, type LanguageMode, type Platform, type VideoStyle, type VideoStyleId } from "@/lib/video-styles";
import { TEMPLATE_FONT_PRESETS } from "@/lib/template-typography";
import { GOAL_LABELS } from "../foundation";
import type { Goal, TimelineLayer } from "../foundation";
import { EmptyMini, Field, PanelHeading } from "../ui";

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
  const locked = Boolean(layer.locked);
  const supportsBorderRadius = layer.type === "text" || layer.type === "caption" || layer.type === "shape" || layer.type === "image" || layer.type === "video";
  const supportsBackgroundColor = layer.type === "text" || layer.type === "caption" || layer.type === "shape";

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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <NumberField
          label="Opacity %"
          value={Math.round((layer.opacity ?? 1) * 100)}
          disabled={locked}
          onChange={(opacity) => onChange({ opacity: clampInspectorNumber(opacity, 0, 100) / 100 })}
        />
        {supportsBorderRadius ? (
          <NumberField
            label="Radius"
            value={layer.borderRadius ?? 0}
            disabled={locked}
            onChange={(borderRadius) => onChange({ borderRadius: clampInspectorNumber(borderRadius, 0, 240) })}
          />
        ) : null}
      </div>
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
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Font size" value={layer.fontSize ?? 48} disabled={locked} onChange={(fontSize) => onChange({ fontSize })} />
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
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="control-input disabled:cursor-not-allowed disabled:opacity-50"
      />
    </Field>
  );
}
