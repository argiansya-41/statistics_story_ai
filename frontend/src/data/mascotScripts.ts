import type { Action, ActorId, Episode, Look, Scripts, Text } from "@/lib/mascotEngine";

/**
 * Skrip interaksi tiga maskot. Ubah dialog dan jurus di sini; semua kalimat dwibahasa.
 *
 *   Sigi (biru)   = elemen AIR,   mewakili σ (simpangan baku / sebaran), pemandu utama
 *   Mu   (merah)  = elemen API,   mewakili μ (rata-rata), narator
 *   Quin (kuning) = elemen PETIR, mewakili kuartil / median / outlier, analis
 *
 * Elemen hanya menentukan JURUS dan tampilan pertarungan. Percakapannya selalu tentang statistik
 * (rata-rata vs sebaran, rata-rata vs median, histogram vs box plot, asumsi uji t, dst.).
 */
const T = (id: string, en: string): Text => ({ id, en });

const say = (who: ActorId, id: string, en: string, ms?: number): Action => ({ who, say: T(id, en), ms });
const set = (who: ActorId, s: Partial<Look>): Action => ({ who, set: s });
const turn = (who: ActorId, to: ActorId | "left" | "right"): Action => ({ who, turn: to });
const wait = (ms: number): Action => ({ wait: ms });

// Daftar jurus (nama dwibahasa), supaya konsisten antar episode.
const MOVE = {
  bubble: T("Gelembung Sigma!", "Sigma Bubble!"),
  jet: T("Semburan Varians!", "Variance Jet!"),
  wave: T("Ombak Distribusi Normal!", "Normal Distribution Wave!"),
  geyser: T("Pancuran Interval Kepercayaan!", "Confidence Interval Geyser!"),
  fireball: T("Bola Api Rata-rata!", "Mean Fireball!"),
  flame: T("Semburan Api Konvergen!", "Convergent Flamethrower!"),
  pillar: T("Pilar Api Parameter!", "Parameter Fire Pillar!"),
  blast: T("Ledakan Titik Pusat!", "Central Point Blast!"),
  bolt: T("Petir Kuartil!", "Quartile Bolt!"),
  flash: T("Kilat Kotak-Kumis!", "Box-and-Whisker Flash!"),
  strike: T("Sambaran Outlier!", "Outlier Strike!"),
  storm: T("Badai Listrik Q3!", "Q3 Thunderstorm!"),
};
const shout = (who: ActorId, m: Text, ms = 1100): Action => ({ who, say: m, ms });

// ---------- Debat statistik sambil bertarung ----------

