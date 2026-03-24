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

      const say = asString(record.say).trim();
      const when = asString(record.when).trim();
      const text = asString(record.text).trim();
      const valueText = asString(record.value).trim();

      if (say && when) return `${say} (${when})`;
      return say || text || valueText || when || "";
    })
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : [""];
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
  if (!Array.isArray(value)) return [{ insteadOf: "", tryThis: "" }];

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
        asString(record.doSay) ||
        asString(record.when);

      return {
        insteadOf,
        tryThis,
      };
    })
    .filter((item): item is { insteadOf: string; tryThis: string } => !!item);

  return items.length > 0 ? items : [{ insteadOf: "", tryThis: "" }];
}

export function normalizeReportTemplateData(value: unknown): ReportTemplateData {
  const record = asRecord(value) ?? {};

  return {
    archetypeId: asString(record.archetypeId),
    title: asString(record.title),
    innerVoiceQuote: asString(record.innerVoiceQuote),
    animalDescription: asString(record.animalDescription),
    aboutChild: asString(record.aboutChild),
    hiddenSuperpower: asString(record.hiddenSuperpower),
    brainSections: normalizeBrainSections(record.brainSections),
    dayInLife: normalizeDayInLife(record.dayInLife),
    drains: normalizeStringList(record.drains),
    fuels: normalizeStringList(record.fuels),
    overwhelm: asString(record.overwhelm),
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
