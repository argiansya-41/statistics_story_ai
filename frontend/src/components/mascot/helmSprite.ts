/**
 * Komposer sprite maskot "helm" (Sigi, Mu, Quin). Murni logika, tanpa React/DOM, sehingga bisa diuji
 * di Node dan dipakai ulang oleh Mascot.tsx.
 *
 * Desain mengikuti papan konsep `public/mascots/konsep-maskot-helm.png`:
 *   - Kerangka chibi identik (helm bulat, pelat wajah, badan 3 baris, tangan berbentuk "+", dua kaki).
 *   - Yang membedakan hanya jambul, warna, dan susunan badan.
 *   - Mata dan mulut adalah LUBANG transparan di pelat wajah (tampak hitam di latar gelap, putih di latar terang).
 *   - Cincin putih putus-putus di sekeliling siluet dibangkitkan lewat rumus: batas luar dilasi siluet
 *     berradius 2 (jarak 1 piksel kosong dari badan). Rumus ini sudah diuji cocok dengan gambar konsep.
 *
 * Kanvas 24x24 sel. Sprite lokal berukuran 16x22 digeser (OX, OY) supaya tangan yang terangkat
 * dan cincin tetap muat. Koordinat "lokal" di bawah ini mengacu ke sprite 16x22 tersebut.
 */

export type HelmCharacter = "sigi" | "mu" | "quin";

export type HelmFace =
  | "smile" | "happy" | "wink" | "think" | "wow" | "sad"
  | "angry" | "sleep" | "cool" | "love" | "flat" | "talk" | "ko" | "hurt"
  | "smug" | "shout" | "cry";

export type HelmOutfit = "none" | "cap" | "glasses" | "crown" | "scarf";

export type HelmVariant =
  | "idle" | "walkA" | "walkB" | "runA" | "runB"
  | "wave1" | "wave2" | "cheer" | "cheer2" | "charge" | "point" | "cast"
  | "air" | "read" | "cover" | "peek" | "sit"
  | "danceA" | "danceB" | "clapA" | "clapB";

/** x, y, lebar, tinggi (dalam sel), warna. */
export type Rect = [number, number, number, number, string];

export const GRID_W = 24;
export const GRID_H = 24;
const OX = 4;
const OY = 2;

export interface HelmPalette {
  head: string; // warna utama helm
  hi: string; // kilau helm di kiri atas
  face: string; // pelat wajah
  torso1: string; // dada
  torso2: string; // perut
  belt: string; // sabuk
  limb: string; // tangan dan kaki
  c1: string; // warna jambul 1
  c2: string; // warna jambul 2
  fx: string; // warna efek elemen
}

export const WHITE = "#ffffff";

/** Warna diambil langsung dari gambar konsep. */
export const HELM_PALETTES: Record<HelmCharacter, HelmPalette> = {
  sigi: { head: "#003bff", hi: "#5ba8ff", face: "#cfe6ff", torso1: "#1e4fe0", torso2: "#0a2fc4", belt: "#ffffff", limb: "#5ba8ff", c1: "#9cc8ff", c2: "#9cc8ff", fx: "#5ba8ff" },
  mu: { head: "#ff2e2e", hi: "#ff8a5c", face: "#ffe9a0", torso1: "#ff2e2e", torso2: "#b31212", belt: "#ebeb00", limb: "#ff8a00", c1: "#ff8a00", c2: "#ebeb00", fx: "#ff8a00" },
  quin: { head: "#ebeb00", hi: "#fff68a", face: "#ffffff", torso1: "#5b7bff", torso2: "#003bff", belt: "#ebeb00", limb: "#003bff", c1: "#003bff", c2: "#ebeb00", fx: "#ebeb00" },
};

// ---------------------------------------------------------------------------------------------
// Jambul (dua frame untuk animasi). Slot: 1 = c1, 2 = c2, 3 = putih.
// ---------------------------------------------------------------------------------------------
type CrestCell = [number, number, 1 | 2 | 3];