/** Rata-rata vs sebaran. Sigi (σ) vs Mu (μ), Quin sebagai wasit. */
const duelMeanVsSpread: Episode = {
  id: "duel-mean-vs-spread",
  weight: 1.4,
  steps: [
    [{ who: "sigi", walk: 0.24 }, { who: "mu", walk: 0.6 }, { who: "quin", walk: 0.9 }],
    [turn("sigi", "mu"), turn("mu", "sigi"), turn("quin", "mu"), set("quin", { face: "talk", pose: "wave" })],
    [say("quin", "Debat statistik dimulai! Topik: rata-rata atau sebaran, mana yang lebih penting?", "Statistics debate time! Topic: mean or spread, which matters more?", 3100)],
    [set("quin", { pose: "idle", face: "smile" }), set("sigi", { face: "cool" }), say("sigi", "Dua kelas bisa sama-sama rata-rata 70, tapi sebarannya beda jauh!", "Two classes can both average 70, yet spread very differently!", 2800)],
    [set("mu", { face: "angry" }), say("mu", "Rata-rata itu ringkasan paling sederhana dari pusat data!", "The mean is the simplest summary of a dataset's center!", 2600)],

    // Babak 1: Mu menyerang, Sigi melompat menghindar
    [set("mu", { pose: "charge", face: "angry", aura: true }), shout("mu", MOVE.fireball)],
    [
      set("mu", { pose: "cast" }),
      { who: "mu", shoot: { kind: "fireball", at: "sigi", miss: 36 } },
      { who: "sigi", jump: { h: 96, ms: 720 }, after: 420 },
    ],
    [set("mu", { pose: "idle", face: "wow", aura: false }), set("sigi", { face: "wink" }), say("sigi", "Meleset! Rata-rata saja tak menunjukkan seberapa melebarnya data.", "Missed! A mean alone can't show how wide the data spreads.", 2800)],

    // Babak 2: Sigi menyerang, Mu terbang menghindar
    [set("sigi", { pose: "charge", face: "angry", aura: true }), shout("sigi", MOVE.bubble)],
    [
      set("sigi", { pose: "cast" }),
      { who: "sigi", shoot: { kind: "bubble", at: "mu" } },
      { who: "mu", fly: { y: 112, ms: 520 }, after: 480 },
    ],
    [set("sigi", { pose: "idle", face: "wow", aura: false }), set("mu", { face: "cool" }), say("mu", "Tetap saja rata-rata jadi acuan untuk membandingkan kelompok.", "Still, the mean is the reference for comparing groups.", 2600)],

    // Babak 3: adu sinar di udara
    [set("mu", { pose: "cast", face: "angry" }), shout("mu", MOVE.flame, 1000)],
    [
      { who: "mu", beam: { kind: "flame", at: "sigi", ms: 1300 } },
      set("sigi", { pose: "cast", face: "angry", aura: true }),
      { who: "sigi", say: MOVE.jet, ms: 1100, after: 150 },
      { who: "sigi", beam: { kind: "jet", at: "mu", ms: 1150 }, after: 250 },
      { burst: { kind: "steam", at: 0.43, y: 88, ms: 900 }, after: 500 },
    ],
    [
      set("mu", { pose: "idle", face: "hurt", aura: false }),
      { who: "mu", knock: { from: "sigi", px: 150, up: 70 } },
      { who: "mu", fx: "sweat", ms: 1000 },
      set("sigi", { pose: "idle", aura: false, face: "happy" }),
    ],

    // Penutup serangan
    [{ who: "sigi", fly: { y: 100, ms: 600 } }, set("mu", { face: "sad" })],
    [set("sigi", { pose: "charge", face: "angry", aura: true }), shout("sigi", MOVE.wave, 1300)],
    [set("sigi", { pose: "cast" }), { who: "sigi", shoot: { kind: "tide", at: "mu", speed: 420 } }],
    [
      set("mu", { face: "ko", pose: "idle" }),
      { who: "mu", knock: { from: "sigi", px: 100, up: 40 } },
      { burst: { kind: "steam", at: "mu", ms: 1100 } },
      { who: "mu", fx: "stars", ms: 2200 },
    ],
    [{ who: "sigi", land: true }],
    [set("sigi", { pose: "cheer", face: "happy" }), { who: "sigi", hop: true }, say("sigi", "Laporkan rata-rata bersama simpangan baku, misalnya 70 ± 5.", "Report the mean together with the standard deviation, e.g. 70 ± 5.", 2900)],

    // Setelah pertarungan
    [{ who: "quin", walk: { near: "mu", gap: 20 }, run: true }, set("sigi", { pose: "idle", face: "smile" })],
    [turn("quin", "mu"), set("quin", { face: "talk" }), say("quin", "Kesimpulan debat: rata-rata dan sebaran saling melengkapi. Kubangunkan Mu dulu.", "Verdict: mean and spread complement each other. Let me wake Mu.", 3100)],
    [{ who: "quin", shoot: { kind: "orb", at: "mu", speed: 600 } }],
    [set("mu", { face: "wow", pose: "cheer" }), { who: "mu", hop: true }, say("mu", "Aduh! Iya, aku setuju: μ butuh σ.", "Ouch! Okay, I agree: μ needs σ.", 2000)],
    [{ who: "sigi", walk: { near: "mu", gap: 16 } }],
    [set("sigi", { pose: "cheer", face: "love" }), set("mu", { pose: "cheer", face: "love" }), { who: "sigi", fx: "heart", ms: 1400 }, { who: "mu", fx: "heart", ms: 1400 }, say("sigi", "Debat yang seru, Mu!", "Great debate, Mu!", 1600)],
  ],
};

