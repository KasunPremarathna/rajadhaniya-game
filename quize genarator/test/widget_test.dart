import 'package:flutter_test/flutter_test.dart';
import 'package:quiz_creator/main.dart';

void main() {
  testWidgets('App should render without errors', (WidgetTester tester) async {
    await tester.pumpWidget(const QuizCreatorApp());
    expect(find.text('Quiz Image Creator'), findsOneWidget);
  });
}
