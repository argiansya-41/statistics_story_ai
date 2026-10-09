"use client";

import React, { useEffect, useState } from "react";
import { HistogramGlyph } from "../ui/HistogramGlyph";
import { Mascot } from "../ui/Mascot";

export const Preloader: React.FC = () => {
  const [show, setShow] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [exiting, setExiting] = useState<boolean>(false);

  useEffect(() => {
    // Check reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      return;
    }

    // Check sessionStorage
    try {
      const alreadyLoaded = sessionStorage.getItem("stat_story_preloader_seen");
      if (alreadyLoaded) {
        return;
      }
      sessionStorage.setItem("stat_story_preloader_seen", "true");
    } catch {
      // Ignore storage errors in restricted contexts
    }

    setShow(true);

    const startTime = Date.now();
    const duration = 750; // fast 750ms

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => {
            setShow(false);
          }, 400);
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col justify-between bg-[#000000] p-6 md:p-12 text-white transition-transform duration-500 ease-out select-none ${
        exiting ? "-translate-y-full opacity-90" : "translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/15 pb-4">
        <div className="flex items-center gap-3">
          <HistogramGlyph size="md" variant="default" />
          <span className="font-mono-tech text-xs tracking-widest text-[#EBEB00]">
            STATISTICS STORY AI
          </span>
        </div>
        <span className="font-mono-tech text-xs text-white/50">SYSTEM BOOT</span>
      </div>

      <div className="max-w-xl">
        <p className="font-mono-tech text-xs text-white/40 mb-2">LOADING COMPUTATION ENGINE & RAG KNOWLEDGE BASE</p>
        <div className="flex items-baseline gap-4 mb-4">
          <span className="font-display text-5xl md:text-7xl font-normal tracking-tight text-white">
            {progress}%
          </span>
          <span className="font-mono-tech text-xs text-[#003BFF]">INITIALIZING</span>
        </div>
        {/* Loading track with walking Sigi */}
        <div className="relative w-full">
          <div
            className="absolute -top-14 transition-all duration-75 pointer-events-none"
            style={{ left: `calc(${progress}% - 28px)` }}
          >
            <Mascot character="sigi" pose="walk" face="smile" className="w-14 h-14 md:w-16 md:h-16" />
          </div>
          <div className="h-1.5 w-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#EBEB00] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/15 pt-4 text-[10px] font-mono-tech text-white/40">
        <span>SCIPY · STATSMODELS · CHROMADB</span>
        <span>STATISTICS STORY AI © 2026</span>
      </div>
    </div>
  );
};
