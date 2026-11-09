import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';
import 'features/splash/screens/preloader_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const StatisticsStoryApp());
}

class StatisticsStoryApp extends StatelessWidget {
  const StatisticsStoryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Statistics Story AI',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const PreloaderScreen(),
    );
  }
}
