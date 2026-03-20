import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { generateGroundedAnswer, streamGroundedAnswer } from "../services/ai/answer.js";

const chatBodySchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
});

type ChatBody = z.infer<typeof chatBodySchema>;

const MAX_MESSAGES_PER_CONVERSATION = 200;

export default async function chatRoutes(fastify: FastifyInstance) {
  async function requireChatAccess(request: FastifyRequest, reply: FastifyReply) {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { hasChatAccess: true },
    });

    if (!user?.hasChatAccess) {
      return reply.status(403).send({ error: "Chat access not enabled" });
    }
  }

  // GET /conversations — list user's conversations
  fastify.get(
    "/conversations",
    { preHandler: [fastify.authenticate, requireChatAccess] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user.id;

      const conversations = await fastify.prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.send({ conversations });
    },
  );

  // GET /conversations/:id/messages — get all messages for a conversation
  fastify.get<{ Params: { id: string } }>(
    "/conversations/:id/messages",
    { preHandler: [fastify.authenticate, requireChatAccess] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id } = request.params;

      const conversation = await fastify.prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!conversation) {
        return reply.status(404).send({ error: "Conversation not found" });
      }

      const messages = await fastify.prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          metadata: true,
          createdAt: true,
        },
      });

      return reply.send({ messages });
    },
  );

  // DELETE /conversations/:id — delete a conversation
  fastify.delete<{ Params: { id: string } }>(
    "/conversations/:id",
    { preHandler: [fastify.authenticate, requireChatAccess] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const userId = request.user.id;
      const { id } = request.params;

      const conversation = await fastify.prisma.conversation.findFirst({
        where: { id, userId },
      });

      if (!conversation) {
        return reply.status(404).send({ error: "Conversation not found" });
      }

      await fastify.prisma.conversation.delete({ where: { id } });

      return reply.send({ success: true });
    },
  );

  // POST /chat — send a message and get a response
  fastify.post<{ Body: ChatBody }>(
    "/chat",
    {
      preHandler: [fastify.authenticate, requireChatAccess],
      config: {
        rateLimit: {
          max: 15,
          timeWindow: "1 minute",
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = chatBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { message, conversationId } = parsed.data;
      const userId = request.user.id;

      let conversation: { id: string };

      if (conversationId) {
        const existing = await fastify.prisma.conversation.findFirst({
          where: { id: conversationId, userId },
        });

        if (!existing) {
          return reply.status(404).send({
            error: "Conversation not found",
          });
        }

        // Enforce max messages per conversation to prevent unbounded growth
        const messageCount = await fastify.prisma.message.count({
          where: { conversationId },
        });
        if (messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
          return reply.status(429).send({
            error: "Conversation has reached the maximum number of messages. Please start a new conversation.",
          });
        }

        conversation = existing;
      } else {
        // Generate title from the first message (truncate to 60 chars)
        const title =
          message.length > 60 ? message.substring(0, 57) + "..." : message;

        conversation = await fastify.prisma.conversation.create({
          data: { userId, title },
        });
      }

      const history = await fastify.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          role: true,
          content: true,
        },
      });

      const userMessage = await fastify.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: message,
        },
      });

      const groundedAnswer = await generateGroundedAnswer({
        fastify,
        userId,
        question: message,
        history: history.reverse(),
      });

      const assistantMessage = await fastify.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: groundedAnswer.content,
          metadata: groundedAnswer.metadata as unknown as Prisma.InputJsonValue,
        },
      });

      // Non-critical write; avoid blocking chat response latency.
      void fastify.prisma.conversation
        .update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        })
        .catch((error: any) => {
          fastify.log.warn({ error, conversationId: conversation.id }, "chat.touch_updatedAt_failed");
        });

      return reply.status(200).send({
        conversationId: conversation.id,
        userMessage: {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
          createdAt: userMessage.createdAt,
        },
        assistantMessage: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt,
          metadata: assistantMessage.metadata,
        },
      });
    },
  );

  // POST /chat/stream — SSE streaming variant
  fastify.post<{ Body: ChatBody }>(
    "/chat/stream",
    {
      preHandler: [fastify.authenticate, requireChatAccess],
      config: {
        rateLimit: {
          max: 15,
          timeWindow: "1 minute",
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = chatBodySchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { message, conversationId } = parsed.data;
      const userId = request.user.id;

      let conversation: { id: string };

      if (conversationId) {
        const existing = await fastify.prisma.conversation.findFirst({
          where: { id: conversationId, userId },
        });

        if (!existing) {
          return reply.status(404).send({ error: "Conversation not found" });
        }

        const messageCount = await fastify.prisma.message.count({
          where: { conversationId },
        });
        if (messageCount >= MAX_MESSAGES_PER_CONVERSATION) {
          return reply.status(429).send({
            error: "Conversation has reached the maximum number of messages.",
          });
        }

        conversation = existing;
      } else {
        const title =
          message.length > 60 ? message.substring(0, 57) + "..." : message;
        conversation = await fastify.prisma.conversation.create({
          data: { userId, title },
        });
      }

      const history = await fastify.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { role: true, content: true },
      });

      const userMessage = await fastify.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "USER",
          content: message,
        },
      });

      // Set SSE headers directly on the raw response so they merge with
      // any CORS headers already set by @fastify/cors via res.setHeader().
      // reply.header() stores on Fastify's internal map and never reaches
      // reply.raw when we bypass reply.send() with raw writes.
      const origin = request.headers.origin;
      if (origin && fastify.isOriginAllowed(origin)) {
        reply.raw.setHeader("Access-Control-Allow-Origin", origin);
        reply.raw.setHeader("Access-Control-Allow-Credentials", "true");
      }
      reply.raw.setHeader("Content-Type", "text/event-stream");
      reply.raw.setHeader("Cache-Control", "no-cache");
      reply.raw.setHeader("Connection", "keep-alive");
      reply.raw.setHeader("X-Accel-Buffering", "no");
      reply.raw.setHeader("Vary", "Origin");
      reply.raw.writeHead(200);

      const stream = streamGroundedAnswer({
        fastify,
        userId,
        question: message,
        history: history.reverse(),
        conversationId: conversation.id,
        userMessageId: userMessage.id,
      });

      try {
        for await (const event of stream) {
          const data = JSON.stringify(event);
          reply.raw.write(`data: ${data}\n\n`);
        }
      } catch (err) {
        const errorEvent = JSON.stringify({
          type: "error",
          error: "Stream interrupted",
        });
        reply.raw.write(`data: ${errorEvent}\n\n`);
      }

      reply.raw.write("data: [DONE]\n\n");
      reply.raw.end();
    },
  );
}
