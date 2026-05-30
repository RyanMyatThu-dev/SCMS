using System;

namespace SCMS.Shared.Contracts.Appointments
{
    public class RescheduleAppointmentRequest
    {
        public DateTime NewDatetime { get; set; }
        public string? Notes { get; set; }
    }
}
