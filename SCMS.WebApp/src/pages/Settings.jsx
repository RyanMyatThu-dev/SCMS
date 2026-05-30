import { Server, ShieldCheck } from "lucide-react";
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
    <div className="space-y-5">
      <PageHeader title={t.endpointConsole} subtitle={t.endpointConsoleHint} />

      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <article className="scms-card p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-scms-primaryLight text-scms-primary">
              <Server size={22} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-scms-muted">{t.apiBaseUrl}</p>
              <p className="mt-2 break-all text-sm font-black text-scms-text">{API_BASE_URL}</p>
            </div>
          </div>
        </article>

        <article className="scms-card p-5">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#ECFDF3] text-scms-success">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-scms-muted">Security</p>
              <p className="mt-2 text-sm font-bold text-scms-text">JWT bearer tokens are attached automatically through the Axios request interceptor.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="scms-card p-5">
        <h2 className="text-xl font-black text-scms-text">Endpoint Groups</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {endpointGroups.map((group) => (
            <div key={group} className="rounded-xl border border-scms-border bg-[#F9FAFB] px-4 py-3 text-sm font-extrabold text-scms-text">
              {group}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
