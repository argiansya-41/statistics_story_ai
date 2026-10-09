"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Language } from "@/data/content";
import { Mascot } from "@/components/ui/Mascot";
import { ACTOR_IDS, DEFAULT_LOOK, ELEMENT, createEngine } from "@/lib/mascotEngine";
import type { ActorId, BeamUi, BurstUi, Element as ElementKind, Engine, Fx, ProjectileUi, UiState } from "@/lib/mascotEngine";
import { SCRIPTS } from "@/data/mascotScripts";
import { MASCOT_EVENT } from "@/lib/mascotBus";
import type { MascotEventDetail } from "@/lib/mascotBus";
import { ACTOR_FX, BURSTS, COLUMNS, PROJECTILES, isRadial } from "./mascotSprites";
import type { Sprite } from "./mascotSprites";

/**
 * Arena maskot v2: tiga karakter berelemen (air, api, petir) hidup di dasar layar sepanjang halaman,
 * bercakap-cakap, melompat, terbang, dan bertarung dengan jurus elemennya.
 * Lapisan ini fixed dan pointer-events-none; hanya maskotnya yang bisa diklik.
 */

const FLOOR = 8; // jarak lantai dari tepi bawah layar (px)

// ---------- Preferensi pengguna (tampilkan / sembunyikan) ----------
let pref: boolean | null = null;
const prefListeners = new Set<() => void>();
const getPref = () => {
  if (pref === null) {
    try { pref = window.localStorage.getItem("mascots") !== "off"; } catch { pref = true; }
  }
  return pref;
};
const setPref = (v: boolean) => {
  pref = v;
  try { window.localStorage.setItem("mascots", v ? "on" : "off"); } catch { /* abaikan */ }
  prefListeners.forEach((l) => l());
};
const subscribePref = (cb: () => void) => {
  prefListeners.add(cb);
  return () => { prefListeners.delete(cb); };
};
const noopSubscribe = () => () => {};

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

// ---------- Sprite piksel ----------
const PixelSprite: React.FC<{ sprite: Sprite; className?: string; style?: React.CSSProperties }> = ({ sprite, className, style }) => {
  const { rows, palette, scale } = sprite;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      width={rows[0].length * scale}
      height={rows.length * scale}
      shapeRendering="crispEdges"
      className={className}
      style={style}
    >
      {rows.flatMap((row, y) =>
        row.split("").map((c, x) => (palette[c] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[c]} /> : null))
      )}
    </svg>
  );
};

