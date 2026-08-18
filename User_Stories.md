# SCMS User Stories & Requirements Specification (MVP)

A streamlined specification of user stories, acceptance criteria, and system workflows for the **Smart Clinic Management System (SCMS)** MVP.

---

## 👥 Role Architecture (MVP)

| Role | Target Persona | Core Responsibilities |
| :--- | :--- | :--- |
| **Owner / Admin** | Clinic Owner, Clinic Manager, Head Administrator | Overall clinic oversight, financial & operational reports, medicine inventory & batch management, manual payment approvals, system alerts. |
| **Doctor** | General Practitioner, Specialist Doctor | Managing consultation queues, conducting EMR consultations, recording vitals & diagnoses, issuing prescriptions with FIFO deduction, prescription templates. |
| **Patient** | Patients, Guardians / Family Members | Managing personal & family profiles, booking appointment slots, tracking live queue positions & wait times, downloading prescriptions & invoices. |

---

# 👑 1. Owner / Administrator Stories

## 1. Clinic Overview & Admin Dashboard
**User Story**
> As a clinic owner/admin, I want a high-level operational dashboard so that I can monitor daily clinic performance, patient volume, and urgent stock warnings in one place.

**Acceptance Criteria**
- Display today's appointment counts by status (**Pending**, **Confirmed**, **Completed**, **Cancelled**).
- Summary of today's collected revenue and uncollected billing amounts.
- Immediate visual alerts for **Low Stock Medicines** (< 20 units) and **Batches Expiring Soon** (within 30 days).

## 2. Medicine Inventory & Batch CRUD Control
**User Story**
> As an administrator, I want full CRUD management over medicines and stock batches so that clinic stock records remain accurate and auditable.

**Acceptance Criteria**
- Create, update, search, and categorize medicines with unit pricing and packaging.
- Add stock replenishment batches with batch numbers, quantities, unit purchase costs, and expiration dates.
- Update batch details with date validations (e.g., expiry date must be in the future).
- Prevent deletion of batches that have active quantities allocated in historical prescriptions.

## 3. Manual Payment Verification & Approval
**User Story**
> As an administrator, I want to review and approve manual payment proofs uploaded by patients so that payments made via bank transfer or mobile pay are validated before issuing receipts.

**Acceptance Criteria**
- View a dedicated list of payments marked as **Pending Verification**.
- Review payment proof details (transaction reference ID / receipt image).
- Approve or reject payment records, automatically marking invoices as **Paid** upon approval.

## 4. Comprehensive Clinic Analytics & Operational Reports
**User Story**
> As a clinic owner, I want to generate exportable operational and revenue reports so that I can audit clinic performance and financial health.

**Acceptance Criteria**
- **Appointments Report**: Filter by daily, weekly, or monthly periods (JSON & PDF).
- **Revenue Analytics Report**: Breakdown of consultation fees, medicine sales, and collection methods (JSON & PDF).
- **Medicine Stock Valuation Report**: Active stock valuation, low stock items, and near-expiry risk audit (JSON & PDF).
- **Patient Registry Report**: Demographic breakdowns and patient visit volume (JSON & PDF).
- **Monthly Business Summary**: Consolidated monthly executive report with key clinic metrics (JSON & PDF).

---

# 👨‍⚕️ 2. Doctor Stories

## 5. View & Manage Appointment Schedule
**User Story**
> As a doctor, I want to view and manage my appointment schedule so that I can conduct consultations efficiently without scheduling conflicts.

**Acceptance Criteria**
- View appointments with date range filters (`startDate`, `endDate`) and status filters.
- Accept, decline, or reschedule appointments to new time slots.
- Mark appointments as **Completed** once the consultation concludes.

## 6. Electronic Medical Record (EMR) & Patient History
**User Story**
> As a doctor, I want to review a patient's historical medical timeline and record consultation vitals so that I can deliver informed clinical care.

**Acceptance Criteria**
- View a chronological timeline of past visits, past diagnoses, and previous prescriptions.
- Record consultation vital signs (Blood Pressure systolic/diastolic, Weight, Height, Temperature, Pulse, SpO2, and calculated BMI).
- Add/update patient medical notes: allergies, chronic conditions, past surgeries, and family medical history.

## 7. Smart Prescription with Automatic FIFO Batch Deduction
**User Story**
> As a doctor, I want to prescribe medicines directly from the clinic inventory so that stock levels are adjusted automatically and expired batches are never dispensed.

**Acceptance Criteria**
- Search available medicines with live stock indicators and batch expiry dates during consultation.
- Automatic First-In, First-Out (FIFO) deduction: stock is automatically deducted from the oldest valid batch.
- Automatic generation of an itemized invoice reflecting prescribed medicine quantities and prices.
- Visual warning if attempting to prescribe a low-stock or near-expiry medicine.

