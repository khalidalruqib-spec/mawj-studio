type TemplateLike = {
  id: string;
  name: string;
  category: string;
};

type TemplateLayerLike = {
  fontFamily?: string;
  direction?: "auto" | "rtl" | "ltr";
};

export const TEMPLATE_FONT_PRESET_INPUT_KEY = "__fontPreset";

export type TemplateFontPresetId =
  | "arabic-modern"
  | "arabic-display"
  | "arabic-kufi"
  | "arabic-soft"
  | "editorial-serif"
  | "latin-clean";

export type TemplateFontPreset = {
  id: TemplateFontPresetId;
  label: string;
  description: string;
  cssStack: string;
  canvasStack: string;
};

export const TEMPLATE_FONT_PRESETS: TemplateFontPreset[] = [
  {
    id: "arabic-modern",
    label: "IBM عربي",
    description: "واضح وحديث للكابشن والإعلانات",
    cssStack: 'var(--font-ibm-arabic), var(--font-arabic), "IBM Plex Sans Arabic", "Cairo", system-ui, sans-serif',
    canvasStack: '"IBM Plex Sans Arabic", "Cairo", "Noto Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "arabic-display",
    label: "Tajawal قوي",
    description: "عناوين سريعة بأسلوب اجتماعي",
    cssStack: 'var(--font-tajawal), var(--font-arabic), "Tajawal", "Cairo", system-ui, sans-serif',
    canvasStack: '"Tajawal", "Cairo", "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "arabic-kufi",
    label: "Noto Kufi",
    description: "رسمي ومناسب للأخبار والأعمال",
    cssStack: 'var(--font-kufi), var(--font-ibm-arabic), "Noto Kufi Arabic", "IBM Plex Sans Arabic", sans-serif',
    canvasStack: '"Noto Kufi Arabic", "IBM Plex Sans Arabic", "Cairo", Tahoma, Arial, sans-serif',
  },
  {
    id: "arabic-soft",
    label: "Almarai",
    description: "ناعم للمطاعم والهوية الودية",
    cssStack: 'var(--font-almarai), var(--font-arabic), "Almarai", "Cairo", system-ui, sans-serif',
    canvasStack: '"Almarai", "Cairo", "IBM Plex Sans Arabic", Tahoma, Arial, sans-serif',
  },
  {
    id: "editorial-serif",
    label: "Naskh تحريري",
    description: "فاخر للاقتباسات والبراند الشخصي",
    cssStack: 'var(--font-naskh), var(--font-arabic), "Noto Naskh Arabic", "Cairo", serif',
    canvasStack: '"Noto Naskh Arabic", "Cairo", "IBM Plex Sans Arabic", Georgia, serif',
  },
  {
    id: "latin-clean",
    label: "Inter / Geist",
    description: "للإنجليزية والنصوص المختلطة",
    cssStack: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
    canvasStack: 'Inter, system-ui, Arial, sans-serif',
  },
];

const PRESET_BY_ID = new Map(TEMPLATE_FONT_PRESETS.map((preset) => [preset.id, preset]));

export function inferTemplateFontPreset(template: TemplateLike): TemplateFontPresetId {
  const signal = `${template.id} ${template.name} ${template.category}`.toLowerCase();

  if (signal.includes("news") || signal.includes("legal") || signal.includes("business")) return "arabic-kufi";
  if (signal.includes("quote") || signal.includes("luxury") || signal.includes("fashion")) return "editorial-serif";
  if (signal.includes("restaurant") || signal.includes("food") || signal.includes("clinic")) return "arabic-soft";
  if (signal.includes("tiktok") || signal.includes("reels") || signal.includes("flash") || signal.includes("caption")) return "arabic-display";
  if (signal.includes("youtube") || signal.includes("english")) return "latin-clean";

  return "arabic-modern";
}

export function resolveTemplateFontPreset(id?: string, template?: TemplateLike) {
  const presetId = (id && PRESET_BY_ID.has(id as TemplateFontPresetId))
    ? id as TemplateFontPresetId
    : template
      ? inferTemplateFontPreset(template)
      : "arabic-modern";

  return PRESET_BY_ID.get(presetId) ?? TEMPLATE_FONT_PRESETS[0];
}

export function resolveLayerFontFamily({
  layer,
  template,
  presetId,
  canvas = false,
}: {
  layer?: TemplateLayerLike;
  template?: TemplateLike;
  presetId?: string;
  canvas?: boolean;
}) {
  if (layer?.fontFamily) {
    const explicitPreset = findFontPresetForStack(layer.fontFamily);
    if (explicitPreset) {
      return canvas ? explicitPreset.canvasStack : explicitPreset.cssStack;
    }

    if (!(canvas && layer.fontFamily.includes("var("))) {
      return layer.fontFamily;
    }
  }

  if (layer?.direction === "ltr" && !presetId) {
    return canvas ? TEMPLATE_FONT_PRESETS[5].canvasStack : TEMPLATE_FONT_PRESETS[5].cssStack;
  }

  const preset = resolveTemplateFontPreset(presetId, template);
  return canvas ? preset.canvasStack : preset.cssStack;
}

function findFontPresetForStack(fontFamily: string) {
  return TEMPLATE_FONT_PRESETS.find((preset) => {
    const firstCssToken = preset.cssStack.split(",")[0]?.trim();
    return preset.cssStack === fontFamily || Boolean(firstCssToken && fontFamily.includes(firstCssToken));
  });
}

export function normalizeTemplateFontWeight(weight?: string) {
  if (!weight) return 900;
  if (weight === "bold") return 900;
  if (weight === "normal") return 500;
  const numeric = Number(weight);
  return Number.isFinite(numeric) ? numeric : weight;
}
