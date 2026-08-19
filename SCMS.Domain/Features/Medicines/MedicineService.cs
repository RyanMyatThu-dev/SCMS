using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using SCMS.Database.Models;
using SCMS.Domain.Features.Medicines.Models;
using SCMS.Shared;
using SCMS.Domain.Features.Photo;
using SCMS.Domain.Features.Notifications;

namespace SCMS.Domain.Features.Medicines
{
    public class MedicineService : IMedicineService
    {
        private readonly AppDbContext _context;
        private readonly IPhotoService? _photoService;
        private readonly INotificationService? _notificationService;
        private const int LowStockThreshold = 20;

        public MedicineService(AppDbContext context, INotificationService? notificationService = null, IPhotoService? photoService = null)
        {
            _context = context;
            _notificationService = notificationService;
            _photoService = photoService;
        }

        public async Task<PagedResult<GetMedicinesResponse>> GetMedicinesAsync(GetMedicinesRequest request)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            
            var baseQuery = _context.TblMedicines
                .Include(m => m.Category)
                .Include(m => m.TblMedicineBatches)
                .Where(m => m.DeleteFlag != true);

            if (request.CategoryId.HasValue)
            {
                baseQuery = baseQuery.Where(m => m.CategoryId == request.CategoryId.Value);
            }

            var totalCount = await baseQuery.CountAsync();
            var medicines = await baseQuery
                .OrderBy(m => m.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var list = medicines.Select(m => MapToGetMedicinesResponse(m, today)).ToList();
            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<GetMedicinesResponse>.Success(list, pagination);
        }

        public async Task<PagedResult<SearchMedicinesResponse>> SearchMedicinesAsync(SearchMedicinesRequest request)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            
            var baseQuery = _context.TblMedicines
                .Include(m => m.Category)
                .Include(m => m.TblMedicineBatches)
                .Where(m => m.DeleteFlag != true);

            if (!string.IsNullOrEmpty(request.Query))
            {
                var q = request.Query.ToLower().Trim();
                baseQuery = baseQuery.Where(m => m.Name.ToLower().Contains(q) || (m.Description != null && m.Description.ToLower().Contains(q)));
            }

            var totalCount = await baseQuery.CountAsync();
            var medicines = await baseQuery
                .OrderBy(m => m.Name)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var list = medicines.Select(m => MapToSearchMedicinesResponse(m, today)).ToList();
            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<SearchMedicinesResponse>.Success(list, pagination);
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
                batch.Status = "quarantined";
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
                .Where(b => b.Status == "active" && b.ExpiryDate > today && b.DeleteFlag != true)
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
                            Message = $"Batch {b.BatchNo} of {medName} is expiring on {b.ExpiryDate.ToString(Common.FormatHelper.DateFormat)} (in {(b.ExpiryDate.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow).Days} days)."
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

        public async Task CreateInventoryAlertNotificationsAsync()
        {
            var alerts = await GetInventoryAlertsAsync(new PaginationRequest { PageNumber = 1, PageSize = 100 });
            if (!alerts.IsSuccess || alerts.Data == null || alerts.Data.Count == 0)
            {
                return;
            }

            var cutoff = DateTime.UtcNow.AddHours(-24);
            var existingRecentAlerts = await _context.TblNotifications
                .AsNoTracking()
                .Where(n => n.UserId == null && n.CreatedAt >= cutoff && n.DeleteFlag != true && n.Description != null)
                .Select(n => n.Description!)
                .ToListAsync();

            var existingDescriptions = new HashSet<string>(existingRecentAlerts, StringComparer.Ordinal);
            var notificationsToAdd = new List<TblNotification>();

            foreach (var alert in alerts.Data)
            {
                var title = alert.AlertType == "Low Stock" ? "Low Stock Alert" : "Batch Nearing Expiry";
                if (existingDescriptions.Contains(alert.Message))
                {
                    continue;
                }

                if (_notificationService != null)
                {
                    await _notificationService.CreateNotificationAsync(null, title, alert.Message, "/inventory");
                }
                else
                {
                    notificationsToAdd.Add(new TblNotification
                    {
                        UserId = null,
                        Title = title,
                        Description = alert.Message,
                        ActionRoute = "/inventory",
                        CreatedAt = DateTime.UtcNow,
                        DeleteFlag = false
                    });
                }
                existingDescriptions.Add(alert.Message);
            }

            if (notificationsToAdd.Count > 0)
            {
                _context.TblNotifications.AddRange(notificationsToAdd);
                await _context.SaveChangesAsync();
            }
        }

