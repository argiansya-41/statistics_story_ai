import type { MascotFace, MascotOutfit, MascotPose } from "@/components/ui/Mascot";

/**
 * Mesin "arena maskot" v2: tiga aktor berelemen (air, api, petir) berjalan, melompat, terbang,
 * berbicara, dan bertarung dengan jurus mengikuti skrip episode.
 * Aturan elemen arena: air mengalahkan api, api mengalahkan petir, petir mengalahkan air.
 *
 * Murni logika (tanpa DOM, tanpa React) sehingga bisa diuji dengan jam virtual.
 * Posisi (x, y) dikirim lewat host.onMove tanpa re-render React. Hal diskret (ekspresi, pose, balon,
 * efek, peluru, sinar, ledakan) dikirim lewat host.onCommit.
 * Koordinat: x = piksel dari tepi kiri layar, y = tinggi di atas lantai (0 = berdiri di lantai).
 */

export type ActorId = "sigi" | "mu" | "quin";
export const ACTOR_IDS: ActorId[] = ["sigi", "mu", "quin"];
export type Lang = "id" | "en";
export interface Text { id: string; en: string }

export type Element = "water" | "fire" | "lightning";
export const ELEMENT: Record<ActorId, Element> = { sigi: "water", mu: "fire", quin: "lightning" };

export type Fx = "pow" | "heart" | "sweat" | "anger" | "stars" | "spark" | "note" | "bulb" | "zzz" | "quest" | "bang";
export type ProjectileKind = "bubble" | "tide" | "fireball" | "orb";
export type BeamKind = "jet" | "flame" | "bolt";
export type BurstKind = "splash" | "blast" | "shock" | "steam" | "puff" | "geyser" | "pillar" | "rain" | "ring" | "star" | "shield" | "confetti";
export type StrikeKind = "geyser" | "pillar" | "thunder" | "rain" | "meteor" | "storm";
export type EventName = "sleep" | "wake" | "back" | "dizzy" | "konami";
export type BubbleKind = "say" | "shout";

export interface Look { pose: MascotPose; face: MascotFace; outfit: MascotOutfit; aura?: boolean }

/** Angka 0..1 = posisi pada lebar layar. near = berdiri di sebelah aktor lain. meet = bertemu di titik tengah. */
export type Target = number | { near: ActorId; gap: number } | { meet: ActorId; gap: number };

export type Action = (
  | { who: ActorId; walk: Target; run?: boolean; speed?: number } // menunggu sampai tiba
  | { who: ActorId; say: Text; ms?: number; style?: BubbleKind } // menunggu sampai balon hilang
  | { who: ActorId; set: Partial<Look> } // instan
  | { who: ActorId; turn: ActorId | "left" | "right" } // instan
  | { who: ActorId; fx: Fx; ms?: number } // instan, efek berjalan sendiri
  | { who: ActorId; hop: true } // instan, melompat kecil di tempat
  | { who: ActorId; knock: { from: ActorId; px: number; up?: number } } // terpental (up = tinggi lengkungan), menunggu
  | { who: ActorId; jump: { to?: Target; h: number; ms?: number } } // melompat membentuk lengkung, menunggu sampai mendarat
  | { who: ActorId; fly: { to?: Target; y: number; ms?: number } } // naik dan melayang di ketinggian y, menunggu
  | { who: ActorId; land: true; ms?: number } // turun ke lantai, menunggu
  | { who: ActorId; dash: Target } // meluncur sangat cepat (tanpa ganti pose), menunggu
  | { who: ActorId; shoot: { kind: ProjectileKind; at: ActorId; speed?: number; miss?: number } } // menunggu sampai kena/meleset
  | { who: ActorId; beam: { kind: BeamKind; at: ActorId; ms?: number; miss?: number } } // sinar, menunggu sampai padam
  | { who: ActorId; strike: { kind: StrikeKind; at: ActorId | number; ms?: number } } // jurus area
  | { who: ActorId; chain: { via: ActorId[]; ms?: number } } // rantai petir melompat antar sasaran, menunggu sampai padam
  | { who: ActorId; ask: Quiz } // kuis interaktif: pengunjung memilih jawaban, maskot bereaksi
  | { burst: { kind: BurstKind; at: ActorId | number; y?: number; ms?: number } } // ledakan/efek, instan
  | { wait: number }
) & { after?: number }; // after = tunda sekian ms sebelum aksi ini dimulai

export interface Quiz {
  q: Text;
  options: Text[];
  correct: number;
  right: Step[];
  wrong: Step[];
  timeout: Step[];
  /** Batas waktu menjawab (ms). */
  ms?: number;
}

/** Semua aksi dalam satu langkah berjalan bersamaan; langkah selesai setelah semua aksi yang menunggu selesai. */
export type Step = Action[];

export interface Episode {
  id: string;
  weight: number;
  /** Id section tempat episode ini lebih sering dipilih ("footer" untuk <footer>). */
  sections?: string[];
  steps: Step[];
}

export interface EnragedRant {
  shout: Text;
  followUp: Text;
}

export interface Scripts {
  episodes: Episode[];
  finale: Episode;
  /** Jurus pamungkas yang keluar saat energi penuh. */
  ultimate: Episode;
  /** Episode pendek yang dipicu peristiwa halaman. */
  events: Partial<Record<EventName, Episode>>;
  /** Kalimat saat diklik, per maskot (sesuai kepribadian). */
  poke: Record<ActorId, Text[]>;
  /** Kalimat saat maskot lain diklik, per maskot. */
  pokeReply: Record<ActorId, Text[]>;
  /** Kalimat saat diklik beruntun (3x lebih). */
  combo: Record<ActorId, Text[]>;
  /** Kalimat saat diklik terlalu banyak (6x lebih). */
  dizzy: Record<ActorId, Text[]>;
  /** Reaksi saat maskot dilempar / interaksi dengan user. */
  throwReaction?: {
    normal: Record<ActorId, Text[]>;
    warning: Record<ActorId, Text[]>;
    enragedRants?: Record<ActorId, EnragedRant[]>;
    enragedShout?: Record<ActorId, Text>;
    enragedAfter?: Record<ActorId, Text>;
  };
}

