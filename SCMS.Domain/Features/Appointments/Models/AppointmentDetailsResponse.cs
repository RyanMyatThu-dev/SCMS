using System;

namespace SCMS.Domain.Features.Appointments.Models
{
    public class AppointmentDetailsResponse
    {
        public int Id { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public DateTime Datetime { get; set; }
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public int TokenNumber { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
