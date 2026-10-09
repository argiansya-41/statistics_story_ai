# Statistics Story AI

Platform analisis dan visualisasi narasi statistik interaktif bertenaga AI dengan estetika blueprint teknikal, animasi presisi, dan maskot dinamis (Sigi, Mu, Quin).

---

## 📁 Struktur Direktori

Repository ini dipisahkan menjadi dua bagian utama:

```text
statistics_story_ai/
├── frontend/               # Aplikasi Web Frontend (Next.js 16 App Router)
│   ├── src/
│   │   ├── app/            # Rute halaman (/ , /masuk, /daftar, /lupa-sandi)
│   │   ├── components/     # Komponen UI, layout, animasi, maskot, auth
│   │   ├── data/           # Konten multi-bahasa & skrip maskot
│   │   └── lib/            # Utilitas, validasi, & client helper
│   ├── public/             # Aset statis publik
│   ├── docs/               # Dokumentasi teknis & parity audit
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
├── backend/                # Layanan Backend & API (Direncanakan terpisah)
├── PRD_Statistics_Story_AI.md # Product Requirements Document (PRD)
└── README.md
```

---

## 🚀 Panduan Memulai (Frontend)

### Prasyarat
- Node.js >= 20.x
- `pnpm` (disarankan) atau `npm`

### Instalasi & Menjalankan Lokal

Masuk ke folder `frontend`:

```bash
cd frontend
```

Pasang dependencies:

```bash
pnpm install
# atau
npm install
```

Jalankan server pengembangan:

```bash
pnpm dev
# atau
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🌐 Rute Halaman Frontend

- `/` : Landing page interaktif dengan Generative Canvas, Arena Maskot, Demo Analisis, dan Filosofi Produk.
- `/masuk` : Halaman Login dengan panggung maskot reaktif dan transisi mosaik piksel.
- `/daftar` : Halaman Registrasi akun dengan pengukur kekuatan sandi dan konfeti sukses.
- `/lupa-sandi` : Halaman Pemulihan akun dan permintaan reset tautan.

---

## 🛠️ Teknologi yang Digunakan (Frontend)

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animasi & Interaksi**: GSAP, Lenis Smooth Scroll, Lucide Icons