/** Rata-rata vs median saat ada outlier. Mu (μ) vs Quin (median/kuartil), Sigi sebagai wasit. */
const duelMeanVsMedian: Episode = {
  id: "duel-mean-vs-median",
  weight: 1.4,
  steps: [
    [{ who: "mu", walk: 0.3 }, { who: "quin", walk: 0.66 }, { who: "sigi", walk: 0.9 }],
    [turn("mu", "quin"), turn("quin", "mu"), turn("sigi", "mu"), set("sigi", { face: "talk", pose: "wave" })],
    [say("sigi", "Ronde dua! Topik: rata-rata atau median untuk data yang punya outlier?", "Round two! Topic: mean or median for data with outliers?", 3000)],
    [set("sigi", { pose: "idle", face: "smile" }), set("quin", { face: "cool" }), say("quin", "Satu gaji yang sangat besar bisa menaikkan rata-rata gaji satu kantor!", "One huge salary can lift the whole office's mean pay!", 3000)],
    [set("mu", { face: "angry" }), say("mu", "Rata-rata memakai semua nilai. Itu kekuatannya!", "The mean uses every value. That's its strength!", 2400)],

    // Babak 1: Quin meluncur menyerbu, Mu melompat mundur
    [set("quin", { pose: "charge", face: "angry", aura: true }), shout("quin", MOVE.flash)],
    [
      { who: "quin", dash: { near: "mu", gap: 30 } },
      { who: "mu", jump: { to: 0.12, h: 90, ms: 650 }, after: 120 },
    ],
    [set("quin", { pose: "idle", face: "wow", aura: false }), turn("quin", "mu"), say("quin", "Median tidak goyah oleh nilai ekstrem!", "The median isn't shaken by extreme values!", 2000)],

    // Babak 2: Mu memanggil pilar api, Quin meluncur menghindar
    [set("mu", { pose: "charge", face: "angry", aura: true }), shout("mu", MOVE.pillar)],
    [
      set("mu", { pose: "cast" }),
      { who: "mu", strike: { kind: "pillar", at: "quin", ms: 1000 } },
      { who: "quin", dash: 0.86, after: 260 },
    ],
    [set("mu", { pose: "idle", aura: false, face: "cool" }), turn("quin", "mu"), say("mu", "Untuk data simetris, rata-rata paling efisien!", "For symmetric data, the mean is the most efficient!", 2400)],

    // Babak 3: Quin terbang dan menyambar, Mu kena lalu membalas
    [{ who: "quin", fly: { y: 130, ms: 600 } }, set("mu", { face: "think" })],
    [set("quin", { pose: "charge", face: "angry" }), shout("quin", MOVE.strike)],
    [set("quin", { pose: "cast" }), { who: "quin", strike: { kind: "thunder", at: "mu", ms: 650 } }],
    [set("mu", { face: "hurt" }), { who: "mu", fx: "stars", ms: 1200 }, { who: "mu", knock: { from: "quin", px: 70 } }],
    [set("mu", { pose: "charge", face: "angry", aura: true }), shout("mu", MOVE.blast, 1300)],
    [set("mu", { pose: "cast" }), { who: "mu", shoot: { kind: "fireball", at: "quin", speed: 560 } }],
    [
      set("quin", { face: "ko", pose: "idle", aura: false }),
      { who: "quin", knock: { from: "mu", px: 110, up: 50 } },
      { who: "quin", fx: "stars", ms: 2400 },
      set("mu", { pose: "idle", aura: false, face: "happy" }),
    ],
    [set("mu", { pose: "cheer", face: "happy" }), { who: "mu", hop: true }, say("mu", "Data simetris? Pakai rata-rata. Banyak outlier? Pakai median.", "Symmetric data? Use the mean. Lots of outliers? Use the median.", 3100)],

    // Setelah pertarungan
    [set("quin", { pose: "idle", face: "sad" }), say("quin", "Aku gosong... tapi median-ku selamat.", "I'm toasted... but my median survived.", 1900)],
    [{ who: "mu", walk: { near: "quin", gap: 14 }, run: true }],
    [set("quin", { face: "think", pose: "idle" }), say("quin", "Jadi pilihannya bergantung pada bentuk distribusi data.", "So the choice depends on the shape of the distribution.", 2400)],
    [set("mu", { pose: "cheer", face: "love" }), set("quin", { pose: "cheer", face: "love" }), set("sigi", { pose: "cheer", face: "love" }), { who: "mu", fx: "heart", ms: 1400 }, { who: "quin", fx: "heart", ms: 1400 }, wait(1500)],
  ],
};

