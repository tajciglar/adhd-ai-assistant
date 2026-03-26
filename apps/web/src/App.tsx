import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { api } from "./lib/api";
import AuthPage from "./components/auth/AuthPage";
import SetPasswordPage from "./components/auth/SetPasswordPage";

const DashboardPage = lazy(() => import("./components/dashboard/DashboardPage"));
const ChatPage = lazy(() => import("./components/chat/ChatPage"));
const LibraryPage = lazy(() => import("./components/dashboard/LibraryPage"));
const ProfilePage = lazy(() => import("./components/dashboard/ProfilePage"));
const ChildProfilePage = lazy(() => import("./components/dashboard/ChildProfilePage"));
const AdminPage = lazy(() => import("./components/admin/AdminPage"));

function NoAccessPage() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-harbor-primary mb-3">
          Access Not Enabled
        </h1>
        <p className="text-harbor-text/60 mb-6">
          Your account doesn't have access yet. Please contact us to get started.
        </p>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-harbor-primary/20 text-harbor-primary/70 text-sm font-semibold hover:bg-harbor-primary/5 hover:text-harbor-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Dev-only preview bypass ──────────────────────────────────────────────────
// Activated via ?preview=dashboard|chat|resources|profile in dev only.
// import.meta.env.DEV is false in production — this entire path is dead code.
function useDevPreview() {
  if (!import.meta.env.DEV) return null;
  return new URLSearchParams(window.location.search).get("preview");
}
// ────────────────────────────────────────────────────────────────────────────

function AppRoutes() {
  const devPage = useDevPreview();

  const { session, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    const timeout = setTimeout(() => {
      if (!active) return;
      setUserRole("user");
      setHasChatAccess(false);
    }, 8000);

    api
      .get("/api/user/me")
      .then((data) => {
        if (!active) return;
        clearTimeout(timeout);
        const d = data as {
          role?: string;
          hasChatAccess?: boolean;
        };
        setUserRole(d.role ?? "user");
        setHasChatAccess(Boolean(d.hasChatAccess));
      })
      .catch(() => {
        if (!active) return;
        clearTimeout(timeout);
        setUserRole("user");
        setHasChatAccess(false);
      });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [session]);

  const shouldWaitForUserData =
    Boolean(session) && (userRole === null || hasChatAccess === null);

  if (loading || shouldWaitForUserData) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-harbor-primary mb-2">
            Harbor
          </h1>
          <p className="text-harbor-text/40">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === "admin";
  const canUseChat = isAdmin || hasChatAccess === true;
  const homePath = canUseChat ? "/dashboard" : "/no-access";

  const pageFallback = (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-harbor-primary mb-2">Harbor</h1>
        <p className="text-harbor-text/40">Loading...</p>
      </div>
    </div>
  );

  // Dev-only: render page directly without auth via ?preview=<name>
  if (devPage) {
    const devPages: Record<string, React.LazyExoticComponent<() => React.JSX.Element>> = {
      dashboard: DashboardPage,
      chat: ChatPage,
      resources: LibraryPage,
      profile: ProfilePage,
    };
    const DevComponent = devPages[devPage];
    if (DevComponent) {
      return <Suspense fallback={pageFallback}><DevComponent /></Suspense>;
    }
  }

  return (
    <Suspense fallback={pageFallback}>
      <Routes>
        <Route
          path="/auth"
          element={session ? <Navigate to={homePath} /> : <AuthPage />}
        />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route
          path="/dashboard"
          element={
            session ? (
              canUseChat ? (
                <DashboardPage />
              ) : (
                <Navigate to="/no-access" />
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/chat"
          element={
            session ? (
              canUseChat ? (
                <ChatPage />
              ) : (
                <Navigate to="/no-access" />
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/resources"
          element={
            session ? (
              canUseChat ? (
                <LibraryPage />
              ) : (
                <Navigate to="/no-access" />
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/profile"
          element={
            session ? <ProfilePage /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/child-profile"
          element={
            session ? <ChildProfilePage /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="/admin"
          element={
            session ? (
              isAdmin ? (
                <AdminPage />
              ) : (
                <Navigate to="/chat" />
              )
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/no-access"
          element={
            session ? (
              <NoAccessPage />
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to={session ? homePath : "/auth"} />}
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
