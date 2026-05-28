import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/app_providers.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/secure_token_store.dart';
import '../domain/auth_session.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(
    apiClient: ref.watch(apiClientProvider),
    tokenStore: ref.watch(secureTokenStoreProvider),
  );
});

class AuthRepository {
  const AuthRepository({
    required ApiClient apiClient,
    required SecureTokenStore tokenStore,
  }) : _apiClient = apiClient,
       _tokenStore = tokenStore;

  final ApiClient _apiClient;
  final SecureTokenStore _tokenStore;

  Future<AuthSession?> restoreSession() async {
    final token = await _tokenStore.readToken();

    if (token == null || token.isEmpty) {
      return null;
    }

    return AuthSession(
      accessToken: token,
      email: 'restored@scms.local',
      role: 'user',
    );
  }

  Future<AuthSession> signIn({
    required String email,
    required String password,
  }) async {
    // Replace this placeholder with the real SCMS.Api auth endpoint contract.
    await Future<void>.delayed(const Duration(milliseconds: 250));
    final token = 'dev-token-for-$email';
    await _tokenStore.saveToken(token);

    return AuthSession(
      accessToken: token,
      email: email,
      role: email.contains('admin') ? 'admin' : 'user',
    );
  }

  Future<void> signOut() {
    return _tokenStore.clear();
  }

  ApiClient get apiClient => _apiClient;
}