        // ────────────────────────────────────────────────────────────────
        // Medicine Batch CRUD
        // ────────────────────────────────────────────────────────────────

        private static readonly HashSet<string> AllowedBatchStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "active", "expired", "disposed", "quarantined"
        };

        public async Task<PagedResult<GetBatchesResponse>> GetBatchesAsync(GetBatchesRequest request)
        {
            var baseQuery = _context.TblMedicineBatches
                .Include(b => b.Med)
                .Where(b => b.DeleteFlag != true);

            if (request.MedicineId.HasValue)
            {
                baseQuery = baseQuery.Where(b => b.MedId == request.MedicineId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var s = request.Status.ToLower().Trim();
                baseQuery = baseQuery.Where(b => b.Status == s);
            }

            // Sorting
            baseQuery = (request.SortBy?.ToLower()) switch
            {
                "medicinename" => request.SortDescending
                    ? baseQuery.OrderByDescending(b => b.Med.Name)
                    : baseQuery.OrderBy(b => b.Med.Name),
                "expirydate" => request.SortDescending
                    ? baseQuery.OrderByDescending(b => b.ExpiryDate)
                    : baseQuery.OrderBy(b => b.ExpiryDate),
                "quantity" => request.SortDescending
                    ? baseQuery.OrderByDescending(b => b.Quantity)
                    : baseQuery.OrderBy(b => b.Quantity),
                "status" => request.SortDescending
                    ? baseQuery.OrderByDescending(b => b.Status)
                    : baseQuery.OrderBy(b => b.Status),
                "batchno" => request.SortDescending
                    ? baseQuery.OrderByDescending(b => b.BatchNo)
                    : baseQuery.OrderBy(b => b.BatchNo),
                _ => baseQuery.OrderBy(b => b.Med.Name).ThenBy(b => b.ExpiryDate)
            };

            var totalCount = await baseQuery.CountAsync();
            var batches = await baseQuery
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var list = batches.Select(MapToGetBatchesResponse).ToList();
            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<GetBatchesResponse>.Success(list, pagination);
        }

        public async Task<PagedResult<SearchBatchesResponse>> SearchBatchesAsync(SearchBatchesRequest request)
        {
            var baseQuery = _context.TblMedicineBatches
                .Include(b => b.Med)
                .Where(b => b.DeleteFlag != true);

            if (request.MedicineId.HasValue)
            {
                baseQuery = baseQuery.Where(b => b.MedId == request.MedicineId.Value);
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var s = request.Status.ToLower().Trim();
                baseQuery = baseQuery.Where(b => b.Status == s);
            }

            if (!string.IsNullOrWhiteSpace(request.Query))
            {
                var q = request.Query.ToLower().Trim();
                baseQuery = baseQuery.Where(b =>
                    b.BatchNo.ToLower().Contains(q) ||
                    b.Med.Name.ToLower().Contains(q) ||
                    (b.SupplierName != null && b.SupplierName.ToLower().Contains(q)));
            }

            var totalCount = await baseQuery.CountAsync();
            var batches = await baseQuery
                .OrderBy(b => b.Med.Name)
                .ThenBy(b => b.ExpiryDate)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var list = batches.Select(MapToSearchBatchesResponse).ToList();
            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<SearchBatchesResponse>.Success(list, pagination);
        }

        public async Task<Result<GetBatchByIdResponse>> GetBatchByIdAsync(int id)
        {
            var batch = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .FirstOrDefaultAsync(b => b.Id == id && b.DeleteFlag != true);

            if (batch == null)
            {
                return Result<GetBatchByIdResponse>.Failure("Batch not found.");
            }

            return Result<GetBatchByIdResponse>.Success(MapToGetBatchByIdResponse(batch));
        }

        public async Task<Result<CreateBatchResponse>> CreateBatchAsync(CreateBatchRequest request)
        {
            // Validate medicine exists
            var medicine = await _context.TblMedicines
                .FirstOrDefaultAsync(m => m.MedicineId == request.MedId && m.DeleteFlag != true);

            if (medicine == null)
            {
                return Result<CreateBatchResponse>.Failure("Medicine not found.");
            }

            // Validate expiry date is after manufacture date
            if (request.ExpiryDate <= request.ManufactureDate)
            {
                return Result<CreateBatchResponse>.Failure("Expiry date must be after manufacture date.");
            }

            // Validate no duplicate batch number for same medicine
            var duplicateExists = await _context.TblMedicineBatches
                .AnyAsync(b => b.MedId == request.MedId && b.BatchNo == request.BatchNo && b.DeleteFlag != true);

            if (duplicateExists)
            {
                return Result<CreateBatchResponse>.Failure($"A batch with number '{request.BatchNo}' already exists for this medicine.");
            }

            // Validate status
            var batchStatus = string.IsNullOrWhiteSpace(request.Status) ? "active" : request.Status.ToLower().Trim();
            if (!AllowedBatchStatuses.Contains(batchStatus))
            {
                return Result<CreateBatchResponse>.Failure("Invalid batch status. Allowed values: active, expired, disposed.");
            }

            // Validate quantity
            if (request.Quantity < 0)
            {
                return Result<CreateBatchResponse>.Failure("Quantity cannot be negative.");
            }

            var batch = new TblMedicineBatch
            {
                MedId = request.MedId,
                BatchNo = request.BatchNo,
                Quantity = request.Quantity,
                ExpiryDate = request.ExpiryDate,
                ReceivedDate = request.ReceivedDate ?? request.ManufactureDate,
                SupplierName = request.SupplierName ?? request.Manufacturer,
                Status = batchStatus,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblMedicineBatches.Add(batch);
            await _context.SaveChangesAsync();

            // Reload with navigation
            await _context.Entry(batch).Reference(b => b.Med).LoadAsync();

            // Audit log
            Console.WriteLine($"[AUDIT] Batch CREATED: Id={batch.Id}, BatchNo={batch.BatchNo}, MedId={batch.MedId}, Quantity={batch.Quantity}, Status={batch.Status}, At={DateTime.UtcNow:O}");

            return Result<CreateBatchResponse>.Success(MapToCreateBatchResponse(batch), "Batch created successfully.");
        }

        public async Task<Result<UpdateBatchResponse>> UpdateBatchAsync(int id, UpdateBatchRequest request)
        {
            var batch = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .FirstOrDefaultAsync(b => b.Id == id && b.DeleteFlag != true);

            if (batch == null)
            {
                return Result<UpdateBatchResponse>.Failure("Batch not found.");
            }

            // Validate medicine exists
            var medicine = await _context.TblMedicines
                .FirstOrDefaultAsync(m => m.MedicineId == request.MedId && m.DeleteFlag != true);

            if (medicine == null)
            {
                return Result<UpdateBatchResponse>.Failure("Medicine not found.");
            }

            // Validate expiry date is after manufacture date
            if (request.ExpiryDate <= request.ManufactureDate)
            {
                return Result<UpdateBatchResponse>.Failure("Expiry date must be after manufacture date.");
            }

            // Validate no duplicate batch number for same medicine (exclude self)
            var duplicateExists = await _context.TblMedicineBatches
                .AnyAsync(b => b.MedId == request.MedId && b.BatchNo == request.BatchNo && b.Id != id && b.DeleteFlag != true);

            if (duplicateExists)
            {
                return Result<UpdateBatchResponse>.Failure($"A batch with number '{request.BatchNo}' already exists for this medicine.");
            }

            // Validate status
            var batchStatus = string.IsNullOrWhiteSpace(request.Status) ? batch.Status : request.Status.ToLower().Trim();
            if (!AllowedBatchStatuses.Contains(batchStatus))
            {
                return Result<UpdateBatchResponse>.Failure("Invalid batch status. Allowed values: active, expired, disposed.");
            }

            // Validate quantity
            if (request.Quantity < 0)
            {
                return Result<UpdateBatchResponse>.Failure("Quantity cannot be negative.");
            }

            // Audit - record old values
            Console.WriteLine($"[AUDIT] Batch UPDATE: Id={batch.Id}, OldBatchNo={batch.BatchNo}, OldQty={batch.Quantity}, OldStatus={batch.Status}, At={DateTime.UtcNow:O}");

            batch.MedId = request.MedId;
            batch.BatchNo = request.BatchNo;
            batch.Quantity = request.Quantity;
            batch.ExpiryDate = request.ExpiryDate;
            batch.ReceivedDate = request.ReceivedDate ?? request.ManufactureDate;
            batch.SupplierName = request.SupplierName ?? request.Manufacturer;
            batch.Status = batchStatus;
            batch.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Reload nav property in case MedId changed
            await _context.Entry(batch).Reference(b => b.Med).LoadAsync();

            Console.WriteLine($"[AUDIT] Batch UPDATED: Id={batch.Id}, NewBatchNo={batch.BatchNo}, NewQty={batch.Quantity}, NewStatus={batch.Status}, At={DateTime.UtcNow:O}");

            return Result<UpdateBatchResponse>.Success(MapToUpdateBatchResponse(batch), "Batch updated successfully.");
        }

        public async Task<Result> DeleteBatchAsync(int id, bool force = false)
        {
            var batch = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .FirstOrDefaultAsync(b => b.Id == id && b.DeleteFlag != true);

            if (batch == null)
            {
                return Result.Failure("Batch not found.");
            }

            // Check for active prescriptions referencing this batch
            var activeItems = _context.TblPrescriptionItems
                .Where(pi => pi.MedicineBatchId == id && pi.DeleteFlag != true
                             && pi.Prescription.Appointment.Status != "completed"
                             && pi.Prescription.Appointment.Status != "cancelled");

            var activeCount = await activeItems.Select(pi => pi.PrescriptionId).Distinct().CountAsync();
            var activePatientCount = await activeItems.Select(pi => pi.Prescription.PatientId).Distinct().CountAsync();

            if (activeCount > 0)
            {
                return Result.Failure($"Cannot delete batch '{batch.BatchNo}' ({batch.Med?.Name ?? "Medicine"}) because it is allocated to {activeCount} active prescription(s) for {activePatientCount} patient(s). Please complete or update those appointments first.");
            }

            // Check for any historical prescriptions
            var hasHistoricalAllocations = await _context.TblPrescriptionItems
                .AnyAsync(pi => pi.MedicineBatchId == id && pi.DeleteFlag != true);

            if (hasHistoricalAllocations && !force)
            {
                return Result.Failure("WARNING: This batch has been used in past prescriptions. Deleting it will not remove prescription history, but the batch will no longer appear in reports. Send the request with force=true to proceed.");
            }

            // Soft delete
            batch.DeleteFlag = true;
            batch.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            Console.WriteLine($"[AUDIT] Batch DELETED: Id={batch.Id}, BatchNo={batch.BatchNo}, MedId={batch.MedId}, Force={force}, At={DateTime.UtcNow:O}");

            return Result.Success("Batch deleted successfully.");
        }

        // ────────────────────────────────────────────────────────────────
        // Medicine CRUD
        // ────────────────────────────────────────────────────────────────

        public async Task<Result<List<MedicineCategoryResponse>>> GetCategoriesAsync()
        {
            var categories = await _context.TblMedicineCategories
                .Select(c => new MedicineCategoryResponse
                {
                    Id = c.Id,
                    Name = c.Name
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Result<List<MedicineCategoryResponse>>.Success(categories);
        }

        public async Task<Result<CreateMedicineResponse>> CreateMedicineAsync(CreateMedicineRequest request, IFormFile? imageFile)
        {
            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.TblMedicineCategories.AnyAsync(c => c.Id == request.CategoryId.Value);
                if (!categoryExists)
                {
                    return Result<CreateMedicineResponse>.Failure("Category not found.");
                }
            }

            var duplicateExists = await _context.TblMedicines
                .AnyAsync(m => m.Name.ToLower() == request.Name.ToLower() && m.DeleteFlag != true);
            if (duplicateExists)
            {
                return Result<CreateMedicineResponse>.Failure($"A medicine named '{request.Name}' already exists.");
            }

            string? imageUrl = null;
            string? imageId = null;

            if (imageFile != null && imageFile.Length > 0)
            {
                if (_photoService == null)
                {
                    return Result<CreateMedicineResponse>.Failure("Photo service is not configured.");
                }

                var uploadResult = await _photoService.UploadPhotoAsync(imageFile);
                if (!uploadResult.IsSuccess || uploadResult.Data == null)
                {
                    return Result<CreateMedicineResponse>.Failure(uploadResult.Message ?? "Failed to upload photo.");
                }

                imageUrl = uploadResult.Data.Url;
                imageId = uploadResult.Data.PublicId;
            }

            var medicine = new TblMedicine
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                ImageUrl = imageUrl,
                UnitPrice = request.UnitPrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblMedicines.Add(medicine);
            await _context.SaveChangesAsync();

            if (medicine.CategoryId.HasValue)
            {
                await _context.Entry(medicine).Reference(m => m.Category).LoadAsync();
            }

            var response = MapToCreateMedicineResponse(medicine);
            return Result<CreateMedicineResponse>.Success(response, "Medicine created successfully.");
        }

        public async Task<Result<UpdateMedicineResponse>> UpdateMedicineAsync(int id, UpdateMedicineRequest request, IFormFile? imageFile)
        {
            var medicine = await _context.TblMedicines
                .Include(m => m.Category)
                .Include(m => m.TblMedicineBatches)
                .FirstOrDefaultAsync(m => m.MedicineId == id && m.DeleteFlag != true);

            if (medicine == null)
            {
                return Result<UpdateMedicineResponse>.Failure("Medicine not found.");
            }

            if (request.CategoryId.HasValue)
            {
                var categoryExists = await _context.TblMedicineCategories.AnyAsync(c => c.Id == request.CategoryId.Value);
                if (!categoryExists)
                {
                    return Result<UpdateMedicineResponse>.Failure("Category not found.");
                }
            }

            var duplicateExists = await _context.TblMedicines
                .AnyAsync(m => m.Name.ToLower() == request.Name.ToLower() && m.MedicineId != id && m.DeleteFlag != true);
            if (duplicateExists)
            {
                return Result<UpdateMedicineResponse>.Failure($"A medicine named '{request.Name}' already exists.");
            }

            if (request.RemoveImage || (imageFile != null && imageFile.Length > 0))
            {
                if (!string.IsNullOrWhiteSpace(medicine.ImageUrl))
                {
                    if (_photoService == null)
                    {
                        return Result<UpdateMedicineResponse>.Failure("Photo service is not configured.");
                    }
                    var publicId = ExtractPublicIdFromUrl(medicine.ImageUrl);
                    if (!string.IsNullOrWhiteSpace(publicId))
                    {
                        await _photoService.DeletePhotoAsync(publicId);
                    }
                }

                medicine.ImageUrl = null;
            }

            if (imageFile != null && imageFile.Length > 0)
            {
                if (_photoService == null)
                {
                    return Result<UpdateMedicineResponse>.Failure("Photo service is not configured.");
                }

                var uploadResult = await _photoService.UploadPhotoAsync(imageFile);
                if (!uploadResult.IsSuccess || uploadResult.Data == null)
                {
                    return Result<UpdateMedicineResponse>.Failure(uploadResult.Message ?? "Failed to upload photo.");
                }

                medicine.ImageUrl = uploadResult.Data.Url;
            }

            medicine.CategoryId = request.CategoryId;
            medicine.Name = request.Name;
            medicine.Description = request.Description;
            medicine.UnitPrice = request.UnitPrice;
            medicine.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            if (medicine.CategoryId.HasValue)
            {
                await _context.Entry(medicine).Reference(m => m.Category).LoadAsync();
            }

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var response = MapToUpdateMedicineResponse(medicine, today);

            return Result<UpdateMedicineResponse>.Success(response, "Medicine updated successfully.");
        }

        public async Task<Result> DeleteMedicineAsync(int id)
        {
            var medicine = await _context.TblMedicines
                .Include(m => m.TblMedicineBatches)
                .FirstOrDefaultAsync(m => m.MedicineId == id && m.DeleteFlag != true);

            if (medicine == null)
            {
                return Result.Failure("Medicine not found.");
            }

            // 1. Check for active prescriptions
            var activeItems = _context.TblPrescriptionItems
                .Where(pi => pi.MedicineId == id && pi.DeleteFlag != true
                             && pi.Prescription.Appointment.Status != "completed"
                             && pi.Prescription.Appointment.Status != "cancelled");

            var activePrescriptionCount = await activeItems.Select(pi => pi.PrescriptionId).Distinct().CountAsync();
            var activePatientCount = await activeItems.Select(pi => pi.Prescription.PatientId).Distinct().CountAsync();

            if (activePrescriptionCount > 0)
            {
                return Result.Failure($"Cannot delete medicine '{medicine.Name}'. It is allocated to {activePrescriptionCount} active prescription(s) across {activePatientCount} patient(s). Please complete or cancel the related appointment(s) first.");
            }

            medicine.DeleteFlag = true;
            medicine.UpdatedAt = DateTime.UtcNow;

            foreach (var batch in medicine.TblMedicineBatches)
            {
                batch.DeleteFlag = true;
                batch.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(medicine.ImageUrl))
            {
                if (_photoService != null)
                {
                    var publicId = ExtractPublicIdFromUrl(medicine.ImageUrl);
                    if (!string.IsNullOrWhiteSpace(publicId))
                    {
                        try
                        {
                            await _photoService.DeletePhotoAsync(publicId);
                        }
                        catch
                        {
                            // Database soft-delete has succeeded; image cleanup failure is non-fatal
                        }
                    }
                }
            }

            return Result.Success("Medicine and its batches deleted successfully.");
        }

        private static GetMedicinesResponse MapToGetMedicinesResponse(TblMedicine m, DateOnly today)
        {
            var activeBatches = m.TblMedicineBatches
                .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today && b.Quantity > 0)
                .OrderBy(b => b.ExpiryDate)
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

            return new GetMedicinesResponse
            {
                MedicineId = m.MedicineId,
                CategoryId = m.CategoryId,
                CategoryName = m.Category?.Name,
                Name = m.Name,
                Description = m.Description,
                ImageUrl = m.ImageUrl,
                ImageId = null,
                UnitPrice = m.UnitPrice,
                TotalStock = totalStock,
                ActiveBatches = activeBatches,
                HasLowStockWarning = lowStock,
                HasNearExpiryWarning = nearExpiry
            };
        }

        private static SearchMedicinesResponse MapToSearchMedicinesResponse(TblMedicine m, DateOnly today)
        {
            var activeBatches = m.TblMedicineBatches
                .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today && b.Quantity > 0)
                .OrderBy(b => b.ExpiryDate)
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

            return new SearchMedicinesResponse
            {
                MedicineId = m.MedicineId,
                CategoryId = m.CategoryId,
                CategoryName = m.Category?.Name,
                Name = m.Name,
                Description = m.Description,
                ImageUrl = m.ImageUrl,
                ImageId = null,
                UnitPrice = m.UnitPrice,
                TotalStock = totalStock,
                ActiveBatches = activeBatches,
                HasLowStockWarning = lowStock,
                HasNearExpiryWarning = nearExpiry
            };
        }

        private static CreateMedicineResponse MapToCreateMedicineResponse(TblMedicine medicine)
        {
            return new CreateMedicineResponse
            {
                MedicineId = medicine.MedicineId,
                CategoryId = medicine.CategoryId,
                CategoryName = medicine.Category?.Name,
                Name = medicine.Name,
                Description = medicine.Description,
                ImageUrl = medicine.ImageUrl,
                ImageId = null,
                UnitPrice = medicine.UnitPrice,
                TotalStock = 0,
                ActiveBatches = new(),
                HasLowStockWarning = true,
                HasNearExpiryWarning = false
            };
        }

        private static UpdateMedicineResponse MapToUpdateMedicineResponse(TblMedicine medicine, DateOnly today)
        {
            var activeBatches = medicine.TblMedicineBatches
                .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today && b.Quantity > 0)
                .OrderBy(b => b.ExpiryDate)
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

            return new UpdateMedicineResponse
            {
                MedicineId = medicine.MedicineId,
                CategoryId = medicine.CategoryId,
                CategoryName = medicine.Category?.Name,
                Name = medicine.Name,
                Description = medicine.Description,
                ImageUrl = medicine.ImageUrl,
                ImageId = null,
                UnitPrice = medicine.UnitPrice,
                TotalStock = totalStock,
                ActiveBatches = activeBatches,
                HasLowStockWarning = lowStock,
                HasNearExpiryWarning = nearExpiry
            };
        }

