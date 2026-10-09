"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Tiga maskot orisinal Statistics Story AI. Sprite 16x16 piksel, digambar sebagai SVG
 * (tajam di semua ukuran), tanpa file gambar dan tanpa lisensi pihak ketiga.
 *
 *   sigi : histogram (σ), biru   | elemen AIR   | pemandu utama. Jambul tetesan air.
 *   mu   : kurva lonceng (μ), merah | elemen API   | penjelas / narator. Jambul api.
 *   quin : box plot (kuartil), kuning | elemen PETIR | analis. Antena kilat.
 *   Aturan arena: air > api > petir > air.
 *
 * Tampilan = karakter + pose (gerak tangan/kaki) + ekspresi wajah + aksesori + warna.
 * Pose dan ekspresi bebas dikombinasikan, jadi variasinya banyak tanpa menggambar ulang.
 *
 * Legenda piksel:
 *   . kosong | B badan | A aksen (tangan, kaki, ikon) | S rambut pendek
 *   Y rambut tinggi / garis median | W putih (mata, mulut) | K hitam (pupil)
 */

export type MascotCharacter = "sigi" | "mu" | "quin";
export type MascotPose = "idle" | "walk" | "run" | "wave" | "cheer" | "point" | "read" | "cast" | "charge" | "air" | "cover" | "peek";
export type MascotFace =
  | "smile" | "happy" | "wink" | "think" | "wow" | "sad"
  | "angry" | "sleep" | "cool" | "love" | "flat" | "talk" | "ko" | "hurt";
export type MascotTone = "blue" | "red" | "yellow";
export type MascotOutfit = "none" | "cap" | "glasses";

// Palet per elemen. blue = air, red = api, yellow = petir. E = sorot terang (kilau air, inti api, percikan).
export const TONES: Record<MascotTone, Record<string, string>> = {
  blue: { B: "#003BFF", A: "#5BA8FF", S: "#5BA8FF", Y: "#9CC8FF", W: "#FFFFFF", K: "#000000", E: "#FFFFFF" },
  red: { B: "#FF2E2E", A: "#FF8A00", S: "#FF8A00", Y: "#EBEB00", W: "#FFFFFF", K: "#000000", E: "#FFFFFF" },
  yellow: { B: "#EBEB00", A: "#003BFF", S: "#003BFF", Y: "#003BFF", W: "#FFFFFF", K: "#000000", E: "#FFFFFF" },
};

interface CharacterDef {
  defaultTone: MascotTone;
  armL: number; // kolom tangan kiri (di luar badan)
  armR: number; // kolom tangan kanan
  shape: string[]; // baris 0..12 (kepala + badan, wajah dikosongkan)
  feet: { idle: [string, string]; walkA: [string, string]; walkB: [string, string] };
  cap: Record<number, string>; // baris yang diganti saat memakai topi wisuda
  crestB: Record<number, string>; // baris jambul untuk frame animasi kedua (api berayun, tetesan naik-turun, kilat berkedip)
}

const CAP_STD: Record<number, string> = {
  0: "................",
  1: ".....AAAAAA.....",
  2: "..AAAAAAAAAAAA..",
  3: ".....AAAAAA...Y.",
  4: "....AAAAAAAA..Y.",
};

