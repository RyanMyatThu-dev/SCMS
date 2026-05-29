import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ─── ၁။ FEATURE STRUCTURE အသစ်အရ COMPONENTS များ IMPORT လုပ်ခြင်း ───
import AdminDashboard from "./features/admin/components/AdminDashboard";
import UserDashboard from "./features/user/components/UserDashboard";

// Auth Features & Components
import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";
import NotFound from "./pages/NotFound";
import PatientPortal from "./pages/PatientPortal";

// ကျန်ရှိသော Admin Features များ (အစ်ကို့ရဲ့ လက်ရှိ ဖိုင်လမ်းကြောင်းများအတိုင်း)
import AdminAppointments from "./features/appointments/Appointment";
import AdminDiseases from "./features/disease/Disease";
import AdminDocuments from "./features/document/Documents";
import AdminFollowUps from "./features/followUps/FollowUps";
import AdminLabReports from "./features/labreports/LabReports";
import AdminMedicines from "./features/medicines/Medicines";

// ⚠️ User/Patient အတွက် နောက်ပိုင်းထည့်မည့် စာမျက်နှာများ (Placeholder များ ဖျက်ပြီး တိုက်ရိုက် Import လုပ်နိုင်သည်)
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

// ─── ၂။ SPLASH SCREEN COMPONENT ───
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

  // ─── ၃။ REFRESH စစ်ဆေးသည့်အပိုင်း ───
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role.toLowerCase());
    }

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ====================================================
            ၄။ ROOT ROUTE (/) စစ်ဆေးသည့်နေရာ
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
              <Navigate to="/register" replace />
            )
          }
        />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Portal (mobile-first UI) */}
        <Route path="/patient-portal" element={<PatientPortal />} />

        {/* ====================================================
            ၅။ ADMIN SIDE ROUTES (Layout မပါဘဲ တိုက်ရိုက်ပတ်ထားသည်)
           ==================================================== */}
        <Route path="/admin">
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="diseases" element={<AdminDiseases />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="follow-ups" element={<AdminFollowUps />} />
          <Route path="lab-reports" element={<AdminLabReports />} />
          <Route path="medicines" element={<AdminMedicines />} />
          <Route
            path="notifications"
            element={<div className="p-6 font-bold">Admin Notifications</div>}
          />
        </Route>

        {/* ====================================================
            ၆။ USER/PATIENT SIDE ROUTES (Layout မပါဘဲ တိုက်ရိုက်ပတ်ထားသည်)
           ==================================================== */}
        <Route path="/">
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
