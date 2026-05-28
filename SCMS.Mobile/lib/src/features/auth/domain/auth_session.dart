class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.email,
    required this.role,
  });

  final String accessToken;
  final String email;
  final String role;
}
