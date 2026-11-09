import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/premium/premium_widgets.dart';

/// Halaman Showcase Komponen Design System (Soft Neo-Brutalism / Sticker Card)
class DesignShowcaseScreen extends StatefulWidget {
  const DesignShowcaseScreen({super.key});

  @override
  State<DesignShowcaseScreen> createState() => _DesignShowcaseScreenState();
}

class _DesignShowcaseScreenState extends State<DesignShowcaseScreen> {
  String _activeTab = 'komponen';
  String _activeNavKey = 'dasbor';
  bool _isLoadingBtn = false;
  final TextEditingController _textCtrl = TextEditingController(text: 'Statistik 2026');
  String? _errorSample;

  @override
  void dispose() {
    _textCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecorBackground(
        child: SafeArea(
          child: Column(
            children: [
              // Header Showcase
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    SquircleIconButton(
                      icon: Icons.arrow_back,
                      onPressed: () => Navigator.maybePop(context),
                      tooltip: 'Kembali',
                    ),
                    const SectionHeader(
                      title: 'DESIGN SYSTEM',
                      subtitle: 'Neo-Brutalism Sticker Card',
                      titleSize: 18,
                    ),
                    SquircleIconButton(
                      icon: Icons.palette_outlined,
                      color: AppColors.blue,
                      iconColor: Colors.white,
                      onPressed: () {},
                    ),
                  ],
                ),
              ),

              // Tab Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: UnderlineTabBar(
                  activeKey: _activeTab,
                  tabs: const [
                    TabItem(keyName: 'komponen', label: 'KOMPONEN', icon: Icons.widgets_outlined),
                    TabItem(keyName: 'kartu', label: 'KARTU & STATS', icon: Icons.dashboard_outlined),
                  ],
                  onTabChanged: (val) => setState(() => _activeTab = val),
                ),
              ),

