import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  CalendarIcon,
  ArchiveIcon,
  CardStackIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  ActivityLogIcon,
  ChevronDownIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PaginationControls from "../components/PaginationControls";
import RevenueAreaChart from "../components/widgets/RevenueAreaChart";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { appointmentsApi, dashboardsApi, medicinesApi, reportsApi } from "../services/scmsApi";

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

const dateRangeOptions = [
  "August 2026 (This Month)",
  "Today",
  "This Week",
  "All Time",
];

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const pageSize = 5;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayPatients: 0,
    todayAppointments: 0,
    totalMedicines: 0,
    totalIncome: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [revenueChartData, setRevenueChartData] = useState([]);
  const [dateRange, setDateRange] = useState("August 2026 (This Month)");

  // Dedicated Date Range Filter Popover State
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const dateFilterRef = useRef(null);

  // Close filter dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(e.target)) {
        setDateFilterOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dateFilterOpen) {
        setDateFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dateFilterOpen]);

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

  const buildMonthlyChartData = (revenueReport) => {
    const items = revenueReport?.items || revenueReport?.data?.items || toArray(revenueReport);
    const now = new Date();
    const currentMonthName = now.toLocaleString("en-US", { month: "short" });
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Initialize map of all days in current month
    const dayMap = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const label = `${currentMonthName} ${String(day).padStart(2, "0")}`;
      dayMap[label] = 0;
    }

    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (item.paidAt) {
          const itemDate = new Date(item.paidAt);
          if (itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()) {
            const label = `${currentMonthName} ${String(itemDate.getDate()).padStart(2, "0")}`;
            dayMap[label] = (dayMap[label] || 0) + Number(item.total || item.amount || 0);
          }
        }
      });
    }

    return Object.entries(dayMap).map(([label, value]) => ({ label, value }));
  };

  const loadRevenueData = async () => {
    try {
      const todayStr = getLocalDateStr(new Date());
      const revRes = await reportsApi.revenue({
        reportType: "monthly",
        date: todayStr,
      });
      const chartPoints = buildMonthlyChartData(revRes);
      setRevenueChartData(chartPoints);
    } catch (e) {
      console.error("Failed to load monthly revenue report for dashboard", e);
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
        const dailyIncomeVal = dashboardData?.data?.dailyRevenue ?? dashboardData?.dailyRevenue ?? dashboardData?.data?.totalIncome ?? 4850000;
        setStats({
          todayPatients: dashboardData?.data?.todayPatientsCount ?? dashboardData?.todayPatientsCount ?? 18,
          todayAppointments: dashboardData?.data?.todayAppointmentsCount ?? dashboardData?.todayAppointmentsCount ?? 24,
          totalMedicines: dashboardData?.data?.totalMedicinesCount ?? dashboardData?.totalMedicinesCount ?? 45,
          totalIncome: dailyIncomeVal,
        });
      } catch (err) {
        console.error("Telemetry loading failed", err);
      }
    };

    loadTelemetry();
    loadRevenueData();
  }, []);

  useEffect(() => {
    loadAppointments(page);
  }, [page]);

  const userName = user?.name || "Dr. Thandar Hlaing";

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Dashboard Top Header with Greeting & Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t.dashboard || "Dashboard"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Welcome back, <span className="font-semibold text-foreground">{userName}</span>! Here&apos;s what&apos;s happening today.
          </p>
        </div>

        {/* Dedicated Date Range Filter Dropdown */}
        <div className="relative inline-block self-start sm:self-auto" ref={dateFilterRef}>
          <button
            type="button"
            onClick={() => setDateFilterOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={dateFilterOpen}
            aria-label="Filter dashboard date range"
            className={`inline-flex items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-card/90 px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs hover:bg-secondary/70 transition-all btn-target ${
              dateFilterOpen ? "ring-2 ring-orange-500/50 bg-secondary" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-orange-500 shrink-0" aria-hidden="true" />
              <span className="font-bold">{dateRange}</span>
            </div>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                dateFilterOpen ? "rotate-180 text-foreground" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Dedicated Popover Dropdown Menu */}
          {dateFilterOpen && (
            <div
              role="listbox"
              aria-label="Date range options"
              className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-scms-modal z-40 p-1.5 space-y-1 animate-fadeIn"
            >
              {dateRangeOptions.map((opt) => {
                const isSelected = dateRange === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setDateRange(opt);
                      setDateFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer btn-target ${
                      isSelected
                        ? "bg-orange-500 text-white font-bold shadow-xs"
                        : "text-foreground hover:bg-orange-50 dark:hover:bg-orange-950/60 hover:text-orange-600 dark:hover:text-orange-400 font-medium"
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row of 3 KPI Metric Stat Cards (Total Income, Appointments, Patients) */}
      <section 
        className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        aria-label="Key Performance Indicators"
      >
        <StatCard
          label={t.totalIncome || "Total Income"}
          value={`${Number(stats.totalIncome || 0).toLocaleString()} MMK`}
          icon={CardStackIcon}
          tone="apricot"
          trend="12.5%"
          trendDirection="up"
          onClick={() => navigate("/app/payments")}
          subtitle={t.dailyIncomeSubtitle || "Daily settled billing & income"}
        />
        <StatCard
          label={t.appointments || "Appointments"}
          value={Number(stats.todayAppointments || 0).toLocaleString()}
          icon={CalendarIcon}
          tone="apricot"
          trend="8.2%"
          trendDirection="up"
          onClick={() => navigate("/app/appointments")}
          subtitle="Scheduled appointments"
        />
        <StatCard
          label={t.patients || "Patients"}
          value={Number(stats.todayPatients || 0).toLocaleString()}
          icon={PersonIcon}
          tone="apricot"
          trend="16.3%"
          trendDirection="up"
          onClick={() => navigate("/app/patients")}
          subtitle="Registered clinic patients"
        />
      </section>

      {/* Chart: Income Overview Line/Area Chart for August */}
      <section className="w-full" aria-label="Income Overview Chart">
        <RevenueAreaChart
          title={t.incomeOverview ? `${t.incomeOverview} (August 2026)` : "Income Overview (August 2026)"}
          data={revenueChartData.length > 0 ? revenueChartData : undefined}
          currency="MMK"
          periodOptions={["This Month", "This Week", "Today"]}
          onPeriodChange={(period) => {
            if (period === "This Month") loadRevenueData();
          }}
        />
      </section>

      {/* Bottom Grid: Consultation Queue & Stock Warnings */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Schedule Table */}
        <div className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Today&apos;s Consultation Schedule
            </h2>
            <button
              onClick={() => navigate("/app/appointments")}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              View all slots
            </button>
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
                key: (r) => `${r.tokenNumber || r.appointmentCode || "-"}`,
                cellClassName: "font-mono font-bold text-orange-600 dark:text-orange-400",
              },
              {
                label: t.patient || "Patient",
                key: (row) => row.patientName || row.patient?.name || `Patient #${row.patientId}`,
                cellClassName: "font-bold text-foreground",
              },
              {
                label: "Visit Reason",
                key: (row) => row.notes || row.reason || "General Consultation",
                cellClassName: "text-xs text-muted-foreground truncate max-w-xs",
              },
              {
                label: t.status || "Status",
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

        {/* Right Column: Pharmacy Stock Warnings */}
        <div className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Inventory Alerts</span>
              {alerts.length > 0 && (
                <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-xs font-bold font-mono">
                  {alerts.length}
                </span>
              )}
            </h3>
            <button
              onClick={() => navigate("/app/medicines")}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Catalog
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
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
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          Batch: {alert.batchNo}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-bold text-foreground">
                      {alert.medicineName || alert.name}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-muted-foreground">
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground/70">
                          Current Stock
                        </span>
                        <strong
                          className={
                            isLowStock
                              ? "font-mono font-bold text-rose-600 dark:text-rose-400"
                              : "font-mono text-foreground"
                          }
                        >
                          {alert.currentQuantity ?? 0} units
                        </strong>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground/70">
                          Milestone
                        </span>
                        <strong className="font-mono text-foreground">
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
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No active inventory warnings. All batches in healthy stock.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Appointment Detail Modal */}
      {detailOpen && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                  Token {selectedAppt.tokenNumber || selectedAppt.appointmentCode}
                </span>
                <h3 className="text-base font-bold text-foreground mt-0.5">
                  {selectedAppt.patientName || selectedAppt.patient?.name}
                </h3>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"
                aria-label={t.close || "Close"}
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <strong className="text-foreground font-mono">
                  {String(selectedAppt.datetime || "").replace("T", " ")}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <strong className="text-foreground">
                  {selectedAppt.status}
                </strong>
              </div>
              {selectedAppt.notes && (
                <div className="pt-2 border-t border-border/70">
                  <span className="block font-bold text-foreground mb-1">
                    Visit Notes:
                  </span>
                  <p className="p-3 rounded-xl bg-secondary/50 border border-border/70 italic text-foreground">
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
                {t.close || "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

