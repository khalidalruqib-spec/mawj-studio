/** Central brand identity — update here to propagate across the app. */
export const BRAND = {
  /** Primary Arabic name */
  nameAr: "المنصة",
  /** Latin transliteration */
  nameEn: "AL-MANASSA",
  /** Default display in UI */
  displayName: "المنصة",
  /** Bilingual lockup */
  fullName: "المنصة",
  /** Short tagline */
  taglineAr: "صناعة الفيديو بالذكاء الاصطناعي",
  taglineEn: "AI-powered video creation",
  /** Long description for metadata */
  description:
    "المنصة — صناعة الفيديو بالذكاء الاصطناعي للمبدعين السعوديين والعرب. حوّل أفكارك إلى محتوى احترافي لـ TikTok وInstagram وYouTube Shorts.",
  /** SEO / OG title */
  metaTitle: "المنصة — صناعة الفيديو بالذكاء الاصطناعي",
  /** Full horizontal lockup (icon + name + slogan) */
  logoLockupSrc: "/platform-logo.png",
  /** Square icon mark — cropped from official lockup */
  logoIconSrc: "/platform-icon.png",
  /** @deprecated use logoIconSrc or logoLockupSrc */
  logoSrc: "/platform-icon.png",
  colors: {
    background: "#070913",
    primary: "#00b4d8",
    primaryDark: "#0096b8",
    primaryLight: "#48cae4",
    accent: "#ff7b00",
    accentDark: "#e56f00",
    ink: "#070913",
    surface: "#0c0f1a",
    muted: "#a0aec0",
  },
  url: "https://mawj-studio.vercel.app",
} as const;
