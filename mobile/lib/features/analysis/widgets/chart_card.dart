import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/premium/premium_widgets.dart';

/// Kartu Visualisasi Grafik Statistik Mewah (fl_chart)
/// Memiliki efek gambar draw-in, palet Merah-Kuning-Biru, dan tooltip bergaya sticker neo-brutalist.
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

  @override
  Widget build(BuildContext context) {
    final visList = widget.visualisasi ?? [];

    return StackedCard(
      layerColors: const [AppColors.yellow, AppColors.blue],
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
                      color: AppColors.yellowSoft,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.ink, width: 1.8),
                    ),
                    child: const Icon(Icons.bar_chart_rounded,
                        size: 20, color: AppColors.ink),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'VISUALISASI GRAFIK',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              const StatChip(
                label: 'AUTO-CHART',
                variant: StatChipVariant.yellow,
                fontSize: 10,
              ),
            ],
          ),

          // Tab Switcher jika terdapat lebih dari 1 grafik
          if (visList.length > 1) ...[
            const SizedBox(height: 14),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: List.generate(visList.length, (idx) {
                  final v = Map<String, dynamic>.from(visList[idx] as Map);
                  final title = v['judul'] ?? 'Grafik ${idx + 1}';
                  final isActive = _activeChartIndex == idx;

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: StatChip(
                      label: title.toString().toUpperCase(),
                      variant: isActive
                          ? StatChipVariant.blue
                          : StatChipVariant.neutral,
                      onTap: () => setState(() => _activeChartIndex = idx),
                    ),
                  );
                }),
              ),
            ),
          ],

          const SizedBox(height: 18),

          // Area Grafik dengan Animasi Draw-In
          SizedBox(
            height: 250,
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0.0, end: 1.0),
              duration: const Duration(milliseconds: 900),
              curve: Curves.easeOutCubic,
              builder: (context, animValue, _) {
                return Opacity(
                  opacity: animValue.clamp(0.0, 1.0),
                  child: Transform.scale(
                    scale: 0.96 + (animValue * 0.04),
                    child: _buildChart(visList, animValue),
                  ),
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
        style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted),
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
          style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (meanMarker != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              children: [
                Container(
                  width: 14,
                  height: 3,
                  decoration: BoxDecoration(
                    color: AppColors.red,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  'Garis Mean: ${meanMarker.toStringAsFixed(2)}',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.red,
                  ),
                ),
              ],
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
    final topY = (maxVal * 1.25).ceilToDouble();

    final colors = [
      AppColors.blue,
      AppColors.yellow,
      AppColors.red,
      AppColors.blueLight,
    ];

    final barGroups = List.generate(nilai.length, (i) {
      final barColor = isHistogram
          ? (i % 2 == 0 ? AppColors.blue : AppColors.blueLight)
          : colors[i % colors.length];

      return BarChartGroupData(
        x: i,
        barRods: [
          BarChartRodData(
            toY: nilai[i],
            color: barColor,
            width: isHistogram ? 28 : 24,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            borderSide: const BorderSide(color: AppColors.ink, width: 1.8),
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
            tooltipBorder: const BorderSide(color: AppColors.ink, width: 1.5),
            getTooltipItem: (group, groupIndex, rod, rodIndex) {
              final label = groupIndex < kategori.length
                  ? kategori[groupIndex]
                  : 'Item';
              return BarTooltipItem(
                '$label\n',
                GoogleFonts.plusJakartaSans(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                ),
                children: [
                  TextSpan(
                    text: rod.toY.toStringAsFixed(2),
                    style: GoogleFonts.jetBrainsMono(
                      color: AppColors.blue,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ],
              );
            },
          ),
        ),
        borderData: FlBorderData(
          border: const Border(
            bottom: BorderSide(color: AppColors.ink, width: 2.0),
            left: BorderSide(color: AppColors.ink, width: 2.0),
          ),
        ),
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          getDrawingHorizontalLine: (v) => const FlLine(
            color: Color(0xFFE2E8F0),
            strokeWidth: 1.2,
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
              reservedSize: 36,
              getTitlesWidget: (val, meta) {
                if (val % 1 == 0) {
                  return Text(
                    val.toInt().toString(),
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 10,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w600,
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
              reservedSize: 28,
              getTitlesWidget: (val, meta) {
                final idx = val.toInt();
                if (idx >= 0 && idx < kategori.length) {
                  return Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      kategori[idx],
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
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
            radius: 6,
            color: AppColors.yellow,
            strokeColor: AppColors.ink,
            strokeWidth: 2.0,
          ),
        ),
      );
    }

    if (spots.isEmpty) {
      return Center(
        child: Text('Data scatter plot kosong.',
            style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted)),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (labelX != null || labelY != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(
              'X: ${labelX ?? "X"} ➔ Y: ${labelY ?? "Y"}',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.blue,
              ),
            ),
          ),
        Expanded(
          child: ScatterChart(
            ScatterChartData(
              scatterSpots: spots,
              borderData: FlBorderData(
                border: const Border(
                  bottom: BorderSide(color: AppColors.ink, width: 2.0),
                  left: BorderSide(color: AppColors.ink, width: 2.0),
                ),
              ),
              gridData: FlGridData(
                show: true,
                getDrawingHorizontalLine: (v) => const FlLine(
                  color: Color(0xFFE2E8F0),
                  strokeWidth: 1.0,
                ),
                getDrawingVerticalLine: (v) => const FlLine(
                  color: Color(0xFFE2E8F0),
                  strokeWidth: 1.0,
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
