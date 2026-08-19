using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Features.Prescriptions.Models;
using SCMS.Shared;
using SCMS.Domain.Features.Notifications;

namespace SCMS.Domain.Features.Prescriptions
{
    public class PrescriptionService : IPrescriptionService
    {
        private readonly AppDbContext _context;
        private readonly NotificationService? _notificationService;
        private const int LowStockThreshold = 20;

        public PrescriptionService(AppDbContext context, NotificationService? notificationService = null)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<Result<CreatePrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request)
        {
            if (request.PatientId <= 0)
            {
                return Result<CreatePrescriptionResponse>.Failure("Patient id is required.");
            }
            if (request.AppointmentId <= 0)
            {
                return Result<CreatePrescriptionResponse>.Failure("Appointment id is required.");
            }
            var items = request.Items ?? new List<PrescriptionItemDto>();
            foreach (var item in items)
            {
                if (item.MedicineId <= 0)
                {
                    return Result<CreatePrescriptionResponse>.Failure("Medicine id is required for every prescription item.");
                }
                if (item.Quantity <= 0)
                {
                    return Result<CreatePrescriptionResponse>.Failure("Prescription item quantity must be greater than zero.");
                }
                if (item.Days <= 0)
                {
                    return Result<CreatePrescriptionResponse>.Failure("Prescription item days must be greater than zero.");
                }
                if (item.DoseQuantity <= 0)
                {
                    return Result<CreatePrescriptionResponse>.Failure("Dose quantity must be greater than zero.");
                }
            }

            var patient = await _context.TblPatients
                .FirstOrDefaultAsync(p => p.PatientId == request.PatientId && p.DeleteFlag != true);
            if (patient == null)
            {
                return Result<CreatePrescriptionResponse>.Failure("Patient not found.");
            }

            var appointment = await _context.TblAppointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId);
            if (appointment == null)
            {
                return Result<CreatePrescriptionResponse>.Failure("Appointment not found.");
            }

            if (appointment.PatientId != request.PatientId)
            {
                return Result<CreatePrescriptionResponse>.Failure("Appointment does not belong to the selected patient.");
            }

            if (request.DiseaseId.HasValue)
            {
                var diseaseExists = await _context.TblDiseases
                    .AnyAsync(d => d.Id == request.DiseaseId.Value && d.DeleteFlag != true);
                if (!diseaseExists)
                {
                    return Result<CreatePrescriptionResponse>.Failure("Disease not found.");
                }
            }

            // Batch pre-fetch all medicines referenced in this prescription
            var medicineIds = items.Select(i => i.MedicineId).Distinct().ToList();
            var prescribedMeds = await _context.TblMedicines
                .Where(m => medicineIds.Contains(m.MedicineId) && m.DeleteFlag != true)
                .ToListAsync();
            var medMap = prescribedMeds.ToDictionary(m => m.MedicineId);

            var warnings = new List<string>();

            // 1. Check Allergies in-memory
            if (!string.IsNullOrEmpty(patient.Allergies))
            {
                var allergyList = patient.Allergies.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(a => a.Trim().ToLower())
                    .ToList();

                foreach (var item in request.Items)
                {
                    if (medMap.TryGetValue(item.MedicineId, out var med))
                    {
                        var medNameLower = med.Name.ToLower();
                        foreach (var allergy in allergyList)
                        {
                            if (medNameLower.Contains(allergy) || allergy.Contains(medNameLower))
                            {
                                warnings.Add($"Allergy warning: Patient is allergic to '{allergy}', which matches prescribed medicine '{med.Name}'.");
                            }
                        }
                    }
                }
            }

            // 2. Check Duplicate Active Prescriptions
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var activePrescriptions = await _context.TblPrescriptionItems
                .Include(pi => pi.Prescription)
                .Include(pi => pi.Medicine)
                .Where(pi => pi.Prescription.PatientId == request.PatientId
                             && pi.DeleteFlag != true
                             && pi.Prescription.Appointment.Status != "cancelled"
                             && pi.Prescription.Appointment.Status != "completed")
                .ToListAsync();

