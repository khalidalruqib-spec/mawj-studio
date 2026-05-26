import { BRAND } from "@/lib/brand";

type PlatformLogoProps = {
  className?: string;
  /** Pixel size for mark variant (square). */
  size?: number;
  /** mark = icon only · lockup = full official image with name + slogan */
  variant?: "mark" | "lockup";
  /** Height for lockup variant (px). */
  lockupHeight?: number;
};

/** Official المنصة logo — mark or full lockup from bundled assets. */
export function PlatformLogo({
  className = "",
  size = 40,
  variant = "mark",
  lockupHeight = 44,
}: PlatformLogoProps) {
  if (variant === "lockup") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BRAND.logoLockupSrc}
        alt={`${BRAND.nameAr} — ${BRAND.taglineAr}`}
        height={lockupHeight}
        className={`w-auto shrink-0 object-contain object-right ${className}`}
        style={{ height: lockupHeight, maxWidth: "min(100%, 280px)" }}
      />
    );
  }

  const glow = Math.max(10, Math.round(size * 0.28));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND.logoIconSrc}
      alt={`${BRAND.nameAr} — الشعار`}
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
