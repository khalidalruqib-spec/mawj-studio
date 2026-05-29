import type { VideoTemplate, VideoTemplateInput } from "@/lib/video-template-engine";

type GeneratedTemplateIntent = {
  id: string;
  name: string;
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

export function generateLocalVideoTemplate(prompt: string): VideoTemplate {
  const intent = inferTemplateIntent(prompt);
  const safeMargins = getGeneratedTemplateSafeMargins(intent.aspectRatio);

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
      { key: "title", label: "Title", type: "text", default: intent.title, required: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", default: intent.subtitle },
      { key: "benefit", label: "Benefit", type: "textarea", default: intent.benefit },
      { key: "proof", label: "Proof / Detail", type: "textarea", default: intent.proof },
      { key: "cta", label: "Call To Action", type: "text", default: intent.cta },
      intent.mediaInput,
      { key: "logo", label: "Logo", type: "image", default: "/platform-logo.png" },
      { key: "brandColor", label: "Brand Color", type: "color", default: intent.brandColor },
      { key: "accentColor", label: "Accent Color", type: "color", default: intent.accentColor },
    ],
    scenes: [
      {
        id: "scene-hook",
        name: "Opening hook",
        start: 0,
        duration: 4,
        background: { type: "gradient", from: "{{brandColor}}", to: "#050608" },
        layers: [
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
            fontSize: intent.aspectRatio === "16:9" ? 40 : 52,
            fontWeight: "800",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "blurReveal", duration: 0.6 },
          },
        ],
        transition: { type: "fade", duration: 0.35 },
      },
      {
        id: "scene-showcase",
        name: "Showcase",
        start: 4,
        duration: 5,
        background: { type: "color", value: "#f8fafc" },
        layers: [
          {
            id: "main-media",
            type: intent.mediaInput.type === "video" ? "video" : "image",
            src: `{{${intent.mediaInput.key}}}`,
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? safeMargins.top + 10 : safeMargins.top + 90,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 520 : 820,
            fit: "cover",
            borderRadius: 42,
            animationIn: { type: "zoomIn", duration: 0.7 },
          },
          {
            id: "benefit",
            type: "text",
            content: "{{benefit}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 780 : 1160,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 150 : 220,
            fontSize: intent.aspectRatio === "16:9" ? 44 : 58,
            fontWeight: "950",
            color: "{{brandColor}}",
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
        background: { type: "gradient", from: "#111827", to: "{{brandColor}}" },
        layers: [
          {
            id: "proof",
            type: "captions",
            content: "{{proof}}",
            x: safeMargins.left,
            y: intent.aspectRatio === "16:9" ? 360 : 720,
            width: intent.width - safeMargins.left - safeMargins.right,
            height: intent.aspectRatio === "16:9" ? 210 : 360,
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
        background: { type: "gradient", from: "{{accentColor}}", to: "{{brandColor}}" },
        layers: [
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
            fontSize: intent.aspectRatio === "16:9" ? 58 : 78,
            fontWeight: "950",
            color: "#ffffff",
            align: "center",
            direction: "auto",
            animationIn: { type: "pop", duration: 0.55 },
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

function inferTemplateIntent(prompt: string): GeneratedTemplateIntent {
  const normalized = prompt.toLowerCase();
  const isWide = includesAny(normalized, ["16:9", "يوتيوب", "youtube", "عرضي", "landscape"]);
  const aspectRatio: VideoTemplate["aspectRatio"] = isWide ? "16:9" : "9:16";
  const dimensions = aspectRatio === "16:9" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  const palette = inferPalette(normalized);
  const title = extractTitle(prompt) || inferTitle(normalized);

  if (includesAny(normalized, ["بودكاست", "podcast", "مقابلة"])) {
    return {
      id: "podcast-short",
      name: "AI Podcast Clip",
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
