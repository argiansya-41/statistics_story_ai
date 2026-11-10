import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Kartu Visualisasi Grafik Statistik Modern Standar (fl_chart)
/// Tampilan bersih, ilmiah, dan akademis (serasi dengan versi desktop web).
class ChartCard extends StatefulWidget {
  final List<dynamic>? visualisasi;
  final String jenisAnalisis;
  final Map<String, dynamic>? hasil;

  const ChartCard({
    super.key,
    this.visualisasi,
    required this.jenisAnalisis,
    this.hasil,
  });

  @override
  State<ChartCard> createState() => _ChartCardState();
}

class _ChartCardState extends State<ChartCard> {
  int _activeChartIndex = 0;

  // Helper untuk memformat label interval rentang agar ringkas (misal: "0–10" bukan "0.00-10.00")
  String _formatBinLabel(String label) {
    final cleaned = label.replaceAll(' ', '');
    final parts = cleaned.split(RegExp(r'[–\-—]'));
    if (parts.length >= 2) {
      final min = double.tryParse(parts[0]);
      final max = double.tryParse(parts[1]);
      if (min != null && max != null) {
        String fmt(double n) =>
            n % 1 == 0 ? n.toInt().toString() : n.toStringAsFixed(1);
        return '${fmt(min)}–${fmt(max)}';
      }
    }
    return label;
  }

