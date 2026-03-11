import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, Navigate, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { ArchetypeReportTemplate } from "@adhd-parenting-quiz/shared";
import { ARCHETYPES } from "@adhd-parenting-quiz/shared";
import { api } from "../lib/api";
import { AnimalIcon } from "../lib/animalImages";

interface LocationState {
  report?: ArchetypeReportTemplate;
  email?: string;
  childName?: string;
  childGender?: string;
  submissionId?: string;
}

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
);

/* ─── Inner checkout form (needs Stripe context) ─────────────────────────── */

function CheckoutForm({
  childName,
  typeName,
  archetypeId,
  email,
}: {
  childName: string;
  typeName: string;
  archetypeId: string;
  email?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements || loading) return;

      setLoading(true);
      setError(null);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/thank-you`,
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(
          result.error.message ?? "Something went wrong. Please try again.",
        );
        setLoading(false);
      } else if (result.paymentIntent?.status === "succeeded") {
        navigate(
          `/thank-you?payment_intent=${result.paymentIntent.id}`,
          { replace: true },
        );
      }
    },
    [stripe, elements, loading, navigate],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-harbor-text/40">
          Order Summary
        </p>
        <div className="flex items-center gap-4">
          <AnimalIcon id={archetypeId} className="w-16 h-16" />
          <div className="flex-1">
            <p className="font-semibold text-harbor-primary">
              {childName}'s Full Wildprint Report
            </p>
            <p className="text-sm text-harbor-text/60">{typeName}</p>
          </div>
          <p className="text-lg font-bold text-harbor-primary">$17</p>
        </div>
        {email ? (
          <p className="text-sm text-harbor-text/50">
            Will be sent to <span className="font-medium text-harbor-text/70">{email}</span>
          </p>
        ) : null}
      </div>

      {/* Payment Element */}
      <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {/* Error */}
      {error ? (
        <p className="text-sm text-center text-red-600 bg-red-50 rounded-lg px-4 py-2">
          {error}
        </p>
      ) : null}

      {/* CTA Button */}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-harbor-primary text-white px-5 py-4 font-semibold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-wait"
      >
        {loading ? "Processing..." : `Get ${childName}'s Report \u2192`}
      </button>

      {/* Trust Elements */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-harbor-text/50">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-harbor-text/10 p-3 text-center">
            <p className="text-xs font-semibold text-harbor-primary">
              🧠 ADHD Specialists
            </p>
            <p className="text-xs text-harbor-text/50 mt-1">
              40+ years combined experience
            </p>
          </div>
          <div className="bg-white rounded-xl border border-harbor-text/10 p-3 text-center">
            <p className="text-xs font-semibold text-harbor-primary">
              ✅ 100% Guarantee
            </p>
            <p className="text-xs text-harbor-text/50 mt-1">
              Full refund if not satisfied
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ─── Main checkout page ─────────────────────────────────────────────────── */

export default function CheckoutPage() {
  const location = useLocation();
  const { report, email, childName, childGender, submissionId } =
    (location.state ?? {}) as LocationState;

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const archetype = useMemo(
    () => ARCHETYPES.find((a) => a.id === report?.archetypeId),
    [report?.archetypeId],
  );
  const typeName = archetype?.typeName ?? report?.title ?? "";
  const archetypeId = report?.archetypeId ?? "";
  const name = childName ?? "Your child";

  // Create PaymentIntent on mount
  useEffect(() => {
    if (!report || clientSecret) return;

    (async () => {
      try {
        const result = (await api.post("/api/stripe/create-payment-intent", {
          email,
          childName: childName ?? "Unknown",
          archetypeId: report.archetypeId,
          childGender,
          submissionId,
        })) as { clientSecret: string };
        setClientSecret(result.clientSecret);
      } catch (err) {
        setFetchError(
          err instanceof Error
            ? err.message
            : "Failed to initialize payment. Please try again.",
        );
      }
    })();
  }, [report, email, childName, childGender, submissionId, clientSecret]);

  if (!report) return <Navigate to="/" replace />;

  if (fetchError) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-4 text-center">
          <div className="text-4xl">😟</div>
          <h2 className="text-xl font-bold text-harbor-primary">
            Payment setup failed
          </h2>
          <p className="text-harbor-text/70 text-sm">{fetchError}</p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <div className="animate-pulse"><AnimalIcon id={archetypeId} className="w-16 h-16 mx-auto" /></div>
          <p className="text-harbor-text/50">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-harbor-bg overflow-y-auto">
      <div className="max-w-lg w-full mx-auto px-6 py-12 space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/adhd-parenting-logo.png"
            alt="ADHD Parenting"
            className="h-14 object-contain mx-auto"
          />
          <p className="text-sm text-harbor-text/50">
            Complete your purchase to unlock {name}'s full report
          </p>
        </div>

        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#7040ca",
                borderRadius: "12px",
              },
            },
          }}
        >
          <CheckoutForm
            childName={name}
            typeName={typeName}
            archetypeId={archetypeId}
            email={email}
          />
        </Elements>
      </div>
    </div>
  );
}
