using System;

namespace SCMS.Shared.Contracts.Medicines
{
    public class BatchDetailResponse
    {
        public int Id { get; set; }
        public int MedId { get; set; }
        public string MedicineName { get; set; } = null!;
        public string BatchNo { get; set; } = null!;
        public int Quantity { get; set; }
        public DateOnly ExpiryDate { get; set; }
        public DateOnly ManufactureDate { get; set; }
        public DateOnly? ReceivedDate { get; set; }
        public string? SupplierName { get; set; }
        public string Manufacturer { get; set; } = null!;
        public string Status { get; set; } = null!; // active / expired / disposed
    }
}