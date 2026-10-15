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
              <span className="font-mono-tech text-xs font-bold text-black uppercase">
                RINGKASAN STATISTIK: {item.kolom}
              </span>
              <span className="font-mono-tech text-[10px] text-black/50">
                N = {item.n} OBSERVASI
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-black border-b border-black">
              {/* Mean */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">RATA-RATA (MEAN)</div>
                <div className="font-mono-tech text-2xl font-bold text-[#003BFF] mt-1">{item.mean}</div>
              </div>
              {/* Median */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">NILAI TENGAH (MEDIAN)</div>
                <div className="font-mono-tech text-2xl font-bold text-black mt-1">{item.median}</div>
              </div>
              {/* Modus */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">MODUS</div>
                <div className="font-mono-tech text-2xl font-bold text-black mt-1">
                  {item.modus && item.modus.length > 0 ? item.modus.join(", ") : "-"}
                </div>
              </div>
              {/* Standar Deviasi */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">STANDAR DEVIASI</div>
                <div className="font-mono-tech text-2xl font-bold text-black mt-1">{item.standar_deviasi}</div>
              </div>
              {/* Minimum */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">NILAI MINIMUM</div>
                <div className="font-mono-tech text-2xl font-bold text-black mt-1">{item.min}</div>
              </div>
              {/* Maksimum */}
              <div className="p-4 bg-white">
                <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">NILAI MAKSIMUM</div>
                <div className="font-mono-tech text-2xl font-bold text-black mt-1">{item.max}</div>
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

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            HASIL UJI T DUA KELOMPOK (WELCH T-TEST)
          </span>
          <span
            className={`font-mono-tech text-[10px] px-2 py-0.5 border font-bold ${
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
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">NILAI T (STATISTIK)</div>
            <div className="font-mono-tech text-3xl font-bold text-[#003BFF] mt-1">{res.t}</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">DERAJAT KEBEBASAN (DF)</div>
            <div className="font-mono-tech text-3xl font-bold text-black mt-1">{res.df ?? "N/A"}</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">P-VALUE</div>
            <div className="font-mono-tech text-3xl font-bold text-[#FF2E2E] mt-1">{res.p_value}</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">SELISIH RATA-RATA</div>
            <div className="font-mono-tech text-3xl font-bold text-black mt-1">{res.perbedaan_mean}</div>
          </div>
        </div>

        {/* Perbandingan Kelompok */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black p-4 bg-[#FBFBFB]">
          <div className="p-3">
            <div className="font-mono-tech text-xs font-bold text-black uppercase mb-1">
              KELOMPOK 1: {res.kelompok_1?.nama}
            </div>
            <div className="font-mono-tech text-xs text-black/70">
              Rata-rata: <strong className="text-black">{res.kelompok_1?.mean}</strong> · SD:{" "}
              <strong className="text-black">{res.kelompok_1?.sd}</strong> · N:{" "}
              <strong className="text-black">{res.kelompok_1?.n}</strong>
            </div>
          </div>
          <div className="p-3">
            <div className="font-mono-tech text-xs font-bold text-black uppercase mb-1">
              KELOMPOK 2: {res.kelompok_2?.nama}
            </div>
            <div className="font-mono-tech text-xs text-black/70">
              Rata-rata: <strong className="text-black">{res.kelompok_2?.mean}</strong> · SD:{" "}
              <strong className="text-black">{res.kelompok_2?.sd}</strong> · N:{" "}
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

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            KOEFISIEN KORELASI PEARSON: {res.variabel_x} vs {res.variabel_y}
          </span>
          <span className="font-mono-tech text-[10px] text-black/50">N = {res.n} PASANGAN DATA</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">KOEFISIEN KORELASI (r)</div>
            <div className="font-mono-tech text-3xl font-bold text-[#003BFF] mt-1">{res.r}</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">P-VALUE</div>
            <div className="font-mono-tech text-3xl font-bold text-black mt-1">{res.p_value}</div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">ARAH HUBUNGAN</div>
            <div className="font-mono-tech text-2xl font-bold uppercase mt-1 text-[#003BFF]">
              {res.arah}
            </div>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">KEKUATAN HUBUNGAN</div>
            <div className="font-mono-tech text-2xl font-bold uppercase mt-1 text-black">
              {res.kekuatan}
            </div>
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

    return (
      <div className="border border-black bg-white">
        <div className="bg-[#EFEFEF] border-b border-black px-4 py-2.5 flex items-center justify-between">
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            MODEL REGRESI LINEAR SEDERHANA (Y = a + bX)
          </span>
          <span className="font-mono-tech text-[10px] text-black/50">N = {res.n} OBSERVASI</span>
        </div>

        {/* Persamaan Garis */}
        <div className="p-5 border-b border-black bg-[#FBFBFB]">
          <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">PERSAMAAN REGRESI</div>
          <div className="font-mono-tech text-2xl md:text-3xl font-bold text-[#003BFF] mt-1">
            {res.persamaan}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">KOEFISIEN SLOPE (b)</div>
            <div className="font-mono-tech text-2xl font-bold text-black mt-1">{res.koefisien}</div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5">Perubahan Y per 1 unit X</span>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">KONSTANTA / INTERCEPT (a)</div>
            <div className="font-mono-tech text-2xl font-bold text-black mt-1">{res.intercept}</div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5">Nilai perkiraan Y saat X = 0</span>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">R-SQUARED (R²)</div>
            <div className="font-mono-tech text-2xl font-bold text-[#003BFF] mt-1">{res.r_squared}</div>
            <span className="font-mono-tech text-[9px] text-black/40 block mt-0.5">{(res.r_squared * 100).toFixed(1)}% variasi dijelaskan</span>
          </div>
          <div className="p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">P-VALUE</div>
            <div className="font-mono-tech text-2xl font-bold text-black mt-1">{res.p_value}</div>
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
