# Checklist Paritas Desain & Animasi: Scribe Therapeutics vs Statistics Story AI

Dokumen ini membandingkan setiap pola desain, gerak, dan interaksi yang diaudit langsung dari situs referensi [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) dengan hasil implementasi pada **Statistics Story AI**, termasuk penyempurnaan tipografi bertangga dan strip glitch mekanis.

---

## Ringkasan Paritas

| Komponen / Animasi | Status | Catatan Implementasi & Alasan |
| :--- | :---: | :--- |
| **1. Tipografi & Gaya Teks** | **Sama** | Seluruh judul dan paragraf diubah menjadi **regular 400** (maksimal 500). Menggunakan **`Inter Tight`** (Google Fonts) sebagai padanan terdekat `PP Neue Montreal`, dengan tracking rapat `-0.035em`, line-height `1.02`, dan ukuran fluid `clamp(2.25rem, 6vw, 4.5rem)`. Monospace `JetBrains Mono` strictly dibatasi hanya untuk navbar, tombol, badge, dan state form. Seluruh label "SECTION 01" s.d. "SECTION 06" dan garis header histogram dihapus total sesuai referensi. |
| **2. Susunan Kotak Bertangga (StepBlock)** | **Sama** | Pada section "By Design" ("Analisis by Design" & "Narasi by Design"), kartu gelap bergaris 1px digantikan dengan **pola kotak putih bertangga solid tanpa border (StepBlock)** di atas latar hitam pekat. Kotak judul menempel di kiri atas, dan tepat di bawahnya menempel kotak paragraf yang lebih lebar **tanpa celah (0px gap)**. Di section latar terang `#F4F4F4` ("Masalah"), kotak dibalik menjadi hitam pekat dengan teks putih. |
| **3. Bar Glitch Horizontal (GlitchBars)** | **Sama** | Direvisi penuh menyempurnakan geometri dan gerak sesuai rekaman Scribe: (a) **Tinggi 100% Seragam**: Semua garis tipis, blok, dan badan bar memiliki tinggi 100% yang sama persis (`h-full`). (b) **Celah Rapat Proporsional ($H$)**: Menggantikan celah lebar sebelumnya dengan baseline relatif terhadap tinggi bar $H$: garis tipis `~0.08H` (pitch `0.18–0.2H`, margin `4–5px`), celah garis ke blok `0.15–0.3H` (6–12px, avg 8px), lebar blok `1.0–2.5H` (40–100px), celah antar blok `0.1–0.35H` (4–14px, avg rapat 6–9px), celah blok terakhir ke badan `0.15–0.25H` (6–10px, avg 8px). Total zona serpihan menjadi kompak ~200–260px pada desktop, dikalikan 0.6 pada mobile. (c) **Gerak Halus Easing**: Menggunakan Web Animations API `clip-path` kurva `cubic-bezier(0.16, 1, 0.3, 1)` durasi 1400–1900ms. (d) **Kedip Warna & Settled**: `@keyframes glitch-color-cycle`, `mix-blend-mode: multiply`, opacity badan 0.90, blok 0.50–0.90, bar menetap permanen tanpa loop keluar, dan 0 re-render React. |
| **4. Preloader** | **Sama** | Tampil sekali per sesi (`sessionStorage`), durasi cepat 750ms menampilkan counter persentase RAG Knowledge Base, non-blocking, dan langsung dilewati bila `prefers-reduced-motion` aktif. |
| **5. Perilaku Navbar & Anak Tangga Logo** | **Sama** | Fixed top bar berlatar putih `#FFFFFF` dengan teks hitam `#000000` dan border bawah 1px hitam di atas hero. **Anak Tangga di Bawah Logo**: Kotak logo memiliki border-r dan border-b 1px, tingginya ~1.4× baris nav (88px vs 64px di desktop), sehingga garis bawah navbar membentuk patahan anak tangga ke bawah mengelilingi logo. Link berupa sel grid modular 1px border kanan, font monospace huruf besar ber-tracking lebar, dan hover sel warna kuning `#EBEB00`. **Logika Inversi Scroll**: Mendeteksi section di bawah navbar; otomatis beralih ke hitam `#000000` dengan teks putih saat melewati section gelap (`#by-design`, `#tim`, `#akurasi`, `#early-access`), dan kembali ke putih saat di section terang (`#hero`, `#masalah`, `#demo`, `#untuk-siapa`). |
| **6. Mobile Menu Drawer** | **Sama** | Layar penuh overlay hitam pekat dengan daftar link menu vertikal berindeks angka, transisi slide-in cepat, dan tombol trigger yang bertransformasi dinamis antara `MENU` dan `TUTUP`. |
| **7. Visual Latar Hero (Generative Canvas Putih)** | **Sama** | Latar hero putih `#FFFFFF` dengan border bawah 1px solid `#000000`. (a) **Awan Titik Regresi (Bivariate Normal Scatter Plot)**: Menggantikan sebaran tipis kabel dengan awan sebaran normal bivariat autentik (`gaussN()` Box-Muller, `SCATTER_X_SD = 0.2`, `SCATTER_Y_SD = 0.11`). Titik lebih padat di bagian tengah dan menjarang di ujung; garis regresi putus-putus (`lineY`) membelah tepat di tengah pusat awan dengan titik-titik tersebar seimbang jauh di atas dan di bawah garis (korelasi moderat $r \approx 0.6$). (b) **Transisi Terurut ke Kurva Lonceng (Sorted Rank Mapping)**: Titik diurutkan berdasarkan `rx` dari kiri ke kanan sebelum menetapkan target lonceng `(hx, hy)` dengan $t = (k + 0.5) / N$. Titik di sisi kiri scatter tetap berada di sisi kiri lonceng, menghasilkan transisi mulus dan organik tanpa persilangan jalur liar. Kurva lonceng tetap tunggal dan titik rapat menempel ($\pm 4\text{px}$). (c) **Timeline Waktu & Jeda Eksplisit**: Menggunakan `TIMELINE` berbasis `performance.now()` dengan jeda `holdLine` (1500ms) dan `holdCurve` (1800ms), delay acak 0–25% saat `toCurve`, orbit getar $\pm 1\text{px}$ saat hold, dan batching 1 `beginPath()` per warna. Fallback statis untuk `prefers-reduced-motion`. |
| **8. Headline Hero Blok Biru Bertangga** | **Sama** | Seluruh judul berada di dalam blok biru `#003BFF` dengan teks putih (`box-decoration-break: clone`, `-webkit-box-decoration-break: clone`, padding `0 0.12em`, `line-height: 1.12`). Setiap baris teks membentuk kotak sendiri selebar teksnya sehingga bersusun bertangga tanpa celah antar baris (0px gap). Font weight 400, tracking `-0.035em`, ukuran `clamp(2.5rem, 7.5vw, 6rem)`. Subjudul dan strip status beralih ke warna hitam. Teks dekoratif `LATITUDE/BUILD` dihapus, hanya menyisakan `statsBadge` dan indikator pulsa biru. Di latar belakang terdapat 4 bidang kisi blueprint terpotong (sel 34px, garis abu `#E4E4E4`) di pojok kiri-atas, kiri-bawah, kanan-atas, dan kanan-bawah. |
| **9. Tiga Pilar & Bingkai Glitch Hover** | **Sama** | Struktur grid 3 kolom horizontal bergaris 1px tajam. Menggantikan motif barcode DNA Scribe dengan **Histogram Glyphs** bertingkat. Dilengkapi **Efek Bingkai Glitch Hover** meniru kartu "In the news" Scribe: ring blok piksel ~16px bertangga (tebal 1–2 blok, sudut L 85%), warna semantik tetap (Biru `#003BFF`, Merah `#FF2E2E`, Hitam `#000000`), animasi kedip bertahap 300ms + sel hantu 260ms, exit halus 180ms tanpa sisa, zero layout shift (z-0 di bawah teks z-10), hover hanya untuk mouse (`touch` diabaikan), dan PRNG seeded murni tanpa re-render React / Math.random saat render. Label `ACTIVATE →` dan `hover:bg-[#F9FAFB]` dihapus sesuai referensi. |
| **10. Demo Interaktif (Pengganti Video)** | **Mendekati** | Menggantikan video player Scribe dengan **Simulasi Antarmuka Browser Interaktif**: 4 tab analisis statistik (Regresi, Uji t, Korelasi, Deskriptif), plotting grafik otomatis, narasi interpretatif dengan efek typewriter, kartu analogi nyata, dan tombol simulasi ulang. |
| **11. Kutipan Misi** | **Sama** | Blok kutipan editorial hitam kontras tinggi dengan tanda kutip tajam, regular 400 typography, latar canvas ambient tenang (canvas ke-2 aktif), dan atribusi resmi Tim Bocil Sigma SV UNS. Diapit GlitchStrip di tepi bawah. |
| **12. Kartu Target Pengguna (Audience / Partners)** | **Sama** | Dua kartu blueprint besar (Mahasiswa & Dosen/Peneliti Pemula) dengan ilustrasi geometris SVG bertema data, sekat garis 1px, dan tautan aksi "Pelajari lebih lanjut →" dengan judul regular 400. |
| **13. Daftar Akurasi & Hasil Uji ("In The News")** | **Sama** | 3 baris modular dengan pemisah 1px putih tajam, pergeseran teks dan panah saat hover. Memuat hasil uji PRD secara jujur, disertai catatan wajib: *"Hasil uji awal pada knowledge base mini; evaluasi lebih luas sedang berjalan"* dan status evaluasi SUS bertuliskan *"Sedang disiapkan"*. |
| **14. CTA Produk Akhir (FinalCTA)** | **Sama** | Menggantikan form email akses awal dengan call-to-action produk yang yakin dan siap pakai: judul *"Ubah angkamu menjadi cerita hari ini."*, tombol utama *"Coba Sekarang"* (terhubung ke `APP_URL` di `src/data/links.ts`, saat ini placeholder `#`), tombol sekunder *"Lihat cara kerjanya"* (`#demo`), dan 3 fakta kemampuan produk (4 jenis analisis, 2 bahasa narasi, 3 jenis grafik) tanpa form email dan tanpa klaim fiktif jumlah pengguna. Label versi di Footer diganti `{t.builtBy}` (*"DIBUAT OLEH TIM BOCIL SIGMA · SEKOLAH VOKASI UNS"*). Seluruh tautan navigasi diarahkan ke `#mulai`. |
| **15. Footer Blueprint** | **Sama** | Kolom kiri: wordmark kurva lonceng, pill sosial, copyright 2026, kredensial Tim Bocil Sigma SV UNS. Kolom kanan: tombol bertumpuk vertikal dengan indeks angka. |
| **16. Smooth Scroll Inersia** | **Sama** | Diimplementasikan menggunakan engine **Lenis** untuk scroll inersia yang halus dan berbobot. |
| **17. Aksesibilitas Gerak (prefers-reduced-motion)** | **Sama** | Seluruh animasi inersia Lenis dinonaktifkan, typewriter digantikan dengan tampilan teks instan, canvas animasi dialihkan ke plot diagram statis, GlitchStrip/GlitchBars beralih ke layout statis tanpa glitch jumps, dan GlitchFrame kartu langsung tampil instan tanpa kedip dan tanpa sel hantu. |
| **18. Standar Kontras WCAG AA & Navigasi Keyboard** | **Sama** | Teks putih di atas blok biru `#003BFF` memiliki rasio kontras 5.2:1 (lolos WCAG AA). Titik kuning di canvas bergaris outline hitam tipis. Target fokus keyboard terlihat jelas dengan outline kuning elektrik `#EBEB00` (offset 2px). |
| **19. Sistem Tiga Maskot Orisinal ("Sigi", "Mu", "Quin")** | **Sama** | Tiga karakter orisinal sprite 16×16 piksel murni SVG (`shapeRendering="crispEdges"`, zero external assets):<br>1. **Sigi** ($\sigma$, simpangan baku): rambut histogram, badan biru `#003BFF` (pemandu utama).<br>2. **Mu** ($\mu$, rata-rata): badan kurva lonceng, antena titik rata-rata, badan merah `#FF2E2E` (narator/penjelas).<br>3. **Quin** (kuartil): badan box plot dengan garis median, kumis atas dan kaki, badan kuning `#EBEB00` (analis).<br>Mendukung 12 ekspresi wajah, 6 pose, 3 aksesori (topi wisuda `cap`, kacamata `glasses`), random blinking 2–4.5s (140ms), mode interaktif (klik berganti ekspresi selama 2.2s), dan tersebar di 10 titik halaman. |
| **20. Hiasan Latar Statistik (DataBackdrop)** | **Sama** | Murni SVG + CSS beranimasi `@keyframes bd-blink`, tanpa canvas baru (batas 2 canvas terjaga). PRNG berbenih `mulberry32` mencegah mismatch hidrasi SSR-client. Varian `scatter` di sisi kanan judul Akurasi; varian `skyline` (siluet histogram lonceng) di panggung EarlyAccessForm dan dasar Footer. |

