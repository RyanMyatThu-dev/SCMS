using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Domain.Features.Prescriptions.Models;
using SCMS.Shared;

namespace SCMS.Domain.Features.Prescriptions
{
    public class PrescriptionService
    {
        private readonly ScmsDbContext _context;
        private readonly string _templateFilePath = @"d:/SCMS/prescription_templates.json";
        private const int LowStockThreshold = 20;

        public PrescriptionService(ScmsDbContext context)
        {
            _context = context;
        }

        // Helper structure for serialization in Notes
        public class PrescriptionNotesMetadata
        {
            public string? ActualNotes { get; set; }
            public double? TemperatureC { get; set; }
            public int? PulseBpm { get; set; }
            public int? Spo2Percent { get; set; }
            public double? HeightCm { get; set; }
            public double? Bmi { get; set; }
            public string? LabTestRequests { get; set; }
        }

        // Helper structure for Patient medical data serialized in Address
        public class PatientAddressMetadata
        {
            public string? ActualAddress { get; set; }
            public string? Allergies { get; set; }
            public string? ChronicConditions { get; set; }
            public string? PastSurgeries { get; set; }
            public string? FamilyHistory { get; set; }
            public string? VaccinationHistory { get; set; }
        }

        public async Task<Result<PrescriptionResponse>> CreatePrescriptionAsync(CreatePrescriptionRequest request)
        {
            // Verify patient exists
            var patient = await _context.TblPatients
                .FirstOrDefaultAsync(p => p.PatientId == request.PatientId && p.DeleteFlag != true);
            if (patient == null)
            {
                return Result<PrescriptionResponse>.Failure("Patient not found.");
            }

            // Verify appointment exists
            var appointment = await _context.TblAppointments
                .FirstOrDefaultAsync(a => a.Id == request.AppointmentId);
            if (appointment == null)
            {
                return Result<PrescriptionResponse>.Failure("Appointment not found.");
            }

            var warnings = new List<string>();

            // 1. Check Allergies
            var patientMedicalInfo = ParsePatientAddress(patient.Address);
            if (!string.IsNullOrEmpty(patientMedicalInfo.Allergies))
            {
                var allergyList = patientMedicalInfo.Allergies.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(a => a.Trim().ToLower())
                    .ToList();

                foreach (var item in request.Items)
                {
                    var med = await _context.TblMedicines.FindAsync(item.MedicineId);
                    if (med != null)
                    {
                        var medNameLower = med.Name.ToLower();
                        foreach (var allergy in allergyList)
                        {
                            if (medNameLower.Contains(allergy))
                            {
                                warnings.Add($"[ALLERGY WARNING] Patient is allergic to '{allergy}', but you prescribed '{med.Name}'.");
                            }
                        }
                    }
                }
            }

            // 2. Check Drug Interactions (Basic Demo logic: e.g., Aspirin + Warfarin, or ibuprofen + aspirin)
            var prescribedMeds = new List<TblMedicine>();
            foreach (var item in request.Items)
            {
                var med = await _context.TblMedicines.FindAsync(item.MedicineId);
                if (med != null) prescribedMeds.Add(med);
            }

            for (int i = 0; i < prescribedMeds.Count; i++)
            {
                for (int j = i + 1; j < prescribedMeds.Count; j++)
                {
                    var m1 = prescribedMeds[i].Name.ToLower();
                    var m2 = prescribedMeds[j].Name.ToLower();

                    if ((m1.Contains("aspirin") && m2.Contains("warfarin")) || (m2.Contains("aspirin") && m1.Contains("warfarin")))
                    {
                        warnings.Add($"[DRUG INTERACTION] Aspirin and Warfarin interact (increased risk of bleeding).");
                    }
                    if ((m1.Contains("ibuprofen") && m2.Contains("aspirin")) || (m2.Contains("ibuprofen") && m1.Contains("aspirin")))
                    {
                        warnings.Add($"[DRUG INTERACTION] Ibuprofen may decrease the cardioprotective effect of Aspirin.");
                    }
                }
            }

            // 3. Smart Inventory Deduction (FIFO) & Expiry Warnings
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var prescriptionItemsToCreate = new List<TblPrescriptionItem>();
            var schedulesToCreate = new List<TblPrescriptionItemSchedule>();

            foreach (var item in request.Items)
            {
                var med = prescribedMeds.FirstOrDefault(m => m.MedicineId == item.MedicineId);
                if (med == null)
                {
                    return Result<PrescriptionResponse>.Failure($"Medicine ID {item.MedicineId} not found.");
                }

                // Get active non-expired batches ordered by expiry date (FIFO)
                var batches = await _context.TblMedicineBatches
                    .Where(b => b.MedId == item.MedicineId && b.Status == "active" && b.ExpiryDate > today && b.Quantity > 0 && b.DeleteFlag != true)
                    .OrderBy(b => b.ExpiryDate)
                    .ToListAsync();

                var totalAvailable = batches.Sum(b => b.Quantity);
                if (totalAvailable < item.Quantity)
                {
                    return Result<PrescriptionResponse>.Failure($"Insufficient stock for {med.Name}. Requested: {item.Quantity}, Available: {totalAvailable}.");
                }

                // Warn if total stock is low
                if (totalAvailable < LowStockThreshold)
                {
                    warnings.Add($"[LOW STOCK WARNING] '{med.Name}' is low in stock ({totalAvailable} left).");
                    
                    // Auto push notification for low stock (Story 8)
                    var clinicNotification = new TblNotification
                    {
                        UserId = null, // Broadcast/staff notification
                        Title = "Low Stock Alert",
                        Description = $"Medicine '{med.Name}' has dropped below threshold with {totalAvailable} units remaining.",
                        ActionRoute = $"/inventory/medicines/{med.MedicineId}",
                        CreatedAt = DateTime.UtcNow,
                        DeleteFlag = false
                    };
                    _context.TblNotifications.Add(clinicNotification);
                }

                // Deduct stock FIFO
                var remainingToDeduct = item.Quantity;
                foreach (var batch in batches)
                {
                    if (remainingToDeduct <= 0) break;

                    // Warn if batch is nearing expiry (within 30 days)
                    if (batch.ExpiryDate <= today.AddDays(30))
                    {
                        warnings.Add($"[EXPIRY WARNING] Batch '{batch.BatchNo}' of '{med.Name}' is nearing expiry ({batch.ExpiryDate:yyyy-MM-dd}).");
                    }

                    var pItem = new TblPrescriptionItem
                    {
                        MedicineId = item.MedicineId,
                        MedicineBatchId = batch.Id,
                        Dosage = item.Dosage,
                        Days = item.Days,
                        Quantity = Math.Min(batch.Quantity, remainingToDeduct),
                        Instruction = item.Instruction,
                        CreatedAt = DateTime.UtcNow,
                        DeleteFlag = false
                    };

                    if (batch.Quantity >= remainingToDeduct)
                    {
                        batch.Quantity -= remainingToDeduct;
                        remainingToDeduct = 0;
                    }
                    else
                    {
                        remainingToDeduct -= batch.Quantity;
                        batch.Quantity = 0;
                    }

                    batch.UpdatedAt = DateTime.UtcNow;
                    prescriptionItemsToCreate.Add(pItem);

                    // Add schedule
                    var schedule = new TblPrescriptionItemSchedule
                    {
                        StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
                        EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(item.Days)),
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
                        CreatedAt = DateTime.UtcNow,
                        DeleteFlag = false
                    };
                    schedulesToCreate.Add(schedule);
                }
            }

