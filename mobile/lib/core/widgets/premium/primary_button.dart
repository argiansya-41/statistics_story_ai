import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

enum ButtonVariant { yellow, blue, red, outline }

/// Tombol Utama Neo-Brutalism dengan Animasi Tekan & State Loading Memantul
class PrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final bool isLoading;
  final bool isDisabled;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final double height;
  final double? width;
  final double radius;
  final Offset shadowOffset;

  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.yellow,
    this.isLoading = false,
    this.isDisabled = false,
    this.prefixIcon,
    this.suffixIcon,
    this.height = 52.0,
    this.width,
    this.radius = 18.0,
    this.shadowOffset = const Offset(4, 4),
  });

  @override
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _pressCtrl;

  @override
  void initState() {
    super.initState();
    _pressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
  }

  @override
  void dispose() {
    _pressCtrl.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails _) {
    if (widget.isDisabled || widget.isLoading || widget.onPressed == null) return;
    HapticFeedback.selectionClick();
    _pressCtrl.forward();
  }

  void _handleTapUp(TapUpDetails _) {
    if (widget.isDisabled || widget.isLoading || widget.onPressed == null) return;
    _pressCtrl.reverse();
    widget.onPressed!();
  }

  void _handleTapCancel() {
    if (widget.isDisabled || widget.isLoading || widget.onPressed == null) return;
    _pressCtrl.reverse();
  }

  Color get _bgColor {
    if (widget.isDisabled) return const Color(0xFFE2E8F0);
    switch (widget.variant) {
      case ButtonVariant.yellow:
        return AppColors.yellow;
      case ButtonVariant.blue:
        return AppColors.blue;
      case ButtonVariant.red:
        return AppColors.red;
      case ButtonVariant.outline:
        return Colors.white;
    }
  }

  Color get _textColor {
    if (widget.isDisabled) return AppColors.muted;
    switch (widget.variant) {
      case ButtonVariant.yellow:
      case ButtonVariant.outline:
        return AppColors.ink;
      case ButtonVariant.blue:
      case ButtonVariant.red:
        return Colors.white;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      child: AnimatedBuilder(
        animation: _pressCtrl,
        builder: (context, _) {
          final t = _pressCtrl.value;
          final currentOffsetX = widget.shadowOffset.dx * (1 - t * 0.75);
          final currentOffsetY = widget.shadowOffset.dy * (1 - t * 0.75);

          return Transform.translate(
            offset: Offset(
              widget.shadowOffset.dx * t * 0.75,
              widget.shadowOffset.dy * t * 0.75,
            ),
            child: Container(
              height: widget.height,
              width: widget.width ?? double.infinity,
              decoration: BoxDecoration(
                color: _bgColor,
                borderRadius: BorderRadius.circular(widget.radius),
                border: Border.all(
                  color: widget.isDisabled ? AppColors.muted : AppColors.ink,
                  width: 2.2,
                ),
                boxShadow: widget.isDisabled
                    ? null
                    : [
                        BoxShadow(
                          color: AppColors.ink,
                          offset: Offset(currentOffsetX, currentOffsetY),
                          blurRadius: 0,
                        ),
                      ],
              ),
              child: Center(
                child: widget.isLoading
                    ? _buildBouncingDots()
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (widget.prefixIcon != null) ...[
                            Icon(widget.prefixIcon, size: 20, color: _textColor),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            widget.label,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: _textColor,
                              letterSpacing: 0.4,
                            ),
                          ),
                          if (widget.suffixIcon != null) ...[
                            const SizedBox(width: 8),
                            Icon(widget.suffixIcon, size: 20, color: _textColor),
                          ],
                        ],
                      ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBouncingDots() {
    return _BouncingDotsIndicator(dotColor: _textColor);
  }
}

class _BouncingDotsIndicator extends StatefulWidget {
  final Color dotColor;
  const _BouncingDotsIndicator({required this.dotColor});

  @override
  State<_BouncingDotsIndicator> createState() => _BouncingDotsIndicatorState();
}

class _BouncingDotsIndicatorState extends State<_BouncingDotsIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (index) {
            final delay = index * 0.2;
            final val = (_ctrl.value - delay) % 1.0;
            final bounce = (val < 0.5) ? -8.0 * (1.0 - (val * 2 - 1).abs()) : 0.0;

            return Transform.translate(
              offset: Offset(0, bounce),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: widget.dotColor,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.ink, width: 1.5),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}

