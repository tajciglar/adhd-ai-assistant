import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import LoadingScreen from "../shared/LoadingScreen";
import Mascot from "../shared/Mascot";

interface ProfileData {
  id: string;
  email: string;
  role: string;
  profile: {
    childName: string;
    onboardingCompleted: boolean;
    parentGender: string | null;
    parentAgeRange: string | null;
    householdStructure: string | null;
    children: {
      id: string;
      childName: string;
      childAge: number | null;
      childGender: string | null;
    }[];
  };
}

// ── Edit Profile Modal ──────────────────────────────────────────────
function EditProfileModal({
  data,
  onClose,
  onSaved,
}: {
  data: ProfileData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const child = data.profile.children?.[0];
  const [childName, setChildName] = useState(child?.childName ?? "");
  const [childAge, setChildAge] = useState(child?.childAge?.toString() ?? "");
  const [childGender, setChildGender] = useState(child?.childGender ?? "");
  const [parentGender, setParentGender] = useState(data.profile.parentGender ?? "");
  const [household, setHousehold] = useState(data.profile.householdStructure ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch("/api/user/profile", {
        childName: childName.trim(),
        childAge: childAge ? parseInt(childAge, 10) : undefined,
        childGender: childGender || undefined,
        parentGender: parentGender || undefined,
        householdStructure: household || undefined,
      });
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-harbor-primary font-display">Edit Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Child info */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Child Information</p>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Child's Name</label>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
              placeholder="Enter child's name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Age</label>
              <input
                type="number"
                min={1}
                max={18}
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
                placeholder="Age"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Gender</label>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 bg-white"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Parent info */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2">Parent Information</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Your Gender</label>
              <select
                value={parentGender}
                onChange={(e) => setParentGender(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 bg-white"
              >
                <option value="">Select...</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Household</label>
              <select
                value={household}
                onChange={(e) => setHousehold(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40 bg-white"
              >
                <option value="">Select...</option>
                <option value="Two-parent">Two-parent</option>
                <option value="Single parent">Single parent</option>
                <option value="Co-parenting">Co-parenting</option>
                <option value="Extended family">Extended family</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-harbor-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal ───────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-harbor-primary font-display">Change Password</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-harbor-success text-[40px] mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <p className="text-sm font-medium text-slate-700">Password updated!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-harbor-orange/20 focus:border-harbor-orange/40"
                  placeholder="Repeat new password"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>

        {!success && (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !newPassword || !confirm}
              className="px-5 py-2 bg-harbor-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notification Preferences Modal ──────────────────────────────────
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [reminders, setReminders] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-harbor-primary font-display">Notifications</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Push Notifications", sub: "Get notified in your browser", value: push, set: setPush },
            { label: "Email Updates", sub: "Weekly parenting tips & insights", value: email, set: setEmail },
            { label: "Daily Reminders", sub: "Morning routine check-in", value: reminders, set: setReminders },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-400">{item.sub}</p>
              </div>
              <button
                onClick={() => item.set(!item.value)}
                className={`w-11 h-6 rounded-full relative transition-colors ${item.value ? "bg-harbor-primary" : "bg-slate-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.value ? "left-5.5 translate-x-0" : "left-0.5"}`} style={{ left: item.value ? "22px" : "2px" }} />
              </button>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-harbor-primary text-white text-sm font-semibold rounded-xl hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ───────────────────────────────────────────────
export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const fetchProfile = () => {
    api
      .get("/api/user/me")
      .then((data) => {
        setProfileData(data as ProfileData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProfile(); }, []);

  const displayName = user?.email?.split("@")[0] ?? "Parent";
  const capitalizedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
  const isAdmin = profileData?.role === "admin";
  const childName = profileData?.profile?.children?.[0]?.childName
    ? profileData.profile.children[0].childName
        .trim()
        .split(/\s+/)
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";

  if (loading) return <LoadingScreen />;

  const settingsItems = [
    { icon: "person", label: "Personal Information", sub: childName ? `${childName} • ${user?.email}` : user?.email ?? "", action: "edit-profile" },
    { icon: "lock", label: "Change Password", sub: "Update your account password", action: "change-password" },
    { icon: "notifications", label: "Notifications", sub: "Push, email, and reminders", action: "notifications" },
    { icon: "security", label: "Privacy & Security", sub: "Data and account protection", action: "privacy" },
    { icon: "help", label: "Help & Support", sub: "FAQs and contact us", action: "help" },
  ];

  return (
    <div className="flex min-h-screen bg-harbor-bg">
      <DesktopSidebar active="profile" isAdmin={isAdmin} />

      <div className="flex-1 flex flex-col">
        {/* ── Mobile Header ── */}
        <div className="md:hidden flex items-center bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 justify-between sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="flex w-9 h-9 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer text-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="text-harbor-primary text-base font-bold flex-1 text-center font-display">Profile</h2>
          <div className="w-9" />
        </div>

        {/* ── Desktop Header ── */}
        <header className="hidden md:flex h-16 border-b border-slate-100 bg-white items-center px-8 shrink-0">
          <h2 className="text-lg font-bold text-harbor-primary font-display">Account Settings</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          {/* ── Avatar & Name ── */}
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-6">
            <Mascot size={100} mood="happy" />
            <div className="flex flex-col items-center gap-1">
              <p className="text-xl font-bold text-slate-900 font-display">{capitalizedName}</p>
              {childName && (
                <p className="text-slate-500 text-sm">Supporting {childName}</p>
              )}
              <p className="text-slate-400 text-xs">{user?.email}</p>
            </div>
          </div>

          {/* ── Settings List ── */}
          <div className="px-4 md:px-0 md:max-w-2xl md:mx-auto pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-2 md:px-0">Settings</p>
            <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm">
              {settingsItems.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => setActiveModal(item.action)}
                  className={`flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                    i < settingsItems.length - 1 ? "border-b border-slate-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-harbor-primary/15 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-harbor-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-slate-800 text-sm font-medium block">{item.label}</span>
                      <span className="text-xs text-slate-400">{item.sub}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Sign Out ── */}
          <div className="px-4 md:px-0 md:max-w-2xl md:mx-auto pb-8">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-2 py-3 border border-harbor-primary/20 rounded-xl text-harbor-primary text-sm font-semibold hover:bg-harbor-primary/5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Sign Out
            </button>
          </div>
          <div className="h-20 md:h-0" />
        </div>
      </div>

      <BottomNav active="profile" isAdmin={isAdmin} />

      {/* Modals */}
      {activeModal === "edit-profile" && profileData && (
        <EditProfileModal
          data={profileData}
          onClose={() => setActiveModal(null)}
          onSaved={fetchProfile}
        />
      )}
      {activeModal === "change-password" && (
        <ChangePasswordModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "notifications" && (
        <NotificationsModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
