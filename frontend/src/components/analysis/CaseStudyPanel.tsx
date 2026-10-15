"use client";

import React from "react";
import { BookOpen, Lightbulb } from "lucide-react";

interface CaseStudyPanelProps {
  contohKasus?: string[] | string | null;
}

export const CaseStudyPanel: React.FC<CaseStudyPanelProps> = ({ contohKasus }) => {
  const hasData =
    Boolean(contohKasus) &&
    (typeof contohKasus === "string" ? contohKasus.trim() !== "" : contohKasus!.length > 0);

  const items = Array.isArray(contohKasus)
    ? contohKasus
    : contohKasus
    ? [contohKasus]
    : [];

  return (
    <div className="border border-black bg-white">
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-3 flex items-center gap-2">
        <div className="w-6 h-6 bg-black text-white flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <span className="font-mono-tech text-xs font-bold text-black uppercase">
          CONTOH KASUS & ANALOGI DUNIA NYATA (FR-14)
        </span>
      </div>

      <div className="p-6 md:p-8">
        {!hasData ? (
          <div className="text-center font-mono-tech text-xs text-black/50 py-4">
            Contoh kasus atau analogi belum tersedia untuk hasil analisis ini.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-5 border border-black bg-[#FBFBFB] flex items-start gap-4"
              >
                <div className="w-8 h-8 bg-[#EBEB00] border border-black text-black flex items-center justify-center shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="font-mono-tech text-[10px] font-bold text-black/50 block uppercase">
                    ANALISIS ANALOGI #{idx + 1}
                  </span>
                  <p className="font-sans text-sm md:text-base text-black/90 leading-relaxed">
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
