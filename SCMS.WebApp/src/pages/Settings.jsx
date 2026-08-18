import {
  GlobeIcon,
  CheckCircledIcon,
  LayersIcon,
} from "@radix-ui/react-icons";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { API_BASE_URL } from "../services/api";

const endpointGroups = [
  "Auth",
  "Dashboards",
  "Appointments",
  "Patients",
  "Prescriptions",
  "Medicines",
  "Diseases",
  "Payments",
  "FollowUps",
  "Notifications",
  "Reports",
  "MCP",
  "SignalR",
];

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader title={t.endpointConsole} subtitle={t.endpointConsoleHint} />

      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
              <GlobeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t.apiBaseUrl}
              </p>
              <p className="mt-1 break-all font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {API_BASE_URL}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircledIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Security</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                JWT Bearer authentication tokens are automatically attached to all outbound API requests.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Service Endpoints</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {endpointGroups.map((group) => (
            <div
              key={group}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-200 font-mono"
            >
              <LayersIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>/api/{group.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
