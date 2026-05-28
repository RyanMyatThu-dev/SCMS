import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/patients_repository.dart';

final patientsControllerProvider = FutureProvider.autoDispose<List<String>>((
  ref,
) {
  return ref.watch(patientsRepositoryProvider).listRecentPatients();
});
