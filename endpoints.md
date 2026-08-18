# SCMS Web API Endpoints

**Base URL**: `http://localhost:5140`  
**Interactive Scalar API Reference**: `http://localhost:5140/scalar`

---

## 1. Authentication (`/api/Auth`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/Auth/register` | Anonymous (Public) | Registers a new patient/user account |
| `POST` | `/api/Auth/login` | Anonymous (Public) | Authenticates credentials and returns JWT access & refresh tokens |
| `POST` | `/api/Auth/refresh` | Anonymous (Public) | Issues a new JWT access token using a valid refresh token |

---

## 2. Dashboards (`/api/Dashboards`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Dashboards/dashboard` | `owner`, `admin`, `doctor` | Retrieves clinical metrics, total income, doctor consultation fees, walk-in vs online patient counts, and queue status with period filter (`?period=daily\|weekly\|monthly\|all`) |
| `GET` | `/api/Dashboards/patient-dashboard` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves upcoming appointments, recent prescriptions, and medical stats for the logged-in patient |

---

## 3. Appointments (`/api/Appointments`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/Appointments` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Books a new appointment slot |
| `GET` | `/api/Appointments` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists appointments with filters (`startDate`, `endDate`, `status`, `patientId`) & pagination. Patients see only their own appointments; staff see all. |
| `PATCH` | `/api/Appointments/{id}/status` | `owner`, `admin`, `doctor` | Updates appointment status (e.g., Confirmed, Completed, Cancelled) |
| `POST` | `/api/Appointments/{id}/reschedule` | `owner`, `admin`, `doctor` | Reschedules an appointment to a new date and time slot |
| `GET` | `/api/Appointments/{id}/queue-status` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves real-time queue position and estimated wait time for an appointment |
| `POST` | `/api/Appointments/call-next` | `owner`, `admin`, `doctor` | Calls the next queued patient in line for consultation |

---

## 4. Patients (`/api/Patients`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/Patients` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Creates a new patient profile associated with the user |
| `GET` | `/api/Patients` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists patient profiles with pagination. Patients see only their own profiles; staff see all. |
| `GET` | `/api/Patients/patients/{id}` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves detailed patient profile information by ID |
| `GET` | `/api/Patients/{id}/history` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves full clinic visit, consultation, and diagnosis history for a patient |
| `GET` | `/api/Patients/{id}/summary` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves comprehensive patient medical summary in JSON format |
| `GET` | `/api/Patients/{id}/summary/html` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Renders and returns formatted medical summary HTML |
| `GET` | `/api/Patients/{id}/summary/pdf` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Generates and downloads medical summary report as a PDF |
| `DELETE` | `/api/Patients/{id}` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Deletes / deactivates a patient profile |

---

## 5. Prescriptions (`/api/Prescriptions`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/Prescriptions` | `owner`, `admin`, `doctor` | Creates a prescription and dispenses medications |
| `GET` | `/api/Prescriptions` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists prescriptions with optional `patientId` filter and pagination |
| `GET` | `/api/Prescriptions/prescriptions/{id}` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Retrieves detailed prescription items, dosage instructions, and diagnosis |
| `POST` | `/api/Prescriptions/templates` | `owner`, `admin`, `doctor` | Creates and saves a standard prescription medication template |
| `GET` | `/api/Prescriptions/templates` | `owner`, `admin`, `doctor` | Lists prescription templates with optional `diseaseId` filter and pagination |
| `DELETE` | `/api/Prescriptions/templates/{id}` | `owner`, `admin`, `doctor` | Deletes a saved prescription template |
| `GET` | `/api/Prescriptions/{id}/pdf` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Generates and downloads official prescription document as PDF |

---

## 6. Medicines & Inventory (`/api/Medicines`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Medicines` | `owner`, `admin`, `doctor` | Searches and lists medicines with pagination |
| `POST` | `/api/Medicines` | `owner`, `admin`, `doctor` | Adds a new medicine entry with optional image upload |
| `PUT` | `/api/Medicines/{id}` | `owner`, `admin`, `doctor` | Updates medicine details, category, unit price, or image |
| `DELETE` | `/api/Medicines/{id}` | `owner`, `admin`, `doctor` | Deletes a medicine from inventory |
| `GET` | `/api/Medicines/categories` | `owner`, `admin`, `doctor` | Retrieves all distinct medicine categories |
| `POST` | `/api/Medicines/quarantine-expired` | `owner`, `admin`, `doctor` | Automatically detects and moves expired batches to quarantined status |
| `GET` | `/api/Medicines/alerts` | `owner`, `admin`, `doctor` | Retrieves active inventory alerts for low-stock and expiring batches |
| `GET` | `/api/Medicines/batches` | `owner`, `admin`, `doctor` | Lists medicine batches with filtering (`query`, `status`, `medicineId`) and sorting |
| `GET` | `/api/Medicines/batches/{id}` | `owner`, `admin`, `doctor` | Retrieves detailed information for a specific medicine batch |
| `POST` | `/api/Medicines/batches` | `owner`, `admin`, `doctor` | Adds a new stock batch with batch number, quantity, expiry date, and cost |
| `PUT` | `/api/Medicines/batches/{id}` | `owner`, `admin`, `doctor` | Updates batch quantity, expiry date, purchase price, or status |
| `DELETE` | `/api/Medicines/batches/{id}` | `owner`, `admin`, `doctor` | Deletes a batch (supports optional `?force=true` parameter) |

