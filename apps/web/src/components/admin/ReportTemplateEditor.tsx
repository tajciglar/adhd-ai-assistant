import { useState } from "react";
import type { ReportTemplateData, ReportTemplateRecord } from "../../types/admin";
import { normalizeReportTemplateData } from "../../lib/reportTemplate";

interface ReportTemplateEditorProps {
  template: ReportTemplateRecord | null;
  saving: boolean;
  onSave: (template: ReportTemplateData) => Promise<boolean>;
  onCancel: () => void;
}

function emptyTemplate(): ReportTemplateData {
  return {
    archetypeId: "",
    title: "",
    innerVoiceQuote: "",
    animalDescription: "",
    aboutChild: "",
    aboutWhatHelps: "",
    hiddenSuperpower: "",
    hiddenGiftWhatHelps: "",
    brainSections: [{ title: "", content: "", whatHelps: "" }],
    dayInLife: { morning: "", school: "", schoolWhatHelps: "", afterSchool: "", bedtime: "" },
    drains: [""],
    fuels: [""],
    overwhelm: "",
    overwhelmWhatHelps: "",
    needsToHear: [{ when: "", say: "" }],
    affirmations: [""],
    doNotSay: [{ context: "", insteadOf: "", tryThis: "" }],
    closingLine: "",
  };
}

