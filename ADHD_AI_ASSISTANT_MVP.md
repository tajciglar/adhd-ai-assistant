# ADHD AI Assistant — MVP Documentation

> **Last updated:** 2026-02-26
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
6. [Environment Variables](#6-environment-variables)
7. [Scripts & Commands](#7-scripts--commands)
8. [Branches & Feature Log](#8-branches--feature-log)
9. [MVP Roadmap](#9-mvp-roadmap)

---

## 1. Project Overview

An AI-powered assistant designed specifically for people with ADHD. The system provides onboarding (capturing ADHD subtype, personal struggles, sensory triggers, goals), conversational chat with an AI assistant, and a knowledge base for ADHD-related content.

**Current state:** Backend API is scaffolded and functional with PostgreSQL. AI chat integration is stubbed and ready for provider hookup.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22+ |
| **Language** | TypeScript | 5.7+ |
| **API Framework** | Fastify | 5.2 |
| **ORM** | Prisma | 6.4 |
| **Database** | PostgreSQL | 14+ |
| **Validation** | Zod | 3.24 |
| **CORS** | @fastify/cors | 11.0 |
| **Logging** | Pino (via Fastify) + pino-pretty | — |
| **Dev runner** | tsx (watch mode) | 4.19 |
| **Monorepo** | pnpm workspaces | 10.29 |

---

## 3. Project Structure

```
adhd-ai-assistant/
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # Declares apps/* as workspaces
├── pnpm-lock.yaml
│
├── apps/
│   └── api/                      # Backend API server
│       ├── package.json          # @adhd-ai-assistant/api
│       ├── tsconfig.json         # ES2022, strict, ESM
│       ├── .env                  # Local env vars (git-ignored)
│       │
│       ├── prisma/
│       │   ├── schema.prisma     # 6 models + MessageRole enum
│       │   └── migrations/       # Auto-generated SQL migrations
│       │
│       └── src/
│           ├── server.ts         # Entry point — Fastify bootstrap
│           ├── plugins/
│           │   └── prisma.ts     # Prisma client lifecycle plugin
│           └── routes/
│               ├── health.ts     # GET /health
│               ├── onboarding.ts # POST /api/onboarding
│               └── chat.ts       # POST /api/chat
│
└── .claude/
    └── launch.json               # Dev server launch config
```

---

## 4. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       1:1       ┌──────────────────┐
│     User     │────────────────▶│   UserProfile     │
│              │                 │                    │
│ id (uuid)    │                 │ id (uuid)          │
│ email        │                 │ userId (FK)        │
│ createdAt    │                 │ adhdType           │
│ updatedAt    │                 │ struggles[]        │
└──────┬───────┘                 │ sensoryTriggers[]  │
       │                         │ goals[]            │
       │ 1:N                     │ onboardingCompleted│
       │                         │ createdAt          │
       ▼                         │ updatedAt          │
┌──────────────┐                 └──────────────────┘
│ Conversation │
│              │
│ id (uuid)    │
│ userId (FK)  │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ 1:N
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Message    │     │   BlogPost   │     │  KnowledgeEntry  │
│              │     │              │     │                  │
│ id (uuid)    │     │ id (uuid)    │     │ id (uuid)        │
│ convId (FK)  │     │ title        │     │ title            │
│ role (enum)  │     │ content      │     │ content          │
│ content      │     │ tags[]       │     │ category         │
│ createdAt    │     │ createdAt    │     │ createdAt        │
└──────────────┘     │ updatedAt    │     │ updatedAt        │
                     └──────────────┘     └──────────────────┘
```

### Models Detail

#### User
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key, auto-generated |
| `email` | String | Unique |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |
| **Relations** | `profile` (1:1 UserProfile), `conversations` (1:N) | Cascade delete |

#### UserProfile
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | FK → User, unique |
| `adhdType` | String | "inattentive" / "hyperactive" / "combined" |
| `struggles` | String[] | Default `[]` |
| `sensoryTriggers` | String[] | Default `[]` |
| `goals` | String[] | Default `[]` |
| `onboardingCompleted` | Boolean | Default `false` |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

#### Conversation
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `userId` | UUID | FK → User, indexed |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |
| **Relations** | `messages` (1:N Message) | Cascade delete |

#### Message
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `conversationId` | UUID | FK → Conversation, indexed |
| `role` | MessageRole | Enum: `USER` or `ASSISTANT` |
| `content` | String | Message body |
| `createdAt` | DateTime | Auto-set |

#### BlogPost
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `title` | String | — |
| `content` | String | — |
| `tags` | String[] | Default `[]` |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

#### KnowledgeEntry
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `title` | String | — |
| `content` | String | — |
| `category` | String | Indexed for fast lookups |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

---

## 5. API Endpoints

**Base URL:** `http://localhost:3001`

### GET /health

Health check with database connectivity verification.

| | |
|---|---|
| **Auth** | None |
| **Success** | `200` |
| **Failure** | `503` (database unreachable) |

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-02-26T13:12:52.969Z"
}
```

**Response (503):**
```json
{
  "status": "error",
  "message": "Database connection failed"
}
```

---

### POST /api/onboarding

Creates a new user and their ADHD profile. Idempotent for user creation — if the email exists but onboarding is incomplete, it completes it.

| | |
|---|---|
| **Auth** | None (MVP) |
| **Content-Type** | `application/json` |
| **Success** | `201` |
| **Errors** | `400` (validation), `409` (already onboarded) |

**Request Body:**
```json
{
  "email": "user@example.com",
  "adhdType": "combined",
  "struggles": ["focus", "time management"],
  "sensoryTriggers": ["loud noises"],
  "goals": ["better focus", "daily routine"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email |
| `adhdType` | string | Yes | `"inattentive"` \| `"hyperactive"` \| `"combined"` |
| `struggles` | string[] | Yes | 1–20 items, each non-empty |
| `sensoryTriggers` | string[] | No | 0–20 items, defaults to `[]` |
| `goals` | string[] | Yes | 1–20 items, each non-empty |

**Response (201):**
```json
{
  "user": {
    "id": "fda99d35-fc86-477b-8734-11f6688330d6",
    "email": "user@example.com",
    "createdAt": "2026-02-26T13:12:53.044Z"
  },
  "profile": {
    "id": "226e27a8-9b27-4ea8-8849-d17feb14166b",
    "adhdType": "combined",
    "struggles": ["focus", "time management"],
    "sensoryTriggers": ["loud noises"],
    "goals": ["better focus", "daily routine"],
    "onboardingCompleted": true
  }
}
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": {
    "email": ["Invalid email"],
    "adhdType": ["Required"],
    "struggles": ["Required"],
    "goals": ["Required"]
  }
}
```

**Response (409):**
```json
{
  "error": "User has already completed onboarding"
}
```

---

### POST /api/chat

Sends a message and receives an AI assistant response. Creates a new conversation if `conversationId` is not provided.

| | |
|---|---|
| **Auth** | None (MVP) |
| **Content-Type** | `application/json` |
| **Success** | `200` |
| **Errors** | `400` (validation), `404` (user/conversation not found) |

**Request Body:**
```json
{
  "userId": "fda99d35-fc86-477b-8734-11f6688330d6",
  "message": "I need help focusing today",
  "conversationId": "cc25162f-836e-4202-be15-a83aee2f8dcb"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `userId` | string | Yes | Valid UUID |
| `message` | string | Yes | 1–5000 characters |
| `conversationId` | string | No | Valid UUID, omit to start new conversation |

**Response (200):**
```json
{
  "conversationId": "cc25162f-836e-4202-be15-a83aee2f8dcb",
  "userMessage": {
    "id": "e040607d-2be2-45a4-8f88-6870f06948e9",
    "role": "USER",
    "content": "I need help focusing today",
    "createdAt": "2026-02-26T13:13:03.658Z"
  },
  "assistantMessage": {
    "id": "06008712-19e5-4474-bc10-127c84b23ea2",
    "role": "ASSISTANT",
    "content": "I received your message. AI integration is pending.",
    "createdAt": "2026-02-26T13:13:03.660Z"
  }
}
```

**Response (404):**
```json
{
  "error": "User not found"
}
```

> **Note:** The assistant response is currently a placeholder. AI provider integration (e.g. Anthropic Claude API, OpenAI) is the next milestone.

---

## 6. Environment Variables

Located in `apps/api/.env` (git-ignored).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `3001` | API server port |
| `HOST` | No | `0.0.0.0` | API server bind address |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |

**Example `.env`:**
```env
DATABASE_URL="postgresql://username@localhost:5432/adhd_ai_assistant_dev"
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

---

## 7. Scripts & Commands

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
| `pnpm start` | Run compiled JS (production) |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:migrate` | Create/apply migrations |
| `pnpm prisma:studio` | Open Prisma Studio GUI |

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create apps/api/.env with DATABASE_URL

# 3. Run database migrations
pnpm --filter @adhd-ai-assistant/api prisma:migrate

# 4. Start dev server
pnpm dev:api
```

---

## 8. Branches & Feature Log

### `main`
> Stable branch. All features merge here via PR.

| Date | PR | Description |
|------|-----|-------------|
| 2026-02-26 | — | Initial commit (empty repo + .gitignore) |

---

### `claude/goofy-khorana` → PR pending
> **Feature: Backend API Server Setup**

**Changes:**
- [x] Initialized pnpm monorepo workspace (`apps/*`)
- [x] Created `apps/api/` Fastify server (TypeScript, ESM)
- [x] Added Prisma ORM with PostgreSQL
  - [x] `User` model (email, timestamps)
  - [x] `UserProfile` model (adhdType, struggles, sensoryTriggers, goals)
  - [x] `Conversation` model (userId relation)
  - [x] `Message` model (role enum: USER/ASSISTANT)
  - [x] `BlogPost` model (title, content, tags)
  - [x] `KnowledgeEntry` model (title, content, category)
  - [x] Initial migration applied
- [x] Added API routes with Zod validation
  - [x] `GET /health` — DB connectivity check
  - [x] `POST /api/onboarding` — user + profile creation
  - [x] `POST /api/chat` — conversation + message management
- [x] @fastify/cors configured
- [x] Pino structured logging (pino-pretty for dev)
- [x] Global error handler (validation vs server errors)
- [x] Graceful shutdown (SIGINT/SIGTERM)

**Files added/modified:** 14 files, +1646 lines

---

### `<branch-name>` → PR #
> **Feature: _______**

**Changes:**
- [ ] _Change description_
- [ ] _Change description_

---

### `<branch-name>` → PR #
> **Feature: _______**

**Changes:**
- [ ] _Change description_
- [ ] _Change description_

---

## 9. MVP Roadmap

### Phase 1: Backend Foundation ✅
- [x] Fastify server with TypeScript
- [x] PostgreSQL + Prisma ORM
- [x] User onboarding API
- [x] Chat API (message persistence)
- [x] Health check
- [x] Zod validation on all routes
- [x] Error handling + logging

### Phase 2: AI Integration
- [ ] Connect AI provider (Claude / OpenAI) to chat route
- [ ] Pass user profile context (ADHD type, struggles, goals) to AI
- [ ] Implement conversation history context window
- [ ] Add system prompt tailored for ADHD support
- [ ] Token/rate limiting

### Phase 3: Knowledge Base & Content
- [ ] CRUD API for `BlogPost`
- [ ] CRUD API for `KnowledgeEntry`
- [ ] Search/filter endpoints (by category, tags)
- [ ] Seed initial ADHD knowledge content

### Phase 4: Authentication & Security
- [ ] Auth provider integration (e.g. Clerk, Auth.js, Supabase Auth)
- [ ] JWT/session middleware on protected routes
- [ ] Rate limiting per user
- [ ] Input sanitization

### Phase 5: Frontend
- [ ] Next.js / React app in `apps/web/`
- [ ] Onboarding flow UI
- [ ] Chat interface
- [ ] Blog/knowledge base pages
- [ ] Responsive mobile-first design

### Phase 6: Production Readiness
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Docker Compose for local dev
- [ ] Deployment config (Railway / Vercel / Fly.io)
- [ ] Monitoring & alerting
- [ ] Database backups
- [ ] API documentation (Swagger/OpenAPI)

---

_This document is the single source of truth for the ADHD AI Assistant MVP. Update it with every PR merge._
