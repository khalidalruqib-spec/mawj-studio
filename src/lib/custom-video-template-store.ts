import type { VideoTemplate } from "@/lib/video-template-engine";

export const CUSTOM_VIDEO_TEMPLATES_STORAGE_KEY = "mawj-custom-video-templates-v1";

export function listCustomVideoTemplates(): VideoTemplate[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CUSTOM_VIDEO_TEMPLATES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isStoredVideoTemplate).slice(0, 30);
  } catch {
    return [];
  }
}

export function storeCustomVideoTemplate(template: VideoTemplate): VideoTemplate[] {
  if (typeof window === "undefined") return [template];

  const current = listCustomVideoTemplates();
  const next = [template, ...current.filter((item) => item.id !== template.id)].slice(0, 30);
  window.localStorage.setItem(CUSTOM_VIDEO_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteCustomVideoTemplate(templateId: string): VideoTemplate[] {
  if (typeof window === "undefined") return [];

  const next = listCustomVideoTemplates().filter((template) => template.id !== templateId);
  window.localStorage.setItem(CUSTOM_VIDEO_TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isCustomVideoTemplate(template: Pick<VideoTemplate, "id" | "category">) {
  return template.id.startsWith("custom-") || template.category === "Custom Templates";
}

function isStoredVideoTemplate(value: unknown): value is VideoTemplate {
  if (!value || typeof value !== "object") return false;
  const template = value as Partial<VideoTemplate>;
  return (
    typeof template.id === "string" &&
    typeof template.name === "string" &&
    typeof template.category === "string" &&
    (template.aspectRatio === "9:16" || template.aspectRatio === "16:9" || template.aspectRatio === "1:1" || template.aspectRatio === "4:5") &&
    typeof template.width === "number" &&
    typeof template.height === "number" &&
    typeof template.duration === "number" &&
    Array.isArray(template.requiredInputs) &&
    Array.isArray(template.scenes)
  );
}
