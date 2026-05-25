import { z } from "zod";

export const editPlanRequestSchema = z.object({
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
