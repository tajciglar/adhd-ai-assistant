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
    reportTemplate: null,
    memories: [],
  });

  const promptText = prompt.map((m) => m.content).join("\n");
  // Should include source content (category markers)
  assert.ok(promptText.includes("Category: cat"));
  // Should include the system instructions
  assert.ok(promptText.includes("Harbor"));
  // Should include the Acknowledge/Advise/Encourage pattern
  assert.ok(promptText.includes("Acknowledge"));
  // History should be truncated (6 turns max + system messages + few-shot + question)
  assert.ok(prompt.length < 20);
});

test("buildGroundedPrompt includes archetype context when provided", () => {
  const prompt = buildGroundedPrompt({
    question: "How do I help with homework?",
    sources: [
      {
        entryId: "e1",
        title: "Homework tips",
        category: "School",
        chunkIndex: 0,
        text: "Break tasks into small steps.",
        score: 0.9,
      },
    ],
    child: {
      childName: "max",
      childAge: 8,
      childGender: "Male",
      traitProfile: {
        scores: {
          inattentive: 2.5,
          hyperactive: 1.8,
          sensory: 0.5,
          emotional: 1.0,
          executive_function: 0.8,
          social: 0.6,
        },
        archetypeId: "hummingbird",
      },
    },
    history: [],
    reportTemplate: {
      archetypeId: "hummingbird",
      title: "THE FLASH HUMMINGBIRD",
      innerVoiceQuote: "",
      animalDescription: "",
      aboutChild: "",
      hiddenSuperpower: "",
      brainSections: [],
      dayInLife: { morning: "", school: "", afterSchool: "", bedtime: "" },
      drains: ["Long periods of required stillness"],
      fuels: ["Regular movement breaks built into the day"],
      overwhelm: "The movement gets bigger when overwhelmed.",
      affirmations: ["Your energy is not a problem."],
      doNotSay: [
        {
          insteadOf: "Why can't you just sit still?",
          tryThis: "Let's find a way for you to move while we do this.",
        },
      ],
      closingLine: "",
    },
    memories: [],
  });

  const promptText = prompt.map((m) => m.content).join("\n");
  // Should contain archetype coaching guide content
  assert.ok(promptText.includes("ARCHETYPE COACHING GUIDE"));
  assert.ok(promptText.includes("WHAT HELPS THIS CHILD"));
  assert.ok(promptText.includes("movement breaks"));
  assert.ok(promptText.includes("WHAT DRAINS"));
  assert.ok(promptText.includes("stillness"));
  // Should contain child profile with age-aware development
  assert.ok(promptText.includes("Max"));
  assert.ok(promptText.includes("Early elementary"));
  // Should NOT contain archetype name
  assert.ok(!promptText.includes("Hummingbird"));
  assert.ok(!promptText.includes("Flash"));
});

test("buildGroundedPrompt includes memories when provided", () => {
  const prompt = buildGroundedPrompt({
    question: "How do I help with bedtime?",
    sources: [],
    child: null,
    history: [],
    reportTemplate: null,
    memories: [
      {
        fact: "Max struggles with bedtime transitions",
        category: "conversation",
        createdAt: new Date("2026-03-10"),
      },
      {
        fact: "Visual timers helped with homework",
        category: "conversation",
        createdAt: new Date("2026-03-09"),
      },
    ],
  });

  const promptText = prompt.map((m) => m.content).join("\n");
  assert.ok(promptText.includes("WHAT I REMEMBER"));
  assert.ok(promptText.includes("bedtime transitions"));
  assert.ok(promptText.includes("Visual timers"));
});
