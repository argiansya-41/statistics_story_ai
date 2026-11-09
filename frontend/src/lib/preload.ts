/** Kunci sesi: preloader hanya tampil sekali per sesi tab. */
export const PRELOADER_KEY = "stat_story_preloader_seen";

/**
 * Dijalankan di <head> sebelum hidrasi: bila preloader akan tampil, isi halaman disembunyikan (latar hitam)
 * supaya landing page tidak sempat berkedip sebelum preloader muncul. Dilepas oleh Preloader; pengaman 4 detik.
 */
export const PRELOAD_BOOT_SCRIPT = `try{if(!sessionStorage.getItem("${PRELOADER_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.setAttribute("data-preload","1");setTimeout(function(){h.removeAttribute("data-preload")},4000)}}catch(e){}`;
