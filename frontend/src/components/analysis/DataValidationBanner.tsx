"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AnalysisType, DatasetSummary } from "@/lib/types/analysis";

interface DataValidationBannerProps {
  dataset: DatasetSummary;
  analysisType: AnalysisType;
  selectedColumns: Record<string, string | string[]>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { field?: string; message: string }[];
  warnings: string[];
}

export function validateAnalysisInput(
  dataset: DatasetSummary,
  analysisType: AnalysisType,
  selectedColumns: Record<string, string | string[]>
): ValidationResult {
  const errors: { field?: string; message: string }[] = [];
  const warnings: string[] = [];

  if (dataset.sumber_input === "siap_pakai") {
    // Mode siap pakai tidak membutuhkan validasi baris mentah
    return { isValid: true, errors: [], warnings: [] };
  }

  const rows = dataset.data_mentah || [];
  if (rows.length === 0) {
    errors.push({ message: "Dataset tidak memiliki baris data." });
    return { isValid: false, errors, warnings };
  }

  // Helper pemeriksa numerik
  const checkNumericColumn = (colName: string, minObs: number = 2): boolean => {
    if (!colName) return false;
    const values = rows.map((r) => r[colName]);
    const validNums = values.filter((v) => v !== "" && v !== null && !isNaN(Number(v)) && isFinite(Number(v)));
    const emptyCount = values.filter((v) => v === "" || v === null || v === undefined).length;
    const invalidNonNum = values.length - validNums.length - emptyCount;

    if (emptyCount > 0) {
      warnings.push(`Terdapat ${emptyCount} baris bernilai kosong pada kolom '${colName}'. Baris kosong akan diabaikan.`);
    }
    if (invalidNonNum > 0) {
      errors.push({
        field: colName,
        message: `Kolom '${colName}' berisi ${invalidNonNum} nilai non-numerik. Analisis statistik memerlukan data angka.`,
      });
      return false;
    }
    if (validNums.length < minObs) {
      errors.push({
        field: colName,
        message: `Kolom '${colName}' hanya memiliki ${validNums.length} observasi valid (minimal ${minObs} observasi diperlukan).`,
      });
      return false;
    }
    return true;
  };

  if (analysisType === "deskriptif") {
    const cols = (selectedColumns.kolom_ringkasan as string[]) || [];
    if (cols.length === 0) {
      errors.push({ field: "kolom_ringkasan", message: "Pilih setidaknya satu kolom numerik untuk diringkas." });
    } else {
      cols.forEach((col) => checkNumericColumn(col, 2));
    }
  } else if (analysisType === "uji_t") {
    const colNilai = selectedColumns.kolom_nilai as string;
    const colKelompok = selectedColumns.kolom_kelompok as string;

    if (!colNilai) {
      errors.push({ field: "kolom_nilai", message: "Pilih kolom nilai numerik untuk Uji t." });
    } else {
      checkNumericColumn(colNilai, 4);
    }

    if (!colKelompok) {
      errors.push({ field: "kolom_kelompok", message: "Pilih kolom kelompok untuk Uji t." });
    } else {
      // Periksa kelompok unik
      const groups = new Set<string>();
      const groupCounts: Record<string, number> = {};

      rows.forEach((r) => {
        const g = String(r[colKelompok] ?? "").trim();
        const v = r[colNilai];
        if (g !== "" && v !== "" && !isNaN(Number(v))) {
          groups.add(g);
          groupCounts[g] = (groupCounts[g] || 0) + 1;
        }
      });

      if (groups.size !== 2) {
        errors.push({
          field: colKelompok,
          message: `Kolom kelompok '${colKelompok}' harus memiliki tepat 2 kelompok berbeda. Terdeteksi ${groups.size} kelompok: [${Array.from(groups).slice(0, 5).join(", ")}].`,
        });
      } else {
        const [g1, g2] = Array.from(groups);
        if (groupCounts[g1] < 2) {
          errors.push({
            field: colKelompok,
            message: `Kelompok '${g1}' hanya memiliki ${groupCounts[g1]} data. Uji t memerlukan minimal 2 observasi per kelompok.`,
          });
        }
        if (groupCounts[g2] < 2) {
          errors.push({
            field: colKelompok,
            message: `Kelompok '${g2}' hanya memiliki ${groupCounts[g2]} data. Uji t memerlukan minimal 2 observasi per kelompok.`,
          });
        }
      }
    }
  } else if (analysisType === "korelasi" || analysisType === "regresi") {
    const colX = selectedColumns.kolom_x as string;
    const colY = selectedColumns.kolom_y as string;

    if (!colX) errors.push({ field: "kolom_x", message: "Pilih variabel X (numerik)." });
    if (!colY) errors.push({ field: "kolom_y", message: "Pilih variabel Y (numerik)." });

    if (colX && colY) {
      if (colX === colY) {
        errors.push({
          field: "kolom_y",
          message: "Variabel X dan variabel Y tidak boleh merupakan kolom yang sama.",
        });
      } else {
        checkNumericColumn(colX, 3);
        checkNumericColumn(colY, 3);

        // Periksa pasangan valid
        const pairsCount = rows.filter((r) => {
          const x = Number(r[colX]);
          const y = Number(r[colY]);
          return !isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y);
        }).length;

        if (pairsCount < 3) {
          errors.push({
            message: `Hanya ditemukan ${pairsCount} pasangan data numerik lengkap untuk '${colX}' dan '${colY}' (minimal 3 pasang).`,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export const DataValidationBanner: React.FC<DataValidationBannerProps> = ({
  dataset,
  analysisType,
  selectedColumns,
}) => {
  const result = validateAnalysisInput(dataset, analysisType, selectedColumns);

  if (result.isValid && result.warnings.length === 0) {
    return (
      <div className="border border-[#003BFF] bg-[#003BFF]/5 p-3 font-mono-tech text-xs text-[#003BFF] flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Validasi frontend berhasil: Struktur data dan tipe kolom memenuhi kriteria analisis {analysisType.toUpperCase()}.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {result.errors.length > 0 && (
        <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-3 font-mono-tech text-xs text-[#C40000]">
          <div className="font-bold flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Koreksi yang Diperlukan Sebelum Menjalankan Analisis (FR-05):</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {result.errors.map((err, idx) => (
              <li key={idx}>
                {err.field && <strong className="underline mr-1">{err.field}:</strong>}
                {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="border border-[#EBEB00] bg-[#FFFDE6] p-3 font-mono-tech text-xs text-black">
          <div className="font-bold flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#003BFF]" />
            <span>Peringatan Data:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-black/80">
            {result.warnings.map((warn, idx) => (
              <li key={idx}>{warn}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
