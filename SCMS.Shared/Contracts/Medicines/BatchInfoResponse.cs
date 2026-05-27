using System;

namespace SCMS.Shared.Contracts.Medicines
{
    public class BatchInfoResponse
    {
        public int Id { get; set; }
        public string BatchNo { get; set; } = null!;
        public int Quantity { get; set; }
        public DateOnly ExpiryDate { get; set; }
        public DateOnly? ReceivedDate { get; set; }
        public string? SupplierName { get; set; }
        public string Status { get; set; } = null!; // active / expired / disposed
    }
}
