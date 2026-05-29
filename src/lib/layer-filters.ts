export type LayerFilterInput = {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
};

export function resolveLayerFilter(layer: LayerFilterInput, blurScale = 1) {
  const brightness = clampFilterValue(layer.brightness ?? 100, 0, 220);
  const contrast = clampFilterValue(layer.contrast ?? 100, 0, 220);
  const saturation = clampFilterValue(layer.saturation ?? 100, 0, 260);
  const blur = clampFilterValue(layer.blur ?? 0, 0, 80) * blurScale;

  if (brightness === 100 && contrast === 100 && saturation === 100 && blur === 0) {
    return undefined;
  }

  return [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    blur > 0 ? `blur(${blur}px)` : "",
  ].filter(Boolean).join(" ");
}

function clampFilterValue(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
