import type { VideoTemplate, VideoTemplateInput } from "@/lib/video-template-engine";
import { VIDEO_FONT_STACKS } from "@/lib/video-typography";

export type TemplateGeneratorBrandKit = {
  brandName?: string;
  brandColor?: string;
  accentColor?: string;
  logoName?: string;
};

type GeneratedTemplateIntent = {
  id: string;
  name: string;
  brandName: string;
  logoSrc: string;
  title: string;
  subtitle: string;
  cta: string;
  benefit: string;
  proof: string;
  mediaInput: VideoTemplateInput;
  aspectRatio: VideoTemplate["aspectRatio"];
  width: number;
  height: number;
  duration: number;
  brandColor: string;
  accentColor: string;
};

const GENERATED_HEADLINE_TYPOGRAPHY = {
  fontFamily: VIDEO_FONT_STACKS[0].value,
  lineHeight: 1.06,
  letterSpacing: 0,
  textStrokeColor: "rgba(0,0,0,0.72)",
  textStrokeWidth: 8,
  shadowColor: "rgba(0,0,0,0.46)",
  shadowBlur: 18,
  shadowOffsetY: 9,
  backgroundPadding: 0,
} as const;

const GENERATED_CARD_TYPOGRAPHY = {
  fontFamily: VIDEO_FONT_STACKS[1].value,
  lineHeight: 1.12,
  letterSpacing: 0,
  textStrokeColor: "rgba(0,0,0,0.2)",
  textStrokeWidth: 2,
  shadowColor: "rgba(0,0,0,0.36)",
  shadowBlur: 14,
  shadowOffsetY: 7,
  backgroundPadding: 24,
} as const;

const GENERATED_CAPTION_TYPOGRAPHY = {
  fontFamily: VIDEO_FONT_STACKS[0].value,
  lineHeight: 1.1,
  letterSpacing: 0,
  textStrokeColor: "rgba(0,0,0,0.78)",
  textStrokeWidth: 7,
  shadowColor: "rgba(0,0,0,0.36)",
  shadowBlur: 12,
  shadowOffsetY: 6,
  backgroundPadding: 0,
} as const;

