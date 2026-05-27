namespace SCMS.Domain.Features.Payments.Models
{
    public class ManualPaymentProofRequest
    {
        public int AppointmentId { get; set; }
        public string PaymentMethod { get; set; } = null!; // kbzpay / wavepay
        public decimal Amount { get; set; }
        public string ScreenshotUrl { get; set; } = null!;
    }
}
