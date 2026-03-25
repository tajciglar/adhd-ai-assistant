/// <reference types="node" />
/**
 * Backfill script: patches existing child_profiles that are missing
 * onboardingResponses or quizSubmissionId by pulling from quiz_submissions
 * in Supabase (matched by user email).
 *
 * Safe to run multiple times — skips profiles that already have quizSubmissionId.
 *
 * Usage:
 *   pnpm --filter @adhd-ai-assistant/api backfill:quiz-data --dry-run
 *   pnpm --filter @adhd-ai-assistant/api backfill:quiz-data
 */

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Harbor — Backfill Quiz Data to Child Profiles");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  // Find all child profiles missing quizSubmissionId
  const profiles = await prisma.childProfile.findMany({
    where: { quizSubmissionId: null, onboardingCompleted: true },
    select: {
      id: true,
      childName: true,
      profile: {
        select: {
          user: { select: { id: true, email: true } },
        },
      },
    },
  });

  console.log(`Found ${profiles.length} child profile(s) missing quiz data.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const child of profiles) {
    const email = child.profile.user.email;

    try {
      const { data: submission, error } = await supabase
        .from("quiz_submissions")
        .select("id, trait_scores, responses, archetype_id, pdf_url, child_name, child_gender, child_age_range, caregiver_type")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !submission) {
        console.log(`  SKIP  ${email} — no quiz submission found`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  DRY   ${email} — would patch with submission ${submission.id} (archetype: ${submission.archetype_id})`);
        updated++;
        continue;
      }

      const traitProfile = {
        scores: submission.trait_scores ?? {},
        archetypeId: submission.archetype_id ?? "",
        pdfUrl: submission.pdf_url ?? null,
      };

      await prisma.childProfile.update({
        where: { id: child.id },
        data: {
          quizSubmissionId: submission.id,
          onboardingResponses: submission.responses ?? {},
          traitProfile: traitProfile as any,
          // Only update name/gender/age if they look empty/default
          ...((!child.childName || child.childName === "") && {
            childName: submission.child_name ?? "",
          }),
        },
      });

      console.log(`  ✓     ${email} — patched (submission: ${submission.id}, archetype: ${submission.archetype_id})`);
      updated++;
    } catch (err) {
      console.error(`  ✗     ${email} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Updated : ${updated}`);
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
