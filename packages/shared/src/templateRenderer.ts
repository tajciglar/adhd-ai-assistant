import type { ArchetypeReportTemplate } from "./reportTemplates.js";

// ─── Pronoun Helpers ────────────────────────────────────────────────────────

interface PronounSet {
  subject: string;    // he / she / they
  possessive: string; // his / her / their
  object: string;     // him / her / them
  reflexive: string;  // himself / herself / themselves
}

function getPronounSet(gender: string): PronounSet {
  switch (gender) {
    case "Male":
      return { subject: "he", possessive: "his", object: "him", reflexive: "himself" };
    case "Female":
      return { subject: "she", possessive: "her", object: "her", reflexive: "herself" };
    default:
      return { subject: "they", possessive: "their", object: "them", reflexive: "themselves" };
  }
}

/**
 * Build the placeholder → replacement map from a child's name and gender.
 */
export function buildPlaceholderMap(
  name: string,
  gender: string,
): Record<string, string> {
  const pronouns = getPronounSet(gender);

  return {
    "[NAME]": name,
    "[HE/SHE/THEY]": pronouns.subject,
    "[HIS/HER/THEIR]": pronouns.possessive,
    "[HIM/HER/THEM]": pronouns.object,
    "[HIMSELF/HERSELF/THEMSELVES]": pronouns.reflexive,
  };
}

// ─── Replacement Logic ──────────────────────────────────────────────────────

/**
 * Replace all placeholders in a single string.
 */
function replaceInString(text: string, data: Record<string, string>): string {
  let result = text;
  for (const [placeholder, replacement] of Object.entries(data)) {
    result = result.replaceAll(placeholder, replacement);
  }
  return result;
}

/**
 * Recursively walk any value and replace placeholders in all strings.
 * Handles: strings, arrays, and plain objects.
 */
function replacePlaceholders(value: unknown, data: Record<string, string>): unknown {
  if (typeof value === "string") {
    return replaceInString(value, data);
  }

  if (Array.isArray(value)) {
    return value.map((item) => replacePlaceholders(item, data));
  }

  if (typeof value === "object" && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = replacePlaceholders(val, data);
    }
    return result;
  }

  // numbers, booleans, null — return as-is
  return value;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Take a report template and a child's info, return a new template
 * with all [NAME], [HE/SHE/THEY], etc. replaced with real values.
 */
export function renderReportTemplate(
  template: ArchetypeReportTemplate,
  child: { name: string; gender: string },
): ArchetypeReportTemplate {
  const data = buildPlaceholderMap(child.name, child.gender);
  return replacePlaceholders(template, data) as ArchetypeReportTemplate;
}
