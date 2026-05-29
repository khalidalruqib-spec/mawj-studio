import { Download, Loader2, MonitorUp } from "lucide-react";
import type { BrowserRenderProgress, BrowserRenderResult } from "@/lib/browser-video-renderer";
import type { AspectRatio } from "@/lib/video-styles";
import { EXPORT_TIERS, type RenderCapabilities } from "../foundation";
import { PanelHeading, SmallSetting } from "../ui";
import { formatDuration } from "../utils";

export function ExportsPanel({
  tier,
  format,
  renderResult,
  renderProgress,
  renderCapabilities,
  isRendering,
  aspectRatio,
  onTierChange,
  onFormatChange,
  onRender,
  onDownloadSrt,
}: {
  tier: string;
  format: string;
  renderResult: BrowserRenderResult | null;
  renderProgress: BrowserRenderProgress | null;
  renderCapabilities: RenderCapabilities | null;
  isRendering: boolean;
  aspectRatio: AspectRatio;
  onTierChange: (tier: string) => void;
  onFormatChange: (format: string) => void;
  onRender: () => void;
  onDownloadSrt: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={MonitorUp} title="Export center" />
      <div
        className={`mb-3 rounded-lg border p-3 ${
          renderCapabilities?.serverRenderAvailable
            ? "border-[var(--brand)] bg-[var(--brand-soft)]"
            : "border-amber-400/30 bg-amber-400/10"
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-black text-[var(--foreground)]">Render engine</p>
          <span className="rounded-full border border-[var(--line)] bg-black/20 px-2 py-1 text-[10px] font-black uppercase text-[var(--muted)]">
            {renderCapabilities?.mode ?? "checking"}
          </span>
        </div>
        <p className="text-xs font-black text-[var(--foreground)]">
          {renderCapabilities ? formatRenderEngine(renderCapabilities.preferredEngine) : "Checking render pipeline..."}
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-[var(--muted)]">
          {renderCapabilities?.serverRenderAvailable
            ? "Cloud/server rendering is configured for production exports."
            : "Current exports use the browser renderer. This is useful for testing, but Remotion/worker rendering is the production path for high-quality MP4."}
        </p>
        {renderCapabilities?.nextSteps.length ? (
          <ul className="mt-2 space-y-1 text-[11px] font-semibold leading-5 text-amber-200">
            {renderCapabilities.nextSteps.slice(0, 2).map((step) => (
              <li key={step}>- {step}</li>
            ))}
          </ul>
        ) : null}
      </div>
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
        {["MP4", "GIF", "MP3", "SRT", "Thumbnail"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFormatChange(item)}
            className={`min-h-10 rounded-lg border px-2 text-[11px] font-black transition ${
              format === item
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={format === "SRT" ? onDownloadSrt : onRender}
        disabled={isRendering}
        className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black disabled:opacity-60"
      >
        {isRendering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {isRendering ? `Rendering ${renderProgress?.percent ?? 0}%` : `Export ${format}`}
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

function formatRenderEngine(engine: RenderCapabilities["preferredEngine"]) {
  if (engine === "remotion-worker") return "Remotion Worker";
  if (engine === "ffmpeg-worker") return "FFmpeg Worker";
  return "Browser Canvas Renderer";
}
