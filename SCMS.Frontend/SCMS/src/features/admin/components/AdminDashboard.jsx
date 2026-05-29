import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const SUCCESS = "#027A48";
const WARNING = "#B54708";
const DANGER = "#D92D20";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const styles = `
* { box-sizing: border-box; }

.dashboard-page {
  width: 100%;
  background: ${BG};
  color: ${TEXT};
  font-family: Inter, Manrope, system-ui, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.page-title {
  font-size: 30px;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin: 0;
}

.page-subtitle {
  margin-top: 6px;
  color: ${MUTED};
  font-size: 14px;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: ${PRIMARY};
  color: white;
}

.btn-outline {
  background: ${CARD};
  color: ${TEXT};
  border: 1px solid ${BORDER};
}

.alert {
  margin-bottom: 18px;
  color: ${DANGER};
  background: #FFF1F0;
  border: 1px solid #FECDCA;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.stat-card {
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 1px 2px rgba(16,24,40,0.04);
}

.stat-label {
  color: ${MUTED};
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.stat-value {
  margin-top: 8px;
  font-size: 30px;
  font-weight: 900;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.85fr);
  gap: 18px;
  margin-bottom: 18px;
}

.card {
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 18px;
  overflow: hidden;
}

.card-header {
  padding: 18px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.section-title {
  font-size: 18px;
  font-weight: 900;
}

.section-subtitle {
  margin-top: 4px;
  color: ${MUTED};
  font-size: 13px;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 80px minmax(170px, 1.1fr) minmax(180px, 1fr) 96px 110px;
  gap: 12px;
  align-items: center;
}

.table-head {
  padding: 12px 20px;
  background: #F9FAFB;
  border-top: 1px solid ${BORDER};
  border-bottom: 1px solid ${BORDER};
}

.table-head div {
  color: ${MUTED};
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.table-row {
  padding: 14px 20px;
  border-bottom: 1px solid ${BORDER};
}

.token {
  color: ${PRIMARY};
  font-weight: 900;
}

.patient-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${PRIMARY};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
}

.patient-name {
  font-weight: 900;
}

.patient-meta,
.cell-text {
  color: ${MUTED};
  font-size: 13px;
  line-height: 1.5;
}

.pill {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 900;
}

.pill-waiting {
  background: #FFFAEB;
  color: ${WARNING};
  border: 1px solid #FEDF89;
}

.pill-in-progress {
  background: ${PRIMARY_LIGHT};
  color: ${PRIMARY};
  border: 1px solid #B2CCFF;
}

.pill-done {
  background: #ECFDF3;
  color: ${SUCCESS};
  border: 1px solid #A9EFC5;
}

.pill-critical {
  background: #FFF1F0;
  color: ${DANGER};
  border: 1px solid #FECDCA;
}

.badge {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 900;
}

.badge-success {
  background: #ECFDF3;
  color: ${SUCCESS};
  border: 1px solid #A9EFC5;
}

.badge-danger {
  background: #FFF1F0;
  color: ${DANGER};
  border: 1px solid #FECDCA;
}

.summary-card {
  background: linear-gradient(150deg, #0052CC 0%, #003D99 100%);
  color: white;
  padding: 22px;
  border: 0;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.summary-badge {
  background: rgba(255,255,255,0.16);
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 900;
}

.revenue-label {
  color: rgba(255,255,255,0.76);
  font-size: 13px;
}

.revenue {
  margin-top: 6px;
  font-size: 38px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.metric {
  margin-top: 16px;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  color: rgba(255,255,255,0.9);
  font-size: 13px;
  font-weight: 700;
}

.progress {
  height: 7px;
  background: rgba(255,255,255,0.22);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: white;
  border-radius: 999px;
}

.patient-flow {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255,255,255,0.18);
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.list {
  padding: 8px 0;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 20px;
  border-top: 1px solid ${BORDER};
}

.list-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: ${PRIMARY_LIGHT};
  color: ${PRIMARY};
  display: flex;
  align-items: center;
  justify-content: center;
}

.list-title {
  font-size: 14px;
  font-weight: 900;
}

.list-sub {
  color: ${MUTED};
  font-size: 12px;
  margin-top: 3px;
}

.empty {
  padding: 24px;
  color: ${MUTED};
  text-align: center;
}

.skeleton {
  animation: shimmer 1.2s infinite linear;
  background: linear-gradient(to right, #F2F4F7 8%, #EAECF0 18%, #F2F4F7 33%);
  background-size: 800px 104px;
  border-radius: 8px;
}

.skeleton-light {
  animation: shimmer 1.2s infinite linear;
  background: linear-gradient(to right, rgba(255,255,255,0.12) 8%, rgba(255,255,255,0.24) 18%, rgba(255,255,255,0.12) 33%);
  background-size: 800px 104px;
  border-radius: 8px;
}

.skeleton-text {
  height: 12px;
}

.spinner-ring-dark {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0,82,204,0.15);
  border-top-color: ${PRIMARY};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
}

@media (max-width: 1100px) {
  .content-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .table-head,
  .table-row {
    grid-template-columns: 70px 1fr 100px;
  }

  .table-head div:nth-child(3),
  .table-head div:nth-child(4),
  .table-row > div:nth-child(3),
  .table-row > div:nth-child(4) {
    display: none;
  }

  .page-title {
    font-size: 24px;
  }
}
`;

