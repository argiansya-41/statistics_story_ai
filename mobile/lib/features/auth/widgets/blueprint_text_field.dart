import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/colors.dart';

class BlueprintTextField extends StatefulWidget {
  final String label;
  final String hintText;
  final TextEditingController controller;
  final bool isPassword;
  final TextInputType keyboardType;
  final String? errorText;
  final Color accentColor;
  final Widget? suffix;
  final void Function(String)? onChanged;
  final VoidCallback? onFocus;
  final ValueChanged<bool>? onVisibilityChanged;

  const BlueprintTextField({
    super.key,
    required this.label,
    required this.hintText,
    required this.controller,
    this.isPassword = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.accentColor = BlueprintColors.primaryBlue,
    this.suffix,
    this.onChanged,
    this.onFocus,
    this.onVisibilityChanged,
  });

  @override
  State<BlueprintTextField> createState() => _BlueprintTextFieldState();
}

class _BlueprintTextFieldState extends State<BlueprintTextField> {
  final FocusNode _focusNode = FocusNode();
  bool _obscureText = true;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.isPassword;
    _focusNode.addListener(() {
      setState(() {});
      if (_focusNode.hasFocus && widget.onFocus != null) {
        widget.onFocus!();
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasError = widget.errorText != null && widget.errorText!.isNotEmpty;
    final isFocused = _focusNode.hasFocus;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Technical Label
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              widget.label.toUpperCase(),
              style: GoogleFonts.jetBrainsMono(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: BlueprintColors.technicalBlack,
              ),
            ),
            if (isFocused)
              Text(
                '[ AKTIF ]',
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: widget.accentColor,
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),

        // Input Box with Technical Accent Border
        Container(
          height: 52,
          decoration: BoxDecoration(
            color: hasError
                ? BlueprintColors.errorRed.withValues(alpha: 0.04)
                : BlueprintColors.cardWhite,
            border: Border.all(
              color: hasError
                  ? BlueprintColors.errorRed
                  : isFocused
                      ? BlueprintColors.technicalBlack
                      : BlueprintColors.borderBlack,
              width: isFocused ? 2.0 : 1.5,
            ),
          ),
          child: Stack(
            children: [
              // TextField
              Center(
                child: TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  obscureText: widget.isPassword ? _obscureText : false,
                  keyboardType: widget.keyboardType,
                  onChanged: widget.onChanged,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: BlueprintColors.textMain,
                  ),
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: GoogleFonts.inter(
                      fontSize: 14,
                      color: BlueprintColors.textMuted.withValues(alpha: 0.6),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    border: InputBorder.none,
                    suffixIcon: widget.isPassword
                        ? TextButton(
                            onPressed: () {
                              setState(() {
                                _obscureText = !_obscureText;
                              });
                              if (widget.onVisibilityChanged != null) {
                                widget.onVisibilityChanged!(!_obscureText);
                              }
                            },
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              foregroundColor: BlueprintColors.technicalBlack,
                            ),
                            child: Text(
                              _obscureText ? 'LIHAT' : 'TUTUP',
                              style: GoogleFonts.jetBrainsMono(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.8,
                              ),
                            ),
                          )
                        : widget.suffix,
                  ),
                ),
              ),

              // Bottom Accent Bar on focus
              if (isFocused || hasError)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    height: 3,
                    color: hasError ? BlueprintColors.errorRed : widget.accentColor,
                  ),
                ),
            ],
          ),
        ),

        // Error message underneath
        if (hasError) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 13,
                color: BlueprintColors.errorDarkRed,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  widget.errorText!,
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: BlueprintColors.errorDarkRed,
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
