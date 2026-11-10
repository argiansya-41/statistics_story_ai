"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api/analysesApi";
import { MascotWorld } from "@/components/mascot/MascotWorld";
import {
  LayoutDashboard,
  PlusSquare,
  History,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { user, logout } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Saklar simulasi AI gagal di mode demo
  const isDemo = api.isDemoMode();
  const [simFail, setSimFail] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setSimFail(api.getSimulateAiFailure());
    }
  }, [isDemo]);

  const handleToggleSimFail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setSimFail(val);
    api.setSimulateAiFailure(val);
  };

  const navItems = [
    {
      href: "/dasbor",
      label: "Dasbor",
      icon: LayoutDashboard,
      active: pathname === "/dasbor" || pathname === "/dashboard",
    },
    {
      href: "/analisis/baru",
      label: "Analisis Baru",
      icon: PlusSquare,
      active: pathname === "/analisis/baru" || (pathname.startsWith("/analisis/") && !pathname.includes("/riwayat")),
    },
    {
      href: "/riwayat",
      label: "Riwayat",
      icon: History,
      active: pathname === "/riwayat" || pathname === "/analisis/riwayat",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-black flex flex-col md:flex-row">
      {/* =========================================================================
          DESKTOP SIDEBAR (Hitam Berkisi, Sudut 0px, Monospace Label)
         ========================================================================= */}
      <aside className="hidden md:flex flex-col justify-between w-64 xl:w-72 h-screen sticky top-0 self-start bg-black text-white border-r border-black shrink-0 z-30 select-none">
        {/* Bagian Atas: Logo, Mode Demo, dan Navigasi Utama (Scrollable jika layar pendek) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Kotak Logo Bertangga Seperti Navbar */}
          <div className="flex items-center px-6 h-20 border-b border-white/20 bg-black sticky top-0 z-10">
            <Link href="/dasbor" className="flex items-center gap-3 group">
              <svg
                className="w-5 h-5 text-[#003BFF] transition-transform duration-300 group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="square"
              >
                <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
              </svg>
              <div className="flex flex-col">
                <span className="font-display font-normal text-base tracking-tight text-white leading-tight">
                  Statistics Story <span className="text-[#003BFF] font-bold">AI</span>
                </span>
                <span className="font-mono-tech text-[9px] tracking-widest text-white/50 uppercase">
                  WORKSPACE
                </span>
              </div>
            </Link>
          </div>

          {/* Mode Demo Indicator & Saklar Simulasi AI Gagal */}
          {isDemo && (
            <div className="p-4 border-b border-white/15 bg-white/5 space-y-3">
              <div className="flex items-start gap-2 border border-[#EBEB00] bg-[#EBEB00]/10 p-2.5 font-mono-tech text-[10px] text-[#EBEB00] leading-tight">
                <span className="w-2 h-2 mt-0.5 bg-[#EBEB00] shrink-0 inline-block" />
                <span>
                  <strong>MODE DEMO</strong>: data tidak dikirim atau disimpan ke server eksternal.
                </span>
              </div>

              {/* Saklar Simulasikan AI Gagal */}
              <label className="flex items-center justify-between gap-2 p-2 border border-white/20 bg-black cursor-pointer hover:border-white/40 transition-colors">
                <div className="flex items-center gap-1.5 font-mono-tech text-[10px] text-white/80">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF2E2E]" />
                  <span>Simulasi AI Gagal</span>
                </div>
                <input
                  type="checkbox"
                  checked={simFail}
                  onChange={handleToggleSimFail}
                  className="w-4 h-4 accent-[#FF2E2E] cursor-pointer rounded-none"
                />
              </label>
            </div>
          )}

          {/* Navigasi Utama */}
          <nav className="p-4 space-y-2">
            <div className="font-mono-tech text-[10px] text-white/40 tracking-widest uppercase px-3 py-1 font-bold">
              NAVIGASI UTAMA
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 font-mono-tech text-xs tracking-wider font-bold transition-all border ${
                    item.active
                      ? "bg-[#EBEB00] text-black border-black shadow-[3px_3px_0px_#003BFF]"
                      : "text-white/80 border-transparent hover:border-white/30 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card & Tombol Keluar di Bawah (Selalu Tetap / Pinned di Dasar Layar) */}
        <div className="shrink-0 p-4 border-t border-white/20 bg-black space-y-3">
          <div className="border border-white/20 bg-white/5 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 bg-[#00D084] inline-block" />
              <span className="font-mono-tech text-[9px] uppercase tracking-wider text-white/60">
                PROFIL TERAUTENTIKASI
              </span>
            </div>
            <div className="font-display text-sm font-normal text-white truncate">
              {user?.name || "Mahasiswa"}
            </div>
            <div className="font-mono-tech text-[11px] text-white/50 truncate">
              {user?.email || "mahasiswa@uns.ac.id"}
            </div>
            <div className="mt-2">
              <span className="font-mono-tech text-[9px] uppercase font-bold px-1.5 py-0.5 border border-white/30 bg-black text-[#EBEB00]">
                {user?.role || "Mahasiswa"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-white/30 text-white font-mono-tech text-xs font-bold hover:bg-[#FF2E2E] hover:border-[#FF2E2E] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOPBAR & DRAWER
         ========================================================================= */}
      <div className="md:hidden flex items-center justify-between h-14 bg-white border-b border-black px-4 z-40 sticky top-0">
        <Link href="/dasbor" className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[#003BFF]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
          </svg>
          <span className="font-display text-base font-normal">
            Statistics Story <span className="text-[#003BFF]">AI</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          className="p-2 border border-black bg-white hover:bg-[#EBEB00] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 bg-black text-white z-50 flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isDemo && (
              <div className="border border-[#EBEB00] bg-[#EBEB00]/10 p-3 font-mono-tech text-xs text-[#EBEB00]">
                MODE DEMO: data tidak dikirim atau disimpan.
              </div>
            )}

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 font-mono-tech text-sm font-bold border ${
                      item.active
                        ? "bg-[#EBEB00] text-black border-black"
                        : "text-white border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {isDemo && (
              <label className="flex items-center justify-between p-3 border border-white/20 bg-white/5 font-mono-tech text-xs">
                <span>Simulasikan AI Gagal:</span>
                <input
                  type="checkbox"
                  checked={simFail}
                  onChange={handleToggleSimFail}
                  className="w-4 h-4 accent-[#FF2E2E]"
                />
              </label>
            )}
          </div>

          <div className="shrink-0 p-6 border-t border-white/20 bg-black space-y-4">
            <div className="font-mono-tech text-xs text-white/70">
              Masuk sebagai: <strong>{user?.name || "Mahasiswa"}</strong> ({user?.email})
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full py-3 bg-[#FF2E2E] text-white font-mono-tech text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          AREA KONTEN TERANG BERKISI (bg-blueprint-grid)
         ========================================================================= */}
      <main className="flex-1 min-w-0 min-h-screen bg-[#F4F4F4] text-black bg-blueprint-grid relative pb-20">
        {children}
      </main>

      {/* Arena Maskot (MascotWorld Bahasa ID) */}
      <MascotWorld lang="id" />
    </div>
  );
};
