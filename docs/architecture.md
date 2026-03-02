# Architecture

## System Overview

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend   │────▶│    API Server     │────▶│   Database   │
│  (React/Vite)│     │    (Fastify)      │     │ (PostgreSQL) │
│  Port 3000   │     │    Port 3001      │     │  Port 5432   │
└──────┬───────┘     └────────┬─────────┘     └──────────────┘
       │                      │
       │  Supabase Auth       │  Supabase Auth
       │  (sign up/in)        │  (verify JWT)
       ▼                      ▼
    ┌──────────────────────────┐
    │     Supabase Cloud       │
    │  (Auth service only)     │
    └──────────────────────────┘
```

## Tech Stack

### Frontend (`apps/web`) — Port 3000
- **React 19** + **Vite 7**
- **Tailwind CSS v4** — CSS-based `@theme` config (no `tailwind.config.ts`)
- **Framer Motion** — page transitions, staggered animations
- **react-router-dom** — client-side routing
- **@supabase/supabase-js** — auth client (sign up, sign in, session)

### API (`apps/api`) — Port 3001
- **Fastify** — HTTP server
- **Prisma** — ORM and database migrations
- **Zod** — request validation
- **@supabase/supabase-js** — JWT token verification

### Database
- **PostgreSQL 16** (Docker locally, Railway/Supabase in production)
- **Prisma** manages schema and migrations

### External Services
- **Supabase** — authentication only (users, passwords, JWTs)

## Auth Flow

```
1. User signs up/in on the frontend
   └─▶ supabase.auth.signUp() or signInWithPassword()
       └─▶ Supabase Cloud returns a JWT access token

2. Frontend stores the session (Supabase SDK → localStorage)

3. Frontend makes API request
   └─▶ Authorization: Bearer <jwt-token>

4. API receives the request
   └─▶ fastify.authenticate preHandler
       └─▶ supabase.auth.getUser(token)
           └─▶ Returns { id, email } or 401

5. API uses the user ID with Prisma to query PostgreSQL
```

Supabase handles **only** authentication. All application data (profiles, onboarding, conversations) lives in our own PostgreSQL database.

## Project Structure

```
adhd-ai-assistant/
├── apps/
│   ├── api/                    # Fastify API server
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Migration history
│   │   └── src/
│   │       ├── server.ts       # Fastify setup, CORS, routes
│   │       ├── plugins/
│   │       │   ├── prisma.ts   # PrismaClient plugin
│   │       │   └── supabase.ts # Auth plugin (JWT verification)
│   │       └── routes/
│   │           ├── health.ts
│   │           ├── onboarding.ts
│   │           └── chat.ts
│   │
│   └── web/                    # React frontend
│       ├── index.html
│       ├── vite.config.ts      # Vite + Tailwind + /api proxy
│       └── src/
│           ├── App.tsx         # Router (auth vs onboarding)
│           ├── index.css       # Tailwind @theme config
│           ├── lib/
│           │   ├── supabase.ts # Supabase client
│           │   ├── api.ts      # Fetch wrapper with Bearer token
│           │   └── constants.ts# 16 onboarding question configs
│           ├── hooks/
│           │   ├── useAuth.ts
│           │   ├── useOnboarding.ts
│           │   └── useDebounce.ts
│           ├── components/
│           │   ├── auth/AuthPage.tsx
│           │   ├── onboarding/  # OnboardingPage, Layout, StepRenderer, etc.
│           │   │   └── questions/ # SingleSelect, MultiSelect, etc.
│           │   └── ui/          # Button, ProgressBar, SaveIndicator
│           └── types/onboarding.ts
│
├── packages/shared/            # Shared types (future use)
├── docker-compose.yml          # Local dev: PostgreSQL + API
├── Dockerfile                  # Production build (Railway)
├── Dockerfile.dev              # Dev build (hot reload)
└── pnpm-workspace.yaml
```

## Database Schema

Key models (see `apps/api/prisma/schema.prisma` for full schema):

### UserProfile
```
onboarding_responses  JSONB   — All 16 answers as a flat object
onboarding_step       INT     — Next step to show (0=not started, 17=done)
onboarding_completed  BOOLEAN — Whether onboarding is finished
```

The JSONB column stores responses as `{ gender: "male", childName: "Leo", childAge: 8, ... }` — flexible and easy to extend without migrations.

## API Endpoints

All routes are prefixed with `/api`.

### Onboarding
| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/onboarding` | Fetch progress for resume |
| `PATCH` | `/api/onboarding` | Save one step answer (autosave) |
| `POST` | `/api/onboarding/complete` | Mark onboarding finished |
| `GET` | `/api/onboarding/snapshot` | Grouped data for Family Snapshot |

### PATCH body
```json
{ "step": 1, "responses": { "gender": "male" } }
```
Per-step Zod validation ensures only valid values are accepted.

## Environment Variables

### API (`apps/api/.env` or Docker env)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (Prisma) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `CORS_ORIGIN` | Allowed frontend origin |
| `PORT` | API port (default: 3001) |

### Frontend (`apps/web/.env`)
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_URL` | API URL (empty in dev — uses Vite proxy) |

## Deployment

### Local (Docker Compose)
```
docker compose up     # Starts PostgreSQL + API
pnpm --filter web dev # Starts frontend separately
```

The API container runs `prisma migrate deploy` on startup, then `tsx watch` for hot reload. Source files are volume-mounted so changes reflect immediately.

### Production (Railway)
The production `Dockerfile` builds the API into a single-stage Node.js image:
1. Installs deps, generates Prisma client, compiles TypeScript
2. On startup: `prisma migrate deploy` → `node apps/api/dist/server.js`

The frontend would be deployed separately (Vercel, Netlify, etc.) as a static Vite build with `VITE_API_URL` pointing to the Railway API URL.
