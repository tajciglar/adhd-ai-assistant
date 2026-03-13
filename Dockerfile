FROM node:22-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config and lockfile first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile

# Copy application source (shared + api)
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared package first (api depends on it)
RUN pnpm --filter @adhd-parenting-ai-assistant/shared build

# Generate Prisma client
RUN pnpm --filter @adhd-parenting-ai-assistant/api prisma:generate

# Build API TypeScript
RUN pnpm --filter @adhd-parenting-ai-assistant/api build

# --- Production stage ---
FROM node:22-slim AS production

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.29.2 --activate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (prisma CLI needed for migrate deploy at startup)
RUN pnpm install --frozen-lockfile

# Copy Prisma schema and migrations (needed for prisma migrate deploy + generate)
COPY --from=base /app/apps/api/prisma ./apps/api/prisma

# Generate Prisma client in production stage
RUN cd apps/api && npx prisma generate

# Copy built shared package (runtime dependency for API)
COPY --from=base /app/packages/shared/dist ./packages/shared/dist

# Copy built API JS
COPY --from=base /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/server.js"]
