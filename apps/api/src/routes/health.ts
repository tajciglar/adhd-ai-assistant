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
}
