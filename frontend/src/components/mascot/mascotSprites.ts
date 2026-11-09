import type { BurstKind, Fx, ProjectileKind } from "@/lib/mascotEngine";

/** Sprite piksel untuk efek arena. Satu karakter = satu piksel; scale = ukuran piksel di layar. */
export interface Sprite {
  rows: string[];
  palette: Record<string, string>;
  scale: number;
  /** Warna cahaya di sekeliling sprite (drop-shadow). */
  glow?: string;
  /** Frame kedua; bergantian dengan rows agar sprite tampak hidup. */
  alt?: string[];
}

const RADIAL = ["....Y....", ".A..Y..A.", "..A.Y.A..", "...YYY...", "YYYYWYYYY", "...YYY...", "..A.Y.A..", ".A..Y..A.", "....Y...."];

/** Efek kecil di dekat kepala maskot. */
export const ACTOR_FX: Record<Exclude<Fx, "stars">, Sprite> = {
  pow: { rows: RADIAL, palette: { Y: "#EBEB00", W: "#FFFFFF", A: "#FF2E2E" }, scale: 4 },
  heart: { rows: [".AA.AA.", "AWAAAAA", "AAAAAAA", ".AAAAA.", "..AAA..", "...A..."], palette: { A: "#FF2E2E", W: "#FFFFFF" }, scale: 3 },
  sweat: { rows: ["..W..", ".WWW.", "WWBWW", "WWWWW", ".WWW."], palette: { W: "#9CC8FF", B: "#FFFFFF" }, scale: 4 },
  anger: { rows: [".A.A.", "AAAAA", ".A.A.", "AAAAA", ".A.A."], palette: { A: "#FF2E2E" }, scale: 4 },
  spark: { rows: ["..Y..", "..Y..", "YYWYY", "..Y..", "..Y.."], palette: { Y: "#EBEB00", W: "#FFFFFF" }, scale: 4 },
  note: { rows: ["..AAAA", "..A..A", "..A...", "..A...", "AAA...", "AAA..."], palette: { A: "#FF8AD8" }, scale: 4 },
  bulb: { rows: [".YYY.", "YYWYY", "YWYYY", "YYYYY", ".YYY.", "..G..", "..G.."], palette: { Y: "#FFE600", W: "#FFFFFF", G: "#9A9A9A" }, scale: 4 },
  zzz: { rows: ["WWWW...", "...W...", "..W..WW", ".W...W.", "WWWW.WW"], palette: { W: "#A9B4D0" }, scale: 4 },
  quest: { rows: [".AAA.", "A...A", "....A", "...A.", "..A..", ".....", "..A.."], palette: { A: "#FFD23A" }, scale: 4 },
  bang: { rows: [".AA.", ".AA.", ".AA.", ".AA.", "....", ".AA."], palette: { A: "#FF2E2E" }, scale: 5 },
};

// ---------- Pembangkit sprite (jurus dibuat dari rumus agar kaya warna dan mudah disetel) ----------

const seeded = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const blank = (w: number, h: number): string[][] => Array.from({ length: h }, () => Array<string>(w).fill("."));
const rowsOf = (g: string[][]) => g.map((r) => r.join(""));

/** Bola bercahaya: tepi gelap, badan, inti terang, dan kilau di kiri atas. */
function disc(g: string[][], cx: number, cy: number, r: number, shade: (d: number) => string, glint?: string) {
  for (let y = 0; y < g.length; y++)
    for (let x = 0; x < g[0].length; x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d <= 1) g[y][x] = shade(d);
    }
  if (glint) {
    const gx = Math.round(cx - r * 0.45), gy = Math.round(cy - r * 0.5);
    g[gy][gx] = glint; g[gy][gx + 1] = glint; g[gy + 1][gx] = glint;
  }
}

/** Gelembung kristal: cincin tebal, isi pucat, kilau ganda, dan butir air kecil di sekitarnya. */
function bubble(): string[] {
  const g = blank(15, 13);
  disc(g, 6, 6, 5.6, (d) => (d > 0.84 ? "B" : d > 0.62 ? "C" : "c"), "W");
  g[9][8] = "W"; g[8][9] = "W";
  for (const [x, y] of [[12, 3], [13, 6], [12, 9], [14, 4]]) g[y][x] = "C";
  g[3][13] = "W";
  return rowsOf(g);
}

/** Komet api: kepala bola berlapis dan ekor lidah api yang bergoyang. */
function comet(seed: number): string[] {
  const W = 26, H = 13, cx = 19, cy = 6;
  const g = blank(W, H), rnd = seeded(seed);
  for (let x = 0; x < 15; x++) {
    const frac = x / 15, half = 0.8 + 4.6 * frac;
    for (let y = 0; y < H; y++) {
      const dy = Math.abs(y - cy);
      if (dy <= half * (0.65 + 0.35 * rnd())) g[y][x] = frac < 0.3 ? "R" : frac < 0.65 ? "O" : dy < half * 0.4 ? "Y" : "O";
    }
  }
  disc(g, cx, cy, 6, (d) => (d > 0.82 ? "R" : d > 0.58 ? "O" : d > 0.3 ? "Y" : "W"));
  for (const [x, y] of [[3, 1], [7, 11], [1, 9], [10, 0]]) if (rnd() > 0.2) g[y][x] = "Y";
  return rowsOf(g);
}

