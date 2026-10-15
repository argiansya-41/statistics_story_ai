"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { AnalysesApi } from "@/lib/api/analysesApi";
import type { AnalysisRecord } from "@/lib/types/analysis";
import { PlusCircle, FolderClock, ArrowRight, BarChart2, GitCompare, GitFork, TrendingUp, Sparkles, Server } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default function DashboardPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    async function loadData() {
      try {
        const res = await AnalysesApi.listHistory(1, 5);
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
  const isLive = AnalysesApi.isLiveBackend();

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      <AppNavbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <div className="border border-black bg-white p-6 md:p-10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono-tech text-xs font-bold text-black/60 uppercase">
                <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
                <span>WORKSPACE AKADEMIS</span>
              </div>
              <h1 className="font-display text-3xl md:text-5xl font-normal tracking-tight">
                Halo, {user?.name || "Mahasiswa"}!
              </h1>
              <p className="font-sans text-base text-black/70 mt-2 max-w-2xl leading-relaxed">
                Ubah angka statistik tugas, praktikum, atau skripsi Anda menjadi narasi terstruktur yang mudah dipahami, visualisasi otomatis, dan analogi dunia nyata.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                href="/analisis/baru"
                className="px-6 py-3.5 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold border border-black hover:bg-black hover:text-[#EBEB00] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_0px_#000000]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Buat Analisis Baru</span>
              </Link>
              <Link
                href="/analisis/riwayat"
                className="px-6 py-3.5 bg-white text-black font-mono-tech text-xs font-bold border border-black hover:bg-[#F4F4F4] transition-colors flex items-center gap-2"
              >
                <FolderClock className="w-4 h-4" />
                <span>Lihat Riwayat</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="border border-black bg-white p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">
              TOTAL ANALISIS TERSIMPAN
            </div>
            <div className="font-mono-tech text-3xl font-bold text-black mt-2">
              {loading ? "..." : totalSaved}
            </div>
            <div className="font-mono-tech text-[11px] text-black/60 mt-1">
              Analisis aktif di repositori Anda
            </div>
          </div>

          <div className="border border-black bg-white p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">
              STATUS KONEKSI BACKEND
            </div>
            <div className="font-mono-tech text-xl font-bold text-black mt-2 flex items-center gap-2">
              <span className={`w-3 h-3 ${isLive ? "bg-[#00D084]" : "bg-[#EBEB00]"} border border-black inline-block`} />
              <span>{isLive ? "FastAPI Live" : "Mode Demo Lokal"}</span>
            </div>
            <div className="font-mono-tech text-[11px] text-black/60 mt-1">
              {isLive ? "Tersambung ke NEXT_PUBLIC_API_URL" : "Simulasi lokal deterministik aktif"}
            </div>
          </div>

          <div className="border border-black bg-white p-5">
            <div className="font-mono-tech text-[10px] text-black/50 uppercase font-bold">
              MODEL ESTIMASI
            </div>
            <div className="font-mono-tech text-xl font-bold text-[#003BFF] mt-2">
              SciPy 1.13 + RAG
            </div>
            <div className="font-mono-tech text-[11px] text-black/60 mt-1">
              Kalkulasi deterministik & bebas halusinasi
            </div>
          </div>
        </div>

        {/* Recent Analyses List */}
        <div className="border border-black bg-white">
          <div className="bg-[#EFEFEF] border-b border-black px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderClock className="w-4 h-4 text-black" />
              <h2 className="font-mono-tech text-xs font-bold uppercase text-black">
                ANALISIS TERSIMPAN TERBARU
              </h2>
            </div>
            <Link
              href="/analisis/riwayat"
              className="font-mono-tech text-xs font-bold text-[#003BFF] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center font-mono-tech text-xs text-black/50 py-8">
                Memuat riwayat analisis...
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 border border-black bg-[#F4F4F4] text-black/40 flex items-center justify-center mx-auto">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <div className="font-mono-tech text-sm font-bold text-black">
                  Belum ada analisis yang disimpan
                </div>
                <p className="font-sans text-xs text-black/60 max-w-md mx-auto">
                  Mulai analisis pertama Anda dengan mengunggah dataset CSV, Excel, atau memasukkan data secara manual.
                </p>
                <Link
                  href="/analisis/baru"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Mulai Analisis Pertama</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-tech text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-black text-black/60">
                      <th className="pb-3 font-bold">NAMA SESI</th>
                      <th className="pb-3 font-bold">JENIS ANALISIS</th>
                      <th className="pb-3 font-bold">TANGGAL</th>
                      <th className="pb-3 font-bold">STATUS</th>
                      <th className="pb-3 text-right font-bold">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {records.map((rec) => (
                      <tr key={rec.id_analisis} className="hover:bg-[#F9F9F9]">
                        <td className="py-3.5 font-bold text-black">{rec.nama_sesi}</td>
                        <td className="py-3.5 uppercase text-black/70">{rec.jenis_analisis}</td>
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
                            <span>Buka Hasil</span>
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

        {/* 4 Panduan Analisis Cepat */}
        <div>
          <div className="font-mono-tech text-xs font-bold text-black/60 uppercase mb-4">
            PANDUAN 4 JENIS ANALISIS STATISTIK (PRD STATISTICS STORY AI)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-black bg-white p-5 space-y-2">
              <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-bold text-black">1. STATISTIK DESKRIPTIF</h3>
              <p className="font-sans text-xs text-black/70 leading-relaxed">
                Meringkas mean, median, modus, standar deviasi, min, dan max. Menjelaskan distribusi frekuensi data.
              </p>
            </div>

            <div className="border border-black bg-white p-5 space-y-2">
              <div className="w-8 h-8 bg-[#003BFF] text-white flex items-center justify-center">
                <GitCompare className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-bold text-black">2. UJI T DUA KELOMPOK</h3>
              <p className="font-sans text-xs text-black/70 leading-relaxed">
                Membandingkan rata-rata 2 kelompok independen menggunakan rumus Welch t-test (α = 0.05).
              </p>
            </div>

            <div className="border border-black bg-white p-5 space-y-2">
              <div className="w-8 h-8 bg-[#EBEB00] text-black border border-black flex items-center justify-center">
                <GitFork className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-bold text-black">3. KORELASI PEARSON</h3>
              <p className="font-sans text-xs text-black/70 leading-relaxed">
                Mengukur koefisien korelasi linear (r) antara variabel X dan Y serta kekuatan hubungannya.
              </p>
            </div>

            <div className="border border-black bg-white p-5 space-y-2">
              <div className="w-8 h-8 bg-[#FF2E2E] text-white flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-mono-tech text-xs font-bold text-black">4. REGRESI LINEAR</h3>
              <p className="font-sans text-xs text-black/70 leading-relaxed">
                Menemukan persamaan garis prediksi Y = a + bX dan proporsi variansi yang dapat dijelaskan (R²).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
