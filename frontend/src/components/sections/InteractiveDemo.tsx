"use client";

import React, { useState, useEffect, useRef } from "react";
import { HistogramGlyph } from "../ui/HistogramGlyph";
import { emitMascot } from "@/lib/mascotBus";
import { content, Language } from "@/data/content";

interface InteractiveDemoProps {
  lang: Language;
}

export const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ lang }) => {
  const t = content[lang].demo;
  const [selectedAnalysis, setSelectedAnalysis] = useState<number>(0);
  const [typedText, setTypedText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showCaseStudy, setShowCaseStudy] = useState<boolean>(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  const sampleDatasets = [
    {
      name: lang === "id" ? "Regresi Linear: Jam Belajar vs Skor Ujian" : "Linear Regression: Study Hours vs Exam Score",
      equation: "Y = 4.25X + 48.50 (p = 0.003, R² = 0.68)",
      points: [
        { x: 15, y: 75 },
        { x: 25, y: 68 },
        { x: 35, y: 55 },
        { x: 45, y: 50 },
        { x: 55, y: 40 },
        { x: 65, y: 35 },
        { x: 75, y: 25 },
        { x: 85, y: 18 },
      ],
      line: { x1: 10, y1: 82, x2: 90, y2: 15 },
      narrative: t.narrationText,
      caseStudy: t.caseStudyText,
    },
    {
      name: lang === "id" ? "Uji t Independen: Metode A vs Metode B" : "Independent t-Test: Method A vs Method B",
      equation: "t(38) = 2.45, p = 0.019 (Signifikan pada α = 0.05)",
      points: [
        { x: 20, y: 65 },
        { x: 25, y: 60 },
        { x: 30, y: 70 },
        { x: 70, y: 35 },
        { x: 75, y: 30 },
        { x: 80, y: 40 },
      ],
      line: { x1: 15, y1: 65, x2: 85, y2: 35 },
      narrative:
        lang === "id"
          ? "Terdapat perbedaan rata-rata skor yang signifikan secara statistik antara kelompok Metode A (M = 72.4) dan Metode B (M = 81.8) dengan nilai t = 2.45 (p = 0.019 < 0.05). Metode B memberikan peningkatan skor yang terukur secara konsisten."
          : "There is a statistically significant mean difference between Method A (M = 72.4) and Method B (M = 81.8) with t = 2.45 (p = 0.019 < 0.05). Method B yields a measurable, consistent enhancement in performance.",
      caseStudy:
        lang === "id"
          ? "Analogi: Seperti membandingkan dua sepatu lari dengan bantalan berbeda pada pelari yang sama—selisih waktu tempuh membuktikan efektivitas bantalan baru."
          : "Analogy: Like comparing two running shoes with distinct cushioning on the same marathoner—the split time variance confirms the mechanical advantage.",
    },
    {
      name: lang === "id" ? "Korelasi Pearson: Kehadiran vs Nilai Akhir" : "Pearson Correlation: Attendance vs Final Grade",
      equation: "r = 0.74, p < 0.001 (Korelasi Positif Kuat)",
      points: [
        { x: 18, y: 78 },
        { x: 30, y: 62 },
        { x: 42, y: 52 },
        { x: 55, y: 44 },
        { x: 68, y: 32 },
        { x: 82, y: 20 },
      ],
      line: { x1: 12, y1: 85, x2: 88, y2: 15 },
      narrative:
        lang === "id"
          ? "Analisis korelasi Pearson menunjukkan hubungan positif yang kuat dan signifikan antara tingkat kehadiran mahasiswa dengan nilai akhir (r = 0.74, p < 0.001). Mahasiswa dengan kehadiran tinggi cenderung konsisten memperoleh nilai akhir lebih unggul."
          : "Pearson correlation analysis demonstrates a strong, statistically significant positive association between student attendance rate and final grade (r = 0.74, p < 0.001).",
      caseStudy:
        lang === "id"
          ? "Analogi: Ibarat frekuensi menyiram tanaman dengan laju pertumbuhannya—kehadiran teratur memberikan asupan kontinu yang mempercepat capaian akhir."
          : "Analogy: Like watering frequency and sapling growth—regular attendance provides the continuous nourishment that accelerates milestone achievement.",
    },
    {
      name: lang === "id" ? "Statistik Deskriptif: Distribusi Nilai Kelas" : "Descriptive Statistics: Class Grade Distribution",
      equation: "Mean = 74.5, SD = 8.2, Median = 75.0, Skewness = -0.12",
      points: [
        { x: 20, y: 80 },
        { x: 35, y: 45 },
        { x: 50, y: 20 },
        { x: 65, y: 45 },
        { x: 80, y: 80 },
      ],
      line: { x1: 20, y1: 50, x2: 80, y2: 50 },
      narrative:
        lang === "id"
          ? "Sebaran data nilai kelas mendekati distribusi normal simetris dengan nilai rata-rata (Mean) 74.5 dan standar deviasi 8.2. Nilai tengah (Median) 75.0 yang berdekatan dengan mean menandakan tidak ada outlier ekstrem yang mendistorsi gambaran kelas."
          : "The class score distribution closely resembles a symmetrical normal curve with a Mean of 74.5 and Standard Deviation of 8.2. The median of 75.0 aligns with the mean, indicating no extreme distortion from outliers.",
      caseStudy:
        lang === "id"
          ? "Analogi: Seperti tim sepak bola di mana seluruh pemain tampil merata di performa prima tanpa ketergantungan pada satu bintang tunggal."
          : "Analogy: Like a cohesive football squad where all players perform consistently at expected standards without relying on an outlier superstar.",
    },
  ];

  const currentData = sampleDatasets[selectedAnalysis];

  const startTypewriter = (text: string) => {
    // Check reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setTypedText(text);
      setShowCaseStudy(true);
      return;
    }

    setTypedText("");
    setIsTyping(true);
    emitMascot({ section: "demo", who: "mu", face: "talk", text: { id: "Narasinya lagi kutulis...", en: "Writing the narrative..." } });
    setShowCaseStudy(false);

    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx += 2;
      setTypedText(text.slice(0, charIdx));
      if (charIdx >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
        emitMascot({ section: "demo", who: "mu", face: "happy", text: { id: "Selesai! Bagaimana ceritanya?", en: "Done! How's the story?" }, ms: 2400 });
        setTimeout(() => setShowCaseStudy(true), 250);
      }
    }, 18);
  };

  useEffect(() => {
    startTypewriter(currentData.narrative);
  }, [selectedAnalysis, lang]);

  // Viewport trigger
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            startTypewriter(currentData.narrative);
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative bg-[#F4F4F4] text-black border-b border-black py-24 md:py-36 px-4 md:px-12 bg-blueprint-grid"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Section Headline */}
        <div className="max-w-4xl mb-12">
          <h2 className="font-display font-normal text-[clamp(2.25rem,6vw,4.5rem)] tracking-[-0.035em] text-black leading-[1.02] mb-6">
            {t.title}
          </h2>
          <p className="font-sans font-normal text-lg sm:text-xl text-black/75 max-w-2xl leading-[1.3] tracking-[-0.01em]">
            {t.subtitle}
          </p>
        </div>

        {/* Analysis Type Selector Tabs (Scribe blueprint button tab bar) */}
        <div className="flex flex-wrap border border-black bg-white mb-8 divide-x divide-black">
          {t.analysisOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedAnalysis(idx)}
              className={`px-5 py-3 font-mono-tech text-xs tracking-wider font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedAnalysis === idx
                  ? "bg-[#003BFF] text-white"
                  : "bg-white text-black hover:bg-[#EBEB00]"
              }`}
            >
              <span>0{idx + 1}.</span>
              <span>{opt}</span>
            </button>
          ))}
        </div>

        {/* Browser Frame Mockup */}
        <div className="relative border border-black bg-white shadow-2xl">
          {/* Browser Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-black bg-[#EFEFEF]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#FF2E2E] border border-black inline-block" />
              <span className="w-3 h-3 bg-[#EBEB00] border border-black inline-block" />
              <span className="w-3 h-3 bg-[#003BFF] border border-black inline-block" />
            </div>

            <div className="flex items-center gap-2 px-4 py-1 bg-white border border-black font-mono-tech text-[11px] text-black">
              <span>https://app.statisticsstory.ai/workspace/analysis</span>
            </div>

            <span className="font-mono-tech text-[10px] text-black/50 hidden sm:inline">
              SECURE RAG SANDBOX
            </span>
          </div>

          {/* Frame Inner Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
            {/* Left Column: Interactive Chart Visualization */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/10">
                  <span className="font-mono-tech text-[11px] font-bold text-[#003BFF]">
                    {currentData.name}
                  </span>
                  <span className="font-mono-tech text-[10px] text-black/40">SCIPY 1.13</span>
                </div>

                {/* SVG Chart Plot */}
                <div className="relative w-full aspect-[4/3] border border-black/20 bg-[#FBFBFB] p-4 flex flex-col justify-between">
                  {/* Chart Grid Lines */}
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Horizontal grid */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="#E5E5E5" strokeWidth="0.8" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#E5E5E5" strokeWidth="0.8" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="#E5E5E5" strokeWidth="0.8" />

                    {/* Vertical grid */}
                    <line x1="25" y1="0" x2="25" y2="100" stroke="#E5E5E5" strokeWidth="0.8" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#E5E5E5" strokeWidth="0.8" />
                    <line x1="75" y1="0" x2="75" y2="100" stroke="#E5E5E5" strokeWidth="0.8" />

                    {/* Regression Line */}
                    <line
                      x1={currentData.line.x1}
                      y1={currentData.line.y1}
                      x2={currentData.line.x2}
                      y2={currentData.line.y2}
                      stroke="#003BFF"
                      strokeWidth="2"
                      strokeDasharray="2,2"
                    />

                    {/* Data Points */}
                    {currentData.points.map((pt, i) => (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r="2.5"
                        fill={i % 2 === 0 ? "#FF2E2E" : "#003BFF"}
                        stroke="#000000"
                        strokeWidth="0.6"
                      />
                    ))}
                  </svg>
                </div>

                <div className="mt-4 p-3 bg-[#F4F4F4] border border-black/20 font-mono-tech text-[11px] text-black">
                  <span className="text-black/60 mr-2">EQUATION:</span>
                  <span className="text-black font-normal">{currentData.equation}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-[10px] font-mono-tech text-black/40">
                <span>INPUT: CSV VALIDATED</span>
                <span>CONFIDENCE: 95%</span>
              </div>
            </div>

            {/* Right Column: AI Interpretation & Case Study */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-[#F8F9FA]">
              <div>
                {/* Result Tag */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/10">
                  <div className="flex items-center gap-2">
                    <HistogramGlyph size="sm" variant="blue" />
                    <span className="font-mono-tech text-[11px] text-black font-normal">
                      {t.resultLabel}
                    </span>
                  </div>
                  {isTyping && (
                    <span className="font-mono-tech text-[10px] text-[#003BFF] animate-pulse">
                      RAG SYNTHESIZING...
                    </span>
                  )}
                </div>

                {/* Typewriter Interpretation Narrative */}
                <div className="p-5 bg-white border border-black mb-6 min-h-[140px]">
                  <p className="font-sans text-sm md:text-base text-black/85 leading-relaxed">
                    {typedText}
                    {isTyping && <span className="inline-block w-2 h-4 bg-[#003BFF] ml-1 animate-pulse" />}
                  </p>
                </div>

                {/* Case Study Card */}
                <div
                  className={`p-5 bg-[#EBEB00]/15 border-2 border-black transition-all duration-300 ${
                    showCaseStudy ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2 font-mono-tech text-[11px] font-normal text-black">
                    <span className="w-2 h-2 bg-[#FF2E2E]" />
                    <span>{t.caseStudyTitle}</span>
                  </div>
                  <p className="font-sans text-xs md:text-sm text-black/80 leading-relaxed italic">
                    {currentData.caseStudy}
                  </p>
                </div>
              </div>

              {/* Bottom Interactive Controls */}
              <div className="mt-8 pt-4 border-t border-black/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <span className="font-mono-tech text-[11px] text-black/60 italic">
                  * {t.disclaimer}
                </span>

                <button
                  onClick={() => startTypewriter(currentData.narrative)}
                  disabled={isTyping}
                  className="px-4 py-2 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#EBEB00] hover:text-black transition-colors border border-black cursor-pointer disabled:opacity-50"
                >
                  {t.regenerateText} ↺
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