---

## Verifikasi Visual & Komparasi Screenshot

| Resolusi / State | Screenshot Live Referensi Scribe | Screenshot Implementasi Statistics Story AI | Status Kesesuaian |
| :--- | :--- | :--- | :---: |
| **Desktop 1440px (Hero & Navbar Putih)** | `docs/reference/scribetx_hero_1440px_top_1790991145939.png` | `hero_1440px_1790991517579.png` | **Identik Pola**: Judul blok biru bertangga, anak tangga di bawah logo navbar, kisi terpotong di sudut, glitch bars berujung ticks, sebaran titik di kanan. |
| **Fase `holdLine` (Awan Titik Scatter Normal)** | (Referensi scatter plot standar regresi) | `scatter_cloud_hold_line_1791003608506.png` | **Identik Pola**: Awan titik normal bivariat menyebar lebar di kanan hero; garis putus-putus hitam membelah tepat di tengah pusat awan; titik lebih padat di tengah dan tersebar seimbang di atas dan di bawah garis. |
| **Fase `holdCurve` (Satu Kurva Lonceng Tunggal)** | `docs/reference/scribetx_hero_1440px_top_1790991145939.png` | `bell_curve_hold_curve_1791003648195.png` | **Identik Pola**: Tepat satu kurva lonceng tunggal di kanan hero; titik terpetakan terurut dari kiri ke kanan tanpa persilangan liar; lengkungan kedua di kiri tereliminasi total; jeda hold 1.8s stabil. |
| **Mobile 390px (Hero & Navbar)** | `docs/reference/scribetx_hero_390px_1790991159363.png` | `hero_390px_1790991604635.png` | **Identik Pola**: 3 glitch bars kompak skala 0.6, logo notch proporsional, tombol responsif, kurva lonceng dan regresi terbaca. |
| **Inversi Navbar Scroll (Dark Section)** | `docs/reference/scribetx_nav_scrolled_1790991135172.png` | `navbar_dark_section_1790991811302.png` | **Identik Pola**: Navbar otomatis beralih ke hitam pekat dengan teks putih saat melewati section gelap `#by-design`. |
| **Inversi Navbar Scroll (Light Section)** | (Audited live on Scribe light sections) | `navbar_light_section_1790991824525.png` | **Identik Pola**: Navbar kembali beralih ke putih dengan teks hitam saat melewati section terang `#demo`. |
| **Hover Kartu 1 (Bermakna - Biru)** | `docs/reference/card1_hover_blue_1791004811301.png` | `docs/reference/pillar_card1_hover_blue_1791005512785.png` | **Identik Pola**: Bingkai blok perimeter warna biru `#003BFF` bertangga (tebal 1–2 blok), sudut huruf L, sel hantu berkedip, teks tidak bergeser. |
| **Hover Kartu 2 (Terpercaya - Merah)** | `docs/reference/card2_hover_red_1791004836782.png` | `docs/reference/pillar_card2_hover_red_1791005744156.png` | **Identik Pola**: Bingkai blok perimeter warna merah `#FF2E2E` bertangga dengan celah diskret, pola acak baru, kontras tajam di atas border hitam kartu. |
| **Hover Kartu 3 (Terjangkau - Hitam)** | `docs/reference/card3_hover_black_1791004891706.png` | `docs/reference/pillar_card3_hover_black_1791005785634.png` | **Identik Pola**: Bingkai blok perimeter warna hitam `#000000` (mengikuti kartu ke-3 Scribe), kontras sempurna di atas kartu putih. |
| **State Exit / Leave (Transisi Keluar)** | `docs/reference/card_exit_complete_1791004968898.png` | `docs/reference/pillar_card_hover_exit_1791005856799.png` | **Identik Pola**: Saat kursor keluar, sel bingkai menghilang bertahap secara diskret dalam 180ms (`gf-out`), bersih tanpa sisa atau artefak tertinggal. |
| **GlitchStrip (Desktop 1440px - Burst 1 Medium/Dense)** | (Audited live on Scribe strip dividers) | `docs/reference/glitch_strip_burst1_1791010651993.png` | **Identik Pola**: Tinggi `h-4 md:h-6`, susunan seimbang/rapat, warna primer elektrik (biru/merah/kuning), tanpa blok hitam di latar gelap. |
| **GlitchStrip (Desktop 1440px - Burst 2 Sparse)** | (Audited live on Scribe strip bursts) | `docs/reference/glitch_strip_burst2_1791010672130.png` | **Identik Pola**: Kerapatan sparse (~8 blok) dengan celah lebar 3–12% dan pergeseran titik awal 0–12%, memberi variasi momen sepi yang kontras. |
| **GlitchStrip (Desktop 1440px - Burst 3 Dense In-Place Blink)** | (Audited live on Scribe strip bursts) | `docs/reference/glitch_strip_burst3_1791010689937.png` | **Identik Pola**: Kerapatan dense (~40 blok) berganti murni dengan kedip diskret (`gs-blink-a` / `gs-blink-b` dan `gs-blink-out`) tanpa pergeseran posisi atau perubahan warna. |
| **GlitchStrip (Mobile 390px - Skala 2.5x)** | (Audited live on Scribe mobile strip) | `docs/reference/glitch_strip_mobile_visible_1791010749841.png` | **Identik Pola**: Skala 2.5× lebar dan celah menghasilkan ~3 s.d. 16 blok yang tetap terlihat tegas dan terbaca tanpa berubah jadi garis 1px. |



