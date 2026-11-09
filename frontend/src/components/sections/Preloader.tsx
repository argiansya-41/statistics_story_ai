"use client";

import React, { useEffect, useRef, useState } from "react";
import { Mascot } from "../ui/Mascot";
import type { MascotCharacter } from "../ui/Mascot";
import { PRELOADER_KEY } from "@/lib/preload";
import { playSlashCover, playSlashReveal } from "@/lib/slashFx";

/**
 * Preloader minimalis: hanya satu maskot dan satu garis neon progres di atas latar gelap bersemu warna.
 * Maskot bergantian (Sigi, Mu, Quin); latar, aura, dan warna garis ikut berganti halus.
 * Setelah 100%: tebasan miring (lib/slashFx) dengan impact frame berat (hit-stop, bintang ledakan, tebasan tiga warna)
 * menutup layar, lalu hitam terbelah diagonal membuka landing page. Sekali per sesi tab; dilewati bila "kurangi gerakan".
 */
interface Theme { id: MascotCharacter; bar: string; base: string; glow: string }
const THEMES: Theme[] = [
  { id: "sigi", bar: "#3F7BFF", base: "#060818", glow: "rgba(46,92,255,0.34)" },
  { id: "mu", bar: "#FF3B1F", base: "#140606", glow: "rgba(255,70,40,0.30)" },
  { id: "quin", bar: "#FFD400", base: "#141003", glow: "rgba(255,206,0,0.24)" },
];

const MS_EACH = 750;
const LOAD_MS = MS_EACH * THEMES.length;
const START_DELAY = 250;
const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;
const light = (c: string) => `color-mix(in srgb, ${c} 55%, white)`;

type Stage = "load" | "cover" | "reveal";

export const Preloader: React.FC = () => {
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<Stage>("load");
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const [backing, setBacking] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef({ cover: false, reveal: false });

  // Mulai: pilih tampil atau lewati, jalankan progres.
  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let seen = false;
    try { seen = !!sessionStorage.getItem(PRELOADER_KEY); } catch { /* abaikan */ }
    if (reduced || seen) {
      html.removeAttribute("data-preload");
      return;
    }
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    let raf = 0;
    let t1 = 0;
    const t0 = window.setTimeout(() => { setShow(true); html.removeAttribute("data-preload"); }, 0);
    const start = performance.now() + START_DELAY;
    const tick = (now: number) => {
      const x = Math.min(1, Math.max(0, (now - start) / LOAD_MS));
      setP(easeInOutSine(x));
      if (x < 1) raf = requestAnimationFrame(tick);
      else { setDone(true); t1 = window.setTimeout(() => setStage("cover"), 220); }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      cancelAnimationFrame(raf);
      html.style.overflow = prevOverflow;
    };
  }, []);

  // Tebasan menutup layar, lalu terbelah membuka landing page.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    if (stage === "cover" && !started.current.cover) {
      started.current.cover = true;
      playSlashCover(c, { heavy: true }).then(() => setStage("reveal"));
    }
    if (stage === "reveal" && !started.current.reveal) {
      started.current.reveal = true;
      playSlashReveal(c, () => setBacking(false)).then(() => {
        document.documentElement.style.overflow = "";
        try { sessionStorage.setItem(PRELOADER_KEY, "true"); } catch { /* abaikan */ }
        window.dispatchEvent(new CustomEvent("stat_story_preloader_done"));
        setShow(false);
      });
    }
  }, [stage]);

  if (!show) return null;

  const idx = Math.min(THEMES.length - 1, Math.floor((p * LOAD_MS) / MS_EACH));
  const theme = THEMES[idx];
  const w = `${(p * 100).toFixed(2)}%`;
  const tail = `${Math.min(100, p * 100 + 9).toFixed(2)}%`;

  return (
    <div aria-hidden="true" data-preload-root className="fixed inset-0 z-[100] select-none overflow-hidden">
      {backing && <div className="absolute inset-0 bg-black" />}

      {stage !== "reveal" && (
        <>
          {/* Latar bersemu warna, tiga lapis yang saling memudar */}
          {THEMES.map((t, i) => (
            <div
              key={t.id}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 70% 60% at 50% 46%, ${t.glow}, transparent 72%), linear-gradient(180deg, ${t.base}, #000 130%)`,
                opacity: i === idx ? 1 : 0,
                transition: "opacity 600ms ease-in-out",
              }}
            />
          ))}

          {/* Maskot */}
          <div className="absolute left-1/2 top-[44%] h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 md:h-[168px] md:w-[168px]">
            {THEMES.map((t, i) => {
              const on = i === idx;
              return (
                <div
                  key={t.id}
                  className="absolute inset-0"
                  style={{
                    opacity: on ? 1 : 0,
                    transform: on ? "scale(1)" : "scale(0.82)",
                    transition: "opacity 420ms ease-out, transform 520ms cubic-bezier(0.16,1,0.3,1)",
                    filter: `drop-shadow(0 0 18px ${t.bar}aa)`,
                  }}
                >
                  <div className="h-full w-full" style={{ animation: "pl-bob 2400ms ease-in-out infinite" }}>
                    <Mascot character={t.id} pose={done ? "cheer" : "idle"} face={done ? "happy" : "smile"} className="h-full w-full" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Garis neon progres */}
          <div className="absolute left-1/2 top-[66%] h-4 w-[min(64vw,340px)] -translate-x-1/2">
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
            <div className="absolute left-0 top-1/2 h-px bg-white/70" style={{ width: tail, transform: "translateY(-50%)" }} />
            <div
              className="absolute left-0 top-1/2 h-[10px] -translate-y-1/2 blur-[7px]"
              style={{ width: w, background: `linear-gradient(90deg, transparent, ${theme.bar} 16%, ${theme.bar})`, transition: "background 500ms ease-in-out" }}
            />
            <div
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2"
              style={{ width: w, background: `linear-gradient(90deg, transparent, ${light(theme.bar)} 14%)`, boxShadow: `0 0 10px 1px ${theme.bar}`, transition: "box-shadow 500ms ease-in-out" }}
            />
          </div>
        </>
      )}

      {(stage === "cover" || stage === "reveal") && <canvas ref={canvasRef} className="absolute inset-0" />}
    </div>
  );
};