/** Histogram vs box plot. Quin (box plot) vs Sigi (histogram), Mu sebagai wasit. */
const duelHistogramVsBoxplot: Episode = {
  id: "duel-histogram-vs-boxplot",
  weight: 1.4,
  steps: [
    [{ who: "quin", walk: 0.3 }, { who: "sigi", walk: 0.64 }, { who: "mu", walk: 0.92 }],
    [turn("quin", "sigi"), turn("sigi", "quin"), turn("mu", "sigi"), set("mu", { face: "talk", pose: "wave" })],
    [say("mu", "Ronde tiga! Topik: histogram atau box plot, mana yang lebih jelas?", "Round three! Topic: histogram or box plot, which is clearer?", 2800)],
    [set("mu", { pose: "idle", face: "smile" }), set("sigi", { face: "cool" }), say("sigi", "Histogram menunjukkan seluruh bentuk sebaran data!", "A histogram shows the whole shape of the distribution!", 2600)],
    [set("quin", { face: "angry" }), say("quin", "Box plot meringkas lima angka dan menandai outlier!", "A box plot summarizes five numbers and flags outliers!", 2600)],

    // Babak 1: gelembung dihindari dengan meluncur
    [set("sigi", { pose: "charge", face: "angry", aura: true }), shout("sigi", MOVE.bubble)],
    [
      set("sigi", { pose: "cast" }),
      { who: "sigi", shoot: { kind: "bubble", at: "quin", speed: 400 } },
      { who: "quin", dash: 0.14, after: 560 },
    ],
    [set("sigi", { pose: "idle", aura: false, face: "wow" }), turn("quin", "sigi"), set("quin", { face: "wink" }), say("quin", "Box plot jauh lebih ringkas untuk dibaca sekilas!", "A box plot is far more compact to read at a glance!", 2600)],

    // Babak 2: pancuran, Quin terbang
    [set("sigi", { pose: "charge", face: "angry", aura: true }), shout("sigi", MOVE.geyser, 1300)],
    [
      set("sigi", { pose: "cast" }),
      { who: "sigi", strike: { kind: "geyser", at: "quin", ms: 1100 } },
      { who: "quin", fly: { y: 125, ms: 520 }, after: 260 },
    ],
    [set("sigi", { pose: "idle", aura: false, face: "think" }), set("quin", { face: "cool" }), say("sigi", "Tapi histogram memperlihatkan puncak ganda yang disembunyikan box plot.", "But a histogram reveals double peaks that a box plot hides.", 3000)],

    // Babak 3: sambaran dan adu sinar
    [set("quin", { pose: "charge", face: "angry" }), shout("quin", MOVE.storm, 1300)],
    [
      set("quin", { pose: "cast" }),
      { who: "quin", beam: { kind: "bolt", at: "sigi", ms: 1000 } },
      set("sigi", { pose: "cast", face: "angry", aura: true }),
      { who: "sigi", say: MOVE.jet, ms: 900, after: 100 },
      { who: "sigi", beam: { kind: "jet", at: "quin", ms: 900 }, after: 200 },
    ],
    [
      set("sigi", { face: "ko", pose: "idle", aura: false }),
      { who: "sigi", knock: { from: "quin", px: 120, up: 30 } },
      { who: "sigi", fx: "stars", ms: 2400 },
      { burst: { kind: "shock", at: "sigi", ms: 900 } },
    ],
    [{ who: "quin", land: true }],
    [set("quin", { pose: "cheer", face: "happy" }), { who: "quin", hop: true }, say("quin", "Box plot untuk membandingkan banyak kelompok, histogram untuk melihat bentuk.", "Box plots for comparing many groups, histograms for seeing shape.", 3200)],

    // Setelah pertarungan
    [set("sigi", { face: "wow", pose: "cheer" }), { who: "sigi", hop: true }, say("sigi", "Aduh! Berarti kita butuh dua-duanya.", "Ouch! So we need both.", 1900)],
    [{ who: "mu", walk: { near: "sigi", gap: 22 }, run: true }, set("quin", { pose: "idle", face: "smile" })],
    [turn("mu", "sigi"), set("mu", { face: "talk" }), say("mu", "Itu sebabnya Statistics Story AI menampilkan beberapa jenis grafik sekaligus.", "That's why Statistics Story AI shows several chart types at once.", 3100)],
    [set("quin", { face: "think" }), say("quin", "Dan narasinya menjelaskan artinya, bukan hanya gambarnya.", "And the narrative explains what it means, not just the picture.", 2700)],
    [set("sigi", { pose: "cheer", face: "love" }), set("mu", { pose: "cheer", face: "love" }), set("quin", { pose: "cheer", face: "love" }), { who: "sigi", fx: "heart", ms: 1400 }, wait(1500)],
  ],
};

