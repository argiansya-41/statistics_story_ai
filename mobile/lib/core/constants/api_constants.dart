import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  /// Default base URL based on platform:
  /// - Android Emulator: 10.0.2.2:8000
  /// - iOS Simulator / Web / Desktop: 127.0.0.1:8000
  /// - Real Device: Ganti dengan IP LAN komputer, contoh: http://192.168.1.10:8000
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
  }

  static String baseUrl = defaultBaseUrl;

  // Auth endpoints
  static const String loginEndpoint = '/api/v1/auth/login';
  static const String registerEndpoint = '/api/v1/auth/register';
  static const String meEndpoint = '/api/v1/auth/me';
  static const String refreshEndpoint = '/api/v1/auth/refresh';
  static const String logoutEndpoint = '/api/v1/auth/logout';
}

