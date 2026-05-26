import { Palette } from "lucide-react";
import type { BrandKitState } from "../foundation";
import { Field, PanelHeading } from "../ui";

export function BrandKitPanel({
  brandKit,
  brandName,
  onChange,
  onBrandNameChange,
}: {
  brandKit: BrandKitState;
  brandName: string;
  onChange: (brandKit: BrandKitState) => void;
  onBrandNameChange: (name: string) => void;
}) {
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
    </section>
  );
}
