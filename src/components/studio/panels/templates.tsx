import { LayoutTemplate } from "lucide-react";
import { PLATFORM_LABELS } from "@/lib/video-styles";
import { TEMPLATE_PRESETS } from "../foundation";
import { PanelHeading } from "../ui";

export function TemplatesPanel({
  activeTemplateId,
  onApply,
  onSaveCurrent,
}: {
  activeTemplateId: string | null;
  onApply: (templateId: string) => void;
  onSaveCurrent: () => void;
}) {
  return (
    <section className="panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <PanelHeading icon={LayoutTemplate} title="Template library" />
        <span className="rounded-md bg-[var(--brand-soft)] px-2 py-1 text-xs font-black text-[var(--brand)]">
          Applies to timeline
        </span>
      </div>
      <button type="button" onClick={onSaveCurrent} className="btn-brand mb-4 w-full">
        Save current project as template
      </button>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_PRESETS.map((template) => {
          const Icon = template.icon;
          const active = activeTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onApply(template.id)}
              className={`rounded-lg border p-4 text-left transition ${
                active
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--brand)]"
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{template.aspectRatio}</span>
              </div>
              <p className="text-base font-black">{template.name}</p>
              <p className="mt-1 text-xs font-black text-[var(--brand)]">{template.category}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">{template.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="rounded-md bg-black/25 px-2 py-1 text-[11px] font-black">{PLATFORM_LABELS[template.platform]}</span>
                <span className="rounded-md bg-black/25 px-2 py-1 text-[11px] font-black">{template.captionTemplate}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
