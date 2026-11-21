"use client";

import React from "react";
import { BookOpen, Lightbulb, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface CaseStudyPanelProps {
  contohKasus?: string[] | string | null;
}

interface ParsedBullet {
  title: string;
  content: string;
  badgeClass: string;
}

interface ParsedCaseStudy {
  scenario: string;
  points: ParsedBullet[];
  note?: string;
}

/**
 * Mengkategorikan poin analogi agar memiliki badge judul & warna yang jelas
 */
function categorizeBullet(bullet: string): ParsedBullet {
  const lower = bullet.toLowerCase();

  // Bersihkan awalan tanda '-' atau bullet jika masih terbawa
  const cleanContent = bullet.replace(/^[-*•\s]+/, "").trim();

  if (lower.includes("intersep") || lower.includes("titik potong") || lower.includes("nilai dasar")) {
    return {
      title: "Nilai Dasar (Intersep)",
      content: cleanContent,
      badgeClass: "bg-[#003BFF] text-white border-black",
    };
  }
  if (lower.includes("koefisien") || lower.includes("slope") || lower.includes("kenaikan") || lower.includes("penambahan")) {
    return {
      title: "Tingkat Pengaruh (Slope)",
      content: cleanContent,
      badgeClass: "bg-[#EBEB00] text-black border-black",
    };
  }
  if (lower.includes("r-squared") || lower.includes("r²") || lower.includes("variasi")) {
    return {
      title: "Daya Jelajah Model (R²)",
      content: cleanContent,
      badgeClass: "bg-emerald-600 text-white border-black",
    };
  }
  if (lower.includes("p-value") || lower.includes("signifikan")) {
    return {
      title: "Kepastian Ilmiah (P-Value)",
      content: cleanContent,
      badgeClass: "bg-purple-700 text-white border-black",
    };
  }
  if (lower.includes("korelasi") || lower.includes("keeratan") || lower.includes("arah")) {
    return {
      title: "Keeratan Hubungan (r)",
      content: cleanContent,
      badgeClass: "bg-[#003BFF] text-white border-black",
    };
  }
  if (lower.includes("rata-rata") || lower.includes("mean") || lower.includes("selisih")) {
    return {
      title: "Perbandingan Rata-Rata",
      content: cleanContent,
      badgeClass: "bg-[#FF2E2E] text-white border-black",
    };
  }

  return {
    title: "Poin Analogi",
    content: cleanContent,
    badgeClass: "bg-black text-white border-black",
  };
}

/**
 * Parser cerdas untuk memecah teks analogi yang panjang menjadi:
 * 1. Skenario pengantar cerita
 * 2. Poin-poin pemaknaan angka (diurai dari tanda '-' atau kalimat terpisah)
 * 3. Catatan pengingat metodologis (caveat)
 */
function parseCaseStudyText(rawText: string): ParsedCaseStudy {
  let text = rawText.trim();
  let note: string | undefined = undefined;

  // Cek apakah ada penutup / catatan pengingat (caveat)
  const caveatMarkers = [
    "Namun, penting diingat",
    "Namun penting diingat",
    "Penting untuk diingat",
    "Catatan penting:",
    "Catatan:",
    "Ingat bahwa",
    "Perlu dicatat bahwa",
    "Sebagai catatan,",
  ];

  for (const marker of caveatMarkers) {
    const idx = text.indexOf(marker);
    if (idx !== -1) {
      note = text.substring(idx).trim();
      text = text.substring(0, idx).trim();
      break;
    }
  }

  // 1. Cek pemisah bullet '-' atau '*'
  if (text.includes(" - ") || text.includes("\n- ") || text.includes("\n* ") || text.includes("; - ")) {
    const firstBulletIdx = text.search(/(\s-\s|\n-\s|\n\*\s|;\s-\s)/);
    if (firstBulletIdx !== -1) {
      const intro = text.substring(0, firstBulletIdx).trim();
      const rest = text.substring(firstBulletIdx).trim();
      const parts = rest
        .split(/(?:\s-\s|\n-\s|\n\*\s|;\s-\s)/)
        .map((p) => p.trim())
        .filter(Boolean);

      return {
        scenario: intro,
        points: parts.map((bullet) => categorizeBullet(bullet)),
        note,
      };
    }
  }

  // 2. Cek apakah ada pemisahan baris baru (\n)
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    return {
      scenario: lines[0],
      points: lines.slice(1).map((l) => categorizeBullet(l)),
      note,
    };
  }

  // 3. Jika satu paragraf utuh tanpa bullet, coba pisahkan kalimat
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (sentences && sentences.length >= 3) {
    const scenario = sentences.slice(0, 2).join(" ").trim();
    const remaining = sentences.slice(2).map((s) => s.trim()).filter(Boolean);
    return {
      scenario,
      points: remaining.map((r) => categorizeBullet(r)),
      note,
    };
  }

  return {
    scenario: text,
    points: [],
    note,
  };
}

