import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../auth/widgets/helm_mascot.dart';

/// Panggung Maskot Interaktif Mewah Neo-Brutalism (Sigi, Mu, Quin)
class AuthStage extends StatelessWidget {
  final String speechBubble;
  final MascotExpression sigiExpression;
  final MascotExpression muExpression;
  final MascotExpression quinExpression;
  final bool isLogin;
  final VoidCallback? onToggleLang;
  final String lang;

  const AuthStage({
    super.key,
    required this.speechBubble,
    this.sigiExpression = MascotExpression.smile,
    this.muExpression = MascotExpression.smile,
    this.quinExpression = MascotExpression.smile,
    this.isLogin = true,
    this.onToggleLang,
    this.lang = 'ID',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(
          bottom: BorderSide(color: AppColors.ink, width: 2.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Top Logo Box & Language Switcher
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: AppColors.blueSoft,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.ink, width: 1.8),
                      ),
                      child: CustomPaint(
                        size: const Size(18, 16),
                        painter: _GaussianLogoPainter(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    RichText(
                      text: TextSpan(
                        text: 'Statistics Story ',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink,
                        ),
                        children: const [
                          TextSpan(
                            text: 'AI',
                            style: TextStyle(
                              color: AppColors.blue,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Language Toggle Pill
                GestureDetector(
                  onTap: onToggleLang,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.yellow,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.ink, width: 1.8),
                      boxShadow: const [
                        BoxShadow(
                          color: AppColors.ink,
                          offset: Offset(2, 2),
                          blurRadius: 0,
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.language_rounded, size: 14, color: AppColors.ink),
                        const SizedBox(width: 4),
                        Text(
                          lang,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 2. Headline Bertingkat
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isLogin ? AppColors.blue : AppColors.yellow,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.ink, width: 2.0),
                        boxShadow: const [
                          BoxShadow(
                            color: AppColors.ink,
                            offset: Offset(2.5, 2.5),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                      child: Text(
                        isLogin
                            ? (lang == 'ID' ? 'Selamat Datang Kembali' : 'Welcome Back')
                            : (lang == 'ID' ? 'Daftar Akun Baru' : 'Create Account'),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: isLogin ? Colors.white : AppColors.ink,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  isLogin
                      ? (lang == 'ID'
                          ? 'Angka-angkamu sudah siap bercerita hari ini.'
                          : 'Your data is ready to tell its story today.')
                      : (lang == 'ID'
                          ? 'Daftarkan dirimu dan temukan wawasan statistik cerdas.'
                          : 'Join us and uncover brilliant statistical insights.'),
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.muted,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 3. Dynamic Speech Bubble
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.yellowSoft,
                borderRadius: BorderRadius.circular(14),
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
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.chat_bubble_outline_rounded,
                      size: 14, color: AppColors.ink),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      speechBubble,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // 4. Barisan 3 Maskot Interaktif (Sigi, Mu, Quin)
          SizedBox(
            height: 110,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                // Maskot SIGI (Biru)
                _buildMascotWrapper(
                  character: MascotChar.sigi,
                  expression: sigiExpression,
                  name: 'SIGI',
                  color: AppColors.blue,
                ),
                const SizedBox(width: 24),

                // Maskot MU (Merah)
                _buildMascotWrapper(
                  character: MascotChar.mu,
                  expression: muExpression,
                  name: 'MU',
                  color: AppColors.red,
                ),
                const SizedBox(width: 24),

                // Maskot QUIN (Kuning)
                _buildMascotWrapper(
                  character: MascotChar.quin,
                  expression: quinExpression,
                  name: 'QUIN',
                  color: const Color(0xFFC4B000),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildMascotWrapper({
    required MascotChar character,
    required MascotExpression expression,
    required String name,
    required Color color,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        HelmMascot(
          character: character,
          expression: expression,
          size: 78,
          isBobbing: true,
        ),
        const SizedBox(height: 2),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: color, width: 1.2),
          ),
          child: Text(
            name,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ),
      ],
    );
  }
}

class _GaussianLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.blue
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
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
