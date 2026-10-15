"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, RefreshCw, X, ArrowRight } from "lucide-react";
import type { DatasetSummary } from "@/lib/types/analysis";
import { parseUploadedFile, MAX_FILE_SIZE_BYTES } from "@/lib/api/fileParser";

interface FileUploadFormProps {
  onDatasetReady: (dataset: DatasetSummary, file?: File) => void;
}

export const FileUploadForm: React.FC<FileUploadFormProps> = ({ onDatasetReady }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<DatasetSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setLoading(true);

    try {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`Ukuran file melebihi batas 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
      }

      const summary = await parseUploadedFile(file);
      setParsedSummary(summary);
    } catch (err: any) {
      setError(err.message || "Gagal membaca berkas file.");
      setParsedSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedSummary(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProceed = () => {
    if (parsedSummary) {
      onDatasetReady(parsedSummary, selectedFile || undefined);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="border border-black bg-white p-6 md:p-8">
      {/* Upload Box */}
      {!parsedSummary ? (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed p-8 md:p-12 text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
              dragOver
                ? "border-[#003BFF] bg-[#003BFF]/5"
                : "border-black/30 hover:border-black bg-[#FBFBFB]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 border border-black bg-white flex items-center justify-center mb-4 text-[#003BFF]">
              {selectedFile?.name.endsWith(".csv") ? (
                <FileText className="w-7 h-7" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>

            <div className="font-mono-tech text-sm font-bold text-black mb-1">
              TARIK & LEPASKAN FILE ATAU KLIK UNTUK MEMILIH
            </div>
            <div className="font-mono-tech text-xs text-black/60 max-w-md">
              Mendukung file <strong className="text-black">.CSV</strong> (FR-03) dan{" "}
              <strong className="text-black">.XLSX / .XLS</strong> (FR-04). Ukuran maksimal 5 MB dan hingga 10.000 baris.
            </div>

            {loading && (
              <div className="mt-4 flex items-center gap-2 font-mono-tech text-xs text-[#003BFF]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membaca dan memverifikasi isi dataset...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 border border-[#FF2E2E] bg-[#FF2E2E]/10 font-mono-tech text-xs text-[#C40000] flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Galat Pembacaan Berkas:</span> {error}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Card */
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#F4F4F4] border border-black mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center">
                {parsedSummary.format_data === "csv" ? (
                  <FileText className="w-5 h-5" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-[#00D084]" />
                )}
              </div>
              <div>
                <div className="font-mono-tech text-xs font-bold text-black">
                  {parsedSummary.nama_file || "Dataset Unggahan"}
                </div>
                <div className="font-mono-tech text-[11px] text-black/60">
                  {selectedFile ? formatFileSize(selectedFile.size) : ""}{" "}
                  · <span className="font-bold text-black">{parsedSummary.total_baris.toLocaleString()} baris</span>{" "}
                  · <span className="font-bold text-black">{parsedSummary.total_kolom} kolom</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 border border-black font-mono-tech text-xs font-bold hover:bg-[#FF2E2E] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ganti File</span>
              </button>
            </div>
          </div>

          {/* Kolom Informasi Ringkas */}
          <div className="mb-4">
            <span className="font-mono-tech text-xs font-bold text-black/70 block mb-2">
              DAFTAR KOLOM TERDETEKSI:
            </span>
            <div className="flex flex-wrap gap-2">
              {parsedSummary.kolom_info?.map((col) => (
                <div
                  key={col.name}
                  className="px-2.5 py-1 border border-black font-mono-tech text-[11px] bg-white flex items-center gap-2"
                >
                  <span className="font-bold">{col.name}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 border ${
                      col.type === "numeric"
                        ? "bg-[#003BFF] text-white border-[#003BFF]"
                        : "bg-[#EBEB00] text-black border-black"
                    }`}
                  >
                    {col.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Preview (10 Baris Pertama) */}
          <div className="border border-black overflow-x-auto max-h-[320px] bg-white">
            <table className="w-full text-left border-collapse font-mono-tech text-xs">
              <thead className="bg-[#EFEFEF] sticky top-0 border-b border-black">
                <tr>
                  <th className="p-2 border-r border-black w-10 text-center text-black/40">#</th>
                  {parsedSummary.kolom.map((col) => (
                    <th key={col} className="p-2 border-r border-black font-bold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {parsedSummary.preview_baris.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9F9F9]">
                    <td className="p-2 border-r border-black text-center text-black/50">
                      {idx + 1}
                    </td>
                    {parsedSummary.kolom.map((col) => (
                      <td key={col} className="p-2 border-r border-black/20 whitespace-nowrap">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <span className="font-mono-tech text-[11px] text-black/60">
              Menampilkan preview 10 baris pertama dari total {parsedSummary.total_baris} baris data.
            </span>
            <button
              type="button"
              onClick={handleProceed}
              className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-[#EBEB00]" />
              <span>Gunakan Dataset & Lanjut Konfigurasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