export const CHARACTERS: Record<MascotCharacter, CharacterDef> = {
  sigi: {
    defaultTone: "blue",
    armL: 2,
    armR: 13,
    shape: [
      ".......YY.......",
      "......YYYY......",
      "......YEYY......",
      "...S..YYYY..S...",
      "..SSS.YYYY.SSS..",
      "....BBBBBBBB....",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "....BBBBBBBB....",
    ],
    feet: {
      idle: ["....AAA..AAA....", "....AAA..AAA...."],
      walkA: ["....AAA..AAA....", ".........AAA...."],
      walkB: ["....AAA..AAA....", "....AAA........."],
    },
    cap: CAP_STD,
    crestB: {
      2: "......YYEY......",
      3: "..SSS.YYYY.SSS..",
      4: "...S..YYYY..S...",
    },
  },
  mu: {
    defaultTone: "red",
    armL: 1,
    armR: 14,
    shape: [
      ".......S........",
      "......SYS.......",
      ".....SYEYS......",
      "......BBBB......",
      ".....BBBBBB.....",
      "....BBBBBBBB....",
      "...BBBBBBBBBB...",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
      "..BBBBBBBBBBBB..",
    ],
    feet: {
      idle: ["..AAA......AAA..", "..AAA......AAA.."],
      walkA: ["..AAA......AAA..", "...........AAA.."],
      walkB: ["..AAA......AAA..", "..AAA..........."],
    },
    cap: {
      0: "................",
      1: "..AAAAAAAAAAAA..",
      2: "....AAAAAAAA..Y.",
      3: "......BBBB....Y.",
    },
    crestB: {
      0: "........S.......",
      1: ".......SYS......",
      2: "......SYEYS.....",
    },
  },
  quin: {
    defaultTone: "yellow",
    armL: 2,
    armR: 13,
    shape: [
      "........AA......",
      ".......AA.......",
      "......AAAA......",
      "........AA......",
      ".......AA.......",
      "...BBBBBBBBBB...",
      "...YYYYYYYYYY...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
      "...BBBBBBBBBB...",
    ],
    feet: {
      idle: ["....AA....AA....", "...AAAA..AAAA..."],
      walkA: ["....AA....AA....", ".........AAAA..."],
      walkB: ["....AA....AA....", "...AAAA........."],
    },
    cap: CAP_STD,
    crestB: {
      1: ".....E.AA.......",
      3: "........AA...E..",
    },
  },
};

// ---------- Ekspresi wajah ----------

type Eyes = "open" | "up" | "closed" | "caret" | "wink" | "wide" | "droop" | "shades" | "heart" | "angry" | "dizzy" | "squint";
type Mouth = "smile" | "flat" | "open" | "grin" | "frown";

interface FaceDef {
  eyes: Eyes;
  mouth: Mouth;
  icon?: "q" | "z";
  canBlink: boolean;
  glasses: boolean; // aman dipakaikan kacamata?
  cap: boolean; // aman dipakaikan topi?
}

export const FACES: Record<MascotFace, FaceDef> = {
  smile: { eyes: "open", mouth: "smile", canBlink: true, glasses: true, cap: true },
  happy: { eyes: "caret", mouth: "grin", canBlink: false, glasses: false, cap: true },
  wink: { eyes: "wink", mouth: "smile", canBlink: false, glasses: true, cap: true },
  think: { eyes: "up", mouth: "flat", icon: "q", canBlink: true, glasses: true, cap: false },
  wow: { eyes: "wide", mouth: "open", canBlink: true, glasses: false, cap: true },
  sad: { eyes: "droop", mouth: "frown", canBlink: true, glasses: true, cap: true },
  angry: { eyes: "angry", mouth: "frown", canBlink: true, glasses: true, cap: true },
  sleep: { eyes: "closed", mouth: "flat", icon: "z", canBlink: false, glasses: true, cap: false },
  cool: { eyes: "shades", mouth: "smile", canBlink: false, glasses: false, cap: true },
  love: { eyes: "heart", mouth: "grin", canBlink: false, glasses: false, cap: true },
  flat: { eyes: "open", mouth: "flat", canBlink: true, glasses: true, cap: true },
  talk: { eyes: "open", mouth: "smile", canBlink: true, glasses: true, cap: true }, // mulut bergantian smile/open
  ko: { eyes: "dizzy", mouth: "open", canBlink: false, glasses: false, cap: true }, // pusing / K.O.
  hurt: { eyes: "squint", mouth: "open", canBlink: false, glasses: false, cap: true }, // terkena serangan
};

// ---------- Pembangun frame ----------

type Grid = string[][];
const toGrid = (rows: string[]): Grid => rows.map((r) => r.split(""));
const put = (g: Grid, r: number, c: number, ch: string) => { if (g[r] && c >= 0 && c < 16) g[r][c] = ch; };
const putAll = (g: Grid, cells: [number, number][], ch: string) => cells.forEach(([r, c]) => put(g, r, c, ch));

