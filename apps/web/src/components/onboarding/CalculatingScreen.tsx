import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { clearOnboardingStorage } from "../../hooks/useOnboarding";
import { getFbp, getFbc, generateEventId, trackPixelEvent } from "../../lib/fbq";
import { trackFunnelEvent } from "../../lib/analytics";
import { computeTraitProfile, ARCHETYPES } from "@adhd-ai-assistant/shared";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import type { OnboardingResponses } from "../../types/onboarding";

const LINES = [
  "Reviewing attention patterns...",
  "Mapping sensory responses...",
  "Identifying emotional profile...",
  "Matching executive function traits...",
  "Cross-referencing social patterns...",
  "Finding [NAME]'s Wildprint...",
];

const ANIMAL_EMOJI: Record<string, string> = {
  koala: "🐨",
  hummingbird: "🐦",
  tiger: "🐯",
  meerkat: "🦡",
  stallion: "🐴",
  fox: "🦊",
  owl: "🦉",
};

type Phase = "analyzing" | "found" | "email" | "submitting" | "duplicate";

function getPronouns(gender?: string) {
  const g = (gender ?? "").toLowerCase();
  if (g.includes("boy")) return { obj: "him", pos: "his" };
  if (g.includes("girl")) return { obj: "her", pos: "her" };
  return { obj: "them", pos: "their" };
}

