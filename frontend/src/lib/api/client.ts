import { getAccessToken, getRefreshToken, setTokens, clearSession } from "@/lib/auth";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export function isBackendConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "");
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  field?: string;
  status: number;
}

export class ApiError extends Error {
  code: string;
  field?: string;
  status: number;

  constructor(status: number, message: string, code: string = "API_ERROR", field?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

/**
 * Helper untuk melakukan refresh token JWT otomatis saat 401
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccess = data.access_token || data.token;
      const newRefresh = data.refresh_token || refreshToken;
      if (newAccess) {
        setTokens(newAccess, newRefresh);
        return newAccess;
      }
    }
  } catch {
    /* abaikan */
  }

  clearSession();
  return null;
}

/**
 * Universal fetch wrapper dengan autentikasi & penanganan error seragam
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getAccessToken();

  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Set default JSON Content-Type jika bukan FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(0, "Gagal terhubung ke server backend. Periksa koneksi jaringan Anda.", "NETWORK_ERROR");
  }

  // Tangani 401 Unauthorized -> Coba refresh token
  if (response.status === 401 && !path.includes("/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onRefreshed(newToken);

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        return apiFetch<T>(path, { ...options, headers });
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          if (newToken) {
            headers.set("Authorization", `Bearer ${newToken}`);
            resolve(apiFetch<T>(path, { ...options, headers }));
          } else {
            reject(new ApiError(401, "Sesi Anda telah kedaluwarsa. Silakan masuk kembali.", "UNAUTHORIZED"));
          }
        });
      });
    }
  }

  // Tangani status No Content (204)
  if (response.status === 204) {
    return null as T;
  }

  // Parse respons
  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorObj = data?.error || data || {};
    const message =
      errorObj.message ||
      (typeof data?.detail === "string" ? data.detail : null) ||
      `Permintaan gagal dengan status ${response.status}`;
    const code = errorObj.code || (response.status === 404 ? "NOT_FOUND" : response.status === 422 ? "VALIDATION_ERROR" : "API_ERROR");
    const field = errorObj.field;

    throw new ApiError(response.status, message, code, field);
  }

  return data as T;
}
