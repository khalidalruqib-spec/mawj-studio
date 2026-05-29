import { Cloud, CreditCard, FolderOpen, History, LayoutDashboard, RefreshCw, UploadCloud } from "lucide-react";
import type { StudioProject } from "@/lib/project-store";
import { EXPORT_TIERS } from "../foundation";
import { DashboardCard, EmptyMini, PanelHeading } from "../ui";
import { formatBytes } from "../utils";

export function DashboardPanel({
  projects,
  mediaCount,
  exportCount,
  storageBytes,
  projectStatus,
  onRefresh,
  onUpdate,
  onDelete,
}: {
  projects: StudioProject[];
  mediaCount: number;
  exportCount: number;
  storageBytes: number;
  projectStatus: string;
  onRefresh: () => void;
  onUpdate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard label="Projects" value={`${projects.length}`} icon={FolderOpen} />
        <DashboardCard label="Uploaded media" value={`${mediaCount} assets`} icon={UploadCloud} />
        <DashboardCard label="Export history" value={`${exportCount} renders`} icon={History} />
        <DashboardCard label="Storage usage" value={formatBytes(storageBytes)} icon={Cloud} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="panel p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <PanelHeading icon={LayoutDashboard} title="User projects" />
            <button
              type="button"
              onClick={onRefresh}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-2 text-xs font-black transition hover:border-[var(--brand)]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
          <div className="space-y-2">
            {projects.length ? projects.slice(0, 8).map((project) => (
              <div key={project.id} className="grid gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3 lg:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{project.title}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[var(--muted)]">
                    {project.sourceFileName} · {project.aspectRatio} · {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-black/25 px-2 py-1 text-xs font-black">{project.status}</span>
                  <button
                    type="button"
                    onClick={() => onUpdate(project.id)}
                    className="min-h-9 rounded-md border border-[var(--line)] bg-black/20 px-3 text-[11px] font-black transition hover:border-[var(--brand)]"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(project.id)}
                    className="min-h-9 rounded-md border border-red-400/40 bg-red-500/10 px-3 text-[11px] font-black text-red-100 transition hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )) : (
              <EmptyMini label="No saved cloud projects yet. Upload a video and generate a plan to create one." />
            )}
          </div>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={CreditCard} title="Billing" />
          <div className="space-y-2">
            {EXPORT_TIERS.map((tier) => (
              <div key={tier.name} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-black">{tier.name}</p>
                  <span className="text-xs font-black text-[var(--brand)]">{tier.price}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{tier.quality} · {tier.watermark}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg border border-[var(--line)] bg-black/20 p-3 text-xs font-bold text-[var(--muted)]">
            {projectStatus}
          </p>
        </section>
      </div>
    </section>
  );
}
