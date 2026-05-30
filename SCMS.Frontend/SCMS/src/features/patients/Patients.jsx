import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Swal from "sweetalert2";
import scmsApi from "../../services/scmsApi";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const DANGER = "#D92D20";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const emptyForm = {
  name: "",
  mobileNo: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  bloodType: "",
  address: "",
  allergies: "",
  chronicConditions: "",
};

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.value)) return data.value;
  return [];
};

const getPatientId = (p) => p?.patientId || p?.patient_id || p?.id;

export default function Patients() {
  const outlet = useOutletContext();
  const lang = outlet?.lang || localStorage.getItem("lang") || "en";

  const [detailPatient, setDetailPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = {
    title: lang === "mm" ? "လူနာများ" : "Patients",
    subtitle:
      lang === "mm"
        ? "လူနာအသစ်ထည့်ရန်နှင့် လူနာစာရင်းများကို စီမံရန်"
        : "Create new patients and manage patient records",
    newPatient: lang === "mm" ? "လူနာအသစ်" : "New Patient",
    personal: lang === "mm" ? "ကိုယ်ရေးအချက်အလက်" : "Personal",
    contact: lang === "mm" ? "ဆက်သွယ်ရန်" : "Contact",
    medical: lang === "mm" ? "ကျန်းမာရေးအချက်အလက်" : "Medical",
    review: lang === "mm" ? "ပြန်စစ်ရန်" : "Review",
    name: lang === "mm" ? "အမည်" : "Name",
    mobile: lang === "mm" ? "ဖုန်းနံပါတ်" : "Mobile No",
    email: lang === "mm" ? "အီးမေးလ်" : "Email",
    dob: lang === "mm" ? "အသက်" : "Age",
    gender: lang === "mm" ? "ကျား/မ" : "Gender",
    blood: lang === "mm" ? "သွေးအမျိုးအစား" : "Blood Type",
    address: lang === "mm" ? "လိပ်စာ" : "Address",
    allergies: lang === "mm" ? "ဓာတ်မတည့်မှုများ" : "Allergies",
    chronic: lang === "mm" ? "နာတာရှည်ရောဂါများ" : "Chronic Conditions",
    next: lang === "mm" ? "ရှေ့သို့" : "Next",
    back: lang === "mm" ? "နောက်သို့" : "Back",
    create: lang === "mm" ? "လူနာဖန်တီးမည်" : "Create Patient",
    list: lang === "mm" ? "လူနာစာရင်း" : "Patient List",
    search: lang === "mm" ? "လူနာအမည်ဖြင့်ရှာပါ..." : "Search patients...",
    empty: lang === "mm" ? "လူနာမတွေ့ပါ" : "No patients found",
  };

  const showRequired = (message) => {
    Swal.fire({
      icon: "warning",
      title: lang === "mm" ? "လိုအပ်သောအချက်အလက်" : "Required Field",
      text: message,
      confirmButtonText: "OK",
      confirmButtonColor: PRIMARY,
    });
  };

  const showSuccess = (message) => {
    Swal.fire({
      icon: "success",
      title: lang === "mm" ? "အောင်မြင်ပါသည်" : "Success",
      text: message,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const showError = (message) => {
    Swal.fire({
      icon: "error",
      title: lang === "mm" ? "Error ဖြစ်နေပါသည်" : "Error",
      text: message,
      confirmButtonColor: DANGER,
    });
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await scmsApi.patients.list();
      setPatients(toArray(data));
    } catch (error) {
      console.error("Patients load error:", error);
      showError(
        error?.response?.data?.message ||
          (lang === "mm"
            ? "လူနာစာရင်း မတင်နိုင်ပါ"
            : "Failed to load patients"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const name = p.name || p.fullName || p.patientName || "";
      const mobile = p.mobileNo || p.mobile_no || "";
      return `${name} ${mobile}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [patients, search]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) {
        showRequired(
          lang === "mm" ? "အမည် ထည့်ပါ" : "Please enter patient name",
        );
        return false;
      }

      if (!form.dateOfBirth) {
        showRequired(
          lang === "mm" ? "မွေးသက္ကရာဇ် ထည့်ပါ" : "Please select date of birth",
        );
        return false;
      }

      if (!form.gender) {
        showRequired(lang === "mm" ? "ကျား/မ ရွေးပါ" : "Please select gender");
        return false;
      }
    }

    if (step === 1) {
      if (!form.mobileNo.trim()) {
        showRequired(
          lang === "mm" ? "ဖုန်းနံပါတ် ထည့်ပါ" : "Please enter mobile number",
        );
        return false;
      }

      if (!form.email.trim()) {
        showRequired(lang === "mm" ? "အီးမေးလ် ထည့်ပါ" : "Please enter email");
        return false;
      }

      if (!form.address.trim()) {
        showRequired(lang === "mm" ? "လိပ်စာ ထည့်ပါ" : "Please enter address");
        return false;
      }
    }

    if (step === 2) {
      if (!form.bloodType) {
        showRequired(
          lang === "mm" ? "သွေးအမျိုးအစား ရွေးပါ" : "Please select blood type",
        );
        return false;
      }

      if (!form.allergies.trim()) {
        showRequired(
          lang === "mm" ? "ဓာတ်မတည့်မှု ထည့်ပါ" : "Please enter allergies",
        );
        return false;
      }

      if (!form.chronicConditions.trim()) {
        showRequired(
          lang === "mm"
            ? "နာတာရှည်ရောဂါများ ထည့်ပါ"
            : "Please enter chronic conditions",
        );
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const backStep = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const resetWizard = () => {
    setStep(0);
    setForm(emptyForm);
  };

  const createPatient = async () => {
    if (!validateStep()) return;

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        mobileNo: form.mobileNo.trim(),
        email: form.email.trim(),
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        bloodType: form.bloodType,
        address: form.address.trim(),
        allergies: form.allergies.trim(),
        chronicConditions: form.chronicConditions.trim(),
      };

      await scmsApi.patients.create(payload);

      showSuccess(
        lang === "mm"
          ? "လူနာအသစ် ဖန်တီးပြီးပါပြီ"
          : "Patient created successfully",
      );

      resetWizard();
      await loadPatients();
    } catch (error) {
      console.error("Create patient error:", error);
      showError(
        error?.response?.data?.message ||
          (lang === "mm"
            ? "လူနာအသစ် ဖန်တီးမှု မအောင်မြင်ပါ"
            : "Patient create failed. Please check backend request body."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={pageHeader}>
        <div>
          <h1 style={titleStyle}>{t.title}</h1>
          <p style={subtitleStyle}>{t.subtitle}</p>
        </div>
      </div>

      <div style={mainGrid}>
        <section style={cardStyle}>
          <h2 style={sectionTitle}>{t.newPatient}</h2>

          <div style={{ display: "flex", gap: 8, margin: "18px 0" }}>
            {[t.personal, t.contact, t.medical, t.review].map(
              (label, index) => (
                <div key={label} style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 999,
                      background: index <= step ? PRIMARY : BORDER,
                    }}
                  />
                  <div
                    style={{
                      marginTop: 7,
                      fontSize: 11,
                      fontWeight: 800,
                      color: index === step ? PRIMARY : MUTED,
                    }}
                  >
                    {label}
                  </div>
                </div>
              ),
            )}
          </div>

          {step === 0 && (
            <div style={formGrid}>
              <Input
                label={`${t.name} *`}
                name="name"
                value={form.name}
                onChange={handleChange}
              />
              <Input
                label={`${t.dob} *`}
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
              />

              <label style={labelStyle}>
                {t.gender} *
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
          )}

          {step === 1 && (
            <div style={formGrid}>
              <Input
                label={`${t.mobile} *`}
                name="mobileNo"
                value={form.mobileNo}
                onChange={handleChange}
              />
              <Input
                label={`${t.email} *`}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />

              <label style={labelStyle}>
                {t.address} *
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
            </div>
          )}

          {step === 2 && (
            <div style={formGrid}>
              <label style={labelStyle}>
                {t.blood} *
                <select
                  name="bloodType"
                  value={form.bloodType}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select Blood Type</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                {t.allergies} *
                <textarea
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <label style={labelStyle}>
                {t.chronic} *
                <textarea
                  name="chronicConditions"
                  value={form.chronicConditions}
                  onChange={handleChange}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
            </div>
          )}

          {step === 3 && (
            <div style={formGrid}>
              <Review label={t.name} value={form.name || "-"} />
              <Review label={t.mobile} value={form.mobileNo || "-"} />
              <Review label={t.email} value={form.email || "-"} />
              <Review label={t.gender} value={form.gender || "-"} />
              <Review label={t.blood} value={form.bloodType || "-"} />
              <Review label={t.address} value={form.address || "-"} />
              <Review label={t.allergies} value={form.allergies || "-"} />
              <Review label={t.chronic} value={form.chronicConditions || "-"} />
              <Review label={t.dob} value={form.dateOfBirth || "-"} />
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            {step > 0 && (
              <button onClick={backStep} style={outlineBtn}>
                {t.back}
              </button>
            )}

            {step < 3 ? (
              <button onClick={nextStep} style={primaryBtn}>
                {t.next}
              </button>
            ) : (
              <button
                disabled={saving}
                onClick={createPatient}
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

          <div style={listHeader}>
            <h2 style={sectionTitle}>{t.list}</h2>
            <button onClick={loadPatients} style={outlineBtn}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={emptyStyle}>Loading...</div>
          ) : filteredPatients.length === 0 ? (
            <div style={emptyStyle}>{t.empty}</div>
          ) : (
            <div style={patientGrid}>
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={getPatientId(patient)}
                  patient={patient}
                  selected={selected}
                  onClick={() => {
                    setSelected(patient);
                    setDetailPatient(patient);
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {detailPatient && (
        <div onClick={() => setDetailPatient(null)} style={modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={modalBox}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2>{lang === "mm" ? "လူနာအသေးစိတ်" : "Patient Details"}</h2>
              <button onClick={() => setDetailPatient(null)} style={closeBtn}>
                X
              </button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <Info label={t.name} value={detailPatient.name || "-"} />
              <Info
                label={t.mobile}
                value={detailPatient.mobileNo || detailPatient.mobile_no || "-"}
              />
              <Info label={t.email} value={detailPatient.email || "-"} />
              <Info label={t.gender} value={detailPatient.gender || "-"} />
              <Info
                label={t.blood}
                value={
                  detailPatient.bloodType || detailPatient.blood_type || "-"
                }
              />
              <Info
                label={t.allergies}
                value={detailPatient.allergies || "-"}
              />
              <Info
                label={t.chronic}
                value={detailPatient.chronicConditions || "-"}
              />
              <Info label={t.address} value={detailPatient.address || "-"} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientCard({ patient, selected, onClick }) {
  const id = getPatientId(patient);
  const selectedId = selected ? getPatientId(selected) : null;
  const active = String(id) === String(selectedId);

  const name =
    patient.name ||
    patient.fullName ||
    patient.patientName ||
    "Unknown Patient";
  const mobile = patient.mobileNo || patient.mobile_no || "-";
  const blood = patient.bloodType || patient.blood_type || "-";
  const gender = patient.gender || "-";

  return (
    <article
      onClick={onClick}
      style={{
        ...patientCard,
        border: `1px solid ${active ? PRIMARY : BORDER}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={avatarStyle}>{name.slice(0, 2).toUpperCase()}</div>
        <div>
          <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800 }}>{name}</h3>
          <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>{mobile}</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <span style={pillStyle}>Blood: {blood}</span>
        <span style={pillStyle}>Gender: {gender}</span>
      </div>
    </article>
  );
}

function Input({ label, type, ...props }) {
  const ref = useRef(null);

  if (type === "date") {
    const raw = props.value || "";
    const formatted = (() => {
      if (!raw) return "";
      const [y, m, d] = raw.split("-");
      if (!y || !m || !d) return raw;
      return `${d}-${m}-${y}`;
    })();

    const openPicker = () => {
      if (ref.current) {
        try { ref.current.showPicker(); } catch { ref.current.click(); }
      }
    };

    return (
      <label style={labelStyle}>
        {label}
        <div style={{ ...inputStyle, position: "relative", cursor: "pointer", display: "flex", alignItems: "center" }} onClick={openPicker}>
          <span style={{ color: formatted ? TEXT : MUTED, pointerEvents: "none" }}>
            {formatted || "dd-MM-yyyy"}
          </span>
          <input
            ref={ref}
            type="date"
            name={props.name}
            value={raw}
            onChange={props.onChange}
            style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
          />
        </div>
      </label>
    );
  }

  return (
    <label style={labelStyle}>
      {label}
      <input type={type} {...props} style={inputStyle} />
    </label>
  );
}

function Review({ label, value }) {
  return <Info label={label} value={value} />;
}

function Info({ label, value }) {
  return (
    <div style={infoBox}>
      <span style={{ color: MUTED, fontSize: 12, fontWeight: 800 }}>
        {label}
      </span>
      <strong style={{ color: TEXT, marginTop: 4 }}>{value}</strong>
    </div>
  );
}

const pageHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 22,
};
const titleStyle = {
  color: TEXT,
  fontSize: 30,
  fontWeight: 800,
  letterSpacing: "-0.04em",
};
const subtitleStyle = { color: MUTED, marginTop: 6, fontSize: 14 };
const mainGrid = {
  display: "grid",
  gridTemplateColumns: "420px 1fr",
  gap: 18,
  alignItems: "start",
};
const cardStyle = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 18,
};
const sectionTitle = { fontSize: 18, fontWeight: 800, color: TEXT };
const formGrid = { display: "grid", gap: 12 };
const labelStyle = {
  display: "grid",
  gap: 7,
  color: TEXT,
  fontSize: 13,
  fontWeight: 800,
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
const infoBox = {
  border: `1px solid ${BORDER}`,
  background: BG,
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 4,
};
const listHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};
const patientGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 16,
};
const patientCard = {
  background: CARD,
  borderRadius: 18,
  padding: 18,
  cursor: "pointer",
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};
const avatarStyle = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: PRIMARY,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
};
const pillStyle = {
  background: PRIMARY_LIGHT,
  color: PRIMARY,
  padding: "5px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};
const emptyStyle = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 30,
  color: MUTED,
  textAlign: "center",
};
const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  padding: 20,
};
const modalBox = {
  width: "100%",
  maxWidth: 700,
  background: CARD,
  borderRadius: 20,
  padding: 24,
};
const closeBtn = {
  border: 0,
  background: "#F2F4F7",
  borderRadius: 8,
  padding: "8px 12px",
  cursor: "pointer",
};
