import { NextResponse } from "next/server";
import { z } from "zod";
import type { AdCampaign } from "@/lib/ad-maker";
import { generateStructuredJson, getAIProviderDisplayName, getMissingAIProviderMessage } from "@/lib/ai-provider";

const adMakerSchema = z.object({
  productName: z.string().min(2).max(120),
  tone: z.enum(["luxury", "funny", "formal", "youthful", "educational", "commercial"]),
  brandName: z.string().max(120).default("Mawj Studio"),
  platform: z.enum(["tiktok", "instagram", "shorts", "snapchat"]),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
  goal: z.enum(["engagement", "sales", "education", "awareness"]),
  languageMode: z.enum(["arabic", "english", "mixed"]),
  durationSeconds: z.coerce.number().min(1).max(7200),
  assetNames: z.array(z.string().max(160)).max(20).default([]),
  transcriptPreview: z.string().max(2200).optional(),
});

const adCampaignSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "strategy",
    "targetAudience",
    "primaryHook",
    "cta",
    "hashtags",
    "platformNotes",
    "brandDirections",
    "variants",
  ],
  properties: {
    title: { type: "string" },
    strategy: { type: "string" },
    targetAudience: { type: "string" },
    primaryHook: { type: "string" },
    cta: { type: "string" },
    hashtags: { type: "array", minItems: 4, maxItems: 10, items: { type: "string" } },
    platformNotes: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    brandDirections: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
    variants: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "durationSeconds", "hook", "script", "cta", "scenes"],
        properties: {
          id: { type: "string", enum: ["15s", "30s", "60s"] },
          durationSeconds: { type: "number" },
          hook: { type: "string" },
          script: { type: "string" },
          cta: { type: "string" },
          scenes: {
            type: "array",
            minItems: 3,
            maxItems: 8,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "start", "end", "visual", "voiceover", "caption", "overlay", "shotType"],
              properties: {
                id: { type: "string" },
                start: { type: "number" },
                end: { type: "number" },
                visual: { type: "string" },
                voiceover: { type: "string" },
                caption: { type: "string" },
                overlay: { type: "string" },
                shotType: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = adMakerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "بيانات إعلان المنتج غير مكتملة." },
      { status: 400 },
    );
  }

  const missingProviderMessage = getMissingAIProviderMessage();
  const system =
    "You are Mawj Studio's senior creative strategist for Saudi and Arabic social video ads. Generate a practical ad package that can be applied directly to a browser video timeline. Use Arabic-first copy unless the requested language is English. Do not mention that you are an AI. Return valid JSON only.";

  try {
    const result = await generateStructuredJson<AdCampaign>({
      taskName: "mawj_ad_campaign",
      schema: adCampaignSchema,
      maxTokens: 2600,
      openAIModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      system,
      input: {
        request: parsed.data,
        requiredOutput:
          "Create three ad versions for 15s, 30s, and 60s. Each version needs timestamped scenes, captions, overlays, voiceover script, CTA, platform notes, brand directions, and hashtags. The scenes should use uploaded media names when useful.",
        constraints: {
          mobileSafeCaptions: true,
          rtlArabicReadable: true,
          noFakeClaims: true,
          noRenderedUrls: true,
          applyToTimeline: true,
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: missingProviderMessage },
        { status: 503 },
      );
    }

    const campaign = normalizeCampaign(result.data);

    return NextResponse.json(
      {
        campaign,
        model: result.model,
        provider: getAIProviderDisplayName(result.provider),
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر توليد حملة الإعلان." },
      { status: 502 },
    );
  }
}

function normalizeCampaign(campaign: AdCampaign): AdCampaign {
  return {
    ...campaign,
    variants: campaign.variants.map((variant) => {
      const expectedDuration =
        variant.id === "15s" ? 15 : variant.id === "30s" ? 30 : 60;
      const durationSeconds = expectedDuration;
      const scenes = [...variant.scenes]
        .sort((left, right) => left.start - right.start)
        .map((scene, index) => {
          const start = Math.max(0, Math.min(durationSeconds - 0.5, scene.start));
          const end = Math.max(start + 0.5, Math.min(durationSeconds, scene.end));

          return {
            ...scene,
            id: scene.id || `scene-${index + 1}`,
            start: Number(start.toFixed(2)),
            end: Number(end.toFixed(2)),
          };
        });

      if (scenes[0] && scenes[0].start > 0) {
        scenes[0] = { ...scenes[0], start: 0 };
      }

      const lastScene = scenes.at(-1);
      if (lastScene && lastScene.end < durationSeconds) {
        scenes[scenes.length - 1] = { ...lastScene, end: durationSeconds };
      }

      return {
        ...variant,
        durationSeconds,
        scenes,
      };
    }),
  };
}
