import type { ReportTemplateData, ReportTemplateRecord } from "../types/admin";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [""];
  const items = value
    .map((item) => {
      if (typeof item === "string") return item;
      const record = asRecord(item);
      if (!record) return "";
      const text = asString(record.text).trim();
      const valueText = asString(record.value).trim();
      return text || valueText || "";
    })
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : [""];
}

function normalizeNeedsToHear(value: unknown): ReportTemplateData["needsToHear"] {
  // Support both legacy string[] (affirmations) and new { when, say }[]
  if (!Array.isArray(value)) return [{ when: "", say: "" }];
  const items = value
    .map((item) => {
      if (typeof item === "string") {
        // Legacy: plain string — treat as the "say" part, no "when"
        return item.trim() ? { when: "", say: item.trim() } : null;
      }
      const record = asRecord(item);
      if (!record) return null;
      return {
        when: asString(record.when).trim(),
        say: asString(record.say).trim(),
      };
    })
    .filter((item): item is { when: string; say: string } => !!item);
  return items.length > 0 ? items : [{ when: "", say: "" }];
}

function normalizeBrainSections(value: unknown): ReportTemplateData["brainSections"] {
  if (!Array.isArray(value)) return [{ title: "", content: "", whatHelps: "" }];
  const items = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      return {
        title: asString(record.title),
        content: asString(record.content),
        whatHelps: asString(record.whatHelps),
      };
    })
    .filter((item): item is { title: string; content: string; whatHelps: string } => !!item);
  return items.length > 0 ? items : [{ title: "", content: "", whatHelps: "" }];
}

function normalizeDayInLife(value: unknown): ReportTemplateData["dayInLife"] {
  const record = asRecord(value) ?? {};
  return {
    morning: asString(record.morning),
    school: asString(record.school),
    schoolWhatHelps: asString(record.schoolWhatHelps),
    afterSchool: asString(record.afterSchool),
    bedtime: asString(record.bedtime),
  };
}

function normalizeDoNotSay(value: unknown): ReportTemplateData["doNotSay"] {
  if (!Array.isArray(value)) return [{ context: "", insteadOf: "", tryThis: "" }];
  const items = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const insteadOf =
        asString(record.insteadOf) ||
        asString(record.dontSay) ||
        asString(record.say);
      const tryThis =
        asString(record.tryThis) ||
        asString(record.doSay);
      return {
        context: asString(record.context),
        insteadOf,
        tryThis,
      };
    })
    .filter((item): item is { context: string; insteadOf: string; tryThis: string } => !!item);
  return items.length > 0 ? items : [{ context: "", insteadOf: "", tryThis: "" }];
}

export function normalizeReportTemplateData(value: unknown): ReportTemplateData {
  const record = asRecord(value) ?? {};

  // needsToHear: prefer new field, fall back to legacy affirmations
  const needsToHearRaw = record.needsToHear ?? record.affirmations;

  return {
    archetypeId: asString(record.archetypeId),
    title: asString(record.title),
    innerVoiceQuote: asString(record.innerVoiceQuote),
    animalDescription: asString(record.animalDescription),
    aboutChild: asString(record.aboutChild),
    aboutWhatHelps: asString(record.aboutWhatHelps),
    hiddenSuperpower: asString(record.hiddenSuperpower),
    hiddenGiftWhatHelps: asString(record.hiddenGiftWhatHelps),
    brainSections: normalizeBrainSections(record.brainSections),
    dayInLife: normalizeDayInLife(record.dayInLife),
    drains: normalizeStringList(record.drains),
    fuels: normalizeStringList(record.fuels),
    overwhelm: asString(record.overwhelm),
    overwhelmWhatHelps: asString(record.overwhelmWhatHelps),
    needsToHear: normalizeNeedsToHear(needsToHearRaw),
    affirmations: normalizeStringList(record.affirmations),
    doNotSay: normalizeDoNotSay(record.doNotSay),
    closingLine: asString(record.closingLine),
  };
}

export function normalizeReportTemplateRecord(record: ReportTemplateRecord): ReportTemplateRecord {
  return {
    ...record,
    template: normalizeReportTemplateData(record.template),
  };
}