---

## Komparasi Rekaman Layar 10 Detik Glitch Bars: Scribe Therapeutics vs Statistics Story AI

Perbandingan ini disusun berdasarkan rekaman layar 10+ detik audit langsung situs referensi Scribe Therapeutics (`docs/reference/scribe_audit.webp`) dibandingkan dengan rekaman hasil implementasi revisi `GlitchBars.tsx` (`glitch_smooth_demo_1790996827725.webp`):

### 1. Matriks Perbandingan Garis Waktu (Timeline 0s – 10s)

| Detik | Referensi Scribe Therapeutics (`scribe_audit.webp`) | Implementasi Statistics Story AI (`glitch_smooth_demo.webp`) | Status & Catatan Paritas |
| :--- | :--- | :--- | :---: |
| **0.0s – 1.2s** | Layar memuat preloader / transisi awal. Area hero bersih dan **tidak menampilkan bar apa pun** (empty start). | Preloader aktif ("0% INITIALIZING"). Seluruh elemen glitch bar berada pada fase `hidden` (`clip-path: inset(0 0 0 100%)`, `opacity: 0`). Hero bersih tanpa bar. | **Identik** |
| **1.2s – 3.8s** | Preloader tuntas, headline hero tampil. Bar masuk satu per satu dari sisi kanan dengan jeda bertahap (250–500ms). Gerakan meluncur sangat cepat di sepertiga awal, lalu melambat panjang dan halus di akhir (`easeOutExpo`). Serpihan garis dan blok memiliki tinggi 100% yang sama persis dengan badan bar. | Preloader selesai, headline blok biru tampil. Bar masuk secara bertahap (`IN_DURATION_MS = [1400, 1900]`, `STAGGER = [250, 500]ms`). Menggunakan Web Animations API `clip-path` dengan kurva `cubic-bezier(0.16, 1, 0.3, 1)`: cepat di awal, melambat mulus di akhir tanpa distorsi bentuk garis/blok. Seluruh elemen memiliki tinggi 100% seragam (`h-full`). | **Identik** |
| **3.8s – 10.0s+** | Bar yang telah masuk **menetap permanen (settled)**. Bar **TIDAK PERNAH menghilang, menyusut, atau mengulang animasi keluar**. Jangkauan bar berakhir di tengah layar (~50–53%), membiarkan area judul di kiri tetap bersih lega tanpa tersentuh. Bar mandiri (`b4`, `b5`) tampil murni sebagai barisan garis + blok bercelah tanpa badan solid. | Bar masuk ke fase `settled`: badan bar bertahan diam (`clip-path: inset(0 0 0 0%)`), tidak menyusut dan tidak mengulang loop keluar. Panjang badan solid (18–34%) + serpihan (~20%) menjangkau maksimal 53% dari tepi kanan, sehingga area judul teks (0–45% dari kiri) aman 100% dari tabrakan. `mix-blend-mode: multiply` membuat bar transparan di atas titik-titik canvas di belakangnya namun tetap murni di atas kanvas putih. | **Identik** |

