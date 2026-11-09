"use client";

import React, { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api/analysesApi";
import type { AnalysisRecord, AnalysisType, DatasetSummary } from "@/lib/types/analysis";
import { Mascot } from "@/components/ui/Mascot";
import { DataStep } from "@/components/analysis/DataStep";
import { ConfigStep } from "@/components/analysis/ConfigStep";
import { ResultStep } from "@/components/analysis/ResultStep";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function WorkspaceAnalisisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const searchParams = useSearchParams();
  const preselectedJenis = searchParams.get("jenis") as AnalysisType | null;
  const urlStep = searchParams.get("step");

  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error404, setError404] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stepper: 1 DATA, 2 ANALISIS, 3 HASIL
  const [step, setStep] = useState<1 | 2 | 3>(
    urlStep === "2" ? 2 : urlStep === "3" ? 3 : 1
  );

  // Status proses aksi
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isRequestingNarrative, setIsRequestingNarrative] = useState(false);

  // Polling ref (2.5 detik)
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const fetchRecordRef = useRef<(isInitial?: boolean) => Promise<void>>(async () => {});

  const fetchRecord = useCallback(
    async (isInitial = false) => {
      try {
        const record = await api.getDetail(id);
        setAnalysis(record);

        // Jika status diproses, aktifkan polling 2.5s
        if (record.status === "diproses") {
          if (!pollingRef.current) {
            pollingRef.current = setInterval(() => {
              fetchRecordRef.current(false);
            }, 2500);
          }
        } else {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }

        // Penentuan step default saat pertama kali dibuka
        if (isInitial) {
          if (urlStep === "1" || urlStep === "2" || urlStep === "3") {
            setStep(Number(urlStep) as 1 | 2 | 3);
          } else {
            // Hanya jika analisis benar-benar berstatus selesai atau tersimpan di riwayat
            const hasilAny = record.hasil as any;
            const isFinishedOrSaved = Boolean(
              (record.status === "selesai" || record.disimpan) &&
              record.hasil &&
              (Array.isArray(hasilAny.ringkasan)
                ? hasilAny.ringkasan.length > 0
                : Object.keys(hasilAny).length > 0)
            );

            if (isFinishedOrSaved) {
              setStep(3);
            } else {
              // Analisis baru atau yang masih draf selalu mulai dari langkah 1 (01. DATA)
              setStep(1);
            }
          }
        }
      } catch (err: any) {
        if (err.status === 404 || err.message?.includes("404") || err.code === "NOT_FOUND") {
          setError404(true);
        } else {
          setErrorMsg(err.message || "Gagal memuat detail sesi analisis.");
        }
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [id, urlStep]
  );

  fetchRecordRef.current = fetchRecord;

  useEffect(() => {
    // Reset step ketika id sesi berubah
    if (urlStep === "1" || urlStep === "2" || urlStep === "3") {
      setStep(Number(urlStep) as 1 | 2 | 3);
    } else {
      setStep(1);
    }
    fetchRecord(true);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchRecord, id, urlStep]);

  // Handler Step 1: Simpan Dataset
  const handleSaveDataset = async (dataset: DatasetSummary, file?: File) => {
    try {
      const updated = await api.submitDataset(id, dataset, file);
      setAnalysis((prev) => ({
        ...(prev || {}),
        ...updated,
        dataset_input: updated.dataset_input || dataset,
      }));
    } catch (err: any) {
      alert("Gagal menyimpan dataset: " + (err.message || "Kesalahan server"));
    }
  };

  // Handler Step 2: Simpan Konfigurasi
  const handleSaveConfig = async (jenis: AnalysisType, config: any) => {
    try {
      const updated = await api.saveConfig(id, jenis, config);
      setAnalysis((prev) => ({
        ...(prev || {}),
        ...updated,
        dataset_input: updated.dataset_input || prev?.dataset_input,
      }));
    } catch (err: any) {
      alert("Gagal menyimpan konfigurasi: " + (err.message || "Kesalahan server"));
    }
  };

  // Handler Step 3: Jalankan Analisis (POST /run)
  const handleRun = async () => {
    setIsRunning(true);
    try {
      const updated = await api.run(id);
      setAnalysis(updated);

      // Aktifkan polling
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchRecord(false);
        }, 2500);
      }
    } catch (err: any) {
      alert("Gagal menjalankan analisis: " + (err.message || "Kesalahan kalkulasi"));
    } finally {
      setIsRunning(false);
    }
  };

  // Handler Step 3: Permintaan Narasi AI Baru / Ganti Bahasa
  const handleRequestNarrative = async (lang: "id" | "en") => {
    setIsRequestingNarrative(true);
    try {
      const updated = await api.requestNarrative(id, lang);
      setAnalysis(updated);

      // Aktifkan polling
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchRecord(false);
        }, 2500);
      }
    } catch (err: any) {
      alert("Gagal meminta narasi: " + (err.message || "Kesalahan server"));
    } finally {
      setIsRequestingNarrative(false);
    }
  };

  // Handler Step 3: Simpan ke Riwayat (FR-16)
  const handleSaveToHistory = async () => {
    setIsSaving(true);
    try {
      const updated = await api.saveToHistory(id);
      setAnalysis(updated);
    } catch (err: any) {
      alert("Gagal menyimpan ke riwayat: " + (err.message || "Kesalahan server"));
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // STATE: LOADING & ERROR 404
  // =========================================================================
  if (loading) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 border border-black bg-white text-center space-y-4 shadow-[6px_6px_0px_#000000]">
        <div className="w-10 h-10 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
        <div className="font-mono-tech text-xs font-bold uppercase tracking-wider text-black">
          MEMUAT RUANG KERJA ANALISIS...
        </div>
      </div>
    );
  }

  // 404: Analisis tidak ditemukan dengan Maskot Bingung (PRD Bagian 3 & 5)
  if (error404 || !analysis) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 border-2 border-black bg-white text-center space-y-6 shadow-[8px_8px_0px_#000000]">
        <div className="flex items-center justify-center gap-4">
          <Mascot character="sigi" pose="idle" face="ko" className="w-16 h-16" interactive />
          <Mascot character="mu" pose="cover" face="sad" className="w-16 h-16" interactive />
          <Mascot character="quin" pose="read" face="wow" className="w-16 h-16" interactive />
        </div>

        <div className="space-y-2">
          <div className="inline-block bg-[#FF2E2E] text-white px-3 py-1 font-mono-tech text-xs font-bold uppercase border border-black">
            KODE 404: ANALISIS TIDAK DITEMUKAN
          </div>
          <h2 className="font-display text-2xl font-normal text-black">
            Sesi Analisis Tidak Tersedia
          </h2>
          <p className="font-sans text-xs text-black/70 max-w-md mx-auto leading-relaxed">
            Sesi analisis dengan ID tersebut tidak ditemukan di repositori Anda atau milik pengguna lain. Periksa kembali tautan yang Anda tuju.
          </p>
        </div>

        <div>
          <Link
            href="/dasbor"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors shadow-[3px_3px_0px_#000000]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor</span>
          </Link>
        </div>
      </div>
    );
  }

  // Aturan FR-06: Terkunci bila status bukan 'draf' atau 'gagal'
  const isLocked = analysis.status !== "draf" && analysis.status !== "gagal";

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* =========================================================================
          BREADCRUMB & HEADER SESI
         ========================================================================= */}
      <div className="border border-black bg-white p-5 md:p-6 shadow-[4px_4px_0px_#000000] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/10">
          <Link
            href="/dasbor"
            className="font-mono-tech text-xs font-bold text-black/60 hover:text-black flex items-center gap-1.5 w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>KEMBALI KE DASBOR</span>
          </Link>

          <div className="flex items-center gap-2 font-mono-tech text-xs text-black/50">
            <span>ID SESI: #{analysis.id_analisis}</span>
            <span>·</span>
            <span>
              {new Date(analysis.tanggal).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono-tech text-[10px] uppercase font-bold px-2 py-0.5 bg-[#003BFF] text-white border border-black">
                {analysis.jenis_analisis.replace("_", " ")}
              </span>
              {isLocked && (
                <span className="font-mono-tech text-[10px] uppercase font-bold px-2 py-0.5 bg-black text-[#EBEB00] border border-black flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Terkunci</span>
                </span>
              )}
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-normal text-black">
              {analysis.nama_sesi}
            </h1>
          </div>

          {/* Jalur Status dengan Chip */}
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-xs font-bold text-black/60 uppercase">STATUS:</span>
            <span
              className={`font-mono-tech text-xs font-bold px-3 py-1 border border-black uppercase ${
                analysis.status === "selesai"
                  ? "bg-[#00D084] text-black"
                  : analysis.status === "diproses"
                  ? "bg-[#EBEB00] text-black flex items-center gap-1.5"
                  : analysis.status === "draf"
                  ? "bg-white text-black"
                  : "bg-[#FF2E2E] text-white"
              }`}
            >
              {analysis.status === "diproses" && (
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-2.5 bg-black animate-pulse" />
                  <span className="w-1.5 h-2.5 bg-black animate-pulse delay-75" />
                  <span className="w-1.5 h-2.5 bg-black animate-pulse delay-150" />
                </span>
              )}
              <span>{analysis.status}</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REL LANGKAH (STEPPER RELAY): 1 DATA, 2 ANALISIS, 3 HASIL
         ========================================================================= */}
      <div className="border border-black bg-white shadow-[4px_4px_0px_#000000]">
        <div className="grid grid-cols-3 divide-x divide-black text-center font-mono-tech text-xs font-bold">
          {/* LANGKAH 1 */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3.5 px-2 flex items-center justify-center gap-2 transition-colors ${
              step === 1
                ? "bg-black text-white"
                : step > 1
                ? "bg-[#00D084]/20 text-black hover:bg-[#00D084]/30"
                : "text-black/60 hover:bg-[#F4F4F4]"
            }`}
          >
            {isLocked && <Lock className="w-3.5 h-3.5" />}
            <span>01. DATA</span>
            {analysis.dataset_input && step !== 1 && <CheckCircle2 className="w-3.5 h-3.5 text-[#00D084]" />}
          </button>

          {/* LANGKAH 2 */}
          <button
            type="button"
            disabled={!analysis.dataset_input}
            onClick={() => setStep(2)}
            className={`py-3.5 px-2 flex items-center justify-center gap-2 transition-colors ${
              step === 2
                ? "bg-black text-white"
                : step > 2
                ? "bg-[#00D084]/20 text-black hover:bg-[#00D084]/30"
                : "text-black/60 hover:bg-[#F4F4F4] disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            {isLocked && <Lock className="w-3.5 h-3.5" />}
            <span>02. ANALISIS</span>
            {analysis.config_json && step !== 2 && <CheckCircle2 className="w-3.5 h-3.5 text-[#00D084]" />}
          </button>

          {/* LANGKAH 3 */}
          <button
            type="button"
            disabled={!analysis.dataset_input}
            onClick={() => setStep(3)}
            className={`py-3.5 px-2 flex items-center justify-center gap-2 transition-colors ${
              step === 3
                ? "bg-[#003BFF] text-white"
                : "text-black/70 hover:bg-[#EBEB00] disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            <span>03. HASIL</span>
            {analysis.hasil && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          KONTEN MASING-MASING LANGKAH
         ========================================================================= */}
      {step === 1 && (
        <DataStep
          initialDataset={analysis.dataset_input}
          isLocked={isLocked}
          onSaveDataset={handleSaveDataset}
          onProceedToConfig={() => setStep(2)}
          isLoading={loading}
        />
      )}

      {step === 2 && (
        analysis.dataset_input ? (
          <ConfigStep
            dataset={analysis.dataset_input}
            initialType={preselectedJenis || analysis.jenis_analisis}
            initialConfig={analysis.config_json}
            isLocked={isLocked}
            onSaveConfig={handleSaveConfig}
            onBack={() => setStep(1)}
            onProceedToRun={() => setStep(3)}
            isLoading={loading}
          />
        ) : (
          <div className="border border-black bg-white p-8 text-center space-y-4 shadow-[4px_4px_0px_#000000]">
            <p className="font-mono-tech text-xs text-black/70">
              Dataset belum dipilih. Silakan simpan dataset di Langkah 1 terlebih dahulu.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
            >
              Kembali ke Langkah 1: Data
            </button>
          </div>
        )
      )}

      {step === 3 && (
        <ResultStep
          analysis={analysis}
          isDemoMode={api.isDemoMode()}
          onRun={handleRun}
          onSaveToHistory={handleSaveToHistory}
          onRequestNarrative={handleRequestNarrative}
          isSaving={isSaving}
          isRunning={isRunning}
          isRequestingNarrative={isRequestingNarrative}
        />
      )}
    </div>
  );
}
