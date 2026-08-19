import {
  CheckCircledIcon,
  ClockIcon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  ActivityLogIcon,
  DotFilledIcon,
} from "@radix-ui/react-icons";

export default function StatusBadge({ value }) {
  const s = String(value || "").toLowerCase().trim();

  let styles = "bg-secondary text-secondary-foreground border-border";
  let Icon = DotFilledIcon;
  let label = value || "Unknown";

  if (["completed", "paid", "success", "approved", "verified", "active"].includes(s)) {
    styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    Icon = CheckCircledIcon;
  } else if (["pending", "requested", "waiting", "scheduled"].includes(s)) {
    styles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    Icon = ClockIcon;
  } else if (["in consultation", "in-progress", "in_progress", "consulting"].includes(s)) {
    styles = "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
    Icon = ActivityLogIcon;
  } else if (["cancelled", "failed", "rejected", "expired", "quarantined"].includes(s)) {
    styles = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    Icon = CrossCircledIcon;
  } else if (["warning", "low stock", "critical"].includes(s)) {
    styles = "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800";
    Icon = ExclamationTriangleIcon;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${styles}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

