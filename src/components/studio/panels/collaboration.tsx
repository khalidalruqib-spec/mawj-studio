import { History, Link2, MessagesSquare, Share2, Users } from "lucide-react";
import { TEAM_ROLES, VERSION_HISTORY } from "../foundation";
import { PanelHeading } from "../ui";

export function CollaborationPanel() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="panel p-4">
        <PanelHeading icon={MessagesSquare} title="Client comments" />
        <div className="space-y-3">
          {[
            "0:03 Make the hook bigger and more direct.",
            "0:12 Add product price as a lower third.",
            "0:21 Client approved this CTA.",
          ].map((comment) => (
            <div key={comment} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
              <p className="text-sm font-bold leading-6">{comment}</p>
              <p className="mt-2 text-xs font-semibold text-[var(--muted)]">Timeline comment · open</p>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <section className="panel p-4">
          <PanelHeading icon={Share2} title="Preview link" />
          <button type="button" className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Share review link
          </button>
          <p className="text-xs font-semibold leading-5 text-[var(--muted)]">
            Secure client preview with comments, version history, and viewer-only access.
          </p>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={Users} title="Team roles" />
          <div className="space-y-2">
            {TEAM_ROLES.map((member) => (
              <div key={member.role} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-3">
                <p className="text-sm font-black">{member.name} · {member.role}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{member.access}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-4">
          <PanelHeading icon={History} title="Version history" />
          <div className="space-y-2">
            {VERSION_HISTORY.map((version) => (
              <p key={version} className="rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2 text-xs font-black">
                {version}
              </p>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
