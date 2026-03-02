import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./components/auth/AuthPage";
import OnboardingPage from "./components/onboarding/OnboardingPage";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
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

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={session ? <Navigate to="/onboarding" /> : <AuthPage />}
        />
        <Route
          path="/onboarding"
          element={
            session ? <OnboardingPage /> : <Navigate to="/auth" />
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={session ? "/onboarding" : "/auth"} />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