function drawEyes(g: Grid, eyes: Eyes) {
  switch (eyes) {
    case "open":
    case "angry":
      putAll(g, [[8, 5], [8, 6], [8, 9], [8, 10], [9, 5], [9, 9]], "W");
      putAll(g, [[9, 6], [9, 10]], "K");
      if (eyes === "angry") putAll(g, [[7, 5], [7, 6], [7, 9], [7, 10]], "K");
      break;
    case "up":
      putAll(g, [[8, 5], [8, 9], [9, 5], [9, 6], [9, 9], [9, 10]], "W");
      putAll(g, [[8, 6], [8, 10]], "K");
      break;
    case "closed":
      putAll(g, [[9, 5], [9, 6], [9, 9], [9, 10]], "K");
      break;
    case "caret":
      putAll(g, [[8, 6], [8, 10], [9, 5], [9, 7], [9, 9], [9, 11]], "W");
      break;
    case "wink":
      putAll(g, [[8, 5], [8, 6], [9, 5]], "W");
      put(g, 9, 6, "K");
      putAll(g, [[9, 9], [9, 10]], "K");
      break;
    case "wide":
      putAll(g, [[7, 5], [7, 6], [7, 9], [7, 10], [8, 5], [8, 6], [8, 9], [8, 10], [9, 5], [9, 6], [9, 9], [9, 10]], "W");
      putAll(g, [[8, 6], [8, 10]], "K");
      break;
    case "droop":
      putAll(g, [[9, 5], [9, 9]], "W");
      putAll(g, [[9, 6], [9, 10]], "K");
      break;
    case "shades":
      for (let c = 4; c <= 11; c++) put(g, 8, c, "K");
      putAll(g, [[9, 5], [9, 6], [9, 9], [9, 10]], "K");
      break;
    case "dizzy":
      putAll(g, [[8, 6], [9, 5], [8, 9], [9, 10]], "W");
      putAll(g, [[8, 5], [9, 6], [8, 10], [9, 9]], "K");
      break;
    case "squint":
      putAll(g, [[7, 5], [8, 6], [9, 5], [7, 10], [8, 9], [9, 10]], "K");
      break;
    case "heart":
      putAll(g, [[7, 4], [7, 6], [7, 9], [7, 11], [8, 4], [8, 5], [8, 6], [8, 9], [8, 10], [8, 11], [9, 5], [9, 10]], "A");
      break;
  }
}

function drawMouth(g: Grid, mouth: Mouth) {
  switch (mouth) {
    case "smile": putAll(g, [[11, 6], [11, 9], [12, 7], [12, 8]], "W"); break;
    case "flat": putAll(g, [[11, 7], [11, 8]], "W"); break;
    case "open": putAll(g, [[11, 7], [11, 8], [12, 7], [12, 8]], "W"); break;
    case "grin": putAll(g, [[11, 6], [11, 7], [11, 8], [11, 9], [12, 7], [12, 8]], "W"); break;
    case "frown": putAll(g, [[11, 7], [11, 8], [12, 6], [12, 9]], "W"); break;
  }
}

function drawIcon(g: Grid, icon: "q" | "z") {
  const cells: [number, number][] =
    icon === "q"
      ? [[0, 12], [0, 13], [0, 14], [1, 14], [2, 13], [4, 13]]
      : [[0, 12], [0, 13], [0, 14], [1, 14], [2, 13], [3, 12], [4, 12], [4, 13], [4, 14]];
  putAll(g, cells, "A");
}

function drawGlasses(g: Grid) {
  const snap = (r: number) => [g[r][5], g[r][6], g[r][9], g[r][10]];
  const e8 = snap(8);
  const e9 = snap(9);
  for (let c = 4; c <= 11; c++) { put(g, 7, c, "Y"); put(g, 10, c, "Y"); }
  [4, 7, 8, 11].forEach((c) => { put(g, 8, c, "Y"); put(g, 9, c, "Y"); });
  [5, 6, 9, 10].forEach((c, i) => { put(g, 8, c, e8[i]); put(g, 9, c, e9[i]); });
}

export interface FrameOptions {
  character: MascotCharacter;
  variant: "idle" | "walkA" | "walkB" | "wave1" | "wave2" | "cheer" | "point" | "read" | "cast" | "charge" | "air" | "cover" | "peek";
  face: MascotFace;
  blink: boolean;
  talkOpen: boolean;
  outfit: MascotOutfit;
  /** Frame animasi jambul (0 atau 1). */
  crest?: 0 | 1;
}

