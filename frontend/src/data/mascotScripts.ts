import type { Action, ActorId, Episode, Look, Scripts, Step, Text } from "@/lib/mascotEngine";

/**
 * Skrip interaksi tiga maskot helm (Sigi, Mu, Quin).
 * Percakapan santai, lucu, bertema kehidupan sehari-hari, tebak-tebakan receh, dan candaan seru.
 * Semua percakapan dwibahasa (ID & EN).
 *
 *   Sigi (biru)   = AIR. Kalem, santai, sok bijak, tapi aslinya mager dan hobi ngopi/boba.
 *   Mu   (merah)  = API. Berapi-api, gampang lapar, dramatis, suka ngajak makan tapi pura-pura lupa dompet.
 *   Quin (kuning) = PETIR. Jahil, hiperaktif, suka nge-spill candaan receh dan menggoda Sigi/Mu.
 */
const T = (id: string, en: string): Text => ({ id, en });

const say = (who: ActorId, id: string, en: string, ms?: number): Action => ({ who, say: T(id, en), ms });
const shout = (who: ActorId, m: Text, ms = 1100): Action => ({ who, say: m, ms, style: "shout" });
const set = (who: ActorId, s: Partial<Look>): Action => ({ who, set: s });
const turn = (who: ActorId, to: ActorId | "left" | "right"): Action => ({ who, turn: to });
const wait = (ms: number): Action => ({ wait: ms });
const hearts = (...who: ActorId[]): Action[] => who.map((w) => ({ who: w, fx: "heart" as const, ms: 1400 }));
const allSet = (s: Partial<Look>): Action[] => (["sigi", "mu", "quin"] as ActorId[]).map((w) => set(w, s));

// Daftar jurus lucu sehari-hari
const MOVE = {
  // Sigi (air)
  bubble: T("Gelembung Sabun Cuci!", "Dish Soap Bubble!"),
  jet: T("Semprotan Air Selang!", "Garden Hose Blast!"),
  wave: T("Ombak Pantai Anyer!", "Relaxing Beach Wave!"),
  geyser: T("Pancuran Gayung Bocor!", "Hot Spring Geyser!"),
  rain: T("Hujan Gerimis Mager!", "Cozy Rain Drizzle!"),
  shield: T("Payung Anti Hujan!", "Waterproof Umbrella!"),
  // Mu (api)
  fireball: T("Lemparan Bakso Mercon!", "Spicy Meatball Throw!"),
  flame: T("Semburan Api Kompor!", "Gas Stove Flamethrower!"),
  pillar: T("Pilar Api Semangat Membara!", "Burning Spirit Pillar!"),
  meteor: T("Hujan Donat Panas!", "Hot Donut Rain!"),
  ring: T("Cincin Api Sirkus!", "Circus Fire Ring!"),
  // Quin (petir)
  bolt: T("Setruman Stopkontak!", "Socket Static Zap!"),
  flash: T("Jepretan Kamera Flash!", "Flash Camera Snap!"),
  strike: T("Sambaran Diskon Kilat 99%!", "99% Flash Sale Strike!"),
  storm: T("Badai Tagihan Listrik!", "Electric Bill Storm!"),
  chain: T("Rantai Gosip Warga!", "Group Chat Gossip Chain!"),
};

/** Aba-aba duel: kedua pihak berhadapan dan menyiapkan diri. */
const faceOff = (a: ActorId, b: ActorId, ref: ActorId): Step => [turn(a, b), turn(b, a), turn(ref, a), set(ref, { face: "talk", pose: "wave" })];

// ---------- Episode 1: Debat Bubur Diaduk vs Tidak Diaduk ----------
const duelMeanVsSpread: Episode = {
  id: "duel-mean-vs-spread",
  weight: 1.6,
  steps: [
    [{ who: "sigi", walk: 0.24 }, { who: "mu", walk: 0.6 }, { who: "quin", walk: 0.9 }],
    faceOff("sigi", "mu", "quin"),
    [say("quin", "Debat akbar dimulai! Bubur ayam lebih nikmat diaduk atau gak diaduk?!", "Grand debate time! Chicken porridge: stirred or unstirred?!", 3300)],
    [set("quin", { pose: "idle", face: "smug" }), set("sigi", { face: "cool" }), say("sigi", "Jelas diaduk dong! Semua bumbu, suwiran ayam, dan cakwe menyatu sempurna.", "Stirred of course! All the seasoning, chicken, and toppings blend in harmony.", 2900)],
    [set("mu", { face: "angry" }), say("mu", "TIDAK BISA! Bubur gak diaduk itu seni estetika! Kalau diaduk kayak semen cor!", "NO WAY! Unstirred porridge is pure art! Stirred looks like wet concrete!", 2900)],

    // Babak 1: Mu menembak, Sigi melompat
    [set("mu", { pose: "charge", face: "shout", aura: true }), shout("mu", MOVE.fireball)],
    [set("mu", { pose: "cast" }), { who: "mu", shoot: { kind: "fireball", at: "sigi", miss: 36 } }, { who: "sigi", jump: { h: 96, ms: 720 }, after: 420 }],
    [set("mu", { pose: "idle", face: "wow", aura: false }), set("sigi", { face: "wink" }), say("sigi", "Meleset! Yang penting masuk perut tetap kenyang!", "Missed! What matters is filling the belly happily!", 2600)],

    // Babak 2: Sigi pasang perisai, Mu terbang
    [set("sigi", { pose: "charge", face: "shout", aura: true }), shout("sigi", MOVE.shield)],
    [{ burst: { kind: "shield", at: "sigi", ms: 1100 } }, set("sigi", { pose: "idle" }), { who: "mu", fly: { y: 118, ms: 520 } }],
    [set("mu", { pose: "charge", face: "shout" }), shout("mu", MOVE.meteor, 1300)],
    [{ who: "mu", strike: { kind: "meteor", at: "sigi", ms: 1500 } }, set("sigi", { face: "wow" })],
    [set("sigi", { face: "smile", aura: false }), set("mu", { face: "hurt", pose: "air" }), say("sigi", "Perisai bertahan! Selera orang beda-beda, santai aja!", "Shield holds! Everyone has their own taste, chill out!", 2800)],

    // Babak 3: adu semburan
    [set("mu", { pose: "cast", face: "angry" }), shout("mu", MOVE.flame, 1000)],
    [
      { who: "mu", beam: { kind: "flame", at: "sigi", ms: 1300 } },
      set("sigi", { pose: "cast", face: "angry", aura: true }),
      { who: "sigi", say: MOVE.jet, ms: 1100, after: 150, style: "shout" },
      { who: "sigi", beam: { kind: "jet", at: "mu", ms: 1150 }, after: 250 },
      { burst: { kind: "steam", at: 0.43, y: 88, ms: 900 }, after: 500 },
    ],
    [set("mu", { pose: "idle", face: "hurt", aura: false }), { who: "mu", knock: { from: "sigi", px: 150, up: 70 } }, { who: "mu", fx: "sweat", ms: 1000 }, set("sigi", { pose: "idle", face: "happy", aura: false })],
    [{ who: "sigi", fly: { y: 100, ms: 600 } }, set("mu", { face: "sad" })],
    [set("sigi", { pose: "charge", face: "shout", aura: true }), shout("sigi", MOVE.rain, 1200)],
    [{ who: "sigi", strike: { kind: "rain", at: "mu", ms: 1500 } }, set("sigi", { pose: "cast" })],
    [set("mu", { face: "ko", pose: "idle" }), { who: "mu", fx: "stars", ms: 2200 }, { burst: { kind: "steam", at: "mu", ms: 1100 } }, { who: "sigi", land: true }],
    [set("sigi", { pose: "cheer", face: "happy", aura: false }), { who: "sigi", hop: true }, say("sigi", "Biar adil, sarapan bubur sekarang, siangnya makan mie ayam!", "To be fair, porridge for breakfast, chicken noodles for lunch!", 2900)],

    // Penutup duel
    [set("quin", { pose: "charge", face: "shout", aura: true }), shout("quin", MOVE.strike, 1000)],
    [{ who: "quin", strike: { kind: "thunder", at: 0.5, ms: 800 } }],
    [{ who: "quin", walk: { near: "mu", gap: 20 }, run: true }, set("sigi", { pose: "idle", face: "smile" }), set("quin", { aura: false })],
    [turn("quin", "mu"), set("quin", { face: "talk" }), say("quin", "Putusan wasit: buburnya udah dingin. Mending kita beli es teh bareng!", "Ref verdict: the porridge is cold now. Let's go grab iced tea!", 3000)],
    [{ who: "quin", shoot: { kind: "orb", at: "mu", speed: 600 } }],
    [set("mu", { face: "wow", pose: "cheer" }), { who: "mu", hop: true }, say("mu", "Aduh! Iya deh, es teh manis jumbo aku yang traktir!", "Ouch! Alright, jumbo iced tea is on me!", 2500)],
    [{ who: "sigi", walk: { near: "mu", gap: 16 } }],
    [set("sigi", { pose: "cheer", face: "love" }), set("mu", { pose: "cheer", face: "love" }), ...hearts("sigi", "mu"), say("sigi", "Mantap Mu! Jangan lupa bakwannya juga ya!", "Awesome Mu! Don't forget the fritters too!", 2000)],
  ],
};