            foreach (var item in request.Items)
            {
                var activeItem = activePrescriptions.FirstOrDefault(pi => pi.MedicineId == item.MedicineId);
                if (activeItem != null)
                {
                    warnings.Add($"Duplicate medication warning: Patient is currently already prescribed '{activeItem.Medicine.Name}' in active appointment {activeItem.Prescription.AppointmentId}.");
                }
            }

            // Calculate BMI
            double? calculatedBmi = null;
            if (request.WeightKg.HasValue && request.HeightCm.HasValue && request.HeightCm.Value > 0)
            {
                var heightM = request.HeightCm.Value / 100.0;
                calculatedBmi = Math.Round(request.WeightKg.Value / (heightM * heightM), 2);
            }

            var prescription = new TblPrescription
            {
                AppointmentId = request.AppointmentId,
                PatientId = request.PatientId,
                DiseaseId = request.DiseaseId,
                WeightKg = request.WeightKg,
                BloodPressureSystolic = request.BloodPressureSystolic,
                BloodPressureDiastolic = request.BloodPressureDiastolic,
                Notes = request.Notes,
                TemperatureC = request.TemperatureC,
                PulseBpm = request.PulseBpm,
                Spo2Percent = request.Spo2Percent,
                HeightCm = request.HeightCm,
                Bmi = calculatedBmi,
                LabTestRequests = request.LabTestRequests,
                CreatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            var lowStockAlertsToSend = new List<(string MedName, int TotalAvailable)>();

            using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.RepeatableRead);
            try
            {
                // Lock and validate inventory batches
                foreach (var item in request.Items)
                {
                    if (item.Quantity <= 0)
                    {
                        await transaction.RollbackAsync();
                        return Result<CreatePrescriptionResponse>.Failure($"Quantity for medicine {item.MedicineId} must be greater than zero.");
                    }

                    if (!medMap.TryGetValue(item.MedicineId, out var medicine))
                    {
                        await transaction.RollbackAsync();
                        return Result<CreatePrescriptionResponse>.Failure($"Medicine ID {item.MedicineId} does not exist.");
                    }

                    var availableBatches = await _context.TblMedicineBatches
                        .Where(b => b.MedId == item.MedicineId
                                    && b.DeleteFlag != true
                                    && b.Status == "active"
                                    && b.ExpiryDate > today
                                    && b.Quantity > 0)
                        .OrderBy(b => b.ExpiryDate)
                        .ToListAsync();

                    var totalAvailable = availableBatches.Sum(b => b.Quantity);
                    if (totalAvailable < item.Quantity)
                    {
                        await transaction.RollbackAsync();
                        return Result<CreatePrescriptionResponse>.Failure(
                            $"Insufficient stock for medicine '{medicine.Name}'. Requested: {item.Quantity}, Available: {totalAvailable} across non-expired active batches.");
                    }

                    int remainingToDeduct = item.Quantity;
                    foreach (var batch in availableBatches)
                    {
                        if (remainingToDeduct <= 0) break;

                        int deductFromBatch = Math.Min(batch.Quantity, remainingToDeduct);
                        batch.Quantity -= deductFromBatch;
                        batch.UpdatedAt = DateTime.UtcNow;
                        remainingToDeduct -= deductFromBatch;

                        var prescriptionItem = new TblPrescriptionItem
                        {
                            MedicineId = item.MedicineId,
                            MedicineBatchId = batch.Id,
                            Dosage = item.Dosage,
                            Days = item.Days,
                            Quantity = deductFromBatch,
                            Instruction = item.Instruction,
                            CreatedAt = DateTime.UtcNow,
                            DeleteFlag = false
                        };

                        if (!string.IsNullOrWhiteSpace(item.DoseTime) || !string.IsNullOrWhiteSpace(item.MealTiming) || !string.IsNullOrWhiteSpace(item.Route))
                        {
                            prescriptionItem.TblPrescriptionItemSchedules.Add(new TblPrescriptionItemSchedule
                            {
                                DoseTime = item.DoseTime,
                                DoseQuantity = item.DoseQuantity,
                                DoseUnit = item.DoseUnit,
                                MealTiming = item.MealTiming,
                                Route = item.Route,
                                IntervalHours = item.IntervalHours,
                                IntervalDays = item.IntervalDays,
                                DayOfWeek = item.DayOfWeek,
                                IsAsNeeded = item.IsAsNeeded,
                                BodySite = item.BodySite,
                                Note = item.ScheduleNote,
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        prescription.TblPrescriptionItems.Add(prescriptionItem);
                    }

                    var remainingTotalStock = totalAvailable - item.Quantity;
                    if (remainingTotalStock < LowStockThreshold)
                    {
                        warnings.Add($"Low stock alert: Medicine '{medicine.Name}' is running low ({remainingTotalStock} units remaining).");
                        lowStockAlertsToSend.Add((medicine.Name, remainingTotalStock));
                    }
                }

                appointment.Status = "completed";
                appointment.UpdatedAt = DateTime.UtcNow;

                _context.TblPrescriptions.Add(prescription);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Broadcast low stock alerts after successful commit
                foreach (var alert in lowStockAlertsToSend)
                {
                    if (_notificationService != null)
                    {
                        await _notificationService.CreateNotificationAsync(
                            null,
                            "Low Stock Alert",
                            $"Medicine '{alert.MedName}' has dropped below threshold with {alert.TotalAvailable} units remaining.",
                            $"/inventory"
                        );
                    }
                    else
                    {
                        _context.TblNotifications.Add(new TblNotification
                        {
                            UserId = null,
                            Title = "Low Stock Alert",
                            Description = $"Medicine '{alert.MedName}' has dropped below threshold with {alert.TotalAvailable} units remaining.",
                            ActionRoute = $"/inventory",
                            CreatedAt = DateTime.UtcNow,
                            DeleteFlag = false
                        });
                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (DbUpdateException)
            {
                return Result<CreatePrescriptionResponse>.Failure("Prescription could not be saved safely. Please retry.");
            }

            // Format response
            var detailsResponse = await GetPrescriptionDetailsAsync(prescription.Id);
            if (detailsResponse.IsSuccess && detailsResponse.Data != null)
            {
                var response = new CreatePrescriptionResponse
                {
                    Id = detailsResponse.Data.Id,
                    AppointmentId = detailsResponse.Data.AppointmentId,
                    AppointmentCode = detailsResponse.Data.AppointmentCode,
                    PatientId = detailsResponse.Data.PatientId,
                    PatientName = detailsResponse.Data.PatientName,
                    DiseaseId = detailsResponse.Data.DiseaseId,
                    DiseaseName = detailsResponse.Data.DiseaseName,
                    WeightKg = detailsResponse.Data.WeightKg,
                    BloodPressureSystolic = detailsResponse.Data.BloodPressureSystolic,
                    BloodPressureDiastolic = detailsResponse.Data.BloodPressureDiastolic,
                    Notes = detailsResponse.Data.Notes,
                    TemperatureC = detailsResponse.Data.TemperatureC,
                    PulseBpm = detailsResponse.Data.PulseBpm,
                    Spo2Percent = detailsResponse.Data.Spo2Percent,
                    HeightCm = detailsResponse.Data.HeightCm,
                    Bmi = detailsResponse.Data.Bmi,
                    LabTestRequests = detailsResponse.Data.LabTestRequests,
                    Items = detailsResponse.Data.Items,
                    Warnings = warnings,
                    CreatedAt = detailsResponse.Data.CreatedAt
                };

                return Result<CreatePrescriptionResponse>.Success(response, "Prescription created and stock deducted.");
            }

            return Result<CreatePrescriptionResponse>.Failure("Prescription created but failed to load response details.");
        }

        public async Task<Result<GetPrescriptionDetailsResponse>> GetPrescriptionDetailsAsync(int id)
        {
            var p = await _context.TblPrescriptions
                .AsNoTracking()
                .Include(x => x.Patient)
                .Include(x => x.Appointment)
                .Include(x => x.Disease)
                .Include(x => x.TblPrescriptionItems)
                    .ThenInclude(i => i.Medicine)
                .Include(x => x.TblPrescriptionItems)
                    .ThenInclude(i => i.MedicineBatch)
                .Include(x => x.TblPrescriptionItems)
                    .ThenInclude(i => i.TblPrescriptionItemSchedules)
                .FirstOrDefaultAsync(x => x.Id == id && x.DeleteFlag != true);

            if (p == null)
            {
                return Result<GetPrescriptionDetailsResponse>.Failure("Prescription not found.");
            }

            return Result<GetPrescriptionDetailsResponse>.Success(MapToGetPrescriptionDetailsResponse(p));
        }

        public async Task<PagedResult<GetPrescriptionsResponse>> GetPrescriptionsAsync(GetPrescriptionsRequest request)
        {
            request ??= new GetPrescriptionsRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var query = _context.TblPrescriptions
                .AsNoTracking()
                .Include(p => p.Patient)
                .Include(p => p.Appointment)
                .Include(p => p.Disease)
                .Include(p => p.TblPrescriptionItems)
                    .ThenInclude(i => i.Medicine)
                .Include(p => p.TblPrescriptionItems)
                    .ThenInclude(i => i.MedicineBatch)
                .Include(p => p.TblPrescriptionItems)
                    .ThenInclude(i => i.TblPrescriptionItemSchedules)
                .Where(p => p.DeleteFlag != true);

            if (request.PatientId.HasValue)
            {
                query = query.Where(p => p.PatientId == request.PatientId.Value);
            }

            var totalCount = await query.CountAsync();
            var prescriptions = await query
                .OrderBy(p => p.Id)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsSplitQuery()
                .ToListAsync();

            var list = prescriptions.Select(MapToGetPrescriptionsResponse).ToList();

            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<GetPrescriptionsResponse>.Success(list, pagination);
        }

        public async Task<Result<SaveTemplateResponse>> SaveTemplateAsync(SaveTemplateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Result<SaveTemplateResponse>.Failure("Template name is required.");
            }
            if (request.Items == null || request.Items.Count == 0)
            {
                return Result<SaveTemplateResponse>.Failure("At least one template item is required.");
            }

            var medIdsToCheck = request.Items.Select(i => i.MedicineId).ToList();
            if (medIdsToCheck.Count != medIdsToCheck.Distinct().Count())
            {
                return Result<SaveTemplateResponse>.Failure("A prescription template cannot contain duplicate medicines.");
            }

            foreach (var item in request.Items)
            {
                if (item.MedicineId <= 0)
                {
                    return Result<SaveTemplateResponse>.Failure("Medicine id is required for every template item.");
                }
                if (item.Quantity <= 0)
                {
                    return Result<SaveTemplateResponse>.Failure("Template item quantity must be greater than zero.");
                }
                if (item.Days <= 0)
                {
                    return Result<SaveTemplateResponse>.Failure("Template item days must be greater than zero.");
                }
            }

            var disease = await _context.TblDiseases
                .FirstOrDefaultAsync(d => d.Id == request.DiseaseId && d.DeleteFlag != true);
            if (disease == null)
            {
                return Result<SaveTemplateResponse>.Failure("Disease not found.");
            }

            var medicineIds = request.Items.Select(i => i.MedicineId).Distinct().ToList();
            var existingMedicineIds = await _context.TblMedicines
                .Where(m => medicineIds.Contains(m.MedicineId) && m.DeleteFlag != true)
                .Select(m => m.MedicineId)
                .ToListAsync();
            var missingMedicineId = medicineIds.FirstOrDefault(id => !existingMedicineIds.Contains(id));
            if (missingMedicineId > 0)
            {
                return Result<SaveTemplateResponse>.Failure($"Medicine ID {missingMedicineId} not found.");
            }

            // Check if we are updating an existing template
            TblPrescriptionTemplate? existingTemplate = null;
            if (request.Id.HasValue && request.Id.Value > 0)
            {
                existingTemplate = await _context.TblPrescriptionTemplates
                    .Include(t => t.TblPrescriptionTemplateItems)
                    .FirstOrDefaultAsync(t => t.Id == request.Id.Value && t.DeleteFlag != true);
            }
            else
            {
                existingTemplate = await _context.TblPrescriptionTemplates
                    .Include(t => t.TblPrescriptionTemplateItems)
                    .FirstOrDefaultAsync(t => t.Name.ToLower() == request.Name.Trim().ToLower() && t.DiseaseId == request.DiseaseId && t.DeleteFlag != true);
            }

            if (existingTemplate != null)
            {
                existingTemplate.Name = request.Name.Trim();
                existingTemplate.DiseaseId = request.DiseaseId;
                existingTemplate.UpdatedAt = DateTime.UtcNow;

                // Soft delete old template items
                foreach (var oldItem in existingTemplate.TblPrescriptionTemplateItems)
                {
                    oldItem.DeleteFlag = true;
                }

                // Add new template items
                foreach (var item in request.Items)
                {
                    existingTemplate.TblPrescriptionTemplateItems.Add(new TblPrescriptionTemplateItem
                    {
                        MedicineId = item.MedicineId,
                        Dosage = item.Dosage,
                        Days = item.Days,
                        Quantity = item.Quantity,
                        Instruction = item.Instruction,
                        CreatedAt = DateTime.UtcNow,
                        DeleteFlag = false
                    });
                }

                await _context.SaveChangesAsync();
                return Result<SaveTemplateResponse>.Success(await MapToSaveTemplateResponseAsync(existingTemplate.Id), "Prescription template updated.");
            }

            var newTemplate = new TblPrescriptionTemplate
            {
                Name = request.Name.Trim(),
                DiseaseId = request.DiseaseId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            foreach (var item in request.Items)
            {
                newTemplate.TblPrescriptionTemplateItems.Add(new TblPrescriptionTemplateItem
                {
                    MedicineId = item.MedicineId,
                    Dosage = item.Dosage,
                    Days = item.Days,
                    Quantity = item.Quantity,
                    Instruction = item.Instruction,
                    CreatedAt = DateTime.UtcNow,
                    DeleteFlag = false
                });
            }

            _context.TblPrescriptionTemplates.Add(newTemplate);
            await _context.SaveChangesAsync();

            return Result<SaveTemplateResponse>.Success(await MapToSaveTemplateResponseAsync(newTemplate.Id), "Prescription template saved.");
        }

        public async Task<Result<bool>> DeleteTemplateAsync(int id)
        {
            var template = await _context.TblPrescriptionTemplates
                .Include(t => t.TblPrescriptionTemplateItems)
                .FirstOrDefaultAsync(t => t.Id == id && t.DeleteFlag != true);

            if (template == null)
            {
                return Result<bool>.Failure("Prescription template not found.");
            }

            template.DeleteFlag = true;
            template.UpdatedAt = DateTime.UtcNow;

            foreach (var item in template.TblPrescriptionTemplateItems)
            {
                item.DeleteFlag = true;
            }

            await _context.SaveChangesAsync();
            return Result<bool>.Success(true, "Prescription template removed successfully.");
        }

        public async Task<PagedResult<GetTemplatesResponse>> GetTemplatesAsync(GetTemplatesRequest request)
        {
            request ??= new GetTemplatesRequest();
            if (request.PageNumber <= 0) request.PageNumber = 1;
            if (request.PageSize <= 0) request.PageSize = 10;

            var query = _context.TblPrescriptionTemplates
                .AsNoTracking()
                .Include(t => t.Disease)
                .Include(t => t.TblPrescriptionTemplateItems)
                    .ThenInclude(i => i.Medicine)
                .Where(t => t.DeleteFlag != true);

            if (request.DiseaseId.HasValue)
            {
                query = query.Where(t => t.DiseaseId == request.DiseaseId.Value);
            }

            var totalCount = await query.CountAsync();
            var templates = await query
                .OrderBy(t => t.Id)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var list = templates.Select(MapToGetTemplatesResponse).ToList();
            var pagination = new Pagination(request.PageNumber, request.PageSize, totalCount);
            return PagedResult<GetTemplatesResponse>.Success(list, pagination);
        }

        private static GetPrescriptionsResponse MapToGetPrescriptionsResponse(TblPrescription p)
        {
            var itemResponseDtos = new List<PrescriptionItemResponseDto>();
            foreach (var item in p.TblPrescriptionItems)
            {
                var sched = item.TblPrescriptionItemSchedules.FirstOrDefault();

                itemResponseDtos.Add(new PrescriptionItemResponseDto
                {
                    Id = item.Id,
                    MedicineId = item.MedicineId,
                    MedicineName = item.Medicine?.Name ?? "Unknown Medicine",
                    MedicineBatchId = item.MedicineBatchId,
                    BatchNo = item.MedicineBatch?.BatchNo,
                    Dosage = item.Dosage,
                    Days = item.Days,
                    Quantity = item.Quantity,
                    Instruction = item.Instruction,
                    DoseTime = sched?.DoseTime,
                    DoseQuantity = sched?.DoseQuantity ?? 1.0m,
                    DoseUnit = sched?.DoseUnit,
                    MealTiming = sched?.MealTiming,
                    Route = sched?.Route,
                    IntervalHours = sched?.IntervalHours,
                    IntervalDays = sched?.IntervalDays,
                    DayOfWeek = sched?.DayOfWeek,
                    IsAsNeeded = sched?.IsAsNeeded ?? false,
                    BodySite = sched?.BodySite,
                    ScheduleNote = sched?.Note
                });
            }

            return new GetPrescriptionsResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment?.AppointmentCode ?? "-",
                PatientId = p.PatientId,
                PatientName = p.Patient?.Name ?? "Unknown",
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = p.Notes,
                TemperatureC = p.TemperatureC,
                PulseBpm = p.PulseBpm,
                Spo2Percent = p.Spo2Percent,
                HeightCm = p.HeightCm,
                Bmi = p.Bmi,
                LabTestRequests = p.LabTestRequests,
                Items = itemResponseDtos,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        private static GetPrescriptionDetailsResponse MapToGetPrescriptionDetailsResponse(TblPrescription p)
        {
            var itemResponseDtos = new List<PrescriptionItemResponseDto>();
            foreach (var item in p.TblPrescriptionItems)
            {
                var sched = item.TblPrescriptionItemSchedules.FirstOrDefault();

                itemResponseDtos.Add(new PrescriptionItemResponseDto
                {
                    Id = item.Id,
                    MedicineId = item.MedicineId,
                    MedicineName = item.Medicine?.Name ?? "Unknown Medicine",
                    MedicineBatchId = item.MedicineBatchId,
                    BatchNo = item.MedicineBatch?.BatchNo,
                    Dosage = item.Dosage,
                    Days = item.Days,
                    Quantity = item.Quantity,
                    Instruction = item.Instruction,
                    DoseTime = sched?.DoseTime,
                    DoseQuantity = sched?.DoseQuantity ?? 1.0m,
                    DoseUnit = sched?.DoseUnit,
                    MealTiming = sched?.MealTiming,
                    Route = sched?.Route,
                    IntervalHours = sched?.IntervalHours,
                    IntervalDays = sched?.IntervalDays,
                    DayOfWeek = sched?.DayOfWeek,
                    IsAsNeeded = sched?.IsAsNeeded ?? false,
                    BodySite = sched?.BodySite,
                    ScheduleNote = sched?.Note
                });
            }

            return new GetPrescriptionDetailsResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment?.AppointmentCode ?? "-",
                PatientId = p.PatientId,
                PatientName = p.Patient?.Name ?? "Unknown",
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = p.Notes,
                TemperatureC = p.TemperatureC,
                PulseBpm = p.PulseBpm,
                Spo2Percent = p.Spo2Percent,
                HeightCm = p.HeightCm,
                Bmi = p.Bmi,
                LabTestRequests = p.LabTestRequests,
                Items = itemResponseDtos,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        public static PrescriptionResponse MapPrescriptionToResponse(TblPrescription p)
        {
            var itemResponseDtos = new List<PrescriptionItemResponseDto>();
            foreach (var item in p.TblPrescriptionItems)
            {
                var sched = item.TblPrescriptionItemSchedules.FirstOrDefault();

                itemResponseDtos.Add(new PrescriptionItemResponseDto
                {
                    Id = item.Id,
                    MedicineId = item.MedicineId,
                    MedicineName = item.Medicine?.Name ?? "Unknown Medicine",
                    MedicineBatchId = item.MedicineBatchId,
                    BatchNo = item.MedicineBatch?.BatchNo,
                    Dosage = item.Dosage,
                    Days = item.Days,
                    Quantity = item.Quantity,
                    Instruction = item.Instruction,
                    DoseTime = sched?.DoseTime,
                    DoseQuantity = sched?.DoseQuantity ?? 1.0m,
                    DoseUnit = sched?.DoseUnit,
                    MealTiming = sched?.MealTiming,
                    Route = sched?.Route,
                    IntervalHours = sched?.IntervalHours,
                    IntervalDays = sched?.IntervalDays,
                    DayOfWeek = sched?.DayOfWeek,
                    IsAsNeeded = sched?.IsAsNeeded ?? false,
                    BodySite = sched?.BodySite,
                    ScheduleNote = sched?.Note
                });
            }

            return new PrescriptionResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment?.AppointmentCode ?? "-",
                PatientId = p.PatientId,
                PatientName = p.Patient?.Name ?? "Unknown",
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = p.Notes,
                TemperatureC = p.TemperatureC,
                PulseBpm = p.PulseBpm,
                Spo2Percent = p.Spo2Percent,
                HeightCm = p.HeightCm,
                Bmi = p.Bmi,
                LabTestRequests = p.LabTestRequests,
                Items = itemResponseDtos,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            };
        }

        private async Task<SaveTemplateResponse> MapToSaveTemplateResponseAsync(int id)
        {
            var template = await _context.TblPrescriptionTemplates
                .AsNoTracking()
                .Include(t => t.Disease)
                .Include(t => t.TblPrescriptionTemplateItems)
                    .ThenInclude(i => i.Medicine)
                .FirstAsync(t => t.Id == id);

            return new SaveTemplateResponse
            {
                Id = template.Id.ToString(),
                Name = template.Name,
                DiseaseId = template.DiseaseId,
                DiseaseName = template.Disease?.Name ?? "Unknown Disease",
                Items = template.TblPrescriptionTemplateItems
                    .Where(i => i.DeleteFlag != true)
                    .Select(item => new TemplateItemResponseDto
                    {
                        MedicineId = item.MedicineId,
                        MedicineName = item.Medicine?.Name ?? "Unknown Medicine",
                        Dosage = item.Dosage,
                        Days = item.Days,
                        Quantity = item.Quantity,
                        Instruction = item.Instruction
                    })
                    .ToList()
            };
        }

        private static GetTemplatesResponse MapToGetTemplatesResponse(TblPrescriptionTemplate template)
        {
            return new GetTemplatesResponse
            {
                Id = template.Id.ToString(),
                Name = template.Name,
                DiseaseId = template.DiseaseId,
                DiseaseName = template.Disease?.Name ?? "Unknown Disease",
                Items = template.TblPrescriptionTemplateItems
                    .Where(i => i.DeleteFlag != true)
                    .Select(item => new TemplateItemResponseDto
                    {
                        MedicineId = item.MedicineId,
                        MedicineName = item.Medicine?.Name ?? "Unknown Medicine",
                        Dosage = item.Dosage,
                        Days = item.Days,
                        Quantity = item.Quantity,
                        Instruction = item.Instruction
                    })
                    .ToList()
            };
        }

        private static IEnumerable<string> SplitLabRequests(string? labTestRequests)
        {
            if (string.IsNullOrWhiteSpace(labTestRequests))
            {
                return Enumerable.Empty<string>();
            }

            return labTestRequests
                .Split(new[] { ',', ';', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase);
        }
    }
}
