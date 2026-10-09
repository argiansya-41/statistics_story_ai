"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { Language } from "@/data/content";

/** Bahasa halaman, dibagi antara landing page dan halaman masuk/daftar lewat localStorage. */
const KEY = "lang";
let current: Language | null = null;
const listeners = new Set<() => void>();

const read = (): Language => {
  if (current === null) {
    try {
      current = window.localStorage.getItem(KEY) === "en" ? "en" : "id";
    } catch {
      current = "id";
    }
  }
  return current;
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export function useLang(): [Language, () => void] {
  const lang = useSyncExternalStore(subscribe, read, (): Language => "id");

  const toggle = useCallback(() => {
    const next: Language = read() === "id" ? "en" : "id";
    current = next;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* abaikan */
    }
    listeners.forEach((l) => l());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return [lang, toggle];
}
