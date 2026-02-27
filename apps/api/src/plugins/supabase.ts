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

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !user) {
          return reply.status(401).send({
            error: "Invalid or expired token",
          });
        }

        request.user = {
          id: user.id,
          email: user.email!,
        };
      },
    );
  },
  { name: "supabase" },
);