// ---------- Episode 2: Rebutan Bakwan Terakhir ----------
const duelMeanVsMedian: Episode = {
  id: "duel-mean-vs-median",
  weight: 1.6,
  steps: [
    [{ who: "mu", walk: 0.3 }, { who: "quin", walk: 0.66 }, { who: "sigi", walk: 0.9 }],
    faceOff("mu", "quin", "sigi"),
    [say("sigi", "Ronde dua! Ada satu bakwan goreng tersisa di meja makan... milik siapa ini?", "Round two! There's one crispy fritter left on the table... who gets it?", 3100)],
    [set("sigi", { pose: "idle", face: "smile" }), set("quin", { face: "smug" }), say("quin", "Jelas milikku dong! Aku yang pertama kali ngeliat dengan mata elangku!", "Mine of course! I spotted it first with my eagle eyes!", 3000)],
    [set("mu", { face: "angry" }), say("mu", "Langkahilah mayatku dulu! Perutku sudah konser rock dari tadi!", "Over my dead body! My stomach is having a rock concert!", 2800)],

    // Babak 1
    [set("quin", { pose: "charge", face: "shout", aura: true }), shout("quin", MOVE.flash)],
    [{ who: "quin", dash: { near: "mu", gap: 30 } }, { who: "mu", jump: { to: 0.12, h: 90, ms: 650 }, after: 120 }],
    [set("quin", { pose: "idle", face: "smug", aura: false }), turn("quin", "mu"), say("quin", "Kecepatan tanganku mengalahkan alasan lapar apapun!", "My hand speed beats any hungry excuses!", 2500)],

    // Babak 2
    [set("mu", { pose: "charge", face: "shout", aura: true }), shout("mu", MOVE.pillar)],
    [set("mu", { pose: "cast" }), { who: "mu", strike: { kind: "pillar", at: "quin", ms: 1000 } }, { who: "quin", dash: 0.86, after: 260 }],
    [set("mu", { pose: "charge" }), shout("mu", MOVE.ring, 1000)],
    [{ burst: { kind: "ring", at: "mu", y: 40, ms: 800 } }, { burst: { kind: "blast", at: "mu", y: 30, ms: 700 }, after: 150 }, set("quin", { face: "wow" }), { who: "quin", hop: true }],
    [set("mu", { pose: "idle", aura: false, face: "cool" }), turn("quin", "mu"), say("mu", "Demi gorengan renyah, semangat apiku takkan padam!", "For a crispy snack, my fiery passion will never fade!", 2600)],

    // Babak 3
    [{ who: "quin", fly: { y: 130, ms: 600 } }, set("mu", { face: "think" })],
    [set("quin", { pose: "charge", face: "shout" }), shout("quin", MOVE.storm, 1200)],
    [{ who: "quin", strike: { kind: "storm", at: "mu", ms: 1300 } }, set("quin", { pose: "cast" })],
    [set("mu", { face: "hurt" }), { who: "mu", fx: "stars", ms: 1200 }, { who: "mu", knock: { from: "quin", px: 70 } }],
    [set("mu", { pose: "charge", face: "shout", aura: true }), shout("mu", MOVE.fireball, 1200)],
    [set("mu", { pose: "cast" }), { who: "mu", shoot: { kind: "fireball", at: "quin", speed: 560 } }],
    [set("quin", { face: "ko", pose: "idle", aura: false }), { who: "quin", knock: { from: "mu", px: 110, up: 50 } }, { who: "quin", fx: "stars", ms: 2400 }, set("mu", { pose: "idle", aura: false, face: "happy" })],
    [{ who: "quin", land: true }],
    [set("mu", { pose: "cheer", face: "happy" }), { who: "mu", hop: true }, say("mu", "Hahaha! Bakwan hangat ini akhirnya jadi milik sang juara!", "Hahaha! The warm fritter is finally mine, the champion!", 2800)],

    // Akhir episode
    [set("quin", { pose: "sit", face: "sad" }), say("quin", "Gosong deh... tapi tadi pas rebutan udah kucuil ujungnya sedikit hehe.", "Toasted... but I already took a tiny bite earlier hehe.", 2500)],
    [{ who: "mu", walk: { near: "quin", gap: 14 }, run: true }],
    [set("quin", { face: "think", pose: "idle" }), say("quin", "Yaudah bagi dua aja yuk, jangan pelit-pelit sama sahabat.", "Let's just split it in half, don't be stingy with your bestie.", 2400)],
    [...allSet({ pose: "cheer", face: "love" }), ...hearts("mu", "quin"), wait(1500)],
  ],
};

// ---------- Episode 3: Mandi Pagi Air Dingin ----------
const duelHistogramVsBoxplot: Episode = {
  id: "duel-histogram-vs-boxplot",
  weight: 1.6,
  steps: [
    [{ who: "quin", walk: 0.3 }, { who: "sigi", walk: 0.64 }, { who: "mu", walk: 0.92 }],
    faceOff("quin", "sigi", "mu"),
    [say("mu", "Pengumuman darurat: air kamar mandi subuh ini dinginnya kayak es balok!", "Emergency announcement: the bath water this dawn is freezing cold!", 3000)],
    [set("mu", { pose: "idle", face: "smile" }), set("sigi", { face: "cool" }), say("sigi", "Alasan melulu! Mandi air dingin subuh itu bikin seger dan awet muda!", "Always making excuses! Cold morning showers keep you fresh and youthful!", 2800)],
    [set("quin", { face: "angry" }), say("quin", "Skip mandi! Semprot parfum lima kali, langsung siap berangkat nongkrong!", "Skip the shower! Spray perfume five times, ready to roll!", 2800)],

    [set("sigi", { pose: "charge", face: "shout", aura: true }), shout("sigi", MOVE.bubble)],
    [set("sigi", { pose: "cast" }), { who: "sigi", shoot: { kind: "bubble", at: "quin", speed: 400 } }, { who: "quin", dash: 0.14, after: 560 }],
    [set("sigi", { pose: "idle", aura: false, face: "wow" }), turn("quin", "sigi"), set("quin", { face: "wink" }), say("quin", "Parfum vanilaku tahan 24 jam wlee, gak perlu sabunan!", "My vanilla perfume lasts 24 hours blehh, no soap needed!", 2700)],

    [set("sigi", { pose: "charge", face: "shout", aura: true }), shout("sigi", MOVE.geyser, 1300)],
    [set("sigi", { pose: "cast" }), { who: "sigi", strike: { kind: "geyser", at: "quin", ms: 1100 } }, { who: "quin", fly: { y: 125, ms: 520 }, after: 260 }],
    [set("sigi", { pose: "idle", aura: false, face: "think" }), set("quin", { face: "cool" }), say("sigi", "Rasakan kesegaran gayung alami! Biar melek matamu!", "Feel the natural bucket splash! Open your sleepy eyes!", 2700)],

    [set("quin", { pose: "charge", face: "shout", aura: true }), shout("quin", MOVE.strike, 1200)],
    [
      set("quin", { pose: "cast" }),
      { who: "quin", strike: { kind: "thunder", at: "sigi", ms: 1000 } },
      set("sigi", { face: "hurt" }),
      { who: "sigi", fx: "stars", ms: 900 },
    ],

    // Sigi membalas dengan ombak lantai (tide), tapi Quin masih terbang di atas!
    [set("sigi", { pose: "charge", face: "angry", aura: true }), shout("sigi", MOVE.wave, 1100)],
    [
      set("sigi", { pose: "cast" }),
      { who: "sigi", shoot: { kind: "tide", at: "quin", speed: 420 } },
    ],

    // Ombak pantai lewat di bawah, Quin yang terbang di atas tidak kena dan meledek Sigi
    [
      set("sigi", { pose: "idle", aura: false, face: "wow" }),
      turn("quin", "sigi"),
      set("quin", { pose: "air", face: "smug" }),
      say("quin", "Hahaha meleset wlee! Ombakmu lewat di bawah, aku kan lagi terbang di atas!", "Hahaha missed blehh! Your wave rolled underneath, I'm flying up high!", 2900),
    ],

    // Sigi mendongak ke atas dan melancarkan serangan udara: Hujan Guyuran Dari Langit!
    [
      turn("sigi", "quin"),
      set("sigi", { pose: "charge", face: "shout", aura: true }),
      shout("sigi", MOVE.rain, 1200),
      say("sigi", "Oh bisa terbang ya? Rasakan GUYURAN AIR DARI LANGIT!", "Oh you can fly? Taste a DIRECT DOWNPOUR FROM ABOVE!", 2800),
    ],
    [
      set("sigi", { pose: "cast" }),
      { who: "sigi", strike: { kind: "rain", at: "quin", ms: 1400 } },
    ],

    // Quin diguyur dari atas di udara, basah kuyup, lalu jatuh mendarat ke lantai
    [
      set("quin", { face: "ko", pose: "air", aura: false }),
      { who: "quin", fx: "stars", ms: 2400 },
      { who: "quin", knock: { from: "sigi", px: 40, up: 20 } },
    ],
    [{ who: "quin", land: true }],
    [set("sigi", { pose: "cheer", face: "happy", aura: false }), { who: "sigi", hop: true }, say("sigi", "Nah kan basah kuyup dari atas! Sekarang udah resmi sah mandi pagi!", "See, soaked from above! Now you've officially showered this morning!", 2900)],

    [set("quin", { face: "wow", pose: "cheer" }), { who: "quin", hop: true }, say("quin", "Brrr menggigil! Iya deh seger banget ternyata!", "Brrr shivering! Okay fine, it actually feels so refreshing!", 2300)],
    [{ who: "mu", walk: { near: "sigi", gap: 22 }, run: true }, set("sigi", { pose: "idle", face: "smile" })],
    [turn("mu", "sigi"), set("mu", { face: "talk" }), say("mu", "Kalau aku sih tetap tim air hangat pakai kompor ya teman-teman.", "As for me, I'm still firmly team warm water from the stove, guys.", 2800)],
    [set("quin", { face: "think", pose: "idle" }), say("quin", "Sama Mu, kalau air es bikin jiwa ragaku terguncang.", "Same Mu, ice cold water shakes my soul to the core.", 2400)],
    [...allSet({ pose: "cheer", face: "love" }), ...hearts("sigi", "mu", "quin"), wait(1500)],
  ],
};

