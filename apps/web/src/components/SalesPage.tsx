import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { ARCHETYPES } from "@adhd-ai-assistant/shared";
import { trackPixelEvent, generateEventId } from "../lib/fbq";
import { trackFunnelEvent } from "../lib/analytics";

interface LocationState {
  report?: ArchetypeReportTemplate;
  email?: string;
  childName?: string;
  childGender?: string;
  submissionId?: string;
}

const ANIMAL_EMOJI: Record<string, string> = {
  koala: "🐨",
  hummingbird: "🐦",
  tiger: "🐯",
  meerkat: "🦡",
  stallion: "🐴",
  fox: "🦊",
  owl: "🦉",
};

function getPronouns(gender?: string) {
  const g = (gender ?? "").toLowerCase();
  if (g === "male" || g.includes("boy")) return { sub: "He", subLower: "he", obj: "him", pos: "his", self: "himself" };
  if (g === "female" || g.includes("girl")) return { sub: "She", subLower: "she", obj: "her", pos: "her", self: "herself" };
  return { sub: "They", subLower: "they", obj: "them", pos: "their", self: "themselves" };
}

export default function SalesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { report, email, childName, childGender, submissionId } =
    (location.state ?? {}) as LocationState;

  const firedRef = useRef(false);
  useEffect(() => {
    if (!report || firedRef.current) return;
    firedRef.current = true;
    trackPixelEvent(
      "ViewContent",
      { content_type: "quiz_result", content_category: "adhd_profile" },
      generateEventId(),
    );
  }, [report]);

  const handleCheckout = useCallback(() => {
    // Track checkout events
    trackFunnelEvent("checkout_started");
    trackPixelEvent("InitiateCheckout", { content_category: "adhd_report", value: 17, currency: "USD" }, generateEventId());

    // Store data in sessionStorage for ThankYouPage
    if (childName) sessionStorage.setItem("wildprint_childName", childName);
    if (email) sessionStorage.setItem("wildprint_email", email);
    if (childGender) sessionStorage.setItem("wildprint_childGender", childGender);

    // Navigate to custom checkout
    navigate("/checkout", {
      state: { report, email, childName, childGender, submissionId },
    });
  }, [email, childName, childGender, report, submissionId, navigate]);

  if (!report) return <Navigate to="/" replace />;

  const name = childName ?? "Your child";
  const { subLower, obj, self } = getPronouns(childGender);
  const archetype = ARCHETYPES.find((a) => a.id === report.archetypeId);
  const typeName = archetype?.typeName ?? report.title;
  const emoji = ANIMAL_EMOJI[report.archetypeId] ?? "🧠";

  const WHATS_INSIDE = [
    `The neuroscience behind ${name}'s specific profile, explained in plain language, not clinical jargon`,
    `"A Day in ${name}'s Life," four real scenarios (morning, school, after school, bedtime) that will make you say "that's exactly what happens in our house"`,
    `What drains ${name} vs. what fuels ${obj}, a practical reference table you'll come back to every week`,
    `What to say, and what never to say, when ${name} is struggling`,
    `${name}'s hidden superpower, the quality most people around ${obj} completely miss`,
    `"What ${name} needs to hear most," five sentences that will change how ${subLower} sees ${self}`,
  ];

  return (
    <div className="min-h-screen bg-harbor-bg overflow-y-auto">
      <div className="max-w-lg w-full mx-auto px-6 py-16 space-y-8">

        {/* ── Section A: Report Teaser ── */}
        <div className="text-center space-y-4">
          <div className="text-7xl">{emoji}</div>
          <h1 className="text-3xl font-bold text-harbor-primary leading-tight">
            {name} is {typeName}.
          </h1>
          <p className="text-harbor-text italic text-base leading-relaxed">
            &ldquo;{report.innerVoiceQuote?.trim()}&rdquo; &mdash; {name}
          </p>
        </div>

        {/* Blurred PDF Preview */}
        <div className="relative rounded-2xl border border-harbor-text/10 shadow-sm overflow-hidden bg-white">
          <div className="p-6 pb-0 space-y-4">
            <div className="flex items-center gap-2 text-xs text-harbor-text/40 uppercase tracking-widest font-semibold">
              <span>Wildprint Report</span>
              <span className="mx-1">·</span>
              <span>{name}</span>
            </div>
            <h3 className="text-2xl font-bold text-harbor-primary leading-tight">
              {report.title}
            </h3>
            <div className="border-t border-harbor-text/8 pt-4">
              <h4 className="text-sm font-semibold text-harbor-primary mb-1">About {name}</h4>
              <p className="text-harbor-text text-sm leading-relaxed">
                {report.aboutChild?.slice(0, 300)}...
              </p>
            </div>
            <div className="border-t border-harbor-text/8 pt-4">
              <h4 className="text-sm font-semibold text-harbor-primary mb-1">Hidden Superpower</h4>
              <p className="text-harbor-text text-sm leading-relaxed">
                {report.hiddenSuperpower?.slice(0, 150)}...
              </p>
            </div>
          </div>

          <div className="relative h-32">
            <div className="px-6 pt-3 space-y-3 text-sm text-harbor-text leading-relaxed">
              <div className="border-t border-harbor-text/8 pt-3">
                <h4 className="text-sm font-semibold text-harbor-primary mb-1">Understanding the Brain</h4>
                <p>{report.brainSections?.[0]?.content?.slice(0, 100)}...</p>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/80 to-white backdrop-blur-[2px] flex flex-col items-center justify-end pb-5">
              <button
                type="button"
                onClick={handleCheckout}
                className="bg-harbor-primary/5 border border-harbor-primary/15 rounded-xl px-5 py-3 flex items-center gap-2 hover:bg-harbor-primary/10 active:scale-[0.98] transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 text-harbor-primary/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-sm font-medium text-harbor-primary/70">Full report unlocked after purchase</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Section B: Sales Copy ── */}
        <div className="space-y-4">
          <p className="text-harbor-text leading-relaxed">
            {name}'s brain works in a way that most people around {obj} will never
            fully understand, not because something is wrong, but because {name} is
            operating on a frequency that most environments weren't built for.
          </p>
          <p className="text-harbor-text leading-relaxed">
            Your full Wildprint report reveals exactly who {name} is, why {subLower} does
            what {subLower} does, and what {subLower} needs from you to finally feel understood.
          </p>
        </div>

        {/* What's inside */}
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-widest text-harbor-text/40">
            What's inside {name}'s full Wildprint report
          </p>
          <ul className="space-y-2">
            {WHATS_INSIDE.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-harbor-accent/15 flex items-center justify-center">
                  <svg className="w-3 h-3 text-harbor-accent" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-harbor-text text-sm leading-relaxed">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Section C: Trust & Authority ── */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-2">
            <p className="text-sm font-semibold text-harbor-primary">🧠 Built by specialists</p>
            <p className="text-harbor-text text-sm leading-relaxed">
              Built by ADHD specialists with over 40 years of combined clinical
              experience. This isn't a generic personality quiz. Every question,
              every profile, and every recommendation is grounded in decades of
              real work with real ADHD families.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-2">
            <p className="text-sm font-semibold text-harbor-primary">✅ 100% satisfaction guarantee</p>
            <p className="text-harbor-text text-sm leading-relaxed">
              If the report doesn't feel like it was written specifically about
              your child, email us and we'll refund you, no questions asked.
            </p>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCheckout}
            className="w-full rounded-xl bg-harbor-primary text-white px-5 py-4 font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            {`Unlock ${name}'s Full Wildprint Report · $17 →`}
          </button>
        </div>
      </div>
    </div>
  );
}
