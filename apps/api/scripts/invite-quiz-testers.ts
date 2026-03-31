/// <reference types="node" />
/**
 * Invite quiz testers to Harbor via ActiveCampaign.
 *
 * Usage:
 *   pnpm invite:testers <path-to-csv>          # live run
 *   pnpm invite:testers <path-to-csv> --dry-run # preview only
 *
 * Required env vars (same .env as the API):
 *   DATABASE_URL, DIRECT_URL
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   AC_API_URL   e.g. https://youraccountname.api-us1.com
 *   AC_API_KEY
 *   AC_LIST_ID
 *   APP_URL (optional, defaults to production Vercel URL)
 *
 * What this script does:
 *   1. Reads emails + quiz data from the CSV
 *   2. Deduplicates by email (keeps latest submission)
 *   3. Generates a Supabase invite link per email (no email sent by Supabase)
 *   4. Upserts the AC contact with the link in the `ai_app_test_link_invt` custom field
 *   5. Pre-creates the user + child profile in the DB (personalized from quiz data)
 *
 * 
 * You then send the campaign from AC to your test list whenever ready.
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

// ── Env validation ────────────────────────────────────────────────────────────

// ── Exclusion list — add any internal/test emails or domains here ─────────────

const EXCLUDED_EMAILS = new Set([
  "test@gmail.com",
  "test@testwcc.com",
  "testiram@das.ss",
  "taj.wcccc@gmail.com",
  "taj.sdaa@gmail.com",
  "taj.wcc@gmail.com",
]);

const EXCLUDED_DOMAINS = new Set([
  "wcc.com",
  "wecreatecourses.com",
]);

function isExcluded(email: string): boolean {
  const lower = email.toLowerCase();
  const domain = lower.split("@")[1] ?? "";
  return EXCLUDED_EMAILS.has(lower) || EXCLUDED_DOMAINS.has(domain);
}

// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const acApiUrl = process.env.AC_API_URL?.replace(/\/$/, "");
const acApiKey = process.env.AC_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const acListId = process.env.AC_LIST_ID;

if (!acApiUrl || !acApiKey) {
  console.error("Missing AC_API_URL or AC_API_KEY");
  process.exit(1);
}
if (!acListId) {
  console.error("Missing AC_LIST_ID");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface CsvRow {
  id: string;
  email: string;
  child_name: string;
  child_gender: string;
  caregiver_type: string;
  child_age_range: string;
  adhd_journey: string;
  archetype_id: string;
  paid: string;
  trait_scores: string;
  responses: string;
  pdf_url: string;
  created_at: string;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (line[i] === ",") i++;
    } else {
      const end = line.indexOf(",", i);
      if (end === -1) {
        fields.push(line.slice(i));
        break;
      }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split("\n");
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseCsvLine(line);
      return Object.fromEntries(
        headers.map((h, i) => [h.trim(), (values[i] ?? "").trim()]),
      ) as unknown as CsvRow;
    });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAgeRange(range: string): number | null {
  const match = range.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// ── ActiveCampaign ────────────────────────────────────────────────────────────

async function getAcFieldId(pertag: string): Promise<string> {
  const res = await fetch(`${acApiUrl}/api/3/fields?limit=100`, {
    headers: { "Api-Token": acApiKey! },
  });
  if (!res.ok) throw new Error(`AC fields fetch failed: ${res.status}`);
  const data = (await res.json()) as { fields: { id: string; perstag: string; title: string }[] };
  const field = data.fields.find(
    (f) => f.perstag.toUpperCase() === pertag.toUpperCase(),
  );
  if (!field) {
    throw new Error(
      `AC custom field with perstag "${pertag}" not found.\n` +
      `Available fields: ${data.fields.map((f) => f.perstag).join(", ")}\n` +
      `Create it in AC under Lists → Manage Fields first.`,
    );
  }
  return field.id;
}

async function upsertAcContact(
  email: string,
  firstName: string,
  inviteLink: string,
  fieldId: string,
): Promise<string> {
  const res = await fetch(`${acApiUrl}/api/3/contact/sync`, {
    method: "POST",
    headers: {
      "Api-Token": acApiKey!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contact: {
        email,
        firstName,
        fieldValues: [{ field: fieldId, value: inviteLink }],
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`AC upsert failed: ${JSON.stringify(err)}`);
  }
  const data = (await res.json()) as { contact: { id: string } };
  return data.contact.id;
}

async function addContactToList(contactId: string, listId: string): Promise<void> {
  const res = await fetch(`${acApiUrl}/api/3/contactLists`, {
    method: "POST",
    headers: {
      "Api-Token": acApiKey!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contactList: {
        list: listId,
        contact: contactId,
        status: 1, // 1 = subscribed
      },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`AC list add failed: ${JSON.stringify(err)}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const csvPath = args.find((a) => !a.startsWith("--"));
  const dryRun = args.includes("--dry-run");

  if (!csvPath) {
    console.error("Usage: pnpm invite:testers <path-to-csv> [--dry-run]");
    process.exit(1);
  }

  const appUrl = process.env.APP_URL ?? "https://adhd-ai-assistant-web.vercel.app";
  const redirectTo = `${appUrl}/set-password`;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Harbor — Quiz Tester Invite Script");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Mode    : ${dryRun ? "DRY RUN (no invites or AC updates)" : "LIVE"}`);
  console.log(`  CSV     : ${resolve(csvPath)}`);
  console.log(`  Redirect: ${redirectTo}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Parse CSV
  const content = readFileSync(resolve(csvPath), "utf-8");
  const rows = parseCsv(content);

  // Deduplicate by email — keep latest submission
  const byEmail = new Map<string, CsvRow>();
  for (const row of rows) {
    if (!row.email) continue;
    const existing = byEmail.get(row.email.toLowerCase());
    if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
      byEmail.set(row.email.toLowerCase(), row);
    }
  }

  console.log(`Found ${byEmail.size} unique email(s) across ${rows.length} row(s).\n`);

  // Look up AC custom field ID upfront (fail fast before touching any data)
  let acFieldId = "";
  if (!dryRun) {
    console.log("Looking up AC custom field...");
    acFieldId = await getAcFieldId("ai_app_test_link");
    console.log(`  ✓ Field ID: ${acFieldId}\n`);
  }

  let invited = 0;
  let skipped = 0;
  let failed = 0;

  for (const [email, row] of byEmail) {
    try {
      // Skip excluded internal/test emails
      if (isExcluded(email)) {
        console.log(`  SKIP   ${email} — excluded (internal/test)`);
        skipped++;
        continue;
      }

      // Skip if already has an account
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        console.log(`  SKIP   ${email} — already has an account`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  DRY    ${email} — would invite (archetype: ${row.archetype_id}, child: ${row.child_name})`);
        invited++;
        continue;
      }

      // Generate Supabase invite link (no email sent)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "invite",
        email,
        options: { redirectTo },
      });

      if (linkError) {
        if (linkError.message.toLowerCase().includes("already registered")) {
          console.log(`  SKIP   ${email} — already invited`);
          skipped++;
          continue;
        }
        throw new Error(linkError.message);
      }

      const userId = linkData.user.id;
      const inviteLink = linkData.properties.action_link;

      // Upsert AC contact with invite link + add to list
      const contactId = await upsertAcContact(email, row.child_name, inviteLink, acFieldId);
      await addContactToList(contactId, acListId!);

      // Pre-create user + profile in DB
      let traitScores: Record<string, number> = {};
      try {
        traitScores = JSON.parse(row.trait_scores);
      } catch {
        // leave empty if malformed
      }

      let onboardingResponses: Record<string, unknown> = {};
      try {
        onboardingResponses = JSON.parse(row.responses);
      } catch {
        // leave empty if malformed
      }

      await prisma.user.create({
        data: {
          id: userId,
          email,
          hasChatAccess: true,
          profile: {
            create: {
              onboardingCompleted: true,
              children: {
                create: {
                  childName: row.child_name,
                  childGender: row.child_gender,
                  childAge: parseAgeRange(row.child_age_range),
                  onboardingCompleted: true,
                  quizSubmissionId: row.id || null,
                  traitProfile: {
                    archetypeId: row.archetype_id,
                    scores: traitScores,
                    pdfUrl: row.pdf_url || null,
                  },
                  onboardingResponses,
                },
              },
            },
          },
        },
      });

      console.log(`  ✓      ${email} — invited, AC updated, profile created (archetype: ${row.archetype_id})`);
      invited++;

      // Throttle to avoid Supabase + AC rate limits
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗      ${email} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Invited : ${invited}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Failed  : ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (dryRun) {
    console.log("\n  Dry run complete — no data was changed.");
    console.log("  Remove --dry-run to run for real.");
  }
}

main()
  .catch((err) => {
    console.error("\nFatal:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
