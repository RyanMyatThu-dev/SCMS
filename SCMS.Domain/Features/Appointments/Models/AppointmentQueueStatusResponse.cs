namespace SCMS.Domain.Features.Appointments.Models
{
    public class AppointmentQueueStatusResponse
    {
        public int PatientTokenNumber { get; set; }
        public int CurrentActiveTokenNumber { get; set; }
        public int PatientsAhead { get; set; }
        public string QueueMessage { get; set; } = null!;
        public int EstimatedWaitTimeMinutes { get; set; }
        public string DoctorStatus { get; set; } = null!; // In Consultation / Available / Out of Office
        public double ProgressBarPercentage { get; set; }
        public bool IsYourTurn { get; set; }
    }
}
