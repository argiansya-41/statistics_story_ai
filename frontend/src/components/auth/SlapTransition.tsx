"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mascot } from "@/components/ui/Mascot";
import type { MascotCharacter } from "@/components/ui/Mascot";
import { crackPaths, glassBox } from "@/lib/glassGeo";

/**
 * Transisi sebelum masuk dashboard: tamparan. Korban tidak berpindah tempat. Korban di tengah ditampar dari dua sisi
 * oleh kedua tetangganya; korban di pinggir ditampar oleh tetangga sebelahnya saja.
 *
 *   0ms     (AuthStage) penampar menyeringai dan mengayun mundur (antisipasi)
 *   450ms   penampar menyambar maju sampai tangan mengenai pipi korban
 *   560ms   PLAK!: hit-stop, IMPACT FRAME (putih, hitam, kuning dengan bintang hentakan dan garis radial), guncangan
 *   650ms   korban terpental berputar menuju kamera dengan bayangan jejak, membesar memenuhi layar
 *   1250ms  menghantam kaca: gepeng sesaat, guncangan, retakan, riak, kilau kaca
 *   1620ms  onDone (navigasi). Dashboard (ImpactReveal) melanjutkan: ekspresi tetap ><, merosot pelan, dashboard terbuka.
 *
 * Maskot digambar sebagai SVG, jadi tetap tajam walau diperbesar puluhan kali.
 */
const T_LUNGE = 450, T_HIT = 560, STOP = 90, T_FLY = 600;
const T_GLASS = T_HIT + STOP + T_FLY, T_DONE = T_GLASS + 370;

export type SlapPhase = "windup" | "lunge" | "hit";

interface Props {
  victim: 0 | 1 | 2;
  character: MascotCharacter;
  onPhase: (p: SlapPhase) => void;
  onDone: () => void;
}

interface Start { cx: number; cy: number; s: number }

