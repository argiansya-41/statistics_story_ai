import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_app_shell.dart';
import '../../../core/widgets/premium/premium_widgets.dart';
import '../../analysis/screens/new_analysis_screen.dart';
import '../../auth/screens/auth_screen.dart';
import '../../dashboard/screens/dashboard_screen.dart';

/// Halaman Profil Pengguna Khusus Mobile (Dedicated Profile Screen)
/// Menyediakan ringkasan akun, statistik penggunaan, info institusi,
/// pengaturan preferensi, dan tombol keluar bergaya Soft Neo-Brutalism.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _isLoading = true;
  int _totalAnalyses = 0;
  int _completedAnalyses = 0;

  @override
  void initState() {
    super.initState();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() => _isLoading = true);
    try {
      final profile = await ApiService().getProfile();
      final history = await ApiService().getAnalysisHistory();

      if (mounted) {
        setState(() {
          _user = profile;
          _totalAnalyses = history.length;
          _completedAnalyses = history
              .where((r) => r.status.toLowerCase() == 'selesai')
              .length;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.ink, width: 2.2),
        ),
        title: Text(
          'KELUAR DARI APLIKASI?',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
        content: Text(
          'Sesi Anda akan diakhiri dan Anda perlu masuk kembali untuk mengakses analisis tersimpan.',
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
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppColors.ink, width: 2.0),
              ),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Ya, Keluar',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    await ApiService().clearAuth();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AuthScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final userName = _user?['name'] ?? _user?['nama'] ?? 'Pengguna';
    final userEmail = _user?['email'] ?? 'pengguna@uns.ac.id';
    final userRole = _user?['role']?.toString().toUpperCase() ?? 'MAHASISWA';
    final initialLetter =
        userName.trim().isNotEmpty ? userName.trim()[0].toUpperCase() : 'U';

    return MobileAppShell(
      currentRoute: 'profil',
      body: RefreshIndicator(
        onRefresh: _loadProfileData,
        color: AppColors.blue,
        backgroundColor: Colors.white,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: ClampingScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Kartu Utama Profil (Hero Card)
              StackedCard(
                layerColors: const [AppColors.blue, AppColors.yellow],
                offsetStep: const Offset(4, 4),
                radius: 20,
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Avatar & Info Utama
                    Row(
                      children: [
                        // Avatar Squircle
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.yellow,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppColors.ink, width: 2.2),
                            boxShadow: const [
                              BoxShadow(
                                color: AppColors.ink,
                                offset: Offset(2.5, 2.5),
                                blurRadius: 0,
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              initialLetter,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                userName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.ink,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                userEmail,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 12.5,
                                  color: AppColors.muted,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: [
                                  StatChip(
                                    label: userRole,
                                    variant: StatChipVariant.blue,
                                    fontSize: 10,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                  ),
                                  const StatChip(
                                    label: '● AKTIF',
                                    variant: StatChipVariant.green,
                                    fontSize: 10,
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),
                    const Divider(color: Color(0xFFE2E8F0), thickness: 1.5),
                    const SizedBox(height: 14),

                    // Quick Stats Row (2 Kolom Rapi & Luas)
                    Row(
                      children: [
                        _buildQuickStat(
                          label: 'TOTAL ANALISIS',
                          value: _isLoading ? '...' : '$_totalAnalyses',
                          icon: Icons.analytics_outlined,
                        ),
                        Container(
                          width: 1.5,
                          height: 38,
                          color: const Color(0xFFE2E8F0),
                        ),
                        _buildQuickStat(
                          label: 'SELESAI DIANALISIS',
                          value: _isLoading ? '...' : '$_completedAnalyses',
                          icon: Icons.check_circle_outline_rounded,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 2. Section Header: Menu Navigasi Cepat
              const SectionHeader(
                title: 'AKSI CEPAT',
                subtitle: 'Akses instan modul dan alur kerja utama',
              ),

              const SizedBox(height: 12),

              _buildMenuCard(
                icon: Icons.add_chart_rounded,
                iconColor: AppColors.blue,
                title: 'Mulai Analisis Baru',
                description: 'Unggah dataset CSV/Excel dan jalankan uji statistik',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const NewAnalysisScreen(),
                    ),
                  );
                },
              ),

              const SizedBox(height: 10),

              _buildMenuCard(
                icon: Icons.history_edu_rounded,
                iconColor: AppColors.yellow,
                title: 'Riwayat Analisis Saya',
                description: 'Lihat daftar pengujian dan ekspor narasi sebelumnya',
                onTap: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                      builder: (_) =>
                          const DashboardScreen(initialTab: 'riwayat'),
                    ),
                    (r) => false,
                  );
                },
              ),

              const SizedBox(height: 28),

              // 3. Tombol Logout (Merah Neo-Brutalist)
              PrimaryButton(
                label: 'KELUAR DARI AKUN',
                variant: ButtonVariant.red,
                prefixIcon: Icons.logout_rounded,
                height: 50,
                onPressed: _handleLogout,
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStat({
    required String label,
    required String value,
    required IconData icon,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 18, color: AppColors.blue),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.spaceMono(
              fontSize: 8.5,
              fontWeight: FontWeight.w700,
              color: AppColors.muted,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.ink, width: 2.0),
          boxShadow: const [
            BoxShadow(
              color: AppColors.ink,
              offset: Offset(3, 3),
              blurRadius: 0,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconColor == AppColors.yellow
                    ? AppColors.yellowSoft
                    : (iconColor == AppColors.blue
                        ? AppColors.blueSoft
                        : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.ink, width: 1.8),
              ),
              child: Center(
                child: Icon(
                  icon,
                  size: 22,
                  color: iconColor == AppColors.yellow
                      ? AppColors.ink
                      : iconColor,
                ),
              ),
            ),
            const SizedBox(width: 14),
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
                  const SizedBox(height: 2),
                  Text(
                    description,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: AppColors.muted,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.chevron_right_rounded,
              size: 22,
              color: AppColors.ink,
            ),
          ],
        ),
      ),
    );
  }
}
