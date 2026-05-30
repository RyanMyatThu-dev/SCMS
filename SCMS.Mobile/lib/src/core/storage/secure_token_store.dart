import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureTokenStore {
  const SecureTokenStore({
    FlutterSecureStorage storage = const FlutterSecureStorage(),
  }) : _storage = storage;

  static const _accessTokenKey = 'scms.access_token';
  static const _refreshTokenKey = 'scms.refresh_token';
  static const _roleKey = 'scms.role';
  static const _nameKey = 'scms.name';
  static const _userIdKey = 'scms.user_id';

  final FlutterSecureStorage _storage;

  Future<String?> readToken() {
    return _storage.read(key: _accessTokenKey);
  }

  Future<void> saveToken(String token) {
    return _storage.write(key: _accessTokenKey, value: token);
  }

  Future<String?> readRefreshToken() {
    return _storage.read(key: _refreshTokenKey);
  }

  Future<void> saveRefreshToken(String token) {
    return _storage.write(key: _refreshTokenKey, value: token);
  }

  Future<String?> readRole() {
    return _storage.read(key: _roleKey);
  }

  Future<void> saveRole(String role) {
    return _storage.write(key: _roleKey, value: role);
  }

  Future<String?> readName() {
    return _storage.read(key: _nameKey);
  }

  Future<void> saveName(String name) {
    return _storage.write(key: _nameKey, value: name);
  }

  Future<String?> readUserId() {
    return _storage.read(key: _userIdKey);
  }

  Future<void> saveUserId(String userId) {
    return _storage.write(key: _userIdKey, value: userId);
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _roleKey);
    await _storage.delete(key: _nameKey);
    await _storage.delete(key: _userIdKey);
  }
}
