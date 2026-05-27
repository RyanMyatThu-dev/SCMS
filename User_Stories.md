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

> As a user, I want to book an appointment online so that I can secure a consultation slot with my preferred doctor.

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
