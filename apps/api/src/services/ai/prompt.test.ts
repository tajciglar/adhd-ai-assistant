import { test } from "node:test";
import assert from "node:assert/strict";
import { buildGroundedPrompt } from "./prompt.js";

test("buildGroundedPrompt limits sources and history length", () => {
  const sources = Array.from({ length: 10 }, (_, i) => ({
    entryId: `entry-${i}`,
    title: `Title ${i}`,
    category: "cat",
    chunkIndex: i,
    text: "x".repeat(2000),
    score: 0.8,
  }));
  const history = Array.from({ length: 15 }, (_, i) => ({
    role: i % 2 === 0 ? ("USER" as const) : ("ASSISTANT" as const),
    content: `history-${i}-${"a".repeat(1500)}`,
  }));

  const prompt = buildGroundedPrompt({
    question: "How do I handle transitions?",
    sources,
    child: null,
    history,
  });

  const promptText = prompt.map((m) => m.content).join("\n");
  assert.ok(promptText.includes("[Source 1]"));
  assert.ok(!promptText.includes("[Source 6]"));
  assert.ok(prompt.length < 15);
});
