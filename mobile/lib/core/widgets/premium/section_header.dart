import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

/// Header Seksi dengan Judul Tebal, Subjudul Abu, dan Aksen Squiggle Merah
class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final bool showSquiggle;
  final double titleSize;

  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.showSquiggle = true,
    this.titleSize = 20.0,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: titleSize,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                      letterSpacing: -0.4,
                    ),
                  ),
                  if (showSquiggle) ...[
                    const SizedBox(height: 3),
                    SizedBox(
                      width: 52,
                      height: 8,
                      child: SvgPicture.asset(
                        'assets/decor/squiggle.svg',
                        fit: BoxFit.contain,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            ?trailing,
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: GoogleFonts.inter(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.muted,
              height: 1.35,
            ),
          ),
        ],
      ],
    );
  }
}

