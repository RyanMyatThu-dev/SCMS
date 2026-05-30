import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/patients_repository.dart';
import '../domain/patient_models.dart';

// Currently selected patient in the staff EMR workspace
final selectedPatientIdProvider = StateProvider<int?>((ref) => null);

// Fetch all patient profiles
final patientsListProvider = FutureProvider.autoDispose<List<PatientProfileResponse>>((ref) async {
  final repository = ref.watch(patientsRepositoryProvider);
  return repository.getPatientProfiles();
});

// Fetch detailed profile for the selected patient
final patientDetailProvider = FutureProvider.autoDispose.family<PatientProfileResponse, int>((ref, id) async {
  final repository = ref.watch(patientsRepositoryProvider);
  return repository.getPatientProfileById(id);
});

// Fetch history for the selected patient
final patientHistoryProvider = FutureProvider.autoDispose.family<List<dynamic>, int>((ref, id) async {
  final repository = ref.watch(patientsRepositoryProvider);
  return repository.getPatientHistory(id);
});

// Fetch medical summary for the selected patient
final patientSummaryProvider = FutureProvider.autoDispose.family<Map<String, dynamic>, int>((ref, id) async {
  final repository = ref.watch(patientsRepositoryProvider);
  return repository.getMedicalSummary(id);
});