/** Bola plasma petir: inti putih, cincin kuning, dan sulur listrik; frame kedua berputar 45 derajat. */
function plasma(rot: boolean): string[] {
  const S = 17, c = 8, g = blank(S, S);
  for (let i = 1; i <= 8; i++) {
    const rays: [number, number][] = rot ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of rays) g[c + dy * i][c + dx * i] = i % 3 === 0 ? "B" : "Y";
  }
  disc(g, c, c, 4.6, (d) => (d > 0.8 ? "B" : d > 0.5 ? "Y" : "W"));
  return rowsOf(g);
}

/** Ombak bergulung: puncak berbusa, badan bergaris, dan dasar biru tua. */
function tideWave(phase: number): string[] {
  // Gelombang berbentuk kurva lonceng (distribusi normal); frame kedua sedikit bergeser.
  const W = 22, H = 11, g = blank(W, H);
  for (let x = 0; x < W; x++) {
    const z = (x - (W - 1) / 2 + phase * 0.8) / 4.2;
    const h = 2 + Math.round(8 * Math.exp(-(z * z) / 2));
    for (let y = 0; y < h; y++) {
      const row = H - 1 - y;
      g[row][x] = y === h - 1 ? "W" : y === h - 2 ? "C" : y === 0 ? "B" : (x + y) % 5 === 0 ? "W" : y % 2 ? "c" : "C";
    }
  }
  return rowsOf(g);
}

/** Ledakan bintang bergerigi: inti putih, lapisan panas, tepi pekat. */
function star(R: number, spikes: number, rIn: number, power: number, calm = 0): string[] {
  const S = R * 2 + 1, g = blank(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const dx = x - R, dy = y - R, d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
      const r = rIn + (R - rIn) * Math.pow(Math.max(0, Math.cos(spikes * th / 2)), power);
      if (d > r || d > R) continue;
      const q = d / r;
      g[y][x] = q < 0.25 ? "W" : q < 0.55 ? "Y" : q < 0.85 - calm ? "A" : "B";
    }
  return rowsOf(g);
}

/** Pancuran air bermahkota: badan bergradasi, buih di dasar, butir air di puncak. */
function fountain(): string[] {
  const W = 15, H = 26, c = 7, g = blank(W, H), rnd = seeded(7);
  for (let y = 0; y < H; y++) {
    const hw = Math.min(5.5, 1 + y * 0.45) + Math.sin(y * 0.9) * 0.7 + (y > H - 5 ? 1.5 : 0);
    for (let x = 0; x < W; x++) {
      const q = Math.abs(x - c) / hw;
      if (q > 1) continue;
      g[y][x] = q < 0.22 ? "W" : q < 0.55 ? "c" : q < 0.85 ? "C" : "B";
    }
  }
  for (let i = 0; i < 9; i++) {
    const y = Math.floor(rnd() * 8), x = c + (rnd() > 0.5 ? 1 : -1) * (3 + Math.floor(rnd() * 4));
    if (g[y][x] === ".") g[y][x] = i % 2 ? "W" : "C";
  }
  for (let x = 0; x < W; x++) { g[H - 1][x] = "W"; if (x % 2) g[H - 2][x] = "W"; }
  return rowsOf(g);
}

/** Pilar api menjulang: lidah api berlapis merah, jingga, kuning, dan inti putih, dengan percikan bara. */
function firePillar(): string[] {
  const W = 15, H = 28, c = 7, g = blank(W, H), rnd = seeded(11);
  for (let y = 0; y < H; y++) {
    const hw = Math.min(6, 0.8 + y * 0.32) + (rnd() - 0.5) * 1.6;
    for (let x = 0; x < W; x++) {
      const q = Math.abs(x - c) / hw;
      if (q > 1) continue;
      g[y][x] = q < 0.18 && y > 5 ? "W" : q < 0.5 ? "Y" : q < 0.8 ? "O" : "R";
    }
  }
  for (let i = 0; i < 10; i++) {
    const y = Math.floor(rnd() * 12), x = c + (rnd() > 0.5 ? 1 : -1) * (3 + Math.floor(rnd() * 4));
    if (g[y][x] === ".") g[y][x] = i % 3 ? "Y" : "O";
  }
  for (let x = 0; x < W; x++) g[H - 1][x] = "R";
  return rowsOf(g);
}

