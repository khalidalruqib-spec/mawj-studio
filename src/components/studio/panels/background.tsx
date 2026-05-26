import { Replace, WandSparkles } from "lucide-react";
import { BACKGROUND_OPTIONS } from "../foundation";
import { PanelHeading } from "../ui";

export function BackgroundPanel({
  backgroundMode,
  onChange,
  onApply,
}: {
  backgroundMode: string;
  onChange: (mode: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Replace} title="AI background remover" />
      <div className="space-y-2">
        {BACKGROUND_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              backgroundMode === option
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <button type="button" onClick={onApply} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
        <WandSparkles className="h-4 w-4" aria-hidden="true" />
        Apply background
      </button>
    </section>
  );
}
