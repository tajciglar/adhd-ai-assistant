# Harbor RAG Setup and Implementation Guide

This document explains:

1. What changed in Harbor for AI responses
2. How the RAG pipeline works end-to-end
3. How to run and validate it locally
4. Key files to read if you want to learn the architecture

## What Was Implemented

Harbor chat now uses a **grounded RAG flow** instead of a placeholder response.

### High-level behavior

- User sends message to `POST /api/chat`
- API embeds the query
- API retrieves relevant chunks from your uploaded knowledge base (`knowledge_entries`)
- API builds a grounded prompt with strict rules
- API calls Gemini for answer generation
- API stores assistant answer and retrieval metadata in `messages.metadata`
- API returns assistant response to web app

### Grounding policy

- Answers must be based on retrieved Harbor content
- If no relevant content is found, Harbor returns:
  - `I don't have enough information in your current Harbor knowledge base to answer that confidently. Please upload content about this topic so I can help.`
- No hallucinated citations

## Database Changes

### New `knowledge_chunks` table

Each `knowledge_entries` row is chunked and embedded for vector search.

Fields:
- `id`
- `entry_id` (FK to `knowledge_entries`)
- `chunk_index`
- `text`
- `token_count`
- `embedding` (`vector(1536)`)
- `created_at`, `updated_at`

### `messages.metadata` added

Assistant metadata is saved in JSON:
- model
- grounded flag
- sources
- token usage
- optional error code

### Migration file

- `apps/api/prisma/migrations/20260302130000_add_rag_chunks_and_message_metadata/migration.sql`

Includes:
- `CREATE EXTENSION IF NOT EXISTS vector`
- `knowledge_chunks` table
- vector index
- `messages.metadata` JSONB column

## Environment Variables

Set these for API:

- `GEMINI_API_KEY` (required)
- `GEMINI_CHAT_MODEL` (optional, default `gemini-2.5-flash`)
- `GEMINI_EMBED_MODEL` (optional, default `text-embedding-004`)

Existing vars still required:
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Setup Steps (Local)

1. Install dependencies

```bash
pnpm install
```

2. Ensure env vars are set in your root `.env`

3. Apply DB migration and regenerate Prisma client

```bash
pnpm --filter @adhd-ai-assistant/api exec prisma migrate deploy
pnpm --filter @adhd-ai-assistant/api exec prisma generate
```

4. Run API and web

```bash
pnpm run dev:api
pnpm run dev:web
```

## How Indexing Works

Indexing runs in admin routes:

- `POST /api/admin/entries`
- `PUT /api/admin/entries/:id`
- `POST /api/admin/entries/bulk`

For each knowledge entry:

1. Text is split into overlapping chunks
2. Chunks are embedded via Gemini embeddings API
3. Chunk vectors are inserted into `knowledge_chunks`
4. On update, old chunks are deleted then rebuilt

Core file:
- `apps/api/src/services/ai/knowledgeIndex.ts`

## How Retrieval and Answering Works

### Retrieval

File:
- `apps/api/src/services/ai/retrieval.ts`

Flow:
1. Embed user query
2. Vector similarity search against `knowledge_chunks` (cosine distance)
3. Apply small keyword bonus
4. Filter low-confidence results
5. Return top sources

### Prompting

File:
- `apps/api/src/services/ai/prompt.ts`

Prompt includes:
- strict grounding instructions
- retrieved source blocks
- recent chat history
- parent profile context for personalization only

### Generation

Files:
- `apps/api/src/services/ai/openaiClient.ts` (Gemini client implementation)
- `apps/api/src/services/ai/answer.ts`

Notes:
- Non-streaming response path
- 20s request timeout
- fallback responses for retrieval or Gemini failures
- structured logging for retrieval count, latency, token usage

## API Route Integration

### Chat route

File:
- `apps/api/src/routes/chat.ts`

Key points:
- Enforces onboarding completion before chat
- Replaces placeholder assistant text with grounded RAG answer
- Saves assistant metadata into `messages.metadata`
- Returns metadata in API response

### Admin route

File:
- `apps/api/src/routes/admin.ts`

Key points:
- Automatically indexes new/updated/imported entries
- Handles indexing failures with safe error responses

## Frontend Impact

No UI rendering changes were made for citations/sources yet.

Type support added:
- `apps/web/src/types/chat.ts` now supports optional `Message.metadata`

## Suggested Validation Checklist

1. Import entries in `/admin` (single and bulk)
2. Ask a question that clearly matches imported content
3. Verify answer quality and that it references correct topic context
4. Ask out-of-scope question and verify no-content fallback message
5. Confirm chat history still loads and app behavior is unchanged

## Files to Study (Learning Path)

If you want to understand this quickly, read in this order:

1. `apps/api/src/routes/chat.ts`
2. `apps/api/src/services/ai/answer.ts`
3. `apps/api/src/services/ai/retrieval.ts`
4. `apps/api/src/services/ai/prompt.ts`
5. `apps/api/src/services/ai/knowledgeIndex.ts`
6. `apps/api/prisma/schema.prisma`
7. `apps/api/prisma/migrations/20260302130000_add_rag_chunks_and_message_metadata/migration.sql`



{
  "conversationId": "abc-123",
  "userMessage": {
    "id": "msg-1",
    "role": "USER",
    "content": "How do I handle morning meltdowns with my ADHD child?",
    "createdAt": "2026-03-03T10:00:00Z"
  },
  "assistantMessage": {
    "id": "msg-2",
    "role": "ASSISTANT",
    "content": "Morning meltdowns are common with ADHD children...",
    "createdAt": "2026-03-03T10:00:02Z",
    "metadata": {
      "model": "gemini-2.5-flash",
      "grounded": true,
      "sources": [...],
      "usage": { "promptTokens": 2100, ... }
    }
  }
}
```

The frontend renders the AI's answer and can optionally show the sources, model info, and token usage from metadata.

---

## The Complete Flow in One View
```
Frontend: POST /chat { message, conversationId? }
│
├─ chat.ts: authenticate → validate → check onboarding
│  ├─ find/create conversation
│  ├─ load last 8 messages as history
│  ├─ save user message to DB
│  │
│  ├─ answer.ts: generateGroundedAnswer()
│  │  │
│  │  ├─ retrieval.ts: retrieveRelevantKnowledge()
│  │  │  ├─ embed.ts → geminiClient.ts: embed the question → [1536 floats]
│  │  │  ├─ PostgreSQL + pgvector: find top 8 closest chunks
│  │  │  ├─ add keyword bonus scores
│  │  │  └─ filter out scores < 0.35, return sources
│  │  │
│  │  ├─ (if no sources → return "I don't have enough info" immediately)
│  │  │
│  │  ├─ fetch user profile (onboarding responses)
│  │  │
│  │  ├─ prompt.ts: buildGroundedPrompt()
│  │  │  └─ assemble: system rules + profile + sources + history + question
│  │  │
│  │  ├─ geminiClient.ts: createChatCompletion()
│  │  │  └─ POST to Gemini API → get AI response
│  │  │
│  │  └─ return { content, metadata: { sources, usage, model } }
│  │
│  ├─ save assistant message to DB (with metadata)
│  ├─ update conversation timestamp
│  └─ return response JSON to frontend
│
Frontend: render the AI's answer + sources