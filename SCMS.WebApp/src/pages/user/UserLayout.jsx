import { useState, useEffect, useMemo, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Languages,
  User,
  Menu,
  X,
  Users
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { dashboardsApi, patientsApi } from "../../services/scmsApi";
import { showError, showAlert } from "../../services/dialogs";

const PRIMARY = "#4F46E5"; // Patient theme indigo-600
const PRIMARY_LIGHT = "#EEF2FF"; // indigo-50
const BG = "#F9FAFB"; // slate-50
const CARD = "#FFFFFF";
const TEXT = "#1F2937";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

export default function UserLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load patient dashboard telemetry
  const loadDashboard = useCallback(async (selectId = null) => {
    try {
      setLoading(true);
      setError("");
      const result = await dashboardsApi.patient();
      setData(result);
      
      const profiles = result?.patientProfiles || [];
      if (profiles.length > 0) {
        // If a specific ID is requested, select it. Otherwise, default to first profile or currently selected
        const currentId = selectId || activeProfile?.patientId;
        const matched = profiles.find(p => p.patientId === currentId);
        setActiveProfile(matched || profiles[0]);
      } else {
        setActiveProfile(null);
      }
    } catch (err) {
      console.error("User portal telemetry error:", err);
      setError("Failed to load patient dashboard telemetry.");
    } finally {
      setLoading(false);
    }
  }, [activeProfile]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchActiveProfile = (profileId) => {
    const matched = data?.patientProfiles?.find(p => p.patientId === profileId);
    if (matched) {
      setActiveProfile(matched);
      setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) =>
    String(name || "U")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const activeProfileId = activeProfile?.patientId;

  // Filter clinical data based on active patient profile
  const filteredTelemetry = useMemo(() => {
    if (!data || !activeProfileId) return { appointments: [], prescriptions: [], outstanding: [] };

    return {
      appointments: (data.upcomingAppointments || []).filter(a => a.patientId === activeProfileId),
      prescriptions: (data.prescriptionHistory || []).filter(p => p.patientId === activeProfileId),
      outstanding: (data.outstandingBalances || []).filter(
        b => (data.upcomingAppointments || []).find(a => a.id === b.appointmentId)?.patientId === activeProfileId
      )
    };
  }, [data, activeProfileId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800 antialiased">
      {/* --- Sidebar Desktop view (lg and above) --- */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white p-5 shrink-0">
        <div className="pb-5 border-b border-slate-100">
          <div className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            {t.appName || "SCMS"}
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Patient Portal
          </div>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-2 overflow-y-auto">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "text-indigo-600 bg-indigo-50/70"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 w-full transition-colors"
          >
            <Languages size={18} />
            <span>{language === "en" ? "မြန်မာ" : "English"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={18} />
            <span>{t.logout || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* --- Mobile Sidebar Drawer overlay (<lg) --- */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* --- Mobile Slide-out Drawer (<lg) --- */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-white p-5 border-r border-slate-200 lg:hidden transform transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-5 border-b border-slate-100">
          <div>
            <div className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
              <Users size={24} />
              {t.appName || "SCMS"}
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Patient Portal
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-2 overflow-y-auto">
          <NavLink
            to="/user/dashboard"
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? "text-indigo-600 bg-indigo-50/70"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <LayoutDashboard size={18} />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => {
              toggleLanguage();
              setDrawerOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 w-full"
          >
            <Languages size={18} />
            <span>{language === "en" ? "မြန်မာ" : "English"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 w-full"
          >
            <LogOut size={18} />
            <span>{t.logout || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* --- Main content viewport --- */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-black text-slate-800 hidden sm:block">
              {activeProfile ? activeProfile.name : "Patient Portal"}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Family Profile Switcher */}
            {data?.patientProfiles && data.patientProfiles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                  Active Patient:
                </span>
                <select
                  className="select select-bordered select-sm h-9 rounded-xl border-slate-200 bg-white text-xs md:text-sm font-extrabold text-indigo-600 focus:border-indigo-500 focus:ring-0 focus:outline-none pr-8"
                  value={activeProfileId || ""}
                  onChange={(e) => switchActiveProfile(Number(e.target.value))}
                >
                  {data.patientProfiles.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name} ({p.bloodType || "O+"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Profile Avatar Widget */}
            {activeProfile && (
              <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-600 text-sm font-extrabold text-white">
                  {getInitials(activeProfile.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-extrabold text-slate-800 truncate max-w-28">
                    {activeProfile.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">
                    Family Patient
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {error}
              </div>
            )}

            {loading && !data ? (
              <div className="grid place-items-center h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-3">
                  <span className="loading loading-spinner loading-md text-indigo-600" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Loading Portal Telemetry...
                  </span>
                </div>
              </div>
            ) : (
              <Outlet
                context={{
                  data,
                  activeProfile,
                  setActiveProfile,
                  filteredTelemetry,
                  loading,
                  loadDashboard,
                  language,
                  t,
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
