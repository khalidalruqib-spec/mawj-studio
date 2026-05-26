import { BRAND } from "@/lib/brand";
import { PlatformLogo } from "@/components/brand/platform-logo";

type BrandLockupProps = {
  /** sm = header · md = default · lg = hero */
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  showLatin?: boolean;
  showDivider?: boolean;
  /** Override default tagline */
  tagline?: string;
  className?: string;
};

const SIZES = {
  sm: { icon: 36, name: "text-[14px]", latin: "text-[9px]", tagline: "text-[10px]" },
  md: { icon: 40, name: "text-[15px]", latin: "text-[10px]", tagline: "text-[11px]" },
  lg: { icon: 56, name: "text-2xl", latin: "text-xs", tagline: "text-sm" },
} as const;

/** Header / hero brand lockup: circular logo + المنصة + tagline. */
export function BrandLockup({
  size = "md",
  showTagline = true,
  showLatin = false,
  showDivider = false,
  tagline,
  className = "",
}: BrandLockupProps) {
  const s = SIZES[size];
  const taglineText = tagline ?? BRAND.taglineAr;

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <PlatformLogo size={s.icon} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className={`brand-name-gradient truncate font-black leading-none tracking-wide ${s.name}`}>
            {BRAND.nameAr}
          </p>
          {showLatin ? (
            <span
              className={`shrink-0 font-bold uppercase tracking-[0.2em] text-[var(--muted)] ${s.latin}`}
              aria-hidden="true"
            >
              {BRAND.nameEn}
            </span>
          ) : null}
        </div>
        {showTagline ? (
          <p className={`truncate font-light text-[var(--muted)] ${s.tagline}`}>{taglineText}</p>
        ) : null}
        {showDivider ? <div className="brand-divider mt-1.5" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
