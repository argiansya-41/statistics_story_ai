"use client";

import React, { useState } from "react";
import { Mascot } from "@/components/ui/Mascot";
import { parseCSVText, parseUploadedFile, analyzeColumns } from "@/lib/api/fileParser";
import { api } from "@/lib/api/analysesApi";
import type { DatasetSummary, AnalysisType } from "@/lib/types/analysis";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Image as ImageIcon,
  Sparkles,
  Loader2,
} from "lucide-react";

interface DataStepProps {
  initialDataset?: DatasetSummary;
  isLocked: boolean;
  onSaveDataset: (dataset: DatasetSummary, file?: File) => Promise<void>;
  onProceedToConfig: () => void;
  isLoading: boolean;
}

export const DataStep: React.FC<DataStepProps> = ({
  initialDataset,
  isLocked,
  onSaveDataset,
  onProceedToConfig,
  isLoading,
}) => {
  // Mode input: 'mentah' (FR-02, FR-03, FR-04) atau 'siap_pakai' (FR-02)
  const [sourceMode, setSourceMode] = useState<"mentah" | "siap_pakai">(
    initialDataset?.sumber_input === "siap_pakai" ? "siap_pakai" : "mentah"
  );

  // Tab di dalam data mentah: 'unggah' vs 'gambar' vs 'ketik'
  const [rawTab, setRawTab] = useState<"ketik" | "unggah" | "gambar">("unggah");

  // State Ketik / Tempel
  const [pastedText, setPastedText] = useState("");
  const [pastedDatasetName, setPastedDatasetName] = useState("Dataset Tempel");

  // State Unggah Berkas & Ekstraksi Gambar
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorCode, setUploadErrorCode] = useState<number | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isExtractingImage, setIsExtractingImage] = useState(false);

  // State Ringkasan Data (Tersimpan atau Baru di-parse)
  const [currentSummary, setCurrentSummary] = useState<DatasetSummary | null>(initialDataset || null);

  // State Validasi 422
  const [validationError, setValidationError] = useState<{
    message: string;
    fields: string[];
  } | null>(null);

  // State Statistik Siap Pakai
  const [readyType, setReadyType] = useState<AnalysisType>("deskriptif");
  const [readyValues, setReadyValues] = useState<Record<string, any>>({
    // deskriptif
    kolom: "nilai_ujian",
    n: 30,
    mean: 78.5,
    median: 79.0,
    sd: 8.25,
    min: 55.0,
    max: 95.0,
    // uji_t
    t: 2.45,
    df: 28.5,
    p_ttest: 0.021,
    grup1_nama: "Kelas A",
    grup1_mean: 82.4,
    grup1_n: 15,
    grup1_sd: 6.2,
    grup2_nama: "Kelas B",
    grup2_mean: 76.1,
    grup2_n: 15,
    grup2_sd: 7.1,
    // korelasi
    var_x: "jam_belajar",
    var_y: "nilai_ujian",
    r: 0.76,
    p_corr: 0.0001,
    n_corr: 30,
    // regresi
    reg_x: "jam_belajar",
    reg_y: "nilai_ujian",
    b: 3.42,
    a: 52.1,
    r2: 0.58,
    p_reg: 0.0001,
    n_reg: 30,
  });

  // ========== Handler Contoh Data ==========
  const loadExampleTTest = () => {
    const csv = `kelas,nilai
Kelas_A,78
Kelas_A,82
Kelas_A,69
Kelas_A,91
Kelas_A,85
Kelas_A,74
Kelas_A,88
Kelas_A,79
Kelas_A,83
Kelas_A,76
Kelas_B,72
Kelas_B,65
Kelas_B,80
Kelas_B,70
Kelas_B,68
Kelas_B,77
Kelas_B,74
Kelas_B,66
Kelas_B,71
Kelas_B,69`;
    setPastedText(csv);
    setPastedDatasetName("Contoh Uji t (Dua Kelas)");
    setRawTab("ketik");
    setValidationError(null);
  };

  const loadExampleRegression = () => {
    const csv = `jam_belajar,nilai
1,52
2,55
3,61
4,60
5,68
6,72
7,70
8,78
9,83
10,88`;
    setPastedText(csv);
    setPastedDatasetName("Contoh Korelasi & Regresi");
    setRawTab("ketik");
    setValidationError(null);
  };

  // ========== Parsing Teks Tempel ==========
  const handleParsePasted = async () => {
    setValidationError(null);
    if (!pastedText.trim()) {
      setValidationError({
        message: "Area teks data mentah tidak boleh kosong.",
        fields: ["teks_data"],
      });
      return;
    }

    try {
      // Auto-detect koma, titik koma, atau tab
      const { headers, rows } = parseCSVText(pastedText);
      if (rows.length < 2) {
        throw new Error("Data mentah harus memiliki minimal 2 baris observasi");
      }

      // Hitung sel kosong
      let emptyCount = 0;
      rows.forEach((r) => {
        headers.forEach((h) => {
          if (r[h] === "" || r[h] === undefined || r[h] === null) emptyCount++;
        });
      });

      const colInfo = analyzeColumns(headers, rows);

      const summary: DatasetSummary = {
        nama_dataset: pastedDatasetName.trim() || "Dataset Tempel",
        format_data: "manual",
        sumber_input: "mentah",
        total_baris: rows.length,
        total_kolom: headers.length,
        kolom: headers,
        kolom_info: colInfo,
        preview_baris: rows.slice(0, 8),
        data_mentah: rows,
      };

      setCurrentSummary(summary);
      await onSaveDataset(summary);
    } catch (err: any) {
      setValidationError({
        message: err.message || "Gagal memproses data teks tempel",
        fields: ["struktur_kolom"],
      });
    }
  };

  // ========== Handler Unggah Berkas & Ekstraksi Gambar ==========
  const handleFileProcess = async (file: File) => {
    setUploadError(null);
    setUploadErrorCode(null);
    setUploadSuccess(false);
    setValidationError(null);

    // 1. Ekstensi & Tipe
    const name = file.name.toLowerCase();
    const isSpreadsheet = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    const isImage =
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp") ||
      file.type.startsWith("image/");

    if (!isSpreadsheet && !isImage) {
      setUploadError(
        "Format berkas tidak didukung. Harap gunakan file CSV, Excel (.xlsx, .xls), atau Gambar (.png, .jpg, .jpeg, .webp)."
      );
      setUploadErrorCode(415);
      return;
    }

    // 2. Ukuran (maks 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(`Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(2)} MB) melebihi batas 10 MB.`);
      setUploadErrorCode(413);
      return;
    }

    setSelectedFile(file);

    // 3. Jika berkas adalah Gambar, ekstraksi tabel via AI Vision
    if (isImage) {
      setIsExtractingImage(true);
      try {
        const summary = await api.extractImage(file);
        summary.preview_baris = (summary.data_mentah || []).slice(0, 8);
        setCurrentSummary(summary);
        setUploadSuccess(true);
        await onSaveDataset(summary, file);
      } catch (err: any) {
        setUploadError(
          err.message ||
            "Gagal mengekstrak tabel data dari gambar. Pastikan gambar memuat baris & kolom data yang terbaca jelas."
        );
        setUploadErrorCode(422);
        setValidationError({
          message: err.message || "Tabel dalam gambar tidak dapat diekstrak oleh AI Vision",
          fields: ["format_berkas"],
        });
      } finally {
        setIsExtractingImage(false);
      }
      return;
    }

    // 4. Jika berkas adalah CSV atau Excel
    try {
      const summary = await parseUploadedFile(file);

      // Hitung sel kosong
      let emptyCount = 0;
      const rows = summary.data_mentah || [];
      rows.forEach((r) => {
        summary.kolom.forEach((h) => {
          if (r[h] === "" || r[h] === undefined || r[h] === null) emptyCount++;
        });
      });

      // Preview 8 baris
      summary.preview_baris = rows.slice(0, 8);
      setCurrentSummary(summary);
      setUploadSuccess(true);
      await onSaveDataset(summary, file);
    } catch (err: any) {
      setUploadError(err.message || "Gagal memproses berkas unggahan");
      setUploadErrorCode(422);
      setValidationError({
        message: err.message || "Struktur berkas tidak valid",
        fields: ["format_berkas"],
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // ========== Handler Statistik Siap Pakai ==========
  const handleReadyFieldChange = (key: string, val: any) => {
    setReadyValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveReadyMade = async () => {
    setValidationError(null);
    const errFields: string[] = [];

    let payload: Record<string, any> = {};

    if (readyType === "deskriptif") {
      const n = Number(readyValues.n);
      const mean = Number(readyValues.mean);
      const med = Number(readyValues.median);
      const sd = Number(readyValues.sd);
      const min = Number(readyValues.min);
      const max = Number(readyValues.max);

      if (isNaN(n) || n < 2 || !Number.isInteger(n)) errFields.push("n (minimal 2)");
      if (isNaN(sd) || sd < 0) errFields.push("Standar deviasi (>= 0)");
      if (isNaN(min) || isNaN(max) || min > max) errFields.push("Rentang Min-Max");

      if (errFields.length > 0) {
        setValidationError({
          message: "Validasi statistik siap pakai gagal pada beberapa field.",
          fields: errFields,
        });
        return;
      }

      payload = {
        jenis: "deskriptif",
        ringkasan: [
          {
            kolom: readyValues.kolom || "skor",
            mean,
            median: med,
            modus: [med],
            standar_deviasi: sd,
            min,
            max,
            n,
          },
        ],
      };
    } else if (readyType === "uji_t") {
      const t = Number(readyValues.t);
      const df = Number(readyValues.df);
      const p = Number(readyValues.p_ttest);
      const m1 = Number(readyValues.grup1_mean);
      const n1 = Number(readyValues.grup1_n);
      const m2 = Number(readyValues.grup2_mean);
      const n2 = Number(readyValues.grup2_n);

      if (isNaN(t)) errFields.push("Nilai t");
      if (isNaN(df) || df <= 0) errFields.push("Derajat kebebasan df (> 0)");
      if (isNaN(p) || p < 0 || p > 1) errFields.push("p-value (rentang 0 sampai 1)");
      if (isNaN(n1) || n1 < 2 || isNaN(n2) || n2 < 2) errFields.push("n per kelompok (min 2)");

      if (errFields.length > 0) {
        setValidationError({
          message: "Validasi rentang Uji t siap pakai belum valid.",
          fields: errFields,
        });
        return;
      }

      payload = {
        t,
        df,
        p_value: p,
        signifikan: p < 0.05,
        alpha: 0.05,
        perbedaan_mean: Number((m1 - m2).toFixed(4)),
        kelompok_1: {
          nama: readyValues.grup1_nama || "Kelompok A",
          mean: m1,
          sd: Number(readyValues.grup1_sd) || 1,
          n: n1,
        },
        kelompok_2: {
          nama: readyValues.grup2_nama || "Kelompok B",
          mean: m2,
          sd: Number(readyValues.grup2_sd) || 1,
          n: n2,
        },
      };
    } else if (readyType === "korelasi") {
      const r = Number(readyValues.r);
      const p = Number(readyValues.p_corr);
      const n = Number(readyValues.n_corr);

      if (isNaN(r) || r < -1 || r > 1) errFields.push("Koefisien r (rentang -1 sampai 1)");
      if (isNaN(p) || p < 0 || p > 1) errFields.push("p-value (rentang 0 sampai 1)");
      if (isNaN(n) || n < 3 || !Number.isInteger(n)) errFields.push("n (minimal 3 pasang)");

      if (errFields.length > 0) {
        setValidationError({
          message: "Validasi rentang Korelasi siap pakai belum valid.",
          fields: errFields,
        });
        return;
      }

      payload = {
        r,
        p_value: p,
        n,
        arah: r > 0 ? "positif" : r < 0 ? "negatif" : "tidak_ada",
        kekuatan: Math.abs(r) >= 0.7 ? "Kuat" : Math.abs(r) >= 0.4 ? "Sedang" : "Lemah",
        variabel_x: readyValues.var_x || "X",
        variabel_y: readyValues.var_y || "Y",
      };
    } else if (readyType === "regresi") {
      const b = Number(readyValues.b);
      const a = Number(readyValues.a);
      const r2 = Number(readyValues.r2);
      const p = Number(readyValues.p_reg);
      const n = Number(readyValues.n_reg);

      if (isNaN(b)) errFields.push("Koefisien slope b");
      if (isNaN(a)) errFields.push("Konstanta a");
      if (isNaN(r2) || r2 < 0 || r2 > 1) errFields.push("R² (rentang 0 sampai 1)");
      if (isNaN(p) || p < 0 || p > 1) errFields.push("p-value (rentang 0 sampai 1)");
      if (isNaN(n) || n < 3 || !Number.isInteger(n)) errFields.push("n (minimal 3)");

      if (errFields.length > 0) {
        setValidationError({
          message: "Validasi rentang Regresi siap pakai belum valid.",
          fields: errFields,
        });
        return;
      }

      payload = {
        koefisien: b,
        intercept: a,
        r_squared: r2,
        p_value: p,
        n,
        persamaan: `Y = ${a} + ${b}X`,
        variabel_x: readyValues.reg_x || "X",
        variabel_y: readyValues.reg_y || "Y",
      };
    }

    const summary: DatasetSummary = {
      nama_dataset: `Statistik Siap Pakai (${readyType})`,
      format_data: "json",
      sumber_input: "siap_pakai",
      total_baris: 1,
      total_kolom: 1,
      kolom: [readyType],
      preview_baris: [{ info: "Output Statistik Siap Pakai Terverifikasi" }],
      data_siap_pakai: payload,
    };

    setCurrentSummary(summary);
    await onSaveDataset(summary);
  };

  // Hitung jumlah sel kosong untuk ringkasan
  const calculateEmptyCells = () => {
    if (!currentSummary || !currentSummary.data_mentah) return 0;
    let count = 0;
    currentSummary.data_mentah.forEach((row) => {
      currentSummary.kolom.forEach((col) => {
        if (row[col] === "" || row[col] === null || row[col] === undefined) {
          count++;
        }
      });
    });
    return count;
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          BANNER 409 JIKA DATA & KONFIGURASI TERKUNCI (FR-06)
         ========================================================================= */}
      {isLocked && (
        <div className="border-2 border-black bg-[#EFEFEF] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono-tech text-xs shadow-[4px_4px_0px_#000000]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#EBEB00]" />
            </div>
            <div>
              <div className="font-bold text-black uppercase">DATA & KONFIGURASI TERKUNCI (STATUS: SELESAI / DIPROSES)</div>
              <div className="text-black/70 font-sans text-xs mt-0.5">
                Data dan variabel tidak dapat diubah setelah analisis dijalankan.
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

      {/* =========================================================================
          PANEL GALAT 422: QUIN BERPIKIR DENGAN DAFTAR NAMA KOLOM BERMASALAH (FR-05)
         ========================================================================= */}
      {validationError && (
        <div
          role="alert"
          aria-live="polite"
          className="border-2 border-[#FF2E2E] bg-white p-5 shadow-[6px_6px_0px_#FF2E2E] flex flex-col md:flex-row items-start gap-4"
        >
          <Mascot character="quin" pose="read" face="think" className="w-16 h-16 shrink-0" interactive />
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FF2E2E] inline-block" />
              <span className="font-mono-tech text-xs font-bold text-[#C40000] uppercase tracking-wider">
                GALAT STRUKTUR DATA (422 VALIDATION ERROR)
              </span>
            </div>
            <p className="font-sans text-sm text-black/80">{validationError.message}</p>
            {validationError.fields.length > 0 && (
              <div className="pt-2">
                <span className="font-mono-tech text-[10px] text-black/60 uppercase font-bold block mb-1">
                  KOLOM / FIELD BERMASALAH:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {validationError.fields.map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-[#FF2E2E]/15 border border-[#FF2E2E] font-mono-tech text-xs font-bold text-[#C40000]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          DUA KARTU BESAR: DATA MENTAH & STATISTIK SIAP PAKAI (FR-02)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KARTU 1: DATA MENTAH */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => setSourceMode("mentah")}
          className={`p-6 border-2 text-left transition-all relative flex flex-col justify-between ${
            sourceMode === "mentah"
              ? "border-black bg-white shadow-[6px_6px_0px_#003BFF]"
              : "border-black/30 bg-white/60 hover:bg-white hover:border-black shadow-[3px_3px_0px_#000000]"
          } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 border border-black bg-[#003BFF] text-white flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              {sourceMode === "mentah" && (
                <span className="font-mono-tech text-[10px] font-bold uppercase px-2 py-0.5 bg-[#003BFF] text-white">
                  MODE TERPILIH
                </span>
              )}
            </div>
            <h3 className="font-mono-tech text-sm font-bold text-black uppercase">
              1. DATA MENTAH (RAW DATASET)
            </h3>
            <p className="font-sans text-xs text-black/70 leading-relaxed">
              Ketik, tempel tabel, atau unggah file CSV / Excel (.xlsx, .xls) serta gambar tabel (.png, .jpg). Sistem akan mengekstrak tabel dan memeriksa tipe data numerik secara otomatis.
            </p>
          </div>
          <div className="font-mono-tech text-[10px] text-black/50 border-t border-black/10 pt-2 mt-4">
            Maks. 10 MB · CSV / Excel & Ekstraksi Gambar AI Vision Otomatis
          </div>
        </button>

        {/* KARTU 2: STATISTIK SIAP PAKAI */}
        <button
          type="button"
          disabled={isLocked}
          onClick={() => setSourceMode("siap_pakai")}
          className={`p-6 border-2 text-left transition-all relative flex flex-col justify-between ${
            sourceMode === "siap_pakai"
              ? "border-black bg-white shadow-[6px_6px_0px_#003BFF]"
              : "border-black/30 bg-white/60 hover:bg-white hover:border-black shadow-[3px_3px_0px_#000000]"
          } ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 border border-black bg-[#EBEB00] text-black flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              {sourceMode === "siap_pakai" && (
                <span className="font-mono-tech text-[10px] font-bold uppercase px-2 py-0.5 bg-[#003BFF] text-white">
                  MODE TERPILIH
                </span>
              )}
            </div>
            <h3 className="font-mono-tech text-sm font-bold text-black uppercase">
              2. STATISTIK SIAP PAKAI (READY STATS)
            </h3>
            <p className="font-sans text-xs text-black/70 leading-relaxed">
              Sudah memiliki angka hasil hitung dari SPSS atau kalkulator? Masukkan nilai mean, t, r, atau slope secara langsung untuk dibuatkan narasi akademis AI.
            </p>
          </div>
          <div className="font-mono-tech text-[10px] text-black/50 border-t border-black/10 pt-2 mt-4">
            Langsung Dinarasikan · Validasi Rentang Nilai Ketat
          </div>
        </button>
      </div>

      {/* =========================================================================
          AREA KONTEN SESUAI MODE YANG DIPILIH
         ========================================================================= */}
      {!isLocked && sourceMode === "mentah" && (
        <div className="border border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-6">
          {/* Tiga Tab: Unggah Berkas, Unggah Gambar Tabel (AI Vision), & Ketik/Tempel */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-4">
            <div className="flex flex-wrap border border-black bg-[#F4F4F4] divide-x divide-black font-mono-tech text-xs font-bold">
              <button
                type="button"
                onClick={() => setRawTab("unggah")}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  rawTab === "unggah" ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Berkas (CSV / Excel)</span>
              </button>
              <button
                type="button"
                onClick={() => setRawTab("gambar")}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  rawTab === "gambar" ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#003BFF]" />
                <span className="flex items-center gap-1">
                  <span>Upload Gambar Tabel</span>
                  <span className="bg-[#EBEB00] text-black text-[9px] px-1 py-0.2 border border-black">AI VISION</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setRawTab("ketik")}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  rawTab === "ketik" ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ketik / Tempel Data</span>
              </button>
            </div>

            {/* Tombol Contoh Data */}
            <div className="flex items-center gap-2 font-mono-tech text-xs">
              <span className="text-black/60 font-bold hidden sm:inline">CONTOH CEPAT:</span>
              <button
                type="button"
                onClick={loadExampleTTest}
                className="px-2.5 py-1 border border-black bg-white hover:bg-[#EBEB00] transition-colors font-bold text-[11px]"
              >
                + Nilai Dua Kelas (Uji t)
              </button>
              <button
                type="button"
                onClick={loadExampleRegression}
                className="px-2.5 py-1 border border-black bg-white hover:bg-[#EBEB00] transition-colors font-bold text-[11px]"
              >
                + Jam Belajar & Nilai (Regresi)
              </button>
            </div>
          </div>

          {/* TAB 1: UNGGAH BERKAS CSV / EXCEL (JUGA BISA MENERIMA GAMBAR) */}
          {rawTab === "unggah" && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-8 md:p-12 text-center transition-all ${
                  dragActive
                    ? "border-[#003BFF] bg-[#003BFF]/10 scale-[1.01]"
                    : uploadErrorCode
                    ? "border-[#FF2E2E] bg-[#FF2E2E]/5"
                    : isExtractingImage
                    ? "border-[#003BFF] bg-[#003BFF]/5 animate-pulse"
                    : "border-black bg-[#FBFBFB] hover:bg-white"
                }`}
              >
                {/* Maskot Reaktif */}
                <div className="mb-4">
                  {isExtractingImage ? (
                    <Mascot character="sigi" pose="charge" face="wow" className="w-16 h-16 mx-auto animate-bounce" interactive />
                  ) : dragActive ? (
                    <Mascot character="sigi" pose="charge" face="wow" className="w-16 h-16 mx-auto animate-bounce" interactive />
                  ) : uploadErrorCode === 413 || uploadErrorCode === 415 ? (
                    <Mascot character="mu" pose="cover" face="hurt" className="w-16 h-16 mx-auto" interactive />
                  ) : uploadSuccess ? (
                    <Mascot character="sigi" pose="cheer" face="happy" className="w-16 h-16 mx-auto" interactive />
                  ) : (
                    <Mascot character="sigi" pose="idle" face="smile" className="w-16 h-16 mx-auto" interactive />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="font-mono-tech text-sm font-bold text-black uppercase">
                    {isExtractingImage
                      ? "AI Vision Sedang Mengekstrak Data Tabel dari Berkas..."
                      : dragActive
                      ? "Lepaskan berkas di sini sekarang!"
                      : uploadSuccess
                      ? `Berkas "${selectedFile?.name}" Berhasil Dibaca!`
                      : "Tarik & Lepas Berkas CSV, Excel, atau Gambar di Sini"}
                  </div>
                  <p className="font-sans text-xs text-black/60 max-w-md mx-auto">
                    {isExtractingImage
                      ? "Harap tunggu sejenak, model AI Vision sedang mendeteksi baris, kolom, dan angka secara otomatis."
                      : "Mendukung format .CSV, .XLSX, .XLS, serta Gambar (.PNG, .JPG, .JPEG, .WEBP) hingga 10 MB."}
                  </p>
                </div>

                {!isExtractingImage && (
                  <div className="mt-5">
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-mono-tech text-xs font-bold border border-black hover:bg-[#003BFF] transition-colors cursor-pointer shadow-[3px_3px_0px_#000000]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih Berkas dari Komputer</span>
                      <input
                        type="file"
                        accept=".csv, .xlsx, .xls, .png, .jpg, .jpeg, .webp, image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileProcess(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {isExtractingImage && (
                  <div className="mt-5 flex items-center justify-center gap-2 font-mono-tech text-xs text-[#003BFF] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses OCR & Ekstraksi Multimodal...</span>
                  </div>
                )}

                {/* Pesan Kesalahan */}
                {uploadError && (
                  <div className="mt-4 border border-[#FF2E2E] bg-[#FF2E2E]/10 p-3 font-mono-tech text-xs text-[#C40000] inline-flex items-center gap-2 max-w-lg mx-auto">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UNGGAH GAMBAR TABEL (AI VISION) */}
          {rawTab === "gambar" && (
            <div className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-8 md:p-12 text-center transition-all ${
                  dragActive
                    ? "border-[#003BFF] bg-[#003BFF]/10 scale-[1.01]"
                    : uploadErrorCode
                    ? "border-[#FF2E2E] bg-[#FF2E2E]/5"
                    : isExtractingImage
                    ? "border-[#003BFF] bg-[#003BFF]/5 animate-pulse"
                    : "border-black bg-[#FBFBFB] hover:bg-white"
                }`}
              >
                {/* Maskot Reaktif */}
                <div className="mb-4">
                  {isExtractingImage ? (
                    <Mascot character="sigi" pose="charge" face="wow" className="w-16 h-16 mx-auto animate-bounce" interactive />
                  ) : dragActive ? (
                    <Mascot character="sigi" pose="charge" face="wow" className="w-16 h-16 mx-auto animate-bounce" interactive />
                  ) : uploadErrorCode === 413 || uploadErrorCode === 415 ? (
                    <Mascot character="mu" pose="cover" face="hurt" className="w-16 h-16 mx-auto" interactive />
                  ) : uploadSuccess && currentSummary?.format_data === "image" ? (
                    <Mascot character="sigi" pose="cheer" face="happy" className="w-16 h-16 mx-auto" interactive />
                  ) : (
                    <Mascot character="sigi" pose="idle" face="smile" className="w-16 h-16 mx-auto" interactive />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBEB00] border border-black font-mono-tech text-[10px] font-bold uppercase mb-1">
                    <Sparkles className="w-3 h-3 text-[#003BFF]" />
                    <span>EKSTRAKSI TABEL OTOMATIS BERBASIS AI VISION</span>
                  </div>
                  <div className="font-mono-tech text-sm font-bold text-black uppercase">
                    {isExtractingImage
                      ? "AI Vision Sedang Mengekstrak Data Tabel dari Gambar..."
                      : dragActive
                      ? "Lepaskan gambar tabel di sini!"
                      : uploadSuccess && currentSummary?.format_data === "image"
                      ? `Tabel dari Gambar "${selectedFile?.name}" Berhasil Diekstrak!`
                      : "Tarik & Lepas Foto atau Screenshot Tabel di Sini"}
                  </div>
                  <p className="font-sans text-xs text-black/60 max-w-lg mx-auto">
                    {isExtractingImage
                      ? "Menganalisis orientasi baris, mengenali header kolom, dan mengubah sel angka menjadi format numerik terstruktur..."
                      : "Unggah foto hasil cetak, tangkapan layar (screenshot), atau gambar tabel dokumen (.png, .jpg, .jpeg, .webp). AI akan mengubahnya menjadi dataset siap olah."}
                  </p>
                </div>

                {!isExtractingImage && (
                  <div className="mt-5">
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003BFF] text-white font-mono-tech text-xs font-bold border border-black hover:bg-black transition-colors cursor-pointer shadow-[3px_3px_0px_#000000]">
                      <ImageIcon className="w-4 h-4 text-[#EBEB00]" />
                      <span>Pilih Gambar Tabel dari Komputer</span>
                      <input
                        type="file"
                        accept=".png, .jpg, .jpeg, .webp, image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileProcess(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {isExtractingImage && (
                  <div className="mt-5 flex items-center justify-center gap-2 font-mono-tech text-xs text-[#003BFF] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Vision sedang membaca tabel & mengonversi angka...</span>
                  </div>
                )}

                {/* Pesan Kesalahan */}
                {uploadError && (
                  <div className="mt-4 border border-[#FF2E2E] bg-[#FF2E2E]/10 p-3 font-mono-tech text-xs text-[#C40000] inline-flex items-center gap-2 max-w-lg mx-auto">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB KETIK / TEMPEL TEKS */}
          {rawTab === "ketik" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                    NAMA DATASET:
                  </label>
                  <input
                    type="text"
                    value={pastedDatasetName}
                    onChange={(e) => setPastedDatasetName(e.target.value)}
                    className="w-full sm:w-80 px-3 py-1.5 border border-black font-mono-tech text-xs focus:outline-none"
                  />
                </div>
                <div className="font-mono-tech text-[11px] text-black/50">
                  Baris pertama otomatis dianggap sebagai judul kolom (header).
                </div>
              </div>

              <div>
                <label className="block font-mono-tech text-xs font-bold uppercase mb-1">
                  AREA TEMPEL TABEL / CSV:
                </label>
                <textarea
                  rows={9}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Contoh:\njam_belajar,nilai_ujian\n2,65\n4,75\n6,85\n8,95`}
                  className="w-full p-4 border border-black font-mono-tech text-xs bg-[#FBFBFB] focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleParsePasted}
                  className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#EBEB00]" />
                  <span>Proses & Simpan Data Tempel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE STATISTIK SIAP PAKAI DENGAN FORMULIR SPESIFIK & VALIDASI RENTANG
         ========================================================================= */}
      {!isLocked && sourceMode === "siap_pakai" && (
        <div className="border border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-6">
          <div className="flex items-center gap-2 border-b border-black pb-4">
            <span className="font-mono-tech text-xs font-bold text-black uppercase">
              PILIH JENIS OUTPUT STATISTIK SIAP PAKAI:
            </span>
            <div className="flex border border-black bg-[#F4F4F4] divide-x divide-black font-mono-tech text-xs font-bold">
              {(["deskriptif", "uji_t", "korelasi", "regresi"] as AnalysisType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setReadyType(t)}
                  className={`px-3 py-1.5 transition-colors uppercase ${
                    readyType === t ? "bg-black text-white" : "hover:bg-[#EBEB00] text-black"
                  }`}
                >
                  {t.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Form Bidang Sesuai Jenis Terpilih */}
          <div className="space-y-4">
            {readyType === "deskriptif" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono-tech text-xs">
                <div>
                  <label className="block font-bold mb-1">NAMA VARIABEL</label>
                  <input
                    type="text"
                    value={readyValues.kolom}
                    onChange={(e) => handleReadyFieldChange("kolom", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">JUMLAH DATA (N ≥ 2)</label>
                  <input
                    type="number"
                    value={readyValues.n}
                    onChange={(e) => handleReadyFieldChange("n", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">RATA-RATA (MEAN)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={readyValues.mean}
                    onChange={(e) => handleReadyFieldChange("mean", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">MEDIAN</label>
                  <input
                    type="number"
                    step="0.01"
                    value={readyValues.median}
                    onChange={(e) => handleReadyFieldChange("median", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">STANDAR DEVIASI (SD ≥ 0)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={readyValues.sd}
                    onChange={(e) => handleReadyFieldChange("sd", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold mb-1">MIN</label>
                    <input
                      type="number"
                      step="0.01"
                      value={readyValues.min}
                      onChange={(e) => handleReadyFieldChange("min", e.target.value)}
                      className="w-full p-2 border border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">MAX</label>
                    <input
                      type="number"
                      step="0.01"
                      value={readyValues.max}
                      onChange={(e) => handleReadyFieldChange("max", e.target.value)}
                      className="w-full p-2 border border-black"
                    />
                  </div>
                </div>
              </div>
            )}

            {readyType === "uji_t" && (
              <div className="space-y-4 font-mono-tech text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1">NILAI T (STATISTIK)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={readyValues.t}
                      onChange={(e) => handleReadyFieldChange("t", e.target.value)}
                      className="w-full p-2 border border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">DERAJAT KEBEBASAN (DF &gt; 0)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={readyValues.df}
                      onChange={(e) => handleReadyFieldChange("df", e.target.value)}
                      className="w-full p-2 border border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">P-VALUE (0 S.D. 1)</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      max="1"
                      value={readyValues.p_ttest}
                      onChange={(e) => handleReadyFieldChange("p_ttest", e.target.value)}
                      className="w-full p-2 border border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-3 bg-[#F4F4F4] border border-black">
                  <div className="space-y-2">
                    <span className="font-bold text-black uppercase block">KELOMPOK 1</span>
                    <input
                      type="text"
                      placeholder="Nama Grup 1"
                      value={readyValues.grup1_nama}
                      onChange={(e) => handleReadyFieldChange("grup1_nama", e.target.value)}
                      className="w-full p-1.5 border border-black"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Mean"
                        step="0.01"
                        value={readyValues.grup1_mean}
                        onChange={(e) => handleReadyFieldChange("grup1_mean", e.target.value)}
                        className="w-full p-1.5 border border-black"
                      />
                      <input
                        type="number"
                        placeholder="N (min 2)"
                        value={readyValues.grup1_n}
                        onChange={(e) => handleReadyFieldChange("grup1_n", e.target.value)}
                        className="w-full p-1.5 border border-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-black uppercase block">KELOMPOK 2</span>
                    <input
                      type="text"
                      placeholder="Nama Grup 2"
                      value={readyValues.grup2_nama}
                      onChange={(e) => handleReadyFieldChange("grup2_nama", e.target.value)}
                      className="w-full p-1.5 border border-black"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Mean"
                        step="0.01"
                        value={readyValues.grup2_mean}
                        onChange={(e) => handleReadyFieldChange("grup2_mean", e.target.value)}
                        className="w-full p-1.5 border border-black"
                      />
                      <input
                        type="number"
                        placeholder="N (min 2)"
                        value={readyValues.grup2_n}
                        onChange={(e) => handleReadyFieldChange("grup2_n", e.target.value)}
                        className="w-full p-1.5 border border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {readyType === "korelasi" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono-tech text-xs">
                <div>
                  <label className="block font-bold mb-1">VARIABEL X</label>
                  <input
                    type="text"
                    value={readyValues.var_x}
                    onChange={(e) => handleReadyFieldChange("var_x", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">VARIABEL Y</label>
                  <input
                    type="text"
                    value={readyValues.var_y}
                    onChange={(e) => handleReadyFieldChange("var_y", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">KOEFISIEN r (-1 S.D. 1)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="-1"
                    max="1"
                    value={readyValues.r}
                    onChange={(e) => handleReadyFieldChange("r", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">P-VALUE (0 S.D. 1)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={readyValues.p_corr}
                    onChange={(e) => handleReadyFieldChange("p_corr", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">PASANGAN DATA N (≥ 3)</label>
                  <input
                    type="number"
                    value={readyValues.n_corr}
                    onChange={(e) => handleReadyFieldChange("n_corr", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
              </div>
            )}

            {readyType === "regresi" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono-tech text-xs">
                <div>
                  <label className="block font-bold mb-1">VARIABEL BEBAS (X)</label>
                  <input
                    type="text"
                    value={readyValues.reg_x}
                    onChange={(e) => handleReadyFieldChange("reg_x", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">VARIABEL TERIKAT (Y)</label>
                  <input
                    type="text"
                    value={readyValues.reg_y}
                    onChange={(e) => handleReadyFieldChange("reg_y", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">KOEFISIEN SLOPE (b)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={readyValues.b}
                    onChange={(e) => handleReadyFieldChange("b", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">KONSTANTA / INTERCEPT (a)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={readyValues.a}
                    onChange={(e) => handleReadyFieldChange("a", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">R-SQUARED R² (0 S.D. 1)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="1"
                    value={readyValues.r2}
                    onChange={(e) => handleReadyFieldChange("r2", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">P-VALUE (0 S.D. 1)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    max="1"
                    value={readyValues.p_reg}
                    onChange={(e) => handleReadyFieldChange("p_reg", e.target.value)}
                    className="w-full p-2 border border-black"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-black">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleSaveReadyMade}
              className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#EBEB00]" />
              <span>Simpan & Validasi Angka Siap Pakai</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          RINGKASAN DATASET & PRATINJAU 8 BARIS (FR-05)
         ========================================================================= */}
      {currentSummary && (
        <div className="border border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden">
          {/* Header Ringkasan */}
          <div className="bg-[#EFEFEF] border-b border-black p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#00D084] border border-black inline-block" />
              <span className="font-mono-tech text-xs font-bold text-black uppercase tracking-wider">
                RINGKASAN STRUKTUR DATASET: {currentSummary.nama_dataset || "DATASET"}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono-tech text-xs">
              {currentSummary.format_data === "image" ? (
                <span className="px-2 py-0.5 border border-black bg-[#EBEB00] text-black font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
                  <Sparkles className="w-3.5 h-3.5 text-[#003BFF]" />
                  <span>FORMAT: GAMBAR (AI VISION)</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 border border-black bg-white font-bold">
                  FORMAT: {currentSummary.format_data.toUpperCase()}
                </span>
              )}
              <span className="px-2 py-0.5 border border-black bg-white font-bold text-[#003BFF]">
                SUMBER: {currentSummary.sumber_input.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Baris Metrik Ringkasan: Total Baris, Total Kolom, Sel Kosong */}
          <div className="grid grid-cols-3 divide-x divide-black border-b border-black bg-white font-mono-tech text-center">
            <div className="p-4">
              <div className="text-[10px] text-black/50 font-bold uppercase">TOTAL BARIS</div>
              <div className="text-2xl font-bold text-black mt-1">{currentSummary.total_baris}</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] text-black/50 font-bold uppercase">TOTAL KOLOM</div>
              <div className="text-2xl font-bold text-black mt-1">{currentSummary.total_kolom}</div>
            </div>
            <div className="p-4">
              <div className="text-[10px] text-black/50 font-bold uppercase">SEL KOSONG (MISSING)</div>
              <div className={`text-2xl font-bold mt-1 ${calculateEmptyCells() > 0 ? "text-[#FF2E2E]" : "text-[#00D084]"}`}>
                {calculateEmptyCells()}
              </div>
            </div>
          </div>

          {/* Lencana Tipe Kolom (Numerik vs Teks) & Jumlah Kosong */}
          {currentSummary.kolom_info && currentSummary.kolom_info.length > 0 && (
            <div className="p-4 bg-[#F9F9F9] border-b border-black">
              <div className="font-mono-tech text-[10px] text-black/60 uppercase font-bold mb-2">
                ANALISIS TIPE KOLOM & KEBERSIHAN DATA:
              </div>
              <div className="flex flex-wrap gap-2">
                {currentSummary.kolom_info.map((col) => (
                  <div
                    key={col.name}
                    className="border border-black bg-white px-2.5 py-1.5 font-mono-tech text-xs flex items-center gap-2"
                  >
                    <span className="font-bold text-black">{col.name}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 border ${
                        col.type === "numeric"
                          ? "bg-[#003BFF] text-white border-black"
                          : "bg-[#EBEB00] text-black border-black"
                      }`}
                    >
                      {col.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabel Pratinjau 8 Baris */}
          {currentSummary.preview_baris && currentSummary.preview_baris.length > 0 && (
            <div className="p-4 overflow-x-auto">
              <div className="font-mono-tech text-[10px] text-black/60 uppercase font-bold mb-2">
                PRATINJAU 8 BARIS PERTAMA:
              </div>
              <table className="w-full text-left font-mono-tech text-xs border border-black">
                <thead className="bg-[#EFEFEF] border-b border-black">
                  <tr>
                    <th className="p-2 border-r border-black w-10 text-center text-black/50 font-bold">#</th>
                    {currentSummary.kolom.map((col) => (
                      <th key={col} className="p-2 border-r border-black font-bold uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {currentSummary.preview_baris.slice(0, 8).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F9F9F9]">
                      <td className="p-2 border-r border-black text-center text-black/50 font-bold">
                        {idx + 1}
                      </td>
                      {currentSummary.kolom.map((col) => (
                        <td key={col} className="p-2 border-r border-black text-black">
                          {row[col] !== undefined && row[col] !== "" ? String(row[col]) : (
                            <span className="text-black/30 italic">(kosong)</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tombol Lanjut ke Langkah 2: Analisis */}
          <div className="p-4 bg-[#F8F8F8] border-t border-black flex items-center justify-between">
            <span className="font-mono-tech text-xs text-black/60">
              Data siap dikonfigurasi untuk pengujian statistik.
            </span>
            <button
              type="button"
              onClick={onProceedToConfig}
              className="px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
            >
              <span>Lanjut ke Langkah 2: Analisis</span>
              <ArrowRight className="w-4 h-4 text-[#EBEB00]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
