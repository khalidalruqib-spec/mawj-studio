import { Palette, WandSparkles } from "lucide-react";
import type { BrandKitState } from "../foundation";
import { Field, PanelHeading } from "../ui";

export function BrandKitPanel({
  brandKit,
  brandName,
  onChange,
  onBrandNameChange,
  onApply,
}: {
  brandKit: BrandKitState;
  brandName: string;
  onChange: (brandKit: BrandKitState) => void;
  onBrandNameChange: (name: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Palette} title="Brand Kit" />
      <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
        <div>
          <p className="text-sm font-black text-white">{brandName || "Mawj Studio"}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">Apply your colors, caption style, and brand bug to the editable timeline.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-8 w-8 rounded-full border border-white/15" style={{ background: brandKit.primaryColor }} aria-hidden="true" />
          <span className="h-8 w-8 rounded-full border border-white/15" style={{ background: brandKit.secondaryColor }} aria-hidden="true" />
        </div>
      </div>
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
      <button type="button" onClick={onApply} className="btn-brand mt-2 flex w-full items-center justify-center gap-2">
        <WandSparkles className="h-4 w-4" aria-hidden="true" />
        Apply brand kit
      </button>
    </section>
  );
}
