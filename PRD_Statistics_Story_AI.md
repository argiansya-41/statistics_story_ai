# PRD — Statistics Story AI

| | |
|---|---|
| **Produk** | Statistics Story AI |
| **Tim** | Bocil Sigma — D3 Teknik Informatika, Sekolah Vokasi UNS (Kab. Madiun) |
| **Dosen / Sponsor** | Darmawan Lahru Riatma, S.Kom., M.MT |
| **Metode pengembangan** | Scrum |
| **Jadwal proyek** | 16 minggu, 24 Agustus – 13 Desember 2026 |
| **Status dokumen** | Draf v0.1 |
| **Sumber** | Laporan Statistics Story AI (rujukan: SKPL, Rencana & Kontrak, Project Charter) |

> Butir bertanda **[Konfirmasi]** tidak ada di laporan; itu asumsi saya dan perlu dicek terhadap SKPL/Kontrak sebelum dianggap final.

---

## 1. Ringkasan

Statistics Story AI adalah aplikasi web yang menerima data atau output statistik, lalu menghasilkan **narasi interpretatif**, **visualisasi grafik otomatis**, dan **contoh kasus/analogi nyata**. Produk ini menutup kesenjangan antara kemampuan *menghitung* statistik dan kemampuan *menjelaskan* hasilnya.

## 2. Latar Belakang dan Masalah

Mahasiswa umumnya sudah bisa menghitung mean, uji t, korelasi, dan regresi dengan Excel, SPSS, Python, atau R. Kesulitannya ada pada **menerjemahkan angka menjadi kesimpulan yang bermakna**. Akibatnya laporan dan skripsi sering hanya berisi tabel output tanpa interpretasi, atau menafsirkan p-value, koefisien regresi, dan signifikansi secara keliru.

## 3. Tujuan dan Metrik Keberhasilan

| Tujuan | Metrik | Target | Status |
|---|---|---|---|
| Narasi akurat dan koheren | Narasi dinilai relevan/koheren | ≥ 80% | Belum diukur |
| Pengguna merasa terbantu | Responden yang terbantu (min. 20 mahasiswa) | 70–80% | Belum diukur |
| Kemudahan penggunaan | Skor SUS | ≥ 68 | Belum diukur |
| Narasi tidak mengarang | Jawaban benar pada komponen RAG | Tanpa RAG 29% → dengan RAG 100% (uji knowledge base mini) | Tercapai pada uji awal |
| Penolakan di luar cakupan | Pertanyaan di luar dokumen ditolak | 3/3 | Tercapai pada uji awal |

## 4. Pengguna

| Pengguna | Peran | Kebutuhan utama |
|---|---|---|
| Mahasiswa | Utama | Memahami makna hasil statistik untuk laporan/skripsi |
| Dosen / asisten dosen | Sekunder | Alat bantu demonstrasi interpretasi di kelas |
| Peneliti pemula | Tambahan | Pemahaman cepat output analisis |

## 5. Ruang Lingkup

**Termasuk (in scope)**

- Input data lewat upload CSV/Excel atau input manual.
- Empat jenis analisis: statistik deskriptif, uji t, korelasi, regresi sederhana.
- Narasi dalam bahasa Indonesia dan Inggris.
- Grafik: batang, histogram, scatter plot.
- Contoh kasus/analogi nyata.
- Registrasi dan login pengguna.

**Di luar cakupan (out of scope)**

- Analisis statistik lanjutan.
- Integrasi langsung dengan perangkat lunak statistik berbayar (SPSS, SAS, Minitab).
- Aplikasi mobile.
- Kolaborasi multi-user.

## 6. Alur Pengguna Utama

1. Pengguna mendaftar / login.
2. Pengguna memasukkan data (upload CSV/Excel atau input manual).
3. Pengguna memilih jenis analisis dan bahasa narasi.
4. Sistem menghitung statistik dengan pustaka standar (SciPy/statsmodels).
5. Sistem menampilkan grafik, narasi interpretatif, dan contoh kasus.
6. Pengguna membaca hasil dan menyalinnya ke laporan **[Konfirmasi: ekspor/unduh hasil]**.

## 7. Kebutuhan Fungsional

Rincian lengkap ada di SKPL (FR 01–16). Di PRD ini dikelompokkan menjadi:

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F1 | Registrasi dan login dengan kata sandi ter-hash (bcrypt) | Must |
| F2 | Upload CSV/Excel dan input data manual, dengan validasi format | Must |
| F3 | Pemilihan jenis analisis: deskriptif, uji t, korelasi, regresi sederhana | Must |
| F4 | Perhitungan statistik otomatis | Must |
| F5 | Narasi interpretatif oleh LLM, mencakup makna p-value, koefisien, dan signifikansi | Must |
| F6 | Pilihan bahasa narasi: Indonesia / Inggris | Must |
| F7 | Visualisasi otomatis: batang, histogram, scatter plot | Must |
| F8 | Contoh kasus/analogi nyata untuk setiap hasil | Should |
| F9 | Fallback narasi berbasis templat bila LLM gagal atau terkena *rate limit* | Should **[Konfirmasi]** |
| F10 | Riwayat analisis pengguna | Could **[Konfirmasi]** |
| F11 | Ekspor hasil (narasi dan grafik) | Could **[Konfirmasi]** |

