
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SCMS.Database.Models;

namespace SCMS.Domain
{
    internal static class SqliteRealWorldSeeder
    {
        public static async Task SeedAsync(AppDbContext context, IConfiguration configuration)
        {
            if (configuration.GetValue("Database:SeedRealWorldData", true) == false)
            {
                return;
            }

            await ReleaseLegacyDemoMobilesAsync(context);

            var now = DateTime.UtcNow;
            var today = DateTime.Today;

            if (!await context.TblUsers.AnyAsync(u => u.UserId == 10001))
            {
                context.TblUsers.AddRange(
                    User(10001, "Dr. Thandar Hlaing", "09970001001", "dr.thandar@scms.demo", now.AddDays(-45), now),
                    User(10002, "Myo Clinic Reception", "09970001002", "reception@scms.demo", now.AddDays(-45), now),
                    User(10003, "Ko Aung Min", "09970001003", "aung.min@example.test", now.AddDays(-34), now),
                    User(10004, "Ma Hnin Ei", "09970001004", "hnin.ei@example.test", now.AddDays(-25), now),
                    User(10005, "U Zaw Lin", "09970001005", "zaw.lin@example.test", now.AddDays(-20), now),
                    User(10006, "Ko Pyae Sone", "09970001006", "pyae.sone@example.test", now.AddDays(-12), now),
                    User(10007, "SCMS Pharmacy Desk", "09970001007", "pharmacy@scms.demo", now.AddDays(-40), now));
                await context.SaveChangesAsync();
            }

            if (!await context.TblUserRoles.AnyAsync(r => r.Id == 10001))
            {
                context.TblUserRoles.AddRange(
                    Role(10001, 10001, "admin"),
                    Role(10002, 10002, "admin"),
                    Role(10003, 10003, "user"),
                    Role(10004, 10004, "user"),
                    Role(10005, 10005, "user"),
                    Role(10006, 10006, "user"),
                    Role(10007, 10007, "admin"));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPatients.AnyAsync(p => p.PatientId == 10001))
            {
                context.TblPatients.AddRange(
                    Patient(10001, 10003, "Ko Aung Min", "09970001003", "aung.min@example.test", new DateOnly(1988, 6, 12), "male", "B+", Address("No. 42, Baho Road, Sanchaung Township, Yangon", "No known drug allergies", "Mild seasonal allergic rhinitis", "Appendectomy in 2015", "Father has hypertension", "COVID-19 primary series and booster; tetanus booster 2024"), now.AddDays(-34), now),
                    Patient(10002, 10003, "Daw Mya Mya", "09970001013", "mya.mya@example.test", new DateOnly(1958, 2, 3), "female", "O+", Address("No. 42, Baho Road, Sanchaung Township, Yangon", "Penicillin rash reported in 1998", "Type 2 diabetes mellitus; hypertension", "Cataract surgery, left eye, 2021", "Mother had stroke at age 70", "Influenza vaccine 2025; pneumococcal vaccine 2023"), now.AddDays(-33), now),
                    Patient(10003, 10003, "Ma Thiri Aung", "09970001023", "thiri.aung@example.test", new DateOnly(2018, 9, 21), "female", "A+", Address("No. 42, Baho Road, Sanchaung Township, Yangon", "Egg allergy, mild", "None", "None", "Grandmother has diabetes", "Routine childhood immunizations up to date"), now.AddDays(-30), now),
                    Patient(10004, 10004, "Ma Hnin Ei", "09970001004", "hnin.ei@example.test", new DateOnly(1995, 12, 8), "female", "AB+", Address("Kan Street, Hlaing Township, Yangon", "Dust mite sensitivity", "Intermittent asthma", "None", "Younger brother has asthma", "COVID-19 booster 2025"), now.AddDays(-25), now),
                    Patient(10005, 10005, "U Zaw Lin", "09970001005", "zaw.lin@example.test", new DateOnly(1972, 4, 18), "male", "O-", Address("Pearl Condo, Bahan Township, Yangon", "No known drug allergies", "Prediabetes; dyslipidemia", "None", "Both parents had type 2 diabetes", "Hepatitis B completed; influenza vaccine 2025"), now.AddDays(-20), now),
                    Patient(10006, 10006, "Ko Pyae Sone", "09970001006", "pyae.sone@example.test", new DateOnly(2001, 11, 2), "male", "B+", Address("Student hostel, Kamayut Township, Yangon", "No known drug allergies", "None", "None", "No significant family history", "COVID-19 primary series; hepatitis B dose 1"), now.AddDays(-12), now));
                await context.SaveChangesAsync();
            }

            if (!await context.TblDiseases.AnyAsync(d => d.Id == 10001))
            {
                context.TblDiseases.AddRange(
                    Disease(10001, "Acute Upper Respiratory Infection", "Fever, sore throat, cough, and congestion without danger signs.", now.AddDays(-40), now),
                    Disease(10002, "Type 2 Diabetes Mellitus", "Ongoing glucose management and medication adherence review.", now.AddDays(-40), now),
                    Disease(10003, "Essential Hypertension", "Blood pressure monitoring and long-term cardiovascular risk control.", now.AddDays(-40), now),
                    Disease(10004, "Allergic Rhinitis", "Sneezing, rhinorrhea, and nasal congestion triggered by allergens.", now.AddDays(-40), now),
                    Disease(10005, "Acute Gastroenteritis", "Vomiting or diarrhea requiring hydration assessment.", now.AddDays(-40), now),
                    Disease(10006, "Mild Asthma Exacerbation", "Wheeze and cough requiring inhaler technique review.", now.AddDays(-40), now),
                    Disease(10007, "Dengue Fever - Suspected", "Fever with body ache requiring warning sign monitoring and lab follow-up.", now.AddDays(-40), now));
                await context.SaveChangesAsync();
            }

            if (!await context.TblMedicineCategories.AnyAsync(c => c.Id == 10001))
            {
                context.TblMedicineCategories.AddRange(
                    Category(10001, "Analgesics and Antipyretics"),
                    Category(10002, "Antibiotics"),
                    Category(10003, "Antihistamines"),
                    Category(10004, "Gastrointestinal"),
                    Category(10005, "Respiratory"),
                    Category(10006, "Chronic Disease"),
                    Category(10007, "Supplements and ORS"));
                await context.SaveChangesAsync();
            }

            if (!await context.TblMedicines.AnyAsync(m => m.MedicineId == 10001))
            {
                context.TblMedicines.AddRange(
                    Medicine(10001, 10001, "Paracetamol 500 mg tablet", "First-line fever and mild pain relief.", 150m, now.AddDays(-39), now),
                    Medicine(10002, 10002, "Amoxicillin 500 mg capsule", "Beta-lactam antibiotic for selected bacterial infections.", 350m, now.AddDays(-39), now),
                    Medicine(10003, 10003, "Cetirizine 10 mg tablet", "Non-sedating antihistamine for allergic rhinitis and urticaria.", 120m, now.AddDays(-39), now),
                    Medicine(10004, 10007, "Oral Rehydration Salts sachet", "WHO-style oral rehydration support for diarrhea and vomiting.", 500m, now.AddDays(-39), now),
                    Medicine(10005, 10005, "Salbutamol 100 mcg inhaler", "Short-acting bronchodilator for wheeze and asthma rescue use.", 6500m, now.AddDays(-39), now),
                    Medicine(10006, 10006, "Metformin 500 mg tablet", "First-line oral therapy for type 2 diabetes mellitus.", 200m, now.AddDays(-39), now),
                    Medicine(10007, 10006, "Amlodipine 5 mg tablet", "Calcium-channel blocker for hypertension management.", 250m, now.AddDays(-39), now),
                    Medicine(10008, 10004, "Omeprazole 20 mg capsule", "Proton-pump inhibitor for gastritis and reflux symptoms.", 300m, now.AddDays(-39), now),
                    Medicine(10009, 10007, "Vitamin B Complex tablet", "Supplement for nutritional support and neuropathy risk.", 180m, now.AddDays(-39), now),
                    Medicine(10010, 10002, "Cefixime 200 mg tablet", "Cephalosporin antibiotic reserved for selected indications.", 750m, now.AddDays(-39), now));
                await context.SaveChangesAsync();
            }

            if (!await context.TblMedicineBatches.AnyAsync(b => b.Id == 10001))
            {
                context.TblMedicineBatches.AddRange(
                    Batch(10001, 10001, "PCM-YGN-2605-A", 12, today.AddDays(18), today.AddDays(-42), "Yangon Pharma Distribution", "active", now.AddDays(-42), now),
                    Batch(10002, 10001, "PCM-YGN-2608-B", 120, today.AddDays(180), today.AddDays(-10), "Yangon Pharma Distribution", "active", now.AddDays(-10), now),
                    Batch(10003, 10002, "AMX-MDY-2605-A", 8, today.AddDays(22), today.AddDays(-36), "Mandalay Health Supply", "active", now.AddDays(-36), now),
                    Batch(10004, 10002, "AMX-MDY-2609-B", 30, today.AddDays(130), today.AddDays(-8), "Mandalay Health Supply", "active", now.AddDays(-8), now),
                    Batch(10005, 10003, "CTZ-YGN-2605-A", 15, today.AddDays(15), today.AddDays(-50), "Shwe Medical Wholesale", "active", now.AddDays(-50), now),
                    Batch(10006, 10004, "ORS-BGO-2607-A", 150, today.AddDays(365), today.AddDays(-21), "Bago Essential Medicines", "active", now.AddDays(-21), now),
                    Batch(10007, 10005, "SAL-YGN-2607-A", 6, today.AddDays(45), today.AddDays(-18), "Yangon Respiratory Care", "active", now.AddDays(-18), now),
                    Batch(10008, 10006, "MTF-YGN-2609-A", 200, today.AddDays(400), today.AddDays(-15), "Myanmar Diabetes Care", "active", now.AddDays(-15), now),
                    Batch(10009, 10007, "AML-MDY-2605-A", 18, today.AddDays(25), today.AddDays(-60), "Mandalay Health Supply", "active", now.AddDays(-60), now),
                    Batch(10010, 10008, "OMP-YGN-2605-A", 5, today.AddDays(10), today.AddDays(-55), "Shwe Medical Wholesale", "active", now.AddDays(-55), now),
                    Batch(10011, 10010, "CFX-YGN-2603-A", 40, today.AddDays(-7), today.AddDays(-120), "Yangon Pharma Distribution", "active", now.AddDays(-120), now),
                    Batch(10012, 10003, "CTZ-OLD-2501-Z", 3, today.AddDays(-45), today.AddDays(-300), "Legacy Stock Room", "expired", now.AddDays(-300), now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblAppointments.AnyAsync(a => a.Id == 10001))
            {
                context.TblAppointments.AddRange(
                    Appointment(10001, "APT-DEMO-URI-001", 10001, today.AddDays(-1).AddHours(10), "completed", "Fever, sore throat, and dry cough for two days.", now.AddDays(-2), now.AddDays(-1)),
                    Appointment(10002, "APT-DEMO-HTN-002", 10002, today.AddDays(-14).AddHours(9.5), "completed", "Monthly hypertension and diabetes follow-up.", now.AddDays(-15), now.AddDays(-14)),
                    Appointment(10003, "APT-DEMO-AST-003", 10004, today.AddHours(9), "confirmed", "Wheezing after dust exposure; inhaler almost empty.", now.AddDays(-2), now.AddHours(-1)),
                    Appointment(10004, "APT-DEMO-CHD-004", 10003, today.AddHours(9).AddMinutes(20), "pending", "Runny nose and mild fever since last night.", now.AddHours(-18), now.AddHours(-18)),
                    Appointment(10005, "APT-DEMO-DM-005", 10005, today.AddHours(9).AddMinutes(40), "pending", "Blood sugar follow-up and foot numbness discussion.", now.AddHours(-10), now.AddHours(-10)),
                    Appointment(10006, "APT-DEMO-CAN-006", 10006, today.AddHours(11).AddMinutes(30), "cancelled", "Travel clearance visit cancelled by patient.", now.AddDays(-1), now.AddHours(-6)),
                    Appointment(10007, "APT-DEMO-FUP-007", 10002, today.AddDays(1).AddHours(10), "confirmed", "Follow-up after medication adjustment.", now.AddDays(-5), now.AddDays(-1)),
                    Appointment(10008, "APT-DEMO-LAB-008", 10001, today.AddDays(1).AddHours(11), "pending", "Review dengue NS1 and CBC lab results.", now.AddHours(-3), now.AddHours(-3)),
                    Appointment(10009, "APT-DEMO-DM-009", 10002, today.AddDays(-45).AddHours(8).AddMinutes(45), "completed", "Initial diabetes medication review after fasting glucose elevation.", now.AddDays(-46), now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPrescriptions.AnyAsync(p => p.Id == 10001))
            {
                context.TblPrescriptions.AddRange(
                    Prescription(10001, 10001, 10001, 10001, 68.5, 118, 78, Notes("Likely viral upper respiratory infection. Advised fluids, rest, and return if fever persists beyond three days.", 38.2, 92, 98, 170.0, 23.7, "CBC only if fever continues for 48 hours"), now.AddDays(-1)),
                    Prescription(10002, 10002, 10002, 10003, 57.0, 148, 92, Notes("Blood pressure above target. Reviewed salt intake, home BP log, and medication adherence.", 36.7, 78, 99, 154.0, 24.0, "Fasting blood glucose, HbA1c, urine albumin-creatinine ratio"), now.AddDays(-14)),
                    Prescription(10003, 10009, 10002, 10002, 58.0, 142, 88, Notes("Started structured diabetes follow-up. Discussed diet, walking plan, and warning signs of hypoglycemia.", 36.8, 82, 98, 154.0, 24.5, "HbA1c in three months; lipid profile"), now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPrescriptionItems.AnyAsync(i => i.Id == 10001))
            {
                context.TblPrescriptionItems.AddRange(
                    RxItem(10001, 10001, 10001, 10001, "500 mg", 3, 9, "Take one tablet every 8 hours only while fever or body ache is present.", now.AddDays(-1)),
                    RxItem(10002, 10001, 10003, 10005, "10 mg", 3, 3, "Take one tablet at night for sneezing and runny nose.", now.AddDays(-1)),
                    RxItem(10003, 10001, 10004, 10006, "1 sachet", 2, 2, "Dissolve one sachet in clean water if appetite is poor or sweating is heavy.", now.AddDays(-1)),
                    RxItem(10004, 10002, 10007, 10009, "5 mg", 30, 30, "Take one tablet every morning and keep a home blood pressure log.", now.AddDays(-14)),
                    RxItem(10005, 10002, 10006, 10008, "500 mg", 30, 60, "Take one tablet twice daily with meals.", now.AddDays(-14)),
                    RxItem(10006, 10003, 10006, 10008, "500 mg", 30, 60, "Take one tablet twice daily with meals.", now.AddDays(-45)),
                    RxItem(10007, 10003, 10009, null, "1 tablet", 30, 30, "Take one tablet daily after breakfast.", now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPrescriptionItemSchedules.AnyAsync(s => s.Id == 10001))
            {
                context.TblPrescriptionItemSchedules.AddRange(
                    Schedule(10001, 10001, today.AddDays(-1), today.AddDays(1), "custom", 1m, "tablet", "after_meal", "oral", 8, null, true, "Stop once fever has settled for 24 hours.", now.AddDays(-1)),
                    Schedule(10002, 10002, today.AddDays(-1), today.AddDays(1), "night", 1m, "tablet", "after_meal", "oral", null, 1, false, "May cause drowsiness.", now.AddDays(-1)),
                    Schedule(10003, 10003, today.AddDays(-1), today.AddDays(1), "custom", 1m, "sachet", "anytime", "oral", null, null, true, "Use after loose stool, heavy sweating, or poor fluid intake.", now.AddDays(-1)),
                    Schedule(10004, 10004, today.AddDays(-14), today.AddDays(15), "morning", 1m, "tablet", "after_meal", "oral", null, 1, false, "Check blood pressure twice weekly.", now.AddDays(-14)),
                    Schedule(10005, 10005, today.AddDays(-14), today.AddDays(15), "morning", 1m, "tablet", "with_meal", "oral", null, 1, false, "First daily dose.", now.AddDays(-14)),
                    Schedule(10006, 10005, today.AddDays(-14), today.AddDays(15), "evening", 1m, "tablet", "with_meal", "oral", null, 1, false, "Second daily dose.", now.AddDays(-14)),
                    Schedule(10007, 10006, today.AddDays(-45), today.AddDays(-16), "morning", 1m, "tablet", "with_meal", "oral", null, 1, false, "First daily dose.", now.AddDays(-45)),
                    Schedule(10008, 10006, today.AddDays(-45), today.AddDays(-16), "evening", 1m, "tablet", "with_meal", "oral", null, 1, false, "Second daily dose.", now.AddDays(-45)),
                    Schedule(10009, 10007, today.AddDays(-45), today.AddDays(-16), "morning", 1m, "tablet", "after_meal", "oral", null, 1, false, "Nutritional support during diet adjustment.", now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPayments.AnyAsync(p => p.Id == 10001))
            {
                context.TblPayments.AddRange(
                    Payment(10001, 10001, 10001, 17500m, 875m, 500m, "kbzpay", "paid", null, now.AddDays(-1), now.AddDays(-1)),
                    Payment(10002, 10002, 10002, 22500m, 1125m, 0m, "cash", "paid", null, now.AddDays(-14), now.AddDays(-14)),
                    Payment(10003, 10003, null, 10000m, 500m, 0m, "wavepay", "pending", "/uploads/payment-proofs/apt-demo-ast-003.png", null, now.AddMinutes(-30)),
                    Payment(10004, 10009, 10003, 18500m, 925m, 0m, "card", "paid", null, now.AddDays(-45), now.AddDays(-45)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPermissions.AnyAsync(p => p.Id == 10001))
            {
                context.TblPermissions.AddRange(
                    Permission(10001, "Dashboard", "ViewDoctorDashboard"),
                    Permission(10002, "Appointments", "ViewQueue"),
                    Permission(10003, "Appointments", "UpdateStatus"),
                    Permission(10004, "Patients", "ViewMedicalSummary"),
                    Permission(10005, "Prescriptions", "Create"),
                    Permission(10006, "Medicines", "ViewInventoryAlerts"),
                    Permission(10007, "Payments", "VerifyManualProof"));
                await context.SaveChangesAsync();
            }

            if (!await context.TblRolePermissions.AnyAsync(p => p.Id == 10001))
            {
                context.TblRolePermissions.AddRange(
                    RolePermission(10001, 10001, 10001),
                    RolePermission(10002, 10001, 10002),
                    RolePermission(10003, 10001, 10003),
                    RolePermission(10004, 10001, 10004),
                    RolePermission(10005, 10001, 10005),
                    RolePermission(10006, 10001, 10006),
                    RolePermission(10007, 10001, 10007),
                    RolePermission(10008, 10002, 10001),
                    RolePermission(10009, 10002, 10002),
                    RolePermission(10010, 10002, 10007),
                    RolePermission(10011, 10007, 10006));
                await context.SaveChangesAsync();
            }


            if (!await context.TblFollowUps.AnyAsync(f => f.Id == 10001))
            {
                context.TblFollowUps.AddRange(
                    FollowUp(10001, 10002, 10007, 10002, today.AddDays(1).AddHours(10), "Review blood pressure log, fasting glucose, and medication tolerance.", "pending", null, now.AddDays(-5), now.AddDays(-1)),
                    FollowUp(10002, 10001, 10008, 10001, today.AddDays(1).AddHours(11), "Review dengue warning signs and CBC if fever persisted.", "pending", null, now.AddHours(-3), now.AddHours(-3)),
                    FollowUp(10003, 10002, 10009, 10003, today.AddDays(-16).AddHours(9), "Initial diabetes follow-up completed after medication start.", "completed", now.AddDays(-16), now.AddDays(-45), now.AddDays(-16)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPrescriptionTemplates.AnyAsync(t => t.Id == 10001))
            {
                context.TblPrescriptionTemplates.AddRange(
                    Template(10001, "URI fever and rhinitis", 10001, now.AddDays(-5)),
                    Template(10002, "Hypertension monthly review", 10003, now.AddDays(-5)),
                    Template(10003, "Asthma rescue refill", 10006, now.AddDays(-5)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblPrescriptionTemplateItems.AnyAsync(i => i.Id == 10001))
            {
                context.TblPrescriptionTemplateItems.AddRange(
                    TemplateItem(10001, 10001, 10001, "500 mg", 3, 9, "Take after meal only while fever or pain is present.", now.AddDays(-5)),
                    TemplateItem(10002, 10001, 10003, "10 mg", 3, 3, "Take at night for runny nose.", now.AddDays(-5)),
                    TemplateItem(10003, 10002, 10007, "5 mg", 30, 30, "Take every morning and monitor home BP.", now.AddDays(-5)),
                    TemplateItem(10004, 10003, 10005, "100 mcg", 30, 1, "Use as rescue inhaler and review technique.", now.AddDays(-5)));
                await context.SaveChangesAsync();
            }

            if (!await context.TblNotifications.AnyAsync(n => n.Id == 10001))
            {
                context.TblNotifications.AddRange(
                    Notification(10001, 10003, "Appointment Confirmed", "Daw Mya Mya has a confirmed follow-up appointment tomorrow at 10:00.", "/appointments/10007", now.AddDays(-1)),
                    Notification(10002, 10004, "It's Your Turn", "Doctor is ready to see you. Please proceed to the consultation room.", "/appointments/10003", now.AddMinutes(-5)),
                    Notification(10003, 10005, "Appointment Pending Approval", "Your blood sugar follow-up appointment is pending clinic confirmation.", "/appointments/10005", now.AddHours(-10)),
                    Notification(10004, 10001, "Low Stock Alert", "Salbutamol 100 mcg inhaler has 6 units remaining. Please reorder before today's asthma appointments.", "/medicines/alerts", now.AddHours(-2)),
                    Notification(10005, 10007, "Batch Nearing Expiry", "Omeprazole 20 mg capsule batch OMP-YGN-2605-A expires in 10 days.", "/medicines/alerts", now.AddHours(-3)),
                    Notification(10006, 10002, "Manual Payment Proof Uploaded", "WavePay proof for appointment APT-DEMO-AST-003 is waiting for verification.", "/payments/10003", now.AddMinutes(-30)));
                await context.SaveChangesAsync();
            }

            await RefreshMovingDemoDatesAsync(context, today, now);
        }

        private static async Task RefreshMovingDemoDatesAsync(AppDbContext context, DateTime today, DateTime now)
        {
            var demoAppointments = await context.TblAppointments
                .Where(a => a.Id >= 10001 && a.Id <= 10009)
                .ToDictionaryAsync(a => a.Id);

            SetAppointment(demoAppointments, 10001, today.AddDays(-1).AddHours(10), "completed");
            SetAppointment(demoAppointments, 10002, today.AddDays(-14).AddHours(9.5), "completed");
            SetAppointment(demoAppointments, 10003, now.AddMinutes(20), "confirmed");
            SetAppointment(demoAppointments, 10004, now.AddMinutes(40), "pending");
            SetAppointment(demoAppointments, 10005, now.AddMinutes(60), "pending");
            SetAppointment(demoAppointments, 10006, today.AddHours(11).AddMinutes(30), "cancelled");
            SetAppointment(demoAppointments, 10007, today.AddDays(1).AddHours(10), "confirmed");
            SetAppointment(demoAppointments, 10008, today.AddDays(1).AddHours(11), "pending");
            SetAppointment(demoAppointments, 10009, today.AddDays(-45).AddHours(8).AddMinutes(45), "completed");

            var followUps = await context.TblFollowUps
                .Where(f => f.Id >= 10001 && f.Id <= 10003)
                .ToDictionaryAsync(f => f.Id);
            if (followUps.TryGetValue(10001, out var bpReview))
            {
                bpReview.DueAt = today.AddDays(1).AddHours(10);
                bpReview.UpdatedAt = now;
            }
            if (followUps.TryGetValue(10002, out var dengueReview))
            {
                dengueReview.DueAt = today.AddDays(1).AddHours(11);
                dengueReview.UpdatedAt = now;
            }


            await context.SaveChangesAsync();
        }

        private static void SetAppointment(IDictionary<int, TblAppointment> appointments, int id, DateTime dateTime, string status)
        {
            if (!appointments.TryGetValue(id, out var appointment))
            {
                return;
            }

            appointment.Datetime = dateTime;
            appointment.Status = status;
            appointment.UpdatedAt = DateTime.UtcNow;
        }

        private static async Task ReleaseLegacyDemoMobilesAsync(AppDbContext context)
        {
            var admin = await context.TblUsers.FirstOrDefaultAsync(u => u.Email == "admin@scms.demo" && u.MobileNo == "09970001001");
            if (admin != null)
            {
                admin.MobileNo = "09979990001";
                admin.UpdatedAt = DateTime.UtcNow;
            }

            var user = await context.TblUsers.FirstOrDefaultAsync(u => u.Email == "user@scms.demo" && u.MobileNo == "09970001003");
            if (user != null)
            {
                user.MobileNo = "09979990003";
                user.UpdatedAt = DateTime.UtcNow;
            }

            if (admin != null || user != null)
            {
                await context.SaveChangesAsync();
            }
        }

        private static TblUser User(int id, string name, string mobile, string email, DateTime createdAt, DateTime updatedAt)
            => new() { UserId = id, Name = name, MobileNo = mobile, Email = email, PasswordHash = "demo-password-hash", CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false };

        private static TblUserRole Role(int id, int userId, string role)
            => new() { Id = id, UserId = userId, Role = role };

        private static TblPatient Patient(int id, int userId, string name, string mobile, string email, DateOnly dob, string gender, string bloodType, string address, DateTime createdAt, DateTime updatedAt)
            => new() { PatientId = id, UserId = userId, Name = name, MobileNo = mobile, Email = email, DateOfBirth = dob, Gender = gender, BloodType = bloodType, Address = address, CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false };

        private static TblDisease Disease(int id, string name, string description, DateTime createdAt, DateTime updatedAt)
            => new() { Id = id, Name = name, Description = description, CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false };

        private static TblMedicineCategory Category(int id, string name)
            => new() { Id = id, Name = name };

        private static TblMedicine Medicine(int id, int categoryId, string name, string description, decimal price, DateTime createdAt, DateTime updatedAt, string? imageUrl = null, string? imageId = null)
            => new() { MedicineId = id, CategoryId = categoryId, Name = name, Description = description, UnitPrice = price, CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false, ImageUrl = imageUrl };

        private static TblMedicineBatch Batch(int id, int medId, string batchNo, int quantity, DateTime expiry, DateTime received, string supplier, string status, DateTime createdAt, DateTime updatedAt)
            => new() { Id = id, MedId = medId, BatchNo = batchNo, Quantity = quantity, ExpiryDate = DateOnly.FromDateTime(expiry), ReceivedDate = DateOnly.FromDateTime(received), SupplierName = supplier, Status = status, CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false };

        private static TblAppointment Appointment(int id, string code, int patientId, DateTime dateTime, string status, string notes, DateTime createdAt, DateTime updatedAt)
            => new() { Id = id, AppointmentCode = code, PatientId = patientId, Datetime = dateTime, Status = status, Notes = notes, CreatedAt = createdAt, UpdatedAt = updatedAt };

        private static TblPrescription Prescription(int id, int appointmentId, int patientId, int diseaseId, double weight, int sys, int dia, string notes, DateTime at)
            => new() { Id = id, AppointmentId = appointmentId, PatientId = patientId, DiseaseId = diseaseId, WeightKg = weight, BloodPressureSystolic = sys, BloodPressureDiastolic = dia, Notes = notes, CreatedAt = at, UpdatedAt = at, DeleteFlag = false };

        private static TblPrescriptionItem RxItem(int id, int rxId, int medId, int? batchId, string dosage, int days, int qty, string instruction, DateTime at)
            => new() { Id = id, PrescriptionId = rxId, MedicineId = medId, MedicineBatchId = batchId, Dosage = dosage, Days = days, Quantity = qty, Instruction = instruction, CreatedAt = at, UpdatedAt = at, DeleteFlag = false };

        private static TblPrescriptionItemSchedule Schedule(int id, int itemId, DateTime start, DateTime end, string doseTime, decimal doseQuantity, string doseUnit, string mealTiming, string route, int? intervalHours, int? intervalDays, bool isAsNeeded, string note, DateTime at, string? dayOfWeek = null, string? bodySite = null)
            => new() { Id = id, PrescriptionItemId = itemId, StartDate = DateOnly.FromDateTime(start), EndDate = DateOnly.FromDateTime(end), DoseTime = doseTime, DoseQuantity = doseQuantity, DoseUnit = doseUnit, MealTiming = mealTiming, Route = route, IntervalHours = intervalHours, IntervalDays = intervalDays, IsAsNeeded = isAsNeeded, Note = note, CreatedAt = at, UpdatedAt = at, DeleteFlag = false, DayOfWeek = dayOfWeek, BodySite = bodySite };

        private static TblPayment Payment(int id, int appointmentId, int? prescriptionId, decimal amount, decimal tax, decimal charges, string method, string status, string? screenshot, DateTime? paidAt, DateTime updatedAt)
            => new() { Id = id, AppointmentId = appointmentId, PrescriptionId = prescriptionId, Amount = amount, Tax = tax, Charges = charges, PaymentMethod = method, PaymentStatus = status, PaymentScreenshot = screenshot, PaidAt = paidAt, UpdatedAt = updatedAt };

        private static TblPermission Permission(int id, string menu, string action)
            => new() { Id = id, Menu = menu, Action = action };

        private static TblRolePermission RolePermission(int id, int roleId, int permissionId)
            => new() { Id = id, RoleId = roleId, PermissionId = permissionId };


        private static TblFollowUp FollowUp(int id, int patientId, int? appointmentId, int? prescriptionId, DateTime dueAt, string recommendation, string status, DateTime? completedAt, DateTime createdAt, DateTime updatedAt)
            => new() { Id = id, PatientId = patientId, AppointmentId = appointmentId, PrescriptionId = prescriptionId, DueAt = dueAt, Recommendation = recommendation, Status = status, CompletedAt = completedAt, CreatedAt = createdAt, UpdatedAt = updatedAt, DeleteFlag = false };

        private static TblPrescriptionTemplate Template(int id, string name, int diseaseId, DateTime at)
            => new() { Id = id, Name = name, DiseaseId = diseaseId, CreatedAt = at, UpdatedAt = at, DeleteFlag = false };

        private static TblPrescriptionTemplateItem TemplateItem(int id, int templateId, int medicineId, string dosage, int days, int quantity, string instruction, DateTime at)
            => new() { Id = id, TemplateId = templateId, MedicineId = medicineId, Dosage = dosage, Days = days, Quantity = quantity, Instruction = instruction, CreatedAt = at, DeleteFlag = false };

        private static TblNotification Notification(int id, int? userId, string title, string description, string route, DateTime at)
            => new() { Id = id, UserId = userId, Title = title, Description = description, ActionRoute = route, CreatedAt = at, UpdatedAt = at, DeleteFlag = false };

        private static string Address(string actual, string allergies, string chronic, string surgeries, string family, string vaccines)
            => $$"""
            {
              "ActualAddress": "{{actual}}",
              "Allergies": "{{allergies}}",
              "ChronicConditions": "{{chronic}}",
              "PastSurgeries": "{{surgeries}}",
              "FamilyHistory": "{{family}}",
              "VaccinationHistory": "{{vaccines}}"
            }
            """;

        private static string Notes(string actual, double temp, int pulse, int spo2, double height, double bmi, string labs)
            => $$"""
            {
              "ActualNotes": "{{actual}}",
              "TemperatureC": {{temp}},
              "PulseBpm": {{pulse}},
              "Spo2Percent": {{spo2}},
              "HeightCm": {{height}},
              "Bmi": {{bmi}},
              "LabTestRequests": "{{labs}}"
            }
            """;
    }
}
