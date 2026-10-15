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

const STORAGE_KEY = "stat_story_mock_analyses";

function loadStorage(): AnalysisRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStorage(records: AnalysisRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    /* abaikan */
  }
}

/**
 * Perhitungan Statistik Deskriptif Deterministik
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
    if (n === 0) {
      return {
        kolom: col,
        mean: 0,
        median: 0,
        modus: [],
        standar_deviasi: 0,
        min: 0,
        max: 0,
        n: 0,
      };
    }

    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = Number((sum / n).toFixed(3));

    // Median
    const mid = Math.floor(n / 2);
    const median =
      n % 2 !== 0
        ? Number(values[mid].toFixed(3))
        : Number(((values[mid - 1] + values[mid]) / 2).toFixed(3));

    // Modus
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    values.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) maxFreq = freq[v];
    });
    const modus =
      maxFreq > 1
        ? Object.keys(freq)
            .filter((k) => freq[Number(k)] === maxFreq)
            .map((k) => Number(k))
        : [];

    // Standar Deviasi sampel (n - 1)
    let variance = 0;
    if (n > 1) {
      const sqDiffSum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
      variance = sqDiffSum / (n - 1);
    }
    const sd = Number(Math.sqrt(variance).toFixed(3));

    return {
      kolom: col,
      mean,
      median,
      modus,
      standar_deviasi: sd,
      min: Number(values[0].toFixed(3)),
      max: Number(values[n - 1].toFixed(3)),
      n,
    };
  });

  return { ringkasan };
}

/**
 * Perhitungan Uji t Welch Dua Kelompok
 */
export function calculateWelchTTest(
  data: Record<string, string | number>[],
  kolomNilai: string,
  kolomKelompok: string
): TTestResult {
  const groups: Record<string, number[]> = {};

  data.forEach((row) => {
    const grp = String(row[kolomKelompok] ?? "").trim();
    const val = Number(row[kolomNilai]);
    if (grp !== "" && !isNaN(val) && isFinite(val)) {
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(val);
    }
  });

  const groupKeys = Object.keys(groups);
  if (groupKeys.length < 2) {
    throw new Error("Uji t memerlukan tepat 2 kelompok pada kolom kelompok");
  }

  const [k1, k2] = groupKeys;
  const vals1 = groups[k1];
  const vals2 = groups[k2];

  const n1 = vals1.length;
  const n2 = vals2.length;

  if (n1 < 2 || n2 < 2) {
    throw new Error("Setiap kelompok dalam Uji t memerlukan minimal 2 observasi data");
  }

  const mean1 = vals1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = vals2.reduce((a, b) => a + b, 0) / n2;

  const var1 = vals1.reduce((a, b) => a + Math.pow(b - mean1, 2), 0) / (n1 - 1);
  const var2 = vals2.reduce((a, b) => a + Math.pow(b - mean2, 2), 0) / (n2 - 1);

  const seDiff = Math.sqrt(var1 / n1 + var2 / n2);
  const t = seDiff === 0 ? 0 : (mean1 - mean2) / seDiff;

  // Derajat kebebasan Welch-Satterthwaite
  const term1 = var1 / n1;
  const term2 = var2 / n2;
  const numerator = Math.pow(term1 + term2, 2);
  const denominator = Math.pow(term1, 2) / (n1 - 1) + Math.pow(term2, 2) / (n2 - 1);
  const df = denominator === 0 ? n1 + n2 - 2 : Math.round(numerator / denominator);

  // Estimasi p-value t-distribution (two-tailed)
  const pVal = approximateTwoTailedPValue(Math.abs(t), df);

  return {
    t: Number(t.toFixed(3)),
    df,
    p_value: Number(pVal.toFixed(4)),
    kelompok_1: {
      nama: k1,
      mean: Number(mean1.toFixed(3)),
      sd: Number(Math.sqrt(var1).toFixed(3)),
      n: n1,
    },
    kelompok_2: {
      nama: k2,
      mean: Number(mean2.toFixed(3)),
      sd: Number(Math.sqrt(var2).toFixed(3)),
      n: n2,
    },
    signifikan: pVal < 0.05,
    alpha: 0.05,
    perbedaan_mean: Number((mean1 - mean2).toFixed(3)),
  };
}

