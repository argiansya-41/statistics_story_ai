import 'package:flutter/material.dart';

/// Palet Warna Resmi Statistics Story AI (Soft Neo-Brutalism / Sticker Card)
/// Palet tetap MERAH - KUNING - BIRU.
class AppColors {
  // 1. Biru (Utama / Dominan)
  static const Color blue = Color(0xFF003BFF);
  static const Color blueLight = Color(0xFF4D74FF);
  static const Color blueSoft = Color(0xFFE6ECFF);

  // 2. Kuning (Aksen Utama / Aktif / Sorotan)
  static const Color yellow = Color(0xFFEBEB00);
  static const Color yellowLight = Color(0xFFFFFF66);
  static const Color yellowSoft = Color(0xFFFFFBCC);

  // 3. Merah (Aksi Penting / Bahaya / Titik Fokus)
  static const Color red = Color(0xFFFF2E2E);
  static const Color redDark = Color(0xFFC40000);
  static const Color redSoft = Color(0xFFFFE5E5);

  // 4. Netral & Struktur
  static const Color ink = Color(0xFF0A0D14); // Outline tebal & teks utama
  static const Color bg = Color(0xFFF7F8FC);  // Latar kanvas putih kebiruan
  static const Color card = Color(0xFFFFFFFF);// Kartu putih
  static const Color muted = Color(0xFF64748B);// Teks subjudul / keterangan
  static const Color border = Color(0xFF0A0D14);
  static const Color gridLine = Color(0xFFE2E8F0);

  // 5. Status Lainnya
  static const Color success = Color(0xFF00C853);
  static const Color warning = Color(0xFFFF9900);

  // Backward compatibility alias dengan BlueprintColors lama
  static const Color primaryBlue = blue;
  static const Color accentYellow = yellow;
  static const Color errorRed = red;
  static const Color errorDarkRed = redDark;
  static const Color successGreen = success;
  static const Color canvasBg = bg;
  static const Color cardWhite = card;
  static const Color technicalBlack = ink;
  static const Color borderBlack = ink;
  static const Color textMain = ink;
  static const Color textMuted = muted;
  static const Color textMonoLight = Color(0xFF475569);
}

