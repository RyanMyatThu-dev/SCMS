using System;
using System.Collections.Generic;

namespace SCMS.Shared.Contracts.Reports
{
    public class MedicineStockReportResponse
    {
        public string ReportTitle { get; set; } = null!;
        public DateTime GeneratedAt { get; set; }

        // ── Summary ─────────────────────────────────────────
        public int TotalMedicines { get; set; }
        public int TotalBatches { get; set; }
        public int LowStockCount { get; set; }
        public int ExpiredCount { get; set; }

        public List<MedicineStockItemDto> Items { get; set; } = new();
    }

    public class MedicineStockItemDto
    {
        public int MedicineId { get; set; }
        public string Name { get; set; } = null!;
        public string Category { get; set; } = null!;
        public int TotalQuantity { get; set; }
        
        public List<MedicineBatchStockDto> Batches { get; set; } = new();
    }

    public class MedicineBatchStockDto
    {
        public int BatchId { get; set; }
        public string BatchNo { get; set; } = null!;
        public int Quantity { get; set; }
        public DateOnly ExpiryDate { get; set; }
        public string Status { get; set; } = null!;
        public bool IsExpired { get; set; }
        public bool IsLowStock { get; set; }
    }
}
