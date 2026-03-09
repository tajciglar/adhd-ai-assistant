import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { clearOnboardingStorage } from "../../hooks/useOnboarding";
import { getFbp, getFbc, generateEventId, trackPixelEvent } from "../../lib/fbq";
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

type Phase = "analyzing" | "email" | "submitting" | "duplicate";

export default function CalculatingScreen({
  responses,
}: {
  responses: OnboardingResponses;
}) {
  const navigate = useNavigate();
  const childName = (responses.childName as string | undefined) ?? "your child";
  const childGender = responses.childGender as string | undefined;

  const [phase, setPhase] = useState<Phase>("analyzing");
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [email, setEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lines = LINES.map((l) => l.replace("[NAME]", childName));
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Progress fills over 4.5–6s then transitions to email phase
  useEffect(() => {
    const duration = 4500 + Math.random() * 1500;
    const steps = 100;
    const interval = duration / steps;
    let tick = 0;

    const timer = setInterval(() => {
      tick++;
      setProgress(tick);
      if (tick >= steps) {
        clearInterval(timer);
        setTimeout(() => setPhase("email"), 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Rotate lines every 1.5s while analyzing
  useEffect(() => {
    if (phase !== "analyzing") return;
    const timer = setInterval(() => {
      setLineIndex((i) => (i + 1) % lines.length);
    }, 1500);
    return () => clearInterval(timer);
  }, [phase, lines.length]);

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
      })) as { report: ArchetypeReportTemplate };

      // Client-side Lead event (deduped with CAPI via eventId)
      trackPixelEvent("Lead", {}, eventId);

      clearOnboardingStorage();
      navigate("/results", {
        state: { report: result.report, email, childName, childGender },
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
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5 text-center">
          <div className="text-4xl">👋</div>
          <h2 className="text-xl font-bold text-harbor-primary leading-snug">
            It looks like you've already discovered your child's Wildprint.
          </h2>
          <p className="text-harbor-text/70 leading-relaxed">
            We've sent your child's report to this email before. If you can't
            find it, check your spam folder — or reach out to us directly at{" "}
            <a
              href="mailto:info@adhdparenting.com"
              className="text-harbor-accent underline"
            >
              info@adhdparenting.com
            </a>{" "}
            and we'll resend it right away.
          </p>
          <p className="text-harbor-text/70 leading-relaxed">
            If you're here for a different child, just use a different email
            address and we'll create a brand new profile for them.
          </p>
        </div>
      </div>
    );
  }

  // ─── Analyzing phase ──────────────────────────────────────────────────────
  if (phase === "analyzing") {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-12">
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

  // ─── Email capture phase ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-harbor-bg flex items-start justify-center px-6 pt-16 pb-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="text-4xl">🎯</div>
            <h2 className="text-2xl font-bold text-harbor-primary">We found it!</h2>
            <p className="text-harbor-text/70">
              Enter your email to get {childName}'s Wildprint:
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
              Enter a valid email to save and access your results. We don't spam or sell data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
