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

export type Fx = "pow" | "heart" | "sweat" | "anger" | "stars" | "spark";
export type ProjectileKind = "bubble" | "tide" | "fireball" | "orb";
export type BeamKind = "jet" | "flame" | "bolt";
export type BurstKind = "splash" | "blast" | "shock" | "steam" | "puff" | "geyser" | "pillar";

export interface Look { pose: MascotPose; face: MascotFace; outfit: MascotOutfit; aura?: boolean }

/** Angka 0..1 = posisi pada lebar layar. near = berdiri di sebelah aktor lain. meet = bertemu di titik tengah. */
export type Target = number | { near: ActorId; gap: number } | { meet: ActorId; gap: number };

export type Action = (
  | { who: ActorId; walk: Target; run?: boolean; speed?: number } // menunggu sampai tiba
  | { who: ActorId; say: Text; ms?: number } // menunggu sampai balon hilang
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
  | { who: ActorId; strike: { kind: "geyser" | "pillar" | "thunder"; at: ActorId | number; ms?: number } } // jurus area
  | { burst: { kind: BurstKind; at: ActorId | number; y?: number; ms?: number } } // ledakan/efek, instan
  | { wait: number }
) & { after?: number }; // after = tunda sekian ms sebelum aksi ini dimulai

/** Semua aksi dalam satu langkah berjalan bersamaan; langkah selesai setelah semua aksi yang menunggu selesai. */
export type Step = Action[];

export interface Episode {
  id: string;
  weight: number;
  /** Id section tempat episode ini lebih sering dipilih ("footer" untuk <footer>). */
  sections?: string[];
  steps: Step[];
}

export interface Scripts {
  episodes: Episode[];
  finale: Episode;
  poke: Text[];
  pokeReply: Text[];
}

export interface Bubble { text: string; shift: number; key: number }
export interface FxState { kind: Fx; key: number }
export interface ActorUi {
  look: Look;
  dir: 1 | -1;
  bubble: Bubble | null;
  fx: FxState | null;
  hop: number;
  /** true bila sedang melayang di udara tanpa bergerak (efek goyang pelan) */
  hover: boolean;
}
export interface ProjectileUi {
  key: number; kind: ProjectileKind; x0: number; y0: number; x1: number; y1: number; ms: number; dir: 1 | -1; arc: number;
}
export interface BeamUi { key: number; kind: BeamKind; points: [number, number][]; ms: number }
export interface BurstUi { key: number; kind: BurstKind; x: number; y: number; ms: number }
export interface UiState {
  actors: Record<ActorId, ActorUi>;
  projectiles: ProjectileUi[];
  beams: BeamUi[];
  bursts: BurstUi[];
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
}

