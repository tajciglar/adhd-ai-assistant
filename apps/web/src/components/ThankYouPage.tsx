import { useSearchParams } from "react-router-dom";

export default function ThankYouPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5 text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold text-harbor-primary leading-snug">
            You're in!
          </h1>
          <p className="text-harbor-text/70 leading-relaxed">
            Your child's full Wildprint Report is on its way to your inbox right
            now.
          </p>
          <p className="text-harbor-text/70 leading-relaxed">
            It usually arrives within a few minutes. If you don't see it, check
            your <strong>spam or promotions</strong> folder — then drag it to
            your inbox so you don't miss anything.
          </p>

          <div className="pt-2 border-t border-harbor-text/10">
            <p className="text-sm text-harbor-text/50">
              Questions? Reach out to us anytime at{" "}
              <a
                href="mailto:info@adhdparenting.com"
                className="text-harbor-accent underline"
              >
                info@adhdparenting.com
              </a>
            </p>
          </div>
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
