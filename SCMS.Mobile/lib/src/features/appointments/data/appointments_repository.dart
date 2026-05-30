import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/app_providers.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../domain/appointment_models.dart';

final appointmentsRepositoryProvider = Provider<AppointmentsRepository>((ref) {
  return AppointmentsRepository(ref.watch(apiClientProvider));
});

class AppointmentsRepository {
  const AppointmentsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<AppointmentDetailsResponse>> getAppointments({
    DateTime? startDate,
    DateTime? endDate,
    String? status,
    int? patientId,
  }) async {
    final queryParameters = <String, dynamic>{};
    if (startDate != null) {
      queryParameters['startDate'] = startDate.toIso8601String();
    }
    if (endDate != null) {
      queryParameters['endDate'] = endDate.toIso8601String();
    }
    if (status != null && status.isNotEmpty && status.toLowerCase() != 'all') {
      queryParameters['status'] = status.toLowerCase();
    }
    if (patientId != null) {
      queryParameters['patientId'] = patientId;
    }

    final response = await _apiClient.get(
      '/Appointments',
      queryParameters: queryParameters,
    );

    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to load appointments');
    }

    final data = body['data'] as Map<String, dynamic>?;
    if (data == null) {
      return [];
    }

    final items = data['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => AppointmentDetailsResponse.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<AppointmentDetailsResponse> bookAppointment(BookAppointmentRequest request) async {
    final response = await _apiClient.post(
      '/Appointments',
      data: request.toJson(),
    );

    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to book appointment');
    }

    final data = body['data'] as Map<String, dynamic>?;
    if (data == null) {
      throw const AppException('No data returned from appointment booking');
    }

    return AppointmentDetailsResponse.fromJson(data);
  }

  Future<void> updateAppointmentStatus(int id, String status, {String? notes}) async {
    final response = await _apiClient.patch(
      '/Appointments/$id/status',
      data: {
        'status': status.toLowerCase(),
        'notes': notes,
      },
    );

    // Let's check response
    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to update status');
    }
  }

  Future<void> rescheduleAppointment(int id, DateTime newDatetime, {String? notes}) async {
    final response = await _apiClient.post(
      '/Appointments/$id/reschedule',
      data: {
        'newDatetime': newDatetime.toIso8601String(),
        'notes': notes,
      },
    );

    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to reschedule appointment');
    }
  }

  Future<void> callNextPatient() async {
    final response = await _apiClient.post('/Appointments/call-next');
    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to call next patient');
    }
  }

  ApiClient get apiClient => _apiClient;
}