        private static GetBatchesResponse MapToGetBatchesResponse(TblMedicineBatch batch)
        {
            return new GetBatchesResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private static SearchBatchesResponse MapToSearchBatchesResponse(TblMedicineBatch batch)
        {
            return new SearchBatchesResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private static GetBatchByIdResponse MapToGetBatchByIdResponse(TblMedicineBatch batch)
        {
            return new GetBatchByIdResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private static CreateBatchResponse MapToCreateBatchResponse(TblMedicineBatch batch)
        {
            return new CreateBatchResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private static UpdateBatchResponse MapToUpdateBatchResponse(TblMedicineBatch batch)
        {
            return new UpdateBatchResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private static BatchDetailResponse MapToBatchDetail(TblMedicineBatch batch)
        {
            return new BatchDetailResponse
            {
                Id = batch.Id,
                MedId = batch.MedId,
                MedicineName = batch.Med?.Name ?? "Unknown",
                BatchNo = batch.BatchNo,
                Quantity = batch.Quantity,
                ExpiryDate = batch.ExpiryDate,
                ManufactureDate = batch.ReceivedDate ?? default,
                ReceivedDate = batch.ReceivedDate,
                SupplierName = batch.SupplierName,
                Manufacturer = batch.SupplierName ?? string.Empty,
                Status = batch.Status
            };
        }

        private string? ExtractPublicIdFromUrl(string? url)
        {
            if (string.IsNullOrEmpty(url)) return null;
            try
            {
                var uri = new Uri(url);
                var segments = uri.Segments;
                if (segments.Length > 0)
                {
                    var lastSegment = segments[^1];
                    var dotIndex = lastSegment.LastIndexOf('.');
                    if (dotIndex > 0)
                    {
                        return lastSegment[..dotIndex];
                    }
                    return lastSegment;
                }
            }
            catch {}
            return null;
        }
    }
}

