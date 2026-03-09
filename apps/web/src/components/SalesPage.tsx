import { useEffect, useRef } from "react";
import { useLocation, Navigate } from "react-router-dom";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { trackPixelEvent, generateEventId } from "../lib/fbq";

interface LocationState {
  report?: ArchetypeReportTemplate;
  email?: string;
  childName?: string;
  childGender?: string;
}

function getPronouns(gender?: string) {
  const g = (gender ?? "").toLowerCase();
  if (g === "male" || g === "boy") return { sub: "He", obj: "him", pos: "his" };
  if (g === "female" || g === "girl") return { sub: "She", obj: "her", pos: "her" };
  return { sub: "They", obj: "them", pos: "their" };
}

const WHATS_INSIDE = [
  "The full breakdown of [NAME]'s ADHD archetype",
  "What drains [NAME]'s energy — and what fills it back up",
  "How to support [THEM] when [THEY] are overwhelmed",
  "The exact phrases that help — and the ones that backfire",
  "[NAME]'s hidden strengths most people around [THEM] miss",
  "A personalised daily framework for school and home",
];

export default function SalesPage() {
  const location = useLocation();
  const { report, email, childName, childGender } =
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

  if (!report) return <Navigate to="/" replace />;

  const name = childName ?? "Your child";
  const { sub, obj, pos } = getPronouns(childGender);

  const bullets = WHATS_INSIDE.map((b) =>
    b
      .replace(/\[NAME\]/g, name)
      .replace(/\[THEY\]/g, sub)
      .replace(/\[THEM\]/g, obj)
      .replace(/\[THEIR\]/g, pos),
  );

  const checkoutUrl = import.meta.env.VITE_CHECKOUT_URL as string | undefined;

  return (
    <div className="min-h-screen bg-harbor-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full space-y-8">
        {/* Header badge */}
        <div className="text-center space-y-3">
          <span className="inline-block bg-harbor-accent/10 text-harbor-accent text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
            {name}'s Wildprint has been identified
          </span>
          <h1 className="text-3xl font-bold text-harbor-primary leading-tight">
            {report.title}
          </h1>
          <p className="text-lg text-harbor-text/70 font-medium">
            {sub} is a rare profile.
          </p>
        </div>

        {/* Body copy */}
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-4">
          <p className="text-harbor-text/80 leading-relaxed">
            {name}'s brain works in a way that most people around{" "}
            {obj.toLowerCase()} will never fully see — not because they aren't
            looking, but because they don't know what to look for.
          </p>
          <p className="text-harbor-text/80 leading-relaxed">
            This profile is rare. It comes with a very specific set of
            strengths, a very specific set of struggles, and a very specific
            blueprint for how to support {obj.toLowerCase()} — once you know
            what you're working with.
          </p>
          <p className="text-harbor-text/80 leading-relaxed font-medium">
            {name}'s full report has everything you need to finally understand{" "}
            {obj.toLowerCase()}.
          </p>
        </div>

        {/* What's inside */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-harbor-text/40">
            What's inside
          </p>
          <ul className="space-y-2">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-harbor-accent/15 flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-harbor-accent"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-harbor-text/80 text-sm leading-relaxed">
                  {bullet}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              className="block w-full text-center rounded-xl bg-harbor-primary text-white px-5 py-4 font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              Unlock {name}'s Full Wildprint Report — $17 →
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-harbor-primary/40 text-white px-5 py-4 font-semibold text-base cursor-not-allowed"
            >
              Unlock {name}'s Full Wildprint Report — $17 →
            </button>
          )}

          {email ? (
            <p className="text-xs text-center text-harbor-text/40">
              A summary has been sent to {email}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
