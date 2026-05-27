using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Medicines
{
    public class MedicineSearchResponse
    {
        public int MedicineId { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public decimal UnitPrice { get; set; }
        public int TotalStock { get; set; }
        public List<BatchInfoResponse> ActiveBatches { get; set; } = new();
        public bool HasLowStockWarning { get; set; }
        public bool HasNearExpiryWarning { get; set; }
    }
}
