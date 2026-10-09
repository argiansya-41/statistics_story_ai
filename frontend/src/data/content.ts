export type Language = "id" | "en";

export interface ContentData {
  nav: {
    brand: string;
    links: { label: string; href: string }[];
    cta: string;
    langToggle: string;
    menuOpen: string;
    menuClose: string;
  };
  hero: {
    tag: string;
    headline: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    statsBadge: string;
  };
  problem: {
    sectionTag: string;
    question: string;
    context: string;
    linkText: string;
    pillars: {
      id: string;
      color: "blue" | "red" | "yellow";
      badge: string;
      title: string;
      description: string;
    }[];
  };
  byDesign: {
    sectionTag: string;
    title: string;
    subtitle: string;
    blocks: {
      tag: string;
      title: string;
      description: string;
      features: string[];
      cta: string;
      ctaHref: string;
    }[];
  };
  demo: {
    sectionTag: string;
    title: string;
    subtitle: string;
    disclaimer: string;
    analysisOptions: string[];
    sampleDataLabel: string;
    resultLabel: string;
    narrationText: string;
    caseStudyTitle: string;
    caseStudyText: string;
    regenerateText: string;
  };
  quote: {
    quoteText: string;
    attribution?: string;
    role?: string;
    tag: string;
  };
  audience: {
    sectionTag: string;
    title: string;
    cta: string;
    cards: {
      category: string;
      title: string;
      description: string;
      points: string[];
      linkText: string;
    }[];
  };
  accuracy: {
    sectionTag: string;
    title: string;
    subtitle: string;
    mandatoryNote: string;
    items: {
      tag: string;
      title: string;
      metric: string;
      status: string;
      isPrepared?: boolean;
      actionText: string;
    }[];
  };
  finalCta: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    mascotHint: string;
    facts: { value: string; label: string }[];
  };
  footer: {
    tagline: string;
    builtBy: string;
    copyright: string;
    privacyPolicy: string;
    terms: string;
    links: { label: string; href: string }[];
  };
}

