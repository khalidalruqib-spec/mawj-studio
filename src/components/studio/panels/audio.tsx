import { BadgeCheck, FileAudio2, Music2, Volume2 } from "lucide-react";
import { AUDIO_TOOLS, MUSIC_LIBRARY, SOUND_EFFECTS } from "../foundation";
import { LibraryList, PanelHeading } from "../ui";

export function AudioPanel({
  activeTools,
  onToggle,
  onApply,
}: {
  activeTools: Record<string, boolean>;
  onToggle: (tool: string) => void;
  onApply: () => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Volume2} title="Audio enhancement" />
      <div className="space-y-2">
        {AUDIO_TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => onToggle(tool)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-black transition ${
              activeTools[tool]
                ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:border-[var(--line-strong)]"
            }`}
          >
            {tool}
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <LibraryList title="Music library" items={MUSIC_LIBRARY} icon={Music2} />
      <LibraryList title="Sound effects" items={SOUND_EFFECTS} icon={FileAudio2} />
      <button type="button" onClick={onApply} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-black text-black">
        <Volume2 className="h-4 w-4" aria-hidden="true" />
        Apply audio chain
      </button>
    </section>
  );
}
