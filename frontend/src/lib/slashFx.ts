/**
 * Transisi "tebasan" (impact frame anime) untuk login/daftar -> dashboard. Murni canvas 2D, berbasis waktu nyata
 * (bukan hitungan frame) dengan easing halus, jadi tetap mulus di layar 60/120Hz.
 *
 *  playSlashCover  : 3 tebasan diagonal + impact frame putih/hitam, lalu tebasan terakhir pecah menjadi mosaik piksel
 *                    (palet sama dengan PixelWipe) sampai layar hitam penuh. ~1,26 detik.
 *  playSlashReveal : layar hitam, tebasan menyala di garis yang sama, lalu hitam terbelah sepanjang garis itu dan
 *                    kedua belahan bergeser menjauh sambil menyemburkan serpihan piksel. ~1,05 detik.
 */
const PALETTE = ["#003BFF", "#FF2E2E", "#EBEB00", "#000000"];
const SHARD = ["#003BFF", "#FF2E2E", "#EBEB00", "#FFFFFF"];
const GLOW = "#EBEB00";
const MAIN_DEG = -24;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const outExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const inOutCubic = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const rad = (d: number) => (d * Math.PI) / 180;

interface Setup { ctx: CanvasRenderingContext2D; W: number; H: number; cx: number; cy: number; L: number }

function setup(canvas: HTMLCanvasElement): Setup | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, W, H, cx: W / 2, cy: H / 2, L: Math.hypot(W, H) * 1.08 };
}

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Bilah tebasan: runcing di kedua ujung, tebal di tengah. p = bagian yang sudah tergambar (0..1), dari kanan-atas ke kiri-bawah. */
function blade(s: Setup, deg: number, off: number, p: number, maxW: number, fill: string, alpha: number, glow = true) {
  if (p <= 0 || alpha <= 0) return;
  const { ctx, cx, cy, L } = s;
  const a = rad(deg), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const N = 56, left: [number, number][] = [], right: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * p;
    const along = L / 2 - u * L;
    const w = maxW * Math.pow(Math.sin(Math.PI * u), 0.65) * Math.min(1, (p - u) / 0.05 + 0.05);
    const px = cx + dx * along + nx * off, py = cy + dy * along + ny * off;
    left.push([px + (nx * w) / 2, py + (ny * w) / 2]);
    right.push([px - (nx * w) / 2, py - (ny * w) / 2]);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  if (glow) { ctx.shadowColor = GLOW; ctx.shadowBlur = 26; }
  ctx.fillStyle = fill;
  ctx.beginPath();
  left.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Garis radial tipis dari titik tebasan (kesan hentakan). */
function burstLines(s: Setup, color: string, count: number, alpha: number, seed: number) {
  const { ctx, cx, cy, L } = s;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const a = ((i + ((seed * 7 + i * 13) % 5) / 5) / count) * Math.PI * 2;
    const w = 0.012 + ((i * 37 + seed * 11) % 10) / 400;
    const r0 = 40 + ((i * 53) % 90);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0);
    ctx.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L);
    ctx.lineTo(cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

interface Shard { at: number; u: number; v: number; vd: number; size: number; color: string; life: number }
function makeShards(n: number, at: number): Shard[] {
  return Array.from({ length: n }, () => ({
    at: at + Math.random() * 90,
    u: Math.random(),
    v: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 520),
    vd: (Math.random() - 0.5) * 260,
    size: 5 + Math.random() * 9,
    color: SHARD[Math.floor(Math.random() * SHARD.length)],
    life: 420 + Math.random() * 380,
  }));
}
function drawShards(s: Setup, shards: Shard[], t: number, deg: number, off = 0) {
  const { ctx, cx, cy, L } = s;
  const a = rad(deg), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  for (const sh of shards) {
    const age = t - sh.at;
    if (age < 0 || age > sh.life) continue;
    const k = age / 1000, e = 1 - Math.pow(1 - clamp01(age / sh.life), 2);
    const along = L / 2 - sh.u * L + sh.vd * k * 0.6;
    const px = cx + dx * along + nx * (off + sh.v * k * (1 - 0.5 * e));
    const py = cy + dy * along + ny * (off + sh.v * k * (1 - 0.5 * e));
    s.ctx.globalAlpha = 1 - e;
    ctx.fillStyle = sh.color;
    const z = Math.max(1, sh.size * (1 - 0.4 * e));
    ctx.fillRect(Math.round(px - z / 2), Math.round(py - z / 2), z, z);
  }
  ctx.globalAlpha = 1;
}

