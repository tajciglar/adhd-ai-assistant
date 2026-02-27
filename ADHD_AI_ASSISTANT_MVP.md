# ADHD AI Assistant — MVP Documentation

> **Last updated:** 2026-02-27
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
8. [Infrastructure Setup Guides](#8-infrastructure-setup-guides)
9. [Branches & Feature Log](#9-branches--feature-log)
10. [MVP Roadmap](#10-mvp-roadmap)

---

## 1. Project Overview

An AI-powered assistant designed specifically for people with ADHD. The system provides onboarding (capturing ADHD subtype, personal struggles, sensory triggers, goals), conversational chat with an AI assistant, and a knowledge base for ADHD-related content.

**Current state:** Backend API is scaffolded and functional with Supabase Auth (JWT), Supabase-hosted PostgreSQL, and Railway deployment configuration. AI chat integration is stubbed and ready for provider hookup.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 22+ |
| **Language** | TypeScript | 5.7+ |
| **API Framework** | Fastify | 5.2 |
| **ORM** | Prisma | 6.4 |
| **Database** | PostgreSQL (Supabase-hosted) | 15+ |
| **Authentication** | Supabase Auth (JWT) | 2.49 |
| **Validation** | Zod | 3.24 |
| **CORS** | @fastify/cors | 11.0 |
| **Logging** | Pino (via Fastify) + pino-pretty | — |
| **Dev runner** | tsx (watch mode) | 4.19 |
| **Monorepo** | pnpm workspaces | 10.29 |
| **Deployment** | Railway (Docker) | — |
| **Containerization** | Docker (multi-stage) | — |

---

## 3. Project Structure

```
adhd-ai-assistant/
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # Declares apps/* as workspaces
├── pnpm-lock.yaml
├── Dockerfile                    # Multi-stage build for Railway
├── .dockerignore                 # Docker build exclusions
├── railway.toml                  # Railway deployment config
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
│           │   ├── prisma.ts     # Prisma client lifecycle plugin
│           │   └── supabase.ts   # Supabase Auth + authenticate preHandler
│           └── routes/
│               ├── health.ts     # GET /health (public)
│               ├── onboarding.ts # POST /api/onboarding (auth required)
│               └── chat.ts       # POST /api/chat (auth required)
│
└── .claude/
    └── launch.json               # Dev server launch config
```

---

## 4. Database Schema

### Entity Relationship Diagram

```
  Supabase auth.users
         │
         │ id (UUID) ──────────┐
         │                     │
         ▼                     ▼
┌──────────────┐       1:1       ┌──────────────────┐
│     User     │────────────────▶│   UserProfile     │
│              │                 │                    │
│ id (from JWT)│                 │ id (uuid)          │
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
| `id` | UUID | Primary key — **set from Supabase Auth JWT `sub` claim** (no auto-generate) |
| `email` | String | Unique, from JWT |
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

**Base URL:** `http://localhost:3001` (dev) / `https://YOUR-DOMAIN.up.railway.app` (prod)

### Authentication

Protected routes require a Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase-access-token>
```

Unauthenticated requests to protected routes return:
```json
{ "error": "Missing or invalid authorization header" }
```

Invalid/expired tokens return:
```json
{ "error": "Invalid or expired token" }
```

---

### GET /health

Health check with database connectivity verification.

| | |
|---|---|
| **Auth** | None (public) |
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

Creates a new user (linked to Supabase Auth) and their ADHD profile. User identity comes from the JWT — no email in request body.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Content-Type** | `application/json` |
| **Success** | `201` |
| **Errors** | `400` (validation), `401` (unauthenticated), `409` (already onboarded) |

**Request Body:**
```json
{
  "adhdType": "combined",
  "struggles": ["focus", "time management"],
  "sensoryTriggers": ["loud noises"],
  "goals": ["better focus", "daily routine"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `adhdType` | string | Yes | `"inattentive"` \| `"hyperactive"` \| `"combined"` |
| `struggles` | string[] | Yes | 1-20 items, each non-empty |
| `sensoryTriggers` | string[] | No | 0-20 items, defaults to `[]` |
| `goals` | string[] | Yes | 1-20 items, each non-empty |

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

Sends a message and receives an AI assistant response. User identity comes from JWT. Creates a new conversation if `conversationId` is not provided.

| | |
|---|---|
| **Auth** | Bearer token required |
| **Content-Type** | `application/json` |
| **Success** | `200` |
| **Errors** | `400` (validation), `401` (unauthenticated), `403` (not onboarded), `404` (conversation not found) |

**Request Body:**
```json
{
  "message": "I need help focusing today",
  "conversationId": "cc25162f-836e-4202-be15-a83aee2f8dcb"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `message` | string | Yes | 1-5000 characters |
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

**Response (403):**
```json
{
  "error": "User has not completed onboarding"
}
```

> **Note:** The assistant response is currently a placeholder. AI provider integration (e.g. Anthropic Claude API, OpenAI) is the next milestone.

---

## 6. Environment Variables

Located in `apps/api/.env` (git-ignored).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Supabase pooled, port 6543) |
| `DIRECT_URL` | Yes | — | PostgreSQL direct connection (Supabase, port 5432, for migrations) |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous/public key |
| `NODE_ENV` | No | `development` | `development` \| `production` \| `test` |
| `PORT` | No | `3001` | API server port (Railway auto-injects) |
| `HOST` | No | `0.0.0.0` | API server bind address |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |

**Example `.env` (local dev):**
```env
DATABASE_URL="postgresql://username@localhost:5432/adhd_ai_assistant_dev"
DIRECT_URL="postgresql://username@localhost:5432/adhd_ai_assistant_dev"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

**Example `.env` (production / Railway):**
```env
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend.com"
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

### Docker

| Command | Description |
|---------|-------------|
| `docker build -t adhd-api .` | Build production image |
| `docker run -p 3001:3001 --env-file apps/api/.env adhd-api` | Run locally |

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create apps/api/.env (see Environment Variables section)

# 3. Run database migrations
pnpm --filter @adhd-ai-assistant/api prisma:migrate

# 4. Start dev server
pnpm dev:api
```

---

## 8. Infrastructure Setup Guides

### 8.1 Supabase Setup (supabase.com)

#### Step 1: Create account and project
1. Go to **supabase.com** → **Sign in with GitHub**
2. Click **"New Project"**
3. Fill in:
   - **Name:** `adhd-ai-assistant`
   - **Database password:** generate a strong one — **save it somewhere safe**
   - **Region:** pick closest to your users (e.g. `us-east-1`)
4. Click **"Create new project"** — wait ~2 minutes for provisioning

#### Step 2: Get database connection strings
1. Go to **Settings → Database**
2. Under **"Connection pooling"** section:
   - Copy the **Transaction mode URI** (port `6543`) → this is your `DATABASE_URL`
   - **Append `?pgbouncer=true`** to the end of the URL
3. Copy the **Direct connection URI** (port `5432`) → this is your `DIRECT_URL`
4. In both URLs, replace `[YOUR-PASSWORD]` with the password from Step 1

#### Step 3: Get API keys
1. Go to **Settings → API**
2. Copy **Project URL** → this is your `SUPABASE_URL`
3. Copy **anon / public** key → this is your `SUPABASE_ANON_KEY`

#### Step 4: Configure authentication
1. Go to **Authentication → Providers**
   - **Email** is enabled by default (email + password signup/login)
   - Optionally toggle on OAuth providers (Google, GitHub, etc.)
2. Go to **Authentication → Settings**
   - For development: disable **"Confirm email"** (re-enable for production)

#### Step 5: Set redirect URLs
1. Go to **Authentication → URL Configuration**
2. **Site URL:** `http://localhost:3000` (update to production URL later)
3. **Redirect URLs:** add `http://localhost:3000/**`

#### Step 6: Apply database migrations
After configuring `.env` with Supabase connection strings:
```bash
cd apps/api && npx prisma migrate deploy
```

---

### 8.2 Railway Setup (railway.com)

#### Step 1: Create account and project
1. Go to **railway.com** → **Sign in with GitHub**
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select the `adhd-ai-assistant` repository
4. Railway auto-detects the `Dockerfile`

#### Step 2: Configure environment variables
1. Click on the service → **Variables** tab
2. Add each variable:

| Variable | Where to get the value |
|----------|----------------------|
| `DATABASE_URL` | Supabase → Settings → Database → Pooled URI (port 6543) + `?pgbouncer=true` |
| `DIRECT_URL` | Supabase → Settings → Database → Direct URI (port 5432) |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Your frontend production URL |

> `PORT` is auto-injected by Railway — do **not** set it manually.

#### Step 3: Configure deployment
1. Click on the service → **Settings** tab
2. Railway reads `railway.toml` automatically for:
   - Docker build path
   - Health check at `/health`
   - Restart policy (on failure, max 3 retries)
3. Under **Networking** → click **"Generate Domain"** to get a public URL
4. Copy the generated URL (e.g. `adhd-api-production.up.railway.app`)

#### Step 4: Enable CI/CD auto-deploy
1. In **Settings → Source**:
   - **Root directory:** `/` (repo root, since Dockerfile is there)
   - **Watch paths:** leave blank (deploys on any push)
2. In **Settings → Triggers**:
   - **Branch:** `main`
3. CI/CD flow: `git push to main` → Docker build → health check → deploy

#### Step 5: Verify deployment
1. Wait for build to complete (check **Deployments** tab)
2. Hit: `https://YOUR-DOMAIN.up.railway.app/health`
3. Expected response:
   ```json
   { "status": "ok", "timestamp": "..." }
   ```

---

## 9. Branches & Feature Log

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

### `supabase-railway-setup` → PR pending
> **Feature: Supabase Auth + Supabase PostgreSQL + Railway Deployment**

**Changes:**
- [x] Added Supabase Auth (JWT) via `@supabase/supabase-js`
  - [x] Created `plugins/supabase.ts` — authenticate preHandler
  - [x] Bearer token verification via `supabase.auth.getUser()`
  - [x] Type-safe `request.user` with `{ id, email }` from JWT
- [x] Protected routes with auth middleware
  - [x] `POST /api/onboarding` — now requires Bearer token, email from JWT
  - [x] `POST /api/chat` — now requires Bearer token, userId from JWT
  - [x] `GET /health` — remains public
- [x] Updated Prisma schema for Supabase PostgreSQL
  - [x] Added `directUrl` for pgbouncer connection pooling
  - [x] User.id now set from Supabase auth UUID (removed auto-generate)
- [x] Railway deployment configuration
  - [x] Multi-stage `Dockerfile` (build + production)
  - [x] `railway.toml` with health check + restart policy
  - [x] `.dockerignore`
- [x] Updated environment variables
  - [x] Added `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- [x] Updated MVP documentation with infrastructure setup guides

---

### `<branch-name>` → PR #
> **Feature: _______**

**Changes:**
- [ ] _Change description_
- [ ] _Change description_

---

## 10. MVP Roadmap

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

### Phase 4: Authentication & Security ✅
- [x] Supabase Auth integration (JWT)
- [x] Authentication middleware on protected routes
- [ ] Rate limiting per user
- [ ] Input sanitization

### Phase 5: Frontend
- [ ] Next.js / React app in `apps/web/`
- [ ] Onboarding flow UI
- [ ] Chat interface
- [ ] Blog/knowledge base pages
- [ ] Responsive mobile-first design

### Phase 6: Production Readiness (partial ✅)
- [ ] CI/CD pipeline (GitHub Actions)
- [x] Docker containerization (multi-stage Dockerfile)
- [x] Railway deployment config with health checks
- [ ] Monitoring & alerting
- [ ] Database backups
- [ ] API documentation (Swagger/OpenAPI)

---

_This document is the single source of truth for the ADHD AI Assistant MVP. Update it with every PR merge._