/**
 * Perhitungan Korelasi Pearson
 */
export function calculatePearson(
  data: Record<string, string | number>[],
  kolomX: string,
  kolomY: string
): CorrelationResult {
  const pairs: { x: number; y: number }[] = [];

  data.forEach((r) => {
    const x = Number(r[kolomX]);
    const y = Number(r[kolomY]);
    if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      pairs.push({ x, y });
    }
  });

  const n = pairs.length;
  if (n < 3) {
    throw new Error("Korelasi Pearson memerlukan minimal 3 pasangan data numerik");
  }

  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  pairs.forEach((p) => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  });

  const denom = Math.sqrt(denX * denY);
  const r = denom === 0 ? 0 : num / denom;

  // t-test for Pearson r
  const t = Math.abs(r) >= 1 ? 99 : (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  const pVal = approximateTwoTailedPValue(Math.abs(t), n - 2);

  const absR = Math.abs(r);
  let kekuatan: CorrelationResult["kekuatan"] = "Sangat Lemah";
  if (absR >= 0.8) kekuatan = "Sangat Kuat";
  else if (absR >= 0.6) kekuatan = "Kuat";
  else if (absR >= 0.4) kekuatan = "Sedang";
  else if (absR >= 0.2) kekuatan = "Lemah";

  return {
    r: Number(r.toFixed(3)),
    p_value: Number(pVal.toFixed(4)),
    arah: r > 0 ? "positif" : r < 0 ? "negatif" : "tidak_ada",
    kekuatan,
    n,
    variabel_x: kolomX,
    variabel_y: kolomY,
  };
}

/**
 * Perhitungan Regresi Linear Sederhana
 */
