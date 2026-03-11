import { useCallback, useEffect, useState } from "react";
import { ASSESSMENT_CATEGORIES } from "@adhd-parenting-quiz/shared";

const API_URL = import.meta.env.VITE_API_URL || "";

// Build a map from question keys like "inattentive_0" to real question text
function buildQuestionMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const cat of ASSESSMENT_CATEGORIES) {
    for (let i = 0; i < cat.questions.length; i++) {
      // Strip pronoun placeholders for display
      const text = cat.questions[i]
        .replace(/\{childName\}/g, "the child")
        .replace(/\{pos\}/g, "their")
        .replace(/\{obj\}/g, "them")
        .replace(/\{sub\}/g, "they")
        .replace(/\{is\}/g, "are")
        .replace(/\{was\}/g, "were")
        .replace(/\{dont\}/g, "don't");
      map[`${cat.id}_${i}`] = text;
    }
  }
  return map;
}

const QUESTION_MAP: Record<string, string> = {
  caregiverType: "You are",
  childAgeRange: "How old is your child?",
  childGender: "You are raising",
  adhdJourney: "Where are you on the ADHD journey?",
  childName: "Child's name",
  ...buildQuestionMap(),
};

interface FunnelSummary {
  quizStarted: number;
  quizCompleted: number;
  checkoutStarted: number;
  purchaseCompleted: number;
  quizCompletionRate: number;
  checkoutRate: number;
  purchaseRate: number;
  overallConversion: number;
}

interface StepDropoff {
  step: number;
  views: number;
  dropoffRate: number;
}

interface DailyTrend {
  date: string;
  started: number;
  completed: number;
  purchased: number;
}

interface Submission {
  id: string;
  email: string;
  archetype_id: string;
  paid: boolean;
  created_at: string;
}

interface ArchetypeDist {
  archetypeId: string;
  count: number;
}

interface TraitPairDist {
  pair: string;
  count: number;
}

interface AnswerDist {
  questionKey: string;
  topAnswer: string;
  percentage: number;
  totalResponses: number;
}

interface Analytics {
  funnelSummary: FunnelSummary;
  stepDropoff: StepDropoff[];
  dailyTrend: DailyTrend[];
  recentSubmissions: Submission[];
  archetypeDistribution: ArchetypeDist[];
  traitPairDistribution: TraitPairDist[];
  answerDistribution: AnswerDist[];
  avgCompletionTime: number;
}

function MetricCard({
  label,
  value,
  rate,
  color,
}: {
  label: string;
  value: number;
  rate?: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
        {label}
      </p>
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
      {rate != null ? (
        <p className="text-sm text-harbor-text/50">{rate}% conversion</p>
      ) : null}
    </div>
  );
}