export interface Bubble { text: string; shift: number; key: number; kind: BubbleKind }
export interface FxState { kind: Fx; key: number }
export interface ActorUi {
  look: Look;
  dir: 1 | -1;
  bubble: Bubble | null;
  fx: FxState | null;
  hop: number;
  /** Bertambah tiap kali maskot harus berputar (salto). */
  spin: number;
  /** true bila sedang melayang di udara tanpa bergerak (efek goyang pelan) */
  hover: boolean;
}
export interface ProjectileUi {
  key: number; kind: ProjectileKind; x0: number; y0: number; x1: number; y1: number; ms: number; dir: 1 | -1; arc: number; rot?: boolean;
}
export interface BeamUi { key: number; kind: BeamKind; points: [number, number][]; ms: number }
export interface BurstUi { key: number; kind: BurstKind; x: number; y: number; ms: number }
export interface GhostUi { key: number; who: ActorId; x: number; y: number; dir: 1 | -1; ms: number }
export interface AskUi { key: number; who: ActorId; q: string; options: string[] }
export interface ScreenCrackUi {
  key: number;
  actorId: ActorId;
  element: "water" | "fire" | "lightning";
  x: number;
  y: number;
  ms: number;
}
export interface UiState {
  actors: Record<ActorId, ActorUi>;
  projectiles: ProjectileUi[];
  beams: BeamUi[];
  bursts: BurstUi[];
  ghosts: GhostUi[];
  ask: AskUi | null;
  /** 0..100. Penuh = jurus pamungkas siap. */
  energy: number;
  /** Kilat layar dan guncangan arena (key berubah = animasi ulang). */
  flash: { key: number; color: string } | null;
  shake: number;
  /** Efek retakan layar saat maskot sangat marah ke user. */
  screenCrack: ScreenCrackUi | null;
}

export interface EngineHost {
  width(): number;
  height(): number;
  size(): number;
  reserveRight(): number;
  lang(): Lang;
  section(): string | null;
  now(): number;
  random(): number;
  setTimeout(fn: () => void, ms: number): number;
  clearTimeout(id: number): void;
  raf(fn: () => void): number;
  cancelRaf(id: number): void;
  onCommit(ui: UiState): void;
  onMove(id: ActorId, x: number, y: number): void;
  debug?(message: string): void;
}

export interface Engine {
  start(): void;
  stop(): void;
  resize(): void;
  poke(id: ActorId): void;
  react(detail: { who?: ActorId; text: Text; face?: MascotFace; ms?: number }): void;
  requestFinale(): void;
  /** Maskot menoleh ke arah penunjuk (px = posisi x layar). */
  hover(id: ActorId, px: number): void;
  grab(id: ActorId): void;
  /** x, y = posisi kiri-bawah kotak maskot (y = tinggi di atas lantai). */
  drag(id: ActorId, x: number, y: number): void;
  release(id: ActorId): void;
  clearScreenCrack(): void;
  answer(index: number): void;
  addEnergy(n: number): void;
  /** Mengeluarkan jurus pamungkas bila energi penuh. */
  fireUltimate(): boolean;
  trigger(name: EventName): void;
  sleep(): void;
  wake(): void;
}

export const DEFAULT_LOOK: Record<ActorId, Look> = {
  sigi: { pose: "idle", face: "smile", outfit: "none", aura: false },
  mu: { pose: "idle", face: "smile", outfit: "none", aura: false },
  quin: { pose: "idle", face: "smile", outfit: "none", aura: false },
};

const WALK = 80; // px per detik
const RUN = 280;
const DASH = 1100;
const KNOCK = 460;
const START_AT: Record<ActorId, number> = { sigi: 0.15, mu: 0.45, quin: 0.75 };

const PROJECTILE_SPEED: Record<ProjectileKind, number> = { bubble: 430, tide: 300, fireball: 520, orb: 340 };
const PROJECTILE_ARC: Record<ProjectileKind, number> = { bubble: 46, tide: 0, fireball: 14, orb: 0 };
const PROJECTILE_IMPACT: Record<ProjectileKind, BurstKind> = { bubble: "splash", tide: "splash", fireball: "blast", orb: "shock" };
const BEAM_IMPACT: Record<BeamKind, BurstKind> = { jet: "splash", flame: "blast", bolt: "shock" };

interface Actor {
  pokes: number[];
  spin: number;
  x: number;
  y: number;
  dir: 1 | -1;
  look: Look;
  bubble: Bubble | null;
  fx: FxState | null;
  hop: number;
  reactUntil: number;
  idleToken: number;
  hovering: boolean;
}

type Motion =
  | { type: "speed"; target: number; speed: number; auto: "walk" | "run" | null; resolve: () => void; dust?: number }
  | { type: "ballistic"; vx: number; vy: number; bounces: number; peak: number; resolve: () => void }
  | {
      type: "tween"; x0: number; x1: number; y0: number; y1: number; arc: number; dur: number; t: number;
      ease: "inout" | "in" | "out" | "linear"; autoStart: MascotPose | null; autoEnd: "idle" | "keep" | "air"; aura: boolean | null;
      resolve: () => void;
    };

