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

      <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <article className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/40 shrink-0">
              <GlobeIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t.apiBaseUrl}
              </p>
              <p className="mt-1 break-all font-mono text-xs font-bold text-foreground">
                {API_BASE_URL}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/40 shrink-0">
              <CheckCircledIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security</p>
              <p className="mt-1 text-xs text-muted-foreground">
                JWT Bearer authentication tokens are automatically attached to all outbound API requests.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-border/80 bg-card/95 p-6 shadow-scms">
        <h2 className="text-base font-bold text-foreground">Active Service Endpoints</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {endpointGroups.map((group) => (
            <div
              key={group}
              className="flex items-center gap-2 rounded-2xl border border-border/80 bg-secondary/50 px-4 py-3 text-xs font-bold text-foreground font-mono"
            >
              <LayersIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>/api/{group.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

