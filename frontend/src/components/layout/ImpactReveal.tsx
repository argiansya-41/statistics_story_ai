"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Mascot } from "@/components/ui/Mascot";
import type { MascotCharacter } from "@/components/ui/Mascot";
import { crackPaths, glassBox } from "@/lib/glassGeo";
import { takeImpact } from "@/lib/impact";

/**
 * Pasangan SlapTransition di dashboard. Maskot yang tertampar masih menempel di kaca (posisi, ukuran, dan retakan
 * sama persis dengan halaman login, termasuk ekspresi ><) lalu merosot pelan ke bawah dengan ekspresi yang sama,
 * meninggalkan jejak basah sambil sedikit bergoyang.
 * Layar meredup memudar dan dashboard terbuka. Tanpa penanda dari halaman login (kunjungan biasa): tidak merender apa pun.
 */
const COLOR: Record<MascotCharacter, string> = { sigi: "#5BA8FF", mu: "#FF4A2E", quin: "#EBEB00" };
const SLIDE_DELAY = 420, SLIDE_MS = 2300, TOTAL = SLIDE_DELAY + SLIDE_MS + 120;

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

export const ImpactReveal: React.FC = () => {
  const [who, setWho] = useState<MascotCharacter | null>(null);
  const [done, setDone] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const c = takeImpact();
    if (!c) { document.documentElement.removeAttribute("data-impact"); return; }
    const ch: MascotCharacter = c === "mu" || c === "quin" ? c : "sigi";
    setWho(ch);
  }, []);

  useEffect(() => {
    if (!who) return;
    // Lepas penyembunyi isi halaman setelah overlay tergambar, supaya tidak berkedip.
    const r1 = requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.removeAttribute("data-impact")));
    const id = window.setTimeout(() => setDone(true), TOTAL);
    return () => { cancelAnimationFrame(r1); window.clearTimeout(id); };
  }, [who]);

  if (!who || done) return null;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = window.innerWidth, H = window.innerHeight;
  const g = glassBox(W, H);
  const cracks = crackPaths(W, H, g.cx, g.cy - g.B * 0.03);

  if (reduced) return createPortal(<div aria-hidden="true" data-impact-root className="pointer-events-none fixed inset-0 z-[300] bg-black" style={{ animation: "gs-fade-out 400ms ease-out both" }} />, document.body);

  return createPortal(
    <div aria-hidden="true" data-impact-root className="pointer-events-none fixed inset-0 z-[300] overflow-hidden">
      <div className="absolute inset-0 bg-black" style={{ opacity: 0.94, animation: `gs-backdrop-out ${SLIDE_MS - 300}ms cubic-bezier(0.5,0,0.8,0.6) ${SLIDE_DELAY + 120}ms both` }} />

      {/* Maskot yang merosot (jejak ikut memanjang di belakangnya) */}
      <div className="absolute inset-0" style={{ animation: `gs-slide ${SLIDE_MS}ms linear ${SLIDE_DELAY}ms both` }}>
        <div
          className="absolute"
          style={{
            left: g.cx - g.B * 0.26, top: g.cy, width: g.B * 0.52, height: H * 1.1, transformOrigin: "50% 0%", transform: "translateY(-100%)",
            background: `linear-gradient(to top, ${COLOR[who]}55, transparent)`, filter: "blur(10px)", animation: `gs-trail ${SLIDE_MS}ms ease-in ${SLIDE_DELAY}ms both`,
          }}
        />
        <div className="absolute" style={{ left: g.cx - g.B / 2, top: g.cy - g.B / 2, width: g.B, height: g.B, transform: `rotate(${g.rot}deg)` }}>
          <Mascot character={who} pose="air" face="hurt" className="h-full w-full" />
        </div>
      </div>

      {/* Retakan tetap menempel di kaca lalu memudar */}
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} fill="none" style={{ animation: `gs-cracks-out 900ms ease-in ${SLIDE_DELAY + 900}ms both` }}>
        {cracks.map((d, i) => (
          <path key={i} d={d} stroke="#fff" strokeOpacity={0.85} strokeWidth={i < 11 ? 2 : 1.5} strokeLinecap="square" style={{ filter: "drop-shadow(0 0 4px rgba(255,255,255,0.7))" }} />
        ))}
      </svg>
    </div>,
    document.body
  );
};
