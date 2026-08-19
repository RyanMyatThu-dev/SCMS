import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActivityLogIcon,
  PlayIcon,
  CheckCircledIcon,
  ClockIcon,
  ReloadIcon,
  HeartIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";
import { appointmentsApi } from "../../services/scmsApi";
import { showAlert, showError } from "../../services/dialogs";
import { useLanguage } from "../../context/LanguageContext";

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

export default function DoctorDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [callingNext, setCallingNext] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadTodayQueue = useCallback(async () => {
    try {
      setLoading(true);
      const todayStr = getLocalDateStr(new Date());
      const res = await appointmentsApi.list({
        pageSize: 50,
        startDate: todayStr,
        endDate: `${todayStr}T23:59:59`,
      });
      setAppointments(toArray(res));
    } catch (err) {
      console.error("Doctor queue loading error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayQueue();
    const handleRefresh = () => loadTodayQueue();
    window.addEventListener("scms:refresh-queue", handleRefresh);
    return () => window.removeEventListener("scms:refresh-queue", handleRefresh);
  }, [loadTodayQueue]);

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const res = await appointmentsApi.callNext();
      const nextToken = res?.tokenNumber || res?.data?.tokenNumber || "Next Patient";
      await showAlert(`Calling Token #${nextToken} to the Consultation Room.`, "Patient Called");
      loadTodayQueue();
    } catch (err) {
      showError(err?.response?.data?.message || "No more waiting patients in queue.");
    } finally {
      setCallingNext(false);
    }
  };

  const waitingList = appointments.filter(
    (a) =>
      String(a.status || "").toLowerCase() === "pending" ||
      String(a.status || "").toLowerCase() === "confirmed" ||
      String(a.status || "").toLowerCase() === "requested" ||
      String(a.status || "").toLowerCase() === "waiting"
  );

  const inConsult = appointments.find(
    (a) =>
      String(a.status || "").toLowerCase() === "in consultation" ||
      String(a.status || "").toLowerCase() === "active" ||
      String(a.status || "").toLowerCase() === "in_progress"
  );

  const completedToday = appointments.filter(
    (a) =>
      String(a.status || "").toLowerCase() === "completed" ||
      String(a.status || "").toLowerCase() === "finished"
  );

  const filteredList =
    filterStatus === "waiting"
      ? waitingList
      : filterStatus === "completed"
      ? completedToday
      : appointments;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header with 1-Click Call Next */}
      <PageHeader
        title={t.doctorQueue}
        subtitle="Manage live patient queue, review arrival tokens, and proceed directly to EMR consultation."
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={loadTodayQueue}
              className="scms-btn-outline px-3 btn-target"
              title={t.refresh}
              aria-label={t.refresh}
            >
              <ReloadIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleCallNext}
              disabled={callingNext || waitingList.length === 0}
              className="scms-btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md btn-target"
            >
              {callingNext ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <PlayIcon className="w-4 h-4" />
              )}
              <span>{t.callNextPatient}</span>
            </button>
          </div>
        }
      />

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label={t.queueWaiting}
          value={waitingList.length}
          icon={ClockIcon}
          tone="warning"
          subtitle={`${waitingList.length} patients ready in waiting area`}
        />
        <StatCard
          label={t.queueInConsult}
          value={inConsult ? 1 : 0}
          icon={ActivityLogIcon}
          tone="primary"
          subtitle={
            inConsult
              ? `Token #${inConsult.tokenNumber || inConsult.appointmentCode} (${
                  inConsult.patientName || inConsult.patient?.name || "Patient"
                })`
              : "No active consultation"
          }
        />
        <StatCard
          label={t.queueCompleted}
          value={completedToday.length}
          icon={CheckCircledIcon}
          tone="success"
          subtitle="Finished consultations today"
        />
      </section>

      {/* Active Consultation Spotlight Banner */}
      {inConsult ? (
        <section className="rounded-3xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/70 dark:bg-orange-950/40 p-6 shadow-scms">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
                  Current Patient
                </span>
                <span className="font-mono text-xs font-bold text-orange-700 dark:text-orange-300">
                  Token #{inConsult.tokenNumber || inConsult.appointmentCode}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {inConsult.patientName || inConsult.patient?.name || `Patient #${inConsult.patientId}`}
              </h2>
              {inConsult.notes && (
                <p className="text-xs text-muted-foreground italic">
                  &ldquo;{inConsult.notes}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={() => navigate(`/doctor/consult/${inConsult.id || inConsult.appointmentId || inConsult.appointmentCode}`)}
              className="scms-btn-primary flex items-center justify-center gap-2 shadow-scms btn-target rounded-2xl"
            >
              <HeartIcon className="w-4 h-4" />
              <span>{t.startConsultation}</span>
            </button>
          </div>
        </section>
      ) : waitingList.length > 0 ? (
        <section className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">
              Next Patient in Line: Token #{waitingList[0].tokenNumber || waitingList[0].appointmentCode}
            </h3>
            <p className="text-xs text-muted-foreground">
              {waitingList[0].patientName || waitingList[0].patient?.name} is ready for consultation.
            </p>
          </div>
          <button
            onClick={() => navigate(`/doctor/consult/${waitingList[0].id || waitingList[0].appointmentId || waitingList[0].appointmentCode}`)}
            className="scms-btn-primary flex items-center gap-2 btn-target rounded-2xl"
          >
            <PlayIcon className="w-4 h-4" />
            <span>{t.startConsultation}</span>
          </button>
        </section>
      ) : null}

      {/* Queue Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Today&apos;s Queue Roster
          </h2>
          <div className="flex items-center gap-2">
            {["all", "waiting", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize transition-colors btn-target ${
                  filterStatus === st
                    ? "bg-orange-500 text-white shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          loading={loading}
          rows={filteredList}
          showIndex
          onRowClick={(row) =>
            navigate(`/doctor/consult/${row.id || row.appointmentId || row.appointmentCode}`)
          }
          columns={[
            {
              label: "Token",
              key: (r) => `#${r.tokenNumber || r.appointmentCode || "-"}`,
              cellClassName: "font-mono font-bold text-indigo-600 dark:text-indigo-400",
            },
            {
              label: t.patient,
              key: (r) => r.patientName || r.patient?.name || `Patient #${r.patientId}`,
            },
            {
              label: "Visit Notes / Reason",
              key: (r) => r.notes || r.reason || "General Medical Examination",
              cellClassName: "text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs",
            },
            {
              label: t.status,
              key: (r) => r.status || r.appointmentStatus,
              type: "status",
            },
          ]}
          actions={(row) => (
            <button
              onClick={() =>
                navigate(`/doctor/consult/${row.id || row.appointmentId || row.appointmentCode}`)
              }
              className="scms-btn-outline px-3 h-8 min-h-8 text-xs font-semibold btn-target"
            >
              Consult
            </button>
          )}
        />
      </section>
    </div>
  );
}
