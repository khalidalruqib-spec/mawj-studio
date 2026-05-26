import type { ReactNode } from "react";

type BadgeTone = "brand" | "muted" | "violet" | "amber";

const toneClass: Record<BadgeTone, string> = {
  brand: "badge badge-brand",
  muted: "badge badge-muted",
  violet: "badge badge-violet",
  amber: "badge badge-amber",
};

export function Badge({
  tone = "muted",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return <span className={`${toneClass[tone]} ${className}`.trim()}>{children}</span>;
}