/** Bintang hentakan runcing (poligon SVG) di sekitar titik kontak. */
function starPoints(cx: number, cy: number, R: number, spikes: number, rot: number): string {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? R * (0.78 + ((i * 7) % 5) * 0.075) : R * 0.3;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

/**
 * Impact frame ala anime di titik kontak: tiga frame cepat (putih + garis hitam, hitam + garis putih, kuning + garis hitam)
 * dengan garis radial dan bintang hentakan, total 260ms. Keyframes gs-if-1..3 (potong keras, tanpa transisi).
 */
const ImpactFrame: React.FC<{ cx: number; cy: number; W: number; H: number }> = ({ cx, cy, W, H }) => {
  const R = Math.min(W, H) * 0.34;
  const layers = [
    { bg: "#ffffff", fg: "#000000", anim: "gs-if-1", rot: 0.15, spikes: 16 },
    { bg: "#000000", fg: "#ffffff", anim: "gs-if-2", rot: 0.55, spikes: 14 },
    { bg: "#EBEB00", fg: "#000000", anim: "gs-if-3", rot: 0.9, spikes: 18 },
  ];
  return (
    <>
      {layers.map((l) => (
        <div
          key={l.anim}
          className="absolute inset-0"
          style={{
            opacity: 0,
            animation: `${l.anim} 260ms linear both`,
            background: `repeating-conic-gradient(from 0deg at ${cx}px ${cy}px, ${l.fg} 0deg 1.3deg, transparent 1.3deg 8deg), repeating-conic-gradient(from 3deg at ${cx}px ${cy}px, ${l.fg} 0deg 0.5deg, transparent 0.5deg 5deg), ${l.bg}`,
          }}
        >
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`}>
            <polygon points={starPoints(cx, cy, R, l.spikes, l.rot)} fill={l.fg} />
            <polygon points={starPoints(cx, cy, R * 0.45, 10, l.rot + 0.3)} fill={l.bg} />
          </svg>
        </div>
      ))}
    </>
  );
};


export const SlapTransition: React.FC<Props> = ({ victim, character, onPhase, onDone }) => {
  const cloneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [start, setStart] = useState<Start | null>(null);
  const [glass, setGlass] = useState(false);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [geo] = useState(() => {
    const W = window.innerWidth, H = window.innerHeight;
    const box = glassBox(W, H);
    return { W, H, ...box, cracks: crackPaths(W, H, box.cx, box.cy - box.B * 0.03) };
  });
  const cb = useRef({ onPhase, onDone });
  useEffect(() => { cb.current = { onPhase, onDone }; }, [onPhase, onDone]);

  useEffect(() => {
    if (reduced) {
      const t = window.setTimeout(() => cb.current.onDone(), 350);
      return () => window.clearTimeout(t);
    }
    const ids = [
      window.setTimeout(() => cb.current.onPhase("lunge"), T_LUNGE),
      window.setTimeout(() => {
        // Posisi korban saat tamparan mendarat, diukur langsung dari DOM.
        const el = document.querySelector<HTMLElement>(`[data-auth-mascot="${victim}"]`);
        const r = el?.getBoundingClientRect();
        setStart(r ? { cx: r.left + r.width / 2, cy: r.top + r.height / 2, s: r.width } : { cx: geo.W * 0.3, cy: geo.H * 0.84, s: 96 });
        cb.current.onPhase("hit");
      }, T_HIT),
      window.setTimeout(() => setGlass(true), T_GLASS),
      window.setTimeout(() => cb.current.onDone(), T_DONE),
    ];
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [reduced, victim, geo.W, geo.H]);

  // Terpental berputar ke arah kamera. Bayangan jejak = salinan dengan jeda dan transparansi bertingkat.
  useEffect(() => {
    if (!start) return;
    const k0 = start.s / geo.B;
    const dx = start.cx - geo.cx, dy = start.cy - geo.cy;
    const mid = k0 + (1 - k0) * 0.2;
    const frames: Keyframe[] = [
      { transform: `translate(${dx}px, ${dy}px) scale(${k0}) rotate(0deg)`, offset: 0 },
      { transform: `translate(${dx * 0.9}px, ${dy * 0.9 - 70}px) scale(${k0 * 1.5}) rotate(-45deg)`, offset: 0.14 },
      { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 20}px) scale(${mid}) rotate(-210deg)`, offset: 0.62 },
      { transform: `translate(0px, 0px) scale(1) rotate(${geo.rot - 360}deg)`, offset: 1 },
    ];
    cloneRefs.current.forEach((el, i) => {
      if (!el) return;
      el.animate(frames, { duration: T_FLY, delay: STOP + i * 38, easing: "cubic-bezier(0.5, 0, 0.92, 0.5)", fill: "both" });
    });
  }, [start, geo]);

  if (reduced) return createPortal(<div aria-hidden="true" className="fixed inset-0 z-[300] bg-black" style={{ animation: "gs-fade-in 300ms ease-out both" }} />, document.body);

  const hit = !!start;
  const ghosts = hit && !glass ? [3, 2, 1] : [];
  const cloneStyle = (): React.CSSProperties => ({
    left: geo.cx - geo.B / 2, top: geo.cy - geo.B / 2, width: geo.B, height: geo.B, transformOrigin: "50% 50%",
    transform: start ? `translate(${start.cx - geo.cx}px, ${start.cy - geo.cy}px) scale(${start.s / geo.B})` : undefined,
  });
  const contactY = start ? start.cy - start.s * 0.08 : 0;

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[300]" style={glass ? { animation: "gs-glass-shake 360ms steps(9, end) 1" } : hit ? { animation: "gs-hit-shake 300ms steps(10, end) 1" } : undefined}>
      {/* Redup saat maskot mendekat */}
      <div className="absolute inset-0 bg-black" style={{ opacity: hit ? 0.94 : 0, transition: hit ? `opacity ${T_FLY}ms ease-in ${STOP}ms` : "none" }} />

      {/* Bayangan jejak (belakang) lalu maskot utama */}
      {ghosts.map((n, gi) => (
        <div key={n} ref={(el) => { cloneRefs.current[gi] = el; }} className="absolute" style={{ ...cloneStyle(), opacity: 0.12 + (2 - gi) * 0.1, filter: "saturate(1.4)" }}>
          <Mascot character={character} pose="air" face="hurt" className="h-full w-full" />
        </div>
      ))}
      {hit && (
        <div ref={(el) => { cloneRefs.current[3] = el; }} className="absolute" style={cloneStyle()}>
          <div className="h-full w-full" style={{ animation: glass ? "gs-squash 460ms cubic-bezier(0.2,0.9,0.3,1) both" : "gs-hit-squash 150ms ease-out both" }}>
            <Mascot character={character} pose="air" face="hurt" className="h-full w-full" />
          </div>
        </div>
      )}

      {/* Retakan, riak, dan kilau kaca */}
      {glass && (
        <>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${geo.W} ${geo.H}`} fill="none">
            {geo.cracks.map((d, i) => (
              <path key={i} d={d} pathLength={1} stroke="#fff" strokeOpacity={0.85} strokeWidth={i < 11 ? 2 : 1.5} strokeLinecap="square" style={{ strokeDasharray: 1, animation: `gs-crack 280ms cubic-bezier(0.2,0.8,0.2,1) ${i * 12}ms both`, filter: "drop-shadow(0 0 4px rgba(255,255,255,0.7))" }} />
            ))}
          </svg>
          <div className="absolute rounded-full border-2 border-white/80" style={{ left: geo.cx, top: geo.cy - geo.B * 0.03, width: geo.B * 0.5, height: geo.B * 0.5, animation: "gs-ripple 700ms cubic-bezier(0.1,0.7,0.3,1) both" }} />
        </>
      )}

      {/* Momen tamparan: IMPACT FRAME (putih -> hitam -> kuning), gelombang kejut, teks */}
      {hit && start && (
        <>
          <ImpactFrame cx={start.cx} cy={contactY} W={geo.W} H={geo.H} />
          <div className="absolute rounded-full border-[3px] border-white" style={{ left: start.cx, top: contactY, width: start.s * 1.6, height: start.s * 1.6, animation: "gs-ripple 460ms cubic-bezier(0.1,0.7,0.3,1) 120ms both" }} />
          <div
            className="absolute border-[3px] border-black bg-[#EBEB00] px-3 py-1 font-mono-tech text-lg font-black tracking-wider text-black md:text-2xl"
            style={{ left: start.cx, top: contactY - start.s * 0.62, transform: "translate(-50%, -50%) rotate(-8deg)", boxShadow: "4px 4px 0 #000", animation: "gs-pop 520ms cubic-bezier(0.2,1.6,0.4,1) 200ms both" }}
          >
            PLAK!
          </div>
        </>
      )}
    </div>,
    document.body
  );
};
