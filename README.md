# Statistics Story AI

Platform analisis dan visualisasi narasi statistik interaktif bertenaga AI dengan estetika blueprint teknikal, animasi presisi, dan maskot dinamis (Sigi, Mu, Quin).

---

## 📁 Struktur Direktori

Repository ini terorganisir menjadi tiga aplikasi utama beserta dokumen spesifikasi:

```text
statistics_story_ai/
├── frontend/                     # Aplikasi Web Frontend (Next.js 16 App Router)
│   ├── src/
│   │   ├── app/                  # Rute halaman (Landing, Auth, Dasbor, Analisis, Riwayat)
│   │   ├── components/           # Komponen UI, layout, animasi, maskot, analisis
│   │   ├── data/                 # Konten multi-bahasa & skrip maskot
│   │   └── lib/                  # Utilitas, validasi, & client helper API
│   ├── public/                   # Aset statis publik
│   ├── docs/                     # Dokumentasi teknis & audit paritas
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── .env.local                # Konfigurasi NEXT_PUBLIC_API_URL
├── backend/                      # Layanan Backend FastAPI & AI Storytelling
│   ├── main.py                   # Server FastAPI, rute auth & analisis statistik
│   ├── test_fr_compliance.py     # Suite pengujian fungsional FR-01 s.d FR-17
│   ├── requirements.txt          # Dependensi Python (FastAPI, SciPy, Google GenAI)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .env                      # Konfigurasi database & AI API Keys
├── mobile/                       # Aplikasi Mobile Multiplatform (Flutter)
│   ├── lib/                      # Kode sumber aplikasi Flutter
│   │   ├── core/                 # Tema, network, storage, dan widget premium
│   │   └── features/             # Fitur Splash, Auth, Dasbor, Analisis, Showcase
│   ├── assets/decor/             # Aset visual SVG dekoratif
│   ├── docs/                     # Referensi desain & dokumentasi mobile
│   └── pubspec.yaml              # Dependensi Flutter
├── SKPL_Statistics_Story_AI.md   # Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS)
├── run-backend.bat               # Skrip praktis peluncur server backend
├── run-frontend.bat              # Skrip praktis peluncur aplikasi frontend web
├── run-mobile.bat                # Skrip praktis peluncur aplikasi mobile
└── README.md
```

---

## 🔗 Integrasi Frontend & Backend

Frontend dan Backend berkomunikasi melalui HTTP REST API:
1. **Frontend (`frontend/.env.local`)**:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```
2. **Backend (`backend/.env`)**:
   ```env
   FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   DATABASE_URL=sqlite:///./statistics_story_ai.db
   SECRET_KEY=kunci_rahasia_jwt
   ```

---

## 🚀 Panduan Menjalankan Sistem

Anda dapat menjalankan masing-masing komponen langsung melalui file launcher di root:
- `run-backend.bat` : Menjalankan backend FastAPI di `http://127.0.0.1:8000`
- `run-frontend.bat`: Menjalankan frontend Next.js di `http://localhost:3000`
- `run-mobile.bat`  : Memeriksa dependensi dan menjalankan aplikasi Flutter mobile

Atau jalankan secara manual melalui terminal:

### 1. Menjalankan Backend (FastAPI)

Masuk ke folder `backend`:
```powershell
cd backend
```

Buat dan aktifkan virtual environment (jika belum):
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Pasang dependensi:
```powershell
pip install -r requirements.txt
```

Jalankan server Uvicorn:
```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
# atau
python main.py
```
> Backend aktif di `http://127.0.0.1:8000` (Dokumentasi API interaktif di `http://127.0.0.1:8000/docs`).

---

### 2. Menjalankan Frontend (Next.js)

Buka terminal baru dan masuk ke folder `frontend`:
```powershell
cd frontend
```

Pasang dependencies (jika belum):
```powershell
npm install
# atau pnpm install
```

Jalankan frontend:
```powershell
npm run dev
# atau pnpm dev
```
> Frontend aktif di `http://localhost:3000` dan secara otomatis tersambung ke backend di `http://127.0.0.1:8000`.

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

### 3. Menjalankan Mobile App (Flutter)

Buka terminal baru dan masuk ke folder `mobile`:
```powershell
cd mobile
```

Ambil dependensi Flutter:
```powershell
flutter pub get
```

Jalankan aplikasi (pilih target Chrome / Edge / Windows / Emulator Android):
```powershell
flutter run
```

---

## 🌐 Rute Halaman Frontend

- `/` : Landing page interaktif dengan Generative Canvas, Arena Maskot, Demo Analisis, dan Filosofi Produk.
- `/masuk` : Halaman Login dengan panggung maskot reaktif dan transisi mosaik piksel.
- `/daftar` : Halaman Registrasi akun dengan pengukur kekuatan sandi dan konfeti sukses.
- `/lupa-sandi` : Halaman Pemulihan akun dan permintaan reset tautan.
- `/dashboard` : Dashboard utama pengguna berisi ringkasan metrik dan daftar analisis terbaru.
- `/analisis/baru` : Modul analisis statistik baru dengan dukungan upload CSV/Excel, input manual, dan validasi data instan.
- `/analisis/[id]` : Laporan hasil analisis lengkap dengan kartu statistik, visualisasi grafik, narasi interpretatif AI, dan studi kasus.
- `/analisis/riwayat` : Riwayat seluruh analisis statistik yang telah disimpan dengan fitur filter dan pencarian.

---

## 🛠️ Teknologi yang Digunakan (Frontend)

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animasi & Interaksi**: GSAP, Lenis Smooth Scroll, Lucide Icons
