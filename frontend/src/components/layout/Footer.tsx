"use client";

import React from "react";
import { HistogramGlyph } from "../ui/HistogramGlyph";
import { DataBackdrop } from "../ui/DataBackdrop";
import { content, Language } from "@/data/content";

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = content[lang].footer;

  return (
    <footer className="relative overflow-hidden bg-[#000000] text-white border-t border-white/20 pt-20 pb-16 px-4 md:px-12 bg-blueprint-grid-dark">
      {/* Faint Statistical Histogram Skyline Backdrop */}
      <DataBackdrop
        variant="skyline"
        className="absolute bottom-0 left-0 w-full h-[220px] md:h-[300px]"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Column: Brand & Attribution */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              {/* Bell Curve Logo Mark */}
              <svg
                className="w-7 h-7 text-[#EBEB00]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
              </svg>
              <span className="font-display font-normal text-xl tracking-tight text-white">
                Statistics Story <span className="text-[#EBEB00]">AI</span>
              </span>
            </div>

            <p className="font-sans font-normal text-base text-white/70 max-w-lg mb-8 leading-[1.4]">
              {t.tagline}
            </p>

            {/* Social Icons Placeholder */}
            <div className="flex items-center gap-3 mb-10">
              {["GITHUB", "TWITTER", "LINKEDIN", "DISCORD"].map((net) => (
                <a
                  key={net}
                  href="#"
                  className="px-3 py-1.5 border border-white/20 bg-white/5 font-mono-tech text-[10px] text-white/70 hover:text-black hover:bg-[#EBEB00] hover:border-black transition-colors"
                >
                  {net}
                </a>
              ))}
            </div>
          </div>

          {/* Copyright & Legal Links */}
          <div className="border-t border-white/10 pt-8 font-mono-tech text-xs text-white/50">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span>{t.copyright}</span>
              <span>·</span>
              <a href="#" className="hover:text-white underline">
                {t.privacyPolicy}
              </a>
              <span>·</span>
              <a href="#" className="hover:text-white underline">
                {t.terms}
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Stacked Navigation Boxes (Scribe signature format) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="border border-white/20 divide-y divide-white/20 bg-[#080808]">
              {t.links.map((link, idx) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between p-5 font-mono-tech text-xs tracking-widest text-white/80 hover:bg-[#EBEB00] hover:text-black transition-colors duration-150 select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 group-hover:text-black">0{idx + 1}.</span>
                    <span className="font-normal">{link.label}</span>
                  </div>
                  <span className="transition-transform duration-200 group-hover:translate-x-1.5">
                    →
                  </span>
                </a>
              ))}
            </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between font-mono-tech text-[11px] text-white/40">
            <span>{t.builtBy}</span>
            <HistogramGlyph size="sm" variant="default" />
          </div>
        </div>
      </div>
    </footer>
  );
};
