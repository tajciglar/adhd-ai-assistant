import { test } from "node:test";
import assert from "node:assert/strict";
import { rerankAndFilterSources } from "./retrieval.js";

test("rerankAndFilterSources dedupes and filters low scores", () => {
  const rows = [
    {
      entryId: "a",
      title: "Morning routine",
      category: "routines",
      chunkIndex: 0,
      text: "Content 1",
      score: 0.9,
    },
    {
      entryId: "a",
      title: "Morning routine",
      category: "routines",
      chunkIndex: 0,
      text: "Duplicate",
      score: 0.88,
    },
    {
      entryId: "b",
      title: "Unrelated",
      category: "other",
      chunkIndex: 0,
      text: "Low score",
      score: 0.1,
    },
  ];

  const result = rerankAndFilterSources(rows, "morning transitions", 0.35, 8);
  assert.equal(result.length, 1);
  assert.equal(result[0]?.entryId, "a");
});
