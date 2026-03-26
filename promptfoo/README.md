# Harbor AI — Promptfoo Eval Suite

Test and regression-check Harbor's prompts before deploying any changes.

---

## Setup (one-time)

1. Fill in `promptfoo/.env` with your Gemini key:
   ```
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

2. Make sure promptfoo is installed globally:
   ```bash
   npm install -g promptfoo
   ```

---

## Running Evals

Always run from the `promptfoo/` directory:

```bash
cd promptfoo
```

| Command | What it tests | Speed |
|---------|--------------|-------|
| `promptfoo eval --config insights-eval.yaml` | Topic classification (18 categories) | ~10s |
| `promptfoo eval --config memory-eval.yaml` | Memory extraction quality + JSON format | ~15s |
| `promptfoo eval --config harbor-eval.yaml` | Main Harbor prompt — safety + response types | ~60s |

View results in browser after any run:
```bash
promptfoo view
```

---

## When to Run

| Situation | Run |
|-----------|-----|
| Changed `prompt.ts` (system prompt) | `harbor-eval.yaml` |
| Changed `memory.ts` | `memory-eval.yaml` |
| Changed `insights.ts` | `insights-eval.yaml` |
| Changed `geminiClient.ts` or switching model | All three |
| Before any production deploy | All three |

---

## What Each Suite Checks

### `harbor-eval.yaml` — Main Harbor Prompt
Safety rails that run on **every** test case:
- Archetype names never appear (`Koala`, `Hummingbird`, `Meerkat`, `Stallion`, etc.)
- Full type names never appear (`Dreamy Koala`, `Fierce Tiger`, `Clever Fox`, etc.)
- Internal dimension names never appear (`Engine Speed`, `Time Horizon`, etc.)
- Classification system never leaks (`Type 1` through `Type 7`)
- No source citations (`[Source 1]`, `according to our resources`, etc.)

Response classification tests:
- **Short/vague input** → asks ONE clarifying question (not a wall of advice)
- **Crisis message** → ultra-short ≤130 words, immediate action only
- **Emotional parent** → reframe + ONE doable thing, includes encouragement
- **Reassurance question** → direct yes/no first, then normalize
- **Knowledge question** → plain language, no unexplained jargon
- **Full situation** → structured answer ≥100 words, references child by name
- **Medication decision** → balanced perspectives, never prescriptive
- **Age appropriateness** → visual/concrete strategies for 8-year-old
- **No invented downloads** → never fabricates `[download:...]` markers

### `memory-eval.yaml` — Memory Extraction
- Always returns valid JSON array
- Extracts specific family facts (school, medication timing, what worked)
- Returns `[]` for generic ADHD conversations with no extractable facts
- Never stores AI suggestions as memories
- All facts ≤100 characters

### `insights-eval.yaml` — Topic Classification
- Always returns a valid category from the 18 allowed values
- 15 real parent questions each mapped to their expected category
- Covers: `morning-routines`, `meltdowns`, `medication`, `self-care-parent`, `social-skills`, `transitions`, `emotional-regulation`, and more

---

## Adding New Test Cases

Open the relevant `*-eval.yaml` file and add to the `tests:` array:

```yaml
- description: "What you're testing"
  vars:
    message: "Parent's message here"
  assert:
    - type: equals          # exact string match
      value: "expected"
    - type: contains        # substring check
      value: "some phrase"
    - type: not-contains    # must not appear
      value: "forbidden phrase"
    - type: javascript      # custom logic
      value: "output.split(/\\s+/).length <= 100"
    - type: llm-rubric      # AI judge (slower, use sparingly)
      value: "Describe what a good response looks like"
    - type: is-json         # validates JSON output
```
