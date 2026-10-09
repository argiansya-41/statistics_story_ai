"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { HistogramGlyph } from "../ui/HistogramGlyph";
import { content, Language } from "@/data/content";
import { APP_URL } from "@/data/links";

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ lang, onToggleLang }) => {
  const [navTheme, setNavTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = content[lang].nav;

  useEffect(() => {
    let lastScroll = 0;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // Keep navbar fixed and visible at the top to showcase scroll inversion across sections

      // Find section currently under the navbar (~75px from top)
      const sections = document.querySelectorAll("section");
      let activeTheme: "light" | "dark" = "light";

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        // If the top of the section is at or above 75px and the bottom is below 75px
        if (rect.top <= 75 && rect.bottom >= 75) {
          const explicitTheme = sec.getAttribute("data-theme");
          if (explicitTheme === "dark" || explicitTheme === "light") {
            activeTheme = explicitTheme;
          } else {
            const isDark =
              sec.classList.contains("bg-[#000000]") ||
              sec.classList.contains("bg-black") ||
              sec.classList.contains("text-white");
            activeTheme = isDark ? "dark" : "light";
          }
        }
      });

      setNavTheme(activeTheme);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileMenuOpen]);

  const isLight = navTheme === "light";

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50">
      {/* Main Nav Container */}
      <div
        className={`w-full transition-colors duration-200 ${
          isLight
            ? "bg-white text-black"
            : "bg-[#000000] text-white"
        }`}
      >
        <div className="flex items-start justify-between relative w-full">
          {/* Stepped Logo Box with Downward Notch (Anak Tangga di Bawah Logo) */}
          <div
            className={`shrink-0 flex items-center px-4 md:px-7 h-[76px] md:h-[88px] border-r border-b transition-colors duration-200 z-20 ${
              isLight
                ? "bg-white text-black border-black hover:bg-[#F4F4F4]"
                : "bg-[#000000] text-white border-white/20 hover:bg-white/5"
            }`}
          >
            <Link
              href="#"
              className="flex items-center gap-3 select-none group"
            >
              {/* Bell Curve SVG Mark */}
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
                <span className="font-display font-normal text-sm md:text-base tracking-tight leading-tight flex items-center gap-1.5">
                  Statistics Story <span className="text-[#003BFF] font-medium">AI</span>
                </span>
                <span
                  className={`font-mono-tech text-[8px] tracking-wider hidden sm:inline ${
                    isLight ? "text-black/50" : "text-white/50"
                  }`}
                >
                  INTERPRETATION CORE
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links & Action Items with 1px Bottom Border connecting to Logo's right border */}
          <div
            className={`flex-1 flex items-stretch justify-between h-14 md:h-16 border-b transition-colors duration-200 ${
              isLight ? "border-black" : "border-white/20"
            }`}
          >
            {/* Desktop Navigation Links (Cell grid with 1px right border) */}
            <nav className="hidden lg:flex items-stretch divide-x divide-current">
              {t.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-5 font-mono-tech text-xs tracking-widest transition-colors duration-150 border-r uppercase ${
                    isLight
                      ? "text-black border-black hover:bg-[#EBEB00] hover:text-black"
                      : "text-white border-white/20 hover:bg-[#EBEB00] hover:text-black"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Action Items (Lang switcher & CTA) */}
            <div className="flex items-stretch divide-x divide-current ml-auto">
              {/* Login */}
              <a
                href="/masuk"
                className={`hidden sm:flex items-center px-4 md:px-6 font-mono-tech text-xs font-bold tracking-widest uppercase transition-colors border-r ${
                  isLight
                    ? "text-black border-black hover:bg-[#EBEB00] hover:text-black"
                    : "text-white border-white/20 hover:bg-[#EBEB00] hover:text-black"
                }`}
              >
                {lang === "id" ? "Masuk" : "Log in"}
              </a>

              {/* Language Toggle */}
              <button
                onClick={onToggleLang}
                aria-label="Toggle language"
                className={`flex items-center gap-2 px-4 md:px-6 font-mono-tech text-xs font-bold transition-colors cursor-pointer border-r ${
                  isLight
                    ? "text-black border-black hover:bg-[#EBEB00] hover:text-black"
                    : "text-white border-white/20 hover:bg-[#EBEB00] hover:text-black"
                }`}
              >
                <span className={lang === "id" ? (isLight ? "text-black font-extrabold" : "text-[#EBEB00]") : "opacity-40"}>
                  ID
                </span>
                <span className="opacity-30">/</span>
                <span className={lang === "en" ? (isLight ? "text-black font-extrabold" : "text-[#EBEB00]") : "opacity-40"}>
                  EN
                </span>
              </button>

              {/* Desktop CTA Button */}
              <div className="hidden sm:flex items-center px-4 md:px-6">
                <a
                  href={APP_URL}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-[#EBEB00] text-black font-mono-tech text-xs font-bold tracking-widest border border-black hover:bg-black hover:text-white transition-colors duration-150 select-none"
                >
                  <span>{t.cta}</span>
                  <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </a>
              </div>

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`flex lg:hidden items-center justify-center px-6 font-mono-tech text-xs font-bold tracking-widest transition-colors border-l uppercase ${
                  isLight
                    ? "bg-white text-black border-black hover:bg-[#EBEB00]"
                    : "bg-black text-white border-white/20 hover:bg-white/10"
                }`}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? t.menuClose : t.menuOpen}
              </button>
            </div>
          </div>
        </div>
      </div>
      </header>

      {/* Fullscreen Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-[#000000] text-white flex flex-col justify-between pt-24 pb-12 px-8 lg:hidden transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col divide-y divide-white/15">
          {t.links.map((link, idx) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-5 font-display text-2xl font-normal tracking-[-0.025em] text-white hover:text-[#EBEB00] transition-colors flex items-center justify-between"
              style={{ transitionDelay: `${idx * 40}ms` }}
            >
              <span>{link.label}</span>
              <span className="font-mono-tech text-xs text-white/40">0{idx + 1}</span>
            </a>
          ))}
        </div>

        <div className="pt-8 border-t border-white/15 flex flex-col gap-4">
          <a
            href="/masuk"
            className="w-full text-center py-4 border border-white/40 text-white font-mono-tech text-sm font-bold tracking-widest hover:bg-white hover:text-black transition-colors"
          >
            {lang === "id" ? "MASUK" : "LOG IN"}
          </a>
          <a
            href={APP_URL}
            className="w-full text-center py-4 bg-[#EBEB00] text-black font-mono-tech text-sm font-bold tracking-widest border border-black hover:bg-white transition-colors"
          >
            {t.cta} →
          </a>
          <div className="flex items-center justify-between text-xs font-mono-tech text-white/50 pt-2">
            <span>STATISTICS STORY AI</span>
            <HistogramGlyph size="sm" variant="default" />
          </div>
        </div>
      </div>
    </>
  );
};
