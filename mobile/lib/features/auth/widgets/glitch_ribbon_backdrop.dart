import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const _dnaChars = ['A', 'T', 'C', 'G', 'T', 'A', 'C', 'G'];
const _colorDefs = <String, Color>{
  'red': Color(0xEBFF2D2D),
  'blue': Color(0xEB0055FF),
  'yellow': Color(0xF5FFEB00),
  'white': Color(0xEBFFFFFF),
  'dark': Color(0x33FFFFFF),
};
const _textColors = <String, Color>{
  'red': Colors.white,
  'blue': Colors.white,
  'yellow': Colors.black,
  'white': Colors.black,
  'dark': Colors.white70,
};
const _colorPool = ['red', 'red', 'blue', 'blue', 'yellow', 'white', 'dark'];

class _Cell {
  String char;
  String colorType;
  double nextCharChange;
  double nextColorChange;

  _Cell({
    required this.char,
    required this.colorType,
    required this.nextCharChange,
    required this.nextColorChange,
  });
}

class _Strip {
  double y;
  final double speed;
  final double width;
  final double cellHeight;
  final List<_Cell> cells;

  _Strip({
    required this.y,
    required this.speed,
    required this.width,
    required this.cellHeight,
    required this.cells,
  });
}

class _Lane {
  final double x;
  final double width;
  final double cellHeight;
  final List<_Strip> strips;

  _Lane({
    required this.x,
    required this.width,
    required this.cellHeight,
    required this.strips,
  });
}

/// Latar belakang Glitch Ribbon DNA CRISPR yang jatuh dan berganti warna secara dinamis (60 FPS)
class GlitchRibbonBackdrop extends StatefulWidget {
  final Widget child;

  const GlitchRibbonBackdrop({super.key, required this.child});

  @override
  State<GlitchRibbonBackdrop> createState() => _GlitchRibbonBackdropState();
}

