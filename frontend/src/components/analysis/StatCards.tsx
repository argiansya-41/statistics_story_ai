"use client";

import React, { useState } from "react";
import { Calculator, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import type {
  AnalysisType,
  DescriptiveResult,
  TTestResult,
  CorrelationResult,
  RegressionResult,
} from "@/lib/types/analysis";

interface StatCardsProps {
  jenisAnalisis: AnalysisType;
  hasil: any;
}

/**
 * Format angka statistik dengan pembulatan desimal yang rapi
 * agar tidak meluap (overflow) dari kolom kartu.
 */
function formatStatNumber(val: any, decimals: number = 4): string {
  if (val === null || val === undefined || val === "") return "-";
  if (typeof val === "string" && isNaN(Number(val))) return val;

  const num = Number(val);
  if (isNaN(num)) return String(val);

  if (Number.isInteger(num)) {
    return num.toString();
  }

  // Jika nilai sangat kecil tapi bukan 0 (mis. notasi eksponensial ilmiah)
  if (Math.abs(num) > 0 && Math.abs(num) < 0.0001) {
    return num.toExponential(3);
  }

  return Number(num.toFixed(decimals)).toString();
}

/**
 * Format p-value sesuai standar pelaporan ilmiah (APA Style):
 * Menghindari overflow bila nilai p-value sangat kecil (mis. 1.07e-241).
 */
function formatPValueDisplay(val: any): { display: string; note?: string } {
  if (val === null || val === undefined || val === "") return { display: "-" };
  const num = Number(val);
  if (isNaN(num)) return { display: String(val) };

  if (num === 0) return { display: "0.0000" };

  if (Math.abs(num) < 0.0001) {
    return {
      display: "< 0.0001",
      note: num.toExponential(2),
    };
  }

  return {
    display: num.toFixed(4),
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ jenisAnalisis, hasil }) => {
  if (!hasil) {
    return (
      <div className="border border-black p-6 bg-white font-mono-tech text-xs text-black/60">
        Hasil statistik belum tersedia.
      </div>
    );
  }

  // FR-07: DESKRIPTIF
  if (jenisAnalisis === "deskriptif") {
    const res: DescriptiveResult = hasil;
    const ringkasan = res.ringkasan || [];

    return (
      <div className="space-y-6">
        {ringkasan.map((item, idx) => (
          <div key={idx} className="border border-black bg-white">
            <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
              <span className="font-mono-tech text-xs font-bold text-black uppercase truncate mr-2">
                RINGKASAN STATISTIK: {item.kolom}
              </span>
              <span className="font-mono-tech text-[10px] text-black/50 shrink-0">
                N = {item.n} OBSERVASI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-black border-b border-black">
              {/* Mean */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">RATA-RATA (MEAN)</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-[#003BFF] mt-1 truncate" title={String(item.mean)}>
                  {formatStatNumber(item.mean, 2)}
                </div>
              </div>
              {/* Median */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">NILAI TENGAH (MEDIAN)</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(item.median)}>
                  {formatStatNumber(item.median, 2)}
                </div>
              </div>
              {/* Modus */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">MODUS</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={Array.isArray(item.modus) ? item.modus.join(", ") : String(item.modus)}>
                  {item.modus && item.modus.length > 0
                    ? item.modus.map((m: any) => formatStatNumber(m, 2)).join(", ")
                    : "-"}
                </div>
              </div>
              {/* Standar Deviasi */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">STANDAR DEVIASI</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(item.standar_deviasi)}>
                  {formatStatNumber(item.standar_deviasi, 4)}
                </div>
              </div>
              {/* Minimum */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">NILAI MINIMUM</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(item.min)}>
                  {formatStatNumber(item.min, 2)}
                </div>
              </div>
              {/* Maksimum */}
              <div className="p-4 bg-white min-w-0 overflow-hidden">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">NILAI MAKSIMUM</div>
                <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(item.max)}>
                  {formatStatNumber(item.max, 2)}
                </div>
              </div>
            </div>

            {/* Panduan Membaca Angka Statistik Sederhana */}
            <div className="p-4 bg-[#F8FAFC] border-t border-black space-y-3">
              <div className="flex items-center gap-2 font-mono-tech text-xs font-bold text-black uppercase">
                <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
                <span>CARA MEMBACA ANGKA DI ATAS (PENJELASAN SEDERHANA):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
                  <div className="font-mono-tech font-bold text-[#003BFF]">
                    1. Rata-Rata (Mean = {formatStatNumber(item.mean, 2)})
                  </div>
                  <p className="font-sans text-black/75 leading-relaxed">
                    Jika semua nilai dikumpulkan lalu dibagi rata secara adil, angka patokan umumnya adalah <strong>{formatStatNumber(item.mean, 2)}</strong>.
                  </p>
                </div>
                <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
                  <div className="font-mono-tech font-bold text-black">
                    2. Nilai Tengah (Median = {formatStatNumber(item.median, 2)})
                  </div>
                  <p className="font-sans text-black/75 leading-relaxed">
                    Tepat separuh (50%) data bernilai di bawah <strong>{formatStatNumber(item.median, 2)}</strong>, dan 50% sisanya berada di atasnya.
                  </p>
                </div>
                <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
                  <div className="font-mono-tech font-bold text-black">
                    3. Nilai Terbanyak (Modus = {Array.isArray(item.modus) ? item.modus.map((m: any) => formatStatNumber(m, 2)).join(", ") : formatStatNumber(item.modus, 2)})
                  </div>
                  <p className="font-sans text-black/75 leading-relaxed">
                    Nilai yang paling sering muncul atau paling banyak diperoleh dalam sampel data observasi ini.
                  </p>
                </div>
                <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
                  <div className="font-mono-tech font-bold text-black">
                    4. Standar Deviasi ({formatStatNumber(item.standar_deviasi, 4)})
                  </div>
                  <p className="font-sans text-black/75 leading-relaxed">
                    Mengukur keragaman nilai. Angka <strong>{formatStatNumber(item.standar_deviasi, 2)}</strong> berarti nilai data menyebar di kisaran ±{formatStatNumber(item.standar_deviasi, 2)} dari nilai rata-ratanya.
                  </p>
                </div>
                <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
                  <div className="font-mono-tech font-bold text-black">
                    5. Rentang Skor ({formatStatNumber(item.min, 2)} s.d. {formatStatNumber(item.max, 2)})
                  </div>
                  <p className="font-sans text-black/75 leading-relaxed">
                    Skor terendah yang ditemukan adalah <strong>{formatStatNumber(item.min, 2)}</strong> dan skor tertinggi adalah <strong>{formatStatNumber(item.max, 2)}</strong>.
                  </p>
                </div>
                <div className="p-3 bg-[#E6ECFF] border border-[#003BFF]/40 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10 flex flex-col justify-center">
                  <div className="font-mono-tech font-bold text-[#003BFF]">
                    💡 Kesimpulan Praktis:
                  </div>
                  <p className="font-sans text-black/85 leading-relaxed">
                    Performa <strong>{item.kolom}</strong> berpusat di rata-rata <strong>{formatStatNumber(item.mean, 2)}</strong> dengan rentang sebaran antara {formatStatNumber(item.min, 2)} hingga {formatStatNumber(item.max, 2)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // FR-08: UJI T WELCH
  if (jenisAnalisis === "uji_t") {
    const res: TTestResult = hasil;
    const pValInfo = formatPValueDisplay(res.p_value);

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase truncate mr-2">
            HASIL UJI T DUA KELOMPOK (WELCH T-TEST)
          </span>
          <span
            className={`font-mono-tech text-[10px] px-2 py-0.5 border font-bold shrink-0 ${
              res.signifikan
                ? "bg-[#00D084] text-black border-black"
                : "bg-[#EBEB00] text-black border-black"
            }`}
          >
            {res.signifikan ? "SIGNIFIKAN (p < 0.05)" : "TIDAK SIGNIFIKAN (p ≥ 0.05)"}
          </span>
        </div>

        {/* Angka Utama */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">NILAI T (STATISTIK)</div>
            <div className="font-mono-tech text-2xl lg:text-3xl font-bold text-[#003BFF] mt-1 truncate" title={String(res.t)}>
              {formatStatNumber(res.t, 4)}
            </div>
          </div>
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">DERAJAT KEBEBASAN (DF)</div>
            <div className="font-mono-tech text-2xl lg:text-3xl font-bold text-black mt-1 truncate" title={String(res.df)}>
              {formatStatNumber(res.df, 2)}
            </div>
          </div>
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">P-VALUE</div>
            <div className="font-mono-tech text-2xl lg:text-3xl font-bold text-[#FF2E2E] mt-1 truncate" title={String(res.p_value)}>
              {pValInfo.display}
            </div>
            {pValInfo.note && (
              <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate" title={String(res.p_value)}>
                ({pValInfo.note})
              </span>
            )}
          </div>
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">SELISIH RATA-RATA</div>
            <div className="font-mono-tech text-2xl lg:text-3xl font-bold text-black mt-1 truncate" title={String(res.perbedaan_mean)}>
              {formatStatNumber(res.perbedaan_mean, 4)}
            </div>
          </div>
        </div>

        {/* Perbandingan Kelompok */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black p-4 bg-[#FBFBFB]">
          <div className="p-3 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-xs font-bold text-black uppercase mb-1 truncate">
              KELOMPOK 1: {res.kelompok_1?.nama}
            </div>
            <div className="font-mono-tech text-xs text-black/70">
              Rata-rata: <strong className="text-black">{formatStatNumber(res.kelompok_1?.mean, 2)}</strong> · SD:{" "}
              <strong className="text-black">{formatStatNumber(res.kelompok_1?.sd, 4)}</strong> · N:{" "}
              <strong className="text-black">{res.kelompok_1?.n}</strong>
            </div>
          </div>
          <div className="p-3 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-xs font-bold text-black uppercase mb-1 truncate">
              KELOMPOK 2: {res.kelompok_2?.nama}
            </div>
            <div className="font-mono-tech text-xs text-black/70">
              Rata-rata: <strong className="text-black">{formatStatNumber(res.kelompok_2?.mean, 2)}</strong> · SD:{" "}
              <strong className="text-black">{formatStatNumber(res.kelompok_2?.sd, 4)}</strong> · N:{" "}
              <strong className="text-black">{res.kelompok_2?.n}</strong>
            </div>
          </div>
        </div>

        {/* Panduan Membaca Hasil Uji t */}
        <div className="p-4 bg-[#F8FAFC] border-t border-black space-y-3">
          <div className="flex items-center gap-2 font-mono-tech text-xs font-bold text-black uppercase">
            <span className="w-2.5 h-2.5 bg-[#FF2E2E] border border-black inline-block" />
            <span>CARA MEMBACA HASIL UJI T DI ATAS (PENJELASAN SEDERHANA):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
              <div className="font-mono-tech font-bold text-[#FF2E2E]">
                1. Angka p-value ({pValInfo.display})
              </div>
              <p className="font-sans text-black/75 leading-relaxed">
                {res.signifikan
                  ? "Karena p-value < 0.05, perbedaan nilai antara kedua kelompok terbukti NYATA secara ilmiah, bukan sekadar faktor kebetulan."
                  : "Karena p-value ≥ 0.05, TIDAK ADA bukti ilmiah yang cukup kuat untuk menyatakan kedua kelompok ini berbeda secara nyata."}
              </p>
            </div>
            <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
              <div className="font-mono-tech font-bold text-black">
                2. Selisih Rata-Rata ({formatStatNumber(res.perbedaan_mean, 2)})
              </div>
              <p className="font-sans text-black/75 leading-relaxed">
                Kelompok <strong>{res.kelompok_1?.nama}</strong> (rerata {formatStatNumber(res.kelompok_1?.mean, 2)}) berselisih <strong>{formatStatNumber(Math.abs(Number(res.perbedaan_mean || 0)), 2)}</strong> poin dibanding kelompok <strong>{res.kelompok_2?.nama}</strong> (rerata {formatStatNumber(res.kelompok_2?.mean, 2)}).
              </p>
            </div>
            <div className="p-3 bg-[#E6ECFF] border border-[#003BFF]/40 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10 flex flex-col justify-center">
              <div className="font-mono-tech font-bold text-[#003BFF]">
                💡 Kesimpulan Uji:
              </div>
              <p className="font-sans text-black/85 leading-relaxed">
                {res.signifikan
                  ? `Terbukti ada perbedaan yang bermakna secara statistik antara kelompok ${res.kelompok_1?.nama} dan ${res.kelompok_2?.nama}.`
                  : `Secara statistik performa kelompok ${res.kelompok_1?.nama} dan ${res.kelompok_2?.nama} dianggap seimbang / tidak berbeda nyata.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FR-09: KORELASI PEARSON
  if (jenisAnalisis === "korelasi") {
    const res: CorrelationResult = hasil;
    const pValInfo = formatPValueDisplay(res.p_value);

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase truncate mr-2">
            KOEFISIEN KORELASI PEARSON: {res.variabel_x} vs {res.variabel_y}
          </span>
          <span className="font-mono-tech text-[10px] text-black/50 shrink-0">N = {res.n} PASANGAN DATA</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
          {/* Koefisien Korelasi r */}
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">KOEFISIEN KORELASI (r)</div>
            <div
              className="font-mono-tech text-2xl lg:text-3xl font-bold text-[#003BFF] mt-1 truncate"
              title={String(res.r)}
            >
              {formatStatNumber(res.r, 4)}
            </div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate" title={String(res.r)}>
              Rentang -1.0 s.d +1.0
            </span>
          </div>

          {/* P-Value */}
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">P-VALUE</div>
            <div
              className="font-mono-tech text-2xl lg:text-3xl font-bold text-black mt-1 truncate"
              title={String(res.p_value)}
            >
              {pValInfo.display}
            </div>
            {pValInfo.note ? (
              <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate" title={String(res.p_value)}>
                ({pValInfo.note})
              </span>
            ) : (
              <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">
                Taraf α = 0.05
              </span>
            )}
          </div>

          {/* Arah Hubungan */}
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">ARAH HUBUNGAN</div>
            <div className="font-mono-tech text-xl lg:text-2xl font-bold uppercase mt-1 text-[#003BFF] truncate">
              {res.arah}
            </div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">
              {res.arah === "positif" ? "Hubungan searah" : res.arah === "negatif" ? "Hubungan terbalik" : "Netral"}
            </span>
          </div>

          {/* Kekuatan Hubungan */}
          <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">KEKUATAN HUBUNGAN</div>
            <div className="font-mono-tech text-xl lg:text-2xl font-bold uppercase mt-1 text-black truncate">
              {res.kekuatan}
            </div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">
              Kategori keeratan
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#FFFDE6] font-mono-tech text-[11px] text-black/80 border-t border-black/10">
          * Catatan Metodologis: Korelasi ini mengukur derajat keeratan hubungan linier dan tidak menyimpulkan hubungan sebab-akibat (kausalitas).
        </div>

        {/* Panduan Membaca Koefisien Korelasi */}
        <div className="p-4 bg-[#F8FAFC] border-t border-black space-y-3">
          <div className="flex items-center gap-2 font-mono-tech text-xs font-bold text-black uppercase">
            <span className="w-2.5 h-2.5 bg-[#EBEB00] border border-black inline-block" />
            <span>CARA MEMBACA HASIL KORELASI DI ATAS (PENJELASAN SEDERHANA):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
              <div className="font-mono-tech font-bold text-[#003BFF]">
                1. Angka r = {formatStatNumber(res.r, 4)} ({res.kekuatan})
              </div>
              <p className="font-sans text-black/75 leading-relaxed">
                Nilai r mengukur seberapa erat keterkaitan antara dua variabel (rentang -1 s.d +1). Nilai {formatStatNumber(res.r, 4)} tergolong hubungan yang <strong>{res.kekuatan.toLowerCase()}</strong>.
              </p>
            </div>
            <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
              <div className="font-mono-tech font-bold text-black">
                2. Arah Hubungan ({res.arah.toUpperCase()})
              </div>
              <p className="font-sans text-black/75 leading-relaxed">
                {res.arah === "positif"
                  ? `Hubungan SEARAH: Semakin tinggi ${res.variabel_x}, maka nilai ${res.variabel_y} juga cenderung ikut meningkat.`
                  : res.arah === "negatif"
                  ? `Hubungan BERLAWANAN: Semakin tinggi ${res.variabel_x}, maka nilai ${res.variabel_y} justru cenderung menurun.`
                  : "Tidak ditemukan pola hubungan linier yang searah maupun berlawanan."}
              </p>
            </div>
            <div className="p-3 bg-[#E6ECFF] border border-[#003BFF]/40 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10 flex flex-col justify-center">
              <div className="font-mono-tech font-bold text-[#003BFF]">
                💡 Kesimpulan Korelasi:
              </div>
              <p className="font-sans text-black/85 leading-relaxed">
                Kedua variabel terbukti memiliki keterkaitan yang {res.kekuatan.toLowerCase()} ({res.arah}). Namun korelasi bukan berarti sebab-akibat mutlak.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FR-10: REGRESI LINEAR SEDERHANA
  if (jenisAnalisis === "regresi") {
    return <RegressionCard res={hasil} />;
  }

  return null;
};

/**
 * Komponen khusus untuk Regresi Linier:
 * Dilengkapi dengan penjelasan asal-usul rumus matematis & kalkulator simulasi interaktif
 */
const RegressionCard: React.FC<{ res: RegressionResult }> = ({ res }) => {
  const pValInfo = formatPValueDisplay(res.p_value);
  const [simX, setSimX] = useState<string>("80");

  const xNum = parseFloat(simX);
  const slope = Number(res.koefisien || 0);
  const intercept = Number(res.intercept || 0);
  const predictedY = !isNaN(xNum) ? intercept + slope * xNum : null;

  return (
    <div className="border border-black bg-white shadow-[3px_3px_0px_#000000]">
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
        <span className="font-mono-tech text-xs font-bold text-black uppercase truncate mr-2">
          MODEL REGRESI LINEAR SEDERHANA (Y = a + bX)
        </span>
        <span className="font-mono-tech text-[10px] text-black/50 shrink-0">N = {res.n} OBSERVASI</span>
      </div>

      {/* Persamaan Garis Utama */}
      <div className="p-5 border-b border-black bg-[#FBFBFB] min-w-0 overflow-hidden">
        <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">PERSAMAAN REGRESI</div>
        <div className="font-mono-tech text-xl md:text-2xl font-bold text-[#003BFF] mt-1 break-words">
          {res.persamaan}
        </div>
      </div>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
        <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">KOEFISIEN SLOPE (b)</div>
          <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(res.koefisien)}>
            {formatStatNumber(res.koefisien, 4)}
          </div>
          <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">Perubahan Y per 1 unit X</span>
        </div>
        <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">KONSTANTA / INTERCEPT (a)</div>
          <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(res.intercept)}>
            {formatStatNumber(res.intercept, 4)}
          </div>
          <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">Perkiraan Y saat X = 0</span>
        </div>
        <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">R-SQUARED (R²)</div>
          <div className="font-mono-tech text-xl lg:text-2xl font-bold text-[#003BFF] mt-1 truncate" title={String(res.r_squared)}>
            {formatStatNumber(res.r_squared, 4)}
          </div>
          <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate">
            {(Number(res.r_squared || 0) * 100).toFixed(1)}% variasi dijelaskan
          </span>
        </div>
        <div className="p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">P-VALUE</div>
          <div className="font-mono-tech text-xl lg:text-2xl font-bold text-black mt-1 truncate" title={String(res.p_value)}>
            {pValInfo.display}
          </div>
          {pValInfo.note && (
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5 truncate" title={String(res.p_value)}>
              ({pValInfo.note})
            </span>
          )}
        </div>
      </div>

      <div className="p-3 bg-[#FFFDE6] font-mono-tech text-[11px] text-black/80 border-b border-black">
        * Penafsiran: Koefisien regresi menggambarkan tingkat perubahan estimasi variabel terikat ({res.variabel_y}) bila variabel bebas ({res.variabel_x}) meningkat, tanpa menyimpulkan kausalitas mutlak di luar model.
      </div>

      {/* Bagian 1: Panduan Membaca Model Regresi (Penjelasan Ringkas) */}
      <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b border-black space-y-3">
        <div className="flex items-center gap-2 font-mono-tech text-xs font-bold text-black uppercase">
          <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
          <span>CARA MEMBACA MODEL REGRESI DI ATAS (PENJELASAN SEDERHANA):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
            <div className="font-mono-tech font-bold text-[#003BFF]">
              1. Rumus Model ({res.persamaan})
            </div>
            <p className="font-sans text-black/75 leading-relaxed">
              Rumus matematika ini dipakai untuk memprediksi atau memperkirakan nilai <strong>{res.variabel_y}</strong> jika nilai <strong>{res.variabel_x}</strong> sudah diketahui.
            </p>
          </div>
          <div className="p-3 bg-white border border-black/20 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10">
            <div className="font-mono-tech font-bold text-black">
              2. Slope b ({formatStatNumber(res.koefisien, 4)})
            </div>
            <p className="font-sans text-black/75 leading-relaxed">
              Setiap kenaikan 1 poin pada {res.variabel_x}, maka nilai {res.variabel_y} diproyeksikan akan bertambah sebesar <strong>{formatStatNumber(res.koefisien, 2)}</strong> poin.
            </p>
          </div>
          <div className="p-3 bg-[#E6ECFF] border border-[#003BFF]/40 text-xs space-y-1 shadow-[2px_2px_0px_#000000]/10 flex flex-col justify-center">
            <div className="font-mono-tech font-bold text-[#003BFF]">
              3. Tingkat Pengaruh R² ({(Number(res.r_squared || 0) * 100).toFixed(1)}%)
            </div>
            <p className="font-sans text-black/85 leading-relaxed">
              Sebesar <strong>{(Number(res.r_squared || 0) * 100).toFixed(1)}%</strong> variasi perubahan pada {res.variabel_y} mampu dijelaskan oleh {res.variabel_x}. Sisanya dipengaruhi oleh faktor lain di luar variabel ini.
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 2: Penjelasan Rinci Asal-Usul Angka & Langkah Perhitungan Matematis */}
      <div className="p-4 sm:p-6 bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-black/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black text-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono-tech text-xs sm:text-sm font-bold text-black uppercase">
              📐 DARI MANA ANGKA PERSAMAAN INI DIDAPAT & CARA MENGHITUNGNYA?
            </span>
          </div>
          <span className="px-2 py-0.5 bg-[#EBEB00] border border-black font-mono-tech text-[10px] font-bold uppercase hidden sm:inline-block">
            PANDUAN RUMUS LENGKAP
          </span>
        </div>

        {/* 1. Pengantar Formula Baku */}
        <div className="p-3.5 bg-[#F0F4FF] border border-[#003BFF]/30 text-xs space-y-1.5">
          <div className="font-mono-tech font-bold text-[#003BFF] uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#003BFF] inline-block" />
            <span>Rumus Baku Garis Linier: Y = a + bX</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-black/80 pt-1">
            <div>• <strong>Y (Variabel Terikat/Target)</strong>: Nilai yang ingin kita perkirakan, yaitu <strong>{res.variabel_y}</strong>.</div>
            <div>• <strong>X (Variabel Bebas/Prediktor)</strong>: Nilai acuan yang menjadi dasar tebakan, yaitu <strong>{res.variabel_x}</strong>.</div>
            <div>• <strong>b (Slope / Kemiringan)</strong>: Perubahan Y untuk setiap penambahan 1 unit X = <strong>{formatStatNumber(res.koefisien, 4)}</strong>.</div>
            <div>• <strong>a (Konstanta / Intercept)</strong>: Nilai dasar Y jika nilai X bernilai 0 = <strong>{formatStatNumber(res.intercept, 4)}</strong>.</div>
          </div>
        </div>

        {/* 2. Langkah-Langkah Perhitungan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Langkah 1: Menghitung Slope b */}
          <div className="p-4 border border-black/30 bg-[#FAFAFA] space-y-2 shadow-[2px_2px_0px_#000000]/10">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-black text-white font-mono-tech text-[10px] font-bold uppercase">
                LANGKAH 1
              </span>
              <span className="font-mono-tech text-[11px] font-bold text-[#003BFF]">
                Slope b = {formatStatNumber(res.koefisien, 4)}
              </span>
            </div>
            <div className="font-mono-tech text-xs font-bold text-black uppercase">
              Bagaimana Komputer Menemukan Angka {formatStatNumber(res.koefisien, 4)}?
            </div>
            <p className="font-sans text-xs text-black/75 leading-relaxed">
              Komputer menggunakan metode <strong>Kuadrat Terkecil (Ordinary Least Squares / OLS)</strong>:
            </p>
            <div className="p-2 bg-white border border-black/20 font-mono-tech text-xs text-center text-black font-bold">
              b = [ N ∑(XY) - (∑X)(∑Y) ] / [ N ∑(X²) - (∑X)² ]
            </div>
            <p className="font-sans text-xs text-black/75 leading-relaxed">
              Atau setara dengan rumus hubungan korelasi: <strong>b = r × (SD_Y / SD_X)</strong>. Komputer menghitung keterkaitan korelasi seluruh pasangan data {res.variabel_x} dan {res.variabel_y} sebanyak <strong>{res.n} observasi</strong>, lalu membaginya dengan variasi data.
            </p>
            <div className="p-2 bg-[#E6ECFF] border border-[#003BFF]/20 text-[11px] text-[#003BFF] font-medium">
              💡 <strong>Arti Angka {formatStatNumber(res.koefisien, 4)}:</strong> Karena bertanda positif, artinya garis grafik miring naik ke kanan. Setiap {res.variabel_x} naik 1 poin, {res.variabel_y} rata-rata ikut bertambah <strong>{formatStatNumber(res.koefisien, 4)} poin</strong>.
            </div>
          </div>

          {/* Langkah 2: Menghitung Intercept a */}
          <div className="p-4 border border-black/30 bg-[#FAFAFA] space-y-2 shadow-[2px_2px_0px_#000000]/10">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-black text-white font-mono-tech text-[10px] font-bold uppercase">
                LANGKAH 2
              </span>
              <span className="font-mono-tech text-[11px] font-bold text-[#003BFF]">
                Konstanta a = {formatStatNumber(res.intercept, 4)}
              </span>
            </div>
            <div className="font-mono-tech text-xs font-bold text-black uppercase">
              Bagaimana Angka {formatStatNumber(res.intercept, 4)} Dihitung?
            </div>
            <p className="font-sans text-xs text-black/75 leading-relaxed">
              Garis regresi selalu melewati titik pusat rata-rata kedua variabel: <strong>(X̄, Ȳ)</strong>. Maka rumus mencari titik potong konstanta a adalah:
            </p>
            <div className="p-2 bg-white border border-black/20 font-mono-tech text-xs text-center text-black font-bold">
              a = Ȳ - (b × X̄)
            </div>
            <p className="font-sans text-xs text-black/75 leading-relaxed">
              Rata-rata {res.variabel_y} (Ȳ) dikurangi hasil kali slope (b) dengan rata-rata {res.variabel_x} (X̄).
            </p>
            <div className="p-2 bg-white border border-black/20 font-mono-tech text-[11px] text-black/85 leading-relaxed">
              Contoh dari dataset: Misal rata-rata {res.variabel_y} adalah <strong>69.17</strong> dan rata-rata {res.variabel_x} adalah <strong>66.09</strong>:
              <br />
              <span className="font-bold text-[#003BFF]">
                a = 69.17 - ({formatStatNumber(res.koefisien, 4)} × 66.09) = 69.17 - {formatStatNumber(slope * 66.09, 4)} = {formatStatNumber(res.intercept, 4)}
              </span>
            </div>
            <div className="p-2 bg-[#FFFDE6] border border-amber-300 text-[11px] text-black/85 font-medium">
              💡 <strong>Arti Angka {formatStatNumber(res.intercept, 4)}:</strong> Merupakan perkiraan nilai awal {res.variabel_y} jika seorang siswa mendapat nilai {res.variabel_x} sama dengan 0.
            </div>
          </div>
        </div>

        {/* 3. Penggabungan & Kalkulator Simulasi Prediksi */}
        <div className="p-4 sm:p-5 border-2 border-black bg-[#F8FAFC] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/20 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#003BFF]" />
              <span className="font-mono-tech text-xs font-bold text-black uppercase">
                LANGKAH 3: SIMULASI PRAKTIK MEMAKAI PERSAMAAN INI
              </span>
            </div>
            <span className="font-mono-tech text-[10px] text-black/50">
              UJI PREDIKSI DENGAN ANGKA SEMBARANG
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            {/* Input Simulasi */}
            <div className="space-y-3">
              <label className="font-mono-tech text-xs font-bold text-black uppercase block">
                Masukkan Nilai {res.variabel_x} (X):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={simX}
                  onChange={(e) => setSimX(e.target.value)}
                  className="w-28 px-3 py-2 border-2 border-black font-mono-tech text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-[#003BFF]"
                  placeholder="Misal 80"
                />
                <div className="flex flex-wrap gap-1">
                  {["50", "70", "80", "90", "100"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSimX(preset)}
                      className={`px-2 py-1 border border-black font-mono-tech text-[10px] font-bold uppercase transition-colors ${
                        simX === preset
                          ? "bg-black text-white"
                          : "bg-white text-black hover:bg-[#EFEFEF]"
                      }`}
                    >
                      X={preset}
                    </button>
                  ))}
                </div>
              </div>
              <p className="font-sans text-xs text-black/60">
                Ketikkan angka nilai {res.variabel_x} untuk melihat cara rumus menghitung perkiraan {res.variabel_y}.
              </p>
            </div>

            {/* Kotak Perhitungan Hasil */}
            <div className="p-4 bg-white border border-black space-y-2 shadow-[2px_2px_0px_#000000]">
              <div className="font-mono-tech text-[10px] font-bold text-black/50 uppercase">
                PROSES PERHITUNGAN:
              </div>
              <div className="font-mono-tech text-xs text-black break-words">
                {res.variabel_y} = {formatStatNumber(res.intercept, 4)} + ({formatStatNumber(res.koefisien, 4)} × {simX || "0"})
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-tech text-black/60">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>
                  = {formatStatNumber(res.intercept, 4)} + {formatStatNumber(slope * (xNum || 0), 4)}
                </span>
              </div>
              <div className="pt-2 border-t border-black/20 flex items-center justify-between">
                <span className="font-mono-tech text-xs font-bold text-black uppercase">
                  PREDIKSI {res.variabel_y}:
                </span>
                <span className="font-mono-tech text-xl font-bold text-[#003BFF]">
                  {predictedY !== null ? formatStatNumber(predictedY, 2) : "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 font-mono-tech text-[11px] text-black/70">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Kesimpulan Praktis:</strong> Model regresi ini adalah alat estimasi berdasarkan tren sebaran data masa lalu. Hasil prediksi bukanlah jaminan mutlak bagi setiap individu karena tetap terdapat variasi faktor lain sebesar {(100 - Number(res.r_squared || 0) * 100).toFixed(1)}%.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