// ---------- Efek di maskot ----------
const FxView: React.FC<{ kind: Fx; dir: 1 | -1 }> = ({ kind, dir }) => {
  if (kind === "stars") {
    const spots = [{ left: 18, top: 2 }, { left: 3, top: 26 }, { left: 33, top: 26 }];
    return (
      <div className="pointer-events-none absolute -top-7 left-1/2 -ml-6 h-12 w-12" style={{ animation: "mw-spin 1.1s steps(8) infinite" }}>
        {spots.map((pos, i) => (
          <span key={i} className="absolute block h-3 w-3" style={pos}>
            <PixelSprite sprite={{ ...ACTOR_FX.spark, scale: 3 }} />
          </span>
        ))}
      </div>
    );
  }
  const sprite = ACTOR_FX[kind];
  if (kind === "pow") {
    return (
      <div
        className="pointer-events-none absolute top-1 flex flex-col items-center"
        style={{ [dir === 1 ? "left" : "right"]: "88%", animation: "mw-pop 700ms steps(1, end) both" } as React.CSSProperties}
      >
        <PixelSprite sprite={sprite} />
        <span className="mt-0.5 bg-black px-1 font-mono-tech text-[9px] font-bold tracking-widest text-[#EBEB00]">POW!</span>
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute -top-6 left-1/2 -ml-3" style={{ animation: "mw-rise 1100ms steps(6) both" }}>
      <PixelSprite sprite={sprite} />
    </div>
  );
};

/** Aura elemen: gelembung naik (air), bara api naik (api), percikan listrik berkedip (petir). */
const AURA_COLORS: Record<ElementKind, string[]> = {
  water: ["#9CC8FF", "#FFFFFF", "#5BA8FF"],
  fire: ["#FF8A00", "#EBEB00", "#FF2E2E"],
  lightning: ["#EBEB00", "#FFFFFF", "#003BFF"],
};
const AURA_SPOTS = [
  { left: "6%", top: "46%", delay: 0 },
  { left: "78%", top: "36%", delay: 280 },
  { left: "40%", top: "70%", delay: 520 },
  { left: "88%", top: "70%", delay: 760 },
  { left: "18%", top: "76%", delay: 980 },
];
const AuraView: React.FC<{ element: ElementKind }> = ({ element }) => (
  <div className="pointer-events-none absolute inset-0">
    {AURA_SPOTS.map((s, i) => (
      <span
        key={i}
        className="absolute block h-1.5 w-1.5"
        style={{
          left: s.left,
          top: s.top,
          background: AURA_COLORS[element][i % 3],
          borderRadius: element === "water" ? "9999px" : 0,
          animation: `${element === "lightning" ? "mw-aura-flick 1.2s steps(1, end)" : "mw-aura-rise 1s steps(6)"} ${s.delay}ms infinite`,
        }}
      />
    ))}
  </div>
);

const BubbleView: React.FC<{ text: string; shift: number }> = ({ text, shift }) => (
  <div className="absolute bottom-full left-1/2 z-10 mb-3" style={{ transform: `translateX(calc(-50% + ${shift}px))` }}>
    <div className="relative" style={{ animation: "mw-bubble-in 200ms steps(3, end) both" }}>
      <div className="w-max max-w-[190px] border border-black bg-white px-2.5 py-1.5 font-mono-tech text-[10px] leading-snug text-black">
        {text}
      </div>
      <span className="absolute top-full -mt-px block h-1.5 w-1.5 bg-white" style={{ left: `calc(50% - ${shift}px - 3px)`, boxShadow: "1px 1px 0 0 #000" }} />
    </div>
  </div>
);

// ---------- Peluru, sinar, ledakan ----------
const ProjectileView: React.FC<{ p: ProjectileUi }> = ({ p }) => {
  const sprite = PROJECTILES[p.kind];
  const w = sprite.rows[0].length * sprite.scale;
  const h = sprite.rows.length * sprite.scale;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: p.x0,
        bottom: FLOOR + p.y0,
        marginLeft: -w / 2,
        marginBottom: -h / 2,
        ["--dx" as string]: `${p.x1 - p.x0}px`,
        ["--dy" as string]: `${-(p.y1 - p.y0)}px`,
        animation: `mw-proj-move ${p.ms}ms linear forwards`,
      }}
    >
      <div style={{ ["--arc" as string]: `${p.arc}px`, animation: p.arc ? `mw-proj-arc ${p.ms}ms linear forwards` : undefined }}>
        <PixelSprite sprite={sprite} style={{ transform: p.dir === -1 ? "scaleX(-1)" : undefined }} />
      </div>
    </div>
  );
};

const BEAM_STYLE: Record<BeamUi["kind"], { under: string; main: string; core: string; w: number }> = {
  jet: { under: "#003BFF", main: "#9CC8FF", core: "#FFFFFF", w: 9 },
  flame: { under: "#FF2E2E", main: "#FF8A00", core: "#EBEB00", w: 11 },
  bolt: { under: "#003BFF", main: "#EBEB00", core: "#FFFFFF", w: 7 },
};
const BeamsLayer: React.FC<{ beams: BeamUi[] }> = ({ beams }) => (
  <svg aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 overflow-visible" width={1} height={1}>
    {beams.map((b) => {
      const st = BEAM_STYLE[b.kind];
      const pts = b.points.map(([x, y]) => `${x},${-(FLOOR + y)}`).join(" ");
      return (
        <g key={b.key} style={{ animation: `mw-beam ${b.ms}ms linear forwards` }} strokeLinejoin="miter" strokeLinecap="square" fill="none">
          <polyline points={pts} stroke={st.under} strokeWidth={st.w + 4} />
          <polyline points={pts} stroke={st.main} strokeWidth={st.w} />
          <polyline points={pts} stroke={st.core} strokeWidth={Math.max(2, st.w / 3)} />
        </g>
      );
    })}
  </svg>
);

