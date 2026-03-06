import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import healthRoutes from "./routes/health.js";
import guestRoutes from "./routes/guest.js";

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
    bodyLimit: 2_097_152, // 2 MB (PDF responses can be larger)
  });

  const rawOrigins =
    process.env.CORS_ORIGIN ?? "http://localhost:3000,http://localhost:5173";
  const allowedOrigins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => (origin.startsWith("http") ? origin : `https://${origin}`));

  await server.register(helmet, {
    global: true,
    contentSecurityPolicy: false, // API only
    hsts: environment === "production",
    hidePoweredBy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
  });

  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Origin not allowed"), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
    // Browsers cache preflight for 1 hour (avoids repeated OPTIONS requests)
    maxAge: 3600,
    // Handle preflight immediately, before other hooks/plugins
    strictPreflight: false,
  });

  server.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (!origin) return;
    if (request.url.startsWith("/health")) return;

    if (!allowedOrigins.includes(origin)) {
      await reply.status(403).send({ error: "Origin not allowed" });
    }
  });

  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    allowList: (request) => request.method === "OPTIONS",
  });

  await server.register(healthRoutes);
  await server.register(guestRoutes, { prefix: "/api" });

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
  const port = Number(process.env.PORT) || 3000;

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
