import { useOutletContext, useNavigate } from "react-router-dom";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const CARD = "#FFFFFF";
const BG = "#F6F8FB";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

export default function Setting() {
  const navigate = useNavigate();
  const outlet = useOutletContext();

  const lang = outlet?.lang || "en";

  const t = {
    title: lang === "mm" ? "ဆက်တင်များ" : "Settings",
    subtitle:
      lang === "mm"
        ? "စနစ်နှင့် အသုံးပြုသူဆိုင်ရာ ဆက်တင်များ"
        : "System and user preferences",

    profile: lang === "mm" ? "အသုံးပြုသူ အချက်အလက်" : "Profile Information",

    system: lang === "mm" ? "စနစ်အချက်အလက်" : "System Information",

    language: lang === "mm" ? "ဘာသာစကား" : "Language",

    theme: lang === "mm" ? "အရောင်အပြင်အဆင်" : "Theme",

    version: lang === "mm" ? "ဗားရှင်း" : "Version",

    role: lang === "mm" ? "အခန်းကဏ္ဍ" : "Role",

    logout: lang === "mm" ? "အကောင့်ထွက်မည်" : "Logout",

    admin: lang === "mm" ? "အက်ဒ်မင်" : "Administrator",

    clinic:
      lang === "mm"
        ? "ဆေးခန်းစီမံခန့်ခွဲမှုစနစ်"
        : "Smart Clinic Management System",

    currentLang: lang === "mm" ? "မြန်မာ" : "English",

    lightTheme: lang === "mm" ? "အလင်းရောင် Theme" : "Light Theme",
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");

    navigate("/login");
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={header}>
        <div>
          <h1 style={title}>{t.title}</h1>
          <p style={subtitle}>{t.subtitle}</p>
        </div>
      </div>

      <div style={grid}>
        {/* PROFILE */}
        <div style={card}>
          <h2 style={sectionTitle}>{t.profile}</h2>

          <div style={profileRow}>
            <div style={avatar}>AD</div>

            <div>
              <h3 style={profileName}>{t.admin}</h3>

              <p style={profileRole}>
                {lang === "mm" ? "စနစ်စီမံခန့်ခွဲသူ" : "System Administrator"}
              </p>
            </div>
          </div>
        </div>

        {/* SYSTEM */}
        <div style={card}>
          <h2 style={sectionTitle}>{t.system}</h2>

          <div style={infoBox}>
            <span>{t.language}</span>
            <strong>{t.currentLang}</strong>
          </div>

          <div style={infoBox}>
            <span>{t.theme}</span>
            <strong>{t.lightTheme}</strong>
          </div>

          <div style={infoBox}>
            <span>{t.version}</span>
            <strong>SCMS v1.0.0</strong>
          </div>

          <div style={infoBox}>
            <span>{t.role}</span>
            <strong>{t.admin}</strong>
          </div>
        </div>
      </div>

      {/* APP INFO */}
      <div style={card}>
        <h2 style={sectionTitle}>SCMS</h2>

        <p
          style={{
            color: MUTED,
            lineHeight: 1.8,
            marginTop: 10,
          }}
        >
          {t.clinic}
        </p>
      </div>

      {/* LOGOUT */}
      <div style={{ marginTop: 20 }}>
        <button onClick={logout} style={logoutBtn}>
          {t.logout}
        </button>
      </div>
    </div>
  );
}

const header = {
  marginBottom: 24,
};

const title = {
  fontSize: 30,
  fontWeight: 800,
  color: TEXT,
  letterSpacing: "-0.04em",
};

const subtitle = {
  color: MUTED,
  marginTop: 6,
  fontSize: 14,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 20,
  marginBottom: 20,
};

const card = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  padding: 22,
};

const sectionTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: TEXT,
  marginBottom: 18,
};

const profileRow = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const avatar = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  background: PRIMARY,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 22,
};

const profileName = {
  color: TEXT,
  fontSize: 18,
  fontWeight: 800,
};

const profileRole = {
  color: MUTED,
  marginTop: 6,
};

const infoBox = {
  background: BG,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: TEXT,
};

const logoutBtn = {
  border: 0,
  background: "#D92D20",
  color: "#fff",
  padding: "12px 20px",
  borderRadius: 12,
  fontWeight: 700,
  cursor: "pointer",
};
