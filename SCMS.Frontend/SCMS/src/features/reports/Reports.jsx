import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import scmsApi from "../../services/scmsApi";

const PRIMARY = "#0052CC";
const SUCCESS = "#027A48";
const WARNING = "#B54708";
const DANGER = "#D92D20";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const num = (v) => Number(v || 0);

const getDate = (item) =>
  item.createdAt ||
  item.datetime ||
  item.paidAt ||
  item.dueAt ||
  item.followUpDate ||
  item.date ||
  item.updatedAt;

const isInRange = (dateValue, type) => {
  if (!dateValue) return false;

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const start = new Date();

  if (type === "daily") {
    return d.toDateString() === now.toDateString();
  }

  if (type === "weekly") {
    start.setDate(now.getDate() - 7);
    return d >= start && d <= now;
  }

  if (type === "monthly") {
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }

  return true;
};

export default function Reports() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [range, setRange] = useState("daily");
  const [loading, setLoading] = useState(true);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const t = {
    title: lang === "mm" ? "အစီရင်ခံစာများ" : "Reports",
    subtitle:
      lang === "mm"
        ? "Daily, Weekly, Monthly data များကို PDF အဖြစ် ထုတ်နိုင်သည်"
        : "Export daily, weekly, and monthly clinic data as a clean PDF report",
    daily: lang === "mm" ? "နေ့စဉ်" : "Daily",
    weekly: lang === "mm" ? "အပတ်စဉ်" : "Weekly",
    monthly: lang === "mm" ? "လစဉ်" : "Monthly",
    export: lang === "mm" ? "PDF ထုတ်မည်" : "Export PDF",
    refresh: lang === "mm" ? "ပြန်တင်မည်" : "Refresh",
    patients: lang === "mm" ? "လူနာများ" : "Patients",
    appointments: lang === "mm" ? "ချိန်းဆိုမှုများ" : "Appointments",
    payments: lang === "mm" ? "ငွေပေးချေမှု" : "Payments",
    medicines: lang === "mm" ? "ဆေးဝါးများ" : "Medicines",
    prescriptions: lang === "mm" ? "ဆေးညွှန်းများ" : "Prescriptions",
    followUps: lang === "mm" ? "Follow-Ups" : "Follow-Ups",
    diseases: lang === "mm" ? "ရောဂါများ" : "Diseases",
    notifications: lang === "mm" ? "အသိပေးချက်များ" : "Notifications",
    revenue: lang === "mm" ? "ဝင်ငွေ" : "Revenue",
    completed: lang === "mm" ? "ပြီးဆုံး" : "Completed",
    pending: lang === "mm" ? "စောင့်ဆိုင်း" : "Pending",
  };

  const loadReports = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        scmsApi.patients.list(),
        scmsApi.appointments.list(),
        scmsApi.payments.list(),
        scmsApi.medicines.list(),
        scmsApi.prescriptions.list(),
        scmsApi.followUps.list(),
        scmsApi.diseases.list(),
        scmsApi.notifications.list(),
      ]);

      const [
        patientRes,
        appointmentRes,
        paymentRes,
        medicineRes,
        prescriptionRes,
        followRes,
        diseaseRes,
        notificationRes,
      ] = results;

      if (patientRes.status === "fulfilled")
        setPatients(toArray(patientRes.value));
      if (appointmentRes.status === "fulfilled")
        setAppointments(toArray(appointmentRes.value));
      if (paymentRes.status === "fulfilled")
        setPayments(toArray(paymentRes.value));
      if (medicineRes.status === "fulfilled")
        setMedicines(toArray(medicineRes.value));
      if (prescriptionRes.status === "fulfilled")
        setPrescriptions(toArray(prescriptionRes.value));
      if (followRes.status === "fulfilled")
        setFollowUps(toArray(followRes.value));
      if (diseaseRes.status === "fulfilled")
        setDiseases(toArray(diseaseRes.value));
      if (notificationRes.status === "fulfilled")
        setNotifications(toArray(notificationRes.value));
    } catch (error) {
      console.error("Reports load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const report = useMemo(() => {
    const fp = patients.filter((x) => isInRange(getDate(x), range));
    const fa = appointments.filter((x) => isInRange(getDate(x), range));
    const fpay = payments.filter((x) => isInRange(getDate(x), range));
    const fpre = prescriptions.filter((x) => isInRange(getDate(x), range));
    const ffol = followUps.filter((x) => isInRange(getDate(x), range));
    const fnoti = notifications.filter((x) => isInRange(getDate(x), range));

    const revenue = fpay.reduce((sum, p) => sum + num(p.amount), 0);

    const completedAppointments = fa.filter((a) =>
      String(a.status || a.appointmentStatus || "")
        .toLowerCase()
        .includes("completed"),
    ).length;

    const pendingAppointments = fa.filter((a) =>
      String(a.status || a.appointmentStatus || "")
        .toLowerCase()
        .includes("pending"),
    ).length;

    const lowStock = medicines.filter((m) => m.hasLowStockWarning).length;
    const nearExpiry = medicines.filter((m) => m.hasNearExpiryWarning).length;

    return {
      patients: fp,
      appointments: fa,
      payments: fpay,
      prescriptions: fpre,
      followUps: ffol,
      notifications: fnoti,
      diseases,
      medicines,
      revenue,
      completedAppointments,
      pendingAppointments,
      lowStock,
      nearExpiry,
    };
  }, [
    range,
    patients,
    appointments,
    payments,
    medicines,
    prescriptions,
    followUps,
    diseases,
    notifications,
  ]);

  const exportPdf = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(0, 82, 204);
    doc.rect(0, 0, pageWidth, 34, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("SCMS Clinic Report", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${range.toUpperCase()} REPORT • ${(() => { const d = new Date(); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; })()}`,
      14,
      25,
    );

    doc.setTextColor(29, 41, 57);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, 46);

    autoTable(doc, {
      startY: 52,
      theme: "grid",
      head: [["Section", "Count / Amount"]],
      body: [
        ["Patients", report.patients.length],
        ["Appointments", report.appointments.length],
        ["Completed Appointments", report.completedAppointments],
        ["Pending Appointments", report.pendingAppointments],
        ["Prescriptions", report.prescriptions.length],
        ["Follow-Ups", report.followUps.length],
        ["Payments", report.payments.length],
        ["Revenue", `MMK ${report.revenue.toLocaleString()}`],
        ["Medicines", report.medicines.length],
        ["Low Stock Medicines", report.lowStock],
        ["Near Expiry Medicines", report.nearExpiry],
        ["Diseases", report.diseases.length],
        ["Notifications", report.notifications.length],
      ],
      headStyles: { fillColor: [0, 82, 204] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Appointment", "Patient", "Date", "Status"]],
      body: report.appointments
        .slice(0, 20)
        .map((a) => [
          a.appointmentCode || a.code || "-",
          a.patientName || a.patient?.name || "-",
          getDate(a) ? (() => { const d = new Date(getDate(a)); return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`; })() : "-",
          a.status || "-",
        ]),
      headStyles: { fillColor: [71, 84, 103] },
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Payment", "Patient", "Method", "Status", "Amount"]],
      body: report.payments
        .slice(0, 20)
        .map((p) => [
          p.id || "-",
          p.patientName || "-",
          p.paymentMethod || "-",
          p.paymentStatus || "-",
          `MMK ${num(p.amount).toLocaleString()}`,
        ]),
      headStyles: { fillColor: [2, 122, 72] },
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Medicine", "Stock", "Price", "Warning"]],
      body: report.medicines
        .slice(0, 20)
        .map((m) => [
          m.name || "-",
          m.totalStock ?? 0,
          `MMK ${num(m.unitPrice).toLocaleString()}`,
          m.hasLowStockWarning
            ? "Low Stock"
            : m.hasNearExpiryWarning
              ? "Near Expiry"
              : "OK",
        ]),
      headStyles: { fillColor: [181, 71, 8] },
      styles: { fontSize: 8 },
    });

    doc.save(`SCMS-${range}-report.pdf`);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={header}>
        <div>
          <h1 style={title}>{t.title}</h1>
          <p style={subtitle}>{t.subtitle}</p>
        </div>

        <div style={actions}>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            style={select}
          >
            <option value="daily">{t.daily}</option>
            <option value="weekly">{t.weekly}</option>
            <option value="monthly">{t.monthly}</option>
          </select>

          <button onClick={loadReports} style={outlineBtn}>
            {loading ? "Loading..." : t.refresh}
          </button>

          <button onClick={exportPdf} style={primaryBtn}>
            {t.export}
          </button>
        </div>
      </div>

      <section style={statsGrid}>
        <Stat
          label={t.revenue}
          value={`MMK ${report.revenue.toLocaleString()}`}
          color={PRIMARY}
        />
        <Stat
          label={t.patients}
          value={report.patients.length}
          color={SUCCESS}
        />
        <Stat
          label={t.appointments}
          value={report.appointments.length}
          color={WARNING}
        />
        <Stat
          label={t.prescriptions}
          value={report.prescriptions.length}
          color={PRIMARY}
        />
        <Stat
          label={t.followUps}
          value={report.followUps.length}
          color={DANGER}
        />
        <Stat
          label={t.medicines}
          value={report.medicines.length}
          color={SUCCESS}
        />
      </section>

      <div style={mainGrid}>
        <section style={card}>
          <h2 style={sectionTitle}>Clinic Performance</h2>

          <div style={barArea}>
            <Bar
              label={t.patients}
              value={report.patients.length}
              max={Math.max(
                report.patients.length,
                report.appointments.length,
                report.prescriptions.length,
                1,
              )}
            />
            <Bar
              label={t.appointments}
              value={report.appointments.length}
              max={Math.max(
                report.patients.length,
                report.appointments.length,
                report.prescriptions.length,
                1,
              )}
            />
            <Bar
              label={t.prescriptions}
              value={report.prescriptions.length}
              max={Math.max(
                report.patients.length,
                report.appointments.length,
                report.prescriptions.length,
                1,
              )}
            />
            <Bar
              label={t.followUps}
              value={report.followUps.length}
              max={Math.max(
                report.patients.length,
                report.appointments.length,
                report.prescriptions.length,
                1,
              )}
            />
          </div>
        </section>

        <section style={card}>
          <h2 style={sectionTitle}>Medicine Alerts</h2>

          <div style={alertBox}>
            <span>{t.medicines}</span>
            <strong>{report.medicines.length}</strong>
          </div>

          <div style={alertBox}>
            <span>Low Stock</span>
            <strong style={{ color: WARNING }}>{report.lowStock}</strong>
          </div>

          <div style={alertBox}>
            <span>Near Expiry</span>
            <strong style={{ color: DANGER }}>{report.nearExpiry}</strong>
          </div>
        </section>
      </div>

      <section style={card}>
        <h2 style={sectionTitle}>Recent Payments</h2>

        <div style={table}>
          <div style={thead}>
            <span>Patient</span>
            <span>Method</span>
            <span>Status</span>
            <span>Amount</span>
          </div>

          {report.payments.length === 0 ? (
            <div style={empty}>No payment data.</div>
          ) : (
            report.payments.slice(0, 8).map((p, i) => (
              <div key={i} style={row}>
                <span>{p.patientName || "-"}</span>
                <span>{p.paymentMethod || "-"}</span>
                <span>{p.paymentStatus || "-"}</span>
                <strong>MMK {num(p.amount).toLocaleString()}</strong>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={statCard}>
      <p style={statLabel}>{label}</p>
      <h2 style={{ ...statValue, color }}>{value}</h2>
    </div>
  );
}

function Bar({ label, value, max }) {
  const pct = Math.max(8, Math.round((value / max) * 100));

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={barTop}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div style={barBg}>
        <div style={{ ...barFill, width: `${pct}%` }} />
      </div>
    </div>
  );
}

const header = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 22,
};