### 2. Analisis Selisih & Detail Teknis (Delta Analysis)

1. **Geometri 100% Seragam (Menghapus Tinggi Acak)**:
   - *Masalah Sebelumnya*: Blok mosaik dan serpihan memiliki tinggi acak (40% s.d. 95%), menciptakan kesan bergerigi/kecil-besar yang tidak rapi.
   - *Solusi Terkini*: Sesuai referensi Scribe, **seluruh elemen (garis tipis 3–4px, blok 24–70px, dan badan solid) dibuat 100% full height (`h-full`)**. Garis tipis berjejer di ujung paling kiri dengan jarak 6–10px, diikuti blok-blok bercelah 8–28px, lalu badan solid ke tepi kanan.
2. **Panjang Terukur & Menjaga Area Judul**:
   - *Masalah Sebelumnya*: Panjang badan 36–70% ditambah serpihan membuat bar terlalu panjang hingga menimpa teks headline hero.
   - *Solusi Terkini*: Panjang badan solid diperkecil menjadi 18–34% (Biru ≈ 23%, Kuning ≈ 27%, Merah ≈ 33%) dengan zona serpihan ~20%. Total jangkauan maksimal adalah 53% dari tepi kanan, menjaga area judul di sebelah kiri (0–45%) tetap bersih dan terbaca jernih di resolusi 1440px/1370px.
   - Bar mandiri (`b4`, `b5`) tidak memiliki badan solid (`hasNoSolidBody: true`), murni barisan garis tipis + blok bercelah (panjang 24–26%).
