import { NextResponse } from "next/server";
import {
  AI_COMMAND_ACTION_TYPES,
  resolveLocalAICommand,
  type AICommandContext,
  type AICommandResponse,
} from "@/lib/ai-command";

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
  const openAIResponse = await enhanceCommandWithOpenAI(message, context, localResponse);

  return NextResponse.json(openAIResponse ?? localResponse);
}

async function enhanceCommandWithOpenAI(
  message: string,
  context: AICommandContext,
  localResponse: AICommandResponse,
): Promise<AICommandResponse | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "You are the command brain inside Mawj Studio, a professional AI video editor for Arabic and Saudi creators. Convert the user's natural-language editing request into safe executable editor actions. If the context has uploaded images but no video and the user asks to make/create/generate a video, choose CREATE_IMAGE_STORYBOARD. Prefer Arabic user-facing messages. Never claim that final rendering happened unless an action only prepares it. Return valid JSON only.",
        input: JSON.stringify({
          userCommand: message,
          editorContext: context,
          availableActions: AI_COMMAND_ACTION_TYPES,
          localFallback: localResponse,
        }),
        text: {
          format: {
            type: "json_schema",
            name: "mawj_ai_command",
            strict: true,
            schema: aiCommandSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      console.warn("OpenAI AI command failed:", await response.text());
      return null;
    }

    const data = await response.json();
    const output = extractResponseText(data);
    if (!output) return null;

    const parsed = JSON.parse(output) as Pick<AICommandResponse, "message" | "actions" | "confidence" | "targetCut">;

    return {
      ...parsed,
      engine: "OpenAI command engine",
      confidence: Math.max(0, Math.min(100, Math.round(parsed.confidence))),
      mode: "openai",
      model,
    };
  } catch (error) {
    console.warn("OpenAI AI command error:", error);
    return null;
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
