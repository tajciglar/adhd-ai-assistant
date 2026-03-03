const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 20_000;
const EMBEDDING_DIMENSIONS = 1536;

export const AI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const AI_EMBED_MODEL =
  process.env.GEMINI_EMBED_MODEL ?? "text-embedding-004";

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: GeminiUsageMetadata;
}

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return key;
}

async function postGemini<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(`${GEMINI_BASE_URL}${path}`);
    url.searchParams.set("key", getGeminiApiKey());

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini ${path} failed (${res.status}): ${errorText}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createEmbeddings(input: string[]): Promise<number[][]> {
  const vectors: number[][] = [];

  for (const text of input) {
    const payload = {
      content: {
        parts: [{ text }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    };
    const data = await postGemini<GeminiEmbeddingResponse>(
      `/models/${AI_EMBED_MODEL}:embedContent`,
      payload,
    );
    const vector = data.embedding?.values ?? [];
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${EMBEDDING_DIMENSIONS}, got ${vector.length}`,
      );
    }
    vectors.push(vector);
  }

  return vectors;
}

export async function createChatCompletion(
  messages: ChatCompletionMessage[],
): Promise<{
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}> {
  const systemInstruction = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const payload = {
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
    contents,
    generationConfig: {
      temperature: 0.2,
    },
  };
  const data = await postGemini<GeminiGenerateResponse>(
    `/models/${AI_CHAT_MODEL}:generateContent`,
    payload,
  );
  const content =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";
  return {
    content,
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount,
      completion_tokens: data.usageMetadata?.candidatesTokenCount,
      total_tokens: data.usageMetadata?.totalTokenCount,
    },
  };
}