class _GlitchRibbonBackdropState extends State<GlitchRibbonBackdrop>
    with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;
  final List<_Lane> _lanes = [];
  final math.Random _rand = math.Random();
  double _lastTime = 0;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();
  }

  void _initLanes(double width, double height) {
    if (_initialized || width <= 0 || height <= 0) return;
    _initialized = true;

    const laneCount = 4; // 4 kolom vertikal untuk tampilan mobile
    final colStep = width / laneCount;

    for (int i = 0; i < laneCount; i++) {
      const ribbonWidth = 15.0;
      const cellH = 17.0;
      final xPos = 14.0 + (i * colStep) + (_rand.nextDouble() * 0.4 - 0.2) * colStep;

      // Buat strip 1
      final strip1 = _createStrip(-_rand.nextDouble() * height * 0.8, ribbonWidth, cellH);
      final strips = [strip1];

      // Strip kedua pada beberapa kolom
      if (_rand.nextDouble() < 0.4) {
        final gap = 200.0 + _rand.nextDouble() * 250.0;
        final strip2 = _createStrip(
          strip1.y + (strip1.cells.length * cellH) + gap,
          ribbonWidth,
          cellH,
        );
        strips.add(strip2);
      }

      _lanes.add(_Lane(
        x: xPos.clamp(8.0, width - ribbonWidth - 8.0),
        width: ribbonWidth,
        cellHeight: cellH,
        strips: strips,
      ));
    }
  }

  _Strip _createStrip(double startY, double cellW, double cellH) {
    final cellCount = 7 + _rand.nextInt(8);
    final cells = <_Cell>[];

    int remaining = cellCount;
    while (remaining > 0) {
      final segLen = math.min(remaining, 2 + _rand.nextInt(4));
      final color = _colorPool[_rand.nextInt(_colorPool.length)];
      for (int i = 0; i < segLen; i++) {
        cells.add(_Cell(
          char: _dnaChars[_rand.nextInt(_dnaChars.length)],
          colorType: color,
          nextCharChange: _rand.nextDouble() * 2.0,
          nextColorChange: _rand.nextDouble() * 2.5,
        ));
      }
      remaining -= segLen;
    }

    return _Strip(
      y: startY,
      speed: 0.85 + _rand.nextDouble() * 0.75, // Kecepatan jatuh halus
      width: cellW,
      cellHeight: cellH,
      cells: cells,
    );
  }

  void _updateSimulation(double height) {
    _lastTime += 0.016;

    for (var lane in _lanes) {
      for (var strip in lane.strips) {
        // Gerakkan strip ke bawah
        strip.y += strip.speed;

        final totalH = strip.cells.length * strip.cellHeight;

        // Daur ulang jika keluar dari layar bawah
        if (strip.y > height + 30) {
          strip.y = -totalH - 40 - _rand.nextDouble() * 150;
          for (var c in strip.cells) {
            c.char = _dnaChars[_rand.nextInt(_dnaChars.length)];
            c.colorType = _colorPool[_rand.nextInt(_colorPool.length)];
            c.nextCharChange = _lastTime + 0.6 + _rand.nextDouble() * 1.5;
            c.nextColorChange = _lastTime + 0.8 + _rand.nextDouble() * 2.0;
          }
        }

        // Mutasi warna dan karakter secara berkala
        for (var c in strip.cells) {
          if (_lastTime > c.nextColorChange) {
            c.colorType = _colorPool[_rand.nextInt(_colorPool.length)];
            c.nextColorChange = _lastTime + 0.8 + _rand.nextDouble() * 2.2;
          }
          if (_lastTime > c.nextCharChange) {
            c.char = _dnaChars[_rand.nextInt(_dnaChars.length)];
            c.nextCharChange = _lastTime + 0.5 + _rand.nextDouble() * 1.8;
          }
        }
      }
    }
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight.isFinite ? constraints.maxHeight : 500.0;
        _initLanes(w, h);

        return Stack(
          children: [
            // 1. Dark Blueprint Grid
            Positioned.fill(
              child: Container(
                color: Colors.black,
                child: CustomPaint(
                  painter: _DarkGridPainter(),
                ),
              ),
            ),

            // 2. Animated Falling DNA Ribbons (60 FPS)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _animCtrl,
                builder: (context, _) {
                  _updateSimulation(h);
                  return CustomPaint(
                    painter: _FallingRibbonsPainter(lanes: _lanes),
                  );
                },
              ),
            ),

            // 3. Child Content
            widget.child,
          ],
        );
      },
    );
  }
}

class _FallingRibbonsPainter extends CustomPainter {
  final List<_Lane> lanes;

  _FallingRibbonsPainter({required this.lanes});

  @override
  void paint(Canvas canvas, Size size) {
    final textPainter = TextPainter(textDirection: TextDirection.ltr);

    for (var lane in lanes) {
      for (var strip in lane.strips) {
        for (int i = 0; i < strip.cells.length; i++) {
          final cell = strip.cells[i];
          final cellY = strip.y + (i * strip.cellHeight);

          if (cellY + strip.cellHeight < 0 || cellY > size.height) continue;

          final bg = _colorDefs[cell.colorType] ?? const Color(0xEBFF2D2D);
          final fg = _textColors[cell.colorType] ?? Colors.white;

          // Background kotak sel
          final rect = Rect.fromLTWH(lane.x, cellY, strip.width, strip.cellHeight);
          canvas.drawRect(rect, Paint()..color = bg);

          // Teks huruf DNA
          textPainter.text = TextSpan(
            text: cell.char,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: fg,
            ),
          );
          textPainter.layout();
          final textOffset = Offset(
            lane.x + (strip.width - textPainter.width) / 2,
            cellY + (strip.cellHeight - textPainter.height) / 2,
          );
          textPainter.paint(canvas, textOffset);
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _FallingRibbonsPainter oldDelegate) => true;
}

class _DarkGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.04)
      ..strokeWidth = 1.0;

    const step = 28.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