const CREST: Record<HelmCharacter, [CrestCell[], CrestCell[]]> = {
  // Tetesan air dengan dua percikan di sisi kepala. Frame B memanjang dan percikan terangkat.
  sigi: [
    [[7, 3, 1], [8, 3, 1], [8, 4, 1], [3, 5, 1], [6, 5, 1], [7, 5, 1], [8, 5, 1], [9, 5, 1], [12, 5, 1]],
    [[8, 2, 1], [7, 3, 1], [8, 3, 1], [8, 4, 1], [3, 4, 1], [6, 5, 1], [7, 5, 1], [8, 5, 1], [9, 5, 1], [12, 4, 1]],
  ],
  // Lidah api. Frame B lebih tinggi dan condong ke kanan.
  mu: [
    [[8, 2, 1], [7, 3, 1], [8, 3, 2], [7, 4, 1], [8, 4, 2], [9, 4, 1], [6, 5, 1], [7, 5, 2], [8, 5, 3], [9, 5, 2], [10, 5, 1]],
    [[9, 1, 1], [8, 2, 1], [9, 2, 2], [7, 3, 1], [8, 3, 2], [9, 3, 1], [7, 4, 1], [8, 4, 2], [9, 4, 1], [6, 5, 1], [7, 5, 2], [8, 5, 3], [9, 5, 2], [10, 5, 1]],
  ],
  // Antena kilat. Frame B menyalakan dua percikan kuning.
  quin: [
    [[9, 2, 1], [10, 2, 1], [8, 3, 1], [7, 4, 1], [8, 4, 1], [9, 4, 1], [10, 4, 1], [8, 5, 1], [9, 5, 1]],
    [[9, 2, 1], [10, 2, 1], [8, 3, 1], [7, 4, 1], [8, 4, 1], [9, 4, 1], [10, 4, 1], [8, 5, 1], [9, 5, 1], [11, 2, 2], [10, 1, 2]],
  ],
};

/** Piksel cincin gambar tangan di sekitar jambul frame A pada gambar konsep (rumus dilasi melewatkannya). */
const RING_PATCH: Record<HelmCharacter, [number, number][]> = {
  sigi: [[5, 4], [7, 4], [10, 4]],
  mu: [[5, 4]],
  quin: [[9, 3]],
};

// ---------------------------------------------------------------------------------------------
// Pose: posisi tangan (pusat tanda +), geser badan, dan bentuk kaki.
// ---------------------------------------------------------------------------------------------
type Legs = "stand" | "stepL" | "stepR" | "air" | "wide" | "sit";
interface PoseDef {
  dy?: number;
  L: [number, number];
  R: [number, number];
  frontL?: boolean;
  frontR?: boolean;
  legs?: Legs;
  book?: boolean;
}

const SHOULDER_L: [number, number] = [4, 16];
const SHOULDER_R: [number, number] = [11, 16];

export const POSES: Record<HelmVariant, PoseDef> = {
  idle: { L: [3, 16], R: [12, 16] },
  walkA: { L: [3, 17], R: [12, 15], legs: "stepL" },
  walkB: { L: [3, 15], R: [12, 17], legs: "stepR" },
  runA: { dy: -1, L: [2, 14], R: [13, 18], legs: "stepL" },
  runB: { L: [2, 18], R: [13, 14], legs: "stepR" },
  wave1: { L: [3, 16], R: [15, 11] },
  wave2: { L: [3, 16], R: [16, 9] },
  cheer: { L: [-1, 9], R: [16, 9] },
  cheer2: { dy: -1, L: [-1, 8], R: [16, 8], legs: "air" },
  charge: { L: [-1, 8], R: [16, 8], legs: "wide" },
  point: { L: [3, 16], R: [16, 15] },
  cast: { L: [1, 18], R: [16, 14], legs: "wide" },
  air: { L: [0, 13], R: [15, 13], legs: "air" },
  read: { L: [4, 17], R: [11, 17], frontL: true, frontR: true, book: true },
  cover: { L: [5, 10], R: [10, 10], frontL: true, frontR: true },
  peek: { L: [5, 10], R: [12, 16], frontL: true },
  sit: { dy: 1, L: [3, 17], R: [12, 17], legs: "sit" },
  danceA: { L: [0, 8], R: [13, 17], legs: "stepL" },
  danceB: { dy: -1, L: [2, 17], R: [15, 8], legs: "stepR" },
  clapA: { L: [7, 15], R: [8, 15], frontL: true, frontR: true },
  clapB: { L: [3, 15], R: [12, 15] },
};

// ---------------------------------------------------------------------------------------------
// Pelat wajah 8x5 (fx 0..7, fy 0..4). Pelat berbentuk segi delapan: baris 0 dan 4 hanya fx 1..6.
// Awalnya semua sel terisi warna wajah ("f"). Wajah membuat lubang ("h") atau tinta berwarna.
// ---------------------------------------------------------------------------------------------
type FCell = "f" | "h" | string;
const PLATE_X0 = 4;
const PLATE_Y0 = 8;
const inPlate = (fx: number, fy: number) => fy >= 0 && fy <= 4 && (fy === 0 || fy === 4 ? fx >= 1 && fx <= 6 : fx >= 0 && fx <= 7);

