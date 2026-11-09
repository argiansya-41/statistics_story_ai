import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// Titik konektor kecil (lingkaran kecil beroutline hitam) di tepi kartu
/// Berfungsi sebagai dekorasi konektivitas neo-brutalist antar komponen.
class ConnectorDot extends StatelessWidget {
  final double size;
  final Color fillColor;
  final Color borderColor;
  final double borderWidth;
  final bool showLine;
  final double lineLength;
  final Axis lineAxis;

  const ConnectorDot({
    super.key,
    this.size = 11.0,
    this.fillColor = Colors.white,
    this.borderColor = AppColors.ink,
    this.borderWidth = 2.0,
    this.showLine = false,
    this.lineLength = 16.0,
    this.lineAxis = Axis.vertical,
  });

  @override
  Widget build(BuildContext context) {
    final dot = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: fillColor,
        shape: BoxShape.circle,
        border: Border.all(color: borderColor, width: borderWidth),
      ),
    );

    if (!showLine) return dot;

    final line = Container(
      width: lineAxis == Axis.vertical ? borderWidth : lineLength,
      height: lineAxis == Axis.vertical ? lineLength : borderWidth,
      color: borderColor,
    );

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: lineAxis == Axis.vertical
          ? [line, dot]
          : [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [line, dot],
              )
            ],
    );
  }
}