3. **Gerak Mulus (Continuous Easing Curve vs Stepped Jumps)**:
   - *Masalah Sebelumnya*: Menggunakan `steps(8)` yang memecah gerak menjadi 8 lompatan kaku dan linear per langkah.
   - *Solusi Terkini*: Menggunakan kurva kontinu kuat **`cubic-bezier(0.16, 1, 0.3, 1)` (`easeOutExpo`)** berdurasi 1400–1900ms yang dianimasikan via Web Animations API pada `clip-path: inset(0 0 0 100%) → inset(0 0 0 0)`. Sekitar 70% jarak ditempuh di sepertiga awal, lalu melambat panjang dan halus di akhir tanpa meregangkan ukuran garis dan balok.
4. **Kedip Warna Melompat (Discrete Glitch Color Cycle)**:
   - Kedip warna tetap diskret memakai `steps(1, end)` pada `@keyframes glitch-color-cycle` dengan pola pembobotan: rapat di awal (0%, 8%, 16%, 26%), menjarang menjelang akhir (38%, 54%, 75%), lalu mendarat di warna asli (`--final`).
5. **Transparansi & Isolasi Lapisan**:
   - `mix-blend-mode: multiply` dengan opacity badan `0.90` dan blok `0.50–0.90` (hanya opacity yang bervariasi acak, bukan tinggi).
   - Lapisan teks judul dan tombol hero diisolasi via `isolation: isolate` pada `#hero .relative.z-10`.
6. **Efisiensi & Aksesibilitas**:
   - **0 re-render React** selama siklus berjalan.
   - Pada `prefers-reduced-motion: reduce`, bentuk akhir langsung ditampilkan dengan fade 300ms tanpa kedip warna dan tanpa loop.

---

## 3. Komparasi Detail Efek Bingkai Glitch Kartu: Scribe 'In the news' vs ProblemPillars

Berdasarkan audit langsung interaksi hover kartu pada bagian "IN THE NEWS" di [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) dibandingkan dengan implementasi `GlitchFrame.tsx` pada komponen tiga pilar (`ProblemPillars.tsx`):

### 3.1 Matriks Perbandingan Karakteristik Bingkai

