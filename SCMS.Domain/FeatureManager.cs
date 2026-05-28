using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SCMS.Domain.Features.Auth;
using SCMS.Database.Models;
using SCMS.Domain.Features.Appointments;
using SCMS.Domain.Features.Dashboards;
using SCMS.Domain.Features.Diseases;
using SCMS.Domain.Features.Documents;
using SCMS.Domain.Features.FollowUps;
using SCMS.Domain.Features.LabReports;
using SCMS.Domain.Features.Medicines;
using SCMS.Domain.Features.Notifications;
using SCMS.Domain.Features.Patients;
using SCMS.Domain.Features.Payments;
using SCMS.Domain.Features.Prescriptions;
using SCMS.Domain.Security;
using Microsoft.AspNetCore.Builder;
using CloudinaryDotNet;

namespace SCMS.Domain
{
    public static class FeatureManager
    {
        public static IMvcBuilder AddScmsFeatureControllers(this IServiceCollection services)
        {

            return services
                .AddControllers()
                .AddApplicationPart(typeof(FeatureManager).Assembly);
        }

        public static IServiceCollection AddScmsFeatureServices(this IServiceCollection services, IConfiguration configuration)
        {

            services.AddDbContext<ScmsDbContext>(options => ConfigureDatabaseProvider(options, configuration));
            services.AddSingleton<JwtTokenFactory>();
            services.AddSingleton<PasswordHashingService>();
            services.AddScoped<AppointmentsService>();
            services.AddScoped<AuthService>();
            services.AddScoped<DashboardService>();
            services.AddScoped<DiseaseService>();
            services.AddScoped<FollowUpService>();
            services.AddScoped<LabReportService>();
            services.AddScoped<MedicineService>();
            services.AddScoped<NotificationService>();
            services.AddScoped<PatientService>();
            services.AddScoped<PaymentService>();
            services.AddScoped<PdfDocumentService>();
            services.AddScoped<PrescriptionService>();
            services.AddScoped<SCMS.Domain.Features.Photo.PhotoService>();
            services.AddHostedService<InventoryMonitorService>();

             // Cloudinary configuration
            var cloudName = new[] { "Cloudinary:CloudName", "CLOUDINARY_CLOUD_NAME", "cloud_name" }
                .Select(key => configuration[key])
                .FirstOrDefault(val => !string.IsNullOrWhiteSpace(val))?.Trim();

            var apiKey = new[] { "Cloudinary:ApiKey", "CLOUDINARY_API_KEY", "api_key" }
                .Select(key => configuration[key])
                .FirstOrDefault(val => !string.IsNullOrWhiteSpace(val))?.Trim();

            var apiSecret = new[] { "Cloudinary:ApiSecret", "CLOUDINARY_API_SECRET", "api_secret" }
                .Select(key => configuration[key])
                .FirstOrDefault(val => !string.IsNullOrWhiteSpace(val))?.Trim();

            if (!string.IsNullOrWhiteSpace(cloudName) && !string.IsNullOrWhiteSpace(apiKey) && !string.IsNullOrWhiteSpace(apiSecret))
            {
                var account = new Account(cloudName, apiKey, apiSecret);
                var cloudinary = new CloudinaryDotNet.Cloudinary(account);
                services.AddSingleton(cloudinary);
            }
            return services;
        }

        public static async Task EnsureScmsDatabaseCreatedAsync(this IServiceProvider services, IConfiguration configuration, ILogger logger)
        {
            if (!IsSqliteProvider(configuration) || configuration.GetValue("Database:EnsureCreated", true) == false)
            {
                return;
            }

            using var scope = services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ScmsDbContext>();
            await context.Database.EnsureCreatedAsync();
            await SqliteRealWorldSeeder.SeedAsync(context, configuration);
            await SeedSqliteDemoUsersAsync(context, configuration);
            logger.LogInformation("SQLite database is ready.");
        }

