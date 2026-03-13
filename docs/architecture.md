# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │────▶│    API Server     │────▶│   PostgreSQL 16  │
│  (React/Vite)│     │    (Fastify)      │     │   + pgvector     │
│  Port 3000   │     │    Port 3001      │     │   Port 5432      │
└──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
       │                      │                         │
       │  Supabase Auth       │  Supabase Auth          │  Supabase Tables
       │  (sign up/in)        │  (verify JWT)           │  (quiz_submissions,
       ▼                      │  Gemini AI (RAG)        │   funnel_events)
    ┌──────────────────────────┐                        │
    │     Supabase Cloud       │◀───────────────────────┘
    │  (Auth + shared DB)      │
    └──────────────────────────┘
```

This is the **AI chatbot** product. It shares a Supabase PostgreSQL instance with the [Harbor Quiz](https://github.com/tajciglar/adhd-parenting-quiz). The quiz writes to Supabase-managed tables (`quiz_submissions`, `funnel_events`). This app uses Prisma-managed tables for all its data.

## Tech Stack

### Frontend (`apps/web`) — Port 3000
- **React 19** + **Vite 7**
- **Tailwind CSS v4** — CSS-based `@theme` config (no `tailwind.config.ts`)
- **Framer Motion** — page transitions, chat animations
- **react-router-dom** — client-side routing
- **@supabase/supabase-js** — auth client (sign up, sign in, session)

### API (`apps/api`) — Port 3001
- **Fastify 5** — HTTP server with rate limiting, CORS, Helmet
- **Prisma 6** — ORM and database migrations
- **Zod** — request validation
- **Google Gemini** — chat completion (`gemini-2.5-flash`) and embeddings (`gemini-embedding-001`)
- **pgvector** — vector similarity search for RAG retrieval
- **@supabase/supabase-js** — JWT verification + admin client for quiz data

### Database
- **PostgreSQL 16** with pgvector extension
- Docker locally, Supabase-hosted in production
- Prisma manages schema and migrations

## Auth Flow

```
1. User signs up/in on the frontend
   └─▶ supabase.auth.signUp() or signInWithPassword()
       └─▶ Supabase returns JWT access token

2. Frontend stores session (Supabase SDK → localStorage)

3. Frontend makes API request
   └─▶ Authorization: Bearer <jwt-token>

4. API verifies token
   └─▶ fastify.authenticate preHandler
       └─▶ supabase.auth.getUser(token)
           └─▶ Returns { id, email } or 401

5. API upserts user in PostgreSQL, proceeds with request
```

Supabase handles **only** authentication. All application data (profiles, conversations, knowledge base) lives in Prisma-managed PostgreSQL tables.

## Quiz Data Bridge

On first login, `GET /api/user/me` auto-imports quiz results:

```
1. Check if UserProfile exists with onboardingCompleted = true
   └─▶ If yes, skip

2. Query quiz_submissions table by email (Supabase admin client)
   └─▶ If no submission found, skip

3. Create UserProfile + ChildProfile from quiz data:
   - child_name, child_gender, child_age_range → ChildProfile
   - trait_scores, archetype_id → traitProfile JSON
   - responses → onboardingResponses
   - Mark onboardingCompleted = true

