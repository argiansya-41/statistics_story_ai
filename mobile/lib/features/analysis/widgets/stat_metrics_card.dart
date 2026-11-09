import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/premium/premium_widgets.dart';

/// Kartu Ringkasan Metrik Statistik Presisi (Soft Neo-Brutalism)
/// Menggunakan AnimatedCounter untuk visualisasi dinamis angka hasil perhitungan.
class StatMetricsCard extends StatelessWidget {
  final String jenisAnalisis;
  final Map<String, dynamic> hasil;

  const StatMetricsCard({
    super.key,
    required this.jenisAnalisis,
    required this.hasil,
  });

  String _fmt(dynamic val) {
    if (val == null) return '-';
    if (val is num) {
      if (val.isNaN) return '-';
      if (val == val.roundToDouble()) return val.toInt().toString();
      return val.toStringAsFixed(3);
    }
    final parsed = num.tryParse(val.toString());
    if (parsed != null) {
      if (parsed == parsed.roundToDouble()) return parsed.toInt().toString();
      return parsed.toStringAsFixed(3);
    }
    return val.toString();
  }

  num? _parseNum(dynamic val) {
    if (val == null) return null;
    if (val is num) return val.isNaN ? null : val;
    return num.tryParse(val.toString());
  }

  @override
  Widget build(BuildContext context) {
    return StackedCard(
      layerColors: const [AppColors.blue, AppColors.yellow],
      offsetStep: const Offset(4, 4),
      radius: 22,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppColors.blueSoft,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.ink, width: 1.8),
                    ),
                    child: const Icon(Icons.calculate_outlined,
                        size: 18, color: AppColors.blue),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'HASIL PERHITUNGAN',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              StatChip(
                label: jenisAnalisis.toUpperCase(),
                variant: StatChipVariant.blue,
                fontSize: 10,
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildContent(context),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    if (jenisAnalisis == 'deskriptif') {
      final ringkasan = hasil['ringkasan'] as List<dynamic>? ?? [];
      if (ringkasan.isEmpty) return _buildEmpty();

      return Column(
        children: ringkasan.map((item) {
          final m = Map<String, dynamic>.from(item as Map);
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.bg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.ink, width: 1.6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'KOLOM: ${m['kolom']?.toString().toUpperCase()}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: AppColors.blue,
                      ),
                    ),
                    StatChip(
                      label: 'N = ${m['count'] ?? '-'}',
                      variant: StatChipVariant.neutral,
                      fontSize: 10,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _metricPill('Mean (Rata-rata)', m['mean']),
                    _metricPill('Median', m['median']),
                    _metricPill('Standar Deviasi', m['std']),
                    _metricPill('Minimum', m['min']),
                    _metricPill('Maksimum', m['max']),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (jenisAnalisis == 'uji_t') {
      final tScore = hasil['t_score'] ?? hasil['t_stat'];
      final pVal = hasil['p_value'];
      final df = hasil['df'];
      final sig = hasil['kesimpulan'] ?? (pVal != null && (pVal as num) < 0.05 ? 'Signifikan' : 'Tidak Signifikan');

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: _metricPill('Nilai T (t-score)', tScore, highlight: true),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _metricPill('p-value', pVal, isPValue: true),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _metricPill('Derajat Kebebasan (df)', df),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.yellowSoft,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.ink, width: 1.6),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Kesimpulan Uji',
                        style: GoogleFonts.inter(fontSize: 10.5, color: AppColors.muted),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        sig.toString(),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    if (jenisAnalisis == 'korelasi') {
      final rVal = hasil['koefisien_korelasi'] ?? hasil['r'];
      final pVal = hasil['p_value'];
      final inter = hasil['interpretasi'] ?? 'Hubungan Linear';

      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _metricPill('Koefisien (r)', rVal, highlight: true),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _metricPill('p-value', pVal, isPValue: true),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.blueSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.ink, width: 1.6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Interpretasi Keeratan Hubungan:',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 2),
                Text(
                  inter.toString(),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.blue,
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    if (jenisAnalisis == 'regresi') {
      final r2 = hasil['r_squared'] ?? hasil['r2'];
      final fStat = hasil['f_stat'];
      final pVal = hasil['p_value'];
      final pers = hasil['persamaan'] ?? 'Y = a + bX';

      return Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: AppColors.yellowSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.ink, width: 1.6),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Model Persamaan Regresi:',
                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.muted)),
                const SizedBox(height: 3),
                Text(
                  pers.toString(),
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Expanded(child: _metricPill('R² (Determinasi)', r2, highlight: true)),
              const SizedBox(width: 10),
              Expanded(child: _metricPill('F-Statistik', fStat)),
              const SizedBox(width: 10),
              Expanded(child: _metricPill('p-value', pVal, isPValue: true)),
            ],
          ),
        ],
      );
    }

    return _buildEmpty();
  }

  Widget _metricPill(String title, dynamic val, {bool highlight = false, bool isPValue = false}) {
    final numVal = _parseNum(val);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: highlight ? AppColors.yellowSoft : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.ink, width: 1.6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: AppColors.muted,
            ),
          ),
          const SizedBox(height: 4),
          if (numVal != null)
            AnimatedCounter(
              value: numVal,
              fractionDigits: isPValue ? 4 : 3,
              style: GoogleFonts.jetBrainsMono(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: isPValue && numVal < 0.05 ? AppColors.blue : AppColors.ink,
              ),
            )
          else
            Text(
              _fmt(val),
              style: GoogleFonts.jetBrainsMono(
                fontSize: 15,
                fontWeight: FontWeight.w900,
                color: AppColors.ink,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: Text(
          'Hasil metrik statistik belum tersedia.',
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted),
        ),
      ),
    );
  }
}
