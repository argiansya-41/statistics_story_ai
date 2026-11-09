import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Jenis karakter maskot Helm
enum MascotChar { sigi, mu, quin }

/// Pose dan variasi tubuh
enum MascotPose { idle, cheer, charge, cast, cover, peek }

/// Ekspresi wajah maskot
enum MascotExpression { smile, happy, wink, think, cover, peek, sad, cool, wow, hurt }

/// Palet warna maskot helm persis konsep helmSprite.ts di website
class _HelmPalette {
  final Color head;
  final Color hi;
  final Color face;
  final Color torso1;
  final Color torso2;
  final Color belt;
  final Color limb;
  final Color c1;
  final Color c2;
  final Color fx;

  const _HelmPalette({
    required this.head,
    required this.hi,
    required this.face,
    required this.torso1,
    required this.torso2,
    required this.belt,
    required this.limb,
    required this.c1,
    required this.c2,
    required this.fx,
  });
}

const _palettes = <MascotChar, _HelmPalette>{
  MascotChar.sigi: _HelmPalette(
    head: Color(0xFF003BFF),
    hi: Color(0xFF5BA8FF),
    face: Color(0xFFCFE6FF),
    torso1: Color(0xFF1E4FE0),
    torso2: Color(0xFF0A2FC4),
    belt: Color(0xFFFFFFFF),
    limb: Color(0xFF5BA8FF),
    c1: Color(0xFF9CC8FF),
    c2: Color(0xFF9CC8FF),
    fx: Color(0xFF5BA8FF),
  ),
  MascotChar.mu: _HelmPalette(
    head: Color(0xFFFF2E2E),
    hi: Color(0xFFFF8A5C),
    face: Color(0xFFFFE9A0),
    torso1: Color(0xFFFF2E2E),
    torso2: Color(0xFFB31212),
    belt: Color(0xFFEBEB00),
    limb: Color(0xFFFF8A00),
    c1: Color(0xFFFF8A00),
    c2: Color(0xFFEBEB00),
    fx: Color(0xFFFF8A00),
  ),
  MascotChar.quin: _HelmPalette(
    head: Color(0xFFEBEB00),
    hi: Color(0xFFFFF68A),
    face: Color(0xFFFFFFFF),
    torso1: Color(0xFF5B7BFF),
    torso2: Color(0xFF003BFF),
    belt: Color(0xFFEBEB00),
    limb: Color(0xFF003BFF),
    c1: Color(0xFF003BFF),
    c2: Color(0xFFEBEB00),
    fx: Color(0xFFEBEB00),
  ),
};

/// Maskot piksel helm resmi Statistics Story AI (porting 1:1 dari helmSprite.ts)
class HelmMascot extends StatefulWidget {
  final MascotChar character;
  final MascotExpression expression;
  final MascotPose pose;
  final double size;
  final bool isBobbing;

  const HelmMascot({
    super.key,
    required this.character,
    this.expression = MascotExpression.smile,
    this.pose = MascotPose.idle,
    this.size = 72,
    this.isBobbing = true,
  });

  @override
  State<HelmMascot> createState() => _HelmMascotState();
}

class _HelmMascotState extends State<HelmMascot> with SingleTickerProviderStateMixin {
  late AnimationController _bobCtrl;
  late Animation<double> _bobAnim;
  int _crestFrame = 0;
  bool _blink = false;
  Timer? _crestTimer;
  Timer? _blinkTimer;

  @override
  void initState() {
    super.initState();
    _bobCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _bobAnim = Tween<double>(begin: 0, end: -5).animate(
      CurvedAnimation(parent: _bobCtrl, curve: Curves.easeInOut),
    );

    if (widget.isBobbing) {
      _bobCtrl.repeat(reverse: true);
    }

    _startCrestTimer();
    _scheduleBlink();
  }

  void _startCrestTimer() {
    _crestTimer = Timer(const Duration(milliseconds: 280), () {
      if (!mounted) return;
      setState(() => _crestFrame = _crestFrame == 0 ? 1 : 0);
      _startCrestTimer();
    });
  }

  void _scheduleBlink() {
    final delayMs = 2000 + math.Random().nextInt(2500);
    _blinkTimer = Timer(Duration(milliseconds: delayMs), () {
      if (!mounted) return;
      setState(() => _blink = true);
      _blinkTimer = Timer(const Duration(milliseconds: 140), () {
        if (!mounted) return;
        setState(() => _blink = false);
        _scheduleBlink();
      });
    });
  }

