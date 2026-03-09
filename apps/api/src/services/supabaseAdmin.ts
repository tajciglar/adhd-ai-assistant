import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || url.includes("your-project") || key.includes("your-")) {
    return null;
  }

  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return adminClient;
}

// ─── Quiz Submissions ────────────────────────────────────────────────────────

export interface QuizSubmissionInsert {
  email: string;
  child_name: string;
  child_gender: string;
  caregiver_type?: string;
  child_age_range?: string;
  adhd_journey?: string;
  archetype_id: string;
  trait_scores: Record<string, number>;
  responses: Record<string, unknown>;
  pdf_url?: string;
}

export async function insertQuizSubmission(
  data: QuizSubmissionInsert,
): Promise<string | null> {
  const sb = getSupabaseAdmin();
  if (!sb) { console.warn("Supabase not configured — skipping quiz submission insert"); return null; }
  const { data: row, error } = await sb
    .from("quiz_submissions")
    .insert(data)
    .select("id")
    .single();

  if (error) {
    console.error("supabaseAdmin.insertQuizSubmission failed:", error.message);
    return null;
  }

  return row?.id ?? null;
}

export async function updateSubmissionPayment(
  submissionId: string,
  stripePaymentId: string,
  stripeSessionId: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) { console.warn("Supabase not configured — skipping payment update"); return; }
  const { error } = await sb
    .from("quiz_submissions")
    .update({
      paid: true,
      stripe_payment_id: stripePaymentId,
      stripe_session_id: stripeSessionId,
    })
    .eq("id", submissionId);

  if (error) {
    console.error("supabaseAdmin.updateSubmissionPayment failed:", error.message);
  }
}

// ─── Funnel Events ───────────────────────────────────────────────────────────

export async function insertFunnelEvent(
  sessionId: string,
  eventType: string,
  stepNumber?: number | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return; // silently skip if Supabase not configured
  const { error } = await sb.from("funnel_events").insert({
    session_id: sessionId,
    event_type: eventType,
    step_number: stepNumber ?? null,
    metadata: metadata ?? {},
  });

  if (error) {
    console.error("supabaseAdmin.insertFunnelEvent failed:", error.message);
  }
}

// ─── Analytics Queries ───────────────────────────────────────────────────────

export interface FunnelAnalytics {
  stepDropoff: Array<{ step: number; views: number; dropoffRate: number }>;
  funnelSummary: {
    quizStarted: number;
    quizCompleted: number;
    checkoutStarted: number;
    purchaseCompleted: number;
    quizCompletionRate: number;
    checkoutRate: number;
    purchaseRate: number;
    overallConversion: number;
  };
  recentSubmissions: Array<{
    id: string;
    email: string;
    archetype_id: string;
    paid: boolean;
    created_at: string;
  }>;
  dailyTrend: Array<{
    date: string;
    started: number;
    completed: number;
    purchased: number;
  }>;
}

const EMPTY_ANALYTICS: FunnelAnalytics = {
  stepDropoff: [],
  funnelSummary: {
    quizStarted: 0, quizCompleted: 0, checkoutStarted: 0, purchaseCompleted: 0,
    quizCompletionRate: 0, checkoutRate: 0, purchaseRate: 0, overallConversion: 0,
  },
  recentSubmissions: [],
  dailyTrend: [],
};

export async function getAnalytics(days: number = 7): Promise<FunnelAnalytics> {
  const sb = getSupabaseAdmin();
  if (!sb) return EMPTY_ANALYTICS;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString();

  // 1. Step dropoff — count distinct sessions per step
  const { data: stepData } = await sb
    .from("funnel_events")
    .select("step_number, session_id")
    .eq("event_type", "step_viewed")
    .gte("created_at", sinceStr)
    .not("step_number", "is", null);

  const stepCounts = new Map<number, Set<string>>();
  for (const row of stepData ?? []) {
    if (row.step_number == null) continue;
    if (!stepCounts.has(row.step_number)) {
      stepCounts.set(row.step_number, new Set());
    }
    stepCounts.get(row.step_number)!.add(row.session_id);
  }

  const sortedSteps = [...stepCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([step, sessions]) => ({ step, views: sessions.size }));

  const stepDropoff = sortedSteps.map((item, i) => {
    const prev = i > 0 ? sortedSteps[i - 1].views : item.views;
    const dropoffRate = prev > 0 ? Number((((prev - item.views) / prev) * 100).toFixed(1)) : 0;
    return { ...item, dropoffRate };
  });

  // 2. Funnel summary — count distinct sessions per event type
  const { data: summaryData } = await sb
    .from("funnel_events")
    .select("event_type, session_id")
    .gte("created_at", sinceStr);

  const eventSessions = new Map<string, Set<string>>();
  for (const row of summaryData ?? []) {
    if (!eventSessions.has(row.event_type)) {
      eventSessions.set(row.event_type, new Set());
    }
    eventSessions.get(row.event_type)!.add(row.session_id);
  }

  const quizStarted = eventSessions.get("step_viewed")?.size ?? 0;
  const quizCompleted = eventSessions.get("quiz_completed")?.size ?? 0;
  const checkoutStarted = eventSessions.get("checkout_started")?.size ?? 0;
  const purchaseCompleted = eventSessions.get("purchase_completed")?.size ?? 0;

  const pct = (n: number, d: number) => (d > 0 ? Number(((n / d) * 100).toFixed(1)) : 0);

  const funnelSummary = {
    quizStarted,
    quizCompleted,
    checkoutStarted,
    purchaseCompleted,
    quizCompletionRate: pct(quizCompleted, quizStarted),
    checkoutRate: pct(checkoutStarted, quizCompleted),
    purchaseRate: pct(purchaseCompleted, checkoutStarted),
    overallConversion: pct(purchaseCompleted, quizStarted),
  };

  // 3. Recent submissions
  const { data: recentData } = await sb
    .from("quiz_submissions")
    .select("id, email, archetype_id, paid, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const recentSubmissions = (recentData ?? []).map((r) => ({
    id: r.id as string,
    email: r.email as string,
    archetype_id: r.archetype_id as string,
    paid: r.paid as boolean,
    created_at: r.created_at as string,
  }));

  // 4. Daily trend
  const { data: trendData } = await sb
    .from("funnel_events")
    .select("event_type, session_id, created_at")
    .gte("created_at", sinceStr);

  const dailyMap = new Map<string, { started: Set<string>; completed: Set<string>; purchased: Set<string> }>();

  for (const row of trendData ?? []) {
    const date = (row.created_at as string).slice(0, 10);
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { started: new Set(), completed: new Set(), purchased: new Set() });
    }
    const day = dailyMap.get(date)!;
    if (row.event_type === "step_viewed") day.started.add(row.session_id);
    if (row.event_type === "quiz_completed") day.completed.add(row.session_id);
    if (row.event_type === "purchase_completed") day.purchased.add(row.session_id);
  }

  const dailyTrend = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => ({
      date,
      started: sets.started.size,
      completed: sets.completed.size,
      purchased: sets.purchased.size,
    }));

  return { stepDropoff, funnelSummary, recentSubmissions, dailyTrend };
}
