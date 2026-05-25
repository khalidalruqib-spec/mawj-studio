import { VIDEO_STYLES, type AspectRatio, type LanguageMode, type Platform, type VideoStyleId } from "@/lib/video-styles";

export type EditPlanRequest = {
  fileName: string;
  durationSeconds: number;
  platform: Platform;
  aspectRatio: AspectRatio;
  languageMode: LanguageMode;
  styleId: VideoStyleId;
  brandName?: string;
  goal: "engagement" | "sales" | "education" | "awareness";
};

export type EditPlan = {
  id: string;
  title: string;
  hook: string;
  summary: string;
  targetDurationSeconds: number;
  styleId: VideoStyleId;
  confidence: number;
  renderSettings: {
    aspectRatio: AspectRatio;
    resolution: string;
    fps: number;
    loudness: string;
    safeMargins: string;
  };
  timeline: Array<{
    id: string;
    label: string;
    start: number;
    end: number;
    action: string;
    intensity: "low" | "medium" | "high";
  }>;
  captions: Array<{
    at: number;
    text: string;
    emphasis: string[];
  }>;
  aiTools: Array<{
    name: string;
    status: "ready" | "queued" | "optional";
    detail: string;
  }>;
  exportVariants: Array<{
    platform: string;
    duration: string;
    caption: string;
  }>;
};

export function createDemoEditPlan(input: EditPlanRequest): EditPlan {
  const style = VIDEO_STYLES.find((item) => item.id === input.styleId) ?? VIDEO_STYLES[0];
  const duration = Math.max(18, Math.min(55, Math.round(input.durationSeconds * 0.42 || 32)));
  const brand = input.brandName?.trim() || "البراند";

  const hooks: Record<VideoStyleId, string> = {
    "viral-saudi": "لا تنزل الفيديو قبل ما تشوف أول 3 ثواني.",
    "premium-brand": `${brand} بشكل أهدأ، أغلى، وأكثر ثقة.`,
    "podcast-cuts": "الجملة اللي تستاهل تتحول لمقطع كامل.",
    "product-drop": `ليش ${brand} صار خيار أسهل؟`,
    educational: "ثلاث نقاط تختصر عليك الموضوع.",
    "restaurant-ad": "المشهد هذا يكفي يفتح الشهية.",
  };

  const timeline = [
    {
      id: "hook",
      label: "Hook",
      start: 0,
      end: 3,
      action: "قص مباشر على أقوى لقطة، تكبير بسيط، وعنوان واضح أعلى الشاشة.",
      intensity: "high" as const,
    },
    {
      id: "clean-cut",
      label: "Clean Cut",
      start: 3,
      end: Math.round(duration * 0.32),
      action: "إزالة الصمت والتردد وتثبيت الصوت على مستوى مناسب للموبايل.",
      intensity: style.pace === "calm" ? ("medium" as const) : ("high" as const),
    },
    {
      id: "proof",
      label: "Proof / Value",
      start: Math.round(duration * 0.32),
      end: Math.round(duration * 0.72),
      action: "إضافة زومات على الوجه أو المنتج مع إبراز الكلمات المهمة في الكابشن.",
      intensity: "medium" as const,
    },
    {
      id: "cta",
      label: "CTA",
      start: Math.round(duration * 0.72),
      end: duration,
      action: "خاتمة قصيرة مع دعوة واضحة للحفظ، الطلب، أو المتابعة حسب هدف الفيديو.",
      intensity: input.goal === "sales" ? ("high" as const) : ("medium" as const),
    },
  ];

  return {
    id: `edit-${Date.now()}`,
    title: `${style.arabicName} · ${brand}`,
    hook: hooks[style.id],
    summary: `الخطة تقص الفيديو الخام إلى نسخة ${duration} ثانية مناسبة لـ ${input.platform}، مع ${style.captionPreset} وموسيقى ${style.musicMood}.`,
    targetDurationSeconds: duration,
    styleId: style.id,
    confidence: 91,
    renderSettings: {
      aspectRatio: input.aspectRatio,
      resolution: input.aspectRatio === "16:9" ? "1920x1080" : input.aspectRatio === "1:1" ? "1080x1080" : "1080x1920",
      fps: 30,
      loudness: "-14 LUFS",
      safeMargins: "12% captions / 8% UI safe zones",
    },
    timeline,
    captions: [
      { at: 0, text: hooks[style.id], emphasis: ["أول", "3 ثواني"] },
      { at: 4, text: "قصينا الصمت وخلينا الفكرة تدخل بسرعة.", emphasis: ["الفكرة", "بسرعة"] },
      { at: 11, text: "هنا نبرز الدليل أو الميزة اللي تقنع المشاهد.", emphasis: ["الدليل", "الميزة"] },
      { at: duration - 5, text: input.goal === "sales" ? "اطلبه الآن قبل ينتهي العرض." : "احفظ المقطع وارجع له وقت تحتاجه.", emphasis: ["الآن", "احفظ"] },
    ],
    aiTools: [
      { name: "Speech cleanup", status: "ready", detail: "تنظيف ضوضاء ورفع وضوح الصوت." },
      { name: "Auto captions", status: "ready", detail: "كابشن عربي/إنجليزي مع إبراز كلمات." },
      { name: "Smart reframing", status: "ready", detail: "تتبع وجه أو منتج داخل 9:16." },
      { name: "B-roll suggestions", status: "queued", detail: "اقتراح لقطات داعمة حسب النص." },
      { name: "Brand kit", status: "optional", detail: "ألوان وخطوط وشعار ثابت للعميل." },
    ],
    exportVariants: [
      { platform: "TikTok", duration: `${duration}s`, caption: "نسخة سريعة مع hook مباشر." },
      { platform: "Instagram Reels", duration: `${Math.min(duration, 45)}s`, caption: "نسخة أنظف مع غلاف وعنوان." },
      { platform: "YouTube Shorts", duration: `${Math.min(duration, 58)}s`, caption: "نسخة بإيقاع أهدأ للشرح." },
    ],
  };
}
