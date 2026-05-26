import { BadgeDollarSign, Layers3, Loader2, Rocket } from "lucide-react";
import { AD_TONES, type AdCampaign, type AdTone } from "@/lib/ad-maker";
import { EmptyMini, Field, PanelHeading } from "../ui";

export function AdMakerPanel({
  productName,
  tone,
  output,
  campaign,
  isGenerating,
  onProductNameChange,
  onToneChange,
  onGenerate,
  onApply,
}: {
  productName: string;
  tone: AdTone;
  output: string;
  campaign: AdCampaign | null;
  isGenerating: boolean;
  onProductNameChange: (name: string) => void;
  onToneChange: (tone: AdTone) => void;
  onGenerate: () => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={BadgeDollarSign} title="AI Ad Maker" />
      <Field label="Product name">
        <input value={productName} onChange={(event) => onProductNameChange(event.target.value)} className="control-input" />
      </Field>
      <Field label="Tone">
        <select value={tone} onChange={(event) => onToneChange(event.target.value as AdTone)} className="control-select">
          {AD_TONES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black disabled:opacity-60"
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Rocket className="h-4 w-4" aria-hidden="true" />}
        {isGenerating ? "Generating real campaign..." : "Generate and apply ad"}
      </button>
      {campaign ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-3">
            <p className="text-sm font-black">{campaign.title}</p>
            <p className="mt-2 text-xs font-bold leading-5 text-[var(--muted)]">{campaign.strategy}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {campaign.variants.map((variant) => (
              <div key={variant.id} className="rounded-lg border border-[var(--line)] bg-black/20 p-2">
                <p className="text-xs font-black text-[var(--brand)]">{variant.id}</p>
                <p className="mt-1 line-clamp-3 text-[11px] font-bold leading-5 text-[var(--muted)]">{variant.hook}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={onApply} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-[var(--brand)]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Apply selected campaign again
          </button>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-black/25 p-3 text-xs font-semibold leading-6 text-[var(--foreground)]">
            {output}
          </pre>
        </div>
      ) : (
        <EmptyMini label="Uses OpenAI to create 15s, 30s, and 60s ad scripts, captions, scenes, CTA, hashtags, then applies the 30s version to the timeline." />
      )}
    </section>
  );
}
