"use client";

import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/data/content";
import { Mascot } from "@/components/ui/Mascot";
import type { MascotFace } from "@/components/ui/Mascot";
import { ACTOR_IDS, DEFAULT_LOOK, ELEMENT, createEngine } from "@/lib/mascotEngine";
import type { ActorId, BeamUi, BurstUi, Element as ElementKind, Engine, Fx, GhostUi, ProjectileUi, UiState, AskUi, BubbleKind } from "@/lib/mascotEngine";
import { PROFILES } from "@/data/mascotProfiles";
import { SCRIPTS } from "@/data/mascotScripts";
import { MASCOT_EVENT } from "@/lib/mascotBus";
import { MASCOT_SUCK_EVENT } from "@/lib/tryNow";
import type { SuckDetail } from "@/lib/tryNow";
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
const spriteRects = (rows: string[], palette: Record<string, string>) => {
  const out: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      if (palette[c]) out.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={palette[c]} />);
      x += w;
    }
  });
  return out;
};

/** Sprite piksel. Mendukung cahaya (glow) dan frame kedua (alt) yang bergantian agar jurus tampak hidup. */
const PixelSprite: React.FC<{ sprite: Sprite; className?: string; style?: React.CSSProperties }> = ({ sprite, className, style }) => {
  const { rows, palette, scale, glow, alt } = sprite;
  const w = rows[0].length * scale;
  const h = rows.length * scale;
  const svg = (r: string[], extra?: React.CSSProperties) => (
    <svg aria-hidden="true" viewBox={`0 0 ${r[0].length} ${r.length}`} width={w} height={h} shapeRendering="crispEdges" className={className} style={extra}>
      {spriteRects(r, palette)}
    </svg>
  );
  const filter = glow ? `drop-shadow(0 0 3px ${glow}) drop-shadow(0 0 9px ${glow})` : undefined;
  return (
    <span style={{ position: "relative", display: "inline-block", width: w, height: h, filter, ...style }}>
      {svg(rows, alt ? { animation: "mw-alt-a 260ms steps(1) infinite" } : undefined)}
      {alt && <span style={{ position: "absolute", inset: 0, animation: "mw-alt-b 260ms steps(1) infinite" }}>{svg(alt)}</span>}
    </span>
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

/** Balon bicara: efek ketik, label nama berwarna elemen, dan gaya "teriak" untuk nama jurus. */
const BubbleView: React.FC<{ text: string; shift: number; kind: BubbleKind; who: ActorId }> = ({ text, shift, kind, who }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), kind === "shout" ? 18 : 24);
    return () => window.clearInterval(id);
  }, [text, kind]);
  const pf = PROFILES[who];
  const shown = text.slice(0, n);
  return (
    <div className="absolute bottom-full left-1/2 z-10 mb-3" style={{ transform: `translateX(calc(-50% + ${shift}px))` }}>
      <div className="relative" style={{ animation: `${kind === "shout" ? "mw-shout-in 260ms steps(4, end)" : "mw-bubble-in 200ms steps(3, end)"} both` }}>
        {kind === "shout" ? (
          <div className="w-max max-w-[220px] border-2 border-black px-3 py-1.5 font-mono-tech text-[11px] font-bold uppercase leading-snug tracking-wide" style={{ background: pf.color, color: pf.ink, boxShadow: "3px 3px 0 0 #000" }}>
            {shown}
          </div>
        ) : (
          <div className="w-max max-w-[200px] border border-black bg-white px-2.5 py-1.5 font-mono-tech text-[10px] leading-snug text-black" style={{ boxShadow: `0 -3px 0 0 ${pf.color} inset` }}>
            <span className="mr-1 inline-block px-1 text-[8px] font-bold tracking-widest" style={{ background: pf.color, color: pf.ink }}>{pf.symbol}</span>
            {shown}
          </div>
        )}
        <span className="absolute top-full -mt-px block h-1.5 w-1.5 bg-white" style={{ left: `calc(50% - ${shift}px - 3px)`, boxShadow: "1px 1px 0 0 #000", background: kind === "shout" ? pf.color : "#fff" }} />
      </div>
    </div>
  );
};