export function generateLocalVideoTemplate(prompt: string, brand?: TemplateGeneratorBrandKit): VideoTemplate {
  const intent = inferTemplateIntent(prompt, brand);
  const safeMargins = getGeneratedTemplateSafeMargins(intent.aspectRatio);
  const mediaLayerType = intent.mediaInput.type === "video" ? "video" : "image";
  const mediaSrc = `{{${intent.mediaInput.key}}}`;

  return {
    id: `custom-ai-${intent.id}-${Date.now()}`,
    name: intent.name,
    category: "Custom Templates",
    aspectRatio: intent.aspectRatio,
    width: intent.width,
    height: intent.height,
    duration: intent.duration,
    description: `Generated from prompt: ${prompt.trim().slice(0, 160)}`,
    language: "mixed",
    requiredInputs: [
      { key: "brandName", label: "Brand Name", type: "text", default: intent.brandName },
      { key: "title", label: "Title", type: "text", default: intent.title, required: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", default: intent.subtitle },
      { key: "benefit", label: "Benefit", type: "textarea", default: intent.benefit },
      { key: "proof", label: "Proof / Detail", type: "textarea", default: intent.proof },
      { key: "cta", label: "Call To Action", type: "text", default: intent.cta },
      intent.mediaInput,
      { key: "logo", label: "Logo", type: "image", default: intent.logoSrc },
      { key: "brandColor", label: "Brand Color", type: "color", default: intent.brandColor },
      { key: "accentColor", label: "Accent Color", type: "color", default: intent.accentColor },
    ],
    scenes: [
      {
        id: "scene-hook",
        name: "Opening hook",
        start: 0,
        duration: 4,
        background: { type: "color", value: "#050608" },
        layers: [
          {
            id: "hook-media",
            type: mediaLayerType,
            src: mediaSrc,
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            fit: "cover",
            opacity: 0.96,
            animationIn: { type: "zoomIn", duration: 0.9 },
          },
          {
            id: "hook-readability-overlay",
            type: "shape",
            shape: "rect",
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            color: "rgba(0,0,0,0.58)",
            backgroundColor: "rgba(0,0,0,0.58)",
            opacity: 1,
          },
          {
            id: "hook-card",
            type: "shape",
            shape: "rect",
            x: safeMargins.left,
            y: safeMargins.top,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 126 : 170,
            color: "{{accentColor}}",
            backgroundColor: "{{accentColor}}",
            borderRadius: 34,
            opacity: 0.95,
            animationIn: { type: "pop", duration: 0.45 },
          },
          {
            id: "hook-title",
            type: "text",
            content: "{{title}}",
            x: safeMargins.left + 36,
            y: safeMargins.top + 26,
            width: intent.width - safeMargins.left - safeMargins.right - 72,
            height: intent.aspectRatio === "16:9" ? 74 : 98,
            ...GENERATED_HEADLINE_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 58 : 74,
            fontWeight: "950",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "slideUp", duration: 0.55 },
          },
          {
            id: "hook-subtitle",
            type: "text",
            content: "{{subtitle}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? safeMargins.top + 164 : safeMargins.top + 228,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 120 : 190,
            ...GENERATED_CAPTION_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 40 : 52,
            fontWeight: "800",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "blurReveal", duration: 0.6 },
          },
          {
            id: "hook-brand",
            type: "text",
            content: "{{brandName}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? intent.height - safeMargins.bottom - 72 : safeMargins.top + 450,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: 72,
            ...GENERATED_CARD_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 30 : 38,
            fontWeight: "850",
            color: "{{accentColor}}",
            align: "center",
            direction: "auto",
            animationIn: { type: "fadeIn", duration: 0.45 },
          },
        ],
        transition: { type: "fade", duration: 0.35 },
      },
      {
        id: "scene-showcase",
        name: "Showcase",
        start: 4,
        duration: 5,
        background: { type: "color", value: "#050608" },
        layers: [
          {
            id: "main-media",
            type: mediaLayerType,
            src: mediaSrc,
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            fit: "cover",
            animationIn: { type: "zoomIn", duration: 0.7 },
          },
          {
            id: "showcase-readability-overlay",
            type: "shape",
            shape: "rect",
            x: 0,
            y: Math.round(intent.height * 0.48),
            width: intent.width,
            height: Math.round(intent.height * 0.52),
            color: "rgba(0,0,0,0.68)",
            backgroundColor: "rgba(0,0,0,0.68)",
            opacity: 1,
          },
          {
            id: "benefit",
            type: "text",
            content: "{{benefit}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 740 : 1120,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 150 : 220,
            ...GENERATED_CARD_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 44 : 58,
            fontWeight: "950",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.35)",
            borderRadius: 28,
            align: "center",
            direction: "auto",
            animationIn: { type: "slideUp", duration: 0.5 },
          },
        ],
        transition: { type: "slide", duration: 0.35, direction: "up" },
      },
      {
        id: "scene-proof",
        name: "Proof point",
        start: 9,
        duration: 3,
        background: { type: "color", value: "#050608" },
        layers: [
          {
            id: "proof-media",
            type: mediaLayerType,
            src: mediaSrc,
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            fit: "cover",
            opacity: 0.92,
            animationIn: { type: "zoomIn", duration: 0.75 },
          },
          {
            id: "proof-readability-overlay",
            type: "shape",
            shape: "rect",
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            color: "rgba(0,0,0,0.62)",
            backgroundColor: "rgba(0,0,0,0.62)",
            opacity: 1,
          },
          {
            id: "proof",
            type: "captions",
            content: "{{proof}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 360 : 720,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 210 : 360,
            ...GENERATED_CAPTION_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 54 : 68,
            fontWeight: "950",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.56)",
            borderRadius: 32,
            align: "center",
            direction: "auto",
            animationIn: { type: "bounce", duration: 0.65 },
          },
        ],
        transition: { type: "zoom", duration: 0.35 },
      },
      {
        id: "scene-cta",
        name: "CTA",
        start: 12,
        duration: 3,
        background: { type: "color", value: "#050608" },
        layers: [
          {
            id: "cta-media",
            type: mediaLayerType,
            src: mediaSrc,
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            fit: "cover",
            opacity: 0.88,
            animationIn: { type: "zoomIn", duration: 0.7 },
          },
          {
            id: "cta-readability-overlay",
            type: "shape",
            shape: "rect",
            x: 0,
            y: 0,
            width: intent.width,
            height: intent.height,
            color: "rgba(0,0,0,0.68)",
            backgroundColor: "rgba(0,0,0,0.68)",
            opacity: 1,
          },
          {
            id: "logo",
            type: "image",
            src: "{{logo}}",
            x: Math.round((intent.width - 240) / 2),
            y: intent.aspectRatio === "16:9" ? 180 : 380,
            width: 240,
            height: 160,
            fit: "contain",
            animationIn: { type: "fadeIn", duration: 0.45 },
          },
          {
            id: "cta",
            type: "text",
            content: "{{cta}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 430 : 760,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 150 : 240,
            ...GENERATED_HEADLINE_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 58 : 78,
            fontWeight: "950",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "pop", duration: 0.55 },
          },
          {
            id: "cta-brand",
            type: "text",
            content: "{{brandName}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 620 : 1040,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: 86,
            ...GENERATED_CARD_TYPOGRAPHY,
            fontSize: intent.aspectRatio === "16:9" ? 34 : 46,
            fontWeight: "850",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "slideUp", duration: 0.5 },
          },
        ],
      },
    ],
    animations: ["fadeIn", "slideUp", "zoomIn", "pop", "bounce", "blurReveal"],
    transitions: ["cut", "fade", "slide", "zoom"],
    audio: { music: null, volume: 1 },
    export: { format: "mp4", fps: 30, quality: "1080p" },
    safeMargins,
    thumbnailUrl: "",
    previewUrl: "",
  };
}