## 8. Custom Prescription Templates Management
**User Story**
> As a doctor, I want to create and manage reusable prescription templates for common diseases so that I can quickly apply standard medication sets during consultations.

**Acceptance Criteria**
- Create and save prescription templates containing medicines, dosages, durations, and instructions linked to specific diseases.
- Retrieve templates filtered by disease name or ID.
- Load templates directly into the active consultation screen to pre-fill prescription items in one click.

## 9. Disease & Diagnosis Catalog
**User Story**
> As a doctor, I want to manage the disease and diagnosis catalog so that clinical diagnoses are standardized across records.

**Acceptance Criteria**
- Search and browse disease records with descriptions.
- Add new disease entries or update existing records.
- Soft-delete (deactivate) obsolete disease entries, preventing accidental deletion of diseases linked to past prescriptions.

## 10. Patient Follow-up Scheduling
**User Story**
> As a doctor, I want to schedule patient follow-up checkups so that patients with ongoing conditions receive timely continuous care.

**Acceptance Criteria**
- Schedule follow-up consultations with recommended due dates and instructions.
- View upcoming and overdue follow-up checkups.
- Mark follow-up checkups as **Completed** when the patient returns.

---

# 🏥 3. Patient Stories

## 11. Multiple Patient Profiles (Family Management)
**User Story**
> As a registered user, I want to manage health profiles for myself and my family members under a single account so that I can manage our family's healthcare in one place.

**Acceptance Criteria**
- Create multiple patient profiles (self, children, spouse, elderly parents) under one login account.
- View and switch between patient profiles via card/list view.
- Maintain separate medical information (allergies, blood type, vitals) for each profile.

## 12. Book an Appointment & Select Slot
**User Story**
> As a patient or guardian, I want to book an appointment online so that I can secure a consultation slot with the doctor.

**Acceptance Criteria**
- Select patient profile, appointment date, time, and specify the reason for visit.
- Immediate slot validation to prevent double-booking.
- View booking status (**Pending** → **Confirmed**).

## 13. Live Appointment Queue Tracking
**User Story**
> As a patient, I want to see my live queue token position and estimated wait time so that I can plan my clinic arrival and avoid waiting in crowded rooms.

**Acceptance Criteria**
- Display current token number, assigned token, and position in queue (e.g., "You are 3rd in queue").
- Real-time SignalR live queue updates when the doctor advances the queue.
- In-app notification and chime/alert when the patient's token is called.

## 14. Patient Dashboard & Document Access (PDF)
**User Story**
> As a patient, I want a personal dashboard to view my health summary and download medical documents as PDFs.

**Acceptance Criteria**
- View upcoming appointments and active medication courses.
- Download official electronic prescriptions as PDF.
- View and download comprehensive Medical Summary in HTML and PDF.
- Download itemized payment invoices and receipts as PDF.

## 15. Payment Options (Online & Bank Transfer Proof)
**User Story**
> As a patient, I want flexible payment options so that I can pay consultation and medicine fees conveniently.

**Acceptance Criteria**
- Automatic invoice clearance via payment gateway webhook callbacks.
- Upload manual payment slip / bank transfer reference for review by clinic staff.

---

# 🤖 4. AI & Model Context Protocol (MCP) Stories

## 16. AI Clinic Assistant (Doctor & Admin Workflows)
**User Story**
> As a doctor or clinic administrator, I want an AI assistant powered by Model Context Protocol (MCP) tools so that I can query clinic records and execute operational actions using natural language in English or Myanmar.

**Acceptance Criteria**
- Accessible via a dedicated chat drawer on the management dashboard for authorized staff (`owner`, `admin`, `doctor`).
- **Doctor Daily Briefing**: Natural language summary of today's schedule, waiting queue, and upcoming consultations.
- **Next Patient Brief (KYP)**: Executive clinical & behavioral summary of the next waiting patient before consultation begins.
- **Operational Shortcuts**:
  - Reschedule today's appointments by shifting start time (e.g., "Shift today's appointments to start at 9:30 AM").
  - Bulk update appointment statuses (e.g., "Confirm all pending appointments for today").
  - Search medicine stock levels and check expiring batches.
- **Safety Boundaries**:
  - Strict system prompt preventing independent medical diagnosis or prescription alterations.
  - Low-token structured responses with consistent date formatting (`dd-mm-yyyy`).

---

# ⚙️ 5. Automated System Workflows

## 17. Automated Expiry Quarantining & Stock Threshold Alerts
**User Story**
> As a system, I want to continuously monitor medication batches and stock levels in the background so that staff are alerted before stock runs out and expired batches are never used.

**Acceptance Criteria**
- Background hosted service periodically checks batch expiry dates and flags expired batches as **Quarantined**.
- Automatically excludes expired/quarantined batches from prescription selection dropdowns.
- Automatically creates in-app notifications and broadcasts real-time alerts via SignalR when stock falls below 20 units or batches expire within 30 days.
