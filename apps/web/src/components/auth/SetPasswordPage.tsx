import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Mascot from "../shared/Mascot";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Supabase auto-processes the invite token from the URL hash and sets the session.
  // We wait for onAuthStateChange to fire before showing the form.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setReady(true);
        return;
      }
      // INITIAL_SESSION fires after Supabase has fully processed the URL token.
      // If there's still no session at that point, the link is genuinely expired/used.
      if (event === "INITIAL_SESSION") {
        setError("This link has expired or already been used. Please contact us for a new one.");
      }
      if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">Harbor</h1>
          {error ? (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          ) : (
            <p className="text-harbor-text/40">Setting up your account…</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <Mascot size={100} className="mb-3" />
          <h1 className="text-3xl font-extrabold text-harbor-primary mb-1 font-display">
            Welcome to Harbor
          </h1>
          <p className="text-slate-400 text-sm">Set a password to secure your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-harbor-text mb-6">Create your password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-harbor-text/70 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-harbor-text/70 mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all"
                placeholder="Repeat your password"
              />
            </div>

            {error && <p className="text-sm text-harbor-error">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-harbor-primary text-white font-medium hover:bg-harbor-primary-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Saving…" : "Set password & continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
