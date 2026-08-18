import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  EyeOpenIcon,
  EyeClosedIcon,
  LockClosedIcon,
  EnvelopeClosedIcon,
  PersonIcon,
  CheckCircledIcon,
  SunIcon,
  MoonIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import BrandLogo, { BrandLogoIcon } from "../components/BrandLogo";
import { showError } from "../services/dialogs";

const demoAccounts = [
  {
    roleKey: "roleOwner",
    email: "dr.thandar@scms.demo",
    password: "password",
    role: "admin",
    route: "/app/dashboard",
    badge: "Owner / Admin",
  },
  {
    roleKey: "roleDoctor",
    email: "dr.thandar@scms.demo",
    password: "password",
    role: "doctor",
    route: "/doctor/dashboard",
    badge: "Doctor",
  },
  {
    roleKey: "rolePatient",
    email: "aung.min@example.test",
    password: "password",
    role: "user",
    route: "/user/dashboard",
    badge: "Patient",
  },
];

export default function AuthPage({ mode = "login" }) {
  const isRegister = mode === "register";
  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [form, setForm] = useState({
    name: "",
    email: "dr.thandar@scms.demo",
    password: "password",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const applyDemoAccount = (acc) => {
    setSelectedRole(acc.role);
    setForm({
      name: "",
      email: acc.email,
      password: acc.password,
    });
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim() || (isRegister && !form.name.trim())) {
      await showError(t.requiredFields);
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
      }

      const loggedUser = await login({
        emailOrMobile: form.email.trim(),
        password: form.password,
        roleHint: selectedRole,
      });

      if (loggedUser?.role === "doctor" || selectedRole === "doctor") {
        navigate("/doctor/dashboard", { replace: true });
      } else if (loggedUser?.role === "user" || selectedRole === "user") {
        navigate("/user/dashboard", { replace: true });
      } else {
        navigate(location.state?.from?.pathname || "/app/dashboard", { replace: true });
      }
    } catch (error) {
      await showError(
        error?.response?.data?.message || error?.message || t.signInFailed,
        t.signInFailed
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 lg:grid-cols-[1.1fr_0.9fr] transition-colors">
      {/* Left Apple Glass Brand Hero Banner */}
      <section className="hidden items-center justify-center p-12 lg:flex bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl rounded-3xl border border-white/15 bg-white/10 backdrop-blur-2xl p-10 shadow-2xl space-y-8">
          <div className="flex items-center gap-3.5">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-indigo-600 shadow-lg shrink-0">
              <BrandLogoIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">ကုမယ်</h1>
              <p className="text-xs font-medium text-white/80 tracking-wide">
                Smart Clinic Management Platform
              </p>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-white/90">
            A unified clinical operating system tailored for Practice Owners, Consulting Doctors, and Patient Families. Designed according to Apple Human Interface Guidelines and WCAG 2.2 AA accessibility.
          </p>

          {/* Quick Demo Switcher */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white/70 block">
              {t.demoRoles}
            </span>
            <div className="grid gap-2.5">
              {demoAccounts.map((acc) => {
                const isSelected = selectedRole === acc.role && form.email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => applyDemoAccount(acc)}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all btn-target ${
                      isSelected
                        ? "bg-white/20 border-white text-white shadow-md font-bold"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircledIcon
                        className={`w-5 h-5 ${
                          isSelected ? "text-emerald-400" : "text-white/40"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-semibold">{t[acc.roleKey] || acc.roleKey}</div>
                        <div className="text-xs text-white/60 font-mono">{acc.email}</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {acc.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Right Form Card */}
      <section className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-12 relative">
        {/* Top Floating Controls */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition btn-target"
            title={isDark ? t.lightMode : t.darkMode}
            aria-label="Toggle dark mode"
          >
            {isDark ? <SunIcon className="w-4 h-4 text-amber-400" /> : <MoonIcon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            className="scms-btn-outline px-3 h-9 min-h-9 text-xs font-bold btn-target"
            onClick={toggleLanguage}
          >
            {language === "en" ? "မြန်မာ" : "English"}
          </button>
        </div>

        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <BrandLogo />
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-8 shadow-xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isRegister ? t.register : t.welcome}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isRegister ? t.registerHint : t.loginHint}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {isRegister && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.fullName} <span className="text-rose-500">*</span>
                  </span>
                  <div className="relative">
                    <PersonIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      className="scms-input w-full pl-10"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="e.g., Dr. Thandar Aung"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.email} <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <EnvelopeClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="scms-input w-full pl-10"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="name@clinic.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t.password} <span className="text-rose-500">*</span>
                </span>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    className="scms-input w-full pl-10 pr-10"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 btn-target"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeClosedIcon className="w-4 h-4" />
                    ) : (
                      <EyeOpenIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="scms-btn-primary w-full mt-2 flex items-center justify-center gap-2 btn-target"
                disabled={loading}
              >
                {loading && <span className="loading loading-spinner loading-xs" />}
                <span>{isRegister ? t.register : t.login}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              {isRegister ? (
                <span>
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {t.login}
                  </Link>
                </span>
              ) : (
                <span>
                  Need an account?{" "}
                  <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                    {t.register}
                  </Link>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
