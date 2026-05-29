import { Activity, Bell, CalendarDays, CreditCard, Pill, Users } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import { useLanguage } from "../context/LanguageContext";
import { appointmentsApi, dashboardsApi, medicinesApi, notificationsApi, paymentsApi, patientsApi } from "../services/scmsApi";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

export default function Dashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [dashboard, patients, appointmentsRes, medicines, payments, notifications, medicineAlerts] = await Promise.allSettled([
          dashboardsApi.admin(),
          patientsApi.list(),
          appointmentsApi.list(),
          medicinesApi.list(),
          paymentsApi.list(),
          notificationsApi.list({ includeAll: true }),
          medicinesApi.alerts(),
        ]);

        const dashboardData = dashboard.status === "fulfilled" ? dashboard.value : {};
        const appointmentRows = appointmentsRes.status === "fulfilled" ? toArray(appointmentsRes.value) : [];
        setAppointments(appointmentRows.slice(0, 6));
        setAlerts(medicineAlerts.status === "fulfilled" ? toArray(medicineAlerts.value).slice(0, 6) : []);
        setStats({
          patients: dashboardData?.patientsCount ?? toArray(patients.value).length,
          appointments: dashboardData?.appointmentsCount ?? appointmentRows.length,
          medicines: dashboardData?.medicinesCount ?? toArray(medicines.value).length,
          payments: dashboardData?.paymentsCount ?? toArray(payments.value).length,
          notifications: dashboardData?.notificationsCount ?? toArray(notifications.value).length,
          active: appointmentRows.filter((item) => !["completed", "cancelled"].includes(String(item.status || item.appointmentStatus || "").toLowerCase())).length,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-5">
      <PageHeader title={t.dashboard} subtitle={t.protectedWorkflows} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.patients} value={stats.patients} icon={Users} />
        <StatCard label={t.appointments} value={stats.appointments} icon={CalendarDays} tone="primary" />
        <StatCard label={t.medicines} value={stats.medicines} icon={Pill} tone="success" />
        <StatCard label={t.payments} value={stats.payments} icon={CreditCard} tone="warning" />
        <StatCard label={t.notifications} value={stats.notifications} icon={Bell} />
        <StatCard label={t.active} value={stats.active} icon={Activity} tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div>
          <h2 className="mb-3 text-xl font-black text-scms-text">{t.appointments}</h2>
          <DataTable
            loading={loading}
            rows={appointments}
            columns={[
              { label: t.patient, key: (row) => row.patientName || row.patient?.name || row.patientId },
              { label: t.date, key: (row) => row.datetime || row.appointmentDate || row.date },
              { label: t.status, key: (row) => row.status || row.appointmentStatus, type: "status" },
            ]}
          />
        </div>
        <div>
          <h2 className="mb-3 text-xl font-black text-scms-text">{t.apiStatus}</h2>
          <div className="scms-card divide-y divide-scms-border">
            {alerts.length ? (
              alerts.map((alert, index) => (
                <div key={alert.id || index} className="p-4">
                  <div className="font-extrabold text-scms-text">{alert.name || alert.medicineName || alert.type || "Inventory Alert"}</div>
                  <div className="mt-1 text-sm text-scms-muted">{alert.message || alert.description || alert.status || "-"}</div>
                </div>
              ))
            ) : (
              <div className="p-5 text-sm font-bold text-scms-muted">No inventory alerts.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