/** Kuis: pertanyaan dan tombol jawaban yang bisa diklik pengunjung. */
const AskView: React.FC<{ ask: AskUi; shift: number; onAnswer: (i: number) => void }> = ({ ask, shift, onAnswer }) => {
  const pf = PROFILES[ask.who];
  return (
    <div className="absolute bottom-full left-1/2 z-20 mb-3" style={{ transform: `translateX(calc(-50% + ${shift}px))`, animation: "mw-bubble-in 200ms steps(3, end) both" }}>
      <div className="w-max max-w-[240px] border-2 border-black bg-white p-2 font-mono-tech text-[10px] leading-snug text-black" style={{ boxShadow: `3px 3px 0 0 ${pf.color}` }}>
        <p className="mb-2">{ask.q}</p>
        <div className="flex flex-wrap gap-1.5">
          {ask.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAnswer(i); }}
              className="pointer-events-auto border border-black px-2 py-1 text-[10px] font-bold transition-colors hover:text-white"
              style={{ background: pf.color, color: pf.ink }}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Kartu nama saat kursor di atas maskot. */
const NamePlate: React.FC<{ who: ActorId; lang: Language }> = ({ who }) => {
  const pf = PROFILES[who];
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2" style={{ animation: "mw-bubble-in 160ms steps(3, end) both" }}>
      <div className="w-max border border-black px-1.5 py-0.5 font-mono-tech text-[9px] font-bold tracking-widest" style={{ background: pf.color, color: pf.ink }}>
        {pf.name.toUpperCase()}
      </div>
    </div>
  );
};

// ---------- Peluru, sinar, ledakan ----------
/** Arah sprite peluru: dibalik bila ke kiri; meteor diputar mengikuti lintasan. */
const projTransform = (p: ProjectileUi): string | undefined => {
  if (p.rot) {
    const th = (Math.atan2(-(p.y1 - p.y0), p.x1 - p.x0) * 180) / Math.PI;
    return p.x1 >= p.x0 ? `rotate(${th}deg)` : `rotate(${th - 180}deg) scaleX(-1)`;
  }
  return p.dir === -1 ? "scaleX(-1)" : undefined;
};

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
        <PixelSprite sprite={sprite} style={{ transform: projTransform(p) }} />
      </div>
    </div>
  );
};

const BEAM_STYLE: Record<BeamUi["kind"], { under: string; main: string; core: string; glow: string; w: number }> = {
  jet: { under: "#1f5cff", main: "#8fd0ff", core: "#FFFFFF", glow: "#6fb4ff", w: 10 },
  flame: { under: "#e0261c", main: "#ff8a00", core: "#fff6c8", glow: "#ff8a00", w: 12 },
  bolt: { under: "#2a4bff", main: "#ffe600", core: "#FFFFFF", glow: "#ffe600", w: 8 },
};
const BeamsLayer: React.FC<{ beams: BeamUi[] }> = ({ beams }) => (
  <svg aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 overflow-visible" width={1} height={1}>
    <defs>
      <filter id="mw-beam-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
    </defs>
    {beams.map((b) => {
      const st = BEAM_STYLE[b.kind];
      const pts = b.points.map(([x, y]) => `${x},${-(FLOOR + y)}`).join(" ");
      return (
        <g key={b.key} style={{ animation: `mw-beam ${b.ms}ms linear forwards` }} strokeLinejoin="miter" strokeLinecap="square" fill="none">
          <polyline points={pts} stroke={st.glow} strokeWidth={st.w + 16} opacity={0.55} filter="url(#mw-beam-glow)" />
          <polyline points={pts} stroke={st.under} strokeWidth={st.w + 4} />
          <polyline points={pts} stroke={st.main} strokeWidth={st.w} />
          <polyline points={pts} stroke={st.core} strokeWidth={Math.max(2, st.w / 3)} />
          <polyline points={pts} stroke="#FFFFFF" strokeWidth={4} strokeDasharray="3 15" style={{ animation: "mw-beam-flow 380ms linear infinite" }} />
        </g>
      );
    })}
  </svg>
);

