export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  ariaLabel = "View switcher",
}) {
  const sizeClasses = {
    sm: "p-0.5 text-xs",
    md: "p-1 text-sm",
    lg: "p-1.5 text-sm",
  }[size] || "p-1 text-sm";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 ${sizeClasses}`}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition-all btn-target ${
              isSelected
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
