"use client";

import React, { useState, useEffect, useMemo } from "react";
import type {
  AnalysisType,
  DatasetSummary,
  DescriptiveConfig,
  TTestConfig,
  CorrelationConfig,
  RegressionConfig,
} from "@/lib/types/analysis";
import { Mascot } from "@/components/ui/Mascot";
import {
  BarChart2,
  GitCompare,
  GitFork,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface ConfigStepProps {
  dataset: DatasetSummary;
  initialType?: AnalysisType;
  initialConfig?: any;
  isLocked: boolean;
  onSaveConfig: (
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ) => Promise<void>;
  onBack: () => void;
  onProceedToRun: () => void;
  isLoading: boolean;
}

export const ConfigStep: React.FC<ConfigStepProps> = ({
  dataset,
  initialType = "deskriptif",
  initialConfig,
  isLocked,
  onSaveConfig,
  onBack,
  onProceedToRun,
  isLoading,
}) => {
  const [selectedType, setSelectedType] = useState<AnalysisType>(initialType);

  // Kolom-kolom dataset
  const columns = dataset.kolom || [];
  const numericColumns = (dataset.kolom_info || [])
    .filter((c) => c.type === "numeric")
    .map((c) => c.name);
  const rawData = dataset.data_mentah || [];

  // State untuk masing-masing konfigurasi
  // 1. Deskriptif: satu atau lebih kolom numerik
  const [descCols, setDescCols] = useState<string[]>(
    initialConfig?.kolom_ringkasan || (numericColumns.length > 0 ? [numericColumns[0]] : [columns[0]])
  );

  // 2. Uji t: kolom nilai numerik + kolom kelompok (2 kategori)
  const [tTestValCol, setTTestValCol] = useState<string>(
    initialConfig?.kolom_nilai || (numericColumns.length > 0 ? numericColumns[0] : columns[0])
  );
  const [tTestGrpCol, setTTestGrpCol] = useState<string>(
    initialConfig?.kolom_kelompok || (columns.length > 1 ? columns[1] : columns[0])
  );

  // 3. Korelasi: X dan Y numerik
  const [corrX, setCorrX] = useState<string>(
    initialConfig?.kolom_x || (numericColumns.length > 0 ? numericColumns[0] : columns[0])
  );
  const [corrY, setCorrY] = useState<string>(
    initialConfig?.kolom_y || (numericColumns.length > 1 ? numericColumns[1] : columns[1] || columns[0])
  );

  // 4. Regresi: X bebas dan Y terikat
  const [regX, setRegX] = useState<string>(
    initialConfig?.kolom_x || (numericColumns.length > 0 ? numericColumns[0] : columns[0])
  );
  const [regY, setRegY] = useState<string>(
    initialConfig?.kolom_y || (numericColumns.length > 1 ? numericColumns[1] : columns[1] || columns[0])
  );

  // Sinkronisasi tipe jika diubah dari luar
  useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  // =========================================================================
  // PEMERIKSAAN DATA MINIMUM SECARA LANGSUNG (REAL-TIME CHECK)
  // =========================================================================
  const validationResult = useMemo<{
    isValid: boolean;
    issues: string[];
  }>(() => {
    // Mode statistik siap pakai dilewati karena angka sudah divalidasi di form siap pakai
    if (dataset.sumber_input === "siap_pakai") {
      return { isValid: true, issues: [] };
    }

    const issues: string[] = [];

    if (selectedType === "deskriptif") {
      if (descCols.length === 0) {
        issues.push("Pilih minimal satu kolom numerik untuk dianalisis.");
      } else {
        descCols.forEach((col) => {
          const vals = rawData
            .map((r) => Number(r[col]))
            .filter((v) => !isNaN(v) && isFinite(v));
          if (vals.length < 2) {
            issues.push(`Kolom '${col}' memiliki kurang dari 2 data numerik (ditemukan: ${vals.length}).`);
          }
        });
      }
    } else if (selectedType === "uji_t") {
      if (!tTestValCol || !tTestGrpCol) {
        issues.push("Kolom nilai numerik dan kolom kelompok wajib dipilih.");
      } else if (tTestValCol === tTestGrpCol) {
        issues.push("Kolom nilai dan kelompok tidak boleh sama.");
      } else {
        // Cek kategori kelompok
        const groups: Record<string, number[]> = {};
        rawData.forEach((r) => {
          const g = String(r[tTestGrpCol] ?? "").trim();
          const v = Number(r[tTestValCol]);
          if (g !== "" && !isNaN(v) && isFinite(v)) {
            if (!groups[g]) groups[g] = [];
            groups[g].push(v);
          }
        });

        const grpKeys = Object.keys(groups);
        if (grpKeys.length !== 2) {
          issues.push(
            `Kolom kelompok '${tTestGrpCol}' harus memiliki tepat 2 kategori (ditemukan ${grpKeys.length}: ${grpKeys.join(", ") || "kosong"}).`
          );
        } else {
          grpKeys.forEach((k) => {
            if (groups[k].length < 2) {
              issues.push(`Kelompok '${k}' memiliki kurang dari 2 observasi numerik (hanya ${groups[k].length}).`);
            }
          });
        }
      }
    } else if (selectedType === "korelasi") {
      if (!corrX || !corrY) {
        issues.push("Pilih variabel X dan Y untuk korelasi.");
      } else if (corrX === corrY) {
        issues.push("Variabel X dan Y tidak boleh kolom yang sama.");
      } else {
        const pairs = rawData.filter((r) => {
          const vx = Number(r[corrX]);
          const vy = Number(r[corrY]);
          return !isNaN(vx) && isFinite(vx) && !isNaN(vy) && isFinite(vy);
        });

        if (pairs.length < 3) {
          issues.push(`Korelasi memerlukan minimal 3 pasangan data numerik lengkap (ditemukan ${pairs.length}).`);
        } else {
          const xs = pairs.map((p) => Number(p[corrX]));
          const ys = pairs.map((p) => Number(p[corrY]));
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          if (minX === maxX) issues.push(`Variabel X '${corrX}' tidak memiliki variansi (semua nilai sama).`);
          if (minY === maxY) issues.push(`Variabel Y '${corrY}' tidak memiliki variansi (semua nilai sama).`);
        }
      }
    } else if (selectedType === "regresi") {
      if (!regX || !regY) {
        issues.push("Pilih variabel bebas X dan terikat Y untuk regresi.");
      } else if (regX === regY) {
        issues.push("Variabel bebas dan terikat tidak boleh kolom yang sama.");
      } else {
        const pairs = rawData.filter((r) => {
          const vx = Number(r[regX]);
          const vy = Number(r[regY]);
          return !isNaN(vx) && isFinite(vx) && !isNaN(vy) && isFinite(vy);
        });

        if (pairs.length < 3) {
          issues.push(`Regresi memerlukan minimal 3 pasangan data numerik (ditemukan ${pairs.length}).`);
        } else {
          const xs = pairs.map((p) => Number(p[regX]));
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          if (minX === maxX) {
            issues.push(`Variabel bebas X '${regX}' bernilai konstan (variansi 0). Model garis tidak dapat dihitung.`);
          }
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }, [selectedType, descCols, tTestValCol, tTestGrpCol, corrX, corrY, regX, regY, rawData, dataset.sumber_input]);

  // Handler Simpan Konfigurasi
  const handleSave = async () => {
    if (!validationResult.isValid) return;

    let cfg: any;
    if (selectedType === "deskriptif") {
      cfg = { kolom_ringkasan: descCols } as DescriptiveConfig;
    } else if (selectedType === "uji_t") {
      cfg = { kolom_nilai: tTestValCol, kolom_kelompok: tTestGrpCol } as TTestConfig;
    } else if (selectedType === "korelasi") {
      cfg = { kolom_x: corrX, kolom_y: corrY } as CorrelationConfig;
    } else if (selectedType === "regresi") {
      cfg = { kolom_x: regX, kolom_y: regY } as RegressionConfig;
    }

    await onSaveConfig(selectedType, cfg);
    onProceedToRun();
  };

  const typesList: {
    type: AnalysisType;
    label: string;
    icon: typeof BarChart2;
    color: string;
    desc: string;
  }[] = [
    {
      type: "deskriptif",
      label: "Statistik Deskriptif",
      icon: BarChart2,
      color: "#003BFF",
      desc: "Mean, median, modus, SD, min, max (min. 2 observasi)",
    },
    {
      type: "uji_t",
      label: "Uji t Dua Kelompok",
      icon: GitCompare,
      color: "#FF2E2E",
      desc: "Rumus Welch t-test (tepat 2 kelompok, min. 2 per grup)",
    },
    {
      type: "korelasi",
      label: "Korelasi Pearson",
      icon: GitFork,
      color: "#EBEB00",
      desc: "Koefisien r linear X vs Y (min. 3 pasang data)",
    },
    {
      type: "regresi",
      label: "Regresi Sederhana",
      icon: TrendingUp,
      color: "#003BFF",
      desc: "Model prediksi Y = a + bX, R² (min. 3 pasang data)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner 409 jika Terkunci */}
      {isLocked && (
        <div className="border-2 border-black bg-[#EFEFEF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-tech text-xs shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#EBEB00]" />
            </div>
            <div>
              <div className="font-bold text-black uppercase">KONFIGURASI TERKUNCI SETELAH DIJALANKAN</div>
              <div className="text-black/70 font-sans text-xs mt-0.5">
                Konfigurasi uji statistik dan variabel terkunci saat analisis berstatus selesai atau diproses.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.location.assign("/analisis/baru")}
            className="px-4 py-2 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold border border-black hover:bg-black hover:text-[#EBEB00] transition-colors shrink-0 shadow-[2px_2px_0px_#000000]"
          >
            Buat Analisis Baru
          </button>
        </div>
      )}

      {/* 4 KARTU JENIS ANALISIS (FR-06) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {typesList.map((t) => {
          const Icon = t.icon;
          const isSelected = selectedType === t.type;
          return (
            <button
              key={t.type}
              type="button"
              disabled={isLocked}
              onClick={() => setSelectedType(t.type)}
              className={`p-5 border-2 text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? "border-black bg-white shadow-[6px_6px_0px_#003BFF]"
                  : "border-black/30 bg-white/70 hover:bg-white hover:border-black shadow-[3px_3px_0px_#000000]"
              } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div
                    className="w-9 h-9 border border-black flex items-center justify-center"
                    style={{ backgroundColor: t.color }}
                  >
                    <Icon className="w-4 h-4" style={{ color: t.type === "korelasi" ? "#000" : "#fff" }} />
                  </div>
                  {isSelected && (
                    <span className="font-mono-tech text-[9px] uppercase font-bold px-1.5 py-0.5 bg-[#003BFF] text-white">
                      DIPILIH
                    </span>
                  )}
                </div>
                <h4 className="font-mono-tech text-xs font-bold text-black uppercase">
                  {t.label}
                </h4>
                <p className="font-sans text-[11px] text-black/70 leading-relaxed">
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* FORMULIR PEMILIH VARIABEL SESUAI JENIS */}
      <div className="border border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-6">
        <div className="flex items-center justify-between border-b border-black pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
            <h3 className="font-mono-tech text-xs font-bold uppercase text-black">
              PEMILIH VARIABEL: {selectedType.replace("_", " ").toUpperCase()}
            </h3>
          </div>
          <span className="font-mono-tech text-xs text-black/50">
            Dataset: <strong>{dataset.nama_dataset || "Data"}</strong> ({columns.length} kolom, {dataset.total_baris} baris)
          </span>
        </div>

        {/* Pemilih untuk DESKRIPTIF */}
        {selectedType === "deskriptif" && (
          <div className="space-y-4">
            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-2">
                PILIH KOLOM NUMERIK UNTUK DIRINGKAS (SATU ATAU LEBIH):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {columns.map((col) => {
                  const isChecked = descCols.includes(col);
                  return (
                    <label
                      key={col}
                      className={`flex items-center gap-2 p-2.5 border font-mono-tech text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-[#EBEB00] border-black text-black font-bold"
                          : "bg-[#FBFBFB] border-black/30 hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isLocked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDescCols([...descCols, col]);
                          } else {
                            setDescCols(descCols.filter((c) => c !== col));
                          }
                        }}
                        className="rounded-none accent-black"
                      />
                      <span className="truncate">{col}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pemilih untuk UJI T */}
        {selectedType === "uji_t" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                KOLOM NILAI NUMERIK (VARIABEL TERIKAT):
              </label>
              <select
                value={tTestValCol}
                disabled={isLocked}
                onChange={(e) => setTTestValCol(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="font-mono-tech text-[10px] text-black/50 block mt-1">
                Kolom berisi skor angka yang akan dibandingkan rata-ratanya.
              </span>
            </div>

            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                KOLOM KELOMPOK (TEPAT 2 KATEGORI):
              </label>
              <select
                value={tTestGrpCol}
                disabled={isLocked}
                onChange={(e) => setTTestGrpCol(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="font-mono-tech text-[10px] text-black/50 block mt-1">
                Kolom pembagi kelompok (mis. Kelas A vs Kelas B, Pria vs Wanita).
              </span>
            </div>
          </div>
        )}

        {/* Pemilih untuk KORELASI */}
        {selectedType === "korelasi" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                VARIABEL X (NUMERIK):
              </label>
              <select
                value={corrX}
                disabled={isLocked}
                onChange={(e) => setCorrX(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                VARIABEL Y (NUMERIK):
              </label>
              <select
                value={corrY}
                disabled={isLocked}
                onChange={(e) => setCorrY(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Pemilih untuk REGRESI */}
        {selectedType === "regresi" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                VARIABEL BEBAS / INDEPENDENT (X):
              </label>
              <select
                value={regX}
                disabled={isLocked}
                onChange={(e) => setRegX(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="font-mono-tech text-[10px] text-black/50 block mt-1">
                Variabel yang memprediksi atau mempengaruhi Y (variansi &gt; 0).
              </span>
            </div>

            <div>
              <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                VARIABEL TERIKAT / DEPENDENT (Y):
              </label>
              <select
                value={regY}
                disabled={isLocked}
                onChange={(e) => setRegY(e.target.value)}
                className="w-full p-2.5 border border-black font-mono-tech text-xs bg-white"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="font-mono-tech text-[10px] text-black/50 block mt-1">
                Variabel target atau hasil yang diprediksi.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            PANEL PEMERIKSAAN DATA MINIMUM SECARA LANGSUNG (LIVE BADGE)
           ========================================================================= */}
        <div className="border border-black bg-[#FBFBFB] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono-tech text-[10px] uppercase font-bold text-black/70">
              STATUS PEMERIKSAAN KELAYAKAN DATA MINIMUM:
            </span>
            <span
              className={`font-mono-tech text-[10px] uppercase font-bold px-2 py-0.5 border ${
                validationResult.isValid
                  ? "bg-[#00D084] text-black border-black"
                  : "bg-[#FF2E2E] text-white border-black"
              }`}
            >
              {validationResult.isValid ? "DATA MEMENUHI SYARAT" : "SYARAT BELUM TERPENUHI"}
            </span>
          </div>

          {validationResult.isValid ? (
            <div className="font-sans text-xs text-[#00D084] font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00D084]" />
              <span>Seluruh kriteria statistik terpenuhi. Variabel siap dijalankan.</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {validationResult.issues.map((msg, i) => (
                <div key={i} className="font-mono-tech text-xs text-[#C40000] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tombol Navigasi Bawah */}
        <div className="flex items-center justify-between pt-4 border-t border-black">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-black font-mono-tech text-xs font-bold hover:bg-[#F4F4F4] transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Langkah 1</span>
          </button>

          <button
            type="button"
            disabled={!validationResult.isValid || isLoading || isLocked}
            onClick={handleSave}
            className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Simpan & Lanjut ke Hasil</span>
            <ArrowRight className="w-4 h-4 text-[#EBEB00]" />
          </button>
        </div>
      </div>
    </div>
  );
};