const INK = "#10101c";
/** Warna mata dan mulut pada mode "ink". Hitam murni, sama dengan latar panel kiri gambar konsep. */
export const EYE_INK = "#000000";
const BROW = "#2a1020";
const PINK = "#ff6fa8";
const TEAR = "#7fc4ff";

interface FaceCtx {
  blink: boolean;
  talkOpen: boolean;
  shout: boolean;
  isCover?: boolean;
  isPeek?: boolean;
}

function paintFace(face: HelmFace, ctx: FaceCtx): FCell[][] {
  const F: FCell[][] = Array.from({ length: 5 }, (_, fy) => Array.from({ length: 8 }, (_, fx) => (inPlate(fx, fy) ? "f" : "")));
  const h = (...pts: [number, number][]) => pts.forEach(([x, y]) => { if (inPlate(x, y)) F[y][x] = "h"; });
  const ink = (c: string, ...pts: [number, number][]) => pts.forEach(([x, y]) => { if (inPlate(x, y)) F[y][x] = c; });

  const eyesOpen = () => {
    if (ctx.isCover) {
      // Saat pose tutup mata, mata di balik tangan tertutup rapat
      h([1, 2], [2, 2], [5, 2], [6, 2]);
    } else if (ctx.isPeek) {
      // Mata kiri tertutup rapat di balik tangan, mata kanan terbuka mengintip
      h([1, 2], [2, 2], [5, 1], [6, 1], [5, 2], [6, 2]);
    } else if (ctx.blink) {
      h([1, 2], [2, 2], [5, 2], [6, 2]);
    } else {
      h([1, 1], [2, 1], [1, 2], [2, 2], [5, 1], [6, 1], [5, 2], [6, 2]);
    }
  };
  const mouthSmall = () => h([3, 3], [4, 3]);
  const mouthOpen = () => h([3, 3], [4, 3], [3, 4], [4, 4]);
  const mouthWide = () => h([2, 3], [3, 3], [4, 3], [5, 3], [3, 4], [4, 4]);
  const squintEyes = () => h([1, 1], [2, 2], [1, 3], [6, 1], [5, 2], [6, 3]); // > <

  switch (face) {
    case "smile":
      eyesOpen();
      if (ctx.shout) mouthOpen(); else mouthSmall();
      break;
    case "flat":
      eyesOpen();
      if (ctx.shout) mouthOpen();
      break;
    case "talk":
      eyesOpen();
      if (ctx.talkOpen) mouthOpen(); else mouthSmall();
      break;
    case "happy":
      h([2, 1], [1, 2], [3, 2], [5, 1], [4, 2], [6, 2]);
      mouthSmall();
      break;
    case "wink":
      h([1, 2], [2, 2]);
      if (ctx.blink) h([5, 2], [6, 2]); else h([5, 1], [6, 1], [5, 2], [6, 2]);
      mouthSmall();
      break;
    case "think":
      h([1, 2], [2, 2], [5, 1], [6, 1], [5, 2], [6, 2]);
      h([4, 3], [5, 3]);
      break;
    case "wow":
      h([1, 1], [2, 1], [1, 2], [2, 2], [1, 3], [2, 3], [5, 1], [6, 1], [5, 2], [6, 2], [5, 3], [6, 3]);
      h([3, 4], [4, 4]);
      break;
    case "sad":
      h([2, 1], [1, 2], [2, 2], [5, 1], [5, 2], [6, 2]);
      h([3, 3], [4, 3], [2, 4], [5, 4]);
      ink(TEAR, [1, 3]);
      break;
    case "cry":
      h([1, 2], [2, 2], [5, 2], [6, 2]);
      mouthOpen();
      ink(TEAR, [1, 3], [6, 3], [0, 3], [7, 3]);
      break;
    case "sleep":
      h([1, 2], [2, 2], [5, 2], [6, 2]);
      mouthSmall();
      break;
    case "cool":
      mouthSmall();
      break;
    case "love":
      ink(PINK, [0, 1], [2, 1], [0, 2], [1, 2], [2, 2], [1, 3], [5, 1], [7, 1], [5, 2], [6, 2], [7, 2], [6, 3]);
      mouthSmall();
      break;
    case "angry":
      if (ctx.blink) h([1, 2], [2, 2], [5, 2], [6, 2]);
      else h([1, 1], [1, 2], [2, 2], [6, 1], [5, 2], [6, 2]);
      ink(BROW, [1, 0], [2, 0], [5, 0], [6, 0]);
      if (ctx.shout) mouthOpen(); else h([3, 3], [4, 3]);
      break;
    case "shout":
      h([1, 1], [1, 2], [2, 2], [6, 1], [5, 2], [6, 2]);
      ink(BROW, [1, 0], [2, 0], [5, 0], [6, 0]);
      mouthWide();
      break;
    case "hurt":
      squintEyes();
      break;
    case "ko":
      h([0, 1], [2, 1], [1, 2], [0, 3], [2, 3], [5, 1], [7, 1], [6, 2], [5, 3], [7, 3]);
      h([3, 4], [4, 4]);
      break;
    case "smug":
      h([1, 2], [2, 2], [5, 2], [6, 2]);
      ink(BROW, [5, 1], [6, 1]);
      h([3, 3], [4, 3], [5, 3]);
      break;
  }
  return F;
}

