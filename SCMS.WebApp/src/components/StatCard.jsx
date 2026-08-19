export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "apricot",
  onClick,
  trend,
  trendDirection = "up", // "up" | "down" | "neutral"
  subtitle,
}) {
  const tones = {
    apricot: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/40",
    primary: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/40",
    success: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40",
    warning: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/40",
    danger: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40",
    indigo: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/40",
  };

  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/95 text-card-foreground p-5 sm:p-6 shadow-scms transition-all backdrop-blur-sm ${
        isClickable
          ? "cursor-pointer hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-scms-raised active:scale-[0.99]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground tracking-wide truncate">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] font-medium text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl border ${
              tones[tone] || tones.apricot
            } shrink-0 shadow-2xs`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={
              trendDirection === "down"
                ? "text-rose-600 dark:text-rose-400 font-bold"
                : "text-orange-600 dark:text-orange-400 font-bold"
            }
          >
            {trendDirection === "down" ? "↓" : "↑"} {trend}
          </span>
          <span className="text-muted-foreground text-[11px] font-normal">
            vs last week
          </span>
        </div>
      )}
    </div>
  );
}
