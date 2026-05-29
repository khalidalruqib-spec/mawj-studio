export type AIProviderMode = "anthropic" | "openai";

type JsonObject = Record<string, unknown>;

type GenerateStructuredJsonOptions = {
  taskName: string;
  system: string;
  input: unknown;
  schema: JsonObject;
  maxTokens?: number;
  openAIModel?: string;
  anthropicModel?: string;
};

type GenerateStructuredJsonResult<T> = {
  data: T;
  provider: AIProviderMode;
  model: string;
};

type AnthropicContentBlock = {
  type?: string;
  text?: string;
  name?: string;
  input?: unknown;
};

type AnthropicMessageResponse = {
  content?: AnthropicContentBlock[];
  model?: string;
};

type OpenAIResponsesOutput = {
  content?: Array<{ text?: string }>;
};

type OpenAIResponsesResponse = {
  output_text?: string;
  output?: OpenAIResponsesOutput[];
  model?: string;
};

const ANTHROPIC_API_VERSION = "2023-06-01";
const ANTHROPIC_TOOL_NAME = "mawj_json";

export function getConfiguredAIProvider(): AIProviderMode | null {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

export function hasConfiguredAIProvider() {
  return getConfiguredAIProvider() !== null;
}

export function getMissingAIProviderMessage() {
  return "أضف ANTHROPIC_API_KEY أو OPENAI_API_KEY في Vercel لتفعيل الذكاء الاصطناعي الحقيقي.";
}

export async function generateStructuredJson<T>({
  taskName,
  system,
  input,
  schema,
  maxTokens = 1800,
  openAIModel,
  anthropicModel,
}: GenerateStructuredJsonOptions): Promise<GenerateStructuredJsonResult<T> | null> {
  const provider = getConfiguredAIProvider();
  if (!provider) return null;

  if (provider === "anthropic") {
    const model = anthropicModel ?? process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
    const data = await callAnthropicStructuredJson<T>({
      taskName,
      system,
      input,
      schema,
      maxTokens,
      model,
    });

    return {
      data,
      provider,
      model,
    };
  }

  const model = openAIModel ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const data = await callOpenAIStructuredJson<T>({
    taskName,
    system,
    input,
    schema,
    maxTokens,
    model,
  });

  return {
    data,
    provider,
    model,
  };
}

async function callAnthropicStructuredJson<T>({
  taskName,
  system,
  input,
  schema,
  maxTokens,
  model,
}: GenerateStructuredJsonOptions & { model: string; maxTokens: number }): Promise<T> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_API_VERSION,
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      tools: [
        {
          name: ANTHROPIC_TOOL_NAME,
          description: `Return the ${taskName} as structured JSON.`,
          input_schema: schema,
        },
      ],
      tool_choice: {
        type: "tool",
        name: ANTHROPIC_TOOL_NAME,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as AnthropicMessageResponse;
  const toolUse = payload.content?.find((block) => block.type === "tool_use" && block.name === ANTHROPIC_TOOL_NAME);

  if (toolUse?.input && typeof toolUse.input === "object") {
    return toolUse.input as T;
  }

  const text = payload.content?.map((block) => block.text).find(Boolean);
  if (!text) {
    throw new Error("Anthropic did not return structured JSON.");
  }

  return JSON.parse(stripJsonFences(text)) as T;
}

async function callOpenAIStructuredJson<T>({
  taskName,
  system,
  input,
  schema,
  maxTokens,
  model,
}: GenerateStructuredJsonOptions & { model: string; maxTokens: number }): Promise<T> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_output_tokens: maxTokens,
      instructions: system,
      input: JSON.stringify(input),
      text: {
        format: {
          type: "json_schema",
          name: taskName,
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as OpenAIResponsesResponse;
  const text = extractOpenAIResponseText(payload);
  if (!text) {
    throw new Error("OpenAI did not return structured JSON.");
  }

  return JSON.parse(text) as T;
}

export function getAIProviderEngineLabel(provider: AIProviderMode) {
  return provider === "anthropic" ? "Claude command engine" : "OpenAI command engine";
}

export function getAIProviderDisplayName(provider: AIProviderMode) {
  return provider === "anthropic" ? "Claude" : "OpenAI";
}

function extractOpenAIResponseText(data: OpenAIResponsesResponse) {
  if (data.output_text) return data.output_text;

  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text)
    .find(Boolean);
}

function stripJsonFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}
