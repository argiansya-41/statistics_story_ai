"use client";

import React from "react";
import { DataBackdrop } from "../ui/DataBackdrop";
import { emitMascot } from "@/lib/mascotBus";
import { content, Language } from "@/data/content";
import { APP_URL } from "@/data/links";

interface FinalCTAProps {
  lang: Language;
}

/**
 * CTA penutup. Sengaja tanpa klaim jumlah pengguna, testimoni, atau rating: yang ditampilkan hanya
 * fakta kemampuan produk (4 analisis, 2 bahasa, 3 grafik) sesuai PRD.
 */
export const FinalCTA: React.FC<FinalCTAProps> = ({ lang }) => {
  const t = content[lang].finalCta;

  return (
    <section
      id="mulai"
      className="relative overflow-hidden bg-[#000000] text-white border-b border-white/15 py-20 md:py-32 px-4 md:px-12 bg-blueprint-grid-dark"
    >
      <div className="relative z-10 max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 max-w-3xl">
          <h2 className="font-display font-normal text-[clamp(2.25rem,6vw,4.5rem)] tracking-[-0.035em] text-white leading-[1.02] mb-6">
            {t.title}
          </h2>
          <p className="font-sans font-normal text-lg sm:text-xl text-white/75 leading-[1.3] tracking-[-0.01em] mb-10">
            {t.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-12">
            <a
              href={APP_URL}
              onMouseEnter={() =>
                emitMascot({
                  section: "mulai",
                  who: "quin",
                  face: "wink",
                  text: {
                    id: "Klik, klik! Datamu sudah menunggu.",
                    en: "Click it! Your data is waiting.",
                  },
                })
              }
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-[#EBEB00] text-black font-mono-tech text-xs md:text-sm font-bold tracking-widest border border-black hover:bg-white transition-colors duration-200 select-none"
            >
              <span>{t.ctaPrimary}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1.5">→</span>
            </a>
            <a
              href="#demo"
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-transparent text-white font-mono-tech text-xs md:text-sm tracking-widest border border-white/40 hover:bg-white hover:text-black transition-colors duration-200 select-none"
            >
              <span>{t.ctaSecondary}</span>
              <span className="transition-transform duration-200 group-hover:translate-y-0.5">↓</span>
            </a>
          </div>

          <dl className="grid max-w-xl grid-cols-3 divide-x divide-white/20 border border-white/20">
            {t.facts.map((f) => (
              <div key={f.label} className="flex flex-col-reverse p-4 sm:p-6">
                <dt className="mt-2 font-mono-tech text-[10px] tracking-widest text-white/70 sm:text-xs">{f.label}</dt>
                <dd className="font-display text-4xl font-normal leading-none tracking-[-0.035em] text-[#EBEB00] sm:text-5xl">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Panel latar */}
        <div className="relative lg:col-span-5 flex flex-col items-center justify-end min-h-[260px] lg:min-h-[380px]">
          <DataBackdrop variant="skyline" className="absolute inset-0 w-full h-full" />
          <p className="relative z-10 mb-3 self-start font-mono-tech text-[10px] tracking-widest text-white/50">
            * {t.mascotHint}
          </p>
          <div className="relative z-10 w-full h-2 bg-[#EBEB00]" />
        </div>
      </div>
    </section>
  );
};
