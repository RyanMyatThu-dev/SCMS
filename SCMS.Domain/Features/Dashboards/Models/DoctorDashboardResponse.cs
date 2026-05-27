using System.Collections.Generic;

namespace SCMS.Domain.Features.Dashboards.Models
{
    public class DoctorDashboardResponse
    {
        public int TodayAppointmentsCount { get; set; }
        public List<UpcomingPatientDto> NextPatients { get; set; } = new();
        public int LowStockAlertsCount { get; set; }
        public int ExpiringBatchesCount { get; set; }
        public decimal DailyRevenue { get; set; }

        public List<string> LowStockAlerts { get; set; } = new();
        public List<string> ExpiringBatchesAlerts { get; set; } = new();
    }

    public class UpcomingPatientDto
    {
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public string Time { get; set; } = null!;
        public int TokenNumber { get; set; }
        public string? ReasonForVisit { get; set; }
    }
}
