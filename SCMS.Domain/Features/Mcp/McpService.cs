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
                },
                new()
                {
                    Name = "update_appointment_status",
                    Description = "Update the status of a specific appointment (e.g. 'pending', 'confirmed', 'cancelled', 'completed').",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            appointmentId = new { type = "integer", description = "The unique ID of the appointment." },
                            status = new { type = "string", description = "The new status: 'pending', 'confirmed', 'cancelled', or 'completed'." },
                            notes = new { type = "string", description = "Optional update notes explaining the status change." }
                        },
                        required = new[] { "appointmentId", "status" }
                    }
                },
                new()
                {
                    Name = "cancel_appointments_in_range",
                    Description = "Cancel all appointments scheduled within a specific date/time range. Supports relative dates like 'today' or 'tomorrow' and simple times.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            startTime = new { type = "string", description = "Start of the time range. Supports simple times (e.g. '10:00'), relative dates ('today at 10:00', 'tomorrow at 12:00'), or full ISO dates." },
                            endTime = new { type = "string", description = "End of the time range. Supports simple times (e.g. '12:00'), relative dates ('today at 12:00', 'tomorrow at 14:00'), or full ISO dates." },
                            reason = new { type = "string", description = "Optional reason for cancelling these appointments." }
                        },
                        required = new[] { "startTime", "endTime" }
                    }
                },
                new()
                {
                    Name = "reschedule_appointments_in_range",
                    Description = "Reschedule all appointments scheduled within a source time range by shifting them to a new target start time. Supports relative dates and simple times.",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            sourceStartTime = new { type = "string", description = "Start of source range. Supports simple times (e.g. '10:00'), relative dates ('today at 10:00', 'tomorrow at 10:00'), or full ISO dates." },
                            sourceEndTime = new { type = "string", description = "End of source range. Supports simple times (e.g. '11:00'), relative dates ('today at 11:00', 'tomorrow at 11:00'), or full ISO dates." },
                            targetStartTime = new { type = "string", description = "New start time to begin shifting appointments to. Supports simple times (e.g. '14:00'), relative dates ('today at 14:00', 'tomorrow at 08:30'), or full ISO dates." }
                        },
                        required = new[] { "sourceStartTime", "sourceEndTime", "targetStartTime" }
                    }
                },
                new()
                {
                    Name = "update_appointment_status_by_patient_name",
                    Description = "Update the status of an appointment (e.g. 'confirmed', 'cancelled') for a patient by searching for their name (partial or full matches).",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            patientName = new { type = "string", description = "The full or partial name of the patient." },
                            status = new { type = "string", description = "The new status: 'pending', 'confirmed', 'cancelled', or 'completed'." },
                            notes = new { type = "string", description = "Optional physician or administrative notes." }
                        },
                        required = new[] { "patientName", "status" }
                    }
                },
                new()
                {
                    Name = "reschedule_today_appointments",
                    Description = "Reschedule today's active appointments to start from a new target start time. Supports simple times (e.g. '08:30' or '8:30 AM') and relative dates ('today at 08:30').",
                    InputSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            targetStartTime = new { type = "string", description = "The new start time for the first appointment. Supports simple times (e.g. '08:30'), relative ('today at 08:30'), or full ISO dates." }
                        },
                        required = new[] { "targetStartTime" }
                    }
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
                    "update_appointment_status" => await UpdateAppointmentStatusAsync(request.Arguments),
                    "cancel_appointments_in_range" => await CancelAppointmentsInRangeAsync(request.Arguments),
                    "reschedule_appointments_in_range" => await RescheduleAppointmentsInRangeAsync(request.Arguments),
                    "update_appointment_status_by_patient_name" => await UpdateAppointmentStatusByPatientNameAsync(request.Arguments),
                    "reschedule_today_appointments" => await RescheduleTodayAppointmentsAsync(request.Arguments),
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

        private async Task<object> UpdateAppointmentStatusAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null ||
                !arguments.TryGetValue("appointmentId", out var apptIdObj) || !int.TryParse(apptIdObj.ToString(), out var appointmentId) ||
                !arguments.TryGetValue("status", out var statusObj) || string.IsNullOrWhiteSpace(statusObj.ToString()))
            {
                return new { error = "Invalid or missing arguments. Required: appointmentId (int), status (string)." };
            }

            var status = statusObj.ToString()!.ToLower().Trim();
            var validStatuses = new[] { "pending", "confirmed", "cancelled", "completed" };
            if (!validStatuses.Contains(status))
            {
                return new { error = $"Invalid status '{status}'. Valid statuses are: pending, confirmed, cancelled, completed." };
            }

            var appointment = await _context.TblAppointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == appointmentId);

            if (appointment == null)
            {
                return new { error = $"Appointment with ID {appointmentId} not found." };
            }

            var oldStatus = appointment.Status;
            appointment.Status = status;
            appointment.UpdatedAt = DateTime.UtcNow;

            if (arguments.TryGetValue("notes", out var notesObj) && notesObj != null && !string.IsNullOrWhiteSpace(notesObj.ToString()))
            {
                appointment.Notes = notesObj.ToString();
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = $"Appointment status updated from '{oldStatus}' to '{status}' successfully.",
                appointmentId = appointment.Id,
                patientName = appointment.Patient?.Name ?? "Unknown",
                time = appointment.Datetime.ToString("yyyy-MM-dd hh:mm tt"),
                newStatus = appointment.Status,
                notes = appointment.Notes
            };
        }

        private async Task<object> CancelAppointmentsInRangeAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null ||
                !arguments.TryGetValue("startTime", out var startObj) ||
                !arguments.TryGetValue("endTime", out var endObj))
            {
                return new { error = "Invalid or missing arguments. Required: startTime (string), endTime (string)." };
            }

            DateTime startTime, endTime;
            try
            {
                startTime = ParseDateTimeUtc(startObj.ToString()!);
                endTime = ParseDateTimeUtc(endObj.ToString()!);
            }
            catch (Exception ex)
            {
                return new { error = ex.Message };
            }

            if (startTime >= endTime)
            {
                return new { error = "startTime must be earlier than endTime." };
            }

            var appointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= startTime && a.Datetime <= endTime && a.Status != "cancelled")
                .ToListAsync();

            if (appointments.Count == 0)
            {
                return new { success = true, message = "No active appointments found in the specified time range.", count = 0 };
            }

            string reason = "Bulk cancelled via AI Assistant";
            if (arguments.TryGetValue("reason", out var reasonObj) && reasonObj != null && !string.IsNullOrWhiteSpace(reasonObj.ToString()))
            {
                reason = reasonObj.ToString()!;
            }

            foreach (var appt in appointments)
            {
                appt.Status = "cancelled";
                appt.Notes = string.IsNullOrWhiteSpace(appt.Notes) ? reason : $"{appt.Notes} | Cancelled: {reason}";
                appt.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = $"Successfully cancelled {appointments.Count} appointment(s) in the range {startTime:yyyy-MM-dd hh:mm tt} to {endTime:yyyy-MM-dd hh:mm tt}.",
                count = appointments.Count,
                cancelledAppointments = appointments.Select(a => new
                {
                    appointmentId = a.Id,
                    patientName = a.Patient?.Name ?? "Unknown",
                    time = a.Datetime.ToString("hh:mm tt"),
                    notes = a.Notes
                }).ToList()
            };
        }

        private async Task<object> RescheduleAppointmentsInRangeAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null ||
                !arguments.TryGetValue("sourceStartTime", out var sStartObj) ||
                !arguments.TryGetValue("sourceEndTime", out var sEndObj) ||
                !arguments.TryGetValue("targetStartTime", out var tStartObj))
            {
                return new { error = "Invalid or missing arguments. Required: sourceStartTime (string), sourceEndTime (string), targetStartTime (string)." };
            }

            DateTime sourceStartTime, sourceEndTime, targetStartTime;
            try
            {
                sourceStartTime = ParseDateTimeUtc(sStartObj.ToString()!);
                sourceEndTime = ParseDateTimeUtc(sEndObj.ToString()!);
                targetStartTime = ParseDateTimeUtc(tStartObj.ToString()!);
            }
            catch (Exception ex)
            {
                return new { error = ex.Message };
            }

            if (sourceStartTime >= sourceEndTime)
            {
                return new { error = "sourceStartTime must be earlier than sourceEndTime." };
            }

            var appointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= sourceStartTime && a.Datetime <= sourceEndTime && a.Status != "cancelled")
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            if (appointments.Count == 0)
            {
                return new { success = true, message = "No active appointments found in the source time range to reschedule.", count = 0 };
            }

            // Calculate the exact offset shift (difference between targetStartTime and sourceStartTime)
            var offset = targetStartTime - sourceStartTime;

            var rescheduledDetails = new List<object>();

            foreach (var appt in appointments)
            {
                var oldTime = appt.Datetime;
                var newTime = oldTime.Add(offset);
                appt.Datetime = newTime;
                appt.UpdatedAt = DateTime.UtcNow;
                
                var originalNotes = CleanRescheduledNotes(appt.Notes);
                appt.Notes = string.IsNullOrWhiteSpace(originalNotes) 
                    ? $"Rescheduled from {oldTime:hh:mm tt}" 
                    : $"{originalNotes} | Rescheduled from {oldTime:hh:mm tt}";

                rescheduledDetails.Add(new
                {
                    appointmentId = appt.Id,
                    patientName = appt.Patient?.Name ?? "Unknown",
                    oldTime = oldTime.ToString("yyyy-MM-dd hh:mm tt"),
                    newTime = newTime.ToString("yyyy-MM-dd hh:mm tt")
                });
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = $"Successfully rescheduled {appointments.Count} appointment(s). Shifted by {offset.TotalMinutes} minutes (+{offset.TotalHours:F1} hours).",
                count = appointments.Count,
                rescheduledAppointments = rescheduledDetails
            };
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

        private static DateTime ParseDateTimeUtc(string input)
        {
            var trimmed = input.Trim().ToLowerInvariant();
            
            var todayStr = DateTime.UtcNow.ToString("yyyy-MM-dd");
            var tomorrowStr = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd");

            if (trimmed.Contains("today"))
            {
                trimmed = trimmed.Replace("today", todayStr).Trim();
            }
            else if (trimmed.Contains("tomorrow"))
            {
                trimmed = trimmed.Replace("tomorrow", tomorrowStr).Trim();
            }

            // Clean up common joining words
            trimmed = trimmed.Replace(" at ", " ");

            // Check if it has a date separator or month name to see if it specifies a full date
            bool hasDateSeparator = trimmed.Contains('-') || trimmed.Contains('/') || trimmed.Contains('.');
            bool hasMonthName = trimmed.Contains("jan") ||
                                trimmed.Contains("feb") ||
                                trimmed.Contains("mar") ||
                                trimmed.Contains("apr") ||
                                trimmed.Contains("may") ||
                                trimmed.Contains("jun") ||
                                trimmed.Contains("jul") ||
                                trimmed.Contains("aug") ||
                                trimmed.Contains("sep") ||
                                trimmed.Contains("oct") ||
                                trimmed.Contains("nov") ||
                                trimmed.Contains("dec");

            if (!hasDateSeparator && !hasMonthName)
            {
                // Time-only string (e.g. "08:30", "8:30 AM", "14:00", "2:00 PM")
                // Parse it as a time to extract hours, minutes, and seconds
                if (DateTime.TryParse(trimmed, out var parsedTime))
                {
                    // Construct a UTC DateTime with today's date and the parsed time
                    var today = DateTime.UtcNow.Date;
                    return new DateTime(
                        today.Year, 
                        today.Month, 
                        today.Day, 
                        parsedTime.Hour, 
                        parsedTime.Minute, 
                        parsedTime.Second, 
                        DateTimeKind.Utc
                    );
                }
            }

            // Otherwise, it's a full date string, parse it using standard TryParse
            if (DateTime.TryParse(trimmed, null, System.Globalization.DateTimeStyles.RoundtripKind, out var dt))
            {
                if (dt.Kind == DateTimeKind.Local)
                {
                    return dt.ToUniversalTime();
                }
                else if (dt.Kind == DateTimeKind.Unspecified)
                {
                    return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                }
                return dt;
            }

            // Fallback: try general parsing style
            if (DateTime.TryParse(trimmed, null, System.Globalization.DateTimeStyles.None, out var dtFallback))
            {
                return dtFallback.Kind == DateTimeKind.Local ? dtFallback.ToUniversalTime() : dtFallback;
            }

            throw new FormatException($"Invalid date/time format: {input}");
        }

        private async Task<object> UpdateAppointmentStatusByPatientNameAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null ||
                !arguments.TryGetValue("patientName", out var nameObj) || string.IsNullOrWhiteSpace(nameObj.ToString()) ||
                !arguments.TryGetValue("status", out var statusObj) || string.IsNullOrWhiteSpace(statusObj.ToString()))
            {
                return new { error = "Invalid or missing arguments. Required: patientName (string), status (string)." };
            }

            var patientName = nameObj.ToString()!.ToLower().Trim();
            var status = statusObj.ToString()!.ToLower().Trim();
            var validStatuses = new[] { "pending", "confirmed", "cancelled", "completed" };
            if (!validStatuses.Contains(status))
            {
                return new { error = $"Invalid status '{status}'. Valid statuses are: pending, confirmed, cancelled, completed." };
            }

            // Find matching patients
            var patients = await _context.TblPatients
                .Where(p => p.Name.ToLower().Contains(patientName) && p.DeleteFlag != true)
                .ToListAsync();

            if (patients.Count == 0)
            {
                return new { error = $"No patients found matching the name '{nameObj}'." };
            }

            var patientIds = patients.Select(p => p.PatientId).ToList();
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            // Fetch active appointments
            var appointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => patientIds.Contains(a.PatientId))
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            if (appointments.Count == 0)
            {
                return new { error = $"No appointments found for patient(s) matching '{nameObj}'." };
            }

            // Filter for today's active/pending appointments first
            var todayAppts = appointments
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled" && a.Status != "completed")
                .ToList();

            TblAppointment targetAppointment;

            if (todayAppts.Count == 1)
            {
                targetAppointment = todayAppts[0];
            }
            else if (todayAppts.Count > 1)
            {
                // Ambiguity today - return the options
                return new
                {
                    ambiguity = true,
                    message = $"Multiple appointments found for today matching patient '{nameObj}'. Please specify the exact appointment ID.",
                    appointments = todayAppts.Select(a => new
                    {
                        appointmentId = a.Id,
                        patientName = a.Patient?.Name ?? "Unknown",
                        time = a.Datetime.ToString("hh:mm tt"),
                        status = a.Status
                    }).ToList()
                };
            }
            else
            {
                // No appointments today, look at recent/future pending or confirmed appointments
                var pendingFutureAppts = appointments
                    .Where(a => a.Status == "pending" || a.Status == "confirmed")
                    .OrderBy(a => Math.Abs((a.Datetime - DateTime.UtcNow).Ticks))
                    .ToList();

                if (pendingFutureAppts.Count == 1)
                {
                    targetAppointment = pendingFutureAppts[0];
                }
                else if (pendingFutureAppts.Count > 1)
                {
                    return new
                    {
                        ambiguity = true,
                        message = $"Multiple active appointments found for patient '{nameObj}'. Please specify the exact appointment ID.",
                        appointments = pendingFutureAppts.Select(a => new
                        {
                            appointmentId = a.Id,
                            patientName = a.Patient?.Name ?? "Unknown",
                            time = a.Datetime.ToString("yyyy-MM-dd hh:mm tt"),
                            status = a.Status
                        }).ToList()
                    };
                }
                else
                {
                    // Fallback to the absolute latest appointment
                    targetAppointment = appointments.OrderByDescending(a => a.Datetime).First();
                }
            }

            // Perform the status update
            var oldStatus = targetAppointment.Status;
            targetAppointment.Status = status;
            targetAppointment.UpdatedAt = DateTime.UtcNow;

            if (arguments.TryGetValue("notes", out var notesObj) && notesObj != null && !string.IsNullOrWhiteSpace(notesObj.ToString()))
            {
                targetAppointment.Notes = notesObj.ToString();
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = $"Successfully updated appointment status for patient '{targetAppointment.Patient?.Name}' from '{oldStatus}' to '{status}'.",
                appointmentId = targetAppointment.Id,
                patientName = targetAppointment.Patient?.Name ?? "Unknown",
                time = targetAppointment.Datetime.ToString("yyyy-MM-dd hh:mm tt"),
                newStatus = targetAppointment.Status,
                notes = targetAppointment.Notes
            };
        }

        private async Task<object> RescheduleTodayAppointmentsAsync(Dictionary<string, object>? arguments)
        {
            if (arguments == null ||
                !arguments.TryGetValue("targetStartTime", out var tStartObj) || string.IsNullOrWhiteSpace(tStartObj.ToString()))
            {
                return new { error = "Invalid or missing arguments. Required: targetStartTime (string)." };
            }

            DateTime targetStartTime;
            try
            {
                targetStartTime = ParseDateTimeUtc(tStartObj.ToString()!);
            }
            catch (Exception ex)
            {
                return new { error = ex.Message };
            }

            var today = targetStartTime.Date;
            var tomorrow = today.AddDays(1);

            // Get all today's active appointments ordered by time
            var appointments = await _context.TblAppointments
                .Include(a => a.Patient)
                .Where(a => a.Datetime >= today && a.Datetime < tomorrow && a.Status != "cancelled" && a.Status != "completed")
                .OrderBy(a => a.Datetime)
                .ToListAsync();

            if (appointments.Count == 0)
            {
                return new { success = true, message = "No active pending/confirmed appointments found today to reschedule.", count = 0 };
            }

            var earliestAppt = appointments[0];
            var earliestTime = earliestAppt.Datetime;

            // Calculate the exact offset shift (difference between targetStartTime and earliestTime)
            var offset = targetStartTime - earliestTime;

            var rescheduledDetails = new List<object>();

            foreach (var appt in appointments)
            {
                var oldTime = appt.Datetime;
                var newTime = oldTime.Add(offset);
                appt.Datetime = newTime;
                appt.UpdatedAt = DateTime.UtcNow;
                
                var originalNotes = CleanRescheduledNotes(appt.Notes);
                appt.Notes = string.IsNullOrWhiteSpace(originalNotes) 
                    ? $"Rescheduled from {oldTime:hh:mm tt}" 
                    : $"{originalNotes} | Rescheduled from {oldTime:hh:mm tt}";

                rescheduledDetails.Add(new
                {
                    appointmentId = appt.Id,
                    patientName = appt.Patient?.Name ?? "Unknown",
                    oldTime = oldTime.ToString("yyyy-MM-dd hh:mm tt"),
                    newTime = newTime.ToString("yyyy-MM-dd hh:mm tt")
                });
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = $"Successfully rescheduled {appointments.Count} appointment(s) today. Shifted by {offset.TotalMinutes} minutes (+{offset.TotalHours:F1} hours) to start at {targetStartTime:hh:mm tt}.",
                count = appointments.Count,
                rescheduledAppointments = rescheduledDetails
            };
        }

        private static string CleanRescheduledNotes(string? notes)
        {
            if (string.IsNullOrWhiteSpace(notes)) return string.Empty;

            int index = notes.IndexOf(" | Rescheduled from", StringComparison.OrdinalIgnoreCase);
            if (index >= 0)
            {
                return notes.Substring(0, index).Trim();
            }

            if (notes.StartsWith("Rescheduled from", StringComparison.OrdinalIgnoreCase))
            {
                return string.Empty;
            }

            return notes.Trim();
        }
    }
}