4. Chat can now personalize responses using the child's profile
```

## Project Structure

```
adhd-parenting-ai-assistant/
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database schema
│   │   │   └── migrations/          # Migration history
│   │   ├── src/
│   │   │   ├── server.ts            # Fastify setup, CORS, rate limiting
│   │   │   ├── plugins/
│   │   │   │   ├── prisma.ts        # PrismaClient plugin
│   │   │   │   └── supabase.ts      # Auth plugin (JWT verification)
│   │   │   ├── routes/
│   │   │   │   ├── health.ts        # Health check
│   │   │   │   ├── chat.ts          # Conversations + AI chat
│   │   │   │   ├── user.ts          # User info + quiz import
│   │   │   │   └── admin.ts         # Knowledge CRUD, templates, analytics
│   │   │   └── services/
│   │   │       ├── ai/
│   │   │       │   ├── answer.ts    # Gemini chat completion
│   │   │       │   ├── retrieval.ts # Vector search + keyword scoring
│   │   │       │   ├── prompt.ts    # System prompt + child context
│   │   │       │   ├── embed.ts     # Batch embedding via Gemini
│   │   │       │   ├── knowledgeIndex.ts  # Chunk + embed entries
│   │   │       │   └── geminiClient.ts    # Gemini SDK wrapper
│   │   │       ├── quizImport.ts    # Import quiz results on first login
│   │   │       ├── quizAnalytics.ts # Funnel analytics from quiz tables
│   │   │       └── supabaseAdmin.ts # Supabase admin client
│   │   └── scripts/
│   │       ├── promote-admin.ts     # Grant admin role to a user
│   │       └── import-content.ts    # Seed knowledge base
│   │
│   └── web/
│       ├── index.html
│       ├── vite.config.ts           # Vite + Tailwind + /api proxy
│       └── src/
│           ├── App.tsx              # Router: /auth, /chat, /admin, /no-access
│           ├── index.css            # Tailwind @theme (Harbor purple palette)
│           ├── lib/
│           │   ├── supabase.ts      # Supabase client
│           │   └── api.ts           # Fetch wrapper with Bearer token
│           ├── hooks/
│           │   ├── useAuth.ts
│           │   ├── useChat.ts
│           │   └── useAdmin.ts
│           └── components/
│               ├── auth/            # Login / signup
│               ├── chat/            # Chat interface
│               └── admin/           # Knowledge base, templates, quiz analytics
│
├── packages/shared/                 # Trait scoring, archetypes, categories
├── docker-compose.yml               # Local dev: PostgreSQL + API
├── Dockerfile                       # Production build (Railway)
├── Dockerfile.dev                   # Dev build (hot reload)
└── pnpm-workspace.yaml
```

## Database Schema

Prisma-managed models (see `apps/api/prisma/schema.prisma`):

### Core
- **User** — `id` (UUID from Supabase), `email`, `role` (USER/ADMIN), `hasChatAccess`
- **UserProfile** — Parent info: `parentGender`, `parentAgeRange`, `householdStructure`, `onboardingCompleted`
- **ChildProfile** — Child assessment: `childName`, `childAge`, `childGender`, `traitProfile` (JSONB), `onboardingResponses` (JSONB)

### Chat
- **Conversation** — `userId`, `title`, timestamps
- **Message** — `conversationId`, `role` (USER/ASSISTANT), `content`, `metadata` (JSONB: sources, latency, tokens)

### Knowledge Base (RAG)
- **KnowledgeEntry** — `title`, `content`, `category`
- **KnowledgeChunk** — `entryId`, `chunkIndex`, `text`, `tokenCount`, `embedding` (vector 1536)

### Admin
- **AdminAuditLog** — `actorUserId`, `action`, `targetType`, `targetId`, `metadata`
- **AdminImportJob** — `createdById`, `status`, `payload`, counts (total/processed/succeeded/failed)
- **ReportTemplate** — `archetypeId`, `template` (JSONB)

## RAG Pipeline

```
User question
    │
    ▼
Embed query ──▶ Gemini embedding-001 (1536 dimensions)
    │
    ▼
Vector search ──▶ pgvector cosine distance
    │               Top 8 chunks, min score 0.35
    │               + keyword bonus scoring
    ▼
Build prompt ──▶ System instructions (strict grounding rules)
    │            + Child context (name, age, trait strengths)
    │            + Top 5 source blocks (max 900 chars each)
    │            + Last 6 conversation turns
    ▼
Gemini completion ──▶ gemini-2.5-flash, temperature 0.2
    │
    ▼
Response + metadata (sources, latency, token usage)
```

### Caching
- **Embedding cache:** TTL 60s, max 2000 entries (avoids re-embedding repeated queries)
- **Retrieval cache:** TTL 30s, max 2000 entries (avoids repeated vector searches)

### Constraints
- Responses grounded exclusively in knowledge base content
- No jargon, no visible citations to the user
- Fallback response if retrieval or Gemini fails
- Max 200 messages per conversation

## Frontend Routes

| Path | Access | Description |
|------|--------|-------------|
| `/auth` | Public | Login / signup (redirects if already authenticated) |
| `/chat` | Auth + chatAccess | Main chat interface |
| `/admin` | Auth + admin role | Knowledge base, templates, quiz analytics |
| `/no-access` | Auth | Message for users without chat access |

Role-based redirect logic:
- Admin users → `/admin`
- Users with chat access → `/chat`
- Others → `/no-access`

## Environment Variables

### API (`apps/api/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection (pooled) |
| `DIRECT_URL` | Yes | PostgreSQL connection (direct, for migrations) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (quiz data import) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_CHAT_MODEL` | No | Chat model (default: `gemini-2.5-flash`) |
| `GEMINI_EMBED_MODEL` | No | Embed model (default: `gemini-embedding-001`) |
| `CORS_ORIGIN` | No | Allowed origins, comma-separated (default: `http://localhost:3000`) |
| `HOST` | No | Bind address (default: `0.0.0.0`) |
| `PORT` | No | API port (default: `3001`) |

### Frontend (`apps/web/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_API_URL` | No | API URL (empty in dev — Vite proxy handles it) |

## Deployment

### Local (Docker Compose)
```bash
docker compose up       # PostgreSQL + API with hot reload
pnpm run dev:web        # Frontend dev server
```

The API container runs `prisma migrate deploy` on startup, then `tsx watch` for hot reload. Source files are volume-mounted.

### Production
- **API:** Railway — Dockerfile builds, runs migrations on startup, then `node apps/api/dist/server.js`
- **Frontend:** Vercel — Static Vite build, `VITE_API_URL` points to Railway API URL
- **Database:** Supabase PostgreSQL (shared with quiz app)
