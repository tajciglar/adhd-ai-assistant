import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import prismaPlugin from "./plugins/prisma.js";
import supabasePlugin from "./plugins/supabase.js";
import healthRoutes from "./routes/health.js";
import onboardingRoutes from "./routes/onboarding.js";
import chatRoutes from "./routes/chat.js";

const envToLogger: Record<string, object | boolean> = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const environment = process.env.NODE_ENV ?? "development";

async function buildServer() {
  const server = Fastify({
    logger: envToLogger[environment] ?? true,
  });

  await server.register(cors, {
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  });

  await server.register(prismaPlugin);
  await server.register(supabasePlugin);

  await server.register(healthRoutes);
  await server.register(onboardingRoutes, { prefix: "/api" });
  await server.register(chatRoutes, { prefix: "/api" });

  server.setErrorHandler((error: FastifyError, _request, reply) => {
    server.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: "Validation error",
        message: error.message,
      });
    }

    const statusCode = error.statusCode ?? 500;
    const message =
      statusCode >= 500 ? "Internal server error" : error.message;

    return reply.status(statusCode).send({
      error: message,
    });
  });

  return server;
}

async function main() {
  const server = await buildServer();

  const host = process.env.HOST ?? "0.0.0.0";
  const port = Number(process.env.PORT) || 3001;

  try {
    await server.listen({ host, port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  const shutdown = async () => {
    server.log.info("Shutting down...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
