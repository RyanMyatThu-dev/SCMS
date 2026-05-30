using System;

namespace SCMS.Shared.Contracts.Appointments
{
    public class BookAppointmentRequest
    {
        public int PatientId { get; set; }
        public DateTime Datetime { get; set; }
        public string? Notes { get; set; }
    }
}
