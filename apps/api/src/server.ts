import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import prismaPlugin from "./plugins/prisma.js";
import supabasePlugin from "./plugins/supabase.js";
import healthRoutes from "./routes/health.js";
import chatRoutes from "./routes/chat.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import resourceRoutes from "./routes/resources.js";
import { getSupabaseAdmin } from "./services/supabaseAdmin.js";
import { warmHydeCache } from "./services/ai/retrieval.js";

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
    bodyLimit: 1_048_576, // 1 MB
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
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
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

  // Global rate limit: 100 requests/minute per IP
  // Skip OPTIONS preflight requests — they don't need rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      return (request as any).user?.id ?? request.ip;
    },
    allowList: (request) => request.method === "OPTIONS",
  });

  await server.register(multipart, {
    limits: { fileSize: 20_971_520 }, // 20 MB
  });

  await server.register(prismaPlugin);
  await server.register(supabasePlugin);

  await server.register(healthRoutes);
  await server.register(chatRoutes, { prefix: "/api" });
  await server.register(userRoutes, { prefix: "/api" });
  await server.register(adminRoutes, { prefix: "/api" });
  await server.register(resourceRoutes, { prefix: "/api" });

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

  // Ensure Supabase Storage bucket exists
  const supaAdmin = getSupabaseAdmin();
  if (supaAdmin) {
    const { error } = await supaAdmin.storage.createBucket("resources", {
      public: false,
    });
    if (error && !error.message.includes("already exists")) {
      server.log.warn({ error }, "Could not create storage bucket");
    }
  }

  try {
    await server.listen({ host, port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Non-blocking: pre-warm HyDE cache with common queries after startup
  warmHydeCache().catch((err) =>
    server.log.warn({ err }, "hyde.warmup.failed"),
  );

  const shutdown = async () => {
    server.log.info("Shutting down...");
    await server.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
