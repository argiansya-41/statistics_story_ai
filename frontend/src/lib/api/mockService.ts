import type {
  AnalysisRecord,
  AnalysisType,
  DatasetSummary,
  DescriptiveConfig,
  DescriptiveResult,
  TTestConfig,
  TTestResult,
  CorrelationConfig,
  CorrelationResult,
  RegressionConfig,
  RegressionResult,
  VisualizationSpec,
} from "@/lib/types/analysis";
import { getCurrentUser } from "@/lib/session";
import { ApiError } from "./client";

const SIMULATE_FAIL_KEY = "stat_story_simulate_ai_fail";

export function getSimulateAiFailure(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIMULATE_FAIL_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSimulateAiFailure(simulate: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIMULATE_FAIL_KEY, simulate ? "true" : "false");
  } catch {
    /* abaikan */
  }
}

function getStorageKey(): string {
  const user = getCurrentUser();
  const mail = user?.email || "demo";
  return `stat_story_mock_analyses_${mail.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
}

function loadStorage(): (AnalysisRecord & { runTimestamp?: number })[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStorage(records: (AnalysisRecord & { runTimestamp?: number })[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getStorageKey(), JSON.stringify(records));
  } catch {
    /* abaikan */
  }
}

/* =========================================================================
   MESIN STATISTIK DETERMINISTIK ACUAN SCIPY 1.13
   Fungsi distribusi Student t dua sisi via regularized incomplete beta:
   p = I_x(df/2, 1/2) dengan x = df / (df + t^2)
   Toleransi acuan SciPy relatif < 1e-6
   ========================================================================= */

function logGamma(z: number): number {
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109585720526,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = p[0];
  for (let i = 1; i < p.length; i++) {
    x += p[i] / (z + i);
  }
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3.0e-12;
  const FPMIN = 1.0e-30;

  const qab = a + b;
  const qap = a + 1.0;
  const qam = a - 1.0;
  let c = 1.0;
  let d = 1.0 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1.0 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1.0 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1.0 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1.0 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1.0) <= EPS) break;
  }
  return h;
}

function incBeta(x: number, a: number, b: number): number {
  if (x <= 0.0) return 0.0;
  if (x >= 1.0) return 1.0;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

export function studentTwoTailedP(t: number, df: number): number {
  if (df <= 0) return 1.0;
  if (isNaN(t) || !isFinite(t)) return 0.0;
  const absT = Math.abs(t);
  if (absT === 0) return 1.0;
  const x = df / (df + absT * absT);
  const p = incBeta(x, df / 2.0, 0.5);
  return Math.max(0, Math.min(1.0, p));
}

/**
 * 1. Perhitungan Statistik Deskriptif Deterministik
 * Aturan modus: terkecil bila ada beberapa, kosong bila semua unik.
 */
export function calculateDescriptive(
  data: Record<string, string | number>[],
  cols: string[]
): DescriptiveResult {
  const ringkasan = cols.map((col) => {
    const values = data
      .map((r) => Number(r[col]))
      .filter((v) => !isNaN(v) && isFinite(v))
      .sort((a, b) => a - b);

    const n = values.length;
    if (n < 2) {
      throw new ApiError(422, `Kolom '${col}' memerlukan minimal 2 observasi numerik valid`, "VALIDATION_ERROR", col);
    }

    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

    // Modus (terkecil bila ada beberapa, kosong bila semua nilai unik)
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    values.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) maxFreq = freq[v];
    });

    let modus: number[] = [];
    if (maxFreq > 1) {
      const modeCandidates = Object.keys(freq)
        .filter((k) => freq[Number(k)] === maxFreq)
        .map((k) => Number(k))
        .sort((a, b) => a - b);
      // Ambil yang terkecil
      modus = [modeCandidates[0]];
    }

    // Standar Deviasi Sampel (n - 1)
    const sqDiffSum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    const variance = sqDiffSum / (n - 1);
    const sd = Math.sqrt(variance);

    return {
      kolom: col,
      mean: Number(mean.toFixed(4)),
      median: Number(median.toFixed(4)),
      modus,
      standar_deviasi: Number(sd.toFixed(4)),
      min: values[0],
      max: values[n - 1],
      n,
    };
  });

  return { ringkasan };
}

/**
 * 2. Perhitungan Uji t Welch Dua Kelompok Independen
 * Derajat kebebasan Welch-Satterthwaite (float)
 */
export function calculateWelchTTest(
  data: Record<string, string | number>[],
  kolomNilai: string,
  kolomKelompok: string
): TTestResult {
  const groups: Record<string, number[]> = {};

  data.forEach((row) => {
    const grp = String(row[kolomKelompok] ?? "").trim();
    const rawVal = row[kolomNilai];
    const val = Number(rawVal);
    if (grp !== "" && rawVal !== "" && rawVal !== undefined && !isNaN(val) && isFinite(val)) {
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(val);
    }
  });

  const groupKeys = Object.keys(groups);
  if (groupKeys.length !== 2) {
    throw new ApiError(
      422,
      `Kolom kelompok '${kolomKelompok}' harus memiliki tepat 2 kategori unik (ditemukan ${groupKeys.length}: ${groupKeys.join(", ") || "tidak ada"})`,
      "VALIDATION_ERROR",
      kolomKelompok
    );
  }

  const [k1, k2] = groupKeys;
  const vals1 = groups[k1];
  const vals2 = groups[k2];

  const n1 = vals1.length;
  const n2 = vals2.length;

  if (n1 < 2 || n2 < 2) {
    throw new ApiError(
      422,
      `Setiap kelompok dalam Uji t memerlukan minimal 2 observasi (Kelompok '${k1}': ${n1}, '${k2}': ${n2})`,
      "VALIDATION_ERROR",
      kolomNilai
    );
  }

  const mean1 = vals1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = vals2.reduce((a, b) => a + b, 0) / n2;

  const var1 = vals1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (n1 - 1);
  const var2 = vals2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (n2 - 1);

  const sd1 = Math.sqrt(var1);
  const sd2 = Math.sqrt(var2);

  const seDiff = Math.sqrt(var1 / n1 + var2 / n2);
  if (seDiff === 0) {
    throw new ApiError(422, `Variansi gabungan kedua kelompok adalah 0 (semua data bernilai identik)`, "VALIDATION_ERROR", kolomNilai);
  }

  const t = (mean1 - mean2) / seDiff;

  // Derajat kebebasan Welch-Satterthwaite
  const term1 = var1 / n1;
  const term2 = var2 / n2;
  const numerator = Math.pow(term1 + term2, 2);
  const denominator = Math.pow(term1, 2) / (n1 - 1) + Math.pow(term2, 2) / (n2 - 1);
  const df = denominator === 0 ? n1 + n2 - 2 : numerator / denominator;

  const pVal = studentTwoTailedP(t, df);

  return {
    t: Number(t.toFixed(4)),
    df: Number(df.toFixed(4)),
    p_value: Number(pVal.toFixed(6)),
    kelompok_1: {
      nama: k1,
      mean: Number(mean1.toFixed(2)),
      sd: Number(sd1.toFixed(4)),
      n: n1,
    },
    kelompok_2: {
      nama: k2,
      mean: Number(mean2.toFixed(2)),
      sd: Number(sd2.toFixed(4)),
      n: n2,
    },
    signifikan: pVal < 0.05,
    alpha: 0.05,
    perbedaan_mean: Number((mean1 - mean2).toFixed(4)),
  };
}

/**
 * 3. Perhitungan Korelasi Pearson Deterministik
 */
export function calculatePearson(
  data: Record<string, string | number>[],
  kolomX: string,
  kolomY: string
): CorrelationResult {
  const pairs: { x: number; y: number }[] = [];

  data.forEach((r) => {
    const vx = r[kolomX];
    const vy = r[kolomY];
    const x = Number(vx);
    const y = Number(vy);
    if (vx !== "" && vx !== undefined && vy !== "" && vy !== undefined && !isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      pairs.push({ x, y });
    }
  });

  const n = pairs.length;
  if (n < 3) {
    throw new ApiError(
      422,
      `Korelasi Pearson memerlukan minimal 3 pasangan data numerik lengkap (hanya ditemukan ${n} pasang)`,
      "VALIDATION_ERROR",
      n < 3 ? (kolomX === kolomY ? kolomX : `${kolomX}, ${kolomY}`) : undefined
    );
  }

  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

  let sXX = 0;
  let sYY = 0;
  let sXY = 0;

  pairs.forEach((p) => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sXX += dx * dx;
    sYY += dy * dy;
    sXY += dx * dy;
  });

  if (sXX === 0) {
    throw new ApiError(422, `Kolom X '${kolomX}' bernilai konstan (variansi 0)`, "VALIDATION_ERROR", kolomX);
  }
  if (sYY === 0) {
    throw new ApiError(422, `Kolom Y '${kolomY}' bernilai konstan (variansi 0)`, "VALIDATION_ERROR", kolomY);
  }

  const denom = Math.sqrt(sXX * sYY);
  const r = sXY / denom;
  const df = n - 2;

  let t = 0;
  let pVal = 0;
  if (Math.abs(r) >= 1.0) {
    t = r > 0 ? 999999 : -999999;
    pVal = 0.0;
  } else {
    t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
    pVal = studentTwoTailedP(t, df);
  }

  const absR = Math.abs(r);
  let kekuatan: CorrelationResult["kekuatan"] = "Sangat Lemah";
  if (absR >= 0.8) kekuatan = "Sangat Kuat";
  else if (absR >= 0.6) kekuatan = "Kuat";
  else if (absR >= 0.4) kekuatan = "Sedang";
  else if (absR >= 0.2) kekuatan = "Lemah";

  return {
    r: Number(r.toFixed(6)),
    p_value: Number(pVal.toExponential(4)),
    arah: r > 0 ? "positif" : r < 0 ? "negatif" : "tidak_ada",
    kekuatan,
    n,
    variabel_x: kolomX,
    variabel_y: kolomY,
  };
}

/**
 * 4. Perhitungan Regresi Linear Sederhana Deterministik
 */
export function calculateSimpleRegression(
  data: Record<string, string | number>[],
  kolomX: string,
  kolomY: string
): RegressionResult {
  const pairs: { x: number; y: number }[] = [];

  data.forEach((r) => {
    const vx = r[kolomX];
    const vy = r[kolomY];
    const x = Number(vx);
    const y = Number(vy);
    if (vx !== "" && vx !== undefined && vy !== "" && vy !== undefined && !isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      pairs.push({ x, y });
    }
  });

  const n = pairs.length;
  if (n < 3) {
    throw new ApiError(
      422,
      `Regresi linear sederhana memerlukan minimal 3 pasangan data (hanya ditemukan ${n} pasang)`,
      "VALIDATION_ERROR",
      kolomX
    );
  }

  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

  let sXX = 0;
  let sYY = 0;
  let sXY = 0;

  pairs.forEach((p) => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    sXX += dx * dx;
    sYY += dy * dy;
    sXY += dx * dy;
  });

  if (sXX === 0) {
    throw new ApiError(422, `Variabel bebas X '${kolomX}' bernilai konstan (variansi 0)`, "VALIDATION_ERROR", kolomX);
  }
  if (sYY === 0) {
    throw new ApiError(422, `Variabel terikat Y '${kolomY}' bernilai konstan (variansi 0)`, "VALIDATION_ERROR", kolomY);
  }

  const slope = sXY / sXX;
  const intercept = meanY - slope * meanX;

  const r = sXY / Math.sqrt(sXX * sYY);
  const rSquared = r * r;
  const df = n - 2;

  let t = 0;
  let pVal = 0;
  if (Math.abs(r) >= 1.0) {
    t = r > 0 ? 999999 : -999999;
    pVal = 0.0;
  } else {
    t = (r * Math.sqrt(df)) / Math.sqrt(1 - r * r);
    pVal = studentTwoTailedP(t, df);
  }

  const pers = `Y = ${intercept.toFixed(4)} + ${slope >= 0 ? slope.toFixed(4) : `(${slope.toFixed(4)})`}X`;

  return {
    koefisien: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(4)),
    r_squared: Number(rSquared.toFixed(6)),
    p_value: Number(pVal.toExponential(4)),
    persamaan: pers,
    n,
    variabel_x: kolomX,
    variabel_y: kolomY,
  };
}

/**
 * Generator visualisasi SVG piksel
 */
export function generateVisualizations(
  jenis: AnalysisType,
  hasil: any,
  dataMentah: Record<string, string | number>[] = []
): VisualizationSpec[] {
  if (jenis === "deskriptif") {
    const ringkasan: DescriptiveResult["ringkasan"] = hasil.ringkasan || [];
    const specs: VisualizationSpec[] = [];

    ringkasan.forEach((item) => {
      const vals = dataMentah
        .map((r) => Number(r[item.kolom]))
        .filter((v) => !isNaN(v) && isFinite(v));

      if (vals.length > 0) {
        const min = item.min;
        const max = item.max;
        const numBins = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(vals.length))));
        const binWidth = max === min ? 1 : (max - min) / numBins;

        const bins = Array.from({ length: numBins }, (_, i) => {
          const bMin = min + i * binWidth;
          const bMax = min + (i + 1) * binWidth;
          const count = vals.filter((v) =>
            i === numBins - 1 ? v >= bMin && v <= bMax : v >= bMin && v < bMax
          ).length;
          return {
            label: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
            min: Number(bMin.toFixed(2)),
            max: Number(bMax.toFixed(2)),
            count,
          };
        });

        specs.push({
          jenis_grafik: "histogram",
          judul: `Histogram Distribusi: ${item.kolom}`,
          label_x: item.kolom,
          label_y: "Frekuensi",
          data_grafik: {
            bins,
            mean_marker: item.mean,
          },
        });
      }
    });

    return specs;
  }

  if (jenis === "uji_t") {
    const res = hasil as TTestResult;
    return [
      {
        jenis_grafik: "batang",
        judul: `Perbandingan Rata-rata: ${res.kelompok_1.nama} vs ${res.kelompok_2.nama}`,
        label_x: "Kelompok",
        label_y: "Nilai Rata-rata",
        data_grafik: {
          kategori: [res.kelompok_1.nama, res.kelompok_2.nama],
          nilai: [res.kelompok_1.mean, res.kelompok_2.mean],
          labels: [
            `M = ${res.kelompok_1.mean} (SD = ${res.kelompok_1.sd})`,
            `M = ${res.kelompok_2.mean} (SD = ${res.kelompok_2.sd})`,
          ],
        },
      },
    ];
  }

  if (jenis === "korelasi") {
    const res = hasil as CorrelationResult;
    const points = dataMentah
      .map((r) => ({
        x: Number(r[res.variabel_x]),
        y: Number(r[res.variabel_y]),
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 10;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 10;

    return [
      {
        jenis_grafik: "scatter",
        judul: `Scatter Plot: ${res.variabel_x} vs ${res.variabel_y}`,
        label_x: res.variabel_x,
        label_y: res.variabel_y,
        data_grafik: {
          points,
          line: {
            x1: minX,
            y1: res.arah === "positif" ? minY : maxY,
            x2: maxX,
            y2: res.arah === "positif" ? maxY : minY,
          },
        },
      },
    ];
  }

  if (jenis === "regresi") {
    const res = hasil as RegressionResult;
    const points = dataMentah
      .map((r) => ({
        x: Number(r[res.variabel_x]),
        y: Number(r[res.variabel_y]),
      }))
      .filter((p) => !isNaN(p.x) && !isNaN(p.y));

    const xs = points.map((p) => p.x);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 10;
    const y1 = res.intercept + res.koefisien * minX;
    const y2 = res.intercept + res.koefisien * maxX;

    return [
      {
        jenis_grafik: "scatter",
        judul: `Garis Regresi Linear: ${res.persamaan}`,
        label_x: res.variabel_x,
        label_y: res.variabel_y,
        data_grafik: {
          points,
          line: {
            x1: minX,
            y1: Number(y1.toFixed(4)),
            x2: maxX,
            y2: Number(y2.toFixed(4)),
            slope: res.koefisien,
            intercept: res.intercept,
          },
        },
      },
    ];
  }

  return [];
}

/**
 * Generator Narasi Mode Demo (Templat berlabel wajib)
 */
export function generateNarrativesAndCase(
  jenis: AnalysisType,
  hasil: any,
  lang: "id" | "en" = "id"
): { narasi: string; contoh_kasus: string } {
  const demoPrefixId = "[NARASI DEMO (TEMPLAT), BUKAN AI]\n\n";
  const demoPrefixEn = "[DEMO NARRATIVE (TEMPLATE), NOT AI]\n\n";

  if (jenis === "deskriptif") {
    const r: DescriptiveResult = hasil;
    const first = r.ringkasan[0];
    const modStr = first.modus.length > 0 ? first.modus.join(", ") : "tidak ada";

    if (lang === "id") {
      return {
        narasi: `${demoPrefixId}Analisis statistik deskriptif untuk variabel ${first.kolom} mencatat nilai rata-rata (mean) sebesar ${first.mean} dengan standar deviasi ${first.standar_deviasi}. Nilai tengah (median) berada pada angka ${first.median}, nilai modus ${modStr}, merentang dari nilai minimum ${first.min} hingga maksimum ${first.max} dari total ${first.n} observasi. Kedekatan nilai mean dan median mengindikasikan bahwa distribusi data relatif seimbang di sekitar pusat data.`,
        contoh_kasus: `Analogi: Ibarat mengevaluasi skor tes kelas—bila rata-rata (${first.mean}) berdekatan dengan median (${first.median}), hal ini menandakan pemahaman materi terserap merata di antara peserta didik tanpa didominasi oleh segelintir skor ekstrem.`,
      };
    } else {
      return {
        narasi: `${demoPrefixEn}Descriptive statistical analysis for variable ${first.kolom} indicates a sample mean of ${first.mean} and standard deviation of ${first.standar_deviasi}. The median stands at ${first.median}, mode is ${modStr}, spanning from a minimum of ${first.min} to a maximum of ${first.max} across ${first.n} observations. Proximity between mean and median suggests a balanced central distribution without extreme outlier bias.`,
        contoh_kasus: `Analogy: Like reviewing quiz scores across a class cohort—when class average (${first.mean}) closely matches the median student (${first.median}), it indicates balanced comprehension across students rather than distortion from outlier scores.`,
      };
    }
  }

  if (jenis === "uji_t") {
    const res: TTestResult = hasil;
    const sigTextId = res.signifikan
      ? `terdapat perbedaan yang signifikan secara statistik antara kedua kelompok pada tingkat signifikansi α = 0.05 (p = ${res.p_value} < 0.05)`
      : `tidak terdapat perbedaan yang signifikan secara statistik antara kedua kelompok pada tingkat signifikansi α = 0.05 (p = ${res.p_value} ≥ 0.05)`;
    const sigTextEn = res.signifikan
      ? `there is a statistically significant difference between the two groups at α = 0.05 (p = ${res.p_value} < 0.05)`
      : `there is no statistically significant difference between the two groups at α = 0.05 (p = ${res.p_value} ≥ 0.05)`;

    if (lang === "id") {
      return {
        narasi: `${demoPrefixId}Uji t dua kelompok independen metode Welch menghasilkan nilai statistik t = ${res.t} dengan derajat kebebasan df = ${res.df}. Nilai p-value tercatat sebesar ${res.p_value}. Berdasarkan kriteria uji, perbandingan antara kelompok ${res.kelompok_1.nama} (rata-rata = ${res.kelompok_1.mean}, SD = ${res.kelompok_1.sd}, n = ${res.kelompok_1.n}) dan kelompok ${res.kelompok_2.nama} (rata-rata = ${res.kelompok_2.mean}, SD = ${res.kelompok_2.sd}, n = ${res.kelompok_2.n}) menunjukkan bahwa ${sigTextId}. Selisih rata-rata kedua kelompok adalah ${res.perbedaan_mean}.`,
        contoh_kasus: `Analogi: Seperti menguji efektivitas dua metode belajar berbeda pada dua kelas—selisih pencapaian sebesar ${Math.abs(res.perbedaan_mean)} dengan signifikansi p = ${res.p_value} membuktikan secara objektif apakah salah satu metode nyata lebih unggul atau perbedaannya semata karena variasi acak.`,
      };
    } else {
      return {
        narasi: `${demoPrefixEn}Welch's two-sample independent t-test yielded a t-statistic of ${res.t} with degrees of freedom df = ${res.df} and a p-value of ${res.p_value}. Comparing ${res.kelompok_1.nama} (Mean = ${res.kelompok_1.mean}, SD = ${res.kelompok_1.sd}, n = ${res.kelompok_1.n}) with ${res.kelompok_2.nama} (Mean = ${res.kelompok_2.mean}, SD = ${res.kelompok_2.sd}, n = ${res.kelompok_2.n}) concludes that ${sigTextEn}. The measured mean difference is ${res.perbedaan_mean}.`,
        contoh_kasus: `Analogy: Like testing two onboarding methods across separate teams—the measured difference of ${Math.abs(res.perbedaan_mean)} and p-value of ${res.p_value} verifies whether one training format is genuinely superior or if the difference is mere chance.`,
      };
    }
  }

  if (jenis === "korelasi") {
    const res: CorrelationResult = hasil;
    const isSig = Number(res.p_value) < 0.05;
    const sigTextId = isSig ? "signifikan secara statistik (p < 0.05)" : "tidak signifikan secara statistik (p ≥ 0.05)";
    const sigTextEn = isSig ? "statistically significant (p < 0.05)" : "not statistically significant (p ≥ 0.05)";

    if (lang === "id") {
      return {
        narasi: `${demoPrefixId}Analisis korelasi Pearson antara ${res.variabel_x} dan ${res.variabel_y} menghasilkan koefisien korelasi r = ${res.r} dengan p-value = ${res.p_value} pada ${res.n} pasangan observasi. Nilai ini mengindikasikan hubungan linier berpola ${res.arah} dengan kekuatan kategori ${res.kekuatan} (${sigTextId}). Harap dicatat bahwa koefisien korelasi mengukur asosiasi linear dan tidak membuktikan adanya hubungan sebab-akibat (kausalitas).`,
        contoh_kasus: `Analogi: Seperti mengamati hubungan suhu cuaca dengan penjualan es krim—ketika suhu naik, penjualan es krim meningkat (korelasi positif), namun meningkatnya penjualan es krim tentu bukan penyebab cuaca panas.`,
      };
    } else {
      return {
        narasi: `${demoPrefixEn}Pearson correlation analysis between ${res.variabel_x} and ${res.variabel_y} yielded a coefficient r = ${res.r} with p-value = ${res.p_value} across ${res.n} observation pairs. This reflects a ${res.arah} linear association with ${res.kekuatan} strength (${sigTextEn}). Note that correlation indicates linear co-movement and does not establish causation.`,
        contoh_kasus: `Analogy: Like observing ambient temperature and ice cream sales—higher temperatures coincide with more sales, but purchasing ice cream does not drive the weather warmer.`,
      };
    }
  }

  if (jenis === "regresi") {
    const res: RegressionResult = hasil;
    const isSig = Number(res.p_value) < 0.05;
    const sigTextId = isSig ? "signifikan (p < 0.05)" : "tidak signifikan (p ≥ 0.05)";
    const sigTextEn = isSig ? "statistically significant (p < 0.05)" : "not statistically significant (p ≥ 0.05)";

    if (lang === "id") {
      return {
        narasi: `${demoPrefixId}Model regresi linear sederhana menghasilkan persamaan estimasi ${res.persamaan}. Koefisien regresi (slope) b = ${res.koefisien} menunjukkan bahwa untuk setiap kenaikan 1 unit pada variabel bebas ${res.variabel_x}, variabel terikat ${res.variabel_y} diprediksi mengalami perubahan rata-rata sebesar ${res.koefisien} unit (konstanta intercept a = ${res.intercept}). Nilai R² = ${res.r_squared} mengindikasikan bahwa sekitar ${(res.r_squared * 100).toFixed(1)}% variabilitas pada ${res.variabel_y} dapat dijelaskan oleh model ini (${sigTextId}). Koefisien menggambarkan laju perubahan garis estimasi tanpa mengasumsikan kausalitas sepihak yang belum diuji.`,
        contoh_kasus: `Analogi: Seperti memprediksi konsumsi bahan bakar mobil dari jarak tempuh—persamaan garis memberikan rumus matematis kebutuhan bensin dengan tingkat akurasi yang diwakili oleh nilai R² (${(res.r_squared * 100).toFixed(1)}%).`,
      };
    } else {
      return {
        narasi: `${demoPrefixEn}The simple linear regression model yielded the equation ${res.persamaan}. The slope coefficient b = ${res.koefisien} estimates that for each 1-unit increase in ${res.variabel_x}, ${res.variabel_y} changes by an average of ${res.koefisien} units, with intercept a = ${res.intercept}. The coefficient of determination R² = ${res.r_squared} means approximately ${(res.r_squared * 100).toFixed(1)}% of the variance in ${res.variabel_y} is explained by this model (${sigTextEn}). The slope describes the rate of linear change without asserting causality.`,
        contoh_kasus: `Analogy: Like predicting vehicle fuel consumption based on travel distance—the regression line provides a formula for expected fuel needed, with reliability reflected by R² (${(res.r_squared * 100).toFixed(1)}%).`,
      };
    }
  }

  return {
    narasi: `${demoPrefixId}Hasil narasi templat belum tersedia.`,
    contoh_kasus: "Contoh kasus belum tersedia.",
  };
}

