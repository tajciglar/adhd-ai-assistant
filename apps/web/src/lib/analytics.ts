const SESSION_KEY = "wildprint_session_id";
const API_URL = import.meta.env.VITE_API_URL || "";

export function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/**
 * Fire-and-forget POST to /api/guest/track.
 * Never throws — tracking failures shouldn't break the UX.
 */
export function trackFunnelEvent(
  eventType: "step_viewed" | "quiz_completed" | "checkout_started" | "purchase_completed" | "answer_submitted" | "optin_completed" | "optin_thankyou",
  stepNumber?: number,
  metadata?: Record<string, unknown>,
): void {
  try {
    const body: Record<string, unknown> = {
      sessionId: getSessionId(),
      eventType,
    };
    if (stepNumber != null) body.stepNumber = stepNumber;
    if (metadata) body.metadata = metadata;

    fetch(`${API_URL}/api/guest/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true, // ensures request completes even if page navigates
    }).catch(() => {
      // silently ignore tracking failures
    });
  } catch {
    // silently ignore
  }
}
