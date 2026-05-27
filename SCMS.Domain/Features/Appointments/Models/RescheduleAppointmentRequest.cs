using System;

namespace SCMS.Domain.Features.Appointments.Models
{
    public class RescheduleAppointmentRequest
    {
        public DateTime NewDatetime { get; set; }
        public string? Notes { get; set; }
    }
}
