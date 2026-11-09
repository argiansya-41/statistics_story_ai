import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/screens/auth_screen.dart';
import '../../auth/widgets/helm_mascot.dart';
import '../../dashboard/screens/dashboard_screen.dart';

/// Preloader Mewah Playful-Premium:
/// 1. Logo Gaussian & Maskot di tengah dengan 3 busur (Biru, Kuning, Merah) berputar beda kecepatan.
/// 2. Progress bar bergaya Pill Kapsul Neo-Brutalist.
/// 3. Selesai (100%) -> Pecah jadi konfeti dan transisi halus ke Auth / Dasbor.
class PreloaderScreen extends StatefulWidget {
  const PreloaderScreen({super.key});

  @override
  State<PreloaderScreen> createState() => _PreloaderScreenState();
}

class _PreloaderScreenState extends State<PreloaderScreen>
    with TickerProviderStateMixin {
  late AnimationController _loadCtrl;
  late Animation<double> _progressAnim;

  late AnimationController _spinCtrl;
  late AnimationController _burstCtrl;
  late Animation<double> _burstAnim;

  bool _isAuthed = false;
  bool _isBursting = false;

  @override
  void initState() {
    super.initState();

    // 1. Controller Animasi Progres Pemuatan (2.2 detik)
    _loadCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    );
    _progressAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _loadCtrl, curve: Curves.easeInOutCubic),
    );

    // 2. Controller Rotasi 3 Busur Kontinu
    _spinCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    // 3. Controller Ledakan Konfeti
    _burstCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
    _burstAnim = CurvedAnimation(
      parent: _burstCtrl,
      curve: Curves.easeOutBack,
    );

    _startLoadingProcess();
  }

  Future<void> _startLoadingProcess() async {
    try {
      _isAuthed = await ApiService().isAuthenticated();
    } catch (_) {
      _isAuthed = false;
    }

    if (!mounted) return;
    _loadCtrl.forward();

    _loadCtrl.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        setState(() => _isBursting = true);
        _burstCtrl.forward().then((_) {
          _navigateToNextScreen();
        });
      }
    });
  }

  void _navigateToNextScreen() {
    if (!mounted) return;
    final nextScreen = _isAuthed ? const DashboardScreen() : const AuthScreen();

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 400),
        pageBuilder: (context, a1, a2) => nextScreen,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(
            opacity: CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            ),
            child: ScaleTransition(
              scale: Tween<double>(begin: 0.95, end: 1.0).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
              ),
              child: child,
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _loadCtrl.dispose();
    _spinCtrl.dispose();
    _burstCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        children: [
          // A. Latar Grid Titik Halus
          Positioned.fill(
            child: RepaintBoundary(
              child: CustomPaint(
                painter: _DotsPainter(),
              ),
            ),
          ),

          // B. Konten Pusat: Logo/Maskot + 3 Busur Berputar (Center Horisontal & Vertikal Sempurna)
          Positioned.fill(
            child: SafeArea(
              child: Center(
                child: SizedBox(
                  width: double.infinity,
                  child: AnimatedBuilder(
                    animation:
                        Listenable.merge([_loadCtrl, _spinCtrl, _burstCtrl]),
                    builder: (context, _) {
                      final p = _progressAnim.value;
                      final spin = _spinCtrl.value;
                      final burst = _burstAnim.value;

                      // Pergantian Maskot Sesuai Tahap (Sigi -> Mu -> Quin)
                      MascotChar activeChar;
                      Color activeColor;
                      String characterName;

                      if (p < 0.38) {
                        activeChar = MascotChar.sigi;
                        activeColor = AppColors.blue;
                        characterName = 'SIGI • INTERPRETASI CERDAS';
                      } else if (p < 0.72) {
                        activeChar = MascotChar.mu;
                        activeColor = AppColors.red;
                        characterName = 'MU • PERHITUNGAN PRESISI';
                      } else {
                        activeChar = MascotChar.quin;
                        activeColor = AppColors.yellow;
                        characterName = 'QUIN • WAWASAN KILAT';
                      }

                      return Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Pusat Logo dengan 3 Busur Berputar & Efek Ledakan
                          SizedBox(
                            width: 260,
                            height: 260,
                            child: Stack(
                              alignment: Alignment.center,
                              clipBehavior: Clip.none,
                              children: [
                                // 3 Busur Berputar Mengelilingi Pusat
                                if (!_isBursting)
                                  CustomPaint(
                                    size: const Size(260, 260),
                                    painter: _RotatingArcsPainter(spin: spin),
                                  ),

                                // Saat Burst (100%): Konfeti Memancar ke Segala Arah
                                if (_isBursting) ...[
                                  Transform.scale(
                                    scale: 1.0 + burst * 1.5,
                                    child: Opacity(
                                      opacity:
                                          (1.0 - burst * 0.8).clamp(0.0, 1.0),
                                      child: SvgPicture.asset(
                                        'assets/decor/confetti.svg',
                                        width: 280,
                                        height: 280,
                                        fit: BoxFit.contain,
                                      ),
                                    ),
                                  ),
                                  CustomPaint(
                                    size: const Size(260, 260),
                                    painter:
                                        _ConfettiBurstPainter(progress: burst),
                                  ),
                                ],

                                // Kartu Pusat Bulat Neo-Brutalist
                                Container(
                                  width: 140,
                                  height: 140,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                        color: AppColors.ink, width: 2.5),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: AppColors.yellow,
                                        offset: Offset(5, 5),
                                        blurRadius: 0,
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: HelmMascot(
                                      character: activeChar,
                                      expression: p > 0.9
                                          ? MascotExpression.happy
                                          : MascotExpression.smile,
                                      size: 96,
                                      isBobbing: true,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 28),

                          // Nama Maskot / Subjudul
                          Text(
                            characterName,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                              color: activeColor == AppColors.yellow
                                  ? const Color(0xFF998A00)
                                  : activeColor,
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Progress Bar Kapsul (Pill Bar) Neo-Brutalism
                          Container(
                            width: 280,
                            height: 32,
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border:
                                  Border.all(color: AppColors.ink, width: 2.2),
                              boxShadow: const [
                                BoxShadow(
                                  color: AppColors.ink,
                                  offset: Offset(3, 3),
                                  blurRadius: 0,
                                ),
                              ],
                            ),
                            child: Stack(
                              children: [
                                // Isi Progress Biru
                                FractionallySizedBox(
                                  widthFactor: p.clamp(0.05, 1.0),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.blue,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                  ),
                                ),

                                // Indikator Titik Kuning di Ujung Bar
                                Align(
                                  alignment: Alignment(
                                      (-1.0 + (p * 2.0)).clamp(-1.0, 1.0), 0),
                                  child: Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: AppColors.yellow,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                          color: AppColors.ink, width: 1.8),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Persentase & Label Aplikasi
                          Text(
                            '${(p * 100).toInt()}% • MEMUAT SISTEM',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.jetBrainsMono(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.0,
                              color: AppColors.ink,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Painter 3 Busur Konsentris Berputar (Biru, Kuning, Merah)
class _RotatingArcsPainter extends CustomPainter {
  final double spin;

  _RotatingArcsPainter({required this.spin});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    // 1. Busur Biru (Radius Luar)
    final paintBlue = Paint()
      ..color = AppColors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.6
      ..strokeCap = StrokeCap.round;

    final angle1 = spin * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: 98),
      angle1,
      math.pi * 0.9,
      false,
      paintBlue,
    );

    // 2. Busur Kuning (Radius Tengah, Berlawanan Arah)
    final paintYellow = Paint()
      ..color = AppColors.yellow
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.8
      ..strokeCap = StrokeCap.round;

    final angle2 = -spin * 2 * math.pi * 0.75 + 1.2;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: 86),
      angle2,
      math.pi * 0.75,
      false,
      paintYellow,
    );

    // 3. Busur Merah (Radius Dalam, Lebih Cepat)
    final paintRed = Paint()
      ..color = AppColors.red
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.2
      ..strokeCap = StrokeCap.round;

    final angle3 = spin * 2 * math.pi * 1.35 + 2.5;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: 76),
      angle3,
      math.pi * 0.6,
      false,
      paintRed,
    );
  }

  @override
  bool shouldRepaint(covariant _RotatingArcsPainter oldDelegate) =>
      oldDelegate.spin != spin;
}

/// Painter Ledakan Konfeti Neo-Brutalism (Serpihan Biru, Kuning, Merah)
class _ConfettiBurstPainter extends CustomPainter {
  final double progress;

  _ConfettiBurstPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final colors = [AppColors.blue, AppColors.yellow, AppColors.red, AppColors.ink];

    for (int i = 0; i < 16; i++) {
      final angle = (i / 16) * 2 * math.pi;
      final distance = 70 + (progress * 85) + (i % 3) * 15;
      final x = center.dx + math.cos(angle) * distance;
      final y = center.dy + math.sin(angle) * distance;

      final paint = Paint()
        ..color = colors[i % colors.length]
        ..style = PaintingStyle.fill;

      final borderPaint = Paint()
        ..color = AppColors.ink
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2;

      if (i % 2 == 0) {
        canvas.drawCircle(Offset(x, y), 5.0, paint);
        canvas.drawCircle(Offset(x, y), 5.0, borderPaint);
      } else {
        canvas.drawRect(
          Rect.fromCenter(center: Offset(x, y), width: 8, height: 8),
          paint,
        );
        canvas.drawRect(
          Rect.fromCenter(center: Offset(x, y), width: 8, height: 8),
          borderPaint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiBurstPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _DotsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD6DBE5)
      ..style = PaintingStyle.fill;

    const double spacing = 24.0;
    for (double x = spacing; x < size.width; x += spacing) {
      for (double y = spacing; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 1.3, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
