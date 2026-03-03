-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "child_name" TEXT NOT NULL DEFAULT '',
    "child_age" INTEGER,
    "child_gender" TEXT,
    "onboarding_responses" JSONB,
    "onboarding_step" INTEGER NOT NULL DEFAULT 0,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "trait_profile" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "child_profiles_profile_id_idx" ON "child_profiles"("profile_id");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add new parent columns to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN "parent_gender" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "parent_age_range" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "household_structure" TEXT;

-- Migrate existing data: create child profile from existing user profile data
INSERT INTO "child_profiles" ("id", "profile_id", "child_name", "child_age", "child_gender", "onboarding_responses", "onboarding_step", "onboarding_completed", "trait_profile", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    COALESCE(("onboarding_responses"->>'childName')::text, ''),
    ("onboarding_responses"->>'childAge')::integer,
    ("onboarding_responses"->>'childGender')::text,
    "onboarding_responses",
    "onboarding_step",
    "onboarding_completed",
    "trait_profile",
    "created_at",
    NOW()
FROM "user_profiles"
WHERE "onboarding_responses" IS NOT NULL;

-- Migrate parent info from onboarding_responses to dedicated columns
UPDATE "user_profiles"
SET
    "parent_gender" = ("onboarding_responses"->>'parentGender')::text,
    "parent_age_range" = ("onboarding_responses"->>'parentAgeRange')::text,
    "household_structure" = ("onboarding_responses"->>'householdStructure')::text
WHERE "onboarding_responses" IS NOT NULL;

-- Drop old columns from user_profiles
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "adhd_type";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "struggles";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "sensory_triggers";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "goals";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "onboarding_responses";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "onboarding_step";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "trait_profile";
