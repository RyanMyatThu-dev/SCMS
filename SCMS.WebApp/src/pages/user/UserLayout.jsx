import {
  DashboardIcon,
  ExitIcon,
  GlobeIcon,
  HamburgerMenuIcon,
  Cross2Icon,
  PlusIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BrandLogoIcon } from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { showError, showSuccess } from "../../services/dialogs";
import { dashboardsApi, patientsApi } from "../../services/scmsApi";

export default function UserLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: "",
    gender: "",
    mobileNo: "",
    bloodType: "",
    actualAddress: "",
  });

  const loadDashboard = useCallback(
    async (selectId = null) => {
      try {
        setLoading(true);
        setError("");
        const result = await dashboardsApi.patient();
        setData(result);

        const profiles = result?.patientProfiles || [];
        if (profiles.length > 0) {
          const currentId = selectId || activeProfile?.patientId;
          const matched = profiles.find((p) => p.patientId === currentId);
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
    },
    [activeProfile]
  );

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchActiveProfile = (profileId) => {
    const matched = data?.patientProfiles?.find((p) => p.patientId === profileId);
    if (matched) {
      setActiveProfile(matched);
      setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateProfile = async () => {
    try {
      setLoading(true);
      const payload = { ...newProfile };
      await patientsApi.create(payload);
      setManageOpen(false);
      setNewProfile({ name: "", gender: "", mobileNo: "", bloodType: "", actualAddress: "" });
      showSuccess("Patient profile created.");
      await loadDashboard();
    } catch (err) {
      console.error(err);
      await showError(err?.response?.data?.message || err?.message || "Failed to create profile.");
    } finally {
      setLoading(false);
    }
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

  const filteredTelemetry = useMemo(() => {
    if (!data || !activeProfileId) return { appointments: [], prescriptions: [], outstanding: [] };

    return {
      appointments: (data.upcomingAppointments || []).filter(
        (a) => a.patientId === activeProfileId
      ),
      prescriptions: (data.prescriptionHistory || []).filter(
        (p) => p.patientId === activeProfileId
      ),
      outstanding: (data.outstandingBalances || []).filter(
        (b) =>
          (data.upcomingAppointments || []).find((a) => a.id === b.appointmentId)?.patientId ===
          activeProfileId
      ),
    };
  }, [data, activeProfileId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground antialiased transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/80 bg-card/85 dark:bg-card/75 backdrop-blur-xl p-5 shrink-0">
        <div className="pb-5 border-b border-border/80">
          <div className="text-xl font-bold text-foreground flex items-center gap-2">
            <BrandLogoIcon size={28} />
            <span>{t.appName || "ကုမယ်"}</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Patient Portal
          </div>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1.5 overflow-y-auto">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? "text-foreground bg-secondary font-bold shadow-xs ring-1 ring-border"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`
            }
          >
            <DashboardIcon className="w-4 h-4 shrink-0" />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-border/80 flex flex-col gap-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors btn-target"
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4 text-amber-400 shrink-0" /> : <MoonIcon className="w-4 h-4 shrink-0" />}
            <span>{theme === "dark" ? "Light Appearance" : "Dark Appearance"}</span>
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors btn-target"
          >
            <GlobeIcon className="w-4 h-4 shrink-0" />
            <span>{language === "en" ? "မြန်မာ" : "English"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 w-full transition-colors btn-target"
          >
            <ExitIcon className="w-4 h-4 shrink-0" />
            <span>{t.logout || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-card/95 backdrop-blur-2xl p-5 border-r border-border/80 lg:hidden transform transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-5 border-b border-border/80">
          <div>
            <div className="text-xl font-bold text-foreground flex items-center gap-2">
              <BrandLogoIcon size={26} />
              <span>{t.appName || "ကုမယ်"}</span>
            </div>
            <div className="mt-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Patient Portal
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"
          >
            <Cross2Icon className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1.5 overflow-y-auto">
          <NavLink
            to="/user/dashboard"
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? "text-foreground bg-secondary font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`
            }
          >
            <DashboardIcon className="w-4 h-4 shrink-0" />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-border/80 flex flex-col gap-1.5">
          <button
            onClick={() => {
              toggleTheme();
              setDrawerOpen(false);
            }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full btn-target"
          >
            {theme === "dark" ? <SunIcon className="w-4 h-4 text-amber-400 shrink-0" /> : <MoonIcon className="w-4 h-4 shrink-0" />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button
            onClick={() => {
              toggleLanguage();
              setDrawerOpen(false);
            }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full btn-target"
          >
            <GlobeIcon className="w-4 h-4 shrink-0" />
            <span>{language === "en" ? "မြန်မာ" : "English"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 w-full btn-target"
          >
            <ExitIcon className="w-4 h-4 shrink-0" />
            <span>{t.logout || "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/80 backdrop-blur-xl px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-2xl text-foreground hover:bg-secondary border border-border/80 shadow-xs"
            >
              <HamburgerMenuIcon className="w-5 h-5" />
            </button>
            <h1 className="text-base font-bold text-foreground hidden sm:block">
              {activeProfile ? activeProfile.name : "Patient Portal"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Family Profile Switcher */}
            <div className="flex items-center gap-2">
              {data?.patientProfiles && data.patientProfiles.length > 0 ? (
                <>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:inline">
                    Active Patient:
                  </span>
                  <select
                    className="scms-select h-9 text-xs font-semibold text-foreground pr-8 bg-card/80 border-border/80"
                    value={activeProfileId || ""}
                    onChange={(e) => switchActiveProfile(Number(e.target.value))}
                  >
                    {data.patientProfiles.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.name} ({p.bloodType || "O+"})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div className="text-xs font-bold text-slate-400">No profiles linked</div>
              )}

              <button
                title="Add Family Member"
                onClick={() => setManageOpen(true)}
                className="rounded-xl p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 btn-target"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar */}
            {activeProfile && (
              <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-800 pl-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                  {getInitials(activeProfile.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-28">
                    {activeProfile.name}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400">
                    Family Member
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {loading && !data ? (
              <div className="grid place-items-center h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-3">
                  <span className="loading loading-spinner loading-md text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Loading Patient Portal...
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
                  setManageOpen,
                  newProfile,
                  setNewProfile,
                  language,
                  t,
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Add Patient Profile Modal */}
      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateProfile();
            }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add Family Patient Profile
              </h3>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <label className="block text-xs">
              <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Full Name</span>
              <input
                required
                value={newProfile.name}
                onChange={(e) => setNewProfile((p) => ({ ...p, name: e.target.value }))}
                className="scms-input w-full text-xs"
                placeholder="e.g. Daw Aye Aye"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Gender</span>
                <select
                  value={newProfile.gender}
                  onChange={(e) => setNewProfile((p) => ({ ...p, gender: e.target.value }))}
                  className="scms-select w-full text-xs"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Blood Type</span>
                <input
                  value={newProfile.bloodType}
                  onChange={(e) => setNewProfile((p) => ({ ...p, bloodType: e.target.value }))}
                  className="scms-input w-full text-xs"
                  placeholder="e.g. O+"
                />
              </label>
            </div>

            <label className="block text-xs">
              <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Mobile Number</span>
              <input
                value={newProfile.mobileNo}
                onChange={(e) => setNewProfile((p) => ({ ...p, mobileNo: e.target.value }))}
                className="scms-input w-full text-xs"
                placeholder="09..."
              />
            </label>

            <label className="block text-xs">
              <span className="mb-1 block font-bold text-slate-700 dark:text-slate-300">Address (optional)</span>
              <input
                value={newProfile.actualAddress}
                onChange={(e) => setNewProfile((p) => ({ ...p, actualAddress: e.target.value }))}
                className="scms-input w-full text-xs"
                placeholder="City / Township"
              />
            </label>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="scms-btn-outline text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="scms-btn-primary text-xs font-bold">
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