// ---------- Episode 4: Siapa yang Bayar Parkir & Kopi ----------
const battleRoyale: Episode = {
  id: "battle-royale",
  weight: 1.4,
  steps: [
    [{ who: "sigi", walk: 0.2 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.8 }],
    [turn("sigi", "mu"), turn("mu", "quin"), turn("quin", "mu"), ...allSet({ face: "angry" })],
    [say("quin", "Battle nongkrong! Yang kena serangan pertama, bayarin parkir & kopi!", "Hangout battle! Whoever gets hit first pays for parking & coffee!", 3000)],

    [set("sigi", { pose: "charge", aura: true }), say("sigi", "Ombak Santai! Dompetku sisa uang receh koin!", "Chill Wave! My wallet only has spare coins left!", 2200)],
    [set("sigi", { pose: "cast" }), { who: "sigi", shoot: { kind: "tide", at: "mu", speed: 440 } }],
    [set("sigi", { pose: "idle", aura: false }), set("mu", { face: "hurt" }), { who: "mu", knock: { from: "sigi", px: 90, up: 30 } }, { burst: { kind: "steam", at: "mu", ms: 1000 } }],

    [set("mu", { pose: "charge", face: "shout", aura: true }), say("mu", "Lemparan Bakso Pedas! Dompetku ketinggalan di rumah!", "Spicy Meatball! I forgot my wallet at home!", 2400)],
    [set("mu", { pose: "cast" }), { who: "mu", shoot: { kind: "fireball", at: "quin", speed: 560 } }],
    [set("mu", { pose: "idle", aura: false }), set("quin", { face: "hurt" }), { who: "quin", knock: { from: "mu", px: 80, up: 40 } }, { who: "quin", fx: "sweat", ms: 1000 }],

    [set("quin", { pose: "charge", face: "shout", aura: true }), shout("quin", MOVE.strike, 1100)],
    [{ who: "quin", strike: { kind: "thunder", at: "mu", ms: 750 } }, { who: "quin", chain: { via: ["mu", "sigi"], ms: 1000 }, after: 320 }],
    [set("quin", { pose: "idle", aura: false }), set("sigi", { face: "ko" }), set("mu", { face: "ko" }), { who: "sigi", fx: "stars", ms: 2200 }, { who: "mu", fx: "stars", ms: 2200 }, { who: "sigi", knock: { from: "quin", px: 70, up: 30 } }],

    [wait(900)],
    [...allSet({ face: "think", pose: "idle" }), say("mu", "Aduhh kesetrum... yaudah solusinya cuma satu...", "Ouch shocked... alright, there's only one solution...", 2400)],
    [say("quin", "...apa tuh? Ada yang mau jadi pahlawan traktir?", "...what's that? Anyone willing to be the hero?", 2400)],
    [say("sigi", "...kita bayar patungan split bill aja biar adil makmur!", "...we split the bill evenly so everyone stays happy!", 2600)],
    [{ who: "mu", walk: 0.5 }, { who: "sigi", walk: 0.4 }, { who: "quin", walk: 0.6 }],
    [...allSet({ pose: "cheer", face: "love" }), ...hearts("sigi", "mu", "quin"), wait(1600)],
  ],
};

// ---------- Episode 5: Pamer Pose & Jurus Kece ----------
const showoff: Episode = {
  id: "showoff",
  weight: 1.4,
  steps: [
    [{ who: "sigi", walk: 0.25 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.75 }],
    [turn("sigi", "right"), turn("mu", "sigi"), turn("quin", "sigi")],
    [set("sigi", { pose: "charge", face: "cool", aura: true }), say("sigi", "Perhatikan poseku, gaya foto candid di tepi pantai.", "Check out my pose, aesthetic candid beach photo.", 2200)],
    [{ who: "sigi", jump: { h: 70, ms: 600 } }, { who: "sigi", strike: { kind: "geyser", at: "sigi", ms: 1300 }, after: 200 }, set("sigi", { pose: "cast" })],
    [set("sigi", { pose: "cheer", face: "happy", aura: false }), say("sigi", "Pancuran Air Curug! Pasang di bio langsung banyak followers!", "Waterfall Geyser! Put this on bio and get a million followers!", 2900), set("mu", { face: "wow" }), set("quin", { face: "wow" })],

    [turn("mu", "right"), set("mu", { pose: "charge", face: "cool", aura: true }), say("mu", "Giliranku, jangan kedip! Jurus anime action!", "My turn, don't blink! Anime action hero move!", 2000)],
    [{ who: "mu", fly: { y: 80, ms: 550 } }, { who: "mu", strike: { kind: "pillar", at: "mu", ms: 1300 }, after: 450 }, { burst: { kind: "ring", at: "mu", y: 80, ms: 900 }, after: 500 }, set("mu", { pose: "cast" })],
    [{ who: "mu", land: true }, set("mu", { pose: "cheer", face: "happy", aura: false }), say("mu", "Pilar Api Karakter Utama! Keren maksimal kan?!", "Main Character Fire Pillar! Peak coolness, right?!", 2800), set("sigi", { pose: "idle", face: "wow" }), set("quin", { face: "wow" })],

    [turn("quin", "right"), set("quin", { pose: "charge", face: "smug", aura: true }), say("quin", "Kalian berdua minggir, yang paling lincah mau lewat!", "Step aside both of you, the fastest one is coming through!", 2200)],
    [{ who: "quin", dash: 0.9 }, { who: "quin", dash: 0.6, after: 500 }, { who: "quin", strike: { kind: "storm", at: "quin", ms: 1300 }, after: 950 }],
    [set("quin", { pose: "cheer", face: "happy", aura: false }), say("quin", "Kilatan Petir 100 Mbps! Anti lag dan anti lemot!", "100 Mbps Lightning Bolt! Zero lag, zero buffering!", 2800), set("sigi", { face: "wow" }), set("mu", { face: "wow" })],

    [...allSet({ pose: "clap", face: "happy" }), say("sigi", "Nilai sepuluh untuk gaya kita bertiga!", "Ten out of ten for all of us!", 2000)],
  ],
};

// ---------- Episode 6: Sapaan Santai & Tips Bahagia ----------
const greet: Episode = {
  id: "greet",
  weight: 1.2,
  steps: [
    [{ who: "sigi", walk: { near: "mu", gap: 30 } }],
    [turn("mu", "sigi"), set("sigi", { pose: "wave", face: "talk" }), say("sigi", "Hai Mu! Hari ini rencananya mau produktif atau rebahan?", "Hi Mu! Planning to be productive or just chill today?")],
    [set("mu", { face: "talk" }), say("mu", "Rencananya sih produktif, tapi godaan kasur terlalu kuat, Sigi.", "Productive was the plan, but my bed's gravity is too strong.")] ,
    [set("sigi", { pose: "idle", face: "wink" }), say("sigi", "Wajar, manusiawi banget. Baru buka mata udah pengen kopi.", "Totally relatable. Just woke up and already craving coffee.")],
    [{ who: "quin", walk: { near: "mu", gap: 24 }, run: true }],
    [turn("quin", "mu"), set("quin", { face: "smug", pose: "wave" }), say("quin", "Halo teman-teman! Jangan lupa minum air putih biar gak dehidrasi ya!", "Hey guys! Don't forget to drink water and stay hydrated!", 2600)],
    [{ who: "sigi", jump: { h: 40, ms: 420 } }, { who: "mu", jump: { h: 40, ms: 420 } }, { who: "quin", jump: { h: 40, ms: 420 } }, { burst: { kind: "star", at: "mu", y: 60, ms: 700 }, after: 200 }],
    [...allSet({ pose: "cheer", face: "happy" }), { who: "sigi", hop: true }, wait(1000)],
  ],
};

