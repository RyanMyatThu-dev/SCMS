import 'package:dio/dio.dart';

import '../storage/secure_token_store.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._tokenStore);

  final SecureTokenStore _tokenStore;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _tokenStore.readToken();

    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }
}
