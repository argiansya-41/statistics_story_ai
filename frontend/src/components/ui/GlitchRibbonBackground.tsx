"use client";

import React, { useEffect, useRef, useState } from "react";

interface GlitchRibbonBackgroundProps {
  className?: string;
  speedMultiplier?: number;
}

// Karakter DNA CRISPR murni (A, T, C, G) persis seperti di referensi ScribeTx
const DNA_CHARS = ["A", "T", "C", "G", "A", "T", "C", "G", "T", "A", "C", "G"];
const getRandomChar = () => DNA_CHARS[Math.floor(Math.random() * DNA_CHARS.length)];

// Palet warna bio-tech terang, jernih, dan bercahaya (Vibrant Neon Palette)
type RibbonColorType = "blue" | "red" | "yellow" | "white" | "dark" | "transparent";

interface ColorDef {
  bg: string;
  fg: string;
  glow?: string;
}

const COLOR_DEFS: Record<RibbonColorType, ColorDef> = {
  red: {
    bg: "rgba(255, 45, 45, 0.92)",
    fg: "#FFFFFF",
    glow: "rgba(255, 45, 45, 0.65)",
  },
  blue: {
    bg: "rgba(0, 85, 255, 0.92)",
    fg: "#FFFFFF",
    glow: "rgba(0, 85, 255, 0.65)",
  },
  yellow: {
    bg: "rgba(255, 235, 0, 0.95)",
    fg: "#000000",
    glow: "rgba(255, 235, 0, 0.60)",
  },
  white: {
    bg: "rgba(255, 255, 255, 0.92)",
    fg: "#000000",
    glow: "rgba(255, 255, 255, 0.50)",
  },
  dark: {
    bg: "rgba(255, 255, 255, 0.15)",
    fg: "rgba(255, 255, 255, 0.85)",
  },
  transparent: {
    bg: "transparent",
    fg: "transparent",
  },
};

const COLOR_CYCLE_POOL: RibbonColorType[] = [
  "red", "red", "red", "red",
  "blue", "blue", "blue", "blue",
  "yellow", "yellow", "yellow",
  "white", "white",
  "dark",
];

const getRandomColorType = (): RibbonColorType =>
  COLOR_CYCLE_POOL[Math.floor(Math.random() * COLOR_CYCLE_POOL.length)];

// Sel individual di dalam pita
interface RibbonCell {
  char: string;
  colorType: RibbonColorType;
  nextColorChange: number;
  nextCharChange: number;
}

// Strip pita vertikal kontinu (Single Column, ramping, warna menyatu & terang)
interface FallingRibbonTape {
  y: number; // posisi vertikal Y
  speed: number; // kecepatan jatuh (px/frame)
  width: number; // lebar pita ramping (~14-15px)
  cellHeight: number; // tinggi tiap karakter (~16-17px)
  cells: RibbonCell[];
  sliceGlitchActive: boolean;
  sliceGlitchOffset: number;
  sliceGlitchTimer: number;
  fadingTail: boolean;
}

interface RibbonLane {
  x: number;
  width: number;
  depth: number;
  opacity: number;
  strips: FallingRibbonTape[];
  cellHeight: number;
}

