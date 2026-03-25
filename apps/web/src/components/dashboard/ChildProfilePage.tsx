import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import LoadingScreen from "../shared/LoadingScreen";
import Mascot from "../shared/Mascot";
import { normalizeReportTemplateData } from "../../lib/reportTemplate";

interface ChildData {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
}

interface TraitProfile {
  scores: Record<string, number>;
  archetypeId: string;
  archetypeName?: string;
  archetypeTypeName?: string;
  pdfUrl?: string | null;
}

interface Report {
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenGift: string;
  aboutBrain?: string;
  brainSections: Array<{ title: string; content: string }>;
  dayInLife: {
    morning: string;
    school: string;
    afterSchool: string;
    bedtime: string;
  };
  drains: string[];
  fuels: string[];
  overwhelm: string;
  affirmations: Array<{ when: string; say: string }>;
  doNotSay: Array<{ when?: string; insteadOf: string; tryThis: string }>;
  closingLine: string;
  whatHelps?: {
    aboutChild?: string;
    hiddenGift?: string;
    brain?: string;
    morning?: string;
    school?: string;
    afterSchool?: string;
    bedtime?: string;
    overwhelm?: string;
  };
}

interface ChildReportResponse {
  child: ChildData | null;
  traitProfile: TraitProfile | null;
  report: Report | null;
}

const TRAIT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  inattentive: { label: "Focus & Attention", icon: "visibility", color: "bg-sky-500" },
  hyperactive: { label: "Energy & Movement", icon: "bolt", color: "bg-amber-500" },
  sensory: { label: "Sensory Processing", icon: "hearing", color: "bg-emerald-500" },
  emotional: { label: "Emotional Regulation", icon: "favorite", color: "bg-rose-500" },
  executive_function: { label: "Planning & Organization", icon: "checklist", color: "bg-harbor-primary" },
  social: { label: "Social Awareness", icon: "group", color: "bg-harbor-orange" },
};

const DAY_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  morning: { icon: "wb_sunny", label: "Morning", color: "text-amber-500" },
  school: { icon: "school", label: "At School", color: "text-sky-500" },
  afterSchool: { icon: "sports_esports", label: "After School", color: "text-emerald-500" },
  bedtime: { icon: "bedtime", label: "Bedtime", color: "text-harbor-primary" },
};

function WhatHelpsBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-3 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl px-4 py-3">
      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">What Helps</p>
      <p className="text-sm text-emerald-800 leading-relaxed">{text}</p>
    </div>
  );
}

