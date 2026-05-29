import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/dashboard_repository.dart';
import '../domain/dashboard_models.dart';

final doctorDashboardProvider = FutureProvider.autoDispose<DoctorDashboardResponse>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getDoctorDashboard();
});

final patientDashboardProvider = FutureProvider.autoDispose<PatientDashboardResponse>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getPatientDashboard();
});