// ---------------------------------------------------------------------------------------------
// Opsi dan pembangun frame
// ---------------------------------------------------------------------------------------------
export interface HelmOptions {
  /** Menentukan bentuk jambul. */
  character: HelmCharacter;
  /** Menentukan warna. Bila beda dari character, maskot memakai warna karakter lain. */
  palette?: HelmCharacter;
  variant: HelmVariant;
  face: HelmFace;
  blink?: boolean;
  talkOpen?: boolean;
  outfit?: HelmOutfit;
  /** Frame animasi jambul. */
  crest?: 0 | 1;
  /**
   * "ink" (bawaan): mata dan mulut berupa piksel hitam, terbaca di latar terang maupun gelap.
   * "hole": lubang transparan persis panel kanan gambar konsep (wajah putih Quin sulit terbaca di latar terang).
   */
  eyes?: "ink" | "hole";
}

type Cell = string | null;
const makeGrid = (): Cell[][] => Array.from({ length: GRID_H }, () => Array<Cell>(GRID_W).fill(null));

/** Garis piksel dari (x0,y0) ke (x1,y1). */
function line(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const out: [number, number][] = [];
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy, x = x0, y = y0;
  for (let i = 0; i < 64; i++) {
    out.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return out;
}

const DISC2: [number, number][] = [];
for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 4) DISC2.push([dx, dy]);

/** Cincin: batas luar (tetangga-4) dari dilasi siluet berradius 2. */
export function ringCells(solid: boolean[][]): [number, number][] {
  const H = solid.length, W = solid[0].length;
  const D = Array.from({ length: H }, () => Array<boolean>(W).fill(false));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (solid[y][x]) for (const [dx, dy] of DISC2) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < W && yy >= 0 && yy < H) D[yy][xx] = true; }
  const out: [number, number][] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!D[y][x] || solid[y][x]) continue;
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1 || !D[y][x - 1] || !D[y][x + 1] || !D[y - 1][x] || !D[y + 1][x];
      if (edge) out.push([x, y]);
    }
  return out;
}

