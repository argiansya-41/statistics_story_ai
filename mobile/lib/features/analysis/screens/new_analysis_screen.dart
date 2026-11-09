import 'dart:convert';
import 'package:csv/csv.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/mobile_app_shell.dart';
import '../../../core/widgets/premium/premium_widgets.dart';
import '../../auth/widgets/helm_mascot.dart';
import 'analysis_detail_screen.dart';

class ValidationResult {
  final bool isValid;
  final List<String> issues;

  const ValidationResult({required this.isValid, required this.issues});
}

class NewAnalysisScreen extends StatefulWidget {
  final String? initialAnalysisType;

  const NewAnalysisScreen({super.key, this.initialAnalysisType});

  @override
  State<NewAnalysisScreen> createState() => _NewAnalysisScreenState();
}

class _NewAnalysisScreenState extends State<NewAnalysisScreen>
    with SingleTickerProviderStateMixin {
  int _currentStep = 1; // 1: Input Data, 2: Config, 3: Pipeline Processing
  final TextEditingController _sessionNameCtrl =
      TextEditingController(text: 'Analisis Baru');

  // Step 1: Data State
  String _inputMode = 'sample'; // 'sample', 'file'
  String? _pickedFileName;
  List<String> _columns = [];
  List<Map<String, dynamic>> _rows = [];
  String? _dataValidationError;

  // Step 2: Config State
  late String _selectedAnalysis; // 'deskriptif', 'uji_t', 'korelasi', 'regresi'
  String? _selectedCol1;
  String? _selectedCol2;

  // Step 3: Pipeline State
  int _pipelineStage = 0; // 0: Start, 1: Upload, 2: Run, 3: AI Narrative
  String? _pipelineError;

  // Upload card bounce animation
  late AnimationController _bounceCtrl;
  late Animation<double> _bounceAnim;

  @override
  void initState() {
    super.initState();
    _selectedAnalysis = widget.initialAnalysisType ?? 'deskriptif';
    _loadSampleData();

    _bounceCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _bounceAnim = Tween<double>(begin: 1.0, end: 1.04).animate(
      CurvedAnimation(parent: _bounceCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _sessionNameCtrl.dispose();
    _bounceCtrl.dispose();
    super.dispose();
  }

  bool _isColumnNumeric(String col) {
    if (_rows.isEmpty) return false;
    int numCount = 0;
    int totalCount = 0;
    for (var r in _rows) {
      final v = r[col];
      if (v == null || v.toString().trim().isEmpty) continue;
      totalCount++;
      if (v is num && !v.isNaN) {
        numCount++;
      } else if (num.tryParse(v.toString().trim()) != null) {
        numCount++;
      }
    }
    if (totalCount == 0) return false;
    return (numCount / totalCount) >= 0.7;
  }

  int _getDistinctCategoryCount(String col) {
    final Set<String> distinct = {};
    for (var r in _rows) {
      final v = r[col]?.toString().trim();
      if (v != null && v.isNotEmpty) {
        distinct.add(v);
      }
    }
    return distinct.length;
  }

  void _autoPickColumnsForType(String type) {
    if (_columns.isEmpty) return;

    final numericCols = _columns.where((c) => _isColumnNumeric(c)).toList();
    final nonNumericCols = _columns.where((c) => !_isColumnNumeric(c)).toList();
    final twoGroupCols =
        _columns.where((c) => _getDistinctCategoryCount(c) == 2).toList();

    if (type == 'deskriptif') {
      _selectedCol1 = numericCols.isNotEmpty ? numericCols.first : _columns.first;
    } else if (type == 'uji_t') {
      _selectedCol1 = numericCols.isNotEmpty ? numericCols.first : _columns.first;
      if (twoGroupCols.isNotEmpty) {
        _selectedCol2 = twoGroupCols.firstWhere(
          (c) => c != _selectedCol1,
          orElse: () => twoGroupCols.first,
        );
      } else if (nonNumericCols.isNotEmpty) {
        _selectedCol2 = nonNumericCols.firstWhere(
          (c) => c != _selectedCol1,
          orElse: () => nonNumericCols.first,
        );
      } else if (_columns.length > 1) {
        _selectedCol2 = _columns.firstWhere(
          (c) => c != _selectedCol1,
          orElse: () => _columns[1],
        );
      }
    } else if (type == 'korelasi' || type == 'regresi') {
      if (numericCols.isNotEmpty) {
        _selectedCol1 = numericCols.first;
        if (numericCols.length > 1) {
          _selectedCol2 = numericCols[1];
        } else if (_columns.length > 1) {
          _selectedCol2 = _columns.firstWhere(
            (c) => c != _selectedCol1,
            orElse: () => _columns[1],
          );
        }
      } else {
        _selectedCol1 = _columns.first;
        if (_columns.length > 1) {
          _selectedCol2 = _columns[1];
        }
      }
    }
  }

  ValidationResult _getValidationResult() {
    if (_rows.isEmpty) {
      return const ValidationResult(
        isValid: false,
        issues: ['Belum ada baris data yang dimuat. Silakan pilih sumber data.'],
      );
    }

    final issues = <String>[];

    if (_selectedCol1 == null || !_columns.contains(_selectedCol1)) {
      issues.add('Pilih variabel kolom terlebih dahulu.');
      return ValidationResult(isValid: false, issues: issues);
    }

    if (_selectedAnalysis == 'deskriptif') {
      final validNums = <num>[];
      for (var r in _rows) {
        final val = r[_selectedCol1];
        if (val is num && !val.isNaN) {
          validNums.add(val);
        } else if (val != null) {
          final p = num.tryParse(val.toString().trim());
          if (p != null) validNums.add(p);
        }
      }
      if (validNums.length < 2) {
        issues.add(
          "Kolom '$_selectedCol1' hanya memiliki ${validNums.length} data angka valid (minimal 2 data numerik).",
        );
      }
    } else if (_selectedAnalysis == 'uji_t') {
      if (_selectedCol2 == null || !_columns.contains(_selectedCol2)) {
        issues.add('Kolom nilai numerik dan kolom kelompok wajib dipilih.');
      } else if (_selectedCol1 == _selectedCol2) {
        issues.add('Kolom nilai dan kolom kelompok tidak boleh kolom yang sama.');
      } else {
        final groups = <String, List<num>>{};
        for (var r in _rows) {
          final g = (r[_selectedCol2]?.toString() ?? '').trim();
          if (g.isEmpty) continue;
          final val = r[_selectedCol1];
          num? numVal;
          if (val is num && !val.isNaN) {
            numVal = val;
          } else if (val != null) {
            numVal = num.tryParse(val.toString().trim());
          }

          if (!groups.containsKey(g)) groups[g] = [];
          if (numVal != null) groups[g]!.add(numVal);
        }

        final grpKeys = groups.keys.toList();
        final totalNums =
            groups.values.fold<int>(0, (sum, list) => sum + list.length);

        if (totalNums == 0) {
          issues.add(
            "Kolom nilai utama '$_selectedCol1' tidak berisi angka. Uji-T memerlukan kolom nilai numerik.",
          );
        }

        if (grpKeys.length != 2) {
          final sampleCats = grpKeys.take(4).join(', ');
          final extra = grpKeys.length > 4 ? ', ...' : '';
          issues.add(
            "Kolom kelompok '$_selectedCol2' harus memiliki tepat 2 kategori (ditemukan ${grpKeys.length}: $sampleCats$extra).",
          );
        } else {
          for (var k in grpKeys) {
            final count = groups[k]!.length;
            if (count < 2) {
              issues.add(
                "Kelompok '$k' hanya memiliki $count data angka valid (minimal 2 data per kelompok).",
              );
            }
          }
        }
      }
    } else if (_selectedAnalysis == 'korelasi') {
      if (_selectedCol2 == null || !_columns.contains(_selectedCol2)) {
        issues.add('Pilih variabel X dan Y untuk korelasi.');
      } else if (_selectedCol1 == _selectedCol2) {
        issues.add('Variabel X dan Y tidak boleh memilih kolom yang sama.');
      } else {
        final xs = <num>[];
        final ys = <num>[];
        for (var r in _rows) {
          final vx = r[_selectedCol1];
          final vy = r[_selectedCol2];
          num? nx, ny;
          if (vx is num && !vx.isNaN) {
            nx = vx;
          } else if (vx != null) {
            nx = num.tryParse(vx.toString().trim());
          }
          if (vy is num && !vy.isNaN) {
            ny = vy;
          } else if (vy != null) {
            ny = num.tryParse(vy.toString().trim());
          }

          if (nx != null && ny != null) {
            xs.add(nx);
            ys.add(ny);
          }
        }

        if (xs.length < 3) {
          issues.add(
            "Korelasi memerlukan minimal 3 pasangan data numerik lengkap (ditemukan ${xs.length}).",
          );
        } else {
          final firstX = xs.first;
          final firstY = ys.first;
          if (xs.every((x) => x == firstX)) {
            issues.add("Variabel X '$_selectedCol1' bernilai konstan (variansi 0).");
          }
          if (ys.every((y) => y == firstY)) {
            issues.add("Variabel Y '$_selectedCol2' bernilai konstan (variansi 0).");
          }
        }
      }
    } else if (_selectedAnalysis == 'regresi') {
      if (_selectedCol2 == null || !_columns.contains(_selectedCol2)) {
        issues.add('Pilih variabel bebas (X) dan terikat (Y) untuk regresi.');
      } else if (_selectedCol1 == _selectedCol2) {
        issues.add('Variabel bebas X dan terikat Y tidak boleh kolom yang sama.');
      } else {
        final xs = <num>[];
        final ys = <num>[];
        for (var r in _rows) {
          final vx = r[_selectedCol1];
          final vy = r[_selectedCol2];
          num? nx, ny;
          if (vx is num && !vx.isNaN) {
            nx = vx;
          } else if (vx != null) {
            nx = num.tryParse(vx.toString().trim());
          }
          if (vy is num && !vy.isNaN) {
            ny = vy;
          } else if (vy != null) {
            ny = num.tryParse(vy.toString().trim());
          }

          if (nx != null && ny != null) {
            xs.add(nx);
            ys.add(ny);
          }
        }

        if (xs.length < 3) {
          issues.add(
            "Regresi memerlukan minimal 3 pasangan data numerik lengkap (ditemukan ${xs.length}).",
          );
        } else {
          final firstX = xs.first;
          if (xs.every((x) => x == firstX)) {
            issues.add("Variabel bebas X bernilai konstan (variansi 0).");
          }
        }
      }
    }

    return ValidationResult(
      isValid: issues.isEmpty,
      issues: issues,
    );
  }

  void _loadSampleData() {
    setState(() {
      _inputMode = 'sample';
      _pickedFileName = 'sampel_prestasi_akademik.csv';
      _columns = ['Jam_Belajar', 'Nilai_Ujian', 'Kehadiran', 'Kategori'];
      _rows = [
        {'Jam_Belajar': 2.5, 'Nilai_Ujian': 65, 'Kehadiran': 80, 'Kategori': 'Reguler'},
        {'Jam_Belajar': 4.0, 'Nilai_Ujian': 75, 'Kehadiran': 90, 'Kategori': 'Reguler'},
        {'Jam_Belajar': 5.5, 'Nilai_Ujian': 85, 'Kehadiran': 95, 'Kategori': 'Unggulan'},
        {'Jam_Belajar': 3.0, 'Nilai_Ujian': 70, 'Kehadiran': 85, 'Kategori': 'Reguler'},
        {'Jam_Belajar': 6.0, 'Nilai_Ujian': 92, 'Kehadiran': 100, 'Kategori': 'Unggulan'},
        {'Jam_Belajar': 1.5, 'Nilai_Ujian': 55, 'Kehadiran': 70, 'Kategori': 'Reguler'},
        {'Jam_Belajar': 4.5, 'Nilai_Ujian': 80, 'Kehadiran': 90, 'Kategori': 'Unggulan'},
        {'Jam_Belajar': 7.0, 'Nilai_Ujian': 98, 'Kehadiran': 100, 'Kategori': 'Unggulan'},
      ];
      _autoPickColumnsForType(_selectedAnalysis);
      _dataValidationError = null;
    });
  }

  Future<void> _pickFile() async {
    try {
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['csv', 'xlsx', 'xls'],
      );

      if (files.isNotEmpty) {
        final file = files.first;
        final bytes = await file.readAsBytes();
        final name = file.name;

        if (bytes.isEmpty) {
          setState(() => _dataValidationError = 'Gagal membaca berkas file.');
          return;
        }

        _bounceCtrl.forward().then((_) => _bounceCtrl.reverse());
        HapticFeedback.lightImpact();

        if (name.endsWith('.csv')) {
          _parseCsvBytes(bytes, name);
        } else {
          setState(() {
            _inputMode = 'file';
            _pickedFileName = name;
            _columns = ['(File Excel terdeteksi)'];
            _rows = [];
            _dataValidationError = null;
          });
        }
      }
    } catch (e) {
      setState(() => _dataValidationError = 'Error memilih file: $e');
    }
  }

  void _parseCsvBytes(List<int> bytes, String filename) {
    try {
      final csvString = utf8.decode(bytes);
      final List<List<dynamic>> csvTable = csv.decode(csvString);

      if (csvTable.length < 2) {
        setState(() {
          _dataValidationError =
              'File CSV minimal harus memiliki 1 baris header dan 1 baris data.';
        });
        return;
      }

      final header = csvTable.first.map((e) => e.toString().trim()).toList();
      final parsedRows = <Map<String, dynamic>>[];

      for (int i = 1; i < csvTable.length; i++) {
        final row = csvTable[i];
        if (row.isEmpty ||
            (row.length == 1 && row[0].toString().trim().isEmpty)) {
          continue;
        }

        final rowMap = <String, dynamic>{};
        for (int j = 0; j < header.length; j++) {
          final colName = header[j];
          final val = j < row.length ? row[j] : null;
          if (val is num) {
            rowMap[colName] = val;
          } else {
            final parsedNum = num.tryParse(val.toString().trim());
            rowMap[colName] = parsedNum ?? val.toString().trim();
          }
        }
        parsedRows.add(rowMap);
      }

      setState(() {
        _inputMode = 'file';
        _pickedFileName = filename;
        _columns = header;
        _rows = parsedRows;
        _autoPickColumnsForType(_selectedAnalysis);
        _dataValidationError = null;
      });
    } catch (e) {
      setState(() {
        _dataValidationError = 'Gagal memproses struktur CSV: $e';
      });
    }
  }

  Future<void> _startPipeline() async {
    final validation = _getValidationResult();
    if (!validation.isValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            validation.issues.isNotEmpty
                ? validation.issues.first
                : 'Syarat data minimum belum terpenuhi.',
          ),
          backgroundColor: AppColors.red,
        ),
      );
      return;
    }

    setState(() {
      _currentStep = 3;
      _pipelineStage = 1;
      _pipelineError = null;
    });

    try {
      final session = await ApiService()
          .createAnalysisSession(_sessionNameCtrl.text.trim());

      setState(() => _pipelineStage = 1);
      await ApiService().submitDatasetJson(
        analysisId: session.id,
        rows: _rows,
        datasetName: _pickedFileName ?? 'Dataset Analisis',
      );

      Map<String, dynamic> configJson = {};
      if (_selectedAnalysis == 'deskriptif') {
        configJson = {
          'kolom_ringkasan': [_selectedCol1 ?? _columns.first]
        };
      } else if (_selectedAnalysis == 'uji_t') {
        configJson = {
          'kolom_nilai': _selectedCol1 ?? _columns.first,
          'kolom_kelompok': _selectedCol2 ?? _columns.last,
        };
      } else if (_selectedAnalysis == 'korelasi') {
        configJson = {
          'kolom_x': _selectedCol1 ?? _columns.first,
          'kolom_y': _selectedCol2 ?? _columns.last,
        };
      } else if (_selectedAnalysis == 'regresi') {
        configJson = {
          'kolom_x': _selectedCol1 ?? _columns.first,
          'kolom_y': _selectedCol2 ?? _columns.last,
        };
      }

      await ApiService().saveAnalysisConfig(
        analysisId: session.id,
        jenisAnalisis: _selectedAnalysis,
        configJson: configJson,
      );

      setState(() => _pipelineStage = 2);
      await ApiService().runAnalysis(session.id);

      setState(() => _pipelineStage = 3);
      final finalRecord = await ApiService().generateNarrative(
        analysisId: session.id,
        lang: 'id',
      );

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => AnalysisDetailScreen(
            analysisId: session.id,
            initialRecord: finalRecord,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _pipelineError = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MobileAppShell(
      currentRoute: 'analisis_baru',
      showBackButton: true,
      onBackPressed: () {
        if (_currentStep > 1) {
          setState(() => _currentStep--);
        } else {
          Navigator.of(context).pop();
        }
      },
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Judul Halaman
            const SectionHeader(
              title: 'Pipeline Analisis Baru',
              subtitle: 'Ikuti 3 langkah mudah untuk menghasilkan cerita data',
            ),
            const SizedBox(height: 18),

            // Visual Stepper Neo-Brutalist dengan Konektor Garis
            _buildVisualStepper(),
            const SizedBox(height: 22),

            // Tampilan Tahap Berdasarkan Step
            if (_currentStep == 1) _buildStep1Data(),
            if (_currentStep == 2) _buildStep2Config(),
            if (_currentStep == 3) _buildStep3Pipeline(),
          ],
        ),
      ),
    );
  }

  /// Visual Stepper (Langkah 1 - 2 - 3) Ber-konektor Garis
  Widget _buildVisualStepper() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.ink, width: 2.2),
        boxShadow: const [
          BoxShadow(
            color: AppColors.yellow,
            offset: Offset(3, 3),
            blurRadius: 0,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _stepNode(1, 'DATA', _currentStep >= 1, _currentStep == 1),
          _stepConnector(_currentStep >= 2),
          _stepNode(2, 'KONFIG', _currentStep >= 2, _currentStep == 2),
          _stepConnector(_currentStep >= 3),
          _stepNode(3, 'PROSES AI', _currentStep >= 3, _currentStep == 3),
        ],
      ),
    );
  }

  Widget _stepNode(int step, String label, bool isDone, bool isActive) {
    final bgColor = isActive
        ? AppColors.yellow
        : (isDone ? AppColors.blue : Colors.white);
    final textColor = isActive
        ? AppColors.ink
        : (isDone ? Colors.white : AppColors.muted);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.ink, width: 2.0),
            boxShadow: isActive
                ? const [
                    BoxShadow(
                      color: AppColors.ink,
                      offset: Offset(1.5, 1.5),
                      blurRadius: 0,
                    ),
                  ]
                : null,
          ),
          child: Center(
            child: isDone && !isActive
                ? const Icon(Icons.check_rounded, size: 18, color: Colors.white)
                : Text(
                    '$step',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: textColor,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 5),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 10.5,
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
            color: isActive ? AppColors.ink : AppColors.muted,
          ),
        ),
      ],
    );
  }

  Widget _stepConnector(bool active) {
    return Expanded(
      child: Container(
        height: 3,
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
        decoration: BoxDecoration(
          color: active ? AppColors.blue : const Color(0xFFE2E8F0),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  // ================= STEP 1: INPUT DATA =================
  Widget _buildStep1Data() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Input Nama Sesi
        PremiumTextField(
          label: 'Nama Sesi Analisis',
          hintText: 'Contoh: Analisis Nilai Mahasiswa 2026',
          controller: _sessionNameCtrl,
          prefixIcon: Icons.edit_calendar_rounded,
        ),
        const SizedBox(height: 20),

        // Sumber Data Segmented Selector
        Text(
          'PILIH SUMBER DATASET',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
            letterSpacing: 0.4,
          ),
        ),
        const SizedBox(height: 8),

        Row(
          children: [
            Expanded(
              child: _sourcePillButton(
                label: 'SAMPEL CEPAT',
                icon: Icons.flash_on_rounded,
                isActive: _inputMode == 'sample',
                onTap: _loadSampleData,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _sourcePillButton(
                label: 'UNGGAH BERKAS',
                icon: Icons.upload_file_rounded,
                isActive: _inputMode == 'file',
                onTap: _pickFile,
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Area Upload CSV Bergaris Putus-putus dengan Efek Bounce
        ScaleTransition(
          scale: _bounceAnim,
          child: GestureDetector(
            onTap: _pickFile,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _pickedFileName != null ? AppColors.blue : AppColors.ink,
                  width: 2.2,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: AppColors.yellow,
                    offset: Offset(4, 4),
                    blurRadius: 0,
                  ),
                ],
              ),
              child: Column(
                children: [
                  Container(
                    width: 54,
                    height: 54,
                    decoration: BoxDecoration(
                      color: _pickedFileName != null
                          ? AppColors.blueSoft
                          : AppColors.yellowSoft,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.ink, width: 2.0),
                    ),
                    child: Center(
                      child: Icon(
                        _pickedFileName != null
                            ? Icons.check_circle_rounded
                            : Icons.cloud_upload_outlined,
                        size: 28,
                        color: _pickedFileName != null
                            ? AppColors.blue
                            : AppColors.ink,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _pickedFileName ?? 'Klik untuk Unggah Berkas CSV / Excel',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mendukung format .csv, .xlsx (Maksimal 10 MB)',
                    style: GoogleFonts.inter(fontSize: 11.5, color: AppColors.muted),
                  ),
                  if (_pickedFileName != null) ...[
                    const SizedBox(height: 12),
                    StatChip(
                      label: '${_rows.length} Baris • ${_columns.length} Kolom',
                      variant: StatChipVariant.green,
                      icon: Icons.table_chart_outlined,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),

        if (_dataValidationError != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.redSoft,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.red, width: 1.6),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline_rounded,
                    color: AppColors.red, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _dataValidationError!,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.redDark,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 18),

        // Preview Baris Data
        if (_rows.isNotEmpty) ...[
          Text(
            'PRATINJAU DATASET (5 BARIS PERTAMA)',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11.5,
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 160,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.ink, width: 2.0),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: SingleChildScrollView(
                scrollDirection: Axis.vertical,
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    headingRowHeight: 36,
                    dataRowMinHeight: 30,
                    dataRowMaxHeight: 30,
                    headingRowColor: WidgetStateProperty.all(AppColors.blueSoft),
                    columns: _columns
                        .map(
                          (c) => DataColumn(
                            label: Text(
                              c,
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                fontSize: 11.5,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                    rows: _rows.take(5).map((r) {
                      return DataRow(
                        cells: _columns
                            .map(
                              (c) => DataCell(
                                Text(
                                  r[c]?.toString() ?? '-',
                                  style: GoogleFonts.jetBrainsMono(fontSize: 11),
                                ),
                              ),
                            )
                            .toList(),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ),
        ],

        const SizedBox(height: 24),

        PrimaryButton(
          label: 'LANJUT KE KONFIGURASI ➔',
          variant: ButtonVariant.yellow,
          isDisabled: _rows.isEmpty,
          onPressed: () => setState(() => _currentStep = 2),
        ),
      ],
    );
  }

  Widget _sourcePillButton({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: isActive ? AppColors.yellow : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.ink, width: 2.0),
          boxShadow: isActive
              ? const [
                  BoxShadow(
                    color: AppColors.ink,
                    offset: Offset(2.5, 2.5),
                    blurRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: AppColors.ink),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ================= STEP 2: KONFIGURASI =================
  Widget _buildStep2Config() {
    final validation = _getValidationResult();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PILIH METODE ANALISIS',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),

        // 4 Pilihan Metode
        _analysisRadioCard(
          type: 'deskriptif',
          title: 'Statistik Deskriptif',
          subtitle: 'Mean, Median, Modus, Standar Deviasi sebaran data',
          icon: Icons.bar_chart_rounded,
          color: AppColors.blue,
        ),
        const SizedBox(height: 8),
        _analysisRadioCard(
          type: 'uji_t',
          title: 'Uji-T Dua Kelompok (Welch)',
          subtitle: 'Uji signifikansi beda rata-rata antar 2 kelompok',
          icon: Icons.compare_arrows_rounded,
          color: AppColors.red,
        ),
        const SizedBox(height: 8),
        _analysisRadioCard(
          type: 'korelasi',
          title: 'Korelasi Pearson',
          subtitle: 'Derajat keeratan hubungan linear antar 2 variabel',
          icon: Icons.alt_route_rounded,
          color: AppColors.yellow,
        ),
        const SizedBox(height: 8),
        _analysisRadioCard(
          type: 'regresi',
          title: 'Regresi Linear Sederhana',
          subtitle: 'Model persamaan prediksi Y = a + bX & koefisien R²',
          icon: Icons.trending_up_rounded,
          color: AppColors.blue,
        ),

        const SizedBox(height: 20),

        // Dynamic Column Pickers
        Text(
          'PILIHAN VARIABEL KOLOM',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: AppColors.ink,
          ),
        ),
        const SizedBox(height: 10),

        if (_selectedAnalysis == 'deskriptif') ...[
          _buildColumnDropdown(
            label: 'Kolom Numerik yang Dianalisis',
            value: _selectedCol1,
            onChanged: (v) => setState(() => _selectedCol1 = v),
          ),
        ] else if (_selectedAnalysis == 'uji_t') ...[
          _buildColumnDropdown(
            label: 'Kolom Nilai Numerik (Skor / Pengukuran)',
            value: _selectedCol1,
            onChanged: (v) => setState(() => _selectedCol1 = v),
          ),
          const SizedBox(height: 12),
          _buildColumnDropdown(
            label: 'Kolom Kelompok Kategori (Tepat 2 Grup)',
            value: _selectedCol2,
            onChanged: (v) => setState(() => _selectedCol2 = v),
          ),
        ] else if (_selectedAnalysis == 'korelasi') ...[
          _buildColumnDropdown(
            label: 'Variabel X (Numerik Pertama)',
            value: _selectedCol1,
            onChanged: (v) => setState(() => _selectedCol1 = v),
          ),
          const SizedBox(height: 12),
          _buildColumnDropdown(
            label: 'Variabel Y (Numerik Kedua)',
            value: _selectedCol2,
            onChanged: (v) => setState(() => _selectedCol2 = v),
          ),
        ] else if (_selectedAnalysis == 'regresi') ...[
          _buildColumnDropdown(
            label: 'Variabel Bebas (X)',
            value: _selectedCol1,
            onChanged: (v) => setState(() => _selectedCol1 = v),
          ),
          const SizedBox(height: 12),
          _buildColumnDropdown(
            label: 'Variabel Terikat (Y)',
            value: _selectedCol2,
            onChanged: (v) => setState(() => _selectedCol2 = v),
          ),
        ],

        const SizedBox(height: 18),

        // Live Validation Feedback Card
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: validation.isValid ? const Color(0xFFE6F9EE) : AppColors.redSoft,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: validation.isValid ? AppColors.success : AppColors.red,
              width: 1.8,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                validation.isValid
                    ? Icons.check_circle_rounded
                    : Icons.warning_amber_rounded,
                size: 20,
                color: validation.isValid ? AppColors.success : AppColors.red,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  validation.isValid
                      ? 'Dataset dan variabel memenuhi seluruh kriteria pengujian statistik.'
                      : validation.issues.first,
                  style: GoogleFonts.inter(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: validation.isValid
                        ? const Color(0xFF0F5132)
                        : AppColors.redDark,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        Row(
          children: [
            Expanded(
              child: PrimaryButton(
                label: 'KEMBALI',
                variant: ButtonVariant.outline,
                onPressed: () => setState(() => _currentStep = 1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                label: 'MULAI ANALISIS AI ➔',
                variant: ButtonVariant.yellow,
                isDisabled: !validation.isValid,
                onPressed: _startPipeline,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _analysisRadioCard({
    required String type,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _selectedAnalysis == type;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() {
          _selectedAnalysis = type;
          _autoPickColumnsForType(type);
        });
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.yellowSoft : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.blue : AppColors.ink,
            width: isSelected ? 2.2 : 1.8,
          ),
          boxShadow: isSelected
              ? const [
                  BoxShadow(
                    color: AppColors.ink,
                    offset: Offset(3, 3),
                    blurRadius: 0,
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.ink, width: 1.8),
              ),
              child: Icon(
                icon,
                size: 22,
                color: color == AppColors.yellow ? AppColors.ink : Colors.white,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 11.5,
                      color: AppColors.muted,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isSelected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_off_rounded,
              color: isSelected ? AppColors.blue : AppColors.muted,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildColumnDropdown({
    required String label,
    required String? value,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.muted,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.ink, width: 2.0),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _columns.contains(value) ? value : null,
              isExpanded: true,
              hint: const Text('Pilih kolom dataset...'),
              items: _columns.map((col) {
                final isNum = _isColumnNumeric(col);
                return DropdownMenuItem<String>(
                  value: col,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        col,
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      StatChip(
                        label: isNum ? 'NUMERIK' : 'KATEGORI',
                        variant: isNum
                            ? StatChipVariant.blue
                            : StatChipVariant.neutral,
                        fontSize: 9.5,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  // ================= STEP 3: PROCESSING PIPELINE =================
  Widget _buildStep3Pipeline() {
    return StackedCard(
      layerColors: const [AppColors.blue, AppColors.yellow],
      offsetStep: const Offset(6, 6),
      radius: 26,
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          // Maskot Pemandu Sigi Berpikir
          HelmMascot(
            character: MascotChar.sigi,
            expression: MascotExpression.think,
            size: 86,
            isBobbing: true,
          ),
          const SizedBox(height: 16),

          Text(
            'Sedang Memproses Data & AI...',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Statistik dihitung secara matematis lalu dikirimkan ke model AI untuk merangkai narasi akademis.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 12.5, color: AppColors.muted),
          ),
          const SizedBox(height: 24),

          // 3 Tahap Pipeline
          _pipelineStageTile(
            step: 1,
            title: 'Unggah & Validasi Dataset',
            done: _pipelineStage >= 1,
            inProgress: _pipelineStage == 1,
          ),
          const SizedBox(height: 12),
          _pipelineStageTile(
            step: 2,
            title: 'Komputasi Statistik Presisi (Pandas & SciPy)',
            done: _pipelineStage >= 2,
            inProgress: _pipelineStage == 2,
          ),
          const SizedBox(height: 12),
          _pipelineStageTile(
            step: 3,
            title: 'AI Storyteller Engine (Gemini / Groq)',
            done: _pipelineStage >= 3,
            inProgress: _pipelineStage == 3,
          ),

          if (_pipelineError != null) ...[
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.redSoft,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.red, width: 1.8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.error_outline_rounded,
                          color: AppColors.red, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Terjadi Kesalahan:',
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w800,
                          color: AppColors.redDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(_pipelineError!, style: GoogleFonts.inter(fontSize: 12)),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      PrimaryButton(
                        label: 'Coba Ulangi',
                        variant: ButtonVariant.red,
                        height: 42,
                        width: 130,
                        onPressed: _startPipeline,
                      ),
                      const SizedBox(width: 10),
                      TextButton(
                        onPressed: () => setState(() => _currentStep = 2),
                        child: Text(
                          'Kembali ke Konfigurasi',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _pipelineStageTile({
    required int step,
    required String title,
    required bool done,
    required bool inProgress,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: inProgress
            ? AppColors.yellowSoft
            : (done ? const Color(0xFFE6F9EE) : const Color(0xFFF1F5F9)),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: inProgress
              ? AppColors.blue
              : (done ? AppColors.success : const Color(0xFFCBD5E1)),
          width: 1.6,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 26,
            height: 26,
            decoration: BoxDecoration(
              color: done
                  ? AppColors.success
                  : (inProgress ? AppColors.blue : Colors.white),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.ink, width: 1.6),
            ),
            child: Center(
              child: inProgress
                  ? const SizedBox(
                      width: 12,
                      height: 12,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Icon(
                      done ? Icons.check_rounded : Icons.hourglass_top_rounded,
                      size: 14,
                      color: done ? Colors.white : AppColors.muted,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12.5,
                fontWeight: inProgress ? FontWeight.w800 : FontWeight.w600,
                color: AppColors.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
