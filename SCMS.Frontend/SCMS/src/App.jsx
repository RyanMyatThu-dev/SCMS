import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./features/auth/pages/Login";
import Register from "./features/auth/pages/Register";

import AdminLayout from "./features/admin/components/AdminLayout";
import AdminDashboard from "./features/admin/components/AdminDashboard";

import Patients from "./features/patients/Patients";
import Appointments from "./features/appointments/Appointment";
import Prescriptions from "./features/prescriptions/Prescriptions";
import FollowUps from "./features/followUps/FollowUps";
import Payments from "./features/payments/Payments";
import Notification from "./features/noti/Notification";
import Medicines from "./features/medicines/Medicines";
import Disease from "./features/disease/Disease";
import Documents from "./features/document/Documents";
import Setting from "./features/sestting/Setting";
import Reports from "./features/reports/Reports";

import NotFound from "./pages/NotFound";

const SplashScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <h1 className="text-2xl font-bold text-slate-700">SCMS Loading...</h1>
  </div>
);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    setIsAuthenticated(Boolean(token));

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="dashboard" element={<AdminDashboard />} />

        <Route path="patients" element={<Patients />} />

        <Route path="appointments" element={<Appointments />} />

        <Route path="prescriptions" element={<Prescriptions />} />

        <Route path="followups" element={<FollowUps />} />

        <Route path="payments" element={<Payments />} />

        <Route path="notifications" element={<Notification />} />

        <Route path="medicines" element={<Medicines />} />

        <Route path="diseases" element={<Disease />} />

        <Route path="documents" element={<Documents />} />

        <Route path="settings" element={<Setting />} />

        <Route path="reports" element={<Reports />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
