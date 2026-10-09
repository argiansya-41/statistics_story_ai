"use client";

import React from "react";
import { content, Language } from "@/data/content";

type AudienceCardData = (typeof content)["id"]["audience"]["cards"][number];

interface AudienceCardProps {
  card: AudienceCardData;
  idx: number;
}

const AudienceCard: React.FC<AudienceCardProps> = ({ card, idx }) => {
  return (
    <div className="group bg-white border border-black p-8 sm:p-12 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden">
      {/* Corner Ribbon */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-[#F4F4F4] border-b border-l border-black flex items-center justify-center font-mono-tech text-xs text-black">
        0{idx + 1}
      </div>

      <div>
        {/* Geometric Statistical Graphic Accent */}
        <div className="w-16 h-16 border border-black mb-8 p-3 flex items-center justify-center bg-[#F8F9FA] group-hover:bg-[#EBEB00] transition-colors">
          {idx === 0 ? (
            // Bell curve icon for Students
            <svg
              className="w-10 h-10 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M2 18h20M2 18c3 0 5-1 6-5 1-4 2-8 2-8s1 4 2 8c1 4 3 5 6 5" />
            </svg>
          ) : (
            // Matrix / Data Grid icon for Instructors
            <svg
              className="w-10 h-10 text-black"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="3" y="3" width="18" height="18" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          )}
        </div>

        <div className="font-mono-tech text-xs text-[#003BFF] tracking-wider mb-2">
          {card.category}
        </div>

        <h3 className="font-display font-normal text-2xl sm:text-3xl text-black tracking-[-0.025em] leading-[1.1] mb-4">
          {card.title}
        </h3>

        <p className="font-sans font-normal text-base text-black/75 leading-[1.4] mb-8">
          {card.description}
        </p>

        {/* Key Points */}
        <ul className="space-y-3 mb-10 border-t border-black/10 pt-6">
          {card.points.map((pt, pIdx) => (
            <li
              key={pIdx}
              className="flex items-center gap-3 font-sans font-normal text-sm text-black/85"
            >
              <span className="w-1.5 h-1.5 bg-[#003BFF] shrink-0" />
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Card Action Link */}
      <div className="pt-6 border-t border-black">
        <a
          href="#demo"
          className="group/link inline-flex items-center gap-3 font-mono-tech text-xs font-bold tracking-widest text-black hover:text-[#003BFF] transition-colors"
        >
          <span>{card.linkText}</span>
          <span className="transition-transform duration-200 group-hover/link:translate-x-1.5">
            →
          </span>
        </a>
      </div>
    </div>
  );
};

interface AudienceProps {
  lang: Language;
}

export const Audience: React.FC<AudienceProps> = ({ lang }) => {
  const t = content[lang].audience;

  return (
    <section
      id="untuk-siapa"
      className="relative bg-[#F4F4F4] text-black border-b border-black py-20 md:py-32 px-4 md:px-12 bg-blueprint-grid"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Section Headline & Action */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16 md:mb-24">
          <div className="max-w-3xl">
            <h2 className="font-display font-normal text-[clamp(2.25rem,6vw,4.5rem)] tracking-[-0.035em] text-black leading-[1.02]">
              {t.title}
            </h2>
          </div>

          <a
            href="#mulai"
            className="group inline-flex items-center gap-3 px-6 py-3.5 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold tracking-widest border border-black hover:bg-black hover:text-white transition-colors duration-200 select-none self-start lg:self-auto"
          >
            <span>{t.cta}</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </a>
        </div>

        {/* Two Partner-Style Blueprint Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {t.cards.map((card, idx) => (
            <AudienceCard key={idx} card={card} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};
