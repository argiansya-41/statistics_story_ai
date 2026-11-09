import 'package:flutter/material.dart';

enum MascotChar { sigi, mu, quin }
enum MascotExpression { smile, happy, wink, think, cover, peek, sad }

class PixelMascot extends StatefulWidget {
  final MascotChar character;
  final MascotExpression expression;
  final double size;
  final bool isBobbing;

  const PixelMascot({
    super.key,
    this.character = MascotChar.sigi,
    this.expression = MascotExpression.smile,
    this.size = 80,
    this.isBobbing = true,
  });

  @override
  State<PixelMascot> createState() => _PixelMascotState();
}

class _PixelMascotState extends State<PixelMascot> with SingleTickerProviderStateMixin {
  late AnimationController _bobCtrl;
  late Animation<double> _bobAnim;

  @override
  void initState() {
    super.initState();
    _bobCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _bobAnim = Tween<double>(begin: 0, end: -6).animate(
      CurvedAnimation(parent: _bobCtrl, curve: Curves.easeInOut),
    );
    if (widget.isBobbing) {
      _bobCtrl.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _bobCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bobAnim,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, widget.isBobbing ? _bobAnim.value : 0),
          child: CustomPaint(
            size: Size(widget.size, widget.size),
            painter: _MascotPainter(
              character: widget.character,
              expression: widget.expression,
            ),
          ),
        );
      },
    );
  }
}

class _MascotPainter extends CustomPainter {
  final MascotChar character;
  final MascotExpression expression;

  _MascotPainter({required this.character, required this.expression});

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    final strokePaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;

    // Base colors
    Color helmetColor;
    Color visorColor;

    switch (character) {
      case MascotChar.sigi:
        helmetColor = const Color(0xFF003BFF); // Air / Blue
        visorColor = const Color(0xFF70A5FF);
        break;
      case MascotChar.mu:
        helmetColor = const Color(0xFFFF2E2E); // Api / Red
        visorColor = const Color(0xFFFF8E8E);
        break;
      case MascotChar.quin:
        helmetColor = const Color(0xFFFFD400); // Petir / Yellow
        visorColor = const Color(0xFFFFF07A);
        break;
    }

    final helmPaint = Paint()..color = helmetColor;
    final visorPaint = Paint()..color = visorColor;
    final whitePaint = Paint()..color = Colors.white;

    void drawPixel(int x, int y, Paint paint, {int w = 1, int h = 1}) {
      canvas.drawRect(
        Rect.fromLTWH(x * scale, y * scale, w * scale, h * scale),
        paint,
      );
    }

    // 1. Crest on Head (Jambul Elemen)
    if (character == MascotChar.sigi) {
      // Water droplet crest
      drawPixel(11, 2, helmPaint, w: 2, h: 2);
      drawPixel(10, 4, helmPaint, w: 4, h: 2);
      drawPixel(10, 2, strokePaint, w: 1, h: 2);
      drawPixel(13, 2, strokePaint, w: 1, h: 2);
      drawPixel(11, 1, strokePaint, w: 2, h: 1);
    } else if (character == MascotChar.mu) {
      // Flame crest
      drawPixel(10, 2, helmPaint, w: 2, h: 4);
      drawPixel(12, 1, helmPaint, w: 2, h: 5);
      drawPixel(14, 3, helmPaint, w: 1, h: 3);
      drawPixel(11, 0, strokePaint, w: 2, h: 1);
    } else {
      // Lightning crest (Quin)
      drawPixel(10, 1, helmPaint, w: 2, h: 2);
      drawPixel(11, 3, helmPaint, w: 3, h: 2);
      drawPixel(10, 5, helmPaint, w: 2, h: 1);
      drawPixel(10, 0, strokePaint, w: 2, h: 1);
    }

    // 2. Helmet Outline & Body (24x24 Grid)
    // Main Body Box (6 to 20 horizontally, 6 to 20 vertically)
    // Outer black border
    drawPixel(6, 6, strokePaint, w: 12, h: 14);

    // Inner helmet color
    drawPixel(7, 7, helmPaint, w: 10, h: 12);

    // Ears / side modules
    drawPixel(4, 10, strokePaint, w: 2, h: 5);
    drawPixel(5, 11, whitePaint, w: 1, h: 3);
    drawPixel(18, 10, strokePaint, w: 2, h: 5);
    drawPixel(18, 11, whitePaint, w: 1, h: 3);

    // 3. Face / Visor Area
    drawPixel(7, 10, strokePaint, w: 10, h: 7);
    drawPixel(8, 11, visorPaint, w: 8, h: 5);

    // 4. Eyes & Expression
    final ink = strokePaint;

    if (expression == MascotExpression.cover) {
      // Hands covering eyes
      drawPixel(8, 12, whitePaint, w: 3, h: 3);
      drawPixel(8, 12, strokePaint, w: 3, h: 1);
      drawPixel(13, 12, whitePaint, w: 3, h: 3);
      drawPixel(13, 12, strokePaint, w: 3, h: 1);
    } else if (expression == MascotExpression.peek) {
      // One eye peeking through hands
      drawPixel(8, 12, whitePaint, w: 3, h: 3);
      drawPixel(14, 12, ink, w: 2, h: 2); // Peeking eye
      drawPixel(13, 14, whitePaint, w: 3, h: 2);
    } else if (expression == MascotExpression.wink) {
      // Left wink, right open
      drawPixel(9, 13, ink, w: 2, h: 1); // Line wink
      drawPixel(13, 12, ink, w: 2, h: 2); // Open eye
      drawPixel(11, 14, ink, w: 2, h: 1); // Smile mouth
    } else if (expression == MascotExpression.happy) {
      // Curved happy eyes (^^)
      drawPixel(9, 12, ink, w: 2, h: 1);
      drawPixel(13, 12, ink, w: 2, h: 1);
      drawPixel(10, 14, ink, w: 4, h: 2); // Big open mouth
    } else if (expression == MascotExpression.think) {
      // Thinking eyes looking up
      drawPixel(10, 11, ink, w: 2, h: 2);
      drawPixel(14, 11, ink, w: 2, h: 2);
      drawPixel(11, 14, ink, w: 2, h: 1);
    } else if (expression == MascotExpression.sad) {
      // Sad eyes & frown
      drawPixel(9, 13, ink, w: 2, h: 2);
      drawPixel(13, 13, ink, w: 2, h: 2);
      drawPixel(10, 15, ink, w: 4, h: 1); // Frown
    } else {
      // Normal Smile
      drawPixel(9, 12, ink, w: 2, h: 2);
      drawPixel(13, 12, ink, w: 2, h: 2);
      drawPixel(11, 14, ink, w: 2, h: 1);
    }

    // Feet / Base
    drawPixel(8, 20, strokePaint, w: 3, h: 2);
    drawPixel(13, 20, strokePaint, w: 3, h: 2);
    drawPixel(8, 20, whitePaint, w: 2, h: 1);
    drawPixel(13, 20, whitePaint, w: 2, h: 1);
  }

  @override
  bool shouldRepaint(covariant _MascotPainter oldDelegate) {
    return oldDelegate.character != character || oldDelegate.expression != expression;
  }
}

