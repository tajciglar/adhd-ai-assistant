# Harbor — AI Parenting Assistant

Personalized AI chatbot for parents of children with ADHD. Uses retrieval-augmented generation (RAG) to deliver grounded, evidence-based guidance tailored to each child's behavioral profile.

## How It Works

1. Parent takes the [Harbor Quiz](https://github.com/tajciglar/adhd-parenting-quiz) (separate product)
2. Parent signs up for the AI assistant
3. On first login, quiz results are auto-imported — child profile, trait scores, and archetype
4. Parent chats with an AI that knows their child's specific strengths and challenges
5. All responses are grounded in a curated knowledge base (no hallucinations)

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  React SPA  │────▶│  Fastify API │────▶│  PostgreSQL 16   │
│  (Vite)     │     │              │     │  + pgvector       │
└─────────────┘     │  Supabase    │     └──────────────────┘
                    │  Auth (JWT)  │              │
                    │              │     ┌────────┴─────────┐
                    │  Gemini AI   │     │  Supabase Tables │
                    │  (RAG)       │     │  (quiz_submissions│
                    └──────────────┘     │   funnel_events) │
                                         └──────────────────┘
```

**Shared database:** Both the quiz app and this AI assistant connect to the same Supabase PostgreSQL instance. The quiz writes to `quiz_submissions` (Supabase tables). The AI assistant uses Prisma-managed tables (`users`, `user_profiles`, `child_profiles`, `conversations`, `messages`, `knowledge_entries`, etc.).

## Quick Start

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/) 10+
- Docker & Docker Compose

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

**API** — create `apps/api/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adhd_assistant
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/adhd_assistant

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
# GEMINI_CHAT_MODEL=gemini-2.5-flash      (default)
# GEMINI_EMBED_MODEL=gemini-embedding-001  (default)

# Server
CORS_ORIGIN=http://localhost:3000
HOST=0.0.0.0
PORT=3001
```

**Frontend** — create `apps/web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start database + API

```bash
docker compose up
```

Starts PostgreSQL 16 (with pgvector) on port 5432 and the API on port 3001. Migrations run automatically.

### 4. Start frontend

```bash
pnpm run dev:web
```

Vite dev server at **http://localhost:3000**.

### 5. Seed the knowledge base

Log in as admin, navigate to `/admin`, and either:
- Add entries manually via the Knowledge tab
- Bulk import from a `.xlsx` or `.csv` file

Entries are automatically chunked and embedded for vector search.

## Project Structure

```
apps/
├── api/                 # Fastify API server
│   ├── prisma/          # Schema + migrations
│   ├── src/
│   │   ├── plugins/     # Prisma & Supabase Fastify plugins
│   │   ├── routes/      # chat, user, admin, health
│   │   └── services/
│   │       ├── ai/      # RAG pipeline (embed, retrieve, prompt, answer)
│   │       ├── quizImport.ts      # Auto-import quiz results on first login
│   │       ├── quizAnalytics.ts   # Funnel analytics from quiz tables
│   │       └── supabaseAdmin.ts   # Supabase admin client
│   └── scripts/         # Admin promotion, content import
├── web/                 # React frontend
│   └── src/
│       ├── components/
│       │   ├── auth/    # Login / signup
│       │   ├── chat/    # Chat interface
│       │   └── admin/   # Knowledge base, templates, quiz analytics
│       ├── hooks/       # useAuth, useAdmin, useChat, etc.
│       └── lib/         # API client, Supabase client
packages/
└── shared/              # Trait scoring, archetypes, assessment categories
```

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Authenticated (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/me` | Current user info + profile + children |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id/messages` | Conversation messages |
| POST | `/api/chat` | Send message, get AI response |
| DELETE | `/api/conversations/:id` | Delete conversation |

### Admin (role: admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/entries` | List knowledge entries |
| POST | `/api/admin/entries` | Create entry |
| PUT | `/api/admin/entries/:id` | Update entry |
| DELETE | `/api/admin/entries/:id` | Delete entry |
| POST | `/api/admin/bulk-import` | Bulk import entries |
| POST | `/api/admin/test-query` | Test RAG retrieval |
| GET | `/api/admin/quiz-analytics` | Quiz funnel analytics |
| GET/POST | `/api/admin/report-templates/*` | Report template CRUD |

## RAG Pipeline

```
User question
    ↓
Embed query (Gemini embedding-001, 1536 dims)
    ↓
Vector search (pgvector cosine distance, top 8 chunks)
    ↓
Build grounded prompt (system rules + child context + sources + history)
    ↓
Gemini chat completion (temperature 0.2)
    ↓
Response + metadata (sources, latency, tokens)
```

Key constraints:
- Responses grounded exclusively in knowledge base content
- No jargon, no citations shown to user
- Max 5 source blocks per prompt (900 chars each)
- Last 6 conversation turns included as context
- Fallback response if retrieval or Gemini fails

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 100 req/min per IP or user |
| `POST /api/chat` | 15/min per user |
| Admin reads | 60/min |
| Admin writes | 20/min |
| Bulk import | 5/min |

## Database Schema

Core models managed by Prisma:

- **User** — Supabase auth user (id, email, role, hasChatAccess)
- **UserProfile** — Parent info (gender, age range, household)
- **ChildProfile** — Child assessment (name, age, gender, traitProfile JSON, onboardingResponses)
- **Conversation / Message** — Chat history with metadata
- **KnowledgeEntry / KnowledgeChunk** — RAG knowledge base with vector embeddings
- **AdminAuditLog** — Admin action tracking
- **AdminImportJob** — Async bulk import tracking
- **ReportTemplate** — Archetype-specific report templates

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `docker compose up` | Start PostgreSQL + API (dev) |
| `pnpm run dev:web` | Start frontend dev server |
| `pnpm run dev:api` | Start API without Docker |
| `pnpm run build:shared` | Build shared package |
| `pnpm run build:web` | Production frontend build |
| `pnpm run build:api` | Production API build |

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Framer Motion
- **API:** Fastify 5, Prisma 6, Zod
- **Database:** PostgreSQL 16, pgvector
- **Auth:** Supabase (email/password, JWT)
- **AI:** Google Gemini (chat + embeddings)
- **Deployment:** Docker, Railway (API), Vercel (frontend)

## Related

- [Harbor Quiz](https://github.com/tajciglar/adhd-parenting-quiz) — The assessment quiz that feeds into this chatbot
