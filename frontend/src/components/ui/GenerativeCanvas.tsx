"use client";

import React, { useEffect, useRef, useState } from "react";

interface GenerativeCanvasProps {
  variant?: "hero" | "ambient";
  className?: string;
}

interface DataPoint {
  x: number;
  y: number;
  ox: number;
  oy: number;
  rx: number;
  ry: number;
  hx: number;
  hy: number;
  radius: number;
  colorType: "blue" | "red" | "yellow";
  speed: number;
  angle: number;
  curveDelay: number;
}

// Tunable constants for regression scatter cloud distribution
const SCATTER_X_SD = 0.2; // sebaran x, dalam fraksi lebar plot (W)
const SCATTER_Y_SD = 0.11; // sebaran residual, dalam fraksi tinggi plot (Hh)

// Time-based timeline with explicit hold states
const TIMELINE = [
  { name: "toLine", dur: 2400 }, // acak → garis lurus (ease in-out)
  { name: "holdLine", dur: 1500 }, // JEDA: titik diam di garis, garis terlihat penuh
  { name: "toCurve", dur: 2600 }, // garis → lonceng
  { name: "holdCurve", dur: 1800 }, // jeda: titik diam di kurva
  { name: "toFloat", dur: 2400 }, // kurva → acak
  { name: "holdFloat", dur: 700 }, // jeda singkat sebelum mengulang
] as const;

const TOTAL_CYCLE_DURATION = TIMELINE.reduce((acc, p) => acc + p.dur, 0); // 11400ms

