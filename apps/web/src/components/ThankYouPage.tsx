import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { trackPixelEvent, generateEventId } from "../lib/fbq";
import { trackFunnelEvent } from "../lib/analytics";

function getPronouns(gender?: string) {
  const g = (gender ?? "").toLowerCase();
  if (g.includes("boy")) return { pos: "his" };
  if (g.includes("girl")) return { pos: "her" };
  return { pos: "their" };
}

export default function ThankYouPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id") || params.get("payment_intent");

  // Read personalization from sessionStorage
  const childName = sessionStorage.getItem("wildprint_childName") || "your child";
  const email = sessionStorage.getItem("wildprint_email") || "";
  const childGender = sessionStorage.getItem("wildprint_childGender") || "";
  const { pos } = getPronouns(childGender);

  // Fire Purchase pixel + funnel event once on load
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current || !sessionId) return;
    firedRef.current = true;
    trackPixelEvent("Purchase", { value: 17, currency: "USD" }, generateEventId());
    trackFunnelEvent("purchase_completed", undefined, { stripeSessionId: sessionId });
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-16 overflow-y-auto">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5 text-center">
          <div className="text-5xl">💜</div>
          <h1 className="text-2xl font-bold text-harbor-primary leading-snug">
            Thank you for investing in understanding {childName} more deeply.
          </h1>
          <p className="text-harbor-text leading-relaxed">
            What you just did, taking the time to truly see how {pos} brain works,
            is one of the most powerful things a parent can do.
          </p>
          <p className="text-harbor-text leading-relaxed">
            {childName}'s full Wildprint report is on its way to your inbox right
            now.{email ? ` Check ${email}.` : ""} It should arrive within 2
            minutes.
          </p>
          <p className="text-harbor-text leading-relaxed">
            If you don't see it, check your spam folder and mark us as a contact:{" "}
            <a
              href="mailto:info@adhdparenting.com"
              className="text-harbor-accent underline"
            >
              info@adhdparenting.com
            </a>
          </p>
        </div>

        {sessionId ? (
          <p className="text-xs text-center text-harbor-text/30">
            Order ref: {sessionId.slice(0, 16)}...
          </p>
        ) : null}
      </div>
    </div>
  );
}
