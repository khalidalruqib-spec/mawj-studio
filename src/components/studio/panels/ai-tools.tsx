"use client";

import { useState } from "react";
import { Brain, Loader2, Rocket, Search, Sparkles, WandSparkles } from "lucide-react";
import type { EditPlan } from "@/lib/edit-plan";
import { AI_TOOL_CATEGORIES, AI_TOOLS } from "../foundation";
import type { AiToolCategory, AiToolItem } from "../foundation";
import { PanelHeading } from "../ui";

export function AiStudioPanel({
  plan,
  mediaCount,
  hasSource,
  isRunning,
  onRunTool,
}: {
  plan: EditPlan | null;
  mediaCount: number;
  hasSource: boolean;
  isRunning: boolean;
  onRunTool: (tool: AiToolItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AiToolCategory>("all");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTools = AI_TOOLS.filter((tool) => {
    const matchesCategory = category === "all" || tool.category === category;
    const matchesQuery =
      !normalizedQuery ||
      [tool.title, tool.subtitle, tool.badge, tool.category].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );

    return matchesCategory && matchesQuery;
  });
  const recommendedTools = AI_TOOLS.filter((tool) =>
    hasSource
      ? ["auto-captions", "magic-clips", "clean-audio", "remove-silence"].includes(tool.id)
      : ["idea-to-video", "ad-maker", "titles-and-hashtags", "brand-kit"].includes(tool.id),
  );

  return (
    <section className="panel max-h-[calc(100dvh-112px)] overflow-auto p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <PanelHeading icon={Brain} title="AI tools" />
          <p className="mt-1 text-xs font-bold text-[var(--muted)]">
            {hasSource ? `${mediaCount} media assets ready` : "Start with media or a prompt"}
          </p>
        </div>
        <span className="rounded-md border border-[var(--line)] bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--brand)]">
          Agent
        </span>
      </div>

      <div className="rounded-lg border border-[var(--line)] bg-[radial-gradient(circle_at_top_left,rgba(142,247,194,0.18),transparent_38%),var(--panel-soft)] p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand)] text-black">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">Mawj AI Agent</p>
            <p className="truncate text-xs font-bold text-[var(--muted)]">اكتب أمر أو شغل أداة جاهزة</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRunTool(AI_TOOLS[0])}
          disabled={isRunning}
          className="btn-brand w-full"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
          Generate with AI
        </button>
      </div>

      <div className="mt-4">
        <p className="section-heading mb-2">
          <span className="metric-label">Recommended</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {recommendedTools.slice(0, 4).map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onRunTool(tool)}
                className="min-h-24 rounded-lg border border-[var(--line)] bg-[var(--panel-soft)] p-2.5 text-left transition hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] hover:shadow-[var(--shadow-brand)] active:scale-[.97]"
              >
                <span className="ai-tool-card-icon mb-2 flex h-8 w-8">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="block text-xs font-black">{tool.title}</span>
                <span className="mt-1 line-clamp-2 block text-[11px] font-semibold leading-4 text-[var(--muted)]">
                  {tool.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--line)] bg-black/20 p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search AI tools"
            className="control-input pl-9"
          />
        </div>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {AI_TOOL_CATEGORIES.map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11px] font-black transition ${
                  active
                    ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)] hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          const needsMedia = tool.needsMedia && !hasSource && mediaCount === 0;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onRunTool(tool)}
              className="ai-tool-card"
            >
              <span className="ai-tool-card-icon">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-black">{tool.title}</span>
                  <span className={`badge shrink-0 ${needsMedia ? "badge-amber" : "badge-brand"}`}>
                    {needsMedia ? "Needs media" : tool.badge}
                  </span>
                </span>
                <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--muted)]">{tool.subtitle}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[var(--brand)]">
                  Run
                  <Rocket className="h-3 w-3" aria-hidden="true" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {plan ? (
        <div className="mt-4 rounded-lg border border-[var(--line)] bg-black/20 p-3">
          <p className="text-xs font-bold text-[var(--muted)]">Current AI brief</p>
          <p className="mt-2 text-sm font-black leading-6">{plan.hook}</p>
        </div>
      ) : null}
    </section>
  );
}
