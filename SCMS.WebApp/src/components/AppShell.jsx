import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  DashboardIcon,
  PersonIcon,
  CalendarIcon,
  ArchiveIcon,
  ActivityLogIcon,
  FileTextIcon,
  CardStackIcon,
  ReloadIcon,
  BarChartIcon,
  MagicWandIcon,
  GearIcon,
  HamburgerMenuIcon,
  Cross2Icon,
  ExitIcon,
  SunIcon,
  MoonIcon,
  LayersIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChevronDownIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import BrandLogo from "./BrandLogo";
import SkipLink from "./SkipLink";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { to: "/app/dashboard", key: "dashboard", icon: DashboardIcon },
  { to: "/app/patients", key: "patients", icon: PersonIcon },
  { to: "/app/appointments", key: "appointments", icon: CalendarIcon },
  { to: "/app/medicines", key: "medicines", icon: ArchiveIcon },
  { to: "/app/medicines/batches", key: "batches", icon: LayersIcon },
  { to: "/app/diseases", key: "diseases", icon: ActivityLogIcon },
  { to: "/app/prescriptions", key: "prescriptions", icon: FileTextIcon },
  { to: "/app/payments", key: "payments", icon: CardStackIcon },
  { to: "/app/follow-ups", key: "followUps", icon: ReloadIcon },
  { to: "/app/reports", key: "reports", icon: BarChartIcon },
  { to: "/app/ai-assistant", key: "aiAssistant", icon: MagicWandIcon },
  { to: "/app/settings", key: "settings", icon: GearIcon },
];

export default function AppShell() {
  const { t, toggleLanguage, language } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/app/patients?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors">
      <SkipLink targetId="main-content" />

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Apricot Glass Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border/80 bg-card/95 backdrop-blur-2xl p-4 transition-all duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-[84px]" : "lg:w-[260px]"}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-border/70">
          <BrandLogo subtitle={t.ownerPortal} collapsed={collapsed} />
          <button
            className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-secondary lg:hidden btn-target"
            onClick={() => setOpen(false)}
            aria-label={t.close}
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav
          className="flex-1 space-y-1.5 overflow-y-auto pt-4 pr-1 scrollbar-thin"
          aria-label="Practice Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all btn-target ${
                    collapsed ? "justify-center gap-0" : "gap-3"
                  } ${
                    isActive
                      ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-900/40 shadow-xs"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`
                }
                title={collapsed ? t[item.key] : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{t[item.key]}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Banner Card (Matching reference mockup) */}
        {!collapsed && (
          <div className="my-3 rounded-2xl border border-orange-200/60 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/80 via-orange-50/40 to-transparent dark:from-orange-950/40 dark:via-orange-950/20 p-4 transition-all hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-orange-900 dark:text-orange-200">
                Upgrade Plan
              </span>
              <button
                onClick={() => navigate("/app/settings")}
                className="grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-white shadow-2xs hover:bg-orange-600 transition"
                aria-label="Upgrade plan details"
              >
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
              Unlock premium AI & advanced clinical features
            </p>
          </div>
        )}

        {/* Bottom logout controls */}
        <div className="pt-3 border-t border-border/70 space-y-2">
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 w-full py-2.5 px-3 transition-colors btn-target ${
              collapsed ? "justify-center" : "gap-3"
            }`}
            title={collapsed ? t.logout : undefined}
          >
            <ExitIcon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{t.logout}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:pl-[84px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Top Apricot Header Navigation Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/85 backdrop-blur-2xl px-4 sm:px-6 gap-4">
          {/* Left Controls & Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              className="grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground lg:hidden btn-target shadow-2xs"
              onClick={() => setOpen(true)}
              aria-label="Toggle mobile menu"
            >
              <HamburgerMenuIcon className="w-4 h-4" />
            </button>
            <button
              className="hidden lg:grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary transition btn-target shadow-2xs"
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Collapse sidebar"
            >
              <HamburgerMenuIcon className="w-4 h-4" />
            </button>

            {/* Universal Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative w-full max-w-md hidden sm:block">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search anything..."
                className="w-full h-10 rounded-2xl border border-border/80 bg-card/90 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              />
            </form>
          </div>

          {/* Right Utility Controls & User Profile Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary transition btn-target shadow-2xs"
              title={isDark ? t.lightMode : t.darkMode}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-foreground" />
              )}
            </button>

            {/* Notification Bell with Badge */}
            <button
              className="relative grid h-9 w-9 place-items-center rounded-2xl border border-border/80 bg-card text-foreground hover:bg-secondary transition btn-target shadow-2xs"
              title="Notifications"
              aria-label="3 new notifications"
              onClick={() => navigate("/app/appointments")}
            >
              <BellIcon className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-xs">
                3
              </span>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="scms-btn-outline px-3 h-9 min-h-9 text-xs font-bold btn-target shadow-2xs"
              title="Switch language"
            >
              {language === "en" ? "မြန်မာ" : "English"}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-border/80">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-xs border border-orange-500/20">
                {user?.name?.[0] || "O"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-foreground leading-none">
                  {user?.name || "Olivia Rhye"}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground leading-none mt-1">
                  {user?.role || "Admin"}
                </div>
              </div>
              <ChevronDownIcon className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Main Routed Content */}
        <main id="main-content" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