export default function CalculatingScreen({
  responses,
}: {
  responses: OnboardingResponses;
}) {
  const navigate = useNavigate();
  const childName = (responses.childName as string | undefined) ?? "your child";
  const childGender = responses.childGender as string | undefined;
  const { obj: objPronoun } = getPronouns(childGender);

  const [phase, setPhase] = useState<Phase>("analyzing");
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Compute archetype client-side
  const traitProfile = useMemo(
    () => computeTraitProfile(responses as Record<string, unknown>),
    [responses],
  );
  const archetype = useMemo(
    () => ARCHETYPES.find((a) => a.id === traitProfile.archetypeId) ?? ARCHETYPES[0],
    [traitProfile.archetypeId],
  );
  const animalEmoji = ANIMAL_EMOJI[archetype.id] ?? "🧠";

  const lines = LINES.map((l) => l.replace("[NAME]", childName));
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Progress fills over 10-12s then transitions to "found" phase
  useEffect(() => {
    const duration = 10000 + Math.random() * 2000;
    const steps = 100;
    const interval = duration / steps;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      setProgress(tick);
      if (tick >= steps) {
        clearInterval(timer);
        setTimeout(() => setPhase("found"), 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Rotate lines every 1.8s while analyzing
  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [phase, lines.length]);

  // "We found it" frame holds for 2s then transitions to email
  useEffect(() => {
    if (phase !== "found") return;
    const timer = setTimeout(() => setPhase("email"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleSubmit = useCallback(async () => {
    if (!isValid || phase === "submitting") return;
    setPhase("submitting");
    setSubmitError(null);

    try {
      const eventId = generateEventId();

      const result = (await api.post("/api/guest/submit", {
        email,
        responses,
        childName,
        childGender,
        fbc: getFbc(),
        fbp: getFbp(),
        eventSourceUrl: window.location.href,
      })) as { report: ArchetypeReportTemplate; submissionId?: string };

      // Client-side Lead event (deduped with CAPI via eventId)
      trackPixelEvent("Lead", {}, eventId);

      // Track quiz completion in funnel analytics
      trackFunnelEvent("quiz_completed", undefined, {
        archetypeId: result.report?.archetypeId,
      });

      // Store data in sessionStorage for ThankYouPage
      sessionStorage.setItem("wildprint_childName", childName);
      sessionStorage.setItem("wildprint_email", email);
      sessionStorage.setItem("wildprint_childGender", childGender ?? "");

      clearOnboardingStorage();
      navigate("/results", {
        state: {
          report: result.report,
          email,
          childName,
          childGender,
          submissionId: result.submissionId,
        },
        replace: true,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "already_submitted") {
        setPhase("duplicate");
        return;
      }
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setPhase("email");
    }
  }, [isValid, phase, email, responses, childName, childGender, navigate]);

  // ─── Duplicate email phase ────────────────────────────────────────────────
  if (phase === "duplicate") {
    return (
      <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-12 overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5 text-center">
          <div className="text-4xl">👋</div>
          <h2 className="text-xl font-bold text-harbor-primary leading-snug">
            It looks like you've already discovered your child's Wildprint.
          </h2>
          <p className="text-harbor-text leading-relaxed">
            We've sent your child's report to this email before. If you can't
            find it, check your spam folder or reach out to us directly at{" "}
            <a
              href="mailto:info@adhdparenting.com"
              className="text-harbor-accent underline"
            >
              info@adhdparenting.com
            </a>{" "}
            and we'll resend it right away.
          </p>
          <p className="text-harbor-text leading-relaxed">
            If you're here for a different child, just use a different email
            address and we'll create a brand new profile for them.
          </p>
          <button
            type="button"
            onClick={() => {
              setEmail("");
              setPhase("email");
            }}
            className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Try a different email →
          </button>
        </div>
      </div>
    );
  }

  // ─── "We found it" frame ────────────────────────────────────────────────
  if (phase === "found") {
    return (
      <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-12 overflow-hidden">
        <div className="max-w-sm w-full space-y-6 text-center">
          <div className="text-7xl">{animalEmoji}</div>
          <h2 className="text-2xl font-bold text-harbor-primary">
            We found it.
          </h2>
        </div>
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        `}</style>
      </div>
    );
  }

  // ─── Analyzing phase ──────────────────────────────────────────────────────
  if (phase === "analyzing") {
    return (
      <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-12 overflow-hidden">
        <div className="max-w-sm w-full space-y-10 text-center">
          <div className="space-y-3">
            <div className="text-5xl animate-pulse">🧠</div>
            <h2 className="text-2xl font-bold text-harbor-primary">
              Analysing {childName}'s profile…
            </h2>
            <p
              key={lineIndex}
              className="text-sm text-harbor-text/60 min-h-[1.25rem]"
              style={{ animation: "fadeIn 0.4s ease" }}
            >
              {lines[lineIndex]}
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-2 bg-harbor-text/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-harbor-accent rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: "width 200ms linear",
                }}
              />
            </div>
            <p className="text-xs text-harbor-text/30 tabular-nums">{progress}%</p>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        `}</style>
      </div>
    );
  }

  // ─── Email capture phase with archetype reveal ─────────────────────────
  return (
    <div className="h-[100dvh] bg-harbor-bg flex items-center justify-center px-6 py-8 overflow-y-auto">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 space-y-5">
          {/* Archetype reveal */}
          <div className="text-center space-y-3">
            <div className="text-6xl">{animalEmoji}</div>
            <p className="text-sm font-semibold uppercase tracking-widest text-harbor-accent">
              The Wildprint has been identified.
            </p>
            <h2 className="text-2xl font-bold text-harbor-primary leading-snug">
              {childName} is {archetype.typeName}.
            </h2>
          </div>

          <p className="text-harbor-text leading-relaxed text-sm">
            Your child's full Wildprint report is ready, including the neuroscience
            behind {childName}'s specific profile, what drains {objPronoun}, what
            fuels {objPronoun}, and the hidden superpower most people around{" "}
            {objPronoun} completely miss.
          </p>

          <div className="space-y-1">
            <p className="text-sm font-medium text-harbor-text">
              Enter your email to unlock {childName}'s results:
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) void handleSubmit();
              }}
              placeholder="you@example.com"
              disabled={phase === "submitting"}
              className="w-full rounded-xl border border-harbor-text/20 bg-harbor-bg px-4 py-3 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:ring-2 focus:ring-harbor-primary/30 focus:border-harbor-primary transition"
            />

            {submitError ? (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                {submitError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!isValid || phase === "submitting"}
              className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {phase === "submitting" ? "Preparing…" : "Show me the Wildprint →"}
            </button>

            <p className="text-xs text-center text-harbor-text/40">
              Your email is safe. We don't spam or sell data, ever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
