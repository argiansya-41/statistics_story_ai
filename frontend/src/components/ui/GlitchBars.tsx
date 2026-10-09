"use client";

import React, { useEffect, useRef } from "react";

// Tunable constants as specified in requirements
const IN_DURATION_MS: [number, number] = [1400, 1900]; // 1400-1900ms smooth reveal
const STAGGER_BETWEEN_BARS_MS: [number, number] = [250, 500]; // 250-500ms between bars
const EASING_CURVE = "cubic-bezier(0.16, 1, 0.3, 1)"; // Strong easeOutExpo curve
const GLITCH_PALETTE = ["#003BFF", "#FF2E2E", "#EBEB00"]; // Bio-tech glitch palette

interface BarDef {
  id: string;
  baseTop: number; // percentage from top
  bodyLen?: string; // solid body width (18-34% of hero width)
  defaultWidth: string; // initial fallback width
  heightClass: string; // Tailwind responsive height classes
  desktopH: number; // baseline height in px on desktop
  color: string;
  isYellow?: boolean;
  isStandalone?: boolean;
  hasNoSolidBody?: boolean;
  standaloneRight?: string; // right anchor if standalone
  isMobileHidden?: boolean; // hide on mobile (< md)
}

const BARS_CONFIG: BarDef[] = [
  // 1. Blue main top bar (~40px desktop, ~24px mobile)
  {
    id: "b1",
    baseTop: 16,
    bodyLen: "23%",
    defaultWidth: "43%",
    heightClass: "h-6 md:h-10",
    desktopH: 40,
    color: "#003BFF",
  },
  // 2. Yellow bar (~24px desktop, ~14px mobile)
  {
    id: "b2",
    baseTop: 34,
    bodyLen: "27%",
    defaultWidth: "47%",
    heightClass: "h-3.5 md:h-6",
    desktopH: 24,
    color: "#EBEB00",
    isYellow: true,
  },
  // 3. Red thick bar (~40px desktop, ~24px mobile)
  {
    id: "b3",
    baseTop: 50,
    bodyLen: "33%",
    defaultWidth: "53%",
    heightClass: "h-6 md:h-10",
    desktopH: 40,
    color: "#FF2E2E",
  },
  // 4. Blue center-left standalone bar (~20px desktop) - no solid body, lines + blocks only
  {
    id: "b4",
    baseTop: 72,
    defaultWidth: "24%",
    heightClass: "h-3 md:h-5",
    desktopH: 20,
    color: "#003BFF",
    isStandalone: true,
    hasNoSolidBody: true,
    standaloneRight: "38%",
    isMobileHidden: true,
  },
  // 5. Yellow bottom standalone bar (~16px desktop) - no solid body, lines + blocks only
  {
    id: "b5",
    baseTop: 83,
    defaultWidth: "26%",
    heightClass: "h-2.5 md:h-4",
    desktopH: 16,
    color: "#EBEB00",
    isYellow: true,
    isStandalone: true,
    hasNoSolidBody: true,
    standaloneRight: "25%",
    isMobileHidden: true,
  },
];

/**
 * Dynamically populate bar segments:
 * [thin lines x3-4] [gap] [blocks x3-5 with tight gaps] [small gap] [solid body -> right edge]
 * ALL elements are 100% the exact same height as the bar (no shorter elements).
 * Scaled relative to bar height H (baseline H=40px desktop).
 * Mobile: multiply all segment sizes and gaps by 0.6.
 */
