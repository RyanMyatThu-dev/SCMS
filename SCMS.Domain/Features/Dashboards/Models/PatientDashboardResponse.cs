using System.Collections.Generic;
using SCMS.Domain.Features.Appointments.Models;
using SCMS.Domain.Features.Patients.Models;
using SCMS.Domain.Features.Prescriptions.Models;

namespace SCMS.Domain.Features.Dashboards.Models
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
        public int PaymentId { get; set; }
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
    }
}
