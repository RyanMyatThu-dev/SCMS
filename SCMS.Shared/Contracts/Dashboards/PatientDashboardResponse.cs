using System.Collections.Generic;
using SCMS.Shared.Contracts.Appointments;
using SCMS.Shared.Contracts.Patients;
using SCMS.Shared.Contracts.Prescriptions;

namespace SCMS.Shared.Contracts.Dashboards
{
    public class PatientDashboardResponse
    {
        public List<PatientProfileResponse> PatientProfiles { get; set; } = new();
        public List<AppointmentDetailsResponse> UpcomingAppointments { get; set; } = new();
        public List<PrescriptionResponse> PrescriptionHistory { get; set; } = new();
        public List<UnpaidInvoiceDto> OutstandingBalances { get; set; } = new();
    }

    public class UnpaidInvoiceDto
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
    }
}
