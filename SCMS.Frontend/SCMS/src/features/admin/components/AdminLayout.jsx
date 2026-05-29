import { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Pill,
  FileText,
  RotateCcw,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Languages,
  Activity,
  FolderOpen,
} from "lucide-react";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";

const labels = {
  en: {
    brand: "SCMS",
    subtitle: "Smart Clinic Management",
    dashboard: "Dashboard",
    patients: "Patients",
    appointments: "Appointments",
    medicines: "Medicines",
    prescriptions: "Prescriptions",
    followups: "Follow-Ups",
    payments: "Payments",
    notifications: "Notifications",
    diseases: "Diseases",
    documents: "Documents",
    settings: "Settings",
    logout: "Logout",
    admin: "Admin User",
    role: "System Administrator",
    language: "မြန်မာ",
  },
  mm: {
    brand: "SCMS",
    subtitle: "ဆေးခန်းစီမံခန့်ခွဲမှုစနစ်",
    dashboard: "ဒက်ရှ်ဘုတ်",
    patients: "လူနာများ",
    appointments: "ချိန်းဆိုမှုများ",
    medicines: "ဆေးဝါးများ",
    prescriptions: "ဆေးညွှန်းများ",
    followups: "ပြန်လည်စစ်ဆေးမှုများ",
    payments: "ငွေပေးချေမှုများ",
    notifications: "အသိပေးချက်များ",
    diseases: "ရောဂါများ",
    documents: "စာရွက်စာတမ်းများ",
    settings: "ဆက်တင်",
    logout: "ထွက်မည်",
    admin: "အက်ဒ်မင်",
    role: "စနစ်စီမံသူ",
    language: "English",
  },
};

const navItems = [
  { key: "dashboard", icon: LayoutDashboard, to: "/admin/dashboard" },
  { key: "patients", icon: Users, to: "/admin/patients" },
  { key: "appointments", icon: CalendarDays, to: "/admin/appointments" },
  { key: "medicines", icon: Pill, to: "/admin/medicines" },
  { key: "prescriptions", icon: FileText, to: "/admin/prescriptions" },
  { key: "followups", icon: RotateCcw, to: "/admin/followups" },
  { key: "payments", icon: CreditCard, to: "/admin/payments" },
  { key: "notifications", icon: Bell, to: "/admin/notifications" },
  { key: "diseases", icon: Activity, to: "/admin/diseases" },
  { key: "documents", icon: FolderOpen, to: "/admin/documents" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  const t = useMemo(() => labels[lang], [lang]);

  const toggleLanguage = () => {
    const next = lang === "en" ? "mm" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        background: BG,
        color: TEXT,
        fontFamily: "Inter, Manrope, sans-serif",
      }}
    >
      <aside
        style={{
          width: 268,
          minWidth: 268,
          height: "100vh",
          background: CARD,
          borderRight: `1px solid ${BORDER}`,
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "0 12px 22px",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              color: PRIMARY,
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.03em",
            }}
          >
            {t.brand}
          </div>
          <div style={{ marginTop: 4, color: MUTED, fontSize: 12 }}>
            {t.subtitle}
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            overflowY: "auto",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.key}
                to={item.to}
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? PRIMARY : "#475467",
                  background: isActive ? PRIMARY_LIGHT : "transparent",
                  transition: "0.18s ease",
                })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = PRIMARY_LIGHT;
                  e.currentTarget.style.transform = "translateX(2px)";
                }}
                onMouseLeave={(e) => {
                  const active = e.currentTarget.getAttribute("aria-current");
                  e.currentTarget.style.background =
                    active === "page" ? PRIMARY_LIGHT : "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <Icon size={18} />
                <span>{t[item.key]}</span>
              </NavLink>
            );
          })}
        </nav>

        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <button onClick={toggleLanguage} style={footerButtonStyle}>
            <Languages size={18} />
            {t.language}
          </button>

          <NavLink
            to="/admin/settings"
            style={{
              ...footerButtonStyle,
              textDecoration: "none",
              color: "#475467",
            }}
          >
            <Settings size={18} />
            {t.settings}
          </NavLink>

          <button
            onClick={logout}
            style={{
              ...footerButtonStyle,
              color: "#D92D20",
            }}
          >
            <LogOut size={18} />
            {t.logout}
          </button>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          height: "100vh",
          overflow: "auto",
          padding: "28px 32px",
        }}
      >
        <div style={{ maxWidth: 1480, margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                {t.admin}
              </h1>
              <p style={{ marginTop: 6, color: MUTED, fontSize: 14 }}>
                {t.role}
              </p>
            </div>

            <div
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: PRIMARY,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                AD
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{t.admin}</div>
                <div style={{ fontSize: 12, color: MUTED }}>{t.role}</div>
              </div>
            </div>
          </header>

          <Outlet context={{ lang, t }} />
        </div>
      </main>
    </div>
  );
}

const footerButtonStyle = {
  width: "100%",
  border: 0,
  background: "transparent",
  padding: "12px 14px",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "#475467",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  transition: "0.18s ease",
  textAlign: "left",
};
