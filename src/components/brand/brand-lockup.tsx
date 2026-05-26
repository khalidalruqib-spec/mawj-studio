import { BRAND } from "@/lib/brand";
import { MawjLogo } from "@/components/brand/mawj-logo";

type BrandLockupProps = {
  /** sm = header · md = default · lg = hero */
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showLatin?: boolean;
  /** Override default tagline */
  tagline?: string;
  className?: string;
};

const SIZES = {
  sm: { icon: "h-9 w-9", name: "text-[14px]", latin: "text-[9px]", tagline: "text-[10px]" },
  md: { icon: "h-10 w-10", name: "text-[15px]", latin: "text-[10px]", tagline: "text-[11px]" },
  lg: { icon: "h-14 w-14", name: "text-2xl", latin: "text-xs", tagline: "text-sm" },
} as const;

/** Header / hero brand lockup: icon + مَوج + optional MAWJ + tagline. */
export function BrandLockup({
  size = "md",
  showTagline = true,
  showLatin = true,
  tagline,
  className = "",
}: BrandLockupProps) {
  const s = SIZES[size];
  const taglineText = tagline ?? BRAND.taglineAr;

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <MawjLogo className={`${s.icon} shrink-0`} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className={`truncate font-black leading-none tracking-tight ${s.name}`}>{BRAND.nameAr}</p>
          {showLatin ? (
            <span
              className={`shrink-0 font-bold uppercase tracking-[0.22em] text-[var(--muted)] ${s.latin}`}
              aria-hidden="true"
            >
              {BRAND.nameEn}
            </span>
          ) : null}
        </div>
        {showTagline ? (
          <p className={`truncate font-semibold text-[var(--muted)] ${s.tagline}`}>{taglineText}</p>
        ) : null}
      </div>
    </div>
  );
}