export function buildFrameRows(o: FrameOptions): string[] {
  const ch = CHARACTERS[o.character];
  const face = FACES[o.face];
  const feet = o.variant === "walkA" ? ch.feet.walkA : o.variant === "walkB" ? ch.feet.walkB : ch.feet.idle;
  const g = toGrid([...ch.shape, ...feet, "................"]);
  if (o.crest === 1) Object.entries(ch.crestB).forEach(([r, row]) => { g[Number(r)] = row.split(""); });

  // Wajah: mata, mulut, ikon
  let eyes = face.eyes;
  if (o.blink && face.canBlink) eyes = "closed";
  if (o.blink && face.canBlink && face.eyes === "wide") {
    putAll(g, [[7, 5], [7, 6], [7, 9], [7, 10], [8, 5], [8, 6], [8, 9], [8, 10]], "B");
  }
  drawEyes(g, eyes);
  if (face.eyes === "angry" && eyes === "closed") putAll(g, [[7, 5], [7, 6], [7, 9], [7, 10]], "K"); // alis tetap saat berkedip
  drawMouth(g, o.face === "talk" ? (o.talkOpen ? "open" : "smile") : face.mouth);
  if (face.icon) drawIcon(g, face.icon);

  // Pose: tangan
  const L = ch.armL;
  const R = ch.armR;
  const arm = (col: number, from: number, to: number) => { for (let r = from; r <= to; r++) put(g, r, col, "A"); };
  switch (o.variant) {
    case "wave1": put(g, 10, L, "A"); arm(R, 7, 9); break;
    case "wave2": put(g, 10, L, "A"); arm(R, 6, 8); break;
    case "cheer": arm(L, 7, 9); arm(R, 7, 9); break;
    case "point": put(g, 10, L, "A"); for (let c = R; c <= 15; c++) put(g, 10, c, "A"); break;
    case "cast": // lengan depan menghentak (tebal), lengan belakang menahan
      arm(L, 8, 9);
      for (let c = R; c <= 15; c++) { put(g, 9, c, "A"); put(g, 10, c, "A"); }
      break;
    case "charge": // kedua tangan terangkat tinggi, mengumpulkan tenaga
      arm(L, 5, 8);
      arm(R, 5, 8);
      break;
    case "cover": // kedua tangan menutupi mata
      for (const r of [8, 9]) for (const c of [4, 5, 6, 9, 10, 11]) put(g, r, c, "A");
      break;
    case "peek": // satu tangan menutup mata kiri, mata kanan mengintip
      for (const r of [8, 9]) for (const c of [4, 5, 6]) put(g, r, c, "A");
      put(g, 10, R, "A");
      break;
    case "air": // melayang: tangan terbuka, kaki terangkat
      arm(L, 8, 9);
      arm(R, 8, 9);
      g[14] = ".".repeat(16).split("");
      break;
    default: put(g, 10, L, "A"); put(g, 10, R, "A");
  }
  if (o.variant === "read") {
    for (let c = 5; c <= 10; c++) { put(g, 10, c, "W"); put(g, 12, c, "W"); }
    put(g, 11, 5, "W"); put(g, 11, 10, "W");
    for (let c = 6; c <= 9; c++) put(g, 11, c, "K");
  }

  // Aksesori
  if (o.outfit === "cap" && face.cap) {
    Object.entries(ch.cap).forEach(([r, row]) => { g[Number(r)] = row.split(""); });
  }
  if (o.outfit === "glasses" && face.glasses) drawGlasses(g);

  return g.map((r) => r.join(""));
}

interface Rect { x: number; y: number; w: number; ch: string }
const RECT_CACHE = new Map<string, Rect[]>();

// Gabungkan piksel sewarna berurutan dalam satu baris menjadi satu <rect>.
function getRects(o: FrameOptions): Rect[] {
  const key = `${o.character}|${o.variant}|${o.face}|${o.blink ? 1 : 0}|${o.talkOpen ? 1 : 0}|${o.outfit}|${o.crest ?? 0}`;
  const cached = RECT_CACHE.get(key);
  if (cached) return cached;
  const rects: Rect[] = [];
  buildFrameRows(o).forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === ".") { x++; continue; }
      let w = 1;
      while (x + w < row.length && row[x + w] === c) w++;
      rects.push({ x, y, w, ch: c });
      x += w;
    }
  });
  RECT_CACHE.set(key, rects);
  return rects;
}

