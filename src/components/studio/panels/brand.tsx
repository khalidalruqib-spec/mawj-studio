import { Palette } from "lucide-react";
import { TEMPLATE_FONT_PRESETS } from "@/lib/template-typography";
import type { BrandKitState } from "../foundation";
import { Field, PanelHeading } from "../ui";

export function BrandKitPanel({
  brandKit,
  brandName,
  selectedLayerName,
  onChange,
  onBrandNameChange,
  onApplyToSelectedLayer,
}: {
  brandKit: BrandKitState;
  brandName: string;
  selectedLayerName?: string | null;
  onChange: (brandKit: BrandKitState) => void;
  onBrandNameChange: (name: string) => void;
  onApplyToSelectedLayer: () => void;
}) {
  const fontValue = resolveBrandKitFontValue(brandKit.font);

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
        <select
          value={fontValue}
          onChange={(event) => onChange({ ...brandKit, font: event.target.value })}
          className="control-select"
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
          className="text-lg font-black"
          dir="auto"
          style={{ color: brandKit.primaryColor, fontFamily: fontValue }}
        >
          عينة خط وهوية البراند
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-[var(--muted)]">
          {selectedLayerName ? `Selected: ${selectedLayerName}` : "اختر طبقة نص أو كابشن لتطبيق الهوية عليها."}
        </p>
        <button
          type="button"
          onClick={onApplyToSelectedLayer}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-xs font-black text-black transition hover:bg-white"
        >
          Apply brand to selected text
        </button>
      </div>
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

function resolveBrandKitFontValue(font: string) {
  const matchingPreset = TEMPLATE_FONT_PRESETS.find(
    (preset) => preset.cssStack === font || preset.cssStack.includes(font) || preset.canvasStack.includes(font),
  );
  return matchingPreset?.cssStack ?? TEMPLATE_FONT_PRESETS[0].cssStack;
}
