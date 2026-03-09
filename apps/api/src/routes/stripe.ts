import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { z } from "zod";
import { updateSubmissionPayment, insertFunnelEvent } from "../services/supabaseAdmin.js";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY must be set");
  return new Stripe(key);
}

// Apply "wildprint-purchased" tag in ActiveCampaign after successful payment
async function applyPurchaseTag(email: string, logger: { error: (obj: unknown, msg: string) => void; warn: (msg: string) => void }): Promise<void> {
  const apiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.AC_API_KEY;
  if (!apiUrl || !apiKey) return;

  const headers = { "Content-Type": "application/json", "Api-Token": apiKey };

  try {
    // Find contact
    const contactRes = await fetch(`${apiUrl}/api/3/contacts?email=${encodeURIComponent(email)}&limit=1`, { headers });
    if (!contactRes.ok) return;
    const contactData = (await contactRes.json()) as { contacts: Array<{ id: string }> };
    if (!contactData.contacts?.length) return;
    const contactId = String(contactData.contacts[0].id);

    // Find or create tag
    const tagName = "wildprint-purchased";
    const tagSearchRes = await fetch(`${apiUrl}/api/3/tags?search=${encodeURIComponent(tagName)}`, { headers });
    const tagSearchData = (await tagSearchRes.json()) as { tags: Array<{ id: string; tag: string }> };
    let tagId = String(tagSearchData.tags.find((t) => t.tag === tagName)?.id ?? "");

    if (!tagId || tagId === "undefined") {
      const createRes = await fetch(`${apiUrl}/api/3/tags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ tag: { tag: tagName, tagType: "contact", description: "Purchased Wildprint report via Stripe" } }),
      });
      const createData = (await createRes.json()) as { tag?: { id: string } };
      if (createData.tag?.id) tagId = String(createData.tag.id);
    }

    if (tagId && tagId !== "undefined") {
      await fetch(`${apiUrl}/api/3/contactTags`, {
        method: "POST",
        headers,
        body: JSON.stringify({ contactTag: { contact: contactId, tag: tagId } }),
      });
    }
  } catch (err) {
    logger.error({ err }, "stripe.webhook.ac_purchase_tag_failed");
  }
}

const createSessionSchema = z.object({
  email: z.string().email(),
  childName: z.string().min(1),
  archetypeId: z.string().min(1),
  childGender: z.string().optional(),
  submissionId: z.string().optional(),
});

export default async function stripeRoutes(fastify: FastifyInstance) {
  // ── POST /api/stripe/create-checkout-session ──────────────────────────────
  fastify.post("/stripe/create-checkout-session", async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, childName, archetypeId, childGender, submissionId } = parsed.data;

    const priceId = process.env.STRIPE_PRICE_ID;
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

    if (!priceId) {
      request.log.error("STRIPE_PRICE_ID not set");
      return reply.status(500).send({ error: "Payment configuration error" });
    }

    try {
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          childName,
          archetypeId,
          childGender: childGender ?? "",
          submissionId: submissionId ?? "",
        },
        success_url: `${frontendUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/results`,
      });

      return reply.send({ url: session.url });
    } catch (err) {
      request.log.error({ err }, "stripe.create_checkout_session_failed");
      return reply.status(500).send({ error: "Failed to create checkout session" });
    }
  });

  // ── POST /api/stripe/webhook ──────────────────────────────────────────────
  fastify.post(
    "/stripe/webhook",
    {
      config: {
        // Skip global rate limiting for webhook
        rateLimit: false,
        rawBody: true,
      },
    },
    async (request, reply) => {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        request.log.error("STRIPE_WEBHOOK_SECRET not set");
        return reply.status(500).send({ error: "Webhook not configured" });
      }

      const sig = request.headers["stripe-signature"] as string;
      if (!sig) {
        return reply.status(400).send({ error: "Missing stripe-signature header" });
      }

      let event: Stripe.Event;
      try {
        const stripe = getStripe();
        // fastify-raw-body stores the raw body as request.rawBody
        const rawBody = (request as unknown as { rawBody: Buffer }).rawBody;
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err) {
        request.log.error({ err }, "stripe.webhook.signature_verification_failed");
        return reply.status(400).send({ error: "Webhook signature verification failed" });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        const submissionId = session.metadata?.submissionId;
        const customerEmail = session.customer_email ?? session.customer_details?.email ?? "";

        request.log.info({
          event: "purchase_completed",
          sessionId: session.id,
          submissionId,
          email: customerEmail,
        }, "stripe.webhook.checkout_completed");

        // 1. Update quiz_submissions in Supabase
        if (submissionId) {
          void updateSubmissionPayment(
            submissionId,
            session.payment_intent as string ?? session.id,
            session.id,
          );
        }

        // 2. Track purchase event in funnel_events
        void insertFunnelEvent(
          session.id, // use Stripe session ID as the session identifier
          "purchase_completed",
          undefined,
          { submissionId, email: customerEmail },
        );

        // 3. Apply "wildprint-purchased" tag in ActiveCampaign
        if (customerEmail) {
          void applyPurchaseTag(customerEmail, request.log);
        }
      }

      return reply.status(200).send({ received: true });
    },
  );
}
