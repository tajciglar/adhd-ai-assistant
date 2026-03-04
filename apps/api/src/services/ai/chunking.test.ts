import { test } from "node:test";
import assert from "node:assert/strict";
import { splitIntoChunks } from "./chunking.js";

test("splitIntoChunks returns empty for blank input", () => {
  assert.deepEqual(splitIntoChunks("   "), []);
});

test("splitIntoChunks creates ordered chunks with token counts", () => {
  const text = Array.from({ length: 1800 }, (_, i) => `word${i}`).join(" ");
  const chunks = splitIntoChunks(text);

  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0]?.chunkIndex, 0);
  assert.equal(chunks[1]?.chunkIndex, 1);
  assert.ok((chunks[0]?.tokenCount ?? 0) > 0);
});
