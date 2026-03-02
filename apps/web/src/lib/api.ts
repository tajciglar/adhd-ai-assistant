import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL || "";

async function getToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
}

async function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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
};