export const DEFAULT_LOOK: Record<ActorId, Look> = {
  sigi: { pose: "idle", face: "smile", outfit: "none", aura: false },
  mu: { pose: "idle", face: "smile", outfit: "none", aura: false },
  quin: { pose: "idle", face: "smile", outfit: "glasses", aura: false },
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
  | { type: "speed"; target: number; speed: number; auto: "walk" | "run" | null; resolve: () => void }
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

  const actors = {} as Record<ActorId, Actor>;
  for (const id of ACTOR_IDS) {
    actors[id] = {
      x: 0, y: 0, dir: 1, look: { ...DEFAULT_LOOK[id] }, bubble: null, fx: null, hop: 0, reactUntil: 0, idleToken: 0, hovering: false,
    };
  }

  const rand = (a: number, b: number) => a + host.random() * (b - a);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(host.random() * arr.length)];

  const commit = () => {
    const out = {} as Record<ActorId, ActorUi>;
    for (const id of ACTOR_IDS) {
      const a = actors[id];
      out[id] = {
        look: { ...a.look }, dir: a.dir, bubble: a.bubble, fx: a.fx, hop: a.hop,
        hover: a.hovering && !motions.has(id),
      };
    }
    host.onCommit({ actors: out, projectiles: [...projectiles], beams: [...beams], bursts: [...bursts] });
  };

  const later = (fn: () => void, ms: number) => {
    const id = host.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };
  const sleep = (ms: number) => new Promise<void>((resolve) => { later(resolve, ms); });

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
        }
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
          if (m.autoEnd === "idle") a.look = { ...a.look, pose: "idle", aura: m.aura === null ? a.look.aura : false };
          else if (m.autoEnd === "air") a.look = { ...a.look, pose: "air", aura: true };
          commit();
          m.resolve();
        }
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
  const say = async (id: ActorId, text: Text, ms?: number) => {
    const a = actors[id];
    const str = text[host.lang()];
    const dur = ms ?? Math.max(1700, Math.min(4300, 900 + str.length * 55));
    const key = ++keyCounter;
    const W = host.width();
    const c = a.x + size() / 2;
    let shift = 0;
    if (c - 96 < 8) shift = 8 - (c - 96);
    else if (c + 96 > W - 8) shift = W - 8 - (c + 96);
    a.bubble = { text: str, shift, key };
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

  const doStrike = async (s: { kind: "geyser" | "pillar" | "thunder"; at: ActorId | number; ms?: number }) => {
    const x = atX(s.at);
    const ms = s.ms ?? 900;
    if (s.kind === "thunder") {
      const top = host.height();
      const key = ++keyCounter;
      beams.push({ key, kind: "bolt", points: jag(x, top, x, size() * 0.2, 12, 22), ms: Math.min(ms, 520) });
      commit();
      later(() => addBurst("shock", x, size() * 0.3, 600), 120);
      await sleep(ms);
      beams = beams.filter((b) => b.key !== key);
      commit();
      return;
    }
    addBurst(s.kind, x, 0, ms);
    await sleep(ms);
  };

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
      actor.look = { ...actor.look, ...a.set };
      commit();
      return;
    }
    if ("turn" in a) {
      const t = a.turn;
      actor.dir = t === "left" ? -1 : t === "right" ? 1 : actors[t].x >= actor.x ? 1 : -1;
      commit();
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
      await say(a.who, a.say, a.ms);
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
      await move(a.who, targetX(a.who, a.dash), DASH, null);
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
    const airborne = ACTOR_IDS.filter((id) => actors[id].y > 0.5);
    if (airborne.length > 0) await Promise.all(airborne.map((id) => tween(id, { x1: actors[id].x, y1: 0, dur: 450, ease: "in", start: "air", end: "idle", aura: false })));
    projectiles = [];
    beams = [];
    for (const id of ACTOR_IDS) {
      const a = actors[id];
      a.look = { ...DEFAULT_LOOK[id] };
      a.bubble = null;
      a.fx = null;
      a.hovering = false;
    }
    commit();
  };

  async function runEpisode(ep: Episode) {
    lastEpisode = ep.id;
    host.debug?.(`start ${ep.id}`);
    for (const step of ep.steps) {
      if (!alive) return;
      await Promise.all(step.map(perform));
    }
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
      const ep = queued ?? pickEpisode();
      queued = null;
      if (ep) {
        running = true;
        await runEpisode(ep);
        running = false;
      }
      await nap(rand(5000, 9000));
    }
  };

  // ---------- Berkeliaran saat tidak ada episode ----------
  const wander = () => {
    if (!alive) return;
    if (!running) {
      const free = ACTOR_IDS.filter((id) => !motions.has(id) && !actors[id].bubble && host.now() >= actors[id].reactUntil);
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
      if (!alive) return;
      const a = actors[id];
      a.hop++;
      if (busy(id)) {
        // Saat episode berjalan: hanya melompat dan berkilau, tanpa mengganggu skrip.
        if (!a.fx) showFx(id, "spark", 800);
        else commit();
        return;
      }
      reactNow(id, pick(scripts.poke), pick<MascotFace>(["wow", "happy", "wink", "love"]), 1900);
      const others = ACTOR_IDS.filter((o) => o !== id && !busy(o));
      if (others.length > 0) {
        const o = pick(others);
        later(() => {
          if (!running && !busy(o)) {
            actors[o].dir = actors[id].x >= actors[o].x ? 1 : -1;
            reactNow(o, pick(scripts.pokeReply), "talk", 1900);
          }
        }, 1500);
      }
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
      queued = scripts.finale;
      if (wakeFn) wakeFn();
    },
  };
}
