import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

enum StatChipVariant { blue, yellow, red, green, neutral }

/// Badge Kapsul Kecil Neo-Brutalism dengan Border Ink
class StatChip extends StatelessWidget {
  final String label;
  final IconData? icon;
  final StatChipVariant variant;
  final VoidCallback? onTap;
  final double fontSize;
  final EdgeInsetsGeometry padding;

  const StatChip({
    super.key,
    required this.label,
    this.icon,
    this.variant = StatChipVariant.neutral,
    this.onTap,
    this.fontSize = 11.5,
    this.padding = const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  });

  Color get _bg {
    switch (variant) {
      case StatChipVariant.blue:
        return AppColors.blueSoft;
      case StatChipVariant.yellow:
        return AppColors.yellowSoft;
      case StatChipVariant.red:
        return AppColors.redSoft;
      case StatChipVariant.green:
        return const Color(0xFFE6F9EE);
      case StatChipVariant.neutral:
        return Colors.white;
    }
  }

  Color get _fg {
    switch (variant) {
      case StatChipVariant.blue:
        return AppColors.blue;
      case StatChipVariant.yellow:
        return const Color(0xFF998A00);
      case StatChipVariant.red:
        return AppColors.red;
      case StatChipVariant.green:
        return AppColors.success;
      case StatChipVariant.neutral:
        return AppColors.ink;
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: _bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.ink, width: 1.6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: _fg),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: _fg,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(onTap: onTap, child: content);
    }
    return content;
  }
}

