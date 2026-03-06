import type { FastifyInstance } from "fastify";
import { z } from "zod";
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

type AcLogger = {
  error: (obj: unknown, msg: string) => void;
  warn: (msg: string) => void;
};

// Upload PDF buffer to AC file manager, return public URL or null
async function uploadPdfToAC(opts: {
  pdfBuffer: Buffer;
  filename: string;
  apiUrl: string;
  apiKey: string;
  logger: AcLogger;
}): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([opts.pdfBuffer.buffer as ArrayBuffer], { type: "application/pdf" }),
      opts.filename,
    );

    const res = await fetch(`${opts.apiUrl}/api/3/files`, {
      method: "POST",
      headers: { "Api-Token": opts.apiKey },
      body: formData,
    });

    if (!res.ok) {
      opts.logger.warn(`AC file upload failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { file: { url: string } };
    return data.file.url ?? null;
  } catch (err) {
    opts.logger.error({ err }, "guest.submit.ac_file_upload_failed");
    return null;
  }
}

// Find or create a custom field by perstag, return its ID
async function getOrCreateAcField(opts: {
  apiUrl: string;
  headers: Record<string, string>;
  perstag: string;
  title: string;
  logger: AcLogger;
}): Promise<string | null> {
  try {
    const searchRes = await fetch(
      `${opts.apiUrl}/api/3/fields?search=${encodeURIComponent(opts.perstag)}`,
      { headers: opts.headers },
    );
    const searchData = (await searchRes.json()) as {
      fields: Array<{ id: number | string; perstag: string }>;
    };

    const existing = searchData.fields.find((f) => f.perstag === opts.perstag);
    if (existing) return String(existing.id);

    const createRes = await fetch(`${opts.apiUrl}/api/3/fields`, {
      method: "POST",
      headers: opts.headers,
      body: JSON.stringify({
        field: {
          type: "text",
          title: opts.title,
          descript: "",
          isrequired: "0",
          perstag: opts.perstag,
          visible: "1",
        },
      }),
    });

    const createData = (await createRes.json()) as {
      field: { id: number | string };
    };
    return String(createData.field.id);
  } catch (err) {
    opts.logger.error({ err }, "guest.submit.ac_field_lookup_failed");
    return null;
  }
}

// Sync contact to AC, upload PDF, store URL as custom field, apply tags
async function syncToActiveCampaign(opts: {
  email: string;
  childName: string;
  archetypeId: string;
  archetypeName: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
  logger: AcLogger;
}): Promise<void> {
  const apiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.AC_API_KEY;
  if (!apiUrl || !apiKey) return;

  const headers = {
    "Content-Type": "application/json",
    "Api-Token": apiKey,
  };

  try {
    // 1. Upload PDF to AC file manager
    const pdfUrl = await uploadPdfToAC({
      pdfBuffer: opts.pdfBuffer,
      filename: opts.pdfFilename,
      apiUrl,
      apiKey,
      logger: opts.logger,
    });

    // 2. Create or update contact
    const contactRes = await fetch(`${apiUrl}/api/3/contact/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({ contact: { email: opts.email } }),
    });

    if (!contactRes.ok) {
      opts.logger.warn(`AC contact sync failed: ${contactRes.status}`);
      return;
    }

    const contactData = (await contactRes.json()) as {
      contact: { id: number | string };
    };
    const contactId = String(contactData.contact.id);

    // 3. Store PDF URL as custom field %PDF_URL% on the contact
    if (pdfUrl) {
      const fieldId = await getOrCreateAcField({
        apiUrl,
        headers,
        perstag: "PDF_URL",
        title: "PDF URL",
        logger: opts.logger,
      });

      if (fieldId) {
        await fetch(`${apiUrl}/api/3/fieldValues`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            fieldValue: {
              contact: contactId,
              field: fieldId,
              value: pdfUrl,
            },
          }),
        }).catch((err: unknown) => {
          opts.logger.error({ err }, "guest.submit.ac_field_value_failed");
        });
      }
    }

    // 4. Subscribe contact to master list so automations can fire
    const listId = process.env.AC_LIST_ID;
    if (listId) {
      await fetch(`${apiUrl}/api/3/contactLists`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          contactList: { list: Number(listId), contact: contactId, status: 1 },
        }),
      }).catch((err: unknown) => {
        opts.logger.error({ err }, "guest.submit.ac_list_subscription_failed");
      });
    }

    // 5. Apply tags: "onboarding-completed" + archetype ID + archetype animal
    const tagNames = [
      "onboarding-completed",
      opts.archetypeId,
      opts.archetypeName,
    ].filter(Boolean);

    for (const tagName of tagNames) {
      const searchRes = await fetch(
        `${apiUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`,
        { headers },
      );
      const searchData = (await searchRes.json()) as {
        tags: Array<{ id: number | string; tag: string }>;
      };

      let tagId = String(
        searchData.tags.find((t) => t.tag === tagName)?.id ?? "",
      );

      if (!tagId || tagId === "undefined") {
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

// Send server-side event to Meta Conversions API
async function sendMetaEvent(opts: {
  eventName: string;
  eventId: string;
  email: string;
  sourceUrl: string;
  clientIp: string;
  userAgent: string;
  fbc?: string;
  fbp?: string;
  logger: AcLogger;
}): Promise<void> {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID;
  if (!accessToken || !pixelId) return;

  try {
    // SHA-256 hash the email (required by Meta)
    const encoder = new TextEncoder();
    const data = encoder.encode(opts.email.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashedEmail = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const userData: Record<string, unknown> = {
      em: [hashedEmail],
      client_ip_address: opts.clientIp,
      client_user_agent: opts.userAgent,
    };
    if (opts.fbc) userData.fbc = opts.fbc;
    if (opts.fbp) userData.fbp = opts.fbp;

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          data: [
            {
              event_name: opts.eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: opts.eventId,
              event_source_url: opts.sourceUrl,
              action_source: "website",
              user_data: userData,
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json();
      opts.logger.warn(`Meta CAPI failed: ${JSON.stringify(err)}`);
    }
  } catch (err) {
    opts.logger.error({ err }, "guest.submit.meta_capi_failed");
  }
}

const submitBodySchema = z.object({
  email: z.string().email(),
  responses: z.record(z.string(), z.unknown()),
  childName: z.string().min(1).max(100),
  childGender: z.string().optional(),
  // Meta pixel data from client
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  eventSourceUrl: z.string().optional(),
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

      const { email, responses, childName, childGender, fbc, fbp, eventSourceUrl } = parsed.data;

      // 1. Compute trait profile
      const traitProfile = computeTraitProfile(responses);
      const archetype = ARCHETYPES.find((a) => a.id === traitProfile.archetypeId);

      // 2. Load report template
      const rawTemplate = getReportTemplate(traitProfile.archetypeId);
      if (!rawTemplate) {
        request.log.error(
          { archetypeId: traitProfile.archetypeId },
          "guest.submit.template_not_found",
        );
        return reply.status(422).send({
          error: "Report template not found for this profile. Please contact support.",
        });
      }

      // 3. Render template
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

      // 5a. Meta CAPI — Lead event (fire and forget, deduped with client-side fbq via event_id)
      void sendMetaEvent({
        eventName: "Lead",
        eventId: `lead_${email}_${Date.now()}`,
        email,
        sourceUrl: eventSourceUrl ?? "",
        clientIp: request.ip ?? "",
        userAgent: request.headers["user-agent"] ?? "",
        fbc,
        fbp,
        logger: request.log,
      });

      // 5b. Upload PDF to AC + sync contact + set PDF_URL field + apply tags (fire and forget)
      //    AC automation reads %PDF_URL% and sends the email after purchase
      void syncToActiveCampaign({
        email,
        childName,
        archetypeId: traitProfile.archetypeId,
        archetypeName: archetype?.animal ?? "",
        pdfBuffer,
        pdfFilename: `${toSlug(childName)}-adhd-guide.pdf`,
        logger: request.log,
      });

      // 6. Return rendered report for sales page (no PDF sent to user yet)
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