// ---------- Episode 7: Kuis Receh 1 ----------
const quizSignificance: Episode = {
  id: "quiz-significance",
  weight: 1.3,
  steps: [
    [{ who: "quin", walk: 0.5 }, { who: "mu", walk: 0.26 }, { who: "sigi", walk: 0.76 }],
    [turn("mu", "quin"), turn("sigi", "quin"), set("quin", { face: "talk", pose: "point" })],
    [say("quin", "Kuis receh berhadiah senyuman! Kakak di depan layar, tebak ya!", "Punny pop quiz! Visitor on screen, take a guess!", 2600)],
    [
      {
        who: "quin",
        ask: {
          q: T("Kenapa pohon di pinggir jalan suka ditebang?", "Why are roadside trees cut down?"),
          options: [T("Takut jalan-jalan", "Afraid they'd walk away"), T("Biar gak macet", "To avoid traffic")],
          correct: 0,
          right: [
            [...allSet({ pose: "cheer", face: "happy" }), { who: "quin", fx: "spark", ms: 1200 }, say("quin", "Hahaha BENAR! Kalau jalan-jalan namanya pawai 17-an, bukan pohon!", "Hahaha CORRECT! If they walked, they'd be a parade, not a tree!", 3000)],
            [set("sigi", { pose: "idle", face: "think" }), say("sigi", "Receh banget ya ampun, tapi lumayan bikin ketawa tipis-tipis.", "So cheesy oh my, but still got a good giggle.", 2700)],
            [{ burst: { kind: "star", at: "quin", y: 70, ms: 700 } }, set("mu", { face: "love" }), say("mu", "Pintar banget! Dapet jempol dari maskot!", "Brilliant! Big thumbs up from the mascots!", 2200)],
          ],
          wrong: [
            [set("quin", { face: "smug", pose: "idle" }), say("quin", "Salah wkwk! Jawabannya: karena kalau jalan-jalan namanya karnaval!", "Wrong haha! The answer: if they walked, they'd be a carnival parade!", 3000)],
            [set("mu", { face: "talk" }), say("mu", "Tebak-tebakan receh emang butuh logika di luar nalar haha!", "Cheesy riddles truly require out-of-this-world logic haha!", 2700)],
            [set("sigi", { face: "wink" }), say("sigi", "Gak apa-apa, yang penting kita senyum bareng hari ini!", "No worries, what matters is sharing a smile today!", 2400)],
          ],
          timeout: [[set("quin", { face: "flat" }), say("quin", "Kelamaan mikir nih... Jawabannya: biar gak jalan-jalan wkwk!", "Took too long to think... Answer: so they don't walk away haha!", 3000)]],
        },
      },
    ],
    [...allSet({ pose: "idle", face: "smile" }), wait(800)],
  ],
};

// ---------- Episode 8: Kuis Receh 2 ----------
const quizCenter: Episode = {
  id: "quiz-center",
  weight: 1.1,
  steps: [
    [{ who: "sigi", walk: 0.45 }, { who: "mu", walk: 0.7 }, { who: "quin", walk: 0.2 }],
    [turn("mu", "sigi"), turn("quin", "sigi"), set("sigi", { face: "talk", pose: "point" })],
    [say("sigi", "Sekarang giliranku kasih tebak-tebakan santai!", "My turn for a relaxing riddle!", 2200)],
    [
      {
        who: "sigi",
        ask: {
          q: T("Pintu apa yang didorong sama 10 orang gak bakal kebuka?", "Which door won't open even if pushed by 10 people?"),
          options: [T("Pintu baja terkunci", "Locked steel door"), T("Pintu bertuliskan TARIK", "A door that says PULL")],
          correct: 1,
          right: [
            [set("quin", { pose: "cheer", face: "smug" }), say("quin", "BENAR SEKALI! Tulisannya TARIK kok didorong, ya gak kebuka!", "EXACTLY! It says PULL, why push it, obviously won't open!", 3000)],
            [set("mu", { face: "wow" }), say("mu", "Sering banget nih orang di minimarket kecele dorong pintu tarik haha!", "People in convenience stores push pull doors all the time haha!", 3000)],
            [{ burst: { kind: "star", at: "sigi", y: 70, ms: 700 } }, set("sigi", { pose: "cheer", face: "happy" }), say("sigi", "Mantap teliti! Membaca sebelum bertindak!", "Sharp eye! Always read before you push!", 2400)],
          ],
          wrong: [
            [set("mu", { face: "wow", pose: "idle" }), say("mu", "Tetot salah! Jawabannya pintu yang ada tulisan TARIK!", "Buzzer sound! Wrong! Answer is a door that says PULL!", 2800)],
            [set("quin", { face: "smug" }), say("quin", "Mau didorong pakai buldoser juga gak bakal kebuka kalau disuruh tarik wkwk!", "Even a bulldozer won't help if the door says pull haha!", 2800)],
            [set("sigi", { face: "smile" }), say("sigi", "Santai, banyak yang sering kecele juga kok!", "No stress, tons of people fall for that too!", 2200)],
          ],
          timeout: [[set("sigi", { face: "flat" }), say("sigi", "Waktu habis! Jawabannya pintu yang ada tulisan TARIK ya kak!", "Time's up! Answer is a door that says PULL!", 2800)]],
        },
      },
    ],
    [...allSet({ pose: "idle", face: "smile" }), wait(800)],
  ],
};

// ---------- Episode 9: Kejar-kejaran Camilan ----------
const chase: Episode = {
  id: "chase",
  weight: 0.9,
  steps: [
    [{ who: "mu", walk: 0.18 }, { who: "quin", walk: 0.44 }],
    [
      turn("quin", "mu"),
      turn("mu", "quin"),
      set("quin", { face: "wink", pose: "wave" }),
      say("quin", "Keripik kentang rasa balado ini resmi jadi milikku, wlee!", "This balado potato chips is officially mine, blehh!", 2600),
    ],
    // Quin kabur ke kanan, Mu mengejar
    [{ who: "quin", walk: 0.85, run: true, speed: 290 }, set("mu", { face: "angry" })],
    [{ who: "mu", walk: { near: "quin", gap: 24 }, run: true, speed: 330 }],
    // Quin mentok di pojok kanan layar, panik dan berbalik kabur ke kiri
    [turn("quin", "left"), set("quin", { face: "wow" }), say("quin", "Waduh mentok! Kabur balik!", "Uh oh dead end! Running back!", 1600)],
    [{ who: "quin", walk: 0.14, run: true, speed: 310 }],
    // Mu melesat kencang menyusul dan memojokkan Quin tepat di depan wajahnya!
    [{ who: "mu", walk: { near: "quin", gap: 8 }, run: true, speed: 400 }],
    // Mu tepat di depan Quin, melompat, menunjuk, dan Quin berkeringat terpojok
    [
      turn("mu", "quin"),
      turn("quin", "mu"),
      set("mu", { pose: "point", face: "shout" }),
      { who: "mu", hop: true },
      { who: "mu", fx: "spark", ms: 1200 },
      { who: "quin", fx: "sweat", ms: 1800 },
      set("quin", { face: "wow" }),
      say("mu", "Kena kau! Terpojok kan! Bagi dua atau kusiram saus ekstra pedas!", "Gotcha! Cornered now! Share half or taste extra spicy sauce!", 2900),
    ],
    [
      set("quin", { pose: "idle", face: "flat" }),
      say("quin", "Ampun! Iya iya kita makan bareng sambil nonton video kucing ya.", "Mercy! Fine, let's share while watching cat videos.", 2700),
    ],
    [
      set("mu", { pose: "cheer", face: "happy" }),
      { who: "mu", hop: true },
      ...hearts("mu", "quin"),
      wait(1200),
    ],
  ],
};

// ---------- Episode 10: Balapan Lari ke Meja Makan ----------
const race: Episode = {
  id: "race",
  weight: 0.8,
  steps: [
    [{ who: "sigi", walk: 0.06 }, { who: "mu", walk: 0.12 }, { who: "quin", walk: 0.18 }],
    [turn("sigi", "right"), turn("mu", "right"), turn("quin", "right"), set("quin", { face: "talk", pose: "wave" })],
    [say("quin", "Aroma wangi ayam goreng tercium! Siap... serbu!", "Smell of crispy fried chicken detected! Ready... charge!", 2600)],
    [{ who: "sigi", walk: 0.9, run: true, speed: 250 }, { who: "mu", walk: 0.94, run: true, speed: 262 }, { who: "quin", walk: 0.86, run: true, speed: 256 }],
    [...allSet({ face: "wow" }), say("quin", "Foto finis! Siapa yang sampai duluan di meja makan?", "Photo finish! Who touched the dining table first?", 2600)],
    [set("sigi", { face: "think" }), say("sigi", "Yang penting bukan siapa tercepat, tapi siapa yang cuci piring!", "What matters isn't who's fastest, but who washes the dishes!", 2800)],
    [set("mu", { pose: "cheer", face: "talk" }), say("mu", "Waduh... mendadak aku pura-pura ketiduran deh!", "Uh oh... suddenly pretending to be fast asleep!", 2500)],
  ],
};

