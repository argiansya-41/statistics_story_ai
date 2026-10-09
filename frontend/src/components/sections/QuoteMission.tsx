"use client";

import React from "react";
import { GenerativeCanvas } from "../ui/GenerativeCanvas";
import { GlitchStrip } from "../ui/GlitchStrip";
import { content, Language } from "@/data/content";

interface QuoteMissionProps {
  lang: Language;
}

export const QuoteMission: React.FC<QuoteMissionProps> = ({ lang }) => {
  const t = content[lang].quote;

  return (
    <section
      id="misi"
      className="relative bg-[#000000] text-white border-b border-white/15 pt-28 md:pt-40 pb-0 px-4 md:px-12 overflow-hidden flex flex-col items-center justify-between min-h-[520px]"
    >
      {/* Ambient Generative Background (2nd canvas, ambient calm speed) */}
      <div className="absolute inset-0 z-0 opacity-40">
        <GenerativeCanvas variant="ambient" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center my-auto pb-16">
        {/* Big Editorial Quote (Regular 400, tight tracking) */}
        <blockquote className="font-display font-normal text-[clamp(2.25rem,5.5vw,4.5rem)] text-white tracking-[-0.035em] leading-[1.04] mb-10">
          {t.quoteText}
        </blockquote>

        {/* Attribution Details (Only rendered if provided) */}
        {t.attribution && (
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-mono-tech text-xs md:text-sm text-white/80 border-t border-white/20 pt-6">
            <span className="text-[#EBEB00] font-normal">{t.attribution}</span>
            {t.role && (
              <>
                <span className="hidden sm:inline text-white/30">|</span>
                <span className="text-white/60 font-normal">{t.role}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Glitch Strip at the bottom of Quote Section */}
      <GlitchStrip className="relative z-10" />
    </section>
  );
};