/**
 * IMPLEMENTASI BACKEND DEMO (Pure Client-side, LocalStorage per email)
 */
export const demoBackend = {
  isLiveBackend(): boolean {
    return false;
  },

  isDemoMode(): boolean {
    return true;
  },

  getSimulateAiFailure(): boolean {
    return getSimulateAiFailure();
  },

  setSimulateAiFailure(simulate: boolean): void {
    setSimulateAiFailure(simulate);
  },

  async create(namaSesi: string = "Analisis Baru"): Promise<AnalysisRecord> {
    const all = loadStorage();
    const id = Date.now();
    const newRecord: AnalysisRecord = {
      id_analisis: id,
      nama_sesi: namaSesi,
      jenis_analisis: "deskriptif",
      status: "draf",
      tanggal: new Date().toISOString(),
      disimpan: false,
    };
    all.unshift(newRecord);
    saveStorage(all);
    return newRecord;
  },

  async submitDataset(
    id: string | number,
    dataset: DatasetSummary,
    file?: File
  ): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    const current = all[idx];
    if (current.status !== "draf" && current.status !== "gagal") {
      throw new ApiError(
        409,
        "Data dan konfigurasi terkunci karena analisis sudah dijalankan (409 Conflict). Silakan buat sesi analisis baru.",
        "ANALYSIS_LOCKED"
      );
    }

    if (file) {
      const name = file.name.toLowerCase();
      if (name.endsWith(".xls") && !name.endsWith(".xlsx")) {
        throw new ApiError(
          415,
          "Format berkas Excel .xls biner lawas hanya dapat diproses server backend. Di mode demo, silakan gunakan file .xlsx atau .csv.",
          "UNSUPPORTED_MEDIA_TYPE",
          "file"
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new ApiError(413, "Ukuran file melebihi batas maksimal 5 MB", "PAYLOAD_TOO_LARGE", "file");
      }
    }

    all[idx].dataset_input = dataset;
    if (dataset.nama_dataset) {
      all[idx].nama_sesi = dataset.nama_dataset;
    }
    saveStorage(all);
    return all[idx];
  },

  async extractImage(file: File): Promise<DatasetSummary> {
    // Simulasi ekstraksi AI Vision dari gambar tabel pada mode demo
    const mockRows = [
      { siswa: "Siswa_1", nilai_pretest: 65, nilai_posttest: 82, jam_belajar: 4.5 },
      { siswa: "Siswa_2", nilai_pretest: 70, nilai_posttest: 88, jam_belajar: 5.0 },
      { siswa: "Siswa_3", nilai_pretest: 55, nilai_posttest: 74, jam_belajar: 3.5 },
      { siswa: "Siswa_4", nilai_pretest: 80, nilai_posttest: 92, jam_belajar: 6.0 },
      { siswa: "Siswa_5", nilai_pretest: 60, nilai_posttest: 78, jam_belajar: 4.0 },
      { siswa: "Siswa_6", nilai_pretest: 75, nilai_posttest: 85, jam_belajar: 5.5 },
      { siswa: "Siswa_7", nilai_pretest: 68, nilai_posttest: 80, jam_belajar: 4.8 },
      { siswa: "Siswa_8", nilai_pretest: 72, nilai_posttest: 86, jam_belajar: 5.2 },
    ];
    const headers = Object.keys(mockRows[0]);
    const datasetName = file.name.replace(/\.[^/.]+$/, "");
    return {
      nama_file: file.name,
      nama_dataset: datasetName,
      format_data: "image",
      sumber_input: "mentah",
      total_baris: mockRows.length,
      total_kolom: headers.length,
      kolom: headers,
      preview_baris: mockRows,
      data_mentah: mockRows,
    };
  },

  async saveConfig(
    id: string | number,
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    const current = all[idx];
    if (current.status !== "draf" && current.status !== "gagal") {
      throw new ApiError(
        409,
        "Konfigurasi terkunci karena analisis sudah dijalankan (409 Conflict). Silakan buat sesi analisis baru.",
        "ANALYSIS_LOCKED"
      );
    }

    all[idx].jenis_analisis = jenis;
    all[idx].config_json = config;
    saveStorage(all);
    return all[idx];
  },

  async run(id: string | number): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    const record = all[idx];
    const dataset = record.dataset_input;
    if (!dataset) {
      throw new ApiError(422, "Dataset belum dimasukkan untuk analisis ini", "VALIDATION_ERROR");
    }

    let calculatedHasil: any = null;
    const dataMentah = dataset.data_mentah || [];

    if (dataset.sumber_input === "siap_pakai" && dataset.data_siap_pakai) {
      calculatedHasil = dataset.data_siap_pakai;
    } else {
      if (record.jenis_analisis === "deskriptif") {
        const cfg = record.config_json as DescriptiveConfig;
        const cols = cfg?.kolom_ringkasan || [dataset.kolom[0]];
        if (!cols || cols.length === 0) {
          throw new ApiError(422, "Pilih setidaknya satu kolom numerik untuk deskriptif", "VALIDATION_ERROR", "kolom_ringkasan");
        }
        calculatedHasil = calculateDescriptive(dataMentah, cols);
      } else if (record.jenis_analisis === "uji_t") {
        const cfg = record.config_json as TTestConfig;
        if (!cfg?.kolom_nilai || !cfg?.kolom_kelompok) {
          throw new ApiError(422, "Kolom nilai dan kelompok wajib dipilih untuk Uji t", "VALIDATION_ERROR", !cfg?.kolom_nilai ? "kolom_nilai" : "kolom_kelompok");
        }
        calculatedHasil = calculateWelchTTest(dataMentah, cfg.kolom_nilai, cfg.kolom_kelompok);
      } else if (record.jenis_analisis === "korelasi") {
        const cfg = record.config_json as CorrelationConfig;
        if (!cfg?.kolom_x || !cfg?.kolom_y) {
          throw new ApiError(422, "Kolom variabel X dan Y wajib dipilih", "VALIDATION_ERROR", !cfg?.kolom_x ? "kolom_x" : "kolom_y");
        }
        calculatedHasil = calculatePearson(dataMentah, cfg.kolom_x, cfg.kolom_y);
      } else if (record.jenis_analisis === "regresi") {
        const cfg = record.config_json as RegressionConfig;
        if (!cfg?.kolom_x || !cfg?.kolom_y) {
          throw new ApiError(422, "Kolom variabel bebas (X) dan terikat (Y) wajib dipilih", "VALIDATION_ERROR", !cfg?.kolom_x ? "kolom_x" : "kolom_y");
        }
        calculatedHasil = calculateSimpleRegression(dataMentah, cfg.kolom_x, cfg.kolom_y);
      }
    }

    const visualisasi = generateVisualizations(record.jenis_analisis, calculatedHasil, dataMentah);

    // Langsung kembalikan hasil angka dan grafik (HTTP 202 Contract),
    // status diset ke 'diproses' dan narasi masih null agar jalur pemrosesan bermaskot berjalan.
    record.hasil = calculatedHasil;
    record.visualisasi = visualisasi;
    record.status = "diproses";
    record.narasi = { id: null, en: null };
    record.contoh_kasus = null;
    record.runTimestamp = Date.now();

    saveStorage(all);
    return record;
  },

  async getResult(id: string | number): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    const record = all[idx];

    // Lazy polling background processing check:
    // Jika masih 'diproses', cek apakah sudah berlalu ~3.8 detik sejak Jalankan
    if (record.status === "diproses" && record.runTimestamp) {
      const elapsed = Date.now() - record.runTimestamp;
      if (elapsed >= 3800) {
        if (getSimulateAiFailure()) {
          record.status = "narasi_gagal";
          record.error = {
            code: "AI_TIMEOUT",
            message: "Simulasi AI Gagal aktif. AI Orchestrator tidak dapat memverifikasi narasi.",
          };
        } else {
          record.status = "selesai";
          const narasiId = generateNarrativesAndCase(record.jenis_analisis, record.hasil, "id");
          const narasiEn = generateNarrativesAndCase(record.jenis_analisis, record.hasil, "en");
          record.narasi = {
            id: narasiId.narasi,
            en: narasiEn.narasi,
          };
          record.contoh_kasus = narasiId.contoh_kasus;
        }
        saveStorage(all);
      }
    }

    return record;
  },

  async requestNarrative(id: string | number, lang: "id" | "en"): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    const record = all[idx];
    if (!record.hasil) {
      throw new ApiError(400, "Hasil statistik belum dihitung untuk membuat narasi", "BAD_REQUEST");
    }

    record.status = "diproses";
    record.runTimestamp = Date.now();
    saveStorage(all);
    return record;
  },

  async saveToHistory(id: string | number): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) {
      throw new ApiError(404, "Analisis tidak ditemukan (404)", "NOT_FOUND");
    }

    all[idx].disimpan = true;
    saveStorage(all);
    return all[idx];
  },

  async listHistory(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<{ total: number; page: number; limit: number; data: AnalysisRecord[] }> {
    const all = loadStorage();
    // Hanya yang disimpan (disimpan === true), terbaru di atas
    let saved = all.filter((a) => a.disimpan);
    saved.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      saved = saved.filter((a) => a.nama_sesi.toLowerCase().includes(q) || a.jenis_analisis.toLowerCase().includes(q));
    }

    const total = saved.length;
    const start = (page - 1) * limit;
    const paginated = saved.slice(start, start + limit);

    return {
      total,
      page,
      limit,
      data: paginated,
    };
  },

  async getDetail(id: string | number): Promise<AnalysisRecord> {
    return this.getResult(id);
  },

  async delete(id: string | number): Promise<void> {
    const all = loadStorage();
    const filtered = all.filter((a) => String(a.id_analisis) !== String(id));
    saveStorage(filtered);
  },

  async deleteAll(): Promise<{ message?: string; deleted_count?: number }> {
    const all = loadStorage();
    const count = all.length;
    saveStorage([]);
    return {
      message: `Seluruh riwayat analisis (${count} sesi) berhasil dihapus.`,
      deleted_count: count,
    };
  },
};
