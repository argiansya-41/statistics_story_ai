"use client";

import React, { useEffect, useRef, useState } from "react";

// Hitam sengaja tidak dipakai: di section gelap blok hitam tak terlihat.
const DEFAULT_COLORS = ["#003BFF", "#FF2E2E", "#EBEB00"];

type Density = "sparse" | "medium" | "dense";

// weight = peluang dipilih. block/gap dalam % lebar strip. lines = peluang gugusan garis tipis.
const DENSITY: Record<
  Density,
  { weight: number; block: [number, number]; gap: [number, number]; lines: number }
> = {
  sparse: { weight: 0.4, block: [2, 6], gap: [3, 12], lines: 0 },
  medium: { weight: 0.35, block: [1.5, 4.5], gap: [2, 7], lines: 0.1 },
  dense: { weight: 0.25, block: [1, 3.5], gap: [0.4, 1.8], lines: 0.1 },
};

interface Seg {
  id: number;
  left: number; // % lebar strip
  width: number; // % lebar strip
  color: string;
  delay: number; // ms
  blink: "a" | "b";
  fresh: boolean; // true = berkedip masuk pada burst ini
}

interface BurstState {
  segs: Seg[];
  ghosts: Seg[]; // blok lama yang berkedip keluar
  burst: number;
  density: Density;
  animate: boolean;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function pickDensity(previous: Density): Density {
  const options = (Object.keys(DENSITY) as Density[]).filter((d) => d !== previous);
  const total = options.reduce((sum, d) => sum + DENSITY[d].weight, 0);
  let r = Math.random() * total;
  for (const d of options) {
    r -= DENSITY[d].weight;
    if (r <= 0) return d;
  }
  return options[0];
}

let nextId = 1;

// `scale` > 1 memperlebar blok dan celah di layar sempit (mobile).
function makeLayout(colors: string[], density: Density, scale: number): Seg[] {
  const cfg = DENSITY[density];
  const segs: Seg[] = [];
  let x = rand(0, density === "sparse" ? 12 : 1);
  let prevColor = "";

  const add = (left: number, width: number) => {
    let color = pick(colors);
    if (color === prevColor && Math.random() < 0.75) color = pick(colors);
    prevColor = color;
    segs.push({
      id: nextId++,
      left,
      width,
      color,
      delay: Math.floor(rand(0, 300)),
      blink: Math.random() < 0.5 ? "a" : "b",
      fresh: true,
    });
  };

  while (x < 99) {
    if (cfg.lines > 0 && Math.random() < cfg.lines) {
      const n = 3 + Math.floor(Math.random() * 3);
      for (let k = 0; k < n && x < 99; k++) {
        add(x, rand(0.2, 0.34) * scale);
        x += rand(0.48, 0.62) * scale;
      }
      x += rand(0.15, 0.5) * scale;
      continue;
    }
    const w = rand(cfg.block[0], cfg.block[1]) * scale;
    if (x + w > 100) break;
    add(x, w);
    x += w + rand(cfg.gap[0], cfg.gap[1]) * scale;
  }
  return segs;
}

function nextBurst(prev: BurstState, colors: string[], scale: number, reduced: boolean): BurstState {
  const density = pickDensity(prev.density);
  const layout = makeLayout(colors, density, scale);
  return {
    segs: reduced ? layout.map((s) => ({ ...s, fresh: false })) : layout,
    ghosts: reduced ? [] : prev.segs.map((s) => ({ ...s, fresh: false })),
    burst: prev.burst + 1,
    density,
    animate: !reduced,
  };
}

const INITIAL: BurstState = { segs: [], ghosts: [], burst: 0, density: "medium", animate: true };

interface GlitchStripProps {
  className?: string;
  colors?: string[];
}

export const GlitchStrip: React.FC<GlitchStripProps> = ({ className = "", colors = DEFAULT_COLORS }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<BurstState>(INITIAL);
  const colorKey = colors.join(",");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const palette = colorKey.split(",");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let current = INITIAL;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let seen = false;

    const fire = () => {
      current = nextBurst(current, palette, window.innerWidth < 640 ? 2.5 : 1, reduced);
      setState(current);
    };
    const loop = () => {
      if (visible) fire();
      timer = setTimeout(loop, rand(1800, 3400));
    };

    // Strip kosong sampai pertama kali terlihat, lalu berkedip muncul.
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !seen) {
          seen = true;
          fire();
          if (!reduced) timer = setTimeout(loop, rand(1800, 3400));
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);

    return () => {
      if (timer) clearTimeout(timer);
      io.disconnect();
    };
  }, [colorKey]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`relative h-4 md:h-6 w-full overflow-hidden select-none pointer-events-none ${className}`}
    >
      {state.animate &&
        state.ghosts.map((g) => (
          <span
            key={`g-${state.burst}-${g.id}`}
            className="absolute top-0 h-full"
            style={{
              left: `${g.left}%`,
              width: `${g.width}%`,
              background: g.color,
              animation: `gs-blink-out 420ms steps(1, end) ${g.delay}ms both`,
            }}
          />
        ))}
      {state.segs.map((s) => (
        <span
          key={`s-${s.id}`}
          className="absolute top-0 h-full"
          style={{
            left: `${s.left}%`,
            width: `${s.width}%`,
            background: s.color,
            animation:
              state.animate && s.fresh
                ? `${s.blink === "a" ? "gs-blink-a 480ms" : "gs-blink-b 620ms"} steps(1, end) ${s.delay}ms both`
                : undefined,
          }}
        />
      ))}
    </div>
  );
};
