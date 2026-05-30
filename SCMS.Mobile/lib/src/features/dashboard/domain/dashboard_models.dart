import '../../appointments/domain/appointment_models.dart';
import '../../patients/domain/patient_models.dart';

class UpcomingPatientDto {
  const UpcomingPatientDto({
    required this.id,
    required this.appointmentCode,
    required this.patientName,
    required this.datetime,
    required this.tokenNumber,
    this.notes,
  });

  factory UpcomingPatientDto.fromJson(Map<String, dynamic> json) {
    return UpcomingPatientDto(
      id: json['id'] as int? ?? 0,
      appointmentCode: json['appointmentCode'] as String? ?? '',
      patientName: json['patientName'] as String? ?? '',
      datetime: json['datetime'] as String? ?? '',
      tokenNumber: json['tokenNumber'] as int? ?? 0,
      notes: json['notes'] as String?,
    );
  }

  final int id;
  final String appointmentCode;
  final String patientName;
  final String datetime;
  final int tokenNumber;
  final String? notes;
}

class DoctorDashboardResponse {
  const DoctorDashboardResponse({
    required this.todayAppointmentsCount,
    required this.nextPatients,
    required this.lowStockAlertsCount,
    required this.expiringBatchesCount,
    required this.dailyRevenue,
    required this.lowStockAlerts,
    required this.expiringBatchesAlerts,
  });

  factory DoctorDashboardResponse.fromJson(Map<String, dynamic> json) {
    return DoctorDashboardResponse(
      todayAppointmentsCount: json['todayAppointmentsCount'] as int? ?? 0,
      nextPatients: (json['nextPatients'] as List<dynamic>?)
              ?.map((e) => UpcomingPatientDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lowStockAlertsCount: json['lowStockAlertsCount'] as int? ?? 0,
      expiringBatchesCount: json['expiringBatchesCount'] as int? ?? 0,
      dailyRevenue: (json['dailyRevenue'] as num?)?.toDouble() ?? 0.0,
      lowStockAlerts: (json['lowStockAlerts'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      expiringBatchesAlerts: (json['expiringBatchesAlerts'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }

  final int todayAppointmentsCount;
  final List<UpcomingPatientDto> nextPatients;
  final int lowStockAlertsCount;
  final int expiringBatchesCount;
  final double dailyRevenue;
  final List<String> lowStockAlerts;
  final List<String> expiringBatchesAlerts;
}

class UnpaidInvoiceDto {
  const UnpaidInvoiceDto({
    required this.id,
    required this.appointmentId,
    required this.appointmentCode,
    required this.amount,
    required this.tax,
    required this.charges,
    required this.paymentStatus,
    required this.paymentMethod,
  });

  factory UnpaidInvoiceDto.fromJson(Map<String, dynamic> json) {
    return UnpaidInvoiceDto(
      id: json['id'] as int? ?? 0,
      appointmentId: json['appointmentId'] as int? ?? 0,
      appointmentCode: json['appointmentCode'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      charges: (json['charges'] as num?)?.toDouble() ?? 0.0,
      paymentStatus: json['paymentStatus'] as String? ?? '',
      paymentMethod: json['paymentMethod'] as String? ?? '',
    );
  }

  final int id;
  final int appointmentId;
  final String appointmentCode;
  final double amount;
  final double tax;
  final double charges;
  final String paymentStatus;
  final String paymentMethod;
}

class PrescriptionItemResponse {
  const PrescriptionItemResponse({
    required this.id,
    required this.medicineName,
    required this.dosage,
    required this.days,
    required this.quantity,
    required this.instruction,
  });

  factory PrescriptionItemResponse.fromJson(Map<String, dynamic> json) {
    return PrescriptionItemResponse(
      id: json['id'] as int? ?? 0,
      medicineName: json['medicineName'] as String? ?? '',
      dosage: json['dosage'] as String? ?? '',
      days: json['days'] as int? ?? 0,
      quantity: json['quantity'] as int? ?? 0,
      instruction: json['instruction'] as String? ?? '',
    );
  }

  final int id;
  final String medicineName;
  final String dosage;
  final int days;
  final int quantity;
  final String instruction;
}

class PrescriptionResponse {
  const PrescriptionResponse({
    required this.id,
    required this.appointmentId,
    required this.appointmentCode,
    required this.patientId,
    required this.patientName,
    required this.diseaseId,
    this.diseaseName,
    required this.weightKg,
    required this.bloodPressureSystolic,
    required this.bloodPressureDiastolic,
    this.notes,
    this.temperatureC,
    this.pulseBpm,
    this.spo2Percent,
    this.heightCm,
    this.bmi,
    this.labTestRequests,
    required this.items,
    required this.createdAt,
  });

  factory PrescriptionResponse.fromJson(Map<String, dynamic> json) {
    return PrescriptionResponse(
      id: json['id'] as int? ?? 0,
      appointmentId: json['appointmentId'] as int? ?? 0,
      appointmentCode: json['appointmentCode'] as String? ?? '',
      patientId: json['patientId'] as int? ?? 0,
      patientName: json['patientName'] as String? ?? '',
      diseaseId: json['diseaseId'] as int? ?? 0,
      diseaseName: json['diseaseName'] as String?,
      weightKg: (json['weightKg'] as num?)?.toDouble() ?? 0.0,
      bloodPressureSystolic: json['bloodPressureSystolic'] as int? ?? 0,
      bloodPressureDiastolic: json['bloodPressureDiastolic'] as int? ?? 0,
      notes: json['notes'] as String?,
      temperatureC: (json['temperatureC'] as num?)?.toDouble(),
      pulseBpm: json['pulseBpm'] as int?,
      spo2Percent: json['spo2Percent'] as int?,
      heightCm: (json['heightCm'] as num?)?.toDouble(),
      bmi: (json['bmi'] as num?)?.toDouble(),
      labTestRequests: json['labTestRequests'] as String?,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => PrescriptionItemResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  final int id;
  final int appointmentId;
  final String appointmentCode;
  final int patientId;
  final String patientName;
  final int diseaseId;
  final String? diseaseName;
  final double weightKg;
  final int bloodPressureSystolic;
  final int bloodPressureDiastolic;
  final String? notes;
  final double? temperatureC;
  final int? pulseBpm;
  final int? spo2Percent;
  final double? heightCm;
  final double? bmi;
  final String? labTestRequests;
  final List<PrescriptionItemResponse> items;
  final DateTime createdAt;
}

class PatientDashboardResponse {
  const PatientDashboardResponse({
    required this.patientProfiles,
    required this.upcomingAppointments,
    required this.prescriptionHistory,
    required this.outstandingBalances,
  });

  factory PatientDashboardResponse.fromJson(Map<String, dynamic> json) {
    return PatientDashboardResponse(
      patientProfiles: (json['patientProfiles'] as List<dynamic>?)
              ?.map((e) => PatientProfileResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      upcomingAppointments: (json['upcomingAppointments'] as List<dynamic>?)
              ?.map((e) => AppointmentDetailsResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      prescriptionHistory: (json['prescriptionHistory'] as List<dynamic>?)
              ?.map((e) => PrescriptionResponse.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      outstandingBalances: (json['outstandingBalances'] as List<dynamic>?)
              ?.map((e) => UnpaidInvoiceDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  final List<PatientProfileResponse> patientProfiles;
  final List<AppointmentDetailsResponse> upcomingAppointments;
  final List<PrescriptionResponse> prescriptionHistory;
  final List<UnpaidInvoiceDto> outstandingBalances;
}
