import assert from "node:assert";

// Lanczos logGamma
export function logGamma(z) {
  const p = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109585720526,
    9.9843695780195716e-6,
    1.5056327351493116e-7
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

export function betacf(a, b, x) {
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

export function incBeta(x, a, b) {
  if (x <= 0.0) return 0.0;
  if (x >= 1.0) return 1.0;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x));
  if (x < (a + 1.0) / (a + b + 2.0)) {
    return (bt * betacf(a, b, x)) / a;
  } else {
    return 1.0 - (bt * betacf(b, a, 1.0 - x)) / b;
  }
}

export function studentTwoTailedP(t, df) {
  if (df <= 0) return 1.0;
  if (isNaN(t) || !isFinite(t)) return 0.0;
  const absT = Math.abs(t);
  if (absT === 0) return 1.0;
  const x = df / (df + absT * absT);
  return incBeta(x, df / 2.0, 0.5);
}

function approxEq(actual, expected, tol = 1e-4, msg = "") {
  const diff = Math.abs(actual - expected);
  if (diff <= 1e-12) return;
  const relDiff = diff / (Math.abs(expected) || 1);
  assert(
    relDiff <= tol || diff <= tol,
    `${msg} Expected ${expected}, got ${actual} (diff: ${diff})`
  );
}

// 1. Welch t-test
const A = [78, 82, 69, 91, 85, 74, 88, 79, 83, 76];
const B = [72, 65, 80, 70, 68, 77, 74, 66, 71, 69];
const nA = A.length;
const nB = B.length;
const meanA = A.reduce((s, v) => s + v, 0) / nA;
const meanB = B.reduce((s, v) => s + v, 0) / nB;
const varA = A.reduce((s, v) => s + (v - meanA) ** 2, 0) / (nA - 1);
const varB = B.reduce((s, v) => s + (v - meanB) ** 2, 0) / (nB - 1);
const sdA = Math.sqrt(varA);
const sdB = Math.sqrt(varB);
const seDiff = Math.sqrt(varA / nA + varB / nB);
const tWelch = (meanA - meanB) / seDiff;
const dfWelch = ((varA / nA + varB / nB) ** 2) / (((varA / nA) ** 2) / (nA - 1) + ((varB / nB) ** 2) / (nB - 1));
const pWelch = studentTwoTailedP(tWelch, dfWelch);

approxEq(tWelch, 3.6016, 1e-3, "Welch t");
approxEq(dfWelch, 16.2505, 1e-3, "Welch df");
approxEq(pWelch, 0.002341, 1e-3, "Welch p");
approxEq(meanA, 80.50, 1e-3, "Welch mean A");
approxEq(meanB, 71.20, 1e-3, "Welch mean B");
approxEq(sdA, 6.6542, 1e-3, "Welch SD A");
approxEq(sdB, 4.7329, 1e-3, "Welch SD B");

// 2. Correlation
const xData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const yData = [52, 55, 61, 60, 68, 72, 70, 78, 83, 88];
const n = xData.length;
const meanX = xData.reduce((s, v) => s + v, 0) / n;
const meanY = yData.reduce((s, v) => s + v, 0) / n;
let sXX = 0, sYY = 0, sXY = 0;
for (let i = 0; i < n; i++) {
  const dx = xData[i] - meanX;
  const dy = yData[i] - meanY;
  sXX += dx * dx;
  sYY += dy * dy;
  sXY += dx * dy;
}
const r = sXY / Math.sqrt(sXX * sYY);
const dfCorr = n - 2;
const tCorr = (r * Math.sqrt(dfCorr)) / Math.sqrt(1 - r * r);
const pCorr = studentTwoTailedP(tCorr, dfCorr);

approxEq(r, 0.983924, 1e-5, "Pearson r");
approxEq(pCorr, 2.866e-07, 1e-2, "Pearson p");

// 3. Regression
const slope = sXY / sXX;
const intercept = meanY - slope * meanX;
const rSquared = r * r;

approxEq(slope, 3.8727, 1e-3, "Regresi koefisien");
approxEq(intercept, 47.4000, 1e-3, "Regresi konstanta");
approxEq(rSquared, 0.968106, 1e-5, "Regresi R2");
approxEq(pCorr, 2.866e-07, 1e-2, "Regresi p");

// 4. Descriptive
const descData = [4, 8, 15, 16, 23, 42, 8];
const nDesc = descData.length;
const meanDesc = descData.reduce((s, v) => s + v, 0) / nDesc;
const sorted = [...descData].sort((a, b) => a - b);
const mid = Math.floor(nDesc / 2);
const medianDesc = nDesc % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
const counts = {};
sorted.forEach(v => counts[v] = (counts[v] || 0) + 1);
let maxC = 0;
Object.values(counts).forEach(c => { if (c > maxC) maxC = c; });
let modusDesc = [];
if (maxC > 1) {
  modusDesc = Object.keys(counts).filter(k => counts[k] === maxC).map(Number).sort((a, b) => a - b);
}
const varDesc = descData.reduce((s, v) => s + (v - meanDesc) ** 2, 0) / (nDesc - 1);
const sdDesc = Math.sqrt(varDesc);

approxEq(nDesc, 7, 0, "Desc n");
approxEq(meanDesc, 16.5714, 1e-3, "Desc mean");
approxEq(medianDesc, 15, 0, "Desc median");
approxEq(modusDesc[0], 8, 0, "Desc modus");
approxEq(sdDesc, 12.8823, 1e-3, "Desc SD");
approxEq(sorted[0], 4, 0, "Desc min");
approxEq(sorted[nDesc - 1], 42, 0, "Desc max");

console.log("PASS: Semua uji acuan SciPy terverifikasi dengan sukses!");