const BurstView: React.FC<{ b: BurstUi }> = ({ b }) => {
  if (b.kind === "geyser" || b.kind === "pillar") {
    const sprite = COLUMNS[b.kind];
    const w = sprite.rows[0].length * sprite.scale;
    return (
      <div
        className="pointer-events-none absolute"
        style={{ left: b.x, bottom: FLOOR, marginLeft: -w / 2, transformOrigin: "50% 100%", animation: `mw-column ${b.ms}ms steps(8) forwards` }}
      >
        <PixelSprite sprite={sprite} />
      </div>
    );
  }
  const sprite = BURSTS[b.kind];
  const w = sprite.rows[0].length * sprite.scale;
  const h = sprite.rows.length * sprite.scale;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: b.x,
        bottom: FLOOR + b.y,
        marginLeft: -w / 2,
        marginBottom: -h / 2,
        animation: `${isRadial(b.kind) ? "mw-pop" : "mw-puff"} ${Math.min(b.ms, 700)}ms steps(1, end) both`,
      }}
    >
      <PixelSprite sprite={sprite} />
    </div>
  );
};

// ---------- Komponen utama ----------
const INITIAL_UI: UiState = {
  actors: {
    sigi: { look: DEFAULT_LOOK.sigi, dir: 1, bubble: null, fx: null, hop: 0, hover: false },
    mu: { look: DEFAULT_LOOK.mu, dir: 1, bubble: null, fx: null, hop: 0, hover: false },
    quin: { look: DEFAULT_LOOK.quin, dir: -1, bubble: null, fx: null, hop: 0, hover: false },
  },
  projectiles: [],
  beams: [],
  bursts: [],
};

const FINALE_SECTIONS = new Set(["early-access", "mulai", "footer"]);

interface ActorEls { wrap: HTMLDivElement | null; lift: HTMLDivElement | null; shadow: HTMLDivElement | null }

