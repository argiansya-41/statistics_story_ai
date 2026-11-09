import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_colors.dart';

/// Tombol Kotak Membulat (Squircle) Bergaya Neo-Brutalism
/// Warna kuning (default), outline hitam, offset shadow solid ink (3,3).
class SquircleIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final Color color;
  final Color iconColor;
  final double size;
  final double iconSize;
  final double radius;
  final String? tooltip;
  final Offset shadowOffset;

  const SquircleIconButton({
    super.key,
    required this.icon,
    required this.onPressed,
    this.color = AppColors.yellow,
    this.iconColor = AppColors.ink,
    this.size = 46.0,
    this.iconSize = 22.0,
    this.radius = 16.0,
    this.tooltip,
    this.shadowOffset = const Offset(3, 3),
  });

  @override
  State<SquircleIconButton> createState() => _SquircleIconButtonState();
}

class _SquircleIconButtonState extends State<SquircleIconButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnim = Tween<double>(begin: 1.0, end: 0.92).animate(
      CurvedAnimation(parent: _animCtrl, curve: Curves.easeOutQuad),
    );
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (widget.onPressed == null) return;
    HapticFeedback.selectionClick();
    _animCtrl.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    if (widget.onPressed == null) return;
    _animCtrl.reverse();
    widget.onPressed!();
  }

  void _handleTapCancel() {
    if (widget.onPressed == null) return;
    _animCtrl.reverse();
  }

  @override
  Widget build(BuildContext context) {
    Widget button = GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedBuilder(
        animation: _animCtrl,
        builder: (context, _) {
          final t = _animCtrl.value;
          final currentShadow = Offset(
            widget.shadowOffset.dx * (1 - t * 0.7),
            widget.shadowOffset.dy * (1 - t * 0.7),
          );

          return Transform.scale(
            scale: _scaleAnim.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                color: widget.color,
                borderRadius: BorderRadius.circular(widget.radius),
                border: Border.all(color: AppColors.ink, width: 2.0),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.ink,
                    offset: currentShadow,
                    blurRadius: 0,
                  ),
                ],
              ),
              child: Center(
                child: Icon(
                  widget.icon,
                  size: widget.iconSize,
                  color: widget.iconColor,
                ),
              ),
            ),
          );
        },
      ),
    );

    if (widget.tooltip != null) {
      return Tooltip(
        message: widget.tooltip!,
        child: button,
      );
    }
    return button;
  }
}

