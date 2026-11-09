import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// Placeholder Loading Shimmer Berkilau Ringan & Halus (Tanpa Package Tambahan)
class ShimmerSkeleton extends StatefulWidget {
  final double width;
  final double height;
  final double radius;
  final Color baseColor;
  final Color highlightColor;
  final bool hasBorder;

  const ShimmerSkeleton({
    super.key,
    required this.width,
    required this.height,
    this.radius = 16.0,
    this.baseColor = const Color(0xFFE5E9F0),
    this.highlightColor = const Color(0xFFF7F8FC),
    this.hasBorder = true,
  });

  @override
  State<ShimmerSkeleton> createState() => _ShimmerSkeletonState();
}

class _ShimmerSkeletonState extends State<ShimmerSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
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
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) {
            return LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                widget.baseColor,
                widget.highlightColor,
                widget.baseColor,
              ],
              stops: const [0.0, 0.5, 1.0],
              transform: _SlidingGradientTransform(slidePercent: _ctrl.value),
            ).createShader(bounds);
          },
          child: Container(
            width: widget.width,
            height: widget.height,
            decoration: BoxDecoration(
              color: widget.baseColor,
              borderRadius: BorderRadius.circular(widget.radius),
              border: widget.hasBorder
                  ? Border.all(color: AppColors.ink.withValues(alpha: 0.15), width: 1.5)
                  : null,
            ),
          ),
        );
      },
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  final double slidePercent;
  const _SlidingGradientTransform({required this.slidePercent});

  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(bounds.width * (slidePercent * 2 - 1), 0.0, 0.0);
  }
}

