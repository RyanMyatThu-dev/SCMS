import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  CalendarIcon,
  CardStackIcon,
  Cross2Icon,
  ExclamationTriangleIcon,
  BarChartIcon,
  CrossCircledIcon,
  TableIcon,
} from "@radix-ui/react-icons";
import StatCard from "../components/StatCard";
import DataTable from "../components/DataTable";
import PaginationControls from "../components/PaginationControls";
import { Select } from "../components/ui/select";
import { useLanguage } from "../context/LanguageContext";
import { appointmentsApi, dashboardsApi, medicinesApi } from "../services/scmsApi";
import { formatDate, formatDateTime } from "../utils/format";
import useScrollLock from "../hooks/useScrollLock";
import ModalPortal from "../components/ModalPortal";

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

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEAR_OPTIONS = [
  { value: 2026, label: "2026" },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const pageSize = 5;

  // Current Date Defaults (Fixed to 2026 for now)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Analytics View State: "daily" vs "weekly"
  const [analyticsView, setAnalyticsView] = useState("daily");
  // Active Metric for Chart: "income" | "appointments" | "cancelled" | "patients"
  const [chartMetric, setChartMetric] = useState("income");
  const [showTable, setShowTable] = useState(false);
  const [hoveredChartPoint, setHoveredChartPoint] = useState(null);

  // Appointments Pagination State
  const [appointments, setAppointments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useScrollLock(detailOpen);

  // Fetch Dashboard Telemetry & Monthly Breakdown
  const loadDashboardTelemetry = async (monthVal, yearVal, periodVal) => {
    try {
      setLoading(true);
      const res = await dashboardsApi.admin({
        month: monthVal,
        year: yearVal,
        period: periodVal,
      });

      if (res?.data || res) {
        const payload = res.data || res;
        setDashboardData(payload);
      }
    } catch (err) {
      console.error("Dashboard metrics loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Alerts
  const loadInventoryAlerts = async () => {
    try {
      const medicineAlerts = await medicinesApi.alerts();
      setAlerts(toArray(medicineAlerts).slice(0, 6));
    } catch (e) {
      console.error("Failed to load inventory alerts", e);
    }
  };

  // Fetch Today's Appointments Schedule
  const loadAppointments = async (pageNum) => {
    try {
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
    }
  };

  useEffect(() => {
    loadDashboardTelemetry(selectedMonth, selectedYear, selectedPeriod);
    loadInventoryAlerts();
  }, [selectedMonth, selectedYear, selectedPeriod]);

  useEffect(() => {
    loadAppointments(page);
  }, [page]);

  // Quick Preset Handlers
  const handleSetCurrentMonth = () => {
    const d = new Date();
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(2026);
    setSelectedPeriod("monthly");
  };

  const handleSetPreviousMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(2026);
    setSelectedPeriod("monthly");
  };

  const handleSetToday = () => {
    const d = new Date();
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(2026);
    setSelectedPeriod("daily");
  };

  const handleSetThisWeek = () => {
    const d = new Date();
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(2026);
    setSelectedPeriod("weekly");
  };

  // Extract Metrics
  const totalIncome = dashboardData?.totalIncome ?? 0;
  const totalAppts = dashboardData?.totalAppointmentsCount ?? 0;
  const cancelledAppts = dashboardData?.cancelledAppointmentsCount ?? 0;
  const totalPatients = dashboardData?.totalPatientsCount ?? 0;
  const monthTitle = dashboardData?.monthName || `${MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label || "Month"} ${selectedYear}`;

  const dailyList = dashboardData?.dailyBreakdown || [];
  const weeklyList = dashboardData?.weeklyBreakdown || [];
  const activeBreakdown = analyticsView === "daily" ? dailyList : weeklyList;

  // Build Chart Points for Active View and Metric
  const getMetricValue = (item, metricKey) => {
    switch (metricKey) {
      case "income":
        return Number(item.income || 0);
      case "appointments":
        return Number(item.appointmentsMade || 0);
      case "cancelled":
        return Number(item.appointmentsCancelled || 0);
      case "patients":
        return Number(item.totalPatients || 0);
      default:
        return 0;
    }
  };

  const chartPoints = activeBreakdown.map((item) => ({
    label: analyticsView === "daily" ? item.dayLabel || `${item.dayNumber}` : item.weekLabel || `Week ${item.weekNumber}`,
    fullLabel: analyticsView === "daily" ? `${item.date} (Day ${item.dayNumber})` : item.weekLabel,
    value: getMetricValue(item, chartMetric),
    income: item.income || 0,
    appointments: item.appointmentsMade || 0,
    cancelled: item.appointmentsCancelled || 0,
    patients: item.totalPatients || 0,
  }));

  // SVG Chart Geometry
  const chartWidth = 720;
  const chartHeight = 220;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 40;
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  const rawValues = chartPoints.map((p) => p.value);
  const maxValRaw = rawValues.length > 0 ? Math.max(...rawValues, chartMetric === "income" ? 50000 : 5) : 10;
  
  // Clean, round tick maximums
  const calculateCleanMax = (val, isIncome) => {
    if (!isIncome) {
      if (val <= 5) return 5;
      if (val <= 10) return 10;
      if (val <= 20) return 20;
      return Math.ceil(val / 10) * 10;
    }
    if (val <= 50000) return 50000;
    if (val <= 100000) return 100000;
    if (val <= 250000) return 250000;
    if (val <= 500000) return 500000;
    if (val <= 1000000) return 1000000;
    return Math.ceil(val / 200000) * 200000;
  };

  const maxVal = calculateCleanMax(maxValRaw, chartMetric === "income");
  const minVal = 0;

  const points = chartPoints.map((pt, idx) => {
    const divisor = Math.max(1, chartPoints.length - 1);
    const x = padLeft + (idx / divisor) * plotWidth;
    const y = padTop + plotHeight - ((pt.value - minVal) / (maxVal - minVal)) * plotHeight;
    return { ...pt, x, y };
  });

  const createSmoothPath = (pts) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 10} ${pts[0].y}`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
    : "";

  const yTicks = [0, maxVal * 0.5, maxVal];
  const formatYLabel = (v) => {
    if (chartMetric === "income") {
      if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
      if (v >= 1000) return `${Math.round(v / 1000)}K`;
      return `${Math.round(v)}`;
    }
    return `${Math.round(v)}`;
  };

  const tickStep = points.length > 15 ? Math.ceil(points.length / 8) : points.length > 8 ? 2 : 1;

  // Smart Tooltip Coordinate and Alignment Calculations
  const getTooltipStyle = (point) => {
    const xPct = (point.x / chartWidth) * 100;
    const yPct = (point.y / chartHeight) * 100;
    const isNearRight = xPct > 70;
    const isNearLeft = xPct < 30;
    const isNearTop = yPct < 40;

    let transform = "";
    if (isNearRight) {
      transform += "translateX(-95%) ";
    } else if (isNearLeft) {
      transform += "translateX(-5%) ";
    } else {
      transform += "translateX(-50%) ";
    }

    if (isNearTop) {
      transform += "translateY(14px)";
    } else {
      transform += "translateY(-100%) translateY(-12px)";
    }

    return {
      left: `${xPct}%`,
      top: `${yPct}%`,
      transform,
    };
  };

  return (
    <main className="space-y-6 animate-fadeIn" role="main" aria-label="Clinic Dashboard">
      {/* Clean Header with Aligned Custom Select Dropdowns & Date Filters */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {t.dashboard || "Dashboard"}
          </h1>
        </div>

        {/* Aligned Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Select for Month (matches design system) */}
          <div className="w-36 sm:w-40">
            <Select
              value={selectedMonth}
              onChange={(val) => {
                setSelectedMonth(Number(val));
                setSelectedPeriod("monthly");
              }}
              options={MONTH_OPTIONS}
              placeholder="Month"
              ariaLabel="Select month"
            />
          </div>

          {/* Custom Select for Year (2026 only for now) */}
          <div className="w-28 sm:w-32">
            <Select
              value={selectedYear}
              onChange={(val) => {
                setSelectedYear(Number(val));
                setSelectedPeriod("monthly");
              }}
              options={YEAR_OPTIONS}
              placeholder="Year"
              ariaLabel="Select year"
            />
          </div>

          {/* Quick Preset Segmented Control */}
          <div className="inline-flex h-11 items-center rounded-2xl border border-border/80 bg-secondary/50 p-1" role="group" aria-label="Quick period presets">
            <button
              type="button"
              onClick={handleSetCurrentMonth}
              className={`h-full px-3 text-xs font-semibold rounded-xl transition-all btn-target flex items-center ${
                selectedPeriod === "monthly" && selectedMonth === now.getMonth() + 1 && selectedYear === 2026
                  ? "bg-orange-500 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={handleSetPreviousMonth}
              className="h-full px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground transition-all btn-target flex items-center"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={handleSetThisWeek}
              className={`h-full px-3 text-xs font-semibold rounded-xl transition-all btn-target flex items-center ${
                selectedPeriod === "weekly" ? "bg-orange-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={handleSetToday}
              className={`h-full px-3 text-xs font-semibold rounded-xl transition-all btn-target flex items-center ${
                selectedPeriod === "daily" ? "bg-orange-500 text-white shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
          </div>
        </div>
      </header>

      {/* Row of 4 Proportionate KPI Metric Stat Cards */}
      <section 
        className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={`Key Performance Indicators for ${monthTitle}`}
      >
        <StatCard
          label={t.totalIncome || "Total Income"}
          value={Number(totalIncome).toLocaleString()}
          unit="MMK"
          icon={CardStackIcon}
          tone="apricot"
          onClick={() => navigate("/app/payments")}
          subtitle={`${monthTitle} revenue`}
        />
        <StatCard
          label="Appointments Made"
          value={Number(totalAppts).toLocaleString()}
          icon={CalendarIcon}
          tone="apricot"
          onClick={() => navigate("/app/appointments")}
          subtitle={`${Number(totalAppts - cancelledAppts)} active / completed`}
        />
        <StatCard
          label="Cancelled Appointments"
          value={Number(cancelledAppts).toLocaleString()}
          icon={CrossCircledIcon}
          tone="danger"
          onClick={() => navigate("/app/appointments")}
          subtitle={totalAppts > 0 ? `${((cancelledAppts / totalAppts) * 100).toFixed(1)}% cancellation rate` : "0% cancellation rate"}
        />
        <StatCard
          label="Total Patients"
          value={Number(totalPatients).toLocaleString()}
          icon={PersonIcon}
          tone="apricot"
          onClick={() => navigate("/app/patients")}
          subtitle="Excludes cancelled bookings"
        />
      </section>

      {/* Modern, Streamlined Overview Section */}
      <section 
        className="rounded-3xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-scms backdrop-blur-sm space-y-5"
        aria-label={`${monthTitle} Overview`}
      >
        {/* Streamlined Section Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
              <BarChartIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <span>Overview</span>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                  {monthTitle}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Resolution Toggle: Daily vs Weekly */}
            <div className="inline-flex rounded-xl border border-border/80 bg-secondary/60 p-0.5" role="tablist" aria-label="Breakdown resolution">
              <button
                type="button"
                role="tab"
                aria-selected={analyticsView === "daily"}
                onClick={() => setAnalyticsView("daily")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all btn-target ${
                  analyticsView === "daily" ? "bg-orange-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={analyticsView === "weekly"}
                onClick={() => setAnalyticsView("weekly")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all btn-target ${
                  analyticsView === "weekly" ? "bg-orange-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Weekly
              </button>
            </div>

            {/* Metric Selector Tabs */}
            <div className="inline-flex rounded-xl border border-border/80 bg-secondary/60 p-0.5" role="group" aria-label="Metric to visualize">
              {[
                { key: "income", label: "Income" },
                { key: "appointments", label: "Appointments" },
                { key: "cancelled", label: "Cancelled" },
                { key: "patients", label: "Patients" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setChartMetric(m.key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all btn-target ${
                    chartMetric === m.key ? "bg-card text-foreground shadow-2xs font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Table Toggle Button */}
            <button
              type="button"
              onClick={() => setShowTable((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border border-border/80 px-2.5 py-1 text-xs font-semibold transition-all btn-target ${
                showTable ? "bg-secondary text-foreground font-bold" : "bg-card text-muted-foreground hover:text-foreground"
              }`}
              aria-label={showTable ? "Hide data table" : "Show data table"}
            >
              <TableIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showTable ? "Hide Table" : "View Table"}</span>
            </button>
          </div>
        </div>

        {/* SVG Area/Line Chart with Non-Clipping Tooltip */}
        <div className="relative w-full overflow-visible select-none pt-2 pb-1">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible"
            role="img"
            aria-label={`${chartMetric} trend chart for ${monthTitle}`}
          >
            <defs>
              <linearGradient id="dashboardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#F97316" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines and Clean Y-axis labels */}
            {yTicks.map((tick, i) => {
              const y = padTop + plotHeight - (tick / maxVal) * plotHeight;
              return (
                <g key={i} className="text-muted-foreground/40">
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={chartWidth - padRight}
                    y2={y}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                    className="text-border/60"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="fill-muted-foreground text-[10px] sm:text-[11px] font-medium font-sans"
                  >
                    {formatYLabel(tick)}
                  </text>
                </g>
              );
            })}

            {/* Smooth Area Gradient Fill */}
            <path d={areaPath} fill="url(#dashboardGrad)" />

            {/* Curve Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#F97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Accessible Interactive Data Points */}
            {points.map((pt, idx) => {
              const isHovered = hoveredChartPoint?.index === idx;
              const showLabel = points.length <= 10 || idx === 0 || idx === points.length - 1 || idx % tickStep === 0;

              return (
                <g
                  key={idx}
                  tabIndex={0}
                  role="button"
                  aria-label={`${pt.label}: ${chartMetric === "income" ? `${Number(pt.value).toLocaleString()} MMK` : pt.value}`}
                  onMouseEnter={() => setHoveredChartPoint({ ...pt, index: idx })}
                  onMouseLeave={() => setHoveredChartPoint(null)}
                  onFocus={() => setHoveredChartPoint({ ...pt, index: idx })}
                  onBlur={() => setHoveredChartPoint(null)}
                  className="cursor-pointer focus-visible:outline-none"
                >
                  <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : points.length > 20 ? 2.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#F97316"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-150"
                  />
                  {showLabel && (
                    <text
                      x={pt.x}
                      y={chartHeight - 12}
                      textAnchor="middle"
                      className={`text-[10px] sm:text-[11px] font-sans transition-colors ${
                        isHovered ? "fill-orange-600 dark:fill-orange-400 font-bold" : "fill-muted-foreground font-medium"
                      }`}
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Smart Non-Clipping Tooltip Overlay */}
          {hoveredChartPoint && (
            <div
              className="pointer-events-none absolute z-30 rounded-2xl bg-card/98 backdrop-blur-md border border-border/80 px-3.5 py-2.5 text-xs shadow-2xl animate-fadeIn whitespace-nowrap transition-all duration-75"
              style={getTooltipStyle(hoveredChartPoint)}
            >
              <div className="text-[11px] text-muted-foreground font-semibold pb-1 border-b border-border/50">
                {hoveredChartPoint.fullLabel || hoveredChartPoint.label}
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-1.5 text-[11px]">
                <span className="text-muted-foreground font-medium">Income:</span>
                <strong className="font-mono text-orange-600 dark:text-orange-400 text-right font-bold">
                  {Number(hoveredChartPoint.income).toLocaleString()} MMK
                </strong>
                <span className="text-muted-foreground font-medium">Appointments:</span>
                <strong className="font-mono text-right text-foreground font-bold">{hoveredChartPoint.appointments}</strong>
                <span className="text-muted-foreground font-medium">Cancelled:</span>
                <strong className="font-mono text-rose-600 dark:text-rose-400 text-right font-bold">{hoveredChartPoint.cancelled}</strong>
                <span className="text-muted-foreground font-medium">Active Patients:</span>
                <strong className="font-mono text-right text-foreground font-bold">{hoveredChartPoint.patients}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible/Expandable Tabular Breakdown */}
        {showTable && (
          <div className="space-y-3 pt-3 border-t border-border/60 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {analyticsView === "daily" ? `Daily Breakdown (${monthTitle})` : `Weekly Breakdown (${monthTitle})`}
              </h3>
              <span className="text-xs text-muted-foreground">
                {activeBreakdown.length} {analyticsView === "daily" ? "days" : "week segments"}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/70 max-h-[280px] overflow-y-auto">
              <table className="w-full text-left text-xs" aria-label={`Breakdown table for ${monthTitle}`}>
                <thead className="bg-secondary/70 text-muted-foreground uppercase text-[10px] tracking-wider font-bold sticky top-0 backdrop-blur-sm z-10">
                  <tr>
                    <th scope="col" className="px-4 py-2.5">
                      {analyticsView === "daily" ? "Date" : "Week Segment"}
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Total Income
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Appointments Made
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Cancelled
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right">
                      Active Patients
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {activeBreakdown.length > 0 ? (
                    activeBreakdown.map((row, idx) => (
                      <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-foreground">
                          {analyticsView === "daily" ? row.dayLabel || row.date : row.weekLabel}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-orange-600 dark:text-orange-400">
                          {Number(row.income || 0).toLocaleString()} MMK
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-foreground">
                          {row.appointmentsMade ?? 0}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                          {row.appointmentsCancelled ?? 0}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-foreground font-bold">
                          {row.totalPatients ?? 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                        No breakdown telemetry available for this month.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-secondary/60 font-bold border-t border-border/80 text-foreground sticky bottom-0">
                  <tr>
                    <td className="px-4 py-2.5">Total for {monthTitle}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-orange-600 dark:text-orange-400 font-extrabold">
                      {Number(totalIncome).toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{totalAppts}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-rose-600 dark:text-rose-400 font-extrabold">{cancelledAppts}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{totalPatients}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Bottom Grid: Consultation Schedule & Inventory Alerts */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-[1.5fr_1fr]" aria-label="Schedule and inventory operational status">
        {/* Left Column: Today's Schedule Table */}
        <div className="rounded-3xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-scms space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground tracking-tight">
              Today&apos;s Consultation Schedule
            </h2>
            <button
              onClick={() => navigate("/app/appointments")}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline btn-target"
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
        <div className="rounded-3xl border border-border/80 bg-card/95 p-5 sm:p-6 shadow-scms space-y-4">
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
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline btn-target"
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
                    className={`rounded-2xl border p-3.5 transition-all ${
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
                        <ExclamationTriangleIcon className="w-3 h-3" aria-hidden="true" />
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
                          {isLowStock ? "Critical Minimum" : formatDate(alert.expiryDate)}
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
      <ModalPortal
        isOpen={detailOpen && Boolean(selectedAppt)}
        onClose={() => setDetailOpen(false)}
      >
        {selectedAppt && (
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
                className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary btn-target"
                aria-label={t.close || "Close"}
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <strong className="text-foreground font-mono">
                  {formatDateTime(selectedAppt.datetime)}
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
        )}
      </ModalPortal>
    </main>
  );
}
