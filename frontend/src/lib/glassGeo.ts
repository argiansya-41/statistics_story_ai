/**
 * Geometri bersama transisi "maskot menempel di kaca" (halaman login dan dashboard harus memakai angka yang sama,
 * supaya maskot yang menempel tidak bergeser saat halaman dimuat ulang).
 */
export interface GlassBox { B: number; cx: number; cy: number; rot: number }

/** Kotak maskot saat menempel: tinggi badan sekitar 100% layar. B = sisi kotak SVG 24x24 (badan menempati 22/24). */
export function glassBox(W: number, H: number): GlassBox {
  return { B: Math.round(H * 1.1), cx: W / 2, cy: H * 0.5, rot: -4 };
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Retakan kaca yang memancar dari titik hantaman. Deterministik. */
export function crackPaths(W: number, H: number, ox: number, oy: number): string[] {
  const rnd = mulberry(11);
  const paths: string[] = [];
  const R = Math.max(W, H) * 0.62;
  const rays = 11;
  for (let i = 0; i < rays; i++) {
    const base = (i / rays) * Math.PI * 2 + (rnd() - 0.5) * 0.35;
    const len = R * (0.45 + rnd() * 0.55);
    const seg = 7;
    let x = ox, y = oy, a = base;
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let s = 1; s <= seg; s++) {
      a += (rnd() - 0.5) * 0.45;
      const step = (len / seg) * (0.7 + rnd() * 0.6);
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
      if (s === 3 && rnd() < 0.7) {
        const ba = a + (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5);
        const bl = len * (0.18 + rnd() * 0.22);
        d += ` M${x.toFixed(1)} ${y.toFixed(1)} L${(x + Math.cos(ba) * bl).toFixed(1)} ${(y + Math.sin(ba) * bl).toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    }
    paths.push(d);
  }
  // Cincin retak di sekitar titik hantaman
  for (const rr of [0.06, 0.13]) {
    const r = Math.min(W, H) * rr;
    let d = "";
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const rad = r * (0.85 + rnd() * 0.3);
      d += `${k ? "L" : "M"}${(ox + Math.cos(a) * rad).toFixed(1)} ${(oy + Math.sin(a) * rad).toFixed(1)} `;
    }
    paths.push(d);
  }
  return paths;
}