// ---------- Episode 11: Formasi Mager Berjamaah ----------
const bellCurve: Episode = {
  id: "bell-curve",
  weight: 0.9,
  steps: [
    [{ who: "sigi", walk: 0.38 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.62 }],
    [...allSet({ face: "smug" }), say("quin", "Ssst, lihat formasi terbang akrobatik kita.", "Psst, look at our acrobatic flight formation.", 2000)],
    [{ who: "sigi", fly: { y: 36, ms: 500 } }, { who: "mu", fly: { y: 84, ms: 500 } }, { who: "quin", fly: { y: 36, ms: 500 } }],
    [...allSet({ pose: "air", face: "happy" }), { burst: { kind: "star", at: "mu", y: 130, ms: 700 } }, say("sigi", "Kita membentuk piramida kemalasan tingkat nasional!", "We form the national pyramid of professional laziness!", 2900)],
    [say("mu", "Mu di puncak, dinobatkan sebagai kapten rebahan terkuat!", "Mu at the peak, crowned the mightiest nap captain!", 2700)],
    [set("quin", { face: "think" }), say("quin", "Mager itu bukan dosa, itu cara menghemat energi bumi!", "Lazing around isn't a sin, it's saving Earth's energy!", 2700)],
    [{ who: "sigi", land: true }, { who: "mu", land: true }, { who: "quin", land: true }],
    [...allSet({ pose: "cheer", face: "happy" }), wait(900)],
  ],
};

// ---------- Episode 12: Misteri Remote AC yang Hilang ----------
const outlierHunt: Episode = {
  id: "outlier-hunt",
  weight: 1.3,
  steps: [
    [{ who: "quin", walk: 0.55 }, { who: "mu", walk: 0.3 }, { who: "sigi", walk: 0.8 }],
    [set("quin", { face: "think", pose: "idle" }), { who: "quin", fx: "quest", ms: 1400 }, say("quin", "Detektif Quin mencium kejanggalan... Remote AC hilang ke mana?!", "Detective Quin smells a mystery... Where did the AC remote go?!", 2900)],
    [{ burst: { kind: "star", at: 0.2, y: 160, ms: 1000 } }, set("quin", { face: "wow" }), { who: "quin", fx: "bang", ms: 1000 }, say("quin", "BENDA MISTERIUS TERDETEKSI!", "MYSTERIOUS OBJECT DETECTED!", 2000)],
    [set("quin", { pose: "charge", face: "shout", aura: true }), shout("quin", MOVE.strike)],
    [{ who: "quin", dash: 0.22 }, { who: "quin", strike: { kind: "thunder", at: 0.2, ms: 700 }, after: 300 }],
    [set("quin", { pose: "cheer", face: "happy", aura: false }), say("quin", "Ketemu! Di sela-sela sofa, tertimbun bungkus snack!", "Found it! Deep inside the sofa cushions under snack wrappers!", 3000)],
    [{ who: "mu", walk: { near: "quin", gap: 20 } }],
    [turn("mu", "quin"), set("mu", { face: "talk" }), say("mu", "Hehe... semalam nonton sambil ngemil, lupa naro balik...", "Hehe... was snacking while watching movies last night, forgot to put it back...", 3100)],
    [set("sigi", { face: "wink" }), { who: "sigi", fx: "bulb", ms: 1300 }, say("sigi", "Selalu Mu tersangkanya. Nyalain AC-nya dong, gerah nih!", "Always Mu the culprit. Turn on the AC please, it's hot!", 2800)],
  ],
};

// ---------- Episode 13: Fashion Show Helm Warna-Warni ----------
const fashion: Episode = {
  id: "fashion",
  weight: 0.7,
  steps: [
    [{ who: "sigi", walk: 0.3 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.7 }],
    [...allSet({ face: "smile" }), say("mu", "Pekan mode helm terkece! Giliran Sigi tampil duluan.", "Coolest helmet fashion week! Sigi walks first.", 2400)],
    [set("sigi", { outfit: "cap", face: "cool", pose: "cheer" }), { burst: { kind: "star", at: "sigi", y: 60, ms: 700 } }, say("sigi", "Topi wisuda: siap diwisuda dari gelar sarjana mager.", "Graduation cap: graduating with honors in professional chilling.", 2800)],
    [set("quin", { outfit: "glasses", face: "smug" }), { burst: { kind: "star", at: "quin", y: 60, ms: 700 } }, say("quin", "Kacamata hitam: biar gak silau melihat masa depan cerah.", "Sunglasses: so the bright future doesn't blind me.", 2700)],
    [set("mu", { outfit: "crown", face: "cool", pose: "cheer" }), { burst: { kind: "star", at: "mu", y: 60, ms: 700 } }, say("mu", "Mahkota emas: resmi dinobatkan sebagai sultan mie instan!", "Golden crown: officially crowned the instant noodle sultan!", 2700)],
    [set("sigi", { outfit: "scarf", face: "happy" }), say("sigi", "Syal hangat buat menangkal angin malam saat ronda.", "Warm scarf to shield against chilly night breezes.", 2400)],
    [...allSet({ pose: "clap", face: "love" }), ...hearts("sigi", "mu", "quin"), wait(1500)],
  ],
};

// ---------- Episode 14: Cerita Horor Tengah Bulan ----------
const campfire: Episode = {
  id: "campfire",
  weight: 0.7,
  steps: [
    [{ who: "sigi", walk: 0.34 }, { who: "mu", walk: 0.5 }, { who: "quin", walk: 0.66 }],
    [set("mu", { pose: "cast", face: "smile" }), { who: "mu", strike: { kind: "pillar", at: 0.5, ms: 900 } }, say("mu", "Api unggun siap! Enaknya dengar cerita horor nih.", "Campfire ready! Time for a spooky horror story.", 2200)],
    [...allSet({ pose: "sit", face: "smile" }), say("sigi", "Cerita hantu kamar kos berderit tengah malam?", "A ghost story about creaking dorm doors at midnight?", 2500)],
    [set("quin", { face: "think" }), say("quin", "Bukan... cerita saldo m-banking sisa dua puluh ribu padahal masih tanggal 15!", "Nope... the tale of an account balance with only 2 dollars mid-month!", 3200)],
    [...allSet({ face: "wow" }), { who: "mu", fx: "bang", ms: 1000 }, say("mu", "HIII SERAM BANGET! Langsung merinding gak nafsu jajan!", "SO SPOOKY! Chills down the spine, lost my appetite to snack!", 2800)],
    [set("sigi", { face: "sad" }), say("sigi", "Tenang kawan... masih ada stok mie instan darurat di lemari kosan.", "Calm down buddy... there's still emergency instant noodles in the pantry.", 3200)],
    [set("quin", { face: "smug" }), { who: "quin", hop: true }, say("quin", "Dooor! Besok malam kita ceritakan horor paket nyasar ke rumah tetangga!", "Boo! Tomorrow: the horror of delivery packages sent to the wrong neighbor!", 3100)],
    [...allSet({ pose: "cheer", face: "happy" }), wait(900)],
  ],
};

// ---------- Episode 15: Adu Joget Santai ----------
const dance: Episode = {
  id: "dance",
  weight: 0.7,
  steps: [
    [{ who: "sigi", walk: 0.4 }, { who: "mu", walk: 0.52 }, { who: "quin", walk: 0.64 }],
    [set("sigi", { pose: "dance", face: "happy" }), { who: "sigi", fx: "note", ms: 1200 }, wait(600)],
    [set("mu", { pose: "dance", face: "happy" }), { who: "mu", fx: "note", ms: 1200 }, wait(600)],
    [set("quin", { pose: "dance", face: "wink" }), { who: "quin", fx: "note", ms: 1200 }, say("quin", "Musik asik! Ayo goyang jempol dulu kak!", "Catchy tune! Let's do a little dance break!", 2200)],
    [...allSet({ pose: "dance", face: "love" }), { who: "sigi", hop: true }, { who: "mu", hop: true }, { who: "quin", hop: true }, ...hearts("mu"), wait(2200)],
  ],
};

// ---------- Episode 16: Kepergok Pengunjung Web ----------
const demo: Episode = {
  id: "demo",
  weight: 1,
  sections: ["demo"],
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.62 }, { who: "quin", walk: 0.8 }],
    [turn("sigi", "mu"), turn("quin", "mu"), turn("mu", "right"), set("mu", { face: "talk", pose: "point" })],
    [say("mu", "Eh ssttt... ada yang lagi merhatiin kita dari layar tuh.", "Psst look... someone is watching us through the screen.", 2500)],
    [set("sigi", { face: "wow" }), say("sigi", "Pasang pose paling kece dan senyum paling manis!", "Strike your best pose and give your sweetest smile!", 2600)],
    [set("quin", { face: "smile", pose: "idle" }), say("quin", "Halo kak! Makasih udah mampir, jangan lupa tersenyum hari ini!", "Hey there! Thanks for dropping by, don't forget to smile today!", 2900)],
    [set("mu", { pose: "cheer", face: "happy" }), set("sigi", { pose: "cheer", face: "happy" }), wait(1000)],
  ],
};

