import { useState } from "react";
import type { ReportTemplateData, ReportTemplateRecord } from "../../types/admin";

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
    hiddenSuperpower: "",
    brainSections: [{ title: "", content: "" }],
    dayInLife: { morning: "", school: "", afterSchool: "", bedtime: "" },
    drains: [""],
    fuels: [""],
    overwhelm: "",
    affirmations: [""],
    doNotSay: [{ insteadOf: "", tryThis: "" }],
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
  const affirmationsRaw = parseSection(text, needsHeading, dontSayHeading);
  const doNotSayRaw = parseSection(text, dontSayHeading, "");

  const firstIdx = understanding.indexOf("The first is");
  const secondIdx = understanding.indexOf("The second is");
  let brainSections = [{ title: "Overview", content: understanding.trim() }];
  if (firstIdx !== -1 && secondIdx !== -1 && secondIdx > firstIdx) {
    const intro = understanding.slice(0, firstIdx).trim();
    const attention = understanding.slice(firstIdx, secondIdx).trim();
    const hyperactivity = understanding.slice(secondIdx).trim();
    brainSections = [
      { title: "Attention", content: `${intro} ${attention}`.trim() },
      { title: "Hyperactivity", content: hyperactivity },
    ];
  }

  function extractDay(label: string, fallback = ""): string {
    const markers = ["Morning:", "At School:", "After School:", "Bedtime:"];
    const idx = day.indexOf(label);
    if (idx === -1) return fallback;
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

  const affirmations = compactLines(affirmationsRaw).map((line) =>
    line.replace(/^"|"$/g, ""),
  );

  const doNotSayLines = compactLines(doNotSayRaw).filter(
    (line) =>
      line !== "Instead of..." &&
      line !== "Try..." &&
      !line.startsWith("[NAME] is a "),
  );
  const doNotSay: Array<{ insteadOf: string; tryThis: string }> = [];
  for (let i = 0; i < doNotSayLines.length; i += 2) {
    if (!doNotSayLines[i]) continue;
    doNotSay.push({
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
    hiddenSuperpower,
    brainSections: brainSections.length > 0 ? brainSections : [{ title: "", content: "" }],
    dayInLife,
    drains: drains.length > 0 ? drains : [""],
    fuels: fuels.length > 0 ? fuels : [""],
    overwhelm,
    affirmations: affirmations.length > 0 ? affirmations : [""],
    doNotSay: doNotSay.length > 0 ? doNotSay : [{ insteadOf: "", tryThis: "" }],
    closingLine,
  };
}

export default function ReportTemplateEditor({
  template,
  saving,
  onSave,
  onCancel,
}: ReportTemplateEditorProps) {
  const [form, setForm] = useState<ReportTemplateData>(template?.template ?? emptyTemplate());
  const [archetypeId, setArchetypeId] = useState(template?.archetypeId ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const title = template ? "Edit Report Template" : "New Report Template";

  function setField<K extends keyof ReportTemplateData>(key: K, value: ReportTemplateData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateStringList(
    key: "drains" | "fuels" | "affirmations",
    index: number,
    value: string,
  ) {
    const next = [...form[key]];
    next[index] = value;
    setField(key, next);
  }

  async function handleSave() {
    setError(null);
    if (!archetypeId.trim()) {
      setError("Archetype ID is required.");
      return;
    }

    const payload: ReportTemplateData = {
      ...form,
      archetypeId: archetypeId.trim(),
    };

    const ok = await onSave(payload);
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
      if (!archetypeId.trim() && parsed.archetypeId) {
        setArchetypeId(parsed.archetypeId);
      }
      setError(null);
    } catch {
      setError("Could not parse imported text.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-harbor-text/10">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-harbor-text">{title}</h3>
            <div className="flex rounded-lg border border-harbor-text/15 p-0.5">
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`px-3 py-1.5 text-xs rounded-md cursor-pointer ${
                  mode === "edit"
                    ? "bg-harbor-accent text-white"
                    : "text-harbor-text/70 hover:bg-harbor-bg"
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`px-3 py-1.5 text-xs rounded-md cursor-pointer ${
                  mode === "preview"
                    ? "bg-harbor-accent text-white"
                    : "text-harbor-text/70 hover:bg-harbor-bg"
                }`}
              >
                Preview
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {mode === "edit" ? (
            <>
              <section className="space-y-3 border border-harbor-text/10 rounded-xl p-4 bg-harbor-bg/30">
                <h4 className="text-sm font-semibold text-harbor-text/80">
                  Import From Plain Text
                </h4>
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

          <section className="space-y-4">
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
              placeholder="Title"
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
            <textarea
              value={form.innerVoiceQuote}
              onChange={(e) => setField("innerVoiceQuote", e.target.value)}
              placeholder="Inner voice quote"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-harbor-text/80">Main Content</h4>
            <textarea
              value={form.animalDescription}
              onChange={(e) => setField("animalDescription", e.target.value)}
              placeholder="Animal description"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
            <textarea
              value={form.aboutChild}
              onChange={(e) => setField("aboutChild", e.target.value)}
              placeholder="About child"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
            <textarea
              value={form.hiddenSuperpower}
              onChange={(e) => setField("hiddenSuperpower", e.target.value)}
              placeholder="Hidden superpower"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-harbor-text/80">Brain Sections</h4>
              <button
                onClick={() =>
                  setField("brainSections", [...form.brainSections, { title: "", content: "" }])
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
              >
                + Add Section
              </button>
            </div>
            {form.brainSections.map((section, index) => (
              <div key={`brain-${index}`} className="border border-harbor-text/10 rounded-xl p-3 space-y-2">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => {
                    const next = [...form.brainSections];
                    next[index] = { ...next[index], title: e.target.value };
                    setField("brainSections", next);
                  }}
                  placeholder="Section title"
                  className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
                <textarea
                  value={section.content}
                  onChange={(e) => {
                    const next = [...form.brainSections];
                    next[index] = { ...next[index], content: e.target.value };
                    setField("brainSections", next);
                  }}
                  rows={3}
                  placeholder="Section content"
                  className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-harbor-text/80">Day In Life</h4>
            {(["morning", "school", "afterSchool", "bedtime"] as const).map((key) => (
              <textarea
                key={key}
                value={form.dayInLife[key]}
                onChange={(e) =>
                  setField("dayInLife", { ...form.dayInLife, [key]: e.target.value })
                }
                rows={3}
                placeholder={key}
                className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
              />
            ))}
          </section>

          {(["drains", "fuels", "affirmations"] as const).map((key) => (
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
                <input
                  key={`${key}-${index}`}
                  type="text"
                  value={item}
                  onChange={(e) => updateStringList(key, index, e.target.value)}
                  placeholder={`${key} item`}
                  className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              ))}
            </section>
          ))}

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-harbor-text/80">Overwhelm</h4>
            <textarea
              value={form.overwhelm}
              onChange={(e) => setField("overwhelm", e.target.value)}
              rows={5}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-harbor-text/80">Do Not Say</h4>
              <button
                onClick={() =>
                  setField("doNotSay", [...form.doNotSay, { insteadOf: "", tryThis: "" }])
                }
                className="px-3 py-1.5 text-xs rounded-lg border border-harbor-text/15 hover:bg-harbor-bg cursor-pointer"
              >
                + Add Pair
              </button>
            </div>
            {form.doNotSay.map((pair, index) => (
              <div key={`pair-${index}`} className="border border-harbor-text/10 rounded-xl p-3 space-y-2">
                <input
                  type="text"
                  value={pair.insteadOf}
                  onChange={(e) => {
                    const next = [...form.doNotSay];
                    next[index] = { ...next[index], insteadOf: e.target.value };
                    setField("doNotSay", next);
                  }}
                  placeholder="Instead of..."
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
                  placeholder="Try this..."
                  className="w-full px-3 py-2 rounded-lg border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
                />
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-harbor-text/80">Closing Line</h4>
            <textarea
              value={form.closingLine}
              onChange={(e) => setField("closingLine", e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-harbor-text/15 focus:outline-none focus:border-harbor-accent"
            />
          </section>
            </>
          ) : (
            <div className="space-y-4">
              <section className="bg-harbor-bg/40 rounded-xl border border-harbor-text/10 p-4">
                <h2 className="text-xl font-semibold text-harbor-primary">{form.title}</h2>
                <p className="text-harbor-text/70 italic mt-2">"{form.innerVoiceQuote}"</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-harbor-text/80">Animal Description</h3>
                <p className="text-sm text-harbor-text/80 whitespace-pre-line">{form.animalDescription}</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-harbor-text/80">About Child</h3>
                <p className="text-sm text-harbor-text/80 whitespace-pre-line">{form.aboutChild}</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-harbor-text/80">Hidden Superpower</h3>
                <p className="text-sm text-harbor-text/80 whitespace-pre-line">{form.hiddenSuperpower}</p>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-harbor-text/80">Brain Sections</h3>
                {form.brainSections.map((s, i) => (
                  <div key={`${s.title}-${i}`} className="border border-harbor-text/10 rounded-xl p-3">
                    <p className="font-medium text-harbor-text">{s.title}</p>
                    <p className="text-sm text-harbor-text/80 whitespace-pre-line mt-1">{s.content}</p>
                  </div>
                ))}
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-harbor-text/80">Closing</h3>
                <p className="text-sm text-harbor-text/80 italic">{form.closingLine}</p>
              </section>
            </div>
          )}

          {error ? <p className="text-sm text-harbor-error">{error}</p> : null}
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