/** Ketiganya sekaligus: apa yang harus dicek sebelum uji t (asumsi), sambil saling serang. */
const battleRoyale: Episode = {
  id: "battle-royale",
  weight: 1.1,
  steps: [
    [{ who: "sigi", walk: 0.2 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.8 }],
    [turn("sigi", "mu"), turn("mu", "quin"), turn("quin", "mu"), set("sigi", { face: "angry" }), set("mu", { face: "angry" }), set("quin", { face: "angry" })],
    [say("quin", "Battle royale! Topik: apa yang harus dicek sebelum uji t?", "Battle royale! Topic: what must we check before a t-test?", 2700)],

    // Sigi: normalitas
    [set("sigi", { pose: "charge", aura: true }), say("sigi", "Ombak Distribusi Normal! Cek normalitas dulu!", "Normal Distribution Wave! Check normality first!", 2100)],
    [set("sigi", { pose: "cast" }), { who: "sigi", shoot: { kind: "tide", at: "mu", speed: 440 } }],
    [
      set("sigi", { pose: "idle", aura: false }),
      set("mu", { face: "hurt" }),
      { who: "mu", knock: { from: "sigi", px: 90, up: 30 } },
      { burst: { kind: "steam", at: "mu", ms: 1000 } },
    ],

    // Mu: kesamaan varians
    [set("mu", { pose: "charge", face: "angry", aura: true }), say("mu", "Bola Api Rata-rata! Varians kedua kelompok juga harus mirip!", "Mean Fireball! Both groups need similar variances too!", 2600)],
    [set("mu", { pose: "cast" }), { who: "mu", shoot: { kind: "fireball", at: "quin", speed: 560 } }],
    [
      set("mu", { pose: "idle", aura: false }),
      set("quin", { face: "hurt" }),
      { who: "quin", knock: { from: "mu", px: 80, up: 40 } },
      { who: "quin", fx: "sweat", ms: 1000 },
    ],

    // Quin: outlier ekstrem
    [set("quin", { pose: "charge", face: "angry", aura: true }), say("quin", "Sambaran Outlier! Periksa nilai ekstrem sebelum menguji!", "Outlier Strike! Check extreme values before testing!", 2600)],
    [{ who: "quin", dash: { near: "sigi", gap: 180 } }],
    [{ who: "quin", strike: { kind: "thunder", at: "sigi", ms: 650 } }],
    [
      set("quin", { pose: "idle", aura: false }),
      set("sigi", { face: "ko" }),
      { who: "sigi", fx: "stars", ms: 2200 },
      { who: "sigi", knock: { from: "quin", px: 70, up: 30 } },
    ],

    // Rangkuman
    [wait(1000)],
    [set("sigi", { face: "think" }), set("mu", { face: "think" }), set("quin", { face: "think" }), say("mu", "Jadi urutannya: lihat dulu datanya...", "So the order is: look at the data first...", 2000)],
    [say("quin", "...cek asumsi: normalitas, varians, outlier...", "...check assumptions: normality, variance, outliers...", 2400)],
    [say("sigi", "...baru jalankan ujinya dan jelaskan hasilnya.", "...then run the test and explain the result.", 2400)],
    [{ who: "mu", walk: 0.5 }, { who: "sigi", walk: 0.4 }, { who: "quin", walk: 0.6 }],
    [set("sigi", { pose: "cheer", face: "love" }), set("mu", { pose: "cheer", face: "love" }), set("quin", { pose: "cheer", face: "love" }), { who: "sigi", fx: "heart", ms: 1400 }, { who: "mu", fx: "heart", ms: 1400 }, { who: "quin", fx: "heart", ms: 1400 }, wait(1600)],
  ],
};

/** Pamer jurus: tiap maskot memperagakan jurusnya sambil menjelaskan konsep statistiknya. */
const showoff: Episode = {
  id: "showoff",
  weight: 0.9,
  steps: [
    [{ who: "sigi", walk: 0.25 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.75 }],
    [turn("sigi", "right"), turn("mu", "sigi"), turn("quin", "sigi")],
    [set("sigi", { pose: "charge", face: "cool", aura: true }), say("sigi", "Lihat jurusku!", "Behold my technique!", 1400)],
    [{ who: "sigi", jump: { h: 70, ms: 600 } }, { who: "sigi", strike: { kind: "geyser", at: "sigi", ms: 1300 }, after: 200 }, set("sigi", { pose: "cast" })],
    [set("sigi", { pose: "cheer", face: "happy", aura: false }), say("sigi", "Pancuran Interval Kepercayaan! Rentang perkiraan untuk nilai populasi.", "Confidence Interval Geyser! A range estimate for the population value.", 3100), set("mu", { face: "wow" }), set("quin", { face: "wow" })],

    [turn("mu", "right"), set("mu", { pose: "charge", face: "cool", aura: true }), say("mu", "Sekarang giliranku!", "Now it's my turn!", 1400)],
    [{ who: "mu", fly: { y: 80, ms: 550 } }, { who: "mu", strike: { kind: "pillar", at: "mu", ms: 1300 }, after: 450 }, set("mu", { pose: "cast" })],
    [{ who: "mu", land: true }, set("mu", { pose: "cheer", face: "happy" }), say("mu", "Pilar Api Parameter! Rata-rata sampel memperkirakan rata-rata populasi.", "Parameter Fire Pillar! A sample mean estimates the population mean.", 3200), set("sigi", { pose: "idle", face: "wow" }), set("quin", { face: "wow" })],

    [turn("quin", "right"), set("quin", { pose: "charge", face: "cool", aura: true }), say("quin", "Dan ini giliranku!", "And here comes mine!", 1400)],
    [{ who: "quin", dash: 0.9 }, { who: "quin", dash: 0.6, after: 500 }, { who: "quin", strike: { kind: "thunder", at: "quin", ms: 700 }, after: 950 }],
    [set("quin", { pose: "cheer", face: "happy", aura: false }), say("quin", "Badai Listrik Q3! Kuartil membagi data menjadi empat bagian sama banyak.", "Q3 Thunderstorm! Quartiles split data into four equal parts.", 3200), set("sigi", { face: "wow" }), set("mu", { face: "wow" })],

    [set("sigi", { pose: "cheer", face: "love" }), set("mu", { pose: "cheer", face: "love" }), set("quin", { pose: "cheer", face: "love" }), say("sigi", "Nilai sepuluh untuk semuanya!", "Ten out of ten for everyone!", 1900)],
  ],
};

