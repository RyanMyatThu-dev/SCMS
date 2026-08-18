export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  onClick,
  trend,
  subtitle,
}) {
  const tones = {
    primary: "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50",
    success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    warning: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    danger: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    teal: "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-100 dark:border-teal-900/50",
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
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm transition-all ${
        isClickable
          ? "cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md active:scale-[0.99]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`grid h-11 w-11 place-items-center rounded-xl border ${
              tones[tone] || tones.primary
            } shrink-0`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