/** Cincin ekspansi (pixel circle). */
function ringSprite(R: number): string[] {
  const S = R * 2 + 1, g = blank(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - R, y - R);
      if (d <= R && d > R - 1.6) g[y][x] = "Y";
      else if (d <= R - 1.6 && d > R - 2.6) g[y][x] = "A";
    }
  return rowsOf(g);
}

/** Bintang empat sudut. */
function sparkle(R: number): string[] {
  const S = R * 2 + 1, g = blank(S, S);
  for (let i = 0; i <= R; i++) {
    const w = Math.max(0, Math.round((R - i) / 3));
    for (let k = -w; k <= w; k++) { g[R + k][R + i] = i < 2 ? "W" : "Y"; g[R + k][R - i] = i < 2 ? "W" : "Y"; g[R + i][R + k] = i < 2 ? "W" : "Y"; g[R - i][R + k] = i < 2 ? "W" : "Y"; }
  }
  g[R][R] = "W";
  return rowsOf(g);
}

/** Perisai bulat tipis. */
function shield(): string[] {
  const R = 11, S = R * 2 + 1, g = blank(S, S);
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - R, y - R);
      if (d <= R && d > R - 1.5) g[y][x] = "W";
      else if (d <= R - 1.5 && d > R - 3 && (x + y) % 2 === 0) g[y][x] = "Y";
    }
  return rowsOf(g);
}

/** Hujan: butir jatuh acak (2 frame). */
function rain(seed: number): string[] {
  const W = 21, H = 30, g = blank(W, H), rnd = seeded(seed);
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(rnd() * W), y = Math.floor(rnd() * (H - 3));
    g[y][x] = "W"; g[y + 1][x] = "C"; g[y + 2][x] = "B";
  }
  return rowsOf(g);
}

const WATER = { B: "#1f5cff", C: "#6fb4ff", c: "#d4ecff", W: "#ffffff" };
const FIRE = { R: "#e0261c", O: "#ff8a00", Y: "#ffd93a", W: "#fff6c8" };
const BOLT = { B: "#2a4bff", Y: "#ffe600", W: "#ffffff" };

/** Peluru jurus. Digambar menghadap kanan; dibalik bila menyerang ke kiri. */
export const PROJECTILES: Record<ProjectileKind, Sprite> = {
  bubble: { rows: bubble(), palette: WATER, scale: 5, glow: "#6fb4ff" },
  fireball: { rows: comet(3), alt: comet(9), palette: FIRE, scale: 4, glow: "#ff8a00" },
  orb: { rows: plasma(false), alt: plasma(true), palette: BOLT, scale: 4, glow: "#ffe600" },
  tide: { rows: tideWave(0), alt: tideWave(1), palette: WATER, scale: 6, glow: "#6fb4ff" },
};

/** Ledakan dampak. */
export const BURSTS: Record<Exclude<BurstKind, "geyser" | "pillar" | "confetti">, Sprite> = {
  rain: { rows: rain(5), alt: rain(8), palette: WATER, scale: 6, glow: "#6fb4ff" },
  ring: { rows: ringSprite(12), palette: { Y: "#ffffff", A: "#ffd93a" }, scale: 6, glow: "#ffd93a" },
  star: { rows: sparkle(9), palette: { W: "#ffffff", Y: "#ffe600" }, scale: 5, glow: "#ffe600" },
  shield: { rows: shield(), palette: { W: "#ffffff", Y: "#9fd0ff" }, scale: 6, glow: "#6fb4ff" },
  splash: { rows: star(9, 8, 4.2, 3), palette: { W: "#ffffff", Y: "#d4ecff", A: "#6fb4ff", B: "#1f5cff" }, scale: 5, glow: "#6fb4ff" },
  blast: { rows: star(11, 12, 5, 2), palette: { W: "#fff6c8", Y: "#ffd93a", A: "#ff8a00", B: "#e0261c" }, scale: 5, glow: "#ff8a00" },
  shock: { rows: star(10, 6, 3.5, 5, 0.1), palette: { W: "#ffffff", Y: "#ffe600", A: "#9fb4ff", B: "#2a4bff" }, scale: 5, glow: "#ffe600" },
  steam: {
    rows: ["..WWW....", ".WWWWW.W.", "WWWWWWWWW", ".WWWWWWW.", "..WWWWW.."],
    palette: { W: "#E6EEF5" },
    scale: 6,
  },
  puff: { rows: ["..W..", ".WWW.", "WWWWW", ".WWW."], palette: { W: "#CFCFCF" }, scale: 4 },
};

/** Jurus area yang menjulang dari lantai. */
export const COLUMNS: Record<"geyser" | "pillar", Sprite> = {
  geyser: { rows: fountain(), palette: WATER, scale: 7, glow: "#6fb4ff" },
  pillar: { rows: firePillar(), palette: FIRE, scale: 7, glow: "#ff8a00" },
};

export const isRadial = (k: BurstKind) => k === "splash" || k === "blast" || k === "shock" || k === "ring" || k === "star" || k === "shield";