              // Body Konten
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  children: [
                    if (_activeTab == 'komponen') ...[
                      // 1. Tombol
                      const SectionHeader(
                        title: 'Primary Buttons',
                        subtitle: 'Varian Kuning, Biru, Merah, & Loading',
                      ),
                      const SizedBox(height: 12),
                      PrimaryButton(
                        label: 'TOMBOL UTAMA (KUNING)',
                        prefixIcon: Icons.bolt_rounded,
                        onPressed: () {},
                      ),
                      const SizedBox(height: 12),
                      PrimaryButton(
                        label: 'TOMBOL SEKUNDER (BIRU)',
                        variant: ButtonVariant.blue,
                        prefixIcon: Icons.cloud_upload_outlined,
                        onPressed: () {},
                      ),
                      const SizedBox(height: 12),
                      PrimaryButton(
                        label: _isLoadingBtn ? 'MEMPROSES...' : 'TEST LOADING STATE',
                        variant: ButtonVariant.red,
                        isLoading: _isLoadingBtn,
                        onPressed: () {
                          setState(() => _isLoadingBtn = true);
                          Future.delayed(const Duration(seconds: 2), () {
                            if (mounted) setState(() => _isLoadingBtn = false);
                          });
                        },
                      ),

                      const SizedBox(height: 24),

                      // 2. Text Fields
                      const SectionHeader(
                        title: 'Text Fields',
                        subtitle: 'Animasi Fokus Kuning & Shake Error',
                      ),
                      const SizedBox(height: 12),
                      PremiumTextField(
                        label: 'Nama Variabel Penelitian',
                        hintText: 'Contoh: Nilai Mahasiswa',
                        prefixIcon: Icons.edit_note_rounded,
                        controller: _textCtrl,
                      ),
                      const SizedBox(height: 14),
                      PremiumTextField(
                        label: 'Kata Sandi Aman',
                        hintText: 'Minimal 8 karakter',
                        prefixIcon: Icons.lock_outline_rounded,
                        isPassword: true,
                        errorText: _errorSample,
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _errorSample = _errorSample == null
                                ? 'Format kata sandi tidak valid!'
                                : null;
                          });
                        },
                        child: Text(_errorSample == null ? 'Trigger Error Shake' : 'Clear Error'),
                      ),

                      const SizedBox(height: 20),

                      // 3. Stat Chips
                      const SectionHeader(
                        title: 'Status Badges',
                        subtitle: 'Chip Kapsul Lembut Ber-outline',
                      ),
                      const SizedBox(height: 12),
                      const Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          StatChip(
                            label: 'SELESAI (100%)',
                            variant: StatChipVariant.green,
                            icon: Icons.check_circle_outline,
                          ),
                          StatChip(
                            label: 'DIPROSES',
                            variant: StatChipVariant.yellow,
                            icon: Icons.hourglass_top,
                          ),
                          StatChip(
                            label: 'SIGNIFIKAN (p < 0.05)',
                            variant: StatChipVariant.blue,
                            icon: Icons.insights_rounded,
                          ),
                          StatChip(
                            label: 'GAGAL',
                            variant: StatChipVariant.red,
                            icon: Icons.error_outline,
                          ),
                        ],
                      ),
                    ] else ...[
                      // Tab Kartu & Stats
                      const SectionHeader(
                        title: 'Stacked Cards',
                        subtitle: 'Lapisan Offset Biru & Kuning dengan Efek Tekan',
                      ),
                      const SizedBox(height: 16),
                      StackedCard(
                        showConnectorDots: true,
                        onTap: () {},
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const StatChip(
                                  label: 'UJI-T INDEPENDEN',
                                  variant: StatChipVariant.blue,
                                ),
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: AppColors.success,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Pengaruh Model Pembelajaran terhadap Nilai Akhir',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Dataset: 60 Responden • Nilai p = 0.003 (Signifikan)',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.muted,
                              ),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today_outlined,
                                    size: 14, color: AppColors.muted),
                                const SizedBox(width: 6),
                                const Text(
                                  '3 Nov 2026',
                                  style: TextStyle(
                                      fontSize: 12, color: AppColors.muted),
                                ),
                                const Spacer(),
                                SquircleIconButton(
                                  icon: Icons.arrow_forward_rounded,
                                  size: 34,
                                  iconSize: 18,
                                  radius: 12,
                                  onPressed: () {},
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 28),

                      // Animated Counter Showcase
                      const SectionHeader(
                        title: 'Animated Counter & Shimmer',
                        subtitle: 'Angka Naik Otomatis & Shimmer Skeleton',
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: StackedCard(
                              layerColors: const [AppColors.yellow],
                              offsetStep: const Offset(4, 4),
                              padding: const EdgeInsets.all(14),
                              child: const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'TOTAL ANALISIS',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.muted,
                                    ),
                                  ),
                                  SizedBox(height: 6),
                                  AnimatedCounter(value: 42, suffix: ' Sesi'),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: StackedCard(
                              layerColors: const [AppColors.blue],
                              offsetStep: const Offset(4, 4),
                              padding: const EdgeInsets.all(14),
                              child: const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'RATA-RATA NILAI',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.muted,
                                    ),
                                  ),
                                  SizedBox(height: 6),
                                  AnimatedCounter(
                                    value: 86.4,
                                    fractionDigits: 1,
                                    suffix: ' %',
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Shimmer Skeleton
                      const ShimmerSkeleton(
                        width: double.infinity,
                        height: 70,
                        radius: 20,
                      ),

                      const SizedBox(height: 24),

                      // Empty State Card
                      EmptyStateCard(
                        title: 'Belum Ada Dataset Baru',
                        description:
                            'Unggah berkas CSV atau pilih dataset contoh untuk memulai petualangan statistikamu.',
                        actionLabel: 'Unggah Sekarang',
                        onAction: () {},
                      ),
                    ],
                  ],
                ),
              ),

              // Pill Bottom Nav Showcase
              PillBottomNav(
                activeKey: _activeNavKey,
                items: const [
                  PillNavItem(
                    keyName: 'dasbor',
                    label: 'Dasbor',
                    icon: Icons.grid_view_rounded,
                  ),
                  PillNavItem(
                    keyName: 'analisis',
                    label: 'Analisis Baru',
                    icon: Icons.add_circle_outline_rounded,
                  ),
                  PillNavItem(
                    keyName: 'riwayat',
                    label: 'Riwayat',
                    icon: Icons.history_rounded,
                  ),
                ],
                onSelect: (val) => setState(() => _activeNavKey = val),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