  @override
  void dispose() {
    _crestTimer?.cancel();
    _blinkTimer?.cancel();
    _bobCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bobAnim,
      builder: (context, _) {
        return Transform.translate(
          offset: Offset(0, widget.isBobbing ? _bobAnim.value : 0),
          child: CustomPaint(
            size: Size(widget.size, widget.size),
            painter: _HelmSpritePainter(
              character: widget.character,
              expression: widget.expression,
              pose: widget.pose,
              crestFrame: _crestFrame,
              blink: _blink,
            ),
          ),
        );
      },
    );
  }
}

class _HelmSpritePainter extends CustomPainter {
  final MascotChar character;
  final MascotExpression expression;
  final MascotPose pose;
  final int crestFrame;
  final bool blink;

  _HelmSpritePainter({
    required this.character,
    required this.expression,
    required this.pose,
    required this.crestFrame,
    required this.blink,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    final grid = _buildHelmGrid();

    final paintCache = <Color, Paint>{};
    Paint getPaint(Color color) {
      return paintCache.putIfAbsent(color, () => Paint()..color = color);
    }

    // Render per persegi piksel
    for (int y = 0; y < 24; y++) {
      for (int x = 0; x < 24; x++) {
        final c = grid[y][x];
        if (c != null) {
          canvas.drawRect(
            Rect.fromLTWH(x * scale, y * scale, scale, scale),
            getPaint(c),
          );
        }
      }
    }
  }

  List<List<Color?>> _buildHelmGrid() {
    final pal = _palettes[character]!;
    final grid = List.generate(24, (_) => List<Color?>.filled(24, null));

    const ox = 4;
    const oy = 2;

    void set(int lx, int ly, Color? c) {
      final x = lx + ox;
      final y = ly + oy;
      if (x >= 0 && x < 24 && y >= 0 && y < 24) {
        grid[y][x] = c;
      }
    }

    void row(int lx0, int lx1, int ly, Color c) {
      for (int x = lx0; x <= lx1; x++) {
        set(x, ly, c);
      }
    }

    void plus(int cx, int cy, Color c) {
      set(cx, cy, c);
      set(cx - 1, cy, c);
      set(cx + 1, cy, c);
      set(cx, cy - 1, c);
      set(cx, cy + 1, c);
    }

    void arm(int sx, int sy, int hx, int hy, Color c) {
      final dx = (hx - sx).abs();
      final dy = (hy - sy).abs();
      final sxStep = sx < hx ? 1 : -1;
      final syStep = sy < hy ? 1 : -1;
      int err = dx - dy;
      int curX = sx;
      int curY = sy;
      for (int i = 0; i < 32; i++) {
        set(curX, curY, c);
        if (curX == hx && curY == hy) break;
        final e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          curX += sxStep;
        }
        if (e2 < dx) {
          err += dx;
          curY += syStep;
        }
      }
    }

    // 1. Kaki
    void legRows(int x0, int x1, int y0, int y1) {
      for (int y = y0; y <= y1; y++) {
        row(x0, x1, y, pal.limb);
      }
    }
    legRows(5, 6, 18, 19);
    legRows(9, 10, 18, 19);

    // 2. Badan
    row(5, 10, 15, pal.torso1);
    row(5, 10, 16, pal.torso2);
    row(5, 10, 17, pal.belt);

    // 3. Tangan belakang
    final isCover = expression == MascotExpression.cover || pose == MascotPose.cover;
    final isPeek = expression == MascotExpression.peek || pose == MascotPose.peek;

    if (!isCover && !isPeek) {
      arm(4, 16, 3, 16, pal.limb);
      arm(11, 16, 12, 16, pal.limb);
      plus(3, 16, pal.limb);
      plus(12, 16, pal.limb);
    }

    // 4. Kepala Bulat Chibi (Helm)
    row(4, 11, 6, pal.head);
    row(3, 12, 7, pal.head);
    for (int y = 8; y <= 12; y++) {
      row(2, 13, y, pal.head);
    }
    row(3, 12, 13, pal.head);
    row(4, 11, 14, pal.head);

    // Kilau Helm di Kiri Atas
    row(3, 5, 7, pal.hi);
    set(3, 8, pal.hi);
    set(3, 9, pal.hi);

    // 5. Jambul Elemen
    if (character == MascotChar.sigi) {
      // Air: Tetesan air
      if (crestFrame == 0) {
        final pts = [
          [7, 3, pal.c1], [8, 3, pal.c1], [8, 4, pal.c1],
          [3, 5, pal.c1], [6, 5, pal.c1], [7, 5, pal.c1],
          [8, 5, pal.c1], [9, 5, pal.c1], [12, 5, pal.c1]
        ];
        for (var p in pts) {
          set(p[0] as int, p[1] as int, p[2] as Color);
        }
      } else {
        final pts = [
          [8, 2, pal.c1], [7, 3, pal.c1], [8, 3, pal.c1], [8, 4, pal.c1],
          [3, 4, pal.c1], [6, 5, pal.c1], [7, 5, pal.c1], [8, 5, pal.c1],
          [9, 5, pal.c1], [12, 4, pal.c1]
        ];
        for (var p in pts) {
          set(p[0] as int, p[1] as int, p[2] as Color);
        }
      }
    } else if (character == MascotChar.mu) {
      // Api: Lidah api berkobar
      if (crestFrame == 0) {
        final pts = [
          [8, 2, pal.c1], [7, 3, pal.c1], [8, 3, pal.c2],
          [7, 4, pal.c1], [8, 4, pal.c2], [9, 4, pal.c1],
          [6, 5, pal.c1], [7, 5, pal.c2], [8, 5, Colors.white],
          [9, 5, pal.c2], [10, 5, pal.c1]
        ];
        for (var p in pts) {
          set(p[0] as int, p[1] as int, p[2] as Color);
        }
      } else {
        final pts = [
          [9, 1, pal.c1], [8, 2, pal.c1], [9, 2, pal.c2],
          [7, 3, pal.c1], [8, 3, pal.c2], [9, 3, pal.c1],
          [7, 4, pal.c1], [8, 4, pal.c2], [9, 4, pal.c1],
          [6, 5, pal.c1], [7, 5, pal.c2], [8, 5, Colors.white],
          [9, 5, pal.c2], [10, 5, pal.c1]
        ];
        for (var p in pts) {
          set(p[0] as int, p[1] as int, p[2] as Color);
        }
      }
    } else {
      // Quin: Antena petir
      final pts = [
        [9, 2, pal.c1], [10, 2, pal.c1], [8, 3, pal.c1],
        [7, 4, pal.c1], [8, 4, pal.c1], [9, 4, pal.c1], [10, 4, pal.c1],
        [8, 5, pal.c1], [9, 5, pal.c1]
      ];
      for (var p in pts) {
        set(p[0] as int, p[1] as int, p[2] as Color);
      }
      if (crestFrame == 1) {
        set(11, 2, pal.c2);
        set(10, 1, pal.c2);
      }
    }

    // 6. Pelat Wajah Segidelapan (8x5)
    for (int fy = 0; fy < 5; fy++) {
      for (int fx = 0; fx < 8; fx++) {
        final inPlate = fy >= 0 && fy <= 4 && (fy == 0 || fy == 4 ? fx >= 1 && fx <= 6 : fx >= 0 && fx <= 7);
        if (inPlate) {
          set(4 + fx, 8 + fy, pal.face);
        }
      }
    }

    // 7. Mata dan Mulut (Ink Hitam Murni)
    const ink = Colors.black;

    void drawHole(int fx, int fy) {
      set(4 + fx, 8 + fy, ink);
    }

    void eyesNormal() {
      if (blink) {
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 2);
        drawHole(6, 2);
      } else {
        drawHole(1, 1);
        drawHole(2, 1);
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 1);
        drawHole(6, 1);
        drawHole(5, 2);
        drawHole(6, 2);
      }
    }

    switch (expression) {
      case MascotExpression.smile:
        eyesNormal();
        drawHole(3, 3);
        drawHole(4, 3);
        break;
      case MascotExpression.happy:
        drawHole(2, 1);
        drawHole(1, 2);
        drawHole(3, 2);
        drawHole(5, 1);
        drawHole(4, 2);
        drawHole(6, 2);
        drawHole(3, 3);
        drawHole(4, 3);
        break;
      case MascotExpression.wink:
        drawHole(1, 2);
        drawHole(2, 2);
        if (blink) {
          drawHole(5, 2);
          drawHole(6, 2);
        } else {
          drawHole(5, 1);
          drawHole(6, 1);
          drawHole(5, 2);
          drawHole(6, 2);
        }
        drawHole(3, 3);
        drawHole(4, 3);
        break;
      case MascotExpression.think:
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 1);
        drawHole(6, 1);
        drawHole(5, 2);
        drawHole(6, 2);
        drawHole(4, 3);
        drawHole(5, 3);
        break;
      case MascotExpression.sad:
        drawHole(2, 1);
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 1);
        drawHole(5, 2);
        drawHole(6, 2);
        drawHole(3, 3);
        drawHole(4, 3);
        drawHole(2, 4);
        drawHole(5, 4);
        break;
      case MascotExpression.cover:
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 2);
        drawHole(6, 2);
        drawHole(3, 3);
        drawHole(4, 3);
        break;
      case MascotExpression.peek:
        drawHole(1, 2);
        drawHole(2, 2);
        drawHole(5, 1);
        drawHole(6, 1);
        drawHole(5, 2);
        drawHole(6, 2);
        drawHole(3, 3);
        drawHole(4, 3);
        break;
      default:
        eyesNormal();
        drawHole(3, 3);
        drawHole(4, 3);
        break;
    }

    // 8. Tangan Menutup Mata (Pose Cover & Peek)
    if (isCover) {
      row(5, 6, 8, pal.limb);
      row(4, 7, 9, pal.limb);
      row(4, 7, 10, pal.limb);
      row(4, 6, 11, pal.limb);

      row(9, 10, 8, pal.limb);
      row(8, 11, 9, pal.limb);
      row(8, 11, 10, pal.limb);
      row(9, 11, 11, pal.limb);
    } else if (isPeek) {
      row(5, 6, 8, pal.limb);
      row(4, 7, 9, pal.limb);
      row(4, 7, 10, pal.limb);
      row(4, 6, 11, pal.limb);
      plus(12, 16, pal.limb);
    }

    // 9. Cincin Putih Putus-putus di Luar Siluet (Signature White Pixel Border)
    // Dihitung dengan dilasi radius 2 di sekeliling siluet
    final solid = List.generate(24, (y) => List<bool>.generate(24, (x) => grid[y][x] != null));
    final dilated = List.generate(24, (_) => List<bool>.filled(24, false));

    for (int y = 0; y < 24; y++) {
      for (int x = 0; x < 24; x++) {
        if (solid[y][x]) {
          for (int dy = -2; dy <= 2; dy++) {
            for (int dx = -2; dx <= 2; dx++) {
              if (dx * dx + dy * dy <= 4) {
                final nx = x + dx;
                final ny = y + dy;
                if (nx >= 0 && nx < 24 && ny >= 0 && ny < 24) {
                  dilated[ny][nx] = true;
                }
              }
            }
          }
        }
      }
    }

    for (int y = 0; y < 24; y++) {
      for (int x = 0; x < 24; x++) {
        if (dilated[y][x] && !solid[y][x]) {
          final isEdge = x == 0 || y == 0 || x == 23 || y == 23 ||
              !dilated[y][x - 1] || !dilated[y][x + 1] || !dilated[y - 1][x] || !dilated[y + 1][x];
          if (isEdge) {
            grid[y][x] = Colors.white;
          }
        }
      }
    }

    // Tambalan piksel cincin di sekitar jambul
    if (crestFrame == 0) {
      if (character == MascotChar.sigi) {
        for (var p in [[5, 4], [7, 4], [10, 4]]) {
          if (grid[p[1] + oy][p[0] + ox] == null) set(p[0], p[1], Colors.white);
        }
      } else if (character == MascotChar.mu) {
        if (grid[4 + oy][5 + ox] == null) set(5, 4, Colors.white);
      } else {
        if (grid[3 + oy][9 + ox] == null) set(9, 3, Colors.white);
      }
    }

    return grid;
  }

  @override
  bool shouldRepaint(covariant _HelmSpritePainter oldDelegate) {
    return oldDelegate.character != character ||
        oldDelegate.expression != expression ||
        oldDelegate.pose != pose ||
        oldDelegate.crestFrame != crestFrame ||
        oldDelegate.blink != blink;
  }
}

