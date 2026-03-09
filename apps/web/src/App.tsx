import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const OnboardingPage = lazy(
  () => import("./components/onboarding/OnboardingPage"),
);
const SalesPage = lazy(() => import("./components/SalesPage"));
const ReportPage = lazy(() => import("./components/report/ReportPage"));
const ThankYouPage = lazy(() => import("./components/ThankYouPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard"));

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
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/results" element={<SalesPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
