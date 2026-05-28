using System;

namespace SCMS.Shared.Contracts.Medicines
{
    public class CreateBatchRequest
    {
        public int MedId { get; set; }
        public string BatchNo { get; set; } = null!;
        public int Quantity { get; set; }
        public DateOnly ExpiryDate { get; set; }
        public DateOnly ManufactureDate { get; set; }
        public DateOnly? ReceivedDate { get; set; }
        public string? SupplierName { get; set; }
        public string Manufacturer { get; set; } = null!;
        public string Status { get; set; } = "active"; // default active
    }
}