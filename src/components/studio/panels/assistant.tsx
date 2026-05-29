import { Bot, Download, Loader2, WandSparkles } from "lucide-react";
import { CREATOR_STARTERS } from "../foundation";
import type { AssistantMessage, ClipSuggestion } from "../foundation";
import { PanelHeading } from "../ui";
import { formatDuration } from "../utils";

export function AssistantPanel({
  command,
  messages,
  clipSuggestions,
  isRunning,
  onCommandChange,
  onRunCommand,
  onExportClip,
}: {
  command: string;
  messages: AssistantMessage[];
  clipSuggestions: ClipSuggestion[];
  isRunning: boolean;
  onCommandChange: (command: string) => void;
  onRunCommand: (commandOverride?: string) => void;
  onExportClip: (clip: ClipSuggestion) => void;
}) {
  return (
    <section className="panel p-4">
      <PanelHeading icon={Bot} title="AI assistant" />
      <div className="mb-3 flex gap-2">
        <input
          value={command}
          onChange={(event) => onCommandChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onRunCommand();
          }}
          placeholder="اكتب أمراً للـ AI..."
          dir="auto"
          className="control-input"
        />
        <button
          type="button"
          onClick={() => onRunCommand()}
          disabled={isRunning || !command.trim()}
          className="btn-brand h-11 w-11 shrink-0 px-0"
          aria-label="Run AI command"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <WandSparkles className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {CREATOR_STARTERS.map((quickCommand) => (
          <button
            key={quickCommand.label}
            type="button"
            onClick={() => onRunCommand(quickCommand.command)}
            disabled={isRunning}
            className="badge badge-muted cursor-pointer py-1.5 transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)] disabled:opacity-50"
          >
            {quickCommand.label}
          </button>
        ))}
      </div>
      {clipSuggestions.length ? (
        <div className="mb-3 rounded-xl border border-[var(--line)] bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">Ready clips</p>
            <span className="status-pill active">{clipSuggestions.length} cuts</span>
          </div>
          <div className="space-y-2">
            {clipSuggestions.map((clip) => (
              <div
                key={clip.id}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[var(--text)]">{clip.label}</p>
                  <p className="text-xs font-bold text-[var(--muted)]">
                    {formatDuration(clip.start)}-{formatDuration(clip.end)} · {Math.round(clip.duration)}s
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onExportClip(clip)}
                  disabled={isRunning}
                  className="toolbar-btn h-9 min-w-0 px-3 text-xs"
                  aria-label={`Export ${clip.label}`}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Export
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="max-h-64 space-y-2 overflow-auto pr-1">
        {isRunning ? (
          <div className="msg-assistant fade-in flex items-center gap-2">
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="think-dot" />
            <span className="mr-2 text-xs font-semibold text-[var(--muted)]">يفهم الأمر ويجهز الأكشنات...</span>
          </div>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`fade-in ${message.role === "user" ? "msg-user" : "msg-assistant"}`}
            dir="auto"
          >
            <p>{message.role === "user" ? `أنت: ${message.content}` : message.content}</p>
            {message.actions?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {message.actions.map((action) => (
                  <span
                    key={`${message.id}-${action.type}`}
                    className="action-tag"
                  >
                    ✓ {action.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
