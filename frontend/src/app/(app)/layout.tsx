"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { AppShell } from "@/components/layout/AppShell";
import { ImpactReveal } from "@/components/layout/ImpactReveal";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/masuk");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <>
      <ImpactReveal />
      {isLoading ? (
        <div className="min-h-screen bg-[#F4F4F4] text-black bg-blueprint-grid flex flex-col items-center justify-center p-6">
          <div className="border border-black bg-white p-8 max-w-sm w-full text-center space-y-4 shadow-[6px_6px_0px_#000000]">
            <div className="w-10 h-10 border-2 border-black border-t-[#003BFF] animate-spin mx-auto" />
            <div className="font-mono-tech text-xs font-bold uppercase tracking-wider text-black">
              MEMERIKSA SESI PENGGUNA...
            </div>
            <p className="font-sans text-xs text-black/60">
              Menghubungkan ke ruang kerja akademis Statistics Story AI.
            </p>
          </div>
        </div>
      ) : !isAuthenticated ? null : (
        <AppShell>{children}</AppShell>
      )}
    </>
  );
}

