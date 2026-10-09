import React from "react";

/**
 * Hiasan latar untuk section gelap. Murni SVG + CSS (tanpa canvas) sehingga
 * batas "maksimal 2 canvas aktif" tetap aman. Pengacak berbenih (seeded) membuat
 * hasil render sama di server dan client, jadi tidak ada hydration mismatch.
 */
const COLORS = ["#003BFF", "#FF2E2E", "#EBEB00"];

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gaussN = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const snap = (v: number, step = 8) => Math.round(v / step) * step;

interface Dot { x: number; y: number; s: number; c: string; o: number; blink: boolean; d: number }

// Scatter plot samar: awan titik di sekitar garis regresi, dalam viewBox 800x500.
const DOTS: Dot[] = (() => {
  const r = mulberry32(11);
  const out: Dot[] = [];
  for (let i = 0; i < 64; i++) {
    const t = Math.min(0.97, Math.max(0.03, 0.5 + gaussN(r) * 0.2));
    const x = snap(60 + t * 680);
    const y = snap(Math.min(470, Math.max(30, 430 - t * 340 + gaussN(r) * 55)));
    out.push({
      x,
      y,
      s: r() < 0.25 ? 12 : 8,
      c: COLORS[Math.floor(r() * COLORS.length)],
      o: 0.25 + r() * 0.35,
      blink: r() < 0.18,
      d: Math.floor(r() * 4000),
    });
  }
  return out;
})();

interface Bar { x: number; h: number; c: string | null; o: number; blink: boolean; d: number }

// Siluet histogram (lonceng) di dasar, dalam viewBox 1440x300.
const BARS: Bar[] = (() => {
  const r = mulberry32(23);
  const n = 60;
  const out: Bar[] = [];
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const h = snap(40 + Math.exp(-2.2 * u * u) * 180 + r() * 60);
    const colored = r() < 0.12;
    out.push({
      x: i * 24,
      h,
      c: colored ? COLORS[Math.floor(r() * COLORS.length)] : null,
      o: colored ? 0.3 : 0.06 + r() * 0.06,
      blink: r() < 0.1,
      d: Math.floor(r() * 5000),
    });
  }
  return out;
})();

interface DataBackdropProps {
  variant: "scatter" | "skyline";
  className?: string;
}

export const DataBackdrop: React.FC<DataBackdropProps> = ({ variant, className = "" }) => {
  const blinkStyle = (o: number, d: number, blink: boolean): React.CSSProperties => ({
    ["--o" as string]: o,
    opacity: o,
    animation: blink ? `bd-blink 3.6s steps(1, end) ${d}ms infinite` : undefined,
  });

  if (variant === "scatter") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 800 500"
        preserveAspectRatio="xMaxYMid meet"
        shapeRendering="crispEdges"
        className={`pointer-events-none select-none ${className}`}
      >
        {/* sumbu */}
        <path d="M40 20V470H780" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`x${i}`} d={`M${120 + i * 80} 470v8`} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path key={`y${i}`} d={`M40 ${390 - i * 80}h-8`} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
        ))}
        {/* garis regresi */}
        <path d="M60 430L740 90" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="8 8" fill="none" />
        {DOTS.map((p, i) => (
          <rect key={i} x={p.x} y={p.y} width={p.s} height={p.s} fill={p.c} style={blinkStyle(p.o, p.d, p.blink)} />
        ))}
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 300"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      className={`pointer-events-none select-none ${className}`}
    >
      {BARS.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={300 - b.h}
          width={20}
          height={b.h}
          fill={b.c ?? "#FFFFFF"}
          style={blinkStyle(b.o, b.d, b.blink)}
        />
      ))}
    </svg>
  );
};
