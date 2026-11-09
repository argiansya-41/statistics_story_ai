import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import 'primary_button.dart';

/// Kartu State Kosong (Empty State) Mewah Bergaya Sticker Card
class EmptyStateCard extends StatelessWidget {
  final String title;
  final String description;
  final String? actionLabel;
  final VoidCallback? onAction;
  final IconData? icon;

  const EmptyStateCard({
    super.key,
    required this.title,
    required this.description,
    this.actionLabel,
    this.onAction,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.ink, width: 2.2),
        boxShadow: const [
          BoxShadow(
            color: AppColors.yellow,
            offset: Offset(5, 5),
            blurRadius: 0,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Ilustrasi Dekoratif Sticker Bulat
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 84,
                height: 84,
                decoration: BoxDecoration(
                  color: AppColors.blueSoft,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.ink, width: 2.2),
                ),
                child: Center(
                  child: Icon(
                    icon ?? Icons.auto_graph_rounded,
                    size: 38,
                    color: AppColors.blue,
                  ),
                ),
              ),
              Positioned(
                top: 0,
                right: 0,
                child: SvgPicture.asset(
                  'assets/decor/sparkle.svg',
                  width: 26,
                  height: 26,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Judul
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 17,
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 8),

          // Deskripsi
          Text(
            description,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: AppColors.muted,
              height: 1.4,
            ),
          ),

          // Tombol Aksi
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 20),
            PrimaryButton(
              label: actionLabel!,
              onPressed: onAction,
              variant: ButtonVariant.yellow,
              prefixIcon: Icons.add_circle_outline_rounded,
              height: 46,
            ),
          ],
        ],
      ),
    );
  }
}