function populateBarSegments(
  container: HTMLDivElement,
  bar: BarDef,
  isMobile: boolean
): number {
  const otherColors = GLITCH_PALETTE.filter((c) => c !== bar.color);
  const getColors = () => {
    const c1 = otherColors[Math.floor(Math.random() * otherColors.length)];
    const c2 = GLITCH_PALETTE[Math.floor(Math.random() * GLITCH_PALETTE.length)];
    const c3 = otherColors[Math.floor(Math.random() * otherColors.length)];
    return { c1, c2, c3 };
  };

  const frag = document.createDocumentFragment();
  let totalShardPx = 0;

  // Sizing baseline relative to bar height H
  const scale = isMobile ? 0.6 : 1.0;
  const H = bar.desktopH;

  // 1. Thin lines at leftmost tip (3-4 lines on desktop, 2 on mobile)
  // Baseline:
  // - Lebar garis tipis: sekitar 0.08H (~3px untuk H=40)
  // - Pitch antar garis: sekitar 0.18-0.2H (7-8px untuk H=40) -> margin = pitch - w = ~0.10-0.12H (4-5px)
  // - Celah garis terakhir -> blok pertama: 0.15-0.3H (6-12px untuk H=40, avg ~8px)
  const lineCount = isMobile ? 2 : 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < lineCount; i++) {
    const span = document.createElement("span");
    span.className = "glitch-segment block shrink-0 h-full";

    const w = Math.max(1.5, Math.round(0.08 * H * scale));
    const isLast = i === lineCount - 1;
    // Pitch 0.18-0.2H (7-8px at H=40), gap to blocks 0.15-0.3H (6-12px at H=40)
    const gap = isLast
      ? Math.max(4, Math.round((0.18 + Math.random() * 0.08) * H * scale))
      : Math.max(2, Math.round((0.10 + Math.random() * 0.02) * H * scale));

    const colors = getColors();
    const op = (0.75 + Math.random() * 0.20).toFixed(2);
    const delay = i * 35;

    span.style.width = `${w}px`;
    span.style.marginRight = `${gap}px`;
    span.style.opacity = op;
    span.style.animationDelay = `${delay}ms`;
    span.style.setProperty("--c1", colors.c1);
    span.style.setProperty("--c2", colors.c2);
    span.style.setProperty("--c3", colors.c3);
    span.style.setProperty("--final", bar.color);

    if (bar.isYellow) {
      span.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.25)";
    }

    totalShardPx += w + gap;
    frag.appendChild(span);
  }

  // 2. Blocks with tight gaps (3-5 blocks on desktop, 2-3 on mobile)
  // Baseline:
  // - Lebar blok: 1.0-2.5H (40-100px untuk H=40)
  // - Celah antar blok: 0.1-0.35H (4-14px untuk H=40, rata-rata rapat ~5-9px)
  // - Celah blok terakhir -> badan: 0.15-0.25H (6-10px untuk H=40, rata-rata ~8px)
  // - Total zona serpihan jadi sekitar 200-260px untuk H=40
  const blockCount = isMobile
    ? 2 + Math.floor(Math.random() * 2)
    : 3 + Math.floor(Math.random() * 2);

  for (let i = 0; i < blockCount; i++) {
    const span = document.createElement("span");
    span.className = "glitch-segment block shrink-0 h-full";

    const baseW = (1.1 + Math.random() * 1.1) * H; // 1.1H - 2.2H (44-88px untuk H=40)
    const w = Math.max(12, Math.round(baseW * scale));
    const isLast = i === blockCount - 1;
    // Celah antar blok: 0.1-0.35H; celah ke badan: 0.15-0.25H
    const baseGap = isLast
      ? (0.18 + Math.random() * 0.05) * H
      : (0.12 + Math.random() * 0.10) * H;
    const gap = Math.max(3, Math.round(baseGap * scale));

    const colors = getColors();
    const op = (0.50 + Math.random() * 0.40).toFixed(2); // 0.50-0.90
    const delay = (lineCount + i) * 35;

    span.style.width = `${w}px`;
    span.style.marginRight = `${gap}px`;
    span.style.opacity = op;
    span.style.animationDelay = `${delay}ms`;
    span.style.setProperty("--c1", colors.c1);
    span.style.setProperty("--c2", colors.c2);
    span.style.setProperty("--c3", colors.c3);
    span.style.setProperty("--final", bar.color);

    if (bar.isYellow) {
      span.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.25)";
    }

    totalShardPx += w + gap;
    frag.appendChild(span);
  }

  // 3. Solid body extending across remainder to right screen edge
  // Height: 100% full height of the bar (h-full)!
  if (!bar.hasNoSolidBody) {
    const span = document.createElement("span");
    span.className = "glitch-segment block shrink-0 h-full";

    const colors = getColors();
    span.style.width = bar.bodyLen || "25%";
    span.style.marginRight = "0px";
    span.style.opacity = "0.90"; // body ~0.9
    span.style.setProperty("--c1", colors.c1);
    span.style.setProperty("--c2", colors.c2);
    span.style.setProperty("--c3", colors.c3);
    span.style.setProperty("--final", bar.color);

    if (bar.isYellow) {
      span.style.boxShadow = "inset 0 0 0 1px rgba(0,0,0,0.25)";
    }

    frag.appendChild(span);
  }

  container.replaceChildren(frag);
  return totalShardPx;
}

