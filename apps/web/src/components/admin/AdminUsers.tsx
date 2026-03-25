import { useState } from "react";
import { api } from "../../lib/api";

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const data = (await api.post("/api/admin/invite-user", { email })) as {
        success: boolean;
        email: string;
      };
      setSuccess(`Invite sent to ${data.email}`);
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send invite";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-harbor-primary font-display">Invite a client</h2>
          <p className="text-sm text-harbor-text/55 mt-1">
            Send an email invite — the client clicks the link, sets a password, and gets immediate chat access.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm p-6">
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label htmlFor="invite-email" className="block text-sm font-medium text-harbor-text/70 mb-1">
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="client@example.com"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-harbor-primary text-white font-medium hover:bg-harbor-primary-light transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Sending invite…" : "Send invite email"}
            </button>
          </form>
        </div>

        <div className="bg-harbor-bg-alt/50 rounded-2xl border border-harbor-text/8 p-5 text-sm text-harbor-text/60 space-y-2">
          <p className="font-medium text-harbor-text">What happens next</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Client receives an email from Supabase with a secure link (expires in 24h).</li>
            <li>They click the link and land on Harbor's set-password page.</li>
            <li>They set a password and are logged in with full chat access.</li>
            <li>Next time they can log in with email + password, Google, or Apple.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
