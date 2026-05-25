import { z } from "zod";

export const editPlanRequestSchema = z.object({
  projectId: z.string().uuid().optional(),
  fileName: z.string().min(1),
  durationSeconds: z.coerce.number().min(1).max(7200),
  platform: z.enum(["tiktok", "instagram", "shorts", "snapchat"]),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
  languageMode: z.enum(["arabic", "english", "mixed"]),
  styleId: z.enum([
    "viral-saudi",
    "premium-brand",
    "podcast-cuts",
    "product-drop",
    "educational",
    "restaurant-ad",
  ]),
  brandName: z.string().optional(),
  goal: z.enum(["engagement", "sales", "education", "awareness"]),
});

export const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
  styleId: z.enum([
    "viral-saudi",
    "premium-brand",
    "podcast-cuts",
    "product-drop",
    "educational",
    "restaurant-ad",
  ]),
  platform: z.enum(["tiktok", "instagram", "shorts", "snapchat"]),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
  sourceFileName: z.string().min(1),
  sourceFileSize: z.coerce.number().min(1),
  sourceMimeType: z.string().min(1),
  sourceDurationSeconds: z.coerce.number().min(1).max(7200),
});

export const uploadUrlSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});
