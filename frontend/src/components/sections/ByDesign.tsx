"use client";

import React from "react";
import { StepBlock } from "../ui/StepBlock";
import { GlitchStrip } from "../ui/GlitchStrip";
import { content, Language } from "@/data/content";

interface ByDesignProps {
  lang: Language;
}

export const ByDesign: React.FC<ByDesignProps> = ({ lang }) => {
  const t = content[lang].byDesign;

  return (
    <section
      id="by-design"
      className="relative bg-[#000000] text-white border-b border-white/15 pt-20 md:pt-32 pb-0 px-4 md:px-12 bg-blueprint-grid-dark overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Section Headline */}
        <div className="max-w-4xl mb-16 md:mb-24">
          <h2 className="font-display font-normal text-[clamp(2.5rem,6.5vw,5rem)] tracking-[-0.035em] text-white leading-[1.02] mb-6">
            {t.title}
          </h2>
          <p className="font-sans font-normal text-lg sm:text-xl md:text-2xl text-white/80 max-w-2xl leading-[1.3] tracking-[-0.01em]">
            {t.subtitle}
          </p>
        </div>

        {/* Two Stepped White Box Modules (Portfolio by Design & Engineering by Design style) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pb-20 md:pb-28">
          {t.blocks.map((block, idx) => (
            <div key={idx} className="flex flex-col relative">
              <StepBlock title={block.title} tone="light">
                <p className="font-sans font-normal text-black/85 mb-6 text-lg md:text-xl leading-[1.3] tracking-[-0.01em]">
                  {block.description}
                </p>

                {/* Features Checkpoints (Clean sentence case, NOT uppercase monospace) */}
                <div className="space-y-2.5 mb-8 border-t border-black/10 pt-5">
                  {block.features.map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      className="flex items-center gap-2.5 font-sans font-normal text-sm md:text-base text-black/80"
                    >
                      <span className="w-1.5 h-1.5 bg-[#003BFF] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Link Button */}
                <div className="pt-2">
                  <a
                    href={block.ctaHref}
                    className="group inline-flex items-center gap-3 px-6 py-3 bg-black text-white font-mono-tech text-xs font-bold tracking-widest hover:bg-[#EBEB00] hover:text-black transition-colors"
                  >
                    <span>{block.cta}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </div>
              </StepBlock>
            </div>
          ))}
        </div>
      </div>

      {/* Glitch Strip at the bottom of ByDesign section */}
      <GlitchStrip />
    </section>
  );
};
