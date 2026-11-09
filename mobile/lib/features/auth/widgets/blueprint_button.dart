import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/constants/colors.dart';

class BlueprintButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const BlueprintButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.backgroundColor = BlueprintColors.primaryBlue,
    this.textColor = Colors.white,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      width: double.infinity,
      decoration: BoxDecoration(
        color: backgroundColor,
        border: Border.all(
          color: BlueprintColors.borderBlack,
          width: 2.0,
        ),
        boxShadow: const [
          BoxShadow(
            color: BlueprintColors.borderBlack,
            offset: Offset(3, 3),
            blurRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onPressed,
          splashColor: Colors.black12,
          highlightColor: Colors.black26,
          child: Center(
            child: isLoading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(textColor),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Icon(icon, size: 18, color: textColor),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        label.toUpperCase(),
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                          color: textColor,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

