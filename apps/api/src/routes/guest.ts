import type { FastifyInstance } from "fastify";
import { createHmac } from "crypto";
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

// Build a signed URL that encodes everything needed to regenerate the PDF on demand.
// No file storage required — Railway generates the PDF when the link is clicked.
function generatePdfUrl(opts: {
  archetypeId: string;
  childName: string;
  childGender?: string;
}): string {
  const baseUrl = (process.env.API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const secret = process.env.PDF_SIGNING_SECRET ?? "dev-secret";

  const payload = JSON.stringify({
    archetypeId: opts.archetypeId,
    childName: opts.childName,
    childGender: opts.childGender ?? "",
  });

  const data = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", secret).update(data).digest("hex");

  return `${baseUrl}/api/guest/pdf?data=${data}&sig=${sig}`;
}

// Sync contact to AC: store PDF download URL as custom field, subscribe to list, apply tags
async function syncToActiveCampaign(opts: {
  email: string;
  childName: string;
  archetypeId: string;
  archetypeName: string;
  pdfUrl: string;
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
    // 1. Create or update contact
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

    // 2. Find or create PDF_URL custom field, then set the signed download URL
    // Fetch all fields (no search filter) and match by perstag — avoids title/search mismatch
    const searchRes = await fetch(`${apiUrl}/api/3/fields?limit=100`, { headers });
    const searchData = (await searchRes.json()) as {
      fields: Array<{ id: number | string; perstag: string }>;
    };

    let fieldId = String(
      searchData.fields.find((f) => f.perstag.replace(/%/g, "") === "PDF_URL")?.id ?? "",
    );

    if (!fieldId || fieldId === "undefined") {
      const createRes = await fetch(`${apiUrl}/api/3/fields`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          field: {
            type: "text",
            title: "PDF URL",
            descript: "",
            isrequired: "0",
            perstag: "PDF_URL",
            visible: "1",
          },
        }),
      });
      const createData = (await createRes.json()) as {
        field?: { id: number | string };
      };
      if (createData.field?.id) fieldId = String(createData.field.id);
    }

    if (fieldId && fieldId !== "undefined") {
      opts.logger.warn(`guest.submit.ac_setting_pdf_url fieldId=${fieldId} contactId=${contactId}`);
      const fvRes = await fetch(`${apiUrl}/api/3/fieldValues`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          fieldValue: { contact: contactId, field: fieldId, value: opts.pdfUrl },
        }),
      }).catch((err: unknown) => {
        opts.logger.error({ err }, "guest.submit.ac_field_value_failed");
        return null;
      });
      if (fvRes && !fvRes.ok) {
        const body = await fvRes.json().catch(() => null);
        opts.logger.error(
          { status: fvRes.status, body, fieldId, contactId },
          "guest.submit.ac_field_value_http_error",
        );
      } else if (fvRes?.ok) {
        opts.logger.warn(`guest.submit.ac_pdf_url_set_ok contactId=${contactId}`);
      }
    } else {
      opts.logger.warn("guest.submit.ac_field_id_missing — could not find or create PDF_URL field");
    }

    // 3. Subscribe contact to list so automations fire
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

    // 4. Apply tags
    const tagNames = ["adhd quiz wildprint"];

    for (const tagName of tagNames) {
      const tagSearchRes = await fetch(
        `${apiUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`,
        { headers },
      );
      const tagSearchData = (await tagSearchRes.json()) as {
        tags: Array<{ id: number | string; tag: string }>;
      };

      let tagId = String(
        tagSearchData.tags.find((t) => t.tag === tagName)?.id ?? "",
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
          tag?: { id: number | string };
        };
        if (createData.tag?.id) tagId = String(createData.tag.id);
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

// Check if email has already completed THIS quiz.
// A contact may exist on other AC lists — we only block if they also have
// the "adhd quiz wildprint" tag, which is applied exclusively on quiz submission.
async function checkAlreadySubmitted(email: string): Promise<boolean> {
  const apiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.AC_API_KEY;
  if (!apiUrl || !apiKey) return false;

  try {
    const headers = { "Content-Type": "application/json", "Api-Token": apiKey };

    // 1. Contact lookup + tag ID lookup run in parallel
    const [contactRes, tagRes] = await Promise.all([
      fetch(`${apiUrl}/api/3/contacts?email=${encodeURIComponent(email)}&limit=1`, { headers }),
      fetch(`${apiUrl}/api/3/tags?search=${encodeURIComponent("adhd quiz wildprint")}`, { headers }),
    ]);

    if (!contactRes.ok) return false;

    const contactData = (await contactRes.json()) as { contacts: Array<{ id: string }> };
    if (!contactData.contacts?.length) return false; // email not in AC at all

    const contactId = String(contactData.contacts[0].id);

    // If the quiz tag doesn't exist yet, nobody has ever completed it
    if (!tagRes.ok) return false;
    const tagData = (await tagRes.json()) as { tags: Array<{ id: string; tag: string }> };
    const quizTag = tagData.tags.find((t) => t.tag === "adhd quiz wildprint");
    if (!quizTag) return false;

    const tagId = String(quizTag.id);

    // 2. Check whether this specific contact has the quiz tag
    const contactTagsRes = await fetch(
      `${apiUrl}/api/3/contactTags?contact=${contactId}`,
      { headers },
    );
    if (!contactTagsRes.ok) return false;

    const contactTagsData = (await contactTagsRes.json()) as {
      contactTags: Array<{ tag: string }>;
    };

    return contactTagsData.contactTags.some((ct) => String(ct.tag) === tagId);
  } catch {
    return false; // fail open — don't block submissions if AC is unreachable
  }
}

const submitBodySchema = z.object({
  email: z.string().email(),
  responses: z.record(z.string(), z.unknown()),
  childName: z.string().min(1).max(100),
  childGender: z.string().optional(),
  fbc: z.string().optional(),
  fbp: z.string().optional(),
  eventSourceUrl: z.string().optional(),
});

const pdfQuerySchema = z.object({
  data: z.string().min(1),
  sig: z.string().min(1),
});

export default async function guestRoutes(fastify: FastifyInstance) {
  // ── POST /api/guest/submit ──────────────────────────────────────────────────
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

      // 0. Duplicate email check
      const alreadySubmitted = await checkAlreadySubmitted(email);
      if (alreadySubmitted) {
        return reply.status(409).send({ error: "already_submitted" });
      }

      // 1. Compute trait profile
      const traitProfile = computeTraitProfile(responses);
      const archetype = ARCHETYPES.find((a) => a.id === traitProfile.archetypeId);

      // Log scores for analytics (visible in Railway logs)
      request.log.info({
        event: "quiz_submission",
        archetypeId: traitProfile.archetypeId,
        scores: traitProfile.scores,
      }, "guest.submit.scores");

      // 2. Load and render report template
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

      const rendered = renderReportTemplate(rawTemplate, {
        name: childName,
        gender: childGender ?? "Other",
      });

      // 3. Generate signed PDF download URL (no file storage needed)
      const pdfUrl = generatePdfUrl({
        archetypeId: traitProfile.archetypeId,
        childName,
        childGender,
      });

      // 4. Meta CAPI — Lead event (fire and forget)
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

      // 5. Sync to AC: store PDF URL, subscribe to list, apply tags (fire and forget)
      void syncToActiveCampaign({
        email,
        childName,
        archetypeId: traitProfile.archetypeId,
        archetypeName: archetype?.animal ?? "",
        pdfUrl,
        logger: request.log,
      });

      return reply.send({ report: rendered });
    },
  );

  // ── GET /api/guest/pdf?data=...&sig=... ────────────────────────────────────
  // Verifies signature and generates PDF on demand. This URL is stored in AC
  // and emailed to the user after purchase by the AC automation.
  fastify.get("/guest/pdf", async (request, reply) => {
    const parsed = pdfQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Missing or invalid parameters" });
    }

    const { data, sig } = parsed.data;

    // Verify HMAC signature
    const secret = process.env.PDF_SIGNING_SECRET ?? "dev-secret";
    const expected = createHmac("sha256", secret).update(data).digest("hex");
    if (sig !== expected) {
      return reply.status(403).send({ error: "Invalid signature" });
    }

    // Decode payload
    let payload: { archetypeId: string; childName: string; childGender?: string };
    try {
      payload = JSON.parse(Buffer.from(data, "base64url").toString()) as typeof payload;
    } catch {
      return reply.status(400).send({ error: "Malformed token" });
    }

    const { archetypeId, childName, childGender } = payload;

    // Regenerate report and PDF
    const rawTemplate = getReportTemplate(archetypeId);
    if (!rawTemplate) {
      return reply.status(422).send({ error: "Report template not found" });
    }

    const rendered = renderReportTemplate(rawTemplate, {
      name: childName,
      gender: childGender || "Other",
    });

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateReportPdf(rendered as ArchetypeReportTemplate, { name: childName });
    } catch (err) {
      request.log.error({ err }, "guest.pdf.generation_failed");
      return reply.status(500).send({ error: "Failed to generate PDF" });
    }

    const filename = `${toSlug(childName)}-adhd-guide.pdf`;

    reply
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `attachment; filename="${filename}"`);

    return reply.send(pdfBuffer);
  });
}
