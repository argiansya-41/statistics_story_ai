# Audit Teknis Situs Referensi: Scribe Therapeutics (scribetx.com)

Dokumen ini disusun sebagai catatan hasil audit langsung via browser agent terhadap [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) sebelum memulai penulisan kode untuk produk **Statistics Story AI**.

---

## 1. Desain Token & Fondasi Visual

### 1.1 Tipografi
Scribe menggunakan perpaduan **Neo-Brutalist Technical Blueprint** dan **Bio-Engineering Precision**:
- **Display Headings (H1/H2)**:
  - Font Family: `PP Neue Montreal`, `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Weight: 600 (Semibold / Medium Bold)
  - Size: 
    - Desktop (1440px): `56px` - `72px` (Hero `64px`, section headings `48px` - `56px`)
    - Tablet (768px - 1024px): `36px` - `48px`
    - Mobile (390px): `28px` - `36px`
  - Line-height: `1.05` - `1.15` (sangat rapat dan kokoh)
  - Letter-spacing: `-0.02em` s.d. `-0.03em`
  - Fitur Visual Khas: Highlight background solid (misalnya kotak biru elektrik di belakang kata/frasa kunci).
- **Subheadings, Badges, Labels, Navigation, Tombol**:
  - Font Family: `Space Mono`, `DM Mono`, `monospace`
  - Weight: 400 & 700
  - Size: `11px` - `14px`
  - Case: `ALL CAPS`
  - Letter-spacing: `0.08em` - `0.15em` (wide tracking)
  - Line-height: `1.3` - `1.4`
- **Body / Paragraphs**:
  - Font Family: `PP Neue Montreal`, sans-serif
  - Weight: 400 (Regular)
  - Size: `15px` - `18px` (Desktop `17px`, Mobile `15px`)
  - Line-height: `1.45` - `1.55`
  - Letter-spacing: `-0.01em`

### 1.2 Palet Warna & Semantic Tokens
- **Backgrounds**:
  - Light Canvas: `#F4F4F4` (Technical off-white / blueprint background)
  - Dark Canvas: `#000000` (Pure black untuk Hero transisi, Tiga Pilar, dan Newsletter/Footer)
  - Card Overlays: `#FFFFFF` (Putih solid dengan border tajam 1px)
- **Borders & Grid Lines**:
  - Blueprint Grid Line: `1px solid #000000` (pada canvas terang)
  - Dark Grid Line: `1px solid rgba(255, 255, 255, 0.15)` (pada canvas gelap)
- **Aksen Bio-Tech (Scribe)**:
  - Electric Blue: `#003BFF` (Badge "Preventative", highlight hero, mobile menu overlay)
  - Primary Red: `#FF2E2E` (Badge "Liberating", canvas accent)
  - Electric Yellow: `#EBEB00` (Badge "Universal", CTA buttons, submit button)
- **Motif Grafis Khas**:
  - **DNA Barcode Glyphs**: Garis-garis vertikal berdampingan (biru, merah, kuning, hitam) sebagai penanda visual modul.
  - **0px Border Radius**: Strict `border-radius: 0px` di semua tombol, kartu, input, dan badge.

### 1.3 Layout & Spacing
- **Container Max-Width**: `1440px` (fluid dengan border-box dan margin auto).
- **Grid Layout**: CSS Grid modular dengan garis pemisah `1px` eksplisit.
- **Section Spacing**: `100px` s.d. `160px` pada desktop; `60px` s.d. `80px` pada mobile.
- **Breakpoints**:
  - Desktop XL/L: `> 1200px` (standar tes 1440px)
  - Tablet Landscape: `992px - 1199px` (standar tes 1024px)
  - Tablet Portrait: `768px - 991px` (standar tes 768px)
  - Mobile: `< 768px` (standar tes 390px)

---

## 2. Animasi & Scroll Rhythm

### 2.1 Preloader & Initial Load
- **Pemicu**: `window.onload` / DOMContentLoaded.
- **Perilaku**: 
  - Durasi preloader: ~1.0 - 1.2 detik.
  - Transisi: Layar pembuka fade-out / clip-path naik (`translateY(-100%)`).
  - Hero Elements Entry:
    1. Headline teks muncul dengan teknik mask clip-path / line reveal (`translateY(40px) → 0px`, `opacity: 0 → 1`, durasi 0.9s, easing `power3.out`).
    2. Sub-copy dan CTA fade-in dengan delay stagger (0.2s setelah headline).
    3. Navbar slide-down (`translateY(-100%) → 0%`, 0.6s).

