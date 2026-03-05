import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Resend } from "resend";
import { z } from "zod";
import {
  renderReportTemplate,
  type ArchetypeReportTemplate,
} from "@adhd-ai-assistant/shared";
import { generateReportPdf } from "../services/pdf/generateReportPdf.js";

const childParamsSchema = z.object({
  childId: z.string().uuid(),
});

type ChildParams = z.infer<typeof childParamsSchema>;

interface AuthorizedChild {
  id: string;
  childName: string;
  childGender: string | null;
  user: {
    id: string;
    email: string;
    hasChatAccess: boolean;
  };
  traitProfile: unknown;
}

function getArchetypeId(traitProfile: unknown): string | null {
  if (
    typeof traitProfile === "object" &&
    traitProfile !== null &&
    "archetypeId" in traitProfile &&
    typeof traitProfile.archetypeId === "string"
  ) {
    return traitProfile.archetypeId;
  }
  return null;
}

async function buildRenderedReport(
  fastify: FastifyInstance,
  child: AuthorizedChild,
): Promise<ArchetypeReportTemplate | null> {
  const archetypeId = getArchetypeId(child.traitProfile);
  if (!archetypeId) return null;

  const dbTemplate = await fastify.prisma.reportTemplate.findUnique({
    where: { archetypeId },
    select: { template: true },
  });

  const template = dbTemplate?.template as ArchetypeReportTemplate | null;
  if (!template) return null;

  return renderReportTemplate(template, {
    name: child.childName || "Your child",
    gender: child.childGender ?? "Other",
  });
}

async function getAuthorizedChild(
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<AuthorizedChild | null> {
  const paramsResult = childParamsSchema.safeParse(request.params);
  if (!paramsResult.success) {
    await reply.status(400).send({ error: "Invalid childId" });
    return null;
  }

  const { childId } = paramsResult.data;
  const child = await fastify.prisma.childProfile.findUnique({
    where: { id: childId },
    select: {
      id: true,
      childName: true,
      childGender: true,
      traitProfile: true,
      profile: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              hasChatAccess: true,
            },
          },
        },
      },
    },
  });

  if (!child) {
    await reply.status(404).send({ error: "Child not found" });
    return null;
  }

  if (child.profile.user.id !== request.user.id) {
    await reply.status(403).send({ error: "Forbidden" });
    return null;
  }

  return {
    id: child.id,
    childName: child.childName,
    childGender: child.childGender,
    traitProfile: child.traitProfile,
    user: child.profile.user,
  };
}

// renders report data for the child. Returns 422 if report can't be generated (e.g. missing archetypeId from trait profile)
export default async function reportRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: ChildParams }>(
    "/report/:childId",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const child = await getAuthorizedChild(fastify, request, reply);
      if (!child) return;

      const report = await buildRenderedReport(fastify, child);
      if (!report) {
        return reply.status(422).send({
          error:
            "Report is not available yet for this child. Complete onboarding first.",
        });
      }

      return reply.send({
        childId: child.id,
        hasChatAccess: child.user.hasChatAccess,
        report,
      });
    },
  );

  // downloads pdf version of the report
  fastify.get<{ Params: ChildParams }>(
    "/report/:childId/pdf",
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const child = await getAuthorizedChild(fastify, request, reply);
      if (!child) return;

      const report = await buildRenderedReport(fastify, child);
      if (!report) {
        return reply.status(422).send({
          error:
            "Report is not available yet for this child. Complete onboarding first.",
        });
      }

      const pdf = await generateReportPdf(report, {
        name: child.childName || "Your child",
      });

      const safeName = (child.childName || "child")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .toLowerCase();

      reply
        .header("Content-Type", "application/pdf")
        .header(
          "Content-Disposition",
          `attachment; filename="${safeName}-report.pdf"`,
        );

      return reply.send(pdf);
    },
  );

  fastify.post<{ Params: ChildParams }>(
    "/report/:childId/email",
    {
      preHandler: [fastify.authenticate],
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "1 hour",
          keyGenerator: (request) => request.user.id,
        },
      },
    },
    async (request, reply) => {
      const child = await getAuthorizedChild(fastify, request, reply);
      if (!child) return;

      const report = await buildRenderedReport(fastify, child);
      if (!report) {
        return reply.status(422).send({
          error:
            "Report is not available yet for this child. Complete onboarding first.",
        });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      const from = process.env.REPORT_EMAIL_FROM ?? "Harbor <noreply@harbor.ai>";
      if (!resendApiKey) {
        request.log.error("report.email.missing_resend_api_key");
        return reply.status(503).send({
          error: "Email service not configured",
        });
      }

      const pdf = await generateReportPdf(report, {
        name: child.childName || "Your child",
      });

      const resend = new Resend(resendApiKey);
      const filename = `${(child.childName || "child").replace(/\s+/g, "-").toLowerCase()}-report.pdf`;

      const { error } = await resend.emails.send({
        from,
        to: child.user.email,
        subject: `${child.childName || "Your child"}'s Harbor Report`,
        html: `<p>Your report is attached as a PDF.</p>`,
        attachments: [
          {
            filename,
            content: pdf,
          },
        ],
      });

      if (error) {
        request.log.error({ error }, "report.email.send_failed");
        return reply.status(502).send({ error: "Failed to send report email" });
      }

      return reply.send({ success: true });
    },
  );
}
