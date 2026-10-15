"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { ManualDataForm } from "@/components/analysis/ManualDataForm";
import { FileUploadForm } from "@/components/analysis/FileUploadForm";
import { AnalysisConfigForm } from "@/components/analysis/AnalysisConfigForm";
import { AnalysesApi } from "@/lib/api/analysesApi";
import type {
  AnalysisType,
  DatasetSummary,
  DescriptiveConfig,
  TTestConfig,
  CorrelationConfig,
  RegressionConfig,
} from "@/lib/types/analysis";
import { Table, Upload, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

export default function BaruAnalisisPage() {
  const router = useRouter();

  // Wizard Step: 1 = Input Data, 2 = Konfigurasi Analisis, 3 = Menjalankan / Polling
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [inputTab, setInputTab] = useState<"upload" | "manual">("upload");

  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | undefined>(undefined);

  // Status proses
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStepMsg, setProcessStepMsg] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDatasetReady = (data: DatasetSummary, file?: File) => {
    setDataset(data);
    setUploadedFile(file);
    setStep(2);
    setErrorMessage(null);
  };

  const handleRunAnalysis = async (
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ) => {
    if (!dataset) return;

    setIsProcessing(true);
    setStep(3);
    setErrorMessage(null);

    try {
      // 1. Buat sesi analisis (POST /analyses)
      setProcessStepMsg("1/4 Membuat sesi analisis di backend...");
      const sessionName = dataset.nama_dataset || "Analisis Baru";
      const created = await AnalysesApi.create(sessionName);
      const id = created.id_analisis;

      // 2. Kirim dataset (POST /analyses/{id}/dataset)
      setProcessStepMsg("2/4 Mengirim dataset dan memvalidasi struktur kolom...");
      await AnalysesApi.submitDataset(id, dataset, uploadedFile);

      // 3. Simpan konfigurasi (PUT /analyses/{id}/config)
      setProcessStepMsg("3/4 Menyimpan konfigurasi variabel analisis...");
      await AnalysesApi.saveConfig(id, jenis, config);

      // 4. Jalankan perhitungan (POST /analyses/{id}/run)
      setProcessStepMsg("4/4 Menjalankan perhitungan statistik & menjadwalkan AI...");
      const runRes = await AnalysesApi.run(id);

      // 5. Polling jika status masih 'diproses' (HTTP 202)
      if (runRes.status === "diproses") {
        setProcessStepMsg("AI Orchestrator sedang memproses narasi (polling status)...");
        let attempts = 0;
        const maxAttempts = 20; // 20 x 2.5s = 50 detik

        const pollInterval = setInterval(async () => {
          attempts++;
          try {
            const check = await AnalysesApi.getResult(id);
            if (
              check.status === "selesai" ||
              check.status === "narasi_gagal" ||
              check.status === "gagal" ||
              attempts >= maxAttempts
            ) {
              clearInterval(pollInterval);
              router.push(`/analisis/${id}`);
            }
          } catch {
            clearInterval(pollInterval);
            router.push(`/analisis/${id}`);
          }
        }, 2500);
      } else {
        router.push(`/analisis/${id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal menjalankan analisis.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      <AppNavbar />

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Wizard Step Breadcrumb */}
        <div className="border border-black bg-white p-4">
          <div className="grid grid-cols-3 divide-x divide-black text-center font-mono-tech text-xs font-bold">
            <div
              className={`py-1.5 ${
                step === 1 ? "bg-black text-white" : step > 1 ? "bg-[#00D084] text-black" : "text-black/40"
              }`}
            >
              01. INPUT DATA
            </div>
            <div
              className={`py-1.5 ${
                step === 2 ? "bg-black text-white" : step > 2 ? "bg-[#00D084] text-black" : "text-black/40"
              }`}
            >
              02. PILIH ANALISIS & VARIABEL
            </div>
            <div
              className={`py-1.5 ${
                step === 3 ? "bg-[#003BFF] text-white" : "text-black/40"
              }`}
            >
              03. PEMROSESAN STATISTIK & AI
            </div>
          </div>
        </div>

        {/* LANGKAH 1: INPUT DATA */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex border border-black bg-white divide-x divide-black font-mono-tech text-xs font-bold w-fit">
              <button
                type="button"
                onClick={() => setInputTab("upload")}
                className={`px-5 py-2.5 flex items-center gap-2 transition-colors ${
                  inputTab === "upload" ? "bg-black text-white" : "hover:bg-[#EBEB00]"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File (CSV / Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab("manual")}
                className={`px-5 py-2.5 flex items-center gap-2 transition-colors ${
                  inputTab === "manual" ? "bg-black text-white" : "hover:bg-[#EBEB00]"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Input Manual (Tabel / Siap Pakai)</span>
              </button>
            </div>

            {inputTab === "upload" ? (
              <FileUploadForm onDatasetReady={handleDatasetReady} />
            ) : (
              <ManualDataForm onDatasetReady={handleDatasetReady} />
            )}
          </div>
        )}

        {/* LANGKAH 2: KONFIGURASI ANALISIS */}
        {step === 2 && dataset && (
          <AnalysisConfigForm
            dataset={dataset}
            onRun={handleRunAnalysis}
            onBack={() => setStep(1)}
            isLoading={isProcessing}
          />
        )}

        {/* LANGKAH 3: PEMROSESAN / POLLING */}
        {step === 3 && (
          <div className="border border-black bg-white p-8 md:p-14 text-center space-y-6">
            <div className="w-14 h-14 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />

            <div>
              <h2 className="font-display text-2xl font-normal text-black">
                Memproses Analisis Statistik & AI
              </h2>
              <p className="font-mono-tech text-xs text-black/60 mt-2">{processStepMsg}</p>
            </div>

            {errorMessage && (
              <div className="border border-[#FF2E2E] bg-[#FF2E2E]/10 p-4 font-mono-tech text-xs text-[#C40000] max-w-lg mx-auto flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {errorMessage && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
              >
                Kembali ke Konfigurasi
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
