import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_colors.dart';
import 'connector_dot.dart';

/// Kartu Mewah Bergaya Sticker Card / Soft Neo-Brutalism
/// Memiliki outline tebal dan 1-2 lapisan berwarna solid di belakang (Layered Offset Shadow).
class StackedCard extends StatefulWidget {
  final Widget child;
  final List<Color> layerColors;
  final Offset offsetStep;
  final double radius;
  final double borderWidth;
  final Color borderColor;
  final Color cardColor;
  final VoidCallback? onTap;
  final bool showConnectorDots;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? width;
  final double? height;

  const StackedCard({
    super.key,
    required this.child,
    this.layerColors = const [AppColors.blue, AppColors.yellow],
    this.offsetStep = const Offset(5, 5),
    this.radius = 22.0,
    this.borderWidth = 2.2,
    this.borderColor = AppColors.ink,
    this.cardColor = AppColors.card,
    this.onTap,
    this.showConnectorDots = false,
    this.padding,
    this.margin,
    this.width,
    this.height,
  });

  @override
  State<StackedCard> createState() => _StackedCardState();
}

class _StackedCardState extends State<StackedCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _pressCtrl;
  late Animation<double> _pressAnim;

  @override
  void initState() {
    super.initState();
    _pressCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _pressAnim = CurvedAnimation(
      parent: _pressCtrl,
      curve: Curves.easeOutQuad,
    );
  }

  @override
  void dispose() {
    _pressCtrl.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onTap == null) return;
    HapticFeedback.selectionClick();
    _pressCtrl.forward();
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onTap == null) return;
    _pressCtrl.reverse();
    widget.onTap!();
  }

  void _onTapCancel() {
    if (widget.onTap == null) return;
    _pressCtrl.reverse();
  }

  @override
  Widget build(BuildContext context) {
    final layers = widget.layerColors;
    final totalLayers = layers.length;
    final maxOffsetX = widget.offsetStep.dx * totalLayers;
    final maxOffsetY = widget.offsetStep.dy * totalLayers;

    return Padding(
      padding: widget.margin ?? EdgeInsets.zero,
      child: GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        child: AnimatedBuilder(
          animation: _pressAnim,
          builder: (context, _) {
            final t = _pressAnim.value;
            // Saat ditekan, bergeser mendekati lapisan terdalam
            final shiftX = maxOffsetX * t * 0.7;
            final shiftY = maxOffsetY * t * 0.7;

            return Stack(
              clipBehavior: Clip.none,
              children: [
                // Lapisan-lapisan offset di belakang (dari paling bawah/luar ke dalam)
                for (int i = totalLayers - 1; i >= 0; i--) ...[
                  Positioned.fill(
                    child: Transform.translate(
                      offset: Offset(
                        widget.offsetStep.dx * (i + 1),
                        widget.offsetStep.dy * (i + 1),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          color: layers[i],
                          borderRadius: BorderRadius.circular(widget.radius),
                          border: Border.all(
                            color: widget.borderColor,
                            width: widget.borderWidth,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],

                // Kartu Utama
                Transform.translate(
                  offset: Offset(shiftX, shiftY),
                  child: Container(
                    width: widget.width,
                    height: widget.height,
                    padding: widget.padding ?? const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: widget.cardColor,
                      borderRadius: BorderRadius.circular(widget.radius),
                      border: Border.all(
                        color: widget.borderColor,
                        width: widget.borderWidth,
                      ),
                    ),
                    child: widget.child,
                  ),
                ),

                // Titik konektor dekoratif di atas atau bawah kartu
                if (widget.showConnectorDots) ...[
                  Positioned(
                    top: -5,
                    left: 28,
                    child: ConnectorDot(
                      size: 11,
                      borderColor: widget.borderColor,
                      borderWidth: widget.borderWidth,
                    ),
                  ),
                  Positioned(
                    bottom: -5,
                    right: 28,
                    child: ConnectorDot(
                      size: 11,
                      borderColor: widget.borderColor,
                      borderWidth: widget.borderWidth,
                    ),
                  ),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

