using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;
using SCMS.Shared;
using SCMS.Shared.Contracts.Mcp;

namespace SCMS.Domain.Features.Mcp
{
    public class McpService
    {
        private readonly AppDbContext _context;

        public McpService(AppDbContext context)
        {
            _context = context;
        }

        public List<McpToolDefinition> GetAvailableTools()
        {
            return new List<McpToolDefinition>
            {
                new()
                {
                    Name = "get_today_appointments",
                    Description = "Retrieve scheduled appointments and details for today's briefing.",
                    InputSchema = new { type = "object", properties = new { } }
                },
                new()
                {
                    Name = "get_waiting_queue",
                    Description = "Retrieve patients currently in the live waiting queue.",
                    InputSchema = new { type = "object", properties = new { } }
                },
                new()
                {
                    Name = "get_next_patient",
                    Description = "Retrieve details and medical snapshot of the next patient in the queue.",
                    InputSchema = new { type = "object", properties = new { } }
                },
                new()
                {
                    Name = "get_patient_profile",
                    Description = "Retrieve a patient's core profile, demographics, allergies, and chronic conditions.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            patientId = new { type = "integer", description = "The unique identifier of the patient." }
                        },
                        required = new[] { "patientId" }
                    }
                },
                new()
                {
                    Name = "get_patient_visit_history",
                    Description = "Retrieve chronological list of past appointments/visits for a patient.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            patientId = new { type = "integer", description = "The unique identifier of the patient." }
                        },
                        required = new[] { "patientId" }
                    }
                },
                new()
                {
                    Name = "get_patient_prescription_history",
                    Description = "Retrieve historical medications and prescriptions prescribed to a patient.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            patientId = new { type = "integer", description = "The unique identifier of the patient." }
                        },
                        required = new[] { "patientId" }
                    }
                },
                new()
                {
                    Name = "get_medicine_stock",
                    Description = "Query current stock levels and batch information for a specific medicine by name.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            name = new { type = "string", description = "Name or fragment of the medicine." }
                        },
                        required = new[] { "name" }
                    }
                },
                new()
                {
                    Name = "get_low_stock_medicines",
                    Description = "Retrieve list of all medicines whose total active stock is below the critical threshold (20 units).",
                    InputSchema = new { type = "object", properties = new { } }
                },
                new()
                {
                    Name = "get_expiring_batches",
                    Description = "Retrieve list of all active medicine batches expiring within the next 30 days.",
                    InputSchema = new { type = "object", properties = new { } }
                },
                new()
                {
                    Name = "create_follow_up_reminder",
                    Description = "Create a follow-up reminder for a patient.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            patientId = new { type = "integer", description = "The unique identifier of the patient." },
                            dueInDays = new { type = "integer", description = "Number of days from today when the follow-up is due." },
                            recommendation = new { type = "string", description = "Clinical recommendation or notes for the follow-up." }
                        },
                        required = new[] { "patientId", "dueInDays", "recommendation" }
                    }
                },
                new()
                {
                    Name = "get_unread_notifications",
                    Description = "Retrieve unread system alerts, expiring batches, and inventory notifications.",
                    InputSchema = new { type = "object", properties = new { } }
                }
            };
        }

        public async Task<Result<McpToolCallResponse>> CallToolAsync(McpToolCallRequest request)
        {
            try
            {
                object? data = request.Name switch
                {
                    "get_today_appointments" => await GetTodayAppointmentsAsync(),
                    "get_waiting_queue" => await GetWaitingQueueAsync(),
                    "get_next_patient" => await GetNextPatientAsync(),
                    "get_patient_profile" => await GetPatientProfileAsync(request.Arguments),
                    "get_patient_visit_history" => await GetPatientVisitHistoryAsync(request.Arguments),
                    "get_patient_prescription_history" => await GetPatientPrescriptionHistoryAsync(request.Arguments),
                    "get_medicine_stock" => await GetMedicineStockAsync(request.Arguments),
                    "get_low_stock_medicines" => await GetLowStockMedicinesAsync(),
                    "get_expiring_batches" => await GetExpiringBatchesAsync(),
                    "create_follow_up_reminder" => await CreateFollowUpReminderAsync(request.Arguments),
                    "get_unread_notifications" => await GetUnreadNotificationsAsync(),
                    _ => null
                };

                if (data == null)
                {
                    return Result<McpToolCallResponse>.Failure($"Tool '{request.Name}' is not implemented or failed to run.");
                }

                var response = new McpToolCallResponse
                {
                    Content = new List<McpContentItem>
                    {
                        new()
                        {
                            Type = "text",
                            Text = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true })
                        }
                    },
                    IsError = false
                };

                return Result<McpToolCallResponse>.Success(response);
            }
            catch (Exception ex)
            {
                return Result<McpToolCallResponse>.Failure($"Error executing tool {request.Name}: {ex.Message}");
            }
        }

        private async Task<object> GetTodayAppointmentsAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var appointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow)
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            return appointments.Select((a, idx) => new
            {
                appointmentId = a.Id,
                code = a.AppointmentCode,
                patientId = a.PatientId,
                patientName = a.Patient?.Name ?? "Unknown",
                time = a.Datetime.ToString("hh:mm tt"),
                status = a.Status,
                notes = a.Notes,
                token = idx + 1
            }).ToList();
        }

        private async Task<object> GetWaitingQueueAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var todayAppointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled")
                .OrderBy(a => a.Id)
                .ToListAsync();

            var queue = todayAppointments.Select((a, idx) => new
            {
                token = idx + 1,
                appointmentId = a.Id,
                patientName = a.Patient?.Name ?? "Unknown",
                reason = a.Notes ?? "Consultation",
                status = a.Status
            }).Where(q => q.status == "pending" || q.status == "confirmed").ToList();

            var active = todayAppointments.FirstOrDefault(a => a.Status == "confirmed");
            var activeToken = active != null ? todayAppointments.IndexOf(active) + 1 : 0;

            return new
            {
                waitingCount = queue.Count,
                currentActiveToken = activeToken,
                queueList = queue
            };
        }

        private async Task<object?> GetNextPatientAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            var todayAppointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled")
                .OrderBy(a => a.Id)
                .ToListAsync();

            // First confirmed is active, first pending is next
            var nextAppt = todayAppointments.FirstOrDefault(a => a.Status == "pending");
            if (nextAppt == null) return new { message = "No more pending patients in queue." };

            var token = todayAppointments.IndexOf(nextAppt) + 1;
            var patient = nextAppt.Patient;

            // Get recent prescriptions
            var lastPrescription = await _context.TblPrescriptions
                .Include(p => p.TblPrescriptionItems)
                .ThenInclude(pi => pi.MedicineBatch)
                .ThenInclude(mb => mb.Med)
                .Where(p => p.PatientId == patient.PatientId && p.DeleteFlag != true)
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            var recentMeds = lastPrescription?.TblPrescriptionItems
                .Where(pi => pi.DeleteFlag != true)
                .Select(pi => pi.MedicineBatch?.Med?.Name ?? "Unknown Medicine")
                .ToList() ?? new List<string>();

            return new
            {
                token,
                appointmentId = nextAppt.Id,
                patientId = patient.PatientId,
                name = patient.Name,
                gender = patient.Gender,
                age = GetAge(patient.DateOfBirth),
                notes = nextAppt.Notes,
                recentMedicines = recentMeds
            };
        }

        private async Task<object?> GetPatientProfileAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null || !arguments.TryGetValue("patientId", out var idObj) || !int.TryParse(idObj.ToString(), out var patientId))
            {
                return new { error = "Invalid or missing patientId." };
            }

            var patient = await _context.TblPatients
                .FirstOrDefaultAsync(p => p.PatientId == patientId && p.DeleteFlag != true);

            if (patient == null) return new { error = "Patient not found." };

            string allergies = "No known allergies";
            string chronicConditions = "None";

            if (!string.IsNullOrWhiteSpace(patient.Address))
            {
                try
                {
                    using var doc = JsonDocument.Parse(patient.Address);
                    var root = doc.RootElement;
                    if (root.TryGetProperty("Allergies", out var allergyProp))
                    {
                        allergies = allergyProp.GetString() ?? allergies;
                    }
                    if (root.TryGetProperty("ChronicConditions", out var chronicProp))
                    {
                        chronicConditions = chronicProp.GetString() ?? chronicConditions;
                    }
                }
                catch { }
            }

            return new
            {
                patientId = patient.PatientId,
                name = patient.Name,
                gender = patient.Gender,
                dob = patient.DateOfBirth?.ToString("yyyy-MM-dd") ?? "Unknown",
                age = GetAge(patient.DateOfBirth),
                bloodType = patient.BloodType ?? "Unknown",
                mobileNo = patient.MobileNo,
                email = patient.Email,
                allergies,
                chronicConditions
            };
        }

        private async Task<object> GetPatientVisitHistoryAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null || !arguments.TryGetValue("patientId", out var idObj) || !int.TryParse(idObj.ToString(), out var patientId))
            {
                return new { error = "Invalid or missing patientId." };
            }

            var appointments = await _context.TblAppointments
                .Where(a => a.PatientId == patientId)
                .OrderByDescending(a => a.Datetime)
                .Take(10)
                .ToListAsync();

            return appointments.Select(a => new
            {
                appointmentId = a.Id,
                date = a.Datetime.ToString("yyyy-MM-dd"),
                time = a.Datetime.ToString("hh:mm tt"),
                status = a.Status,
                reason = a.Notes ?? "Consultation"
            }).ToList();
        }

        private async Task<object> GetPatientPrescriptionHistoryAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null || !arguments.TryGetValue("patientId", out var idObj) || !int.TryParse(idObj.ToString(), out var patientId))
            {
                return new { error = "Invalid or missing patientId." };
            }

            var prescriptions = await _context.TblPrescriptions
                .Include(p => p.TblPrescriptionItems)
                .ThenInclude(pi => pi.MedicineBatch)
                .ThenInclude(mb => mb.Med)
                .Where(p => p.PatientId == patientId && p.DeleteFlag != true)
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .ToListAsync();

            return prescriptions.Select(p => new
            {
                prescriptionId = p.Id,
                date = p.CreatedAt?.ToString("yyyy-MM-dd") ?? "Unknown",
                notes = p.Notes,
                items = p.TblPrescriptionItems
                    .Where(pi => pi.DeleteFlag != true)
                    .Select(pi => new
                    {
                        medicineName = pi.MedicineBatch?.Med?.Name ?? "Unknown Medicine",
                        dosage = $"{pi.Dosage} for {pi.Days} days. Instruction: {pi.Instruction}",
                        quantity = pi.Quantity
                    }).ToList()
            }).ToList();
        }

        private async Task<object> GetMedicineStockAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null || !arguments.TryGetValue("name", out var nameObj) || string.IsNullOrWhiteSpace(nameObj.ToString()))
            {
                return new { error = "Invalid or missing medicine name." };
            }

            var query = nameObj.ToString()!.ToLower().Trim();
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var medicines = await _context.TblMedicines
                .Include(m => m.Category)
                .Include(m => m.TblMedicineBatches)
                .Where(m => m.Name.ToLower().Contains(query) && m.DeleteFlag != true)
                .ToListAsync();

            return medicines.Select(m =>
            {
                var activeBatches = m.TblMedicineBatches
                    .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today)
                    .OrderBy(b => b.ExpiryDate)
                    .ToList();

                var totalStock = activeBatches.Sum(b => b.Quantity);

                return new
                {
                    medicineId = m.MedicineId,
                    name = m.Name,
                    description = m.Description,
                    categoryName = m.Category?.Name ?? "None",
                    unitPrice = m.UnitPrice,
                    totalStock,
                    batches = activeBatches.Select(b => new
                    {
                        batchNo = b.BatchNo,
                        quantity = b.Quantity,
                        expiryDate = b.ExpiryDate.ToString("yyyy-MM-dd"),
                        supplier = b.SupplierName ?? "Unknown"
                    }).ToList()
                };
            }).ToList();
        }

        private async Task<object> GetLowStockMedicinesAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var medicines = await _context.TblMedicines
                .Include(m => m.TblMedicineBatches)
                .Where(m => m.DeleteFlag != true)
                .ToListAsync();

            var result = new List<object>();

            foreach (var m in medicines)
            {
                var totalStock = m.TblMedicineBatches
                    .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today)
                    .Sum(b => b.Quantity);

                if (totalStock < 20)
                {
                    result.Add(new
                    {
                        medicineId = m.MedicineId,
                        name = m.Name,
                        totalStock,
                        threshold = 20
                    });
                }
            }

            return result;
        }

        private async Task<object> GetExpiringBatchesAsync()
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var thirtyDaysFromNow = today.AddDays(30);

            var batches = await _context.TblMedicineBatches
                .Include(b => b.Med)
                .Where(b => b.DeleteFlag != true && b.Status == "active" && b.ExpiryDate > today && b.ExpiryDate <= thirtyDaysFromNow)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync();

            return batches.Select(b => new
            {
                batchId = b.Id,
                batchNo = b.BatchNo,
                medicineName = b.Med?.Name ?? "Unknown",
                quantity = b.Quantity,
                expiryDate = b.ExpiryDate.ToString("yyyy-MM-dd"),
                daysRemaining = (b.ExpiryDate.ToDateTime(TimeOnly.MinValue) - DateTime.UtcNow).Days
            }).ToList();
        }

        private async Task<object> CreateFollowUpReminderAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null || 
                !arguments.TryGetValue("patientId", out var patientIdObj) || !int.TryParse(patientIdObj.ToString(), out var patientId) ||
                !arguments.TryGetValue("dueInDays", out var dueObj) || !int.TryParse(dueObj.ToString(), out var dueInDays) ||
                !arguments.TryGetValue("recommendation", out var recObj) || string.IsNullOrWhiteSpace(recObj.ToString()))
            {
                return new { error = "Invalid or missing arguments. Required: patientId (int), dueInDays (int), recommendation (string)." };
            }

            var patientExists = await _context.TblPatients
                .AnyAsync(p => p.PatientId == patientId && p.DeleteFlag != true);

            if (!patientExists) return new { error = "Patient not found." };

            var dueAt = DateTime.UtcNow.AddDays(dueInDays);

            var followUp = new TblFollowUp
            {
                PatientId = patientId,
                DueAt = dueAt,
                Recommendation = recObj.ToString()!,
                Status = "pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };

            _context.TblFollowUps.Add(followUp);
            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = "Follow-up reminder created successfully.",
                followUpId = followUp.Id,
                dueAt = dueAt.ToString("yyyy-MM-dd hh:mm tt"),
                recommendation = followUp.Recommendation
            };
        }

        private async Task<object> GetUnreadNotificationsAsync()
        {
            var notifications = await _context.TblNotifications
                .Where(n => n.DeleteFlag != true)
                .OrderByDescending(n => n.CreatedAt)
                .Take(10)
                .ToListAsync();

            return notifications.Select(n => new
            {
                notificationId = n.Id,
                title = n.Title,
                description = n.Description,
                createdAt = n.CreatedAt?.ToString("yyyy-MM-dd hh:mm tt") ?? "Unknown"
            }).ToList();
        }

        private static int GetAge(DateOnly? dateOfBirth)
        {
            if (dateOfBirth == null) return 0;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var dob = dateOfBirth.Value;
            var age = today.Year - dob.Year;
            if (dob > today.AddYears(-age)) age--;
            return age;
        }
    }
}
