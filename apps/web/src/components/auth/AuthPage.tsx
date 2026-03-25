import { useState } from "react";
import { supabase } from "../../lib/supabase";
import Mascot from "../shared/Mascot";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10 flex flex-col items-center">
          <Mascot size={100} className="mb-3" />
          <h1 className="text-3xl font-extrabold text-harbor-primary mb-1 font-display">
            Harbor
          </h1>
          <p className="text-slate-400 text-sm">
            A calm space in the chaos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-harbor-text mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-harbor-text/70 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

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
                minLength={6}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all"
                placeholder="Your password"
              />
              <button
                type="button"
                className="text-harbor-orange text-xs mt-1 hover:underline cursor-pointer"
                onClick={async () => {
                  if (!email.trim()) {
                    setError("Enter your email first, then click Forgot password.");
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
                  setLoading(false);
                  if (err) setError(err.message);
                  else setMessage("Password reset link sent — check your email.");
                }}
              >
                Forgot password?
              </button>
            </div>

            {error && <p className="text-sm text-harbor-error">{error}</p>}
            {message && <p className="text-sm text-harbor-accent">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-harbor-primary text-white font-medium hover:bg-harbor-primary-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Please wait..." : "Sign in"}
            </button>
          </form>

          {/* OAuth divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const { error: err } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: window.location.origin },
                });
                if (err) { setError(err.message); setLoading(false); }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-white text-harbor-text font-medium hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const { error: err } = await supabase.auth.signInWithOAuth({
                  provider: "apple",
                  options: { redirectTo: window.location.origin },
                });
                if (err) { setError(err.message); setLoading(false); }
              }}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-black text-white font-medium hover:bg-gray-900 transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.11 4.45-3.74 4.25z" />
              </svg>
              Sign in with Apple
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
