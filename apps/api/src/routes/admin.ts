import type { FastifyInstance } from "fastify";
import { getAnalytics } from "../services/supabaseAdmin.js";

export default async function adminRoutes(fastify: FastifyInstance) {
  // Simple secret-key auth for admin endpoints
  fastify.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/admin")) return;

    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      return reply.status(503).send({ error: "Admin panel not configured" });
    }

    const key = request.headers["x-admin-key"];
    if (key !== adminSecret) {
      return reply.status(401).send({ error: "Invalid admin key" });
    }
  });

  // ── GET /api/admin/analytics ──────────────────────────────────────────────
  fastify.get("/admin/analytics", async (request, reply) => {
    const { days } = request.query as { days?: string };
    const numDays = Math.min(Math.max(Number(days) || 7, 1), 90);

    try {
      const analytics = await getAnalytics(numDays);
      return reply.send(analytics);
    } catch (err) {
      request.log.error({ err }, "admin.analytics.query_failed");
      return reply.status(500).send({ error: "Failed to fetch analytics" });
    }
  });
}
