import { Captions, ListVideo, Loader2, Mic2, Scissors, Search, Trash2 } from "lucide-react";
import type { TranscriptSegment, TranscriptionMode } from "../foundation";
import { CompactButton, DemoModeBanner, PanelHeading } from "../ui";
import { formatDuration, getTranscriptionModeLabel } from "../utils";

export function TranscriptPanel({
  transcript,
  query,
  onQueryChange,
  onDeleteSegment,
  onRemoveFillers,
  onRemovePauses,
  onAutoTranscribe,
  onGenerateCaptions,
  isTranscribing,
  transcriptionMode,
  transcriptionNotice,
}: {
  transcript: TranscriptSegment[];
  query: string;
  onQueryChange: (query: string) => void;
  onDeleteSegment: (id: string) => void;
  onRemoveFillers: () => void;
  onRemovePauses: () => void;
  onAutoTranscribe: () => void;
  onGenerateCaptions: () => void;
  isTranscribing: boolean;
  transcriptionMode: TranscriptionMode | null;
  transcriptionNotice: string;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Mic2} title="Text-based editing" />
      <button
        type="button"
        onClick={onAutoTranscribe}
        disabled={isTranscribing}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black transition hover:bg-white disabled:opacity-60"
      >
        {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Captions className="h-4 w-4" />}
        {isTranscribing ? "Reading video..." : "Auto-caption from video"}
      </button>
      {transcriptionMode === "demo" ? <DemoModeBanner /> : null}
      {transcriptionMode ? (
        <p className="mb-3 rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-bold text-[var(--muted)]">
          Mode: {getTranscriptionModeLabel(transcriptionMode)}
        </p>
      ) : null}
      {transcriptionNotice ? (
        <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-2 text-xs font-bold leading-5 text-amber-100">
          {transcriptionNotice}
        </p>
      ) : null}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search transcript"
          className="control-input pl-9"
        />
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <CompactButton label="Remove fillers" icon={Trash2} onClick={onRemoveFillers} />
        <CompactButton label="Remove pauses" icon={Scissors} onClick={onRemovePauses} />
        <CompactButton label="Make captions" icon={Captions} onClick={onGenerateCaptions} />
        <CompactButton label="Split topics" icon={ListVideo} onClick={onRemovePauses} />
      </div>
      <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
        {transcript.map((segment) => (
          <button
            key={segment.id}
            type="button"
            onClick={() => onDeleteSegment(segment.id)}
            className={`w-full rounded-lg border p-3 text-left transition ${
              segment.deleted
                ? "border-red-400/40 bg-red-500/10 text-red-100"
                : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--brand)]"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-black text-[var(--brand)]">
                {formatDuration(segment.start)}-{formatDuration(segment.end)}
              </span>
              <span className="text-[11px] font-bold text-[var(--muted)]">{segment.speaker}</span>
            </div>
            <p className="text-sm font-semibold leading-6" dir="rtl">{segment.text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
