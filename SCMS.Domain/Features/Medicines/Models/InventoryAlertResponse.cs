using System;

namespace SCMS.Domain.Features.Medicines.Models
{
    public class InventoryAlertResponse
    {
        public int MedicineId { get; set; }
        public string MedicineName { get; set; } = null!;
        public int? BatchId { get; set; }
        public string? BatchNo { get; set; }
        public int CurrentQuantity { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public string AlertType { get; set; } = null!; // Low Stock / Nearing Expiry
        public string Message { get; set; } = null!;
    }
}