export const content: Record<Language, ContentData> = {
  id: {
    nav: {
      brand: "Statistics Story AI",
      links: [
        { label: "Masalah", href: "#masalah" },
        { label: "Fitur", href: "#by-design" },
        { label: "Cara Kerja", href: "#demo" },
        { label: "Akurasi", href: "#akurasi" },
        { label: "Untuk Siapa", href: "#untuk-siapa" },
      ],
      cta: "Coba Sekarang",
      langToggle: "EN",
      menuOpen: "MENU",
      menuClose: "TUTUP",
    },
    hero: {
      tag: "SISTEM INTERPRETASI STATISTIK CERDAS",
      headline: "Ubah angka menjadi cerita.",
      subheadline:
        "Statistics Story AI membaca hasil analisis statistikmu, lalu menjelaskannya dalam narasi, grafik, dan contoh kasus nyata, dalam bahasa Indonesia atau Inggris.",
      ctaPrimary: "Coba Sekarang",
      ctaSecondary: "Lihat cara kerjanya",
      statsBadge: "MODEL RAG TERVERIFIKASI · PUSTAKA SCIPY/STATSMODELS",
    },
    problem: {
      sectionTag: "PERSPEKTIF",
      question: "Bagaimana kalau setiap hasil statistik bisa menjelaskan dirinya sendiri?",
      context:
        "Mahasiswa umumnya sudah bisa menghitung mean, uji t, korelasi, dan regresi dengan SPSS, Excel, atau Python. Namun kesulitannya ada pada menerjemahkan angka dan tabel output menjadi kesimpulan yang bermakna dan akurat untuk laporan atau skripsi.",
      linkText: "Pelajari cara kerjanya",
      pillars: [
        {
          id: "bermakna",
          color: "blue",
          badge: "BERMAKNA",
          title: "Kesimpulan Siap Pakai",
          description:
            "Dari p-value, koefisien regresi, dan R² menjadi kesimpulan bahasa alami yang siap kamu tuliskan di laporan dan skripsi.",
        },
        {
          id: "terpercaya",
          color: "red",
          badge: "TERPERCAYA",
          title: "Bebas Halusinasi",
          description:
            "Penjelasan hanya bersumber dari panduan interpretasi statistik yang valid, bukan karangan bebas model AI.",
        },
        {
          id: "terjangkau",
          color: "yellow",
          badge: "TERJANGKAU",
          title: "Tanpa Kode & Rumit",
          description:
            "Cukup upload CSV/Excel atau ketik data langsung. Dapatkan grafik dan narasi tanpa perlu menguasai sintaks SPSS atau skrip.",
        },
      ],
    },
    byDesign: {
      sectionTag: "ARSITEKTUR PRODUK",
      title: "Statistik, dirancang untuk dipahami",
      subtitle:
        "Hitungan memakai pustaka komputasi standar, sementara narasi dipandu oleh sumber literatur statistik yang bisa dipertanggungjawabkan.",
      blocks: [
        {
          tag: "KOMPUTASI PRESISI",
          title: "Analisis by Design",
          description:
            "Perhitungan otomatis dan deterministik menggunakan SciPy dan statsmodels untuk statistik deskriptif, uji t (independent & paired), korelasi Pearson, dan regresi linear sederhana.",
          features: [
            "Validasi otomatis tipe data & outlier",
            "Uji asumsi normalitas & linieritas",
            "Keluaran tabel parameter p-value & R² standar",
          ],
          cta: "Lihat analisis",
          ctaHref: "#demo",
        },
        {
          tag: "RETRIEVAL-AUGMENTED GENERATION",
          title: "Narasi by Design",
          description:
            "Pipeline RAG menerjemahkan parameter angka menjadi narasi interpretatif berstruktur akademis, dilengkapi visualisasi grafik dinamis (scatter plot, histogram, diagram batang) dan analogi kasus nyata.",
          features: [
            "Penjelasan terpandu panduan statistik resmi",
            "Dukungan penuh dwibahasa (ID & EN)",
            "Penolakan otomatis pertanyaan di luar cakupan data",
          ],
          cta: "Lihat akurasi",
          ctaHref: "#akurasi",
        },
      ],
    },
    demo: {
      sectionTag: "SIMULASI INTERAKTIF",
      title: "Eksplorasi Alur Kerja Antarmuka",
      subtitle: "Lihat bagaimana data mentah ditransformasikan seketika menjadi visualisasi dan narasi.",
      disclaimer: "Ilustrasi antarmuka produk & simulasi data interaktif.",
      analysisOptions: [
        "Regresi Linear Sederhana",
        "Uji t Independen",
        "Korelasi Pearson",
        "Statistik Deskriptif",
      ],
      sampleDataLabel: "DATASET: PENGARUH JAM BELAJAR (X) TERHADAP SKOR UJIAN (Y)",
      resultLabel: "NARASI INTERPRETASI OTOMATIS",
      narrationText:
        "Terdapat pengaruh positif dan signifikan secara statistik antara Jam Belajar (X) terhadap Skor Ujian (Y), dengan koefisien regresi b = 4.25 (t = 3.84, p = 0.003 < 0.05). Nilai R² = 0.68 menunjukkan bahwa 68% variasi nilai ujian dapat dijelaskan oleh durasi belajar. Setiap penambahan satu jam belajar diprediksi meningkatkan nilai ujian sebesar 4.25 poin.",
      caseStudyTitle: "CONTOH KASUS & ANALOGI NYATA",
      caseStudyText:
        "Ibaratkan jam belajar seperti waktu latihan seorang musisi sebelum konser: setiap jam latihan terfokus secara konsisten meningkatkan kepastian dan ketepatan nada saat tampil di atas panggung.",
      regenerateText: "Simulasikan Ulang Analisis",
    },
    quote: {
      quoteText:
        "“Kami ingin setiap mahasiswa mampu menjelaskan angka, bukan hanya menghitungnya.”",
      attribution: "",
      role: "",
      tag: "PERNYATAAN MISI",
    },
    audience: {
      sectionTag: "TARGET PENGGUNA",
      title: "Dibuat untuk siapa saja yang bergulat dengan data",
      cta: "Hubungi Kami",
      cards: [
        {
          category: "PENGGUNA UTAMA",
          title: "Mahasiswa",
          description:
            "Pahami hasil statistik untuk laporan praktikum, tugas akhir, dan skripsi tanpa takut salah menafsirkan angka.",
          points: [
            "Membedakan arti p-value < 0.05 vs tidak signifikan",
            "Menuliskan paragraf pembahasan skripsi dengan tepat",
            "Ekspor visualisasi grafik siap pakai untuk dokumen",
          ],
          linkText: "Pelajari lebih lanjut",
        },
        {
          category: "PENGGUNA SEKUNDER",
          title: "Dosen & Peneliti Pemula",
          description:
            "Alat bantu demonstrasi interpretasi cepat di kelas statistik dan pemahaman komprehensif atas output komputasi data.",
          points: [
            "Bahan ajar interpretasi visual interaktif di kelas",
            "Validasi cepat pemahaman mahasiswa bimbingan",
            "Eksplorasi awal hubungan variabel penelitian",
          ],
          linkText: "Pelajari lebih lanjut",
        },
      ],
    },
    accuracy: {
      sectionTag: "BUKTI & EVALUASI",
      title: "Akurasi dan Hasil Pengujian Terbuka",
      subtitle: "Kami menyajikan hasil evaluasi secara transparan dan terukur sesuai batasan pengujian saat ini.",
      mandatoryNote: "Hasil uji awal pada knowledge base mini; evaluasi lebih luas sedang berjalan.",
      items: [
        {
          tag: "UJI AWAL RAG",
          title: "Akurasi Jawaban Interpretasi",
          metric: "Tanpa RAG 29% → Dengan RAG 100%",
          status: "Tercapai pada uji awal (knowledge base mini)",
          actionText: "Lihat Metodologi",
        },
        {
          tag: "KEANDALAN SISTEM",
          title: "Penolakan Pertanyaan di Luar Cakupan",
          metric: "3 dari 3 Pertanyaan Ditolak (100%)",
          status: "Tercapai pada uji awal",
          actionText: "Lihat Parameter",
        },
        {
          tag: "EVALUASI PENGGUNA",
          title: "Kemudahan Penggunaan & Manfaat",
          metric: "Target Skor SUS ≥ 68 & Respon Terbantu 70–80%",
          status: "Sedang disiapkan (Evaluasi ≥ 20 Mahasiswa)",
          isPrepared: true,
          actionText: "Lihat Rencana Uji",
        },
      ],
    },
    finalCta: {
      title: "Ubah angkamu menjadi cerita hari ini.",
      subtitle:
        "Unggah data, pilih analisis, lalu dapatkan narasi interpretatif lengkap dengan grafik dan contoh kasus nyata.",
      ctaPrimary: "Coba Sekarang",
      ctaSecondary: "Lihat cara kerjanya",
      mascotHint: "Klik kami untuk melihat ekspresi yang berbeda-beda.",
      facts: [
        { value: "4", label: "JENIS ANALISIS" },
        { value: "2", label: "BAHASA NARASI" },
        { value: "3", label: "JENIS GRAFIK" },
      ],
    },
    footer: {
      tagline: "Menghubungkan komputasi statistik presisi dengan narasi interpretatif yang manusiawi.",
      builtBy: "DIBUAT OLEH TIM BOCIL SIGMA · SEKOLAH VOKASI UNS",
      copyright: "© Statistics Story AI 2026. Hak Cipta Dilindungi.",
      privacyPolicy: "Kebijakan Privasi",
      terms: "Syarat Ketentuan",
      links: [
        { label: "MASALAH", href: "#masalah" },
        { label: "FITUR", href: "#by-design" },
        { label: "CARA KERJA", href: "#demo" },
        { label: "AKURASI", href: "#akurasi" },
        { label: "UNTUK SIAPA", href: "#untuk-siapa" },
      ],
    },
  },
  en: {
    nav: {
      brand: "Statistics Story AI",
      links: [
        { label: "Problem", href: "#masalah" },
        { label: "Features", href: "#by-design" },
        { label: "How It Works", href: "#demo" },
        { label: "Accuracy", href: "#akurasi" },
        { label: "Who It's For", href: "#untuk-siapa" },
      ],
      cta: "Try Now",
      langToggle: "ID",
      menuOpen: "MENU",
      menuClose: "CLOSE",
    },
    hero: {
      tag: "INTELLIGENT STATISTICAL INTERPRETATION SYSTEM",
      headline: "Turn numbers into stories.",
      subheadline:
        "Statistics Story AI reads your statistical analysis output and explains it in structured narratives, automatic charts, and real-world analogies, in Indonesian or English.",
      ctaPrimary: "Try Now",
      ctaSecondary: "See how it works",
      statsBadge: "VERIFIED RAG PIPELINE · SCIPY & STATSMODELS COMPLIANT",
    },
    problem: {
      sectionTag: "PERSPECTIVE",
      question: "What if every statistical result could explain itself?",
      context:
        "Students can calculate means, t-tests, correlations, and regressions using SPSS, Excel, or Python. Yet the greatest bottleneck is translating raw numbers and output tables into meaningful, sound conclusions for reports or theses.",
      linkText: "Learn how it works",
      pillars: [
        {
          id: "bermakna",
          color: "blue",
          badge: "MEANINGFUL",
          title: "Publication-Ready Insights",
          description:
            "From p-values, regression coefficients, and R² to articulate natural language narratives ready for your reports.",
        },
        {
          id: "terpercaya",
          color: "red",
          badge: "TRUSTWORTHY",
          title: "Grounded & Hallucination-Free",
          description:
            "Explanations are strictly sourced from statistical interpretation guidelines, not fabricated by LLMs.",
        },
        {
          id: "terjangkau",
          color: "yellow",
          badge: "ACCESSIBLE",
          title: "Code-Free Simplicity",
          description:
            "Simply upload CSV/Excel or type data directly. Generate charts and interpretations without mastering complex scripts.",
        },
      ],
    },
    byDesign: {
      sectionTag: "PRODUCT ARCHITECTURE",
      title: "Statistics, designed to be understood",
      subtitle:
        "Calculations leverage industry-standard computing libraries, while narratives are grounded in verifiable statistical literature.",
      blocks: [
        {
          tag: "PRECISION COMPUTING",
          title: "Analysis by Design",
          description:
            "Deterministic, automated computation powered by SciPy and statsmodels for descriptive statistics, independent & paired t-tests, Pearson correlation, and simple linear regression.",
          features: [
            "Automated data type checking & outlier scanning",
            "Normality & linearity assumption validation",
            "Standard p-value and R² output tables",
          ],
          cta: "Explore analysis",
          ctaHref: "#demo",
        },
        {
          tag: "RETRIEVAL-AUGMENTED GENERATION",
          title: "Narrative by Design",
          description:
            "A grounded RAG pipeline translates quantitative parameters into clear academic prose, accompanied by dynamic visualizations (scatter plots, histograms, bar charts) and relatable analogies.",
          features: [
            "Strictly verified domain literature retrieval",
            "Full bilingual support (English & Indonesian)",
            "Automatic out-of-scope question rejection",
          ],
          cta: "Review accuracy",
          ctaHref: "#akurasi",
        },
      ],
    },
    demo: {
      sectionTag: "INTERACTIVE DEMO",
      title: "Interactive Workflow Simulation",
      subtitle: "Experience how raw analytical data transforms instantly into visual charts and intuitive narrative prose.",
      disclaimer: "Product interface illustration & data simulation.",
      analysisOptions: [
        "Simple Linear Regression",
        "Independent t-Test",
        "Pearson Correlation",
        "Descriptive Statistics",
      ],
      sampleDataLabel: "DATASET: STUDY HOURS (X) VS EXAM SCORE (Y)",
      resultLabel: "AUTOMATED INTERPRETATIVE NARRATIVE",
      narrationText:
        "There is a statistically significant positive effect of Study Hours (X) on Exam Score (Y), with regression coefficient b = 4.25 (t = 3.84, p = 0.003 < 0.05). The R² of 0.68 indicates that 68% of the variance in exam score is explained by study hours. Each additional hour of study is associated with an expected increase of 4.25 points.",
      caseStudyTitle: "CASE STUDY & INTUITIVE ANALOGY",
      caseStudyText:
        "Think of study hours like rehearsal time before a piano recital: each dedicated hour methodically sharpens pitch precision and performance confidence on stage.",
      regenerateText: "Re-run Simulation",
    },
    quote: {
      quoteText:
        "“We want every student to be able to explain numbers, not just calculate them.”",
      attribution: "",
      role: "",
      tag: "MISSION STATEMENT",
    },
    audience: {
      sectionTag: "AUDIENCE",
      title: "Built for everyone who wrestles with data",
      cta: "Contact Us",
      cards: [
        {
          category: "PRIMARY USERS",
          title: "Students",
          description:
            "Confidently interpret statistical findings for lab reports, assignments, and undergraduate theses without misconstruing significance.",
          points: [
            "Clarify p-value < 0.05 vs non-significant findings",
            "Draft clear academic discussion sections",
            "Export publication-ready charts",
          ],
          linkText: "Learn more",
        },
        {
          category: "SECONDARY USERS",
          title: "Instructors & Novice Researchers",
          description:
            "A fast demonstrative tool for classroom interpretation and accelerated validation of computational analysis outputs.",
          points: [
            "Interactive visual teaching aid for classes",
            "Accelerate student advising and draft reviews",
            "Quick exploratory screening of variable trends",
          ],
          linkText: "Learn more",
        },
      ],
    },
    accuracy: {
      sectionTag: "VERIFICATION & METRICS",
      title: "Transparent Accuracy & Evaluation Results",
      subtitle: "We report our empirical findings objectively according to current development milestones.",
      mandatoryNote: "Preliminary test results on a mini knowledge base; wider evaluation is ongoing.",
      items: [
        {
          tag: "EARLY RAG TEST",
          title: "Interpretative Accuracy",
          metric: "Without RAG 29% → With RAG 100%",
          status: "Achieved in early trials (mini knowledge base)",
          actionText: "View Methodology",
        },
        {
          tag: "SYSTEM RELIABILITY",
          title: "Out-of-Scope Query Rejection",
          metric: "3 out of 3 Out-of-Scope Queries Rejected",
          status: "Achieved in initial tests",
          actionText: "View Parameters",
        },
        {
          tag: "USER EVALUATION",
          title: "Usability & Practical Value",
          metric: "Target SUS Score ≥ 68 & ≥ 70–80% Helpfulness",
          status: "Under preparation (Trial with ≥ 20 students)",
          isPrepared: true,
          actionText: "View Test Plan",
        },
      ],
    },
    finalCta: {
      title: "Turn your numbers into a story today.",
      subtitle:
        "Upload your data, pick an analysis, and get an interpretive narrative with charts and real-world examples.",
      ctaPrimary: "Try it now",
      ctaSecondary: "See how it works",
      mascotHint: "Click us to see different expressions.",
      facts: [
        { value: "4", label: "TYPES OF ANALYSIS" },
        { value: "2", label: "NARRATIVE LANGUAGES" },
        { value: "3", label: "CHART TYPES" },
      ],
    },
    footer: {
      tagline: "Bridging rigorous statistical computation with humane, insightful narrative.",
      builtBy: "BUILT BY TEAM BOCIL SIGMA · UNS VOCATIONAL SCHOOL",
      copyright: "© Statistics Story AI 2026. All rights reserved.",
      privacyPolicy: "Privacy Policy",
      terms: "Terms of Service",
      links: [
        { label: "PROBLEM", href: "#masalah" },
        { label: "FEATURES", href: "#by-design" },
        { label: "HOW IT WORKS", href: "#demo" },
        { label: "ACCURACY", href: "#akurasi" },
        { label: "WHO IT'S FOR", href: "#untuk-siapa" },
      ],
    },
  },
};