// ---------- Komponen ----------

const SEQUENCE: Record<MascotPose, { variants: FrameOptions["variant"][]; ms: number }> = {
  idle: { variants: ["idle"], ms: 500 },
  walk: { variants: ["walkA", "idle", "walkB", "idle"], ms: 150 },
  run: { variants: ["walkA", "walkB"], ms: 90 },
  wave: { variants: ["wave1", "wave2"], ms: 260 },
  cheer: { variants: ["cheer", "idle"], ms: 420 },
  point: { variants: ["point"], ms: 450 },
  read: { variants: ["read"], ms: 700 },
  cast: { variants: ["cast"], ms: 400 },
  charge: { variants: ["charge"], ms: 400 },
  air: { variants: ["air"], ms: 400 },
  cover: { variants: ["cover"], ms: 400 },
  peek: { variants: ["peek"], ms: 400 },
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

// Urutan ekspresi saat maskot diklik (mode interactive).
const FACE_CYCLE: MascotFace[] = ["wow", "happy", "love", "wink", "cool", "sad", "angry", "think", "sleep", "ko", "hurt"];

interface MascotProps {
  character?: MascotCharacter;
  pose?: MascotPose;
  face?: MascotFace;
  tone?: MascotTone; // default mengikuti karakter
  outfit?: MascotOutfit;
  flip?: boolean;
  /** true = klik maskot untuk berganti ekspresi selama sekitar 2 detik. Jangan beri pointer-events-none di className. */
  interactive?: boolean;
  /** Kelipatan bulat dari 16px agar piksel tetap tajam: w-12 (3x), w-16 (4x), w-20 (5x), w-24 (6x). */
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  character = "sigi",
  pose = "idle",
  face = "smile",
  tone,
  outfit = "none",
  flip = false,
  interactive = false,
  className = "w-16 h-16",
}) => {
  const ref = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);
  const [blink, setBlink] = useState(false);
  const [crest, setCrest] = useState<0 | 1>(0);
  const [override, setOverride] = useState<MascotFace | null>(null);
  const visible = useRef(false);
  const clicks = useRef(0);
  const overrideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (overrideTimer.current) clearTimeout(overrideTimer.current); }, []);

  const onClick = () => {
    const next = FACE_CYCLE[clicks.current % FACE_CYCLE.length];
    clicks.current += 1;
    setOverride(next);
    if (overrideTimer.current) clearTimeout(overrideTimer.current);
    overrideTimer.current = setTimeout(() => setOverride(null), 2200);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(el);
    if (reduced) return () => io.disconnect();

    const seq = SEQUENCE[pose];
    const needsTick = seq.variants.length > 1 || face === "talk";
    const interval = needsTick
      ? setInterval(() => { if (visible.current) setTick((t) => t + 1); }, face === "talk" ? Math.min(seq.ms, 220) : seq.ms)
      : undefined;

    // Jambul elemen bergoyang (api berayun, tetesan naik-turun, kilat berkedip), tiap 280ms.
    const crestTimer = setInterval(() => { if (visible.current) setCrest((c) => (c === 0 ? 1 : 0)); }, 280);

    // Kedip acak tiap 2-4,5 detik, mata tertutup 140ms.
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleBlink = () => {
      blinkTimer = setTimeout(() => {
        if (visible.current) {
          setBlink(true);
          openTimer = setTimeout(() => setBlink(false), 140);
        }
        scheduleBlink();
      }, rand(2000, 4500));
    };
    scheduleBlink();

    return () => {
      if (interval) clearInterval(interval);
      clearInterval(crestTimer);
      if (blinkTimer) clearTimeout(blinkTimer);
      if (openTimer) clearTimeout(openTimer);
      io.disconnect();
    };
  }, [pose, face]);

  const seq = SEQUENCE[pose];
  const variant = seq.variants[tick % seq.variants.length];
  const palette = TONES[tone ?? CHARACTERS[character].defaultTone];
  const activeFace = override ?? face;
  const rects = getRects({ character, variant, face: activeFace, blink, talkOpen: tick % 2 === 0, outfit, crest });

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={interactive ? `${className} cursor-pointer` : className}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      onClick={interactive ? onClick : undefined}
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={palette[r.ch]} />
      ))}
    </svg>
  );
};