        private static async Task SeedSqliteDemoUsersAsync(ScmsDbContext context, IConfiguration configuration)
        {
            if (configuration.GetValue("Database:SeedDemoUsers", true) == false)
            {
                return;
            }

            var now = DateTime.UtcNow;
            var admin = await EnsureDemoUserAsync(
                context,
                "SCMS Admin",
                "09979990001",
                "admin@scms.demo",
                "admin",
                now);

            var patientUser = await EnsureDemoUserAsync(
                context,
                "SCMS Patient",
                "09979990003",
                "user@scms.demo",
                "user",
                now);

            var hasPatientProfile = await context.TblPatients
                .AnyAsync(p => p.UserId == patientUser.UserId && p.DeleteFlag != true);
            if (!hasPatientProfile)
            {
                context.TblPatients.Add(new TblPatient
                {
                    UserId = patientUser.UserId,
                    Name = "SCMS Patient",
                    MobileNo = patientUser.MobileNo,
                    Email = patientUser.Email,
                    DateOfBirth = new DateOnly(1990, 1, 1),
                    Gender = "male",
                    BloodType = "O+",
                    Address = """
                    {
                      "ActualAddress": "SQLite demo address",
                      "Allergies": "No known drug allergies",
                      "ChronicConditions": "None"
                    }
                    """,
                    CreatedAt = now,
                    UpdatedAt = now,
                    DeleteFlag = false
                });
                await context.SaveChangesAsync();
            }
        }

        private static async Task<TblUser> EnsureDemoUserAsync(
            ScmsDbContext context,
            string name,
            string mobileNo,
            string email,
            string role,
            DateTime now)
        {
            var user = await context.TblUsers
                .Include(u => u.TblUserRoles)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new TblUser
                {
                    Name = name,
                    MobileNo = mobileNo,
                    Email = email,
                    PasswordHash = "demo-password-hash",
                    CreatedAt = now,
                    UpdatedAt = now,
                    DeleteFlag = false
                };
                context.TblUsers.Add(user);
                await context.SaveChangesAsync();
            }

            if (!user.TblUserRoles.Any(r => string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase)))
            {
                context.TblUserRoles.Add(new TblUserRole
                {
                    UserId = user.UserId,
                    Role = role
                });
                await context.SaveChangesAsync();
            }

            return user;
        }

        private static void ConfigureDatabaseProvider(DbContextOptionsBuilder options, IConfiguration configuration)
        {
            if (IsSqliteProvider(configuration))
            {
                var connectionString = GetConnectionString(configuration, "SqliteConnection", "Data Source=scms.local.db");
                options.UseSqlite(connectionString);
                return;
            }

            if (IsPostgreSqlProvider(configuration))
            {
                var connectionString = GetConnectionString(configuration, "PostgreSqlConnection", null);
                options.UseNpgsql(connectionString);
                return;
            }

            throw new InvalidOperationException("Unsupported Database:Provider. Use 'Sqlite' or 'PostgreSql'.");
        }

        private static string GetConnectionString(IConfiguration configuration, string namedConnection, string? fallback)
        {
            var connectionString = configuration.GetConnectionString(namedConnection)
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? fallback;

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException($"Connection string '{namedConnection}' or 'DefaultConnection' is missing.");
            }

            return connectionString;
        }

        private static bool IsSqliteProvider(IConfiguration configuration)
        {
            var provider = configuration["Database:Provider"] ?? "Sqlite";
            return string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase)
                || string.Equals(provider, "SQLite", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsPostgreSqlProvider(IConfiguration configuration)
        {
            var provider = configuration["Database:Provider"] ?? "Sqlite";
            return string.Equals(provider, "PostgreSql", StringComparison.OrdinalIgnoreCase)
                || string.Equals(provider, "PostgreSQL", StringComparison.OrdinalIgnoreCase)
                || string.Equals(provider, "Postgres", StringComparison.OrdinalIgnoreCase)
                || string.Equals(provider, "Npgsql", StringComparison.OrdinalIgnoreCase);
        }
    }
}