const CONFETTI_COLORS = ["#FF2E2E", "#EBEB00", "#003BFF", "#FFFFFF", "#5BA8FF", "#FF8A00"];
const ConfettiBurst: React.FC<{ b: BurstUi }> = ({ b }) => {
  const bits = React.useMemo(
    () => Array.from({ length: 32 }, (_, i) => ({ dx: ((i * 37) % 200) - 100, h: 130 + ((i * 53) % 130), c: CONFETTI_COLORS[i % CONFETTI_COLORS.length], d: (i * 29) % 300 })),
    []
  );
  return (
    <div className="pointer-events-none absolute" style={{ left: b.x, bottom: FLOOR + 40 }}>
      {bits.map((c, i) => (
        <span
          key={i}
          className="absolute block h-1.5 w-1.5"
          style={{ background: c.c, ["--dx" as string]: `${c.dx}px`, ["--h" as string]: `${c.h}px`, animation: `mw-confetti ${b.ms}ms ${c.d}ms cubic-bezier(0.2,0.7,0.4,1) both` }}
        />
      ))}
    </div>
  );
};

const BurstView: React.FC<{ b: BurstUi }> = ({ b }) => {
  if (b.kind === "confetti") return <ConfettiBurst b={b} />;
  if (b.kind === "rain") {
    const sprite = BURSTS.rain;
    const w = sprite.rows[0].length * sprite.scale;
    return (
      <div className="pointer-events-none absolute" style={{ left: b.x, bottom: FLOOR, marginLeft: -w / 2, animation: `mw-rain ${b.ms}ms linear both` }}>
        <PixelSprite sprite={sprite} />
      </div>
    );
  }
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
        animation: `${b.kind === "ring" || b.kind === "shield" ? "mw-ring" : isRadial(b.kind) ? "mw-pop" : "mw-puff"} ${b.kind === "shield" ? b.ms : Math.min(b.ms, 700)}ms ${b.kind === "ring" || b.kind === "shield" ? "ease-out" : "steps(1, end)"} both`,
      }}
    >
      <PixelSprite sprite={sprite} />
    </div>
  );
};

/** Bayangan sisa saat dash (kilat melesat). */
const GhostView: React.FC<{ g: GhostUi }> = ({ g }) => (
  <div className="pointer-events-none absolute h-12 w-12 md:h-[72px] md:w-[72px]" style={{ left: g.x, bottom: FLOOR + g.y, opacity: 0.55, animation: `mw-ghost ${g.ms}ms linear both`, filter: "drop-shadow(0 0 6px #ffe600)" }}>
    <Mascot character={g.who} pose="run" face="angry" flip={g.dir === -1} className="h-full w-full" />
  </div>
);

// ---------- Komponen utama ----------
const INITIAL_UI: UiState = {
  actors: {
    sigi: { look: DEFAULT_LOOK.sigi, dir: 1, bubble: null, fx: null, hop: 0, spin: 0, hover: false },
    mu: { look: DEFAULT_LOOK.mu, dir: 1, bubble: null, fx: null, hop: 0, spin: 0, hover: false },
    quin: { look: DEFAULT_LOOK.quin, dir: -1, bubble: null, fx: null, hop: 0, spin: 0, hover: false },
  },
  projectiles: [],
  beams: [],
  bursts: [],
  ghosts: [],
  ask: null,
  energy: 0,
  flash: null,
  shake: 0,
  screenCrack: null,
};

const FINALE_SECTIONS = new Set(["early-access", "mulai", "footer"]);

interface ActorEls {
  wrap: HTMLDivElement | null;
  lift: HTMLDivElement | null;
  shadow: HTMLDivElement | null;
  spin: HTMLDivElement | null;
}

// ---------- Animasi "tersedot" saat tombol Coba Sekarang ditekan ----------
const SUCK_MS = 1600;
const SUCK_FACES: Record<ActorId, MascotFace[]> = {
  sigi: ["wow", "hurt", "ko", "ko"],
  mu: ["hurt", "ko", "wow", "wow"],
  quin: ["wow", "ko", "hurt", "ko"],
};
const SUCK_LINES: { actor: ActorId; id: string; en: string }[] = [
  { actor: "sigi", id: "Eh? Eh? EH?!", en: "Huh? Huh? HUH?!" },
  { actor: "mu", id: "Tersedot ke tombol!", en: "Sucked into the button!" },
  { actor: "quin", id: "Wuaaaaa~", en: "Whooooa~" },
];
interface SuckLook { face: MascotFace; bubble: string | null }
type SuckUi = Record<ActorId, SuckLook>;

