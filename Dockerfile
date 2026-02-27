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

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations (needed for prisma migrate deploy)
COPY --from=base /app/apps/api/prisma ./apps/api/prisma

# Copy generated Prisma client from build stage
COPY --from=base /app/node_modules/.pnpm/@prisma+client*/node_modules/.prisma ./node_modules/.pnpm/@prisma+client*/node_modules/.prisma

# Copy built JS
COPY --from=base /app/apps/api/dist ./apps/api/dist

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && cd /app && node apps/api/dist/server.js"]