### 2.2 Perilaku Navbar
- **Posisi**: `fixed`, `top: 0`, `left: 0`, `w-full`, `z-50`.
- **Hero State**: Awalnya transparan atau berlatar semi-transparan dengan garis border bawah 1px.
- **Scroll State**:
  - Saat scroll turun: Navbar mengaktifkan backdrop blur / solid background (`#000000` atau `#F4F4F4` sesuai section latar).
  - Hide/Show on Scroll: Tersembunyi saat scroll turun cepat, muncul kembali seketika saat scroll naik (`translateY(0)`).
  - Inversi Warna: Teks dan border beralih antara putih (di section gelap) dan hitam (di section terang).

### 2.3 Hero Section
- **Latar Belakang**: 3D WebGL Canvas molekular (di Scribe: DNA + enzim CRISPR berputar interaktif dengan pergeseran kamera pelan).
- **Overlay**: Gradasi radial/linear halus agar kontras teks tetap optimal.
- **CTA**: Tombol berlatar kuning elektrik (`#EBEB00`) dengan border hitam tajam dan panah (`→`) yang bergeser ke kanan saat hover (`translateX(4px)`).

### 2.4 Tiga Pilar ("Preventative / Liberating / Universal")
- **Pemicu**: ScrollTrigger.
- **Layout**: Grid 3 kolom horizontal di desktop; stack 1 kolom di mobile.
- **Elemen Tiap Pilar**:
  - Badge berwarna monospaced dengan barcode glyph:
    1. Preventative (Biru `#003BFF`)
    2. Liberating (Merah `#FF2E2E`)
    3. Universal (Kuning `#EBEB00`)
  - Headline tebal + deskripsi pendek.
- **Scroll & Hover**:
  - Reveal per kolom saat scroll masuk viewport (`opacity: 0 → 1`, `translateY(30px) → 0px`, stagger 0.15s).
  - Hover: subtle border glow atau pergeseran teks mikro, tetap elegan dan tenang.

### 2.5 Blok "By Design" (Engineering / Portfolio)
- **Layout**: Split view atau pinned/sticky background dengan kartu mengambang.
- **Visual**: Di tengah/samping terdapat 3D canvas interaktif (Scribe: bentuk jantung yang tersusun dari ribuan huruf kode genetik A, C, T, G).
- **Kartu Overlaid**:
  - Blok putih bergaris 1px (`Engineering by Design`, `Portfolio by Design`).
  - Copy deskripsi yang presisi.
  - Tombol aksi dengan panah kanan.

### 2.6 Kutipan & Video
- **Layout**: Box hitam kontras tinggi dengan aksen barcode.
- **Tipografi Kutipan**: Monospace / Grotesk terkurasi dengan tanda petik tajam.
- **Atribusi**: Monospace uppercase dengan divider vertikal (`|`).

### 2.7 Section Partner
- **Layout**: Staggered modular blueprint cards (Sanofi, Eli Lilly).
- **Background**: Grid teknis `#F4F4F4`.
- **Interaksi**:
  - Hover kartu: sedikit highlight border hitam tebal / elevasi halus.
  - Tombol "LEARN MORE →": panah bergeser `translateX(4px)` dengan transisi `0.2s ease`.
  - Header memiliki CTA kuning mencolok: "WORK WITH US →".

### 2.8 In The News
- **Layout**: 3-kolom modular card grid terpisah oleh garis 1px hitam.
- **Konten**: Badge kategori monospace (`NEWS`, `PRESS RELEASE`), Judul artikel tebal, Tanggal & Sumber publikasi, Tautan aksi `READ NOW →`.
- **Hover**: Garis bawah atau panah bergerak dinamis saat kursor melintas.

### 2.9 Form Newsletter
- **Layout**: Terintegrasi rapi di atas footer pada background hitam.
- **Input**: Sharp corner `0px`, border `1px solid rgba(255,255,255,0.3)`, background off-white / transparan.
- **Tombol**: Kuning elektrik `SUBMIT →`.
- **State Behavior**:
  - Focus: border menjadi putih terang / aksen.
  - Loading: teks berubah / indikator kalkulasi.
  - Success: Pesan konfirmasi muncul menggantikan form.
  - Error: Notifikasi teks merah monospaced di bawah input.

