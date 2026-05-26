import type { ReactNode } from "react";
import { AlertTriangle, FileAudio2, Film, ImageIcon, type LucideIcon } from "lucide-react";
import type { MediaAsset } from "./foundation";

export function DemoModeBanner() {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-black leading-5 text-amber-300">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>هذا النص تجريبي وهمي — ارفع فيديو وأضف OpenAI API Key لتفعيل الترجمة الحقيقية</span>
    </div>
  );
}

export function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`status-pill ${active ? "active" : "inactive"}`}>
      {active && <span className="pulse-dot mr-1.5 inline-block" />}
      {label}
    </span>
  );
}

export function PanelHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="section-heading mb-4">
      <Icon className="section-heading-icon h-4 w-4" aria-hidden="true" />
      <h2>{title}</h2>
    </div>
  );
}

export function ToolbarButton({
  label,
  icon: Icon,
  onClick,
  disabled = false,
  tone = "default",
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`toolbar-btn${tone === "danger" ? " danger" : ""}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

export function CompactButton({ label, icon: Icon, onClick }: { label: string; icon: LucideIcon; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="toolbar-btn justify-center px-2 text-[11px]">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-2 block text-xs font-black text-[var(--muted)]">{label}</span>
      {children}
    </label>
  );
}

export function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--muted)]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-black">{label}</p>
      </div>
      <p className="text-sm font-black leading-6">{value}</p>
    </div>
  );
}

export function SmallSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-black/20 p-3">
      <p className="text-xs font-bold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

export function LibraryList({ title, items, icon: Icon }: { title: string; items: string[]; icon: LucideIcon }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
        <p className="text-xs font-black text-[var(--muted)]">{title}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <p key={item} className="rounded-lg border border-[var(--line)] bg-black/20 p-2 text-xs font-black">{item}</p>
        ))}
      </div>
    </div>
  );
}

export function EmptyMini({ label }: { label: string }) {
  return (
    <div className="empty-state min-h-28 rounded-lg border border-dashed border-[var(--line-strong)]">
      <p className="empty-state-sub">{label}</p>
    </div>
  );
}

export function DashboardCard({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-black text-[var(--muted)]">{label}</p>
        <Icon className="h-4 w-4 text-[var(--brand)]" aria-hidden="true" />
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

export function AssetIcon({ kind }: { kind: MediaAsset["kind"] }) {
  const Icon = kind === "audio" ? FileAudio2 : kind === "image" ? ImageIcon : Film;
  return <Icon className="h-4 w-4 shrink-0 text-[var(--brand)]" aria-hidden="true" />;
}
