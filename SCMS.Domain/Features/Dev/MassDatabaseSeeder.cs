using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;

namespace SCMS.Domain.Features.Dev
{
    public class MassDatabaseSeeder
    {
        private readonly AppDbContext _context;
        private static readonly string YyyyMmDdFormat = "yyyy-mm-dd".Replace("mm", "\x4d\x4d");
        private static readonly string YyyyMmDdCompactFormat = "yyyymmdd".Replace("mm", "\x4d\x4d");

        public MassDatabaseSeeder(AppDbContext context)
        {
            _context = context;
        }

        public async Task Seed1YearDataAsync()
        {
            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine("Starting Mass Database Seeder...");
            Console.WriteLine("This will generate 1 year of data and may take a minute.");
            Console.WriteLine("Please DO NOT CLOSE the application until it finishes.");
            Console.WriteLine("--------------------------------------------------");

            // Wipe ALL tables and reset all sequences
            await _context.Database.ExecuteSqlRawAsync(@"
                DO $$ DECLARE
                    r RECORD;
                BEGIN
                    SET session_replication_role = 'replica';
                    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                    END LOOP;
                    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
                        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1';
                    END LOOP;
                    SET session_replication_role = 'origin';
                END $$;
            ");

            // Load base seed data
            var seedFilePath = System.IO.Path.Combine(System.IO.Directory.GetCurrentDirectory(), "..", "seed.realworld.sql");
            if (System.IO.File.Exists(seedFilePath))
            {
                var sql = await System.IO.File.ReadAllTextAsync(seedFilePath);
                
                var connection = _context.Database.GetDbConnection();
                var shouldClose = connection.State != System.Data.ConnectionState.Open;
                if (shouldClose) await connection.OpenAsync();
                
                try
                {
                    await using var command = connection.CreateCommand();
                    command.CommandText = sql;
                    await command.ExecuteNonQueryAsync();
                }
                finally
                {
                    if (shouldClose) await connection.CloseAsync();
                }
            }

            // Seed configuration
            int numPatients = 200;
            int daysToSimulate = 365;
            var random = new Random(); // True random for different runs

            // Vocabulary for Myanmar names
            var maleTitles = new[] { "U", "Ko", "Mg" };
            var femaleTitles = new[] { "Daw", "Ma" };
            var nameParts = new[] { "Aung", "Moe", "Tun", "Phyu", "Zaw", "Lin", "Hlaing", "Min", "Khant", "Kyaw", "Swar", "Thuzar", "Aye", "Myat", "Khaing", "Wai", "Nyi", "Naing", "Soe", "Win", "Htut", "Lwin", "Thiha", "Zayar", "Thein", "Phyo", "Zin", "Thant", "Hein" };
            var symptoms = new[] { "Fever and chills", "Headache", "Stomach ache", "Routine checkup", "Follow-up visit", "Cough and cold", "Body ache", "Skin allergy", "High blood pressure check" };
            var paymentMethods = new[] { "Cash", "OnlinePayment" };
            var bloodTypes = new[] { "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-" };

            string GenerateName(bool isMale)
            {
                var title = isMale ? maleTitles[random.Next(maleTitles.Length)] : femaleTitles[random.Next(femaleTitles.Length)];
                
                int partsCount = random.Next(1, 4); // 1 to 3 name parts
                var parts = new List<string>();
                for (int i = 0; i < partsCount; i++)
                {
                    string part;
                    do { part = nameParts[random.Next(nameParts.Length)]; } while (parts.Contains(part));
                    parts.Add(part);
                }
                
                return $"{title} {string.Join(" ", parts)}";
            }

            // 1. Generate Patients and Users
            var newUsers = new List<TblUser>();
            var newPatients = new List<TblPatient>();
            var userGenderMap = new Dictionary<string, bool>(); // email -> isMale

            for (int i = 0; i < numPatients; i++)
            {
                bool isMale = i % 2 == 0; // Alternate: 50% male, 50% female guaranteed
                var fullName = GenerateName(isMale);
                var email = $"patient_{Guid.NewGuid().ToString().Substring(0, 8)}@example.com";
                // Guarantee uniqueness and avoid collision with seed.realworld by using a high base and the index
                var mobile = $"099{80000000 + i}";
                var createdDate = DateTime.UtcNow.AddDays(-random.Next(daysToSimulate, daysToSimulate + 100));

                userGenderMap[email] = isMale;

                var user = new TblUser
                {
                    Name = fullName,
                    Email = email,
                    MobileNo = mobile,
                    PasswordHash = "demo-password-hash",
                    CreatedAt = createdDate,
                    UpdatedAt = createdDate,
                    DeleteFlag = false
                };
                newUsers.Add(user);
            }

            Console.WriteLine($"Creating {numPatients} users...");
            await _context.TblUsers.AddRangeAsync(newUsers);
            await _context.SaveChangesAsync();

            foreach (var user in newUsers)
            {
                // Assign role
                _context.TblUserRoles.Add(new TblUserRole { UserId = user.UserId, Role = "user" });

                // Create Patient
                bool isMale = userGenderMap.GetValueOrDefault(user.Email!, false);
                var dob = DateTime.UtcNow.AddYears(-random.Next(5, 70)).AddDays(-random.Next(0, 365));

                var patient = new TblPatient
                {
                    UserId = user.UserId,
                    Name = user.Name,
                    MobileNo = user.MobileNo,
                    Email = user.Email,
                    DateOfBirth = DateOnly.FromDateTime(dob),
                    Gender = isMale ? "male" : "female",
                    BloodType = bloodTypes[random.Next(bloodTypes.Length)],
                    Address = "{ \"ActualAddress\": \"Yangon, Myanmar\" }",
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.CreatedAt,
                    DeleteFlag = false
                };
                newPatients.Add(patient);
            }

            Console.WriteLine($"Creating {numPatients} patients...");
            await _context.TblPatients.AddRangeAsync(newPatients);
            await _context.SaveChangesAsync();

            // Generate 30 Diseases
            Console.WriteLine("Creating 30 diseases...");
            var diseaseNames = new[]
            {
                "Hypertension", "Type 2 Diabetes", "Asthma", "Bronchitis", "Pneumonia",
                "Gastritis", "Peptic Ulcer", "Urinary Tract Infection", "Dengue Fever", "Malaria",
                "Typhoid Fever", "Tuberculosis", "Hepatitis B", "Hepatitis A", "Chickenpox",
                "Influenza", "COVID-19", "Migraine", "Osteoarthritis", "Rheumatoid Arthritis",
                "Anemia", "Conjunctivitis", "Otitis Media", "Sinusitis", "Tonsillitis",
                "Eczema", "Psoriasis", "Allergic Rhinitis", "Vertigo", "Gout"
            };
            var diseaseDescriptions = new[]
            {
                "Elevated blood pressure requiring monitoring", "Metabolic disorder affecting blood sugar", "Chronic airway inflammation", "Inflammation of the bronchial tubes", "Lung infection causing cough and fever",
                "Inflammation of the stomach lining", "Sore in the stomach or intestinal lining", "Bacterial infection of the urinary system", "Mosquito-borne viral infection", "Parasitic disease transmitted by mosquitoes",
                "Bacterial infection from contaminated food/water", "Bacterial infection primarily affecting the lungs", "Viral infection affecting the liver", "Liver infection from contaminated food/water", "Highly contagious viral infection with rash",
                "Viral respiratory infection", "Respiratory illness caused by SARS-CoV-2", "Severe recurring headache", "Degenerative joint disease", "Autoimmune joint inflammation",
                "Low red blood cell count", "Eye inflammation or pink eye", "Middle ear infection", "Inflammation of the sinuses", "Inflammation of the tonsils",
                "Chronic skin condition with itchy rash", "Autoimmune skin condition with scaly patches", "Allergic inflammation of the nasal passages", "Sensation of spinning or dizziness", "Inflammatory arthritis from uric acid buildup"
            };
            
            var existingDiseases = await _context.TblDiseases.Select(d => d.Name).ToListAsync();
            
            for (int i = 0; i < diseaseNames.Length; i++)
            {
                if (existingDiseases.Contains(diseaseNames[i])) continue;
                
                _context.TblDiseases.Add(new TblDisease
                {
                    Name = diseaseNames[i],
                    Description = diseaseDescriptions[i],
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    DeleteFlag = false
                });
            }
            await _context.SaveChangesAsync();

            // Generate ~100 Extra Medicines
            Console.WriteLine("Creating 100 medicines...");
            var extraMedicines = new List<TblMedicine>();
            var medPrefixes = new[] { "Amoxi", "Para", "Cetra", "Metro", "Aspi", "Ibu", "Ome", "Vita", "Dexam", "Lorat" };
            var medSuffixes = new[] { "cillin", "cetamol", "zine", "nidazole", "rin", "profen", "prazole", "min", "thasone", "dine" };
            
            for (int i = 0; i < 100; i++)
            {
                var name = $"{medPrefixes[random.Next(medPrefixes.Length)]}{medSuffixes[random.Next(medSuffixes.Length)]} {random.Next(1, 11) * 100}mg";
                extraMedicines.Add(new TblMedicine
                {
                    Name = name,
                    Description = $"Generated medicine {name}",
                    UnitPrice = random.Next(5, 50) * 100, // 500 to 5000 MMK
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    DeleteFlag = false
                });
            }
            await _context.TblMedicines.AddRangeAsync(extraMedicines);
            await _context.SaveChangesAsync();

            // Fetch base data
            var diseases = await _context.TblDiseases.ToListAsync();
            var medicines = await _context.TblMedicines.ToListAsync();

            if (!diseases.Any() || !medicines.Any())
            {
                Console.WriteLine("WARNING: No diseases or medicines found. Skipping appointments.");
                return;
            }

            // 2. Generate Appointments Day by Day
            var startDate = DateTime.UtcNow.AddDays(-daysToSimulate).Date;
            var endDate = DateTime.UtcNow.Date;
            int totalAppts = 0;

            Console.WriteLine($"Generating appointments from {startDate.ToString(YyyyMmDdFormat)} to {endDate.ToString(YyyyMmDdFormat)}...");

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                // 5 to 15 appointments a day
                int apptsToday = random.Next(5, 16);
                
                for (int i = 0; i < apptsToday; i++)
                {
                    var patient = newPatients[random.Next(newPatients.Count)];
                    var time = date.AddHours(8).AddMinutes(i * 15);
                    
                    var randomSuffix = Convert.ToHexString(Guid.NewGuid().ToByteArray())[..4];
                    var appointmentCode = $"APT-{date.ToString(YyyyMmDdCompactFormat)}-{(i + 1):D3}-{randomSuffix}";
                    
                    // Most past appointments are completed, some cancelled. Future are pending/confirmed.
                    string status = "completed";
                    if (date > DateTime.UtcNow.Date) status = random.NextDouble() > 0.5 ? "confirmed" : "pending";
                    else if (random.NextDouble() > 0.9) status = "cancelled";

                    var appointment = new TblAppointment
                    {
                        AppointmentCode = appointmentCode,
                        PatientId = patient.PatientId,
                        Datetime = time,
                        Status = status,
                        Notes = symptoms[random.Next(symptoms.Length)],
                        CreatedAt = time.AddDays(-random.Next(1, 7)),
                        UpdatedAt = time
                    };

                    _context.TblAppointments.Add(appointment);
                    totalAppts++;
                }
            }

            Console.WriteLine($"Saving {totalAppts} appointments...");
            await _context.SaveChangesAsync(); // Save all appointments

            // 3. Generate Consultations, Prescriptions and Payments for Completed Appointments
            var completedAppts = await _context.TblAppointments
                .Where(a => a.Status == "completed" && a.Datetime >= startDate)
                .ToListAsync();

            // To avoid huge memory spikes, process in batches
            int batchSize = 1000;
            for (int i = 0; i < completedAppts.Count; i += batchSize)
            {
                var batch = completedAppts.Skip(i).Take(batchSize).ToList();
                foreach (var appt in batch)
                {
                    // Prescription
                    var disease = diseases[random.Next(diseases.Count)];
                    var prescription = new TblPrescription
                    {
                        AppointmentId = appt.Id,
                        PatientId = appt.PatientId,
                        DiseaseId = disease.Id,
                        WeightKg = random.Next(40, 90) + Math.Round(random.NextDouble(), 1),
                        BloodPressureSystolic = random.Next(110, 140),
                        BloodPressureDiastolic = random.Next(70, 90),
                        Notes = "Generated consultation notes",
                        CreatedAt = appt.Datetime.AddMinutes(15),
                        UpdatedAt = appt.Datetime.AddMinutes(15),
                        DeleteFlag = false
                    };
                    
                    _context.TblPrescriptions.Add(prescription);
                    
                    // Generate Payment
                    // Exact amounts like 10000, 15000, 20000, 25000
                    decimal[] exactAmounts = { 10000m, 15000m, 20000m, 25000m, 30000m };
                    decimal amount = exactAmounts[random.Next(exactAmounts.Length)];
                    
                    var payment = new TblPayment
                    {
                        AppointmentId = appt.Id,
                        PrescriptionId = null, // Will set below if EF allows or just leave null initially
                        Amount = amount,
                        Tax = 0,
                        Charges = 0,
                        PaymentMethod = paymentMethods[random.Next(paymentMethods.Length)],
                        PaymentStatus = "paid",
                        PaidAt = appt.Datetime.AddMinutes(20),
                        UpdatedAt = appt.Datetime.AddMinutes(20)
                    };
                    
                    _context.TblPayments.Add(payment);

                    // Generate FollowUp 30% of the time
                    if (random.NextDouble() > 0.7)
                    {
                        var followUp = new TblFollowUp
                        {
                            PatientId = appt.PatientId,
                            AppointmentId = appt.Id,
                            DueAt = appt.Datetime.AddDays(random.Next(7, 30)),
                            Recommendation = "Follow-up after initial treatment",
                            Status = "pending",
                            CreatedAt = appt.Datetime,
                            UpdatedAt = appt.Datetime,
                            DeleteFlag = false
                        };
                        _context.TblFollowUps.Add(followUp);
                    }
                }
                
                await _context.SaveChangesAsync();
                
                // We could also link the prescription ID to payment, but in this schema Payment has PrescriptionId nullable
                // Let's attach prescription items for fun
                var lastSavedPrescriptions = await _context.TblPrescriptions
                    .OrderByDescending(p => p.Id)
                    .Take(batch.Count)
                    .ToListAsync();
                    
                foreach (var rx in lastSavedPrescriptions)
                {
                    // 1 to 3 items
                    int numItems = random.Next(1, 4);
                    for (int j = 0; j < numItems; j++)
                    {
                        var med = medicines[random.Next(medicines.Count)];
                        var rxItem = new TblPrescriptionItem
                        {
                            PrescriptionId = rx.Id,
                            MedicineId = med.MedicineId,
                            Dosage = "1 pill",
                            Days = random.Next(3, 10),
                            Quantity = random.Next(10, 30),
                            Instruction = "Take after meal",
                            CreatedAt = rx.CreatedAt,
                            UpdatedAt = rx.UpdatedAt,
                            DeleteFlag = false
                        };
                        _context.TblPrescriptionItems.Add(rxItem);
                    }
                }
                await _context.SaveChangesAsync();
            }

            Console.WriteLine("--------------------------------------------------");
            Console.WriteLine("1 year of synthetic clinic data has been successfully generated!");
            Console.WriteLine("--------------------------------------------------");
        }
    }
}