const apiEndpoints = {
  dashboard: "/Dashboards/dashboard",
  patients: "/Patients",
  appointments: "/Appointments",
  callNext: "/Appointments/call-next",
  prescriptions: "/Prescriptions",
  followUps: "/FollowUps",
  payments: "/Payments",
  notifications: "/Notifications",
};

const chartData = [
  { label: "MON", sch: 8, wlk: 4 },
  { label: "TUE", sch: 12, wlk: 6 },
  { label: "WED", sch: 15, wlk: 9 },
  { label: "THU", sch: 7, wlk: 5 },
  { label: "FRI", sch: 18, wlk: 11 },
  { label: "SAT", sch: 10, wlk: 7 },
  { label: "SUN", sch: 5, wlk: 3 },
];

const safeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const pickNumber = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (!Number.isNaN(number) && value !== undefined && value !== null) {
      return number;
    }
  }
  return 0;
};

const getName = (item) =>
  item?.patientName ||
  item?.name ||
  item?.fullName ||
  item?.patient?.name ||
  item?.patient?.fullName ||
  item?.user?.name ||
  "Unknown Patient";

const getInitials = (name) =>
  String(name || "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const normalizeStatus = (value) => {
  const s = String(value || "waiting").toLowerCase();

  if (s.includes("progress") || s.includes("called") || s.includes("active")) {
    return "in-progress";
  }

  if (
    s.includes("complete") ||
    s.includes("done") ||
    s.includes("paid") ||
    s.includes("ready")
  ) {
    return "done";
  }

  if (s.includes("urgent") || s.includes("critical")) {
    return "critical";
  }

  return "waiting";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function NavIcon() {
  return (
    <svg
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <line x1="12" y1="7" x2="12" y2="12" />
      <line x1="12" y1="12" x2="15" y2="14" />
    </svg>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map((d) => Math.max(d.sch, d.wlk)), 1);

  return (
    <div
      style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 82 }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 7,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 58,
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
            }}
          >
            <div
              style={{
                flex: 1,
                height: `${(d.sch / max) * 58}px`,
                background: "white",
                borderRadius: "6px 6px 0 0",
              }}
            />
            <div
              style={{
                flex: 1,
                height: `${(d.wlk / max) * 58}px`,
                background: "rgba(255,255,255,0.42)",
                borderRadius: "6px 6px 0 0",
              }}
            />
          </div>

          <span
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [calling, setCalling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [dashboard, setDashboard] = useState({});
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setApiError("");

      const results = await Promise.allSettled([
        api.get(apiEndpoints.dashboard),
        api.get(apiEndpoints.patients),
        api.get(apiEndpoints.appointments),
        api.get(apiEndpoints.prescriptions),
        api.get(apiEndpoints.followUps),
        api.get(apiEndpoints.payments),
        api.get(apiEndpoints.notifications),
      ]);

      const [
        dashboardRes,
        patientsRes,
        appointmentsRes,
        prescriptionsRes,
        followUpsRes,
        paymentsRes,
        notificationsRes,
      ] = results;

      if (dashboardRes.status === "fulfilled") {
        setDashboard(
          dashboardRes.value.data?.data || dashboardRes.value.data || {},
        );
      }

      if (patientsRes.status === "fulfilled") {
        setPatients(safeArray(patientsRes.value.data));
      }

      if (appointmentsRes.status === "fulfilled") {
        setAppointments(safeArray(appointmentsRes.value.data));
      }

      if (prescriptionsRes.status === "fulfilled") {
        setPrescriptions(safeArray(prescriptionsRes.value.data));
      }

      if (followUpsRes.status === "fulfilled") {
        setFollowUps(safeArray(followUpsRes.value.data));
      }

      if (paymentsRes.status === "fulfilled") {
        setPayments(safeArray(paymentsRes.value.data));
      }

      if (notificationsRes.status === "fulfilled") {
        setNotifications(safeArray(notificationsRes.value.data));
      }

      if (results.some((result) => result.status === "rejected")) {
        setApiError(
          "Some APIs failed. Dashboard is showing available data only.",
        );
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      setApiError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleCallNext = async () => {
    try {
      setCalling(true);
      await api.post(apiEndpoints.callNext);

      const res = await api.get(apiEndpoints.appointments);
      setAppointments(safeArray(res.data));
    } catch (error) {
      console.error("Call next error:", error);
      setApiError("Call Next failed. Please check appointment API.");
    } finally {
      setCalling(false);
    }
  };

  const dateStr = currentTime.toLocaleDateString("en-MY", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const statusLabel = {
    "in-progress": "In Progress",
    waiting: "Waiting",
    critical: "Critical",
    done: "Done",
  };

  const statusClass = {
    "in-progress": "pill-in-progress",
    waiting: "pill-waiting",
    critical: "pill-critical",
    done: "pill-done",
  };

  const queue = useMemo(
    () =>
      appointments.slice(0, 6).map((item, index) => {
        const name = getName(item);
        const status = normalizeStatus(
          item?.status || item?.appointmentStatus || item?.queueStatus,
        );

        return {
          id: item?.id || item?.appointmentId || index + 1,
          name,
          age: item?.age || item?.patientAge || item?.patient?.age || "-",
          reason:
            item?.reason ||
            item?.symptoms ||
            item?.description ||
            item?.notes ||
            "Consultation",
          status,
          wait:
            item?.waitTime ||
            item?.estimatedWaitTime ||
            item?.queueTime ||
            (status === "in-progress" ? "Now" : "Waiting"),
          token:
            item?.tokenNo ||
            item?.queueNo ||
            item?.token ||
            `Q-${String(index + 1).padStart(2, "0")}`,
          avatar:
            status === "critical"
              ? DANGER
              : index % 2 === 0
                ? PRIMARY
                : "#475467",
        };
      }),
    [appointments],
  );

  const recentFollowUps = useMemo(
    () =>
      followUps.slice(0, 4).map((item) => ({
        id: item?.id || item?.followUpId,
        name: getName(item),
        date: formatDateTime(
          item?.date ||
            item?.followUpDate ||
            item?.appointmentDate ||
            item?.createdAt,
        ),
        reason:
          item?.recommendation ||
          item?.reason ||
          item?.notes ||
          item?.description ||
          "Follow-up consultation",
        urgent: Boolean(
          item?.urgent ||
          item?.isUrgent ||
          normalizeStatus(item?.status) === "critical",
        ),
      })),
    [followUps],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Patients",
        value: pickNumber(
          dashboard?.totalPatients,
          dashboard?.patientCount,
          patients.length,
        ),
        badge: "+3%",
        color: PRIMARY,
      },
      {
        label: "Today's Appts",
        value: pickNumber(
          dashboard?.todayAppointments,
          dashboard?.appointmentsToday,
          dashboard?.appointmentCount,
          appointments.length,
        ),
        badge: "Live",
        color: "#475467",
      },
      {
        label: "In Queue",
        value: pickNumber(
          dashboard?.queueCount,
          dashboard?.inQueue,
          queue.length,
        ),
        color: "#7A5AF8",
      },
      {
        label: "Follow-Ups",
        value: pickNumber(
          dashboard?.followUps,
          dashboard?.followUpCount,
          followUps.length,
        ),
        color: "#0E7090",
      },
      {
        label: "Prescriptions",
        value: pickNumber(
          dashboard?.prescriptions,
          dashboard?.prescriptionCount,
          prescriptions.length,
        ),
        badge: "Today",
        color: PRIMARY,
      },
    ],
    [dashboard, patients, appointments, queue, followUps, prescriptions],
  );

  const summary = useMemo(() => {
    const completedAppointments = appointments.filter(
      (item) =>
        normalizeStatus(item?.status || item?.appointmentStatus) === "done",
    ).length;

    const completedPrescriptions = prescriptions.filter(
      (item) => normalizeStatus(item?.status) === "done",
    ).length;

    const totalRevenue = payments.reduce(
      (sum, item) =>
        sum +
        pickNumber(
          item?.amount,
          item?.totalAmount,
          item?.paidAmount,
          item?.price,
        ),
      0,
    );

    return {
      revenue: pickNumber(
        dashboard?.revenueToday,
        dashboard?.todayRevenue,
        dashboard?.totalRevenue,
        totalRevenue,
      ),
      consultations: {
        val: `${completedAppointments}/${appointments.length || 0}`,
        pct: appointments.length
          ? Math.round((completedAppointments / appointments.length) * 100)
          : 0,
      },
      prescriptions: {
        val: `${completedPrescriptions}/${prescriptions.length || 0}`,
        pct: prescriptions.length
          ? Math.round((completedPrescriptions / prescriptions.length) * 100)
          : 0,
      },
    };
  }, [dashboard, appointments, prescriptions, payments]);

  return (
    <>
      <style>{styles}</style>

      <main className="dashboard-page">
        <header className="dashboard-header">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Clinic A • {dateStr}</p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              className="btn btn-outline"
              onClick={loadDashboardData}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-ring-dark" />
                  Loading
                </>
              ) : (
                "Refresh"
              )}
            </button>

            <button
              className="btn btn-primary"
              onClick={() => navigate("/admin/appointments")}
            >
              + New Appointment
            </button>
          </div>
        </header>

        {apiError ? <div className="alert">{apiError}</div> : null}

        <section className="stats-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div className="stat-icon" />
                {stat.badge ? (
                  <span className="badge badge-success">{stat.badge}</span>
                ) : null}
              </div>

              <div className="stat-label">{stat.label}</div>
              <div className="stat-value" style={{ color: stat.color }}>
                {loading ? "..." : stat.value}
              </div>
            </article>
          ))}
        </section>

        <section className="content-grid">
          <article className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Patient Queue</div>
                <div className="section-subtitle">
                  Today's appointments and walk-ins
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span className="badge badge-success">Live</span>
                <button className="btn btn-primary" onClick={handleCallNext}>
                  {calling ? "Calling..." : "Call Next"}
                </button>
              </div>
            </div>

            <div className="table-head">
              {["Token", "Patient", "Reason", "Wait", "Status"].map((head) => (
                <div key={head}>{head}</div>
              ))}
            </div>

            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="table-row">
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: 45 }}
                  />
                  <div className="patient-cell">
                    <div
                      className="avatar skeleton"
                      style={{ background: "#EAECF0" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "70%" }}
                      />
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "40%", marginTop: 6 }}
                      />
                    </div>
                  </div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "65%" }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "45%" }}
                  />
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: 75 }}
                  />
                </div>
              ))
            ) : queue.length === 0 ? (
              <div className="empty">No appointments found.</div>
            ) : (
              queue.map((patient) => (
                <div key={patient.id} className="table-row">
                  <div className="token">{patient.token}</div>

                  <div className="patient-cell">
                    <div
                      className="avatar"
                      style={{ background: patient.avatar }}
                    >
                      {getInitials(patient.name)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div className="patient-name">{patient.name}</div>
                      <div className="patient-meta">Age {patient.age}</div>
                    </div>
                  </div>

                  <div className="cell-text">{patient.reason}</div>
                  <div className="cell-text">{patient.wait}</div>

                  <div>
                    <span className={`pill ${statusClass[patient.status]}`}>
                      {statusLabel[patient.status]}
                    </span>
                  </div>
                </div>
              ))
            )}
          </article>

          <article className="card summary-card">
            <div className="summary-top">
              <div className="section-title" style={{ color: "white" }}>
                Today's Summary
              </div>
              <span className="summary-badge">Daily</span>
            </div>

            <div>
              <div className="revenue-label">Revenue Collected</div>
              <div className="revenue">
                {loading ? (
                  <div
                    className="skeleton-light"
                    style={{ width: 160, height: 38 }}
                  />
                ) : (
                  <>MMK {summary.revenue.toLocaleString()}</>
                )}
              </div>
            </div>

            {[
              {
                label: "Consultations",
                pct: summary.consultations.pct,
                val: summary.consultations.val,
              },
              {
                label: "Prescriptions",
                pct: summary.prescriptions.pct,
                val: summary.prescriptions.val,
              },
            ].map((metric) => (
              <div key={metric.label} className="metric">
                <div className="metric-row">
                  <span>{metric.label}</span>
                  <span>{loading ? "-" : metric.val}</span>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{ width: `${loading ? 0 : metric.pct}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="patient-flow">
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 900,
                  marginBottom: 14,
                }}
              >
                Patient Flow
              </div>
              <MiniBarChart data={chartData} />
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Upcoming Follow-Ups</div>
                <div className="section-subtitle">Patients who need review</div>
              </div>

              <button
                className="btn btn-outline"
                onClick={() => navigate("/admin/followups")}
              >
                View All
              </button>
            </div>

            <div className="list">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="list-item">
                    <div className="list-icon skeleton" />
                    <div style={{ flex: 1 }}>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "50%" }}
                      />
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "75%", marginTop: 6 }}
                      />
                    </div>
                  </div>
                ))
              ) : recentFollowUps.length === 0 ? (
                <div className="empty">No follow-ups found.</div>
              ) : (
                recentFollowUps.map((followUp, index) => (
                  <div key={followUp.id || index} className="list-item">
                    <div
                      className="list-icon"
                      style={{
                        background: followUp.urgent ? "#FFF1F0" : PRIMARY_LIGHT,
                        color: followUp.urgent ? DANGER : PRIMARY,
                      }}
                    >
                      <NavIcon />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="list-title">{followUp.name}</div>
                      <div className="list-sub">{followUp.reason}</div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {followUp.urgent ? (
                        <span className="badge badge-danger">Urgent</span>
                      ) : null}
                      <div className="list-sub">{followUp.date}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card">
            <div className="card-header">
              <div>
                <div className="section-title">Recent Notifications</div>
                <div className="section-subtitle">
                  System and patient alerts
                </div>
              </div>

              <button
                className="btn btn-outline"
                onClick={() => navigate("/admin/notifications")}
              >
                View All
              </button>
            </div>

            <div className="list">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="list-item">
                    <div className="list-icon skeleton" />
                    <div style={{ flex: 1 }}>
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "55%" }}
                      />
                      <div
                        className="skeleton skeleton-text"
                        style={{ width: "80%", marginTop: 6 }}
                      />
                    </div>
                  </div>
                ))
              ) : notifications.length === 0 ? (
                <div className="empty">No notifications found.</div>
              ) : (
                notifications.slice(0, 4).map((item, index) => (
                  <div key={item?.id || index} className="list-item">
                    <div className="list-icon">N</div>

                    <div style={{ flex: 1 }}>
                      <div className="list-title">
                        {item?.title || "Notification"}
                      </div>
                      <div className="list-sub">
                        {item?.description || item?.message || "-"}
                      </div>
                    </div>

                    <div className="list-sub">
                      {formatDateTime(item?.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