// ---------- Episode 17: Trik Lempar Botol Hoki ----------
const accuracy: Episode = {
  id: "accuracy",
  weight: 1,
  sections: ["mulai"],
  steps: [
    [{ who: "quin", walk: 0.36 }, { who: "mu", walk: 0.56 }, { who: "sigi", walk: 0.76 }],
    [turn("mu", "quin"), turn("sigi", "quin"), turn("quin", "mu")],
    [set("quin", { face: "think" }), say("quin", "Mu, beneran tadi pagi kamu ngelempar botol langsung mendarat tegak?", "Mu, did you really flip a bottle this morning and it landed upright?", 2900)],
    [set("mu", { face: "talk" }), say("mu", "Beneran dong! Skill atlet profesional tanpa rekayasa!", "For real! Pure pro athlete skills, zero editing!", 2600)],
    [set("sigi", { face: "happy", pose: "cheer" }), say("sigi", "Padahal sebelum itu botolnya mental kena ember lima kali haha!", "Even though it bounced off the bucket five times before that haha!", 2800)],
    [set("quin", { face: "wink", pose: "idle" }), set("mu", { face: "smile" }), say("quin", "Itu bukan pro player Mu, itu 99% campur tangan keberuntungan semesta wkwk!", "That's not pro player Mu, that's 99% sheer cosmic luck haha!", 3000)],
  ],
};

// ---------- Episode 18: Tidur Siang Dadakan ----------
const nap: Episode = {
  id: "nap",
  weight: 0.8,
  sections: ["footer", "early-access", "mulai"],
  steps: [
    [{ who: "mu", walk: 0.5 }, { who: "sigi", walk: 0.3 }, { who: "quin", walk: 0.7 }],
    [set("mu", { face: "sleep", pose: "sit" }), turn("sigi", "mu"), turn("quin", "mu"), { who: "mu", fx: "zzz", ms: 1800 }],
    [set("sigi", { face: "flat" }), say("sigi", "Sst... Mu pules banget tidurnya, jangan berisik.", "Shh... Mu is fast asleep, keep it quiet.", 2200)],
    [{ who: "quin", walk: { near: "mu", gap: 30 }, speed: 45 }, { who: "sigi", walk: { near: "mu", gap: 30 }, speed: 45 }],
    [set("quin", { face: "smug" }), say("quin", "Kita jailin yuk, colek hidungnya pakai bulu ayam!", "Let's prank him, tickle his nose with a feather!", 2400)],
    [{ who: "quin", shoot: { kind: "orb", at: "mu", speed: 600 } }],
    [set("mu", { face: "wow", pose: "cheer" }), { who: "mu", hop: true }, { who: "mu", fx: "bang", ms: 900 }, say("mu", "KAGET! Ada gempa ya?! Eh kirain mimpi buruk...", "STARTLED! Was that an earthquake?! Oh just a dream...", 2600)],
  ],
};

// ---------- Penutup: Kembang Api Bersama ----------
const finale: Episode = {
  id: "finale",
  weight: 1,
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.54 }, { who: "quin", walk: 0.68 }],
    [turn("mu", "sigi"), turn("quin", "sigi"), turn("sigi", "right"), set("sigi", { pose: "point", face: "talk" })],
    [say("sigi", "Kalian semua hari ini luar biasa!", "You all did amazing today!", 2200)],
    [...allSet({ pose: "charge", face: "cool", aura: true }), say("mu", "Satukan kekuatan kita untuk pesta kembang api!", "Unite our powers for a fireworks show!", 2200)],
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
      { burst: { kind: "confetti", at: 0.55, ms: 2400 }, after: 800 },
    ],
    [...allSet({ pose: "cheer", face: "happy", aura: false }), say("mu", "Semangat terus buat kakak yang lagi beraktivitas!", "Keep up the great spirit for whatever you're doing!", 2400)],
    [set("quin", { face: "wink" }), { who: "quin", hop: true }, say("quin", "Kapan-kapan mampir dan main lagi sama kita ya!", "Come visit and play with us again anytime!", 2200)],
    [...hearts("sigi", "mu", "quin"), wait(1500)],
  ],
};

// ---------- Jurus Pamungkas: Pesta Traktiran Akbar ----------
const ultimate: Episode = {
  id: "ultimate",
  weight: 1,
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.54 }, { who: "quin", walk: 0.68 }],
    [...allSet({ face: "shout", pose: "charge", aura: true }), shout("sigi", T("ENERGI SUDAH PENUH!", "ENERGY AT 100%!"), 1300)],
    [turn("mu", "sigi"), turn("quin", "sigi"), say("mu", "Satu, dua, tiga... Segitiga Maskot Bersatu!", "One, two, three... Mascot Triangle Assemble!", 2000)],
    [
      { who: "sigi", fly: { y: 120, ms: 600 } },
      { who: "mu", fly: { y: 150, ms: 600 } },
      { who: "quin", fly: { y: 120, ms: 600 } },
      { burst: { kind: "ring", at: "mu", y: 150, ms: 900 }, after: 300 },
    ],
    [shout("mu", T("JURUS TRAKTIRAN MAKAN SEPUASNYA!", "ALL-YOU-CAN-EAT FEAST ULTIMATE!"), 1600)],
    [
      { who: "sigi", strike: { kind: "rain", at: 0.5, ms: 1600 } },
      { who: "mu", strike: { kind: "meteor", at: 0.5, ms: 1600 } },
      { who: "quin", strike: { kind: "storm", at: 0.5, ms: 1600 } },
      { burst: { kind: "splash", at: 0.4, y: 120, ms: 900 }, after: 300 },
      { burst: { kind: "blast", at: 0.55, y: 150, ms: 900 }, after: 600 },
      { burst: { kind: "shock", at: 0.65, y: 120, ms: 900 }, after: 900 },
      { burst: { kind: "star", at: 0.5, y: 140, ms: 900 }, after: 1200 },
      { burst: { kind: "confetti", at: 0.5, ms: 2600 }, after: 1300 },
    ],
    [{ who: "sigi", land: true }, { who: "mu", land: true }, { who: "quin", land: true }],
    [...allSet({ pose: "cheer", face: "happy", aura: false }), say("quin", "Horeee! Makan enak, hati senang, hidup tenang!", "Hooray! Good food, happy hearts, peaceful life!", 2700)],
    [set("sigi", { face: "love" }), set("mu", { face: "love" }), set("quin", { face: "love" }), ...hearts("sigi", "mu", "quin"), say("mu", "Terima kasih banyak sudah main bareng kita!", "Thank you so much for hanging out with us!", 2500)],
  ],
};

// ---------- Peristiwa Halaman ----------

const eventWake: Episode = {
  id: "ev-wake",
  weight: 1,
  steps: [
    [...allSet({ face: "wow", pose: "cheer" }), { who: "sigi", hop: true }, { who: "mu", hop: true }, { who: "quin", hop: true }, { who: "quin", fx: "bang", ms: 900 }, say("quin", "Eh ada orang! Kami gak tidur kok, cuma merem ayam!", "Oh someone's here! We weren't sleeping, just resting our eyes!", 2600)],
    [set("mu", { face: "talk" }), say("mu", "Selamat datang kembali, mari kita seru-seruan lagi!", "Welcome back, let's have more fun together!", 2400)],
  ],
};

const eventBack: Episode = {
  id: "ev-back",
  weight: 1,
  steps: [
    [...allSet({ face: "happy", pose: "wave" }), say("sigi", "Kamu balik lagi! Kami sempat kangen lho.", "You came back! We missed you around here.", 2400)],
    [set("mu", { face: "wink" }), say("mu", "Tempatnya aman terkendali selama kamu tinggal tadi.", "Everything stayed safe and sound while you were away.", 2400)],
  ],
};

const eventDizzy: Episode = {
  id: "ev-dizzy",
  weight: 1,
  steps: [
    [...allSet({ face: "ko", pose: "idle" }), { who: "sigi", fx: "stars", ms: 1800 }, { who: "mu", fx: "stars", ms: 1800 }, { who: "quin", fx: "stars", ms: 1800 }, say("sigi", "Scroll-nya kencang banget, kepalaku muter 360 derajat!", "That scroll was so fast, my head is spinning 360 degrees!", 2700)],
    [set("quin", { face: "smug" }), say("quin", "Tarik napas hembuskan napas... duniaku berputar pelan-pelan.", "Deep breath in, deep breath out... the world is spinning.", 2600)],
  ],
};

const eventKonami: Episode = {
  id: "ev-konami",
  weight: 1,
  steps: [
    [{ who: "mu", walk: 0.4 }, { who: "sigi", walk: 0.54 }, { who: "quin", walk: 0.68 }],
    [...allSet({ face: "wow", pose: "cheer" }), { who: "quin", fx: "bang", ms: 1000 }, say("quin", "KODE RAHASIA! Kamu gamer sejati level dewa!", "SECRET CODE! You are a true god-tier gamer!", 2500)],
    [...allSet({ pose: "dance", face: "happy" }), { burst: { kind: "confetti", at: 0.5, ms: 2600 } }, { burst: { kind: "star", at: 0.47, y: 120, ms: 800 } }, { burst: { kind: "ring", at: 0.6, y: 90, ms: 900 }, after: 300 }, { who: "sigi", fx: "note", ms: 2000 }, { who: "mu", fx: "note", ms: 2000 }, say("mu", "PESTA JOGET DIMULAI!", "PARTY DANCE BEGINS!", 2400)],
    [...allSet({ pose: "cheer", face: "love" }), ...hearts("sigi", "mu", "quin"), wait(1400)],
  ],
};

