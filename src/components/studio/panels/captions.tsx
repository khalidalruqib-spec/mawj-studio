import { Captions, Download, FileUp, Loader2, Mic2, MonitorUp } from "lucide-react";
import { CAPTION_TEMPLATES } from "../foundation";
import type { CaptionLine, TranscriptionMode } from "../foundation";
import { CompactButton, DemoModeBanner, PanelHeading } from "../ui";
import { formatDuration, getTranscriptionModeDescription } from "../utils";

export function CaptionsPanel({
  captions,
  template,
  onTemplateChange,
  onCaptionChange,
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
          <label key={caption.id} className="block rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2">
            <span className="mb-2 block text-[11px] font-black text-[var(--brand)]">
              {formatDuration(caption.start)}-{formatDuration(caption.end)}
            </span>
            <textarea
              value={caption.text}
              onChange={(event) => onCaptionChange(caption.id, event.target.value)}
              dir="rtl"
              className="min-h-20 w-full resize-none rounded-md border border-[var(--line)] bg-black/25 p-2 text-sm font-bold leading-6 outline-none focus:border-[var(--brand)]"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