function DropoffBar({ step, views, dropoffRate, maxViews }: StepDropoff & { maxViews: number }) {
  const width = maxViews > 0 ? (views / maxViews) * 100 : 0;
  const isHighDropoff = dropoffRate > 15;
  const isMedDropoff = dropoffRate > 8;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-10 text-right text-harbor-text/50 tabular-nums">{step}</span>
      <div className="flex-1 h-6 bg-harbor-text/5 rounded overflow-hidden relative">
        <div
          className={`h-full rounded transition-all ${
            isHighDropoff
              ? "bg-red-400"
              : isMedDropoff
                ? "bg-amber-400"
                : "bg-harbor-accent"
          }`}
          style={{ width: `${width}%` }}
        />
        <span className="absolute inset-y-0 left-2 flex items-center text-xs text-harbor-text/70">
          {views}
        </span>
      </div>
      <span
        className={`w-14 text-right text-xs tabular-nums ${
          isHighDropoff ? "text-red-600 font-semibold" : "text-harbor-text/40"
        }`}
      >
        {dropoffRate > 0 ? `-${dropoffRate}%` : "—"}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("admin_key") ?? "");
  const [authenticated, setAuthenticated] = useState(!!sessionStorage.getItem("admin_key"));
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchAnalytics = useCallback(
    async (key: string, numDays: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/admin/analytics?days=${numDays}`, {
          headers: { "x-admin-key": key },
        });
        if (res.status === 401) {
          setError("Invalid admin key");
          setAuthenticated(false);
          sessionStorage.removeItem("admin_key");
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = (await res.json()) as Analytics;
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleLogin = useCallback(() => {
    if (!adminKey.trim()) return;
    sessionStorage.setItem("admin_key", adminKey.trim());
    setAuthenticated(true);
    void fetchAnalytics(adminKey.trim(), days);
  }, [adminKey, days, fetchAnalytics]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reset`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const result = (await res.json()) as { deletedEvents: number; deletedSubmissions: number };
      alert(`Reset complete. Deleted ${result.deletedEvents} events and ${result.deletedSubmissions} submissions.`);
      setShowResetConfirm(false);
      void fetchAnalytics(adminKey, days);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reset analytics");
    } finally {
      setResetting(false);
    }
  }, [adminKey, days, fetchAnalytics]);

  useEffect(() => {
    if (authenticated && adminKey) {
      void fetchAnalytics(adminKey, days);
    }
  }, [authenticated, adminKey, days, fetchAnalytics]);

  // Login gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center px-6">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-harbor-text/10 shadow-sm p-7 space-y-5">
          <div className="text-center">
            <h1 className="text-xl font-bold text-harbor-primary">Admin Dashboard</h1>
            <p className="text-sm text-harbor-text/50 mt-1">Enter your admin key to continue</p>
          </div>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin key"
            className="w-full rounded-xl border border-harbor-text/20 bg-harbor-bg px-4 py-3 text-harbor-text placeholder:text-harbor-text/30 focus:outline-none focus:ring-2 focus:ring-harbor-primary/30"
          />
          {error ? (
            <p className="text-sm text-red-600 text-center">{error}</p>
          ) : null}
          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-harbor-primary text-white px-5 py-3 font-medium hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-harbor-bg flex items-center justify-center">
        <p className="text-harbor-text/40">Loading analytics...</p>
      </div>
    );
  }

  const summary = analytics?.funnelSummary;
  const maxViews = Math.max(...(analytics?.stepDropoff.map((s) => s.views) ?? [1]));

  return (
    <div className="min-h-screen bg-harbor-bg px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-harbor-primary">Funnel Analytics</h1>
            <p className="text-sm text-harbor-text/50">ADHD Personality Quiz Dashboard</p>
          </div>
          <div className="flex gap-2">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  days === d
                    ? "bg-harbor-primary text-white"
                    : "bg-white text-harbor-text/60 border border-harbor-text/10 hover:border-harbor-primary/30"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        ) : null}

        {/* Funnel Summary Cards */}
        {summary ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Quiz Started"
              value={summary.quizStarted}
              color="text-harbor-primary"
            />
            <MetricCard
              label="Quiz Completed"
              value={summary.quizCompleted}
              rate={summary.quizCompletionRate}
              color="text-harbor-accent"
            />
            <MetricCard
              label="Checkout Started"
              value={summary.checkoutStarted}
              rate={summary.checkoutRate}
              color="text-amber-600"
            />
            <MetricCard
              label="Purchased"
              value={summary.purchaseCompleted}
              rate={summary.purchaseRate}
              color="text-green-600"
            />
          </div>
        ) : null}

        {/* Overall Conversion */}
        {summary ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-5 text-center">
            <p className="text-sm text-harbor-text/50">Overall Conversion (Quiz Start → Purchase)</p>
            <p className="text-4xl font-bold text-harbor-primary mt-1">{summary.overallConversion}%</p>
          </div>
        ) : null}

        {/* Step Dropoff */}
        {analytics?.stepDropoff.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-harbor-primary">Step-by-Step Dropoff</h2>
              <div className="flex items-center gap-3 text-xs text-harbor-text/40">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-harbor-accent" /> Normal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-amber-400" /> Medium
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-400" /> High (&gt;15%)
                </span>
              </div>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {analytics.stepDropoff.map((item) => (
                <DropoffBar key={item.step} {...item} maxViews={maxViews} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Daily Trend */}
        {analytics?.dailyTrend.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-harbor-primary">Daily Trend</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-harbor-text/10">
                    <th className="text-left py-2 pr-4 text-harbor-text/50 font-medium">Date</th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">Started</th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">Completed</th>
                    <th className="text-right py-2 pl-4 text-harbor-text/50 font-medium">Purchased</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.dailyTrend.map((day) => (
                    <tr key={day.date} className="border-b border-harbor-text/5">
                      <td className="py-2 pr-4 text-harbor-text/70">{day.date}</td>
                      <td className="py-2 px-4 text-right tabular-nums">{day.started}</td>
                      <td className="py-2 px-4 text-right tabular-nums text-harbor-accent">{day.completed}</td>
                      <td className="py-2 pl-4 text-right tabular-nums text-green-600 font-medium">{day.purchased}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Avg Completion Time + Archetype Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Avg Completion Time */}
          <div className="bg-white rounded-xl border border-harbor-text/10 p-5 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-harbor-text/40">
              Avg Completion Time
            </p>
            <p className="text-3xl font-bold text-harbor-primary">
              {analytics?.avgCompletionTime
                ? `${Math.floor(analytics.avgCompletionTime / 60)}m ${analytics.avgCompletionTime % 60}s`
                : "—"}
            </p>
            <p className="text-sm text-harbor-text/50">quiz start to finish</p>
          </div>

          {/* Archetype Distribution */}
          <div className="md:col-span-2 bg-white rounded-xl border border-harbor-text/10 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-harbor-primary">Archetype Distribution</h2>
            {analytics?.archetypeDistribution.length ? (
              <div className="space-y-2">
                {(() => {
                  const maxCount = Math.max(...analytics.archetypeDistribution.map((a) => a.count), 1);
                  return analytics.archetypeDistribution.map((item) => (
                    <div key={item.archetypeId} className="flex items-center gap-3 text-sm">
                      <span className="w-28 text-right text-harbor-text/60 capitalize truncate">
                        {item.archetypeId}
                      </span>
                      <div className="flex-1 h-6 bg-harbor-text/5 rounded overflow-hidden relative">
                        <div
                          className="h-full rounded bg-harbor-primary/60 transition-all"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-xs text-harbor-text/70">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-sm text-harbor-text/40">No data yet</p>
            )}
          </div>
        </div>

        {/* Top-2 Trait Pair Distribution */}
        {analytics?.traitPairDistribution?.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-harbor-primary">Top Category Pairs</h2>
            <p className="text-xs text-harbor-text/40">Most common top-2 scoring categories per submission</p>
            <div className="space-y-2">
              {(() => {
                const maxCount = Math.max(...analytics.traitPairDistribution.map((p) => p.count), 1);
                const total = analytics.traitPairDistribution.reduce((sum, p) => sum + p.count, 0);
                return analytics.traitPairDistribution.map((item) => (
                  <div key={item.pair} className="flex items-center gap-3 text-sm">
                    <span className="w-48 text-right text-harbor-text/60 capitalize truncate" title={item.pair}>
                      {item.pair.replace(/_/g, " ")}
                    </span>
                    <div className="flex-1 h-6 bg-harbor-text/5 rounded overflow-hidden relative">
                      <div
                        className="h-full rounded bg-harbor-accent/70 transition-all"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs text-harbor-text/70">
                        {item.count}
                      </span>
                    </div>
                    <span className="w-12 text-right text-xs text-harbor-text/40 tabular-nums">
                      {total > 0 ? `${((item.count / total) * 100).toFixed(0)}%` : ""}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : null}

        {/* Answer Distribution — split into onboarding vs scoring */}
        {(() => {
          if (!analytics?.answerDistribution.length) return null;
          const BASIC_KEYS = new Set(["caregiverType", "childAgeRange", "childGender", "adhdJourney", "childName"]);
          const onboarding = analytics.answerDistribution.filter((a) => BASIC_KEYS.has(a.questionKey));
          const scoring = analytics.answerDistribution.filter((a) => !BASIC_KEYS.has(a.questionKey));

          const AnswerTable = ({ items }: { items: AnswerDist[] }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-harbor-text/10">
                    <th className="text-left py-2 pr-4 text-harbor-text/50 font-medium">Question</th>
                    <th className="text-left py-2 px-4 text-harbor-text/50 font-medium">Top Answer</th>
                    <th className="text-right py-2 px-4 text-harbor-text/50 font-medium">%</th>
                    <th className="text-right py-2 pl-4 text-harbor-text/50 font-medium">Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.questionKey} className="border-b border-harbor-text/5">
                      <td className="py-2 pr-4 text-harbor-text/70 text-xs max-w-[300px]" title={item.questionKey}>
                        {QUESTION_MAP[item.questionKey] ?? item.questionKey}
                      </td>
                      <td className="py-2 px-4 text-harbor-text/80 truncate max-w-[200px]">
                        {item.topAnswer}
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-harbor-accent font-semibold">
                        {item.percentage}%
                      </td>
                      <td className="py-2 pl-4 text-right tabular-nums text-harbor-text/40">
                        {item.totalResponses}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

          return (
            <>
              {onboarding.length ? (
                <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-harbor-primary">Onboarding Answers</h2>
                  <p className="text-xs text-harbor-text/40">Demographics and basic info questions</p>
                  <AnswerTable items={onboarding} />
                </div>
              ) : null}
              {scoring.length ? (
                <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-harbor-primary">Assessment Answers</h2>
                  <p className="text-xs text-harbor-text/40">Likert scoring questions by category</p>
                  <AnswerTable items={scoring} />
                </div>
              ) : null}
            </>
          );
        })()}

        {/* Recent Submissions */}
        {analytics?.recentSubmissions.length ? (
          <div className="bg-white rounded-xl border border-harbor-text/10 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-harbor-primary">Recent Submissions</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-harbor-text/10">
                    <th className="text-left py-2 pr-4 text-harbor-text/50 font-medium">Email</th>
                    <th className="text-left py-2 px-4 text-harbor-text/50 font-medium">Archetype</th>
                    <th className="text-center py-2 px-4 text-harbor-text/50 font-medium">Paid</th>
                    <th className="text-right py-2 pl-4 text-harbor-text/50 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="border-b border-harbor-text/5">
                      <td className="py-2 pr-4 text-harbor-text/70 truncate max-w-[200px]">
                        {sub.email}
                      </td>
                      <td className="py-2 px-4 capitalize text-harbor-text/60">
                        {sub.archetype_id}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {sub.paid ? (
                          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-block bg-harbor-text/5 text-harbor-text/40 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="py-2 pl-4 text-right text-harbor-text/40 tabular-nums">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Danger Zone — Reset */}
        <div className="bg-white rounded-xl border border-red-200 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
          <p className="text-sm text-harbor-text/60">
            Permanently delete all analytics data (funnel events and quiz submissions). This action cannot be undone.
          </p>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition"
          >
            Reset All Analytics
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm ? (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
            <div className="bg-white rounded-2xl border border-harbor-text/10 shadow-lg p-7 max-w-sm w-full space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-lg font-bold text-red-600">Are you sure?</h3>
              </div>
              <p className="text-sm text-harbor-text/70 text-center">
                This will permanently delete all funnel events and quiz submissions. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-harbor-text/20 text-harbor-text/70 text-sm font-medium hover:bg-harbor-text/5 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleReset()}
                  disabled={resetting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
                >
                  {resetting ? "Deleting..." : "Yes, Delete Everything"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