const greet: Episode = {
  id: "greet",
  weight: 1.2,
  steps: [
    [{ who: "sigi", walk: { near: "mu", gap: 30 } }],
    [{ who: "mu", turn: "sigi" }, { who: "sigi", set: { pose: "wave", face: "talk" } }, { who: "sigi", say: T("Hai Mu! Rata-rata hari ini berapa?", "Hi Mu! What's today's mean?") }],
    [{ who: "mu", set: { face: "talk" } }, { who: "mu", say: T("Sudah kuhitung! Tapi sebarannya urusanmu, Sigi.", "Calculated! But the spread is your job, Sigi.") }],
    [{ who: "sigi", set: { pose: "idle", face: "wink" } }, { who: "sigi", say: T("Betul. Rata-rata saja belum cukup.", "True. A mean alone is not enough.") }],
    [{ who: "mu", set: { pose: "cheer", face: "happy" } }, { who: "sigi", set: { pose: "cheer", face: "happy" } }, { who: "sigi", hop: true }, { wait: 1000 }],
  ],
};

const quiz: Episode = {
  id: "quiz",
  weight: 1,
  steps: [
    [{ who: "quin", walk: 0.5 }, { who: "mu", walk: 0.26 }, { who: "sigi", walk: 0.76 }],
    [{ who: "mu", turn: "quin" }, { who: "sigi", turn: "quin" }, { who: "quin", set: { face: "talk", pose: "point" } }],
    [{ who: "quin", say: T("Kuis kilat! p = 0,03. Signifikan pada α = 0,05?", "Pop quiz! p = 0.03. Significant at α = 0.05?") }],
    [{ who: "mu", set: { pose: "cheer", face: "wow" } }, { who: "mu", hop: true }, { who: "mu", say: T("Ya! 0,03 lebih kecil dari 0,05.", "Yes! 0.03 is smaller than 0.05.") }],
    [{ who: "sigi", set: { face: "think" } }, { who: "sigi", say: T("Setuju. Tapi signifikan belum tentu penting!", "Agreed. But significant isn't always important!") }],
    [{ who: "quin", set: { pose: "cheer", face: "happy" } }, { who: "quin", say: T("Dua-duanya benar! Signifikan ≠ penting secara praktis.", "Both right! Significant ≠ practically important.") }],
    [{ who: "mu", set: { face: "happy" } }, { who: "sigi", set: { pose: "cheer", face: "happy" } }, { who: "quin", fx: "spark", ms: 1200 }, { wait: 1100 }],
  ],
};

const chase: Episode = {
  id: "chase",
  weight: 0.9,
  steps: [
    [{ who: "mu", walk: 0.2 }, { who: "quin", walk: 0.46 }],
    [{ who: "quin", turn: "mu" }, { who: "quin", set: { face: "wink" } }, { who: "quin", say: T("Tangkap aku kalau bisa!", "Catch me if you can!") }],
    [{ who: "quin", walk: 0.9, run: true }, { who: "mu", set: { face: "angry" } }, { who: "mu", walk: { near: "quin", gap: 6 }, run: true }],
    [{ who: "mu", walk: { near: "quin", gap: 6 }, run: true }],
    [{ who: "quin", set: { face: "wow" } }, { who: "quin", walk: 0.12, run: true }, { who: "mu", walk: { near: "quin", gap: 6 }, run: true, speed: 330 }],
    [{ who: "mu", set: { pose: "point", face: "happy" } }, { who: "mu", fx: "spark", ms: 1000 }, { who: "mu", say: T("Kena! Sekarang kamu yang jaga.", "Tag! You're it now.") }],
    [{ who: "quin", set: { pose: "idle", face: "flat" } }, { who: "quin", say: T("Curang! Aku kan outlier, memang paling cepat.", "No fair! I'm an outlier, of course I'm fastest.") }],
  ],
};

