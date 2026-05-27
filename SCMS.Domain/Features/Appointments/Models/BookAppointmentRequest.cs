using System;

namespace SCMS.Domain.Features.Appointments.Models
{
    public class BookAppointmentRequest
    {
        public int PatientId { get; set; }
        public DateTime Datetime { get; set; }
        public string? Notes { get; set; }
    }
}
