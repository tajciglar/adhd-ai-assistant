import type { FastifyInstance } from "fastify";
import { z } from "zod";

const chatBodySchema = z.object({
  userId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  conversationId: z.string().uuid().optional(),
});

type ChatBody = z.infer<typeof chatBodySchema>;

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: ChatBody }>("/chat", async (request, reply) => {
    const parsed = chatBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { userId, message, conversationId } = parsed.data;

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.status(404).send({
        error: "User not found",
      });
    }

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

      conversation = existing;
    } else {
      conversation = await fastify.prisma.conversation.create({
        data: { userId },
      });
    }

    const userMessage = await fastify.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    // TODO: integrate with AI service for actual response generation
    const assistantContent =
      "I received your message. AI integration is pending.";

    const assistantMessage = await fastify.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantContent,
      },
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
      },
    });
  });
}
