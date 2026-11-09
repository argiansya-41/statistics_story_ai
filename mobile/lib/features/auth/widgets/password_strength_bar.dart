import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

/// Bar Indikator Kekuatan Kata Sandi Bergaya Sticker Neo-Brutalism
class PasswordStrengthBar extends StatelessWidget {
  final String password;

  const PasswordStrengthBar({super.key, required this.password});

  int get _score {
    if (password.isEmpty) return 0;
    int score = 0;
    if (password.length >= 8) score++;
    if (RegExp(r'[A-Z]').hasMatch(password) && RegExp(r'[a-z]').hasMatch(password)) score++;
    if (RegExp(r'[0-9]').hasMatch(password)) score++;
    if (RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(password)) score++;
    return score;
  }

  String get _label {
    switch (_score) {
      case 1:
        return 'LEMAH';
      case 2:
        return 'CUKUP';
      case 3:
        return 'KUAT';
      case 4:
        return 'SANGAT KUAT';
      default:
        return 'BELUM DIISI';
    }
  }

  Color get _color {
    switch (_score) {
      case 1:
        return AppColors.red;
      case 2:
        return const Color(0xFFFF9900);
      case 3:
        return AppColors.blue;
      case 4:
        return AppColors.success;
      default:
        return const Color(0xFFCBD5E1);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'KEKUATAN KATA SANDI',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.muted,
                letterSpacing: 0.4,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _color.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: _color, width: 1.5),
              ),
              child: Text(
                _label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  color: _color,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // 4 Segmen Bar Neo-Brutalist
        Row(
          children: List.generate(4, (index) {
            final isFilled = index < _score;
            return Expanded(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                margin: EdgeInsets.only(right: index == 3 ? 0 : 6),
                height: 8,
                decoration: BoxDecoration(
                  color: isFilled ? _color : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: isFilled ? AppColors.ink : const Color(0xFFCBD5E1),
                    width: 1.4,
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}
