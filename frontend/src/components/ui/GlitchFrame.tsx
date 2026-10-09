"use client";

import React, { useMemo } from "react";

interface FrameCell {
  r: number;
  c: number;
  delay: number;
  exit: number;
  ghost: boolean;
}

interface GlitchFrameProps {
  cols: number;
  rows: number;
  seed: number; // 0 = belum pernah hover
  on: boolean; // true saat hover, false saat keluar
  color: string;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function edgeRuns(len: number, rnd: () => number) {
  const on: boolean[] = new Array(len).fill(false);
  const thick: boolean[] = new Array(len).fill(false);
  let i = 0;
  let isOn = rnd() < 0.7;
  while (i < len) {
    const n = isOn ? 2 + Math.floor(rnd() * 8) : 1 + Math.floor(rnd() * 5);
    const t = isOn && rnd() < 0.4;
    for (let k = 0; k < n && i < len; k++, i++) {
      on[i] = isOn;
      thick[i] = t;
    }
    isOn = !isOn;
  }
  return { on, thick };
}

function buildFrame(cols: number, rows: number, seed: number): FrameCell[] {
  const rnd = mulberry32(seed * 7919 + 13);
  const seen = new Set<number>();
  const cells: FrameCell[] = [];
  const push = (r: number, c: number, ghost = false) => {
    const key = r * cols + c;
    if (r < 0 || c < 0 || r >= rows || c >= cols || seen.has(key)) return;
    seen.add(key);
    cells.push({
      r,
      c,
      ghost,
      delay: Math.floor(rnd() * 260),
      exit: Math.floor(rnd() * 140),
    });
  };

  const top = edgeRuns(cols, rnd);
  const bottom = edgeRuns(cols, rnd);
  const left = edgeRuns(rows - 2, rnd); // baris 1..rows-2
  const right = edgeRuns(rows - 2, rnd);

  // Sudut berbentuk L (peluang 85% per sudut)
  const [tl, tr, bl, br] = [
    rnd() < 0.85,
    rnd() < 0.85,
    rnd() < 0.85,
    rnd() < 0.85,
  ];
  const arm = (n: number) => 2 + Math.floor(rnd() * n);
  const force = (arr: boolean[], from: "start" | "end", n: number) => {
    for (let k = 0; k < n && k < arr.length; k++) {
      arr[from === "start" ? k : arr.length - 1 - k] = true;
    }
  };

  if (tl) {
    force(top.on, "start", arm(2));
    force(left.on, "start", arm(2));
  }
  if (tr) {
    force(top.on, "end", arm(2));
    force(right.on, "start", arm(2));
  }
  if (bl) {
    force(bottom.on, "start", arm(2));
    force(left.on, "end", arm(2));
  }
  if (br) {
    force(bottom.on, "end", arm(2));
    force(right.on, "end", arm(2));
  }

  for (let c = 0; c < cols; c++) {
    if (top.on[c]) {
      push(0, c);
      if (top.thick[c]) push(1, c);
    }
    if (bottom.on[c]) {
      push(rows - 1, c);
      if (bottom.thick[c]) push(rows - 2, c);
    }
  }

  for (let k = 0; k < rows - 2; k++) {
    const r = k + 1;
    if (left.on[k]) {
      push(r, 0);
      if (left.thick[k]) push(r, 1);
    }
    if (right.on[k]) {
      push(r, cols - 1);
      if (right.thick[k]) push(r, cols - 2);
    }
  }

  // Sel "hantu": berkedip sebentar lalu hilang
  for (let g = 0; g < 10; g++) {
    const side = Math.floor(rnd() * 4);
    if (side === 0) push(0, Math.floor(rnd() * cols), true);
    else if (side === 1) push(rows - 1, Math.floor(rnd() * cols), true);
    else if (side === 2) push(1 + Math.floor(rnd() * (rows - 2)), 0, true);
    else push(1 + Math.floor(rnd() * (rows - 2)), cols - 1, true);
  }

  return cells;
}

export const GlitchFrame: React.FC<GlitchFrameProps> = ({
  cols,
  rows,
  seed,
  on,
  color,
}) => {
  const cells = useMemo(
    () => (seed > 0 ? buildFrame(cols, rows, seed) : []),
    [cols, rows, seed]
  );

  if (cells.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="glitch-frame pointer-events-none absolute inset-0 z-0"
      data-on={on ? "true" : "false"}
      style={{ ["--gf-color" as string]: color }}
    >
      {cells.map((cell) => (
        <span
          key={`${seed}-${cell.r}-${cell.c}`}
          className={`glitch-frame-cell${cell.ghost ? " is-ghost" : ""}`}
          style={{
            left: `${(cell.c / cols) * 100}%`,
            top: `${(cell.r / rows) * 100}%`,
            width: `${100 / cols}%`,
            height: `${100 / rows}%`,
            ["--delay" as string]: `${cell.delay}ms`,
            ["--exit" as string]: `${cell.exit}ms`,
          }}
        />
      ))}
    </div>
  );
};
