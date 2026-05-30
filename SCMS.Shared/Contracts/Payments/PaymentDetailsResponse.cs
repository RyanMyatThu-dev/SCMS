using System;

namespace SCMS.Shared.Contracts.Payments
{
    public class PaymentDetailsResponse
    {
        public int Id { get; set; }
        public int AppointmentId { get; set; }
        public string AppointmentCode { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public decimal Amount { get; set; }
        public decimal Tax { get; set; }
        public decimal Charges { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? PaymentScreenshot { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
