"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";
import { StatCards } from "@/components/analysis/StatCards";
import { ChartVisualization } from "@/components/analysis/ChartVisualization";
import { CaseStudyPanel } from "@/components/analysis/CaseStudyPanel";
import { ProcessingPipeline } from "@/components/analysis/ProcessingPipeline";
import type { AnalysisRecord } from "@/lib/types/analysis";
import {
  Play,
  Bookmark,
  CheckCircle2,
  Copy,
  PlusCircle,
  RefreshCw,
  Globe,
  ShieldAlert,
  BarChart2,
  PieChart,
  BookOpen,
  HelpCircle,
  Check,
} from "lucide-react";

interface ResultStepProps {
  analysis: AnalysisRecord;
  isDemoMode: boolean;
  onRun: () => Promise<void>;
  onSaveToHistory: () => Promise<void>;
  onRequestNarrative: (lang: "id" | "en") => Promise<void>;
  isSaving: boolean;
  isRunning: boolean;
  isRequestingNarrative: boolean;
}

export const ResultStep: React.FC<ResultStepProps> = ({
  analysis,
  isDemoMode,
  onRun,
  onSaveToHistory,
  onRequestNarrative,
  isSaving,
  isRunning,
  isRequestingNarrative,
}) => {
  const [activeTab, setActiveTab] = useState<"angka" | "grafik" | "narasi" | "kasus">("angka");
  const [selectedLang, setSelectedLang] = useState<"id" | "en">("id");
  const [copyToast, setCopyToast] = useState(false);

  // Efek mengetik hanya saat narasi pertama kali muncul
  const [typedNarrative, setTypedNarrative] = useState("");
  const hasTypedRef = useRef(false);

  const currentNarrative = analysis.narasi ? analysis.narasi[selectedLang] : null;

  useEffect(() => {
    if (!currentNarrative) {
      setTypedNarrative("");
      return;
    }

    // Jika belum pernah diketik untuk sesi ini, jalankan efek ketik cepat
    if (!hasTypedRef.current) {
      hasTypedRef.current = true;
      let i = 0;
      const text = currentNarrative;
      const timer = setInterval(() => {
        i += 6; // ketik per bongkahan 6 huruf agar responsif
        if (i >= text.length) {
          setTypedNarrative(text);
          clearInterval(timer);
        } else {
          setTypedNarrative(text.slice(0, i));
        }
      }, 16);
      return () => clearInterval(timer);
    } else {
      setTypedNarrative(currentNarrative);
    }
  }, [currentNarrative]);

  const handleCopyNarrative = async () => {
    if (!currentNarrative) return;
    try {
      await navigator.clipboard.writeText(currentNarrative);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    } catch {
      /* abaikan */
    }
  };

  const isDraf = analysis.status === "draf";
  const hasResults = Boolean(analysis.hasil);
  const hasCaseStudy = Boolean(
    analysis.contoh_kasus &&
      (Array.isArray(analysis.contoh_kasus) ? analysis.contoh_kasus.length > 0 : String(analysis.contoh_kasus).trim() !== "")
  );

  return (
    <div className="space-y-6">
      {/* Toast Salin Narasi */}
      {copyToast && (
        <div
          role="status"
          aria-live="polite"
          className="border-2 border-black bg-[#EBEB00] text-black px-4 py-2 font-mono-tech text-xs font-bold flex items-center justify-between shadow-[3px_3px_0px_#000000] animate-in fade-in slide-in-from-top-1"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#003BFF]" />
            <span>Teks narasi interpretasi berhasil disalin ke papan klip!</span>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE: SIAP DIJALANKAN (STATUS DRAF)
         ========================================================================= */}
      {isDraf && (
        <div className="border border-black bg-white p-8 md:p-12 text-center space-y-6 shadow-[6px_6px_0px_#000000]">
          <div className="flex items-center justify-center gap-4">
            <Mascot character="quin" pose="charge" face="happy" className="w-16 h-16" interactive />
            <Mascot character="mu" pose="read" face="smile" className="w-16 h-16" interactive />
            <Mascot character="sigi" pose="point" face="wow" className="w-16 h-16" interactive />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <span className="font-mono-tech text-xs font-bold text-[#003BFF] uppercase tracking-wider">
              DATASET & KONFIGURASI VALID
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-normal text-black">
              Siap Menjalankan Pengujian Statistik
            </h2>
            <p className="font-sans text-xs md:text-sm text-black/70 leading-relaxed">
              Tekan tombol di bawah untuk menghitung angka deterministik SciPy, membuat grafik SVG piksel, dan menjalankan orkestrasi narasi akademis.
            </p>
          </div>

          {/* Ringkasan Konfigurasi Sebelum Dijalankan */}
          <div className="border border-black bg-[#FBFBFB] p-4 max-w-md mx-auto text-left font-mono-tech text-xs space-y-1.5">
            <div>
              Jenis Analisis: <strong className="uppercase text-[#003BFF]">{analysis.jenis_analisis.replace("_", " ")}</strong>
            </div>
            <div>
              Dataset: <strong>{analysis.nama_sesi}</strong> ({analysis.dataset_input?.total_baris || 0} baris)
            </div>
            <div>
              Status: <span className="px-1.5 py-0.2 bg-[#EBEB00] font-bold border border-black uppercase text-[10px]">DRAF</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              disabled={isRunning}
              onClick={onRun}
              className="px-10 py-4 bg-[#EBEB00] text-black font-mono-tech text-sm font-bold border-2 border-black hover:bg-black hover:text-[#EBEB00] transition-colors inline-flex items-center gap-3 shadow-[6px_6px_0px_#003BFF] cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-5 h-5 fill-current ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Memproses Kalkulasi..." : "JALANKAN ANALISIS SEKARANG"}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          JALUR PEMROSESAN BERMASKOT (QUIN, MU, SIGI) SAAT DIPROSES / HASIL
         ========================================================================= */}
      {!isDraf && (
        <ProcessingPipeline
          status={analysis.status}
          onRetryNarrative={() => onRequestNarrative(selectedLang)}
          isRetrying={isRequestingNarrative}
        />
      )}

      {/* =========================================================================
          BAGIAN HASIL: TAB ANGKA, GRAFIK, NARASI, CONTOH KASUS DENGAN BLOK GESER
         ========================================================================= */}
      {hasResults && (
        <div className="space-y-6">
          {/* Rel Tab Hasil dengan Blok Geser */}
          <div
            role="tablist"
            aria-label="Bagian Hasil Analisis"
            className="relative grid grid-cols-2 md:grid-cols-4 border-2 border-black bg-white shadow-[4px_4px_0px_#000000]"
          >
            {[
              { id: "angka", label: "01. ANGKA STATISTIK", icon: BarChart2 },
              { id: "grafik", label: "02. VISUALISASI GRAFIK", icon: PieChart },
              { id: "narasi", label: "03. NARASI AKADEMIS", icon: BookOpen },
              ...(hasCaseStudy ? [{ id: "kasus", label: "04. CONTOH KASUS", icon: HelpCircle }] : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center gap-2 py-3.5 px-4 font-mono-tech text-xs font-bold tracking-wider transition-colors border-r border-black last:border-r-0 ${
                    isSelected ? "bg-black text-white" : "text-black hover:bg-[#EBEB00]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* KONTEN TAB 1: ANGKA STATISTIK (FR-07 S.D. FR-10) */}
          {activeTab === "angka" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono-tech text-xs text-black/60">
                <span>OUTPUT ANGKA DETERMINISTIK (SCIPY 1.13 EQUIVALENT)</span>
                <span className="text-[#003BFF] font-bold">α = 0.05 SIGNIFIKANSI</span>
              </div>
              <StatCards jenisAnalisis={analysis.jenis_analisis} hasil={analysis.hasil} />
            </div>
          )}

          {/* KONTEN TAB 2: VISUALISASI GRAFIK SVG PIKSEL (FR-13) */}
          {activeTab === "grafik" && (
            <div className="space-y-4">
              <ChartVisualization visualisasi={analysis.visualisasi} />
            </div>
          )}

          {/* KONTEN TAB 3: NARASI DUA BAHASA (FR-11, FR-12) */}
          {activeTab === "narasi" && (
            <div className="border border-black bg-white shadow-[4px_4px_0px_#000000]">
              {/* Header Tab Bahasa & Tombol Buat Ulang */}
              <div className="bg-[#EFEFEF] border-b border-black p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex border border-black bg-white divide-x divide-black font-mono-tech text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedLang("id")}
                      className={`px-4 py-1.5 transition-colors ${
                        selectedLang === "id" ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                      }`}
                    >
                      ID (Bahasa Indonesia)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedLang("en")}
                      className={`px-4 py-1.5 transition-colors ${
                        selectedLang === "en" ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                      }`}
                    >
                      EN (English)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isRequestingNarrative || analysis.status === "diproses"}
                    onClick={() => onRequestNarrative(selectedLang)}
                    className="px-3.5 py-1.5 border border-black bg-[#EBEB00] text-black hover:bg-black hover:text-[#EBEB00] transition-colors font-mono-tech text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRequestingNarrative ? "animate-spin" : ""}`} />
                    <span>Buat Ulang</span>
                  </button>

                  {currentNarrative && (
                    <button
                      type="button"
                      onClick={handleCopyNarrative}
                      className="px-3 py-1.5 border border-black bg-white text-black hover:bg-[#F4F4F4] transition-colors font-mono-tech text-xs font-bold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Narasi</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Teks Narasi Berbasis Teks Biasa (Bebas dangerouslySetInnerHTML) */}
              <div className="p-6 md:p-8 space-y-4">
                {/* State: Belum ada narasi untuk bahasa terpilih */}
                {!currentNarrative && analysis.status !== "diproses" && (
                  <div className="p-8 text-center border border-dashed border-black/30 bg-[#FBFBFB] space-y-3">
                    <Mascot character="mu" pose="point" face="think" className="w-14 h-14 mx-auto" />
                    <div className="font-mono-tech text-xs font-bold text-black">
                      Narasi untuk bahasa {selectedLang.toUpperCase()} belum dibuat.
                    </div>
                    <button
                      type="button"
                      onClick={() => onRequestNarrative(selectedLang)}
                      className="px-5 py-2 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
                    >
                      Buat Narasi {selectedLang.toUpperCase()} Sekarang
                    </button>
                  </div>
                )}

                {/* State: Narasi Sedang Diproses */}
                {analysis.status === "diproses" && (
                  <div className="p-8 text-center space-y-3 border border-black/20 bg-[#FBFBFB]">
                    <div className="w-8 h-8 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
                    <div className="font-mono-tech text-xs font-bold text-black">
                      AI SEDANG MERANGKAI NARASI ({selectedLang.toUpperCase()})...
                    </div>
                    <p className="font-mono-tech text-[11px] text-black/60 max-w-sm mx-auto">
                      Memeriksa guardrail numerik terhadap angka resmi kalkulasi.
                    </p>
                  </div>
                )}

                {/* State: Narasi Tersedia */}
                {currentNarrative && analysis.status !== "diproses" && (
                  <div className="space-y-4">
                    {/* Label Mode Demo Wajib PRD */}
                    {isDemoMode && (
                      <div className="px-3 py-1.5 border border-black bg-[#EBEB00] font-mono-tech text-[10px] font-bold text-black tracking-wider w-fit">
                        NARASI DEMO (TEMPLAT), BUKAN AI
                      </div>
                    )}

                    <div className="border-l-4 border-[#003BFF] pl-5 py-1">
                      <p className="font-sans text-base md:text-lg leading-relaxed text-black font-normal whitespace-pre-wrap select-text">
                        {typedNarrative}
                      </p>
                    </div>

                    <div className="border-t border-black/10 pt-4 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] text-black/50">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>BAHASA: {selectedLang === "id" ? "INDONESIA" : "ENGLISH"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#003BFF] font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>SESUAI ANGKA DETERMINISTIK (BEBAS HALUSINASI)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Penafian Wajib Bantuan AI */}
              <div className="border-t border-black bg-[#FFFDE6] px-5 py-3 font-mono-tech text-[11px] text-black/85 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#003BFF] shrink-0" />
                <span>
                  <strong>Penafian:</strong> Interpretasi ini dibantu AI. Periksa kembali sebelum dipakai.
                </span>
              </div>
            </div>
          )}

          {/* KONTEN TAB 4: CONTOH KASUS (FR-14) */}
          {activeTab === "kasus" && hasCaseStudy && (
            <div className="space-y-4">
              <CaseStudyPanel contohKasus={analysis.contoh_kasus} />
            </div>
          )}

          {/* =========================================================================
              AKSI BAWAH: SIMPAN KE RIWAYAT (FR-16), SALIN NARASI, ANALISIS BARU
             ========================================================================= */}
          <div className="border border-black bg-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_#000000]">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isSaving || analysis.disimpan}
                onClick={onSaveToHistory}
                className={`px-5 py-2.5 font-mono-tech text-xs font-bold border transition-colors flex items-center gap-2 shadow-[2px_2px_0px_#000000] ${
                  analysis.disimpan
                    ? "bg-[#00D084] text-black border-black cursor-default"
                    : "bg-[#EBEB00] text-black border-black hover:bg-black hover:text-[#EBEB00]"
                }`}
              >
                {analysis.disimpan ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Tersimpan di Riwayat</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>{isSaving ? "Menyimpan..." : "Simpan ke Riwayat"}</span>
                  </>
                )}
              </button>

              {currentNarrative && (
                <button
                  type="button"
                  onClick={handleCopyNarrative}
                  className="px-4 py-2.5 border border-black bg-white hover:bg-[#F4F4F4] transition-colors font-mono-tech text-xs font-bold flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Narasi</span>
                </button>
              )}
            </div>

            <Link
              href="/analisis/baru"
              className="px-5 py-2.5 bg-black text-white hover:bg-[#003BFF] transition-colors font-mono-tech text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#000000]"
            >
              <PlusCircle className="w-4 h-4 text-[#EBEB00]" />
              <span>Analisis Baru</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
