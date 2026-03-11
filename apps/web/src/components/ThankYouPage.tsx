import { useEffect, useRef } from "react";
import { trackPixelEvent, generateEventId } from "../lib/fbq";
import { trackFunnelEvent } from "../lib/analytics";

function getPronouns(gender?: string) {
  const g = (gender ?? "").toLowerCase();
  if (g.includes("boy")) return { pos: "his" };
  if (g.includes("girl")) return { pos: "her" };
  return { pos: "their" };
}

export default function ThankYouPage() {
  // Read personalization from sessionStorage
  const childName = sessionStorage.getItem("wildprint_childName") || "your child";
  const email = sessionStorage.getItem("wildprint_email") || "";
  const childGender = sessionStorage.getItem("wildprint_childGender") || "";
  const { pos } = getPronouns(childGender);

  // Fire Lead pixel + funnel event once on load
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackPixelEvent("Lead", { content_category: "adhd_report" }, generateEventId());
    trackFunnelEvent("optin_thankyou");
  }, []);

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-16 overflow-y-auto">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5 text-center">
          <div className="text-5xl">💜</div>
          <h1 className="text-2xl font-bold text-harbor-primary leading-snug">
            Thank you for taking the time to understand {childName} better.
          </h1>
          <p className="text-harbor-text leading-relaxed">
            What you just did, taking the time to truly see how {pos} brain works,
            is one of the most powerful things a parent can do.
          </p>
          <p className="text-harbor-text leading-relaxed">
            We'll be in touch soon with {childName}'s results.
            {email ? ` Keep an eye on ${email}.` : ""}
          </p>
          <p className="text-harbor-text leading-relaxed">
            If you don't see our email, check your spam folder and mark us as a contact:{" "}
            <a
              href="mailto:info@adhdparenting.com"
              className="text-harbor-accent underline"
            >
              info@adhdparenting.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
