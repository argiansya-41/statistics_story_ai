"use client";

import React from "react";
import { GenerativeCanvas } from "../ui/GenerativeCanvas";
import { GlitchBars } from "../ui/GlitchBars";
import { emitMascot } from "@/lib/mascotBus";
import { content, Language } from "@/data/content";
import { APP_URL } from "@/data/links";

interface HeroProps {
  lang: Language;
}

export const Hero: React.FC<HeroProps> = ({ lang }) => {
  const t = content[lang].hero;

  const croppedGridStyle: React.CSSProperties = {
    backgroundSize: "34px 34px",
    backgroundImage:
      "linear-gradient(to right, #E4E4E4 1px, transparent 1px), linear-gradient(to bottom, #E4E4E4 1px, transparent 1px)",
  };

  return (
    <section
      id="hero"
      data-theme="light"
      className="relative min-h-[92vh] md:min-h-screen flex flex-col justify-between pt-28 md:pt-36 pb-0 px-4 md:px-12 bg-[#FFFFFF] text-[#000000] border-b border-[#000000] overflow-hidden"
    >
      {/* Cropped blueprint grid patches (replaces full canvas grid) */}
      <div
        aria-hidden="true"
        style={croppedGridStyle}
        className="absolute top-20 left-0 w-48 h-48 pointer-events-none z-[1] border-r border-b border-[#E4E4E4]"
      />
      <div
        aria-hidden="true"
        style={croppedGridStyle}
        className="absolute top-16 right-0 w-72 h-64 pointer-events-none z-[1] border-l border-b border-[#E4E4E4]"
      />
      <div
        aria-hidden="true"
        style={croppedGridStyle}
        className="absolute bottom-16 left-0 w-56 h-48 pointer-events-none z-[1] border-r border-t border-[#E4E4E4]"
      />
      <div
        aria-hidden="true"
        style={croppedGridStyle}
        className="absolute bottom-16 right-24 w-40 h-36 pointer-events-none z-[1] border-l border-t border-[#E4E4E4] hidden md:block"
      />

      {/* Layer 1: Background Generative Canvas (240 dots, right concentrated) */}
      <div className="absolute inset-0 z-0">
        <GenerativeCanvas variant="hero" />
      </div>

      {/* Layer 2: Horizontal Glitch Bars across hero */}
      <GlitchBars />

      {/* Layer 3: Main Content (above canvas and glitch bars) */}
      <div className="relative z-10 max-w-[1440px] mx-auto w-full my-auto py-12 md:py-20">
        <div className="max-w-4xl">
          {/* Entire headline in solid blue block #003BFF with white text and clone box decoration */}
          <h1 className="font-display font-normal text-[clamp(2.5rem,7.5vw,6rem)] tracking-[-0.035em] text-white leading-[1.12] mb-8 select-none">
            <span
              className="inline bg-[#003BFF] text-white px-[0.12em] py-[0.05em]"
              style={{
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                lineHeight: "1.12",
              }}
            >
              {t.headline}
            </span>
          </h1>

          {/* Subtitle in clean dark text */}
          <p className="font-sans font-normal text-lg sm:text-xl md:text-2xl text-[#000000]/80 max-w-2xl leading-[1.3] tracking-[-0.01em] mb-10">
            {t.subheadline}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={APP_URL}
              onMouseEnter={() =>
                emitMascot({
                  section: "hero",
                  who: "quin",
                  face: "wink",
                  text: { id: "Klik, klik! Ayo mulai.", en: "Click it! Let's start." },
                })
              }
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-[#EBEB00] text-black font-mono-tech text-xs md:text-sm font-bold tracking-widest border border-black hover:bg-black hover:text-white transition-colors duration-200 select-none"
            >
              <span>{t.ctaPrimary}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1.5">
                →
              </span>
            </a>

            <a
              href="#demo"
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-white text-black font-mono-tech text-xs md:text-sm font-normal tracking-widest border border-black hover:bg-black hover:text-white transition-colors duration-200 select-none"
            >
              <span>{t.ctaSecondary}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1.5">
                ↓
              </span>
            </a>
          </div>
        </div>
      </div>

      {/* Layer 4: Clean Bottom Technical Status Strip */}
      <div className="relative z-10 w-full border-t border-[#000000] bg-white/70 backdrop-blur-xs">
        <div className="max-w-[1440px] mx-auto w-full py-4 flex items-center justify-between font-mono-tech text-[10px] md:text-xs text-black">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 bg-[#003BFF] animate-pulse" />
            <span className="tracking-wider">{t.statsBadge}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
