"use client";

import React, { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { StatCards } from "@/components/analysis/StatCards";
import { ChartVisualization } from "@/components/analysis/ChartVisualization";
import { NarrativePanel } from "@/components/analysis/NarrativePanel";
import { CaseStudyPanel } from "@/components/analysis/CaseStudyPanel";
import { AnalysesApi } from "@/lib/api/analysesApi";
import type { AnalysisRecord } from "@/lib/types/analysis";
import { Bookmark, CheckCircle2, ArrowLeft, PlusCircle, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

export default function DetailAnalisisPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAnalysis = async (isInitial = false) => {
    try {
      const data = await AnalysesApi.getResult(id);
      setAnalysis(data);

      if (data.disimpan) setSavedSuccess(true);

      // Tangani status polling jika masih diproses
      if (data.status === "diproses") {
        if (!pollingRef.current) {
          pollingRef.current = setInterval(() => {
            fetchAnalysis(false);
          }, 2500);
        }
      } else {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail hasil analisis.");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(true);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [id]);

  const handleSaveToHistory = async () => {
    setIsSaving(true);
    try {
      await AnalysesApi.saveToHistory(id);
      setSavedSuccess(true);
      if (analysis) {
        setAnalysis({ ...analysis, disimpan: true });
      }
    } catch (err: any) {
      alert("Gagal menyimpan ke riwayat: " + (err.message || "Kesalahan server"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateNarrative = async (lang: "id" | "en") => {
    setIsRegenerating(true);
    try {
      const updated = await AnalysesApi.requestNarrative(id, lang);
      setAnalysis(updated);
    } catch (err: any) {
      alert("Gagal membuat ulang narasi: " + (err.message || "Kesalahan server"));
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] text-black">
        <AppNavbar />
        <div className="max-w-6xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-10 h-10 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
          <div className="font-mono-tech text-xs font-bold text-black/60">
            MEMUAT HASIL ANALISIS...
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] text-black">
        <AppNavbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="p-4 border border-[#FF2E2E] bg-[#FF2E2E]/10 font-mono-tech text-xs text-[#C40000] flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{error || "Analisis tidak ditemukan"}</span>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Action & Status Header */}
        <div className="border border-black bg-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono-tech text-xs font-bold uppercase text-[#003BFF]">
                  {analysis.jenis_analisis.replace("_", " ")}
                </span>
                <span className="text-black/30">·</span>
                <span
                  className={`font-mono-tech text-[10px] px-2 py-0.5 border font-bold uppercase ${
                    analysis.status === "selesai"
                      ? "bg-[#00D084] text-black border-black"
                      : analysis.status === "diproses"
                      ? "bg-[#EBEB00] text-black border-black"
                      : "bg-[#FF2E2E] text-white border-black"
                  }`}
                >
                  {analysis.status}
                </span>
              </div>
              <h1 className="font-display text-2xl md:text-4xl font-normal text-black">
                {analysis.nama_sesi}
              </h1>
              <div className="font-mono-tech text-[11px] text-black/50 mt-1">
                Dibuat pada:{" "}
                {new Date(analysis.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={isSaving || savedSuccess}
                className={`px-4 py-2.5 font-mono-tech text-xs font-bold border transition-colors flex items-center gap-2 ${
                  savedSuccess
                    ? "bg-[#00D084] text-black border-black"
                    : "bg-[#EBEB00] text-black border-black hover:bg-black hover:text-[#EBEB00]"
                }`}
              >
                {savedSuccess ? (
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

              <Link
                href="/analisis/baru"
                className="px-4 py-2.5 bg-black text-white font-mono-tech text-xs font-bold border border-black hover:bg-[#003BFF] transition-colors flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Analisis Baru</span>
              </Link>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 font-mono-tech text-xs text-black/60">
            <Link href="/dashboard" className="hover:text-black flex items-center gap-1.5 font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <div className="flex items-center gap-1.5 text-[#003BFF]">
              <ShieldCheck className="w-4 h-4" />
              <span>Kalkulasi Deterministik SciPy + LLM Narrative Engine</span>
            </div>
          </div>
        </div>

        {/* 1. RINGKASAN ANGKA STATISTIK (FR-07 / 08 / 09 / 10) */}
        <div>
          <div className="font-mono-tech text-xs font-bold text-black/60 uppercase mb-2">
            BAGIAN 1 · RINGKASAN OUTPUT STATISTIK
          </div>
          <StatCards jenisAnalisis={analysis.jenis_analisis} hasil={analysis.hasil} />
        </div>

        {/* 2. VISUALISASI GRAFIK (FR-13) */}
        <div>
          <div className="font-mono-tech text-xs font-bold text-black/60 uppercase mb-2">
            BAGIAN 2 · VISUALISASI GRAFIK
          </div>
          <ChartVisualization visualisasi={analysis.visualisasi} />
        </div>

        {/* 3. NARASI INTERPRETASI AI (FR-11, FR-12) */}
        <div>
          <div className="font-mono-tech text-xs font-bold text-black/60 uppercase mb-2">
            BAGIAN 3 · NARASI INTERPRETATIF BERBASIS AI
          </div>
          <NarrativePanel
            status={analysis.status}
            narasi={analysis.narasi}
            onRegenerate={handleRegenerateNarrative}
            isRegenerating={isRegenerating}
          />
        </div>

        {/* 4. CONTOH KASUS & ANALOGI (FR-14) */}
        <div>
          <div className="font-mono-tech text-xs font-bold text-black/60 uppercase mb-2">
            BAGIAN 4 · CONTOH KASUS & ANALOGI NYATA
          </div>
          <CaseStudyPanel contohKasus={analysis.contoh_kasus} />
        </div>
      </main>
    </div>
  );
}
