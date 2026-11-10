import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../../features/analysis/models/analysis_models.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'auth_user';

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 45),
        receiveTimeout: const Duration(seconds: 60), // AI generation can take up to 30-45s
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) {
          return handler.next(error);
        },
      ),
    );
  }

  void updateBaseUrl(String newUrl) {
    ApiConstants.baseUrl = newUrl;
    _dio.options.baseUrl = newUrl;
  }

  Future<String?> getToken() async {
    try {
      return await _storage.read(key: _tokenKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<void> clearAuth() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _userKey);
  }

  Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ================= AUTH METHODS (FR-01) =================

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.loginEndpoint,
        data: {'email': email.trim(), 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] ?? data['token'];
      if (token != null) {
        await saveToken(token.toString());
      }
      return data;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String role = 'student',
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.registerEndpoint,
        data: {
          'nama': name.trim(),
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
          'role': role,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final token = data['access_token'] ?? data['token'];
      if (token != null) {
        await saveToken(token.toString());
      }
      return data;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await _dio.get(ApiConstants.meEndpoint);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  // ================= ANALYSIS & HISTORY METHODS (FR-02 s/d FR-16) =================

  /// FR-16: Ambil riwayat analisis pengguna
  Future<List<AnalysisRecord>> getAnalysisHistory({int page = 1, String? search}) async {
    try {
      final response = await _dio.get(
        '/api/v1/analyses',
        queryParameters: {
          'page': page,
          'limit': 50,
          if (search != null && search.isNotEmpty) 'search': search,
        },
      );
      final data = response.data;
      final List<dynamic> list = data is Map ? (data['data'] ?? []) : (data as List? ?? []);
      return list.map((item) => AnalysisRecord.fromJson(Map<String, dynamic>.from(item))).toList();
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Inisialisasi sesi analisis baru
  Future<AnalysisRecord> createAnalysisSession(String sessionName) async {
    try {
      final response = await _dio.post(
        '/api/v1/analyses',
        data: {'nama_sesi': sessionName},
      );
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-02 & FR-05: Upload dataset manual / JSON list
  Future<AnalysisRecord> submitDatasetJson({
    required int analysisId,
    required List<Map<String, dynamic>> rows,
    String datasetName = 'Dataset Manual',
  }) async {
    try {
      final response = await _dio.post(
        '/api/v1/analyses/$analysisId/dataset',
        data: {
          'nama_dataset': datasetName,
          'format_data': 'manual',
          'sumber_input': 'mentah',
          'data': rows,
        },
      );
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-03, FR-04, FR-05: Upload file CSV / Excel via Multipart
  Future<AnalysisRecord> submitDatasetFile({
    required int analysisId,
    required Uint8List fileBytes,
    required String filename,
  }) async {
    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(fileBytes, filename: filename),
        'nama_dataset': filename,
      });

      final response = await _dio.post(
        '/api/v1/analyses/$analysisId/dataset',
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-06: Simpan konfigurasi jenis analisis (Deskriptif, Uji t, Korelasi, Regresi)
  Future<AnalysisRecord> saveAnalysisConfig({
    required int analysisId,
    required String jenisAnalisis,
    required Map<String, dynamic> configJson,
  }) async {
    try {
      final response = await _dio.put(
        '/api/v1/analyses/$analysisId/config',
        data: {
          'jenis_analisis': jenisAnalisis,
          'config_json': configJson,
        },
      );
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-07 s/d FR-10: Jalankan komputasi statistik (Pandas & SciPy)
  Future<AnalysisRecord> runAnalysis(int analysisId) async {
    try {
      final response = await _dio.post('/api/v1/analyses/$analysisId/run');
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-11, FR-12, FR-14: Minta generasi narasi AI dan studi kasus
  Future<AnalysisRecord> generateNarrative({
    required int analysisId,
    String lang = 'id',
  }) async {
    try {
      final response = await _dio.post(
        '/api/v1/analyses/$analysisId/narrative',
        queryParameters: {'lang': lang},
        data: {'lang': lang},
      );
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// FR-15: Ambil detail lengkap analisis
  Future<AnalysisRecord> getAnalysisDetail(int analysisId) async {
    try {
      final response = await _dio.get('/api/v1/analyses/$analysisId');
      return AnalysisRecord.fromJson(Map<String, dynamic>.from(response.data));
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Hapus analisis
  Future<void> deleteAnalysis(int analysisId) async {
    try {
      await _dio.delete('/api/v1/analyses/$analysisId');
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  /// Hapus seluruh riwayat analisis pengguna
  Future<void> deleteAllAnalyses() async {
    try {
      await _dio.delete('/api/v1/analyses');
    } on DioException catch (e) {
      throw _parseError(e);
    }
  }

  // ================= HELPER ERROR =================

  String _parseError(DioException e) {
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'Koneksi ke server timeout. AI engine sedang sibuk, silakan coba beberapa saat lagi.';
    }
    if (e.type == DioExceptionType.connectionError) {
      return 'Gagal terhubung ke ${ApiConstants.baseUrl}. Pastikan host & backend berjalan.';
    }

    final response = e.response;
    if (response != null && response.data != null) {
      if (response.data is Map) {
        final detail = response.data['detail'];
        if (detail != null) {
          if (detail is List && detail.isNotEmpty) {
            return detail[0]['msg'] ?? 'Data yang dikirim tidak valid.';
          }
          return detail.toString();
        }
        final message = response.data['message'];
        if (message != null) return message.toString();
      }
    }

    return 'Terjadi kesalahan (${e.response?.statusCode ?? "koneksi"}). Silakan coba lagi.';
  }
}