export function calculateSimpleRegression(
  data: Record<string, string | number>[],
  kolomX: string,
  kolomY: string
): RegressionResult {
  const pairs: { x: number; y: number }[] = [];

  data.forEach((r) => {
    const x = Number(r[kolomX]);
    const y = Number(r[kolomY]);
    if (!isNaN(x) && isFinite(x) && !isNaN(y) && isFinite(y)) {
      pairs.push({ x, y });
    }
  });

  const n = pairs.length;
  if (n < 3) {
    throw new Error("Regresi linear sederhana memerlukan minimal 3 pasangan data");
  }

  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  pairs.forEach((p) => {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  });

  if (denX === 0) {
    throw new Error("Variabel bebas X tidak memiliki variansi (semua nilai sama)");
  }

  const slope = num / denX;
  const intercept = meanY - slope * meanX;

  const r = Math.sqrt(denX * denY) === 0 ? 0 : num / Math.sqrt(denX * denY);
  const rSquared = Math.pow(r, 2);

  // t-test for slope
  const t = Math.abs(r) >= 1 ? 99 : (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
  const pVal = approximateTwoTailedPValue(Math.abs(t), n - 2);

  const pers = `Y = ${intercept.toFixed(2)} + ${slope >= 0 ? slope.toFixed(2) : `(${slope.toFixed(2)})`}X`;

  return {
    koefisien: Number(slope.toFixed(3)),
    intercept: Number(intercept.toFixed(3)),
    r_squared: Number(rSquared.toFixed(3)),
    p_value: Number(pVal.toFixed(4)),
    persamaan: pers,
    n,
    variabel_x: kolomX,
    variabel_y: kolomY,
  };
}

/**
 * Aproksimasi P-value 2-tailed dari distribusi t Student
 */
function approximateTwoTailedPValue(t: number, df: number): number {
  if (df <= 0) return 1.0;
  // Pendekatan Hill / standard normal bila df besar, atau Taylor series untuk df kecil
  const x = df / (df + t * t);
  let p = 1.0;
  if (df === 1) {
    p = 1 - (2 / Math.PI) * Math.atan(t);
  } else if (df === 2) {
    p = 1 - t / Math.sqrt(2 + t * t);
  } else {
    // Normal distribution approximation with df correction
    const z = t * (1 - 1 / (4 * df)) / Math.sqrt(1 + (t * t) / (2 * df));
    // Error function approximation
    p = 2 * (1 - normalCdf(z));
  }
  return Math.max(0.0001, Math.min(1.0, p));
}

function normalCdf(z: number): number {
  const b1 = 0.31938153;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0) {
    const t = 1.0 / (1.0 + p * z);
    return 1.0 - c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * z);
    return c * Math.exp((-z * z) / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

/**
 * Membuat spesifikasi grafik (batang, histogram, scatter)
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
        // Bin calculation
        const min = item.min;
        const max = item.max;
        const numBins = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(vals.length))));
        const binWidth = max === min ? 1 : (max - min) / numBins;

        const bins = Array.from({ length: numBins }, (_, i) => {
          const bMin = min + i * binWidth;
          const bMax = min + (i + 1) * binWidth;
          const count = vals.filter((v) => (i === numBins - 1 ? v >= bMin && v <= bMax : v >= bMin && v < bMax)).length;
          return {
            label: `${bMin.toFixed(1)} - ${bMax.toFixed(1)}`,
            min: bMin,
            max: bMax,
            count,
          };
        });

        specs.push({
          jenis_grafik: "histogram",
          judul: `Distribusi Frekuensi: ${item.kolom}`,
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

    // Normalisasi rentang untuk garis trend
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

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

    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
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
            y1,
            x2: maxX,
            y2,
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
 * Generator Narasi AI & Contoh Kasus (Guardrail: angka sesuai perhitungan)
 */
export function generateNarrativesAndCase(
  jenis: AnalysisType,
  hasil: any,
  lang: "id" | "en" = "id"
): { narasi: string; contoh_kasus: string } {
  if (jenis === "deskriptif") {
    const r: DescriptiveResult = hasil;
    const first = r.ringkasan[0];
    if (lang === "id") {
      return {
        narasi: `Analisis statistik deskriptif untuk variabel ${first.kolom} mencatat nilai rata-rata (mean) sebesar ${first.mean} dengan standar deviasi ${first.standar_deviasi}. Nilai tengah (median) berada pada angka ${first.median}, merentang dari nilai minimum ${first.min} hingga maksimum ${first.max} dari total ${first.n} observasi. Kedekatan nilai mean dan median mengindikasikan bahwa distribusi data relatif terpusat dan tidak terdistorsi secara ekstrem oleh pencilan (outlier).`,
        contoh_kasus: `Analogi: Ibarat mengamati nilai rata-rata kelas pada kuis mingguan—apabila nilai rata-rata (${first.mean}) berdekatan dengan nilai tengah siswa (${first.median}), hal ini menandakan pemahaman materi terserap merata di antara peserta didik tanpa didominasi oleh segelintir skor ekstrem.`,
      };
    } else {
      return {
        narasi: `Descriptive statistical analysis for variable ${first.kolom} indicates a sample mean of ${first.mean} and standard deviation of ${first.standar_deviasi}. The median stands at ${first.median}, spanning from a minimum of ${first.min} to a maximum of ${first.max} across ${first.n} observations. The proximity between mean and median suggests a symmetric, well-centered distribution without severe outlier influence.`,
        contoh_kasus: `Analogy: Like reviewing student scores on a quiz—when the class average (${first.mean}) closely matches the median student's score (${first.median}), it indicates balanced comprehension across the cohort rather than distortion from outlier performances.`,
      };
    }
  }

  if (jenis === "uji_t") {
    const res: TTestResult = hasil;
    const sigTextId = res.signifikan
      ? `signifikan secara statistik pada tingkat signifikansi α = 0.05 (p = ${res.p_value} < 0.05)`
      : `tidak menunjukkan perbedaan signifikan secara statistik pada tingkat signifikansi α = 0.05 (p = ${res.p_value} ≥ 0.05)`;
    const sigTextEn = res.signifikan
      ? `statistically significant at the α = 0.05 threshold (p = ${res.p_value} < 0.05)`
      : `not statistically significant at the α = 0.05 threshold (p = ${res.p_value} ≥ 0.05)`;

    if (lang === "id") {
      return {
        narasi: `Uji t dua kelompok menggunakan metode Welch menghasilkan nilai t = ${res.t} dengan derajat kebebasan df = ${res.df ?? "N/A"}. Nilai p-value yang diperoleh adalah ${res.p_value}. Berdasarkan kriteria uji, perbandingan antara kelompok ${res.kelompok_1.nama} (rata-rata = ${res.kelompok_1.mean}, SD = ${res.kelompok_1.sd}, n = ${res.kelompok_1.n}) dan kelompok ${res.kelompok_2.nama} (rata-rata = ${res.kelompok_2.mean}, SD = ${res.kelompok_2.sd}, n = ${res.kelompok_2.n}) terbukti ${sigTextId}. Selisih rata-rata kedua kelompok tercatat sebesar ${res.perbedaan_mean}.`,
        contoh_kasus: `Analogi: Seperti menguji efektivitas dua metode pelatihan kerja berbeda pada dua kelompok karyawan—selisih pencapaian sebesar ${Math.abs(res.perbedaan_mean)} dengan signifikansi p = ${res.p_value} membuktikan apakah salah satu metode secara nyata lebih unggul atau perbedaannya semata kebetulan acak.`,
      };
    } else {
      return {
        narasi: `Welch's two-sample t-test yielded a t-statistic of ${res.t} with degrees of freedom df = ${res.df ?? "N/A"} and a p-value of ${res.p_value}. The comparison between ${res.kelompok_1.nama} (Mean = ${res.kelompok_1.mean}, SD = ${res.kelompok_1.sd}, n = ${res.kelompok_1.n}) and ${res.kelompok_2.nama} (Mean = ${res.kelompok_2.mean}, SD = ${res.kelompok_2.sd}, n = ${res.kelompok_2.n}) is ${sigTextEn}. The measured mean difference is ${res.perbedaan_mean}.`,
        contoh_kasus: `Analogy: Like comparing two distinct onboarding programs across separate employee cohorts—the measured delta of ${Math.abs(res.perbedaan_mean)} and p-value of ${res.p_value} verifies whether performance enhancements reflect genuine training efficacy or mere sampling variance.`,
      };
    }
  }

  if (jenis === "korelasi") {
    const res: CorrelationResult = hasil;
    const sigTextId = res.p_value < 0.05 ? "signifikan (p < 0.05)" : "tidak signifikan (p ≥ 0.05)";
    const sigTextEn = res.p_value < 0.05 ? "statistically significant (p < 0.05)" : "not statistically significant (p ≥ 0.05)";

    if (lang === "id") {
      return {
        narasi: `Analisis korelasi Pearson antara variabel ${res.variabel_x} dan ${res.variabel_y} menunjukkan koefisien korelasi r = ${res.r} dengan p-value = ${res.p_value} pada ${res.n} pasangan data. Nilai tersebut mengindikasikan adanya hubungan berpola ${res.arah} dengan tingkat keeratan kategori ${res.kekuatan}. Hubungan ini berstatus ${sigTextId}. Perlu diingat bahwa korelasi ini semata-mata menggambarkan keterkaitan linear antara kedua variabel dan tidak membuktikan adanya hubungan sebab-akibat (kausalitas).`,
        contoh_kasus: `Analogi: Ibarat mengamati hubungan antara suhu cuaca dengan penjualan es krim—ketika suhu meningkat, volume es krim yang terjual cenderung bertambah (korelasi positif), namun meningkatnya penjualan es krim bukanlah penyebab naiknya suhu udara.`,
      };
    } else {
      return {
        narasi: `Pearson correlation analysis between ${res.variabel_x} and ${res.variabel_y} yields a correlation coefficient r = ${res.r} with p-value = ${res.p_value} across ${res.n} paired observations. This reflects a ${res.arah} linear association categorized as ${res.kekuatan} in strength (${sigTextEn}). Note that correlation measures linear association only and does not establish causality between the variables.`,
        contoh_kasus: `Analogy: Like observing ambient temperature and ice cream sales—higher temperatures co-occur with higher sales, but buying ice cream does not cause warmer weather.`,
      };
    }
  }

  if (jenis === "regresi") {
    const res: RegressionResult = hasil;
    const sigTextId = res.p_value < 0.05 ? "signifikan (p < 0.05)" : "tidak signifikan (p ≥ 0.05)";
    const sigTextEn = res.p_value < 0.05 ? "statistically significant (p < 0.05)" : "not statistically significant (p ≥ 0.05)";

    if (lang === "id") {
      return {
        narasi: `Model regresi linear sederhana menghasilkan persamaan estimasi ${res.persamaan}. Koefisien regresi (slope) b = ${res.koefisien} menunjukkan bahwa untuk setiap kenaikan satu satuan pada variabel bebas ${res.variabel_x}, nilai variabel terikat ${res.variabel_y} diprediksi mengalami perubahan rata-rata sebesar ${res.koefisien} satuan (nilai konstanta intercept = ${res.intercept}). Nilai R² = ${res.r_squared} menandakan bahwa sekitar ${(res.r_squared * 100).toFixed(1)}% variasi pada ${res.variabel_y} dapat dijelaskan oleh model ini (${sigTextId}). Koefisien menggambarkan pola estimasi perubahan linear tanpa mengasumsikan kausalitas sepihak yang tidak diuji.`,
        contoh_kasus: `Analogi: Seperti mengestimasi konsumsi bahan bakar kendaraan berdasarkan jarak tempuh—persamaan garis memberikan prakiraan matematis kebutuhan bensin untuk jarak tertentu dengan tingkat keandalan yang ditunjukkan oleh R² (${(res.r_squared * 100).toFixed(1)}%).`,
      };
    } else {
      return {
        narasi: `The simple linear regression model yielded the equation ${res.persamaan}. The slope coefficient b = ${res.koefisien} suggests that for every one-unit increment in ${res.variabel_x}, ${res.variabel_y} is estimated to change by ${res.koefisien} units, with intercept a = ${res.intercept}. The coefficient of determination R² = ${res.r_squared} indicates that ${(res.r_squared * 100).toFixed(1)}% of the variance in ${res.variabel_y} is explained by the regression line (${sigTextEn}). The slope describes the estimated linear rate of change without asserting unproven causality.`,
        contoh_kasus: `Analogy: Like predicting vehicle fuel consumption from distance traveled—the regression equation provides a practical formula to forecast fuel required, with precision reflected by the R² value (${(res.r_squared * 100).toFixed(1)}%).`,
      };
    }
  }

  return { narasi: "Hasil narasi belum tersedia.", contoh_kasus: "Contoh kasus belum tersedia." };
}

/**
 * Service Mock / Demonstrasi Lokal
 */
export const MockAnalysisService = {
  async listSavedAnalyses(): Promise<AnalysisRecord[]> {
    const all = loadStorage();
    return all.filter((a) => a.disimpan);
  },

  async getAnalysis(id: string | number): Promise<AnalysisRecord | null> {
    const all = loadStorage();
    const found = all.find((a) => String(a.id_analisis) === String(id));
    return found || null;
  },

  async createAnalysis(namaSesi: string = "Analisis Baru"): Promise<AnalysisRecord> {
    const all = loadStorage();
    const newRecord: AnalysisRecord = {
      id_analisis: Date.now(),
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

  async saveDataset(id: string | number, dataset: DatasetSummary): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) throw new Error("Analisis tidak ditemukan (404)");

    all[idx].dataset_input = dataset;
    if (dataset.nama_dataset) all[idx].nama_sesi = dataset.nama_dataset;
    saveStorage(all);
    return all[idx];
  },

  async saveConfig(
    id: string | number,
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) throw new Error("Analisis tidak ditemukan (404)");

    all[idx].jenis_analisis = jenis;
    all[idx].config_json = config;
    saveStorage(all);
    return all[idx];
  },

  async runAnalysis(id: string | number): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) throw new Error("Analisis tidak ditemukan (404)");

    const record = all[idx];
    const dataset = record.dataset_input;
    if (!dataset) throw new Error("Dataset belum dimasukkan");

    // Hitung statistik deterministik
    let calculatedHasil: any = null;
    const dataMentah = dataset.data_mentah || [];

    if (dataset.sumber_input === "siap_pakai" && dataset.data_siap_pakai) {
      calculatedHasil = dataset.data_siap_pakai;
    } else {
      if (record.jenis_analisis === "deskriptif") {
        const cfg = record.config_json as DescriptiveConfig;
        calculatedHasil = calculateDescriptive(dataMentah, cfg.kolom_ringkasan || [dataset.kolom[0]]);
      } else if (record.jenis_analisis === "uji_t") {
        const cfg = record.config_json as TTestConfig;
        calculatedHasil = calculateWelchTTest(dataMentah, cfg.kolom_nilai, cfg.kolom_kelompok);
      } else if (record.jenis_analisis === "korelasi") {
        const cfg = record.config_json as CorrelationConfig;
        calculatedHasil = calculatePearson(dataMentah, cfg.kolom_x, cfg.kolom_y);
      } else if (record.jenis_analisis === "regresi") {
        const cfg = record.config_json as RegressionConfig;
        calculatedHasil = calculateSimpleRegression(dataMentah, cfg.kolom_x, cfg.kolom_y);
      }
    }

    const visualisasi = generateVisualizations(record.jenis_analisis, calculatedHasil, dataMentah);
    const narasiId = generateNarrativesAndCase(record.jenis_analisis, calculatedHasil, "id");
    const narasiEn = generateNarrativesAndCase(record.jenis_analisis, calculatedHasil, "en");

    record.hasil = calculatedHasil;
    record.visualisasi = visualisasi;
    record.narasi = {
      id: narasiId.narasi,
      en: narasiEn.narasi,
    };
    record.contoh_kasus = narasiId.contoh_kasus;
    record.status = "selesai";

    saveStorage(all);
    return record;
  },

  async regenerateNarrative(id: string | number, lang: "id" | "en"): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) throw new Error("Analisis tidak ditemukan (404)");

    const record = all[idx];
    if (!record.hasil) throw new Error("Hasil statistik belum dihitung");

    const pair = generateNarrativesAndCase(record.jenis_analisis, record.hasil, lang);
    if (!record.narasi) record.narasi = { id: null, en: null };
    record.narasi[lang] = pair.narasi;
    record.contoh_kasus = pair.contoh_kasus;
    record.status = "selesai";

    saveStorage(all);
    return record;
  },

  async saveToHistory(id: string | number): Promise<AnalysisRecord> {
    const all = loadStorage();
    const idx = all.findIndex((a) => String(a.id_analisis) === String(id));
    if (idx === -1) throw new Error("Analisis tidak ditemukan (404)");

    all[idx].disimpan = true;
    saveStorage(all);
    return all[idx];
  },

  async deleteAnalysis(id: string | number): Promise<void> {
    const all = loadStorage();
    const filtered = all.filter((a) => String(a.id_analisis) !== String(id));
    saveStorage(filtered);
  },
};