            // 4. Calculate BMI & Serialize extra vitals into Notes
            double? bmi = null;
            if (request.WeightKg.HasValue && request.HeightCm.HasValue && request.HeightCm.Value > 0)
            {
                var heightMeters = request.HeightCm.Value / 100.0;
                bmi = Math.Round(request.WeightKg.Value / (heightMeters * heightMeters), 2);
            }

            var notesMeta = new PrescriptionNotesMetadata
            {
                ActualNotes = request.Notes,
                TemperatureC = request.TemperatureC,
                PulseBpm = request.PulseBpm,
                Spo2Percent = request.Spo2Percent,
                HeightCm = request.HeightCm,
                Bmi = bmi,
                LabTestRequests = request.LabTestRequests
            };
            var serializedNotes = JsonSerializer.Serialize(notesMeta);

            // Save prescription
            var prescription = new TblPrescription
            {
                AppointmentId = request.AppointmentId,
                PatientId = request.PatientId,
                DiseaseId = request.DiseaseId,
                WeightKg = request.WeightKg,
                BloodPressureSystolic = request.BloodPressureSystolic,
                BloodPressureDiastolic = request.BloodPressureDiastolic,
                Notes = serializedNotes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblPrescriptions.Add(prescription);
            await _context.SaveChangesAsync(); // Generates prescription.Id

            // Link prescription items & schedules
            int scheduleIndex = 0;
            foreach (var pItem in prescriptionItemsToCreate)
            {
                pItem.PrescriptionId = prescription.Id;
                _context.TblPrescriptionItems.Add(pItem);
                await _context.SaveChangesAsync(); // Generates pItem.Id

                var schedule = schedulesToCreate[scheduleIndex++];
                schedule.PrescriptionItemId = pItem.Id;
                _context.TblPrescriptionItemSchedules.Add(schedule);
            }

            // Set appointment status to Completed
            appointment.Status = "completed";
            appointment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Format response
            var response = await GetPrescriptionDetailsAsync(prescription.Id);
            if (response.IsSuccess && response.Data != null)
            {
                response.Data.Warnings.AddRange(warnings);
                return Result<PrescriptionResponse>.Success(response.Data, "Prescription created and stock deducted.");
            }

            return Result<PrescriptionResponse>.Failure("Prescription created but failed to load response details.");
        }

