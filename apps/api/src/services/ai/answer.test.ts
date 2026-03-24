import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeResourceMentions } from "./answer.js";

test("sanitizeResourceMentions removes fake plain download sentences when no real marker exists", () => {
  const content = [
    "Remember, the goal is to give him the quiet and space he needs to reset.",
    "",
    'You might find some more ideas in our resource on "magic moments" for tasks. [Download: Magic Moments Checklist]',
  ].join("\n");

  const result = sanitizeResourceMentions(content, []);

  assert.ok(result.includes("Remember, the goal"));
  assert.ok(!result.includes("Magic Moments Checklist"));
  assert.ok(!result.includes('our resource on "magic moments"'));
  assert.ok(!result.includes("[Download:"));
});

test("sanitizeResourceMentions keeps real download markers from retrieved sources", () => {
  const content =
    "Try a short reset first, then use this resource if it helps: [download:abc123:magic-moments.pdf]";

  const result = sanitizeResourceMentions(content, [
    {
      entryId: "1",
      title: "Magic Moments",
      category: "Resources",
      chunkIndex: 0,
      text: "Helpful PDF here [download:abc123:magic-moments.pdf]",
      score: 0.9,
    },
  ]);

  assert.ok(result.includes("[download:abc123:magic-moments.pdf]"));
});
