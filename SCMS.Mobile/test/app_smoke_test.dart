import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:scms_mobile/src/app/app.dart';
import 'package:scms_mobile/src/core/config/app_config.dart';
import 'package:scms_mobile/src/core/di/app_providers.dart';
import 'package:scms_mobile/src/core/storage/secure_token_store.dart';

class FakeTokenStore extends SecureTokenStore {
  const FakeTokenStore();

  @override
  Future<String?> readToken() async => null;

  @override
  Future<void> saveToken(String token) async {}

  @override
  Future<void> clear() async {}
}

void main() {
  testWidgets('shows login screen when no session is restored', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appConfigProvider.overrideWithValue(
            const AppConfig(
              flavor: AppFlavor.development,
              apiBaseUrl: 'http://localhost:5140/',
              enableNetworkLogging: false,
            ),
          ),
          secureTokenStoreProvider.overrideWithValue(const FakeTokenStore()),
        ],
        child: const ScmsApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('SCMS'), findsOneWidget);
    expect(find.text('Sign in to continue'), findsOneWidget);
  });
}
