"use client";

import React, { forwardRef, useImperativeHandle, useRef } from "react";

/**
 * Transisi "mosaik piksel": kotak-kotak berwarna (biru, merah, kuning, hitam) tumbuh dari satu sisi
 * layar sampai menutup seluruhnya, lalu menyusut dari sisi yang sama dan membuka halaman baru.
 * Satu canvas tetap, hanya menggambar saat transisi berjalan.
 */
export interface PixelWipeHandle {
  /** Menutup layar. dir 1 = dari kiri ke kanan, -1 = dari kanan ke kiri. */
  cover(dir: 1 | -1): Promise<void>;
  /** Membuka layar kembali. */
  reveal(dir: 1 | -1): Promise<void>;
}

const PALETTE = ["#003BFF", "#FF2E2E", "#EBEB00", "#000000"];
const COVER_MS = 620;
const REVEAL_MS = 700;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 2.2);

interface Grid {
  cell: number;
  cols: number;
  rows: number;
  order: Float32Array;
  seed: Uint8Array;
  settle: Uint8Array; // indeks warna akhir tiap kotak saat menutup penuh
}

function makeGrid(w: number, h: number, dir: 1 | -1): Grid {
  const cell = Math.max(52, Math.min(104, Math.round(w / 18)));
  const cols = Math.ceil(w / cell);
  const rows = Math.ceil(h / cell);
  const n = cols * rows;
  const order = new Float32Array(n);
  const seed = new Uint8Array(n);
  const settle = new Uint8Array(n);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const along = (dir === 1 ? c : cols - 1 - c) / Math.max(1, cols - 1);
      const diag = (r / Math.max(1, rows - 1)) * 0.3;
      order[i] = clamp01((along * 0.74 + diag) / 1.04 + (Math.random() - 0.5) * 0.12);
      seed[i] = Math.floor(Math.random() * 4);
      settle[i] = Math.random() < 0.78 ? 3 : Math.floor(Math.random() * 3);
    }
  }
  return { cell, cols, rows, order, seed, settle };
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function run(canvas: HTMLCanvasElement, kind: "cover" | "reveal", dir: 1 | -1): Promise<void> {
  return new Promise((resolve) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve();
      return;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (kind === "cover") canvas.style.pointerEvents = "auto";

    // Ragam gerak dikurangi: cukup pudar hitam.
    if (prefersReducedMotion()) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
      canvas.style.transition = "opacity 160ms linear";
      canvas.style.opacity = kind === "cover" ? "0" : "1";
      requestAnimationFrame(() => {
        canvas.style.opacity = kind === "cover" ? "1" : "0";
      });
      window.setTimeout(() => {
        if (kind === "reveal") {
          ctx.clearRect(0, 0, w, h);
          canvas.style.pointerEvents = "none";
        }
        resolve();
      }, 190);
      return;
    }
    canvas.style.transition = "none";
    canvas.style.opacity = "1";

    const g = makeGrid(w, h, dir);
    const total = kind === "cover" ? COVER_MS : REVEAL_MS;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      const t = clamp01(elapsed / total);
      ctx.clearRect(0, 0, w, h);
      const flick = Math.floor(elapsed / 70);

      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
          const i = r * g.cols + c;
          // progres kotak: 0..1 saat menutup, dibalik saat membuka
          const raw = clamp01((t - g.order[i] * 0.58) / 0.42);
          const p = kind === "cover" ? raw : 1 - raw;
          if (p <= 0) continue;
          // pertumbuhan bertahap (blok demi blok) supaya terasa seperti glitch piksel
          const e = Math.round(easeOut(p) * 4) / 4;
          if (e <= 0) continue;
          const s = Math.ceil(g.cell * e) + (e >= 1 ? 1 : 0);
          const x = c * g.cell + (g.cell - s) / 2;
          const y = r * g.cell + (g.cell - s) / 2;
          const settled = p >= 1;
          const colorIndex = settled ? g.settle[i] : (g.seed[i] + flick) % 4;
          ctx.fillStyle = PALETTE[colorIndex];
          ctx.fillRect(x, y, s, s);
        }
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        if (kind === "reveal") {
          ctx.clearRect(0, 0, w, h);
          canvas.style.pointerEvents = "none";
        } else {
          // Tutup penuh: pastikan seluruh layar hitam, tanpa celah sub-piksel.
          ctx.fillStyle = "#000000";
          ctx.globalCompositeOperation = "destination-over";
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = "source-over";
        }
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}

export const PixelWipe = forwardRef<PixelWipeHandle>(function PixelWipe(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      cover: (dir) => (canvasRef.current ? run(canvasRef.current, "cover", dir) : Promise.resolve()),
      reveal: (dir) => (canvasRef.current ? run(canvasRef.current, "reveal", dir) : Promise.resolve()),
    }),
    []
  );

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70]" />;
});
