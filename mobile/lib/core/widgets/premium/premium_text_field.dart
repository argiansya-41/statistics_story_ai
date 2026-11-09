import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';

/// Text Field Neo-Brutalism dengan Animasi Fokus Berwarna & Shake Animasi Error
class PremiumTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String label;
  final String? hintText;
  final IconData? prefixIcon;
  final Color prefixBoxColor;
  final bool isPassword;
  final TextInputType keyboardType;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final FocusNode? focusNode;
  final VoidCallback? onEditingComplete;
  final bool autofocus;

  const PremiumTextField({
    super.key,
    this.controller,
    required this.label,
    this.hintText,
    this.prefixIcon,
    this.prefixBoxColor = AppColors.yellowSoft,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.onChanged,
    this.focusNode,
    this.onEditingComplete,
    this.autofocus = false,
  });

  @override
  State<PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<PremiumTextField>
    with SingleTickerProviderStateMixin {
  late FocusNode _internalFocusNode;
  bool _isFocused = false;
  bool _obscureText = true;
  late AnimationController _shakeCtrl;

  FocusNode get _effectiveFocusNode => widget.focusNode ?? _internalFocusNode;

  @override
  void initState() {
    super.initState();
    _internalFocusNode = FocusNode();
    _effectiveFocusNode.addListener(_handleFocusChange);

    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
  }

  @override
  void didUpdateWidget(PremiumTextField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.errorText != null && widget.errorText != oldWidget.errorText) {
      _shakeCtrl.forward(from: 0.0);
      HapticFeedback.lightImpact();
    }
  }

  void _handleFocusChange() {
    if (mounted) {
      setState(() => _isFocused = _effectiveFocusNode.hasFocus);
    }
  }

  @override
  void dispose() {
    _effectiveFocusNode.removeListener(_handleFocusChange);
    if (widget.focusNode == null) {
      _internalFocusNode.dispose();
    }
    _shakeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;

    return AnimatedBuilder(
      animation: _shakeCtrl,
      builder: (context, child) {
        // Shake oscillation curve (sinusoidal decay)
        final sine = math.sin(_shakeCtrl.value * math.pi * 5) * (1 - _shakeCtrl.value);
        final shakeOffset = sine * 9.0;

        return Transform.translate(
          offset: Offset(shakeOffset, 0),
          child: child,
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label Field
          Text(
            widget.label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: hasError ? AppColors.red : AppColors.ink,
              letterSpacing: 0.2,
            ),
          ),
          const SizedBox(height: 7),

          // Container Field dengan Layered Offset Shadow saat Fokus
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Lapisan Offset Kuning / Merah Solid di Belakang saat Fokus atau Error
              if (_isFocused || hasError)
                Positioned.fill(
                  child: Transform.translate(
                    offset: const Offset(4, 4),
                    child: Container(
                      decoration: BoxDecoration(
                        color: hasError ? AppColors.redSoft : AppColors.yellow,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(
                          color: AppColors.ink,
                          width: 2.0,
                        ),
                      ),
                    ),
                  ),
                ),

              // Kotak Input Utama
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: hasError
                        ? AppColors.red
                        : _isFocused
                            ? AppColors.blue
                            : AppColors.ink,
                    width: 2.2,
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                child: Row(
                  children: [
                    // Prefix Icon Kotak Berwarna
                    if (widget.prefixIcon != null) ...[
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: hasError
                              ? AppColors.redSoft
                              : _isFocused
                                  ? AppColors.blueSoft
                                  : widget.prefixBoxColor,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: hasError
                                ? AppColors.red
                                : _isFocused
                                    ? AppColors.blue
                                    : AppColors.ink,
                            width: 1.8,
                          ),
                        ),
                        child: Icon(
                          widget.prefixIcon,
                          size: 18,
                          color: hasError
                              ? AppColors.red
                              : _isFocused
                                  ? AppColors.blue
                                  : AppColors.ink,
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],

                    // Input Text
                    Expanded(
                      child: TextField(
                        controller: widget.controller,
                        focusNode: _effectiveFocusNode,
                        autofocus: widget.autofocus,
                        obscureText: widget.isPassword && _obscureText,
                        keyboardType: widget.keyboardType,
                        onChanged: widget.onChanged,
                        onEditingComplete: widget.onEditingComplete,
                        style: GoogleFonts.inter(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink,
                        ),
                        decoration: InputDecoration(
                          hintText: widget.hintText,
                          hintStyle: GoogleFonts.inter(
                            fontSize: 14,
                            color: AppColors.muted,
                            fontWeight: FontWeight.w400,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),

                    // Password Toggle Icon
                    if (widget.isPassword)
                      IconButton(
                        icon: Icon(
                          _obscureText
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                          color: AppColors.ink,
                        ),
                        onPressed: () {
                          HapticFeedback.selectionClick();
                          setState(() => _obscureText = !_obscureText);
                        },
                      ),
                  ],
                ),
              ),
            ],
          ),

          // Pesan Error jika Ada
          if (hasError)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded,
                      size: 14, color: AppColors.red),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      widget.errorText!,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.red,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