function compactLines(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseSection(content: string, start: string, end: string): string {
  const startIdx = content.indexOf(start);
  if (startIdx === -1) return "";
  const from = startIdx + start.length;
  const endIdx = content.indexOf(end, from);
  if (endIdx === -1) return content.slice(from).trim();
  return content.slice(from, endIdx).trim();
}

function parseTemplateFromText(raw: string): Partial<ReportTemplateData> {
  const text = raw.replace(/\r\n/g, "\n").trim();
  const lines = compactLines(text);
  const title = lines[0] ?? "";
  const quoteLine = lines[1] ?? "";
  const innerVoiceQuote = quoteLine.replace(/—\s*\[NAME\]\s*$/g, "").replace(/^"|"$/g, "");

  const aboutHeading = "About [NAME]";
  const hiddenHeading = "[NAME]'s Hidden Superpower";
  const understandingHeading = "Understanding [NAME]'s Brain";
  const dayHeading = "A Day in [NAME]'s Life";
  const drainsHeading = "What Drains [NAME] — and What Fuels [HIM/HER/THEM]";
  const overwhelmedHeading = "When [NAME] Gets Overwhelmed";
  const needsHeading = "What [NAME] Needs to Hear Most";
  const dontSayHeading = "What NOT to Say — and What to Say Instead";

  const preAbout = parseSection(text, innerVoiceQuote ? lines[1] : lines[0], aboutHeading);
  const animalDescription = preAbout
    .replace(/^—\s*\[NAME\]\s*/g, "")
    .replace(/^The [A-Za-z]+ /, "")
    .trim();
  const aboutChild = parseSection(text, aboutHeading, hiddenHeading);
  const hiddenSuperpower = parseSection(text, hiddenHeading, understandingHeading);
  const understanding = parseSection(text, understandingHeading, dayHeading);
  const day = parseSection(text, dayHeading, drainsHeading);
  const drainsFuels = parseSection(text, drainsHeading, overwhelmedHeading);
  const overwhelm = parseSection(text, overwhelmedHeading, needsHeading);
  const needsRaw = parseSection(text, needsHeading, dontSayHeading);
  const doNotSayRaw = parseSection(text, dontSayHeading, "");

  const firstIdx = understanding.indexOf("The first is");
  const secondIdx = understanding.indexOf("The second is");
  let brainSections = [{ title: "Overview", content: understanding.trim(), whatHelps: "" }];
  if (firstIdx !== -1 && secondIdx !== -1 && secondIdx > firstIdx) {
    const intro = understanding.slice(0, firstIdx).trim();
    const attention = understanding.slice(firstIdx, secondIdx).trim();
    const hyperactivity = understanding.slice(secondIdx).trim();
    brainSections = [
      { title: "Attention", content: `${intro} ${attention}`.trim(), whatHelps: "" },
      { title: "Hyperactivity", content: hyperactivity, whatHelps: "" },
    ];
  }

  function extractDay(label: string): string {
    const markers = ["Morning:", "At School:", "After School:", "Bedtime:"];
    const idx = day.indexOf(label);
    if (idx === -1) return "";
    const from = idx + label.length;
    const nextIdxCandidates = markers
      .map((m) => day.indexOf(m, from))
      .filter((i) => i !== -1);
    const to = nextIdxCandidates.length > 0 ? Math.min(...nextIdxCandidates) : day.length;
    return day.slice(from, to).trim();
  }

  const dayInLife = {
    morning: extractDay("Morning:"),
    school: extractDay("At School:") || extractDay("School:"),
    schoolWhatHelps: "",
    afterSchool: extractDay("After School:"),
    bedtime: extractDay("Bedtime:"),
  };

  const drainsFuelsLines = compactLines(drainsFuels).filter(
    (line) => !line.startsWith("What Drains [NAME]") && !line.startsWith("What Fuels [NAME]"),
  );
  const drains: string[] = [];
  const fuels: string[] = [];
  for (let i = 0; i < drainsFuelsLines.length; i += 2) {
    if (drainsFuelsLines[i]) drains.push(drainsFuelsLines[i]);
    if (drainsFuelsLines[i + 1]) fuels.push(drainsFuelsLines[i + 1]);
  }

  // Parse "What child needs to hear most" — each line is a say item, no when context
  const needsToHear = compactLines(needsRaw)
    .map((line) => line.replace(/^"|"$/g, "").trim())
    .filter(Boolean)
    .map((say) => ({ when: "", say }));

  const doNotSayLines = compactLines(doNotSayRaw).filter(
    (line) =>
      line !== "Instead of..." &&
      line !== "Try..." &&
      !line.startsWith("[NAME] is a "),
  );
  const doNotSay: Array<{ context: string; insteadOf: string; tryThis: string }> = [];
  for (let i = 0; i < doNotSayLines.length; i += 2) {
    if (!doNotSayLines[i]) continue;
    doNotSay.push({
      context: "",
      insteadOf: doNotSayLines[i].replace(/^"|"$/g, ""),
      tryThis: (doNotSayLines[i + 1] ?? "").replace(/^"|"$/g, ""),
    });
  }

  const closingLine = [...lines].reverse().find((line) => line.startsWith("[NAME] is a ")) ?? "";

  return {
    title,
    innerVoiceQuote,
    animalDescription,
    aboutChild,
    aboutWhatHelps: "",
    hiddenSuperpower,
    hiddenGiftWhatHelps: "",
    brainSections: brainSections.length > 0 ? brainSections : [{ title: "", content: "", whatHelps: "" }],
    dayInLife,
    drains: drains.length > 0 ? drains : [""],
    fuels: fuels.length > 0 ? fuels : [""],
    overwhelm,
    overwhelmWhatHelps: "",
    needsToHear: needsToHear.length > 0 ? needsToHear : [{ when: "", say: "" }],
    affirmations: [""],
    doNotSay: doNotSay.length > 0 ? doNotSay : [{ context: "", insteadOf: "", tryThis: "" }],
    closingLine,
  };
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function WhatHelpsBox({ label = "WHAT HELPS", value, onChange }: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="border-l-4 border-emerald-400 bg-emerald-50/60 rounded-r-xl px-4 py-3 space-y-1.5">
      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="What helps in this context..."
        className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-white focus:outline-none focus:border-emerald-400 text-sm"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ReportTemplateEditor({
  template,
  saving,
  onSave,
  onCancel,
}: ReportTemplateEditorProps) {
  const [form, setForm] = useState<ReportTemplateData>(
    template ? normalizeReportTemplateData(template.template) : emptyTemplate(),
  );
  const [archetypeId, setArchetypeId] = useState(template?.archetypeId ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const title = template ? "Edit Report Template" : "New Report Template";

  function setField<K extends keyof ReportTemplateData>(key: K, value: ReportTemplateData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateStringList(key: "drains" | "fuels" | "affirmations", index: number, value: string) {
    const next = [...form[key]];
    next[index] = value;
    setField(key, next);
  }

  function removeStringListItem(key: "drains" | "fuels" | "affirmations", index: number) {
    if (form[key].length <= 1) return;
    const next = [...form[key]];
    next.splice(index, 1);
    setField(key, next);
  }

  function removeBrainSection(index: number) {
    if (form.brainSections.length <= 1) return;
    const next = [...form.brainSections];
    next.splice(index, 1);
    setField("brainSections", next);
  }

  function removeDoNotSayPair(index: number) {
    if (form.doNotSay.length <= 1) return;
    const next = [...form.doNotSay];
    next.splice(index, 1);
    setField("doNotSay", next);
  }

  function removeNeedsToHearItem(index: number) {
    if (form.needsToHear.length <= 1) return;
    const next = [...form.needsToHear];
    next.splice(index, 1);
    setField("needsToHear", next);
  }

  async function handleSave() {
    setError(null);
    if (!archetypeId.trim()) {
      setError("Archetype ID is required.");
      return;
    }
    const ok = await onSave({ ...form, archetypeId: archetypeId.trim() });
    if (!ok) {
      setError("Failed to save template. Check required fields and try again.");
      return;
    }
    onCancel();
  }

  function handleImportText() {
    if (!importText.trim()) {
      setError("Paste template text first.");
      return;
    }
    try {
      const parsed = parseTemplateFromText(importText);
      setForm((prev) => ({ ...prev, ...parsed }));
      if (!archetypeId.trim() && parsed.archetypeId) setArchetypeId(parsed.archetypeId);
      setError(null);
    } catch {
      setError("Could not parse imported text.");
    }
  }

  const XButton = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-1 rounded-md border border-harbor-text/15 text-harbor-text/50 hover:text-harbor-error hover:border-harbor-error/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-harbor-text/10 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-harbor-text">{title}</h3>
            <div className="flex rounded-lg border border-harbor-text/15 p-0.5">
              {(["edit", "preview"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 text-xs rounded-md cursor-pointer capitalize ${
                    mode === m ? "bg-harbor-accent text-white" : "text-harbor-text/70 hover:bg-harbor-bg"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {mode === "edit" ? (
            <>
              {/* Import */}
              <section className="space-y-3 border border-harbor-text/10 rounded-xl p-4 bg-harbor-bg/30">
                <h4 className="text-sm font-semibold text-harbor-text/80">Import From Plain Text</h4>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={8}
                  placeholder="Paste full template text here..."
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <button
                  type="button"
                  onClick={handleImportText}
                  className="px-4 py-2 rounded-lg text-sm border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
                >
                  Import Into Form
                </button>
              </section>

              {/* Basics */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">Basics</h4>
                <input
                  type="text"
                  value={archetypeId}
                  onChange={(e) => setArchetypeId(e.target.value)}
                  placeholder="Archetype ID (e.g. koala)"
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="Title (e.g. The Observing Meerkat)"
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <textarea
                  value={form.innerVoiceQuote}
                  onChange={(e) => setField("innerVoiceQuote", e.target.value)}
                  placeholder='Inner voice quote (e.g. "It\'s safer and quieter inside my own head.")'
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              </section>

              {/* The Animal */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">The Animal</h4>
                <textarea
                  value={form.animalDescription}
                  onChange={(e) => setField("animalDescription", e.target.value)}
                  placeholder="Describe the animal archetype..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              </section>

              {/* About Child */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">About Child</h4>
                <textarea
                  value={form.aboutChild}
                  onChange={(e) => setField("aboutChild", e.target.value)}
                  placeholder="About the child..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <WhatHelpsBox
                  value={form.aboutWhatHelps ?? ""}
                  onChange={(v) => setField("aboutWhatHelps", v)}
                />
              </section>

              {/* Hidden Gift */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">Hidden Gift</h4>
                <textarea
                  value={form.hiddenSuperpower}
                  onChange={(e) => setField("hiddenSuperpower", e.target.value)}
                  placeholder="The child's hidden gift / superpower..."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <WhatHelpsBox
                  value={form.hiddenGiftWhatHelps ?? ""}
                  onChange={(v) => setField("hiddenGiftWhatHelps", v)}
                />
              </section>

              {/* Brain Sections */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-harbor-text/80">Understanding the Brain</h4>
                  <button
                    onClick={() =>
                      setField("brainSections", [...form.brainSections, { title: "", content: "", whatHelps: "" }])
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
                  >
                    + Add Section
                  </button>
                </div>
                {form.brainSections.map((section, index) => (
                  <div key={`brain-${index}`} className="border border-harbor-text/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-harbor-text/50 uppercase tracking-wider">Section {index + 1}</p>
                      <XButton onClick={() => removeBrainSection(index)} disabled={form.brainSections.length <= 1} />
                    </div>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const next = [...form.brainSections];
                        next[index] = { ...next[index], title: e.target.value };
                        setField("brainSections", next);
                      }}
                      placeholder="Section title (e.g. Attention)"
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    <textarea
                      value={section.content}
                      onChange={(e) => {
                        const next = [...form.brainSections];
                        next[index] = { ...next[index], content: e.target.value };
                        setField("brainSections", next);
                      }}
                      rows={4}
                      placeholder="Section content..."
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    <WhatHelpsBox
                      value={section.whatHelps ?? ""}
                      onChange={(v) => {
                        const next = [...form.brainSections];
                        next[index] = { ...next[index], whatHelps: v };
                        setField("brainSections", next);
                      }}
                    />
                  </div>
                ))}
              </section>

              {/* Day in Life */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">A Day in Life</h4>
                {(["morning", "school", "afterSchool", "bedtime"] as const).map((key) => (
                  <div key={key} className="space-y-2">
                    <p className="text-xs font-medium text-harbor-text/60 capitalize">
                      {key === "afterSchool" ? "After School" : key === "school" ? "At School" : key.charAt(0).toUpperCase() + key.slice(1)}
                    </p>
                    <textarea
                      value={form.dayInLife[key]}
                      onChange={(e) =>
                        setField("dayInLife", { ...form.dayInLife, [key]: e.target.value })
                      }
                      rows={3}
                      placeholder={`${key} description...`}
                      className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    {key === "school" && (
                      <WhatHelpsBox
                        value={form.dayInLife.schoolWhatHelps ?? ""}
                        onChange={(v) =>
                          setField("dayInLife", { ...form.dayInLife, schoolWhatHelps: v })
                        }
                      />
                    )}
                  </div>
                ))}
              </section>

              {/* Drains & Fuels */}
              {(["drains", "fuels"] as const).map((key) => (
                <section key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-harbor-text/80 capitalize">{key}</h4>
                    <button
                      onClick={() => setField(key, [...form[key], ""])}
                      className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                  {form[key].map((item, index) => (
                    <div key={`${key}-${index}`} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateStringList(key, index, e.target.value)}
                        placeholder={`${key} item`}
                        className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                      />
                      <XButton onClick={() => removeStringListItem(key, index)} disabled={form[key].length <= 1} />
                    </div>
                  ))}
                </section>
              ))}

              {/* Overwhelm */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">When Overwhelmed</h4>
                <textarea
                  value={form.overwhelm}
                  onChange={(e) => setField("overwhelm", e.target.value)}
                  rows={5}
                  placeholder="What overwhelm looks like and how to respond..."
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <WhatHelpsBox
                  value={form.overwhelmWhatHelps ?? ""}
                  onChange={(v) => setField("overwhelmWhatHelps", v)}
                />
              </section>

              {/* What child needs to hear most */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-harbor-text/80">What Child Needs to Hear Most</h4>
                  <button
                    onClick={() => setField("needsToHear", [...form.needsToHear, { when: "", say: "" }])}
                    className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>
                <p className="text-xs text-harbor-text/40">Each row: the situation (When) + the phrase to say (Say)</p>
                {form.needsToHear.map((item, index) => (
                  <div key={`nth-${index}`} className="border border-harbor-text/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-harbor-text/40 uppercase tracking-wider">Row {index + 1}</p>
                      <XButton onClick={() => removeNeedsToHearItem(index)} disabled={form.needsToHear.length <= 1} />
                    </div>
                    <input
                      type="text"
                      value={item.when}
                      onChange={(e) => {
                        const next = [...form.needsToHear];
                        next[index] = { ...next[index], when: e.target.value };
                        setField("needsToHear", next);
                      }}
                      placeholder="When... (situation / trigger)"
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    <input
                      type="text"
                      value={item.say}
                      onChange={(e) => {
                        const next = [...form.needsToHear];
                        next[index] = { ...next[index], say: e.target.value };
                        setField("needsToHear", next);
                      }}
                      placeholder='"Say..." (the phrase)'
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                  </div>
                ))}
              </section>

              {/* What NOT to say */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-harbor-text/80">What NOT to Say</h4>
                  <button
                    onClick={() =>
                      setField("doNotSay", [...form.doNotSay, { context: "", insteadOf: "", tryThis: "" }])
                    }
                    className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>
                {form.doNotSay.map((pair, index) => (
                  <div key={`pair-${index}`} className="border border-harbor-text/10 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-harbor-text/40 uppercase tracking-wider">Row {index + 1}</p>
                      <XButton onClick={() => removeDoNotSayPair(index)} disabled={form.doNotSay.length <= 1} />
                    </div>
                    <input
                      type="text"
                      value={pair.context ?? ""}
                      onChange={(e) => {
                        const next = [...form.doNotSay];
                        next[index] = { ...next[index], context: e.target.value };
                        setField("doNotSay", next);
                      }}
                      placeholder="When this happens... (context)"
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    <input
                      type="text"
                      value={pair.insteadOf}
                      onChange={(e) => {
                        const next = [...form.doNotSay];
                        next[index] = { ...next[index], insteadOf: e.target.value };
                        setField("doNotSay", next);
                      }}
                      placeholder='Instead of... (e.g. "Stop daydreaming")'
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                    <input
                      type="text"
                      value={pair.tryThis}
                      onChange={(e) => {
                        const next = [...form.doNotSay];
                        next[index] = { ...next[index], tryThis: e.target.value };
                        setField("doNotSay", next);
                      }}
                      placeholder='Try... (e.g. "Welcome back, take your time")'
                      className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                    />
                  </div>
                ))}
              </section>

              {/* Closing */}
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-harbor-text/80">Closing Line</h4>
                <textarea
                  value={form.closingLine}
                  onChange={(e) => setField("closingLine", e.target.value)}
                  rows={2}
                  placeholder='e.g. "Taj is an Observing Meerkat. And the world needs more of them."'
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              </section>
            </>
          ) : (
            /* ── Preview ── */
            <div className="space-y-5 max-w-2xl mx-auto font-sans text-[15px] text-harbor-text">
              <div className="text-center pb-4 border-b border-harbor-text/10">
                <p className="text-xs uppercase tracking-widest text-harbor-text/40 mb-1">ADHD Personality Report</p>
                <h2 className="text-2xl font-extrabold text-harbor-primary font-display">{form.title || "(No title)"}</h2>
              </div>

              {form.innerVoiceQuote && (
                <div className="bg-harbor-bg-alt rounded-xl p-5 flex gap-4 items-start border border-harbor-orange/10">
                  <div>
                    <p className="italic text-harbor-text leading-relaxed">"{form.innerVoiceQuote}"</p>
                    <p className="text-sm text-harbor-text/50 mt-1">— [Child Name]</p>
                  </div>
                </div>
              )}

              {form.animalDescription && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">The Animal</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <p className="leading-relaxed">{form.animalDescription}</p>
                </div>
              )}

              {form.aboutChild && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">About [Child Name]</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <p className="leading-relaxed whitespace-pre-line">{form.aboutChild}</p>
                  {form.aboutWhatHelps && (
                    <div className="mt-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
                      <p className="text-sm leading-relaxed">{form.aboutWhatHelps}</p>
                    </div>
                  )}
                </div>
              )}

              {form.hiddenSuperpower && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">[Child Name]'s Hidden Gift</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <p className="leading-relaxed whitespace-pre-line">{form.hiddenSuperpower}</p>
                  {form.hiddenGiftWhatHelps && (
                    <div className="mt-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
                      <p className="text-sm leading-relaxed">{form.hiddenGiftWhatHelps}</p>
                    </div>
                  )}
                </div>
              )}

              {form.brainSections.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">Understanding [Child Name]'s Brain</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  {form.brainSections.map((s, i) => (
                    <div key={i} className="mb-4">
                      {s.title && <p className="font-bold mb-1">{s.title}</p>}
                      <p className="leading-relaxed whitespace-pre-line">{s.content}</p>
                      {s.whatHelps && (
                        <div className="mt-3 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
                          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
                          <p className="text-sm leading-relaxed">{s.whatHelps}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(form.dayInLife.morning || form.dayInLife.school) && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">A Day in [Child Name]'s Life</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  {(["morning", "school", "afterSchool", "bedtime"] as const).map((key) => (
                    form.dayInLife[key] ? (
                      <div key={key} className="mb-4">
                        <p className="font-semibold text-harbor-orange mb-1">
                          {key === "afterSchool" ? "After School" : key === "school" ? "School" : key.charAt(0).toUpperCase() + key.slice(1)}
                        </p>
                        <p className="leading-relaxed">{form.dayInLife[key]}</p>
                        {key === "school" && form.dayInLife.schoolWhatHelps && (
                          <div className="mt-3 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
                            <p className="text-sm leading-relaxed">{form.dayInLife.schoolWhatHelps}</p>
                          </div>
                        )}
                      </div>
                    ) : null
                  ))}
                </div>
              )}

              {(form.drains.some(Boolean) || form.fuels.some(Boolean)) && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">Creating the Right Environment</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <div className="grid grid-cols-2 gap-0 border border-harbor-text/10 rounded-xl overflow-hidden">
                    <div className="bg-rose-50 px-4 py-3 border-b border-harbor-text/10">
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">What Drains</p>
                    </div>
                    <div className="bg-emerald-50 px-4 py-3 border-b border-l border-harbor-text/10">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">What Fuels</p>
                    </div>
                    {Array.from({ length: Math.max(form.drains.filter(Boolean).length, form.fuels.filter(Boolean).length) }).map((_, i) => (
                      <>
                        <div key={`d-${i}`} className="px-4 py-3 border-b border-harbor-text/10 flex items-start gap-2">
                          {form.drains[i] && <><span className="text-rose-500 shrink-0 mt-0.5">✗</span><span className="text-sm">{form.drains[i]}</span></>}
                        </div>
                        <div key={`f-${i}`} className="px-4 py-3 border-b border-l border-harbor-text/10 flex items-start gap-2">
                          {form.fuels[i] && <><span className="text-emerald-500 shrink-0 mt-0.5">✓</span><span className="text-sm">{form.fuels[i]}</span></>}
                        </div>
                      </>
                    ))}
                  </div>
                </div>
              )}

              {form.overwhelm && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">When [Child Name] Gets Overwhelmed</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <p className="leading-relaxed whitespace-pre-line">{form.overwhelm}</p>
                  {form.overwhelmWhatHelps && (
                    <div className="mt-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
                      <p className="text-sm leading-relaxed">{form.overwhelmWhatHelps}</p>
                    </div>
                  )}
                </div>
              )}

              {form.needsToHear.some((n) => n.say) && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">What [Child Name] Needs to Hear Most</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <div className="border border-harbor-text/10 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 bg-harbor-bg-alt">
                      <div className="px-4 py-2 text-xs font-bold text-harbor-text/50 uppercase tracking-wider">When...</div>
                      <div className="px-4 py-2 text-xs font-bold text-harbor-text/50 uppercase tracking-wider border-l border-harbor-text/10">Say...</div>
                    </div>
                    {form.needsToHear.filter((n) => n.say).map((item, i) => (
                      <div key={i} className="grid grid-cols-2 border-t border-harbor-text/10">
                        <div className="px-4 py-3 text-sm">{item.when || "—"}</div>
                        <div className="px-4 py-3 text-sm italic border-l border-harbor-text/10">"{item.say}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.doNotSay.some((p) => p.insteadOf) && (
                <div>
                  <p className="text-xs font-bold text-harbor-orange uppercase tracking-wider mb-2">What NOT to Say and What to Say Instead</p>
                  <div className="w-8 h-0.5 bg-harbor-orange mb-3" />
                  <div className="border border-harbor-text/10 rounded-xl overflow-hidden">
                    <div className={`grid bg-harbor-bg-alt ${form.doNotSay.some((p) => p.context) ? "grid-cols-3" : "grid-cols-2"}`}>
                      {form.doNotSay.some((p) => p.context) && (
                        <div className="px-4 py-2 text-xs font-bold text-harbor-text/50 uppercase tracking-wider">When this happens...</div>
                      )}
                      <div className="px-4 py-2 text-xs font-bold text-harbor-text/50 uppercase tracking-wider border-l border-harbor-text/10">Instead of...</div>
                      <div className="px-4 py-2 text-xs font-bold text-harbor-text/50 uppercase tracking-wider border-l border-harbor-text/10">Try...</div>
                    </div>
                    {form.doNotSay.filter((p) => p.insteadOf).map((pair, i) => (
                      <div key={i} className={`grid border-t border-harbor-text/10 ${form.doNotSay.some((p) => p.context) ? "grid-cols-3" : "grid-cols-2"}`}>
                        {form.doNotSay.some((p) => p.context) && (
                          <div className="px-4 py-3 text-sm">{pair.context || "—"}</div>
                        )}
                        <div className="px-4 py-3 text-sm border-l border-harbor-text/10">
                          <span className="text-rose-500 mr-1">✗</span>"{pair.insteadOf}"
                        </div>
                        <div className="px-4 py-3 text-sm border-l border-harbor-text/10">
                          <span className="text-emerald-500 mr-1">✓</span>"{pair.tryThis}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.closingLine && (
                <div className="text-center pt-4 border-t border-harbor-text/10">
                  <p className="italic text-harbor-text/60">{form.closingLine}</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-harbor-error">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-harbor-text/10 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-harbor-text/50 hover:text-harbor-text hover:bg-harbor-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-harbor-accent text-white hover:bg-harbor-accent-light transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? "Saving..." : template ? "Update Template" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
