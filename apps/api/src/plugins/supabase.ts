import fp from "fastify-plugin";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

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
  { user: AuthUser; expiresAt: number }
>();

// Simple hash for cache key (avoids storing full tokens in memory)
function hashToken(token: string): string {
  // Use last 32 chars as a fast, unique-enough key
  return token.slice(-32);
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

        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({
            error: "Missing or invalid authorization header",
          });
        }

        const token = authHeader.slice(7);
        const cacheKey = hashToken(token);
        const now = Date.now();

        // Check cache first
        const cached = tokenCache.get(cacheKey);
        if (cached && now < cached.expiresAt) {
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
          return reply.status(401).send({
            error: "Invalid or expired token",
          });
        }

        const authUser: AuthUser = {
          id: user.id,
          email: user.email!,
        };

        // Cache for 60 seconds
        tokenCache.set(cacheKey, {
          user: authUser,
          expiresAt: now + 60_000,
        });

        request.user = authUser;
      },
    );
  },
  { name: "supabase" },
);
