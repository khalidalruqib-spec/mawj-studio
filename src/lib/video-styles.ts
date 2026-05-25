import {
  BadgeDollarSign,
  BookOpen,
  Clapperboard,
  Crown,
  Flame,
  Mic2,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Platform = "tiktok" | "instagram" | "shorts" | "snapchat";
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type LanguageMode = "arabic" | "english" | "mixed";

export type VideoStyleId =
  | "viral-saudi"
  | "premium-brand"
  | "podcast-cuts"
  | "product-drop"
  | "educational"
  | "restaurant-ad";

export type VideoStyle = {
  id: VideoStyleId;
  name: string;
  arabicName: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  pace: "calm" | "balanced" | "fast" | "aggressive";
  captionPreset: string;
  musicMood: string;
  bestFor: string[];
};

export const VIDEO_STYLES: VideoStyle[] = [
  {
    id: "viral-saudi",
    name: "Viral Saudi Reel",
    arabicName: "تيك سريع سعودي",
    description: "قص سريع، هوك قوي، كابشن واضح، وزومات ذكية للتيك توك والريلز.",
    icon: Flame,
    accent: "from-[#ff4f64] to-[#ffb86b]",
    pace: "aggressive",
    captionPreset: "كابشن كبير متحرك مع كلمات مفتاحية ملوّنة",
    musicMood: "ترند سريع منخفض تحت الصوت",
    bestFor: ["سناب", "تيك توك", "محتوى يومي", "آراء"],
  },
  {
    id: "premium-brand",
    name: "Premium Brand Film",
    arabicName: "فاخر وسينمائي",
    description: "لقطات أهدأ، ألوان عميقة، انتقالات نظيفة، وشعور إعلان فاخر.",
    icon: Crown,
    accent: "from-[#d7b56d] to-[#fff0b8]",
    pace: "calm",
    captionPreset: "كابشن صغير أنيق مع تباعد واسع",
    musicMood: "سينمائي هادئ",
    bestFor: ["براندات", "عطور", "عيادات", "فنادق"],
  },
  {
    id: "podcast-cuts",
    name: "Podcast Shorts",
    arabicName: "قص بودكاست",
    description: "يلقط أفضل جملة، يقص السكتات، ويضيف عنوان قوي أعلى الفيديو.",
    icon: Mic2,
    accent: "from-[#6ad8ff] to-[#b3f7ff]",
    pace: "balanced",
    captionPreset: "كابشن عربي متوسط مع عنوان ثابت",
    musicMood: "بدون موسيقى أو خلفية خفيفة",
    bestFor: ["بودكاست", "مقابلات", "حوار", "تعليم"],
  },
  {
    id: "product-drop",
    name: "Product Drop",
    arabicName: "إعلان منتج",
    description: "يعرض المشكلة، المنتج، الميزة، ثم CTA واضح للشراء أو الطلب.",
    icon: ShoppingBag,
    accent: "from-[#8ef7c2] to-[#36d399]",
    pace: "fast",
    captionPreset: "كابشن قصير مع سعر/عرض بارز",
    musicMood: "إيقاع تجاري سريع",
    bestFor: ["متاجر", "منتجات", "عروض", "UGC"],
  },
  {
    id: "educational",
    name: "Expert Explainer",
    arabicName: "شرح خبير",
    description: "تقسيم نقاط، عناوين جانبية، وملخص نهائي مناسب للمحتوى التعليمي.",
    icon: BookOpen,
    accent: "from-[#a78bfa] to-[#7dd3fc]",
    pace: "balanced",
    captionPreset: "كابشن منظم مع أرقام ونقاط",
    musicMood: "خلفية هادئة مركزة",
    bestFor: ["مدربين", "كورسات", "طب", "قانون"],
  },
  {
    id: "restaurant-ad",
    name: "Food Spot Ad",
    arabicName: "مطعم وكافيه",
    description: "لقطات شهية، أسماء الأصناف، موقع الفرع، وهوك يجوع المشاهد.",
    icon: BadgeDollarSign,
    accent: "from-[#ff9f1c] to-[#ffe066]",
    pace: "fast",
    captionPreset: "كابشن لذيذ مع أسماء الأصناف والسعر",
    musicMood: "إيقاع اجتماعي خفيف",
    bestFor: ["مطاعم", "كافيهات", "افتتاحات", "عروض"],
  },
];

export const FORMAT_PRESETS = [
  { id: "9:16", label: "TikTok / Reels / Shorts", width: 1080, height: 1920 },
  { id: "1:1", label: "Instagram Square", width: 1080, height: 1080 },
  { id: "16:9", label: "YouTube / Website", width: 1920, height: 1080 },
] as const;

export const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram Reels",
  shorts: "YouTube Shorts",
  snapchat: "Snapchat",
};

export const EMPTY_STYLE_ICON = Clapperboard;
export const BRAND_ICON = Sparkles;
