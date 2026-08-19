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
  ChevronDownIcon,
  MagnifyingGlassIcon,
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
      setAnnouncement(`Patient with Token ${nextToken} is called to consultation.`);
      await showAlert(`Calling Token ${nextToken} into the Consultation Room.`, "Patient Called");
      window.dispatchEvent(new CustomEvent("scms:refresh-queue"));
    } catch (err) {
      showError(err?.response?.data?.message || "No more waiting patients in today's queue.");
    } finally {
      setCallingNext(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors">
      <SkipLink targetId="doctor-content" />

      {/* Screen Reader Live Region for Queue Announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Doctor Workspace Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/80 bg-card/95 backdrop-blur-2xl p-4 transition-all duration-300 lg:w-[260px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <BrandLogo subtitle={t.doctorPortal} />
          <button
            className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary lg:hidden btn-target"
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
            className="scms-btn-primary w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-xs btn-target rounded-2xl"
          >
            {callingNext ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <PlayIcon className="w-4 h-4 shrink-0" />
            )}
            <span>{t.callNextPatient}</span>
          </button>
        </div>

        {/* Doctor Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto pt-4 pr-1 scrollbar-thin" aria-label="Doctor Navigation">
          {doctorNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all btn-target ${
                    isActive
                      ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-900/40 shadow-xs"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
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
        <div className="pt-3 border-t border-border/70 space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 w-full py-2.5 px-3 transition-colors btn-target"
          >
            <ExitIcon className="w-4 h-4 shrink-0" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px] transition-all duration-300">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/85 backdrop-blur-2xl px-4 sm:px-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground lg:hidden btn-target shadow-2xs"
              onClick={() => setOpen(true)}
              aria-label="Toggle menu"
            >
              <HamburgerMenuIcon className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/60 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/40">
              {t.doctorPortal}
            </span>
          </div>

          {/* User badge & Utility toggles */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary transition btn-target shadow-2xs"
              title={isDark ? t.lightMode : t.darkMode}
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-foreground" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="scms-btn-outline px-3 h-9 min-h-9 text-xs font-bold btn-target shadow-2xs"
              title="Switch language"
            >
              {language === "en" ? "မြန်မာ" : "English"}
            </button>

            {/* Doctor Profile Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-border/80">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-xs border border-orange-500/20">
                {user?.name?.[0] || "D"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-foreground leading-none">
                  {user?.name || "Dr. Clinician"}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground leading-none mt-1">
                  Physician
                </div>
              </div>
              <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
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

