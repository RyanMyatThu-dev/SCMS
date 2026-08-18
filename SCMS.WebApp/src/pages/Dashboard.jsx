import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  CalendarIcon,
  ArchiveIcon,
  CardStackIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
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

const getLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function Dashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const pageSize = 5;
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
        endDate: `${todayStr}T23:59:59`,
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
        setAlerts(
          medicineAlerts.status === "fulfilled" ? toArray(medicineAlerts.value).slice(0, 6) : []
        );
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
  }, [page]);

  const statLabels =
    language === "mm"
      ? {
          todayPatients: "ယနေ့လူနာစာရင်း",
          todayAppointments: "ယနေ့ချိန်းဆိုမှုစာရင်း",
          totalMedicines: "ဆေးဝါးစုစုပေါင်း",
          totalRevenue: "ယနေ့စုစုပေါင်းဝင်ငွေ",
        }
      : {
          todayPatients: "Today's Patient Volume",
          todayAppointments: "Appointments Scheduled",
          totalMedicines: "Pharmacy Medicine Stock",
          totalRevenue: "Daily Revenue",
        };

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        title={t.dashboard}
        subtitle="Practice executive overview: real-time patient flow, revenue summary, and stock alerts."
      />

      {/* KPI Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={statLabels.todayPatients}
          value={stats.todayPatients}
          icon={PersonIcon}
          tone="primary"
          onClick={() => navigate("/app/patients")}
          subtitle="Registered clinic patients"
        />
        <StatCard
          label={statLabels.todayAppointments}
          value={stats.todayAppointments}
          icon={CalendarIcon}
          tone="primary"
          onClick={() => navigate("/app/appointments")}
          subtitle="Confirmed & scheduled slots"
        />
        <StatCard
          label={statLabels.totalMedicines}
          value={stats.totalMedicines}
          icon={ArchiveIcon}
          tone="success"
          onClick={() => navigate("/app/medicines")}
          subtitle="Cataloged pharmaceuticals"
        />
        <StatCard
          label={statLabels.totalRevenue}
          value={`${Number(stats.totalRevenue || 0).toLocaleString()} MMK`}
          icon={CardStackIcon}
          tone="warning"
          onClick={() => navigate("/app/payments")}
          subtitle="Settled & verified billing"
        />
      </section>

      {/* Main Grid: Today's Appointments vs Stock Alerts */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today&apos;s Consultation Schedule
            </h2>
          </div>

          <DataTable
            loading={loading}
            rows={appointments}
            showIndex
            indexOffset={(page - 1) * pageSize}
            onRowClick={(row) => {
              setSelectedAppt(row);
              setDetailOpen(true);
            }}
            columns={[
              {
                label: "Token",
                key: (r) => `#${r.tokenNumber || r.appointmentCode || "-"}`,
                cellClassName: "font-mono font-bold text-indigo-600 dark:text-indigo-400",
              },
              {
                label: t.patient,
                key: (row) => row.patientName || row.patient?.name || `Patient #${row.patientId}`,
                cellClassName: "font-bold text-slate-900 dark:text-white",
              },
              {
                label: "Visit Reason",
                key: (row) => row.notes || row.reason || "General Consultation",
                cellClassName: "text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs",
              },
              {
                label: t.status,
                key: (row) => row.status || row.appointmentStatus,
                type: "status",
              },
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

        {/* Pharmacy Stock Warnings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Inventory Stock Alerts</span>
              {alerts.length > 0 && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-xs font-bold font-mono">
                  {alerts.length}
                </span>
              )}
            </h2>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {alerts.length ? (
              alerts.map((alert, index) => {
                const isLowStock = alert.alertType === "Low Stock";
                return (
                  <div
                    key={alert.id || index}
                    className={`rounded-2xl border p-4 transition-all ${
                      isLowStock
                        ? "border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20"
                        : "border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20"
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isLowStock
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        }`}
                      >
                        <ExclamationTriangleIcon className="w-3 h-3" />
                        {alert.alertType || "Alert"}
                      </span>
                      {alert.batchNo && (
                        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Batch: {alert.batchNo}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {alert.medicineName || alert.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="block text-slate-400 text-[10px] font-bold uppercase">
                          Current Stock
                        </span>
                        <strong
                          className={
                            isLowStock
                              ? "font-mono font-bold text-rose-600 dark:text-rose-400"
                              : "font-mono text-slate-800 dark:text-slate-200"
                          }
                        >
                          {alert.currentQuantity ?? 0} units
                        </strong>
                      </div>
                      <div>
                        <span className="block text-slate-400 text-[10px] font-bold uppercase">
                          Milestone
                        </span>
                        <strong className="font-mono text-slate-700 dark:text-slate-300">
                          {isLowStock
                            ? "Critical Minimum"
                            : String(alert.expiryDate || "").slice(0, 10)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                No active inventory warnings. All batches in healthy stock.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Appointment Detail Modal */}
      {detailOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  Token #{selectedAppt.tokenNumber || selectedAppt.appointmentCode}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedAppt.patientName || selectedAppt.patient?.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {String(selectedAppt.datetime || "").replace("T", " ")}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedAppt.status}
                </strong>
              </div>
              {selectedAppt.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Visit Notes:
                  </span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 italic">
                    &ldquo;{selectedAppt.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDetailOpen(false)}
                className="scms-btn-outline text-xs btn-target"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