const race: Episode = {
  id: "race",
  weight: 0.8,
  steps: [
    [{ who: "sigi", walk: 0.06 }, { who: "mu", walk: 0.12 }, { who: "quin", walk: 0.18 }],
    [{ who: "sigi", turn: "right" }, { who: "mu", turn: "right" }, { who: "quin", turn: "right" }, { who: "quin", set: { face: "talk", pose: "wave" } }],
    [{ who: "quin", say: T("Siap... mulai!", "Ready... go!"), ms: 1400 }],
    [{ who: "sigi", walk: 0.9, run: true, speed: 250 }, { who: "mu", walk: 0.94, run: true, speed: 262 }, { who: "quin", walk: 0.86, run: true, speed: 256 }],
    [{ who: "sigi", set: { face: "wow" } }, { who: "mu", set: { face: "wow" } }, { who: "quin", set: { face: "wow" } }, { who: "quin", say: T("Foto finis! Selisihnya kecil sekali.", "Photo finish! The gap is tiny."), ms: 2200 }],
    [{ who: "sigi", set: { face: "think" } }, { who: "sigi", say: T("Selisihnya signifikan nggak, ya?", "Is the difference even significant?") }],
    [{ who: "mu", set: { pose: "cheer", face: "talk" } }, { who: "mu", say: T("Ayo kita uji t dulu!", "Let's run a t-test first!") }],
  ],
};

const dance: Episode = {
  id: "dance",
  weight: 0.7,
  steps: [
    [{ who: "sigi", walk: 0.4 }, { who: "mu", walk: 0.52 }, { who: "quin", walk: 0.64 }],
    [{ who: "sigi", set: { pose: "wave", face: "happy" } }, { wait: 500 }],
    [{ who: "mu", set: { pose: "wave", face: "happy" } }, { wait: 500 }],
    [{ who: "quin", set: { pose: "wave", face: "happy" } }, { wait: 500 }],
    [{ who: "sigi", set: { pose: "cheer", face: "love" } }, { who: "mu", set: { pose: "cheer", face: "love" } }, { who: "quin", set: { pose: "cheer", face: "love" } }, { who: "sigi", hop: true }, { who: "mu", hop: true }, { who: "quin", hop: true }, { who: "mu", fx: "heart", ms: 1500 }, { wait: 1700 }],
  ],
};

const demo: Episode = {
  id: "demo",
  weight: 1,
  sections: ["demo"],
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.62 }, { who: "quin", walk: 0.8 }],
    [{ who: "sigi", turn: "mu" }, { who: "quin", turn: "mu" }, { who: "mu", turn: "right" }, { who: "mu", set: { face: "talk", pose: "point" } }],
    [{ who: "mu", say: T("Pilih analisis, lalu lihat ceritanya muncul.", "Pick an analysis and watch the story appear.") }],
    [{ who: "sigi", set: { face: "wow" } }, { who: "sigi", say: T("Grafiknya tergambar otomatis!", "The chart draws itself!") }],
    [{ who: "quin", set: { face: "smile", pose: "idle" } }, { who: "quin", say: T("Hitungannya pakai SciPy dan statsmodels.", "The math runs on SciPy and statsmodels.") }],
    [{ who: "mu", set: { pose: "cheer", face: "happy" } }, { who: "sigi", set: { pose: "cheer", face: "happy" } }, { wait: 1000 }],
  ],
};

const accuracy: Episode = {
  id: "accuracy",
  weight: 1,
  sections: ["akurasi"],
  steps: [
    [{ who: "quin", walk: 0.36 }, { who: "mu", walk: 0.56 }, { who: "sigi", walk: 0.76 }],
    [{ who: "mu", turn: "quin" }, { who: "sigi", turn: "quin" }, { who: "quin", turn: "mu" }],
    [{ who: "quin", set: { face: "think" } }, { who: "quin", say: T("Soal akurasi, kami jujur: ini hasil uji awal.", "On accuracy, we're honest: these are early results.") }],
    [{ who: "mu", set: { face: "talk" } }, { who: "mu", say: T("Barunya pada knowledge base mini, ya.", "Only on a mini knowledge base so far.") }],
    [{ who: "sigi", set: { face: "happy", pose: "cheer" } }, { who: "sigi", say: T("Evaluasi yang lebih luas sedang berjalan!", "A broader evaluation is underway!") }],
    [{ who: "quin", set: { face: "wink", pose: "idle" } }, { who: "mu", set: { face: "smile" } }, { wait: 900 }],
  ],
};