function inferTemplateIntent(prompt: string, brand?: TemplateGeneratorBrandKit): GeneratedTemplateIntent {
  const normalized = prompt.toLowerCase();
  const isWide = includesAny(normalized, ["16:9", "يوتيوب", "youtube", "عرضي", "landscape"]);
  const aspectRatio: VideoTemplate["aspectRatio"] = isWide ? "16:9" : "9:16";
  const dimensions = aspectRatio === "16:9" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  const inferredPalette = inferPalette(normalized);
  const palette = {
    brandColor: normalizeGeneratorColor(brand?.brandColor, inferredPalette.brandColor),
    accentColor: normalizeGeneratorColor(brand?.accentColor, inferredPalette.accentColor),
  };
  const brandName = normalizeBrandName(brand?.brandName);
  const logoSrc = normalizeLogoSrc(brand?.logoName);
  const title = extractTitle(prompt) || inferTitle(normalized);

  if (includesAny(normalized, ["بودكاست", "podcast", "مقابلة"])) {
    return {
      id: "podcast-short",
      name: "AI Podcast Clip",
      brandName,
      logoSrc,
      title,
      subtitle: "أفضل لقطة من الحلقة في قالب رأسي واضح.",
      benefit: "اقتباس قوي + كابشن متحرك + هوية البرنامج.",
      proof: "النقطة الأهم تظهر في منتصف الفيديو.",
      cta: "تابع الحلقة كاملة",
      mediaInput: { key: "mainVideo", label: "Podcast Video", type: "video", required: true },
      aspectRatio,
      ...dimensions,
      duration: 15,
      ...palette,
    };
  }

  if (includesAny(normalized, ["عقار", "real estate", "فيلا", "شقة", "مكتب"])) {
    return {
      id: "real-estate-ad",
      name: "AI Real Estate Ad",
      brandName,
      logoSrc,
      title,
      subtitle: "جولة عقارية قصيرة تبرز الموقع والسعر والمساحة.",
      benefit: "واجهة العقار + أهم ميزة + دعوة تواصل.",
      proof: "موقع مميز ومساحة مناسبة للعرض.",
      cta: "احجز معاينة الآن",
      mediaInput: { key: "mainImage", label: "Property Image", type: "image", required: true },
      aspectRatio,
      ...dimensions,
      duration: 15,
      ...palette,
    };
  }

  if (includesAny(normalized, ["مطعم", "restaurant", "منيو", "وجبة", "اكل", "أكل", "عرض"])) {
    return {
      id: "restaurant-offer",
      name: "AI Restaurant Offer",
      brandName,
      logoSrc,
      title,
      subtitle: "عرض سريع يشهي العميل من أول لقطة.",
      benefit: "صورة الأكل + السعر + الفرع أو طريقة الطلب.",
      proof: "كمية محدودة اليوم فقط.",
      cta: "اطلب الآن",
      mediaInput: { key: "foodImage", label: "Food Image", type: "image", required: true },
      aspectRatio,
      ...dimensions,
      duration: 15,
      ...palette,
    };
  }

  if (includesAny(normalized, ["دورة", "course", "تدريب", "تعليمي", "محاضرة"])) {
    return {
      id: "course-announcement",
      name: "AI Course Announcement",
      brandName,
      logoSrc,
      title,
      subtitle: "إعلان دورة واضح مع نقاط تعلم وموعد التسجيل.",
      benefit: "ماذا سيتعلم المتابع خلال الدورة؟",
      proof: "مقاعد محدودة وشهادة حضور.",
      cta: "سجل الآن",
      mediaInput: { key: "mainImage", label: "Course Image", type: "image", required: true },
      aspectRatio,
      ...dimensions,
      duration: 15,
      ...palette,
    };
  }

  if (includesAny(normalized, ["خبر", "news", "عاجل", "breaking"])) {
    return {
      id: "news-alert",
      name: "AI News Alert",
      brandName,
      logoSrc,
      title,
      subtitle: "قالب خبر سريع بعناوين واضحة وشريط عاجل.",
      benefit: "العنوان + التفاصيل + المصدر في ترتيب سريع.",
      proof: "مصدر موثوق وتحديث مختصر.",
      cta: "تابع التفاصيل",
      mediaInput: { key: "imageOrVideo", label: "News Media", type: "image", required: true },
      aspectRatio,
      ...dimensions,
      duration: 15,
      ...palette,
    };
  }

  return {
    id: "product-ad",
    name: "AI Product Ad",
    brandName,
    logoSrc,
    title,
    subtitle: "إعلان قصير يوضح المشكلة ثم يعرض المنتج والحل.",
    benefit: "ميزة واضحة تجعل المنتج أسهل في القرار.",
    proof: "عرض خاص لفترة محدودة.",
    cta: "اطلب الآن",
    mediaInput: { key: "mainImage", label: "Product Image", type: "image", required: true },
    aspectRatio,
    ...dimensions,
    duration: 15,
    ...palette,
  };
}

