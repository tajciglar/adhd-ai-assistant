const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 30_000;
export const LONG_REQUEST_TIMEOUT_MS = 120_000;
const EMBEDDING_DIMENSIONS = 1536;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export const AI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const AI_EMBED_MODEL =
  process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

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

async function postGemini<T>(path: string, body: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = new URL(`${GEMINI_BASE_URL}${path}`);
      url.searchParams.set("key", getGeminiApiKey());

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Connection: "keep-alive",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        keepalive: true,
      });

      if (!res.ok) {
        const errorText = await res.text();
        const isRetryable = RETRYABLE_STATUS.has(res.status) && attempt === 0;
        if (isRetryable) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        throw new Error(
          `Gemini ${path} failed (${res.status}): ${errorText.slice(0, 500)}`,
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      const shouldRetry = attempt === 0 && (controller.signal.aborted || !(err instanceof Error && err.message.startsWith("Gemini")));
      if (shouldRetry) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }

      if (err instanceof Error && err.message.startsWith("Gemini")) {
        throw err;
      }
      const message = controller.signal.aborted
        ? `Gemini ${path} timed out after ${timeoutMs}ms`
        : `Gemini ${path} network error`;
      throw new Error(message);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error(`Gemini ${path} failed after retry`);
}

interface GeminiBatchEmbeddingResponse {
  embeddings?: Array<{
    values?: number[];
  }>;
}

/**
 * Embed multiple texts in a single API call using batchEmbedContents.
 * Falls back to sequential single-embed calls if batch fails.
 */
export async function createEmbeddings(input: string[]): Promise<number[][]> {
  if (input.length === 0) return [];

  // Use batchEmbedContents for multiple texts in one API call
  const payload = {
    requests: input.map((text) => ({
      model: `models/${AI_EMBED_MODEL}`,
      content: {
        parts: [{ text }],
      },
      outputDimensionality: EMBEDDING_DIMENSIONS,
    })),
  };

  const data = await postGemini<GeminiBatchEmbeddingResponse>(
    `/models/${AI_EMBED_MODEL}:batchEmbedContents`,
    payload,
  );

  const embeddings = data.embeddings ?? [];
  if (embeddings.length !== input.length) {
    throw new Error(
      `Batch embedding count mismatch. Expected ${input.length}, got ${embeddings.length}`,
    );
  }

  return embeddings.map((emb, i) => {
    const vector = emb.values ?? [];
    if (vector.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch at index ${i}. Expected ${EMBEDDING_DIMENSIONS}, got ${vector.length}`,
      );
    }
    return vector;
  });
}

// ── Streaming Chat Completion ────────────────────────────────────────

export interface ChatCompletionMessageInput {
  role: "system" | "user" | "assistant";
  content: string;
}

function buildGeminiPayload(messages: ChatCompletionMessageInput[]) {
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

  return {
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
    contents,
    generationConfig: {
      temperature: 0.2,
    },
  };
}

/**
 * Stream chat completion from Gemini using streamGenerateContent.
 * Yields text chunks as they arrive. Returns usage metadata via the onUsage callback.
 */
export async function* streamChatCompletion(
  messages: ChatCompletionMessageInput[],
  options?: {
    timeoutMs?: number;
    onUsage?: (usage: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    }) => void;
  },
): AsyncGenerator<string> {
  const payload = buildGeminiPayload(messages);
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(
      `${GEMINI_BASE_URL}/models/${AI_CHAT_MODEL}:streamGenerateContent`,
    );
    url.searchParams.set("key", getGeminiApiKey());
    url.searchParams.set("alt", "sse");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Gemini streamGenerateContent failed (${res.status}): ${errorText.slice(0, 500)}`,
      );
    }

    if (!res.body) {
      throw new Error("Gemini streamGenerateContent returned no body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from the buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const chunk = JSON.parse(jsonStr) as GeminiGenerateResponse;
          const text = chunk.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("") ?? "";

          if (text) yield text;

          // Usage metadata comes in the final chunk
          if (chunk.usageMetadata && options?.onUsage) {
            options.onUsage({
              prompt_tokens: chunk.usageMetadata.promptTokenCount,
              completion_tokens: chunk.usageMetadata.candidatesTokenCount,
              total_tokens: chunk.usageMetadata.totalTokenCount,
            });
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function createChatCompletion(
  messages: ChatCompletionMessageInput[],
  options?: { timeoutMs?: number },
): Promise<{
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}> {
  const payload = buildGeminiPayload(messages);
  const data = await postGemini<GeminiGenerateResponse>(
    `/models/${AI_CHAT_MODEL}:generateContent`,
    payload,
    options?.timeoutMs,
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