const nap: Episode = {
  id: "nap",
  weight: 0.8,
  sections: ["footer", "early-access", "mulai"],
  steps: [
    [{ who: "mu", walk: 0.5 }, { who: "sigi", walk: 0.3 }, { who: "quin", walk: 0.7 }],
    [{ who: "mu", set: { face: "sleep" } }, { who: "sigi", turn: "mu" }, { who: "quin", turn: "mu" }],
    [{ who: "sigi", set: { face: "flat" } }, { who: "sigi", say: T("Sst... Mu ketiduran.", "Shh... Mu fell asleep."), ms: 1800 }],
    [{ who: "quin", walk: { near: "mu", gap: 30 }, speed: 45 }, { who: "sigi", walk: { near: "mu", gap: 30 }, speed: 45 }],
    [{ who: "quin", set: { face: "wink" } }, { who: "quin", say: T("Kita bangunkan dengan kejutan?", "Wake her with a surprise?"), ms: 1900 }],
    [{ who: "sigi", set: { pose: "cheer", face: "wow" } }, { who: "quin", set: { pose: "cheer", face: "wow" } }, { who: "mu", set: { face: "wow", pose: "cheer" } }, { who: "mu", hop: true }, { who: "mu", say: T("Aku bangun! Aku bangun!", "I'm up! I'm up!"), ms: 1600 }],
  ],
};

/** Penutup: ketiganya menyatukan jurus menjadi kembang api untuk mengajak pengunjung mencoba. */
const finale: Episode = {
  id: "finale",
  weight: 1,
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.54 }, { who: "quin", walk: 0.68 }],
    [turn("mu", "sigi"), turn("quin", "sigi"), turn("sigi", "right"), set("sigi", { pose: "point", face: "talk" })],
    [say("sigi", "Siap mengubah angkamu jadi cerita?", "Ready to turn your numbers into a story?", 2500)],
    [set("sigi", { pose: "charge", face: "cool", aura: true }), set("mu", { pose: "charge", face: "cool", aura: true }), set("quin", { pose: "charge", face: "cool", aura: true }), say("mu", "Satukan jurus kita!", "Combine our techniques!", 1800)],
    [
      { who: "sigi", jump: { h: 56, ms: 600 } },
      { who: "mu", jump: { h: 56, ms: 600 } },
      { who: "quin", jump: { h: 56, ms: 600 } },
      { who: "sigi", strike: { kind: "geyser", at: "sigi", ms: 1500 } },
      { who: "mu", strike: { kind: "pillar", at: "mu", ms: 1500 } },
      { who: "quin", strike: { kind: "thunder", at: "quin", ms: 700 } },
      { burst: { kind: "splash", at: 0.46, y: 190, ms: 900 }, after: 300 },
      { burst: { kind: "blast", at: 0.58, y: 215, ms: 900 }, after: 500 },
      { burst: { kind: "shock", at: 0.7, y: 195, ms: 900 }, after: 700 },
    ],
    [set("sigi", { pose: "cheer", face: "happy", aura: false }), set("mu", { pose: "cheer", face: "happy", aura: false }), set("quin", { pose: "cheer", face: "happy", aura: false }), say("mu", "Ayo coba sekarang!", "Try it now!", 1800)],
    [set("quin", { face: "wink" }), { who: "quin", hop: true }, say("quin", "Kami tunggu di dalam!", "We'll be waiting inside!", 1800)],
    [{ who: "sigi", fx: "heart", ms: 1500 }, { who: "mu", fx: "heart", ms: 1500 }, { who: "quin", fx: "heart", ms: 1500 }, wait(1500)],
  ],
};

export const SCRIPTS: Scripts = {
  episodes: [duelMeanVsSpread, duelMeanVsMedian, duelHistogramVsBoxplot, battleRoyale, showoff, greet, quiz, chase, race, dance, demo, accuracy, nap],
  finale,
  poke: [
    T("Hei, geli!", "Hey, that tickles!"),
    T("Mau lihat jurusku?", "Want to see my technique?"),
    T("Awas, aku lagi mengisi tenaga...", "Careful, I'm charging up..."),
    T("Klik lagi, kutunjukkan triknya!", "Click again, I'll show you a trick!"),
    T("Simpangan bakuku kecil, lho!", "My standard deviation is tiny!"),
  ],
  pokeReply: [
    T("Jangan diganggu, dong!", "Leave them alone!"),
    T("Hehe, dia memang gampang kaget.", "Hehe, easily startled."),
    T("Aku juga mau diklik!", "Click me too!"),
  ],
};
