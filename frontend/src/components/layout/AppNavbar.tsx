"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, BarChart2, FolderClock, LogOut, PlusCircle, Server, Sparkles, User } from "lucide-react";
import { getCurrentUser, logoutRequest, isAuthenticated, UserProfile } from "@/lib/auth";
import { isBackendConfigured } from "@/lib/api/client";
import { useLang } from "@/lib/useLang";

export const AppNavbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, toggleLang] = useLang();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLive(isBackendConfigured());
  }, []);

  const handleLogout = async () => {
    await logoutRequest();
    router.push("/masuk");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { href: "/analisis/baru", label: "Analisis Baru", icon: PlusCircle },
    { href: "/analisis/riwayat", label: "Riwayat", icon: FolderClock },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-black bg-white text-black">
      {/* Top Warning Banner for Demo Mode / Local Simulation */}
      {!isLive && (
        <div className="bg-[#EBEB00] border-b border-black px-4 py-1.5 text-center font-mono-tech text-[11px] font-bold tracking-wider text-black flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-black inline-block animate-pulse" />
          <span>MODE DEMO / SIMULASI LOKAL AKTIF: Menggunakan komputasi deterministik in-memory karena server backend FastAPI belum terhubung.</span>
        </div>
      )}

      <div className="flex h-16 md:h-18 items-center justify-between px-4 md:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 select-none group">
            <div className="w-9 h-9 border border-black bg-[#003BFF] flex items-center justify-center text-white transition-transform duration-200 group-hover:scale-105">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="square"
              >
                <path d="M3 20h18M3 20c4 0 6-1 7-7 1-6 2-10 2-10s1 4 2 10c1 6 3 7 7 7" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="font-mono-tech text-xs font-bold tracking-wider leading-none">STATISTICS STORY</div>
              <div className="font-mono-tech text-[10px] text-black/50 tracking-widest leading-tight">WORKSPACE</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 md:gap-2 ml-2 md:ml-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 font-mono-tech text-xs font-bold tracking-wider transition-colors border ${
                    isActive
                      ? "bg-black text-white border-black"
                      : "bg-transparent text-black border-transparent hover:border-black/20 hover:bg-[#F4F4F4]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side utilities: Mode indicator, Lang Switcher, User, Logout */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mode Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 border border-black font-mono-tech text-[10px] font-bold">
            <span className={`w-2 h-2 ${isLive ? "bg-[#00D084]" : "bg-[#EBEB00]"} border border-black inline-block`} />
            <span className="uppercase">{isLive ? "FastAPI 1.0 (Live)" : "Sandbox Lokal"}</span>
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLang}
            title="Ganti Bahasa Narasi / Tampilan"
            className="flex items-center gap-1 border border-black px-2.5 py-1 font-mono-tech text-[11px] font-bold tracking-wider hover:bg-[#EBEB00] transition-colors"
          >
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* User profile */}
          <div className="flex items-center gap-2 px-2.5 py-1 border border-black/20 bg-[#F8F8F8]">
            <div className="w-6 h-6 bg-black text-white font-mono-tech text-xs font-bold flex items-center justify-center">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-mono-tech text-[11px] font-bold leading-none truncate max-w-[120px]">
                {user?.name || "Pengguna"}
              </div>
              <div className="font-mono-tech text-[9px] text-black/50 leading-none mt-0.5 capitalize">
                {user?.role || "mahasiswa"}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar dari sesi"
            className="border border-black p-2 hover:bg-[#FF2E2E] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
