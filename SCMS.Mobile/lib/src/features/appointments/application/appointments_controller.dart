import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/appointments_repository.dart';
import '../domain/appointment_models.dart';

class AppointmentsState {
  const AppointmentsState({
    required this.appointments,
    required this.isLoading,
    this.errorMessage,
    required this.selectedStatus,
    required this.selectedRange,
  });

  factory AppointmentsState.initial() {
    return const AppointmentsState(
      appointments: [],
      isLoading: false,
      selectedStatus: 'All',
      selectedRange: 'Day',
    );
  }

  final List<AppointmentDetailsResponse> appointments;
  final bool isLoading;
  final String? errorMessage;
  final String selectedStatus;
  final String selectedRange;

  AppointmentsState copyWith({
    List<AppointmentDetailsResponse>? appointments,
    bool? isLoading,
    String? errorMessage,
    String? selectedStatus,
    String? selectedRange,
  }) {
    return AppointmentsState(
      appointments: appointments ?? this.appointments,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      selectedRange: selectedRange ?? this.selectedRange,
    );
  }
}

class AppointmentsNotifier extends Notifier<AppointmentsState> {
  @override
  AppointmentsState build() {
    // Proactively fetch when build starts
    Future.microtask(fetchAppointments);
    return AppointmentsState.initial();
  }

  Future<void> fetchAppointments() async {
    state = state.copyWith(isLoading: true);
    try {
      DateTime? startDate;
      DateTime? endDate;
      final now = DateTime.now();

      if (state.selectedRange == 'Day') {
        startDate = DateTime(now.year, now.month, now.day);
        endDate = startDate.add(const Duration(days: 1));
      } else if (state.selectedRange == 'Week') {
        startDate = now.subtract(Duration(days: now.weekday - 1));
        startDate = DateTime(startDate.year, startDate.month, startDate.day);
        endDate = startDate.add(const Duration(days: 7));
      } else if (state.selectedRange == 'Month') {
        startDate = DateTime(now.year, now.month, 1);
        endDate = DateTime(now.year, now.month + 1, 1);
      }

      final list = await ref.read(appointmentsRepositoryProvider).getAppointments(
            startDate: startDate,
            endDate: endDate,
            status: state.selectedStatus,
          );

      state = state.copyWith(appointments: list, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void changeStatus(String status) {
    if (state.selectedStatus != status) {
      state = state.copyWith(selectedStatus: status);
      fetchAppointments();
    }
  }

  void changeRange(String range) {
    if (state.selectedRange != range) {
      state = state.copyWith(selectedRange: range);
      fetchAppointments();
    }
  }

  Future<void> updateStatus(int id, String status, {String? notes}) async {
    await ref.read(appointmentsRepositoryProvider).updateAppointmentStatus(id, status, notes: notes);
    await fetchAppointments();
  }

  Future<void> reschedule(int id, DateTime newDatetime, {String? notes}) async {
    await ref.read(appointmentsRepositoryProvider).rescheduleAppointment(id, newDatetime, notes: notes);
    await fetchAppointments();
  }

  Future<void> callNext() async {
    await ref.read(appointmentsRepositoryProvider).callNextPatient();
    await fetchAppointments();
  }

  Future<void> book(int patientId, DateTime datetime, {String? notes}) async {
    final req = BookAppointmentRequest(
      patientId: patientId,
      datetime: datetime,
      notes: notes,
    );
    await ref.read(appointmentsRepositoryProvider).bookAppointment(req);
    await fetchAppointments();
  }
}

final appointmentsControllerProvider =
    NotifierProvider.autoDispose<AppointmentsNotifier, AppointmentsState>(
  AppointmentsNotifier.new,
);
