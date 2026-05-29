using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using SCMS.Database.Models;
using SCMS.Domain.Features.Mcp;
using SCMS.Domain.Tests.TestSupport;
using SCMS.Shared.Contracts.Mcp;

namespace SCMS.Domain.Tests.Mcp
{
    public class McpServiceTests : IDisposable
    {
        private readonly TestDatabase _db;
        private readonly McpService _service;

        public McpServiceTests()
        {
            _db = new TestDatabase();
            _service = new McpService(_db.Context);
        }

        public void Dispose()
        {
            _db.Dispose();
        }

        private async Task<TblUser> CreateTestUserAsync(string email)
        {
            var user = new TblUser
            {
                Name = "Test User",
                MobileNo = "09979990000",
                Email = email,
                PasswordHash = "hash",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _db.Context.TblUsers.Add(user);
            await _db.Context.SaveChangesAsync();
            return user;
        }

        [Fact]
        public void GetAvailableTools_ReturnsFullToolsList()
        {
            // Act
            var tools = _service.GetAvailableTools();

            // Assert
            Assert.NotNull(tools);
            Assert.NotEmpty(tools);
            Assert.Contains(tools, t => t.Name == "get_today_appointments");
            Assert.Contains(tools, t => t.Name == "get_waiting_queue");
            Assert.Contains(tools, t => t.Name == "get_patient_profile");
            Assert.Contains(tools, t => t.Name == "create_follow_up_reminder");
        }

        [Fact]
        public async Task CallToolAsync_WithInvalidTool_ReturnsFailure()
        {
            // Arrange
            var request = new McpToolCallRequest { Name = "invalid_tool_name" };

            // Act
            var result = await _service.CallToolAsync(request);

            // Assert
            Assert.True(result.IsFailure);
            Assert.Null(result.Data);
        }

        [Fact]
        public async Task CallToolAsync_GetTodayAppointments_RunsSuccessfully()
        {
            // Arrange
            var user = await CreateTestUserAsync("john@scms.demo");
            
            var patient = new TblPatient
            {
                UserId = user.UserId,
                Name = "John Doe",
                MobileNo = "09979991111",
                DateOfBirth = new DateOnly(1985, 5, 20),
                Gender = "male",
                Address = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _db.Context.TblPatients.Add(patient);
            await _db.Context.SaveChangesAsync();

            var appointment = new TblAppointment
            {
                AppointmentCode = "APT-001-TEST",
                PatientId = patient.PatientId,
                Datetime = DateTime.UtcNow.Date.AddHours(10), // today
                Status = "pending",
                Notes = "Consultation",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Context.TblAppointments.Add(appointment);
            await _db.Context.SaveChangesAsync();

            var request = new McpToolCallRequest { Name = "get_today_appointments" };

            // Act
            var result = await _service.CallToolAsync(request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Single(result.Data.Content);
            Assert.Contains("APT-001-TEST", result.Data.Content[0].Text);
            Assert.Contains("John Doe", result.Data.Content[0].Text);
        }

        [Fact]
        public async Task CallToolAsync_CreateFollowUpReminder_SavesToDatabase()
        {
            // Arrange
            var user = await CreateTestUserAsync("jane@scms.demo");

            var patient = new TblPatient
            {
                UserId = user.UserId,
                Name = "Jane Doe",
                MobileNo = "09979992222",
                DateOfBirth = new DateOnly(1990, 8, 15),
                Gender = "female",
                Address = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                DeleteFlag = false
            };
            _db.Context.TblPatients.Add(patient);
            await _db.Context.SaveChangesAsync();

            var request = new McpToolCallRequest
            {
                Name = "create_follow_up_reminder",
                Arguments = new Dictionary<string, object>
                {
                    { "patientId", patient.PatientId },
                    { "dueInDays", 7 },
                    { "recommendation", "Review blood test results." }
                }
            };

            // Act
            var result = await _service.CallToolAsync(request);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Contains("Review blood test results.", result.Data.Content[0].Text);

            var followUp = _db.Context.TblFollowUps.FirstOrDefault(f => f.PatientId == patient.PatientId);
            Assert.NotNull(followUp);
            Assert.Equal("Review blood test results.", followUp.Recommendation);
            Assert.Equal("pending", followUp.Status);
            Assert.True(followUp.DueAt > DateTime.UtcNow);
        }
    }
}
