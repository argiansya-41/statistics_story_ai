import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

class TabItem {
  final String keyName;
  final String label;
  final IconData? icon;

  const TabItem({
    required this.keyName,
    required this.label,
    this.icon,
  });
}

/// Tab Neo-Brutalism dengan Garis Bawah Kuning Tebal yang Meluncur Mulus
class UnderlineTabBar extends StatelessWidget {
  final String activeKey;
  final List<TabItem> tabs;
  final ValueChanged<String> onTabChanged;

  const UnderlineTabBar({
    super.key,
    required this.activeKey,
    required this.tabs,
    required this.onTabChanged,
  });

  @override
  Widget build(BuildContext context) {
    final activeIndex = tabs.indexWhere((t) => t.keyName == activeKey);
    final validIndex = activeIndex >= 0 ? activeIndex : 0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final tabCount = tabs.length;
        final tabWidth = constraints.maxWidth / tabCount;

        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: tabs.map((tab) {
                final isActive = tab.keyName == activeKey;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (!isActive) {
                        HapticFeedback.selectionClick();
                        onTabChanged(tab.keyName);
                      }
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (tab.icon != null) ...[
                            Icon(
                              tab.icon,
                              size: 18,
                              color: isActive ? AppColors.ink : AppColors.muted,
                            ),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            tab.label,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14,
                              fontWeight:
                                  isActive ? FontWeight.w800 : FontWeight.w600,
                              color: isActive ? AppColors.ink : AppColors.muted,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            // Base Gray Underline
            Stack(
              children: [
                Container(
                  height: 3,
                  width: double.infinity,
                  color: const Color(0xFFE2E8F0),
                ),

                // Animated Yellow Sliding Underline Indicator
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  left: validIndex * tabWidth,
                  width: tabWidth,
                  child: Center(
                    child: Container(
                      height: 5,
                      width: tabWidth * 0.75,
                      decoration: BoxDecoration(
                        color: AppColors.yellow,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppColors.ink, width: 1.2),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

