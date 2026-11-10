import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_colors.dart';
import 'premium/premium_widgets.dart';
import '../../features/analysis/screens/new_analysis_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/profile/screens/profile_screen.dart';

/// AppShell Konsisten & Mewah untuk Seluruh Halaman Mobile (Soft Neo-Brutalism)
/// Menyediakan TopBar Neo-Brutalist dan PillBottomNav Kapsul Biru-Kuning
/// dengan 4 menu utama: Dasbor, Analisis Baru, Riwayat, dan Profil.
class MobileAppShell extends StatefulWidget {
  final Widget body;
  final String currentRoute; // 'dasbor', 'analisis_baru', 'riwayat', 'profil'
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

class _MobileAppShellState extends State<MobileAppShell> {
  void _navigateTo(String route) {
    if (widget.onTabSelected != null &&
        (route == 'dasbor' || route == 'riwayat')) {
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
    } else if (route == 'profil') {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const ProfileScreen()),
        (r) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Konten Layar dengan Pola Latar Belakang Neo-Brutalist
            DecorBackground(
              child: Column(
                children: [
                  // TopBar Neo-Brutalism Mewah
                  _buildTopBar(),

                  // Konten Halaman Aktif
                  Expanded(child: widget.body),

                  // Pill Bottom Navigation Kapsul
                  if (widget.showBottomNav) _buildBottomNav(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopBar() {
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
              onPressed:
                  widget.onBackPressed ?? () => Navigator.of(context).pop(),
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
        PillNavItem(
          keyName: 'profil',
          label: 'Profil',
          icon: Icons.person_outline_rounded,
          activeIcon: Icons.person_rounded,
        ),
      ],
      onSelect: _navigateTo,
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
