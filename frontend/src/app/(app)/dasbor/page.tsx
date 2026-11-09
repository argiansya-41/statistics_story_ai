"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api/analysesApi";
import type { AnalysisRecord, AnalysisType } from "@/lib/types/analysis";
import { Mascot } from "@/components/ui/Mascot";
import {
  PlusCircle,
  FolderClock,
  ArrowRight,
  BarChart2,
  GitCompare,
  GitFork,
  TrendingUp,
  CheckCircle2,
  Clock,
  Bookmark,
} from "lucide-react";

export default function DasborPage() {
  const router = useRouter();
  const { user } = useSession();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.listHistory(1, 10);
        setRecords(res.data || []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalSaved = records.length;
  const totalSelesai = records.filter((r) => r.status === "selesai").length;
  const totalDiproses = records.filter((r) => r.status === "diproses").length;
  const recentFive = records.slice(0, 5);

  const startAnalysis = (jenis?: AnalysisType) => {
    if (jenis) {
      router.push(`/analisis/baru?jenis=${jenis}`);
    } else {
      router.push("/analisis/baru");
    }
  };

  const analysisCards: {
    type: AnalysisType;
    num: string;
    title: string;
    summary: string;
    req: string;
    accent: string;
    icon: typeof BarChart2;
  }[] = [
    {
      type: "deskriptif",
      num: "01",
      title: "Statistik Deskriptif",
      summary: "Meringkas tendensi sentral (mean, median, modus), rentang min-max, dan standar deviasi sebaran data.",
      req: "Syarat minimum: minimal 2 observasi numerik.",
      accent: "#003BFF",
      icon: BarChart2,
    },
    {
      type: "uji_t",
      num: "02",
      title: "Uji t Dua Kelompok",
      summary: "Membandingkan signifikansi perbedaan rata-rata antara 2 kelompok independen dengan rumus Welch (α = 0.05).",
      req: "Syarat minimum: tepat 2 kategori kelompok, minimal 2 observasi per kelompok.",
      accent: "#FF2E2E",
      icon: GitCompare,
    },
    {
      type: "korelasi",
      num: "03",
      title: "Korelasi Pearson",
      summary: "Mengukur derajat dan arah keeratan hubungan linear (r) antara variabel numerik X dan Y.",
      req: "Syarat minimum: minimal 3 pasangan data numerik (variansi > 0).",
      accent: "#EBEB00",
      icon: GitFork,
    },
    {
      type: "regresi",
      num: "04",
      title: "Regresi Sederhana",
      summary: "Menemukan rumus estimasi linear Y = a + bX serta proporsi variansi model (R²) dan p-value.",
      req: "Syarat minimum: minimal 3 pasangan data bebas & terikat (variansi X > 0).",
      accent: "#003BFF",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* =========================================================================
          HERO BANNER BERTANGGA DENGAN SAPAAN & BALON MASKOT SIGI
         ========================================================================= */}
      <div className="border border-black bg-white p-6 md:p-10 relative overflow-hidden shadow-[6px_6px_0px_#000000]">
        {/* Tanda silang blueprint di sudut */}
        {["-left-2 -top-2", "-right-2 -top-2", "-bottom-2 -left-2", "-bottom-2 -right-2"].map((pos) => (
          <span key={pos} aria-hidden="true" className={`pointer-events-none absolute ${pos} z-10 h-4 w-4`}>
            <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black" />
            <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black" />
          </span>
        ))}

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono-tech text-xs font-bold text-black/60 uppercase">
              <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
              <span>WORKSPACE AKADEMIS</span>
            </div>

            {/* Judul Bertangga di Blok Warna */}
            <div className="inline-block bg-[#003BFF] text-white px-5 py-2.5 border border-black shadow-[4px_4px_0px_#000000]">
              <h1 className="font-display text-2xl md:text-4xl font-normal tracking-tight">
                Halo, {user?.name || "Mahasiswa"}.
              </h1>
            </div>

            <p className="font-sans text-sm md:text-base text-black/80 max-w-2xl leading-relaxed">
              Mulai ceritakan angka analisismu. Unggah dataset tugas atau skripsi, pilih jenis pengujian statistik, dan biarkan AI merangkai narasi akademis yang bebas halusinasi.
            </p>
          </div>

          {/* Sigi Mascot Guide dengan Balon Bicara */}
          <div className="shrink-0 flex items-center gap-4 bg-[#F4F4F4] border border-black p-4 relative self-start lg:self-center shadow-[4px_4px_0px_#000000]">
            <Mascot character="sigi" pose="wave" face="smile" className="w-16 h-16 shrink-0" interactive />
            <div className="relative bg-white border border-black p-3 font-mono-tech text-xs text-black max-w-[220px] shadow-[2px_2px_0px_#003BFF]">
              <div className="font-bold text-[#003BFF] text-[10px] uppercase mb-0.5">Sigi (Pemandu):</div>
              &ldquo;Pilih salah satu dari 4 pengujian di bawah untuk memulai!&rdquo;
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIGA PENGHITUNG (Tersimpan, Selesai, Sedang Diproses)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative">
          <div className="flex items-center justify-between">
            <div className="font-mono-tech text-[10px] text-black/60 uppercase font-bold tracking-wider">
              ANALISIS TERSIMPAN
            </div>
            <Bookmark className="w-4 h-4 text-[#003BFF]" />
          </div>
          <div className="font-mono-tech text-3xl md:text-4xl font-bold text-black mt-2">
            {loading ? "..." : totalSaved}
          </div>
          <div className="font-mono-tech text-[11px] text-black/60 mt-1">
            Total disimpan di repositori Anda
          </div>
        </div>

        <div className="border border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative">
          <div className="flex items-center justify-between">
            <div className="font-mono-tech text-[10px] text-black/60 uppercase font-bold tracking-wider">
              SELESAI DIANALISIS
            </div>
            <CheckCircle2 className="w-4 h-4 text-[#00D084]" />
          </div>
          <div className="font-mono-tech text-3xl md:text-4xl font-bold text-black mt-2">
            {loading ? "..." : totalSelesai}
          </div>
          <div className="font-mono-tech text-[11px] text-black/60 mt-1">
            Angka & narasi lengkap diverifikasi
          </div>
        </div>

        <div className="border border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative">
          <div className="flex items-center justify-between">
            <div className="font-mono-tech text-[10px] text-black/60 uppercase font-bold tracking-wider">
              SEDANG DIPROSES
            </div>
            <Clock className="w-4 h-4 text-[#FF8A00]" />
          </div>
          <div className="font-mono-tech text-3xl md:text-4xl font-bold text-[#003BFF] mt-2">
            {loading ? "..." : totalDiproses}
          </div>
          <div className="font-mono-tech text-[11px] text-black/60 mt-1">
            Menunggu penyelesaian pipeline AI
          </div>
        </div>
      </div>

      {/* =========================================================================
          EMPAT KARTU JENIS ANALISIS (Mulai Cepat dengan Pre-selected Type)
         ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-xs font-bold text-black uppercase tracking-wider">
              PILIH METODE ANALISIS STATISTIK
            </span>
            <span className="font-mono-tech text-[10px] text-black/50 hidden sm:inline">
              (Klik kartu untuk memulai analisis)
            </span>
          </div>
          <Link
            href="/analisis/baru"
            className="font-mono-tech text-xs font-bold text-[#003BFF] hover:underline flex items-center gap-1"
          >
            <span>Semua Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analysisCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.type}
                type="button"
                onClick={() => startAnalysis(card.type)}
                className="group text-left border border-black bg-white p-6 space-y-4 hover:border-black transition-all hover:-translate-y-1 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#003BFF] cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 border border-black flex items-center justify-center text-white"
                      style={{ backgroundColor: card.accent }}
                    >
                      <Icon className="w-5 h-5 text-black" style={{ color: card.type === "korelasi" ? "#000" : "#fff" }} />
                    </div>
                    <span className="font-mono-tech text-xs font-bold text-black/40">
                      {card.num}
                    </span>
                  </div>

                  <h3 className="font-mono-tech text-sm font-bold text-black uppercase group-hover:text-[#003BFF] transition-colors">
                    {card.title}
                  </h3>

                  <p className="font-sans text-xs text-black/70 leading-relaxed">
                    {card.summary}
                  </p>
                </div>

                <div className="border-t border-black/10 pt-3">
                  <p className="font-mono-tech text-[10px] text-black/60 bg-[#F4F4F4] p-2 border border-black/20">
                    {card.req}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs font-mono-tech font-bold text-[#003BFF]">
                    <span>Mulai Pengujian</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          DAFTAR 5 RIWAYAT TERBARU / KEADAAN KOSONG TIGA MASKOT
         ========================================================================= */}
      <div className="border border-black bg-white shadow-[6px_6px_0px_#000000]">
        <div className="bg-[#EFEFEF] border-b border-black px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderClock className="w-4 h-4 text-black" />
            <h2 className="font-mono-tech text-xs font-bold uppercase text-black tracking-wider">
              5 RIWAYAT TERSIMPAN TERBARU
            </h2>
          </div>
          <Link
            href="/riwayat"
            className="font-mono-tech text-xs font-bold text-[#003BFF] hover:underline flex items-center gap-1"
          >
            <span>Buka Seluruh Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center font-mono-tech text-xs text-black/50 py-10 space-y-2">
              <div className="w-6 h-6 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
              <div>Memuat riwayat analisis terbaru...</div>
            </div>
          ) : recentFive.length === 0 ? (
            /* KEADAAN KOSONG DENGAN TIGA MASKOT (Sigi, Mu, Quin) */
            <div className="py-12 px-4 text-center space-y-6">
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <Mascot character="sigi" pose="wave" face="smile" className="w-16 h-16 mx-auto" interactive />
                  <div className="font-mono-tech text-[10px] font-bold text-black/60 mt-1">Sigi</div>
                </div>
                <div className="text-center">
                  <Mascot character="mu" pose="cheer" face="happy" className="w-16 h-16 mx-auto" interactive />
                  <div className="font-mono-tech text-[10px] font-bold text-black/60 mt-1">Mu</div>
                </div>
                <div className="text-center">
                  <Mascot character="quin" pose="read" face="wink" className="w-16 h-16 mx-auto" interactive />
                  <div className="font-mono-tech text-[10px] font-bold text-black/60 mt-1">Quin</div>
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <div className="font-mono-tech text-base font-bold text-black uppercase">
                  Belum Ada Analisis yang Disimpan
                </div>
                <p className="font-sans text-xs text-black/70 leading-relaxed">
                  Semua analisis statistik yang Anda simpan akan tercatat di sini. Sigi, Mu, dan Quin siap membantu Anda mengubah data angka mentah menjadi cerita visual dan narasi akademis!
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => startAnalysis()}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold border border-black hover:bg-black hover:text-[#EBEB00] transition-colors shadow-[4px_4px_0px_#000000]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Mulai Analisis Pertama Sekarang</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-tech text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black text-black/60">
                    <th className="pb-3 font-bold">NAMA SESI</th>
                    <th className="pb-3 font-bold">JENIS UJI</th>
                    <th className="pb-3 font-bold">TANGGAL</th>
                    <th className="pb-3 font-bold">STATUS</th>
                    <th className="pb-3 text-right font-bold">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {recentFive.map((rec) => (
                    <tr key={rec.id_analisis} className="hover:bg-[#F9F9F9] transition-colors">
                      <td className="py-3.5 font-bold text-black pr-4">
                        {rec.nama_sesi}
                      </td>
                      <td className="py-3.5 uppercase text-black/70">
                        {rec.jenis_analisis.replace("_", " ")}
                      </td>
                      <td className="py-3.5 text-black/50">
                        {new Date(rec.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 border font-bold text-[10px] uppercase ${
                            rec.status === "selesai"
                              ? "bg-[#00D084] text-black border-black"
                              : rec.status === "diproses"
                              ? "bg-[#EBEB00] text-black border-black"
                              : "bg-[#FF2E2E] text-white border-black"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/analisis/${rec.id_analisis}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white hover:bg-[#003BFF] transition-colors text-[11px] font-bold"
                        >
                          <span>Buka Detail</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
