import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_app_shell.dart';
import '../../../core/widgets/premium/premium_widgets.dart';
import '../models/analysis_models.dart';
import '../widgets/chart_card.dart';
import '../widgets/narrative_card.dart';
import '../widgets/stat_metrics_card.dart';

/// Halaman Detail Hasil Analisis & Visualisasi AI (Soft Neo-Brutalism)
class AnalysisDetailScreen extends StatefulWidget {
  final int analysisId;
  final AnalysisRecord? initialRecord;

  const AnalysisDetailScreen({
    super.key,
    required this.analysisId,
    this.initialRecord,
  });

  @override
  State<AnalysisDetailScreen> createState() => _AnalysisDetailScreenState();
}

class _AnalysisDetailScreenState extends State<AnalysisDetailScreen> {
  AnalysisRecord? _record;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _record = widget.initialRecord;
    if (_record == null ||
        _record!.hasil == null ||
        _record!.visualisasi == null ||
        _record!.visualisasi!.isEmpty) {
      _loadDetail();
    }
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final rec = await ApiService().getAnalysisDetail(widget.analysisId);
      if (mounted) {
        setState(() {
          _record = rec;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleDelete() async {
    final title = _record?.namaSesi ?? 'sesi analisis ini';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: AppColors.ink, width: 2.2),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.redSoft,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.red, width: 1.6),
              ),
              child: const Icon(Icons.delete_outline_rounded,
                  color: AppColors.red, size: 20),
            ),
            const SizedBox(width: 10),
            Text(
              'HAPUS RIWAYAT',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
        content: Text(
          'Apakah Anda yakin ingin menghapus data "$title" dari sistem? Tindakan ini tidak dapat dibatalkan.',
          style: GoogleFonts.inter(fontSize: 13.5, color: AppColors.muted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Batal',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.red,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.ink, width: 2.0),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Ya, Hapus',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await ApiService().deleteAnalysis(widget.analysisId);
        if (!mounted) return;
        Navigator.of(context).pop(true);
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.red,
            content: Text('Gagal menghapus: $e'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSelesai = _record?.status.toLowerCase() == 'selesai';

    return MobileAppShell(
      currentRoute: 'dasbor',
      showBackButton: true,
      onBackPressed: () => Navigator.of(context).pop(),
      extraActions: [
        SquircleIconButton(
          icon: Icons.refresh_rounded,
          size: 38,
          iconSize: 20,
          radius: 12,
          color: AppColors.yellow,
          shadowOffset: const Offset(2, 2),
          tooltip: 'Segarkan Data',
          onPressed: _loadDetail,
        ),
        const SizedBox(width: 8),
        SquircleIconButton(
          icon: Icons.delete_outline_rounded,
          size: 38,
          iconSize: 18,
          radius: 12,
          color: AppColors.redSoft,
          iconColor: AppColors.red,
          shadowOffset: const Offset(2, 2),
          tooltip: 'Hapus Analisis Ini',
          onPressed: _handleDelete,
        ),
      ],
      body: _isLoading
          ? const Center(
              child: ShimmerSkeleton(
                width: 320,
                height: 180,
                radius: 24,
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline_rounded,
                            size: 46, color: AppColors.red),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.red,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 16),
                        PrimaryButton(
                          label: 'Coba Lagi',
                          width: 140,
                          height: 44,
                          onPressed: _loadDetail,
                        ),
                      ],
                    ),
                  ),
                )
              : _record == null
                  ? Center(
                      child: Text(
                        'Data analisis tidak ditemukan.',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppColors.muted,
                        ),
                      ),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 16,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // 1. Header Session Card
                          StaggeredEntrance(
                            index: 0,
                            child: StackedCard(
                              layerColors: const [
                                AppColors.blue,
                                AppColors.yellow
                              ],
                              offsetStep: const Offset(5, 5),
                              radius: 24,
                              padding: const EdgeInsets.all(18),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      StatChip(
                                        label: 'SESI ID #${_record!.id}',
                                        variant: StatChipVariant.neutral,
                                        fontSize: 10,
                                      ),
                                      StatChip(
                                        label: _record!.status.toUpperCase(),
                                        variant: isSelesai
                                            ? StatChipVariant.green
                                            : StatChipVariant.yellow,
                                        icon: isSelesai
                                            ? Icons.check_circle_rounded
                                            : Icons.hourglass_top_rounded,
                                        fontSize: 10.5,
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _record!.namaSesi,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 19,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.ink,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.calendar_today_outlined,
                                        size: 13,
                                        color: AppColors.muted,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        _record!.tanggal,
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: AppColors.muted,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      const Icon(
                                        Icons.analytics_outlined,
                                        size: 14,
                                        color: AppColors.blue,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        _record!.jenisAnalisis.toUpperCase(),
                                        style: GoogleFonts.jetBrainsMono(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.blue,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          // 2. Hasil Perhitungan Metrik Statistik
                          if (_record!.hasil != null) ...[
                            StaggeredEntrance(
                              index: 1,
                              child: StatMetricsCard(
                                jenisAnalisis: _record!.jenisAnalisis,
                                hasil: _record!.hasil!,
                              ),
                            ),
                            const SizedBox(height: 20),
                          ],

                          // 3. Visualisasi Grafik fl_chart
                          StaggeredEntrance(
                            index: 2,
                            child: ChartCard(
                              jenisAnalisis: _record!.jenisAnalisis,
                              hasil: _record!.hasil,
                              visualisasi: _record!.visualisasi,
                            ),
                          ),

                          const SizedBox(height: 20),

                          // 4. Narasi AI & Contoh Kasus Nyata
                          StaggeredEntrance(
                            index: 3,
                            child: NarrativeCard(
                              narasi: _record!.narasi,
                              contohKasus: _record!.contohKasus,
                            ),
                          ),

                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
    );
  }
}
