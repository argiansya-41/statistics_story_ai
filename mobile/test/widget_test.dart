import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('StatisticsStoryApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const StatisticsStoryApp());
    expect(find.byType(StatisticsStoryApp), findsOneWidget);
  });
}
