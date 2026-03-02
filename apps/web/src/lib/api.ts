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
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
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
