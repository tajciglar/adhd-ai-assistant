/**
 * Generate password-reset links & grant chat access for all invited (non-admin) users.
 * Pushes each link to the `ai_app_test_link` custom field in ActiveCampaign
 * so you can fire the campaign from AC whenever ready.
 *
 * Usage:
 *   pnpm reset:access              # live run
 *   pnpm reset:access --dry-run    # preview only
 *
 * Required env vars (same .env as the API):
 *   DATABASE_URL, DIRECT_URL
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   AC_API_URL   e.g. https://youraccountname.api-us1.com
 *   AC_API_KEY
 *   APP_URL (optional, defaults to production URL)
 *
 * What this script does for every non-admin user:
 *   1. Confirms their email in Supabase Auth (clears "awaiting verification")
 *   2. Generates a password-recovery link (redirects to /set-password)
 *   3. Upserts the AC contact with the link in `ai_app_test_link`
 *   4. Sets has_chat_access = true in the DB
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Env validation ────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const acApiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
const acApiKey = process.env.AC_API_KEY;
const appUrl = process.env.APP_URL ?? "https://adhd-ai-assistant-web.vercel.app";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!acApiUrl || !acApiKey) {
  console.error("Missing AC_API_URL or AC_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dryRun = process.argv.includes("--dry-run");
const emailFilter = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];

// ── ActiveCampaign helpers ────────────────────────────────────────────────────

async function getAcFieldId(perstag: string): Promise<string> {
  const res = await fetch(`${acApiUrl}/api/3/fields?limit=100`, {
    headers: { "Api-Token": acApiKey! },
  });
  if (!res.ok) throw new Error(`AC fields fetch failed: ${res.status}`);
  const data = (await res.json()) as {
    fields: { id: string; perstag: string }[];
  };
  const field = data.fields.find(
    (f) => f.perstag.toUpperCase() === perstag.toUpperCase(),
  );
  if (!field) {
    const available = data.fields.map((f) => f.perstag).join(", ");
    throw new Error(
      `AC custom field "${perstag}" not found.\nAvailable: ${available}`,
    );
  }
  return field.id;
}

async function upsertAcContact(
  email: string,
  recoveryLink: string,
  fieldId: string,
): Promise<void> {
  const res = await fetch(`${acApiUrl}/api/3/contact/sync`, {
    method: "POST",
    headers: {
      "Api-Token": acApiKey!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contact: {
        email,
        fieldValues: [{ field: fieldId, value: recoveryLink }],
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`AC upsert failed: ${JSON.stringify(err)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const redirectTo = `${appUrl}/set-password`;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Harbor — Reset Access Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Mode    : ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`  Redirect: ${redirectTo}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get users from DB (optionally filtered by email)
  // When targeting a specific email, include admins too (useful for manual resets)
  const users = await prisma.user.findMany({
    where: emailFilter
      ? { email: emailFilter }
      : { role: { not: "admin" } },
    select: { id: true, email: true, hasChatAccess: true },
  });

  console.log(`Found ${users.length} non-admin user(s)\n`);

  // Look up AC field ID upfront (fail fast)
  let acFieldId = "";
  if (!dryRun) {
    console.log("Looking up AC custom field 'ai_app_test_link'...");
    acFieldId = await getAcFieldId("ai_app_test_link");
    console.log(`  ✓ Field ID: ${acFieldId}\n`);
  }

  let confirmed = 0;
  let linked = 0;
  let accessGranted = 0;
  let errors = 0;

  for (const user of users) {
    console.log(`── ${user.email}`);

    if (dryRun) {
      console.log("   [dry-run] would confirm email, generate recovery link, update AC, grant chat access\n");
      continue;
    }

    try {
      // 1. Confirm email in Supabase Auth
      // Look up the real auth UID by email (DB id may differ from auth UID)
      const { data: { users: authUsers }, error: listErr } =
        await supabase.auth.admin.listUsers();
      if (listErr) throw new Error(`list users: ${listErr.message}`);
      const authUser = authUsers.find((u) => u.email === user.email);
      if (!authUser) throw new Error(`no auth account found for ${user.email}`);

      const { error: confirmErr } = await supabase.auth.admin.updateUserById(
        authUser.id,
        { email_confirm: true },
      );
      if (confirmErr) throw new Error(`confirm email: ${confirmErr.message}`);
      confirmed++;
      console.log("   ✓ email confirmed");

      // 2. Generate password recovery link
      const { data: linkData, error: linkErr } =
        await supabase.auth.admin.generateLink({
          type: "recovery",
          email: user.email,
          options: { redirectTo },
        });
      if (linkErr) throw new Error(`generate link: ${linkErr.message}`);

      const recoveryLink = linkData.properties.action_link;
      console.log("   ✓ recovery link generated");

      // 3. Push link to ActiveCampaign
      await upsertAcContact(user.email, recoveryLink, acFieldId);
      linked++;
      console.log("   ✓ AC contact updated");

      // 4. Grant chat access in DB
      if (!user.hasChatAccess) {
        await prisma.user.update({
          where: { id: user.id },
          data: { hasChatAccess: true },
        });
        accessGranted++;
        console.log("   ✓ chat access granted");
      } else {
        console.log("   – chat access already granted");
      }
    } catch (err) {
      console.error(`   ✗ ${(err as Error).message}`);
      errors++;
    }

    console.log();
  }

  console.log("── Summary ──────────────────────────────────");
  console.log(`  Emails confirmed : ${confirmed}`);
  console.log(`  AC links updated : ${linked}`);
  console.log(`  Access granted   : ${accessGranted}`);
  console.log(`  Errors           : ${errors}`);
  console.log(`  Total users      : ${users.length}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