export function createEngine(host: EngineHost, scripts: Scripts): Engine {
  let alive = false;
  let keyCounter = 0;
  let running = false;
  let queued: Episode | null = null;
  let wakeFn: (() => void) | null = null;
  let lastEpisode = "";
  let lastReact = -1e9;
  let rafId = 0;
  let lastT = 0;
  const timers = new Set<number>();
  const motions = new Map<ActorId, Motion>();
  let projectiles: ProjectileUi[] = [];
  let beams: BeamUi[] = [];
  let bursts: BurstUi[] = [];
  let ghosts: GhostUi[] = [];
  let ask: AskUi | null = null;
  let energy = 0;
  let flash: { key: number; color: string } | null = null;
  let shake = 0;
  let screenCrack: ScreenCrackUi | null = null;
  let epToken = 0;
  let sleeping = false;
  let answerFn: ((i: number) => void) | null = null;
  const held = new Set<ActorId>();
  const samples = new Map<ActorId, { t: number; x: number; y: number }[]>();
  const sleepers = new Map<number, () => void>();

  const actors = {} as Record<ActorId, Actor>;
  for (const id of ACTOR_IDS) {
    actors[id] = {
      x: 0, y: 0, dir: 1, look: { ...DEFAULT_LOOK[id] }, bubble: null, fx: null, hop: 0, reactUntil: 0, idleToken: 0, hovering: false, pokes: [], spin: 0,
    };
  }

  const rand = (a: number, b: number) => a + host.random() * (b - a);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(host.random() * arr.length)];

  const commit = () => {
    const out = {} as Record<ActorId, ActorUi>;
    for (const id of ACTOR_IDS) {
      const a = actors[id];
      out[id] = {
        look: { ...a.look }, dir: a.dir, bubble: a.bubble, fx: a.fx, hop: a.hop, spin: a.spin,
        hover: a.hovering && !motions.has(id),
      };
    }
    host.onCommit({ actors: out, projectiles: [...projectiles], beams: [...beams], bursts: [...bursts], ghosts: [...ghosts], ask, energy, flash, shake, screenCrack });
  };

  const later = (fn: () => void, ms: number) => {
    const id = host.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const id = later(() => { sleepers.delete(id); resolve(); }, ms);
      sleepers.set(id, resolve);
    });
  /** Membangunkan semua sleep yang sedang menunggu (dipakai saat episode dibatalkan). */
  const flushSleepers = () => {
    const all = Array.from(sleepers.entries());
    sleepers.clear();
    all.forEach(([id, res]) => { host.clearTimeout(id); timers.delete(id); res(); });
  };
  const abortEpisode = () => {
    epToken++;
    if (answerFn) answerFn(-1);
    flushSleepers();
  };
  const pulse = (kind: "flash" | "shake", color = "#ffffff") => {
    if (kind === "flash") flash = { key: ++keyCounter, color };
    else shake = ++keyCounter;
    commit();
  };

  const size = () => host.size();
  const usable = () => Math.max(0, host.width() - size() - host.reserveRight() - 16);
  const clampX = (x: number) => Math.max(8, Math.min(8 + usable(), x));
  const centerOf = (id: ActorId): [number, number] => [actors[id].x + size() / 2, actors[id].y + size() * 0.48];
  const handOf = (id: ActorId): [number, number] => {
    const a = actors[id];
    return [a.x + size() / 2 + a.dir * size() * 0.5, a.y + size() * 0.5];
  };

  const targetX = (id: ActorId, t: Target): number => {
    const me = actors[id];
    if (typeof t === "number") return 8 + t * usable();
    if ("near" in t) {
      const o = actors[t.near];
      return me.x <= o.x ? o.x - (t.gap + size()) : o.x + (t.gap + size());
    }
    const o = actors[t.meet];
    const mid = (me.x + o.x) / 2;
    const half = (t.gap + size()) / 2;
    return me.x <= o.x ? mid - half : mid + half;
  };
  const atX = (at: ActorId | number): number => (typeof at === "number" ? 8 + at * usable() + size() / 2 : actors[at].x + size() / 2);

  // ---------- Gerak ----------
  let onLandedFromThrow: (id: ActorId, peak: number) => void = () => {};
  const ease = (kind: "inout" | "in" | "out" | "linear", p: number) =>
    kind === "linear" ? p : kind === "in" ? p * p : kind === "out" ? 1 - (1 - p) * (1 - p) : p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

  const tick = () => {
    rafId = 0;
    const now = host.now();
    const dtMs = Math.min(50, now - lastT);
    lastT = now;
    for (const [id, m] of Array.from(motions.entries())) {
      const a = actors[id];
      if (m.type === "speed") {
        const dist = m.target - a.x;
        const step = m.speed * (dtMs / 1000);
        if (Math.abs(dist) <= step) {
          a.x = m.target;
          host.onMove(id, a.x, a.y);
          motions.delete(id);
          if (m.auto) {
            a.look = { ...a.look, pose: "idle" };
            commit();
          }
          m.resolve();
        } else {
          a.x += Math.sign(dist) * step;
          host.onMove(id, a.x, a.y);
          if (m.auto === "run" || m.speed >= DASH * 0.9) {
            m.dust = (m.dust ?? 0) + step;
            if (m.dust > 70) { m.dust = 0; addBurst("puff", a.x + size() / 2 - Math.sign(dist) * 10, 2, 380); }
          }
        }
      } else if (m.type === "ballistic") {
        const dt = Math.max(0.001, Math.min(0.05, dtMs / 1000));
        m.vy -= 2400 * dt; // gravitasi
        a.x += m.vx * dt;
        a.y += m.vy * dt;
        m.peak = Math.max(m.peak, Math.abs(m.vy));
        const maxX = 8 + usable();
        const maxY = Math.max(100, host.height() - size() - 20);

        // Pantulan atap / langit-langit (mencegah maskot nyetack ke atas / tembus layar)
        if (a.y >= maxY) {
          a.y = maxY;
          if (m.vy > 0) {
            m.vy = -Math.abs(m.vy) * 0.55; // pantul ke bawah
            addBurst("puff", a.x + size() / 2, a.y, 350);
          }
        }

        // Pantulan dinding kiri dan kanan
        if (a.x < 8) {
          a.x = 8;
          m.vx = Math.abs(m.vx) * 0.6;
        } else if (a.x > maxX) {
          a.x = maxX;
          m.vx = -Math.abs(m.vx) * 0.6;
        }

        // Pantulan lantai dan mendarat
        if (a.y <= 0) {
          a.y = 0;
          addBurst("puff", a.x + size() / 2, 2, 420);
          if (Math.abs(m.vy) > 380 && m.bounces < 2) {
            m.vy = Math.abs(m.vy) * 0.42;
            m.vx *= 0.7;
            m.bounces++;
            if (m.peak > 1100) pulse("shake");
          } else {
            host.onMove(id, a.x, a.y);
            motions.delete(id);
            a.hovering = false;
            const hard = m.peak > 1000;
            a.look = { ...a.look, pose: "idle", face: hard ? "ko" : "happy", aura: false };
            if (hard) showFx(id, "stars", 1500);
            commit();
            onLandedFromThrow(id, m.peak);
            m.resolve();
            continue;
          }
        }
        host.onMove(id, a.x, a.y);
      } else {
        m.t += dtMs;
        const p = Math.min(1, m.t / m.dur);
        const e = ease(m.ease, p);
        a.x = m.x0 + (m.x1 - m.x0) * e;
        a.y = m.y0 + (m.y1 - m.y0) * e + m.arc * 4 * p * (1 - p);
        host.onMove(id, a.x, a.y);
        if (p >= 1) {
          a.x = m.x1;
          a.y = m.y1;
          host.onMove(id, a.x, a.y);
          motions.delete(id);
          a.hovering = a.y > 0.5;
          if (m.autoEnd === "idle") {
            a.look = { ...a.look, pose: "idle", aura: m.aura === null ? a.look.aura : false };
            if (m.y0 > 8 && a.y < 1) { addBurst("puff", a.x + size() * 0.3, 2, 420); addBurst("puff", a.x + size() * 0.7, 2, 420); }
          }
          else if (m.autoEnd === "air") a.look = { ...a.look, pose: "air", aura: true };
          commit();
          m.resolve();
        }
      }
    }

    // Safety Watchdog: Bila ada aktor yang melayang di udara tanpa motion & tidak dipegang (dan bukan sedang hovering jurus), segera beri gravitasi jatuh
    for (const id of ACTOR_IDS) {
      if (actors[id].y > 0.5 && !motions.has(id) && !held.has(id) && !actors[id].hovering) {
        setMotion(id, { type: "ballistic", vx: 0, vy: -150, bounces: 0, peak: 200, resolve: () => {} });
      }
    }

    if (motions.size > 0 && alive) rafId = host.raf(tick);
  };
  const ensureLoop = () => {
    if (!rafId && alive) {
      lastT = host.now();
      rafId = host.raf(tick);
    }
  };
  const setMotion = (id: ActorId, m: Motion) => {
    const old = motions.get(id);
    motions.set(id, m);
    if (old) old.resolve();
    ensureLoop();
  };

  const move = (id: ActorId, target: number, speed: number, auto: "walk" | "run" | null) =>
    new Promise<void>((resolve) => {
      if (held.has(id) || motions.get(id)?.type === "ballistic") {
        resolve();
        return;
      }
      const a = actors[id];
      const to = clampX(target);
      if (Math.abs(to - a.x) < 1) {
        resolve();
        return;
      }
      a.dir = to > a.x ? 1 : -1;
      if (auto) a.look = { ...a.look, pose: auto };
      commit();
      setMotion(id, { type: "speed", target: to, speed, auto, resolve });
    });

  const tween = (
    id: ActorId,
    o: { x1: number; y1: number; arc?: number; dur: number; ease: "inout" | "in" | "out" | "linear"; start: MascotPose | null; end: "idle" | "keep" | "air"; aura?: boolean | null }
  ) =>
    new Promise<void>((resolve) => {
      if (held.has(id) || motions.get(id)?.type === "ballistic") {
        resolve();
        return;
      }
      const a = actors[id];
      const x1 = clampX(o.x1);
      if (Math.abs(x1 - a.x) > 1) a.dir = x1 > a.x ? 1 : -1;
      if (o.start) a.look = { ...a.look, pose: o.start };
      if (o.aura !== undefined && o.aura !== null) a.look = { ...a.look, aura: o.aura };
      a.hovering = false;
      commit();
      setMotion(id, {
        type: "tween", x0: a.x, x1, y0: a.y, y1: o.y1, arc: o.arc ?? 0, dur: Math.max(80, o.dur), t: 0, ease: o.ease,
        autoStart: o.start, autoEnd: o.end, aura: o.aura ?? null, resolve,
      });
    });

  // ---------- Bicara dan efek ----------
  const say = async (id: ActorId, text: Text, ms?: number, kind: BubbleKind = "say") => {
    const a = actors[id];
    const str = text[host.lang()];
    const dur = ms ?? Math.max(1700, Math.min(4300, 900 + str.length * 55));
    const key = ++keyCounter;
    const W = host.width();
    const c = a.x + size() / 2;
    let shift = 0;
    if (c - 96 < 8) shift = 8 - (c - 96);
    else if (c + 96 > W - 8) shift = W - 8 - (c + 96);
    a.bubble = { text: str, shift, key, kind };
    commit();
    await sleep(dur);
    if (a.bubble && a.bubble.key === key) {
      a.bubble = null;
      commit();
    }
  };

  const showFx = (id: ActorId, kind: Fx, ms: number) => {
    const a = actors[id];
    const key = ++keyCounter;
    a.fx = { kind, key };
    commit();
    later(() => {
      if (a.fx && a.fx.key === key) {
        a.fx = null;
        commit();
      }
    }, ms);
  };

  const addBurst = (kind: BurstKind, x: number, y: number, ms: number) => {
    const key = ++keyCounter;
    bursts.push({ key, kind, x, y, ms });
    commit();
    later(() => {
      bursts = bursts.filter((b) => b.key !== key);
      commit();
    }, ms);
  };

  const jag = (x0: number, y0: number, x1: number, y1: number, segments: number, amp: number): [number, number][] => {
    const pts: [number, number][] = [[x0, y0]];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const o = (host.random() * 2 - 1) * amp;
      pts.push([x0 + dx * t + nx * o, y0 + dy * t + ny * o]);
    }
    pts.push([x1, y1]);
    return pts;
  };

  const doShoot = async (id: ActorId, s: { kind: ProjectileKind; at: ActorId; speed?: number; miss?: number }) => {
    const a = actors[id];
    const t = actors[s.at];
    if (t.x !== a.x) a.dir = t.x >= a.x ? 1 : -1;
    const [x0, y0] = handOf(id);
    const [tcx, tcy] = centerOf(s.at);
    const sign = t.x >= a.x ? 1 : -1;
    const x1 = tcx + (s.miss ? sign * s.miss : 0);
    const y1 = s.kind === "tide" ? size() * 0.3 : tcy;
    const y0b = s.kind === "tide" ? size() * 0.3 : y0;
    const dist = Math.hypot(x1 - x0, y1 - y0b);
    const ms = Math.max(250, (dist / (s.speed ?? PROJECTILE_SPEED[s.kind])) * 1000);
    const key = ++keyCounter;
    projectiles.push({ key, kind: s.kind, x0, y0: y0b, x1, y1, ms, dir: x1 >= x0 ? 1 : -1, arc: PROJECTILE_ARC[s.kind] });
    commit();
    await sleep(ms);
    projectiles = projectiles.filter((p) => p.key !== key);
    addBurst(PROJECTILE_IMPACT[s.kind], x1, s.miss ? Math.min(y1, size() * 0.3) : y1, 600);
  };

  const doBeam = async (id: ActorId, b: { kind: BeamKind; at: ActorId; ms?: number; miss?: number }) => {
    const a = actors[id];
    const t = actors[b.at];
    if (t.x !== a.x) a.dir = t.x >= a.x ? 1 : -1;
    const [x0, y0] = handOf(id);
    const [tcx, tcy] = centerOf(b.at);
    const sign = t.x >= a.x ? 1 : -1;
    const x1 = tcx + (b.miss ? sign * b.miss : 0);
    const ms = b.ms ?? 800;
    const points =
      b.kind === "bolt" ? jag(x0, y0, x1, tcy, 8, 16) : b.kind === "flame" ? jag(x0, y0, x1, tcy, 6, 6) : jag(x0, y0, x1, tcy, 3, 3);
    const key = ++keyCounter;
    beams.push({ key, kind: b.kind, points, ms });
    commit();
    later(() => addBurst(BEAM_IMPACT[b.kind], x1, tcy, 500), Math.min(180, ms / 3));
    await sleep(ms);
    beams = beams.filter((x) => x.key !== key);
    commit();
  };

  const thunderAt = (x: number, ms: number) => {
    const key = ++keyCounter;
    beams.push({ key, kind: "bolt", points: jag(x, host.height(), x, size() * 0.2, 12, 22), ms: Math.min(ms, 520) });
    pulse("flash", "#fff6a0");
    commit();
    later(() => { beams = beams.filter((b) => b.key !== key); commit(); }, ms);
  };

  const doChain = async (id: ActorId, c: { via: ActorId[]; ms?: number }) => {
    const ms = c.ms ?? 900;
    const [x0, y0] = handOf(id);
    let pts: [number, number][] = [[x0, y0]];
    let prev: [number, number] = [x0, y0];
    for (const v of c.via) {
      const [cx, cy] = centerOf(v);
      pts = pts.concat(jag(prev[0], prev[1], cx, cy, 4, 12).slice(1));
      prev = [cx, cy];
      later(() => addBurst("shock", cx, cy, 500), 140 + pts.length * 6);
    }
    const key = ++keyCounter;
    beams.push({ key, kind: "bolt", points: pts, ms });
    pulse("flash", "#ffe600");
    await sleep(ms);
    beams = beams.filter((b) => b.key !== key);
    commit();
  };

  const doStrike = async (s: { kind: StrikeKind; at: ActorId | number; ms?: number }) => {
    const x = atX(s.at);
    const ms = s.ms ?? 900;
    if (s.kind === "rain") {
      addBurst("rain", x, 0, ms);
      await sleep(ms);
      return;
    }
    if (s.kind === "meteor") {
      for (let i = 0; i < 4; i++) {
        later(() => {
          const x1 = x + (i - 1.5) * 34;
          const x0 = x1 + 220 + i * 30;
          const y0 = host.height() * 0.85;
          const y1 = size() * 0.25;
          const dist = Math.hypot(x1 - x0, y1 - y0);
          const pms = Math.max(300, (dist / 620) * 1000);
          const key = ++keyCounter;
          projectiles.push({ key, kind: "fireball", x0, y0, x1, y1, ms: pms, dir: -1, arc: 0, rot: true });
          commit();
          later(() => { projectiles = projectiles.filter((p) => p.key !== key); addBurst("blast", x1, y1, 600); pulse("shake"); }, pms);
        }, i * 260);
      }
      await sleep(ms);
      return;
    }
    if (s.kind === "storm") {
      for (let i = 0; i < 5; i++) later(() => thunderAt(x + (i - 2) * 70 + (host.random() - 0.5) * 30, 500), i * 200);
      pulse("flash", "#fff6a0");
      await sleep(ms);
      return;
    }
    if (s.kind === "thunder") {
      const top = host.height();
      const key = ++keyCounter;
      beams.push({ key, kind: "bolt", points: jag(x, top, x, size() * 0.2, 12, 22), ms: Math.min(ms, 520) });
      commit();
      pulse("flash", "#fff6a0");
      await sleep(ms);
      beams = beams.filter((b) => b.key !== key);
      commit();
      return;
    }
    if (s.kind === "pillar" || s.kind === "geyser") pulse("shake");
    addBurst(s.kind, x, 0, ms);
    await sleep(ms);
  };

  // ---------- Kuis interaktif ----------
  const doAsk = async (id: ActorId, q: Quiz) => {
    const tok = epToken;
    const lang = host.lang();
    const key = ++keyCounter;
    actors[id].look = { ...actors[id].look, face: "talk", pose: "point" };
    ask = { key, who: id, q: q.q[lang], options: q.options.map((o) => o[lang]) };
    commit();
    const choice = await new Promise<number>((resolve) => {
      let done = false;
      const finish = (i: number) => { if (done) return; done = true; answerFn = null; resolve(i); };
      answerFn = finish;
      later(() => finish(-2), q.ms ?? 14000);
    });
    ask = null;
    actors[id].look = { ...actors[id].look, pose: "idle", face: "smile" };
    commit();
    if (tok !== epToken || choice === -1) return;
    if (choice >= 0) energy = Math.min(100, energy + (choice === q.correct ? 15 : 5));
    await runSteps(choice === -2 ? q.timeout : choice === q.correct ? q.right : q.wrong, tok);
  };

  async function runSteps(steps: Step[], tok: number) {
    for (const step of steps) {
      if (!alive || tok !== epToken) return;
      await Promise.all(step.map(perform));
    }
  }

  // ---------- Episode ----------
  async function perform(a: Action): Promise<void> {
    if (a.after) await sleep(a.after);
    if (!alive) return;
    if ("wait" in a) {
      await sleep(a.wait);
      return;
    }
    if ("burst" in a) {
      const b = a.burst;
      const x = atX(b.at);
      const y = b.y ?? (typeof b.at === "number" ? 0 : actors[b.at].y + size() * 0.45);
      addBurst(b.kind, x, y, b.ms ?? 700);
      return;
    }
    const actor = actors[a.who];
    if ("set" in a) {
      if (!held.has(a.who) && motions.get(a.who)?.type !== "ballistic") {
        actor.look = { ...actor.look, ...a.set };
        commit();
      }
      return;
    }
    if ("turn" in a) {
      if (!held.has(a.who)) {
        const t = a.turn;
        actor.dir = t === "left" ? -1 : t === "right" ? 1 : actors[t].x >= actor.x ? 1 : -1;
        commit();
      }
      return;
    }
    if ("fx" in a) {
      showFx(a.who, a.fx, a.ms ?? 900);
      return;
    }
    if ("hop" in a) {
      actor.hop++;
      commit();
      return;
    }
    if ("say" in a) {
      await say(a.who, a.say, a.ms, a.style);
      return;
    }
    if ("ask" in a) {
      await doAsk(a.who, a.ask);
      return;
    }
    if ("chain" in a) {
      await doChain(a.who, a.chain);
      return;
    }
    if ("walk" in a) {
      await move(a.who, targetX(a.who, a.walk), a.speed ?? (a.run ? RUN : WALK), a.run ? "run" : "walk");
      return;
    }
    if ("knock" in a) {
      const from = actors[a.knock.from];
      const dir = actor.x >= from.x ? 1 : -1;
      if (a.knock.up && a.knock.up > 0) {
        await tween(a.who, { x1: actor.x + dir * a.knock.px, y1: 0, arc: a.knock.up, dur: 680, ease: "linear", start: null, end: "keep" });
      } else {
        await move(a.who, actor.x + dir * a.knock.px, KNOCK, null);
      }
      return;
    }
    if ("jump" in a) {
      const j = a.jump;
      await tween(a.who, { x1: j.to !== undefined ? targetX(a.who, j.to) : actor.x, y1: 0, arc: j.h, dur: j.ms ?? 600, ease: "linear", start: "air", end: "idle" });
      return;
    }
    if ("fly" in a) {
      const f = a.fly;
      await tween(a.who, { x1: f.to !== undefined ? targetX(a.who, f.to) : actor.x, y1: f.y, dur: f.ms ?? 700, ease: "inout", start: "air", end: "air", aura: true });
      return;
    }
    if ("land" in a) {
      await tween(a.who, { x1: actor.x, y1: 0, dur: a.ms ?? 520, ease: "in", start: "air", end: "idle", aura: false });
      return;
    }
    if ("dash" in a) {
      addBurst("puff", actor.x + size() / 2, actor.y + size() * 0.3, 450);
      const gx0 = actor.x;
      const gx1 = clampX(targetX(a.who, a.dash));
      for (let i = 1; i <= 5; i++) {
        later(() => {
          const key = ++keyCounter;
          ghosts.push({ key, who: a.who, x: gx0 + ((gx1 - gx0) * i) / 6, y: actor.y, dir: actor.dir, ms: 380 });
          commit();
          later(() => { ghosts = ghosts.filter((g) => g.key !== key); commit(); }, 400);
        }, i * 38);
      }
      await move(a.who, gx1, DASH, null);
      return;
    }
    if ("shoot" in a) {
      await doShoot(a.who, a.shoot);
      return;
    }
    if ("beam" in a) {
      await doBeam(a.who, a.beam);
      return;
    }
    if ("strike" in a) {
      await doStrike(a.strike);
    }
  }

  const resetAll = async () => {
    // Pastikan semua aktor kembali ke lantai sebelum episode berikutnya.
    const airborne = ACTOR_IDS.filter((id) => actors[id].y > 0.5 && !held.has(id) && motions.get(id)?.type !== "ballistic");
    if (airborne.length > 0) await Promise.all(airborne.map((id) => tween(id, { x1: actors[id].x, y1: 0, dur: 450, ease: "in", start: "air", end: "idle", aura: false })));
    projectiles = [];
    beams = [];
    for (const id of ACTOR_IDS) {
      if (held.has(id) || motions.get(id)?.type === "ballistic") continue;
      const a = actors[id];
      a.look = { ...DEFAULT_LOOK[id] };
      a.bubble = null;
      a.fx = null;
      a.hovering = false;
    }
    ask = null;
    commit();
  };

  async function runEpisode(ep: Episode) {
    lastEpisode = ep.id;
    const tok = ++epToken;
    host.debug?.(`start ${ep.id}`);
    await runSteps(ep.steps, tok);
    if (!alive) return;
    await resetAll();
    host.debug?.(`end ${ep.id}`);
  }

  const pickEpisode = (): Episode | null => {
    const cur = host.section();
    const pool = scripts.episodes.filter((e) => e.id !== lastEpisode);
    if (pool.length === 0) return null;
    const weights = pool.map((e) => {
      if (!e.sections) return e.weight;
      return e.weight * (cur !== null && e.sections.includes(cur) ? 6 : 0.15);
    });
    const total = weights.reduce((s, w) => s + w, 0);
    let r = host.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  const nap = (ms: number) =>
    new Promise<void>((resolve) => {
      const id = later(() => {
        wakeFn = null;
        resolve();
      }, ms);
      wakeFn = () => {
        host.clearTimeout(id);
        timers.delete(id);
        wakeFn = null;
        resolve();
      };
    });

  const director = async () => {
    await sleep(2500);
    while (alive) {
      if (sleeping) { await nap(1000); continue; }
      const busyActor = ACTOR_IDS.some((id) => held.has(id) || motions.has(id) || host.now() < actors[id].reactUntil);
      if (busyActor) { await nap(1000); continue; }
      const ep = queued ?? pickEpisode();
      queued = null;
      if (ep) {
        running = true;
        await runEpisode(ep);
        running = false;
      }
      if (!sleeping) await nap(queued ? 600 : rand(5000, 9000));
    }
  };

  // ---------- Berkeliaran saat tidak ada episode ----------
  const wander = () => {
    if (!alive) return;
    if (!running && !sleeping) {
      const free = ACTOR_IDS.filter((id) => !motions.has(id) && !held.has(id) && !actors[id].bubble && host.now() >= actors[id].reactUntil);
      if (free.length > 0) {
        const id = pick(free);
        const a = actors[id];
        const token = ++a.idleToken;
        const delta = (host.random() < 0.5 ? -1 : 1) * rand(70, 220);
        void move(id, a.x + delta, WALK * 0.8, "walk").then(() => {
          if (running || a.idleToken !== token) return;
          const faces: MascotFace[] = ["smile", "wink", "flat", "think", "happy"];
          a.look = { ...a.look, face: pick(faces) };
          commit();
          later(() => {
            if (!running && a.idleToken === token) {
              a.look = { ...DEFAULT_LOOK[id] };
              commit();
            }
          }, 2200);
        });
      }
    }
    later(wander, rand(2200, 4200));
  };

  // ---------- Reaksi (klik dan peristiwa dari halaman) ----------
  const busy = (id: ActorId) =>
    running || motions.has(id) || actors[id].bubble !== null || host.now() < actors[id].reactUntil;

  const reactNow = (id: ActorId, text: Text, face: MascotFace, ms: number) => {
    const a = actors[id];
    a.reactUntil = host.now() + ms + 400;
    a.look = { ...a.look, face, pose: "idle" };
    commit();
    void say(id, text, ms).then(() => {
      if (!running) {
        a.look = { ...DEFAULT_LOOK[id] };
        commit();
      }
    });
  };

  const throwTracker: Record<ActorId, { count: number; last: number }> = {
    sigi: { count: 0, last: 0 },
    mu: { count: 0, last: 0 },
    quin: { count: 0, last: 0 },
  };

  const reactCustom = (
    id: ActorId,
    text: Text,
    opts: { face?: MascotFace; pose?: MascotPose; aura?: boolean; ms?: number; kind?: BubbleKind } = {}
  ) => {
    const a = actors[id];
    const ms = opts.ms ?? 2400;
    a.reactUntil = host.now() + ms + 400;
    a.look = {
      ...a.look,
      face: opts.face ?? a.look.face,
      pose: opts.pose ?? "idle",
      aura: opts.aura ?? false,
    };
    commit();
    void say(id, text, ms, opts.kind ?? "say").then(() => {
      if (!running && !held.has(id) && !motions.has(id)) {
        a.look = { ...DEFAULT_LOOK[id] };
        commit();
      }
    });
  };

  const enrageAndScoldUser = async (id: ActorId) => {
    const a = actors[id];
    a.reactUntil = host.now() + 8500;
    a.look = { ...a.look, pose: "charge", face: "angry", aura: true };
    a.hop++;
    commit();

    const rants = scripts.throwReaction?.enragedRants?.[id];
    const rant = rants && rants.length > 0 ? pick(rants) : null;
    const shoutText = rant?.shout ?? scripts.throwReaction?.enragedShout?.[id];
    const followUpText = rant?.followUp ?? scripts.throwReaction?.enragedAfter?.[id];

    if (shoutText) {
      void say(id, shoutText, 3200, "shout");
    }

    // Stomp feet in fury while shouting
    await sleep(1000);
    if (!alive) return;
    a.hop++;
    commit();

    await sleep(2200);
    if (!alive) return;

    // Follow-up scolding / roast
    if (followUpText) {
      a.look = { ...a.look, pose: "cast", face: "angry", aura: true };
      a.hop++;
      commit();
      void say(id, followUpText, 4000, "say");

      await sleep(1800);
      if (!alive) return;
      a.hop++;
      commit();
    }

    later(() => {
      if (!running && !held.has(id) && !motions.has(id)) {
        actors[id].look = { ...DEFAULT_LOOK[id] };
        commit();
      }
    }, 4500);
  };

  onLandedFromThrow = (id: ActorId, peak: number) => {
    const a = actors[id];
    const now = host.now();
    const tracker = throwTracker[id];
    if (now - tracker.last < 14000) {
      tracker.count++;
    } else {
      tracker.count = 1;
    }
    tracker.last = now;

    const count = tracker.count;
    // If thrown 3 times or slammed with extreme velocity:
    const isEnraged = count >= 3 || (count >= 2 && peak > 1250);

    if (isEnraged) {
      tracker.count = 0;
      void enrageAndScoldUser(id);
    } else if (count === 2) {
      // 2nd throw: angry warning!
      const warningList = scripts.throwReaction?.warning[id];
      const warningText = warningList && warningList.length > 0 ? pick(warningList) : null;
      if (warningText) {
        a.hop++;
        reactCustom(id, warningText, { face: "angry", pose: "charge", aura: true, ms: 2800, kind: "shout" });
      }
    } else {
      // 1st throw: normal dizzy / complaint
      const normalList = scripts.throwReaction?.normal[id];
      const normalText = normalList && normalList.length > 0 ? pick(normalList) : null;
      const hard = peak > 1000;
      if (normalText) {
        reactCustom(id, normalText, { face: hard ? "ko" : "wow", pose: hard ? "sit" : "idle", ms: 2600, kind: "say" });
      } else {
        later(() => { if (!running && !held.has(id) && !motions.has(id)) { actors[id].look = { ...DEFAULT_LOOK[id] }; commit(); } }, hard ? 1700 : 900);
      }
    }
  };

  const layout = () => {
    for (const id of ACTOR_IDS) {
      const a = actors[id];
      a.x = clampX(a.x);
      host.onMove(id, a.x, a.y);
    }
  };

  return {
    start() {
      if (alive) return;
      alive = true;
      running = false;
      queued = null;
      lastEpisode = "";
      projectiles = [];
      beams = [];
      bursts = [];
      ghosts = [];
      ask = null;
      sleeping = false;
      held.clear();
      for (const id of ACTOR_IDS) {
        const a = actors[id];
        a.look = { ...DEFAULT_LOOK[id] };
        a.bubble = null;
        a.fx = null;
        a.hovering = false;
        a.y = 0;
        a.x = clampX(8 + START_AT[id] * usable());
        a.dir = id === "quin" ? -1 : 1;
        host.onMove(id, a.x, a.y);
      }
      commit();
      void director();
      later(wander, 3200);
    },
    stop() {
      alive = false;
      sleepers.clear();
      answerFn = null;
      timers.forEach((t) => host.clearTimeout(t));
      timers.clear();
      motions.clear();
      if (rafId) host.cancelRaf(rafId);
      rafId = 0;
      wakeFn = null;
    },
    resize() {
      if (alive) layout();
    },
    poke(id) {
      if (!alive || sleeping) return;
      const a = actors[id];
      const now = host.now();
      a.pokes = a.pokes.filter((t) => now - t < 2600);
      a.pokes.push(now);
      const n = a.pokes.length;
      a.hop++;
      energy = Math.min(100, energy + 6);
      if (busy(id)) {
        // Saat episode berjalan: hanya melompat dan berkilau, tanpa mengganggu skrip.
        if (!a.fx) showFx(id, "spark", 800); else commit();
        return;
      }
      if (n >= 6) {
        a.pokes = [];
        showFx(id, "stars", 1800);
        reactNow(id, pick(scripts.dizzy[id]), "ko", 2200);
        return;
      }
      if (n >= 3) {
        a.spin++;
        showFx(id, host.random() < 0.5 ? "pow" : "note", 900);
        if (id === "quin") {
          thunderAt(a.x, 600);
        } else if (id === "mu") {
          addBurst("blast", a.x, size() * 0.25, 600);
          pulse("shake");
        } else if (id === "sigi") {
          addBurst("splash", a.x, size() * 0.25, 600);
        }
        reactNow(id, pick(scripts.combo[id]), pick<MascotFace>(["happy", "cool", "smug"]), 1900);
        return;
      }
      reactNow(id, pick(scripts.poke[id]), pick<MascotFace>(["wow", "happy", "wink", "love"]), 1900);
      const others = ACTOR_IDS.filter((o) => o !== id && !busy(o));
      if (others.length > 0) {
        const o = pick(others);
        later(() => {
          if (!running && !busy(o) && !sleeping) {
            actors[o].dir = actors[id].x >= actors[o].x ? 1 : -1;
            reactNow(o, pick(scripts.pokeReply[o]), "talk", 1900);
          }
        }, 1500);
      }
    },
    hover(id, px) {
      if (!alive || sleeping || held.has(id) || motions.has(id)) return;
      const a = actors[id];
      const c = a.x + size() / 2;
      if (Math.abs(px - c) > 4) a.dir = px >= c ? 1 : -1;
      if (!busy(id) && a.look.face === DEFAULT_LOOK[id].face) {
        a.look = { ...a.look, face: "wow" };
        a.reactUntil = host.now() + 900;
        later(() => { if (!running && !busy(id)) { a.look = { ...DEFAULT_LOOK[id] }; commit(); } }, 1000);
      }
      commit();
    },
    grab(id) {
      if (!alive || sleeping) return;
      const a = actors[id];
      const m = motions.get(id);
      motions.delete(id);
      if (m) m.resolve();
      held.add(id);
      samples.set(id, []);
      a.hovering = false;
      a.look = { ...a.look, pose: "air", face: "wow", aura: false };
      commit();
    },
    drag(id, x, y) {
      if (!held.has(id)) return;
      const a = actors[id];
      a.x = clampX(x);
      const maxY = Math.max(100, host.height() - size() - 20);
      a.y = Math.max(0, Math.min(maxY, y));
      host.onMove(id, a.x, a.y);
      const list = samples.get(id) ?? [];
      list.push({ t: host.now(), x: a.x, y: a.y });
      if (list.length > 6) list.shift();
      samples.set(id, list);
    },
    release(id) {
      if (!held.has(id)) return;
      held.delete(id);
      const a = actors[id];
      const list = samples.get(id) ?? [];
      samples.delete(id);
      let vx = 0, vy = 0;
      if (list.length >= 2) {
        const f = list[0], l = list[list.length - 1];
        const dt = Math.max(16, l.t - f.t) / 1000;
        vx = Math.max(-1500, Math.min(1500, (l.x - f.x) / dt));
        vy = Math.max(-1500, Math.min(1800, (l.y - f.y) / dt));
      }
      if (!Number.isFinite(vx)) vx = 0;
      if (!Number.isFinite(vy)) vy = 0;
      energy = Math.min(100, energy + 8);
      a.look = { ...a.look, face: "wow", pose: "air" };
      commit();
      if (a.y < 0.5 && Math.abs(vy) < 50) {
        a.look = { ...DEFAULT_LOOK[id], face: "happy" };
        commit();
        later(() => { if (!running && !held.has(id)) { a.look = { ...DEFAULT_LOOK[id] }; commit(); } }, 900);
        return;
      }
      setMotion(id, { type: "ballistic", vx, vy, bounces: 0, peak: 0, resolve: () => {} });
    },
    clearScreenCrack() {
      if (screenCrack) {
        screenCrack = null;
        commit();
      }
    },
    answer(index) {
      if (answerFn) answerFn(index);
    },
    addEnergy(n) {
      energy = Math.max(0, Math.min(100, energy + n));
      commit();
    },
    fireUltimate() {
      if (!alive || energy < 100 || sleeping) return false;
      energy = 0;
      queued = scripts.ultimate;
      if (running) abortEpisode();
      if (wakeFn) wakeFn();
      commit();
      return true;
    },
    trigger(name) {
      if (!alive) return;
      const ep = scripts.events[name];
      if (!ep) return;
      if (name === "sleep") { this.sleep(); return; }
      if (name === "wake") { this.wake(); return; }
      if (running && name !== "konami") return;
      if (sleeping) { sleeping = false; }
      queued = ep;
      if (running) abortEpisode();
      if (wakeFn) wakeFn();
    },
    sleep() {
      if (!alive || sleeping || running) return;
      sleeping = true;
      const loop = () => {
        if (!sleeping || !alive) return;
        for (const id of ACTOR_IDS) {
          if (held.has(id) || motions.has(id)) continue;
          actors[id].look = { ...DEFAULT_LOOK[id], face: "sleep", pose: "sit" };
        }
        showFx("sigi", "zzz", 2200);
        later(loop, 2600);
      };
      loop();
    },
    wake() {
      if (!sleeping) return;
      sleeping = false;
      for (const id of ACTOR_IDS) actors[id].look = { ...DEFAULT_LOOK[id] };
      commit();
      const ep = scripts.events.wake;
      if (ep) queued = ep;
      if (wakeFn) wakeFn();
    },
    react(detail) {
      if (!alive || host.now() - lastReact < 2500) return;
      const free = ACTOR_IDS.filter((x) => !busy(x));
      if (running) {
        // Saat episode berjalan: hanya tampilkan balon (tanpa mengubah ekspresi/gerak) bila aktor sedang diam.
        const id = detail.who ?? ACTOR_IDS.find((x) => !actors[x].bubble && !motions.has(x)) ?? null;
        if (!id || actors[id].bubble || motions.has(id)) return;
        lastReact = host.now();
        void say(id, detail.text, detail.ms ?? 2200);
        return;
      }
      const id = detail.who ?? (free.length > 0 ? pick(free) : null);
      if (!id || busy(id)) return;
      lastReact = host.now();
      reactNow(id, detail.text, detail.face ?? "talk", detail.ms ?? 2200);
    },
    requestFinale() {
      if (!alive) return;
      if (sleeping) return;
      queued = scripts.finale;
      if (wakeFn) wakeFn();
    },
  };
}
