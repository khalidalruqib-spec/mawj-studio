export type AICommandActionType =
  | "SET_TIKTOK_FORMAT"
  | "CREATE_IMAGE_STORYBOARD"
  | "ADD_ARABIC_CAPTIONS"
  | "REMOVE_SILENCE"
  | "EXTRACT_CLIPS"
  | "IMPROVE_AUDIO"
  | "REMOVE_BACKGROUND"
  | "CREATE_AD_VERSION"
  | "APPLY_PRO_STYLE"
  | "ADD_TEXT_HOOK";

export type AICommandAction = {
  type: AICommandActionType;
  label: string;
  params?: Record<string, string | number | boolean>;
};

export type AICommandContext = {
  platform?: string;
  aspectRatio?: string;
  languageMode?: string;
  goal?: string;
  durationSeconds?: number;
  hasVideo?: boolean;
  hasImages?: boolean;
  mediaCount?: number;
  imageCount?: number;
  audioCount?: number;
  captionCount?: number;
  activePanel?: string;
  selectedLayerName?: string | null;
};

export type AICommandResponse = {
  message: string;
  actions: AICommandAction[];
  engine: string;
  confidence: number;
  targetCut: string;
  mode: "anthropic" | "openai" | "local";
  model?: string;
};

export const AI_COMMAND_ACTION_TYPES: AICommandActionType[] = [
  "SET_TIKTOK_FORMAT",
  "CREATE_IMAGE_STORYBOARD",
  "ADD_ARABIC_CAPTIONS",
  "REMOVE_SILENCE",
  "EXTRACT_CLIPS",
  "IMPROVE_AUDIO",
  "REMOVE_BACKGROUND",
  "CREATE_AD_VERSION",
  "APPLY_PRO_STYLE",
  "ADD_TEXT_HOOK",
];