## 8. Komponen AI (RAG)

**Jenis masalah:** *Generative AI* berbasis Retrieval-Augmented Generation, dengan LLM pre-trained lewat API pihak ketiga (tanpa pelatihan ulang).

**Pipeline:** ekstraksi teks (pypdf) → chunking 70 kata, tumpang-tindih 15 kata → embedding `paraphrase-multilingual-MiniLM-L12-v2` (384 dimensi) → ChromaDB (cosine) → retrieve top-3 → cek batas jarak 0,7 → augment → generate dengan `openai/gpt-oss-20b` via Groq (`temperature=0`, `max_tokens=2000`).

**Aturan perilaku**

- Jawaban hanya boleh bersumber dari dokumen di vector database.
- Bila informasi tidak ada, sistem menjawab: *"Maaf, informasi tidak ditemukan di dokumen project."*
- API key hanya disimpan di server (`.env`), tidak pernah di kode atau sisi klien.

**Artefak serah terima ke backend:** `data/vectordb/`, `models/konfigurasi_rag.json`, `requirements.txt`, `.env.example`, `KONTRAK.md`.

**Catatan arah produk:** pada tahap praktikum, knowledge base masih berisi tiga dokumen project sebagai data uji. Untuk produk final, knowledge base perlu diganti dengan **panduan interpretasi statistik** (arti p-value, koefisien korelasi, R², dan sejenisnya).

## 9. Kebutuhan Non-Fungsional

Rincian ada di SKPL (NFR 01–08). Yang dapat dipastikan dari laporan:

| Aspek | Kebutuhan |
|---|---|
| Keamanan | Kata sandi di-hash dengan bcrypt; API key LLM hanya di server |
| Kinerja | Ada target waktu proses analisis statistik (nilai pada SKPL h.16 dan h.19) |
| Keandalan | Perilaku sistem konsisten (`temperature=0`) dan menolak pertanyaan di luar dokumen |
| Bahasa | Narasi Indonesia dan Inggris |
| Platform | Aplikasi web (Next.js/TypeScript) **[Konfirmasi: stack final dan tempat hosting]** |

## 10. Risiko dan Kendala

| Risiko / kendala | Dampak | Mitigasi |
|---|---|---|
| **R-01** Narasi AI bias/kurang akurat (*hallucination*), skor 20 (Very High) | Pengguna salah menafsirkan hasil | RAG, instruksi "hanya berdasarkan konteks", batas jarak, evaluasi berkala |
| Retrieval lemah pada tabel PDF dan istilah unik (MRR embedding 0,30 vs TF-IDF 0,54) | Penolakan keliru atau jawaban tidak lengkap | Hybrid retrieval, bersihkan teks tabel, uji ukuran chunk dan `k` |
| *Rate limit* API LLM | Narasi gagal dibuat | Fallback templat, penanganan error, antrean permintaan |
| Evaluasi terbatas (15 pertanyaan, kunci satu halaman) | Angka kualitas kurang representatif | Perluas evaluation set, izinkan banyak halaman kunci |
| Ketergantungan pada API pihak ketiga | Biaya dan ketersediaan | Konfigurasi model terpusat di `konfigurasi_rag.json` |

## 11. Peta Jalan (Roadmap)

| Fase | Fokus | Keluaran |
|---|---|---|
| 1 | Fondasi: auth, input data, empat analisis, grafik | Prototipe fungsional |
| 2 | Narasi LLM dan contoh kasus, dua bahasa, fallback | Narasi end-to-end |
| 3 | Integrasi RAG dengan panduan interpretasi statistik, hybrid retrieval | Narasi lebih akurat dan terikat sumber |
| 4 | Pengujian dengan ≥ 20 mahasiswa (narasi relevan, kepuasan, SUS) | Laporan evaluasi |

Fase di atas berjalan dalam sprint Scrum pada jendela 16 minggu proyek. **[Konfirmasi: pemetaan sprint ke minggu dan WBS di Rencana & Kontrak]**

## 12. Pertanyaan Terbuka

1. Berapa nilai target waktu proses analisis (SKPL h.16 dan h.19)?
2. Di mana sistem akan di-hosting?
3. Apakah ekspor hasil (PDF/gambar) dan riwayat analisis masuk rilis pertama?
4. Bagaimana mekanisme fallback bila LLM tidak tersedia?
5. Ukuran data maksimum yang didukung untuk upload?
