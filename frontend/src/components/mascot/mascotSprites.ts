import type { BurstKind, Fx, ProjectileKind } from "@/lib/mascotEngine";

/** Sprite piksel untuk efek arena. Satu karakter = satu piksel; scale = ukuran piksel di layar. */
export interface Sprite {
  rows: string[];
  palette: Record<string, string>;
  scale: number;
}

const RADIAL = ["....Y....", ".A..Y..A.", "..A.Y.A..", "...YYY...", "YYYYWYYYY", "...YYY...", "..A.Y.A..", ".A..Y..A.", "....Y...."];

/** Efek kecil di dekat kepala maskot. */
export const ACTOR_FX: Record<Exclude<Fx, "stars">, Sprite> = {
  pow: { rows: RADIAL, palette: { Y: "#EBEB00", W: "#FFFFFF", A: "#FF2E2E" }, scale: 4 },
  heart: { rows: [".AA.AA.", "AWAAAAA", "AAAAAAA", ".AAAAA.", "..AAA..", "...A..."], palette: { A: "#FF2E2E", W: "#FFFFFF" }, scale: 3 },
  sweat: { rows: ["..W..", ".WWW.", "WWBWW", "WWWWW", ".WWW."], palette: { W: "#9CC8FF", B: "#FFFFFF" }, scale: 4 },
  anger: { rows: [".A.A.", "AAAAA", ".A.A.", "AAAAA", ".A.A."], palette: { A: "#FF2E2E" }, scale: 4 },
  spark: { rows: ["..Y..", "..Y..", "YYWYY", "..Y..", "..Y.."], palette: { Y: "#EBEB00", W: "#FFFFFF" }, scale: 4 },
};

/** Peluru jurus. Digambar menghadap kanan; dibalik bila menyerang ke kiri. */
export const PROJECTILES: Record<ProjectileKind, Sprite> = {
  bubble: {
    rows: ["..BBB..", ".BCCCB.", "BCWCCCB", "BCCCCCB", "BCCCCCB", ".BCCCB.", "..BBB.."],
    palette: { B: "#003BFF", C: "#9CC8FF", W: "#FFFFFF" },
    scale: 5,
  },
  fireball: {
    rows: ["..OOO..", "ROOYYO.", "OYYYYYO", "OYYWYYO", "OYYYYYO", "ROOYYO.", "..OOO.."],
    palette: { O: "#FF8A00", Y: "#EBEB00", W: "#FFFFFF", R: "#FF2E2E" },
    scale: 5,
  },
  orb: {
    rows: ["B..B..B", ".BYYYB.", "BYYWYYB", ".BYYYB.", "B..B..B"],
    palette: { B: "#003BFF", Y: "#EBEB00", W: "#FFFFFF" },
    scale: 5,
  },
  tide: {
    rows: [
      ".....CCC....",
      "...CCWWCC...",
      "..CCWCCCCC..",
      ".CCCCCCCCCC.",
      "BBBBBBBBBBBB",
    ],
    palette: { C: "#9CC8FF", W: "#FFFFFF", B: "#5BA8FF" },
    scale: 6,
  },
};

/** Ledakan dampak. */
export const BURSTS: Record<"splash" | "blast" | "shock" | "steam" | "puff", Sprite> = {
  splash: { rows: RADIAL, palette: { Y: "#9CC8FF", W: "#FFFFFF", A: "#5BA8FF" }, scale: 5 },
  blast: { rows: RADIAL, palette: { Y: "#FF8A00", W: "#EBEB00", A: "#FF2E2E" }, scale: 5 },
  shock: { rows: RADIAL, palette: { Y: "#EBEB00", W: "#FFFFFF", A: "#003BFF" }, scale: 5 },
  steam: {
    rows: ["..WWW....", ".WWWWW.W.", "WWWWWWWWW", ".WWWWWWW.", "..WWWWW.."],
    palette: { W: "#E6EEF5" },
    scale: 6,
  },
  puff: { rows: ["..W..", ".WWW.", "WWWWW", ".WWW."], palette: { W: "#CFCFCF" }, scale: 4 },
};

/** Jurus area yang menjulang dari lantai. */
export const COLUMNS: Record<"geyser" | "pillar", Sprite> = {
  geyser: {
    rows: ["...C...", "..CCC..", ".CCWCC.", ".CCCCC.", "BCCCCCB", ".CCWCC.", ".CCCCC.", "BCCCCCB", ".CCCWC.", ".CCCCC.", "BCCCCCB", "WWCCCWW"],
    palette: { C: "#9CC8FF", W: "#FFFFFF", B: "#5BA8FF" },
    scale: 7,
  },
  pillar: {
    rows: ["...O...", "..OYO..", ".OYYYO.", ".OYWYO.", "OOYWYOO", ".OYWYO.", "OOYYYOO", ".OYWYO.", "OOYYYOO", "OROYORO", "RRRRRRR", ".R.R.R."],
    palette: { O: "#FF8A00", Y: "#EBEB00", W: "#FFFFFF", R: "#FF2E2E" },
    scale: 7,
  },
};

export const isRadial = (k: BurstKind) => k === "splash" || k === "blast" || k === "shock";