export function resolveLocalAICommand(
  message: string,
  context: AICommandContext = {},
): AICommandResponse {
  const text = normalizeCommandText(message);
  const actions: AICommandAction[] = [];

  if (matchesAny(text, ["tiktok", "تيك", "ريلز", "reels", "shorts", "شورت"])) {
    actions.push({
      type: "SET_TIKTOK_FORMAT",
      label: "تهيئة المقاس والإيقاع لفيديو قصير",
      params: { platform: text.includes("short") ? "shorts" : "tiktok", aspectRatio: "9:16" },
    });
  }

  if (
    context.hasImages &&
    !context.hasVideo &&
    matchesAny(text, [
      "video",
      "reel",
      "storyboard",
      "create",
      "generate",
      "make",
      "فيديو",
      "مقطع",
      "ريل",
      "سو",
      "سوي",
      "اصنع",
      "انشئ",
      "حوّل",
      "حول",
      "منتج",
      "اعلان",
      "إعلان",
    ])
  ) {
    actions.push({
      type: "CREATE_IMAGE_STORYBOARD",
      label: "تحويل الصور إلى فيديو بمشاهد وطبقات قابلة للتعديل",
      params: { imageCount: context.imageCount ?? context.mediaCount ?? 0 },
    });
  }

  if (
    matchesAny(text, [
      "caption", "captions", "subtitle", "subtitles",
      "كابشن", "كابتشن", "ترجمة", "عربي", "نص", "نصوص",
    ])
  ) {
    actions.push({
      type: "ADD_ARABIC_CAPTIONS",
      label: "إنشاء كابشن عربي قابل للتعديل",
    });
  }

  if (
    matchesAny(text, [
      "silence", "pause", "pauses", "quiet", "dead air",
      "صمت", "سكوت", "فراغ", "توقف", "احذف الصمت", "ازل الصمت",
    ])
  ) {
    actions.push({
      type: "REMOVE_SILENCE",
      label: "كشف وتحديد مناطق الصمت على الـ timeline",
    });
  }

  if (
    matchesAny(text, [
      "best", "highlight", "highlights", "moments", "clips", "extract", "cut",
      "أفضل", "لحظات", "مقاطع", "استخرج", "نسخ", "short", "شورت",
    ])
  ) {
    actions.push({
      type: "EXTRACT_CLIPS",
      label: "تحديد أفضل اللحظات وإنشاء نسخ 15s و30s و60s",
    });
  }

  if (
    matchesAny(text, [
      "audio", "voice", "noise", "enhance", "clean", "echo", "volume",
      "صوت", "ضوضاء", "نقاء", "تنظيف", "صدى", "نظف",
    ])
  ) {
    actions.push({
      type: "IMPROVE_AUDIO",
      label: "تفعيل سلسلة تنظيف الصوت",
    });
  }

  if (
    matchesAny(text, [
      "background", "bg", "remove bg", "studio", "blur",
      "خلفية", "استوديو", "احذف الخلفية", "ازل الخلفية",
    ])
  ) {
    actions.push({
      type: "REMOVE_BACKGROUND",
      label: "تجهيز استبدال الخلفية",
    });
  }

  if (
    matchesAny(text, [
      "ad", "ads", "advertisement", "commercial", "marketing", "cta", "sell",
      "اعلان", "إعلان", "تسويق", "بيع", "عرض", "منتج",
    ])
  ) {
    actions.push({
      type: "CREATE_AD_VERSION",
      label: "إنشاء نسخة إعلانية بـ hook وCTA",
    });
  }

  if (
    matchesAny(text, [
      "professional", "luxury", "premium", "clean", "minimal",
      "احترافي", "فخم", "راقي", "نظيف", "مينيمال",
    ])
  ) {
    actions.push({
      type: "APPLY_PRO_STYLE",
      label: "تطبيق ستايل احترافي فاخر",
    });
  }

  if (!actions.length) {
    if (context.hasImages && !context.hasVideo) {
      actions.push({
        type: "CREATE_IMAGE_STORYBOARD",
        label: "تحويل الصور إلى فيديو بمشاهد وطبقات قابلة للتعديل",
        params: { imageCount: context.imageCount ?? context.mediaCount ?? 0 },
      });
    } else if (context.hasVideo) {
      // Default for video: suggest captions as the most common first action
      actions.push({
        type: "ADD_ARABIC_CAPTIONS",
        label: "إضافة كابشن عربي تلقائي للفيديو",
      });
    } else {
      actions.push({
        type: "ADD_TEXT_HOOK",
        label: "إضافة عنوان hook قابل للتعديل",
      });
    }
  }

  const targetCut = getLocalTargetCut(context);

  return {
    message: buildLocalAssistantMessage(actions, context, targetCut),
    actions,
    engine: context.hasVideo
      ? "Local timeline command engine"
      : context.hasImages
        ? "Local storyboard command engine"
        : "Local command engine",
    confidence: Math.min(94, 70 + actions.length * 6 + (context.hasVideo ? 8 : 0) + (context.captionCount ? 4 : 0)),
    targetCut,
    mode: "local",
  };
}

function normalizeCommandText(message: string) {
  return message
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

function matchesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeCommandText(term)));
}

function getLocalTargetCut(context: AICommandContext) {
  const duration = Math.round(context.durationSeconds ?? 36);
  if (context.goal === "sales") return duration >= 30 ? "30s ad cut" : "15s ad cut";
  if (context.platform === "tiktok" || context.platform === "instagram") return "15s/30s social cuts";
  if (context.platform === "shorts") return "30s Shorts cut";
  return `${Math.max(15, Math.min(duration, 45))}s creator cut`;
}

function buildLocalAssistantMessage(
  actions: AICommandAction[],
  context: AICommandContext,
  targetCut: string,
) {
  const actionText = actions.map((action) => action.label).join("، ");
  const mediaText = context.mediaCount ? ` على ${context.mediaCount} ملف مرفوع` : "";
  return `تم تجهيز الأمر${mediaText}: ${actionText}. الهدف الحالي: ${targetCut}.`;
}