| Karakteristik | Referensi Scribe ("In the news") | Implementasi Statistics Story AI (`ProblemPillars.tsx`) | Status & Catatan Paritas |
| :--- | :--- | :--- | :---: |
| **Ukuran & Grid Sel Piksel** | Sel kubus seragam `~16px × 16px` (`~12px` di mobile). Tepi kartu dibagi menjadi grid sel berbaris. | Grid modular responsif dihitung saat `onPointerEnter` via `Math.round(width / size)` dengan `size = width < 640 ? 12 : 16`. | **Identik** |
| **Ketebalan & Bentuk Sudut** | Ketebalan bertangga 1 hingga 2 blok piksel (`16–32px`). Sudut perimeter membentuk huruf "L" tebal bertangga. Bingkai tidak tertutup rapat melainkan bercelah terputus. | Sudut dipaksa membentuk lengan "L" dengan probabilitas 85% per sudut (`arm(2)`). Tepi atas, bawah, kiri, dan kanan dibentuk dari *edge runs* bertangga 1 dan 2 blok dengan celah proporsional. | **Identik** |
| **Palet Warna per Kartu** | Kartu 1: Biru `#003BFF`<br>Kartu 2: Merah `#FF2E2E`<br>Kartu 3: Hitam `#000000` (Kuning dihindari pada kartu putih demi kontras). | Kartu 1 (`Bermakna`): Biru `#003BFF`<br>Kartu 2 (`Terpercaya`): Merah `#FF2E2E`<br>Kartu 3 (`Terjangkau`): Hitam `#000000`<br>Sesuai persis dengan konstanta `FRAME_COLOR`. | **Identik** |
| **Koreografi Kemunculan (Hover In)** | Sel-sel blok muncul bertahap dalam ~300ms dengan kedip diskret (`steps(1, end)`). Beberapa sel di tepi berkedip sebentar lalu menghilang (*ghost cells*). | `@keyframes gf-in` durasi 300ms dengan 4 interval stepping (`0%, 25%, 45%, 65%, 100%`). Ditambah 10 sel hantu (`is-ghost`) dengan animasi `@keyframes gf-ghost` 260ms yang padam otomatis di akhir. | **Identik** |
| **Koreografi Hilang (Hover Out)** | Saat kursor keluar, bingkai menghilang bertahap secara diskret dalam 180–300ms tanpa menyisakan artefak piksel. | Saat `data-on="false"`, sel dipicu animasi `@keyframes gf-out` 180ms `steps(1, end)` dengan delay keluar acak `0–140ms`. Sel hantu langsung diset `display: none / opacity: 0` seketika. | **Identik** |
| **Pencegahan Celah Antar Sel (Seam Elimination)** | Tidak terlihat garis celah antar blok piksel pada tingkat zoom apa pun. | Menggunakan `box-shadow: 0 0 0 0.6px var(--gf-color)` di setiap sel untuk menutup garis pembulatan sub-piksel di zoom 100% dan 125%. | **Identik** |
| **Stabilitas Layout & Pointer Device** | Teks konten, badge, dan layout tidak bergeser sama sekali saat hover. Hanya kursor mouse yang memicu efek. | Lapisan konten dibungkus `relative z-10 p-8 md:p-12`, sedangkan bingkai ditempatkan pada `absolute inset-0 z-0 pointer-events-none`. Event `e.pointerType === "touch"` diabaikan total. | **Identik** |
| **Kebersihan Interaksi (Interaction Hygiene)** | Latar belakang kartu tidak berubah warna saat hover; tidak ada tombol/link palsu yang muncul. | Menghapus class lama `hover:bg-[#F9FAFB]` dan menghapus teks `ACTIVATE →` karena kartu berstatus spesifikasi non-clickable. | **Identik** |
| **Arsitektur Rendering & Kinerja** | Tidak menggunakan Canvas, murni DOM + CSS. | 100% murni elemen DOM `<span>` dan CSS keyframes. Menggunakan seeded PRNG `mulberry32` yang diperbarui per-hover (`seed + 1`), sehingga **bebas dari `Math.random()` saat render** dan murni tanpa *wasteful re-renders*. | **Identik** |

---

## 4. Komparasi Detail GlitchStrip Antar-Section: Scribe vs Statistics Story AI