  @override
  Widget build(BuildContext context) {
    final visList = widget.visualisasi ?? [];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Bersih & Modern
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.bar_chart_rounded,
                      size: 20,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'VISUALISASI GRAFIK',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF1E293B),
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'STANDAR AKADEMIS',
                  style: GoogleFonts.inter(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF64748B),
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),

          // Tab Switcher jika terdapat lebih dari 1 grafik
          if (visList.length > 1) ...[
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(visList.length, (idx) {
                  final v = Map<String, dynamic>.from(visList[idx] as Map);
                  final title = v['judul'] ?? 'Grafik ${idx + 1}';
                  final isActive = _activeChartIndex == idx;

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _activeChartIndex = idx),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFF2563EB)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          title.toString(),
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: isActive
                                ? Colors.white
                                : const Color(0xFF475569),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Area Grafik dengan Animasi Masuk Halus
          SizedBox(
            height: 275,
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 700),
              curve: Curves.easeOutCubic,
              builder: (context, animValue, _) {
                return Opacity(
                  opacity: animValue.clamp(0.0, 1.0),
                  child: _buildChart(visList, animValue),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChart(List<dynamic> visList, double anim) {
    if (visList.isNotEmpty) {
      final safeIndex =
          _activeChartIndex < visList.length ? _activeChartIndex : 0;
      final spec = Map<String, dynamic>.from(visList[safeIndex] as Map);
      final jenisGrafik =
          (spec['jenis_grafik'] ?? '').toString().toLowerCase();
      final dataGrafik = spec['data_grafik'] as Map<String, dynamic>? ?? {};
      final judul = spec['judul']?.toString();
      final labelX = spec['label_x']?.toString();
      final labelY = spec['label_y']?.toString();

      if (jenisGrafik == 'scatter') {
        return _buildScatterChart(dataGrafik, labelX, labelY, anim);
      } else {
        return _buildBarOrHistogramChart(
          dataGrafik,
          jenisGrafik,
          judul,
          labelX,
          labelY,
          anim,
        );
      }
    }

    // Fallback Uji-T
    if (widget.jenisAnalisis == 'uji_t' && widget.hasil != null) {
      final k1 = widget.hasil!['kelompok_1'] as Map<String, dynamic>? ?? {};
      final k2 = widget.hasil!['kelompok_2'] as Map<String, dynamic>? ?? {};
      final m1 = (k1['mean'] as num?)?.toDouble() ?? 0.0;
      final m2 = (k2['mean'] as num?)?.toDouble() ?? 0.0;

      return _buildSimpleCompareBar(
        label1: k1['nama']?.toString() ?? 'Kelompok 1',
        val1: m1 * anim,
        label2: k2['nama']?.toString() ?? 'Kelompok 2',
        val2: m2 * anim,
      );
    }

    // Fallback Deskriptif
    if (widget.jenisAnalisis == 'deskriptif' && widget.hasil != null) {
      final ringkasan = widget.hasil!['ringkasan'] as List<dynamic>? ?? [];
      if (ringkasan.isNotEmpty) {
        final kategori = <String>[];
        final nilai = <double>[];
        for (var item in ringkasan) {
          final m = Map<String, dynamic>.from(item as Map);
          kategori.add(m['kolom']?.toString() ?? 'Variabel');
          nilai.add(((m['mean'] ?? 0) as num).toDouble() * anim);
        }
        return _buildCustomBarChart(
          kategori: kategori,
          nilai: nilai,
          subtitle: 'Perbandingan Nilai Rata-rata (Mean)',
        );
      }
    }

    return Center(
      child: Text(
        'Grafik visualisasi tidak tersedia untuk data ini.',
        style: GoogleFonts.inter(
            fontSize: 12, color: const Color(0xFF94A3B8)),
      ),
    );
  }

  Widget _buildBarOrHistogramChart(
    Map<String, dynamic> data,
    String jenisGrafik,
    String? judul,
    String? labelX,
    String? labelY,
    double anim,
  ) {
    final List<String> kategori = [];
    final List<double> nilai = [];
    double? meanMarker;

    final binsRaw = data['bins'] as List<dynamic>?;
    if (binsRaw != null && binsRaw.isNotEmpty) {
      if (data['mean_marker'] != null) {
        meanMarker = (data['mean_marker'] as num).toDouble();
      }
      for (var b in binsRaw) {
        final bMap = Map<String, dynamic>.from(b as Map);
        kategori.add(bMap['label']?.toString() ?? '');
        nilai.add(((bMap['count'] ?? 0) as num).toDouble() * anim);
      }
    } else {
      final rawKat = (data['kategori'] as List<dynamic>? ??
              data['labels'] as List<dynamic>? ??
              [])
          .map((e) => e?.toString() ?? '')
          .toList();
      final rawNilai = (data['nilai'] as List<dynamic>? ?? [])
          .map((e) =>
              (e is num
                  ? e.toDouble()
                  : double.tryParse(e?.toString() ?? '0') ?? 0.0) *
              anim)
          .toList();

      kategori.addAll(rawKat);
      nilai.addAll(rawNilai);
    }

    if (kategori.isEmpty || nilai.isEmpty) {
      return Center(
        child: Text(
          'Data grafik kosong.',
          style: GoogleFonts.inter(
              fontSize: 12, color: const Color(0xFF94A3B8)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Badge Penanda Rata-rata (Mean) yang Rapi & Jelas
        if (meanMarker != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3.5),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFFECACA), width: 1.0),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 10,
                    height: 2.5,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Rata-rata (Mean): ${meanMarker.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFDC2626),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Expanded(
          child: _buildCustomBarChart(
            kategori: kategori,
            nilai: nilai,
            subtitle: judul,
            labelX: labelX,
            labelY: labelY,
            isHistogram: jenisGrafik == 'histogram',
          ),
        ),
      ],
    );
  }

  Widget _buildCustomBarChart({
    required List<String> kategori,
    required List<double> nilai,
    String? subtitle,
    String? labelX,
    String? labelY,
    bool isHistogram = false,
  }) {
    final maxVal = nilai.isEmpty
        ? 10.0
        : nilai.reduce((curr, next) => curr > next ? curr : next);
    final topY = (maxVal * 1.2).ceilToDouble();

    // Palet warna modern standar
    final modernColors = [
      const Color(0xFF3B82F6), // Blue
      const Color(0xFF10B981), // Emerald
      const Color(0xFFF59E0B), // Amber
      const Color(0xFF8B5CF6), // Violet
    ];

    final barGroups = List.generate(nilai.length, (i) {
      final barColor = isHistogram
          ? const Color(0xFF3B82F6)
          : modernColors[i % modernColors.length];

      return BarChartGroupData(
        x: i,
        barRods: [
          BarChartRodData(
            toY: nilai[i],
            color: barColor,
            width: isHistogram
                ? (nilai.length > 8 ? 20 : 26)
                : (nilai.length > 4 ? 24 : 36),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
            borderSide: BorderSide(
              color: barColor.withAlpha(230),
              width: 1.0,
            ),
          ),
        ],
      );
    });

    return BarChart(
      BarChartData(
        maxY: topY > 0 ? topY : 10,
        alignment: BarChartAlignment.spaceAround,
        barTouchData: BarTouchData(
          enabled: true,
          touchTooltipData: BarTouchTooltipData(
            tooltipBorder: const BorderSide(
              color: Color(0xFFCBD5E1),
              width: 1.0,
            ),
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final raw = groupIndex < kategori.length
                  ? kategori[groupIndex]
                  : 'Item';
              final label = isHistogram ? _formatBinLabel(raw) : raw;
              return BarTooltipItem(
                '$label\n',
                GoogleFonts.plusJakartaSans(
                  color: const Color(0xFF1E293B),
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
                children: [
                  TextSpan(
                    text: 'Nilai: ${rod.toY.toInt()}',
                    style: GoogleFonts.inter(
                      color: const Color(0xFF2563EB),
                      fontWeight: FontWeight.w700,
                      fontSize: 11,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        borderData: FlBorderData(
          border: const Border(
            bottom: BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
            left: BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
          ),
        ),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (v) => const FlLine(
            color: Color(0xFFF1F5F9),
            strokeWidth: 1.0,
            dashArray: [4, 4],
          ),
        ),
        titlesData: FlTitlesData(
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 34,
              getTitlesWidget: (val, meta) {
                if (val % 1 == 0) {
                  return Text(
                    val.toInt().toString(),
                    style: GoogleFonts.inter(
                      fontSize: 9.5,
                      color: const Color(0xFF64748B),
                      fontWeight: FontWeight.w500,
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 44, // Ruang cukup untuk teks miring
              getTitlesWidget: (val, meta) {
                final idx = val.toInt();
                if (idx >= 0 && idx < kategori.length) {
                  final raw = kategori[idx];
                  final label = isHistogram ? _formatBinLabel(raw) : raw;

                  return SideTitleWidget(
                    meta: meta,
                    space: 6,
                    angle: -0.65, // Dimiringkan ~ -37 derajat agar tidak bertumpuk
                    child: Text(
                      label,
                      style: GoogleFonts.inter(
                        fontSize: 9.0,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ),
        barGroups: barGroups,
      ),
    );
  }

  Widget _buildScatterChart(
    Map<String, dynamic> data,
    String? labelX,
    String? labelY,
    double anim,
  ) {
    final pointsRaw = data['points'] as List<dynamic>? ?? [];
    final spots = <ScatterSpot>[];

    for (var p in pointsRaw) {
      final map = Map<String, dynamic>.from(p as Map);
      final x = (map['x'] is num
          ? (map['x'] as num).toDouble()
          : double.tryParse(map['x']?.toString() ?? '0') ?? 0.0);
      final y = (map['y'] is num
          ? (map['y'] as num).toDouble()
          : double.tryParse(map['y']?.toString() ?? '0') ?? 0.0);

      spots.add(
        ScatterSpot(
          x,
          y * anim,
          dotPainter: FlDotCirclePainter(
            radius: 4.5,
            color: const Color(0xFF2563EB).withAlpha(180),
            strokeColor: Colors.white,
            strokeWidth: 1.0,
          ),
        ),
      );
    }

    if (spots.isEmpty) {
      return Center(
        child: Text(
          'Data scatter plot kosong.',
          style: GoogleFonts.inter(
              fontSize: 12, color: const Color(0xFF94A3B8)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Legend Bersih Standar
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2563EB),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 5),
                Text(
                  'Titik Observasi (${spots.length} data)',
                  style: GoogleFonts.inter(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF475569),
                  ),
                ),
              ],
            ),
            if (labelX != null && labelY != null)
              Text(
                '$labelX ➔ $labelY',
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF2563EB),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        Expanded(
          child: ScatterChart(
            ScatterChartData(
              scatterSpots: spots,
              borderData: FlBorderData(
                border: const Border(
                  bottom: BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                  left: BorderSide(color: Color(0xFFCBD5E1), width: 1.2),
                ),
              ),
              gridData: FlGridData(
                show: true,
                getDrawingHorizontalLine: (v) => const FlLine(
                  color: Color(0xFFF1F5F9),
                  strokeWidth: 1.0,
                  dashArray: [4, 4],
                ),
                getDrawingVerticalLine: (v) => const FlLine(
                  color: Color(0xFFF1F5F9),
                  strokeWidth: 1.0,
                  dashArray: [4, 4],
                ),
              ),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false)),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 32,
                    getTitlesWidget: (val, meta) => Text(
                      val.toInt().toString(),
                      style: GoogleFonts.inter(
                        fontSize: 9.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 26,
                    getTitlesWidget: (val, meta) => Text(
                      val.toInt().toString(),
                      style: GoogleFonts.inter(
                        fontSize: 9.5,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSimpleCompareBar({
    required String label1,
    required double val1,
    required String label2,
    required double val2,
  }) {
    return _buildCustomBarChart(
      kategori: [label1, label2],
      nilai: [val1, val2],
      subtitle: 'Perbandingan Rata-rata Dua Kelompok',
    );
  }
}