export default function ChildProfilePage() {
  const [data, setData] = useState<ChildReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBrain, setExpandedBrain] = useState<number | null>(null);

  useEffect(() => {
    api
      .get("/api/user/child-report")
      .then((res) => {
        const payload = res as ChildReportResponse;
        setData({
          ...payload,
          report: payload.report ? normalizeReportTemplateData(payload.report) as Report : null,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  const { child, traitProfile, report } = data ?? {};

  if (!child || !traitProfile) {
    return (
      <div className="flex min-h-screen bg-harbor-bg">
        <DesktopSidebar active="child" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Mascot size={100} mood="waving" />
          <h2 className="text-xl font-bold text-harbor-primary font-display mt-4">No Child Profile Yet</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-sm">
            Complete the ADHD assessment quiz to unlock your child's personalized profile and strategies.
          </p>
        </div>
        <BottomNav active="planner" />
      </div>
    );
  }

  const childName = child.name || "Your Child";
  const archetypeName = traitProfile.archetypeTypeName || traitProfile.archetypeName || "";
  const maxScore = 3;

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="child" />

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 bg-harbor-bg-alt border-b border-harbor-orange/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Mascot size={32} />
            <span className="text-base font-bold tracking-tight text-harbor-primary font-display">
              {childName}
            </span>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-16 border-b border-harbor-orange/10 bg-gradient-to-b from-harbor-bg-alt to-white items-center px-8 shrink-0">
          <h2 className="text-lg font-bold text-harbor-primary font-display">
            {childName}'s Profile
          </h2>
        </header>

        <main className="flex-1 overflow-y-auto pb-28 md:pb-10">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-6">
            {/* ── Hero Card ── */}
            <div className="bg-gradient-to-br from-harbor-primary to-harbor-primary/80 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
              {traitProfile.archetypeId ? (
                <img
                  src={`/animals/${traitProfile.archetypeId}.png`}
                  alt={archetypeName}
                  className="absolute right-0 bottom-0 h-32 w-32 object-contain opacity-90 pointer-events-none"
                />
              ) : (
                <div className="absolute right-4 top-4 opacity-10">
                  <Mascot size={120} />
                </div>
              )}
              <div className="relative z-10">
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">ADHD Profile</p>
                <h1 className="text-2xl font-extrabold font-display mb-1">{childName}</h1>
                {archetypeName && (
                  <p className="text-white/80 text-sm font-medium">{archetypeName}</p>
                )}
                {child.age && (
                  <p className="text-white/60 text-xs mt-2">{child.age} years old</p>
                )}
                {traitProfile.pdfUrl && (
                  <a
                    href={traitProfile.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-4 bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      download
                    </span>
                    Download Full PDF Report
                  </a>
                )}
              </div>
            </div>

            {/* ── Inner Voice Quote ── */}
            {report?.innerVoiceQuote && (
              <div className="bg-harbor-bg-alt border border-harbor-orange/10 rounded-xl p-5 mb-6">
                <p className="text-xs font-semibold text-harbor-orange uppercase tracking-wider mb-2">
                  {childName}'s Inner Voice
                </p>
                <p className="text-harbor-text italic leading-relaxed">
                  "{report.innerVoiceQuote}"
                </p>
              </div>
            )}

            {/* ── Trait Bars ── */}
            <section className="mb-8">
              <h3 className="text-base font-bold text-harbor-primary font-display mb-4">ADHD Trait Profile</h3>
              <div className="space-y-3">
                {Object.entries(traitProfile.scores).map(([key, score]) => {
                  const trait = TRAIT_LABELS[key];
                  if (!trait) return null;
                  const pct = Math.round((score / maxScore) * 100);
                  return (
                    <div key={key} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="material-symbols-outlined text-[18px] text-harbor-primary"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {trait.icon}
                          </span>
                          <span className="text-sm font-semibold text-harbor-text">{trait.label}</span>
                        </div>
                        <span className="text-xs font-bold text-harbor-text/50">{score.toFixed(1)}/{maxScore}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${trait.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── About ── */}
            {report?.aboutChild && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">About {childName}</h3>
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-sm text-harbor-text leading-relaxed">{report.aboutChild}</p>
                  {report.whatHelps?.aboutChild && <WhatHelpsBox text={report.whatHelps.aboutChild} />}
                </div>
              </section>
            )}

            {/* ── Hidden Gift ── */}
            {report?.hiddenGift && (
              <section className="mb-8">
                <div className="bg-harbor-bg-alt border border-harbor-orange/15 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="material-symbols-outlined text-harbor-orange text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    <h3 className="text-base font-bold text-harbor-orange font-display">Hidden Gift</h3>
                  </div>
                  <p className="text-sm text-harbor-text leading-relaxed">{report.hiddenGift}</p>
                  {report.whatHelps?.hiddenGift && <WhatHelpsBox text={report.whatHelps.hiddenGift} />}
                </div>
              </section>
            )}

            {/* ── Animal Description ── */}
            {report?.animalDescription && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">
                  The {archetypeName || "Archetype"}
                </h3>
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-sm text-harbor-text leading-relaxed">{report.animalDescription}</p>
                </div>
              </section>
            )}

            {/* ── Brain Sections ── */}
            {report?.brainSections && report.brainSections.length > 0 && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">How {childName}'s Brain Works</h3>
                <div className="space-y-2">
                  {report.brainSections.map((section, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setExpandedBrain(expandedBrain === i ? null : i)}
                        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm font-semibold text-harbor-text">{section.title}</span>
                        <span
                          className="material-symbols-outlined text-slate-400 text-[20px] transition-transform"
                          style={{ transform: expandedBrain === i ? "rotate(180deg)" : "" }}
                        >
                          expand_more
                        </span>
                      </button>
                      {expandedBrain === i && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-harbor-text/80 leading-relaxed">{section.content}</p>
                          {i === 0 && report.whatHelps?.brain && <WhatHelpsBox text={report.whatHelps.brain} />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Day in Life ── */}
            {report?.dayInLife && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">A Day in {childName}'s Life</h3>
                <div className="space-y-3">
                  {(["morning", "school", "afterSchool", "bedtime"] as const).map((key) => {
                    const text = report.dayInLife[key];
                    const info = DAY_ICONS[key];
                    if (!info || !text) return null;
                    return (
                      <div key={key} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`material-symbols-outlined ${info.color} text-[18px]`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {info.icon}
                          </span>
                          <span className="text-sm font-semibold text-harbor-text">{info.label}</span>
                        </div>
                        <p className="text-sm text-harbor-text/70 leading-relaxed">{text}</p>
                        {key === "school" && report.whatHelps?.school && (
                          <WhatHelpsBox text={report.whatHelps.school} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Drains & Fuels ── */}
            {(report?.drains?.length || report?.fuels?.length) ? (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">Energy Profile</h3>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    {/* Drains column */}
                    <div>
                      <div className="flex items-center gap-1.5 px-4 py-3 bg-rose-50 border-b border-slate-100">
                        <span
                          className="material-symbols-outlined text-rose-500 text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          battery_alert
                        </span>
                        <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Energy Drains</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {(report?.drains ?? []).map((d, i) => (
                          <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                            <span className="text-base leading-none mt-0.5">❌</span>
                            <span className="text-xs text-harbor-text/80 leading-relaxed">{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Fuels column */}
                    <div>
                      <div className="flex items-center gap-1.5 px-4 py-3 bg-emerald-50 border-b border-slate-100">
                        <span
                          className="material-symbols-outlined text-emerald-500 text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          bolt
                        </span>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Energy Fuels</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {(report?.fuels ?? []).map((f, i) => (
                          <div key={i} className="flex items-start gap-2 px-4 py-2.5">
                            <span className="text-base leading-none mt-0.5">✅</span>
                            <span className="text-xs text-harbor-text/80 leading-relaxed">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* ── Overwhelm ── */}
            {report?.overwhelm && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">When {childName} is Overwhelmed</h3>
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-sm text-harbor-text leading-relaxed">{report.overwhelm}</p>
                  {report.whatHelps?.overwhelm && <WhatHelpsBox text={report.whatHelps.overwhelm} />}
                </div>
              </section>
            )}

            {/* ── What Child Needs to Hear ── */}
            {report?.affirmations && report.affirmations.filter((n) => n.when || n.say).length > 0 && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">
                  What {childName} Needs to Hear
                </h3>
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">When…</span>
                    </div>
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-bold text-harbor-primary uppercase tracking-wider">Say…</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {report.affirmations
                      .filter((n) => n.when || n.say)
                      .map((item, i) => (
                        <div key={i} className="grid grid-cols-2 divide-x divide-slate-100">
                          <div className="px-4 py-3">
                            <p className="text-xs text-harbor-text/60 leading-relaxed">{item.when}</p>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-sm text-harbor-text font-medium leading-relaxed">"{item.say}"</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </section>
            )}

            {/* ── What NOT to Say ── */}
            {report?.doNotSay && report.doNotSay.length > 0 && (
              <section className="mb-8">
                <h3 className="text-base font-bold text-harbor-primary font-display mb-3">Communication Guide</h3>
                <div className="space-y-3">
                  {report.doNotSay.map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      {item.when && (
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <span className="text-xs font-semibold text-slate-500">{item.when}</span>
                        </div>
                      )}
                      <div className="flex gap-3 p-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-rose-500 mb-0.5">Instead of:</p>
                          <p className="text-sm text-harbor-text/70 line-through">{item.insteadOf}</p>
                        </div>
                        <div className="w-px bg-slate-100" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-emerald-500 mb-0.5">Try this:</p>
                          <p className="text-sm text-harbor-text font-medium">{item.tryThis}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Closing ── */}
            {report?.closingLine && (
              <div className="text-center py-6">
                <Mascot size={48} mood="happy" className="mx-auto mb-3" />
                <p className="text-sm text-harbor-text/60 italic max-w-md mx-auto">{report.closingLine}</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <BottomNav active="planner" />
    </div>
  );
}
