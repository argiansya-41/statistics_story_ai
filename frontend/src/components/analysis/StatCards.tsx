"use client";

import React from "react";
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
      </div>
    );
  }

  // FR-10: REGRESI LINEAR SEDERHANA
  if (jenisAnalisis === "regresi") {
    const res: RegressionResult = hasil;
    const pValInfo = formatPValueDisplay(res.p_value);

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase truncate mr-2">
            MODEL REGRESI LINEAR SEDERHANA (Y = a + bX)
          </span>
          <span className="font-mono-tech text-[10px] text-black/50 shrink-0">N = {res.n} OBSERVASI</span>
        </div>

        {/* Persamaan Garis */}
        <div className="p-5 border-b border-black bg-[#FBFBFB] min-w-0 overflow-hidden">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold truncate">PERSAMAAN REGRESI</div>
          <div className="font-mono-tech text-xl md:text-2xl font-bold text-[#003BFF] mt-1 break-words">
            {res.persamaan}
          </div>
        </div>

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

        <div className="p-3 bg-[#FFFDE6] font-mono-tech text-[11px] text-black/80">
          * Penafsiran: Koefisien regresi menggambarkan tingkat perubahan estimasi variabel terikat ({res.variabel_y}) bila variabel bebas ({res.variabel_x}) meningkat, tanpa menyimpulkan kausalitas mutlak di luar model.
        </div>
      </div>
    );
  }

  return null;
};
