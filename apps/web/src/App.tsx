import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const LandingPage = lazy(() => import("./components/LandingPage"));
const OnboardingPage = lazy(
  () => import("./components/onboarding/OnboardingPage"),
);
const ReportPage = lazy(() => import("./components/report/ReportPage"));

const pageFallback = (
  <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-harbor-primary mb-2">Harbor</h1>
      <p className="text-harbor-text/40">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={pageFallback}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
