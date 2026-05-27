namespace SCMS.Domain.Features.Payments.Models
{
    public class ProcessPaymentCallbackRequest
    {
        public int AppointmentId { get; set; }
        public string PaymentMethod { get; set; } = null!; // card / kbzpay / wavepay
        public decimal Amount { get; set; }
        public string? GatewayTransactionId { get; set; }
        public bool IsSuccess { get; set; }
    }
}
