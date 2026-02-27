FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config and lockfile first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy application source
COPY apps/api/ ./apps/api/

# Generate Prisma client
RUN pnpm --filter @adhd-ai-assistant/api prisma:generate

# Build TypeScript
RUN pnpm --filter @adhd-ai-assistant/api build

# --- Production stage ---
FROM node:22-slim AS production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

# Install all dependencies (prisma CLI needed for migrate deploy at startup)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=base /app/apps/api/prisma ./apps/api/prisma

# Generate Prisma client in production stage (must run after pnpm install
# so it writes to the correct pnpm store path)
RUN pnpm --filter @adhd-ai-assistant/api prisma:generate

# Copy built JS
COPY --from=base /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["pnpm", "--filter", "@adhd-ai-assistant/api", "start"]
