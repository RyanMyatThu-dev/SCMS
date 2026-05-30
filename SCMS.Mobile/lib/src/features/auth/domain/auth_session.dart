class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.email,
    required this.name,
    required this.userId,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String email;
  final String name;
  final int userId;
  final String role;
}