/** Bintang ledakan runcing untuk impact frame berat. */
function starburst(s: Setup, R: number, color: string, spikes: number, rot: number) {
  const { ctx, cx, cy } = s;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = rot + (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? R * (0.82 + ((i * 7) % 5) * 0.06) : R * 0.32;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export interface CoverOptions {
  /** Impact frame penutup yang lebih berat (hit-stop, bintang ledakan, tebasan tiga warna). Dipakai preloader. */
  heavy?: boolean;
}

// ---------------------------------------------------------------------------------------------

export function playSlashCover(canvas: HTMLCanvasElement, opts: CoverOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    const s = setup(canvas);
    if (!s) { resolve(); return; }
    const { ctx, W, H, cx, cy } = s;
    canvas.style.opacity = "1";
    canvas.style.transition = "none";

    if (reduced()) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      canvas.style.opacity = "0";
      canvas.style.transition = "opacity 220ms linear";
      requestAnimationFrame(() => { canvas.style.opacity = "1"; });
      window.setTimeout(resolve, 260);
      return;
    }

    // Garis waktu (ms)
    const A = { deg: MAIN_DEG, off: 0, t0: 40, dur: 150, w: H * 0.05 };
    const B = { deg: 21, off: H * 0.02, t0: 300, dur: 140, w: H * 0.04 };
    const C = { deg: MAIN_DEG, off: 0, t0: 500, dur: 130, w: H * 0.09 };
    const heavy = !!opts.heavy;
    const IMP3_END = heavy ? 850 : 760;
    const MOSAIC0 = heavy ? 830 : 740, MOSAIC_MS = 520, END = MOSAIC0 + MOSAIC_MS + 20;

    // Grid mosaik: urutan tumbuh = jarak ke garis tebasan utama.
    const cell = Math.max(52, Math.min(104, Math.round(W / 18)));
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell), n = cols * rows;
    const order = new Float32Array(n), seed = new Uint8Array(n), settle = new Uint8Array(n);
    const ma = rad(MAIN_DEG), mnx = -Math.sin(ma), mny = Math.cos(ma);
    let maxD = 1;
    const dist = new Float32Array(n);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      dist[i] = Math.abs((c * cell + cell / 2 - cx) * mnx + (r * cell + cell / 2 - cy) * mny);
      if (dist[i] > maxD) maxD = dist[i];
    }
    for (let i = 0; i < n; i++) {
      order[i] = clamp01(dist[i] / maxD + (Math.random() - 0.5) * 0.14);
      seed[i] = Math.floor(Math.random() * 4);
      settle[i] = Math.random() < 0.78 ? 3 : Math.floor(Math.random() * 3);
    }
    const shards = [...makeShards(16, A.t0 + A.dur * 0.4), ...makeShards(12, B.t0 + B.dur * 0.4), ...makeShards(26, C.t0 + C.dur * 0.4)];

    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      ctx.setTransform(Math.min(2, window.devicePixelRatio || 1), 0, 0, Math.min(2, window.devicePixelRatio || 1), 0, 0);
      ctx.clearRect(0, 0, W, H);

      const prog = (sl: { t0: number; dur: number }) => outExpo(clamp01((t - sl.t0) / sl.dur));
      const fade = (sl: { t0: number; dur: number }, hold: number, ms: number) => 1 - clamp01((t - sl.t0 - sl.dur - hold) / ms);

      // Redup bertahap
      ctx.fillStyle = "#000";
      ctx.globalAlpha = 0.8 * outCubic(clamp01(t / 180));
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;

      // Getar halus saat impact
      const imp1 = t >= 190 && t < 300, imp2 = t >= 440 && t < 480, imp3 = t >= 630 && t < IMP3_END;
      // Hit-stop: 60ms pertama impact berat membeku (tanpa getar), lalu getar kuat.
      const shake = heavy && imp3 ? (t < 690 ? 0 : 12) : imp1 || imp3 ? 7 : imp2 ? 3 : 0;
      ctx.save();
      if (shake) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);

      if (heavy && imp3) {
        const k = t - 630;
        const R = Math.min(W, H) * 0.34;
        if (k < 55) {
          // 1) putih, bintang dan tebasan hitam tebal
          ctx.fillStyle = "#fff"; ctx.fillRect(-30, -30, W + 60, H + 60);
          burstLines(s, "#000", 52, 0.95, 5);
          starburst(s, R, "#000", 16, 0.15);
          blade(s, A.deg, A.off, 1, C.w * 1.5, "#000", 1, false);
          blade(s, B.deg, B.off, 1, B.w * 1.2, "#000", 0.9, false);
        } else if (k < 110) {
          // 2) hitam, bintang dan tebasan putih
          ctx.fillStyle = "#000"; ctx.fillRect(-30, -30, W + 60, H + 60);
          burstLines(s, "#fff", 56, 0.95, 6);
          starburst(s, R * 1.2, "#fff", 14, 0.6);
          blade(s, A.deg, A.off, 1, C.w * 1.5, "#fff", 1, false);
        } else if (k < 175) {
          // 3) pecah tiga warna (chromatic): biru, merah, kuning bergeser di kedua sisi tebasan
          ctx.fillStyle = "#000"; ctx.fillRect(-30, -30, W + 60, H + 60);
          burstLines(s, "#EBEB00", 48, 0.55, 7);
          ctx.globalCompositeOperation = "lighter";
          const sp = C.w * 0.55;
          blade(s, A.deg, -sp, 1, C.w * 1.1, "#0033ff", 1, false);
          blade(s, A.deg, 0, 1, C.w * 1.1, "#ff2a1a", 1, false);
          blade(s, A.deg, sp, 1, C.w * 1.1, "#ffe600", 1, false);
          ctx.globalCompositeOperation = "source-over";
          blade(s, A.deg, 0, 1, C.w * 0.5, "#fff", 1, false);
        } else {
          // 4) kilat putih memudar ke mosaik
          ctx.fillStyle = "#fff"; ctx.globalAlpha = 1 - (k - 175) / 45; ctx.fillRect(-30, -30, W + 60, H + 60); ctx.globalAlpha = 1;
          blade(s, A.deg, A.off, 1, C.w * 1.3, "#fff", 1, true);
        }
      } else if (imp1 || imp3) {
        const first = (imp1 && t < 250) || (imp3 && t < 700);
        ctx.fillStyle = first ? "#fff" : "#000";
        ctx.fillRect(-20, -20, W + 40, H + 40);
        const ink = first ? "#000" : "#fff";
        burstLines(s, ink, imp3 ? 40 : 28, 0.9, imp3 ? 3 : 1);
        blade(s, A.deg, A.off, 1, imp3 ? C.w * 1.25 : A.w * 1.5, ink, 1, false);
        if (imp3) { blade(s, B.deg, B.off, 1, B.w, ink, 0.9, false); blade(s, C.deg, C.off, 1, C.w * 1.25, ink, 1, false); }
      } else if (imp2) {
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.65;
        ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.globalAlpha = 1;
        blade(s, B.deg, B.off, 1, B.w * 1.4, "#000", 1, false);
      } else {
        // Tebasan putih berpendar + bayangan sejajar tipis
        for (const sl of [A, B, C]) {
          const p = prog(sl);
          const al = sl === C ? Math.min(1, fade(sl, 0, 150) + 0.0) : fade(sl, 60, 240);
          if (p > 0) {
            blade(s, sl.deg, sl.off + sl.w * 0.9, p, sl.w * 0.35, "#EBEB00", al * 0.55, false);
            blade(s, sl.deg, sl.off, p, sl.w, "#ffffff", al);
          }
        }
      }
      ctx.restore();

      drawShards(s, shards, t, MAIN_DEG);

      // Mosaik piksel (tumbuh dari garis tebasan keluar)
      if (t >= MOSAIC0) {
        const tm = clamp01((t - MOSAIC0) / MOSAIC_MS);
        const flick = Math.floor(t / 70);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const raw = clamp01((tm - order[i] * 0.55) / 0.45);
          if (raw <= 0) continue;
          const e = outCubic(raw);
          const sz = Math.ceil(cell * e) + (raw >= 1 ? 1 : 0);
          ctx.fillStyle = PALETTE[raw >= 1 ? settle[i] : (seed[i] + flick) % 4];
          ctx.fillRect(c * cell + (cell - sz) / 2, r * cell + (cell - sz) / 2, sz, sz);
        }
      }

      if (t < END) requestAnimationFrame(frame);
      else {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, W, H);
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}

