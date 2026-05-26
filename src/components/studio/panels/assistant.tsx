import { Bot, Download, Loader2, WandSparkles } from "lucide-react";
import { CREATOR_STARTERS } from "../foundation";
import type { AssistantMessage, ClipSuggestion } from "../foundation";
import { PanelHeading } from "../ui";

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
  const thirtySecondClip =
    clipSuggestions.find((clip) => Math.round(clip.duration) === 30) ??
    clipSuggestions.find((clip) => clip.label.includes("30")) ??
    null;

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
      {thirtySecondClip ? (
        <button
          type="button"
          onClick={() => onExportClip(thirtySecondClip)}
          disabled={isRunning}
          className="btn-brand mb-3 w-full justify-center"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export 30s Clip
        </button>
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
