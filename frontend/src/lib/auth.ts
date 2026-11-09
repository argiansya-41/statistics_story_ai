import type { Role } from "@/lib/authValidation";
import {
  setSession,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  isAuthenticated,
  logoutUser,
  useSession,
} from "@/lib/session";
import type { UserProfile } from "@/lib/session";

export type { UserProfile };
export {
  setSession,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getCurrentUser,
  isAuthenticated,
  logoutUser,
  useSession,
};

export type AuthError = "invalid" | "exists" | "network" | "server";
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const isDemoMode = BASE === "";

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
    return new Promise((resolve) => {
      setTimeout(() => {
        if (cleanEmail.toLowerCase().startsWith("ada@")) {
          resolve({ ok: false, error: "exists" });
        } else {
          // Tidak menyimpan sesi agar pengguna harus login di /masuk
          resolve({ ok: true });
        }
      }, 1100);
    });
  }
  const res = await post("/api/v1/auth/register", {
    nama: cleanName,
    name: cleanName,
    email: cleanEmail,
    ...(v.role ? { role: v.role } : {}),
    password: v.password,
  });
  if (res.ok) {
    // Registrasi berhasil. Sesi TIDAK disimpan di sini agar pengguna
    // diarahkan ke halaman login (/masuk) untuk melakukan login secara eksplisit.
    return { ok: true };
  }
  return { ok: false, error: res.error };
}

export function forgotRequest(email: string): Promise<AuthResult> {
  if (isDemoMode) return demo(null);
  return post("/api/v1/auth/forgot-password", { email: email.trim() });
}

export async function logoutRequest(): Promise<void> {
  await logoutUser();
}