### 2.10 Footer
- **Layout**:
  - Kiri: Logo emblem, ikon sosial, hak cipta, kebijakan privasi, agensi pembuat.
  - Kanan: Tumpukan vertikal menu kotak monospaced (`ABOUT`, `PLATFORM`, `PIPELINE`, `NEWSROOM`, `CAREERS`, `INVESTOR RELATIONS`, `CONTACT`).

### 2.11 Smooth Scroll & Micro-interactions
- **Smooth Scroll**: Menggunakan scroll inersia (Lenis / GSAP ScrollSmoother) untuk memberikan sensasi pergerakan yang sangat mulus dan berat (weighted scroll momentum).
- **Cursor**: Scribe mempertahankan kursor default sistem dengan perubahan state pointer presisi pada elemen interaktif.
- **Aksesibilitas Gerak**: Tidak terverifikasi apakah Scribe mengimplementasikan `prefers-reduced-motion` secara penuh di canvas WebGL. Namun untuk implementasi kita, **wajib** menyediakan fallback reduced motion: menonaktifkan partikel berat/parallax dan menggantikannya dengan transisi opacity sederhana.

### 2.12 Audit Langsung: Stepped Box Layout ("Portfolio by Design" & "Engineering by Design")
- **Tipografi Judul**: Font-weight murni **regular 400** (bukan bold atau extrabold), grotesque netral (`PP Neue Montreal`), line-height sangat rapat (`~1.02`), letter-spacing rapat (`-0.035em`), ukuran sekitar `clamp(2.25rem, 6vw, 4.5rem)`.
- **Struktur Kotak Bertangga (Stepped Layout)**:
  - Kotak judul menempel di pojok kiri atas dengan latar belakang putih solid (`bg-white`), teks hitam (`#000000`), tanpa border (`border: 0`).
  - Tepat di bawahnya menempel kotak deskripsi yang lebih lebar (`max-w-[46rem]`), rata kiri dengan kotak judul, **tanpa celah sama sekali (0px gap)**.
  - Teks deskripsi berupa paragraf *sentence case*, ukuran ~18-20px, line-height ~1.3, padding lega (`px-6 py-6`).
  - **Penting**: Tidak ada label monospace huruf besar, badge "SECTION", atau nomor di sekitar judul.

### 2.13 Audit Langsung: Glitch Strip (Barcode Color Blocks)
- **Lokasi Kemunculan di Referensi**:
  1. Tepi bawah Hero Section (di atas garis pemisah).
  2. Mengapit sisi pernyataan visi ("Blueprint") / Quote Mission.
  3. Tepi pembatas atas section "In the news" / Akurasi & Validasi.