/** Lubang hitam kecil di tombol: inti hitam, cincin kotak berputar. */
const SuckPortal: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]">
    <div className="absolute" style={{ left: x, top: y, animation: `mw-portal ${SUCK_MS + 200}ms steps(10) both` }}>
      <div className="absolute -left-4 -top-4 h-8 w-8 bg-black outline outline-2 outline-[#EBEB00]" />
      <div className="absolute left-0 top-0" style={{ animation: "mw-spin 0.9s steps(8) infinite" }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <span
            key={k}
            className="absolute -left-1.5 -top-1.5 block h-3 w-3"
            style={{
              background: ["#FF2E2E", "#EBEB00", "#003BFF", "#FFFFFF"][k % 4],
              transform: `rotate(${k * 45}deg) translateY(-28px)`,
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

export const MascotWorld: React.FC<{ lang: Language }> = ({ lang }) => {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const enabled = useSyncExternalStore(subscribePref, getPref, () => true);
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const small = useMedia("(max-width: 639px)");
  const available = isClient && !reduced && !small;
  const active = available && enabled;

  const router = useRouter();
  const routerRef = useRef(router);
  const [ui, setUi] = useState<UiState>(INITIAL_UI);
  const [suckAt, setSuckAt] = useState<{ x: number; y: number } | null>(null);
  const [suckUi, setSuckUi] = useState<SuckUi | null>(null);
  const [hoverId, setHoverId] = useState<ActorId | null>(null);
  const hintShown = useRef(0);
  const els = useRef<Record<ActorId, ActorEls>>({
    sigi: { wrap: null, lift: null, shadow: null, spin: null },
    mu: { wrap: null, lift: null, shadow: null, spin: null },
    quin: { wrap: null, lift: null, shadow: null, spin: null },
  });
  const posRef = useRef<Record<ActorId, { x: number; y: number }>>({
    sigi: { x: 0, y: 0 },
    mu: { x: 0, y: 0 },
    quin: { x: 0, y: 0 },
  });
  const engineRef = useRef<Engine | null>(null);
  const langRef = useRef<Language>(lang);
  const sectionRef = useRef<string | null>(null);

  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ id: ActorId; sx: number; sy: number; moved: boolean } | null>(null);

  const onActorDown = (e: React.PointerEvent<HTMLDivElement>, id: ActorId) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, moved: false };
  };
  const onActorMove = (e: React.PointerEvent<HTMLDivElement>, id: ActorId) => {
    const d = dragRef.current;
    if (!d || d.id !== id) return;
    const eng = engineRef.current;
    if (!eng) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
      d.moved = true;
      setDragging(true);
      eng.grab(id);
    }
    const size = window.innerWidth >= 768 ? 72 : 48;
    eng.drag(id, e.clientX - size / 2, window.innerHeight - FLOOR - e.clientY - size / 2);
  };
  const onActorUp = (e: React.PointerEvent<HTMLDivElement>, id: ActorId) => {
    const d = dragRef.current;
    if (!d || d.id !== id) return;
    dragRef.current = null;
    const el = e.currentTarget as HTMLElement;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    setDragging(false);
    if (d.moved) engineRef.current?.release(id);
    else if (e.type === "pointerup") {
      engineRef.current?.poke(id);
      if (hintShown.current < 2) hintShown.current += 1;
    }
  };

  useEffect(() => {
    const handleGlobalRelease = () => {
      const d = dragRef.current;
      if (d) {
        dragRef.current = null;
        setDragging(false);
        if (d.moved) {
          engineRef.current?.release(d.id);
        }
      }
    };
    window.addEventListener("pointerup", handleGlobalRelease);
    window.addEventListener("pointercancel", handleGlobalRelease);
    window.addEventListener("blur", handleGlobalRelease);
    return () => {
      window.removeEventListener("pointerup", handleGlobalRelease);
      window.removeEventListener("pointercancel", handleGlobalRelease);
      window.removeEventListener("blur", handleGlobalRelease);
    };
  }, []);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { routerRef.current = router; }, [router]);

  useEffect(() => {
    if (!active) return;

    const host = {
      width: () => window.innerWidth,
      height: () => window.innerHeight,
      size: () => (window.innerWidth >= 768 ? 72 : 48),
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
        posRef.current[id] = { x, y };
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

    // ----- Tersedot ke tombol Coba Sekarang, lalu pindah halaman -----
    let sucking = false;
    let suckRaf = 0;
    let suckTimer: ReturnType<typeof setTimeout> | undefined;
    let suckButton: HTMLElement | null = null;

    const restoreAfterSuck = () => {
      sucking = false;
      setSuckAt(null);
      setSuckUi(null);
      suckButton?.classList.remove("mw-suck-target");
      ACTOR_IDS.forEach((id) => {
        const e = els.current[id];
        if (e.spin) { e.spin.style.transform = ""; e.spin.style.opacity = ""; }
        if (e.shadow) e.shadow.style.opacity = "";
      });
      engine.start();
    };

    const onSuck = (e: Event) => {
      const d = (e as CustomEvent<SuckDetail>).detail;
      if (sucking) return;
      sucking = true;
      d.claim();
      engine.stop();
      routerRef.current.prefetch(d.href);

      const size = window.innerWidth >= 768 ? 72 : 48;
      const H = window.innerHeight;
      suckButton = d.el;
      d.el.classList.add("mw-suck-target");
      setSuckAt({ x: d.x, y: d.y });

      const paths = ACTOR_IDS.map((id, i) => {
        const r = els.current[id].lift?.getBoundingClientRect();
        const cx = r ? r.left + r.width / 2 : d.x;
        const cy = r ? r.top + r.height / 2 : d.y;
        return { id, i, r0: Math.hypot(cx - d.x, cy - d.y), th0: Math.atan2(cy - d.y, cx - d.x), dir: i % 2 === 0 ? 1 : -1 };
      });
      ACTOR_IDS.forEach((id) => { const sh = els.current[id].shadow; if (sh) sh.style.opacity = "0"; });

      const lines = SUCK_LINES;
      let lastPhase = -1;
      const t0 = performance.now();

      const frame = (now: number) => {
        const p = Math.min(1, (now - t0) / SUCK_MS);

        for (const s of paths) {
          const e = els.current[s.id];
          const pull = Math.pow(p, 2.1);
          const r = s.r0 * (1 - pull) * (1 + 0.07 * Math.sin(p * Math.PI * 6 + s.i));
          const th = s.th0 + s.dir * (2.4 + s.i * 0.35) * 2 * Math.PI * Math.pow(p, 1.5);
          const hop = Math.sin(Math.min(1, p / 0.18) * Math.PI) * 38 * (1 - p);
          const cx = d.x + r * Math.cos(th);
          const cy = d.y + r * Math.sin(th) - hop;
          const scale = p < 0.55 ? 1 : Math.max(0.08, 1 - Math.pow((p - 0.55) / 0.45, 1.4) * 0.92);
          const rot = s.dir * 900 * Math.pow(p, 1.7);
          if (e.wrap) e.wrap.style.transform = `translate3d(${cx - size / 2}px,0,0)`;
          if (e.lift) e.lift.style.transform = `translate3d(0,${cy - (H - FLOOR - size / 2)}px,0)`;
          if (e.spin) {
            e.spin.style.transform = `rotate(${rot}deg) scale(${scale})`;
            e.spin.style.opacity = p > 0.94 ? String(Math.max(0, (1 - p) / 0.06)) : "1";
          }
        }

        const phase = p < 0.18 ? 0 : p < 0.45 ? 1 : p < 0.75 ? 2 : 3;
        if (phase !== lastPhase) {
          lastPhase = phase;
          const speaker = phase < 3 ? lines[phase] : null;
          const next = {} as SuckUi;
          for (const id of ACTOR_IDS) {
            next[id] = {
              face: SUCK_FACES[id][phase],
              bubble: speaker && speaker.actor === id ? (langRef.current === "id" ? speaker.id : speaker.en) : null,
            };
          }
          setSuckUi(next);
        }

        if (p < 1) {
          suckRaf = requestAnimationFrame(frame);
          return;
        }
        d.el.classList.remove("mw-suck-target");
        routerRef.current.push(d.href);
        // Bila halaman tujuan tidak kunjung terbuka, pulihkan arena agar tidak macet.
        suckTimer = setTimeout(restoreAfterSuck, 4000);
      };
      suckRaf = requestAnimationFrame(frame);
    };

    // ----- Tidur saat lama tak ada aktivitas, bangun saat pengunjung kembali -----
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let asleep = false;
    const armIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { if (!sucking) { asleep = true; engine.sleep(); } }, 40000);
    };
    const onActivity = () => {
      if (asleep) { asleep = false; engine.wake(); }
      armIdle();
    };
    armIdle();

    // ----- Scroll terlalu kencang -> pusing -----
    let lastY = window.scrollY, lastT = performance.now(), fastSince = 0, lastDizzy = -1e9;
    const onScroll = () => {
      const now = performance.now();
      const v = (Math.abs(window.scrollY - lastY) / Math.max(1, now - lastT)) * 1000;
      lastY = window.scrollY; lastT = now;
      if (v > 3200) {
        if (!fastSince) fastSince = now;
        if (now - fastSince > 350 && now - lastDizzy > 30000) { lastDizzy = now; fastSince = 0; engine.trigger("dizzy"); }
      } else if (v < 1500) fastSince = 0;
    };

    // ----- Kembali ke tab -----
    let hiddenAt = 0;
    const onVis = () => {
      if (document.hidden) hiddenAt = performance.now();
      else if (hiddenAt && performance.now() - hiddenAt > 20000) { hiddenAt = 0; engine.trigger("back"); }
    };

    // ----- Kode Konami -----
    const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let kpos = 0;
    const onKey = (e: KeyboardEvent) => {
      onActivity();
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      kpos = k === KONAMI[kpos] ? kpos + 1 : k === KONAMI[0] ? 1 : 0;
      if (kpos === KONAMI.length) { kpos = 0; engine.trigger("konami"); }
    };

    window.addEventListener(MASCOT_EVENT, onReact);
    window.addEventListener(MASCOT_SUCK_EVENT, onSuck);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("wheel", onActivity, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("wheel", onActivity);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(suckRaf);
      if (suckTimer) clearTimeout(suckTimer);
      suckButton?.classList.remove("mw-suck-target");
      window.removeEventListener(MASCOT_SUCK_EVENT, onSuck);
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
        <>
        {ui.flash && <div key={ui.flash.key} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[39]" style={{ background: ui.flash.color, animation: "mw-flash 380ms ease-out both" }} />}
        <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 bottom-0 h-0 ${suckAt ? "z-[60]" : "z-40"}`}>
          <div key={`arena-shake-${ui.shake}`} style={ui.shake ? { animation: "mw-shake 360ms steps(8, end) 1" } : undefined} className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
            <div className="absolute inset-x-0 h-[3px] bg-white opacity-70 mix-blend-difference" style={{ bottom: FLOOR - 4 }} />
          </div>
          {ACTOR_IDS.map((id) => {
            const base = ui.actors[id];
            const sl = suckUi ? suckUi[id] : null;
            const a = sl
              ? {
                  ...base,
                  look: { ...base.look, pose: "air" as const, face: sl.face, aura: false },
                  bubble: sl.bubble ? { text: sl.bubble, shift: 0, key: 1000 + sl.bubble.length, kind: "say" as const } : null,
                  fx: null,
                  hover: false,
                }
              : base;
            const element = ELEMENT[id];
            const p = posRef.current[id];
            return (
              <div
                key={id}
                ref={(el) => {
                  els.current[id].wrap = el;
                  if (el) el.style.transform = `translate3d(${posRef.current[id].x}px,0,0)`;
                }}
                className="pointer-events-none absolute left-0 h-12 w-12 md:h-[72px] md:w-[72px]"
                style={{ bottom: FLOOR, transform: `translate3d(${p.x}px,0,0)`, willChange: "transform" }}
              >
                <div
                  ref={(el) => {
                    els.current[id].shadow = el;
                    if (el) {
                      const y = posRef.current[id].y;
                      el.style.transform = `translateX(-50%) scaleX(${Math.max(0.35, 1 - y / 260)})`;
                      el.style.opacity = String(Math.max(0.1, 0.45 - y / 420));
                    }
                  }}
                  className="absolute -bottom-1 left-1/2 h-1.5 w-10 bg-black md:w-12"
                  style={{ opacity: Math.max(0.1, 0.45 - p.y / 420), transform: `translateX(-50%) scaleX(${Math.max(0.35, 1 - p.y / 260)})` }}
                />
                <div
                  ref={(el) => {
                    els.current[id].lift = el;
                    if (el) el.style.transform = `translate3d(0,${-posRef.current[id].y}px,0)`;
                  }}
                  onPointerDown={(e) => onActorDown(e, id)}
                  onPointerMove={(e) => onActorMove(e, id)}
                  onPointerUp={(e) => onActorUp(e, id)}
                  onPointerCancel={(e) => onActorUp(e, id)}
                  onPointerEnter={(e) => { setHoverId(id); engineRef.current?.hover(id, e.clientX); }}
                  onPointerLeave={() => setHoverId((h) => (h === id ? null : h))}
                  className="pointer-events-auto relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
                  style={{ transform: `translate3d(0,${-p.y}px,0)`, willChange: "transform" }}
                >
                  {ui.ask && ui.ask.who === id ? (
                    <AskView ask={ui.ask} shift={0} onAnswer={(i) => engineRef.current?.answer(i)} />
                  ) : (
                    a.bubble && <BubbleView key={a.bubble.key} text={a.bubble.text} shift={a.bubble.shift} kind={a.bubble.kind} who={id} />
                  )}
                  {hoverId === id && !a.bubble && !ui.ask && !dragging && <NamePlate who={id} lang={lang} />}
                  {a.fx && <FxView key={a.fx.key} kind={a.fx.kind} dir={a.dir} />}
                  {a.look.aura && <AuraView element={element} />}
                  <div
                    ref={(el) => { els.current[id].spin = el; }}
                    style={a.hover ? { animation: "mw-hover 1.4s steps(2, end) infinite" } : undefined}
                  >
                    <div key={`hop-${a.hop}`} style={a.hop > 0 ? { animation: "mw-hop 450ms steps(1, end) 1" } : undefined}>
                      <div key={`spin-${a.spin}`} style={a.spin > 0 ? { animation: "mw-flip 520ms steps(8, end) 1" } : undefined}>
                        <div style={a.look.aura ? { filter: `drop-shadow(0 0 4px ${PROFILES[id].color}) drop-shadow(0 0 10px ${PROFILES[id].color})`, animation: "mw-aura-pulse 700ms steps(2, end) infinite" } : undefined}>
                          <Mascot
                            character={id}
                            pose={a.look.pose}
                            face={a.look.face}
                            outfit={a.look.outfit}
                            flip={a.dir === -1}
                            className="h-12 w-12 md:h-[72px] md:w-[72px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {ui.ghosts.map((g) => <GhostView key={g.key} g={g} />)}
          {ui.bursts.map((b) => <BurstView key={b.key} b={b} />)}
          {ui.projectiles.map((p) => <ProjectileView key={p.key} p={p} />)}
          <BeamsLayer beams={ui.beams} />
        </div>
        </>
      )}
      {suckAt && <SuckPortal x={suckAt.x} y={suckAt.y} />}
      {active && (
        <div className="fixed bottom-9 right-3 z-[41] flex items-center gap-1.5">
          {ui.energy >= 100 ? (
            <button
              type="button"
              onClick={() => engineRef.current?.fireUltimate()}
              className="border border-black bg-[#EBEB00] px-2 py-1 font-mono-tech text-[10px] font-bold tracking-widest text-black"
              style={{ animation: "mw-aura-pulse 600ms steps(2, end) infinite" }}
              title={lang === "id" ? "Keluarkan jurus pamungkas" : "Fire the ultimate move"}
            >
              {lang === "id" ? "★ PAMUNGKAS!" : "★ ULTIMATE!"}
            </button>
          ) : (
            <div
              className="flex items-center gap-[2px] border border-white/40 bg-black px-1.5 py-1"
              title={lang === "id" ? "Energi maskot: klik, seret, dan jawab kuis untuk mengisi" : "Mascot energy: click, drag, and answer quizzes to fill"}
            >
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k} className="block h-2 w-1.5" style={{ background: ui.energy >= (k + 1) * 10 ? ["#5BA8FF", "#FF8A00", "#EBEB00"][k % 3] : "rgba(255,255,255,0.18)" }} />
              ))}
            </div>
          )}
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
