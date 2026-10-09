"use client";

import React, { useState } from "react";
import { StepBlock } from "../ui/StepBlock";
import { GlitchFrame } from "../ui/GlitchFrame";
import { emitMascot } from "@/lib/mascotBus";
import { content, Language } from "@/data/content";

type Pillar = (typeof content)["id"]["problem"]["pillars"][number];

const FRAME_COLOR = {
  blue: "#003BFF",
  red: "#FF2E2E",
  yellow: "#000000",
} as const;

interface ProblemPillarsProps {
  lang: Language;
}

const PillarCard: React.FC<{ pillar: Pillar; index: number }> = ({
  pillar,
  index,
}) => {
  const [frame, setFrame] = useState({ seed: 0, cols: 0, rows: 0, on: false });

  const enter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    const { width, height } = e.currentTarget.getBoundingClientRect();
    const size = width < 640 ? 12 : 16;
    setFrame((f) => ({
      seed: f.seed + 1,
      cols: Math.max(6, Math.round(width / size)),
      rows: Math.max(6, Math.round(height / size)),
      on: true,
    }));

    const PILLAR_REACTIONS = [
      { who: "sigi", face: "happy", text: { id: "Kesimpulan siap pakai, tinggal salin!", en: "Ready-to-use conclusions, just copy!" } },
      { who: "mu", face: "smile", text: { id: "Penjelasanku hanya bersumber dari panduan yang valid.", en: "My explanations only come from valid guides." } },
      { who: "quin", face: "cool", text: { id: "Cukup unggah data. Tanpa kode, tanpa ribet.", en: "Just upload data. No code, no fuss." } },
    ] as const;
    emitMascot({ section: "masalah", ...PILLAR_REACTIONS[index] });
  };

  const leave = () => setFrame((f) => ({ ...f, on: false }));

  const badgeClasses = {
    blue: "bg-[#003BFF] text-white border border-[#003BFF]",
    red: "bg-[#FF2E2E] text-white border border-[#FF2E2E]",
    yellow: "bg-[#000000] text-white border border-[#000000]",
  }[pillar.color];

  return (
    <div
      onPointerEnter={enter}
      onPointerLeave={leave}
      className="relative overflow-hidden flex flex-col min-h-[320px] md:min-h-[380px]"
    >
      <GlitchFrame
        cols={frame.cols}
        rows={frame.rows}
        seed={frame.seed}
        on={frame.on}
        color={FRAME_COLOR[pillar.color]}
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between p-8 md:p-12">
        <div>
          <div className="flex items-center justify-between mb-8">
            {/* Pillar Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 font-mono-tech text-[11px] tracking-wider ${badgeClasses}`}
            >
              <svg
                className="w-3.5 h-3.5 text-white shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="square"
                aria-hidden="true"
              >
                <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
              </svg>
              <span>{pillar.badge}</span>
            </div>
            <span className="font-mono-tech text-xs text-black/40">
              0{index + 1}
            </span>
          </div>

          <h3 className="font-display font-normal text-2xl md:text-3xl text-black tracking-[-0.025em] leading-[1.1] mb-4">
            {pillar.title}
          </h3>

          <p className="font-sans font-normal text-sm md:text-base text-black/70 leading-relaxed">
            {pillar.description}
          </p>
        </div>

        <div className="pt-8 border-t border-black/10 mt-6 flex items-center justify-between font-mono-tech text-[10px] text-black/50">
          <span>SPECIFICATION PILLAR</span>
        </div>
      </div>
    </div>
  );
};

export const ProblemPillars: React.FC<ProblemPillarsProps> = ({ lang }) => {
  const t = content[lang].problem;

  return (
    <section
      id="masalah"
      className="relative bg-[#F4F4F4] text-[#000000] border-b border-[#000000] py-20 md:py-32 px-4 md:px-12 bg-blueprint-grid"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Stepped Box for the Big Question (Dark tone on light canvas) */}
        <div className="mb-16 md:mb-24">
          <StepBlock title={t.question} tone="dark">
            <p className="mb-4">{t.context}</p>
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 font-mono-tech text-xs tracking-widest text-[#EBEB00] border-b border-[#EBEB00] pb-1 hover:text-white hover:border-white transition-colors"
            >
              <span>{t.linkText}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </a>
          </StepBlock>
        </div>

        {/* Three Pillars Modular Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-[#000000] bg-white divide-y md:divide-y-0 md:divide-x divide-[#000000]">
          {t.pillars.map((pillar, idx) => (
            <PillarCard key={pillar.id} pillar={pillar} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};
