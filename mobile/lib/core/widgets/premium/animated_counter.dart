import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

/// Angka Statistik Beranimasi Menghitung Naik dari Nol (Count-Up Animation)
class AnimatedCounter extends StatelessWidget {
  final num value;
  final String prefix;
  final String suffix;
  final TextStyle? style;
  final Duration duration;
  final int fractionDigits;

  const AnimatedCounter({
    super.key,
    required this.value,
    this.prefix = '',
    this.suffix = '',
    this.style,
    this.duration = const Duration(milliseconds: 1100),
    this.fractionDigits = 0,
  });

  @override
  Widget build(BuildContext context) {
    final defaultStyle = GoogleFonts.jetBrainsMono(
      fontSize: 28,
      fontWeight: FontWeight.w800,
      color: AppColors.ink,
      letterSpacing: -0.5,
    );

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: value.toDouble()),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, val, _) {
        final text = fractionDigits > 0
            ? val.toStringAsFixed(fractionDigits)
            : val.round().toString();

        return Text(
          '$prefix$text$suffix',
          style: style ?? defaultStyle,
        );
      },
    );
  }
}

