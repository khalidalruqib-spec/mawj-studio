import type { EditPlan, EditPlanRequest } from "@/lib/edit-plan";
import { generateStructuredJson } from "@/lib/ai-provider";

type AiEditPlan = Pick<
  EditPlan,
  "title" | "hook" | "summary" | "targetDurationSeconds" | "confidence" | "timeline" | "captions" | "aiTools" | "exportVariants"
>;

export async function enhanceEditPlanWithOpenAI(plan: EditPlan, request: EditPlanRequest) {
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
    const result = await generateStructuredJson<AiEditPlan>({
      taskName: "mawj_edit_plan",
      schema,
      openAIModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      maxTokens: 2200,
      system:
        "You are the editing brain of Mawj Studio, a professional AI video editing platform for Arabic and Saudi creators. Return a precise edit plan as JSON only. Do not invent rendered URLs. Focus on hook, pacing, captions, safe mobile layout, and platform-specific exports.",
      input: {
        request,
        basePlan: plan,
        constraints: {
          keepAspectRatio: request.aspectRatio,
          keepStyleId: request.styleId,
          mobileFirst: true,
          arabicCaptionsNeedReadableRTL: true,
        },
      },
    });

    if (!result) return plan;

    return {
      ...plan,
      ...result.data,
      styleId: request.styleId,
      renderSettings: plan.renderSettings,
    };
  } catch (error) {
    console.warn("AI edit plan enhancement error:", error);
    return plan;
  }
}
