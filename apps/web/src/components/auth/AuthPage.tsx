import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/60 text-lg">
            A calm space in the chaos.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-harbor-text mb-6">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-harbor-text/70 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-3 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-harbor-bg text-harbor-text outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-harbor-text/70 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full p-3 rounded-xl border-2 border-harbor-primary/15 focus:border-harbor-accent focus:ring-2 focus:ring-harbor-accent/20 bg-harbor-bg text-harbor-text outline-none transition-all"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-harbor-error">{error}</p>
            )}

            {message && (
              <p className="text-sm text-harbor-accent">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-harbor-primary text-white font-medium hover:bg-harbor-primary-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Sign up"
                  : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-harbor-text/50 hover:text-harbor-text/80 transition-colors cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
