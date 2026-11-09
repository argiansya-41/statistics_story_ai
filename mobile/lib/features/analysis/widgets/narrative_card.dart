import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/premium/premium_widgets.dart';

/// Kartu Narasi AI Cerdas dengan Efek Mengetik (Typewriter), Header Berwarna,
/// Tombol Salin/Bagikan, dan Fitur Expand/Collapse Beranimasi.
class NarrativeCard extends StatefulWidget {
  final Map<String, dynamic>? narasi;
  final dynamic contohKasus;

  const NarrativeCard({
    super.key,
    this.narasi,
    this.contohKasus,
  });

  @override
  State<NarrativeCard> createState() => _NarrativeCardState();
}

class _NarrativeCardState extends State<NarrativeCard>
    with SingleTickerProviderStateMixin {
  String _currentLang = 'id';
  bool _isExpanded = true;
  bool _hasTypedOnce = false;

  late AnimationController _typeCtrl;
  late Animation<int> _charCountAnim;

  String get _currentText {
    return widget.narasi?[_currentLang]?.toString() ??
        widget.narasi?['id']?.toString() ??
        'Narasi analisis AI belum di-generate atau gagal dimuat.';
  }

  @override
  void initState() {
    super.initState();
    _typeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _initTypewriter();
  }

  void _initTypewriter() {
    final textLength = _currentText.length;
    _charCountAnim = StepTween(begin: 0, end: textLength).animate(
      CurvedAnimation(parent: _typeCtrl, curve: Curves.easeOutCubic),
    );

    if (!_hasTypedOnce) {
      _typeCtrl.forward().then((_) {
        if (mounted) setState(() => _hasTypedOnce = true);
      });
    } else {
      _typeCtrl.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(NarrativeCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.narasi != oldWidget.narasi) {
      _initTypewriter();
    }
  }

  @override
  void dispose() {
    _typeCtrl.dispose();
    super.dispose();
  }

  void _copyToClipboard() {
    HapticFeedback.selectionClick();
    Clipboard.setData(ClipboardData(text: _currentText));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.ink,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
          side: const BorderSide(color: AppColors.yellow, width: 2.0),
        ),
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.yellow, size: 20),
            const SizedBox(width: 10),
            Text(
              'Teks narasi AI berhasil disalin!',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _shareNarration() {
    HapticFeedback.selectionClick();
    _copyToClipboard();
  }

  @override
  Widget build(BuildContext context) {
    final caseStudyText = widget.contohKasus is List
        ? (widget.contohKasus as List).join('\n\n')
        : widget.contohKasus?.toString();

    final displayText = !_hasTypedOnce && _typeCtrl.isAnimating
        ? _currentText.substring(
            0,
            _charCountAnim.value.clamp(0, _currentText.length),
          )
        : _currentText;

    return Column(
      children: [
        // AI Narrative Card
        StackedCard(
          layerColors: const [AppColors.blue, AppColors.yellow],
          offsetStep: const Offset(4, 4),
          radius: 22,
          padding: EdgeInsets.zero,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Kartu Berwarna Biru Soft
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  color: AppColors.blueSoft,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                  border: Border(bottom: BorderSide(color: AppColors.ink, width: 2.0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.yellow,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.ink, width: 1.6),
                          ),
                          child: Text(
                            'AI STORYTELLER',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'DUAL ENGINE',
                          style: GoogleFonts.jetBrainsMono(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppColors.blue,
                          ),
                        ),
                      ],
                    ),

                    // Language Selector Pills (ID / EN) & Action Buttons
                    Row(
                      children: [
                        _langPill('ID', _currentLang == 'id', () {
                          setState(() {
                            _currentLang = 'id';
                            _initTypewriter();
                          });
                        }),
                        const SizedBox(width: 4),
                        _langPill('EN', _currentLang == 'en', () {
                          setState(() {
                            _currentLang = 'en';
                            _initTypewriter();
                          });
                        }),
                        const SizedBox(width: 8),

                        // Tombol Salin
                        SquircleIconButton(
                          icon: Icons.copy_rounded,
                          size: 30,
                          iconSize: 15,
                          radius: 8,
                          color: Colors.white,
                          shadowOffset: const Offset(1.5, 1.5),
                          tooltip: 'Salin Teks',
                          onPressed: _copyToClipboard,
                        ),
                        const SizedBox(width: 6),

                        // Tombol Expand / Collapse
                        SquircleIconButton(
                          icon: _isExpanded
                              ? Icons.keyboard_arrow_up_rounded
                              : Icons.keyboard_arrow_down_rounded,
                          size: 30,
                          iconSize: 18,
                          radius: 8,
                          color: AppColors.yellow,
                          shadowOffset: const Offset(1.5, 1.5),
                          tooltip: _isExpanded ? 'Sembunyikan' : 'Tampilkan',
                          onPressed: () {
                            setState(() => _isExpanded = !_isExpanded);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Isi Konten Narasi dengan Efek Animasi Expand/Collapse
              AnimatedCrossFade(
                duration: const Duration(milliseconds: 260),
                crossFadeState: _isExpanded
                    ? CrossFadeState.showFirst
                    : CrossFadeState.showSecond,
                firstChild: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MarkdownBody(
                        data: displayText,
                        styleSheet: MarkdownStyleSheet(
                          p: GoogleFonts.inter(
                            fontSize: 13.5,
                            height: 1.55,
                            color: AppColors.ink,
                          ),
                          h1: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                          h2: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                          h3: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                          strong: const TextStyle(
                            fontWeight: FontWeight.w800,
                            color: AppColors.blue,
                          ),
                          blockquote: GoogleFonts.inter(
                            fontSize: 13,
                            color: AppColors.muted,
                            fontStyle: FontStyle.italic,
                          ),
                          blockquoteDecoration: BoxDecoration(
                            border: const Border(
                              left: BorderSide(color: AppColors.yellow, width: 3),
                            ),
                            color: AppColors.yellowSoft.withValues(alpha: 0.4),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Footer Actions: Salin dan Bagikan
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton.icon(
                            icon: const Icon(Icons.share_outlined,
                                size: 16, color: AppColors.blue),
                            label: Text(
                              'Bagikan Narasi',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.blue,
                              ),
                            ),
                            onPressed: _shareNarration,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                secondChild: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  child: Text(
                    'Narasi AI disembunyikan. Klik panah untuk membuka.',
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.muted),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Kartu Contoh Kasus & Analogi (Jika ada)
        if (caseStudyText != null && caseStudyText.isNotEmpty) ...[
          const SizedBox(height: 16),
          StackedCard(
            layerColors: const [AppColors.yellow],
            offsetStep: const Offset(3.5, 3.5),
            radius: 20,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.lightbulb_outline_rounded,
                        size: 18, color: Color(0xFF998A00)),
                    const SizedBox(width: 8),
                    Text(
                      'CONTOH KASUS & ANALOGI NYATA',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  caseStudyText,
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    color: AppColors.ink,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _langPill(String code, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: active ? AppColors.blue : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.ink, width: 1.4),
        ),
        child: Text(
          code,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            color: active ? Colors.white : AppColors.ink,
          ),
        ),
      ),
    );
  }
}
