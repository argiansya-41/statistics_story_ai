"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/analysesApi";
import { Mascot } from "@/components/ui/Mascot";

export default function AnalisisBaruPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenis = searchParams.get("jenis");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      try {
        const title = jenis
          ? `Analisis ${jenis.replace("_", " ").toUpperCase()}`
          : "Analisis Baru";
        const created = await api.create(title);
        if (!cancelled) {
          const nextUrl = jenis
            ? `/analisis/${created.id_analisis}?jenis=${jenis}&step=1`
            : `/analisis/${created.id_analisis}?step=1`;
          router.replace(nextUrl);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Gagal membuat sesi analisis baru");
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
  }, [jenis, router]);

  if (error) {
    return (
      <div className="max-w-md mx-auto my-20 p-6 border border-[#FF2E2E] bg-white text-center space-y-4 shadow-[6px_6px_0px_#FF2E2E]">
        <Mascot character="mu" pose="cover" face="sad" className="w-16 h-16 mx-auto" />
        <div className="font-mono-tech text-xs text-[#C40000] font-bold">
          ! GAGAL MEMBUAT SESI: {error}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white font-mono-tech text-xs font-bold hover:bg-[#003BFF]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-24 p-8 border border-black bg-white text-center space-y-4 shadow-[6px_6px_0px_#000000]">
      <Mascot character="sigi" pose="cast" face="happy" className="w-16 h-16 mx-auto" />
      <div className="w-8 h-8 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
      <div className="font-mono-tech text-xs font-bold uppercase tracking-wider text-black">
        MEMBUAT SESI ANALISIS (POST /analyses)...
      </div>
      <p className="font-sans text-xs text-black/60">
        Menyiapkan ruang kerja statistik deterministik dan pipeline AI.
      </p>
    </div>
  );
}
