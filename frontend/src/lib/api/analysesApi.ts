import { apiFetch, isBackendConfigured } from "./client";
import { MockAnalysisService } from "./mockService";
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
 * Service API Analisis Terpusat
 * Menggunakan backend FastAPI nyata jika NEXT_PUBLIC_API_URL diisi.
 * Jika kosong, menggunakan MockAnalysisService yang terisolasi dengan penanda mode demo.
 */
export const AnalysesApi = {
  isLiveBackend(): boolean {
    return isBackendConfigured();
  },

  /**
   * FR-02: Membuat sesi analisis baru (status 'draf')
   * POST /api/v1/analyses
   */
  async create(namaSesi: string = "Analisis Baru"): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.createAnalysis(namaSesi);
    }
    const res = await apiFetch<any>("/api/v1/analyses", {
      method: "POST",
      body: JSON.stringify({ nama_sesi: namaSesi }),
    });
    return res;
  },

  /**
   * FR-02, FR-03, FR-04: Mengirim dataset (manual JSON atau multipart CSV/Excel)
   * POST /api/v1/analyses/{id}/dataset
   */
  async submitDataset(
    id: string | number,
    dataset: DatasetSummary,
    file?: File
  ): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.saveDataset(id, dataset);
    }

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
      return res;
    }

    // Input manual JSON atau statistik siap pakai
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
    return res;
  },

  /**
   * FR-06: Menyimpan konfigurasi analisis & kolom
   * PUT /api/v1/analyses/{id}/config
   */
  async saveConfig(
    id: string | number,
    jenis: AnalysisType,
    config: DescriptiveConfig | TTestConfig | CorrelationConfig | RegressionConfig
  ): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.saveConfig(id, jenis, config);
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/config`, {
      method: "PUT",
      body: JSON.stringify({
        jenis_analisis: jenis,
        config_json: config,
      }),
    });
    return res;
  },

  /**
   * FR-07, FR-08, FR-09, FR-10, FR-11: Menjalankan analisis statistik
   * POST /api/v1/analyses/{id}/run
   */
  async run(id: string | number): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.runAnalysis(id);
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/run`, {
      method: "POST",
    });
    return res;
  },

  /**
   * FR-11, FR-15: Polling / mengambil hasil lengkap
   * GET /api/v1/analyses/{id}/result
   */
  async getResult(id: string | number): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      const rec = await MockAnalysisService.getAnalysis(id);
      if (!rec) throw new Error("Analisis tidak ditemukan");
      return rec;
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/result`, {
      method: "GET",
    });
    return res;
  },

  /**
   * FR-12: Meminta narasi AI / ganti bahasa narasi
   * POST /api/v1/analyses/{id}/narrative?lang=id|en
   */
  async requestNarrative(id: string | number, lang: "id" | "en"): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.regenerateNarrative(id, lang);
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/narrative?lang=${lang}`, {
      method: "POST",
    });
    return res;
  },

  /**
   * FR-15, FR-16: Simpan analisis ke riwayat
   * POST /api/v1/analyses/{id}/save
   */
  async saveToHistory(id: string | number): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.saveToHistory(id);
    }

    const res = await apiFetch<any>(`/api/v1/analyses/${id}/save`, {
      method: "POST",
    });
    return res;
  },

  /**
   * FR-16: Mengambil daftar riwayat yang tersimpan (paginasi)
   * GET /api/v1/analyses?page=1&limit=10
   */
  async listHistory(page: number = 1, limit: number = 10, search: string = ""): Promise<HistoryListResponse> {
    if (!isBackendConfigured()) {
      const all = await MockAnalysisService.listSavedAnalyses();
      const filtered = search
        ? all.filter((a) => a.nama_sesi.toLowerCase().includes(search.toLowerCase()))
        : all;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      return {
        total: filtered.length,
        page,
        limit,
        data: paginated,
      };
    }

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search ? { search } : {}),
    });

    const res = await apiFetch<HistoryListResponse>(`/api/v1/analyses?${query.toString()}`, {
      method: "GET",
    });
    return res;
  },

  /**
   * FR-16: Mengambil detail analisis tersimpan
   * GET /api/v1/analyses/{id}
   */
  async getDetail(id: string | number): Promise<AnalysisRecord> {
    if (!isBackendConfigured()) {
      const rec = await MockAnalysisService.getAnalysis(id);
      if (!rec) throw new Error("Analisis tidak ditemukan");
      return rec;
    }

    const res = await apiFetch<AnalysisRecord>(`/api/v1/analyses/${id}`, {
      method: "GET",
    });
    return res;
  },

  /**
   * FR-16: Menghapus analisis dari riwayat
   * DELETE /api/v1/analyses/{id}
   */
  async delete(id: string | number): Promise<void> {
    if (!isBackendConfigured()) {
      return MockAnalysisService.deleteAnalysis(id);
    }

    await apiFetch<void>(`/api/v1/analyses/${id}`, {
      method: "DELETE",
    });
  },
};
