import fp from "fastify-plugin";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { createHash } from "node:crypto";

interface AuthUser {
  id: string;
  email: string;
}

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user: AuthUser;
  }
}

// Cache verified tokens for 60s to avoid hitting Supabase auth API on every request.
// Key: token hash, Value: { user, expiresAt }
const tokenCache = new Map<
  string,
  { user: AuthUser; expiresAt: number; lastAccessedAt: number }
>();
const MAX_TOKEN_CACHE_SIZE = 10_000;
const TOKEN_CACHE_TTL_MS = 60_000;

const invalidAuthAttempts = new Map<
  string,
  { count: number; blockedUntil: number; firstAttemptAt: number }
>();
const INVALID_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const MAX_INVALID_ATTEMPTS = 8;
const PENALTY_BLOCK_MS = 2 * 60 * 1000;

// Simple hash for cache key (avoids storing full tokens in memory)
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function evictLeastRecentlyUsedToken() {
  let lruKey: string | null = null;
  let lruTs = Number.POSITIVE_INFINITY;

  for (const [key, entry] of tokenCache) {
    if (entry.lastAccessedAt < lruTs) {
      lruTs = entry.lastAccessedAt;
      lruKey = key;
    }
  }

  if (lruKey) tokenCache.delete(lruKey);
}

function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.ip;
}

function registerInvalidAttempt(ip: string, now: number) {
  const existing = invalidAuthAttempts.get(ip);
  if (!existing || now - existing.firstAttemptAt > INVALID_ATTEMPT_WINDOW_MS) {
    invalidAuthAttempts.set(ip, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });
    return;
  }

  existing.count += 1;
  if (existing.count >= MAX_INVALID_ATTEMPTS) {
    existing.blockedUntil = now + PENALTY_BLOCK_MS;
  }
  invalidAuthAttempts.set(ip, existing);
}

function clearInvalidAttempts(ip: string) {
  invalidAuthAttempts.delete(ip);
}

// Periodically clean expired entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tokenCache) {
    if (now >= entry.expiresAt) {
      tokenCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

setInterval(() => {
  const now = Date.now();
  for (const [ip, state] of invalidAuthAttempts) {
    const expiredWindow = now - state.firstAttemptAt > INVALID_ATTEMPT_WINDOW_MS;
    const noBlock = state.blockedUntil <= now;
    if (expiredWindow && noBlock) {
      invalidAuthAttempts.delete(ip);
    }
  }
}, 60 * 1000).unref();

export default fp(
  async (fastify: FastifyInstance) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    fastify.decorate("supabase", supabase);

    fastify.decorateRequest("user", null as unknown as AuthUser);

    fastify.decorate(
      "authenticate",
      async (request: FastifyRequest, reply: FastifyReply) => {
        const authHeader = request.headers.authorization;
        const now = Date.now();
        const ip = getClientIp(request);

        const penalty = invalidAuthAttempts.get(ip);
        if (penalty && penalty.blockedUntil > now) {
          return reply.status(429).send({
            error: "Too many invalid authentication attempts. Try again later.",
          });
        }

        if (!authHeader?.startsWith("Bearer ")) {
          registerInvalidAttempt(ip, now);
          return reply.status(401).send({
            error: "Missing or invalid authorization header",
          });
        }

        const token = authHeader.slice(7);
        const cacheKey = hashToken(token);

        // Check cache first
        const cached = tokenCache.get(cacheKey);
        if (cached && now < cached.expiresAt) {
          cached.lastAccessedAt = now;
          tokenCache.set(cacheKey, cached);
          request.user = cached.user;
          return;
        }

        // Verify with Supabase
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          tokenCache.delete(cacheKey);
          registerInvalidAttempt(ip, now);
          return reply.status(401).send({
            error: "Invalid or expired token",
          });
        }

        const authUser: AuthUser = {
          id: user.id,
          email: user.email!,
        };

        clearInvalidAttempts(ip);

        if (tokenCache.size >= MAX_TOKEN_CACHE_SIZE) {
          evictLeastRecentlyUsedToken();
        }

        // Cache for 60 seconds
        tokenCache.set(cacheKey, {
          user: authUser,
          expiresAt: now + TOKEN_CACHE_TTL_MS,
          lastAccessedAt: now,
        });

        request.user = authUser;
      },
    );
  },
  { name: "supabase" },
);
