import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/app_providers.dart';
import '../../../core/network/api_client.dart';

final appointmentsRepositoryProvider = Provider<AppointmentsRepository>((ref) {
  return AppointmentsRepository(ref.watch(apiClientProvider));
});

class AppointmentsRepository {
  const AppointmentsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<String>> listUpcomingAppointments() async {
    // Wire to GET /api/... once the mobile contract is finalized.
    await Future<void>.delayed(const Duration(milliseconds: 200));
    return const ['General consultation', 'Follow-up visit', 'Queue check-in'];
  }

  ApiClient get apiClient => _apiClient;
}
