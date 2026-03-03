# ADHD AI Assistant — MVP Documentation

> **Last updated:** 2026-03-03
> **Repository:** `adhd-ai-assistant`
> **Package manager:** pnpm 10.29.2 (monorepo workspaces)
> **Branch strategy:** feature branches → `main` via PR

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [AI / RAG Pipeline](#6-ai--rag-pipeline)
7. [Security](#7-security)
8. [Environment Variables](#8-environment-variables)
9. [Scripts & Commands](#9-scripts--commands)
10. [Infrastructure Setup Guides](#10-infrastructure-setup-guides)
11. [Branches & Feature Log](#11-branches--feature-log)
12. [MVP Roadmap](#12-mvp-roadmap)

---

## 1. Project Overview

**Harbor** — "A calm space in the chaos."

An AI-powered assistant designed specifically for parents of children with ADHD. The system provides:

- **37-step onboarding** — 6 basic-info questions + 31 Likert-scale trait assessment across 6 ADHD dimensions, auto-advancing one question per screen
- **Trait profiling** — server-side scoring computes a 6-dimension profile (0-18 per dimension) and matches one of 21 animal archetypes
- **Grounded AI chat** — Gemini 2.5 Flash with RAG (Retrieval-Augmented Generation), strictly grounded in a curated knowledge base
- **Admin panel** — knowledge base management with bulk import, auto-indexing via pgvector

**Current state:** Fully functional end-to-end — auth, onboarding assessment, AI chat with RAG grounding, admin knowledge base management, rate limiting, and security hardening.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22+ |
| **Language** | TypeScript | 5.7+ |
| **API Framework** | Fastify | 5.2 |
| **ORM** | Prisma | 6.4 |
| **Database** | PostgreSQL (Supabase-hosted) + pgvector | 15+ |
| **Authentication** | Supabase Auth (JWT, email/password only) | 2.49 |
| **AI Chat Model** | Gemini 2.5 Flash | — |
| **AI Embedding Model** | text-embedding-004 (1536-dim) | — |
| **Vector Search** | pgvector with IVFFlat index | — |
| **Validation** | Zod | 3.24 |
| **Rate Limiting** | @fastify/rate-limit | 10.3 |
| **CORS** | @fastify/cors | 11.0 |
| **Frontend** | React 19 + Vite 7 + Tailwind CSS v4 | — |
| **Animations** | Framer Motion | — |
| **Logging** | Pino (via Fastify) + pino-pretty | — |
| **Monorepo** | pnpm workspaces | 10.29 |
| **Shared Package** | `packages/shared` (assessment data, scoring) | — |
| **Deployment** | Railway (Docker) | — |

---

## 3. Project Structure

```
adhd-ai-assistant/
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # Declares apps/* + packages/* as workspaces
├── pnpm-lock.yaml
├── Dockerfile                    # Multi-stage build for Railway
├── .dockerignore
├── railway.toml                  # Railway deployment config
├── ADHD_AI_ASSISTANT_MVP.md      # This file
│
├── apps/
│   ├── api/                      # Backend API server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 8 models + MessageRole enum + pgvector
│   │   │   └── migrations/       # Auto-generated SQL migrations
│   │   └── src/
│   │       ├── server.ts         # Entry point — Fastify bootstrap + rate limiting
│   │       ├── plugins/
│   │       │   ├── prisma.ts     # Prisma client lifecycle plugin
│   │       │   └── supabase.ts   # Supabase Auth + authenticate preHandler
│   │       ├── routes/
│   │       │   ├── health.ts     # GET /health (public)
│   │       │   ├── onboarding.ts # GET/PATCH/POST /api/onboarding (auth)
│   │       │   ├── chat.ts       # POST /api/chat + conversation CRUD (auth)
│   │       │   ├── user.ts       # GET /api/user/me (auth)
│   │       │   └── admin.ts      # Knowledge base CRUD (admin only)
│   │       └── services/ai/
│   │           ├── geminiClient.ts   # Gemini API wrapper (chat + batch embeddings)
│   │           ├── answer.ts         # Grounded answer generation pipeline
│   │           ├── prompt.ts         # System prompt + context builder
│   │           ├── retrieval.ts      # Semantic search via pgvector
│   │           ├── embed.ts          # Batch embedding with retry logic
│   │           ├── chunking.ts       # Text chunking (700 tokens, 100 overlap)
│   │           └── knowledgeIndex.ts # Entry indexing pipeline (transaction)
│   │
│   └── web/                      # Frontend React app
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── App.tsx           # Router + auth guard
│           ├── lib/              # supabase.ts, api.ts, constants.ts
│           ├── hooks/            # useAuth, useOnboarding, useChat, useDebounce
│           ├── components/
│           │   ├── auth/         # AuthPage (custom email/password form)
│           │   ├── onboarding/   # 37-step assessment flow
│           │   │   ├── OnboardingPage.tsx
│           │   │   ├── OnboardingLayout.tsx
│           │   │   ├── StepRenderer.tsx
│           │   │   ├── AnimationWrapper.tsx
│           │   │   ├── MicroCopy.tsx
│           │   │   └── questions/ (SingleSelect, TextInput, NumberInput, LikertSelect)
│           │   ├── chat/         # ChatPage, ChatSidebar, ChatInput, ChatMessage
│           │   ├── admin/        # AdminPage, EntryList, EntryEditor, BulkImport
│           │   └── ui/           # Button, ProgressBar, SaveIndicator
│           └── types/            # onboarding.ts, chat.ts
│
├── packages/
│   └── shared/                   # Shared assessment data + scoring logic
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts          # Public exports
│           └── assessment.ts     # 6 categories, 31 questions, 21 archetypes, scoring
│
└── docs/
    ├── architecture.md
    ├── ui-ux.md
    └── rag-setup.md
```

---

## 4. Database Schema

### Models

| Model | Description |
|-------|-------------|
| **User** | Linked to Supabase Auth JWT, has role (user/admin) |
| **UserProfile** | ADHD profile, 37-step onboarding responses (JSONB), trait profile (JSONB) |
| **Conversation** | Chat conversations per user |
| **Message** | Chat messages with role enum + AI metadata (JSONB) |
| **BlogPost** | Blog content with tags |
| **KnowledgeEntry** | RAG knowledge base articles with category |
| **KnowledgeChunk** | Chunked text with 1536-dim pgvector embeddings |

### Key Fields

**UserProfile** — Assessment & Traits:
- `onboardingResponses` (JSONB) — all 37 step responses
- `onboardingStep` (Int) — current step for resume
- `onboardingCompleted` (Boolean)
- `traitProfile` (JSONB) — computed scores per dimension + matched archetype

**Message** — AI Metadata:
- `metadata` (JSONB) — `{ model, grounded, sources[], usage { promptTokens, completionTokens }, errorCode? }`

**KnowledgeChunk** — Vector Search:
- `embedding` (vector(1536)) — pgvector column with IVFFlat cosine index
- `tokenCount` (Int) — estimated token count per chunk

---

## 5. API Endpoints

**Base URL:** `http://localhost:3001` (dev)

All protected routes require `Authorization: Bearer <supabase-access-token>`.

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check with DB connectivity |

### Auth Required
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/onboarding` | Get current onboarding progress |
| PATCH | `/api/onboarding` | Save a single step answer (autosave) |
| POST | `/api/onboarding/complete` | Compute trait profile + mark done |
| GET | `/api/user/me` | Get current user profile |
| POST | `/api/chat` | Send message, get grounded AI response (rate limited: 20/min) |
| GET | `/api/conversations` | List user's conversations |
| GET | `/api/conversations/:id/messages` | Get conversation messages |
| DELETE | `/api/conversations/:id` | Delete a conversation |

### Admin Only (role = "admin")
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/entries` | List knowledge entries (optional ?category filter) |
| GET | `/api/admin/entries/:id` | Get single entry |
| POST | `/api/admin/entries` | Create + auto-index entry |
| PUT | `/api/admin/entries/:id` | Update + re-index entry |
| DELETE | `/api/admin/entries/:id` | Delete entry (chunks cascade) |
| POST | `/api/admin/entries/bulk` | Bulk import up to 500 entries |

---

## 6. AI / RAG Pipeline

### Architecture

```
User Question
    │
    ▼
┌─────────────────┐     ┌──────────────────────┐
│  Embed Query     │────▶│  pgvector Similarity  │
│  (Gemini 004)    │     │  Search (top 8)       │
└─────────────────┘     └──────┬───────────────┘
                               │
                     ┌─────────▼─────────┐
                     │  Keyword Bonus     │
                     │  + Score Filtering │
                     │  (min 0.35)        │
                     └─────────┬─────────┘
                               │
              ┌────────────────▼────────────────┐
              │  Build Grounded Prompt           │
              │  • System instructions           │
              │  • Parent profile (personalize)  │
              │  • Knowledge sources (ground)    │
              │  • Last 8 messages (history)     │
              │  • Current question              │
              └────────────────┬────────────────┘
                               │
                     ┌─────────▼─────────┐
                     │  Gemini 2.5 Flash  │
                     │  (temp 0.2)        │
                     └─────────┬─────────┘
                               │
                     ┌─────────▼─────────┐
                     │  Grounded Answer   │
                     │  + Source Metadata  │
                     │  + Token Usage      │
                     └───────────────────┘
```

### Key Design Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Embedding | Gemini text-embedding-004 (1536-dim) | Stable, good quality, batch API |
| Chat | Gemini 2.5 Flash | Fast, cost-effective for grounded QA |
| Vector Index | IVFFlat cosine distance | Fast approximate search |
| Chunking | 700 tokens, 100 overlap | Context balance |
| Temperature | 0.2 | Factual, deterministic |
| Grounding | Strict (no hallucination) | Critical for parenting advice |
| Batch Embeddings | `batchEmbedContents` API | Single API call for all chunks |
| Chunk Storage | Transactional bulk insert | Atomic delete + insert |

---

## 7. Security

### Implemented
- **Rate limiting** — Global: 100 req/min per user. Chat endpoint: 20 req/min per user (`@fastify/rate-limit`)
- **Max messages per conversation** — 200 message cap prevents unbounded growth
- **Auth on all routes** — Supabase JWT verification via `authenticate` preHandler
- **Admin role check** — `requireAdmin()` verifies `user.role === 'admin'`
- **Onboarding gate** — Chat requires `onboardingCompleted === true`
- **Input validation** — Zod schemas on all POST/PATCH/PUT bodies
- **CORS** — Origin locked, configurable via `CORS_ORIGIN`
- **API key protection** — Gemini API errors sanitized to prevent key leakage in logs
- **Request timeout** — 20s abort on all Gemini API calls
- **Strict grounding** — AI instructed to never invent facts
- **Error masking** — Global error handler hides 500 details from clients

---

## 8. Environment Variables

Located in `apps/api/.env` (git-ignored).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection (Supabase pooled, port 6543) |
| `DIRECT_URL` | Yes | — | PostgreSQL direct connection (port 5432, for migrations) |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous/public key |
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key |
| `GEMINI_CHAT_MODEL` | No | `gemini-2.5-flash` | Chat model |
| `GEMINI_EMBED_MODEL` | No | `text-embedding-004` | Embedding model |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `3001` | API server port |
| `HOST` | No | `0.0.0.0` | API server bind address |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |

---

## 9. Scripts & Commands

### Root (from repo root)

| Command | Description |
|---------|-------------|
| `pnpm dev:api` | Start API in dev mode (hot reload) |
| `pnpm build:api` | TypeScript compile API to `dist/` |

### API workspace (from `apps/api/`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with tsx watch |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run compiled JS (runs `prisma generate` + `migrate deploy` first) |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:migrate` | Create/apply migrations |
| `pnpm prisma:studio` | Open Prisma Studio GUI |

### Docker

| Command | Description |
|---------|-------------|
| `docker compose up` | Start PostgreSQL 16 + API with hot reload |
| `docker build -t adhd-api .` | Build production image |

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create apps/api/.env (see Environment Variables section)

# 3. Run database migrations
pnpm --filter @adhd-ai-assistant/api prisma:migrate

# 4. Start dev servers
pnpm dev:api    # API on :3001
pnpm dev:web    # Web on :3000
```

---

## 10. Infrastructure Setup Guides

### 10.1 Supabase Setup

1. Create project at **supabase.com**
2. Get connection strings: **Settings → Database** (pooled for `DATABASE_URL`, direct for `DIRECT_URL`)
3. Get API keys: **Settings → API** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
4. Configure auth: **Authentication → Providers** (email enabled by default)
5. Apply migrations: `cd apps/api && npx prisma migrate deploy`

### 10.2 Railway Setup

1. Deploy from GitHub repo at **railway.com**
2. Set environment variables (DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY, NODE_ENV=production, CORS_ORIGIN)
3. Railway reads `railway.toml` for health checks + restart policy
4. Generate domain under **Networking**

---

## 11. Branches & Feature Log

| Date | Branch/PR | Description |
|------|-----------|-------------|
| 2026-02-26 | `claude/goofy-khorana` | Backend API server setup (Fastify, Prisma, 6 models) |
| 2026-02-26 | `supabase-railway-setup` | Supabase Auth + Railway deployment |
| 2026-02-27 | `claude/hardcore-tharp` | Docker Prisma fixes, prestart script |
| 2026-03-01 | `claude/hopeful-leakey` | Chat UI, Admin Panel, knowledge base management |
| 2026-03-02 | main | Implement grounded OpenAI RAG pipeline |
| 2026-03-02 | main | Switch RAG provider to Gemini 2.5 Flash |
| 2026-03-03 | `claude/hopeful-leakey` | 37-step ADHD trait assessment onboarding |
| 2026-03-03 | `security/high-priority-fixes` | Rate limiting, API key protection, batch embeddings, transactional indexing |

---

## 12. MVP Roadmap

### Phase 1: Backend Foundation ✅
- [x] Fastify server with TypeScript
- [x] PostgreSQL + Prisma ORM
- [x] User onboarding API
- [x] Chat API (message persistence)
- [x] Zod validation, error handling, logging

### Phase 2: AI Integration ✅
- [x] Gemini 2.5 Flash chat integration
- [x] RAG pipeline with pgvector semantic search
- [x] Pass user profile context for personalization
- [x] Conversation history context (last 8 messages)
- [x] System prompt tailored for ADHD parenting support
- [x] Strict grounding — no hallucination policy

### Phase 3: Knowledge Base ✅
- [x] CRUD API for KnowledgeEntry (admin only)
- [x] Bulk import (up to 500 entries)
- [x] Auto-chunking + embedding on create/update
- [x] pgvector semantic search with keyword bonus

### Phase 4: Authentication & Security ✅
- [x] Supabase Auth (email/password, JWT)
- [x] Rate limiting (global + per-endpoint)
- [x] Max messages per conversation
- [x] API key leak protection
- [x] Admin role enforcement
- [x] Input validation on all routes

### Phase 5: Frontend ✅
- [x] React 19 + Vite + Tailwind CSS v4
- [x] Custom auth form (signup/login)
- [x] 37-step onboarding assessment with auto-advance
- [x] Chat interface with conversation sidebar
- [x] Admin panel with knowledge base management

### Phase 6: Production Readiness (partial)
- [ ] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization
- [x] Railway deployment with health checks
- [ ] Monitoring & alerting
- [ ] Database backups strategy
- [ ] API documentation (OpenAPI)

---

_This document is the single source of truth for the ADHD AI Assistant MVP. Update it with every PR merge._
