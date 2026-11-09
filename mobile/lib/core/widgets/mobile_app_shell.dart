import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../theme/app_colors.dart';
import 'premium/premium_widgets.dart';
import '../../features/analysis/screens/new_analysis_screen.dart';
import '../../features/auth/screens/auth_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/showcase/screens/design_showcase_screen.dart';

/// AppShell Konsisten & Mewah untuk Seluruh Halaman Mobile (Soft Neo-Brutalism)
/// Menyediakan TopBar Neo-Brutalist, PillBottomNav Kapsul Biru-Kuning,
/// dan Modal Profile Drawer Bergaya Stacked Card.
class MobileAppShell extends StatefulWidget {
  final Widget body;
  final String currentRoute; // 'dasbor', 'analisis_baru', 'riwayat'
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final List<Widget>? extraActions;
  final ValueChanged<String>? onTabSelected;
  final bool showBottomNav;

  const MobileAppShell({
    super.key,
    required this.body,
    this.currentRoute = 'dasbor',
    this.showBackButton = false,
    this.onBackPressed,
    this.extraActions,
    this.onTabSelected,
    this.showBottomNav = true,
  });

  @override
  State<MobileAppShell> createState() => _MobileAppShellState();
}

class _MobileAppShellState extends State<MobileAppShell>
    with SingleTickerProviderStateMixin {
  bool _isMenuOpen = false;
  Map<String, dynamic>? _user;
  late AnimationController _drawerAnimCtrl;
  late Animation<double> _drawerSlideAnim;
  late Animation<double> _backdropFadeAnim;

  @override
  void initState() {
    super.initState();
    _loadUser();

    _drawerAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );

    _drawerSlideAnim = CurvedAnimation(
      parent: _drawerAnimCtrl,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );

    _backdropFadeAnim = CurvedAnimation(
      parent: _drawerAnimCtrl,
      curve: Curves.linear,
    );
  }

  @override
  void dispose() {
    _drawerAnimCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadUser() async {
    try {
      final p = await ApiService().getProfile();
      if (mounted) setState(() => _user = p);
    } catch (_) {}
  }

  void _toggleMenu() {
    setState(() {
      _isMenuOpen = !_isMenuOpen;
      if (_isMenuOpen) {
        _drawerAnimCtrl.forward();
      } else {
        _drawerAnimCtrl.reverse();
      }
    });
  }

  void _closeMenu() {
    if (_isMenuOpen) {
      _drawerAnimCtrl.reverse().then((_) {
        if (mounted) setState(() => _isMenuOpen = false);
      });
    }
  }

  Future<void> _handleLogout() async {
    _closeMenu();
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
          'Sesi Anda akan diakhiri dan Anda perlu masuk kembali.',
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
              'Ya, Keluar',
              style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800),
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

  void _navigateTo(String route) {
    _closeMenu();

    if (widget.onTabSelected != null && (route == 'dasbor' || route == 'riwayat')) {
      widget.onTabSelected!(route);
      return;
    }

    if (route == widget.currentRoute) return;

    if (route == 'dasbor') {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const DashboardScreen()),
        (r) => false,
      );
    } else if (route == 'analisis_baru') {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const NewAnalysisScreen()),
      );
    } else if (route == 'riwayat') {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => const DashboardScreen(initialTab: 'riwayat'),
        ),
        (r) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final userName = _user?['name'] ?? _user?['nama'] ?? 'Mahasiswa';
    final userEmail = _user?['email'] ?? 'mahasiswa@uns.ac.id';
    final userRole = _user?['role']?.toString().toUpperCase() ?? 'MAHASISWA';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Stack(
          children: [
            // Konten Layar dengan Pola Latar Belakang Neo-Brutalist
            DecorBackground(
              child: Column(
                children: [
                  // TopBar Neo-Brutalism Mewah
                  _buildTopBar(userName: userName),

                  // Konten Halaman Aktif
                  Expanded(child: widget.body),

                  // Pill Bottom Navigation Kapsul
                  if (widget.showBottomNav) _buildBottomNav(),
                ],
              ),
            ),

            // Backdrop Gelap Lembut saat Drawer Terbuka
            if (_isMenuOpen)
              Positioned.fill(
                child: GestureDetector(
                  onTap: _closeMenu,
                  child: AnimatedBuilder(
                    animation: _backdropFadeAnim,
                    builder: (context, _) => Container(
                      color: Colors.black.withValues(
                        alpha: 0.45 * _backdropFadeAnim.value,
                      ),
                    ),
                  ),
                ),
              ),

            // Drawer Panel Neo-Brutalist (Stacked Card Mengambang dari Kanan/Atas)
            if (_isMenuOpen)
              Positioned(
                top: 68,
                right: 14,
                left: 36,
                bottom: 24,
                child: AnimatedBuilder(
                  animation: _drawerSlideAnim,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(40 * (1 - _drawerSlideAnim.value), 0),
                      child: Opacity(
                        opacity: _drawerSlideAnim.value,
                        child: child,
                      ),
                    );
                  },
                  child: _buildDrawerContent(
                    userName: userName,
                    userEmail: userEmail,
                    userRole: userRole,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar({required String userName}) {
    return Container(
      height: 64,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.ink, width: 2.2),
        ),
      ),
      child: Row(
        children: [
          // Tombol Kembali (Opsional)
          if (widget.showBackButton) ...[
            SquircleIconButton(
              icon: Icons.arrow_back_rounded,
              size: 38,
              iconSize: 20,
              radius: 12,
              color: AppColors.yellow,
              shadowOffset: const Offset(2, 2),
              onPressed: widget.onBackPressed ?? () => Navigator.of(context).pop(),
            ),
            const SizedBox(width: 10),
          ],

          // Logo Gaussian Ber-outline Neo-Brutalism
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: AppColors.blueSoft,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.ink, width: 1.8),
            ),
            child: CustomPaint(
              size: const Size(20, 18),
              painter: _GaussianLogoPainter(),
            ),
          ),
          const SizedBox(width: 10),

          // Judul Brand "Statistics Story AI"
          Expanded(
            child: RichText(
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              text: TextSpan(
                text: 'Statistics Story ',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink,
                  letterSpacing: -0.2,
                ),
                children: [
                  TextSpan(
                    text: 'AI',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 15.5,
                      fontWeight: FontWeight.w900,
                      color: AppColors.blue,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Extra Action Icons
          if (widget.extraActions != null) ...widget.extraActions!,

          const SizedBox(width: 6),

          // Tombol Menu Profil / Drawer (Squircle Kuning Ber-outline)
          SquircleIconButton(
            icon: _isMenuOpen ? Icons.close_rounded : Icons.menu_rounded,
            size: 40,
            iconSize: 22,
            radius: 12,
            color: _isMenuOpen ? AppColors.redSoft : AppColors.yellow,
            iconColor: _isMenuOpen ? AppColors.red : AppColors.ink,
            shadowOffset: const Offset(2.5, 2.5),
            tooltip: 'Menu Akun',
            onPressed: _toggleMenu,
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return PillBottomNav(
      activeKey: widget.currentRoute,
      items: const [
        PillNavItem(
          keyName: 'dasbor',
          label: 'Dasbor',
          icon: Icons.grid_view_rounded,
        ),
        PillNavItem(
          keyName: 'analisis_baru',
          label: 'Analisis Baru',
          icon: Icons.add_circle_outline_rounded,
        ),
        PillNavItem(
          keyName: 'riwayat',
          label: 'Riwayat',
          icon: Icons.history_rounded,
        ),
      ],
      onSelect: _navigateTo,
    );
  }

  Widget _buildDrawerContent({
    required String userName,
    required String userEmail,
    required String userRole,
  }) {
    return StackedCard(
      layerColors: const [AppColors.blue, AppColors.yellow],
      offsetStep: const Offset(6, 6),
      radius: 24,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header Profil Pengguna
          Row(
            children: [
              // Avatar Squircle
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: AppColors.yellow,
                  borderRadius: BorderRadius.circular(16),
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
                    userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
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
                    Text(
                      userName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      userEmail,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11.5,
                        color: AppColors.muted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    StatChip(
                      label: userRole,
                      variant: StatChipVariant.blue,
                      fontSize: 10,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),
          const Divider(color: Color(0xFFE2E8F0), thickness: 1.5),
          const SizedBox(height: 12),

          // Menu Navigasi
          _buildDrawerMenuItem(
            label: 'Dasbor Utama',
            icon: Icons.grid_view_rounded,
            isActive: widget.currentRoute == 'dasbor',
            onTap: () => _navigateTo('dasbor'),
          ),
          const SizedBox(height: 8),

          _buildDrawerMenuItem(
            label: 'Analisis Baru',
            icon: Icons.add_chart_rounded,
            isActive: widget.currentRoute == 'analisis_baru',
            onTap: () => _navigateTo('analisis_baru'),
          ),
          const SizedBox(height: 8),

          _buildDrawerMenuItem(
            label: 'Riwayat Analisis',
            icon: Icons.history_edu_rounded,
            isActive: widget.currentRoute == 'riwayat',
            onTap: () => _navigateTo('riwayat'),
          ),
          const SizedBox(height: 8),

          // Shortcut Design Showcase
          _buildDrawerMenuItem(
            label: 'Design Showcase',
            icon: Icons.palette_outlined,
            isActive: false,
            onTap: () {
              _closeMenu();
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const DesignShowcaseScreen()),
              );
            },
          ),

          const Spacer(),

          // Tombol Keluar (Merah Neo-Brutalism)
          PrimaryButton(
            label: 'KELUAR DARI AKUN',
            variant: ButtonVariant.red,
            prefixIcon: Icons.logout_rounded,
            height: 48,
            onPressed: _handleLogout,
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerMenuItem({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 46,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: isActive ? AppColors.yellowSoft : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive ? AppColors.ink : Colors.transparent,
            width: 1.8,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isActive ? AppColors.blue : AppColors.ink,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13.5,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
            const Spacer(),
            if (isActive)
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                  color: AppColors.blue,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _GaussianLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.6
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final w = size.width;
    final h = size.height;

    canvas.drawLine(Offset(0, h * 0.9), Offset(w, h * 0.9), paint);

    path.moveTo(0, h * 0.9);
    path.cubicTo(w * 0.35, h * 0.9, w * 0.4, h * 0.1, w * 0.5, h * 0.1);
    path.cubicTo(w * 0.6, h * 0.1, w * 0.65, h * 0.9, w, h * 0.9);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
