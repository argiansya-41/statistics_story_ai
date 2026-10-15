"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, GitCompare, GitFork, TrendingUp, Play, ArrowLeft } from "lucide-react";
import type {
  AnalysisType,
  DatasetSummary,
  DescriptiveConfig,
  TTestConfig,
  CorrelationConfig,
  RegressionConfig,
} from "@/lib/types/analysis";
import { DataValidationBanner, validateAnalysisInput } from "./DataValidationBanner";

interface AnalysisConfigFormProps {
  dataset: DatasetSummary;
  onRun: (
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const AnalysisConfigForm: React.FC<AnalysisConfigFormProps> = ({
  dataset,
  onRun,
  onBack,
  isLoading,
}) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>("deskriptif");

  // State konfigurasi variabel
  const columns = dataset.kolom || [];
  const numericCols =
    dataset.kolom_info?.filter((c) => c.type === "numeric").map((c) => c.name) || columns;
  const categoricalCols =
    dataset.kolom_info?.filter((c) => c.type === "categorical").map((c) => c.name) || columns;

  const [descriptiveCols, setDescriptiveCols] = useState<string[]>(
    numericCols.length > 0 ? [numericCols[0]] : columns.length > 0 ? [columns[0]] : []
  );

  const [tTestNilai, setTTestNilai] = useState<string>(
    numericCols.length > 0 ? numericCols[0] : columns[0] || ""
  );
  const [tTestKelompok, setTTestKelompok] = useState<string>(
    categoricalCols.length > 0
      ? categoricalCols[0]
      : columns.length > 1
      ? columns[1]
      : columns[0] || ""
  );

  const [corrX, setCorrX] = useState<string>(
    numericCols.length > 0 ? numericCols[0] : columns[0] || ""
  );
  const [corrY, setCorrY] = useState<string>(
    numericCols.length > 1
      ? numericCols[1]
      : columns.length > 1
      ? columns[1]
      : columns[0] || ""
  );

  const [regX, setRegX] = useState<string>(
    numericCols.length > 0 ? numericCols[0] : columns[0] || ""
  );
  const [regY, setRegY] = useState<string>(
    numericCols.length > 1
      ? numericCols[1]
      : columns.length > 1
      ? columns[1]
      : columns[0] || ""
  );

  // Mode siap pakai otomatis
  const isReadyMade = dataset.sumber_input === "siap_pakai";

  const getSelectedColumns = (): Record<string, string | string[]> => {
    if (analysisType === "deskriptif") return { kolom_ringkasan: descriptiveCols };
    if (analysisType === "uji_t") return { kolom_nilai: tTestNilai, kolom_kelompok: tTestKelompok };
    if (analysisType === "korelasi") return { kolom_x: corrX, kolom_y: corrY };
    if (analysisType === "regresi") return { kolom_x: regX, kolom_y: regY };
    return {};
  };

  const validation = validateAnalysisInput(dataset, analysisType, getSelectedColumns());

  const handleToggleDescriptiveCol = (col: string) => {
    if (descriptiveCols.includes(col)) {
      if (descriptiveCols.length > 1) {
        setDescriptiveCols(descriptiveCols.filter((c) => c !== col));
      }
    } else {
      setDescriptiveCols([...descriptiveCols, col]);
    }
  };

  const handleExecute = () => {
    if (!validation.isValid) return;

    if (analysisType === "deskriptif") {
      onRun("deskriptif", { kolom_ringkasan: descriptiveCols });
    } else if (analysisType === "uji_t") {
      onRun("uji_t", { kolom_nilai: tTestNilai, kolom_kelompok: tTestKelompok });
    } else if (analysisType === "korelasi") {
      onRun("korelasi", { kolom_x: corrX, kolom_y: corrY });
    } else if (analysisType === "regresi") {
      onRun("regresi", { kolom_x: regX, kolom_y: regY });
    }
  };

  const analysisOptions = [
    {
      id: "deskriptif" as AnalysisType,
      title: "1. Statistik Deskriptif",
      desc: "Mean, median, modus, standar deviasi, min, max (FR-07)",
      icon: BarChart3,
    },
    {
      id: "uji_t" as AnalysisType,
      title: "2. Uji t Dua Kelompok",
      desc: "Uji beda rata-rata Welch t-test (FR-08)",
      icon: GitCompare,
    },
    {
      id: "korelasi" as AnalysisType,
      title: "3. Korelasi Pearson",
      desc: "Kekuatan & arah hubungan linier antar 2 variabel (FR-09)",
      icon: GitFork,
    },
    {
      id: "regresi" as AnalysisType,
      title: "4. Regresi Linear Sederhana",
      desc: "Persamaan Y = a + bX dan R² (FR-10)",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="border border-black bg-white p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-black mb-6">
        <div>
          <span className="font-mono-tech text-[10px] text-black/50 font-bold block mb-1">
            LANGKAH 2 DARI 3 · KONFIGURASI ANALISIS
          </span>
          <h2 className="font-display text-2xl font-normal">Pilih Jenis Analisis & Variabel (FR-06)</h2>
        </div>

        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="px-3 py-1.5 border border-black font-mono-tech text-xs font-bold hover:bg-[#F4F4F4] transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Data</span>
        </button>
      </div>

      {/* Grid 4 Jenis Analisis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {analysisOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = analysisType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAnalysisType(opt.id)}
              className={`p-4 border text-left transition-all cursor-pointer flex items-start gap-4 ${
                isSelected
                  ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_#003BFF]"
                  : "border-black/30 bg-white text-black hover:border-black hover:bg-[#F8F8F8]"
              }`}
            >
              <div
                className={`w-10 h-10 border border-current flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-[#003BFF] text-white" : "bg-[#F4F4F4] text-black"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono-tech text-xs font-bold">{opt.title}</div>
                <div className={`font-mono-tech text-[11px] mt-1 ${isSelected ? "text-white/80" : "text-black/60"}`}>
                  {opt.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form Pemilihan Variabel */}
      <div className="p-6 border border-black bg-[#FBFBFB] mb-6">
        <h3 className="font-mono-tech text-xs font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-black/10">
          KONFIGURASI VARIABEL: {analysisType.toUpperCase()}
        </h3>

        {isReadyMade ? (
          <div className="font-mono-tech text-xs text-black/70">
            Mode statistik siap pakai aktif. Backend akan langsung menggunakan data ringkasan JSON yang dimasukkan sebelumnya tanpa menghitung ulang.
          </div>
        ) : (
          <>
            {/* 1. DESKRIPTIF */}
            {analysisType === "deskriptif" && (
              <div>
                <label className="block font-mono-tech text-xs font-bold mb-2">
                  PILIH KOLOM NUMERIK UNTUK DIRINGKAS (CENTANG SATU ATAU LEBIH):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {columns.map((col) => {
                    const isChecked = descriptiveCols.includes(col);
                    return (
                      <label
                        key={col}
                        className={`p-2.5 border font-mono-tech text-xs cursor-pointer flex items-center gap-2 select-none ${
                          isChecked ? "border-black bg-[#EBEB00] text-black font-bold" : "border-black/30 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDescriptiveCol(col)}
                          className="accent-black w-4 h-4"
                        />
                        <span>{col}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. UJI T */}
            {analysisType === "uji_t" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    KOLOM NILAI (NUMERIK)
                  </label>
                  <select
                    value={tTestNilai}
                    onChange={(e) => setTTestNilai(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono-tech text-[10px] text-black/50 mt-1 block">
                    Kolom berisi skor/angka kuantitatif yang akan dibandingkan.
                  </span>
                </div>

                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    KOLOM KELOMPOK (TEPAT 2 GRUP)
                  </label>
                  <select
                    value={tTestKelompok}
                    onChange={(e) => setTTestKelompok(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono-tech text-[10px] text-black/50 mt-1 block">
                    Kolom kategori pemisah dua kelompok (mis. Pria/Wanita, Kelas_A/Kelas_B).
                  </span>
                </div>
              </div>
            )}

            {/* 3. KORELASI */}
            {analysisType === "korelasi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    VARIABEL X (NUMERIK)
                  </label>
                  <select
                    value={corrX}
                    onChange={(e) => setCorrX(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    VARIABEL Y (NUMERIK)
                  </label>
                  <select
                    value={corrY}
                    onChange={(e) => setCorrY(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* 4. REGRESI */}
            {analysisType === "regresi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    VARIABEL BEBAS X (PREDIKTOR)
                  </label>
                  <select
                    value={regX}
                    onChange={(e) => setRegX(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono-tech text-[10px] text-black/50 mt-1 block">
                    Faktor yang mempengaruhi perubahan.
                  </span>
                </div>

                <div>
                  <label className="block font-mono-tech text-xs font-bold mb-2">
                    VARIABEL TERIKAT Y (KRITERIUM)
                  </label>
                  <select
                    value={regY}
                    onChange={(e) => setRegY(e.target.value)}
                    className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono-tech text-[10px] text-black/50 mt-1 block">
                    Hasil atau capaian yang diestimasi.
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Validasi Banner Langsung */}
      <div className="mb-6">
        <DataValidationBanner
          dataset={dataset}
          analysisType={analysisType}
          selectedColumns={getSelectedColumns()}
        />
      </div>

      {/* Tombol Eksekusi */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleExecute}
          disabled={!validation.isValid || isLoading}
          className="px-8 py-3 bg-[#003BFF] text-white font-mono-tech text-xs font-bold hover:bg-[#002ec7] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[3px_3px_0px_0px_#000000]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isLoading ? "Memproses..." : "Jalankan Analisis Statistik"}</span>
        </button>
      </div>
    </div>
  );
};
