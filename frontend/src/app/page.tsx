"use client";

import React from "react";
import { useLang } from "@/lib/useLang";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Preloader } from "@/components/sections/Preloader";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { ProblemPillars } from "@/components/sections/ProblemPillars";
import { ByDesign } from "@/components/sections/ByDesign";
import { InteractiveDemo } from "@/components/sections/InteractiveDemo";
import { QuoteMission } from "@/components/sections/QuoteMission";
import { Audience } from "@/components/sections/Audience";
import { AccuracyNews } from "@/components/sections/AccuracyNews";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/layout/Footer";
import { MascotWorld } from "@/components/mascot/MascotWorld";

export default function Home() {
  // Bahasa dibagi dengan halaman masuk/daftar lewat localStorage.
  const [lang, toggleLang] = useLang();

  return (
    <SmoothScroll>
      <Preloader />
      <div className="relative min-h-screen bg-[#000000] text-white selection:bg-[#003BFF] selection:text-white">
        <Navbar lang={lang} onToggleLang={toggleLang} />
        <main>
          <Hero lang={lang} />
          <ProblemPillars lang={lang} />
          <ByDesign lang={lang} />
          <InteractiveDemo lang={lang} />
          <QuoteMission lang={lang} />
          <Audience lang={lang} />
          <AccuracyNews lang={lang} />
          <FinalCTA lang={lang} />
        </main>
        <Footer lang={lang} />
        <MascotWorld lang={lang} />
      </div>
    </SmoothScroll>
  );
}