export const GenerativeCanvas: React.FC<GenerativeCanvasProps> = ({
  variant = "hero",
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const isVisibleRef = useRef<boolean>(true);
  const animFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

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

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // IntersectionObserver to pause rendering when outside viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (!entry.isIntersecting && animFrameId.current) {
            cancelAnimationFrame(animFrameId.current);
            animFrameId.current = null;
          } else if (entry.isIntersecting && !animFrameId.current && !isReducedMotion) {
            animFrameId.current = requestAnimationFrame(renderLoop);
          }
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    let width = 0;
    let height = 0;
    let points: DataPoint[] = [];

    // Unified plot rect and geometry functions
    let plot = { x0: 0, x1: 0, y0: 0, y1: 0 };
    let W = 0;
    let Hh = 0;

    const lineY = (x: number) => plot.y1 - ((x - plot.x0) / W) * Hh * 0.85;

    const bellY = (x: number) => {
      const u = 2 * ((x - plot.x0) / W) - 1;
      return plot.y1 - Math.exp(-3 * u * u) * Hh;
    };

    // Standard normal distribution generator (Box-Muller) for regression scatter cloud
    const gaussN = () => {
      const u = 1 - Math.random();
      const v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    // Approximate Gaussian random generator [-1, 1] for tight bell curve jitter
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

    const initPoints = () => {
      const isMobile = window.innerWidth < 768;
      // Target counts: hero: desktop ~160 (optimal scatter density), mobile ~90. ambient: desktop ~36, mobile ~18
      const count =
        variant === "ambient"
          ? isMobile
            ? 18
            : 36
          : isMobile
          ? 90
          : 160;

      points = [];

      for (let i = 0; i < count; i++) {
        // Color distribution: ~40% blue, ~30% red, ~30% yellow
        const randColor = Math.random();
        const colorType: "blue" | "red" | "yellow" =
          randColor < 0.4 ? "blue" : randColor < 0.7 ? "red" : "yellow";

        // Spatial float distribution: biased to right ~60% so left headline stays clear
        const isRightBiased = Math.random() < 0.85;
        const floatMinX = isRightBiased ? width * 0.38 : width * 0.08;
        const floatMaxX = width * 0.95;
        const ox = floatMinX + Math.random() * (floatMaxX - floatMinX);
        const oy = plot.y0 + Math.random() * Hh;

        // Bivariate normal scatter cloud centered around the regression line
        let sx = 0;
        let sy = 0;
        for (let tries = 0; tries < 12; tries++) {
          sx = plot.x0 + W * (0.5 + gaussN() * SCATTER_X_SD);
          sy = lineY(sx) + gaussN() * Hh * SCATTER_Y_SD;
          const inside =
            sx > plot.x0 + W * 0.03 &&
            sx < plot.x1 - W * 0.03 &&
            sy > plot.y0 - Hh * 0.05 &&
            sy < plot.y1 + Hh * 0.05;
          if (inside) break;
        }
        const rx = sx;
        const ry = sy;

        // Radius: desktop 2-5.5px, mobile 2-4px
        const radius = isMobile
          ? 2 + Math.random() * 2
          : 2.2 + Math.random() * 3.3;

        points.push({
          x: ox,
          y: oy,
          ox,
          oy,
          rx,
          ry,
          hx: 0, // will be assigned in sorted order
          hy: 0, // will be assigned in sorted order
          radius,
          colorType,
          speed: 0.007 + Math.random() * 0.005,
          angle: Math.random() * Math.PI * 2,
          curveDelay: Math.random() * 0.25, // 0 - 25% duration delay in toCurve
        });
      }

      // Sort points from left to right by rx so transition to bell curve is orderly without path crossing
      points.sort((a, b) => a.rx - b.rx);

      // Assign bell curve target (hx, hy) based on sorted rank k
      const N = points.length;
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N;
        const hx = plot.x0 + t * W;
        const hy = bellY(hx) + gauss() * 4; // tightly adhering to bell curve (±4px)
        points[k].hx = hx;
        points[k].hy = hy;
      }
    };

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Recompute single unified plot geometry
      plot = {
        x0: width * 0.40,
        x1: width * 0.94,
        y0: height * 0.18,
        y1: height * 0.86,
      };
      W = plot.x1 - plot.x0;
      Hh = plot.y1 - plot.y0;

      initPoints();

      if (isReducedMotion) {
        drawStaticFallback();
      }
    };

    const drawStaticFallback = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw dashed regression line in black using unified geometry
      ctx.save();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.65)";
      ctx.lineWidth = 1.75;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(plot.x0, lineY(plot.x0));
      ctx.lineTo(plot.x1, lineY(plot.x1));
      ctx.stroke();
      ctx.restore();

      // Render static points grouped by color on the scatter cloud
      drawGroupedPoints(points, (p) => ({ x: p.rx, y: p.ry }));
    };

    const drawGroupedPoints = (
      pts: DataPoint[],
      getCoords: (p: DataPoint) => { x: number; y: number }
    ) => {
      const blues: { x: number; y: number; r: number }[] = [];
      const reds: { x: number; y: number; r: number }[] = [];
      const yellows: { x: number; y: number; r: number }[] = [];

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const c = getCoords(p);
        if (p.colorType === "blue") blues.push({ ...c, r: p.radius });
        else if (p.colorType === "red") reds.push({ ...c, r: p.radius });
        else yellows.push({ ...c, r: p.radius });
      }

      // Batch 1: Blue dots #003BFF
      if (blues.length > 0) {
        ctx.fillStyle = "#003BFF";
        ctx.beginPath();
        for (let i = 0; i < blues.length; i++) {
          const pt = blues[i];
          ctx.moveTo(pt.x + pt.r, pt.y);
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Batch 2: Red dots #FF2E2E
      if (reds.length > 0) {
        ctx.fillStyle = "#FF2E2E";
        ctx.beginPath();
        for (let i = 0; i < reds.length; i++) {
          const pt = reds[i];
          ctx.moveTo(pt.x + pt.r, pt.y);
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // Batch 3: Yellow dots #EBEB00 with subtle dark stroke for contrast on white
      if (yellows.length > 0) {
        ctx.fillStyle = "#EBEB00";
        ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (let i = 0; i < yellows.length; i++) {
          const pt = yellows[i];
          ctx.moveTo(pt.x + pt.r, pt.y);
          ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    startTimeRef.current = performance.now();

    const renderLoop = (timestamp: number) => {
      if (!isVisibleRef.current || isReducedMotion) return;

      ctx.clearRect(0, 0, width, height);

      // Ambient variant: gentle floating
      if (variant === "ambient") {
        drawGroupedPoints(points, (p) => {
          p.angle += p.speed;
          return {
            x: p.ox + Math.cos(p.angle) * 8,
            y: p.oy + Math.sin(p.angle) * 8,
          };
        });
        animFrameId.current = requestAnimationFrame(renderLoop);
        return;
      }

      // Hero variant: time-based timeline with explicit holds
      const elapsed = (timestamp - startTimeRef.current) % TOTAL_CYCLE_DURATION;

      // Find current timeline phase
      let accumulated = 0;
      let currentPhaseName = "toLine";
      let phaseProgress = 0;

      for (let i = 0; i < TIMELINE.length; i++) {
        const item = TIMELINE[i];
        if (elapsed < accumulated + item.dur) {
          currentPhaseName = item.name;
          phaseProgress = (elapsed - accumulated) / item.dur;
          break;
        }
        accumulated += item.dur;
      }

      // 1. Straight line opacity:
      // fade-in during toLine, full during holdLine, fade-out in first 40% of toCurve
      let lineAlpha = 0;
      if (currentPhaseName === "toLine") {
        lineAlpha = phaseProgress * 0.75;
      } else if (currentPhaseName === "holdLine") {
        lineAlpha = 0.75;
      } else if (currentPhaseName === "toCurve") {
        lineAlpha = phaseProgress <= 0.4 ? (1 - phaseProgress / 0.4) * 0.75 : 0;
      }

      // 2. Bell curve opacity:
      // fade-in in first 50% of toCurve, full during holdCurve, fade-out in first 40% of toFloat
      let curveAlpha = 0;
      if (currentPhaseName === "toCurve") {
        curveAlpha = phaseProgress <= 0.5 ? (phaseProgress / 0.5) * 0.65 : 0.65;
      } else if (currentPhaseName === "holdCurve") {
        curveAlpha = 0.65;
      } else if (currentPhaseName === "toFloat") {
        curveAlpha = phaseProgress <= 0.4 ? (1 - phaseProgress / 0.4) * 0.65 : 0;
      }

      // Draw dashed regression line directly through center of the scatter cloud
      if (lineAlpha > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 0, 0, ${lineAlpha})`;
        ctx.lineWidth = 1.75;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(plot.x0, lineY(plot.x0));
        ctx.lineTo(plot.x1, lineY(plot.x1));
        ctx.stroke();
        ctx.restore();
      }

      // Draw single bell curve outline
      if (curveAlpha > 0.01) {
        ctx.save();
        ctx.strokeStyle = `rgba(0, 59, 255, ${curveAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const STEPS = 80;
        for (let i = 0; i <= STEPS; i++) {
          const cx = plot.x0 + (i / STEPS) * W;
          const cy = bellY(cx);
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Determine orbit radius for settling jitter:
      // Orbit ±2.5px during float, reduced to ±1px during holdLine and holdCurve
      let orbitRadius = 2.5;
      if (currentPhaseName === "holdLine" || currentPhaseName === "holdCurve") {
        orbitRadius = 1.0;
      } else if (currentPhaseName === "toLine") {
        const ease = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
        orbitRadius = 2.5 - 1.5 * ease;
      } else if (currentPhaseName === "toCurve") {
        orbitRadius = 1.0;
      } else if (currentPhaseName === "toFloat") {
        const ease = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
        orbitRadius = 1.0 + 1.5 * ease;
      } else if (currentPhaseName === "holdFloat") {
        orbitRadius = 2.5;
      }

      // Compute point coordinates according to current phase
      drawGroupedPoints(points, (p) => {
        let tx = 0;
        let ty = 0;

        if (currentPhaseName === "toLine") {
          const ease = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
          tx = p.ox + (p.rx - p.ox) * ease;
          ty = p.oy + (p.ry - p.oy) * ease;
        } else if (currentPhaseName === "holdLine") {
          tx = p.rx;
          ty = p.ry;
        } else if (currentPhaseName === "toCurve") {
          // Staggered localT: clamp((t - delay) / (1 - 0.25)) for organic deformation
          const localT = Math.min(
            1,
            Math.max(0, (phaseProgress - p.curveDelay) / (1 - 0.25))
          );
          const ease = 0.5 - 0.5 * Math.cos(localT * Math.PI);
          tx = p.rx + (p.hx - p.rx) * ease;
          ty = p.ry + (p.hy - p.ry) * ease;
        } else if (currentPhaseName === "holdCurve") {
          tx = p.hx;
          ty = p.hy;
        } else if (currentPhaseName === "toFloat") {
          const ease = 0.5 - 0.5 * Math.cos(phaseProgress * Math.PI);
          tx = p.hx + (p.ox - p.hx) * ease;
          ty = p.hy + (p.oy - p.hy) * ease;
        } else {
          // holdFloat
          tx = p.ox;
          ty = p.oy;
        }

        p.angle += p.speed;
        return {
          x: tx + Math.cos(p.angle) * orbitRadius,
          y: ty + Math.sin(p.angle) * orbitRadius,
        };
      });

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    if (!isReducedMotion) {
      animFrameId.current = requestAnimationFrame(renderLoop);
    } else {
      drawStaticFallback();
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isReducedMotion, variant]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
