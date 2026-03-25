/// <reference types="node" />
/**
 * Seed script: Upserts all archetype report templates into the report_templates table.
 *
 * Templates are sourced from the quiz project's shared reportTemplates.ts file
 * (read at runtime from the absolute path on this filesystem).
 *
 * Usage:
 *   pnpm --filter @adhd-ai-assistant/api seed:templates
 *
 * Requires:
 *   - DATABASE_URL env var (or .env file)
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

// ─── Load templates from source file ────────────────────────────────────────
// The quiz shared package lives alongside this project on the same filesystem.
const SOURCE_PATH = path.resolve(
  "/Users/tajbrzovic/wcc-projects/adhd-parenting-quiz/packages/shared/src/reportTemplates.ts"
);

function extractTemplatesFromSource(): Record<string, unknown> {
  const raw = fs.readFileSync(SOURCE_PATH, "utf-8");

  // Find the opening of the REPORT_TEMPLATES object literal
  const startMarker = "const REPORT_TEMPLATES: Record<string, ArchetypeReportTemplate> = {";
  const startIdx = raw.indexOf(startMarker);
  if (startIdx === -1) throw new Error("Could not find REPORT_TEMPLATES in source file");

  // Find the closing `} as Record<...>` — the last occurrence before the export functions
  const endMarker = "} as Record<string, ArchetypeReportTemplate>;";
  const endIdx = raw.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error("Could not find end of REPORT_TEMPLATES in source file");

  // Extract just the object literal (without the `const X = ` prefix and ` as Record<>` suffix)
  const objectLiteral = raw.slice(startIdx + startMarker.length - 1, endIdx + 1);
  // objectLiteral is now:  { "fox": {...}, "hummingbird": {...}, ... }

  // Use the Node.js Function constructor to evaluate the JSON-like object literal.
  // This is safe because we control the source file.
  // We convert it to valid JSON first by using a simple eval-based approach:
  // eslint-disable-next-line no-new-func
  const obj = new Function(`"use strict"; return (${objectLiteral})`)() as Record<string, unknown>;
  return obj;
}

// ─── Build TEMPLATES array ───────────────────────────────────────────────────

let templatesRecord: Record<string, unknown>;
try {
  templatesRecord = extractTemplatesFromSource();
} catch (err) {
  console.error("❌ Failed to load templates from source file:", err);
  process.exit(1);
}

const TEMPLATES = Object.values(templatesRecord) as Array<{
  archetypeId: string;
  [key: string]: unknown;
}>;

console.log(`✓ Loaded ${TEMPLATES.length} templates from source file`);

// ─── Prisma ──────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

async function main() {
  console.log(`\nSeeding ${TEMPLATES.length} report templates...\n`);

  for (const t of TEMPLATES) {
    const { archetypeId } = t;
    if (!archetypeId) {
      console.warn("  ⚠️  Skipping template with no archetypeId:", t);
      continue;
    }

    await prisma.reportTemplate.upsert({
      where: { archetypeId: t.archetypeId },
      update: { template: t as any, archetypeId: t.archetypeId },
      create: { archetypeId: t.archetypeId, template: t as any },
    });

    console.log(`  ✓ Upserted: ${archetypeId}`);
  }

  console.log(`\n✅ Done. ${TEMPLATES.length} templates seeded.\n`);
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
