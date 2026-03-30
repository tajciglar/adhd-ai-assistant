import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  hasChatAccess: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = (await api.get("/api/admin/users")) as { users: User[] };
      setUsers(data.users);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setInviteLink(null);
    setInvitedEmail(null);

    try {
      const data = (await api.post("/api/admin/invite-user", { email })) as {
        success: boolean;
        email: string;
        inviteLink: string;
      };
      setInviteLink(data.inviteLink);
      setInvitedEmail(data.email);
      setEmail("");
      loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleAccess = async (user: User) => {
    setTogglingId(user.id);
    try {
      await api.patch(`/api/admin/users/${user.id}/access`, {
        hasChatAccess: !user.hasChatAccess,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, hasChatAccess: !u.hasChatAccess } : u,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const clientUsers = users.filter((u) => u.role !== "admin");
  const adminUsers = users.filter((u) => u.role === "admin");

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Invite form */}
        <div>
          <h2 className="text-xl font-bold text-harbor-primary font-display">Invite a client</h2>
          <p className="text-sm text-harbor-text/55 mt-1">
            Enter their email — they'll receive a secure link to set a password and get immediate chat access.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm p-6 space-y-4">
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="client@example.com"
              className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-harbor-orange/40 focus:ring-2 focus:ring-harbor-orange/20 bg-white text-harbor-text outline-none transition-all text-sm"
            />
            <button
              type="submit"
              disabled={inviting}
              className="px-5 py-3 rounded-xl bg-harbor-primary text-white font-medium text-sm hover:bg-harbor-primary-light transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {inviting ? "Inviting…" : "Send invite"}
            </button>
          </form>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {inviteLink && (
            <div className="space-y-2">
              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Invite sent to {invitedEmail} — copy the link below to share manually too:
              </p>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
                <span className="flex-1 text-xs text-harbor-text/60 truncate font-mono">
                  {inviteLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1 text-xs font-medium text-harbor-primary hover:text-harbor-primary-light transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-harbor-text/40">Link expires in 24 hours.</p>
            </div>
          )}
        </div>

        {/* User list */}
        <div>
          <h3 className="text-base font-semibold text-harbor-text mb-3">
            Clients
            <span className="ml-2 text-sm font-normal text-harbor-text/40">
              {clientUsers.length} total
            </span>
          </h3>

          {loadingUsers ? (
            <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm p-6 text-center text-sm text-harbor-text/40">
              Loading…
            </div>
          ) : clientUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm p-6 text-center text-sm text-harbor-text/40">
              No clients yet — invite someone above.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm divide-y divide-harbor-text/6">
              {clientUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-harbor-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-harbor-primary text-sm font-semibold">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-text truncate">{user.email}</p>
                    <p className="text-xs text-harbor-text/40">
                      Joined {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleAccess(user)}
                    disabled={togglingId === user.id}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-50 ${
                      user.hasChatAccess
                        ? "bg-emerald-50 text-emerald-600 hover:bg-red-50 hover:text-red-500"
                        : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                    }`}
                    title={user.hasChatAccess ? "Click to revoke access" : "Click to grant access"}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {user.hasChatAccess ? "check_circle" : "block"}
                    </span>
                    {togglingId === user.id ? "…" : user.hasChatAccess ? "Access" : "No access"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin list */}
        {adminUsers.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-harbor-text mb-3">
              Admins
              <span className="ml-2 text-sm font-normal text-harbor-text/40">
                {adminUsers.length} total
              </span>
            </h3>
            <div className="bg-white rounded-2xl border border-harbor-text/8 shadow-sm divide-y divide-harbor-text/6">
              {adminUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-harbor-orange/10 flex items-center justify-center shrink-0">
                    <span className="text-harbor-orange text-sm font-semibold">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-harbor-text truncate">{user.email}</p>
                    <p className="text-xs text-harbor-text/40">Admin</p>
                  </div>
                  <span className="text-xs text-harbor-orange bg-harbor-orange/10 px-2 py-1 rounded-lg font-medium">
                    Admin
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
