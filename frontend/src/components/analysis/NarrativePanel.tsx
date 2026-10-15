"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Globe, Check, ShieldAlert } from "lucide-react";
import type { AnalysisStatus } from "@/lib/types/analysis";

interface NarrativePanelProps {
  status: AnalysisStatus;
  narasi?: {
    id: string | null;
    en: string | null;
  };
  onRegenerate: (lang: "id" | "en") => void;
  isRegenerating: boolean;
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  status,
  narasi,
  onRegenerate,
  isRegenerating,
}) => {
  const [selectedLang, setSelectedLang] = useState<"id" | "en">("id");

  const currentNarrative = narasi ? narasi[selectedLang] : null;

  return (
    <div className="border border-black bg-white">
      {/* Top Header & Controls */}
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#003BFF] text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            NARASI INTERPRETASI STATISTIK (FR-12)
          </span>
        </div>

        {/* Language selector & Regenerate button */}
        <div className="flex items-center gap-2">
          {/* Bahasa Tabs */}
          <div className="flex border border-black bg-white divide-x divide-black font-mono-tech text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedLang("id")}
              className={`px-3 py-1 transition-colors ${
                selectedLang === "id" ? "bg-black text-white" : "hover:bg-[#EBEB00]"
              }`}
            >
              ID (Indonesia)
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className={`px-3 py-1 transition-colors ${
                selectedLang === "en" ? "bg-black text-white" : "hover:bg-[#EBEB00]"
              }`}
            >
              EN (English)
            </button>
          </div>

          {/* Regenerate Button */}
          <button
            type="button"
            onClick={() => onRegenerate(selectedLang)}
            disabled={isRegenerating || status === "diproses"}
            className="px-3 py-1 border border-black font-mono-tech text-xs font-bold bg-[#EBEB00] hover:bg-black hover:text-[#EBEB00] transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin" : ""}`} />
            <span>{isRegenerating ? "Memproses..." : "Buat Ulang"}</span>
          </button>
        </div>
      </div>

      {/* Body Area */}
      <div className="p-6 md:p-8">
        {/* State: Sedang diproses AI (FR-11) */}
        {(status === "diproses" || isRegenerating) && (
          <div className="p-6 border border-black/20 bg-[#FBFBFB] text-center space-y-3">
            <div className="w-8 h-8 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
            <div className="font-mono-tech text-xs font-bold text-black">
              AI SEDANG MENGGENERATE NARASI ({selectedLang.toUpperCase()})...
            </div>
            <div className="font-mono-tech text-[11px] text-black/60 max-w-md mx-auto">
              Memproses ringkasan statistik melalui guardrail akurasi numerik deterministik. Polling status aktif setiap 2–3 detik.
            </div>
          </div>
        )}

        {/* State: Narasi Gagal (FR-11) */}
        {status === "narasi_gagal" && !isRegenerating && (
          <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-4 font-mono-tech text-xs text-[#C40000] space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Generasi Narasi AI Gagal (Status: narasi_gagal)</span>
            </div>
            <p className="text-black/80 font-sans text-sm">
              AI Orchestrator tidak berhasil memvalidasi kesesuaian angka guardrail atau mengalami batas waktu timeout. Angka hasil statistik deterministik dan visualisasi tetap aman dan akurat.
            </p>
            <button
              type="button"
              onClick={() => onRegenerate(selectedLang)}
              className="px-4 py-2 bg-[#FF2E2E] text-white font-mono-tech text-xs font-bold hover:bg-black transition-colors"
            >
              Coba Ulang Generasi Narasi
            </button>
          </div>
        )}

        {/* State: Gagal Perhitungan */}
        {status === "gagal" && !isRegenerating && (
          <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-4 font-mono-tech text-xs text-[#C40000] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Terjadi kesalahan pada pemrosesan backend. Silakan periksa kembali konfigurasi dataset Anda.</span>
          </div>
        )}

        {/* State: Berhasil / Ada Teks Narasi */}
        {currentNarrative && !isRegenerating && (
          <div className="space-y-4">
            <div className="border-l-4 border-[#003BFF] pl-4 py-1">
              <p className="font-sans text-base leading-relaxed text-black font-normal whitespace-pre-wrap">
                {currentNarrative}
              </p>
            </div>

            <div className="border-t border-black/10 pt-4 flex items-center justify-between font-mono-tech text-[10px] text-black/50">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>BAHASA: {selectedLang === "id" ? "INDONESIA (ID)" : "ENGLISH (EN)"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#003BFF] font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>GUARDRAIL NUMERIK LOLOS</span>
              </div>
            </div>
          </div>
        )}

        {/* State Kosong */}
        {!currentNarrative && status !== "diproses" && status !== "narasi_gagal" && !isRegenerating && (
          <div className="p-6 text-center font-mono-tech text-xs text-black/50">
            Narasi untuk bahasa {selectedLang.toUpperCase()} belum dibuat. Klik tombol &quot;Buat Ulang&quot; di atas untuk meminta generasi narasi dari AI.
          </div>
        )}
      </div>

      {/* Penafian Wajib Bantuan AI */}
      <div className="border-t border-black bg-[#FFFDE6] px-4 py-2.5 font-mono-tech text-[10px] text-black/80 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-[#003BFF] shrink-0" />
        <span>
          <strong>Pemberitahuan Akademis:</strong> Narasi interpretatif dibantu oleh kecerdasan buatan (AI) berdasarkan angka deterministik SciPy/pandas dan perlu diverifikasi kembali oleh pengguna sebelum disitasi.
        </span>
      </div>
    </div>
  );
};
