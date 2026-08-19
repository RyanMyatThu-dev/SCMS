import {
  DashboardIcon,
  ExitIcon,
  GlobeIcon,
  HamburgerMenuIcon,
  Cross2Icon,
  PlusIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { showError, showSuccess, showConfirm } from "../../services/dialogs";
import { dashboardsApi, patientsApi } from "../../services/scmsApi";
import {
  sanitizeText,
  validatePatientProfile,
} from "../../utils/validation";
import useScrollLock from "../../hooks/useScrollLock";
import ModalPortal from "../../components/ModalPortal";

export default function UserLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { language, t, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useScrollLock(manageOpen || drawerOpen);
  const [newProfile, setNewProfile] = useState({
    name: "",
    gender: "Male",
    bloodType: "O+",
    dateOfBirth: "",
    mobileNo: "",
    email: "",
    allergies: "",
    chronicConditions: "",
    actualAddress: "",
  });

  const loadDashboard = useCallback(
    async (selectId = null) => {
      try {
        setLoading(true);
        setError("");
        const res = await dashboardsApi.patient();
        const telemetry = res?.data || res || {};
        setData(telemetry);

        const profiles =
          telemetry?.patientProfiles ||
          telemetry?.data?.patientProfiles ||
          (Array.isArray(telemetry) ? telemetry : []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeProfile?.patientId]
  );

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchActiveProfile = (profileId) => {
    const profiles =
      data?.patientProfiles ||
      data?.data?.patientProfiles ||
      (Array.isArray(data) ? data : []);
    const matched = profiles.find((p) => p.patientId === profileId);
    if (matched) {
      setActiveProfile(matched);
      setDrawerOpen(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm(
      language === "mm" ? "လူနာအကောင့်မှ ထွက်ခွာရန် သေချာပါသလား?" : "Are you sure you want to sign out of your patient portal?",
      language === "mm" ? "အကောင့်ထွက်ရန် အတည်ပြုပါ" : "Confirm Sign Out",
      language === "mm" ? "ထွက်မည်" : "Sign Out",
      language === "mm" ? "မထွက်ပါ" : "Cancel"
    );
    if (confirmed) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  const handleCreateProfile = async (e) => {
    if (e) e.preventDefault();

    const validation = validatePatientProfile(newProfile);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      showError(validation.firstError, "Validation Error");
      return;
    }

    setFormErrors({});

    try {
      setLoading(true);
      const payload = validation.sanitized;

      const res = await patientsApi.create(payload);
      setManageOpen(false);
      setNewProfile({
        name: "",
        gender: "Male",
        bloodType: "O+",
        dateOfBirth: "",
        mobileNo: "",
        email: "",
        allergies: "",
        chronicConditions: "",
        actualAddress: "",
      });
      showSuccess("Patient profile created successfully.");
      const newId = res?.patientId || res?.data?.patientId || res?.data?.id || res?.id;
      await loadDashboard(newId);
    } catch (err) {
      console.error("Create profile error:", err);
      showError(err);
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
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/80 bg-card/95 backdrop-blur-2xl p-5 shrink-0">
        <div className="pb-5 border-b border-border/70">
          <BrandLogo subtitle="Patient Portal" />
        </div>

        <nav className="flex-1 mt-6 flex flex-col gap-1.5 overflow-y-auto scrollbar-thin">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-900/40 shadow-xs"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`
            }
          >
            <DashboardIcon className="w-4 h-4 shrink-0" />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-border/70 flex flex-col gap-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors btn-target"
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400 shrink-0" /> : <MoonIcon className="w-4 h-4 shrink-0" />}
            <span>{isDark ? "Light Appearance" : "Dark Appearance"}</span>
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
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-md transition-all duration-300 animate-fadeIn"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-card/95 backdrop-blur-2xl p-5 border-r border-border/80 lg:hidden transform transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-5 border-b border-border/70">
          <BrandLogo subtitle="Patient Portal" />
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
                  ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-900/40 shadow-xs"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              }`
            }
          >
            <DashboardIcon className="w-4 h-4 shrink-0" />
            <span>{t.dashboard || "Dashboard"}</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-border/70 flex flex-col gap-1.5">
          <button
            onClick={() => {
              toggleTheme();
              setDrawerOpen(false);
            }}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground w-full btn-target"
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400 shrink-0" /> : <MoonIcon className="w-4 h-4 shrink-0" />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
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
        <header className="flex h-16 w-full items-center justify-between border-b border-border/80 bg-background/85 backdrop-blur-2xl px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-2xl text-foreground hover:bg-secondary border border-border/80 shadow-2xs"
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
                    className="scms-select h-9 text-xs font-semibold text-foreground pr-8 bg-card border-border/80"
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
                <div className="text-xs font-bold text-muted-foreground">No profiles linked</div>
              )}

              <button
                title="Add Family Member"
                onClick={() => setManageOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/40 hover:bg-orange-100 btn-target"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar */}
            {activeProfile && (
              <div className="flex items-center gap-2.5 border-l border-border/80 pl-3">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-2xs">
                  {getInitials(activeProfile.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-foreground truncate max-w-28">
                    {activeProfile.name}
                  </div>
                  <div className="text-[10px] font-semibold text-muted-foreground">
                    Family Member
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background">
          <div className="mx-auto max-w-6xl">
            {error && (
              <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-bold text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            {loading && !data ? (
              <div className="grid place-items-center h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-3">
                  <span className="loading loading-spinner loading-md text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
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
      <ModalPortal isOpen={manageOpen} onClose={() => setManageOpen(false)}>
        <form
          onSubmit={handleCreateProfile}
          className="w-full max-w-lg rounded-3xl border border-border/80 bg-card p-6 shadow-scms-modal space-y-4 max-h-[90vh] overflow-y-auto"
        >
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {language === "mm" ? "မိသားစုဝင် ဆေးမှတ်တမ်းပရိုဖိုင် အသစ်ထည့်ရန်" : "Add Family Patient Profile"}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Link a family member to book appointments and track prescriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                <Cross2Icon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2 text-xs">
              <label className="block sm:col-span-2">
                <span className="mb-1 block font-bold text-foreground">
                  Full Name <span className="text-rose-500">*</span>
                </span>
                <input
                  required
                  value={newProfile.name}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, name: e.target.value }));
                    if (formErrors.name) setFormErrors((errs) => ({ ...errs, name: null }));
                  }}
                  className={`scms-input w-full text-xs ${formErrors.name ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  placeholder="e.g. Daw Aye Aye"
                />
                {formErrors.name && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.name}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-foreground">
                  Gender <span className="text-rose-500">*</span>
                </span>
                <select
                  value={newProfile.gender}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, gender: e.target.value }));
                    if (formErrors.gender) setFormErrors((errs) => ({ ...errs, gender: null }));
                  }}
                  className={`scms-select w-full text-xs ${formErrors.gender ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {formErrors.gender && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.gender}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-foreground">
                  Blood Type <span className="text-rose-500">*</span>
                </span>
                <select
                  value={newProfile.bloodType}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, bloodType: e.target.value }));
                    if (formErrors.bloodType) setFormErrors((errs) => ({ ...errs, bloodType: null }));
                  }}
                  className={`scms-select w-full text-xs font-semibold ${formErrors.bloodType ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                    <option key={bt} value={bt}>
                      {bt}
                    </option>
                  ))}
                </select>
                {formErrors.bloodType && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.bloodType}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-foreground">
                  Date of Birth <span className="text-rose-500">*</span>
                </span>
                <input
                  type="date"
                  max={new Date().toISOString().split("T")[0]}
                  value={newProfile.dateOfBirth}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, dateOfBirth: e.target.value }));
                    if (formErrors.dateOfBirth) setFormErrors((errs) => ({ ...errs, dateOfBirth: null }));
                  }}
                  className={`scms-input w-full text-xs font-mono ${formErrors.dateOfBirth ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                />
                {formErrors.dateOfBirth && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.dateOfBirth}
                  </span>
                )}
              </label>

              <label className="block">
                <span className="mb-1 block font-bold text-foreground">
                  Primary Mobile <span className="text-rose-500">*</span>
                </span>
                <input
                  type="tel"
                  value={newProfile.mobileNo}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, mobileNo: e.target.value }));
                    if (formErrors.mobileNo) setFormErrors((errs) => ({ ...errs, mobileNo: null }));
                  }}
                  className={`scms-input w-full text-xs font-mono ${formErrors.mobileNo ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  placeholder="09..."
                />
                {formErrors.mobileNo && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.mobileNo}
                  </span>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block font-bold text-foreground">Email Address (Optional)</span>
                <input
                  type="email"
                  value={newProfile.email}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, email: e.target.value }));
                    if (formErrors.email) setFormErrors((errs) => ({ ...errs, email: null }));
                  }}
                  className={`scms-input w-full text-xs ${formErrors.email ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  placeholder="name@example.com"
                />
                {formErrors.email && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.email}
                  </span>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block font-bold text-foreground">
                  Residential Address <span className="text-rose-500">*</span>
                </span>
                <textarea
                  rows={2}
                  value={newProfile.actualAddress}
                  onChange={(e) => {
                    setNewProfile((p) => ({ ...p, actualAddress: e.target.value }));
                    if (formErrors.actualAddress) setFormErrors((errs) => ({ ...errs, actualAddress: null }));
                  }}
                  className={`scms-textarea w-full text-xs ${formErrors.actualAddress ? "border-rose-500 ring-1 ring-rose-500" : ""}`}
                  placeholder="Street / Township / City"
                />
                {formErrors.actualAddress && (
                  <span className="text-[11px] text-rose-500 font-semibold mt-1 block">
                    {formErrors.actualAddress}
                  </span>
                )}
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block font-bold text-foreground">Known Allergies</span>
                <input
                  value={newProfile.allergies}
                  onChange={(e) => setNewProfile((p) => ({ ...p, allergies: e.target.value }))}
                  className="scms-input w-full text-xs"
                  placeholder="e.g. Penicillin, Aspirin, Peanuts"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-1 block font-bold text-foreground">Chronic Conditions</span>
                <input
                  value={newProfile.chronicConditions}
                  onChange={(e) => setNewProfile((p) => ({ ...p, chronicConditions: e.target.value }))}
                  className="scms-input w-full text-xs"
                  placeholder="e.g. Hypertension, Asthma"
                />
              </label>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="scms-btn-outline text-xs"
              >
                {t.cancel || "Cancel"}
              </button>
              <button type="submit" disabled={loading} className="scms-btn-primary text-xs font-bold shadow-xs">
                {loading ? <span className="loading loading-spinner loading-xs" /> : "Save Profile"}
              </button>
            </div>
          </form>
      </ModalPortal>
    </div>
  );
}

