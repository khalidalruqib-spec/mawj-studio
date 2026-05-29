import { NextResponse } from "next/server";
import {
  AI_COMMAND_ACTION_TYPES,
  resolveLocalAICommand,
  type AICommandContext,
  type AICommandResponse,
} from "@/lib/ai-command";
import { generateStructuredJson, getAIProviderEngineLabel } from "@/lib/ai-provider";

const aiCommandSchema = {
  type: "object",
  additionalProperties: false,
  required: ["message", "actions", "confidence", "targetCut"],
  properties: {
    message: { type: "string" },
    confidence: { type: "number" },
    targetCut: { type: "string" },
    actions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "label", "params"],
        properties: {
          type: { type: "string", enum: AI_COMMAND_ACTION_TYPES },
          label: { type: "string" },
          params: {
            type: "object",
            additionalProperties: {
              anyOf: [{ type: "string" }, { type: "number" }, { type: "boolean" }],
            },
          },
        },
      },
    },
  },
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const context = (typeof body?.context === "object" && body.context ? body.context : {}) as AICommandContext;

  if (!message) {
    return NextResponse.json({ error: "اكتب أمر للذكاء الاصطناعي." }, { status: 400 });
  }

  const localResponse = resolveLocalAICommand(message, context);
  const aiResponse = await enhanceCommandWithAI(message, context, localResponse);

  return NextResponse.json(aiResponse ?? localResponse);
}

async function enhanceCommandWithAI(
  message: string,
  context: AICommandContext,
  localResponse: AICommandResponse,
): Promise<AICommandResponse | null> {
  try {
    const result = await generateStructuredJson<Pick<AICommandResponse, "message" | "actions" | "confidence" | "targetCut">>({
      taskName: "mawj_ai_command",
      schema: aiCommandSchema,
      maxTokens: 1400,
      openAIModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      system:
        "You are the command brain inside Mawj Studio, a professional AI video editor for Arabic and Saudi creators. Convert the user's natural-language editing request into safe executable editor actions. If the context has uploaded images but no video and the user asks to make/create/generate a video, choose CREATE_IMAGE_STORYBOARD. Prefer Arabic user-facing messages. Never claim that final rendering happened unless an action only prepares it. Return valid JSON only.",
      input: {
        userCommand: message,
        editorContext: context,
        availableActions: AI_COMMAND_ACTION_TYPES,
        localFallback: localResponse,
      },
    });

    if (!result) return null;

    return {
      ...result.data,
      engine: getAIProviderEngineLabel(result.provider),
      confidence: Math.max(0, Math.min(100, Math.round(result.data.confidence))),
      mode: result.provider,
      model: result.model,
    };
  } catch (error) {
    console.warn("AI command enhancement error:", error);
    return null;
  }
}
