import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';

class RoleItem {
  final String keyName;
  final String title;
  final String subtitle;
  final IconData icon;

  const RoleItem({
    required this.keyName,
    required this.title,
    required this.subtitle,
    required this.icon,
  });
}

/// Segmented Control Peran Pengguna dengan Indikator Geser Halus (Sliding Pill)
class RoleSelector extends StatelessWidget {
  final String selectedRole;
  final ValueChanged<String> onRoleSelected;

  const RoleSelector({
    super.key,
    required this.selectedRole,
    required this.onRoleSelected,
  });

  static const List<RoleItem> roles = [
    RoleItem(
      keyName: 'student',
      title: 'Mahasiswa',
      subtitle: 'Skripsi & Tugas',
      icon: Icons.school_outlined,
    ),
    RoleItem(
      keyName: 'lecturer',
      title: 'Dosen',
      subtitle: 'Riset & Ajar',
      icon: Icons.psychology_outlined,
    ),
    RoleItem(
      keyName: 'researcher',
      title: 'Peneliti',
      subtitle: 'Analisis Data',
      icon: Icons.science_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final activeIndex = roles.indexWhere((r) => r.keyName == selectedRole);
    final validIndex = activeIndex >= 0 ? activeIndex : 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'PERAN PENGGUNA',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
                letterSpacing: 0.4,
              ),
            ),
            Text(
              roles[validIndex].subtitle,
              style: GoogleFonts.inter(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: AppColors.blue,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // Sliding Segmented Control Bar
        LayoutBuilder(
          builder: (context, constraints) {
            final itemWidth = constraints.maxWidth / roles.length;

            return Container(
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.blueSoft,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.ink, width: 2.0),
              ),
              child: Stack(
                children: [
                  // Indikator Geser Kuning Neo-Brutalist
                  AnimatedPositioned(
                    duration: const Duration(milliseconds: 240),
                    curve: Curves.easeOutBack,
                    left: validIndex * itemWidth + 3,
                    top: 3,
                    bottom: 3,
                    width: itemWidth - 6,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.yellow,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.ink, width: 2.0),
                        boxShadow: const [
                          BoxShadow(
                            color: AppColors.ink,
                            offset: Offset(2, 2),
                            blurRadius: 0,
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Opsi Pilihan
                  Row(
                    children: roles.map((role) {
                      final isSelected = selectedRole == role.keyName;
                      return Expanded(
                        child: GestureDetector(
                          onTap: () {
                            if (!isSelected) {
                              HapticFeedback.selectionClick();
                              onRoleSelected(role.keyName);
                            }
                          },
                          behavior: HitTestBehavior.opaque,
                          child: Center(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  role.icon,
                                  size: 16,
                                  color: isSelected ? AppColors.ink : AppColors.muted,
                                ),
                                const SizedBox(width: 5),
                                Text(
                                  role.title,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12.5,
                                    fontWeight: isSelected
                                        ? FontWeight.w800
                                        : FontWeight.w600,
                                    color: isSelected
                                        ? AppColors.ink
                                        : AppColors.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
