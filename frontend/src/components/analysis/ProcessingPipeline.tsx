"use client";

import React from "react";
import { Mascot } from "@/components/ui/Mascot";
import type { AnalysisStatus } from "@/lib/types/analysis";
import { Sparkles, AlertTriangle, RefreshCw } from "lucide-react";

interface ProcessingPipelineProps {
  status: AnalysisStatus;
  onRetryNarrative?: () => void;
  isRetrying?: boolean;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({
  status,
  onRetryNarrative,
  isRetrying = false,
}) => {
  if (status === "draf") return null;

  return (
    <div className="border border-black bg-white p-6 md:p-8 space-y-6 shadow-[4px_4px_0px_#000000]">
      {/* Header Jalur Pemrosesan */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#003BFF] text-white flex items-center justify-center border border-black">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono-tech text-xs font-bold text-black uppercase tracking-wider">
            JALUR PEMROSESAN STATISTIK & AI
          </span>
        </div>

        {/* Chip Status */}
        <div className="flex items-center gap-2">
          <span className="font-mono-tech text-[10px] text-black/50 font-bold">STATUS PIPELINE:</span>
          {status === "diproses" && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EBEB00] text-black border border-black font-mono-tech text-xs font-bold uppercase">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-3 bg-black animate-pulse" />
                <span className="w-1.5 h-3 bg-black animate-pulse delay-75" />
                <span className="w-1.5 h-3 bg-black animate-pulse delay-150" />
              </span>
              <span>Diproses (Polling 2.5s)</span>
            </div>
          )}
          {status === "selesai" && (
            <span className="px-3 py-1 bg-[#00D084] text-black border border-black font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 bg-black inline-block" />
              <span>Selesai & Diverifikasi</span>
            </span>
          )}
          {status === "narasi_gagal" && (
            <span className="px-3 py-1 bg-[#FF2E2E] text-white border border-black font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5">
              <span>! Narasi Gagal</span>
            </span>
          )}
          {status === "gagal" && (
            <span className="px-3 py-1 bg-[#FF2E2E] text-white border border-black font-mono-tech text-xs font-bold uppercase flex items-center gap-1.5">
              <span>! Pemrosesan Gagal</span>
            </span>
          )}
        </div>
      </div>

      {/* Tiga Maskot Bekerja di Jalur Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black border border-black bg-[#FBFBFB]">
        {/* 1. QUIN: Menghitung Angka & Formula */}
        <div className="p-5 text-center space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-tech text-[10px] uppercase font-bold text-black/60 bg-white px-2 py-0.5 border border-black">
              TAHAP 1: KALKULASI
            </span>
          </div>
          <div className="py-2">
            <Mascot
              character="quin"
              pose={status === "selesai" ? "cheer" : "cast"}
              face={status === "selesai" ? "happy" : "think"}
              className="w-16 h-16 mx-auto"
              interactive
            />
          </div>
          <div className="font-mono-tech text-xs font-bold text-black">
            Quin: Menghitung Angka
          </div>
          <p className="font-sans text-xs text-black/70 leading-relaxed max-w-[200px] mx-auto">
            {status === "diproses"
              ? "Menjalankan kalkulasi deterministik SciPy untuk uji statistik."
              : "Formula deterministik selesai dan valid tanpa halusinasi numerik."}
          </p>
        </div>

        {/* 2. MU: Merangkai Narasi Bahasa ID / EN */}
        <div className="p-5 text-center space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-tech text-[10px] uppercase font-bold text-black/60 bg-white px-2 py-0.5 border border-black">
              TAHAP 2: NARASI AI
            </span>
          </div>
          <div className="py-2">
            <Mascot
              character="mu"
              pose={status === "narasi_gagal" ? "cover" : status === "selesai" ? "cheer" : "read"}
              face={status === "narasi_gagal" ? "sad" : status === "selesai" ? "happy" : "talk"}
              className="w-16 h-16 mx-auto"
              interactive
            />
          </div>
          <div className="font-mono-tech text-xs font-bold text-black">
            Mu: Merangkai Narasi
          </div>
          <p className="font-sans text-xs text-black/70 leading-relaxed max-w-[200px] mx-auto">
            {status === "narasi_gagal"
              ? "Mu kesulitan memvalidasi kesesuaian angka atau server timeout."
              : status === "diproses"
              ? "Menyusun interpretasi akademis dan analogi nyata dari hasil angka."
              : "Narasi dwibahasa ID dan EN siap dibaca."}
          </p>
        </div>

        {/* 3. SIGI: Memeriksa Konsistensi Angka & Guardrails */}
        <div className="p-5 text-center space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono-tech text-[10px] uppercase font-bold text-black/60 bg-white px-2 py-0.5 border border-black">
              TAHAP 3: GUARDRAIL & VERIFIKASI
            </span>
          </div>
          <div className="py-2">
            <Mascot
              character="sigi"
              pose={status === "selesai" ? "cheer" : "point"}
              face={status === "selesai" ? "happy" : "smile"}
              className="w-16 h-16 mx-auto"
              interactive
            />
          </div>
          <div className="font-mono-tech text-xs font-bold text-black">
            Sigi: Memeriksa Guardrail
          </div>
          <p className="font-sans text-xs text-black/70 leading-relaxed max-w-[200px] mx-auto">
            {status === "diproses"
              ? "Mencocokkan setiap angka dalam teks dengan hasil kalkulasi resmi."
              : "Verifikasi guardrail numerik lolos 100%!"}
          </p>
        </div>
      </div>

      {/* Banner Khusus Saat narasi_gagal */}
      {status === "narasi_gagal" && (
        <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-tech text-xs text-[#C40000]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase">Generasi Narasi AI Mengalami Kendala (narasi_gagal)</div>
              <div className="text-black/80 font-sans text-xs mt-0.5">
                Angka hasil statistik deterministik dan visualisasi grafik tetap akurat dan dapat digunakan. Klik tombol di kanan untuk mencoba kembali memproses narasi.
              </div>
            </div>
          </div>
          {onRetryNarrative && (
            <button
              type="button"
              onClick={onRetryNarrative}
              disabled={isRetrying}
              className="px-4 py-2 bg-[#FF2E2E] text-white font-mono-tech text-xs font-bold hover:bg-black transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              <span>{isRetrying ? "Memproses..." : "Ulangi Narasi"}</span>
            </button>
          )}
        </div>
      )}

      {/* Banner Khusus Saat status gagal keseluruhan */}
      {status === "gagal" && (
        <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-tech text-xs text-[#C40000]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase">Kalkulasi Statistik Gagal Diproses</div>
              <div className="text-black/80 font-sans text-xs mt-0.5">
                Periksa kembali kelengkapan dan format data numerik Anda.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
