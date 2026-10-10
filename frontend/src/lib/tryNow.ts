"use client";

import { useCallback } from "react";
import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";

/** Peristiwa antara tombol "Coba Sekarang" dan arena maskot (MascotWorld). */
export const MASCOT_SUCK_EVENT = "mascot:suck";

export interface SuckDetail {
  /** Pusat tombol dalam koordinat viewport. */
  x: number;
  y: number;
  href: string;
  /** Tombol yang diklik (diberi efek denyut selama animasi). */
  el: HTMLElement;
  /** Dipanggil arena maskot bila ia mengambil alih navigasi. Bila tidak dipanggil, navigasi langsung dilakukan. */
  claim: () => void;
}

/**
 * Penanganan klik "Coba Sekarang": bila arena maskot aktif, ketiga maskot berputar dan tersedot ke
 * tombol lebih dulu, baru berpindah halaman. Bila tidak aktif (layar kecil, gerak dikurangi, maskot
 * dimatikan), langsung berpindah. Klik dengan Ctrl/Cmd/Shift atau klik tengah tetap berperilaku normal.
 */
export function useTryNow(href: string) {
  const router = useRouter();
  return useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      let claimed = false;
      const detail: SuckDetail = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        href,
        el,
        claim: () => {
          claimed = true;
        },
      };
      window.dispatchEvent(new CustomEvent<SuckDetail>(MASCOT_SUCK_EVENT, { detail }));
      if (!claimed) router.push(href);
    },
    [router, href]
  );
}
