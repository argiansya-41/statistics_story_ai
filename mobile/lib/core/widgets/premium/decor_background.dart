import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../theme/app_colors.dart';

/// Latar Belakang Layar Mewah Bergaya Sticker Card / Neo-Brutalism
/// Menggabungkan pola grid titik halus dengan busur/blob mengambang lambat di tepi layar.
class DecorBackground extends StatefulWidget {
  final Widget child;
  final bool showRingArc;
  final bool showBlobs;
  final bool showDots;

  const DecorBackground({
    super.key,
    required this.child,
    this.showRingArc = true,
    this.showBlobs = true,
    this.showDots = true,
  });

  @override
  State<DecorBackground> createState() => _DecorBackgroundState();
}

class _DecorBackgroundState extends State<DecorBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _floatCtrl;
  late Animation<double> _floatAnim;

  @override
  void initState() {
    super.initState();
    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 7),
    )..repeat(reverse: true);

    _floatAnim = Tween<double>(begin: -6.0, end: 6.0).animate(
      CurvedAnimation(parent: _floatCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _floatCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final disableAnim = MediaQuery.maybeOf(context)?.disableAnimations ?? false;

    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.bg,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // 1. Pola Titik Halus (Dot Grid Pattern)
          if (widget.showDots)
            Positioned.fill(
              child: IgnorePointer(
                child: RepaintBoundary(
                  child: CustomPaint(
                    painter: _DotGridPainter(),
                  ),
                ),
              ),
            ),

          // 2. Lingkaran / Busur Besar di Tepi Layar dengan Float Lembut
          if (widget.showRingArc && !disableAnim)
            Positioned(
              top: -40,
              right: -50,
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _floatAnim,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, _floatAnim.value),
                      child: child,
                    );
                  },
                  child: RepaintBoundary(
                    child: Opacity(
                      opacity: 0.85,
                      child: SvgPicture.asset(
                        'assets/decor/ring_arc.svg',
                        width: 170,
                        height: 170,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // 3. Blob Aksen Lembut di Sudut Bawah Kiri
          if (widget.showBlobs && !disableAnim)
            Positioned(
              bottom: 40,
              left: -40,
              child: IgnorePointer(
                child: AnimatedBuilder(
                  animation: _floatAnim,
                  builder: (context, child) {
                    return Transform.translate(
                      offset: Offset(0, -_floatAnim.value * 0.8),
                      child: child,
                    );
                  },
                  child: RepaintBoundary(
                    child: Opacity(
                      opacity: 0.75,
                      child: SvgPicture.asset(
                        'assets/decor/blob_yellow.svg',
                        width: 140,
                        height: 140,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // 4. Konten Halaman Utama
          widget.child,
        ],
      ),
    );
  }
}

/// Painter Pola Grid Titik 60 FPS Sangat Ringan & Efisien
class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD6DBE5)
      ..style = PaintingStyle.fill;

    const double spacing = 24.0;
    const double radius = 1.3;

    for (double x = spacing; x < size.width; x += spacing) {
      for (double y = spacing; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

