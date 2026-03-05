import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ArchetypeReportTemplate } from "@adhd-ai-assistant/shared";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";

interface OnboardingResponse {
  childId?: string;
}

interface ReportResponse {
  childId: string;
  hasChatAccess: boolean;
  report: ArchetypeReportTemplate;
}

const API_URL = import.meta.env.VITE_API_URL || "";
const GUEST_MODE = import.meta.env.VITE_GUEST_MODE === "true";
const CHAT_ENABLED =
  import.meta.env.VITE_CHAT_ENABLED !== "false" && !GUEST_MODE;
const GUEST_ID_STORAGE_KEY = "harbor_guest_id";

function getGuestId(): string {
  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID().replace(/-/g, "");
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, generated);
  return generated;
}

function parseDownloadFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return null;
  return match[1].trim();
}

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const onboarding = (await api.get("/api/onboarding")) as OnboardingResponse;
      if (!onboarding.childId) {
        throw new Error("Missing child profile. Please complete onboarding.");
      }

      const report = (await api.get(
        `/api/report/${onboarding.childId}`,
      )) as ReportResponse;
      setReportData(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleDownloadPdf = useCallback(async () => {
    if (!reportData?.childId) return;
    setDownloading(true);
    setEmailMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      } else if (GUEST_MODE) {
        headers["x-guest-id"] = getGuestId();
      } else {
        throw new Error("Not authenticated");
      }

      const res = await fetch(`${API_URL}/api/report/${reportData.childId}/pdf`, {
        method: "GET",
        headers,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to download PDF");
      }

      const blob = await res.blob();
      const filename =
        parseDownloadFilename(res.headers.get("content-disposition")) ??
        `harbor-${reportData.report.archetypeId || "report"}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  }, [reportData?.childId]);

  const handleSendEmail = useCallback(async () => {
    if (!reportData?.childId) return;
    setSendingEmail(true);
    setEmailMessage(null);
    setError(null);

    try {
      await api.post(`/api/report/${reportData.childId}/email`);
      setEmailMessage("Report sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  }, [reportData?.childId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <p className="text-harbor-text/60">Rendering your report...</p>
      </div>
    );
  }

  if (error || !reportData?.report) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-2xl font-bold text-harbor-primary mb-3">
            Report unavailable
          </h1>
          <p className="text-harbor-text/70 mb-6">{error ?? "Unknown error"}</p>
          <button
            onClick={() => void loadReport()}
            className="rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { report, hasChatAccess } = reportData;

  return (
    <div className="min-h-screen bg-harbor-bg">
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 md:p-8 mb-5">
          <h1 className="text-3xl md:text-4xl font-bold text-harbor-primary mb-3">
            {report.title}
          </h1>
          <p className="text-harbor-text/75 italic">"{report.innerVoiceQuote}"</p>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">The Animal</h2>
            <p className="text-harbor-text/80 leading-relaxed">{report.animalDescription}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">About Your Child</h2>
            <p className="text-harbor-text/80 leading-relaxed">{report.aboutChild}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">Hidden Superpower</h2>
            <p className="text-harbor-text/80 leading-relaxed">{report.hiddenSuperpower}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">Understanding the Brain</h2>
            <div className="space-y-4">
              {report.brainSections.map((section) => (
                <div key={section.title}>
                  <h3 className="font-semibold text-harbor-text mb-1">{section.title}</h3>
                  <p className="text-harbor-text/80 leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">A Day in Life</h2>
            <div className="space-y-3">
              <p className="text-harbor-text/80"><span className="font-semibold text-harbor-text">Morning:</span> {report.dayInLife.morning}</p>
              <p className="text-harbor-text/80"><span className="font-semibold text-harbor-text">School:</span> {report.dayInLife.school}</p>
              <p className="text-harbor-text/80"><span className="font-semibold text-harbor-text">After School:</span> {report.dayInLife.afterSchool}</p>
              <p className="text-harbor-text/80"><span className="font-semibold text-harbor-text">Bedtime:</span> {report.dayInLife.bedtime}</p>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">Drains and Fuels</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-harbor-text mb-2">Drains</h3>
                <ul className="list-disc pl-5 space-y-1 text-harbor-text/80">
                  {report.drains.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-harbor-text mb-2">Fuels</h3>
                <ul className="list-disc pl-5 space-y-1 text-harbor-text/80">
                  {report.fuels.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">When Overwhelmed</h2>
            <p className="text-harbor-text/80 leading-relaxed whitespace-pre-line">{report.overwhelm}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">What They Need to Hear</h2>
            <ul className="list-disc pl-5 space-y-1 text-harbor-text/80">
              {report.affirmations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">Say This Instead</h2>
            <div className="space-y-3">
              {report.doNotSay.map((pair, index) => (
                <div
                  key={`${pair.insteadOf}-${index}`}
                  className="rounded-xl border border-harbor-text/10 p-4"
                >
                  <p className="text-sm text-harbor-text/60 mb-1">Instead of</p>
                  <p className="text-harbor-text font-medium mb-2">{pair.insteadOf}</p>
                  <p className="text-sm text-harbor-text/60 mb-1">Try</p>
                  <p className="text-harbor-text">{pair.tryThis}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <p className="text-lg text-harbor-text italic">{report.closingLine}</p>
          </section>

          {CHAT_ENABLED ? (
            hasChatAccess ? (
              <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
                <h2 className="text-xl font-semibold text-harbor-primary mb-2">
                  AI Assistant Access
                </h2>
                <p className="text-harbor-text/80 mb-4">
                  You have full AI assistant access. Continue in chat for daily support.
                </p>
                <Link
                  to="/chat"
                  className="inline-flex rounded-xl border border-harbor-text/10 bg-white text-harbor-text px-5 py-3 font-medium hover:bg-harbor-primary/5 transition"
                >
                  Open Chat
                </Link>
              </section>
            ) : (
              <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
                <h2 className="text-xl font-semibold text-harbor-primary mb-2">
                  Want the AI Assistant?
                </h2>
                <p className="text-harbor-text/80 mb-2">
                  Unlock personalized daily support, strategies, and guided responses for your child.
                </p>
                <p className="text-harbor-text/60 mb-4">
                  Upgrade to enable AI chat access.
                </p>
                <button
                  type="button"
                  className="inline-flex rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition"
                >
                  Upgrade to AI Assistant
                </button>
              </section>
            )
          ) : (
            <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
              <h2 className="text-xl font-semibold text-harbor-primary mb-2">
                AI Assistant Is Coming Soon
              </h2>
              <p className="text-harbor-text/80">
                This MVP includes onboarding and report generation only.
              </p>
            </section>
          )}

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6 mb-10">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">
              Save Your Report
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void handleDownloadPdf()}
                disabled={downloading}
                className="rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
              <button
                onClick={() => void handleSendEmail()}
                disabled={sendingEmail}
                className="rounded-xl border border-harbor-text/10 bg-white text-harbor-text px-5 py-3 font-medium hover:bg-harbor-primary/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingEmail ? "Sending..." : "Send Email"}
              </button>
            </div>
            {emailMessage ? (
              <p className="mt-3 text-sm text-green-700">{emailMessage}</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
