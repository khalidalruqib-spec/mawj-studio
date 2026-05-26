import { BRAND } from "@/lib/brand";

type PlatformLogoProps = {
  className?: string;
  /** Pixel size (width & height). */
  size?: number;
};

/** Circular official mark — neon blue glow, matches brand HTML mockup. */
export function PlatformLogo({ className = "", size = 40 }: PlatformLogoProps) {
  const glow = Math.max(10, Math.round(size * 0.28));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND.logoSrc}
      alt={`${BRAND.nameAr} — الشعار الرسمي`}
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 ${glow}px rgba(0, 180, 216, 0.35)`,
      }}
    />
  );
}

/** @deprecated Use PlatformLogo — kept for existing imports. */
export const MawjLogo = PlatformLogo;
