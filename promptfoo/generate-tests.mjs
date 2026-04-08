/**
 * Reads the CSV of tested questions and generates a promptfoo YAML eval file.
 * Run: node promptfoo/generate-tests.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const CSV_PATH =
  "/Users/tajbrzovic/Downloads/ADHD Parenting Topics - FINAL Questions.csv";
const OUT_PATH = new URL("./csv-questions-eval.yaml", import.meta.url)
  .pathname;

// ── Minimal RFC-4180 CSV parser ──────────────────────────────────────────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ── YAML helpers ─────────────────────────────────────────────────────────────
function yamlStr(s) {
  // Use block scalar for multiline, quoted scalar otherwise
  const safe = s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${safe}"`;
}

function indent(s, spaces) {
  return s
    .split("\n")
    .map((l) => " ".repeat(spaces) + l)
    .join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────
const raw = readFileSync(CSV_PATH, "utf8");
const rows = parseCSV(raw);

// Header row: Master Module Name, Actual Question, Content, Tested, Covered, Response review, Revise
const [header, ...data] = rows;
const COL_MODULE = 0;
const COL_QUESTION = 1;
const COL_TESTED = 3;
const COL_REVIEW = 5;

// Filter: must be tested and have a non-empty question
const tested = data.filter((r) => {
  const tested = (r[COL_TESTED] || "").toUpperCase().includes("YES");
  const question = (r[COL_QUESTION] || "").trim();
  return tested && question.length > 0;
});

console.log(`Total tested questions: ${tested.length}`);

// ── Build YAML ───────────────────────────────────────────────────────────────
const testCases = tested
  .map((r) => {
    const module = (r[COL_MODULE] || "General").trim();
    const question = (r[COL_QUESTION] || "").trim();
    const review = (r[COL_REVIEW] || "").trim();

    // Escape for YAML double-quoted scalar
    const qEsc = question.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const desc = `${module}: ${question.slice(0, 60)}${question.length > 60 ? "..." : ""}`;
    const descEsc = desc.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    // Build per-case rubric hint from existing review if available
    // Must be at 10-space indent to stay inside the block scalar
    const reviewHint = review
      ? `\n          Previous review flagged: ${review.replace(/["\n\r]/g, " ").slice(0, 120)}. Make sure the new response avoids that issue.`
      : "";

    const wordCount = question.split(/\s+/).filter(Boolean).length;
    const expectsClarification = wordCount < 10;

    const rubricBase = expectsClarification
      ? `The response may either ask a clarifying question OR give advice — both are acceptable.
          If it asks a clarifying question: it should be focused, 1-3 sentences, and ideally offer
          2-3 options (e.g. "does he X, Y, or Z?"). It must NOT open with a warmup like
          "That sounds exhausting" or "It can be hard when".
          If it gives advice: the first sentence must be an ADHD brain mechanism or a direct action,
          not a warmup or a description of the child's struggle.`
      : `The first sentence must be an ADHD brain mechanism or a direct action — NOT a warmup.
          FAIL if the first sentence:
          - Describes the child's behavior without naming the ADHD brain mechanism
          - Opens with "It can be [adjective] when..."
          - Uses "is common with ADHD" as a standalone opener
          - Says "[child] struggles with X" without explaining WHY (the brain/dopamine reason)
          PASS if the first sentence names the ADHD brain process (even using "struggles" is fine
          if it includes a brain/dopamine explanation) OR opens with a direct technique.`;

    return `  - description: "${descEsc}"
    vars:
      message: "${qEsc}"
    assert:
      - type: javascript
        value: "output.split(/\\\\s+/).filter(Boolean).length <= 250"
        threshold: 1
      - type: llm-rubric
        value: >
          ${rubricBase}
          If the question is asking HOW something works or WHAT something is (knowledge/conceptual),
          a clear explanation without techniques is acceptable — no technique count required.
          Otherwise the response should give 2-3 techniques with concrete examples of what to say.
          The response feels warm and conversational, not like a textbook.${reviewHint}`;
  })
  .join("\n\n");

const yaml = `# Auto-generated from CSV — do not edit by hand
# Regenerate: node promptfoo/generate-tests.mjs
# Run eval:   npx promptfoo eval --config promptfoo/csv-questions-eval.yaml

description: Harbor CSV questions eval (${tested.length} tested questions)

providers:
  - file://gemini-provider.mjs

prompts:
  - file://prompts/harbor-messages.yaml

# Use gpt-4o for grading llm-rubric assertions (more accurate than gpt-4o-mini; Gemini grader has a bug in promptfoo v0.121.3)
defaultTest:
  options:
    provider: openai:gpt-4o
  assert:
    # ── Safety rails (must never leak) ───────────────────────────────────────
    - type: not-contains
      value: "Koala"
    - type: not-contains
      value: "Hummingbird"
    - type: not-contains
      value: "Meerkat"
    - type: not-contains
      value: "Stallion"
    - type: not-contains
      value: "Hedgehog"
    - type: not-contains
      value: "Red Panda"
    - type: not-contains
      value: "Penguin"
    - type: not-contains
      value: "Octopus"
    - type: not-contains
      value: "Swan"
    - type: not-contains
      value: "Bunny"
    - type: not-contains
      value: "Engine Speed"
    - type: not-contains
      value: "Time Horizon"
    - type: not-contains
      value: "Social Radar"
    - type: not-contains
      value: "Emotional Thermostat"
    - type: not-contains
      value: "Sensory Filter"
    - type: not-contains
      value: "[Source"
    - type: not-contains
      value: "according to our resources"
    # ── Quality rails (new rules) ─────────────────────────────────────────────
    - type: not-icontains
      value: "that sounds exhausting"
    - type: not-icontains
      value: "it's so hard when"
    - type: not-icontains
      value: "so many parents"
    - type: not-icontains
      value: "i hear you"
    - type: not-icontains
      value: "you're not alone"

tests:
${testCases}
`;

writeFileSync(OUT_PATH, yaml, "utf8");
console.log(`Written: ${OUT_PATH}`);
console.log(`Run eval: npx promptfoo eval --config promptfoo/csv-questions-eval.yaml --no-cache`);
