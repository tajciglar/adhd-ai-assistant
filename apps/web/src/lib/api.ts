import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "";
const GUEST_MODE = import.meta.env.VITE_GUEST_MODE === "true";
const GUEST_ID_STORAGE_KEY = "harbor_guest_id";

// Cache the token to avoid calling getSession() on every request.
// Supabase sessions are long-lived; we cache for 30s and refresh on auth changes.
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// Listen for auth state changes to invalidate cache
supabase.auth.onAuthStateChange(() => {
  cachedToken = null;
  tokenExpiresAt = 0;
});

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  cachedToken = session.access_token;
  // Cache for 30 seconds (token itself is valid much longer)
  tokenExpiresAt = now + 30_000;
  return session.access_token;
}

function getGuestId(): string {
  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID().replace(/-/g, "");
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, generated);
  return generated;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const headers: Record<string, string> = {};

  if (GUEST_MODE) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      const token = await getToken();
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers["x-guest-id"] = getGuestId();
    }
  } else {
    const token = await getToken();
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(
      (error as { error?: string }).error || `API error: ${res.status}`,
    );
  }

  return res.json();
}

export const api = {
  get: (path: string) => request("GET", path),
  patch: (path: string, body: unknown) => request("PATCH", path, body),
  post: (path: string, body?: unknown) => request("POST", path, body),
  put: (path: string, body: unknown) => request("PUT", path, body),
  delete: (path: string) => request("DELETE", path),
};
