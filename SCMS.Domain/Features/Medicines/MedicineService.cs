using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Features.Medicines.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Medicines
{
    public class MedicineService
    {
        private readonly ScmsDbContext _context;
        private const int LowStockThreshold = 20;

        public MedicineService(ScmsDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<MedicineSearchResponse>> SearchMedicinesAsync(string? query, PaginationRequest paginationRequest)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            
            var baseQuery = _context.TblMedicines
                .Include(m => m.Category)
                .Include(m => m.TblMedicineBatches)
                .Where(m => m.DeleteFlag != true);

            if (!string.IsNullOrEmpty(query))
            {
                var q = query.ToLower().Trim();
                baseQuery = baseQuery.Where(m => m.Name.ToLower().Contains(q) || (m.Description != null && m.Description.ToLower().Contains(q)));
            }

            var totalCount = await baseQuery.CountAsync();
            var medicines = await baseQuery
                .OrderBy(m => m.Name)
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .ToListAsync();

            var list = new List<MedicineSearchResponse>();

            foreach (var m in medicines)
            {
                // Filter out expired batches
                var activeBatches = m.TblMedicineBatches
                    .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today && b.Quantity > 0)
                    .OrderBy(b => b.ExpiryDate) // FIFO ordering by default
                    .Select(b => new BatchInfoResponse
                    {
                        Id = b.Id,
                        BatchNo = b.BatchNo,
                        Quantity = b.Quantity,
                        ExpiryDate = b.ExpiryDate,
                        ReceivedDate = b.ReceivedDate,
                        SupplierName = b.SupplierName,
                        Status = b.Status
                    })
                    .ToList();

                var totalStock = activeBatches.Sum(b => b.Quantity);
                var nearExpiry = activeBatches.Any(b => b.ExpiryDate <= today.AddDays(30));
                var lowStock = totalStock < LowStockThreshold;

                list.Add(new MedicineSearchResponse
                {
                    MedicineId = m.MedicineId,
                    CategoryId = m.CategoryId,
                    CategoryName = m.Category?.Name,
                    Name = m.Name,
                    Description = m.Description,
                    ImageUrl = m.ImageUrl,
                    UnitPrice = m.UnitPrice,
                    TotalStock = totalStock,
                    ActiveBatches = activeBatches,
                    HasLowStockWarning = lowStock,
                    HasNearExpiryWarning = nearExpiry
                });
            }

            var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
            return PagedResult<MedicineSearchResponse>.Success(list, pagination);
        }

        public async Task<Result> QuarantineExpiredBatchesAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            
            // Find active batches that have passed expiry date
            var expiredBatches = await _context.TblMedicineBatches
                .Where(b => b.Status == "active" && b.ExpiryDate <= today && b.DeleteFlag != true)
                .ToListAsync();

            if (expiredBatches.Count == 0)
            {
                return Result.Success("No new expired batches found to quarantine.");
            }

            foreach (var batch in expiredBatches)
            {
                batch.Status = "expired";
                batch.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Result.Success($"Quarantined {expiredBatches.Count} expired batch(es) successfully.");
        }

        public async Task<PagedResult<InventoryAlertResponse>> GetInventoryAlertsAsync(PaginationRequest paginationRequest)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var thirtyDaysFromNow = today.AddDays(30);

            // Fetch active medicine batches
            var activeBatches = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .Where(b => b.Status == "active" && b.DeleteFlag != true)
                .ToListAsync();

            var alerts = new List<InventoryAlertResponse>();

            // Group by medicine to evaluate total stock
            var grouped = activeBatches.GroupBy(b => b.MedId);

            foreach (var group in grouped)
            {
                var medId = group.Key;
                var batches = group.ToList();
                var medName = batches.First().Med?.Name ?? "Unknown";

                var totalStock = batches.Sum(b => b.Quantity);
                if (totalStock < LowStockThreshold)
                {
                    alerts.Add(new InventoryAlertResponse
                    {
                        MedicineId = medId,
                        MedicineName = medName,
                        CurrentQuantity = totalStock,
                        AlertType = "Low Stock",
                        Message = $"Total stock for {medName} is low ({totalStock} remaining, threshold is {LowStockThreshold})."
                    });
                }

                // Check individual batches for expiry
                foreach (var b in batches)
                {
                    if (b.ExpiryDate <= thirtyDaysFromNow)
                    {
                        alerts.Add(new InventoryAlertResponse
                        {
                            MedicineId = medId,
                            MedicineName = medName,
                            BatchId = b.Id,
                            BatchNo = b.BatchNo,
                            CurrentQuantity = b.Quantity,
                            ExpiryDate = b.ExpiryDate,
                            AlertType = "Nearing Expiry",
                            Message = $"Batch {b.BatchNo} of {medName} is expiring on {b.ExpiryDate:yyyy-MM-dd} (in {(b.ExpiryDate.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow).Days} days)."
                        });
                    }
                }
            }

            var totalCount = alerts.Count;
            var pagedAlerts = alerts
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .ToList();

            var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
            return PagedResult<InventoryAlertResponse>.Success(pagedAlerts, pagination);
        }
    }
}
