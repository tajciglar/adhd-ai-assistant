import type { FastifyInstance } from "fastify";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
    } catch {
      return reply.status(503).send({
        status: "error",
        message: "Database connection failed",
      });
    }

    return reply.send({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  fastify.get("/health/deep", async (_request, reply) => {
    if (process.env.ENABLE_DEEP_HEALTHCHECK !== "true") {
      return reply.status(404).send({ error: "Not found" });
    }

    try {
      await fastify.prisma.$queryRaw`SELECT 1`;
    } catch {
      return reply.status(503).send({
        status: "error",
        checks: { database: "down" },
      });
    }

    return reply.send({
      status: "ok",
      checks: {
        database: "up",
        geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      },
      timestamp: new Date().toISOString(),
    });
  });
}
