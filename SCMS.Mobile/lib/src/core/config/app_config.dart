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
  });

  factory AppConfig.fromEnvironment() {
    const flavorValue = String.fromEnvironment(
      'APP_FLAVOR',
      defaultValue: 'development',
    );

    const apiBaseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:5140/',
    );

    const enableNetworkLogging = bool.fromEnvironment(
      'ENABLE_NETWORK_LOGGING',
      defaultValue: true,
    );

    return AppConfig(
      flavor: AppFlavor.parse(flavorValue),
      apiBaseUrl: apiBaseUrl,
      enableNetworkLogging: enableNetworkLogging,
    );
  }

  final AppFlavor flavor;
  final String apiBaseUrl;
  final bool enableNetworkLogging;

  bool get isProduction => flavor == AppFlavor.production;
}

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});
