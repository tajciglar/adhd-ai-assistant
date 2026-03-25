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

function normalizeAffirmations(value: unknown): ReportTemplateData["affirmations"] {
  // Support both legacy string[] and new { when, say }[]
  if (!Array.isArray(value)) return [{ when: "", say: "" }];
  const items = value
    .map((item) => {
      if (typeof item === "string") {
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
  if (!Array.isArray(value)) return [{ title: "", content: "" }];
  const items = value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      return {
        title: asString(record.title),
        content: asString(record.content),
      };
    })
    .filter((item): item is { title: string; content: string } => !!item);
  return items.length > 0 ? items : [{ title: "", content: "" }];
}

function normalizeDayInLife(value: unknown): ReportTemplateData["dayInLife"] {
  const record = asRecord(value) ?? {};
  return {
    morning: asString(record.morning),
    school: asString(record.school),
    afterSchool: asString(record.afterSchool),
    bedtime: asString(record.bedtime),
  };
}

function normalizeDoNotSay(value: unknown): ReportTemplateData["doNotSay"] {
  if (!Array.isArray(value)) return [{ when: "", insteadOf: "", tryThis: "" }];
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
      // Support both "when" (new canonical) and "context" (legacy)
      const when = asString(record.when) || asString(record.context);
      return { when, insteadOf, tryThis };
    })
    .filter((item): item is { when: string; insteadOf: string; tryThis: string } => !!item);
  return items.length > 0 ? items : [{ when: "", insteadOf: "", tryThis: "" }];
}

function normalizeWhatHelps(value: unknown, record: UnknownRecord): ReportTemplateData["whatHelps"] {
  // New format: whatHelps nested object
  const wh = asRecord(value);
  if (wh) {
    return {
      aboutChild: asString(wh.aboutChild),
      hiddenGift: asString(wh.hiddenGift),
      brain: asString(wh.brain),
      morning: asString(wh.morning),
      school: asString(wh.school),
      afterSchool: asString(wh.afterSchool),
      bedtime: asString(wh.bedtime),
      overwhelm: asString(wh.overwhelm),
    };
  }
  // Legacy format: spread fields on the record itself
  const aboutChild = asString(record.aboutWhatHelps);
  const hiddenGift = asString(record.hiddenGiftWhatHelps);
  const school = asString((asRecord(record.dayInLife) ?? {}).schoolWhatHelps);
  const overwhelm = asString(record.overwhelmWhatHelps);
  if (aboutChild || hiddenGift || school || overwhelm) {
    return { aboutChild, hiddenGift, school, overwhelm };
  }
  return undefined;
}

export function normalizeReportTemplateData(value: unknown): ReportTemplateData {
  const record = asRecord(value) ?? {};

  // affirmations: prefer new field, fall back to legacy needsToHear or string[] affirmations
  const affirmationsRaw = record.affirmations ?? record.needsToHear;

  return {
    archetypeId: asString(record.archetypeId),
    title: asString(record.title),
    innerVoiceQuote: asString(record.innerVoiceQuote),
    animalDescription: asString(record.animalDescription),
    aboutChild: asString(record.aboutChild),
    // Support both hiddenGift (new) and hiddenSuperpower (legacy)
    hiddenGift: asString(record.hiddenGift) || asString(record.hiddenSuperpower),
    aboutBrain: asString(record.aboutBrain),
    brainSections: normalizeBrainSections(record.brainSections),
    dayInLife: normalizeDayInLife(record.dayInLife),
    drains: normalizeStringList(record.drains),
    fuels: normalizeStringList(record.fuels),
    overwhelm: asString(record.overwhelm),
    affirmations: normalizeAffirmations(affirmationsRaw),
    doNotSay: normalizeDoNotSay(record.doNotSay),
    closingLine: asString(record.closingLine),
    whatHelps: normalizeWhatHelps(record.whatHelps, record),
  };
}

export function normalizeReportTemplateRecord(record: ReportTemplateRecord): ReportTemplateRecord {
  return {
    ...record,
    template: normalizeReportTemplateData(record.template),
  };
}
