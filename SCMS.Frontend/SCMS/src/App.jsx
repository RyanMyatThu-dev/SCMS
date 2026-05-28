import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts Imports
import AdminLayout from "./layouts/AdminLayout";
import UserLayout from "./layouts/UserLayout";

// Features & Components Imports
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import NotFound from "./pages/NotFound";

// Public / Protected Pages Placeholders
const AdminDashboard = () => (
  <div className="p-6 font-bold">Admin Dashboard</div>
);
const AdminAppointments = () => (
  <div className="p-6 font-bold">Appointments Management (Admin)</div>
);
const AdminDiseases = () => (
  <div className="p-6 font-bold">Diseases Records (Admin)</div>
);
const AdminDocuments = () => (
  <div className="p-6 font-bold">Documents Management (Admin)</div>
);
const AdminFollowUps = () => (
  <div className="p-6 font-bold">Follow-ups Tracking</div>
);
const AdminLabReports = () => (
  <div className="p-6 font-bold">Lab Reports Management</div>
);
const AdminMedicines = () => (
  <div className="p-6 font-bold">Medicines Inventory</div>
);
const AdminNotifications = () => (
  <div className="p-6 font-bold">System Notifications</div>
);
const AdminPatients = () => (
  <div className="p-6 font-bold">Patients Directory</div>
);
const AdminPayments = () => (
  <div className="p-6 font-bold">Payments & Billing</div>
);
const AdminPrescriptions = () => (
  <div className="p-6 font-bold">Prescriptions Records</div>
);

const UserDashboard = () => (
  <div className="p-6 font-bold">Patient Portal Dashboard</div>
);
const UserNewAppointment = () => (
  <div className="p-6 font-bold">Book an Appointment (Patient)</div>
);
const UserMyDocuments = () => (
  <div className="p-6 font-bold">My Medical Documents</div>
);
const UserMyPrescriptions = () => (
  <div className="p-6 font-bold">My Prescriptions</div>
);
const UserMyPayments = () => (
  <div className="p-6 font-bold">My Bills & Payments</div>
);

const SplashScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="animate-bounce h-16 w-16 bg-indigo-600 text-white font-black text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-4">
      S
    </div>
    <h1 className="text-xl font-bold text-gray-800 tracking-wider animate-pulse">
      SCMS PORTAL LOADING...
    </h1>
  </div>
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ─── ၂။ REFRESH လုပ်လျှင်လည်း LOGIN မထွက်သွားစေရန် စစ်ဆေးသည့်အပိုင်း ───
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role.toLowerCase());
    }

    // Logo ပြသရန်အတွက် (1.5 Seconds) စောင့်ခိုင်းပြီးမှ App ထဲ ပေးဝင်မည်
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // အInitializing လုပ်နေတုန်းဆိုရင် Splash Screen ပြထားမည်
  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ====================================================
            ၃။ ROOT ROUTE (/) ဟု ဝင်လာလျှင် ပထမဆုံး စစ်ဆေးမည့် နေရာ
           ==================================================== */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              userRole === "admin" ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              // ⚠️ Splash Screen ပြပြီး အကောင့်မဝင်ရသေးပါက Register Page သို့ အရင်ပို့ပေးမည်
              <Navigate to="/register" replace />
            )
          }
        />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ====================================================
            ၄။ ADMIN SIDE ROUTES
           ==================================================== */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="diseases" element={<AdminDiseases />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="follow-ups" element={<AdminFollowUps />} />
          <Route path="lab-reports" element={<AdminLabReports />} />
          <Route path="medicines" element={<AdminMedicines />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="patients" element={<AdminPatients />} />

          <Route path="payments" element={<AdminPayments />} />
          <Route path="prescriptions" element={<AdminPrescriptions />} />
        </Route>

        {/* ====================================================
            ၅။ USER/PATIENT SIDE ROUTES
           ==================================================== */}
        <Route path="/" element={<UserLayout />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="book-appointment" element={<UserNewAppointment />} />
          <Route path="my-documents" element={<UserMyDocuments />} />
          <Route path="my-prescriptions" element={<UserMyPrescriptions />} />
          <Route path="my-payments" element={<UserMyPayments />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
