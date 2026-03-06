import type { FastifyInstance } from "fastify";
import { z } from "zod";
import nodemailer from "nodemailer";
import {
  computeTraitProfile,
  ARCHETYPES,
  renderReportTemplate,
  getReportTemplate,
  type ArchetypeReportTemplate,
} from "@adhd-ai-assistant/shared";
import { generateReportPdf } from "../services/pdf/generateReportPdf.js";

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ActiveCampaign API — create/update contact and apply archetype tags
async function syncToActiveCampaign(opts: {
  email: string;
  childName: string;
  archetypeId: string;
  archetypeName: string;
  logger: { error: (obj: unknown, msg: string) => void; warn: (msg: string) => void };
}): Promise<void> {
  const apiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.AC_API_KEY;
  if (!apiUrl || !apiKey) return;

  const headers = {
    "Content-Type": "application/json",
    "Api-Token": apiKey,
  };

  try {
    // 1. Create or update contact
    const contactRes = await fetch(`${apiUrl}/api/3/contact/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contact: { email: opts.email },
      }),
    });

    if (!contactRes.ok) {
      opts.logger.warn(`AC contact sync failed: ${contactRes.status}`);
      return;
    }

    const contactData = (await contactRes.json()) as {
      contact: { id: number | string };
    };
    const contactId = String(contactData.contact.id);

    // 2. Tags to apply: "onboarding-completed" + archetype ID + archetype animal name
    const tagNames = [
      "onboarding-completed",
      opts.archetypeId,
      opts.archetypeName,
    ].filter(Boolean);

    for (const tagName of tagNames) {
      // Get or create tag
      const searchRes = await fetch(
        `${apiUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`,
        { headers },
      );
      const searchData = (await searchRes.json()) as {
        tags: Array<{ id: number | string; tag: string }>;
      };

      let tagId: string | undefined = String(
        searchData.tags.find((t) => t.tag === tagName)?.id ?? "",
      );

      if (!tagId || tagId === "undefined") {
        // Create the tag
        const createRes = await fetch(`${apiUrl}/api/3/tags`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            tag: { tag: tagName, tagType: "contact", description: "" },
          }),
        });
        const createData = (await createRes.json()) as {
          tag: { id: number | string };
        };
        tagId = String(createData.tag.id);
      }

      if (tagId && tagId !== "undefined") {
        await fetch(`${apiUrl}/api/3/contactTags`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contactTag: { contact: contactId, tag: tagId },
          }),
        });
      }
    }
  } catch (err) {
    opts.logger.error({ err }, "guest.submit.activecampaign_sync_failed");
  }
}

function createMailTransporter() {
  const host = process.env.AC_SMTP_HOST;
  const port = Number(process.env.AC_SMTP_PORT ?? 587);
  const user = process.env.AC_SMTP_USER;
  const pass = process.env.AC_SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const submitBodySchema = z.object({
  email: z.string().email(),
  responses: z.record(z.string(), z.unknown()),
  childName: z.string().min(1).max(100),
  childGender: z.string().optional(),
});

const pdfBodySchema = z.object({
  report: z.record(z.string(), z.unknown()),
  childName: z.string().min(1).max(100),
});

export default async function guestRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/guest/submit",
    {
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 hour",
          keyGenerator: (req) => req.ip,
        },
      },
    },
    async (request, reply) => {
      const parsed = submitBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      const { email, responses, childName, childGender } = parsed.data;

      // 1. Compute trait profile from responses
      const traitProfile = computeTraitProfile(responses);
      const archetype = ARCHETYPES.find((a) => a.id === traitProfile.archetypeId);

      // 2. Load report template from static bundle
      const rawTemplate = getReportTemplate(traitProfile.archetypeId);

      if (!rawTemplate) {
        request.log.error(
          { archetypeId: traitProfile.archetypeId },
          "guest.submit.template_not_found",
        );
        return reply.status(422).send({
          error:
            "Report template not found for this profile. Please contact support.",
        });
      }

      // 3. Render template with child name/gender
      const rendered = renderReportTemplate(rawTemplate, {
        name: childName,
        gender: childGender ?? "Other",
      });

      // 4. Generate PDF
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await generateReportPdf(rendered, { name: childName });
      } catch (err) {
        request.log.error({ err }, "guest.submit.pdf_generation_failed");
        return reply.status(500).send({ error: "Failed to generate report PDF" });
      }

      // 5a. Sync to ActiveCampaign (fire and forget)
      void syncToActiveCampaign({
        email,
        childName,
        archetypeId: traitProfile.archetypeId,
        archetypeName: archetype?.animal ?? "",
        logger: request.log,
      });

      // 5b. Send email with PDF (non-blocking — user still gets results if email fails)
      const transporter = createMailTransporter();
      if (transporter) {
        const filename = `${toSlug(childName)}-adhd-guide.pdf`;
        const from =
          process.env.REPORT_EMAIL_FROM ?? "Harbor <noreply@harbor.ai>";

        const childDisplayName = childName;
        const archetypeName = archetype?.animal ?? "";

        transporter
          .sendMail({
            from,
            to: email,
            subject: `${childDisplayName}'s ADHD Profile Guide`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #1a1a2e;">Here's ${childDisplayName}'s ADHD Profile Guide</h2>
                <p>Thank you for completing the assessment. Based on your answers, ${childDisplayName}'s profile is <strong>${archetypeName}</strong>.</p>
                <p>Your full personalised guide is attached as a PDF. It includes:</p>
                <ul>
                  <li>What makes ${childDisplayName}'s brain unique</li>
                  <li>What drains and fuels them</li>
                  <li>How to support them when overwhelmed</li>
                  <li>What to say — and what to avoid</li>
                </ul>
                <p style="color: #666; font-size: 14px;">This guide was generated based on your responses. It is for informational purposes and is not a clinical diagnosis.</p>
              </div>
            `,
            attachments: [{ filename, content: pdfBuffer }],
          })
          .catch((err: unknown) => {
            request.log.error({ err }, "guest.submit.email_send_failed");
          });
      } else {
        request.log.warn("guest.submit.email_not_configured");
      }

      // 6. Return rendered report for immediate display
      return reply.send({ report: rendered });
    },
  );

  fastify.post(
    "/guest/pdf",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 hour",
          keyGenerator: (req) => req.ip,
        },
      },
    },
    async (request, reply) => {
      const parsed = pdfBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request body" });
      }

      const { report, childName } = parsed.data;

      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await generateReportPdf(
          report as unknown as ArchetypeReportTemplate,
          { name: childName },
        );
      } catch (err) {
        request.log.error({ err }, "guest.pdf.generation_failed");
        return reply.status(500).send({ error: "Failed to generate PDF" });
      }

      const filename = `${toSlug(childName)}-adhd-guide.pdf`;

      reply
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", `attachment; filename="${filename}"`);

      return reply.send(pdfBuffer);
    },
  );
}
