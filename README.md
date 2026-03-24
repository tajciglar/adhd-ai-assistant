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
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │────>│    API Server     │────>│   PostgreSQL 16  │
│  (React/Vite)│     │    (Fastify)      │     │   + pgvector     │
│  Port 3000   │     │    Port 3001      │     │   Port 5432      │
└──────┬───────┘     └────────┬─────────┘     └────────┬─────────┘
       │                      │                         │
       │  Supabase Auth       │  Supabase Auth          │  Supabase Tables
       │  (sign up/in)        │  (verify JWT)           │  (quiz_submissions,
       v                      │  Gemini AI (RAG)        │   funnel_events)
    ┌──────────────────────────┐                        │
    │     Supabase Cloud       │<───────────────────────┘
    │  (Auth + shared DB)      │
    └──────────────────────────┘
```

**Shared database:** Both the quiz app and this AI assistant connect to the same Supabase PostgreSQL instance. The quiz writes to `quiz_submissions` and `funnel_events` (Supabase tables). The AI assistant uses Prisma-managed tables.

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Framer Motion
- **API:** Fastify 5, Prisma 6, Zod
- **Database:** PostgreSQL 16, pgvector (1536-dim embeddings)
- **Auth:** Supabase (email/password, JWT)
- **AI:** Google Gemini 2.5 Flash (chat + embeddings via gemini-embedding-001)
- **Deployment:** Railway (API), Vercel (frontend)

---

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
VITE_API_URL=http://localhost:3001
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
- Use Smart Import to auto-classify content with AI

Entries are automatically chunked and embedded for vector search.

### Staging and Testers

See [docs/staging-playbook.md](./docs/staging-playbook.md) for the recommended staging setup, preview deployment flow, and tester email/password workflow.

---

## Project Structure

```
apps/
├── api/                 # Fastify API server
│   ├── prisma/          # Schema + migrations
│   ├── src/
│   │   ├── plugins/     # Prisma & Supabase Fastify plugins
│   │   ├── routes/      # chat, user, admin, resources, health
│   │   └── services/
│   │       ├── ai/      # RAG pipeline (embed, retrieve, prompt, answer, memory, insights)
│   │       ├── quizImport.ts      # Auto-import quiz results on first login
│   │       ├── quizAnalytics.ts   # Funnel analytics from quiz tables
│   │       └── supabaseAdmin.ts   # Supabase admin client
│   └── scripts/         # Admin promotion, content import
├── web/                 # React frontend
│   └── src/
│       ├── components/
│       │   ├── auth/       # Login / signup
│       │   ├── chat/       # Chat interface (streaming, feedback, resource cards)
│       │   ├── admin/      # Knowledge base, templates, analytics, feedback
│       │   ├── dashboard/  # Home, library, profile, child profile
│       │   └── shared/     # Mascot, loading screen, resource preview
│       ├── hooks/       # useAuth, useAdmin, useChat, useMemories, etc.
│       └── lib/         # API client, Supabase client
packages/
└── shared/              # Trait scoring, archetypes, assessment categories
```

---

## Database Schema

Core models managed by Prisma:

| Model | Purpose |
|-------|---------|
| **User** | Supabase auth user (id, email, role, hasChatAccess) |
| **UserProfile** | Parent info (gender, age range, household) |
| **ChildProfile** | Child assessment (name, age, gender, traitProfile, onboarding) |
| **Conversation** | Chat conversation container |
| **Message** | Chat messages with metadata (sources, latency, tokens) |
| **MessageFeedback** | Like/dislike ratings per user per message |
| **KnowledgeEntry** | RAG knowledge base entries (title, content, category) |
| **KnowledgeChunk** | Chunked + embedded text for vector search (1536-dim) |
| **UserMemory** | Auto-extracted facts from conversations |
| **ConversationInsight** | Topic classification + retrieval quality metrics |
| **Resource** | Uploaded PDF files with Supabase Storage |
| **ReportTemplate** | Archetype-specific report templates |
| **AdminAuditLog** | Admin action tracking |
| **AdminImportJob** | Async bulk import tracking |

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Authenticated (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/user/me` | Current user + profile + children |
| PUT | `/api/user/me` | Update profile |
| PUT | `/api/user/password` | Change password |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id/messages` | Messages (includes feedback) |
| POST | `/api/chat` | Send message, get AI response |
| POST | `/api/chat/stream` | SSE streaming variant |
| DELETE | `/api/conversations/:id` | Delete conversation |
| POST | `/api/messages/:id/feedback` | Like (1) or dislike (-1) a message |
| DELETE | `/api/messages/:id/feedback` | Remove feedback |
| GET | `/api/user/memories` | List extracted memories |
| DELETE | `/api/user/memories/:id` | Delete a memory |
| GET | `/api/resources` | List resources by category |
| GET | `/api/resources/:id/download` | Signed download URL |

### Admin (role: admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Dashboard stats (entries, users, feedback) |
| GET | `/api/admin/feedback` | Recent feedback with message context |
| CRUD | `/api/admin/entries/*` | Knowledge entry management |
| POST | `/api/admin/bulk-import` | Bulk import entries |
| POST | `/api/admin/test-query` | Test RAG retrieval |
| CRUD | `/api/admin/resources/*` | Resource file management |
| POST | `/api/admin/resources/bulk-upload` | Bulk PDF upload with AI metadata |
| CRUD | `/api/admin/report-templates/*` | Report template management |
| GET | `/api/admin/quiz-analytics` | Quiz funnel analytics |
| GET | `/api/admin/conversation-insights` | Conversation topic analytics |

---

## RAG Pipeline

```
User question
    |
Embed query (gemini-embedding-001, 1536 dims)
    |
Vector search (pgvector cosine distance, top 8 chunks)
  + Keyword bonus scoring (+0.12 per query term match)
    |
Build grounded prompt:
  - System rules (7 answer types, word count matching)
  - Child context (name, age, archetype, trait profile)
  - User memories (up to 20 extracted facts)
  - Retrieved sources (up to 8 chunks)
  - Conversation history (last 8 messages)
    |
Gemini 2.5 Flash (temperature 0.2)
  - Streaming via SSE or synchronous
    |
Post-response (non-blocking):
  - Auto-extract memories from conversation
  - Log conversation insight (topic, retrieval score)
    |
Response + metadata (sources, latency, tokens)
```

### AI Answer Types

The system prompt classifies each question into one of 7 types with specific response structures:

| Type | Trigger | Word Count |
|------|---------|------------|
| Crisis | Meltdowns, urgent situations | 50-80 |
| Emotional | Guilt, frustration, self-doubt | 80-120 |
| Decision | Should I medicate? Schools? | 150-200 |
| Reassurance | Is this normal? | 80-100 |
| Knowledge | What is executive function? | 150-250 |
| Tactical | How to set up routines? | 200-300 |
| Situation | Specific incident happened | 150-200 |

### Caching

- **Embedding cache:** 60s TTL, max 2K entries
- **Retrieval cache:** 30s TTL, max 2K entries
- **HyDE cache:** 15min TTL, max 500 entries (pre-warmed at startup)

---

## Security

| Feature | Implementation |
|---------|---------------|
| Authentication | Supabase JWT with 60s token cache (SHA256 hashed) |
| Brute-force protection | 8 failed attempts / 5 min = 2 min IP block |
| Rate limiting | Global 100/min + per-endpoint limits |
| Input validation | Zod schemas on all request bodies |
| SQL injection | Prisma ORM (parameterized) + `Prisma.sql` for raw queries |
| CORS | Environment-driven origins + Vercel preview URL patterns |
| Headers | Helmet (HSTS, hidePoweredBy, crossOriginResourcePolicy) |
| Admin access | `requireAdmin()` middleware + audit logging |
| Streaming CORS | Manual origin validation on SSE endpoint |
| Client disconnect | Stream cleanup on `request.raw.close` event |

---

## Rate Limits

| Scope | Limit |
|-------|-------|
| Global | 100 req/min per IP or user |
| `POST /api/chat` | 15/min per user |
| `POST /api/chat/stream` | 15/min per user |
| Admin reads | 60/min |
| Admin writes | 20/min |
| Bulk operations | 5/min |

---

## Deployment

### Production Stack

- **Frontend:** Vercel (auto-deploy from `main`)
- **API:** Railway (Dockerfile, auto-deploy from `main`)
- **Database:** Supabase PostgreSQL with pgvector extension
- **Storage:** Supabase Storage (PDF resources)

### Environment Variables

**Railway (API):**
- `DATABASE_URL`, `DIRECT_URL` — PostgreSQL connection strings
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `CORS_ORIGIN` — Vercel frontend URL (include `https://`)
- `NODE_ENV=production`

**Vercel (Frontend):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` — Railway API URL

### Deployment Lessons

- Always include `https://` protocol in `CORS_ORIGIN`
- Vercel needs `vercel.json` with SPA rewrite rule for client-side routing
- Railway uses `Dockerfile` builder (configured in `railway.json`)
- Prisma migrations run automatically via `prestart` script
- Production log level set to `warn` to avoid Railway rate limiting

---

## Admin Panel

The admin panel (`/admin`) provides:

| Section | Features |
|---------|----------|
| **Q&A Topics** | Knowledge entry CRUD, category management, bulk import, smart import with AI |
| **Parent Resources** | PDF upload, folder organization, bulk upload with AI metadata |
| **Child Reports** | Archetype report template editor with import/export |
| **Quiz Results** | Funnel analytics, step dropoff rates, archetype distribution |
| **AI Usage & Costs** | Token usage dashboard with Gemini pricing estimates |
| **Parent Conversations** | Topic classification, retrieval quality, archetype insights |
| **User Feedback** | Like/dislike stats, approval rate, recent feedback with message context |

---

## Design System

**Brand:** Harbor — "A calm space in the chaos."

| Token | Hex | Usage |
|-------|-----|-------|
| `harbor-primary` | `#7040CA` | Headings, primary buttons, brand |
| `harbor-bg` | `#FAF7FC` | Page background (light lavender) |
| `harbor-accent` | `#9B59B6` | Active states, highlights |
| `harbor-text` | `#1A1A1A` | Body text |
| `harbor-error` | `#C97B63` | Error states |
| `harbor-orange` | `#E67E22` | Secondary accent, active nav |
| `harbor-success` | `#2ECC71` | Online indicators |

Colors defined in `apps/web/src/index.css` using Tailwind v4 `@theme` directive.

**Typography:** Inter (body), Nunito (display/headings) via Google Fonts.

**Animations:** Framer Motion with `ease: [0.4, 0, 0.2, 1]` — no springs, no bounce.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `docker compose up` | Start PostgreSQL + API (dev) |
| `pnpm run dev:web` | Start frontend dev server |
| `pnpm run dev:api` | Start API without Docker |
| `pnpm -w run build:shared` | Build shared package |
| `pnpm run build:web` | Production frontend build |
| `pnpm run build:api` | Production API build |

---

## CI/CD

GitHub Actions workflows:

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | PRs + pushes to `main` | Build, lint, test, security scan, dependency audit |
| `deploy-staging.yml` | Push to `main` | Deploy to Railway staging + Vercel preview |
| `deploy-production.yml` | Manual trigger | Deploy to production with approval gate |

Required GitHub secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, plus per-environment service IDs and test tokens.

---

## Related

- [Harbor Quiz](https://github.com/tajciglar/adhd-parenting-quiz) — The assessment quiz that feeds into this chatbot
