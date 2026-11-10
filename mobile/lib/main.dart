import 'dart:ui';
import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/screens/preloader_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StatisticsStoryApp());
}

/// Custom ScrollBehavior untuk memastikan scroll sentuh & drag di perangkat mobile (Web & App)
/// berjalan 100% mulus tanpa lag atau macet.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };
}

class StatisticsStoryApp extends StatelessWidget {
  const StatisticsStoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Statistics Story AI',
      debugShowCheckedModeBanner: false,
      scrollBehavior: const AppScrollBehavior(),
      theme: AppTheme.lightTheme,
      home: const PreloaderScreen(),
    );
  }
}
