"use client";

import { useEffect, useState, useCallback } from "react";
import type { Role } from "@/lib/authValidation";

export interface UserProfile {
  id?: string | number;
  email: string;
  name: string;
  role?: Role;
}

const TOKEN_KEY = "stat_story_access_token";
const REFRESH_KEY = "stat_story_refresh_token";
const USER_KEY = "stat_story_user";
const SESSION_EVENT = "stat_story_session_change";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

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
    window.dispatchEvent(new Event(SESSION_EVENT));
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
    window.dispatchEvent(new Event(SESSION_EVENT));
  } catch {
    /* abaikan */
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getAccessToken() || getCurrentUser());
}

/**
 * Logout pengguna: panggil POST /auth/logout (204) jika backend aktif,
 * bersihkan sesi lokal, dan arahkan ke /masuk.
 */
export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (BASE && refreshToken) {
    try {
      await fetch(`${BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      /* abaikan kegagalan jaringan saat logout */
    }
  }
  clearSession();
  if (typeof window !== "undefined") {
    window.location.assign("/masuk");
  }
}

/**
 * Hook reaktif useSession()
 */
export function useSession() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sync = useCallback(() => {
    setUser(getCurrentUser());
    setToken(getAccessToken());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    sync();

    const handleSessionChange = () => sync();
    window.addEventListener(SESSION_EVENT, handleSessionChange);
    window.addEventListener("storage", handleSessionChange);

    return () => {
      window.removeEventListener(SESSION_EVENT, handleSessionChange);
      window.removeEventListener("storage", handleSessionChange);
    };
  }, [sync]);

  const logout = useCallback(async () => {
    await logoutUser();
  }, []);

  return {
    user,
    token,
    isAuthenticated: Boolean(user || token),
    isLoading,
    logout,
    setSession,
  };
}
