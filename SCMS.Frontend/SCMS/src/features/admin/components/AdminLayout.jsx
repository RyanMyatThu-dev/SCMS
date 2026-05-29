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
  BarChart3,
  Menu,
  X,
} from "lucide-react";

const PRIMARY = "#0052CC";
const PRIMARY_LIGHT = "#EBF2FF";
const BG = "#F6F8FB";
const CARD = "#FFFFFF";
const TEXT = "#1D2939";
const MUTED = "#667085";
const BORDER = "#E4E7EC";
const DANGER = "#D92D20";

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
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    admin: "Admin User",
    role: "System Administrator",
    language: "မြန်မာ",
    menu: "Menu",
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
    reports: "အစီရင်ခံစာများ",
    settings: "ဆက်တင်",
    logout: "ထွက်မည်",
    admin: "အက်ဒ်မင်",
    role: "စနစ်စီမံသူ",
    language: "English",
    menu: "မီနူး",
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
  { key: "reports", icon: BarChart3, to: "/admin/reports" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const t = useMemo(() => labels[lang], [lang]);

  const toggleLanguage = () => {
    const next = lang === "en" ? "mm" : "en";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <style>{styles}</style>

      <div className="admin-shell">
        {sidebarOpen && (
          <button
            className="mobile-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="brand-box">
            <div>
              <div className="brand-title">{t.brand}</div>
              <div className="brand-subtitle">{t.subtitle}</div>
            </div>

            <button
              className="mobile-close"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="admin-nav">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <Icon size={18} />
                  <span>{t[item.key]}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <button onClick={toggleLanguage} className="footer-btn">
              <Languages size={18} />
              <span>{t.language}</span>
            </button>

            <NavLink
              to="/admin/settings"
              onClick={() => setSidebarOpen(false)}
              className="footer-link"
            >
              <Settings size={18} />
              <span>{t.settings}</span>
            </NavLink>

            <button onClick={logout} className="footer-btn danger">
              <LogOut size={18} />
              <span>{t.logout}</span>
            </button>
          </div>
        </aside>

        <main className="admin-main">
          <div className="admin-container">
            <header className="admin-topbar">
              <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
                <span>{t.menu}</span>
              </button>

              <div className="admin-heading">
                <h1>{t.admin}</h1>
                <p>{t.role}</p>
              </div>

              <div className="admin-profile">
                <div className="admin-avatar">AD</div>
                <div>
                  <div className="profile-name">{t.admin}</div>
                  <div className="profile-role">{t.role}</div>
                </div>
              </div>
            </header>

            <div className="page-content">
              <Outlet context={{ lang, t }} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

const styles = `
* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  min-height: 100%;
}

body {
  margin: 0;
  background: ${BG};
  color: ${TEXT};
  font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

img {
  max-width: 100%;
}

.admin-shell {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  background: ${BG};
  color: ${TEXT};
  overflow: hidden;
}

.admin-sidebar {
  width: 268px;
  min-width: 268px;
  height: 100vh;
  background: ${CARD};
  border-right: 1px solid ${BORDER};
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  transition: 0.25s ease;
  z-index: 1001;
}

.brand-box {
  padding: 0 12px 22px;
  border-bottom: 1px solid ${BORDER};
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.brand-title {
  color: ${PRIMARY};
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.brand-subtitle {
  margin-top: 4px;
  color: ${MUTED};
  font-size: 12px;
  line-height: 1.45;
}

.mobile-close {
  display: none;
  border: 1px solid ${BORDER};
  background: ${CARD};
  border-radius: 10px;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${TEXT};
}

.admin-nav {
  flex: 1;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  padding-right: 2px;
}

.admin-nav::-webkit-scrollbar {
  width: 4px;
}

.admin-nav::-webkit-scrollbar-thumb {
  background: #D0D5DD;
  border-radius: 999px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  color: #475467;
  background: transparent;
  transition: 0.18s ease;
}

.nav-link:hover {
  background: #F2F4F7;
  color: ${TEXT};
  transform: translateX(2px);
}

.nav-link.active {
  background: ${PRIMARY_LIGHT};
  color: ${PRIMARY};
}

.sidebar-footer {
  border-top: 1px solid ${BORDER};
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-btn,
.footer-link {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 12px 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #475467;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.18s ease;
  text-align: left;
  text-decoration: none;
}

.footer-btn:hover,
.footer-link:hover {
  background: #F2F4F7;
}

.footer-btn.danger {
  color: ${DANGER};
}

.admin-main {
  flex: 1;
  height: 100vh;
  overflow: auto;
  padding: 28px 32px;
  min-width: 0;
}

.admin-container {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
}

.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.menu-btn {
  display: none;
  border: 1px solid ${BORDER};
  background: ${CARD};
  color: ${TEXT};
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  cursor: pointer;
  align-items: center;
  gap: 8px;
}

.admin-heading h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.admin-heading p {
  margin: 6px 0 0;
  color: ${MUTED};
  font-size: 14px;
}

.admin-profile {
  background: ${CARD};
  border: 1px solid ${BORDER};
  border-radius: 16px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.admin-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${PRIMARY};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.profile-name {
  font-size: 14px;
  font-weight: 800;
}

.profile-role {
  font-size: 12px;
  color: ${MUTED};
  margin-top: 2px;
}

.page-content {
  width: 100%;
  min-width: 0;
}

.mobile-backdrop {
  display: none;
}

/* Auto responsive helper for child pages */
.page-content > div {
  max-width: 100%;
}

@media (max-width: 1100px) {
  .admin-main {
    padding: 24px 22px;
  }
}

@media (max-width: 768px) {
  .admin-shell {
    display: block;
    overflow: visible;
  }

  .admin-sidebar {
    position: fixed;
    left: -290px;
    top: 0;
    bottom: 0;
    height: 100vh;
    box-shadow: 0 24px 60px rgba(16, 24, 40, 0.22);
  }

  .admin-sidebar.open {
    left: 0;
  }

  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    border: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 1000;
  }

  .mobile-close {
    display: inline-flex;
  }

  .admin-main {
    height: auto;
    min-height: 100vh;
    padding: 16px 14px 28px;
    overflow: visible;
  }

  .admin-topbar {
    align-items: flex-start;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 18px;
  }

  .menu-btn {
    display: inline-flex;
  }

  .admin-heading {
    flex: 1;
    min-width: 180px;
  }

  .admin-heading h1 {
    font-size: 24px;
  }

  .admin-profile {
    width: 100%;
    justify-content: flex-start;
  }

  .page-content h1 {
    font-size: 24px !important;
  }

  .page-content h2 {
    font-size: 20px !important;
  }

  .page-content section,
  .page-content article,
  .page-content aside {
    max-width: 100%;
  }

  .page-content input,
  .page-content select,
  .page-content textarea,
  .page-content button {
    max-width: 100%;
  }

  .page-content [style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }

  .page-content [style*="display: flex"] {
    flex-wrap: wrap;
  }

  .page-content [style*="position: sticky"] {
    position: static !important;
  }

  .page-content [style*="width: 420px"],
  .page-content [style*="width: 360px"],
  .page-content [style*="width: 268px"] {
    width: 100% !important;
    min-width: 0 !important;
  }
}

@media (max-width: 480px) {
  .admin-main {
    padding: 14px 10px 24px;
  }

  .brand-title {
    font-size: 22px;
  }

  .nav-link,
  .footer-btn,
  .footer-link {
    padding: 11px 12px;
  }
}
`;
