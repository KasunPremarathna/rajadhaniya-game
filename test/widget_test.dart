import 'package:flutter_test/flutter_test.dart';
import 'package:rajadhaniya/main.dart';

void main() {
  testWidgets('App renders era selection screen', (WidgetTester tester) async {
    await tester.pumpWidget(const RajadhaniyaApp());
    expect(find.text('Rajadhaniya'), findsOneWidget);
    expect(find.text('Anuradhapura Period'), findsOneWidget);
  });
}
