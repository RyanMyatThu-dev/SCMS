import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AppFlavor {
  development,
  staging,
  production;

  static AppFlavor parse(String value) {
    return switch (value.toLowerCase()) {
      'prod' || 'production' => AppFlavor.production,
      'staging' || 'stage' => AppFlavor.staging,
      _ => AppFlavor.development,
    };
  }
}

class AppConfig {
  const AppConfig({
    required this.flavor,
    required this.apiBaseUrl,
    required this.enableNetworkLogging,
    required this.connectTimeoutSeconds,
    required this.receiveTimeoutSeconds,
  });

  factory AppConfig.fromEnvironment() {
    const flavorValue = String.fromEnvironment(
      'APP_FLAVOR',
      defaultValue: 'development',
    );

    const rawApiBase = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:5140/',
    );

    // Allow multiple URLs separated by `;` (e.g. "https://localhost:7072;http://localhost:5140").
    final firstUrl = rawApiBase.split(';').firstWhere((s) => s.trim().isNotEmpty, orElse: () => rawApiBase).trim();

    // On Android emulator, use 10.0.2.2 to reach the host machine's localhost.
    final apiBaseUrl = (Platform.isAndroid && firstUrl.contains('localhost'))
        ? firstUrl.replaceAll('localhost', '10.0.2.2')
        : firstUrl;

    const enableNetworkLogging = bool.fromEnvironment(
      'ENABLE_NETWORK_LOGGING',
      defaultValue: true,
    );

    const connectTimeoutSeconds = int.fromEnvironment(
      'CONNECT_TIMEOUT_SECONDS',
      defaultValue: 60,
    );

    const receiveTimeoutSeconds = int.fromEnvironment(
      'RECEIVE_TIMEOUT_SECONDS',
      defaultValue: 60,
    );

    return AppConfig(
      flavor: AppFlavor.parse(flavorValue),
      apiBaseUrl: apiBaseUrl,
      enableNetworkLogging: enableNetworkLogging,
      connectTimeoutSeconds: connectTimeoutSeconds,
      receiveTimeoutSeconds: receiveTimeoutSeconds,
    );
  }

  final AppFlavor flavor;
  final String apiBaseUrl;
  final bool enableNetworkLogging;
  final int connectTimeoutSeconds;
  final int receiveTimeoutSeconds;

  bool get isProduction => flavor == AppFlavor.production;
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});
