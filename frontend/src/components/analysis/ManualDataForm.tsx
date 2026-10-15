"use client";

import React, { useState } from "react";
import { Plus, Trash2, Code, Table, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import type { DatasetSummary, InputSource } from "@/lib/types/analysis";
import { analyzeColumns } from "@/lib/api/fileParser";

interface ManualDataFormProps {
  onDatasetReady: (dataset: DatasetSummary) => void;
}

export const ManualDataForm: React.FC<ManualDataFormProps> = ({ onDatasetReady }) => {
  const [mode, setMode] = useState<InputSource>("mentah");
  const [datasetName, setDatasetName] = useState<string>("Dataset Praktikum");

  // State untuk Mode A: Data Mentah
  const [columns, setColumns] = useState<string[]>(["nilai_ujian", "jam_belajar"]);
  const [rows, setRows] = useState<Record<string, string | number>[]>([
    { nilai_ujian: 78, jam_belajar: 5 },
    { nilai_ujian: 85, jam_belajar: 7 },
    { nilai_ujian: 62, jam_belajar: 3 },
    { nilai_ujian: 90, jam_belajar: 9 },
    { nilai_ujian: 70, jam_belajar: 4 },
  ]);
  const [newColName, setNewColName] = useState("");

  // State untuk Mode B: Statistik Siap Pakai
  const defaultJsonSample = JSON.stringify(
    {
      jenis_analisis: "deskriptif",
      ringkasan: [
        {
          kolom: "skor_kemampuan",
          mean: 76.5,
          median: 77.0,
          modus: [78],
          standar_deviasi: 8.24,
          min: 55.0,
          max: 95.0,
          n: 40,
        },
      ],
    },
    null,
    2
  );
  const [jsonContent, setJsonContent] = useState<string>(defaultJsonSample);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // ---------- Handler Mode A: Data Mentah ----------
  const handleAddColumn = () => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    if (columns.includes(trimmed)) {
      alert("Nama kolom sudah ada!");
      return;
    }
    setColumns([...columns, trimmed]);
    setRows(rows.map((r) => ({ ...r, [trimmed]: "" })));
    setNewColName("");
  };

  const handleRemoveColumn = (colToRemove: string) => {
    if (columns.length <= 1) {
      alert("Dataset harus memiliki minimal satu kolom!");
      return;
    }
    setColumns(columns.filter((c) => c !== colToRemove));
    setRows(
      rows.map((r) => {
        const copy = { ...r };
        delete copy[colToRemove];
        return copy;
      })
    );
  };

  const handleAddRow = () => {
    const emptyRow: Record<string, string | number> = {};
    columns.forEach((c) => (emptyRow[c] = ""));
    setRows([...rows, emptyRow]);
  };

  const handleRemoveRow = (idx: number) => {
    if (rows.length <= 1) {
      alert("Dataset harus memiliki minimal satu baris data!");
      return;
    }
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleCellChange = (rowIndex: number, colName: string, val: string) => {
    const updated = [...rows];
    const num = Number(val);
    updated[rowIndex] = {
      ...updated[rowIndex],
      [colName]: val !== "" && !isNaN(num) && isFinite(num) ? num : val,
    };
    setRows(updated);
  };

  const loadSampleTTest = () => {
    setColumns(["skor", "metode"]);
    setRows([
      { skor: 75, metode: "Metode_A" },
      { skor: 68, metode: "Metode_A" },
      { skor: 80, metode: "Metode_A" },
      { skor: 72, metode: "Metode_A" },
      { skor: 88, metode: "Metode_B" },
      { skor: 92, metode: "Metode_B" },
      { skor: 85, metode: "Metode_B" },
      { skor: 89, metode: "Metode_B" },
    ]);
  };

  const loadSampleRegression = () => {
    setColumns(["jam_belajar", "nilai_akhir"]);
    setRows([
      { jam_belajar: 2, nilai_akhir: 58 },
      { jam_belajar: 4, nilai_akhir: 68 },
      { jam_belajar: 5, nilai_akhir: 74 },
      { jam_belajar: 7, nilai_akhir: 82 },
      { jam_belajar: 8, nilai_akhir: 90 },
      { jam_belajar: 9, nilai_akhir: 95 },
    ]);
  };

  const submitRaw = () => {
    if (rows.length === 0) {
      alert("Baris data tidak boleh kosong!");
      return;
    }

    const colInfo = analyzeColumns(columns, rows);

    const summary: DatasetSummary = {
      nama_dataset: datasetName.trim() || "Dataset Manual",
      format_data: "manual",
      sumber_input: "mentah",
      total_baris: rows.length,
      total_kolom: columns.length,
      kolom: columns,
      kolom_info: colInfo,
      preview_baris: rows.slice(0, 10),
      data_mentah: rows,
    };

    onDatasetReady(summary);
  };

  // ---------- Handler Mode B: Statistik Siap Pakai ----------
  const submitReadyMade = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonContent);
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("JSON harus berupa objek atau array valid");
      }

      const summary: DatasetSummary = {
        nama_dataset: datasetName.trim() || "Statistik Siap Pakai",
        format_data: "json",
        sumber_input: "siap_pakai",
        total_baris: 1,
        total_kolom: 1,
        kolom: ["output_statistik"],
        preview_baris: [{ info: "Output Statistik JSON Terverifikasi" }],
        data_siap_pakai: parsed,
      };

      onDatasetReady(summary);
    } catch (err: any) {
      setJsonError(err.message || "Format JSON tidak valid");
    }
  };

  return (
    <div className="border border-black bg-white p-6 md:p-8">
      {/* Sesi Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black">
        <div>
          <label className="block font-mono-tech text-xs font-bold text-black/70 mb-1">
            NAMA DATASET / SESI ANALISIS
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="mis. Eksperimen Jam Belajar vs Nilai"
            className="w-full md:w-80 px-3 py-2 border border-black font-mono-tech text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#003BFF]"
          />
        </div>

        {/* Tab Mode */}
        <div className="flex border border-black bg-[#F4F4F4] p-1 gap-1">
          <button
            type="button"
            onClick={() => setMode("mentah")}
            className={`flex items-center gap-2 px-4 py-2 font-mono-tech text-xs font-bold transition-colors ${
              mode === "mentah"
                ? "bg-black text-white"
                : "bg-transparent text-black hover:bg-white"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Mode A: Data Mentah</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("siap_pakai")}
            className={`flex items-center gap-2 px-4 py-2 font-mono-tech text-xs font-bold transition-colors ${
              mode === "siap_pakai"
                ? "bg-[#003BFF] text-white"
                : "bg-transparent text-black hover:bg-white"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Mode B: Statistik Siap Pakai</span>
          </button>
        </div>
      </div>

      {/* MODE A: TABEL DATA MENTAH */}
      {mode === "mentah" && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="font-mono-tech text-xs font-bold text-black/60">
                TEMPLAT CEPAT:
              </span>
              <button
                type="button"
                onClick={loadSampleTTest}
                className="px-2.5 py-1 text-[11px] font-mono-tech font-bold border border-black hover:bg-[#EBEB00] transition-colors"
              >
                + Data Uji t (2 Grup)
              </button>
              <button
                type="button"
                onClick={loadSampleRegression}
                className="px-2.5 py-1 text-[11px] font-mono-tech font-bold border border-black hover:bg-[#EBEB00] transition-colors"
              >
                + Data Korelasi / Regresi
              </button>
            </div>

            {/* Tambah Kolom Baru */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                placeholder="Nama kolom baru..."
                className="px-3 py-1.5 border border-black font-mono-tech text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-3 py-1.5 bg-black text-white font-mono-tech text-xs font-bold flex items-center gap-1 hover:bg-[#003BFF] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kolom</span>
              </button>
            </div>
          </div>

          {/* Tabel Input Interaktif */}
          <div className="overflow-x-auto border border-black max-h-[420px] bg-white">
            <table className="w-full text-left border-collapse font-mono-tech text-xs">
              <thead className="bg-[#EFEFEF] sticky top-0 border-b border-black z-10">
                <tr>
                  <th className="p-2 border-r border-black w-12 text-center text-black/40">#</th>
                  {columns.map((col) => (
                    <th key={col} className="p-2 border-r border-black min-w-[140px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">{col}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(col)}
                          title={`Hapus kolom ${col}`}
                          className="text-black/40 hover:text-[#FF2E2E]"
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F9F9F9]">
                    <td className="p-2 border-r border-black text-center text-black/50 font-bold">
                      {rIdx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="p-1 border-r border-black/20">
                        <input
                          type="text"
                          value={row[col] !== undefined ? row[col] : ""}
                          onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                          className="w-full px-2 py-1 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-black font-mono-tech text-xs"
                        />
                      </td>
                    ))}
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(rIdx)}
                        className="text-black/40 hover:text-[#FF2E2E]"
                        title="Hapus baris"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 border border-black font-mono-tech text-xs font-bold hover:bg-[#F4F4F4] transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris ({rows.length} baris)</span>
            </button>

            <button
              type="button"
              onClick={submitRaw}
              className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#EBEB00]" />
              <span>Simpan & Lanjutkan Konfigurasi</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE B: STATISTIK SIAP PAKAI (JSON) */}
      {mode === "siap_pakai" && (
        <div className="mt-6">
          <div className="bg-[#FFFDE6] border border-[#EBEB00] p-4 mb-4 text-xs font-mono-tech text-black flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#003BFF] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mode Statistik Siap Pakai:</span> Masukkan output ringkasan statistik yang sudah ada dalam format JSON. Backend tidak akan menghitung ulang angka-angka ini, melainkan langsung meneruskannya untuk validasi skema dan pembuatan narasi interpretatif AI.
            </div>
          </div>

          {jsonError && (
            <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-3 mb-4 font-mono-tech text-xs text-[#C40000] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{jsonError}</span>
            </div>
          )}

          <div>
            <label className="block font-mono-tech text-xs font-bold mb-1">
              EDITOR JSON OUTPUT STATISTIK
            </label>
            <textarea
              rows={12}
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              className="w-full p-4 border border-black font-mono-tech text-xs bg-[#1E1E1E] text-[#D4D4D4] focus:outline-none focus:ring-2 focus:ring-[#003BFF]"
              spellCheck={false}
            />
          </div>

          <div className="flex items-center justify-end mt-4">
            <button
              type="button"
              onClick={submitReadyMade}
              className="px-6 py-2.5 bg-[#003BFF] text-white font-mono-tech text-xs font-bold hover:bg-[#002ec7] transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Validasi & Lanjutkan (Siap Pakai)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
