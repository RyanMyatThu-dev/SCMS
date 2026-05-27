namespace SCMS.Domain.Features.Appointments.Models
{
    public class UpdateAppointmentStatusRequest
    {
        public string Status { get; set; } = null!; // pending / confirmed / cancelled / completed
        public string? Notes { get; set; }
    }
}
