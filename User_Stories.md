# 👨‍⚕️ Doctor User Stories

## 1. View & Manage Appointments

**User Story**

> As a doctor, I want to view and manage my appointment schedule so that I can efficiently consult with patients without scheduling conflicts.

**Acceptance Criteria**

- Doctor can view daily, weekly, and monthly appointment calendars.
- Filter appointments by status (**Pending**, **Confirmed**, **Completed**, **Cancelled**).
- Doctor can accept, decline, or request a reschedule for pending appointments.
- Mark an appointment as **Completed** after the consultation.

## 2. Smart Prescription & Inventory Deduction

**User Story**

> As a doctor, I want to prescribe medicines directly from the system inventory so that stock levels are adjusted automatically and I don't prescribe expired medication.

**Acceptance Criteria**

- Doctor can search for medicines in the inventory during a consultation.
- System displays current stock levels and batch expiry dates to the doctor.
- Upon submitting the prescription, the system automatically assigns medicines from the oldest valid batch (FIFO - First In, First Out).
- Warning prompt if a doctor attempts to prescribe a medicine that is low in stock or nearing expiry.

## 3. View Doctor Dashboard

**User Story**

> As a doctor, I want to see a summary dashboard so that I can quickly assess my day's workload and inventory alerts.

**Acceptance Criteria**

- Dashboard shows total appointments for today.
- Quick-view list of the next 3 upcoming patients.
- Real-time alerts for **Critical Stock Levels** and **Expiring Batches** (within 30 days).
- Daily revenue overview (consultation fees collected).

# 🏥 Patient User Stories

## 4. Book an Appointment

**User Story**

> As a user, I want to book an appointment online so that I can secure a consultation slot with a doctor.

**Acceptance Criteria**

- Queue based appointment system for patient.(should respond the estimate time)
- Input a brief reason for the visit.
- Receive an in-app notification once the doctor approves/confirms the slot.

## 5. View Patient Dashboard

**User Story**

> As a patient or user, I want to access my personal dashboard so that I can track my health appointments and history.

**Acceptance Criteria**

- View upcoming appointment details (Date, Time, Doctor Name).
- View electronic prescription history and downloadable medical invoices.
- Check outstanding balances or pending payment approvals.
- One user can have multiple patient records.
- Multiple patients can be seen via card view in user site. Clicking them will show the specific patient’s record and details.

# 📊 System User Stories (Automation)

## 6. Smart Batch Control & Expiry Tracking

**User Story**

> As a system, I want to monitor medicine batch details automatically so that expired or contaminated batches are quarantined.

**Acceptance Criteria**

- Auto-track medicine data fields: `Batch Number`, `Expiry Date`, `Manufacture Date`, `Quantity`.
- Automatically shift medicine status from **Active** to **Expired** once the expiry date passes.
- Automatically block expired batches from appearing in the doctor’s prescription search layout.

## 7. Payment Verification Workflow

**User Story**

> As a system, I want to process gateway transactions automatically and queue manual proof uploads for verification so that billing records remain accurate.

**Acceptance Criteria**

- **Gateway Payments:** Automatically mark invoice as **Paid** and update appointment status upon receiving a successful API callback.

## 8. Low Stock & Expiry Push Notifications

**User Story**

> As a system, I want to send automated alerts to clinic staff when specific medicine batches drop below the threshold limit so that inventory can be restocked on time.

---

# 👨‍⚕️ Doctor (Admin) - New User Stories

## 9. Electronic Medical Record (EMR) & Patient History User Story

> As a doctor, I want to view and update a patient’s complete medical history during consultation so I can make informed clinical decisions.

**Acceptance Criteria**

- View timeline of all past visits, prescriptions, diagnoses, and lab results.
- Record vital signs (BP, Weight, Temperature, Pulse, SpO2, Height, BMI) with history chart.
- Add/update allergies, chronic conditions, past surgeries, and family history.
- Quick access to previous prescriptions and disease trends.

## 10. Doctor Dashboard (Enhanced View)

> As a doctor, I want a comprehensive dashboard so I can manage my clinical workflow efficiently.

**Acceptance Criteria**

- View today’s appointments with quick actions (Start, Reschedule, Cancel).
- Daily revenue summary and collection report.
- Low stock and expiring medicine alerts.
- Quick-add button to prescribe for walk-in patients.

## 11. Enhanced Prescription Features User Story

> As a doctor, I want advanced prescription tools so I can prescribe efficiently and safely.

**Acceptance Criteria**

- Save and reuse prescription templates for common diseases.
- Drug interaction or allergy warnings (basic level).
- Add lab test requests directly from the prescription screen.
- Print or digitally send prescription to patient.

# 🏥 Patient User Stories

## 12. Family Member / Multiple Patient Management

> As a user, I want to manage health records for myself and my family members under one account.

**Acceptance Criteria**

- Add multiple patient profiles (self, child, parent, spouse).
- Switch between patient profiles easily via card view.
- Book appointments for any family member.

## 13. Health Record Access & Download User Story

> As a patient, I want full access to my medical records so I can maintain my health history.

**Acceptance Criteria**

- Download prescriptions, invoices, and lab reports as PDF.
- View vaccination history, chronic conditions, and allergies.
- Get a summarized "Medical Summary" report.

## 14. Appointment History & Follow-up Management

> As a patient, I want to view my complete appointment history and manage follow-ups.

**Acceptance Criteria**

- View chronological list of all past appointments with status.
- Re-book previous appointments with a single click.
- View doctor's follow-up recommendations and due dates.
- Set reminders for follow-up visits.

## 15. Appointment Queue System with Real-Time Updates (Optional)

> As a patient, I want to see my position in the queue and the estimated wait time so I can plan my visit better.

**Acceptance Criteria**

- Display current token number and "You are 3rd in queue" message.
- Show estimated wait time (e.g., "Approx. 15 minutes").
- Real-time updates when the previous patient's appointment ends.
- Notification when it's my turn to see the doctor.
- Show current doctor's availability status (e.g., "In Consultation", "Available").
- Option to minimize the queue view and continue browsing.
- Display token number on the patient's dashboard.
- Visual progress bar showing how many patients are ahead.
- "Call Next Patient" button for the doctor to manually call the next token.
- Audio notification (chime/beep) when the token changes.
- Smooth transition animation when the queue updates.
