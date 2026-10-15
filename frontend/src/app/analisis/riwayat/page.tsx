"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { DeleteConfirmModal } from "@/components/analysis/DeleteConfirmModal";
import { AnalysesApi } from "@/lib/api/analysesApi";
import type { AnalysisRecord, AnalysisType } from "@/lib/types/analysis";
import { FolderClock, Search, Trash2, ArrowRight, PlusCircle, Filter } from "lucide-react";

export default function RiwayatPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modal hapus
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const limit = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await AnalysesApi.listHistory(page, limit, search);
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
      await AnalysesApi.delete(deleteTarget.id_analisis);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      alert("Gagal menghapus analisis: " + (err.message || "Kesalahan server"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecords = filterType === "all"
    ? records
    : records.filter((r) => r.jenis_analisis === filterType);

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black">
      <AppNavbar />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-black">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderClock className="w-5 h-5 text-black" />
              <span className="font-mono-tech text-xs font-bold uppercase text-black/60">
                REPOSITORI TERSIMPAN
              </span>
            </div>
            <h1 className="font-display text-3xl font-normal">Riwayat Analisis (FR-16)</h1>
            <p className="font-sans text-xs text-black/60 mt-1">
              Daftar seluruh analisis yang telah Anda simpan. Anda dapat membuka kembali detail hasil atau menghapus riwayat.
            </p>
          </div>

          <Link
            href="/analisis/baru"
            className="px-5 py-2.5 bg-black text-white font-mono-tech text-xs font-bold border border-black hover:bg-[#003BFF] transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Buat Analisis Baru</span>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="border border-black bg-white p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-black/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama analisis..."
              className="w-full pl-9 pr-3 py-2 border border-black font-mono-tech text-xs focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Filter Jenis Analisis */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-black/50 hidden sm:inline" />
            <span className="font-mono-tech text-xs font-bold text-black/70 hidden sm:inline">JENIS:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-black font-mono-tech text-xs bg-white focus:outline-none"
            >
              <option value="all">Semua Jenis Analisis</option>
              <option value="deskriptif">Statistik Deskriptif</option>
              <option value="uji_t">Uji t Dua Kelompok</option>
              <option value="korelasi">Korelasi Pearson</option>
              <option value="regresi">Regresi Linear Sederhana</option>
            </select>
          </div>
        </div>

        {/* Tabel Riwayat */}
        <div className="border border-black bg-white">
          {loading ? (
            <div className="p-12 text-center font-mono-tech text-xs text-black/50">
              Memuat data riwayat...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-12 h-12 border border-black bg-[#F4F4F4] text-black/40 flex items-center justify-center mx-auto">
                <FolderClock className="w-6 h-6" />
              </div>
              <div className="font-mono-tech text-sm font-bold text-black">
                {search ? "Tidak ada hasil pencarian yang cocok" : "Belum Ada Analisis yang Disimpan"}
              </div>
              <p className="font-sans text-xs text-black/60 max-w-md mx-auto">
                {search
                  ? "Coba kata kunci pencarian yang berbeda atau reset filter."
                  : "Analisis yang selesai dapat disimpan ke riwayat melalui tombol 'Simpan ke Riwayat' pada halaman hasil analisis."}
              </p>
              {!search && (
                <Link
                  href="/analisis/baru"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Mulai Analisis Baru</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-tech text-xs border-collapse">
                <thead className="bg-[#EFEFEF] border-b border-black">
                  <tr>
                    <th className="p-3.5 border-r border-black w-12 text-center text-black/40">#</th>
                    <th className="p-3.5 border-r border-black font-bold">NAMA ANALISIS</th>
                    <th className="p-3.5 border-r border-black font-bold">JENIS ANALISIS</th>
                    <th className="p-3.5 border-r border-black font-bold">TANGGAL SIMPAN</th>
                    <th className="p-3.5 border-r border-black font-bold">STATUS</th>
                    <th className="p-3.5 text-center font-bold">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {filteredRecords.map((item, idx) => (
                    <tr key={item.id_analisis} className="hover:bg-[#F9F9F9]">
                      <td className="p-3.5 border-r border-black text-center text-black/50 font-bold">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="p-3.5 border-r border-black font-bold text-black">
                        {item.nama_sesi}
                      </td>
                      <td className="p-3.5 border-r border-black uppercase text-black/70">
                        {item.jenis_analisis.replace("_", " ")}
                      </td>
                      <td className="p-3.5 border-r border-black text-black/50">
                        {new Date(item.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3.5 border-r border-black">
                        <span
                          className={`px-2 py-0.5 border font-bold text-[10px] uppercase ${
                            item.status === "selesai"
                              ? "bg-[#00D084] text-black border-black"
                              : "bg-[#EBEB00] text-black border-black"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/analisis/${item.id_analisis}`}
                            className="px-3 py-1 bg-black text-white hover:bg-[#003BFF] transition-colors text-[11px] font-bold inline-flex items-center gap-1"
                          >
                            <span>Buka Detail</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus analisis"
                            aria-label={`Hapus ${item.nama_sesi}`}
                            className="px-2.5 py-1 border border-black hover:bg-[#FF2E2E] hover:text-white transition-colors inline-flex items-center gap-1 font-bold text-[11px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-black bg-[#F8F8F8] flex items-center justify-between font-mono-tech text-xs">
              <span className="text-black/60">
                Halaman {page} dari {totalPages} ({total} total data tersimpan)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-black bg-white hover:bg-[#EBEB00] disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  ← Sebelumnya
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 border border-black bg-white hover:bg-[#EBEB00] disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Konfirmasi Hapus (FR-16) */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        analysisTitle={deleteTarget?.nama_sesi || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
