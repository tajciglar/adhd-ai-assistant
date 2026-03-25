import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { getSupabaseAdmin } from "./supabaseAdmin.js";
import { computeTraitProfile, ARCHETYPES } from "@adhd-ai-assistant/shared";

interface QuizSubmission {
  id: string;
  email: string;
  child_name: string;
  child_gender: string;
  caregiver_type: string | null;
  child_age_range: string | null;
  archetype_id: string;
  trait_scores: Record<string, number>;
  responses: Record<string, unknown>;
  pdf_url: string | null;
}

/** Capitalize first letter of each word in a name (e.g. "taj" → "Taj", "mary jane" → "Mary Jane") */
function capitalizeName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

/**
 * Try to import a user's quiz data from the `quiz_submissions` table.
 * If found, creates UserProfile + ChildProfile with the quiz results
 * so the chatbot can personalize responses immediately.
 *
 * Returns true if import succeeded, false if no quiz data found.
 */
export async function tryImportFromQuiz(
  fastify: FastifyInstance,
  userId: string,
  email: string,
): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (!sb) return false;

  // Check if profile already exists (don't overwrite)
  const existingProfile = await fastify.prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardingCompleted: true },
  });

  if (existingProfile?.onboardingCompleted) return false;

  // Look up quiz submission by email
  const { data: submission, error } = await sb
    .from("quiz_submissions")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !submission) return false;

  const quiz = submission as QuizSubmission;

  // Parse child age from the age range string (e.g. "6-8" → 7)
  let childAge: number | null = null;
  if (quiz.child_age_range) {
    const match = quiz.child_age_range.match(/(\d+)/);
    if (match) childAge = parseInt(match[1], 10);
  }

  // Reconstruct trait profile from quiz scores
  const traitProfile = {
    scores: quiz.trait_scores,
    archetypeId: quiz.archetype_id,
    archetypeName: ARCHETYPES.find((a) => a.id === quiz.archetype_id)?.animal ?? "",
    archetypeTypeName: ARCHETYPES.find((a) => a.id === quiz.archetype_id)?.typeName ?? "",
    pdfUrl: quiz.pdf_url ?? null,
  };

  // Map caregiver type to parent gender field
  const parentGender = quiz.caregiver_type ?? null;

  // Create or update profile + child in a transaction
  await fastify.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Upsert user profile
    await tx.userProfile.upsert({
      where: { userId },
      update: {
        parentGender,
        onboardingCompleted: true,
      },
      create: {
        userId,
        parentGender,
        onboardingCompleted: true,
      },
    });

    const profile = await tx.userProfile.findUnique({
      where: { userId },
      select: { id: true, children: { select: { id: true } } },
    });

    if (!profile) return;

    if (profile.children.length > 0) {
      // Update existing child
      await tx.childProfile.update({
        where: { id: profile.children[0].id },
        data: {
          childName: capitalizeName(quiz.child_name),
          childAge,
          childGender: quiz.child_gender,
          onboardingResponses: quiz.responses as any,
          traitProfile: traitProfile as any,
          onboardingCompleted: true,
          onboardingStep: 999,
        },
      });
    } else {
      // Create new child
      await tx.childProfile.create({
        data: {
          profileId: profile.id,
          childName: capitalizeName(quiz.child_name),
          childAge,
          childGender: quiz.child_gender,
          onboardingResponses: quiz.responses as any,
          traitProfile: traitProfile as any,
          onboardingCompleted: true,
          onboardingStep: 999,
        },
      });
    }
  });

  return true;
}