- **Visual & Variasi Tiga Kerapatan (Dynamic 3-Tier Density)**:
  - Tinggi strip: `h-4 md:h-6` (16px pada mobile, 24px pada desktop; 25–33% lebih proporsional dari versi awal 24–32px).
  - Tiga tingkat kerapatan yang berganti-ganti secara acak berbobot (tanpa berulang dua kali berturut-turut):
    1. **Sparse (40% peluang)**: Lebar blok 2–6%, celah lebar 3–12%, titik awal bergeser acak 0–12% (tidak selalu menempel kiri). Menghasilkan susunan lega sekitar 8 blok (rentang 6–10 blok) dengan ruang nafas luas.
    2. **Medium (35% peluang)**: Lebar blok 1.5–4.5%, celah 2–7%, peluang gugusan garis tipis 10%. Menghasilkan susunan seimbang sekitar 18 blok.
    3. **Dense (25% peluang)**: Lebar blok 1–3.5%, celah rapat 0.4–1.8%, peluang gugusan garis tipis 10%. Menghasilkan susunan padat sekitar 40 blok (rentang 28–61 blok).
  - Gugusan garis tipis: Hanya muncul pada medium dan dense (3–5 garis, lebar 0.2–0.34%).
  - Skala Mobile (<640px): Lebar dan celah diskalakan 2.5× menghasilkan susunan terukur (~3 / 8 / 16 blok) yang terbaca jelas tanpa menyusut menjadi garis 1px.
  - Palet Warna: Menggunakan Biru `#003BFF`, Merah `#FF2E2E`, Kuning `#EBEB00`. Hitam sengaja tidak digunakan sebagai warna default di section gelap (#000000) agar tidak menimbulkan lubang kosong yang merusak ritme visual. Prop `colors` disediakan jika strip diletakkan di latar terang.
- **Karakteristik Animasi: Murni Berkedip Diskret (Discrete In-Place Blinking)**:
  - Tidak ada gerakan translasi geser (slide/sweep/wipe/scatter) atau pergeseran warna di tengah siklus. Seluruh pergantian murni berupa lompatan kedip mekanis `steps(1, end)`.
  - Pemicu: Awalnya kosong sampai pertama kali terlihat via `IntersectionObserver`, lalu langsung berkedip muncul.
  - Berganti berkala tiap 1.8–3.4 detik hanya saat elemen berada dalam viewport.
  - **Kedip Masuk (In-Blink)**: Dipilih acak per blok antara dua pola kedip diskret dengan delay mulai acak 0–300ms:
    - `gs-blink-a` (480ms): 9 fase kedipan diskret rapat `0% -> 14% -> 28% -> 42% -> 56% -> 70% -> 84% -> 92% -> 100%`.
    - `gs-blink-b` (620ms): 6 fase kedipan diskret berirama `0% -> 20% -> 32% -> 55% -> 66% -> 100%`.
  - **Kedip Keluar (Out-Blink)**: Blok lama berkedip secara serentak lalu padam via `gs-blink-out` (420ms, 6 fase) tanpa lenyap seketika.
  - Preferensi `prefers-reduced-motion`: Satu susunan statis langsung ditampilkan tanpa kedip masuk/keluar dan timer loop dinonaktifkan total.
- **Bukti Screenshot Hasil Uji**:
  - `docs/reference/glitch_strip_burst1_1791010651993.png` — State burst medium/dense (~18-40 blok)
  - `docs/reference/glitch_strip_burst2_1791010672130.png` — State burst sparse (lega, celah lebar, titik awal bergeser)
  - `docs/reference/glitch_strip_burst3_1791010689937.png` — State burst dense berganti dinamis dengan in-place blink
  - `docs/reference/glitch_strip_mobile_visible_1791010749841.png` — Tampilan terukur pada mobile (390px) tanpa garis tipis 1px

### 2.14 Audit Langsung: Hero Putih & Navbar (Scribe Live Reference)
- **Latar Belakang Hero**: `#FFFFFF` (Putih bersih) dengan border bawah `1px solid #000000`. Tanpa gradien vignette hitam.
- **Judul Berblok Biru Elektrik**:
  - Seluruh baris judul berada di dalam blok latar belakang biru elektrik solid (`#003BFF`) dengan teks putih (`#FFFFFF`).
  - Menggunakan teknik `box-decoration-break: clone` (`-webkit-box-decoration-break: clone`), padding horizontal `0 0.12em`, dan `line-height: 1.12`.
  - Tiap baris teks memiliki lebar kotak yang mengikuti panjang teksnya, sehingga membentuk **susunan bertangga presisi** yang menempel rapat tanpa celah vertikal antar baris.
  - Font: regular (400), tracking `-0.035em`, ukuran fluid `clamp(2.5rem, 7.5vw, 6rem)`.
- **Bidang Kisi Terpotong (Cropped Blueprint Grids)**:
  - Latar kisi tidak menutupi seluruh hero.
  - Hanya berupa bidang-bidang kecil terpotong di sudut (pojok kiri-atas, kiri-bawah, dan kanan-atas).
  - Ukuran sel kisi: `~34px × 34px` dengan garis halus abu-abu `#E4E4E4` (1px).
- **Navbar di Atas Hero**:
  - Latar putih (`bg-white`), teks hitam (`#000000`), border hitam `1px solid #000000`.
  - Link navigasi berupa sel-sel kotak dengan garis pembatas 1px di sisi kanan tiap sel, hover berlatar kuning elektrik (`#EBEB00`).
  - **Anak Tangga di Bawah Logo**: Kotak logo di pojok kiri atas memiliki tinggi `~1.4×` tinggi baris navigasi (tinggi ~80px vs nav ~56px) dengan border kanan dan border bawah hitam, sehingga garis bawah navbar membentuk lekukan anak tangga (*step-down notch*) di bawah logo.
  - **Logika Inversi Scroll**: Hero adalah section terang (navbar putih/teks hitam). Saat pengguna scroll melewati section gelap (seperti By Design, Quote, Akurasi), navbar berinversi mulus ke latar hitam pekat dengan teks putih.
- **Visualisasi Animasi Data & Bar Glitch**:
  - Titik-titik data terkonsentrasi di sisi kanan (~62% lebar layar), sementara sisi kiri (area headline) dibuat jarang agar teks tetap terbaca jernih.
  - Titik hanya terdiri dari 3 warna: Biru `#003BFF` (40%), Merah `#FF2E2E` (30%), Kuning `#EBEB00` (30%). Titik kuning diberi outline hitam halus (`rgba(0,0,0,0.55)`, 0.75px) agar kontras optimal di atas putih.
  - Garis regresi berwarna hitam putus-putus, kurva lonceng berwarna biru.

### 2.15 Glitch bars: kurva easing, clip-path, & geometri 100% seragam
Berdasarkan audit mendalam via browser agent dan DevTools (tab Animations, Elements & Computed) pada [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) dengan lebar acuan 1440px / 1370px:
- **Mekanisme Animasi & Properti Teranimasi**:
  - Animasi gerak masuk menggunakan teknik pemotongan **`clip-path: inset(0 0 0 100%) → inset(0 0 0 0)`** (atau pembungkus `overflow: hidden` dengan translasi `translateX(100%) → translateX(0)`).
  - **Bukan `scaleX`**: Pemakaian `scaleX` sengaja dihindari karena akan mendistorsi/meregangkan lebar garis tipis dan balok mosaik saat bertransisi. Dengan `clip-path`, garis dan blok langsung tampil dalam ketebalan aslinya (3–4px dan 24–70px) saat tirai pembuka bergerak.
- **Kurva Easing & Kecepatan (Fast Start, Smooth Deceleration)**:
  - Gerakan berpindah dari gerak patah-patah `steps()` ke **kurva kontinu `cubic-bezier(0.16, 1, 0.3, 1)` (`easeOutExpo`)**.
  - Pola gerak: Cepat meluncur di sepertiga awal (~70% jarak ditempuh sangat cepat), lalu melambat panjang dan halus di akhir hingga berhenti sempurna.
  - Durasi per bar: **1400ms – 1900ms**.
  - Jeda stagger antar bar: **250ms – 500ms**, dimulai secara bertahap setelah judul hero selesai tampil.
- **Kedip Warna Melompat (Discrete Glitch Color Cycle)**:
  - Kedip warna tetap diskret memakai `steps(1, end)` melalui `@keyframes glitch-color-cycle`.
  - Frekuensi kedipan dibuat rapat di awal dan menjarang menjelang akhir (0%, 8%, 16%, 26%, 38%, 54%, 75%, 100%) sebelum mendarat mantap di warna final (`--final`).
- **Geometri Bar & Tinggi 100% Seragam**:
  - **Tinggi 100% Seragam**: Seluruh elemen (garis tipis 3–4px, blok bercelah 24–70px, dan badan solid) memiliki **tinggi 100% yang sama persis** dengan tinggi bar. Tidak ada elemen yang lebih pendek (menghapus tinggi acak 45%/65%/75%).
  - **Garis Tipis**: Lebar 3–4px, celah antar garis 6–10px di ujung paling kiri.
  - **Blok Bercelah**: Lebar 24–70px, celah antar blok 8–28px, celah ke badan bar 8–12px.
  - **Panjang Badan Solid**: 18% – 34% lebar hero (Biru atas ≈ 23%, Kuning tengah ≈ 27%, Merah bawah ≈ 33%).
  - **Zona Serpihan (Garis + Blok)**: Sekitar 20% lebar hero.
  - **Total Jangkauan Maksimum**: Maksimal ~50%–55% dari tepi kanan, sehingga area judul teks di sebelah kiri (0%–45%) **sama sekali tidak tersentuh** pada 1440px/1370px.
  - **Bar Mandiri (Stand-Alone Bars)**: Bar biru & kuning di kiri-bawah tidak memiliki badan solid; seluruhnya tersusun dari barisan garis tipis + blok bercelah dengan rentang 22% – 28% lebar.
- **Transparansi & Blend Mode**:
  - `mix-blend-mode: multiply` dengan opacity badan `~0.90` dan blok `0.50–0.90` (hanya opacity yang bervariasi, bukan tinggi).
  - Bar menetap permanen (`settled`) tanpa menyusut atau menghilang kembali.



---


## 3. Hasil Pengujian Responsif

| Viewport | Lebar | Perubahan Layout & Interaksi |
| :--- | :--- | :--- |
| **Desktop** | `1440px` | Layout multi-kolom penuh, navbar memanjang horizontal dengan sekat cell grid 1px, canvas WebGL interaktif penuh. |
| **Tablet Landscape**| `1024px` | Skala tipografi menyusut secara proporsional (~15%), navbar mempertahankan format teks, padding kontainer mengecil. |
| **Tablet Portrait** | `768px` | Grid 3-kolom berita dan pilar beralih menjadi 2-kolom / 1-kolom, navbar menciut dan tombol `MENU` muncul di sudut kanan atas. |
| **Mobile** | `390px` | 1-kolom total, padding samping `20px`, canvas 3D disesuaikan aspek rasionya. Mengklik `MENU` memicu **Full-Screen Electric Drawer** dengan transisi slide-in/fade-in cepat dan tombol `CLOSE` kontras. |

---

## 4. Daftar Screenshot Referensi yang Tersimpan

Seluruh screenshot hasil audit disimpan di direktori `docs/reference/`:
1. `hero_section_1440_1790985493183.png` — Tampilan Hero pada viewport desktop 1440px.
2. `hero_scrolled_600_1790985589905.png` — Transisi Hero menuju background hitam.
3. `pillars_section_1440_1790985600334.png` — Tiga Pilar (Preventative, Liberating, Universal) dengan barcode glyphs.
4. `by_design_section_1440_1790985613955.png` & `crispr_by_design_1440_1790985633465.png` — Canvas 3D partikel genetik.
5. `engineering_by_design_1440_1790985654251.png` — Modul Engineering by Design.
6. `portfolio_by_design_1440_1790985679554.png` — Modul Portfolio by Design.
7. `partners_section_1440_1790985718514.png` & `partners_cards_1440_1790985754411.png` — Blueprint partner cards (Sanofi & Lilly).
8. `news_section_1440_1790985850738.png` — 3-kolom Newsroom grid.
9. `footer_section_1440_1790985883828.png` — Newsletter dan Footer.
10. `hero_section_1024_1790986001343.png`, `hero_section_768_1790986033769.png`, `hero_section_390_1790986068897.png` — Uji responsif.
11. `mobile_menu_open_390_1790986125720.png` — Tampilan drawer menu mobile full overlay.
12. `scribe_audit.webp` — Rekaman video interaksi dan scroll audit.

---

## 5. Audit Pengukuran Geometri Ujung Bar Glitch (Scribe Live 5 Bars)

Berdasarkan inspeksi DevTools langsung pada 5 bar di Hero Scribe Therapeutics (`https://www.scribetx.com/?ref=lapaninja`):

### 5.1 Tabel Pengukuran Live 5 Bar di Scribe

| Bar ID & Deskripsi | Tinggi $H$ (px) | Garis Tipis (Lebar & Pitch) | Celah Garis Terakhir → Blok 1 | Blok Terurai (Jumlah & Lebar px) | Celah Antar Blok | Celah Blok Terakhir → Badan | Lebar Zona Serpihan | Panjang Badan Solid |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Bar 1: Blue Main Top** | `40px` | 3 garis (3px, pitch 7.5px, margin 4.5px) | `8px` | 4 blok (`48px`, `64px`, `52px`, `80px`) | `6px`, `10px`, `8px` | `8px` | `~233px` | `23%` |
| **Bar 2: Yellow Upper** | `24px` | 3 garis (2px, pitch 5px, margin 3px) | `6px` | 3 blok (`32px`, `44px`, `36px`) | `5px`, `6px` | `5px` | `~139px` | `27%` |
| **Bar 3: Red Thick** | `40px` | 4 garis (3px, pitch 7.5px, margin 4.5px) | `9px` | 4 blok (`56px`, `72px`, `45px`, `68px`) | `7px`, `9px`, `6px` | `8px` | `~255px` | `33%` |
| **Bar 4: Blue Center Standalone** | `20px` | 3 garis (2px, pitch 4px, margin 2px) | `5px` | 4 blok (`24px`, `36px`, `28px`, `32px`) | `4px`, `5px`, `4px` | N/A (Murni serpihan) | `~140px` | `0%` (Standalone) |
| **Bar 5: Yellow Bottom Standalone** | `16px` | 3 garis (1.5px, pitch 3.2px, margin 1.7px) | `4px` | 3 blok (`20px`, `28px`, `24px`) | `3px`, `4px` | N/A (Murni serpihan) | `~90px` | `0%` (Standalone) |

### 5.2 Formulasi Baseline Relatif Terhadap Tinggi Bar ($H$)

Untuk menjaga kerapatan serpihan tetap konsisten dan proporsional saat bar mengecil:
- **Tinggi Elemen**: 100% $H$ untuk semua garis tipis, blok, dan badan.
- **Lebar garis tipis**: `~0.08H` (3px pada $H=40$, 2px pada $H=24$, 1.5px pada $H=16$), 3–4 garis.
- **Pitch antar garis**: `~0.18–0.2H` (7–8px pada $H=40$, jarak margin `~0.10–0.12H`).
- **Celah garis terakhir → blok pertama**: `0.15–0.30H` (6–12px pada $H=40$, rata-rata 8px).
- **Lebar blok**: `1.0–2.5H` (40–100px pada $H=40$), 3–5 blok.
- **Celah antar blok**: `0.10–0.35H` (4–14px pada $H=40$, rata-rata rapat 6–9px).
- **Celah blok terakhir → badan**: `0.15–0.25H` (6–10px pada $H=40$, rata-rata 8px).
- **Total Zona Serpihan**: `~200–260px` pada $H=40$ (kompak, tidak terurai renggang).
- **Faktor Skala Mobile**: Dikalikan `0.6` pada layar mobile (<768px).

---

## 6. Audit Efek Bingkai Glitch pada Kartu (Scribe 'In the news' Hover)

Berdasarkan inspeksi langsung via browser agent pada section **"IN THE NEWS"** di [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja):

### 6.1 Karakteristik Visual Bingkai Glitch
1. **Ketebalan & Ukuran Blok (Pixel Size & Thickness)**:
   - Ukuran satu sel piksel: `~16px × 16px`.
   - Ketebalan bingkai: 1 hingga 2 blok piksel (sekitar `16px – 32px`).
   - Posisi: Tepat menimpa garis pembatas tepi perimeter kartu (menempel di dalam tepi).
   - *Zero Layout Shift*: Teks, badge, dan layout konten di dalam kartu tidak bergeser sama sekali saat bingkai muncul atau hilang.
2. **Bentuk Sudut & Tepi Bertangga**:
   - Sudut kartu membentuk pola huruf "L" (*L-shaped corners*).
   - Tepi bingkai tidak bersambung penuh (memiliki celah terputus) dengan ketebalan berganti antara 1 blok dan 2 blok membentuk tangga piksel (*stepped pixel runs*).
3. **Warna Tetap per Kartu (Fixed Semantic Palette)**:
   - **Kartu 1 (News)**: Biru Elektrik Scribe (`#003BFF`)
   - **Kartu 2 (Press Release 1)**: Merah Scribe (`#FF2E2E`)
   - **Kartu 3 (Press Release 2)**: Hitam (`#000000`)
   - Kuning tidak digunakan pada latar putih karena kontras rendah.

### 6.2 Pola Gerak & Animasi (Hover In & Hover Out)
1. **Pemicu Hover**:
   - Hanya aktif untuk pointer mouse (mengabaikan sentuhan layar `touch`).
   - Setiap kali kursor masuk (*mouse enter*), terbentuk variasi pola acak baru (*seeded random pattern*).
2. **Kemunculan (Mouse Enter / `gf-in`)**:
   - Sel-sel blok muncul bertahap dalam waktu ~300ms dengan lompatan kedip diskret (`steps(1, end)`).
   - Terdapat sejumlah sel "hantu" (*ghost cells*) yang berkedip 1–2 kali lalu hilang sepenuhnya.
3. **Penghilangan (Mouse Leave / `gf-out`)**:
   - Saat kursor keluar, seluruh sel bingkai menghilang bertahap secara diskret dalam rentang 180–300ms.
   - Tidak ada sel atau sisa bayangan yang tertinggal setelah kursor keluar.
4. **Bukti Screenshot Audit Scribe**:
   - `docs/reference/card1_hover_blue_1791004811301.png` — Hover Kartu 1 (Biru)
   - `docs/reference/card2_hover_red_1791004836782.png` — Hover Kartu 2 (Merah)
   - `docs/reference/card3_hover_black_1791004891706.png` — Hover Kartu 3 (Hitam)
   - `docs/reference/card_exit_complete_1791004968898.png` — State setelah kursor keluar (bersih tanpa sisa)


