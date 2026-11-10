import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

class PillNavItem {
  final String keyName;
  final String label;
  final IconData icon;
  final IconData? activeIcon;
  final Widget? customWidget;
  final Widget? activeCustomWidget;

  const PillNavItem({
    required this.keyName,
    required this.label,
    required this.icon,
    this.activeIcon,
    this.customWidget,
    this.activeCustomWidget,
  });
}

/// Bottom Navigation Kapsul Mewah (Pill Bottom Nav)
/// Kapsul biru, border ink tebal, offset shadow kuning solid.
/// Item aktif ditandai lingkaran kuning dengan animasi "pop up" spring.
class PillBottomNav extends StatelessWidget {
  final String activeKey;
  final List<PillNavItem> items;
  final ValueChanged<String> onSelect;

  const PillBottomNav({
    super.key,
    required this.activeKey,
    required this.items,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Lapisan Offset Kuning di Belakang
          Positioned.fill(
            child: Transform.translate(
              offset: const Offset(4, 4),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.yellow,
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(color: AppColors.ink, width: 2.2),
                ),
              ),
            ),
          ),

          // Kapsul Utama Biru
          Container(
            height: 68,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.blue,
              borderRadius: BorderRadius.circular(36),
              border: Border.all(color: AppColors.ink, width: 2.2),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: items.map((item) {
                final isActive = item.keyName == activeKey;
                return _buildNavItem(context, item, isActive);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, PillNavItem item, bool isActive) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onSelect(item.keyName);
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutBack,
        transform: Matrix4.translationValues(0, isActive ? -4 : 0, 0),
        padding: EdgeInsets.symmetric(
          horizontal: isActive ? 14 : 12,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: isActive ? AppColors.yellow : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
          border: isActive
              ? Border.all(color: AppColors.ink, width: 2.0)
              : Border.all(color: Colors.transparent, width: 2.0),
          boxShadow: isActive
              ? const [
                  BoxShadow(
                    color: AppColors.ink,
                    offset: Offset(2, 2),
                    blurRadius: 0,
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            (isActive ? item.activeCustomWidget : item.customWidget) ??
                Icon(
                  isActive ? (item.activeIcon ?? item.icon) : item.icon,
                  size: 22,
                  color: isActive
                      ? AppColors.ink
                      : Colors.white.withValues(alpha: 0.9),
                ),
            AnimatedCrossFade(
              duration: const Duration(milliseconds: 200),
              crossFadeState: isActive
                  ? CrossFadeState.showSecond
                  : CrossFadeState.showFirst,
              firstChild: const SizedBox.shrink(),
              secondChild: Padding(
                padding: const EdgeInsets.only(left: 6),
                child: Text(
                  item.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

