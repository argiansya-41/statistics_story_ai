import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Statistics Story AI — Ubah Angka Menjadi Cerita",
  description:
    "Statistics Story AI membaca hasil analisis statistikmu, lalu menjelaskannya dalam narasi terstruktur, grafik otomatis, dan analogi kasus nyata.",
  keywords: [
    "statistik",
    "interpretasi statistik",
    "skripsi",
    "uji t",
    "regresi linear",
    "korelasi",
    "RAG",
    "AI statistik",
    "edutech",
  ],
  authors: [{ name: "Statistics Story AI" }],
  openGraph: {
    title: "Statistics Story AI — Ubah Angka Menjadi Cerita",
    description:
      "Penjelasan statistik berbasis RAG yang akurat, deterministik, dan terpercaya untuk mahasiswa dan akademisi.",
    url: "https://statisticsstory.ai",
    siteName: "Statistics Story AI",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Statistics Story AI — Ubah Angka Menjadi Cerita",
    description:
      "Tutup kesenjangan antara menghitung statistik dan menjelaskan hasilnya.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${interTight.variable} ${jetBrainsMono.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-[#000000] text-[#FFFFFF] antialiased selection:bg-[#003BFF] selection:text-white font-sans font-normal">
        {children}
      </body>
    </html>
  );
}
