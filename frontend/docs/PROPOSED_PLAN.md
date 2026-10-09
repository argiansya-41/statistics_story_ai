# Rencana Implementasi: Statistics Story AI Landing Page (Disetujui dengan Penyesuaian)

Dokumen ini memuat arsitektur visual dan teknis landing page **Statistics Story AI** yang mengadopsi struktur, ritme scroll, dan gaya animasi dari [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) dengan konten orisinal dari [PRD_Statistics_Story_AI.md](file:///d:/New%20Front%20end/PRD_Statistics_Story_AI.md) serta penyesuaian yang telah disetujui.

---

## 1. Desain Token & Palet Warna (Scribe Live Reference Tokens)

Nilai hex presisi diambil langsung dari computed style Scribe Therapeutics:
- **`--bg-light`**: `#F4F4F4` (Technical off-white / canvas terang)
- **`--bg-dark`**: `#000000` (Pure pitch black / canvas hitam)
- **`--bg-card`**: `#FFFFFF` (Solid white untuk kartu blueprint)
- **`--accent-blue` (Biru Elektrik)**: `#003BFF` (Pilar Bermakna; latar dengan teks putih `#FFFFFF` atau teks biru di latar terang)
- **`--accent-red` (Merah)**: `#FF2E2E` (Pilar Terpercaya; badge dengan teks hitam `#000000`, tidak dipasangkan dengan teks putih atau teks kecil di latar terang untuk menjaga WCAG AA)
- **`--accent-yellow` (Kuning Elektrik)**: `#EBEB00` (Pilar Terjangkau, Tombol CTA Utama; latar tombol/badge dengan teks hitam `#000000` atau teks kuning di atas hitam)
- **`--border-dark`**: `1px solid #000000` (pada canvas terang)
- **`--border-light`**: `1px solid rgba(255, 255, 255, 0.15)` (pada canvas gelap)
- **Border Radius**: Strict `0px` (neo-brutalist technical precision).

### Aturan Kontras WCAG AA:
- Kuning (`#EBEB00`) selalu berpasangan dengan teks hitam (`#000000`), atau sebagai teks kuning di atas canvas hitam.
- Biru (`#003BFF`) sebagai background berpasangan dengan teks putih (`#FFFFFF`), atau sebagai teks aksen di atas canvas terang `#F4F4F4`.
- Merah (`#FF2E2E`) sebagai badge dipasangkan dengan teks hitam (`#000000`).

### Motif Visual Orisinal: Histogram Data Glyphs
Menggantikan motif barcode DNA Scribe dengan **Histogram Glyphs** (4-5 batang vertikal bertingkat dengan variasi tinggi) menggunakan palet biru, merah, kuning, dan hitam/putih.

---

## 2. Tipografi (2 Font Families)

Hanya menggunakan 2 keluarga Google Fonts dengan `display=swap`:
1. **`Plus Jakarta Sans`**:
   - Digunakan untuk: Display Headings (H1, H2, H3) dan Body Paragraphs.
   - Headings: weights 600 & 700, tight tracking (`-0.025em`), line-height `1.1`.
   - Body: weights 400 & 500, line-height `1.55`.
2. **`JetBrains Mono`**:
   - Digunakan untuk: Labels, Badges, Navigation, Data Metrics, Tombol, dan State Indicators.
   - Weights: 400 & 700, uppercase, tracking `0.08em` s.d. `0.14em`.

---

## 3. Spesifikasi Animasi & Optimasi Performa

1. **Preloader Sesi**:
   - Tampil hanya sekali per sesi menggunakan `sessionStorage`.
   - Durasi cepat (≤ 1.0 detik), tidak menghalangi render konten dasar (non-blocking).
   - Langsung dilewati bila `prefers-reduced-motion` aktif.
2. **Smooth Scroll & Parallax**:
   - Lenis smooth scroll terintegrasi dengan GSAP ScrollTrigger.
   - Dinonaktifkan dengan transisi CSS sederhana bila `prefers-reduced-motion` aktif.
3. **Manajemen Canvas (Maksimal 2 Aktif)**:
   - Hero Canvas: Titik data bergerak membentuk scatter plot, garis regresi linear, dan histogram dalam loop halus.
   - By Design Canvas: Kurva distribusi normal interaktif / data flow.
   - **Optimasi**:
     - `IntersectionObserver` menghentikan (`cancelAnimationFrame`) canvas saat di luar viewport.
     - Deteksi mobile: mengurangi jumlah partikel hingga 60% untuk menjaga 60 FPS stabil.
     - Total canvas aktif bersamaan tidak pernah melebihi 2.
4. **Navbar Responsif**:
   - Transparan di atas Hero, backdrop blur solid saat scroll.
   - Hide on scroll down, show on scroll up.
   - Inversi warna dinamis (hitam/putih) sesuai latar section.
   - Mobile: tombol `MENU` membuka full-screen drawer dengan link stagger.
5. **Section Akurasi Jujur**:
   - Catatan wajib: *"Hasil uji awal pada knowledge base mini; evaluasi lebih luas sedang berjalan."*
   - Status evaluasi SUS & kepuasan pengguna: *"Sedang disiapkan"* (bukan angka pencapaian).

---

## 4. Struktur Direktori Proyek

```
d:/New Front end/
├── docs/
│   ├── REFERENCE_AUDIT.md
│   ├── PROPOSED_PLAN.md
│   ├── PARITY_CHECKLIST.md
│   └── reference/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── Preloader.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── ProblemPillars.tsx
│   │   │   ├── ByDesign.tsx
│   │   │   ├── InteractiveDemo.tsx
│   │   │   ├── QuoteMission.tsx
│   │   │   ├── Audience.tsx
│   │   │   ├── AccuracyNews.tsx
│   │   │   └── EarlyAccessForm.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── HistogramGlyph.tsx
│   │       └── GenerativeCanvas.tsx
│   └── data/
│       └── content.ts
```
