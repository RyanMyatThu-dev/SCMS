import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/di/app_providers.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/network/api_client.dart';
import '../domain/dashboard_models.dart';

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  return DashboardRepository(ref.watch(apiClientProvider));
});

class DashboardRepository {
  const DashboardRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<DoctorDashboardResponse> getDoctorDashboard() async {
    final response = await _apiClient.get('/Dashboards/dashboard');
    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to load doctor dashboard');
    }

    final data = body['data'] as Map<String, dynamic>?;
    if (data == null) {
      throw const AppException('No data returned for doctor dashboard');
    }

    return DoctorDashboardResponse.fromJson(data);
  }

  Future<PatientDashboardResponse> getPatientDashboard() async {
    final response = await _apiClient.get('/Dashboards/patient-dashboard');
    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to load patient dashboard');
    }

    final data = body['data'] as Map<String, dynamic>?;
    if (data == null) {
      throw const AppException('No data returned for patient dashboard');
    }

    return PatientDashboardResponse.fromJson(data);
  }

  Future<void> submitPaymentProof({
    required int appointmentId,
    required String paymentMethod,
    required double amount,
    required String screenshotUrl,
  }) async {
    final response = await _apiClient.post(
      '/Payments/manual-proof',
      data: {
        'appointmentId': appointmentId,
        'paymentMethod': paymentMethod,
        'amount': amount,
        'screenshotUrl': screenshotUrl,
      },
    );

    final body = response.data as Map<String, dynamic>?;
    if (body == null) {
      throw const AppException('Empty response from server');
    }

    final isSuccess = body['isSuccess'] as bool? ?? false;
    if (!isSuccess) {
      throw AppException(body['message'] as String? ?? 'Failed to submit payment proof');
    }
  }

  Future<Uint8List> downloadPrescriptionPdf(int prescriptionId) async {
    return _apiClient.getBytes('/Prescriptions/$prescriptionId/pdf');
  }

  Future<Uint8List> downloadInvoicePdf(int paymentId) async {
    return _apiClient.getBytes('/Payments/$paymentId/invoice/pdf');
  }
}
