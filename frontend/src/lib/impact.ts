/**
 * Penanda lintas-reload untuk transisi login -> dashboard. Nilai: "<waktu>|<maskot yang menempel di kaca>".
 * Halaman login menyalakan, dashboard membaca lalu mematikan. Berlaku 10 detik.
 */
export const IMPACT_KEY = "ss-impact";
const FRESH_MS = 10000;

export function markImpact(character: string) {
  try { sessionStorage.setItem(IMPACT_KEY, `${Date.now()}|${character}`); } catch { /* mode privat: abaikan */ }
}

/** Mengembalikan karakter yang menempel di kaca, atau null bila tidak ada penanda yang masih segar. */
export function takeImpact(): string | null {
  try {
    const v = sessionStorage.getItem(IMPACT_KEY);
    if (!v) return null;
    sessionStorage.removeItem(IMPACT_KEY);
    const [t, c] = v.split("|");
    return Date.now() - Number(t) < FRESH_MS ? c || "sigi" : null;
  } catch { return null; }
}

/**
 * Dijalankan di <head> sebelum hidrasi: menyembunyikan isi halaman (latar hitam) sampai ImpactReveal siap,
 * supaya tidak berkedip. Ada pengaman: otomatis dilepas setelah 3,5 detik bila pembukaan tidak pernah jalan.
 */
export const IMPACT_BOOT_SCRIPT = `try{var v=sessionStorage.getItem("${IMPACT_KEY}");if(v&&Date.now()-parseInt(v,10)<${FRESH_MS}){var h=document.documentElement;h.setAttribute("data-impact","1");setTimeout(function(){h.removeAttribute("data-impact")},3500)}}catch(e){}`;