// ---------------------------------------------------------------------------------------------

export function playSlashReveal(canvas: HTMLCanvasElement, onFirstFrame?: () => void): Promise<void> {
  return new Promise((resolve) => {
    const s = setup(canvas);
    if (!s) { onFirstFrame?.(); resolve(); return; }
    const { ctx, W, H, cx, cy, L } = s;
    canvas.style.opacity = "1";
    canvas.style.transition = "none";

    if (reduced()) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      onFirstFrame?.();
      canvas.style.transition = "opacity 260ms linear";
      requestAnimationFrame(() => { canvas.style.opacity = "0"; });
      window.setTimeout(resolve, 300);
      return;
    }

    const SLASH0 = 110, SLASH_MS = 130, SPLIT0 = 270, SPLIT_MS = 780, END = SPLIT0 + SPLIT_MS + 40;
    const a = rad(MAIN_DEG), dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
    const shards = makeShards(46, SPLIT0 - 40);
    const maxOff = L / 2 + 60;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const half = (sign: 1 | -1, off: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(nx * off * sign, ny * off * sign);
      const R = L * 2;
      const p1x = cx - dx * R, p1y = cy - dy * R, p2x = cx + dx * R, p2y = cy + dy * R;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p2x + nx * R * sign, p2y + ny * R * sign);
      ctx.lineTo(p1x + nx * R * sign, p1y + ny * R * sign);
      ctx.closePath();
      ctx.fillStyle = "#000";
      ctx.fill();
      ctx.restore();
    };

    const start = performance.now();
    let first = true;
    const frame = (now: number) => {
      const t = now - start;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const sp = t < SPLIT0 ? 0 : inOutCubic(clamp01((t - SPLIT0) / SPLIT_MS));
      const off = sp * maxOff;
      // Dua belahan hitam, tepi-tepinya berpendar sebentar
      half(1, off, 1);
      half(-1, off, 1);
      const edge = 1 - clamp01((t - SPLIT0) / 420);
      if (edge > 0) {
        ctx.save();
        ctx.globalAlpha = edge;
        ctx.strokeStyle = "#fff";
        ctx.shadowColor = GLOW;
        ctx.shadowBlur = 22;
        ctx.lineWidth = 3;
        for (const sign of [1, -1]) {
          ctx.beginPath();
          ctx.moveTo(cx - dx * L + nx * off * sign, cy - dy * L + ny * off * sign);
          ctx.lineTo(cx + dx * L + nx * off * sign, cy + dy * L + ny * off * sign);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Tebasan penyala sebelum terbelah
      const p = outExpo(clamp01((t - SLASH0) / SLASH_MS));
      const al = 1 - clamp01((t - SLASH0 - SLASH_MS - 60) / 200);
      if (p > 0 && al > 0) {
        blade(s, MAIN_DEG, 0, p, H * 0.085, "#EBEB00", al * 0.6, false);
        blade(s, MAIN_DEG, 0, p, H * 0.06, "#fff", al);
      }
      // Kilat tipis saat tebasan selesai
      const fl = clamp01(1 - (t - (SLASH0 + SLASH_MS)) / 160);
      if (t > SLASH0 + SLASH_MS * 0.7 && fl > 0) {
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.28 * fl;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      drawShards(s, shards, t, MAIN_DEG, 0);

      if (first) { first = false; onFirstFrame?.(); }
      if (t < END) requestAnimationFrame(frame);
      else { ctx.clearRect(0, 0, W, H); resolve(); }
    };
    requestAnimationFrame(frame);
  });
}
