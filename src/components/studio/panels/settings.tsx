import { Layers3, SlidersHorizontal, Trash2, UploadCloud } from "lucide-react";
import { FORMAT_PRESETS, PLATFORM_LABELS, VIDEO_STYLES, type AspectRatio, type LanguageMode, type Platform, type VideoStyle, type VideoStyleId } from "@/lib/video-styles";
import { VIDEO_FONT_STACKS, VIDEO_TEXT_PRESETS, getVideoTextPreset } from "@/lib/video-typography";
import { GOAL_LABELS } from "../foundation";
import type { Goal, TimelineLayer } from "../foundation";
import { EmptyMini, Field, PanelHeading } from "../ui";
import { normalizeHexColor } from "../utils";

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
  onAlign,
  onDelete,
}: {
  layer: TimelineLayer | null;
  onChange: (patch: Partial<TimelineLayer>) => void;
  onAlign: (action: LayerAlignmentAction) => void;
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
      {layer.type === "image" ? (
        <Field label="Fit">
          <select
            value={layer.fit ?? "contain"}
            onChange={(event) => onChange({ fit: event.target.value as TimelineLayer["fit"] })}
            className="control-select"
          >
            <option value="contain">Contain - keep full image</option>
            <option value="cover">Cover - fill and crop</option>
            <option value="fill">Fill - stretch to box</option>
          </select>
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
      <Field label="Align">
        <div className="grid grid-cols-2 gap-2">
          <AlignButton label="Center X" onClick={() => onAlign("center-x")} />
          <AlignButton label="Center Y" onClick={() => onAlign("center-y")} />
          <AlignButton label="Safe width" onClick={() => onAlign("safe-width")} />
          <AlignButton label="Safe bottom" onClick={() => onAlign("safe-bottom")} />
        </div>
      </Field>
      {layer.type === "text" || layer.type === "caption" ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Text preset">
            <select
              value=""
              onChange={(event) => {
                const preset = getVideoTextPreset(event.target.value);
                if (preset) {
                  const patch = preset.patch as Partial<TimelineLayer>;
                  onChange({
                    ...patch,
                    color: patch.textColor ?? patch.color ?? layer.textColor ?? layer.color,
                  });
                }
              }}
              className="control-select"
            >
              <option value="">Apply style...</option>
              {VIDEO_TEXT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{preset.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Font">
            <select
              value={layer.fontFamily ?? VIDEO_FONT_STACKS[0].value}
              onChange={(event) => onChange({ fontFamily: event.target.value })}
              className="control-select"
            >
              {VIDEO_FONT_STACKS.map((font) => (
                <option key={font.id} value={font.value}>{font.label}</option>
              ))}
            </select>
          </Field>
          <NumberField label="Font size" value={layer.fontSize ?? 48} min={12} onChange={(fontSize) => onChange({ fontSize })} />
          <Field label="Weight">
            <select
              value={layer.fontWeight ?? "900"}
              onChange={(event) => onChange({ fontWeight: event.target.value })}
              className="control-select"
            >
              <option value="500">Medium</option>
              <option value="700">Bold</option>
              <option value="800">Extra bold</option>
              <option value="900">Black</option>
              <option value="950">Heavy</option>
            </select>
          </Field>
          <NumberField label="Line height" value={layer.lineHeight ?? 1.14} min={0.85} step={0.02} onChange={(lineHeight) => onChange({ lineHeight })} />
          <NumberField label="Letter spacing" value={layer.letterSpacing ?? 0} step={0.5} onChange={(letterSpacing) => onChange({ letterSpacing })} />
          <Field label="Text color">
            <input
              type="color"
              value={normalizeHexColor(layer.textColor ?? layer.color)}
              onChange={(event) => onChange({ textColor: event.target.value, color: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
            />
          </Field>
          <Field label="Stroke color">
            <input
              type="color"
              value={normalizeHexColor(layer.textStrokeColor ?? "#000000")}
              onChange={(event) => onChange({ textStrokeColor: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
            />
          </Field>
          <NumberField label="Stroke" value={layer.textStrokeWidth ?? 0} min={0} step={1} onChange={(textStrokeWidth) => onChange({ textStrokeWidth })} />
          <Field label="Background">
            <input
              type="color"
              value={normalizeHexColor(layer.backgroundColor ?? "#000000")}
              onChange={(event) => onChange({ backgroundColor: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
            />
          </Field>
          <NumberField label="Radius" value={layer.borderRadius ?? 0} min={0} onChange={(borderRadius) => onChange({ borderRadius })} />
          <NumberField label="Padding" value={layer.backgroundPadding ?? 0} min={0} step={2} onChange={(backgroundPadding) => onChange({ backgroundPadding })} />
          <Field label="Shadow color">
            <input
              type="color"
              value={normalizeHexColor(layer.shadowColor ?? "#000000")}
              onChange={(event) => onChange({ shadowColor: event.target.value })}
              className="h-11 w-full rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-1"
            />
          </Field>
          <NumberField label="Shadow blur" value={layer.shadowBlur ?? 0} min={0} step={1} onChange={(shadowBlur) => onChange({ shadowBlur })} />
          <NumberField label="Shadow X" value={layer.shadowOffsetX ?? 0} step={1} onChange={(shadowOffsetX) => onChange({ shadowOffsetX })} />
          <NumberField label="Shadow Y" value={layer.shadowOffsetY ?? 0} step={1} onChange={(shadowOffsetY) => onChange({ shadowOffsetY })} />
          <Field label="Opacity">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={layer.opacity ?? 1}
              onChange={(event) => onChange({ opacity: Number(event.target.value) })}
              className="h-11 w-full accent-[var(--brand)]"
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

export type LayerAlignmentAction = "center-x" | "center-y" | "safe-width" | "safe-bottom";

function AlignButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-10 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
    >
      {label}
    </button>
  );
}

export function NumberField({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="control-input"
      />
    </Field>
  );
}
