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

class PatientDashboardResponse {
  const PatientDashboardResponse({
    required this.patientProfiles,
    required this.upcomingAppointments,
    required this.prescriptionHistory,
    required this.outstandingBalances,
  });

  factory PatientDashboardResponse.fromJson(Map<String, dynamic> json) {
    return PatientDashboardResponse(
      patientProfiles: (json['patientProfiles'] as List<dynamic>?) ?? [],
      upcomingAppointments: (json['upcomingAppointments'] as List<dynamic>?) ?? [],
      prescriptionHistory: (json['prescriptionHistory'] as List<dynamic>?) ?? [],
      outstandingBalances: (json['outstandingBalances'] as List<dynamic>?)
              ?.map((e) => UnpaidInvoiceDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  // To keep it simple, we use dynamic/List since we can display records directly,
  // but if needed we can parse them into PatientProfileResponse, etc.
  final List<dynamic> patientProfiles;
  final List<dynamic> upcomingAppointments;
  final List<dynamic> prescriptionHistory;
  final List<dynamic> outstandingBalances;
}
