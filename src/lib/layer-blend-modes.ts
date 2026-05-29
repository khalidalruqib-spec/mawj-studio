export const LAYER_BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "color-dodge",
  "color-burn",
  "lighten",
  "darken",
  "difference",
  "exclusion",
] as const;

export type LayerBlendMode = (typeof LAYER_BLEND_MODES)[number];

export const LAYER_BLEND_MODE_OPTIONS: Array<{
  value: LayerBlendMode;
  label: string;
  detail: string;
}> = [
  { value: "normal", label: "Normal", detail: "بدون دمج" },
  { value: "multiply", label: "Multiply", detail: "تغميق ودمج مع الخلفية" },
  { value: "screen", label: "Screen", detail: "تفتيح الإضاءات" },
  { value: "overlay", label: "Overlay", detail: "تباين سينمائي" },
  { value: "soft-light", label: "Soft light", detail: "دمج ناعم" },
  { value: "hard-light", label: "Hard light", detail: "دمج قوي" },
  { value: "color-dodge", label: "Color dodge", detail: "لمعة قوية" },
  { value: "color-burn", label: "Color burn", detail: "حرق لوني داكن" },
  { value: "lighten", label: "Lighten", detail: "إظهار الفاتح فقط" },
  { value: "darken", label: "Darken", detail: "إظهار الداكن فقط" },
  { value: "difference", label: "Difference", detail: "تأثير عكسي" },
  { value: "exclusion", label: "Exclusion", detail: "عكسي ناعم" },
];

export function resolveCssBlendMode(mode?: LayerBlendMode) {
  return mode && mode !== "normal" ? mode : undefined;
}

export function resolveCanvasCompositeOperation(mode?: LayerBlendMode): GlobalCompositeOperation {
  return mode && mode !== "normal" ? mode : "source-over";
}
