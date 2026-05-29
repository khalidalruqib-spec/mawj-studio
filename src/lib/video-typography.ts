export type VideoTextTransform = "none" | "uppercase";

export type VideoTextStylePatch = {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  backgroundPadding?: number;
  textTransform?: VideoTextTransform;
};

export const VIDEO_FONT_STACKS = [
  {
    id: "ibm-plex-arabic",
    label: "IBM Plex Arabic",
    value: 'var(--font-ibm-plex-arabic), "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "cairo",
    label: "Cairo",
    value: 'var(--font-arabic), Cairo, "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "tajawal",
    label: "Tajawal",
    value: 'var(--font-tajawal), Tajawal, "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "noto-sans-arabic",
    label: "Noto Sans Arabic",
    value: 'var(--font-noto-sans-arabic), "Noto Sans Arabic", "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "almarai",
    label: "Almarai",
    value: 'var(--font-almarai), Almarai, "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "changa",
    label: "Changa",
    value: 'var(--font-changa), Changa, Cairo, "IBM Plex Sans Arabic", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "inter",
    label: "Inter / English",
    value: 'Inter, Geist, Arial, sans-serif',
  },
] as const;

export type VideoFontId = (typeof VIDEO_FONT_STACKS)[number]["id"];

export const DEFAULT_VIDEO_FONT_STACK = VIDEO_FONT_STACKS[0].value;

export const VIDEO_TEXT_PRESETS = [
  {
    id: "saudi-viral-bold",
    label: "Saudi Viral Bold",
    description: "Large social headline with stroke and strong shadow.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[0].value,
      fontWeight: "950",
      lineHeight: 1.06,
      letterSpacing: 0,
      textStrokeColor: "rgba(0,0,0,0.72)",
      textStrokeWidth: 8,
      shadowColor: "rgba(0,0,0,0.52)",
      shadowBlur: 18,
      shadowOffsetX: 0,
      shadowOffsetY: 10,
      backgroundColor: "transparent",
      backgroundPadding: 0,
      textTransform: "none",
    },
  },
  {
    id: "offer-pill",
    label: "Offer Pill",
    description: "Rounded promotional badge for offers and CTA text.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[1].value,
      fontWeight: "900",
      lineHeight: 1.08,
      textStrokeColor: "rgba(0,0,0,0.16)",
      textStrokeWidth: 2,
      shadowColor: "rgba(0,0,0,0.32)",
      shadowBlur: 14,
      shadowOffsetX: 0,
      shadowOffsetY: 8,
      backgroundColor: "rgba(0,0,0,0.72)",
      borderRadius: 28,
      backgroundPadding: 30,
    },
  },
  {
    id: "luxury-editorial",
    label: "Luxury Editorial",
    description: "Elegant premium title with soft shadow.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[3].value,
      fontWeight: "700",
      lineHeight: 1.18,
      letterSpacing: 0,
      textStrokeColor: "transparent",
      textStrokeWidth: 0,
      shadowColor: "rgba(0,0,0,0.42)",
      shadowBlur: 24,
      shadowOffsetX: 0,
      shadowOffsetY: 10,
      backgroundColor: "transparent",
      backgroundPadding: 0,
    },
  },
  {
    id: "news-lower-third",
    label: "News Lower Third",
    description: "Crisp glassy information bar for news and explainers.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[2].value,
      fontWeight: "800",
      lineHeight: 1.14,
      textStrokeColor: "rgba(0,0,0,0.25)",
      textStrokeWidth: 2,
      shadowColor: "rgba(0,0,0,0.38)",
      shadowBlur: 14,
      shadowOffsetX: 0,
      shadowOffsetY: 6,
      backgroundColor: "rgba(15,23,42,0.76)",
      borderRadius: 20,
      backgroundPadding: 24,
    },
  },
  {
    id: "caption-karaoke",
    label: "Caption Karaoke",
    description: "Readable subtitle style with heavy outline.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[0].value,
      fontWeight: "950",
      lineHeight: 1.12,
      textStrokeColor: "rgba(0,0,0,0.78)",
      textStrokeWidth: 7,
      shadowColor: "rgba(0,0,0,0.34)",
      shadowBlur: 12,
      shadowOffsetX: 0,
      shadowOffsetY: 6,
      backgroundColor: "transparent",
      backgroundPadding: 0,
    },
  },
  {
    id: "clean-business",
    label: "Clean Business",
    description: "Modern business text card with restrained contrast.",
    patch: {
      fontFamily: VIDEO_FONT_STACKS[4].value,
      fontWeight: "800",
      lineHeight: 1.2,
      textStrokeColor: "transparent",
      textStrokeWidth: 0,
      shadowColor: "rgba(0,0,0,0.22)",
      shadowBlur: 10,
      shadowOffsetX: 0,
      shadowOffsetY: 5,
      backgroundColor: "rgba(255,255,255,0.88)",
      borderRadius: 18,
      backgroundPadding: 24,
    },
  },
] as const;

export type VideoTextPresetId = (typeof VIDEO_TEXT_PRESETS)[number]["id"];

export function getVideoFontStack(fontFamily?: string) {
  if (!fontFamily) return DEFAULT_VIDEO_FONT_STACK;

  const directMatch = VIDEO_FONT_STACKS.find((font) => font.id === fontFamily || font.value === fontFamily);
  if (directMatch) return directMatch.value;

  return fontFamily;
}

export function getVideoTextPreset(presetId?: string) {
  return VIDEO_TEXT_PRESETS.find((preset) => preset.id === presetId);
}

export function resolveVideoTextStyle(
  layer: {
    fontFamily?: string;
    lineHeight?: number;
    letterSpacing?: number;
    textStrokeColor?: string;
    textStrokeWidth?: number;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    backgroundPadding?: number;
    textTransform?: VideoTextTransform;
  },
  fallback?: Partial<VideoTextStylePatch>,
) {
  return {
    fontFamily: getVideoFontStack(layer.fontFamily ?? fallback?.fontFamily),
    lineHeight: layer.lineHeight ?? fallback?.lineHeight ?? 1.16,
    letterSpacing: layer.letterSpacing ?? fallback?.letterSpacing ?? 0,
    textStrokeColor: layer.textStrokeColor ?? fallback?.textStrokeColor ?? "rgba(0,0,0,0.58)",
    textStrokeWidth: layer.textStrokeWidth ?? fallback?.textStrokeWidth ?? 0,
    shadowColor: layer.shadowColor ?? fallback?.shadowColor ?? "rgba(0,0,0,0.38)",
    shadowBlur: layer.shadowBlur ?? fallback?.shadowBlur ?? 0,
    shadowOffsetX: layer.shadowOffsetX ?? fallback?.shadowOffsetX ?? 0,
    shadowOffsetY: layer.shadowOffsetY ?? fallback?.shadowOffsetY ?? 0,
    backgroundPadding: layer.backgroundPadding ?? fallback?.backgroundPadding ?? 0,
    textTransform: layer.textTransform ?? fallback?.textTransform ?? "none",
  };
}
