import { NextResponse } from "next/server";
import { z } from "zod";
import { createCustomTemplateCopy } from "@/lib/custom-video-template-store";
import { generateLocalVideoTemplate } from "@/lib/local-template-generator";
import type { VideoTemplate } from "@/lib/video-template-engine";

const templateGeneratorSchema = z.object({
  prompt: z.string().min(4).max(600),
  brand: z
    .object({
      brandName: z.string().max(120).optional(),
      brandColor: z.string().max(16).optional(),
      accentColor: z.string().max(16).optional(),
      logoName: z.string().max(240).optional(),
    })
    .optional(),
});

const templateResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "category",
    "aspectRatio",
    "width",
    "height",
    "duration",
    "description",
    "language",
    "requiredInputs",
    "scenes",
    "animations",
    "transitions",
    "audio",
    "export",
    "safeMargins",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    category: { type: "string" },
    aspectRatio: { type: "string", enum: ["9:16", "16:9", "1:1", "4:5"] },
    width: { type: "number" },
    height: { type: "number" },
    duration: { type: "number", minimum: 6, maximum: 60 },
    description: { type: "string" },
    language: { type: "string", enum: ["ar", "en", "mixed"] },
    requiredInputs: {
      type: "array",
      minItems: 5,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["key", "label", "type"],
        properties: {
          key: { type: "string" },
          label: { type: "string" },
          type: { type: "string", enum: ["text", "textarea", "image", "video", "audio", "color", "select"] },
          default: { type: "string" },
          required: { type: "boolean" },
          options: { type: "array", items: { type: "string" } },
          placeholder: { type: "string" },
        },
      },
    },
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "start", "duration", "background", "layers"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          start: { type: "number" },
          duration: { type: "number" },
          background: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
              type: { type: "string", enum: ["color", "gradient", "image", "video", "blur", "transparent"] },
              value: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
              src: { type: "string" },
            },
          },
          layers: {
            type: "array",
            minItems: 1,
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: true,
              required: ["id", "type"],
              properties: {
                id: { type: "string" },
                type: { type: "string", enum: ["text", "image", "video", "shape", "captions", "audio", "background", "waveform"] },
              },
            },
          },
          transition: {
            type: "object",
            additionalProperties: false,
            required: ["type", "duration"],
            properties: {
              type: { type: "string", enum: ["cut", "fade", "slide", "zoom", "wipe", "blur"] },
              duration: { type: "number" },
              direction: { type: "string", enum: ["up", "down", "left", "right"] },
            },
          },
        },
      },
    },
    animations: {
      type: "array",
      items: {
        type: "string",
        enum: ["fadeIn", "fadeOut", "slideUp", "slideDown", "slideLeft", "slideRight", "zoomIn", "zoomOut", "pop", "bounce", "typewriter", "blurReveal", "rotateIn"],
      },
    },
    transitions: {
      type: "array",
      items: { type: "string", enum: ["cut", "fade", "slide", "zoom", "wipe", "blur"] },
    },
    audio: {
      type: "object",
      additionalProperties: false,
      required: ["music", "volume"],
      properties: {
        music: { type: ["string", "null"] },
        volume: { type: "number" },
        voiceover: { type: ["string", "null"] },
      },
    },
    export: {
      type: "object",
      additionalProperties: false,
      required: ["format", "fps", "quality"],
      properties: {
        format: { type: "string", enum: ["mp4", "webm"] },
        fps: { type: "number" },
        quality: { type: "string", enum: ["720p", "1080p", "4k"] },
      },
    },
    safeMargins: {
      type: "object",
      additionalProperties: false,
      required: ["top", "bottom", "left", "right"],
      properties: {
        top: { type: "number" },
        bottom: { type: "number" },
        left: { type: "number" },
        right: { type: "number" },
      },
    },
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = templateGeneratorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "اكتب وصف القالب أولاً." }, { status: 400 });
  }

  const localTemplate = generateLocalVideoTemplate(parsed.data.prompt, parsed.data.brand);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      template: localTemplate,
      mode: "local",
      model: "local-template-generator",
    });
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are Mawj Studio's professional video template designer. Generate one editable JSON video template for an Arabic-first browser video editor. Use placeholders such as {{brandName}}, {{title}}, {{subtitle}}, {{mainImage}}, {{mainVideo}}, {{logo}}, {{brandColor}}, {{accentColor}}, {{cta}}. Strict design rules: every scene must feel like text integrated directly on top of full-bleed photo/video media, never a split screen or empty solid text area. Use subtle black readability overlays only. Do not use star icons, star shapes, decorative waves, wave backgrounds, or ornamental filler. Arabic wording must be concise, accurate, bold, and professional. Every text/captions layer must include fontFamily, lineHeight, textStrokeColor/textStrokeWidth or shadowColor/shadowBlur, and optional backgroundPadding when it has a background. Prefer Arabic font stacks such as IBM Plex Sans Arabic, Cairo, Tajawal, Noto Sans Arabic, Almarai, or Changa. Keep important text inside mobile safe margins. Return valid JSON only.",
        input: JSON.stringify({
          prompt: parsed.data.prompt,
          brand: parsed.data.brand,
          fallbackTemplate: localTemplate,
          requirements: [
            "3 to 6 scenes",
            "text/image/video/shape/captions layers where useful",
            "Each scene should include a full-bleed image/video layer sourced from the main user media placeholder, with text placed directly above it",
            "No blank solid sections for copy; no stars; no wave SVGs or wave-like decorative backgrounds",
            "Use simple black-to-transparent or black translucent overlays for readability",
            "editable placeholders in requiredInputs",
            "Use the provided brand.brandName, brand.brandColor, brand.accentColor, and brand.logoName as requiredInputs defaults when present",
            "Arabic RTL direction auto/rtl for text layers",
            "safe margins for 9:16: top 160, bottom 260, left 70, right 70",
            "export mp4 1080p 30fps",
          ],
        }),
        text: {
          format: {
            type: "json_schema",
            name: "mawj_video_template",
            strict: false,
            schema: templateResponseSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        template: localTemplate,
        mode: "local-fallback",
        model,
        warning: await response.text(),
      });
    }

    const data = await response.json();
    const text = extractResponseText(data);
    const template = text ? createCustomTemplateCopy(JSON.parse(text) as VideoTemplate, "import") : localTemplate;

    return NextResponse.json({
      template: {
        ...template,
        name: template.name.replace(/\sImported$/, ""),
        category: "Custom Templates",
        description: template.description || localTemplate.description,
      },
      mode: text ? "openai" : "local-fallback",
      model,
    });
  } catch (error) {
    return NextResponse.json({
      template: localTemplate,
      mode: "local-fallback",
      warning: error instanceof Error ? error.message : "Template AI generation failed.",
    });
  }
}

function extractResponseText(data: unknown) {
  if (typeof data !== "object" || !data) return null;

  const withOutputText = data as { output_text?: string };
  if (withOutputText.output_text) return withOutputText.output_text;

  const withOutput = data as {
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  return withOutput.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find(Boolean) ?? null;
}