export const CaseStudyPanel: React.FC<CaseStudyPanelProps> = ({ contohKasus }) => {
  const hasData =
    Boolean(contohKasus) &&
    (typeof contohKasus === "string" ? contohKasus.trim() !== "" : contohKasus!.length > 0);

  const items = Array.isArray(contohKasus)
    ? contohKasus
    : contohKasus
    ? [contohKasus]
    : [];

  return (
    <div className="border border-black bg-white shadow-[3px_3px_0px_#000000]">
      {/* Header Panel */}
      <div className="bg-[#EFEFEF] border-b border-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black text-white flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono-tech text-xs font-bold text-black uppercase">
            CONTOH KASUS & ANALOGI DUNIA NYATA
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#EBEB00] border border-black text-black font-mono-tech text-[10px] font-bold uppercase">
          <Sparkles className="w-3 h-3" />
          <span>RAMAH PEMULA</span>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {!hasData ? (
          <div className="text-center font-mono-tech text-xs text-black/50 py-8 border border-dashed border-black/30">
            Contoh kasus atau analogi belum tersedia untuk hasil analisis ini.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((rawItem, idx) => {
              const parsed = parseCaseStudyText(rawItem);

              return (
                <div
                  key={idx}
                  className="border border-black bg-white shadow-[2px_2px_0px_#000000] overflow-hidden"
                >
                  {/* Sub-Header Skenario */}
                  <div className="bg-[#F8FAFC] border-b border-black px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#EBEB00] border border-black text-black flex items-center justify-center shrink-0">
                        <Lightbulb className="w-3 h-3" />
                      </div>
                      <span className="font-mono-tech text-xs font-bold text-black uppercase">
                        KASUS & ANALOGI #{idx + 1}
                      </span>
                    </div>
                    <span className="font-mono-tech text-[10px] text-black/40 uppercase hidden sm:inline">
                      STUDI KASUS ILUSTRATIF
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Skenario Utama */}
                    <div className="bg-[#F4F6F9] border border-black/20 p-3.5 sm:p-4">
                      <div className="font-mono-tech text-[10px] font-bold text-black/60 uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#003BFF] inline-block" />
                        <span>Skenario Dalam Kehidupan Nyata:</span>
                      </div>
                      <p className="font-sans text-sm sm:text-base text-black/90 leading-relaxed font-medium">
                        {parsed.scenario}
                      </p>
                    </div>

                    {/* Poin-Poin Penjelasan Angka (Disajikan Rapi dan Tidak Bertumpuk) */}
                    {parsed.points.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="font-mono-tech text-[10px] font-bold text-black/60 uppercase">
                          Rincian Arti Angka Statistik:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {parsed.points.map((pt, pIdx) => (
                            <div
                              key={pIdx}
                              className="p-3 bg-white border border-black/30 space-y-1.5 shadow-[1px_1px_0px_#000000]/10 flex flex-col justify-start"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block px-2 py-0.5 font-mono-tech text-[9px] font-bold uppercase border ${pt.badgeClass}`}
                                >
                                  {pt.title}
                                </span>
                              </div>
                              <p className="font-sans text-xs sm:text-sm text-black/85 leading-relaxed">
                                {pt.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catatan / Peringatan Penting (Jika Ada) */}
                    {parsed.note && (
                      <div className="p-3 bg-[#FFFDE6] border border-black/30 flex items-start gap-2.5 text-xs text-black/85">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-mono-tech uppercase font-bold text-black block mb-0.5">
                            Pengingat Penting:
                          </strong>
                          <span className="font-sans leading-relaxed">{parsed.note}</span>
                        </div>
                      </div>
                    )}

                    {/* Ringkasan Kesimpulan Cepat */}
                    <div className="flex items-center gap-2 pt-1 font-mono-tech text-[11px] text-black/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        Analogi ini dirancang untuk memudahkan pemahaman konsep tanpa mengurangi ketepatan angka matematis.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
