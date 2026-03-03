import { createEmbeddings } from "./geminiClient.js";

const BATCH_SIZE = 64;
const RETRY_DELAYS_MS = [400, 1200, 2500];

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === RETRY_DELAYS_MS.length) break;
      const delay = RETRY_DELAYS_MS[attempt];
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Embedding failed");
}

export async function embedTexts(input: string[]): Promise<number[][]> {
  if (input.length === 0) return [];

  const vectors: number[][] = [];

  for (let i = 0; i < input.length; i += BATCH_SIZE) {
    const batch = input.slice(i, i + BATCH_SIZE);
    const batchVectors = await withRetries(async () => createEmbeddings(batch));
    vectors.push(...batchVectors);
  }

  if (vectors.length !== input.length) {
    throw new Error("Embedding count mismatch");
  }

  return vectors;
}

