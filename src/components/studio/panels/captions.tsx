import { Captions, Download, FileUp, Loader2, Mic2, MonitorUp, Plus, Trash2 } from "lucide-react";
import { CAPTION_TEMPLATES } from "../foundation";
import type { CaptionLine, TranscriptionMode } from "../foundation";
import { CompactButton, DemoModeBanner, PanelHeading } from "../ui";
import { formatDuration, getTranscriptionModeDescription } from "../utils";

export function CaptionsPanel({
  captions,
  template,
  onTemplateChange,
  onCaptionChange,
  onCaptionTimingChange,
  onAddCaption,
  onDeleteCaption,
  onAutoTranscribe,
  onImportSrt,
  onDownloadSrt,
  onBurnCaptions,
  isTranscribing,
  transcriptionMode,
  transcriptionNotice,
}: {
  captions: CaptionLine[];
  template: string;
  onTemplateChange: (template: string) => void;
  onCaptionChange: (id: string, text: string) => void;
  onCaptionTimingChange: (id: string, patch: Pick<CaptionLine, "start" | "end">) => void;
  onAddCaption: () => void;
  onDeleteCaption: (id: string) => void;
  onAutoTranscribe: () => void;
  onImportSrt: (file: File) => void;
  onDownloadSrt: () => void;
  onBurnCaptions: () => void;
  isTranscribing: boolean;
  transcriptionMode: TranscriptionMode | null;
  transcriptionNotice: string;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Captions} title="Automatic captions" />
      <button
        type="button"
        onClick={onAutoTranscribe}
        disabled={isTranscribing}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white disabled:opacity-60"
      >
        {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
        {isTranscribing ? "Transcribing..." : "Read video and generate captions"}
      </button>
      {transcriptionMode === "demo" ? <DemoModeBanner /> : null}
      {transcriptionMode ? (
        <p className="mb-3 rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-bold text-[var(--muted)]">
          {getTranscriptionModeDescription(transcriptionMode)}
        </p>
      ) : null}
      {transcriptionNotice ? (
        <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-bold leading-5 text-amber-100">
          {transcriptionNotice}
        </p>
      ) : null}
      <div className="mb-3 grid grid-cols-1 gap-2">
        {CAPTION_TEMPLATES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onTemplateChange(item)}
            className={`rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              template === item
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mb-3 flex gap-2">
        <CompactButton label="Add caption" icon={Plus} onClick={onAddCaption} />
        <label className="toolbar-btn justify-center px-2 text-[11px]">
          <FileUp className="h-3.5 w-3.5" aria-hidden="true" />
          Import SRT
          <input
            type="file"
            accept=".srt,text/plain,application/x-subrip"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImportSrt(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <CompactButton label="Export SRT" icon={Download} onClick={onDownloadSrt} />
        <CompactButton label="Burn-in" icon={MonitorUp} onClick={onBurnCaptions} />
      </div>
      <div className="max-h-[380px] space-y-2 overflow-auto pr-1">
        {captions.map((caption) => (
          <div key={caption.id} className="block rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2">
            <span className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black text-[var(--brand)]">
              <span>{formatDuration(caption.start)}-{formatDuration(caption.end)}</span>
              <button
                type="button"
                onClick={() => onDeleteCaption(caption.id)}
                className="rounded-md border border-red-400/30 bg-red-500/10 p-1 text-red-100 transition hover:border-red-300"
                aria-label="Delete caption"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <CaptionTimeInput
                label="Start"
                value={caption.start}
                onChange={(start) => onCaptionTimingChange(caption.id, { start, end: caption.end })}
              />
              <CaptionTimeInput
                label="End"
                value={caption.end}
                onChange={(end) => onCaptionTimingChange(caption.id, { start: caption.start, end })}
              />
            </div>
            <textarea
              value={caption.text}
              onChange={(event) => onCaptionChange(caption.id, event.target.value)}
              dir="rtl"
              className="min-h-20 w-full resize-none rounded-md border border-[var(--line)] bg-black/25 p-2 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)]"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function CaptionTimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <span className="block">
      <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">{label}</span>
      <input
        type="number"
        min="0"
        step="0.1"
        value={Number.isFinite(value) ? Math.round(value * 10) / 10 : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 w-full rounded-md border border-[var(--line)] bg-black/25 px-2 text-xs font-black outline-none focus:border-[var(--brand)]"
      />
    </span>
  );
}
