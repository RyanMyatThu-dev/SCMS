using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SCMS.Domain.Features.Medicines.Models
{
    /// <summary>Payload for creating a new medicine catalog entry.</summary>
    public sealed record CreateMedicineRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public required string Name { get; init; }

        public string? Description { get; init; }

        public int? CategoryId { get; init; }

        [Range(0.0, double.MaxValue, ErrorMessage = "Unit price cannot be negative.")]
        public decimal UnitPrice { get; init; }
    }

    /// <summary>Payload for updating a medicine catalog entry.</summary>
    public sealed record UpdateMedicineRequest
    {
        [Required(ErrorMessage = "Name is required.")]
        [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
        public required string Name { get; init; }

        public string? Description { get; init; }

        public int? CategoryId { get; init; }

        [Range(0.0, double.MaxValue, ErrorMessage = "Unit price cannot be negative.")]
        public decimal UnitPrice { get; init; }

        public bool RemoveImage { get; init; }
    }

    /// <summary>Search and list response for medicine items.</summary>
    public sealed record MedicineSearchResponse
    {
        public int MedicineId { get; init; }
        public int? CategoryId { get; init; }
        public string? CategoryName { get; init; }
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
        public string? ImageUrl { get; init; }
        public string? ImageId { get; init; }
        public decimal UnitPrice { get; init; }
        public int TotalStock { get; init; }
        public List<BatchInfoResponse> ActiveBatches { get; init; } = new();
        public bool HasLowStockWarning { get; init; }
        public bool HasNearExpiryWarning { get; init; }
    }

    /// <summary>Medicine category response.</summary>
    public sealed record MedicineCategoryResponse
    {
        public int Id { get; init; }
        public string Name { get; init; } = null!;
    }

    /// <summary>Payload for creating a new medicine batch.</summary>
    public sealed record CreateBatchRequest
    {
        [Required]
        public required int MedId { get; init; }

        [Required]
        public required string BatchNo { get; init; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than zero.")]
        public required int Quantity { get; init; }

        [Required]
        public required DateOnly ExpiryDate { get; init; }

        [Required]
        public required DateOnly ManufactureDate { get; init; }

        public DateOnly? ReceivedDate { get; init; }
        public string? SupplierName { get; init; }

        [Required]
        public required string Manufacturer { get; init; }

        public string Status { get; init; } = "active";
    }

    /// <summary>Payload for updating a medicine batch.</summary>
    public sealed record UpdateBatchRequest
    {
        public int MedId { get; init; }
        public string BatchNo { get; init; } = null!;
        public int Quantity { get; init; }
        public DateOnly ExpiryDate { get; init; }
        public DateOnly ManufactureDate { get; init; }
        public DateOnly? ReceivedDate { get; init; }
        public string? SupplierName { get; init; }
        public string Manufacturer { get; init; } = null!;
        public string Status { get; init; } = "active";
    }

    /// <summary>Summary information for a medicine batch.</summary>
    public sealed record BatchInfoResponse
    {
        public int Id { get; init; }
        public string BatchNo { get; init; } = null!;
        public int Quantity { get; init; }
        public DateOnly ExpiryDate { get; init; }
        public DateOnly? ReceivedDate { get; init; }
        public string? SupplierName { get; init; }
        public string Status { get; init; } = null!;
    }

    /// <summary>Detailed information for a medicine batch.</summary>
    public sealed record BatchDetailResponse
    {
        public int Id { get; init; }
        public int MedId { get; init; }
        public string MedicineName { get; init; } = null!;
        public string BatchNo { get; init; } = null!;
        public int Quantity { get; init; }
        public DateOnly ExpiryDate { get; init; }
        public DateOnly ManufactureDate { get; init; }
        public DateOnly? ReceivedDate { get; init; }
        public string? SupplierName { get; init; }
        public string Manufacturer { get; init; } = null!;
        public string Status { get; init; } = null!;
    }

    /// <summary>Inventory alert response for low stock or near-expiry batches.</summary>
    public sealed record InventoryAlertResponse
    {
        public int MedicineId { get; init; }
        public string MedicineName { get; init; } = null!;
        public int? BatchId { get; init; }
        public string? BatchNo { get; init; }
        public int CurrentQuantity { get; init; }
        public DateOnly? ExpiryDate { get; init; }
        public string AlertType { get; init; } = null!;
        public string Message { get; init; } = null!;
    }
}
