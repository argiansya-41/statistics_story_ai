"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api/analysesApi";
import type { AnalysisRecord, AnalysisType } from "@/lib/types/analysis";
import { DeleteConfirmModal } from "@/components/analysis/DeleteConfirmModal";
import { Mascot } from "@/components/ui/Mascot";
import {
  Search,
  Trash2,
  ArrowRight,
  PlusCircle,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";

export default function RiwayatPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Dialog hapus & Toast state
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const limit = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.listHistory(page, limit, search);
      setRecords(res.data || []);
      setTotal(res.total || 0);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(deleteTarget.id_analisis);
      const title = deleteTarget.nama_sesi;
      setDeleteTarget(null);
      setToastMessage(`Analisis "${title}" dan seluruh data terkait berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus analisis: " + (err.message || "Kesalahan server"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const res = await api.deleteAll();
      setIsDeleteAllOpen(false);
      setToastMessage(res?.message || `Seluruh riwayat analisis (${total} sesi) berhasil dihapus.`);
      setTimeout(() => setToastMessage(null), 4000);
      setPage(1);
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus semua riwayat: " + (err.message || "Kesalahan server"));
    } finally {
      setIsDeletingAll(false);
    }
  };

  // Client-side filter berdasarkan jenis analisis
  const filteredRecords = useMemo(() => {
    if (selectedType === "all") return records;
    return records.filter((r) => r.jenis_analisis === selectedType);
  }, [records, selectedType]);

  const totalPages = Math.ceil(total / limit) || 1;

  const getTypeBadge = (type: AnalysisType) => {
    switch (type) {
      case "deskriptif":
        return { label: "Deskriptif", color: "bg-[#003BFF] text-white" };
      case "uji_t":
        return { label: "Uji t (Welch)", color: "bg-[#FF2E2E] text-white" };
      case "korelasi":
        return { label: "Korelasi Pearson", color: "bg-[#EBEB00] text-black" };
      case "regresi":
        return { label: "Regresi Linear", color: "bg-[#003BFF] text-white" };
      default:
        return { label: type, color: "bg-black text-white" };
    }
  };

  const getRecordSummary = (rec: AnalysisRecord) => {
    if (!rec.hasil) return "Hasil belum dijalankan";

    const fmtNum = (val: any, dec = 4) => {
      const n = Number(val);
      if (isNaN(n)) return String(val || "-");
      if (Number.isInteger(n)) return n.toString();
      if (Math.abs(n) > 0 && Math.abs(n) < 0.0001) return n.toExponential(2);
      return Number(n.toFixed(dec)).toString();
    };

    const fmtP = (val: any) => {
      const n = Number(val);
      if (isNaN(n)) return String(val || "-");
      if (Math.abs(n) < 0.0001 && n !== 0) return "< 0.0001";
      return n.toFixed(4);
    };

    if (rec.jenis_analisis === "deskriptif") {
      const ringkasan = (rec.hasil as any).ringkasan || [];
      const first = ringkasan[0];
      if (!first) return "Ringkasan deskriptif";
      return `${first.kolom}: M = ${fmtNum(first.mean, 2)}, Med = ${fmtNum(first.median, 2)}, SD = ${fmtNum(first.standar_deviasi, 2)} (N = ${first.n})`;
    }
    if (rec.jenis_analisis === "uji_t") {
      const h = rec.hasil as any;
      return `t = ${fmtNum(h.t, 2)}, df = ${fmtNum(h.df, 1)}, p = ${fmtP(h.p_value)} (${h.signifikan ? "Signifikan" : "Tidak Signifikan"})`;
    }
    if (rec.jenis_analisis === "korelasi") {
      const h = rec.hasil as any;
      return `r = ${fmtNum(h.r, 4)}, p = ${fmtP(h.p_value)} (Hubungan ${h.arah} ${h.kekuatan})`;
    }
    if (rec.jenis_analisis === "regresi") {
      const h = rec.hasil as any;
      return `${h.persamaan}, R² = ${fmtNum(h.r_squared, 4)}, p = ${fmtP(h.p_value)}`;
    }
    return "Analisis statistik tersimpan";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Toast Notifikasi Berhasil Dihapus (HTTP 204) */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="border-2 border-black bg-[#EBEB00] text-black px-5 py-3 font-mono-tech text-xs font-bold flex items-center justify-between shadow-[4px_4px_0px_#000000] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#003BFF]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-black/60 hover:text-black font-bold text-sm px-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Halaman Riwayat */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 bg-[#003BFF] border border-black inline-block" />
            <span className="font-mono-tech text-xs font-bold uppercase text-black/60 tracking-wider">
              REPOSITORI TERSIMPAN
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-normal text-black tracking-tight">
            Riwayat Analisis
          </h1>
          <p className="font-sans text-xs md:text-sm text-black/70 mt-1 max-w-2xl leading-relaxed">
            Daftar seluruh analisis yang telah Anda simpan ke repositori akun. Buka kembali detail hasil angka, grafik SVG, dan narasi dua bahasa tanpa hitung ulang.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap">
          {total > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteAllOpen(true)}
              className="px-4 py-3 bg-white text-[#FF2E2E] hover:bg-[#FF2E2E] hover:text-white border border-black font-mono-tech text-xs font-bold transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000] cursor-pointer"
              title="Hapus semua riwayat analisis yang tersimpan"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua Riwayat ({total})</span>
            </button>
          )}

          <Link
            href="/analisis/baru"
            className="px-6 py-3 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold border border-black hover:bg-black hover:text-[#EBEB00] transition-colors flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Analisis Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="border border-black bg-white p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[4px_4px_0px_#000000]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-black/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama sesi atau jenis analisis..."
            className="w-full pl-9 pr-3 py-2 border border-black font-mono-tech text-xs focus:outline-none focus:ring-1 focus:ring-[#003BFF]"
          />
        </div>

        {/* Filter Jenis Analisis (Client-side) */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-black/50" />
          <span className="font-mono-tech text-xs font-bold text-black/70">JENIS:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-black font-mono-tech text-xs bg-white focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Jenis ({records.length})</option>
            <option value="deskriptif">Statistik Deskriptif</option>
            <option value="uji_t">Uji t Dua Kelompok</option>
            <option value="korelasi">Korelasi Pearson</option>
            <option value="regresi">Regresi Sederhana</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          DAFTAR KARTU BERGARIS ATAU KEADAAN KOSONG BERMASKOT BINGUNG
         ========================================================================= */}
      {loading ? (
        <div className="border border-black bg-white p-16 text-center space-y-3 shadow-[6px_6px_0px_#000000]">
          <div className="w-8 h-8 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
          <div className="font-mono-tech text-xs font-bold text-black/60">
            MEMUAT DAFTAR RIWAYAT ANALISIS...
          </div>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Keadaan Kosong Bermaskot Bingung */
        <div className="border border-black bg-white p-12 md:p-16 text-center space-y-6 shadow-[6px_6px_0px_#000000]">
          <div className="flex items-center justify-center gap-4">
            <Mascot character="sigi" pose="idle" face="think" className="w-16 h-16" interactive />
            <Mascot character="quin" pose="read" face="wow" className="w-16 h-16" interactive />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <div className="font-mono-tech text-base font-bold text-black uppercase">
              {search || selectedType !== "all"
                ? "Tidak Ada Analisis yang Sesuai Filter"
                : "Belum Ada Analisis yang Disimpan"}
            </div>
            <p className="font-sans text-xs text-black/70 leading-relaxed">
              {search || selectedType !== "all"
                ? "Cobalah mencari dengan kata kunci lain atau setel filter ke 'Semua Jenis'."
                : "Setiap sesi analisis yang selesai dapat Anda simpan ke riwayat lewat tombol 'Simpan ke Riwayat' pada halaman hasil analisis."}
            </p>
          </div>

          <div>
            <Link
              href="/analisis/baru"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors shadow-[3px_3px_0px_#000000]"
            >
              <PlusCircle className="w-4 h-4 text-[#EBEB00]" />
              <span>Mulai Analisis Baru</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Daftar Kartu Bergaris */
        <div className="space-y-3">
          {filteredRecords.map((item) => {
            const badge = getTypeBadge(item.jenis_analisis);
            const summarySnippet = getRecordSummary(item);

            return (
              <div
                key={item.id_analisis}
                className="border border-black bg-white p-5 hover:border-black transition-all hover:-translate-y-0.5 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#003BFF] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono-tech text-[10px] uppercase font-bold px-2 py-0.5 border border-black ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <span
                      className={`font-mono-tech text-[10px] uppercase font-bold px-2 py-0.5 border border-black ${
                        item.status === "selesai"
                          ? "bg-[#00D084] text-black"
                          : item.status === "diproses"
                          ? "bg-[#EBEB00] text-black"
                          : "bg-[#FF2E2E] text-white"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="font-mono-tech text-[11px] text-black/50 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <h3 className="font-display text-lg md:text-xl font-normal text-black">
                    {item.nama_sesi}
                  </h3>

                  <p className="font-mono-tech text-xs text-black/75 bg-[#F9F9F9] p-2 border border-black/15 max-w-2xl">
                    {summarySnippet}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link
                    href={`/analisis/${item.id_analisis}`}
                    className="px-4 py-2 bg-black text-white hover:bg-[#003BFF] transition-colors font-mono-tech text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Buka Hasil</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    aria-label={`Hapus analisis ${item.nama_sesi}`}
                    className="px-3 py-2 border border-black hover:bg-[#FF2E2E] hover:text-white transition-colors font-mono-tech text-xs font-bold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="border border-black bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono-tech text-xs shadow-[4px_4px_0px_#000000]">
              <span className="text-black/70">
                Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({total} total data tersimpan)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-1.5 border border-black bg-white hover:bg-[#EBEB00] disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-1.5 border border-black bg-white hover:bg-[#EBEB00] disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Satu Sesi */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        analysisTitle={deleteTarget?.nama_sesi || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      {/* Modal Dialog Konfirmasi Hapus Semua Riwayat */}
      <DeleteConfirmModal
        isOpen={isDeleteAllOpen}
        isAll={true}
        totalCount={total}
        onConfirm={handleConfirmDeleteAll}
        onCancel={() => setIsDeleteAllOpen(false)}
        isDeleting={isDeletingAll}
      />
    </div>
  );
}
