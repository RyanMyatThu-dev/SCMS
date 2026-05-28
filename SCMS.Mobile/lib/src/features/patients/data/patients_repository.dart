import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/app_providers.dart';
import '../../../core/network/api_client.dart';

final patientsRepositoryProvider = Provider<PatientsRepository>((ref) {
  return PatientsRepository(ref.watch(apiClientProvider));
});

class PatientsRepository {
  const PatientsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<String>> listRecentPatients() async {
    // Wire to GET /api/... once the mobile contract is finalized.
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return const ['Aung Min', 'Thandar Hlaing', 'Mya Win'];
  }

  ApiClient get apiClient => _apiClient;
}
