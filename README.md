# 🏥 Smart Clinic Management System (SCMS)

SCMS is a comprehensive, modern clinic management solution designed to streamline healthcare workflows. It provides real-time operations, electronic medical records (EMR), automated FIFO inventory tracking, a patient-family portal, billing workflows, and AI-powered clinic assistant features integrated via the Model Context Protocol (MCP).

---

## 🏗️ Architecture & Tech Stack

SCMS is built on a **Feature-based Organization** pattern, dividing business modules into cohesive feature folders that contain both the business logic services and the controllers. The repository supports multiple frontend clients interacting with a robust ASP.NET Core backend.

```
                  ┌─────────────────────────────────────────┐
                  │              SCMS Clients               │
                  └────┬───────────────┬───────────────┬────┘
                       │               │               │
            (React / Vite WebApp)  (Blazor WASM)  (Flutter Mobile)
                       │               │               │
                       ▼               ▼               ▼
                  ┌─────────────────────────────────────────┐
                  │            SCMS.Api Backend             │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            SCMS.Domain (Core)           │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       SCMS.Database (EF Core Layer)     │
                  └────────────┬───────────────────────┬────┘
                               │                       │
                               ▼                       ▼
                         (SQLite Dev)           (PostgreSQL Prod)
```

### 💻 Technology Breakdown

| Component | Technology / Framework | Key Libraries & Packages | Purpose |
| :--- | :--- | :--- | :--- |
| **Backend API** | `.NET 8` (ASP.NET Core Web API) | EF Core, SignalR, JWT Bearer Auth, Scalar Docs | Exposes RESTful endpoints, handles real-time queue updates, and manages core authentication. |
| **Domain Logic** | C# Class Library | Microsoft.AspNetCore.App (FrameworkReference) | Hosts business features, controllers, and core services. |
| **Database** | Dual-Provider Setup | `Microsoft.EntityFrameworkCore.Sqlite`, `Npgsql.EntityFrameworkCore.PostgreSQL` | SQLite for zero-config local development; PostgreSQL for production deployments. |
| **Shared Library** | C# Class Library | Result/Result\<T\> Pattern, Request/Response DTOs | Distributes DTO contracts and response structures between backend and frontend clients. |
| **Web Portal (React)** | `React 18` (Vite) | Tailwind CSS, DaisyUI, Axios, Lucide React, SweetAlert2 | The primary administrative and user dashboard client, optimized for modern UX. |
| **Web Portal (Blazor)**| `Blazor WebAssembly` | Ant Design Blazor (`AntDesign` 1.6) | Alternative enterprise-grade web client using Blazor. |
| **Mobile Client** | `Flutter` | Riverpod, GoRouter, Dio, Flutter Secure Storage | Cross-platform mobile app for patients and clinic staff. |

---

## ✨ Key Features

SCMS is packed with rich features designed to handle every facet of daily clinic management:

1. **📅 Appointment Management & Calendars**
   - Interactive daily, weekly, and monthly calendar views.
   - Filtering and state transition workflows for appointments (**Pending**, **Confirmed**, **Completed**, **Cancelled**).
   
2. **🩺 Electronic Medical Records (EMR)**
   - Unified patient history timeline documenting visits, diagnoses, prescriptions, and lab results.
   - Comprehensive vitals logging (BP, Weight, Temp, SpO2, BMI) with historical trend tracking.
   - Chronic condition registry, allergies database, and patient-family summaries.

3. **💊 Smart FIFO Inventory & Expiry Tracking**
   - Batch-level stock management (`Batch Number`, `Expiry Date`, `Manufacture Date`, `Quantity`).
   - Automated FIFO (First In, First Out) batch consumption during prescription issuance.
   - Real-time warning banners for low stock or nearing-expiry batches (within 30 days).
   - Automated background service (`InventoryMonitorService`) to quarantine expired batches.

4. **🧬 Disease & Template Management**
   - Soft-delete safe disease registry checking for active prescription references.
   - Custom reusable prescription templates mapped to specific diseases, enabling rapid prescribing.

5. **👥 Patient-Family Portal**
   - Manage multiple patient profiles under a single user portal account (self, child, spouse, parent).
   - One-click re-booking of historical appointments.
   - Downloadable medical summary, invoice, and prescription PDFs.

6. **💳 Automated Billing & Verification**
   - Direct gateway callback processing to auto-update payment records.
   - Manual transaction receipt upload queue for admin audit and verification.

7. **🗣️ AI Clinic Assistant (MCP Integrated)**
   - Conversational assistant powered by the Model Context Protocol (MCP).
   - Securely queries domain services for daily schedule summaries, low-stock warnings, and patient summaries without direct DB access.
   - Automated drafting of referral letters and creating follow-up reminders.

