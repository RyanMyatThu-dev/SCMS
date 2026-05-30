import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import {
  FollowUpsPage,
  NotificationsPage,
} from "./pages/FeaturePages";
import PatientsPage from "./pages/PatientsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import MedicinesPage from "./pages/MedicinesPage";
import BatchesPage from "./pages/BatchesPage";
import DiseasesPage from "./pages/DiseasesPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import PaymentsPage from "./pages/PaymentsPage";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AiAssistant from "./pages/AiAssistant";
import UserLayout from "./pages/user/UserLayout";
import UserDashboard from "./pages/user/UserDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="medicines" element={<MedicinesPage />} />
        <Route path="medicines/batches" element={<BatchesPage />} />
        <Route path="diseases" element={<DiseasesPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ai-assistant" element={<AiAssistant />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
