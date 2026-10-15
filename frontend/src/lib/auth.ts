import type { Role } from "@/lib/authValidation";

export type AuthError = "invalid" | "exists" | "network" | "server";
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

export interface UserProfile {
  id?: string | number;
  email: string;
  name: string;
  role?: Role;
}

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const isDemoMode = BASE === "";

const TOKEN_KEY = "stat_story_access_token";
const REFRESH_KEY = "stat_story_refresh_token";
const USER_KEY = "stat_story_user";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {
    /* abaikan */
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(user: UserProfile, token: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    setTokens(token, refreshToken);
  } catch {
    /* abaikan */
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* abaikan */
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken() || getCurrentUser());
}

const demo = (error: AuthError | null, email?: string, name?: string): Promise<AuthResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      if (error) {
        resolve({ ok: false, error });
      } else {
        const mail = email || "mahasiswa@uns.ac.id";
        setSession(
          {
            email: mail,
            name: name || mail.split("@")[0],
            role: "mahasiswa",
          },
          "demo-jwt-token-access",
          "demo-jwt-token-refresh"
        );
        resolve({ ok: true });
      }
    }, 1100);
  });

async function post(path: string, body: unknown): Promise<{ ok: true; data?: any } | { ok: false; error: AuthError }> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      return { ok: true, data };
    }
    if (res.status === 401) return { ok: false, error: "invalid" };
    if (res.status === 409) return { ok: false, error: "exists" };
    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim();
  if (isDemoMode) {
    return demo(cleanEmail.toLowerCase().startsWith("salah@") ? "invalid" : null, cleanEmail);
  }
  const res = await post("/api/v1/auth/login", { email: cleanEmail, password });
  if (res.ok) {
    const token = res.data?.access_token || res.data?.token || "bearer-token";
    const refresh = res.data?.refresh_token;
    const user: UserProfile = res.data?.user || { email: cleanEmail, name: cleanEmail.split("@")[0] };
    setSession(user, token, refresh);
    return { ok: true };
  }
  return { ok: false, error: res.error };
}

export async function registerRequest(v: { name: string; email: string; role?: Role; password: string }): Promise<AuthResult> {
  const cleanEmail = v.email.trim();
  const cleanName = v.name.trim();
  if (isDemoMode) {
    return demo(cleanEmail.toLowerCase().startsWith("ada@") ? "exists" : null, cleanEmail, cleanName);
  }
  const res = await post("/api/v1/auth/register", {
    name: cleanName,
    email: cleanEmail,
    ...(v.role ? { role: v.role } : {}),
    password: v.password,
  });
  if (res.ok) {
    const token = res.data?.access_token || res.data?.token || "bearer-token";
    const refresh = res.data?.refresh_token;
    const user: UserProfile = res.data?.user || { email: cleanEmail, name: cleanName, role: v.role };
    setSession(user, token, refresh);
    return { ok: true };
  }
  return { ok: false, error: res.error };
}

export function forgotRequest(email: string): Promise<AuthResult> {
  if (isDemoMode) return demo(null);
  return post("/api/v1/auth/forgot-password", { email: email.trim() });
}

export async function logoutRequest(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!isDemoMode && refreshToken) {
    try {
      await fetch(`${BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      /* abaikan */
    }
  }
  clearSession();
}
