import { Download, Loader2, MonitorUp } from "lucide-react";
import type { BrowserRenderProgress, BrowserRenderResult } from "@/lib/browser-video-renderer";
import type { AspectRatio } from "@/lib/video-styles";
import { EXPORT_TIERS } from "../foundation";
import { PanelHeading, SmallSetting } from "../ui";
import { formatDuration } from "../utils";

const EXPORT_FORMATS = [
  { id: "MP4", disabled: false },
  { id: "SRT", disabled: false },
  { id: "Thumbnail", disabled: false },
  { id: "GIF", disabled: true },
  { id: "MP3", disabled: true },
] as const;

export function ExportsPanel({
  tier,
  format,
  renderResult,
  renderProgress,
  isRendering,
  aspectRatio,
  onTierChange,
  onFormatChange,
  onRender,
  onDownloadSrt,
  onExportThumbnail,
}: {
  tier: string;
  format: string;
  renderResult: BrowserRenderResult | null;
  renderProgress: BrowserRenderProgress | null;
  isRendering: boolean;
  aspectRatio: AspectRatio;
  onTierChange: (tier: string) => void;
  onFormatChange: (format: string) => void;
  onRender: () => void;
  onDownloadSrt: () => void;
  onExportThumbnail: () => void;
}) {
  const selectedFormat = EXPORT_FORMATS.find((item) => item.id === format);
  const isUnsupported = Boolean(selectedFormat?.disabled);
  const actionLabel =
    format === "SRT"
      ? "Download SRT"
      : format === "Thumbnail"
        ? "Download Thumbnail"
        : isUnsupported
          ? `${format} قريبًا`
          : `Export ${format}`;

  const runExportAction = () => {
    if (format === "SRT") {
      onDownloadSrt();
      return;
    }

    if (format === "Thumbnail") {
      onExportThumbnail();
      return;
    }

    onRender();
  };

  return (
    <section className="panel p-4">
      <PanelHeading icon={MonitorUp} title="Export center" />
      <div className="mb-3 grid grid-cols-3 gap-2">
        {EXPORT_TIERS.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onTierChange(item.name)}
            className={`rounded-lg border p-2 text-center transition ${
              tier === item.name
                ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                : "border-[var(--line)] bg-[var(--panel-soft)]"
            }`}
          >
            <p className="text-xs font-black">{item.name}</p>
            <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">{item.quality}</p>
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-5 gap-2">
        {EXPORT_FORMATS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (!item.disabled) onFormatChange(item.id);
            }}
            disabled={item.disabled}
            className={`min-h-10 rounded-lg border px-2 text-[11px] font-black transition ${
              format === item.id
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : item.disabled
                  ? "cursor-not-allowed border-[var(--line)] bg-black/20 text-[var(--muted)] opacity-55"
                  : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
            }`}
            title={item.disabled ? "قريبًا في Mawj Pro" : undefined}
          >
            {item.id}
            {item.disabled ? <span className="mt-0.5 block text-[9px] font-black opacity-70">Soon</span> : null}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={runExportAction}
        disabled={isRendering || isUnsupported}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black disabled:opacity-60"
      >
        {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isRendering ? `Rendering ${renderProgress?.percent ?? 0}%` : actionLabel}
      </button>
      {isRendering ? (
        <div className="mb-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-black text-[var(--muted)]">
            <span>{renderProgress?.label ?? "Rendering"}</span>
            <span>{renderProgress?.percent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[var(--brand)] transition-[width]" style={{ width: `${renderProgress?.percent ?? 0}%` }} />
          </div>
        </div>
      ) : null}
      {renderResult ? (
        <div className="rounded-lg border border-[var(--brand)] bg-[var(--brand-soft)] p-3">
          <video
            src={renderResult.url}
            controls
            className={`mx-auto mb-3 max-h-[420px] w-full rounded-lg bg-black object-contain ${
              aspectRatio === "9:16" ? "aspect-[9/16] max-w-[236px]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
            }`}
          />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <SmallSetting label="Output" value={renderResult.resolution} />
            <SmallSetting label="Length" value={formatDuration(renderResult.durationSeconds)} />
          </div>
          <a
            href={renderResult.url}
            download={renderResult.fileName}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-black text-black transition hover:bg-[var(--brand)]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download edited file
          </a>
        </div>
      ) : null}
    </section>
  );
}