export const GlitchBars: React.FC<{ className?: string }> = ({ className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const segmentContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    // Populate segment elements once per bar
    BARS_CONFIG.forEach((bar, idx) => {
      const segContainer = segmentContainerRefs.current[idx];
      const barEl = barRefs.current[idx];
      if (segContainer && barEl) {
        const shardPx = populateBarSegments(segContainer, bar, isMobile);
        if (bar.hasNoSolidBody) {
          barEl.style.width = `${shardPx}px`;
        } else {
          barEl.style.width = `calc(${bar.bodyLen || "25%"} + ${shardPx}px)`;
        }
      }
    });

    // 1. Accessibility: Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      BARS_CONFIG.forEach((bar, idx) => {
        const el = barRefs.current[idx];
        if (el) {
          el.style.clipPath = "inset(0 0 0 0%)";
          el.setAttribute("data-state", "hidden");
        }
      });

      // Single fade-in transition (300ms) to static length, then hold still permanently
      const reducedTimer = setTimeout(() => {
        BARS_CONFIG.forEach((_, idx) => {
          const el = barRefs.current[idx];
          if (el) el.setAttribute("data-state", "reduced");
        });
      }, 500);

      timersRef.current.push(reducedTimer);
      return () => {
        timersRef.current.forEach((t) => clearTimeout(t));
      };
    }

    // 2. Initial wait: wait until preloader finishes + hero headline appears (~1.2 - 1.6s)
    let hasPreloader = false;
    try {
      hasPreloader = !sessionStorage.getItem("stat_story_preloader_seen");
    } catch {
      // Ignore storage errors in restricted contexts
    }
    const initialWait = hasPreloader ? 2500 : 1200;

    /**
     * Start the one-way lifecycle:
     * hidden -> in (smooth clip-path reveal with cubic-bezier + discrete color cycle) -> settled (permanent)
     */
    const startInitialSequence = () => {
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      BARS_CONFIG.forEach((bar, idx) => {
        const barEl = barRefs.current[idx];
        if (!barEl) return;

        // Stagger entrance across bars (250 - 500ms)
        const stagger =
          STAGGER_BETWEEN_BARS_MS[0] +
          Math.random() * (STAGGER_BETWEEN_BARS_MS[1] - STAGGER_BETWEEN_BARS_MS[0]);
        const barDelay = initialWait + idx * stagger;

        const timer = setTimeout(() => {
          const duration = Math.floor(
            IN_DURATION_MS[0] + Math.random() * (IN_DURATION_MS[1] - IN_DURATION_MS[0])
          );

          barEl.style.setProperty("--in-duration", `${duration}ms`);
          barEl.setAttribute("data-state", "in");

          // Web Animations API: animate clip-path from right edge to full reveal
          // fast at start, long smooth deceleration to a complete stop
          if (typeof barEl.animate === "function") {
            const anim = barEl.animate(
              [
                { clipPath: "inset(0 0 0 100%)" },
                { clipPath: "inset(0 0 0 0%)" },
              ],
              {
                duration,
                easing: EASING_CURVE,
                fill: "forwards",
              }
            );

            anim.onfinish = () => {
              barEl.style.clipPath = "inset(0 0 0 0%)";
              barEl.setAttribute("data-state", "settled");
            };
          } else {
            barEl.style.clipPath = "inset(0 0 0 0%)";
            barEl.setAttribute("data-state", "settled");
          }
        }, barDelay);

        timersRef.current.push(timer);
      });
    };

    // 3. IntersectionObserver: Trigger once when hero is visible
    const currentContainer = containerRef.current;
    let observer: IntersectionObserver | null = null;

    if (currentContainer && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            startInitialSequence();
          }
        },
        { threshold: 0.05 }
      );

      observer.observe(currentContainer);
    } else {
      startInitialSequence();
    }

    // Cleanup on unmount
    return () => {
      if (observer) observer.disconnect();
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-[2] ${className}`}
    >
      {BARS_CONFIG.map((b, idx) => {
        // Mobile displays only the top 3 bars
        const isMobileHidden = b.isMobileHidden ? "hidden md:flex" : "flex";

        return (
          <div
            key={b.id}
            ref={(el) => {
              barRefs.current[idx] = el;
            }}
            data-state="hidden"
            data-bar-id={b.id}
            className={`glitch-bar-item absolute items-center justify-end ${b.heightClass} ${isMobileHidden}`}
            style={{
              top: `${b.baseTop}%`,
              right: b.isStandalone ? b.standaloneRight || "38%" : "0",
              width: b.defaultWidth,
              // Fallback color
              ["--final" as string]: b.color,
            }}
          >
            {/* Horizontal segments container: lines on left, blocks in middle, solid body on right */}
            <div
              ref={(el) => {
                segmentContainerRefs.current[idx] = el;
              }}
              className="flex items-center justify-end h-full w-full pointer-events-none"
            />
          </div>
        );
      })}
    </div>
  );
};
