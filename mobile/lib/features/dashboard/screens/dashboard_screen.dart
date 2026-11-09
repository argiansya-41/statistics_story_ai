import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_app_shell.dart';
import '../../../core/widgets/premium/premium_widgets.dart';
import '../../analysis/models/analysis_models.dart';
import '../../analysis/screens/analysis_detail_screen.dart';
import '../../analysis/screens/new_analysis_screen.dart';
import '../../auth/widgets/helm_mascot.dart';

class DashboardScreen extends StatefulWidget {
  final Map<String, dynamic>? initialUser;
  final String initialTab;

  const DashboardScreen({
    super.key,
    this.initialUser,
    this.initialTab = 'dasbor',
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _user;
  List<AnalysisRecord> _history = [];
  bool _isLoadingHistory = false;
  String? _historyError;
  final TextEditingController _searchCtrl = TextEditingController();

  // Navigation State
  late String _currentTab;

  // Pulse animation for the Floating Action Button
  late AnimationController _fabPulseCtrl;
  late Animation<double> _fabScaleAnim;

  @override
  void initState() {
    super.initState();
    _currentTab = widget.initialTab;
    _user = widget.initialUser;
    if (_user == null) {
      _loadProfile();
    }
    _fetchHistory();

    _fabPulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _fabScaleAnim = Tween<double>(begin: 1.0, end: 1.06).animate(
      CurvedAnimation(parent: _fabPulseCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _fabPulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await ApiService().getProfile();
      if (mounted) setState(() => _user = profile);
    } catch (_) {}
  }

  Future<void> _fetchHistory([String? query]) async {
    setState(() {
      _isLoadingHistory = true;
      _historyError = null;
    });
    try {
      final list = await ApiService().getAnalysisHistory(search: query);
      if (mounted) {
        setState(() {
          _history = list;
          _isLoadingHistory = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _historyError = e.toString();
          _isLoadingHistory = false;
        });
      }
    }
  }

  Future<void> _deleteItem(int id) async {
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
          'Apakah Anda yakin ingin menghapus data sesi analisis ini dari sistem?',
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
        await ApiService().deleteAnalysis(id);
        _fetchHistory();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.ink,
            content: Text('Gagal menghapus: $e'),
          ),
        );
      }
    }
  }

  void _navigateToNewAnalysis([String? type]) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => NewAnalysisScreen(initialAnalysisType: type),
      ),
    ).then((_) => _fetchHistory());
  }

  @override
  Widget build(BuildContext context) {
    final userName = _user?['name'] ?? _user?['nama'] ?? 'Mahasiswa';
    final totalSaved = _history.length;
    final totalSelesai =
        _history.where((r) => r.status.toLowerCase() == 'selesai').length;
    final totalDiproses =
        _history.where((r) => r.status.toLowerCase() == 'diproses').length;
    final recentFive = _history.take(5).toList();

    return MobileAppShell(
      currentRoute: _currentTab,
      onTabSelected: (tab) {
        setState(() => _currentTab = tab);
        if (tab == 'riwayat') {
          _fetchHistory();
        }
      },
      body: Stack(
        children: [
          Column(
            children: [
              // Underline Tab Bar [ DASBOR UTAMA | RIWAYAT LENGKAP ]
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: UnderlineTabBar(
                  activeKey: _currentTab,
                  tabs: const [
                    TabItem(
                      keyName: 'dasbor',
                      label: 'DASBOR UTAMA',
                      icon: Icons.dashboard_outlined,
                    ),
                    TabItem(
                      keyName: 'riwayat',
                      label: 'RIWAYAT ANALISIS',
                      icon: Icons.history_edu_outlined,
                    ),
                  ],
                  onTabChanged: (tab) {
                    setState(() => _currentTab = tab);
                    if (tab == 'riwayat') _fetchHistory();
                  },
                ),
              ),

              // Konten Tab Aktif
              Expanded(
                child: RefreshIndicator(
                  color: AppColors.blue,
                  backgroundColor: AppColors.yellow,
                  onRefresh: () => _fetchHistory(),
                  child: _currentTab == 'dasbor'
                      ? _buildDasborContent(
                          userName: userName,
                          totalSaved: totalSaved,
                          totalSelesai: totalSelesai,
                          totalDiproses: totalDiproses,
                          recentFive: recentFive,
                        )
                      : _buildRiwayatContent(),
                ),
              ),
            ],
          ),

          // Floating Action Button "Analisis Baru" Berdenyut Halus
          Positioned(
            bottom: 16,
            right: 20,
            child: ScaleTransition(
              scale: _fabScaleAnim,
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.mediumImpact();
                  _navigateToNewAnalysis();
                },
                child: Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: AppColors.yellow,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.ink, width: 2.2),
                    boxShadow: const [
                      BoxShadow(
                        color: AppColors.ink,
                        offset: Offset(3.5, 3.5),
                        blurRadius: 0,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.add_rounded,
                      size: 32,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Tampilan Dasbor Utama Mewah & Playful-Premium
  Widget _buildDasborContent({
    required String userName,
    required int totalSaved,
    required int totalSelesai,
    required int totalDiproses,
    required List<AnalysisRecord> recentFive,
  }) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      children: [
        // 1. HERO GREETING CARD (Header Sapaan dengan Avatar Squircle & Sigi Mascot)
        StaggeredEntrance(
          index: 0,
          child: StackedCard(
            layerColors: const [AppColors.blue, AppColors.yellow],
            offsetStep: const Offset(5, 5),
            radius: 24,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Avatar Squircle Pengguna
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.yellow,
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: AppColors.ink, width: 2.0),
                        boxShadow: const [
                          BoxShadow(
                            color: AppColors.ink,
                            offset: Offset(2, 2),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          userName.isNotEmpty ? userName[0].toUpperCase() : 'M',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.ink,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const StatChip(
                            label: 'WORKSPACE AKADEMIS',
                            variant: StatChipVariant.blue,
                            fontSize: 10,
                            padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Halo, $userName!',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  'Mulai ceritakan angka analisismu. Unggah dataset tugas atau riset, pilih pengujian statistik, dan biarkan AI merangkai narasi akademis bebas halusinasi.',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.muted,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 16),

                // Balon Bicara Pemandu Sigi
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.yellowSoft,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.ink, width: 1.8),
                  ),
                  child: Row(
                    children: [
                      HelmMascot(
                        character: MascotChar.sigi,
                        expression: MascotExpression.smile,
                        size: 48,
                        isBobbing: true,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'SIGI • ASISTEN STATISTIK',
                              style: GoogleFonts.jetBrainsMono(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.blue,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Pilih salah satu dari 4 metode pengujian di bawah untuk memulai!',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 24),

        // 2. KARTU STATISTIK RINGKAS DENGAN ANIMATED COUNTER
        StaggeredEntrance(
          index: 1,
          child: const SectionHeader(
            title: 'Ringkasan Statistik',
            subtitle: 'Statistik aktivitas analisis data Anda',
          ),
        ),
        const SizedBox(height: 12),

        StaggeredEntrance(
          index: 2,
          child: Row(
            children: [
              // Total Tersimpan
              Expanded(
                child: _buildMetricCard(
                  title: 'TERSIMPAN',
                  value: totalSaved,
                  layerColor: AppColors.yellow,
                  icon: Icons.bookmarks_outlined,
                  iconColor: const Color(0xFF998A00),
                ),
              ),
              const SizedBox(width: 10),

              // Selesai
              Expanded(
                child: _buildMetricCard(
                  title: 'SELESAI',
                  value: totalSelesai,
                  layerColor: AppColors.blue,
                  icon: Icons.check_circle_outline_rounded,
                  iconColor: AppColors.blue,
                ),
              ),
              const SizedBox(width: 10),

              // Diproses
              Expanded(
                child: _buildMetricCard(
                  title: 'PROSES',
                  value: totalDiproses,
                  layerColor: AppColors.red,
                  icon: Icons.hourglass_top_rounded,
                  iconColor: AppColors.red,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 26),

        // 3. PILIH METODE ANALISIS STATISTIK (4 KARTU PENGUJIAN)
        StaggeredEntrance(
          index: 3,
          child: const SectionHeader(
            title: 'Metode Pengujian',
            subtitle: 'Pilih uji statistik sesuai karakteristik dataset',
          ),
        ),
        const SizedBox(height: 14),

        StaggeredEntrance(
          index: 4,
          child: Column(
            children: [
              _buildAnalysisMethodCard(
                num: '01',
                title: 'STATISTIK DESKRIPTIF',
                summary:
                    'Meringkas tendensi sentral (mean, median, modus), rentang min-max, dan standar deviasi sebaran data.',
                req: 'Syarat: minimal 2 observasi numerik.',
                accentColor: AppColors.blue,
                icon: Icons.bar_chart_rounded,
                type: 'deskriptif',
              ),
              const SizedBox(height: 12),
              _buildAnalysisMethodCard(
                num: '02',
                title: 'UJI T DUA KELOMPOK',
                summary:
                    'Membandingkan perbedaan rata-rata antara 2 kelompok independen dengan rumus Welch (α = 0.05).',
                req: 'Syarat: tepat 2 kelompok kategori, data numerik.',
                accentColor: AppColors.red,
                icon: Icons.compare_arrows_rounded,
                type: 'uji_t',
              ),
              const SizedBox(height: 12),
              _buildAnalysisMethodCard(
                num: '03',
                title: 'KORELASI PEARSON',
                summary:
                    'Mengukur derajat dan arah keeratan hubungan linear (r) antara variabel numerik X dan Y.',
                req: 'Syarat: minimal 3 pasangan data numerik.',
                accentColor: AppColors.yellow,
                icon: Icons.alt_route_rounded,
                type: 'korelasi',
              ),
              const SizedBox(height: 12),
              _buildAnalysisMethodCard(
                num: '04',
                title: 'REGRESI LINEAR SEDERHANA',
                summary:
                    'Menemukan rumus estimasi linear Y = a + bX serta proporsi variansi model (R²) dan p-value.',
                req: 'Syarat: minimal 3 pasangan data variabel bebas & terikat.',
                accentColor: AppColors.blue,
                icon: Icons.trending_up_rounded,
                type: 'regresi',
              ),
            ],
          ),
        ),

        const SizedBox(height: 28),

        // 4. 5 RIWAYAT TERSIMPAN TERBARU
        StaggeredEntrance(
          index: 5,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SectionHeader(
                title: 'Riwayat Terbaru',
                subtitle: 'Sesi analisis yang baru saja dilakukan',
              ),
              TextButton(
                onPressed: () => setState(() => _currentTab = 'riwayat'),
                child: Row(
                  children: [
                    Text(
                      'Lihat Semua',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: AppColors.blue,
                      ),
                    ),
                    const Icon(Icons.arrow_forward_rounded,
                        size: 16, color: AppColors.blue),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        StaggeredEntrance(
          index: 6,
          child: recentFive.isEmpty
              ? EmptyStateCard(
                  title: 'Belum Ada Riwayat Tersimpan',
                  description:
                      'Unggah berkas CSV atau pilih metode pengujian di atas untuk membuat analisis pertama Anda.',
                  actionLabel: 'Mulai Analisis Baru',
                  onAction: () => _navigateToNewAnalysis(),
                )
              : Column(
                  children: recentFive.map((item) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _buildHistoryCard(item),
                    );
                  }).toList(),
                ),
        ),

        const SizedBox(height: 60),
      ],
    );
  }

  /// Kartu Counter Metrik dengan AnimatedCounter
  Widget _buildMetricCard({
    required String title,
    required int value,
    required Color layerColor,
    required IconData icon,
    required Color iconColor,
  }) {
    return StackedCard(
      layerColors: [layerColor],
      offsetStep: const Offset(3.5, 3.5),
      radius: 18,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.muted,
                  letterSpacing: 0.3,
                ),
              ),
              Icon(icon, size: 16, color: iconColor),
            ],
          ),
          const SizedBox(height: 6),
          AnimatedCounter(
            value: value,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: AppColors.ink,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }

  /// Kartu Metode Analisis (01, 02, 03, 04)
  Widget _buildAnalysisMethodCard({
    required String num,
    required String title,
    required String summary,
    required String req,
    required Color accentColor,
    required IconData icon,
    required String type,
  }) {
    return StackedCard(
      layerColors: [accentColor],
      offsetStep: const Offset(4, 4),
      radius: 20,
      padding: const EdgeInsets.all(16),
      onTap: () => _navigateToNewAnalysis(type),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.ink, width: 2.0),
                ),
                child: Center(
                  child: Icon(
                    icon,
                    size: 20,
                    color: accentColor == AppColors.yellow
                        ? AppColors.ink
                        : Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    Text(
                      'MODUL $num',
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.muted,
                      ),
                    ),
                  ],
                ),
              ),
              SquircleIconButton(
                icon: Icons.arrow_forward_rounded,
                size: 34,
                iconSize: 18,
                radius: 10,
                color: AppColors.yellow,
                shadowOffset: const Offset(2, 2),
                onPressed: () => _navigateToNewAnalysis(type),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            summary,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              color: AppColors.muted,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F4F9),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFD6DBE5), width: 1.2),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline_rounded,
                    size: 13, color: AppColors.muted),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    req,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Tampilan Tab Riwayat Lengkap (Dengan Pencarian & Swipe to Delete)
  Widget _buildRiwayatContent() {
    return Column(
      children: [
        // Search Bar Neo-Brutalist
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: PremiumTextField(
            label: 'Cari Riwayat Analisis',
            hintText: 'Ketik nama sesi analisis...',
            controller: _searchCtrl,
            prefixIcon: Icons.search_rounded,
            onChanged: (v) {
              if (v.isEmpty) _fetchHistory();
            },
            onEditingComplete: () => _fetchHistory(_searchCtrl.text.trim()),
          ),
        ),

        // Daftar Riwayat yang Bisa Di-swipe
        Expanded(
          child: _isLoadingHistory
              ? ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: 4,
                  itemBuilder: (context, index) => const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: ShimmerSkeleton(
                      width: double.infinity,
                      height: 80,
                      radius: 20,
                    ),
                  ),
                )
              : _historyError != null
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline_rounded,
                                size: 42, color: AppColors.red),
                            const SizedBox(height: 12),
                            Text(
                              'Gagal memuat riwayat: $_historyError',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: AppColors.red,
                              ),
                            ),
                            const SizedBox(height: 16),
                            PrimaryButton(
                              label: 'Coba Lagi',
                              width: 140,
                              height: 42,
                              onPressed: () => _fetchHistory(),
                            ),
                          ],
                        ),
                      ),
                    )
                  : _history.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(24),
                          child: EmptyStateCard(
                            title: 'Riwayat Analisis Kosong',
                            description:
                                'Tidak ada sesi analisis yang cocok dengan pencarian Anda.',
                            actionLabel: 'Buat Analisis Sekarang',
                            onAction: () => _navigateToNewAnalysis(),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 8),
                          itemCount: _history.length,
                          itemBuilder: (context, index) {
                            final item = _history[index];
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 14),
                              child: Dismissible(
                                key: Key('history_item_${item.id}'),
                                direction: DismissDirection.endToStart,
                                confirmDismiss: (direction) async {
                                  await _deleteItem(item.id);
                                  return false; // Penghapusan ditangani oleh _deleteItem()
                                },
                                background: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors.red,
                                    borderRadius: BorderRadius.circular(22),
                                    border: Border.all(
                                        color: AppColors.ink, width: 2.2),
                                  ),
                                  alignment: Alignment.centerRight,
                                  padding: const EdgeInsets.only(right: 24),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'HAPUS',
                                        style: GoogleFonts.plusJakartaSans(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: Colors.white,
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Icon(Icons.delete_forever_rounded,
                                          color: Colors.white, size: 26),
                                    ],
                                  ),
                                ),
                                child: _buildHistoryCard(item),
                              ),
                            );
                          },
                        ),
        ),
      ],
    );
  }

  /// Widget Kartu Riwayat Individual dengan StackedCard
  Widget _buildHistoryCard(AnalysisRecord item) {
    final isSelesai = item.status.toLowerCase() == 'selesai';

    return StackedCard(
      layerColors: const [AppColors.yellow],
      offsetStep: const Offset(3.5, 3.5),
      radius: 20,
      padding: const EdgeInsets.all(16),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => AnalysisDetailScreen(
              analysisId: item.id,
              initialRecord: item,
            ),
          ),
        );
      },
      child: Row(
        children: [
          // Thumbnail Ikon Sesuai Jenis Analisis
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: isSelesai ? AppColors.blueSoft : AppColors.yellowSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.ink, width: 1.8),
            ),
            child: Icon(
              _getIconForAnalysis(item.jenisAnalisis),
              size: 22,
              color: isSelesai ? AppColors.blue : const Color(0xFF998A00),
            ),
          ),
          const SizedBox(width: 14),

          // Judul Sesi & Detail
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatChip(
                      label: item.status.toUpperCase(),
                      variant: isSelesai
                          ? StatChipVariant.green
                          : StatChipVariant.yellow,
                      fontSize: 9.5,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 7,
                        vertical: 2,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item.jenisAnalisis.toUpperCase(),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppColors.muted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  item.namaSesi,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.tanggal,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.muted,
                  ),
                ),
              ],
            ),
          ),

          // Tombol Buka Detail
          SquircleIconButton(
            icon: Icons.arrow_forward_rounded,
            size: 34,
            iconSize: 18,
            radius: 10,
            color: AppColors.yellow,
            shadowOffset: const Offset(2, 2),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => AnalysisDetailScreen(
                    analysisId: item.id,
                    initialRecord: item,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  IconData _getIconForAnalysis(String type) {
    switch (type.toLowerCase()) {
      case 'deskriptif':
        return Icons.bar_chart_rounded;
      case 'uji_t':
        return Icons.compare_arrows_rounded;
      case 'korelasi':
        return Icons.alt_route_rounded;
      case 'regresi':
        return Icons.trending_up_rounded;
      default:
        return Icons.auto_graph_rounded;
    }
  }
}
