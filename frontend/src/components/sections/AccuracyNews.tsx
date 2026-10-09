"use client";

import React from "react";
import { GlitchStrip } from "../ui/GlitchStrip";
import { DataBackdrop } from "../ui/DataBackdrop";
import { content, Language } from "@/data/content";

interface AccuracyNewsProps {
  lang: Language;
}

export const AccuracyNews: React.FC<AccuracyNewsProps> = ({ lang }) => {
  const t = content[lang].accuracy;

  return (
    <section
      id="akurasi"
      className="relative bg-[#000000] text-white border-b border-white/15 pt-0 pb-20 md:pb-32 px-4 md:px-12 bg-blueprint-grid-dark"
    >
      {/* Glitch Strip at the top divider of the News/Accuracy section */}
      <GlitchStrip className="mb-16 md:mb-24" />

      {/* Faint Statistical Scatter Backdrop */}
      <DataBackdrop
        variant="scatter"
        className="absolute right-0 top-32 hidden lg:block w-[38%] max-w-[620px] h-[380px]"
      />

      <div className="relative z-10 max-w-[1440px] mx-auto">
        {/* Section Headline */}
        <div className="max-w-4xl mb-12">
          <h2 className="font-display font-normal text-[clamp(2.25rem,6vw,4.5rem)] tracking-[-0.035em] text-white leading-[1.02] mb-6">
            {t.title}
          </h2>
          <p className="font-sans font-normal text-lg sm:text-xl text-white/75 max-w-2xl leading-[1.3] tracking-[-0.01em] mb-6">
            {t.subtitle}
          </p>

          {/* Mandatory Transparent Note Alert */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-white/5 border border-white/20 font-mono-tech text-xs text-[#EBEB00]">
            <span className="w-2 h-2 bg-[#EBEB00] animate-pulse" />
            <span>CATATAN: {t.mandatoryNote}</span>
          </div>
        </div>

        {/* Scribe "In the News" Style 3-Row Modular Table */}
        <div className="border border-white/20 divide-y divide-white/20 bg-[#0A0A0A]">
          {t.items.map((item, idx) => (
            <div
              key={idx}
              className="group p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-white/5 transition-colors duration-200"
            >
              {/* Left Details */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <span className="font-mono-tech text-[11px] text-[#003BFF] tracking-widest">
                    {item.tag}
                  </span>
                  <span className="text-white/20">|</span>
                  <span
                    className={`font-mono-tech text-[10px] tracking-wider px-2 py-0.5 border ${
                      item.isPrepared
                        ? "text-[#EBEB00] border-[#EBEB00]/40 bg-[#EBEB00]/10"
                        : "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 className="font-display font-normal text-2xl sm:text-3xl text-white tracking-[-0.025em] leading-[1.15] mb-2 group-hover:text-[#EBEB00] transition-colors">
                  {item.title}
                </h3>

                <p className="font-sans font-normal text-sm sm:text-base text-white/70 leading-[1.4]">
                  {item.metric}
                </p>
              </div>

              {/* Right Action Button */}
              <div className="flex items-center gap-4 self-start lg:self-auto">
                <a
                  href="#mulai"
                  className="group/btn inline-flex items-center gap-2 px-5 py-2.5 font-mono-tech text-xs font-bold tracking-widest bg-transparent border border-white/30 text-white group-hover:border-white group-hover:bg-[#EBEB00] group-hover:text-black transition-all select-none"
                >
                  <span>{item.actionText}</span>
                  <span className="transition-transform duration-200 group-hover/btn:translate-x-1">
                    →
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
