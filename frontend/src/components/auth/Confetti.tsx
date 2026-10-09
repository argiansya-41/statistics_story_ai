import React from "react";

const COLORS = ["#003BFF", "#FF2E2E", "#EBEB00", "#FFFFFF"];

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Dihitung sekali (berbenih) agar hasil render server dan client sama.
const PIECES = (() => {
  const r = mulberry32(42);
  return Array.from({ length: 36 }, (_, i) => ({
    left: Math.round(r() * 100),
    size: 6 + Math.floor(r() * 3) * 3,
    color: COLORS[i % COLORS.length],
    delay: Math.floor(r() * 700),
    dur: 1500 + Math.floor(r() * 1100),
    drift: Math.round((r() - 0.5) * 120),
  }));
})();

/** Konfeti piksel yang jatuh dari atas panel. */
export const Confetti: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
    {PIECES.map((p, i) => (
      <span
        key={i}
        className="absolute -top-4 block"
        style={{
          left: `${p.left}%`,
          width: p.size,
          height: p.size,
          background: p.color,
          ["--drift" as string]: `${p.drift}px`,
          animation: `auth-confetti ${p.dur}ms steps(14) ${p.delay}ms both`,
        }}
      />
    ))}
  </div>
);
