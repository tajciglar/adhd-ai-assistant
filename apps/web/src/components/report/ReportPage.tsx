import { useLocation, Navigate } from "react-router-dom";
import type { ArchetypeReportTemplate } from "@adhd-parenting-quiz/shared";
import { AnimalIcon } from "../../lib/animalImages";

interface RouterState {
  report?: ArchetypeReportTemplate;
  email?: string;
  pdfUrl?: string;
}

export default function ReportPage() {
  const location = useLocation();
  const state = location.state as RouterState | undefined;

  // Fall back to sessionStorage so the page survives a refresh
  const report: ArchetypeReportTemplate | null = state?.report
    ?? JSON.parse(sessionStorage.getItem("wildprint_report") ?? "null");
  const email = state?.email ?? sessionStorage.getItem("wildprint_email") ?? "";
  const childName = sessionStorage.getItem("wildprint_childName") ?? "Your child";
  const pdfUrl = state?.pdfUrl ?? sessionStorage.getItem("wildprint_pdfUrl") ?? "";

  if (!report) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-harbor-bg">
      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">

        {email ? (
          <div className="mb-5 bg-green-50 border border-green-200 rounded-2xl px-6 py-4 flex items-center gap-3">
            <span className="text-green-600 text-lg">✓</span>
            <p className="text-green-800 text-sm">
              We also sent this guide to <strong>{email}</strong>
            </p>
          </div>
        ) : null}

        <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-6 md:p-8 mb-5">
          <div className="flex items-center gap-4 mb-3">
            <AnimalIcon id={report.archetypeId} className="w-20 h-20 shrink-0" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-harbor-primary">
                {report.title}
              </h1>
              <p className="text-harbor-text/75 italic mt-1">"{report.innerVoiceQuote}"</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">The Animal</h2>
            <p className="text-harbor-text/80 leading-relaxed whitespace-pre-line">{report.animalDescription}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">About Your Child</h2>
            <p className="text-harbor-text/80 leading-relaxed whitespace-pre-line">{report.aboutChild}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-2">Hidden Superpower</h2>
            <p className="text-harbor-text/80 leading-relaxed whitespace-pre-line">{report.hiddenSuperpower}</p>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">Understanding the Brain</h2>
            <div className="space-y-4">
              {report.brainSections.map((section) => (
                <div key={section.title}>
                  <h3 className="font-semibold text-harbor-text mb-1">{section.title}</h3>
                  <p className="text-harbor-text/80 leading-relaxed whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">A Day in Life</h2>
            <div className="space-y-3">
              <p className="text-harbor-text/80 whitespace-pre-line"><span className="font-semibold text-harbor-text">Morning:</span> {report.dayInLife.morning}</p>
              <p className="text-harbor-text/80 whitespace-pre-line"><span className="font-semibold text-harbor-text">School:</span> {report.dayInLife.school}</p>
              <p className="text-harbor-text/80 whitespace-pre-line"><span className="font-semibold text-harbor-text">After School:</span> {report.dayInLife.afterSchool}</p>
              <p className="text-harbor-text/80 whitespace-pre-line"><span className="font-semibold text-harbor-text">Bedtime:</span> {report.dayInLife.bedtime}</p>
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

          <section className="bg-white rounded-2xl border border-harbor-text/10 p-6 mb-10">
            <h2 className="text-xl font-semibold text-harbor-primary mb-3">
              Save Your Report
            </h2>
            {pdfUrl ? (
              <a
                href={pdfUrl}
                download={`${childName}-adhd-guide.pdf`}
                className="inline-block rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition"
              >
                Download PDF
              </a>
            ) : (
              <p className="text-harbor-text/60 text-sm">PDF download will be available shortly.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
