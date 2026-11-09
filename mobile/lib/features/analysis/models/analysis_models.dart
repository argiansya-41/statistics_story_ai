class ColumnInfo {
  final String name;
  final String type; // 'numeric', 'categorical', 'text'
  final int distinctCount;

  ColumnInfo({
    required this.name,
    required this.type,
    this.distinctCount = 0,
  });

  factory ColumnInfo.fromJson(Map<String, dynamic> json) {
    return ColumnInfo(
      name: json['name']?.toString() ?? '',
      type: json['type']?.toString() ?? 'text',
      distinctCount: json['distinct_count'] ?? json['distinctCount'] ?? 0,
    );
  }
}

class DatasetSummary {
  final String namaDataset;
  final String formatData; // 'csv', 'excel', 'manual'
  final int totalBaris;
  final int totalKolom;
  final List<String> kolom;
  final List<ColumnInfo> kolomInfo;
  final List<Map<String, dynamic>> previewBaris;

  DatasetSummary({
    required this.namaDataset,
    required this.formatData,
    required this.totalBaris,
    required this.totalKolom,
    required this.kolom,
    this.kolomInfo = const [],
    this.previewBaris = const [],
  });

  factory DatasetSummary.fromJson(Map<String, dynamic> json) {
    final rawCols = json['kolom'] as List<dynamic>? ?? [];
    final rawPreview = json['preview_baris'] as List<dynamic>? ?? [];
    final rawInfo = json['kolom_info'] as List<dynamic>? ?? [];

    return DatasetSummary(
      namaDataset: json['nama_dataset']?.toString() ?? 'Dataset',
      formatData: json['format_data']?.toString() ?? 'csv',
      totalBaris: json['total_baris'] ?? 0,
      totalKolom: json['total_kolom'] ?? rawCols.length,
      kolom: rawCols.map((e) => e.toString()).toList(),
      kolomInfo: rawInfo.map((e) => ColumnInfo.fromJson(e as Map<String, dynamic>)).toList(),
      previewBaris: rawPreview.map((e) => Map<String, dynamic>.from(e as Map)).toList(),
    );
  }
}

class AnalysisRecord {
  final int id;
  final String namaSesi;
  final String jenisAnalisis; // 'deskriptif', 'uji_t', 'korelasi', 'regresi'
  final String status; // 'draf', 'selesai', 'diproses', 'gagal'
  final String tanggal;
  final DatasetSummary? datasetInput;
  final Map<String, dynamic>? hasil;
  final List<dynamic>? visualisasi;
  final Map<String, dynamic>? narasi;
  final dynamic contohKasus;

  AnalysisRecord({
    required this.id,
    required this.namaSesi,
    required this.jenisAnalisis,
    required this.status,
    required this.tanggal,
    this.datasetInput,
    this.hasil,
    this.visualisasi,
    this.narasi,
    this.contohKasus,
  });

  factory AnalysisRecord.fromJson(Map<String, dynamic> json) {
    return AnalysisRecord(
      id: json['id_analisis'] ?? json['id'] ?? 0,
      namaSesi: json['nama_sesi']?.toString() ?? 'Sesi Analisis',
      jenisAnalisis: json['jenis_analisis']?.toString() ?? 'deskriptif',
      status: json['status']?.toString() ?? 'draf',
      tanggal: json['tanggal']?.toString() ?? json['created_at']?.toString() ?? '',
      datasetInput: json['dataset_input'] != null
          ? DatasetSummary.fromJson(Map<String, dynamic>.from(json['dataset_input']))
          : null,
      hasil: json['hasil'] != null ? Map<String, dynamic>.from(json['hasil']) : null,
      visualisasi: json['visualisasi'] as List<dynamic>?,
      narasi: json['narasi'] != null ? Map<String, dynamic>.from(json['narasi']) : null,
      contohKasus: json['contoh_kasus'],
    );
  }
}

