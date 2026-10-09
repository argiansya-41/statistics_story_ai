import type { Role } from "@/lib/authValidation";

/**
 * Lapisan komunikasi dengan server autentikasi.
 *
 * - Bila NEXT_PUBLIC_API_URL diisi (mis. https://api.contoh.id), permintaan dikirim ke
 *   POST {API}/auth/login, /auth/register, /auth/forgot-password (JSON, cookie sesi `credentials: include`).
 *   Pemetaan status: 2xx = berhasil, 401 = kredensial salah, 409 = email sudah terdaftar, lainnya = galat server.
 * - Bila kosong, berjalan dalam MODE DEMO: tidak ada data yang dikirim atau disimpan, hanya simulasi.
 *   Pemicu galat di mode demo: email berawalan "salah@" (login gagal) atau "ada@" (email sudah terdaftar).
 */
export type AuthError = "invalid" | "exists" | "network" | "server";
export type AuthResult = { ok: true } | { ok: false; error: AuthError };

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
export const isDemoMode = BASE === "";

const demo = (error: AuthError | null): Promise<AuthResult> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(error ? { ok: false, error } : { ok: true }), 1100);
  });

async function post(path: string, body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: "invalid" };
    if (res.status === 409) return { ok: false, error: "exists" };
    return { ok: false, error: "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export function loginRequest(email: string, password: string): Promise<AuthResult> {
  if (isDemoMode) return demo(email.trim().toLowerCase().startsWith("salah@") ? "invalid" : null);
  return post("/auth/login", { email: email.trim(), password });
}

export function registerRequest(v: { name: string; email: string; role?: Role; password: string }): Promise<AuthResult> {
  if (isDemoMode) return demo(v.email.trim().toLowerCase().startsWith("ada@") ? "exists" : null);
  return post("/auth/register", {
    name: v.name.trim(),
    email: v.email.trim(),
    ...(v.role ? { role: v.role } : {}),
    password: v.password,
  });
}

export function forgotRequest(email: string): Promise<AuthResult> {
  if (isDemoMode) return demo(null);
  return post("/auth/forgot-password", { email: email.trim() });
}
