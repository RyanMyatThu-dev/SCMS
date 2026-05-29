import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logging/logging.dart';

import '../core/config/app_config.dart';
import 'app.dart';

Future<void> bootstrap({AppConfig? config}) async {
  final resolvedConfig = config ?? AppConfig.fromEnvironment();

  Logger.root.level = resolvedConfig.enableNetworkLogging
      ? Level.ALL
      : Level.INFO;
  Logger.root.onRecord.listen((record) {
    debugPrint(
      '[${record.level.name}] ${record.loggerName}: ${record.message}',
    );
  });

  runApp(
    ProviderScope(
      overrides: [appConfigProvider.overrideWithValue(resolvedConfig)],
      child: const ScmsApp(),
    ),
  );
}
