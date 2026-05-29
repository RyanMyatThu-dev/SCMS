class AppointmentDetailsResponse {
  const AppointmentDetailsResponse({
    required this.id,
    required this.appointmentCode,
    required this.patientId,
    required this.patientName,
    required this.datetime,
    required this.status,
    this.notes,
    required this.tokenNumber,
    required this.clinicDoctorName,
    required this.createdAt,
  });

  factory AppointmentDetailsResponse.fromJson(Map<String, dynamic> json) {
    return AppointmentDetailsResponse(
      id: json['id'] as int? ?? 0,
      appointmentCode: json['appointmentCode'] as String? ?? '',
      patientId: json['patientId'] as int? ?? 0,
      patientName: json['patientName'] as String? ?? '',
      datetime: json['datetime'] != null
          ? DateTime.parse(json['datetime'] as String)
          : DateTime.now(),
      status: json['status'] as String? ?? 'pending',
      notes: json['notes'] as String?,
      tokenNumber: json['tokenNumber'] as int? ?? 0,
      clinicDoctorName: json['clinicDoctorName'] as String? ?? 'Clinic Doctor',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  final int id;
  final String appointmentCode;
  final int patientId;
  final String patientName;
  final DateTime datetime;
  final String status;
  final String? notes;
  final int tokenNumber;
  final String clinicDoctorName;
  final DateTime createdAt;
}

class BookAppointmentRequest {
  const BookAppointmentRequest({
    required this.patientId,
    required this.datetime,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'patientId': patientId,
      'datetime': datetime.toIso8601String(),
      'notes': notes,
    };
  }

  final int patientId;
  final DateTime datetime;
  final String? notes;
}
