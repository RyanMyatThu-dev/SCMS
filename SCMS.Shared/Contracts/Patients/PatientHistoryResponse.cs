using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Patients
{
    public class PatientHistoryResponse
    {
        public int PatientId { get; set; }
        public string PatientName { get; set; } = null!;
        public List<TimelineItemDto> Timeline { get; set; } = new();
    }

    public class TimelineItemDto
    {
        public DateTime Date { get; set; }
        public string Type { get; set; } = null!; // Appointment, Prescription, Diagnosis, Lab Request
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public int LinkedId { get; set; }
    }
}