export const MascotWorld: React.FC<{ lang: Language }> = ({ lang }) => {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const enabled = useSyncExternalStore(subscribePref, getPref, () => true);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 639px)");
  const available = isClient && !reduced && !small;
  const active = available && enabled;

  const [ui, setUi] = useState<UiState>(INITIAL_UI);
  const els = useRef<Record<ActorId, ActorEls>>({
    sigi: { wrap: null, lift: null, shadow: null },
    mu: { wrap: null, lift: null, shadow: null },
    quin: { wrap: null, lift: null, shadow: null },
  });
  const engineRef = useRef<Engine | null>(null);
  const langRef = useRef<Language>(lang);
  const sectionRef = useRef<string | null>(null);

  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    if (!active) return;

    const host = {
      width: () => window.innerWidth,
      height: () => window.innerHeight,
      size: () => (window.innerWidth >= 768 ? 64 : 48),
      reserveRight: () => 96,
      lang: () => langRef.current,
      section: () => sectionRef.current,
      now: () => performance.now(),
      random: () => Math.random(),
      setTimeout: (fn: () => void, ms: number) => window.setTimeout(fn, ms),
      clearTimeout: (id: number) => window.clearTimeout(id),
      raf: (fn: () => void) => window.requestAnimationFrame(fn),
      cancelRaf: (id: number) => window.cancelAnimationFrame(id),
      onCommit: (next: UiState) => setUi(next),
      onMove: (id: ActorId, x: number, y: number) => {
        const e = els.current[id];
        if (e.wrap) e.wrap.style.transform = `translate3d(${x}px,0,0)`;
        if (e.lift) e.lift.style.transform = `translate3d(0,${-y}px,0)`;
        if (e.shadow) {
          e.shadow.style.transform = `translateX(-50%) scaleX(${Math.max(0.35, 1 - y / 260)})`;
          e.shadow.style.opacity = String(Math.max(0.1, 0.45 - y / 420));
        }
      },
    };
    const engine = createEngine(host, SCRIPTS);
    engineRef.current = engine;
    engine.start();

    // Section yang sedang dibaca: dipakai untuk memilih episode yang relevan dan memicu episode penutup.
    const ratios = new Map<string, number>();
    let lastFinale = -1e9;
    const keyOf = (el: Element) => (el.id ? el.id : el.tagName.toLowerCase());
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => ratios.set(keyOf(e.target), e.intersectionRatio));
        let best: string | null = null;
        let bestRatio = 0.25;
        ratios.forEach((r, k) => { if (r >= bestRatio) { best = k; bestRatio = r; } });
        if (best !== sectionRef.current) {
          sectionRef.current = best;
          if (best && FINALE_SECTIONS.has(best) && performance.now() - lastFinale > 45000) {
            lastFinale = performance.now();
            engine.requestFinale();
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    document.querySelectorAll("section[id], footer").forEach((el) => io.observe(el));

    const onReact = (e: Event) => {
      const detail = (e as CustomEvent<MascotEventDetail>).detail;
      if (detail.section && detail.section !== sectionRef.current) return;
      engine.react(detail);
    };
    const onResize = () => engine.resize();
    window.addEventListener(MASCOT_EVENT, onReact);
    window.addEventListener("resize", onResize);

    return () => {
      engine.stop();
      engineRef.current = null;
      io.disconnect();
      window.removeEventListener(MASCOT_EVENT, onReact);
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  if (!available) return null;

  const label = lang === "id" ? `MASKOT: ${enabled ? "ON" : "OFF"}` : `MASCOTS: ${enabled ? "ON" : "OFF"}`;
  const title = lang === "id" ? (enabled ? "Sembunyikan maskot" : "Tampilkan maskot") : enabled ? "Hide mascots" : "Show mascots";

  return (
    <>
      {active && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-0">
          <div className="absolute inset-x-0 h-[3px] bg-white opacity-70 mix-blend-difference" style={{ bottom: FLOOR - 4 }} />
          {ACTOR_IDS.map((id) => {
            const a = ui.actors[id];
            const element = ELEMENT[id];
            return (
              <div
                key={id}
                ref={(el) => { els.current[id].wrap = el; }}
                className="pointer-events-none absolute left-0 h-12 w-12 md:h-16 md:w-16"
                style={{ bottom: FLOOR, willChange: "transform" }}
              >
                <div
                  ref={(el) => { els.current[id].shadow = el; }}
                  className="absolute -bottom-1 left-1/2 h-1.5 w-10 bg-black md:w-12"
                  style={{ opacity: 0.45, transform: "translateX(-50%)" }}
                />
                <div
                  ref={(el) => { els.current[id].lift = el; }}
                  onClick={() => engineRef.current?.poke(id)}
                  className="pointer-events-auto relative h-full w-full cursor-pointer"
                  style={{ willChange: "transform" }}
                >
                  {a.bubble && <BubbleView key={a.bubble.key} text={a.bubble.text} shift={a.bubble.shift} />}
                  {a.fx && <FxView key={a.fx.key} kind={a.fx.kind} dir={a.dir} />}
                  {a.look.aura && <AuraView element={element} />}
                  <div style={a.hover ? { animation: "mw-hover 1.4s steps(2, end) infinite" } : undefined}>
                    <div key={`hop-${a.hop}`} style={a.hop > 0 ? { animation: "mw-hop 450ms steps(1, end) 1" } : undefined}>
                      <Mascot
                        character={id}
                        pose={a.look.pose}
                        face={a.look.face}
                        outfit={a.look.outfit}
                        flip={a.dir === -1}
                        className="h-12 w-12 md:h-16 md:w-16"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {ui.bursts.map((b) => <BurstView key={b.key} b={b} />)}
          {ui.projectiles.map((p) => <ProjectileView key={p.key} p={p} />)}
          <BeamsLayer beams={ui.beams} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setPref(!enabled)}
        title={title}
        aria-label={title}
        aria-pressed={enabled}
        className="fixed bottom-2 right-3 z-[41] border border-white/40 bg-black px-2 py-1 font-mono-tech text-[10px] tracking-widest text-white transition-colors hover:bg-[#EBEB00] hover:text-black"
      >
        {label}
      </button>
    </>
  );
};
