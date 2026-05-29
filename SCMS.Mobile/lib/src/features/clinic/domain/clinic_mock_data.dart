import 'package:flutter/material.dart';

enum AppointmentStatus {
  pending,
  confirmed,
  completed,
  cancelled;

  String get label {
    switch (this) {
      case AppointmentStatus.pending:
        return 'Pending';
      case AppointmentStatus.confirmed:
        return 'Confirmed';
      case AppointmentStatus.completed:
        return 'Completed';
      case AppointmentStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color color(ColorScheme colors) {
    switch (this) {
      case AppointmentStatus.pending:
        return colors.tertiary;
      case AppointmentStatus.confirmed:
        return colors.primary;
      case AppointmentStatus.completed:
        return const Color(0xFF287D4F);
      case AppointmentStatus.cancelled:
        return colors.error;
    }
  }
}

class ClinicSummary {
  const ClinicSummary({
    required this.appointmentCount,
    required this.consultationFees,
    required this.lowStockCount,
    required this.expiringBatchCount,
  });

  final int appointmentCount;
  final int consultationFees;
  final int lowStockCount;
  final int expiringBatchCount;
}

class ClinicAppointment {
  const ClinicAppointment({
    required this.id,
    required this.code,
    required this.patientId,
    required this.patientName,
    required this.timeLabel,
    required this.doctorName,
    required this.tokenNumber,
    required this.status,
    required this.reason,
    required this.notes,
  });

  final int id;
  final String code;
  final int patientId;
  final String patientName;
  final String timeLabel;
  final String doctorName;
  final int tokenNumber;
  final AppointmentStatus status;
  final String reason;
  final String notes;
}

class ClinicPatient {
  const ClinicPatient({
    required this.id,
    required this.name,
    required this.relation,
    required this.gender,
    required this.age,
    required this.bloodType,
    required this.mobile,
    required this.allergies,
    required this.chronicConditions,
    required this.lastVisit,
    required this.vitals,
  });

  final int id;
  final String name;
  final String relation;
  final String gender;
  final int age;
  final String bloodType;
  final String mobile;
  final String allergies;
  final String chronicConditions;
  final String lastVisit;
  final ConsultationVitals vitals;
}

class ConsultationVitals {
  const ConsultationVitals({
    required this.weightKg,
    required this.heightCm,
    required this.temperatureC,
    required this.pulseBpm,
    required this.spo2Percent,
    required this.bpSystolic,
    required this.bpDiastolic,
  });

  final double weightKg;
  final double heightCm;
  final double temperatureC;
  final int pulseBpm;
  final int spo2Percent;
  final int bpSystolic;
  final int bpDiastolic;

  String get bloodPressure => '$bpSystolic/$bpDiastolic';
}

class InventoryAlert {
  const InventoryAlert({
    required this.title,
    required this.detail,
    required this.isCritical,
  });

  final String title;
  final String detail;
  final bool isCritical;
}

const clinicSummary = ClinicSummary(
  appointmentCount: 14,
  consultationFees: 420000,
  lowStockCount: 5,
  expiringBatchCount: 3,
);

const clinicAppointments = [
  ClinicAppointment(
    id: 15,
    code: 'APT-2026-015',
    patientId: 42,
    patientName: 'Aung Min',
    timeLabel: '09:30 AM',
    doctorName: 'Dr. Thandar',
    tokenNumber: 15,
    status: AppointmentStatus.confirmed,
    reason: 'Follow-up consultation',
    notes: 'Review cough medicine response and chest symptoms.',
  ),
  ClinicAppointment(
    id: 16,
    code: 'APT-2026-016',
    patientId: 43,
    patientName: 'Mya Win',
    timeLabel: '09:45 AM',
    doctorName: 'Dr. Thandar',
    tokenNumber: 16,
    status: AppointmentStatus.pending,
    reason: 'Fever and cough',
    notes: 'New online booking awaiting doctor confirmation.',
  ),
  ClinicAppointment(
    id: 17,
    code: 'APT-2026-017',
    patientId: 44,
    patientName: 'Nandar Aye',
    timeLabel: '10:10 AM',
    doctorName: 'Dr. Thandar',
    tokenNumber: 17,
    status: AppointmentStatus.completed,
    reason: 'Lab review',
    notes: 'CBC reviewed, follow-up reminder created.',
  ),
  ClinicAppointment(
    id: 18,
    code: 'APT-2026-018',
    patientId: 45,
    patientName: 'Daw Hla',
    timeLabel: '10:30 AM',
    doctorName: 'Dr. Thandar',
    tokenNumber: 18,
    status: AppointmentStatus.cancelled,
    reason: 'Blood pressure check',
    notes: 'Patient cancelled before arrival.',
  ),
];

const clinicPatients = [
  ClinicPatient(
    id: 42,
    name: 'Aung Min',
    relation: 'Self',
    gender: 'Male',
    age: 34,
    bloodType: 'B+',
    mobile: '09 420 111 222',
    allergies: 'Penicillin',
    chronicConditions: 'None recorded',
    lastVisit: 'May 27',
    vitals: ConsultationVitals(
      weightKg: 68,
      heightCm: 169,
      temperatureC: 37.1,
      pulseBpm: 78,
      spo2Percent: 98,
      bpSystolic: 124,
      bpDiastolic: 82,
    ),
  ),
  ClinicPatient(
    id: 43,
    name: 'Mya Win',
    relation: 'Spouse',
    gender: 'Female',
    age: 31,
    bloodType: 'O+',
    mobile: '09 430 222 333',
    allergies: 'None recorded',
    chronicConditions: 'Asthma',
    lastVisit: 'May 20',
    vitals: ConsultationVitals(
      weightKg: 54,
      heightCm: 158,
      temperatureC: 38.2,
      pulseBpm: 92,
      spo2Percent: 96,
      bpSystolic: 118,
      bpDiastolic: 76,
    ),
  ),
  ClinicPatient(
    id: 44,
    name: 'Nandar Aye',
    relation: 'Parent',
    gender: 'Female',
    age: 62,
    bloodType: 'A+',
    mobile: '09 440 333 444',
    allergies: 'Sulfa drugs',
    chronicConditions: 'Hypertension',
    lastVisit: 'May 18',
    vitals: ConsultationVitals(
      weightKg: 61,
      heightCm: 154,
      temperatureC: 36.9,
      pulseBpm: 84,
      spo2Percent: 97,
      bpSystolic: 138,
      bpDiastolic: 88,
    ),
  ),
];

const inventoryAlerts = [
  InventoryAlert(
    title: 'Amoxicillin 500mg below threshold',
    detail: '2 active batches left. Oldest valid batch expires in 18 days.',
    isCritical: true,
  ),
  InventoryAlert(
    title: 'Cetirizine batch expires soon',
    detail: 'Batch CET-24-09 expires within 30 days.',
    isCritical: false,
  ),
];

ClinicAppointment appointmentById(int id) => clinicAppointments.firstWhere(
  (appointment) => appointment.id == id,
  orElse: () => clinicAppointments.first,
);

ClinicPatient patientById(int id) => clinicPatients.firstWhere(
  (patient) => patient.id == id,
  orElse: () => clinicPatients.first,
);
