import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { VideoTemplate } from "@/lib/video-template-engine";

const TEMPLATES_DIR = path.join(process.cwd(), "src", "templates");

export async function getTemplates(): Promise<VideoTemplate[]> {
  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const templates = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => getTemplateById(entry.name)),
  );

  return templates
    .filter((template): template is VideoTemplate => Boolean(template))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getTemplateById(templateId: string): Promise<VideoTemplate | null> {
  const safeId = sanitizeTemplateId(templateId);
  const templatePath = path.join(TEMPLATES_DIR, safeId, "template.json");

  try {
    const raw = await fs.readFile(templatePath, "utf8");
    const template = JSON.parse(raw) as VideoTemplate;

    return {
      ...template,
      thumbnailUrl: `/api/templates/${template.id}/asset?file=thumbnail.png`,
      previewUrl: `/api/templates/${template.id}/asset?file=preview.png`,
    };
  } catch {
    return null;
  }
}

export function getTemplateAssetPath(templateId: string, fileName: string) {
  const safeId = sanitizeTemplateId(templateId);
  const safeFileName = fileName === "preview.png" ? "preview.png" : "thumbnail.png";
  return path.join(TEMPLATES_DIR, safeId, safeFileName);
}

function sanitizeTemplateId(value: string) {
  return value.replace(/[^a-z0-9-_]/gi, "");
}