export const GlitchRibbonBackground: React.FC<GlitchRibbonBackgroundProps> = ({
  className = "",
  speedMultiplier = 1,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const animFrameId = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);
  const lanesRef = useRef<RibbonLane[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", handleMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    // Membuat satu pita vertikal kontinu dengan panjang yang proporsional dan tidak terlalu panjang
    const createStrip = (
      startY: number,
      cellW: number,
      cellH: number,
      baseSpeed: number,
      now: number
    ): FallingRibbonTape => {
      // Panjang pita: antara 7 hingga 15 karakter (lebih ringkas & tidak menumpuk)
      const cellCount = 7 + Math.floor(Math.random() * 8);
      const cells: RibbonCell[] = [];

      let remaining = cellCount;
      while (remaining > 0) {
        const segLen = Math.min(remaining, 2 + Math.floor(Math.random() * 5));
        const color = getRandomColorType();
        for (let i = 0; i < segLen; i++) {
          cells.push({
            char: getRandomChar(),
            colorType: color,
            nextColorChange: now + 800 + Math.random() * 3200,
            nextCharChange: now + 600 + Math.random() * 2500,
          });
        }
        remaining -= segLen;
      }

      return {
        y: startY,
        speed: baseSpeed * (0.85 + Math.random() * 0.35) * speedMultiplier,
        width: cellW,
        cellHeight: cellH,
        cells,
        sliceGlitchActive: false,
        sliceGlitchOffset: 0,
        sliceGlitchTimer: 0,
        fadingTail: Math.random() < 0.45,
      };
    };

    const initLanes = () => {
      const isMobile = window.innerWidth < 768;
      // Jumlah kolom dikurangi (desktop 8 kolom, mobile 4 kolom) agar tidak terlalu ramai dan ada ruang hitam lega
      const laneCount = isMobile ? 4 : 8;
      const lanes: RibbonLane[] = [];
      const colStep = width / laneCount;
      const now = performance.now();

      for (let i = 0; i < laneCount; i++) {
        const depthChoice = Math.random();
        let depth = 0.85;
        let opacity = 0.92;
        let scale = 1.0;
        let baseSpeed = 0.65 + Math.random() * 0.45;

        if (depthChoice < 0.30) {
          // Latar belakang lembut
          depth = 0.45;
          opacity = 0.65;
          scale = 0.85;
          baseSpeed *= 0.65;
        } else if (depthChoice < 0.70) {
          // Latar tengah
          depth = 0.75;
          opacity = 0.82;
          scale = 0.92;
          baseSpeed *= 0.88;
        } else {
          // Latar depan terang
          depth = 1.0;
          opacity = 0.96;
          scale = 1.0;
          baseSpeed *= 1.15;
        }

        const ribbonWidth = Math.round(14.5 * scale);
        const cellH = Math.round(16.5 * scale);

        // Posisi X dengan variasi seimbang agar tersebar rapi
        const xPos = Math.max(
          12,
          Math.min(width - ribbonWidth - 12, i * colStep + (Math.random() - 0.5) * colStep * 0.5)
        );

        const strips: FallingRibbonTape[] = [];
        const strip1 = createStrip(
          -Math.random() * height * 0.9,
          ribbonWidth,
          cellH,
          baseSpeed,
          now
        );
        strips.push(strip1);

        // Hanya ~35% kolom yang memiliki strip kedua, dengan jarak vertikal yang sangat lega (350 - 750px)
        if (Math.random() < 0.35) {
          const totalStrip1H = strip1.cells.length * cellH;
          const gap = 350 + Math.random() * 400;
          const strip2 = createStrip(
            strip1.y + totalStrip1H + gap,
            ribbonWidth,
            cellH,
            baseSpeed,
            now
          );
          strips.push(strip2);
        }

        lanes.push({
          x: xPos,
          width: ribbonWidth,
          depth,
          opacity,
          strips,
          cellHeight: cellH,
        });
      }

      lanes.sort((a, b) => a.depth - b.depth);
      lanesRef.current = lanes;
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initLanes();

      if (isReducedMotion) {
        drawScene(performance.now(), true);
      }
    };

    const drawScene = (now: number, staticOnly: boolean = false) => {
      ctx.clearRect(0, 0, width, height);

      const lanes = lanesRef.current;

      for (let l = 0; l < lanes.length; l++) {
        const lane = lanes[l];

        ctx.save();
        ctx.globalAlpha = lane.opacity;

        for (let s = 0; s < lane.strips.length; s++) {
          const strip = lane.strips[s];
          const totalStripH = strip.cells.length * strip.cellHeight;

          if (!staticOnly) {
            // Gerakkan pita ke bawah
            strip.y += strip.speed;

            // Daur ulang pita saat keluar dari layar bawah dengan jeda vertikal luas
            if (strip.y > height + 50) {
              const highestY = Math.min(...lane.strips.map((st) => st.y));
              const gap = 300 + Math.random() * 450;
              strip.y = Math.min(-totalStripH - 40, highestY - totalStripH - gap);

              for (let c = 0; c < strip.cells.length; c++) {
                const cell = strip.cells[c];
                cell.char = getRandomChar();
                cell.colorType = getRandomColorType();
                cell.nextColorChange = now + 800 + Math.random() * 3200;
                cell.nextCharChange = now + 600 + Math.random() * 2500;
              }
            }

            // PERGANTIAN WARNA & KARAKTER YANG TENANG (Tidak terburu-buru / tidak terlalu ramai)
            for (let c = 0; c < strip.cells.length; c++) {
              const cell = strip.cells[c];

              // Pergantian warna dinamis per sel
              if (now > cell.nextColorChange) {
                let nextColor = getRandomColorType();
                if (nextColor === cell.colorType) {
                  nextColor = getRandomColorType();
                }
                cell.colorType = nextColor;
                // Interval lebih santai (800ms - 2600ms)
                cell.nextColorChange = now + 800 + Math.random() * 2400;
              }

              // Mutasi huruf dinamis per sel
              if (now > cell.nextCharChange) {
                cell.char = getRandomChar();
                cell.nextCharChange = now + 600 + Math.random() * 2000;
              }
            }

            // Glitch pergeseran slice horizontal sesekali
            if (!strip.sliceGlitchActive && Math.random() < 0.002 && lane.depth > 0.6) {
              strip.sliceGlitchActive = true;
              strip.sliceGlitchOffset = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3);
              strip.sliceGlitchTimer = now + 80 + Math.random() * 80;
            } else if (strip.sliceGlitchActive && now > strip.sliceGlitchTimer) {
              strip.sliceGlitchActive = false;
              strip.sliceGlitchOffset = 0;
            }
          }

          if (strip.y + totalStripH < -20 || strip.y > height + 20) {
            continue;
          }

          const cellW = strip.width;
          const cellH = strip.cellHeight;
          const drawX = lane.x + (strip.sliceGlitchActive ? strip.sliceGlitchOffset : 0);

          // Ekor pudar halus di atas pita
          if (strip.fadingTail && strip.y > 0 && strip.y < height) {
            const tailGrad = ctx.createLinearGradient(drawX, strip.y - 35, drawX, strip.y);
            tailGrad.addColorStop(0, "rgba(255, 45, 45, 0)");
            tailGrad.addColorStop(1, "rgba(255, 45, 45, 0.45)");
            ctx.fillStyle = tailGrad;
            ctx.fillRect(drawX, strip.y - 35, cellW, 35);
          }

          // 1. GAMBAR LATAR BELAKANG PITA MENYATU (SEAMLESS TAPE TERANG DENGAN GLOW)
          let segStart = 0;
          while (segStart < strip.cells.length) {
            const currentColor = strip.cells[segStart].colorType;
            let segEnd = segStart;

            while (
              segEnd + 1 < strip.cells.length &&
              strip.cells[segEnd + 1].colorType === currentColor
            ) {
              segEnd++;
            }

            const segY = strip.y + segStart * cellH;
            const segH = (segEnd - segStart + 1) * cellH;

            if (segY + segH >= -10 && segY <= height + 10 && currentColor !== "transparent") {
              const def = COLOR_DEFS[currentColor] || COLOR_DEFS.red;

              if (lane.depth >= 0.70 && def.glow) {
                ctx.shadowColor = def.glow;
                ctx.shadowBlur = 8;
              } else {
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
              }

              ctx.fillStyle = def.bg;
              ctx.fillRect(drawX, segY, cellW, segH);
            }

            segStart = segEnd + 1;
          }

          ctx.shadowBlur = 0;

          // 2. GAMBAR HURUF DI DALAM PITA SECARA VERTIKAL
          const fontSize = Math.round(cellH * 0.66);
          ctx.font = `800 ${fontSize}px "JetBrains Mono", "Fragment Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          for (let c = 0; c < strip.cells.length; c++) {
            const cell = strip.cells[c];
            const charY = strip.y + c * cellH + cellH / 2;

            if (charY >= -10 && charY <= height + 10 && cell.colorType !== "transparent") {
              const def = COLOR_DEFS[cell.colorType] || COLOR_DEFS.red;
              ctx.fillStyle = def.fg;
              ctx.fillText(cell.char, drawX + cellW / 2, charY);
            }
          }
        }

        ctx.restore();
      }
    };

    const loop = (timestamp: number) => {
      if (!isVisibleRef.current) return;
      drawScene(timestamp, false);
      animFrameId.current = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (!entry.isIntersecting && animFrameId.current) {
            cancelAnimationFrame(animFrameId.current);
            animFrameId.current = null;
          } else if (entry.isIntersecting && !animFrameId.current && !isReducedMotion) {
            animFrameId.current = requestAnimationFrame(loop);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    handleResize();
    window.addEventListener("resize", handleResize);

    if (!isReducedMotion) {
      animFrameId.current = requestAnimationFrame(loop);
    } else {
      drawScene(performance.now(), true);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isReducedMotion, speedMultiplier]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          background: "radial-gradient(ellipse at 30% 35%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)"
        }}
      />
    </div>
  );
};
