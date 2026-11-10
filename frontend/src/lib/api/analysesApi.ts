import { apiFetch, isBackendConfigured } from "./client";
import { demoBackend } from "./mockService";
import type {
  AnalysisRecord,
  AnalysisType,
  DatasetSummary,
  DescriptiveConfig,
  TTestConfig,
  CorrelationConfig,
  RegressionConfig,
  HistoryListResponse,
} from "@/lib/types/analysis";

/**
 * Antarmuka seragam AnalysisApi sesuai PRD
 */
export interface AnalysisApi {
  isLiveBackend(): boolean;
  isDemoMode(): boolean;
  create(namaSesi?: string): Promise<AnalysisRecord>;
  submitDataset(
    id: string | number,
    dataset: DatasetSummary,
    file?: File
  ): Promise<AnalysisRecord>;
  extractImage(file: File): Promise<DatasetSummary>;
  saveConfig(
    id: string | number,
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ): Promise<AnalysisRecord>;
  run(id: string | number): Promise<AnalysisRecord>;
  requestNarrative(id: string | number, lang: "id" | "en"): Promise<AnalysisRecord>;
  getResult(id: string | number): Promise<AnalysisRecord>;
  saveToHistory(id: string | number): Promise<AnalysisRecord>;
  listHistory(page?: number, limit?: number, search?: string): Promise<HistoryListResponse>;
  getDetail(id: string | number): Promise<AnalysisRecord>;
  delete(id: string | number): Promise<void>;
  deleteAll(): Promise<{ message?: string; deleted_count?: number }>;
  getSimulateAiFailure(): boolean;
  setSimulateAiFailure(simulate: boolean): void;
}

/**
 * Pemetaan tunggal respons backend FastAPI ke tipe internal AnalysisRecord
 */
function mapBackendResponseToRecord(raw: any): AnalysisRecord {
  if (!raw) return raw;
  return {
    id_analisis: raw.id_analisis ?? raw.id ?? Date.now(),
    id_pengguna: raw.id_pengguna ?? raw.user_id,
    nama_sesi: raw.nama_sesi ?? raw.title ?? raw.session_name ?? "Analisis",
    deskripsi: raw.deskripsi ?? raw.description,
    jenis_analisis: raw.jenis_analisis ?? raw.analysis_type ?? "deskriptif",
    status: raw.status ?? "draf",
    tanggal: raw.tanggal ?? raw.created_at ?? new Date().toISOString(),
    disimpan: Boolean(raw.disimpan ?? raw.is_saved ?? false),
    config_json: raw.config_json ?? raw.config,
    dataset_input: raw.dataset_input ?? raw.dataset,
    hasil: raw.hasil ?? raw.result ?? raw.results ?? null,
    visualisasi: raw.visualisasi ?? raw.visualizations ?? [],
    narasi: {
      id: raw.narasi?.id ?? raw.narrative?.id ?? null,
      en: raw.narasi?.en ?? raw.narrative?.en ?? null,
    },
    contoh_kasus: raw.contoh_kasus ?? raw.case_study ?? null,
    pesan: raw.pesan ?? raw.message,
    error: raw.error ? {
      code: raw.error.code ?? "ERROR",
      message: raw.error.message ?? "Terjadi kesalahan",
      field: raw.error.field,
    } : null,
  };
}

/**
 * Implementasi httpApi untuk server nyata (FastAPI backend)
 */