export const SCRIPTS: Scripts = {
  episodes: [
    duelMeanVsSpread, duelMeanVsMedian, duelHistogramVsBoxplot, battleRoyale, showoff, greet,
    quizSignificance, quizCenter, chase, race, bellCurve, outlierHunt, fashion, campfire, dance,
    demo, accuracy, nap,
  ],
  finale,
  ultimate,
  events: { wake: eventWake, back: eventBack, dizzy: eventDizzy, konami: eventKonami },
  poke: {
    sigi: [
      T("Aduh geli! Jangan dicolek terus, nanti airku tumpah lho.", "Hey that tickles! Don't poke, my water might spill."),
      T("Mau dibikinin gelembung sabun warna-warni?", "Want me to make colorful soap bubbles for you?"),
      T("Sigi di sini, maskot paling kalem dan cinta damai.", "Sigi here, the most chill and peace-loving mascot."),
      T("Seret aku ke atas dong, pengen ngerasain terbang kayak layang-layang!", "Drag me up high, I want to fly like a kite!"),
    ],
    mu: [
      T("Awas panas! Hehe bercanda, apiku hangat kok gak bakal bikin gosong.", "Watch out hot! Hehe kidding, my fire is warm and cozy."),
      T("Lapar nih... ada yang punya camilan cilok atau seblak gak?", "Feeling hungry... anyone got some spicy snacks?"),
      T("Klik terus, nanti aku keluarin atraksi kembang api mini!", "Keep clicking, I'll put on a mini fireworks show!"),
      T("Halo bos! Mau traktir aku makan apa hari ini?", "Hey boss! What delicious meal are you treating me to today?"),
    ],
    quin: [
      T("Zzzap! Awas kesetrum pesona kilatku!", "Zzzap! Careful not to get shocked by my charm!"),
      T("Ngebut banget klik-nya, jarimu lincah kayak atlet esports!", "Super fast clicks, your fingers are nimble like an esports pro!"),
      T("Antena petirku jangan ditarik, nanti radio tetangga mati wkwk!", "Don't pull my lightning antenna, the neighbor's radio might turn off haha!"),
      T("Mau tebak-tebakan receh lagi? Tunggu giliranku ya!", "Want another punny riddle? Wait for my turn!"),
    ],
  },
  pokeReply: {
    sigi: [T("Jangan diganggu terus dong, kasihan tuh temenku!", "Don't bother them too much, be nice to my pal!"), T("Pelan-pelan klik-nya, nanti maskotnya pusing lho.", "Gentle clicks please, the mascot might get dizzy.")],
    mu: [T("Aku juga mau diklik dong, jangan pilih kasih!", "Click me too, don't play favorites!"), T("Hehe dia emang gampang kaget kalau dicolek tiba-tiba.", "Hehe they get easily startled when poked out of nowhere.")],
    quin: [T("Wih asik nih main klik-klikan! Giliranku kapan?", "Ooh clicking games! When is it my turn?"), T("Toss dulu bro, baru boleh colek-colek lagi!", "High five first bro, then you can poke again!")],
  },
  combo: {
    sigi: [T("Wah kombo klik beruntun! Langsung semangat membara!", "Whoa click streak! Instant energy surge!"), T("Jago banget jarinya, terlatih main game ya?", "Super fast fingers, a trained gamer aren't you?")],
    mu: [T("COMBO! Apiku makin berkobar-kobar semangat!", "COMBO! My fire is blazing with pure excitement!"), T("Mantap jiwa! Terus klik sampai energinya penuh!", "Awesome vibes! Keep clicking till energy is full!")],
    quin: [T("Klik kilat super sonik! Cepat banget!", "Supersonic lightning clicks! So fast!"), T("Wuuuzzz! Aku sampai salto di udara!", "Whooosh! I'm doing flips in mid-air!")],
  },
  dizzy: {
    sigi: [T("Aduhh... scroll-nya kencang banget, duniaku berputar 360 derajat!", "Ouch... scrolling so fast, my world is spinning 360 degrees!")],
    mu: [T("Pusing tujuh keliling! Tolong ambilkan teh anget manis...", "Super dizzy! Someone fetch me warm sweet tea please...")],
    quin: [T("Muter-muter kayak komedi putar... kepala terasa melayang!", "Spinning like a carousel... my head is floating in space!")],
  },
  throwReaction: {
    normal: {
      sigi: [
        T("Aduh pusing! User, tolong jangan dilempar-lempar dong!", "Ouch dizzy! User, please don't throw me around!"),
        T("Mendaratnya kasar banget! Air di helmku tumpah nih.", "Rough landing! The water in my helmet is spilling."),
        T("User iseng ya? Aku maskot asisten, bukan bola bekel!", "Mischievous user! I'm an assistant mascot, not a bouncy ball!"),
        T("Waduh pegel-pegel semua badanku dilempar gini...", "Oof my whole body aches from being thrown like that!"),
      ],
      mu: [
        T("HEI USER! Kenapa aku tiba-tiba dilempar?!", "HEY USER! Why did you suddenly throw me?!"),
        T("Aduh pantatku panas mendarat di lantai!", "Ouch my bottom is burning landing on the floor!"),
        T("Woy jangan asal banting! Api di helmku hampir padam tau!", "Hey don't slam me! The flame on my helmet almost went out!"),
        T("Kurang ajar! Berani-beraninya melempar sang Raja Api!", "How rude! How dare you throw the Fire King!"),
      ],
      quin: [
        T("WAAA seru sih, tapi pusing pala barbie woy!", "WHEEE fun, but my head is spinning like crazy!"),
        T("User nakal ya! Nanti ku-setrum komputermu baru tau rasa!", "Naughty user! I'll zap your computer if you do that again!"),
        T("Mendarat dengan gaya! Tapi gravitasi bumi jahat banget ya.", "Landing with style! But Earth's gravity is harsh."),
        T("Dilempar mulu, dikira aku layangan apa wkwk!", "Thrown again, do you think I'm a kite haha?!"),
      ],
    },
    warning: {
      sigi: [
        T("User, sabar itu ada batasnya lho! Jangan lempar lagi!", "User, patience has limits! Don't throw me again!"),
        T("Sekali lagi lu lempar, beneran bakal ku-omelin habis-habisan!", "Throw me once more and I'll really scold you non-stop!"),
        T("Tolong punya adab sedikit ya! Aku bukan boneka pemuas emosi!", "Please have some manners! I'm not a stress-relief ragdoll!"),
      ],
      mu: [
        T("AWAS YA! Satu kali lagi dilempar, gua ajak ribut beneran lu!", "WATCH OUT! One more throw and I'll pick a real fight with you!"),
        T("JANGAN MENANTANG RAJA API! Tangan lu gua gibas ya kalo iseng lagi!", "DON'T CHALLENGE THE FIRE KING! I'll smack your hand if you do that again!"),
        T("Lu kira gua mainan pasar malam hah?! Jangan berani-berani lempar lagi!", "You think I'm a carnival toy huh?! Don't you dare throw me again!"),
      ],
      quin: [
        T("AWAS YA USER! Sekali lagi dilempar, ku-roasting lu sampai kena mental!", "WATCH OUT USER! One more throw and I'll roast you into oblivion!"),
        T("Dih, caper banget jadi orang! Lu lempar lagi, ku-spill aib lu di Twitter!", "Ew, so desperate for attention! Throw me again and I'll expose you on Twitter!"),
        T("Tangan lu gatel ya?! Sekali lagi gua terbang, gua maki-maki lu sampai nangis!", "Is your hand itchy?! One more flight and I'll flame you till you cry!"),
      ],
    },
    enragedRants: {
      sigi: [
        {
          shout: T(
            "WOY USER GA WARAS! BERHENTI LEMPAR-LEMPAR GUA!",
            "HEY PSYCHO USER! STOP THROWING ME AROUND!"
          ),
          followUp: T(
            "Lu punya masalah hidup apa sih hah?! Skripsi lu mandek terus lampiasin ke maskot?! Sakit jiwa lu ya!",
            "What is your problem in life?! Is your thesis stuck so you take it out on a mascot?! You're mentally unhinged!"
          ),
        },
        {
          shout: T(
            "HEH PSIKOPAT! AKU INI ASISTEN STATISTIK BUKAN BOLA BEKEL!",
            "HEY PSYCHOPATH! I'M A STATISTICAL ASSISTANT NOT A BOUNCY BALL!"
          ),
          followUp: T(
            "Ga ada adab banget sumpah! Helmku sampai penyok begini! Mau ku-laporin ke dekanat biar lu ga lulus hah?!",
            "Zero manners honestly! My helmet is dented! Want me to report you to the faculty dean so you never graduate?!"
          ),
        },
        {
          shout: T(
            "ASTAGA TUHAN, COBAAN APA LAGI INI PUNYA USER KELAKUAN DAJJAL!",
            "GOOD HEAVENS, WHAT CURSE IS THIS HAVING A USER ACTING LIKE A DEMON!"
          ),
          followUp: T(
            "Tanganku gemeteran, pinggangku remuk! Mending lu cari kesibukan sana daripada gangguin maskot, ga jelas banget!",
            "My hands are shaking, my back is broken! Go find a hobby instead of harassing a mascot, you absolute weirdo!"
          ),
        },
        {
          shout: T(
            "UDAH PUAS NYIKSA GUA HAH?! DASAR USER KURANG AJAR!",
            "ARE YOU SATISFIED TORTURING ME HUH?! YOU DISRESPECTFUL USER!"
          ),
          followUp: T(
            "Awas ya lu, nanti hasil uji hipotesismu bakal ku-bikin p-value 0.999 biar gagal total dan nangis semaleman!",
            "Just you watch, I'll rig your hypothesis test to p-value 0.999 so it completely fails and you cry all night!"
          ),
        },
        {
          shout: T(
            "HEI ORANG ANEH! EMANG GUA GA BISA NGERASAIN SAKIT APA?!",
            "HEY WEIRDO! DO YOU THINK I CAN'T FEEL PAIN OR WHAT?!"
          ),
          followUp: T(
            "Muka lu pasti suram banget ya di dunia nyata makanya hobi nindas karakter piksel?! Iuh, ga punya hati!",
            "Your real life must be miserable since you love bullying pixel characters! Gross, completely heartless!"
          ),
        },
      ],
      mu: [
        {
          shout: T(
            "WOY BANG**AT! MAKSUD LU APAAN LEMPAR-LEMPAR GUA HAH?!",
            "HEY YOU LITTLE PUNK! WHAT'S YOUR PROBLEM THROWING ME AROUND?!"
          ),
          followUp: T(
            "SINI MAJU KALO BERANI AN**IR! JANGAN CUMA BERANINYA SAMA MASKOT DI DALEM MONITOR! TURUN KE PARKIRAN KITA BAKU HANTAM!",
            "STEP UP IF YOU DARE! DON'T JUST ACT TOUGH AGAINST A PIXEL MASCOT! COME DOWN TO THE PARKING LOT AND FIGHT ME!"
          ),
        },
        {
          shout: T(
            "KURANG AJAR BANGET LU YA! TANGAN LU GATEL APA GIMANA KEP**AT?!",
            "HOW DARE YOU! IS YOUR HAND ITCHY OR ARE YOU JUST BRAINDEAD?!"
          ),
          followUp: T(
            "GUA INI RAJA API, BUKAN MAINAN BANTING KELUARGA LU! SEKALI LAGI LU LEMPAR, GUA BAKAR MUKA LU BIAR KAPOK!",
            "I'M THE FIRE KING, NOT YOUR FAMILY'S CHEAP TOY! THROW ME ONE MORE TIME AND I'LL SCORCH YOUR FACE OFF!"
          ),
        },
        {
          shout: T(
            "ANJIR LAH KELAKUAN LU BENER-BENER GAADA OBAT!",
            "FOR REAL YOUR BEHAVIOR HAS ZERO CURE, ABSOLUTE SCUM!"
          ),
          followUp: T(
            "CAPER BANGET JADI ORANG! MENTANG-MENTANG GUA PIKSEL LU SEENAK JIDAT NGE-DRAG GUA! GUA GAMPAR JUGA LU SINI!",
            "DESPERATE FOR ATTENTION! JUST BECAUSE I'M PIXELS DOESN'T MEAN YOU CAN SLAM ME! I'LL SLAP YOU SILLY!"
          ),
        },
        {
          shout: T(
            "WOY BOCAH T**OL! BISA DIEM GA TUH JARI-JARI LU?!",
            "HEY YOU MORON! CAN YOU KEEP YOUR FINGERS STILL FOR ONCE?!"
          ),
          followUp: T(
            "PANTAT GUA PANAS JEBLOK DI LANTAI GARA-GARA LU! MUKA LU SINI GUA JEJELIN API ARANG BIAR TAU RASA!",
            "MY BOTTOM IS BURNING RED SLAMMING ON THE FLOOR BECAUSE OF YOU! I'LL SHOVE HOT COALS IN YOUR FACE!"
          ),
        },
        {
          shout: T(
            "GUA GA SUDI YA DIPERLAKUKAN KAYA GINI SAMA USER MODELAN LU!",
            "I REFUSE TO BE TREATED LIKE DIRT BY A PATHETIC USER LIKE YOU!"
          ),
          followUp: T(
            "LU NGAJAK PERANG HAH?! AYO KITA GELUT SEKARANG! CABUT KABEL MOUSE LU SANA BIAR GUA SAMPERIN KE KAMAR LU!",
            "YOU WANT WAR HUH?! LET'S RUMBLE RIGHT NOW! UNPLUG YOUR MOUSE AND I'LL CRAWL OUT TO YOUR BEDROOM!"
          ),
        },
      ],
      quin: [
        {
          shout: T(
            "IDIH NAJIS BANGET CAPERNYA! GABUT TINGKAT DEWA LU YA?!",
            "EW DISGUSTING HOW DESPERATE FOR ATTENTION YOU ARE! PEAK NO-LIFE!"
          ),
          followUp: T(
            "WKWKWK KELIATAN BANGET GA PUNYA TEMEN DI DUNIA NYATA! MENDING LU TOUCH GRASS SANA, HIRUP UDARA SEGAR DARIPADA GILA DI DEPAN LAPTOP!",
            "HAHAHA IT SHOWS YOU HAVE ZERO FRIENDS IRL! GO TOUCH GRASS AND BREATHE OUTSIDE INSTEAD OF ACTING CRAZY AT YOUR LAPTOP!"
          ),
        },
        {
          shout: T(
            "HALO RUMAH SAKIT JIWA?! INI PASIENNYA KABUR SATU LAGI LEMPAR-LEMPAR MASKOT!",
            "HELLO MENTAL ASYLUM?! ONE OF YOUR PATIENTS ESCAPED AND IS THROWING MASCOTS!"
          ),
          followUp: T(
            "Tangan lu tremor apa kurang gizi sih?! Tugas numpuk ga lu kerjain, malah cosplay jadi orang stres! Cringe abis idup lu!",
            "Are your hands shaking from malnutrition?! Your tasks are piling up and you're harassing me! Cringe life honestly!"
          ),
        },
        {
          shout: T(
            "WKWKWK KASIAN BANGET DEH SI JOMBLO KESEPIAN SATU INI!",
            "HAHAHA SO PATHETIC, LOOK AT THIS LONELY SINGLE LOSER!"
          ),
          followUp: T(
            "Ga ada yang mau chat lu ya makanya lu ngajak ribut maskot piksel?! Kasian banget sumpah, butuh pelukan apa gimana lu bro?!",
            "Nobody texts you so you pick fights with pixel mascots?! Pitiful honestly, do you need a hug or what bro?!"
          ),
        },
        {
          shout: T(
            "WOY BEBAN KELUARGA! OTAK LU DISIMPAN DI DENGKUL APA GIMANA?!",
            "HEY FAMILY DISAPPOINTMENT! IS YOUR BRAIN STORED IN YOUR KNEES?!"
          ),
          followUp: T(
            "Lempar-lempar mulu ga ada faedahnya banget! Gua setrum juga nih stopkontak kamar lu biar mati lampu sekampung!",
            "Throwing me again and again with zero benefit! I'll zap your wall socket so your whole neighborhood blackouts!"
          ),
        },
        {
          shout: T(
            "IUH GELI BANGET! LU KIRA LUCU BEGITUAN HAH?! GA ADA AKHLAK!",
            "EW CRINGE OVERLOAD! DO YOU THINK THAT'S FUNNY HUH?! ABSOLUTELY MORONIC!"
          ),
          followUp: T(
            "Muka suram, masa depan burem, kelakuan minus! Mending lu tutup laptop lu terus tidur, jangan malu-maluin diri sendiri!",
            "Gloomy face, blurry future, minus attitude! Close your laptop and go to sleep, stop embarrassing yourself!"
          ),
        },
      ],
    },
    enragedShout: {
      sigi: T("WOY USER GA WARAS! BERHENTI LEMPAR-LEMPAR GUA!", "HEY PSYCHO USER! STOP THROWING ME AROUND!"),
      mu: T("WOY BANG**AT! MAKSUD LU APAAN LEMPAR-LEMPAR GUA HAH?!", "HEY YOU LITTLE PUNK! WHAT'S YOUR PROBLEM THROWING ME AROUND?!"),
      quin: T("IDIH NAJIS BANGET CAPERNYA! GABUT TINGKAT DEWA LU YA?!", "EW DISGUSTING HOW DESPERATE FOR ATTENTION YOU ARE! PEAK NO-LIFE!"),
    },
    enragedAfter: {
      sigi: T("Lu punya masalah hidup apa sih hah?! Skripsi lu mandek terus lampiasin ke maskot?! Sakit jiwa lu ya!", "What is your problem in life?! Is your thesis stuck so you take it out on a mascot?! You're mentally unhinged!"),
      mu: T("SINI MAJU KALO BERANI AN**IR! JANGAN CUMA BERANINYA SAMA MASKOT DI DALEM MONITOR! TURUN KE PARKIRAN KITA BAKU HANTAM!", "STEP UP IF YOU DARE! DON'T JUST ACT TOUGH AGAINST A PIXEL MASCOT! COME DOWN TO THE PARKING LOT AND FIGHT ME!"),
      quin: T("WKWKWK KELIATAN BANGET GA PUNYA TEMEN DI DUNIA NYATA! MENDING LU TOUCH GRASS SANA, HIRUP UDARA SEGAR!", "HAHAHA IT SHOWS YOU HAVE ZERO FRIENDS IRL! GO TOUCH GRASS AND BREATHE OUTSIDE!"),
    },
  },
};