        public async Task<Result<PrescriptionResponse>> GetPrescriptionDetailsAsync(int id)
        {
            var p = await _context.TblPrescriptions
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
                return Result<PrescriptionResponse>.Failure("Prescription not found.");
            }

            // Deserialize Notes
            var notesMeta = new PrescriptionNotesMetadata();
            try
            {
                if (!string.IsNullOrEmpty(p.Notes))
                {
                    notesMeta = JsonSerializer.Deserialize<PrescriptionNotesMetadata>(p.Notes) ?? new PrescriptionNotesMetadata();
                }
            }
            catch
            {
                notesMeta.ActualNotes = p.Notes; // Fallback
            }

            var itemResponseDtos = new List<PrescriptionItemResponseDto>();
            foreach (var item in p.TblPrescriptionItems)
            {
                var sched = item.TblPrescriptionItemSchedules.FirstOrDefault();

                itemResponseDtos.Add(new PrescriptionItemResponseDto
                {
                    Id = item.Id,
                    MedicineId = item.MedicineId,
                    MedicineName = item.Medicine.Name,
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

            return Result<PrescriptionResponse>.Success(new PrescriptionResponse
            {
                Id = p.Id,
                AppointmentId = p.AppointmentId,
                AppointmentCode = p.Appointment.AppointmentCode,
                PatientId = p.PatientId,
                PatientName = p.Patient.Name,
                DiseaseId = p.DiseaseId,
                DiseaseName = p.Disease?.Name,
                WeightKg = p.WeightKg,
                BloodPressureSystolic = p.BloodPressureSystolic,
                BloodPressureDiastolic = p.BloodPressureDiastolic,
                Notes = notesMeta.ActualNotes,
                TemperatureC = notesMeta.TemperatureC,
                PulseBpm = notesMeta.PulseBpm,
                Spo2Percent = notesMeta.Spo2Percent,
                HeightCm = notesMeta.HeightCm,
                Bmi = notesMeta.Bmi,
                LabTestRequests = notesMeta.LabTestRequests,
                Items = itemResponseDtos,
                CreatedAt = p.CreatedAt ?? DateTime.UtcNow
            });
        }

        public async Task<PagedResult<PrescriptionResponse>> GetPrescriptionsAsync(int? patientId, PaginationRequest paginationRequest)
        {
            var query = _context.TblPrescriptions.Where(p => p.DeleteFlag != true);

            if (patientId.HasValue)
            {
                query = query.Where(p => p.PatientId == patientId.Value);
            }

            var totalCount = await query.CountAsync();
            var ids = await query
                .OrderByDescending(p => p.Id)
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .Select(p => p.Id)
                .ToListAsync();

            var list = new List<PrescriptionResponse>();
            foreach (var id in ids)
            {
                var r = await GetPrescriptionDetailsAsync(id);
                if (r.IsSuccess && r.Data != null)
                {
                    list.Add(r.Data);
                }
            }

            var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
            return PagedResult<PrescriptionResponse>.Success(list, pagination);
        }

        // --- Prescription Templates (Stored in local JSON file) ---

        private class TemplateFileStructure
        {
            public string Id { get; set; } = null!;
            public string Name { get; set; } = null!;
            public int DiseaseId { get; set; }
            public List<TemplateItemDto> Items { get; set; } = new();
        }

        public async Task<Result<PrescriptionTemplateResponse>> SaveTemplateAsync(SaveTemplateRequest request)
        {
            var disease = await _context.TblDiseases.FindAsync(request.DiseaseId);
            if (disease == null)
            {
                return Result<PrescriptionTemplateResponse>.Failure("Disease not found.");
            }

            var templates = new List<TemplateFileStructure>();
            if (File.Exists(_templateFilePath))
            {
                try
                {
                    var rawJson = await File.ReadAllTextAsync(_templateFilePath);
                    templates = JsonSerializer.Deserialize<List<TemplateFileStructure>>(rawJson) ?? new List<TemplateFileStructure>();
                }
                catch
                {
                    // Fallback if file corrupt
                }
            }

            var newTemplate = new TemplateFileStructure
            {
                Id = Guid.NewGuid().ToString(),
                Name = request.Name,
                DiseaseId = request.DiseaseId,
                Items = request.Items
            };

            templates.Add(newTemplate);

            var dir = Path.GetDirectoryName(_templateFilePath);
            if (dir != null && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }

            await File.WriteAllTextAsync(_templateFilePath, JsonSerializer.Serialize(templates, new JsonSerializerOptions { WriteIndented = true }));

            // Map and return response
            return Result<PrescriptionTemplateResponse>.Success(await MapToTemplateResponseAsync(newTemplate), "Prescription template saved.");
        }

        public async Task<PagedResult<PrescriptionTemplateResponse>> GetTemplatesAsync(int? diseaseId, PaginationRequest paginationRequest)
        {
            var templates = new List<TemplateFileStructure>();
            if (File.Exists(_templateFilePath))
            {
                try
                {
                    var rawJson = await File.ReadAllTextAsync(_templateFilePath);
                    templates = JsonSerializer.Deserialize<List<TemplateFileStructure>>(rawJson) ?? new List<TemplateFileStructure>();
                }
                catch
                {
                    // Ignore
                }
            }

            if (diseaseId.HasValue)
            {
                templates = templates.Where(t => t.DiseaseId == diseaseId.Value).ToList();
            }

            var totalCount = templates.Count;
            var paged = templates
                .Skip((paginationRequest.PageNumber - 1) * paginationRequest.PageSize)
                .Take(paginationRequest.PageSize)
                .ToList();

            var list = new List<PrescriptionTemplateResponse>();
            foreach (var t in paged)
            {
                list.Add(await MapToTemplateResponseAsync(t));
            }

            var pagination = new Pagination(paginationRequest.PageNumber, paginationRequest.PageSize, totalCount);
            return PagedResult<PrescriptionTemplateResponse>.Success(list, pagination);
        }

        private async Task<PrescriptionTemplateResponse> MapToTemplateResponseAsync(TemplateFileStructure t)
        {
            var disease = await _context.TblDiseases.FindAsync(t.DiseaseId);
            var diseaseName = disease?.Name ?? "Unknown Disease";

            var itemsList = new List<TemplateItemResponseDto>();
            foreach (var item in t.Items)
            {
                var med = await _context.TblMedicines.FindAsync(item.MedicineId);
                var medName = med?.Name ?? "Unknown Medicine";
                itemsList.Add(new TemplateItemResponseDto
                {
                    MedicineId = item.MedicineId,
                    MedicineName = medName,
                    Dosage = item.Dosage,
                    Days = item.Days,
                    Quantity = item.Quantity,
                    Instruction = item.Instruction
                });
            }

            return new PrescriptionTemplateResponse
            {
                Id = t.Id,
                Name = t.Name,
                DiseaseId = t.DiseaseId,
                DiseaseName = diseaseName,
                Items = itemsList
            };
        }

        private PatientAddressMetadata ParsePatientAddress(string? address)
        {
            if (string.IsNullOrEmpty(address)) return new PatientAddressMetadata();
            try
            {
                if (address.TrimStart().StartsWith("{"))
                {
                    return JsonSerializer.Deserialize<PatientAddressMetadata>(address) ?? new PatientAddressMetadata();
                }
            }
            catch
            {
                // Fallback if address is plain text
            }

            return new PatientAddressMetadata { ActualAddress = address };
        }
    }
}