function inferPalette(prompt: string) {
  if (includesAny(prompt, ["فاخر", "luxury", "ذهب", "gold", "اسود", "أسود"])) {
    return { brandColor: "#111827", accentColor: "#d4af37" };
  }

  if (includesAny(prompt, ["مطعم", "اكل", "أكل", "restaurant", "food"])) {
    return { brandColor: "#7f1d1d", accentColor: "#f97316" };
  }

  if (includesAny(prompt, ["خبر", "news", "عاجل"])) {
    return { brandColor: "#991b1b", accentColor: "#facc15" };
  }

  if (includesAny(prompt, ["عيادة", "clinic", "طبي", "صحي"])) {
    return { brandColor: "#0f766e", accentColor: "#67e8f9" };
  }

  if (includesAny(prompt, ["عقار", "real estate", "فيلا", "شقة"])) {
    return { brandColor: "#1f2937", accentColor: "#d4af37" };
  }

  return { brandColor: "#111827", accentColor: "#8ef7c2" };
}

function normalizeGeneratorColor(value: string | undefined, fallback: string) {
  if (!value || value.includes("{{") || !/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value;
}

function normalizeBrandName(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || "Mawj Studio";
}

function normalizeLogoSrc(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return "/platform-logo.png";

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  return "/platform-logo.png";
}

function inferTitle(prompt: string) {
  if (includesAny(prompt, ["بودكاست", "podcast"])) return "لحظة تستحق الانتشار";
  if (includesAny(prompt, ["مطعم", "restaurant", "food", "اكل", "أكل"])) return "عرض اليوم";
  if (includesAny(prompt, ["عقار", "real estate"])) return "فرصة عقارية";
  if (includesAny(prompt, ["دورة", "course"])) return "دورة جديدة";
  if (includesAny(prompt, ["خبر", "news", "عاجل"])) return "خبر عاجل";
  return "إعلان احترافي";
}

function extractTitle(prompt: string) {
  const quoted = prompt.match(/["“”']([^"“”']{4,42})["“”']/);
  return quoted?.[1]?.trim() ?? "";
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function getGeneratedTemplateSafeMargins(aspectRatio: VideoTemplate["aspectRatio"]) {
  if (aspectRatio === "9:16" || aspectRatio === "4:5") {
    return { top: 160, bottom: 260, left: 70, right: 70 };
  }

  return { top: 72, bottom: 72, left: 96, right: 96 };
}
