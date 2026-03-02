-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "onboarding_responses" JSONB,
ADD COLUMN     "onboarding_step" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "adhd_type" SET DEFAULT '';
