import type { EditPlan, EditPlanRequest } from "@/lib/edit-plan";

type AiEditPlan = Pick<
  EditPlan,
  "title" | "hook" | "summary" | "targetDurationSeconds" | "confidence" | "timeline" | "captions" | "aiTools" | "exportVariants"
>;

export async function enhanceEditPlanWithOpenAI(plan: EditPlan, request: EditPlanRequest) {
  if (!process.env.OPENAI_API_KEY) return plan;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: [
      "title",
      "hook",
      "summary",
      "targetDurationSeconds",
      "confidence",
      "timeline",
      "captions",
      "aiTools",
      "exportVariants",
    ],
    properties: {
      title: { type: "string" },
      hook: { type: "string" },
      summary: { type: "string" },
      targetDurationSeconds: { type: "number" },
      confidence: { type: "number" },
      timeline: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "label", "start", "end", "action", "intensity"],
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            start: { type: "number" },
            end: { type: "number" },
            action: { type: "string" },
            intensity: { type: "string", enum: ["low", "medium", "high"] },
          },
        },
      },
      captions: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["at", "text", "emphasis"],
          properties: {
            at: { type: "number" },
            text: { type: "string" },
            emphasis: { type: "array", items: { type: "string" } },
          },
        },
      },
      aiTools: {
        type: "array",
        minItems: 4,
        maxItems: 7,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "status", "detail"],
          properties: {
            name: { type: "string" },
            status: { type: "string", enum: ["ready", "queued", "optional"] },
            detail: { type: "string" },
          },
        },
      },
      exportVariants: {
        type: "array",
        minItems: 3,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["platform", "duration", "caption"],
          properties: {
            platform: { type: "string" },
            duration: { type: "string" },
            caption: { type: "string" },
          },
        },
      },
    },
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
        instructions:
          "You are the editing brain of Mawj Studio, a professional AI video editing platform for Arabic and Saudi creators. Return a precise edit plan in JSON only. Do not invent rendered URLs. Focus on hook, pacing, captions, safe mobile layout, and platform-specific exports.",
        input: JSON.stringify({
          request,
          basePlan: plan,
          constraints: {
            keepAspectRatio: request.aspectRatio,
            keepStyleId: request.styleId,
            mobileFirst: true,
            arabicCaptionsNeedReadableRTL: true,
          },
        }),
        text: {
          format: {
            type: "json_schema",
            name: "mawj_edit_plan",
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("OpenAI edit plan enhancement failed:", await response.text());
      return plan;
    }

    const data = await response.json();
    const text = extractResponseText(data);
    if (!text) return plan;

    const aiPlan = JSON.parse(text) as AiEditPlan;

    return {
      ...plan,
      ...aiPlan,
      styleId: request.styleId,
      renderSettings: plan.renderSettings,
    };
  } catch (error) {
    console.warn("OpenAI edit plan enhancement error:", error);
    return plan;
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
    .find(Boolean);
}
