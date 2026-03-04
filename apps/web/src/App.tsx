import { useEffect, useState } from "react";
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
import OnboardingPage from "./components/onboarding/OnboardingPage";
import ChatPage from "./components/chat/ChatPage";
import AdminPage from "./components/admin/AdminPage";

function AppRoutes() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [onboardingCompleted, setOnboardingCompleted] = useState<
    boolean | null
  >(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setOnboardingCompleted(null);
      setUserRole(null);
      setOnboardingLoading(false);
      return;
    }

    let active = true;
    setOnboardingLoading(true);

    api
      .get("/api/onboarding")
      .then((data) => {
        if (!active) return;
        const d = data as {
          onboardingCompleted?: boolean;
          role?: string;
        };
        setOnboardingCompleted(Boolean(d.onboardingCompleted));
        setUserRole(d.role ?? "user");
      })
      .catch(() => {
        if (!active) return;
        setOnboardingCompleted(false);
        setUserRole("user");
      })
      .finally(() => {
        if (!active) return;
        setOnboardingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, location.pathname]);

  const shouldWaitForOnboarding = Boolean(session) && onboardingLoading;

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

  const isAdmin = userRole === "admin";
  // Admins skip onboarding — it's for parents, not content managers
  const needsOnboarding =
    Boolean(session) && onboardingCompleted === false && !isAdmin;
  // Where to send authenticated users by default
  const homePath = needsOnboarding
    ? "/onboarding"
    : isAdmin && !onboardingCompleted
      ? "/admin"
      : "/chat";

  return (
    <Routes>
      <Route
        path="/auth"
        element={session ? <Navigate to={homePath} /> : <AuthPage />}
      />
      <Route
        path="/onboarding"
        element={
          session ? (
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
        path="/chat"
        element={
          session ? (
            needsOnboarding ? (
              <Navigate to="/onboarding" />
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
              <Navigate to="/chat" />
            )
          ) : (
            <Navigate to="/auth" />
          )
        }
      />
      <Route path="*" element={<Navigate to={homePath} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
