# Harbor

**A calm space in the chaos.** — ADHD AI assistant for parents of children with ADHD.

## Quick Start

### Prerequisites
- Node.js 22+
- [pnpm](https://pnpm.io/) 10+
- Docker & Docker Compose

### 1. Install dependencies

```bash
pnpm install
```

This installs all packages across the monorepo (`apps/api`, `apps/web`, `packages/shared`).

### 2. Set up environment variables

Create a root `.env` for Docker/API:

```bash
cp .env.example .env
```

Fill in your Supabase credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Create `apps/web/.env` for the frontend:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start the database and API

```bash
docker compose up
```

This starts:
- **PostgreSQL 16** on port 5432
- **API server** on port 3001 (with hot reload)

The API automatically runs database migrations on startup.

### 4. Start the frontend

In a separate terminal:

```bash
pnpm run dev:web
```

This starts the Vite dev server on **http://localhost:3000**.

### 5. Open the app

Visit [http://localhost:3000](http://localhost:3000), create an account, and walk through the onboarding.

## Project Structure

```
apps/
├── api/     # Fastify API server (Prisma, Zod, Supabase auth)
└── web/     # React frontend (Vite, Tailwind v4, Framer Motion)
packages/
└── shared/  # Shared types (future use)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `docker compose up` | Start PostgreSQL + API |
| `pnpm run dev:web` | Start frontend dev server |
| `pnpm run dev:api` | Start API without Docker |
| `pnpm run build:web` | Build frontend for production |

## Documentation

- [Architecture](docs/architecture.md) — system overview, auth flow, database schema, deployment
- [UI/UX Design System](docs/ui-ux.md) — colors, typography, components, animation guidelines

## Tech Stack

- **Frontend:** React 19, Vite 7, Tailwind CSS v4, Framer Motion
- **API:** Fastify, Prisma, Zod
- **Database:** PostgreSQL 16
- **Auth:** Supabase (email/password)
- **Deployment:** Docker, Railway (API), Vercel/Netlify (frontend)
