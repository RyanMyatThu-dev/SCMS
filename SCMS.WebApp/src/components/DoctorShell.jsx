import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ActivityLogIcon,
  PersonIcon,
  FileTextIcon,
  MagicWandIcon,
  HamburgerMenuIcon,
  Cross2Icon,
  ExitIcon,
  SunIcon,
  MoonIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import BrandLogo from "./BrandLogo";
import SkipLink from "./SkipLink";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { appointmentsApi } from "../services/scmsApi";
import { showAlert, showError } from "../services/dialogs";

const doctorNav = [
  { to: "/doctor/dashboard", key: "doctorQueue", icon: ActivityLogIcon },
  { to: "/doctor/patients", key: "patients", icon: PersonIcon },
  { to: "/doctor/prescriptions", key: "prescriptions", icon: FileTextIcon },
  { to: "/doctor/ai-assistant", key: "aiAssistant", icon: MagicWandIcon },
];

export default function DoctorShell() {
  const { t, toggleLanguage, language } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [callingNext, setCallingNext] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleCallNext = async () => {
    try {
      setCallingNext(true);
      const res = await appointmentsApi.callNext();
      const nextToken = res?.tokenNumber || res?.data?.tokenNumber || "Next Patient";
      setAnnouncement(`Patient with Token #${nextToken} is called to consultation.`);
      await showAlert(`Calling Token #${nextToken} into the Consultation Room.`, "Patient Called");
      window.dispatchEvent(new CustomEvent("scms:refresh-queue"));
    } catch (err) {
      showError(err?.response?.data?.message || "No more waiting patients in today's queue.");
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <SkipLink targetId="doctor-content" />

      {/* Screen Reader Live Region for Queue Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Doctor Workspace Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 transition-all duration-300 lg:w-[260px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <BrandLogo subtitle={t.doctorPortal} />
          <button
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden btn-target"
            onClick={() => setOpen(false)}
            aria-label={t.close}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Call Next Quick Action */}
        <div className="pt-4">
          <button
            onClick={handleCallNext}
            disabled={callingNext}
            className="scms-btn-primary w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md btn-target"
          >
            {callingNext ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            <span>{t.callNextPatient}</span>
          </button>
        </div>

        {/* Doctor Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pt-4 pr-1" aria-label="Doctor Navigation">
          {doctorNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all btn-target ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t[item.key]}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-full py-2.5 px-3 transition-colors btn-target"
          >
            <ExitIcon className="w-4 h-4 shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px] transition-all duration-300">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 lg:hidden btn-target"
              onClick={() => setOpen(true)}
              aria-label="Toggle menu"
            >
              <HamburgerMenuIcon className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
              {t.doctorPortal}
            </span>
          </div>

          {/* User badge & Utility toggles */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition btn-target"
              title={isDark ? t.lightMode : t.darkMode}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="scms-btn-outline px-3 h-9 min-h-9 text-xs font-bold btn-target"
              title="Switch language"
            >
              {language === "en" ? "မြန်မာ" : "English"}
            </button>

            {/* Doctor Profile Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                {user?.name?.[0] || "D"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {user?.name || "Dr. Clinician"}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  Physician
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Doctor Main Content */}
        <main id="doctor-content" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
