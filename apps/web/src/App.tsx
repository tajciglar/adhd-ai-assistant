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

const DashboardPage = lazy(() => import("./components/dashboard/DashboardPage"));
const ChatPage = lazy(() => import("./components/chat/ChatPage"));
const LibraryPage = lazy(() => import("./components/dashboard/LibraryPage"));
const ProfilePage = lazy(() => import("./components/dashboard/ProfilePage"));
const AdminPage = lazy(() => import("./components/admin/AdminPage"));

function AppRoutes() {
  const { session, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasChatAccess, setHasChatAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;

    let active = true;

    api
      .get("/api/user/me")
      .then((data) => {
        if (!active) return;
        const d = data as {
          role?: string;
          hasChatAccess?: boolean;
        };
        setUserRole(d.role ?? "user");
        setHasChatAccess(Boolean(d.hasChatAccess));
      })
      .catch(() => {
        if (!active) return;
        setUserRole("user");
        setHasChatAccess(false);
      });

    return () => {
      active = false;
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
  const canUseChat = true; // TODO: restore: isAdmin || hasChatAccess === true;
  const homePath = canUseChat ? "/dashboard" : "/no-access";

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
          element={session ? <Navigate to={homePath} /> : <AuthPage />}
        />
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
              <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                  <h1 className="text-2xl font-bold text-harbor-primary mb-3">
                    Access Not Enabled
                  </h1>
                  <p className="text-harbor-text/60">
                    Your account doesn't have chat access yet. Please complete
                    the parenting quiz first to unlock the AI assistant.
                  </p>
                </div>
              </div>
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
