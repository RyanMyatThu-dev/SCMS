import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/appointments_repository.dart';

final appointmentsControllerProvider = FutureProvider.autoDispose<List<String>>(
  (ref) {
    return ref.watch(appointmentsRepositoryProvider).listUpcomingAppointments();
  },
);
