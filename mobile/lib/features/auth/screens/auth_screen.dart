import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/services/api_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/premium/premium_widgets.dart';
import '../../dashboard/screens/dashboard_screen.dart';
import '../widgets/auth_stage.dart';
import '../widgets/helm_mascot.dart';
import '../widgets/password_strength_bar.dart';
import '../widgets/role_selector.dart';

enum AuthMode { login, register }

class AuthScreen extends StatefulWidget {
  final AuthMode initialMode;

  const AuthScreen({super.key, this.initialMode = AuthMode.login});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen>
    with SingleTickerProviderStateMixin {
  late AuthMode _currentMode;

  // Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  // Focus Nodes
  final FocusNode _nameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _passwordFocus = FocusNode();
  final FocusNode _confirmFocus = FocusNode();

  // State
  String _selectedRole = 'student';
  bool _isLoading = false;
  bool _isSuccess = false;
  String? _errorMessage;
  String _lang = 'ID'; // 'ID' or 'EN'

  // Focused field for mascot reaction: 'idle', 'name', 'email', 'password', 'confirm'
  String _focusedField = 'idle';
  final bool _isPasswordPeeking = false;

  // Field validation errors
  String? _nameError;
  String? _emailError;
  String? _passwordError;
  String? _confirmPasswordError;

  // Shake controller for invalid form submissions
  late AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    _currentMode = widget.initialMode;

    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _nameFocus.addListener(() {
      if (_nameFocus.hasFocus) setState(() => _focusedField = 'name');
    });
    _emailFocus.addListener(() {
      if (_emailFocus.hasFocus) setState(() => _focusedField = 'email');
    });
    _passwordFocus.addListener(() {
      if (_passwordFocus.hasFocus) setState(() => _focusedField = 'password');
    });
    _confirmFocus.addListener(() {
      if (_confirmFocus.hasFocus) setState(() => _focusedField = 'confirm');
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameFocus.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _confirmFocus.dispose();
    _shakeCtrl.dispose();
    super.dispose();
  }

  void _switchMode(AuthMode mode) {
    if (_currentMode == mode) return;
    setState(() {
      _currentMode = mode;
      _errorMessage = null;
      _nameError = null;
      _emailError = null;
      _passwordError = null;
      _confirmPasswordError = null;
      _focusedField = 'idle';
    });
  }

  String _getSpeechBubble() {
    if (_isSuccess) {
      return _lang == 'ID'
          ? 'HORE! LOGIN BERHASIL. MEMBUKA DASBOR...'
          : 'HOORAY! LOGIN SUCCESS. OPENING DASHBOARD...';
    }
    if (_isLoading) {
      return _lang == 'ID'
          ? 'MEMERIKSA KREDENSIAL KE SERVER...'
          : 'CHECKING CREDENTIALS WITH SERVER...';
    }
    if (_errorMessage != null) {
      return _lang == 'ID'
          ? 'UPS! PERIKSA KEMBALI EMAIL ATAU KATA SANDI YA.'
          : 'OOPS! PLEASE CHECK YOUR EMAIL OR PASSWORD.';
    }

    if (_focusedField == 'email') {
      return _lang == 'ID'
          ? 'GUNAKAN EMAIL KAMPUS ATAU EMAIL AKTIFMU YA!'
          : 'USE YOUR INSTITUTIONAL OR ACTIVE EMAIL!';
    }
    if (_focusedField == 'name') {
      return _lang == 'ID'
          ? 'SENANG BERKENALAN DENGANMU! SIAPA NAMAMU?'
          : 'NICE TO MEET YOU! WHAT IS YOUR NAME?';
    }
    if (_focusedField == 'password' || _focusedField == 'confirm') {
      if (_isPasswordPeeking) {
        return _lang == 'ID'
            ? 'SSTT... JANGAN SAMPAI ADA YANG MENGINTIP KATA SANDIMU!'
            : 'SHH... MAKE SURE NO ONE PEEKS AT YOUR PASSWORD!';
      }
      return _lang == 'ID'
          ? 'TENANG, KATA SANDIMU TERLINDUNGI DENGAN AMAN.'
          : 'DON\'T WORRY, YOUR PASSWORD IS SAFE AND SECURE.';
    }

    if (_currentMode == AuthMode.register &&
        _passwordController.text.isNotEmpty) {
      if (_passwordController.text.length < 8) {
        return _lang == 'ID'
            ? 'KATA SANDI MASIH AGAK LEMAH NIH. MINIMAL 8 KARAKTER!'
            : 'PASSWORD IS A BIT WEAK. MINIMUM 8 CHARACTERS!';
      }
      return _lang == 'ID'
          ? 'MANTAP! KATA SANDIMU SUDAH MEMENUHI SYARAT.'
          : 'AWESOME! YOUR PASSWORD MEETS SECURITY CRITERIA.';
    }

    if (_currentMode == AuthMode.login) {
      return _lang == 'ID'
          ? 'HAI! MASUK UNTUK MELANJUTKAN CERITAMU.'
          : 'HI! SIGN IN TO CONTINUE YOUR DATA STORY.';
    } else {
      return _lang == 'ID'
          ? 'HALO! DAFTARKAN DIRIMU DALAM HITUNGAN DETIK.'
          : 'HELLO! REGISTER YOUR ACCOUNT IN SECONDS.';
    }
  }

  MascotExpression _getSigiExpression() {
    if (_isSuccess) return MascotExpression.happy;
    if (_errorMessage != null) return MascotExpression.sad;
    if (_isLoading) return MascotExpression.happy;
    if (_focusedField == 'password' || _focusedField == 'confirm') {
      return _isPasswordPeeking ? MascotExpression.peek : MascotExpression.cover;
    }
    if (_focusedField == 'email') return MascotExpression.think;
    return MascotExpression.smile;
  }

  MascotExpression _getMuExpression() {
    if (_isSuccess) return MascotExpression.happy;
    if (_errorMessage != null) return MascotExpression.sad;
    if (_isLoading) return MascotExpression.happy;
    if (_focusedField == 'password' || _focusedField == 'confirm') {
      return _isPasswordPeeking ? MascotExpression.peek : MascotExpression.cover;
    }
    if (_focusedField == 'name') return MascotExpression.wink;
    return MascotExpression.smile;
  }

  MascotExpression _getQuinExpression() {
    if (_isSuccess) return MascotExpression.happy;
    if (_errorMessage != null) return MascotExpression.sad;
    if (_isLoading) return MascotExpression.happy;
    if (_focusedField == 'password' || _focusedField == 'confirm') {
      return _isPasswordPeeking ? MascotExpression.peek : MascotExpression.cover;
    }
    return MascotExpression.smile;
  }

  bool _validateForm() {
    bool valid = true;
    setState(() {
      _nameError = null;
      _emailError = null;
      _passwordError = null;
      _confirmPasswordError = null;
      _errorMessage = null;

      final email = _emailController.text.trim();
      final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
      if (email.isEmpty) {
        _emailError = _lang == 'ID'
            ? 'Email tidak boleh kosong.'
            : 'Email cannot be empty.';
        valid = false;
      } else if (!emailRegex.hasMatch(email)) {
        _emailError = _lang == 'ID'
            ? 'Format email tidak valid.'
            : 'Invalid email format.';
        valid = false;
      }

      final password = _passwordController.text;
      if (password.isEmpty) {
        _passwordError = _lang == 'ID'
            ? 'Kata sandi tidak boleh kosong.'
            : 'Password cannot be empty.';
        valid = false;
      } else if (password.length < 8 && _currentMode == AuthMode.register) {
        _passwordError = _lang == 'ID'
            ? 'Kata sandi minimal 8 karakter.'
            : 'At least 8 characters.';
        valid = false;
      }

      if (_currentMode == AuthMode.register) {
        final name = _nameController.text.trim();
        if (name.isEmpty) {
          _nameError = _lang == 'ID'
              ? 'Nama lengkap wajib diisi.'
              : 'Full name is required.';
          valid = false;
        } else if (name.length < 2) {
          _nameError = _lang == 'ID'
              ? 'Nama minimal 2 karakter.'
              : 'At least 2 characters.';
          valid = false;
        }

        final confirm = _confirmPasswordController.text;
        if (confirm != password) {
          _confirmPasswordError = _lang == 'ID'
              ? 'Konfirmasi kata sandi tidak cocok.'
              : 'Passwords do not match.';
          valid = false;
        }
      }
    });

    if (!valid) {
      _shakeCtrl.forward(from: 0.0);
      HapticFeedback.heavyImpact();
    }
    return valid;
  }

  Future<void> _handleSubmit() async {
    if (!_validateForm()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      Map<String, dynamic> response;
      if (_currentMode == AuthMode.login) {
        response = await ApiService().login(
          email: _emailController.text,
          password: _passwordController.text,
        );
      } else {
        response = await ApiService().register(
          name: _nameController.text,
          email: _emailController.text,
          password: _passwordController.text,
          role: _selectedRole,
        );
      }

      if (!mounted) return;

      final user = response['user'] as Map<String, dynamic>?;

      setState(() {
        _isLoading = false;
        _isSuccess = true;
      });

      HapticFeedback.lightImpact();

      await Future.delayed(const Duration(milliseconds: 500));

      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          transitionDuration: const Duration(milliseconds: 380),
          pageBuilder: (context, a1, a2) => DashboardScreen(initialUser: user),
          transitionsBuilder: (context, anim, a2, child) =>
              FadeTransition(opacity: anim, child: child),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isSuccess = false;
      });
      _shakeCtrl.forward(from: 0.0);
      HapticFeedback.heavyImpact();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLogin = _currentMode == AuthMode.login;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: DecorBackground(
        showBlobs: true,
        showRingArc: false,
        child: SingleChildScrollView(
          child: Column(
            children: [
              // 1. Panggung Maskot Neo-Brutalist Interaktif
              AuthStage(
                speechBubble: _getSpeechBubble(),
                sigiExpression: _getSigiExpression(),
                muExpression: _getMuExpression(),
                quinExpression: _getQuinExpression(),
                isLogin: isLogin,
                lang: _lang,
                onToggleLang: () {
                  setState(() => _lang = _lang == 'ID' ? 'EN' : 'ID');
                },
              ),

              // 2. Kanvas Formulir Bertumpuk (Stacked Card Floating)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 24,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: AnimatedBuilder(
                      animation: _shakeCtrl,
                      builder: (context, child) {
                        final sine = math.sin(_shakeCtrl.value * math.pi * 4) *
                            (1 - _shakeCtrl.value);
                        final offset = sine * 10.0;
                        return Transform.translate(
                          offset: Offset(offset, 0),
                          child: child,
                        );
                      },
                      child: StackedCard(
                        layerColors: const [AppColors.blue, AppColors.yellow],
                        offsetStep: const Offset(6, 6),
                        radius: 26,
                        padding: const EdgeInsets.all(22),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Tab Switcher Underline [ MASUK | DAFTAR ]
                            UnderlineTabBar(
                              activeKey: isLogin ? 'login' : 'register',
                              tabs: [
                                TabItem(
                                  keyName: 'login',
                                  label: _lang == 'ID' ? 'MASUK' : 'LOGIN',
                                  icon: Icons.login_rounded,
                                ),
                                TabItem(
                                  keyName: 'register',
                                  label: _lang == 'ID' ? 'DAFTAR' : 'REGISTER',
                                  icon: Icons.person_add_alt_1_rounded,
                                ),
                              ],
                              onTabChanged: (val) {
                                _switchMode(
                                  val == 'login'
                                      ? AuthMode.login
                                      : AuthMode.register,
                                );
                              },
                            ),

                            const SizedBox(height: 20),

                            // Field Nama (Hanya mode Register)
                            if (!isLogin) ...[
                              PremiumTextField(
                                label: _lang == 'ID'
                                    ? 'Nama Lengkap'
                                    : 'Full Name',
                                hintText: _lang == 'ID'
                                    ? 'Nama lengkapmu'
                                    : 'Your name',
                                controller: _nameController,
                                focusNode: _nameFocus,
                                prefixIcon: Icons.badge_outlined,
                                errorText: _nameError,
                                onChanged: (_) {
                                  if (_nameError != null) {
                                    setState(() => _nameError = null);
                                  }
                                },
                              ),
                              const SizedBox(height: 16),

                              // Segmented Role Selector
                              RoleSelector(
                                selectedRole: _selectedRole,
                                onRoleSelected: (role) {
                                  setState(() => _selectedRole = role);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],

                            // Field Email
                            PremiumTextField(
                              label: 'Email Kampus / Aktif',
                              hintText: 'nama@kampus.ac.id',
                              controller: _emailController,
                              focusNode: _emailFocus,
                              keyboardType: TextInputType.emailAddress,
                              prefixIcon: Icons.alternate_email_rounded,
                              errorText: _emailError,
                              onChanged: (_) {
                                if (_emailError != null) {
                                  setState(() => _emailError = null);
                                }
                              },
                            ),
                            const SizedBox(height: 16),

                            // Field Kata Sandi
                            PremiumTextField(
                              label: _lang == 'ID'
                                  ? 'Kata Sandi'
                                  : 'Password',
                              hintText: isLogin
                                  ? (_lang == 'ID'
                                      ? 'Masukkan kata sandi'
                                      : 'Enter password')
                                  : (_lang == 'ID'
                                      ? 'Minimal 8 karakter'
                                      : 'At least 8 chars'),
                              controller: _passwordController,
                              focusNode: _passwordFocus,
                              isPassword: true,
                              prefixIcon: Icons.lock_outline_rounded,
                              errorText: _passwordError,
                              onChanged: (_) {
                                if (_passwordError != null) {
                                  setState(() => _passwordError = null);
                                }
                              },
                            ),

                            // Password Strength Bar (Hanya mode Register)
                            if (!isLogin) ...[
                              const SizedBox(height: 8),
                              PasswordStrengthBar(
                                password: _passwordController.text,
                              ),
                              const SizedBox(height: 16),

                              // Field Konfirmasi Kata Sandi
                              PremiumTextField(
                                label: _lang == 'ID'
                                    ? 'Ulangi Kata Sandi'
                                    : 'Confirm Password',
                                hintText: _lang == 'ID'
                                    ? 'Ketik ulang kata sandi'
                                    : 'Repeat password',
                                controller: _confirmPasswordController,
                                focusNode: _confirmFocus,
                                isPassword: true,
                                prefixIcon: Icons.verified_user_outlined,
                                errorText: _confirmPasswordError,
                                onChanged: (_) {
                                  if (_confirmPasswordError != null) {
                                    setState(
                                      () => _confirmPasswordError = null,
                                    );
                                  }
                                },
                              ),
                            ],

                            // Lupa Kata Sandi
                            if (isLogin) ...[
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        backgroundColor: AppColors.ink,
                                        content: Text(
                                          _lang == 'ID'
                                              ? 'Fitur reset sandi dapat diakses via portal web atau hubungi admin.'
                                              : 'Password reset is available via the web portal or contact admin.',
                                          style: GoogleFonts.inter(
                                            color: Colors.white,
                                          ),
                                        ),
                                      ),
                                    );
                                  },
                                  style: TextButton.styleFrom(
                                    padding: EdgeInsets.zero,
                                    minimumSize: Size.zero,
                                    tapTargetSize:
                                        MaterialTapTargetSize.shrinkWrap,
                                  ),
                                  child: Text(
                                    _lang == 'ID'
                                        ? 'Lupa kata sandi?'
                                        : 'Forgot password?',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.muted,
                                    ),
                                  ),
                                ),
                              ),
                            ],

                            // Error Box Banner
                            if (_errorMessage != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.redSoft,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: AppColors.red,
                                    width: 1.8,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.warning_amber_rounded,
                                      color: AppColors.red,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _errorMessage!,
                                        style: GoogleFonts.inter(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.redDark,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 22),

                            // Tombol Submit Utama
                            PrimaryButton(
                              label: _isSuccess
                                  ? (_lang == 'ID'
                                      ? 'BERHASIL MASUK ✓'
                                      : 'SUCCESS ✓')
                                  : isLogin
                                      ? (_lang == 'ID'
                                          ? 'MASUK KE DASBOR'
                                          : 'SIGN IN')
                                      : (_lang == 'ID'
                                          ? 'BUAT AKUN SEKARANG'
                                          : 'CREATE ACCOUNT'),
                              variant: _isSuccess
                                  ? ButtonVariant.outline
                                  : ButtonVariant.yellow,
                              isLoading: _isLoading,
                              prefixIcon: _isSuccess
                                  ? Icons.check_circle_rounded
                                  : isLogin
                                      ? Icons.arrow_forward_rounded
                                      : Icons.person_add_rounded,
                              onPressed: _handleSubmit,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
