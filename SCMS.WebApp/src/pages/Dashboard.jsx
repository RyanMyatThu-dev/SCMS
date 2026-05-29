import { CalendarDays, CreditCard, Pill, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PaginationControls from "../components/PaginationControls";
import { useLanguage } from "../context/LanguageContext";
import { appointmentsApi, dashboardsApi, medicinesApi } from "../services/scmsApi";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const getLocalDateStr = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayPatients: 0,
    todayAppointments: 0,
    totalMedicines: 0,
    totalRevenue: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadAppointments = async (pageNum) => {
    try {
      setLoading(true);
      const todayStr = getLocalDateStr(new Date());
      const res = await appointmentsApi.list({
        pageNumber: pageNum,
        pageSize: 5,
        startDate: todayStr,
        endDate: `${todayStr}T23:59:59`
      });
      if (res) {
        setAppointments(toArray(res));
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.totalCount || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load appointments for dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        const [dashboard, medicineAlerts] = await Promise.allSettled([
          dashboardsApi.admin(),
          medicinesApi.alerts(),
        ]);

        const dashboardData = dashboard.status === "fulfilled" ? dashboard.value : {};
        setAlerts(medicineAlerts.status === "fulfilled" ? toArray(medicineAlerts.value).slice(0, 6) : []);
        setStats({
          todayPatients: dashboardData?.data?.todayPatientsCount ?? 0,
          todayAppointments: dashboardData?.data?.todayAppointmentsCount ?? 0,
          totalMedicines: dashboardData?.data?.totalMedicinesCount ?? 0,
          totalRevenue: dashboardData?.data?.totalRevenue ?? 0,
        });
      } catch (err) {
        console.error("Telemetry loading failed", err);
      }
    };

    loadTelemetry();
  }, []);

  useEffect(() => {
    loadAppointments(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "pending" || s === "requested") return "bg-amber-100 text-amber-800 border-amber-200";
    if (s === "confirmed" || s === "paid") return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (s === "completed") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (s === "cancelled" || s === "failed") return "bg-red-100 text-red-800 border-red-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const formatDate = (val) => {
    if (!val) return "-";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const statLabels = language === "mm"
    ? {
        todayPatients: "ယနေ့လူနာစာရင်း",
        todayAppointments: "ယနေ့ချိန်းဆိုမှုစာရင်း",
        totalMedicines: "စုစုပေါင်းဆေးအရေအတွက်",
        totalRevenue: "ယနေ့စုစုပေါင်းဝင်ငွေ",
      }
    : {
        todayPatients: "Total Patient Today",
        todayAppointments: "Total Appointments Today",
        totalMedicines: "Total Medicines in Inventory",
        totalRevenue: "Total Income",
      };

  return (
    <div className="space-y-6">
      <PageHeader title={t.dashboard} />

      {/* Clickable Telemetry Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={statLabels.todayPatients}
          value={stats.todayPatients}
          icon={Users}
          tone="primary"
          onClick={() => navigate("/app/patients")}
        />
        <StatCard
          label={statLabels.todayAppointments}
          value={stats.todayAppointments}
          icon={CalendarDays}
          tone="primary"
          onClick={() => navigate("/app/appointments")}
        />
        <StatCard
          label={statLabels.totalMedicines}
          value={stats.totalMedicines}
          icon={Pill}
          tone="success"
          onClick={() => navigate("/app/medicines")}
        />
        <StatCard
          label={statLabels.totalRevenue}
          value={`MMK ${Number(stats.totalRevenue || 0).toLocaleString()}`}
          icon={CreditCard}
          tone="warning"
          onClick={() => navigate("/app/payments")}
        />
      </section>

      {/* Grid Content */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-scms-text">Today's Appointments</h2>
            <span className="text-xs font-bold text-scms-muted font-mono">{totalCount} today</span>
          </div>

          <DataTable
            loading={loading}
            rows={appointments}
            onRowClick={(row) => {
              setSelectedAppt(row);
              setDetailOpen(true);
            }}
            columns={[
              {
                label: t.patient,
                key: (row) => row.patientName || row.patient?.name || row.patientId,
                render: (val) => (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/app/appointments");
                    }}
                    className="cursor-pointer font-extrabold text-scms-primary hover:underline"
                  >
                    {val}
                  </span>
                )
              },
              {
                label: t.date,
                key: "datetime",
                render: (val) => {
                  const formatted = formatDate(val);
                  return (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/app/appointments");
                      }}
                      className="cursor-pointer font-semibold text-scms-text hover:underline"
                    >
                      {formatted}
                    </span>
                  );
                }
              },
              { label: t.status, key: (row) => row.status || row.appointmentStatus, type: "status" },
            ]}
          />

          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            label="appointments"
            loading={loading}
            onPageChange={setPage}
          />
        </div>

        <div>
          <h2 className="mb-3 text-xl font-black text-scms-text">Stock Warnings</h2>
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

      {/* --- APPOINTMENT DETAILS POPUP ON DASHBOARD --- */}
      {detailOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn animate-duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-scms-border p-6 shadow-2xl relative">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
            >
              <X size={16} />
            </button>
            
            <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-400 font-mono">Slot #{selectedAppt.appointmentCode}</span>
                <h3 className="text-lg font-black text-scms-text mt-1">
                  {selectedAppt.patientName || selectedAppt.patient?.name}
                </h3>
              </div>
              <span className={`text-[10px] font-black border px-2.5 py-0.5 rounded-full ${getStatusClass(selectedAppt.status)}`}>
                {String(selectedAppt.status).toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>Appointment Date:</span>
                <strong className="text-scms-text">{formatDate(selectedAppt.datetime)}</strong>
              </div>
              {selectedAppt.tokenNumber > 0 && (
                <div className="flex justify-between text-slate-500 font-bold">
                  <span>Queue Position:</span>
                  <strong className="text-indigo-600 font-mono">#{selectedAppt.tokenNumber}</strong>
                </div>
              )}
              {selectedAppt.notes && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-bold block mb-1">Visit Notes:</span>
                  <p className="text-scms-muted font-semibold bg-slate-50 border border-slate-100 p-2.5 rounded-lg italic">
                    "{selectedAppt.notes}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
