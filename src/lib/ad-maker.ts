import type { AspectRatio, LanguageMode, Platform } from "@/lib/video-styles";

export type AdTone =
  | "luxury"
  | "funny"
  | "formal"
  | "youthful"
  | "educational"
  | "commercial";

export type AdCampaignRequest = {
  productName: string;
  tone: AdTone;
  brandName: string;
  platform: Platform;
  aspectRatio: AspectRatio;
  goal: "engagement" | "sales" | "education" | "awareness";
  languageMode: LanguageMode;
  durationSeconds: number;
  assetNames: string[];
  transcriptPreview?: string;
};

export type AdScene = {
  id: string;
  start: number;
  end: number;
  visual: string;
  voiceover: string;
  caption: string;
  overlay: string;
  shotType: string;
};

export type AdVariant = {
  id: "15s" | "30s" | "60s";
  durationSeconds: number;
  hook: string;
  script: string;
  cta: string;
  scenes: AdScene[];
};

export type AdCampaign = {
  title: string;
  strategy: string;
  targetAudience: string;
  primaryHook: string;
  cta: string;
  hashtags: string[];
  platformNotes: string[];
  brandDirections: string[];
  variants: AdVariant[];
};

export const AD_TONES: Array<{ id: AdTone; label: string }> = [
  { id: "luxury", label: "Luxury" },
  { id: "funny", label: "Funny" },
  { id: "formal", label: "Formal" },
  { id: "youthful", label: "Youthful" },
  { id: "educational", label: "Educational" },
  { id: "commercial", label: "Commercial" },
];
