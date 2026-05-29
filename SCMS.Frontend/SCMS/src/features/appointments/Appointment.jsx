import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import scmsApi from "../../services/scmsApi";

const PRIMARY = "#0052CC";
const PRIMARY_DARK = "#003D99";
const PRIMARY_LIGHT = "#EBF2FF";
const SUCCESS = "#027A48";
const WARNING = "#B54708";
const DANGER = "#D92D20";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const steps = ["Patient", "Schedule", "Review"];

const emptyForm = {
  patientId: "",
  datetime: "",
  notes: "",
  status: "pending",
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const getPatientId = (p) => p.patientId || p.patient_id || p.id;
const getPatientName = (p) =>
  p.name || p.fullName || p.patientName || "Unknown Patient";

export default function Appointments() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [activeStep, setActiveStep] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === "mm" ? "ချိန်းဆိုမှုများ" : "Appointments",
    subtitle:
      lang === "mm"
        ? "လူနာချိန်းဆိုမှုများ၊ queue နှင့် status များကို စီမံပါ"
        : "Manage patient appointments, queue, and status",
    newAppointment: lang === "mm" ? "ချိန်းဆိုမှုအသစ်" : "New Appointment",
    patient: lang === "mm" ? "လူနာ" : "Patient",
    schedule: lang === "mm" ? "အချိန်ဇယား" : "Schedule",
    review: lang === "mm" ? "ပြန်စစ်ရန်" : "Review",
    selectPatient: lang === "mm" ? "လူနာရွေးပါ" : "Select patient",
    dateTime: lang === "mm" ? "နေ့ရက်နှင့်အချိန်" : "Date & Time",
    notes: lang === "mm" ? "မှတ်ချက်" : "Notes",
    status: lang === "mm" ? "အခြေအနေ" : "Status",
    back: lang === "mm" ? "နောက်သို့" : "Back",
    next: lang === "mm" ? "ရှေ့သို့" : "Next",
    create: lang === "mm" ? "ချိန်းဆိုမှုလုပ်မည်" : "Create Appointment",
    list: lang === "mm" ? "ချိန်းဆိုမှုစာရင်း" : "Appointment List",
    callNext: lang === "mm" ? "နောက်လူနာခေါ်မည်" : "Call Next",
    search: lang === "mm" ? "လူနာအမည်ဖြင့်ရှာပါ..." : "Search appointments...",
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [appointmentRes, patientRes] = await Promise.allSettled([
        scmsApi.appointments.list(),
        scmsApi.patients.list(),
      ]);

      if (appointmentRes.status === "fulfilled") {
        setAppointments(toArray(appointmentRes.value));
      }

      if (patientRes.status === "fulfilled") {
        setPatients(toArray(patientRes.value));
      }
    } catch (error) {
      console.error("Appointment load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPatient = useMemo(() => {
    return patients.find(
      (p) => String(getPatientId(p)) === String(form.patientId),
    );
  }, [patients, form.patientId]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const name =
        a.patientName || a.patient?.name || a.patient?.fullName || a.name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [appointments, search]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const nextStep = () => {
    if (activeStep === 0 && !form.patientId) {
      alert(lang === "mm" ? "လူနာရွေးပါ" : "Please select a patient");
      return;
    }

    if (activeStep === 1 && !form.datetime) {
      alert(
        lang === "mm"
          ? "နေ့ရက်နှင့်အချိန်ထည့်ပါ"
          : "Please choose date and time",
      );
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const resetWizard = () => {
    setActiveStep(0);
    setForm(emptyForm);
  };

  const createAppointment = async () => {
    try {
      setSaving(true);

      const payload = {
        patientId: Number(form.patientId),
        datetime: form.datetime,
        status: form.status,
        notes: form.notes,
      };

      await scmsApi.appointments.create(payload);
      resetWizard();
      await loadData();
    } catch (error) {
      console.error("Create appointment error:", error);
      alert("Appointment create failed. Please check backend request body.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (appointment, status) => {
    try {
      const id = appointment.id || appointment.appointmentId;
      await scmsApi.appointments.updateStatus(id, { status });
      await loadData();
    } catch (error) {
      console.error("Status update error:", error);
      alert("Status update failed.");
    }
  };

  const callNext = async () => {
    try {
      await scmsApi.appointments.callNext();
      await loadData();
    } catch (error) {
      console.error("Call next error:", error);
      alert("Call next failed.");
    }
  };

  const getStatusStyle = (status) => {
    const s = String(status || "pending").toLowerCase();

    if (s === "completed")
      return { color: SUCCESS, bg: "#ECFDF3", border: "#A9EFC5" };
    if (s === "confirmed")
      return { color: PRIMARY, bg: PRIMARY_LIGHT, border: "#B2CCFF" };
    if (s === "cancelled")
      return { color: DANGER, bg: "#FFF1F0", border: "#FECDCA" };

    return { color: WARNING, bg: "#FFFAEB", border: "#FEDF89" };
  };

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 22,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              color: TEXT,
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            {t.title}
          </h1>
          <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
            {t.subtitle}
          </p>
        </div>

        <button onClick={callNext} style={primaryBtn}>
          {t.callNext} ▶
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <section style={cardStyle}>
          <h2 style={sectionTitle}>{t.newAppointment}</h2>

          <div style={{ display: "flex", gap: 8, margin: "18px 0" }}>
            {steps.map((step, index) => (
              <div
                key={step}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 999,
                  background: index <= activeStep ? PRIMARY : "#E4E7EC",
                  transition: "0.2s ease",
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {steps.map((step, index) => (
              <span
                key={step}
                style={{
                  color: index === activeStep ? PRIMARY : MUTED,
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {lang === "mm"
                  ? index === 0
                    ? t.patient
                    : index === 1
                      ? t.schedule
                      : t.review
                  : step}
              </span>
            ))}
          </div>

          {activeStep === 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                {t.selectPatient}
                <select
                  name="patientId"
                  value={form.patientId}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">{t.selectPatient}</option>
                  {patients.map((patient) => (
                    <option
                      key={getPatientId(patient)}
                      value={getPatientId(patient)}
                    >
                      {getPatientName(patient)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedPatient && (
                <div style={previewBox}>
                  <strong>{getPatientName(selectedPatient)}</strong>
                  <span>
                    {selectedPatient.mobileNo ||
                      selectedPatient.mobile_no ||
                      "-"}
                  </span>
                  <span>{selectedPatient.email || "-"}</span>
                </div>
              )}
            </div>
          )}

          {activeStep === 1 && (
            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                {t.dateTime}
                <input
                  type="datetime-local"
                  name="datetime"
                  value={form.datetime}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                {t.status}
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label style={labelStyle}>
                {t.notes}
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
            </div>
          )}

          {activeStep === 2 && (
            <div style={{ display: "grid", gap: 12 }}>
              <ReviewItem
                label={t.patient}
                value={getPatientName(selectedPatient)}
              />
              <ReviewItem label={t.dateTime} value={form.datetime || "-"} />
              <ReviewItem label={t.status} value={form.status} />
              <ReviewItem label={t.notes} value={form.notes || "-"} />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {activeStep > 0 && (
              <button onClick={prevStep} style={outlineBtn}>
                {t.back}
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button onClick={nextStep} style={primaryBtn}>
                {t.next}
              </button>
            ) : (
              <button
                onClick={createAppointment}
                disabled={saving}
                style={primaryBtn}
              >
                {saving ? "Saving..." : t.create}
              </button>
            )}
          </div>
        </section>

        <section>
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              style={inputStyle}
            />
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <h2 style={sectionTitle}>{t.list}</h2>
              <button onClick={loadData} style={outlineBtn}>
                Refresh
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {[
                      "Code",
                      "Patient",
                      "Date & Time",
                      "Status",
                      "Actions",
                    ].map((head) => (
                      <th key={head} style={thStyle}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={emptyCell}>
                        Loading...
                      </td>
                    </tr>
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={emptyCell}>
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((appointment) => {
                      const status =
                        appointment.status ||
                        appointment.appointmentStatus ||
                        "pending";
                      const style = getStatusStyle(status);

                      return (
                        <tr
                          key={appointment.id || appointment.appointmentId}
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <td style={tdStyle}>
                            <strong style={{ color: PRIMARY }}>
                              {appointment.appointmentCode ||
                                appointment.appointment_code ||
                                `APT-${appointment.id}`}
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {appointment.patientName ||
                              appointment.patient?.name ||
                              appointment.name ||
                              "-"}
                          </td>

                          <td style={tdStyle}>
                            {formatDate(
                              appointment.datetime || appointment.dateTime,
                            )}
                          </td>

                          <td style={tdStyle}>
                            <span
                              style={{
                                padding: "5px 10px",
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 800,
                                color: style.color,
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              {status}
                            </span>
                          </td>

                          <td style={tdStyle}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                style={miniBtn}
                                onClick={() =>
                                  updateStatus(appointment, "confirmed")
                                }
                              >
                                Confirm
                              </button>
                              <button
                                style={{
                                  ...miniBtn,
                                  color: SUCCESS,
                                  background: "#ECFDF3",
                                }}
                                onClick={() =>
                                  updateStatus(appointment, "completed")
                                }
                              >
                                Done
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div style={previewBox}>
      <span style={{ color: MUTED, fontSize: 12, fontWeight: 800 }}>
        {label}
      </span>
      <strong style={{ color: TEXT }}>{value}</strong>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const cardStyle = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: TEXT,
};

const labelStyle = {
  display: "grid",
  gap: 7,
  fontSize: 13,
  fontWeight: 800,
  color: TEXT,
};

const inputStyle = {
  width: "100%",
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: "12px 13px",
  outline: "none",
  fontSize: 14,
  background: CARD,
};

const primaryBtn = {
  border: 0,
  background: PRIMARY,
  color: "white",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  transition: "0.18s ease",
};

const outlineBtn = {
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: TEXT,
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const miniBtn = {
  border: 0,
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  borderRadius: 10,
  padding: "8px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const previewBox = {
  border: `1px solid ${BORDER}`,
  background: BG,
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 5,
  color: MUTED,
  fontSize: 13,
};

const thStyle = {
  padding: 12,
  textAlign: "left",
  color: MUTED,
  fontSize: 12,
  fontWeight: 800,
  borderBottom: `1px solid ${BORDER}`,
};

const tdStyle = {
  padding: 12,
  color: TEXT,
  fontSize: 13,
  verticalAlign: "middle",
};

const emptyCell = {
  padding: 24,
  textAlign: "center",
  color: MUTED,
};
