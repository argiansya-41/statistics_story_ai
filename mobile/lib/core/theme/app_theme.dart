import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// Tema Mewah & Playful-Premium Statistics Story AI
class AppTheme {
  static ThemeData get lightTheme {
    final interFont = GoogleFonts.inter();
    final headingFont = GoogleFonts.plusJakartaSans();
    final monoFont = GoogleFonts.jetBrainsMono();

    final baseTheme = ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.bg,
      primaryColor: AppColors.blue,
      splashFactory: InkSparkle.splashFactory,
      fontFamily: interFont.fontFamily,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.blue,
        onPrimary: Colors.white,
        secondary: AppColors.yellow,
        onSecondary: AppColors.ink,
        error: AppColors.red,
        onError: Colors.white,
        surface: AppColors.card,
        onSurface: AppColors.ink,
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: PremiumPageTransitionsBuilder(),
          TargetPlatform.iOS: PremiumPageTransitionsBuilder(),
          TargetPlatform.windows: PremiumPageTransitionsBuilder(),
          TargetPlatform.macOS: PremiumPageTransitionsBuilder(),
          TargetPlatform.linux: PremiumPageTransitionsBuilder(),
        },
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: IconThemeData(color: AppColors.ink),
      ),
    );

    return baseTheme.copyWith(
      textTheme: baseTheme.textTheme.copyWith(
        displayLarge: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.8,
        ),
        displayMedium: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.6,
        ),
        headlineLarge: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.5,
        ),
        headlineMedium: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.4,
        ),
        headlineSmall: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
        ),
        titleLarge: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        titleMedium: headingFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
        titleSmall: headingFont.copyWith(
          color: AppColors.muted,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
        bodyLarge: interFont.copyWith(
          color: AppColors.ink,
          fontSize: 15,
          height: 1.45,
        ),
        bodyMedium: interFont.copyWith(
          color: AppColors.ink,
          fontSize: 13.5,
          height: 1.4,
        ),
        bodySmall: interFont.copyWith(
          color: AppColors.muted,
          fontSize: 12,
        ),
        labelLarge: monoFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.6,
          fontSize: 13,
        ),
        labelMedium: monoFont.copyWith(
          color: AppColors.ink,
          fontWeight: FontWeight.w600,
          fontSize: 11.5,
        ),
      ),
    );
  }
}

/// Transisi Halaman Kustom (Kombinasi Fade + Slide + Scale halus)
class PremiumPageTransitionsBuilder extends PageTransitionsBuilder {
  const PremiumPageTransitionsBuilder();

  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    if (animation.status == AnimationStatus.reverse) {
      return FadeTransition(opacity: animation, child: child);
    }

    final curved = CurvedAnimation(
      parent: animation,
      curve: Curves.easeOutCubic,
    );

    final slideAnim = Tween<Offset>(
      begin: const Offset(0.05, 0.0),
      end: Offset.zero,
    ).animate(curved);

    final scaleAnim = Tween<double>(
      begin: 0.98,
      end: 1.0,
    ).animate(curved);

    return SlideTransition(
      position: slideAnim,
      child: ScaleTransition(
        scale: scaleAnim,
        child: FadeTransition(
          opacity: curved,
          child: child,
        ),
      ),
    );
  }
}