---

## 7. Diseases & Diagnoses (`/api/Diseases`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Diseases` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists diseases and diagnoses with search query and pagination |
| `POST` | `/api/Diseases` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Creates a new disease diagnosis record |
| `PUT` | `/api/Diseases` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Updates disease diagnosis details |
| `DELETE` | `/api/Diseases/{id}` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Deactivates / deletes a disease record |

---

## 8. Payments & Billing (`/api/Payments`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Payments` | `owner`, `admin`, `doctor` | Lists payment records with filters (`status`, `dateFilter`, `query`) and pagination |
| `POST` | `/api/Payments/gateway-callback` | `owner`, `admin`, `doctor` | Handles webhook callbacks from external payment gateways |
| `POST` | `/api/Payments/manual-proof` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Submits manual payment proof (bank slip/transaction reference) for review |
| `POST` | `/api/Payments/{id}/approve` | `owner`, `admin`, `doctor` | Approves a submitted manual payment |
| `GET` | `/api/Payments/{id}/invoice/pdf` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Generates and downloads payment invoice as a PDF |

---

## 9. Follow-ups (`/api/FollowUps`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/FollowUps` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists scheduled follow-up visits with optional `patientId` filter and pagination |
| `POST` | `/api/FollowUps` | `owner`, `admin`, `doctor` | Schedules a follow-up consultation for a patient |
| `POST` | `/api/FollowUps/{id}/complete` | `owner`, `admin`, `doctor` | Marks a scheduled follow-up consultation as completed |

---

## 10. Notifications (`/api/Notifications`)

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Notifications` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Lists notifications for current user (or all if `includeAll=true` and caller is staff) |
| `POST` | `/api/Notifications/{id}/read` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Marks a notification as read |
| `POST` | `/api/Notifications` | `owner`, `admin`, `doctor` | Dispatches a direct in-app notification to a user |

---

## 11. Reports & Analytics (`/api/Reports`)

*All report endpoints are restricted to staff roles (`owner`, `admin`, `doctor`).*

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/Reports/appointments` | `owner`, `admin`, `doctor` | Generates appointment summary data (JSON) — `?reportType=daily&date=` |
| `GET` | `/api/Reports/appointments/pdf` | `owner`, `admin`, `doctor` | Downloads appointment summary report as PDF |
| `GET` | `/api/Reports/revenue` | `owner`, `admin`, `doctor` | Generates clinic revenue analytics data (JSON) — `?reportType=daily&date=` |
| `GET` | `/api/Reports/revenue/pdf` | `owner`, `admin`, `doctor` | Downloads clinic revenue analytics report as PDF |
| `GET` | `/api/Reports/patients` | `owner`, `admin`, `doctor` | Generates patient demographic and registration report (JSON) |
| `GET` | `/api/Reports/patients/pdf` | `owner`, `admin`, `doctor` | Downloads patient registry report as PDF |
| `GET` | `/api/Reports/medicine-stock` | `owner`, `admin`, `doctor` | Generates medicine inventory and valuation report (JSON) |
| `GET` | `/api/Reports/medicine-stock/pdf` | `owner`, `admin`, `doctor` | Downloads medicine inventory report as PDF |
| `GET` | `/api/Reports/follow-ups` | `owner`, `admin`, `doctor` | Generates follow-up tracking report (JSON) — `?startDate=&endDate=&status=` |
| `GET` | `/api/Reports/follow-ups/pdf` | `owner`, `admin`, `doctor` | Downloads follow-up tracking report as PDF |
| `GET` | `/api/Reports/prescriptions` | `owner`, `admin`, `doctor` | Generates prescription dispensation report (JSON) |
| `GET` | `/api/Reports/prescriptions/pdf` | `owner`, `admin`, `doctor` | Downloads prescription dispensation report as PDF |
| `GET` | `/api/Reports/business-summary` | `owner`, `admin`, `doctor` | Generates comprehensive monthly business summary (JSON) — `?month=&year=` |
| `GET` | `/api/Reports/business-summary/pdf` | `owner`, `admin`, `doctor` | Downloads monthly business summary report as PDF |

---

## 12. Model Context Protocol / AI Assistant (`/api/mcp`)

*All MCP endpoints are restricted to staff roles (`owner`, `admin`, `doctor`).*

| Method | Endpoint | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mcp/tools` | `owner`, `admin`, `doctor` | Lists available MCP tool definitions and schemas for AI tool calling |
| `POST` | `/api/mcp/tools/call` | `owner`, `admin`, `doctor` | Executes a specific MCP tool call directly against clinic business logic |
| `POST` | `/api/mcp/chat` | `owner`, `admin`, `doctor` | AI assistant conversational loop with automated multi-turn MCP tool calling |

---

## 13. Real-Time SignalR Hubs (`/hubs`)

*Requires JWT token passed via `access_token` query parameter.*

| Protocol | Route | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `WSS / WS` | `/hubs/queue` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Real-time queue event notifications (e.g., patient called, queue advanced) |
| `WSS / WS` | `/hubs/notifications` | Authenticated (`user`, `owner`, `admin`, `doctor`) | Real-time user alert and push notification broadcasting |