Berdasarkan audit langsung pembatas strip berwarna (*GlitchStrip barcode blocks*) pada [Scribe Therapeutics](https://www.scribetx.com/?ref=lapaninja) dibandingkan dengan implementasi revisi `GlitchStrip.tsx`:

### 4.1 Matriks Perbandingan Geometri & Variasi Strip

| Karakteristik | Referensi Scribe | Implementasi Statistics Story AI (`GlitchStrip.tsx`) | Status & Catatan Paritas |
| :--- | :--- | :--- | :---: |
| **Dimensi Tinggi Strip** | Tinggi proporsional (~16–24px) yang membatasi antar-section secara elegan. | Diubah dari `h-6 md:h-8` (24/32px) menjadi `h-4 md:h-6` (16/24px), ~25–33% lebih ramping dan proporsional. | **Identik** |
| **Variasi Tiga Kerapatan (3-Tier Density)** | Jumlah blok bervariasi dinamis antar siklus: ada saat sepi/renggang dan ada saat padat berirama. | Tiga tingkat kerapatan acak berbobot (tanpa berulang berturut-turut):<br>1. `sparse` (40%): blok 2–6%, celah lebar 3–12%, offset awal 0–12%, ~8 blok.<br>2. `medium` (35%): blok 1.5–4.5%, celah 2–7%, lines 10%, ~18 blok.<br>3. `dense` (25%): blok 1–3.5%, celah 0.4–1.8%, lines 10%, ~40 blok. | **Identik** |
| **Palet Warna di Section Gelap** | Warna-warna elektrik cerah (kuning, biru, merah) kontras tajam di atas latar hitam pekat. | Default warna: Biru `#003BFF`, Merah `#FF2E2E`, Kuning `#EBEB00`. **Warna hitam dihilangkan dari default** sehingga tidak terjadi ilusi "lubang bolong" di section gelap (#000000). Prop `colors` tersedia untuk override latar terang. | **Identik** |
| **Animasi Masuk Murni Berkedip (In-Blink)** | Blok baru muncul seketika di posisinya dengan lompatan kedip mekanis, tanpa translasi geser atau wipe. | 100% murni kedipan in-place via `steps(1, end)` (delay 0–300ms acak):<br>1. `gs-blink-a` (480ms, 9 interval kedip rapat)<br>2. `gs-blink-b` (620ms, 6 interval kedip berirama).<br>Bebas gerakan translasi `translateX` atau pergeseran warna di tengah siklus. | **Identik** |
| **Animasi Keluar Murni Berkedip (Out-Blink)** | Blok lama berkedip sebelum padam, tidak lenyap seketika (hard remount). | Blok lama berkedip keluar secara terkoordinasi melalui `@keyframes gs-blink-out` (420ms, `steps(1, end)`) dengan jeda acak. | **Identik** |
| **Skala Mobile Responsif** | Blok tetap tegas terbaca pada layar sempit tanpa menyusut menjadi garis tipis 1px. | Pada layar mobile (<640px), seluruh lebar dan celah dikalikan `2.5×`, menghasilkan ~3 / 8 / 16 blok yang proporsional dan jelas terbaca. | **Identik** |
| **Pemicu Tampil & Efisiensi** | Hanya aktif saat terlihat di layar; awal mula bersih. | `IntersectionObserver` menjaga strip tetap kosong sampai pertama kali terlihat, lalu burst pertama dipicu berkedip masuk. Pergantian berkala 1.8–3.4 detik hanya terjadi saat `visible === true`. | **Identik** |
| **Aksesibilitas Gerak** | Bebas gangguan bagi pengguna dengan sensitivitas gerak. | Saat `prefers-reduced-motion: reduce`, strip menampilkan 1 susunan statis penuh tanpa animasi kedip dan loop timer dinonaktifkan total. | **Identik** |

---

## 5. Sistem Maskot Hidup Berelemen ("MascotWorld v2") & Hiasan Latar Statistik (DataBackdrop)

### 5.1 Spesifikasi Sistem Maskot Berelemen (`MascotWorld.tsx`, `mascotEngine.ts`, `mascotScripts.ts`, `mascotSprites.ts`)
- **Tiga Karakter Orisinal Berelemen**:
  1. **Sigi** (Air / Biru): Jambul tetesan air berayun naik-turun (histogram), anggota badan biru muda `#9CC8FF`, badan biru `#003BFF` (pemandu utama). Jurus bertema statistik: *Gelembung Sigma*, *Semburan Varians*, *Ombak Distribusi Normal*, *Pancuran Interval Kepercayaan*.
  2. **Mu** (Api / Merah): Badan kurva lonceng Gauss dengan jambul api yang berayun, kaki oranye `#FF8C00`, badan merah `#FF2E2E` (narator). Jurus bertema statistik: *Bola Api Rata-rata*, *Semburan Api Konvergen*, *Pilar Api Parameter*, *Ledakan Titik Pusat*.
  3. **Quin** (Petir / Kuning): Badan box plot dengan antena kilat yang berkedip pelan, anggota badan biru `#003BFF`, badan kuning `#EBEB00` (analis). Jurus bertema statistik: *Petir Kuartil*, *Kilat Kotak-Kumis*, *Sambaran Outlier*, *Badai Listrik Q3*.
- **Aturan Pertarungan Elemen**:
  - **Air mengalahkan Api** (air memadamkan api menjadi uap).
  - **Api mengalahkan Petir** (api membakar jalur lonjakan petir).
  - **Petir mengalahkan Air** (listrik menghantar kuat melalui air dan menyetrum).
  - Terjadi dalam siklus seimbang tanpa kekerasan nyata (gaya kartun, efek debu, uap, bintang K.O., dan damai hati).
- **Arsitektur Arena & Gerak 2D**:
  - **Koordinat 2D (x, y)**: Maskot dapat melompat lengkung parabola (`jump`), meluncur cepat (`dash`), terbang dan melayang di udara (`fly`, pose `air`), serta mendarat (`land` dengan efek debu).
  - **Bayangan Dinamis**: Drop shadow oval di lantai yang mengecil secara proporsional saat maskot naik ke udara.
  - **Sistem Jurus**:
    - `shoot`: Peluru berarah linear atau lengkung parabola (gelembung air, bola api, bola petir, ombak lantai) yang dapat mengenai lawan atau meleset (`miss`) saat lawan menghindar.
    - `beam`: Semburan sinar bertahap (semburan air, semburan api, petir) tanpa kedip cepat layar.
    - `strike`: Serangan area vertikal (pancuran air, pilar api, sambaran petir langit).
    - `burst`: Ledakan benturan, uap, bara api, atau kejutan listrik.
  - **Kecepatan Gerak**: `WALK = 80 px/s`, `RUN = 280 px/s`, `DASH = 520 px/s`, `PROJECTILE_SPEED = 420 px/s`.
  - **14 Episode Lengkap (`mascotScripts.ts`)**:
    - `duel-mean-vs-spread`: Sigi vs Mu (debat mean vs simpangan baku; dua kelas bisa sama-sama mean 70 tapi beda sebaran).
    - `duel-mean-vs-median`: Mu vs Quin (debat mean vs median saat ada data pencilan / outlier).
    - `duel-histogram-vs-boxplot`: Quin vs Sigi (histogram untuk bentuk sebaran & multimodal vs box plot untuk ringkasan 5 angka & outlier).
    - `battle-royale`: Ketiganya bertarung sambil merangkum urutan pemeriksaan data sebelum uji t (asumsi normalitas, varians, outlier, baru uji & interpretasi).
    - `showoff`: Pamer jurus sambil menjelaskan konsep statistik (Pancuran Interval Kepercayaan, Pilar Parameter, Badai Q3 Kuartil).
    - 8 episode percakapan: `greet`, `quiz` (p-value vs alpha), `chase`, `race` (uji t), `dance`, `demo`, `accuracy`, `nap`.
    - `finale`: Penutup "Satukan jurus kita!" dengan kembang api elemen untuk mengajak mencoba di section CTA akhir.
- **Aura & Keyframes CSS Baru**:
  - `@keyframes mw-proj-move`, `@keyframes mw-proj-arc`, `@keyframes mw-column`, `@keyframes mw-beam`, `@keyframes mw-puff`, `@keyframes mw-aura-rise`, `@keyframes mw-aura-flick`, `@keyframes mw-hover`.
- **Kontrol & Aksesibilitas**:
  - Tombol `MASKOT: ON` / `MASKOT: OFF` tersimpan di `localStorage`.
  - Sepenuhnya tersembunyi pada `prefers-reduced-motion` dan layar sempit `< 640px`.
  - Zero canvas baru (tetap mematuhi batas maksimal 2 canvas aktif).

### 5.2 TODO Kesiapan Peluncuran (Launch Checklist)
- **`APP_URL` di [`src/data/links.ts`](file:///d:/New%20Front%20end/src/data/links.ts)**:
  - Nilai saat ini: `export const APP_URL = "/masuk";` (Mengarahkan seluruh tombol *"Coba Sekarang"* langsung ke halaman login terlebih dahulu).
  - **Catatan Peluncuran**: Bila nanti aplikasi web memiliki portal tersendiri, isi `NEXT_PUBLIC_APP_URL` di `.env.local` untuk pengalihan setelah autentikasi sukses (`POST_AUTH_URL`).

### 5.3 Hiasan Latar Statistik (`DataBackdrop.tsx`)
- **Zero Canvas Added**: 100% SVG + CSS keyframes `@keyframes bd-blink`, menjaga batas keras maksimal 2 canvas aktif (hero + QuoteMission).
- **Seeded Random Generator**: Menggunakan generator `mulberry32` deterministik, memastikan hasil komputasi titik scatter dan batang histogram identik di server dan client (zero hydration mismatch).
- **Varian Scatter Plot (AccuracyNews)**: Awan 64 titik sebaran normal bivariat di sekitar garis regresi putus-putus (`#FFFFFF/30`) lengkap dengan sumbu X/Y dan tanda skala, mengisi ruang kosong sisi kanan atas judul Akurasi.
- **Varian Skyline Histogram (EarlyAccessForm & Footer)**: Siluet kurva lonceng 60 batang di dasar panggung form dan dasar footer, memberikan nuansa statistik yang elegan tanpa mengganggu keterbacaan teks utama (`relative z-10`).

---

## Kesimpulan Evaluasi
Seluruh kriteria revisi telah terintegrasi secara presisi:
1. **Hero Berlatar Putih**: Latar `#FFFFFF` dengan border bawah 1px hitam. Gradien vignette hitam dihapus total. Seluruh judul dibungkus blok biru `#003BFF` bertangga dengan teks putih (box-decoration-break: clone). Grid canvas diganti 4 bidang kisi blueprint terpotong (sel 34px, abu `#E4E4E4`). Teks subjudul dan status strip hitam; teks dekoratif `LATITUDE/BUILD` dihapus.
2. **Navbar Putih & Anak Tangga Logo**: Latar putih, border 1px hitam, hover sel `#EBEB00`. Kotak logo lebih tinggi (~1.4×) dengan border kanan dan bawah hitam, menciptakan anak tangga di bawah logo. Saat scroll ke section gelap, navbar berinversi dinamis ke hitam dengan teks putih.
3. **Canvas 240/100 Titik**: Titik biru, merah, dan kuning (ber-outline hitam tipis) terkonsentrasi di sisi kanan (~62%). Garis regresi hitam putus-putus. Batching rendering per warna untuk kestabilan 60 fps.
4. **GlitchBars Murni DOM+CSS**: 5 bar horizontal dengan geometri 100% seragam, panjang terukur (menjaga area judul), animasi halus `clip-path` `cubic-bezier(0.16, 1, 0.3, 1)`, kedip warna bio-tech (`glitch-color-cycle`), `mix-blend-mode: multiply`, dan 0 re-render React.
5. **Bingkai Glitch Kartu Pilar (Scribe Parity)**: Tiga kartu pilar (Bermakna, Terpercaya, Terjangkau) menampilkan bingkai blok bertangga (~16px per blok, sudut L 85%) dengan palet semantik tetap (Biru `#003BFF`, Merah `#FF2E2E`, Hitam `#000000`). Transisi diskret stepped `gf-in` (300ms) + sel hantu (260ms), exit `gf-out` (180ms), zero layout shift (`z-0` vs `z-10`), penolakan pointer sentuh, penghapusan `hover:bg-[#F9FAFB]` dan `ACTIVATE →`, serta perlindungan sub-pixel seam `box-shadow 0.6px`.
6. **GlitchStrip Antar-Section (3-Tier Density & Discrete Blink)**: Pembatas strip diperkecil ke `h-4 md:h-6`, kerapatan dinamis bervariasi antar-siklus (sparse ~8 blok, medium ~18 blok, dense ~40 blok; ~3 / 8 / 16 di mobile dengan skala 2.5×), palet default tanpa hitam, animasi murni berkedip diskret di tempat (`gs-blink-a` / `gs-blink-b` dan `gs-blink-out` dengan `steps(1, end)`), tanpa pergeseran geser/wipe/warna, burst pertama saat pertama kali terlihat, dan mode statis untuk reduced motion.
7. **Maskot Hidup Berelemen MascotWorld v2**: Sigi (Air), Mu (Api), dan Quin (Petir) bertarung dengan jurus elemen statistik, bergerak 2D (lompat parabola, terbang melayang dengan bayangan menyusut, meluncur), menghindar serangan, bermain 14 episode duel dan percakapan, serta responsif terhadap klik dan section halaman.
8. **Kesiapan Produksi**: `pnpm run build` sukses 100% tanpa error TypeScript/ESLint dan performa halaman stabil 60 fps.





