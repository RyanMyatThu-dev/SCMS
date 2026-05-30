class PatientProfileResponse {
  const PatientProfileResponse({
    required this.patientId,
    required this.userId,
    required this.name,
    this.mobileNo,
    this.email,
    this.dateOfBirth,
    this.gender,
    this.bloodType,
    this.actualAddress,
    this.allergies,
    this.chronicConditions,
    this.pastSurgeries,
    this.familyHistory,
    this.vaccinationHistory,
    required this.createdAt,
  });

  factory PatientProfileResponse.fromJson(Map<String, dynamic> json) {
    return PatientProfileResponse(
      patientId: json['patientId'] as int? ?? 0,
      userId: json['userId'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      mobileNo: json['mobileNo'] as String?,
      email: json['email'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      gender: json['gender'] as String?,
      bloodType: json['bloodType'] as String?,
      actualAddress: json['actualAddress'] as String?,
      allergies: json['allergies'] as String?,
      chronicConditions: json['chronicConditions'] as String?,
      pastSurgeries: json['pastSurgeries'] as String?,
      familyHistory: json['familyHistory'] as String?,
      vaccinationHistory: json['vaccinationHistory'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }

  final int patientId;
  final int userId;
  final String name;
  final String? mobileNo;
  final String? email;
  final String? dateOfBirth;
  final String? gender;
  final String? bloodType;
  final String? actualAddress;
  final String? allergies;
  final String? chronicConditions;
  final String? pastSurgeries;
  final String? familyHistory;
  final String? vaccinationHistory;
  final DateTime createdAt;
}

class PatientProfileRequest {
  const PatientProfileRequest({
    required this.name,
    this.mobileNo,
    this.email,
    this.dateOfBirth,
    this.gender,
    this.bloodType,
    this.actualAddress,
    this.allergies,
    this.chronicConditions,
    this.pastSurgeries,
    this.familyHistory,
    this.vaccinationHistory,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'mobileNo': mobileNo,
      'email': email,
      'dateOfBirth': dateOfBirth,
      'gender': gender,
      'bloodType': bloodType,
      'actualAddress': actualAddress,
      'allergies': allergies,
      'chronicConditions': chronicConditions,
      'pastSurgeries': pastSurgeries,
      'familyHistory': familyHistory,
      'vaccinationHistory': vaccinationHistory,
    };
  }

  final String name;
  final String? mobileNo;
  final String? email;
  final String? dateOfBirth;
  final String? gender;
  final String? bloodType;
  final String? actualAddress;
  final String? allergies;
  final String? chronicConditions;
  final String? pastSurgeries;
  final String? familyHistory;
  final String? vaccinationHistory;
}