8. **🚨 Real-Time Queue & Notifications**
   - Live waiting queue status tracker using SignalR (`/hubs/queue`).
   - Patient-facing wait-time estimator ("3rd in queue - approx. 15 mins") with visual progress bar.
   - Audio and visual chimes when the doctor calls the next token.

---

## 🚀 Local Development Setup

To run SCMS locally, clone the repository and set up the components:

### 📋 Prerequisites
- **.NET SDK 8.0**
- **Node.js** (v18+) & **npm**
- **Flutter SDK** (for the mobile application)
- **Docker Desktop** (optional, for PostgreSQL setups)

### 1. Running Backend & Database
By default, the backend seeds an SQLite database (`scms.local.db` inside `SCMS.Api/`) on its first run.

```sh
# Navigate to the root directory
cd SCMS

# Build the entire solution
dotnet build SCMS.sln

# Run the API project
dotnet run --project SCMS.Api
```
The API launches at `http://localhost:5140`. You can explore the interactive documentation using Scalar at `http://localhost:5140/scalar`.

### 2. Running Frontend Clients

#### React Web Application (Vercel Target)
```sh
cd SCMS.WebApp
npm install
npm run dev
```

#### Blazor WebAssembly Application
```sh
# Run the Blazor client (launches on a separate local port)
dotnet run --project SCMS.Web
```

#### Flutter Mobile Client
```sh
cd SCMS.Mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:5140/
```
*(For Android Emulator, use `--dart-define=API_BASE_URL=http://10.0.2.2:5140/`)*

---

## 🐳 Docker Deployment

The application features a fully containerized Docker Compose architecture leveraging a PostgreSQL database.

### Initial Setup
Run the following from the root directory to build the container images and launch the services:
```sh
docker compose up -d --build
```
Fresh database volumes automatically ingest `db.sql` (schema) and `seed.realworld.sql` (clinical scenarios data).

### Control Commands
```sh
# Start services
docker compose up

# Check status
docker compose ps

# Force seed data to an existing database
docker compose exec scms_db psql -U postgres -d SCMS_db -f /docker-entrypoint-initdb.d/zz-seed.realworld.sql

# Stop services
docker compose down
```

---

## 🔑 Demo Credentials

Use these seeded credentials to evaluate different aspects of the system:

| Role | Email | Password | DB Target |
| :--- | :--- | :--- | :--- |
| **Administrator / Doctor** | `admin@scms.demo` | `password` | SQLite (Dev) |
| **Patient / User** | `user@scms.demo` | `password` | SQLite (Dev) |
| **Real-world Admin / Dr. Thandar** | `dr.thandar@scms.demo` | `password` | SQLite & Postgres (Docker) |
| **Real-world Patient / Aung Min** | `aung.min@example.test` | `password` | SQLite & Postgres (Docker) |

---

## 🌐 Production Deployment

SCMS is designed to deploy the API backend and React frontend independently for maximum scalability and performance.

### 🗄️ Backend API: Hugging Face Spaces (Docker SDK)

The backend runs as a containerized service deployed to **Hugging Face Spaces** using the Docker SDK.

1. **Docker Config**: The `Dockerfile` at the root exposes port `7860` and binds ASP.NET Core URL to listen on all interfaces at that port (`ENV ASPNETCORE_URLS=http://+:7860`).
2. **Auto Deployment**: GitHub Actions workflow at `.github/workflows/deploy.yml` automatically triggers on pushes to the `main` or `master` branches.
3. **Build Cleanup**: The runner strips away client projects (`SCMS.WebApp`, `SCMS.Web`, `SCMS.Mobile`) to optimize image build times.
4. **Environment Variables**:
   - `Database:Provider`: Set to `PostgreSql` in production.
   - `ConnectionStrings:PostgreSqlConnection`: Path to production database host.
   - `Jwt:SigningKey`: Production security token key.

---

### 🎨 Frontend WebApp: Vercel (React + Vite)

The React web application (`SCMS.WebApp`) is optimized for seamless deployment to **Vercel**.

1. **Routing Rewrite Rules**: The `vercel.json` file configures Vite single-page application (SPA) fallback routing:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
2. **API Endpoint Wiring**: During deployment, configure the following Environment Variables in the Vercel Dashboard:
   - `VITE_API_BASE_URL`: Point to the Hugging Face API space endpoint (e.g., `https://[your-space].hf.space/api`).
   - `VITE_CLOUDINARY_CLOUD_NAME`: Target Cloudinary environment name for storing receipts and medical attachments.
