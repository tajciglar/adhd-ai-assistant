/**
 * Creates a test admin user with a completed quiz profile so you can
 * walk through the full app experience immediately after login.
 *
 * Usage:
 *   pnpm create:test-admin
 *   pnpm create:test-admin --email=custom@example.com
 *
 * Defaults:
 *   email    : testadmin@harbor.app
 *   password : wccadmin2026
 *   role     : admin (full chat + admin panel access)
 *
 * Required env vars:
 *   DATABASE_URL, DIRECT_URL
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

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

// ── Config ────────────────────────────────────────────────────────────────────

const emailArg = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];
const EMAIL = emailArg ?? "testadmin@harbor.app";
const PASSWORD = "wccadmin2026";

// A realistic completed quiz profile — "The Koala" archetype, 9-year-old boy
const MOCK_TRAIT_PROFILE = {
  scores: {
    inattentive: 4.2,
    hyperactive: 2.8,
    sensory: 3.1,
    emotional: 3.5,
    executive_function: 3.9,
    social: 2.2,
  },
  archetypeId: "koala",
  archetypeName: "The Koala",
  archetypeTypeName: "The Dreamy Koala",
  pdfUrl: null,
};

const MOCK_QUIZ_RESPONSES = {
  inattentive_1: 4,
  inattentive_2: 5,
  inattentive_3: 3,
  hyperactive_1: 3,
  hyperactive_2: 2,
  sensory_1: 3,
  sensory_2: 4,
  emotional_1: 3,
  emotional_2: 4,
  executive_function_1: 4,
  executive_function_2: 4,
  social_1: 2,
  social_2: 2,
};

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Harbor — Create Test Admin User");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email   : ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Role    : admin`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ── Step 1: Create or update auth user ─────────────────────────────────────

  // Check if auth user already exists
  const { data: { users: existingAuthUsers } } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingAuthUsers.find((u) => u.email === EMAIL);

  let authUserId: string;

  if (existingAuthUser) {
    console.log("  Auth user already exists — updating password...");
    const { error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Update auth user: ${error.message}`);
    authUserId = existingAuthUser.id;
    console.log("  ✓ Password updated + email confirmed");
  } else {
    console.log("  Creating auth user in Supabase...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`Create auth user: ${error.message}`);
    authUserId = data.user.id;
    console.log(`  ✓ Auth user created (uid: ${authUserId})`);
  }

  // ── Step 2: Upsert user record in DB ───────────────────────────────────────

  console.log("\n  Upserting DB user record...");
  await prisma.user.upsert({
    where: { id: authUserId },
    update: {
      email: EMAIL,
      role: "admin",
      hasChatAccess: true,
    },
    create: {
      id: authUserId,
      email: EMAIL,
      role: "admin",
      hasChatAccess: true,
    },
  });

  // Also remove any stale record with same email but different ID
  await prisma.user.deleteMany({
    where: { email: EMAIL, NOT: { id: authUserId } },
  });

  console.log("  ✓ DB user record ready");

  // ── Step 3: Upsert user profile ────────────────────────────────────────────

  console.log("\n  Upserting user profile...");
  const userProfile = await prisma.userProfile.upsert({
    where: { userId: authUserId },
    update: {
      parentGender: "Mom",
      parentAgeRange: "35-44",
      householdStructure: "Two-parent household",
      onboardingCompleted: true,
    },
    create: {
      userId: authUserId,
      parentGender: "Mom",
      parentAgeRange: "35-44",
      householdStructure: "Two-parent household",
      onboardingCompleted: true,
    },
    include: { children: { select: { id: true } } },
  });
  console.log("  ✓ User profile ready");

  // ── Step 4: Upsert child profile with completed quiz ───────────────────────

  console.log("\n  Upserting child profile with quiz data...");
  if (userProfile.children.length > 0) {
    await prisma.childProfile.update({
      where: { id: userProfile.children[0].id },
      data: {
        childName: "Alex",
        childAge: 9,
        childGender: "Boy",
        traitProfile: MOCK_TRAIT_PROFILE as any,
        onboardingResponses: MOCK_QUIZ_RESPONSES as any,
        onboardingCompleted: true,
      },
    });
  } else {
    await prisma.childProfile.create({
      data: {
        profileId: userProfile.id,
        childName: "Alex",
        childAge: 9,
        childGender: "Boy",
        traitProfile: MOCK_TRAIT_PROFILE as any,
        onboardingResponses: MOCK_QUIZ_RESPONSES as any,
        onboardingCompleted: true,
      },
    });
  }
  console.log("  ✓ Child profile ready (Alex, 9, Boy — The Dreamy Koala)");

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅  Test admin user is ready!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Password : ${PASSWORD}`);
  console.log(`  Child    : Alex, 9yo Boy (The Dreamy Koala)`);
  console.log(`  Access   : admin + chat`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .catch((err) => {
    console.error("\nFatal:", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