export const httpApi: AnalysisApi = {
  isLiveBackend(): boolean {
    return true;
  },

  isDemoMode(): boolean {
    return false;
  },

  getSimulateAiFailure(): boolean {
    return false;
  },

  setSimulateAiFailure(_simulate: boolean): void {
    /* Hanya relevan di demo */
  },

  async create(namaSesi: string = "Analisis Baru"): Promise<AnalysisRecord> {
    const res = await apiFetch<any>("/api/v1/analyses", {
      method: "POST",
      body: JSON.stringify({ nama_sesi: namaSesi }),
    });
    return mapBackendResponseToRecord(res);
  },

  async submitDataset(
    id: string | number,
    dataset: DatasetSummary,
    file?: File
  ): Promise<AnalysisRecord> {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("format_data", dataset.format_data);
      formData.append("sumber_input", dataset.sumber_input);
      if (dataset.nama_dataset) {
        formData.append("nama_dataset", dataset.nama_dataset);
      }
      const res = await apiFetch<any>(`/api/v1/analyses/${id}/dataset`, {
        method: "POST",
        body: formData,
      });
      const record = mapBackendResponseToRecord(res);
      if (!record.dataset_input) record.dataset_input = dataset;
      return record;
    }

    const body: Record<string, unknown> = {
      sumber_input: dataset.sumber_input,
      format_data: dataset.format_data,
      nama_dataset: dataset.nama_dataset,
    };
    if (dataset.sumber_input === "siap_pakai") {
      body.data_siap_pakai = dataset.data_siap_pakai;
    } else {
      body.data_mentah = dataset.data_mentah;
      body.kolom = dataset.kolom;
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/dataset`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const record = mapBackendResponseToRecord(res);
    if (!record.dataset_input) record.dataset_input = dataset;
    return record;
  },

  async extractImage(file: File): Promise<DatasetSummary> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiFetch<any>("/api/v1/extract-image", {
      method: "POST",
      body: formData,
    });
    return {
      nama_file: res.nama_file || file.name,
      nama_dataset: res.nama_dataset || file.name.replace(/\.[^/.]+$/, ""),
      format_data: "image",
      sumber_input: "mentah",
      total_baris: res.total_baris || 0,
      total_kolom: res.total_kolom || 0,
      kolom: res.kolom || [],
      kolom_info: res.kolom_info || [],
      preview_baris: res.preview_baris || [],
      data_mentah: res.data_mentah || [],
    };
  },

  async saveConfig(
    id: string | number,
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}/config`, {
      method: "PUT",
      body: JSON.stringify({
        jenis_analisis: jenis,
        config_json: config,
      }),
    });
    return mapBackendResponseToRecord(res);
  },

  async run(id: string | number): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}/run`, {
      method: "POST",
    });
    return mapBackendResponseToRecord(res);
  },

  async requestNarrative(id: string | number, lang: "id" | "en"): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}/narrative?lang=${lang}`, {
      method: "POST",
    });
    return mapBackendResponseToRecord(res);
  },

  async getResult(id: string | number): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}/result`, {
      method: "GET",
    });
    return mapBackendResponseToRecord(res);
  },

  async saveToHistory(id: string | number): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}/save`, {
      method: "POST",
    });
    return mapBackendResponseToRecord(res);
  },

  async listHistory(
    page: number = 1,
    limit: number = 10,
    search: string = ""
  ): Promise<HistoryListResponse> {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
    });

    const res = await apiFetch<any>(`/api/v1/analyses?${query.toString()}`, {
      method: "GET",
    });

    const items = (res.data || res.items || (Array.isArray(res) ? res : [])).map(mapBackendResponseToRecord);
    return {
      total: res.total ?? items.length,
      page: res.page ?? page,
      limit: res.limit ?? limit,
      data: items,
    };
  },

  async getDetail(id: string | number): Promise<AnalysisRecord> {
    const res = await apiFetch<any>(`/api/v1/analyses/${id}`, {
      method: "GET",
    });
    return mapBackendResponseToRecord(res);
  },

  async delete(id: string | number): Promise<void> {
    await apiFetch<void>(`/api/v1/analyses/${id}`, {
      method: "DELETE",
    });
  },

  async deleteAll(): Promise<{ message?: string; deleted_count?: number }> {
    return await apiFetch<any>("/api/v1/analyses", {
      method: "DELETE",
    });
  },
};

/**
 * Pemilihan implementasi berdasarkan ketersediaan NEXT_PUBLIC_API_URL
 */
export const api: AnalysisApi = isBackendConfigured() ? httpApi : demoBackend;
export const AnalysesApi = api;
export default api;
