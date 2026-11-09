"use client";

import React from "react";
import { GlitchStrip } from "../ui/GlitchStrip";
import { emitMascot } from "@/lib/mascotBus";
import { content, Language } from "@/data/content";
import { APP_URL } from "@/data/links";
import { useTryNow } from "@/lib/tryNow";

interface FinalCTAProps {
  lang: Language;
}

/**
 * CTA penutup dengan gaya teks editorial dan latar belakang teknikal
 * terinspirasi dari Scribe Therapeutics Platform (https://www.scribetx.com/platform).
 * Garis platform dan 3 kolom fakta membentang penuh dari kiri ke kanan.
 */
export const FinalCTA: React.FC<FinalCTAProps> = ({ lang }) => {
  const t = content[lang].finalCta;
  const tryNow = useTryNow(APP_URL);

  return (
    <section
      id="mulai"
      className="relative overflow-hidden bg-[#000000] text-white border-b border-white/15 pt-0 pb-16 md:pb-24 px-4 md:px-12 bg-blueprint-grid-dark scroll-mt-24"
    >
      {/* Glitch Strip at the top divider of the section */}
      <GlitchStrip className="mb-16 md:mb-24" />

      {/* 1. Scribe Platform Wireframe Grid Matrix Clusters (Latar belakang kisi piksel teknikal) */}
      <div
        aria-hidden="true"
        className="absolute top-10 right-[32%] pointer-events-none select-none opacity-25 hidden md:grid grid-cols-8 grid-rows-3 gap-0"
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={`grid-top-${i}`} className="w-8 h-8 border border-white/20" />
        ))}
      </div>

      <div
        aria-hidden="true"
        className="absolute top-14 right-8 pointer-events-none select-none opacity-25 hidden lg:block"
      >
        <div className="grid grid-cols-6 grid-rows-2 gap-0 ml-16">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`grid-r1-${i}`} className="w-8 h-8 border border-white/20" />
          ))}
        </div>
        <div className="grid grid-cols-8 grid-rows-2 gap-0 -mt-px">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={`grid-r2-${i}`} className="w-8 h-8 border border-white/20" />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto">
        {/* 2. Gaya Teks Headline Scribe: Blok Label Putih & Biru Kontras Tinggi */}
        <div className="max-w-4xl mb-4">
          <h2 className="font-display font-normal text-[clamp(2.1rem,5vw,4.25rem)] tracking-[-0.035em] leading-[1.25] select-none flex flex-wrap items-center gap-y-3">
            <span className="inline-block bg-white text-black px-3.5 py-1 md:px-5 md:py-2 mr-3 box-decoration-clone">
              {lang === "id" ? "Ubah angkamu menjadi" : "Turn your data into"}
            </span>
            <span className="inline-block bg-[#003BFF] text-white px-3.5 py-1 md:px-5 md:py-2 mr-3 box-decoration-clone">
              {lang === "id" ? "cerita" : "stories"}
            </span>
            <span className="inline-block bg-white text-black px-3.5 py-1 md:px-5 md:py-2 box-decoration-clone">
              {lang === "id" ? "hari ini." : "today."}
            </span>
          </h2>

          <p className="font-sans font-normal text-lg sm:text-xl text-white/75 leading-[1.35] tracking-[-0.01em] max-w-2xl mt-4">
            {t.subtitle}
          </p>

          {/* Tombol Aksi CTA */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <a
              href={APP_URL}
              onClick={tryNow}
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
        </div>

        {/* 3. Garis Tangle Spline ke Barcode Glitch (Membentang Penuh 100% sampai ujung kanan) */}
        <div className="w-full overflow-hidden my-8 md:my-12">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1400 77"
            fill="none"
            className="w-full h-auto select-none pointer-events-none block"
            aria-hidden="true"
          >
            {/* Garis organik meliuk dan membentuk loop kusut di tengah lalu lurus menyambung ke barcode di ujung kanan */}
            <path
              d="M14.1602 46.083C85.1838 46.083 156.815 48.8018 227.622 42.2152C264.031 38.8283 296.5 28.7476 331.289 18.1378C353.819 11.2666 377.569 3.88234 401.158 1.40935C427.065 -1.30662 449.426 9.89571 470.731 23.0693C485.564 32.2414 495.281 50.4886 511.842 56.3328C523.444 60.4273 542.375 65.6279 553.151 57.1064C565.339 47.4678 579.06 15.7906 557.795 8.85496C551.99 6.96164 547.292 9.41331 549.395 16.3006C554.343 32.5007 577.366 39.7 592.582 35.4464C601.859 32.8528 610.816 19.3479 601.97 10.6922C599.742 8.51266 594.368 9.2348 592.285 11.2724C588.159 15.3102 591.403 23.5133 593.273 27.7107C597.792 37.8536 602.071 48.2229 602.958 59.4271C605.524 91.8091 563.107 57.0258 562.44 40.2812C562.096 31.6499 580.062 28.8711 585.96 28.8711C594.778 28.8711 603.262 33.0206 607.899 40.4746C612.419 47.7398 609.955 57.836 599.796 57.4932C592.952 57.2623 592.168 48.6927 592.384 44.0524C593.133 27.9225 605.53 23.2359 621.142 26.7438C644.391 31.9674 636.481 64.6931 658.201 73.6415C664.579 76.2691 675.057 77.5867 680.634 72.7712C690.696 64.0843 702.387 56.8521 711.27 46.9533C720.279 36.9145 735.345 22.7701 749.812 34.8663C756.384 40.3612 754.176 49.015 756.137 56.1394C759.209 67.3072 769.516 71.8893 780.349 73.4481C809.16 73.4481 813.16 70 825.709 66.9694C825.709 66.9694 852.114 60.5846 865.635 55.1725C887.184 46.5466 916.026 51.3046 939.16 51.3046 L 1078.16 51.3046"
              stroke="white"
              strokeWidth="1.6"
              strokeMiterlimit="16"
              strokeLinecap="round"
            />
            {/* Titik merah awal */}
            <circle cx="12" cy="46" r="10" fill="#EF2929" />

            {/* Barcode glitch warna-warni digeser ke ujung kanan (x mencapai 1400) */}
            <g transform="translate(139, 0)">
              <rect width="87.328" height="24" transform="matrix(-1 0 0 1 973.33 34)" fill="#EF2929" />
              <rect width="1.44344" height="24" transform="matrix(-1 0 0 1 998.59 34)" fill="#003BFF" />
              <rect width="1.44344" height="24" transform="matrix(-1 0 0 1 1004.36 34)" fill="#EF2929" />
              <rect width="1.44344" height="24" transform="matrix(-1 0 0 1 1008.69 34)" fill="#003BFF" />
              <rect width="2.88688" height="24" transform="matrix(-1 0 0 1 1013.02 34)" fill="#FFE500" />
              <rect width="2.88688" height="24" transform="matrix(-1 0 0 1 1017.35 34)" fill="#003BFF" />
              <rect width="2.88688" height="24" transform="matrix(-1 0 0 1 1021.68 34)" fill="#003BFF" />
              <rect width="18.043" height="24" transform="matrix(-1 0 0 1 1087.36 34)" fill="#EF2929" />
              <rect width="18.043" height="24" transform="matrix(-1 0 0 1 1121.28 34)" fill="#003BFF" />
              <rect width="28.147" height="24" transform="matrix(-1 0 0 1 1051 34)" fill="#003BFF" />
              <rect width="16.5995" height="24" transform="matrix(-1 0 0 1 1161.7 34)" fill="#FFE500" />
              <rect width="5.05203" height="24" transform="matrix(-1 0 0 1 1168.19 34)" fill="#FFE500" />
              <rect width="2.16516" height="24" transform="matrix(-1 0 0 1 1171.8 34)" fill="#FFE500" />
              <rect width="2" height="24" transform="matrix(-1 0 0 1 1229 34)" fill="#003BFF" />
              <rect width="5" height="24" transform="matrix(-1 0 0 1 1236 34)" fill="#003BFF" />
              <rect width="23" height="24" transform="matrix(-1 0 0 1 1261 34)" fill="#003BFF" />
            </g>
          </svg>
        </div>

        {/* 4. Tiga Kolom Fakta Teknis Membentang Penuh Lebar Kontainer (Spanning Full Width) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full mt-4">
          {/* Kolom 1 */}
          <div className="flex flex-col border-t border-white/20 pt-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-4xl sm:text-5xl font-normal leading-none tracking-[-0.035em] text-[#EBEB00]">
                4
              </span>
              <h3 className="font-mono-tech text-xs tracking-widest text-white font-bold">
                {lang === "id" ? "JENIS ANALISIS" : "TYPES OF ANALYSIS"}
              </h3>
            </div>
            <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed">
              {lang === "id"
                ? "Komparatif, Asosiatif, Korelasi, dan Deskriptif dengan validasi otomatis dan uji asumsi prasyarat tanpa perlu rumus manual."
                : "Comparative, Associative, Correlation, and Descriptive with automatic assumption checks and instant validation."}
            </p>
          </div>

          {/* Kolom 2 */}
          <div className="flex flex-col border-t border-white/20 pt-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-4xl sm:text-5xl font-normal leading-none tracking-[-0.035em] text-[#EBEB00]">
                2
              </span>
              <h3 className="font-mono-tech text-xs tracking-widest text-white font-bold">
                {lang === "id" ? "BAHASA NARASI" : "NARRATIVE LANGUAGES"}
              </h3>
            </div>
            <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed">
              {lang === "id"
                ? "Narasi interpretatif ilmiah lengkap dalam Bahasa Indonesia akademik formal dan English standard, siap salin ke skripsi atau jurnal."
                : "Complete scientific interpretations in formal academic Indonesian and standard English, publication-ready."}
            </p>
          </div>

          {/* Kolom 3 */}
          <div className="flex flex-col border-t border-white/20 pt-6">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-4xl sm:text-5xl font-normal leading-none tracking-[-0.035em] text-[#EBEB00]">
                3
              </span>
              <h3 className="font-mono-tech text-xs tracking-widest text-white font-bold">
                {lang === "id" ? "JENIS GRAFIK" : "CHART TYPES"}
              </h3>
            </div>
            <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed">
              {lang === "id"
                ? "Visualisasi grafik publikasi presisi: histogram distribusi frekuensi, scatter plot deterministik, dan diagram batang proporsional."
                : "High-precision publication charts: frequency histograms, deterministic scatter plots, and proportional bar charts."}
            </p>
          </div>
        </div>

        {/* 5. Rel Panggung Maskot & Petunjuk Interaksi */}
        <div className="mt-14 flex flex-col items-center">
          <p className="self-start font-mono-tech text-[10px] tracking-widest text-white/50 mb-3">
            * {t.mascotHint}
          </p>
          <div className="w-full h-2 bg-[#EBEB00]" />
        </div>
      </div>
    </section>
  );
};
