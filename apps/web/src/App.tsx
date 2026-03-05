import { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { api } from "./lib/api";
import AuthPage from "./components/auth/AuthPage";

// Lazy-load heavy route components for faster initial page load
const OnboardingPage = lazy(() => import("./components/onboarding/OnboardingPage"));
const ReportPage = lazy(() => import("./components/report/ReportPage"));
const ChatPage = lazy(() => import("./components/chat/ChatPage"));
const AdminPage = lazy(() => import("./components/admin/AdminPage"));

function AppRoutes() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const guestModeEnabled = import.meta.env.VITE_GUEST_MODE === "true";
  const chatEnabled =
    import.meta.env.VITE_CHAT_ENABLED !== "false" && !guestModeEnabled;
  const canAccessUserApp = Boolean(session) || (guestModeEnabled && !session);
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!canAccessUserApp) {
      return;
    }

    let active = true;

    api
      .get("/api/onboarding")
      .then((data) => {
        if (!active) return;
        const d = data as {
          onboardingCompleted?: boolean;
          role?: string;
          hasChatAccess?: boolean;
        };
        setOnboardingCompleted(Boolean(d.onboardingCompleted));
        setUserRole(d.role ?? "user");
        setHasChatAccess(Boolean(d.hasChatAccess));
      })
      .catch(() => {
        if (!active) return;
        setOnboardingCompleted(false);
        setUserRole(null);
        setHasChatAccess(false);
      })
      .finally(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, [canAccessUserApp, location.pathname]);

  const shouldWaitForOnboarding =
    canAccessUserApp &&
    (onboardingCompleted === null || userRole === null || hasChatAccess === null);

  if (loading || shouldWaitForOnboarding) {
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

  const effectiveOnboardingCompleted = canAccessUserApp ? onboardingCompleted : null;
  const effectiveUserRole = canAccessUserApp ? userRole : null;
  const effectiveHasChatAccess = canAccessUserApp ? hasChatAccess : null;
  const isAdmin = effectiveUserRole === "admin";
  const canUseChat = chatEnabled && (isAdmin || effectiveHasChatAccess === true);
  // Admins skip onboarding — it's for parents, not content managers
  const needsOnboarding =
    canAccessUserApp && effectiveOnboardingCompleted === false && !isAdmin;
  // Where to send authenticated users by default
  const homePath = canAccessUserApp
    ? needsOnboarding
      ? "/onboarding"
      : isAdmin && !onboardingCompleted
        ? "/admin"
        : canUseChat
          ? "/chat"
          : "/report"
    : "/auth";

  const pageFallback = (
    <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-harbor-primary mb-2">Harbor</h1>
        <p className="text-harbor-text/40">Loading...</p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={pageFallback}>
    <Routes>
      <Route
        path="/auth"
        element={
          session ? <Navigate to={homePath} /> : <AuthPage />
        }
      />
      <Route
        path="/onboarding"
        element={
          canAccessUserApp ? (
            needsOnboarding ? (
              <OnboardingPage />
            ) : (
              <Navigate to={homePath} />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/report"
        element={
          canAccessUserApp ? (
            needsOnboarding ? (
              <Navigate to="/onboarding" />
            ) : (
              <ReportPage />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/chat"
        element={
          canAccessUserApp ? (
            !chatEnabled ? (
              <Navigate to="/report" />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" />
            ) : !canUseChat ? (
              <Navigate to="/report" />
            ) : (
              <ChatPage />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="/admin"
        element={
          session ? (
            isAdmin ? (
              <AdminPage />
            ) : (
              <Navigate to={chatEnabled ? "/chat" : "/report"} />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={canAccessUserApp ? homePath : "/auth"} />}
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
