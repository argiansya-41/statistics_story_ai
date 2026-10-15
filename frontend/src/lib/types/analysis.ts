export type AnalysisType = "deskriptif" | "uji_t" | "korelasi" | "regresi";

export type AnalysisStatus = "draf" | "diproses" | "selesai" | "narasi_gagal" | "gagal";

export type InputSource = "mentah" | "siap_pakai";

export type DatasetFormat = "csv" | "excel" | "manual" | "json";

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "text";
  sampleValues: (string | number)[];
  distinctCount: number;
}

export interface DatasetSummary {
  nama_dataset?: string;
  nama_file?: string;
  format_data: DatasetFormat;
  sumber_input: InputSource;
  total_baris: number;
  total_kolom: number;
  kolom: string[];
  kolom_info?: ColumnInfo[];
  preview_baris: Record<string, string | number>[];
  data_mentah?: Record<string, string | number>[];
  data_siap_pakai?: Record<string, unknown>;
}

export interface DescriptiveConfig {
  kolom_ringkasan: string[];
}

export interface TTestConfig {
  kolom_nilai: string;
  kolom_kelompok: string;
}

export interface CorrelationConfig {
  kolom_x: string;
  kolom_y: string;
}

export interface RegressionConfig {
  kolom_x: string; // variabel bebas (independent)
  kolom_y: string; // variabel terikat (dependent)
}

export type AnalysisConfig =
  | { jenis_analisis: "deskriptif"; config_json: DescriptiveConfig }
  | { jenis_analisis: "uji_t"; config_json: TTestConfig }
  | { jenis_analisis: "korelasi"; config_json: CorrelationConfig }
  | { jenis_analisis: "regresi"; config_json: RegressionConfig };

export interface DescriptiveStatsItem {
  kolom: string;
  mean: number;
  median: number;
  modus: number[];
  standar_deviasi: number;
  min: number;
  max: number;
  n: number;
}

export interface DescriptiveResult {
  ringkasan: DescriptiveStatsItem[];
}

export interface TTestResult {
  t: number;
  df?: number;
  p_value: number;
  kelompok_1: {
    nama: string;
    mean: number;
    sd: number;
    n: number;
  };
  kelompok_2: {
    nama: string;
    mean: number;
    sd: number;
    n: number;
  };
  signifikan: boolean;
  alpha: number;
  perbedaan_mean: number;
}

export interface CorrelationResult {
  r: number;
  p_value: number;
  arah: "positif" | "negatif" | "tidak_ada";
  kekuatan: "Sangat Lemah" | "Lemah" | "Sedang" | "Kuat" | "Sangat Kuat";
  n: number;
  variabel_x: string;
  variabel_y: string;
}

export interface RegressionResult {
  koefisien: number; // slope (b)
  intercept: number; // konstanta (a)
  r_squared: number;
  p_value: number;
  persamaan: string;
  n: number;
  variabel_x: string;
  variabel_y: string;
}

export type StatisticalResultData =
  | { jenis: "deskriptif"; data: DescriptiveResult }
  | { jenis: "uji_t"; data: TTestResult }
  | { jenis: "korelasi"; data: CorrelationResult }
  | { jenis: "regresi"; data: RegressionResult };

export interface VisualizationSpec {
  jenis_grafik: "batang" | "histogram" | "scatter";
  judul?: string;
  label_x?: string;
  label_y?: string;
  data_grafik: {
    kategori?: string[];
    nilai?: number[];
    labels?: string[];
    bins?: { label: string; count: number; min: number; max: number }[];
    points?: { x: number; y: number; label?: string }[];
    line?: { x1: number; y1: number; x2: number; y2: number; slope?: number; intercept?: number };
    mean_marker?: number;
  };
}

export interface AnalysisRecord {
  id_analisis: string | number;
  id_pengguna?: string | number;
  nama_sesi: string;
  deskripsi?: string;
  jenis_analisis: AnalysisType;
  status: AnalysisStatus;
  tanggal: string;
  disimpan: boolean;
  config_json?: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig | Record<string, unknown>;
  dataset_input?: DatasetSummary;
  hasil?: DescriptiveResult | TTestResult | CorrelationResult | RegressionResult | Record<string, unknown> | null;
  visualisasi?: VisualizationSpec[];
  narasi?: {
    id: string | null;
    en: string | null;
  };
  contoh_kasus?: string[] | string | null;
  pesan?: string | null;
  error?: {
    code: string;
    message: string;
    field?: string;
  } | null;
}

export interface HistoryListResponse {
  total: number;
  page: number;
  limit: number;
  data: AnalysisRecord[];
}
