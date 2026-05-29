import type { BrandKitState } from "@/components/studio/foundation";

export const BRAND_KIT_STORAGE_KEY = "mawj-brand-kit-v1";

export const DEFAULT_BRAND_KIT: BrandKitState = {
  logoName: "mawj-logo.svg",
  primaryColor: "#8ef7c2",
  secondaryColor: "#a78bfa",
  font: "IBM Plex Sans Arabic",
  captionStyle: "Saudi Viral Bold",
  intro: "2s animated logo",
  outro: "Follow / CTA screen",
};

export type StoredBrandIdentity = {
  brandName?: string;
  brandKit?: BrandKitState;
};

export type TemplateGeneratorBrandPayload = {
  brandName?: string;
  brandColor?: string;
  accentColor?: string;
  logoName?: string;
};

export function getStoredBrandIdentity(): StoredBrandIdentity | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BRAND_KIT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredBrandIdentity;

    return {
      brandName: typeof parsed.brandName === "string" ? parsed.brandName : undefined,
      brandKit: parsed.brandKit ? normalizeBrandKit(parsed.brandKit) : undefined,
    };
  } catch {
    return null;
  }
}

export function persistStoredBrandIdentity(identity: StoredBrandIdentity) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(BRAND_KIT_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Local persistence should not block editing.
  }
}

export function normalizeBrandKit(brandKit: Partial<BrandKitState> = {}): BrandKitState {
  return {
    ...DEFAULT_BRAND_KIT,
    ...brandKit,
    primaryColor: normalizeBrandColor(brandKit.primaryColor, DEFAULT_BRAND_KIT.primaryColor),
    secondaryColor: normalizeBrandColor(brandKit.secondaryColor, DEFAULT_BRAND_KIT.secondaryColor),
    font: brandKit.font?.trim() || DEFAULT_BRAND_KIT.font,
    captionStyle: brandKit.captionStyle?.trim() || DEFAULT_BRAND_KIT.captionStyle,
    intro: brandKit.intro?.trim() || DEFAULT_BRAND_KIT.intro,
    outro: brandKit.outro?.trim() || DEFAULT_BRAND_KIT.outro,
  };
}

export function normalizeBrandColor(value: string | undefined, fallback: string) {
  if (!value || value.includes("{{") || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value;
}

export function getTemplateGeneratorBrandPayload(): TemplateGeneratorBrandPayload | undefined {
  const identity = getStoredBrandIdentity();
  const brandKit = identity?.brandKit ? normalizeBrandKit(identity.brandKit) : undefined;

  if (!identity?.brandName && !brandKit) return undefined;

  return {
    brandName: identity?.brandName,
    brandColor: brandKit?.primaryColor,
    accentColor: brandKit?.secondaryColor,
    logoName: brandKit?.logoName,
  };
}
