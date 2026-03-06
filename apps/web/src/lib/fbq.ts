declare global {
  interface Window {
    fbq?: (action: string, event: string, data?: Record<string, unknown>) => void;
  }
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  for (let c of document.cookie.split(";")) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

function setCookie(name: string, value: string, days = 90) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`;
}

/** Get or create the Facebook browser ID (_fbp cookie) */
export function getFbp(): string {
  let fbp = getCookie("_fbp") ?? localStorage.getItem("_fbp");
  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.random().toString().substring(2, 11)}`;
  }
  setCookie("_fbp", fbp, 90);
  localStorage.setItem("_fbp", fbp);
  return fbp;
}

/** Get the Facebook click ID (_fbc) from URL or storage */
export function getFbc(): string | undefined {
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    setCookie("_fbc", fbc, 90);
    localStorage.setItem("_fbc", fbc);
    return fbc;
  }
  return getCookie("_fbc") ?? localStorage.getItem("_fbc") ?? undefined;
}

/** Unique ID for server/client deduplication */
export function generateEventId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
}

/** Fire a client-side Meta Pixel event */
export function trackPixelEvent(
  eventName: string,
  data: Record<string, unknown> = {},
  eventId?: string,
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, { ...data, ...(eventId ? { event_id: eventId } : {}) });
  }
}