/** Hasil mentah: grid warna (null = transparan). Dipakai untuk pengujian dan untuk dibuat jadi rect. */
export function buildHelmGrid(o: HelmOptions): Cell[][] {
  const pal = HELM_PALETTES[o.palette ?? o.character];
  const pose = POSES[o.variant];
  const outfit = o.outfit ?? "none";
  const crestFrame = o.crest ?? 0;
  const g = makeGrid();
  const fxCells: [number, number, string][] = [];

  const bodyDy = pose.dy ?? 0;
  const breathe = o.variant === "idle" && crestFrame === 1 ? 1 : 0;
  const headDy = bodyDy + breathe;

  const set = (lx: number, ly: number, c: Cell) => {
    const x = lx + OX, y = ly + OY;
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) g[y][x] = c;
  };
  const row = (lx0: number, lx1: number, ly: number, c: Cell) => { for (let x = lx0; x <= lx1; x++) set(x, ly, c); };
  const plus = (cx: number, cy: number, c: string) => {
    set(cx, cy, c); set(cx - 1, cy, c); set(cx + 1, cy, c); set(cx, cy - 1, c); set(cx, cy + 1, c);
  };
  const arm = (side: "L" | "R", c: string) => {
    const [sx, sy] = side === "L" ? SHOULDER_L : SHOULDER_R;
    const [hx, hy] = pose[side];
    for (const [x, y] of line(sx, sy + bodyDy, hx, hy + bodyDy)) set(x, y, c);
  };

  // 1. Kaki (di belakang badan)
  const legsKind = pose.legs ?? "stand";
  const legRows = (x0: number, x1: number, y0: number, y1: number) => { for (let y = y0; y <= y1; y++) row(x0, x1, y + bodyDy, pal.limb); };
  switch (legsKind) {
    case "stand": legRows(5, 6, 18, 19); legRows(9, 10, 18, 19); break;
    case "stepL": legRows(5, 6, 17, 18); legRows(9, 10, 18, 19); break;
    case "stepR": legRows(5, 6, 18, 19); legRows(9, 10, 17, 18); break;
    case "wide": legRows(4, 5, 18, 19); legRows(10, 11, 18, 19); break;
    case "air": legRows(4, 5, 18, 18); legRows(10, 11, 18, 18); break;
    case "sit": legRows(3, 5, 18, 18); legRows(10, 12, 18, 18); break;
  }

  // 2. Badan
  row(5, 10, 15 + bodyDy, pal.torso1);
  row(5, 10, 16 + bodyDy, pal.torso2);
  row(5, 10, 17 + bodyDy, pal.belt);

  // 3. Lengan (di belakang kepala). Tangan "depan" digambar setelah wajah.
  arm("L", pal.limb);
  arm("R", pal.limb);
  if (!pose.frontL) plus(pose.L[0], pose.L[1] + bodyDy, pal.limb);
  if (!pose.frontR) plus(pose.R[0], pose.R[1] + bodyDy, pal.limb);

  // 4. Kepala
  const H = (ly: number) => ly + headDy;
  row(4, 11, H(6), pal.head);
  row(3, 12, H(7), pal.head);
  for (let y = 8; y <= 12; y++) row(2, 13, H(y), pal.head);
  row(3, 12, H(13), pal.head);
  row(4, 11, H(14), pal.head);
  row(3, 5, H(7), pal.hi);
  set(3, H(8), pal.hi);
  set(3, H(9), pal.hi);

  // 5. Jambul (disembunyikan bila memakai topi wisuda atau mahkota)
  const hideCrest = outfit === "cap" || outfit === "crown";
  if (!hideCrest) {
    const slot: Record<1 | 2 | 3, string> = { 1: pal.c1, 2: pal.c2, 3: WHITE };
    for (const [x, y, s] of CREST[o.character][crestFrame]) set(x, H(y), slot[s]);
  }

  // 6. Pelat wajah
  const shout = o.variant === "cast" || o.variant === "charge";
  const eyeCell: Cell = o.eyes === "hole" ? null : EYE_INK;
  const F = paintFace(o.face, {
    blink: !!o.blink,
    talkOpen: !!o.talkOpen,
    shout,
    isCover: o.variant === "cover",
    isPeek: o.variant === "peek",
  });
  if (outfit === "glasses") {
    // Mulut turun satu baris agar tidak tertutup bingkai kacamata.
    for (const fx of [3, 4]) if (F[3][fx] === "h") { F[3][fx] = "f"; F[4][fx] = "h"; }
  }
  for (let fy = 0; fy < 5; fy++)
    for (let fx = 0; fx < 8; fx++) {
      const c = F[fy][fx];
      if (!c) continue;
      set(PLATE_X0 + fx, H(PLATE_Y0 + fy), c === "f" ? pal.face : c === "h" ? eyeCell : c);
    }

  // 7. Aksesori
  if (o.face === "cool") {
    row(3, 12, H(9), INK);
    row(3, 12, H(10), INK);
    set(5, H(9), "#6b6b86"); set(6, H(9), "#6b6b86");
  }
  if (outfit === "glasses" && o.face !== "cool") {
    for (const x0 of [4, 8]) {
      row(x0, x0 + 3, H(8), INK);
      row(x0, x0 + 3, H(11), INK);
      set(x0, H(9), INK); set(x0, H(10), INK); set(x0 + 3, H(9), INK); set(x0 + 3, H(10), INK);
    }
  }
  if (outfit === "cap") {
    row(5, 10, H(3), "#2b2b3d");
    row(2, 13, H(4), "#1d1d2b");
    row(5, 10, H(5), "#1d1d2b");
    set(8, H(3), "#ffd23a");
    set(13, H(5), "#ffd23a"); set(13, H(6), "#ffd23a"); set(13, H(7), "#ffb000");
  }
  if (outfit === "crown") {
    const gold = "#ffd23a";
    const gem = o.character === "mu" ? "#003bff" : "#ff2e2e";
    row(7, 8, H(3), gold);
    set(4, H(4), gold); row(7, 8, H(4), gold); set(11, H(4), gold);
    row(4, 11, H(5), gold);
    set(7, H(5), gem); set(8, H(5), gem);
  }
  if (outfit === "scarf") {
    const sc = o.character === "mu" ? "#003bff" : o.character === "sigi" ? "#ffd23a" : "#ff2e2e";
    row(4, 11, 15 + bodyDy, sc);
    set(10, 16 + bodyDy, sc); set(10, 17 + bodyDy, sc);
  }

  // 8. Tangan depan dan buku
  if (pose.book) {
    row(5, 10, 15 + bodyDy, WHITE);
    row(5, 10, 16 + bodyDy, WHITE);
    row(5, 10, 17 + bodyDy, WHITE);
    set(7, 16 + bodyDy, pal.torso2); set(8, 16 + bodyDy, pal.torso2);
  }

  // Khusus pose cover / peek: tangan menutup mata secara penuh, padat, dan rapat tanpa ada celah terbuka
  if (o.variant === "cover") {
    // Tangan kiri menutup seluruh area mata kiri secara rapat (x: 4..7, y: H(8..11))
    row(5, 6, H(8), pal.limb);
    row(4, 7, H(9), pal.limb);
    row(4, 7, H(10), pal.limb);
    row(4, 6, H(11), pal.limb);

    // Tangan kanan menutup seluruh area mata kanan secara rapat (x: 8..11, y: H(8..11))
    row(9, 10, H(8), pal.limb);
    row(8, 11, H(9), pal.limb);
    row(8, 11, H(10), pal.limb);
    row(9, 11, H(11), pal.limb);
  } else if (o.variant === "peek") {
    // Tangan kiri menutup mata kiri secara rapat
    row(5, 6, H(8), pal.limb);
    row(4, 7, H(9), pal.limb);
    row(4, 7, H(10), pal.limb);
    row(4, 6, H(11), pal.limb);

    // Tangan kanan bebas di samping
    if (pose.frontR) plus(pose.R[0], pose.R[1] + bodyDy, pal.limb);
  } else {
    if (pose.frontL) plus(pose.L[0], pose.L[1] + bodyDy, pal.limb);
    if (pose.frontR) plus(pose.R[0], pose.R[1] + bodyDy, pal.limb);
  }

  // 9. Efek di luar siluet (tidak diberi cincin)
  const Z = "#a9b4d0";
  if (o.face === "sleep") {
    for (const [x, y] of [[15, 3], [16, 3], [17, 3], [16, 4], [15, 5], [16, 5], [17, 5]] as const) fxCells.push([x, H(y), Z]);
    for (const [x, y] of [[18, 0], [19, 0], [18, 1]] as const) fxCells.push([x, H(y), Z]);
  }
  if (o.face === "think") {
    for (const [x, y] of [[15, 2], [16, 2], [17, 2], [17, 3], [16, 4], [16, 6]] as const) fxCells.push([x, H(y), "#ffd23a"]);
  }

  // 10. Cincin putih
  const solid = g.map((r) => r.map((c) => c !== null));
  for (const [x, y] of ringCells(solid)) g[y][x] = WHITE;
  if (crestFrame === 0 && !hideCrest && breathe === 0 && bodyDy === 0) for (const [lx, ly] of RING_PATCH[o.character]) if (g[ly + OY][lx + OX] === null) set(lx, ly, WHITE);
  for (const [lx, ly, c] of fxCells) set(lx, ly, c);
  return g;
}

/** Ubah grid warna menjadi daftar persegi (baris yang sama warna digabung). */
export function gridToRects(g: Cell[][]): Rect[] {
  const out: Rect[] = [];
  for (let y = 0; y < g.length; y++) {
    let x = 0;
    while (x < g[y].length) {
      const c = g[y][x];
      if (c === null) { x++; continue; }
      let w = 1;
      while (x + w < g[y].length && g[y][x + w] === c) w++;
      out.push([x, y, w, 1, c]);
      x += w;
    }
  }
  return out;
}

export function buildHelmRects(o: HelmOptions): Rect[] {
  return gridToRects(buildHelmGrid(o));
}
