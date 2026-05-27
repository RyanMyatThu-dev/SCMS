namespace SCMS.Domain.Features.Appointments.Models
{
    public class BookAppointmentResponse
    {
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public int TokenNumber { get; set; }
        public int EstimatedWaitTimeMinutes { get; set; }
        public string Status { get; set; } = null!;
    }
}
