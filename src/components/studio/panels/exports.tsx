import Image from "next/image";
import { Download, History, Loader2, MonitorUp, RefreshCw, Trash2 } from "lucide-react";
import type { BrowserRenderProgress, BrowserRenderResult } from "@/lib/browser-video-renderer";
import type { AspectRatio } from "@/lib/video-styles";
import { EXPORT_TIERS } from "../foundation";
import { PanelHeading, SmallSetting } from "../ui";
import { formatBytes, formatDuration } from "../utils";

const EXPORT_FORMATS = [
  { id: "MP4", disabled: false },
  { id: "SRT", disabled: false },
  { id: "Thumbnail", disabled: false },
  { id: "MP3", disabled: false },
  { id: "GIF", disabled: false },
] as const;

export type ExportHistoryItem = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
  size: number;
  durationSeconds: number;
  resolution: string;
  projectName: string;
  createdAt: number;
};

export function ExportsPanel({
  tier,
  format,
  renderResult,
  renderProgress,
  exportHistory,
  isRendering,
  aspectRatio,
  onTierChange,
  onFormatChange,
  onRender,
  onDownloadSrt,
  onExportThumbnail,
  onExportMp3,
  onExportGif,
  onRefreshHistory,
  onDeleteHistoryItem,
}: {
  tier: string;
  format: string;
  renderResult: BrowserRenderResult | null;
  renderProgress: BrowserRenderProgress | null;
  exportHistory: ExportHistoryItem[];
  isRendering: boolean;
  aspectRatio: AspectRatio;
  onTierChange: (tier: string) => void;
  onFormatChange: (format: string) => void;
  onRender: () => void;
  onDownloadSrt: () => void;
  onExportThumbnail: () => void;
  onExportMp3: () => void;
  onExportGif: () => void;
  onRefreshHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}) {
  const selectedFormat = EXPORT_FORMATS.find((item) => item.id === format);
  const isUnsupported = Boolean(selectedFormat?.disabled);
  const actionLabel =
    format === "SRT"
      ? "Download SRT"
      : format === "Thumbnail"
        ? "Download Thumbnail"
        : format === "MP3"
          ? "Export MP3"
          : format === "GIF"
            ? "Export GIF"
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

    if (format === "MP3") {
      onExportMp3();
      return;
    }

    if (format === "GIF") {
      onExportGif();
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
          {renderResult.mimeType.startsWith("audio/") ? (
            <audio src={renderResult.url} controls className="mb-3 w-full" />
          ) : renderResult.mimeType.startsWith("image/") ? (
            <Image
              src={renderResult.url}
              alt="Export preview"
              width={aspectRatio === "9:16" ? 360 : 640}
              height={aspectRatio === "9:16" ? 640 : aspectRatio === "1:1" ? 640 : 360}
              unoptimized
              className={`mx-auto mb-3 max-h-[420px] w-full rounded-lg bg-black object-contain ${
                aspectRatio === "9:16" ? "aspect-[9/16] max-w-[236px]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
              }`}
            />
          ) : (
            <video
              src={renderResult.url}
              controls
              className={`mx-auto mb-3 max-h-[420px] w-full rounded-lg bg-black object-contain ${
                aspectRatio === "9:16" ? "aspect-[9/16] max-w-[236px]" : aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
              }`}
            />
          )}
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
      <div className="mt-3 rounded-lg border border-[var(--line)] bg-black/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <PanelHeading icon={History} title="Export history" />
          <button
            type="button"
            onClick={onRefreshHistory}
            className="toolbar-btn h-9 min-w-0 px-3 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        </div>
        {exportHistory.length ? (
          <div className="max-h-64 space-y-2 overflow-auto pr-1">
            {exportHistory.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[var(--text)]">{item.fileName}</p>
                  <p className="mt-1 truncate text-[11px] font-bold text-[var(--muted)]">
                    {item.resolution} · {formatDuration(item.durationSeconds)} · {formatBytes(item.size)}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-bold text-[var(--muted)]">
                    {item.projectName} · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={item.url}
                    download={item.fileName}
                    className="toolbar-btn flex-1 justify-center text-xs"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="toolbar-btn danger h-9 min-w-0 px-3 text-xs"
                    aria-label={`Delete ${item.fileName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-[var(--line)] bg-black/20 p-3 text-xs font-bold text-[var(--muted)]">
            No local exports yet. Render MP4, GIF, or MP3 and Mawj will keep the latest files here.
          </p>
        )}
      </div>
    </section>
  );
}