const title = {
  color: TEXT,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.04em",
};

const subtitle = {
  color: MUTED,
  marginTop: 6,
  fontSize: 14,
};

const actions = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const select = {
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: TEXT,
  borderRadius: 12,
  padding: "11px 14px",
  fontWeight: 800,
  outline: "none",
};

const primaryBtn = {
  border: 0,
  background: PRIMARY,
  color: "white",
  borderRadius: 12,
  padding: "11px 15px",
  fontWeight: 800,
  cursor: "pointer",
};

const outlineBtn = {
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: TEXT,
  borderRadius: 12,
  padding: "11px 15px",
  fontWeight: 800,
  cursor: "pointer",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
  gap: 16,
  marginBottom: 18,
};

const statCard = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};

const statLabel = {
  color: MUTED,
  fontSize: 12,
  fontWeight: 800,
};

const statValue = {
  fontSize: 26,
  fontWeight: 900,
  marginTop: 8,
};

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1.5fr 0.8fr",
  gap: 18,
  marginBottom: 18,
};

const card = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 20,
  marginBottom: 18,
};

const sectionTitle = {
  color: TEXT,
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 16,
};

const barArea = {
  display: "grid",
  gap: 16,
};

const barTop = {
  display: "flex",
  justifyContent: "space-between",
  color: TEXT,
  fontSize: 14,
};

const barBg = {
  height: 10,
  borderRadius: 999,
  background: "#EEF2F6",
  overflow: "hidden",
};

const barFill = {
  height: "100%",
  borderRadius: 999,
  background: PRIMARY,
};

const alertBox = {
  background: BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  padding: 14,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
};

const table = {
  border: `1px solid ${BORDER}`,
  borderRadius: 14,
  overflow: "hidden",
};

const thead = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
  background: BG,
  padding: 14,
  color: MUTED,
  fontSize: 12,
  fontWeight: 900,
};

const row = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
  padding: 14,
  borderTop: `1px solid ${BORDER}`,
  color: TEXT,
};

const empty = {
  padding: 24,
  textAlign: "center",
  color: MUTED,
};
