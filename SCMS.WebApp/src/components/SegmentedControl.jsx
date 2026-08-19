export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = "md",
  ariaLabel = "View switcher",
}) {
  const sizeClasses = {
    sm: "p-1 text-xs gap-1",
    md: "p-1.5 text-xs gap-1",
    lg: "p-2 text-sm gap-1.5",
  }[size] || "p-1.5 text-xs gap-1";

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-2xl bg-secondary/70 border border-border/80 shadow-2xs ${sizeClasses}`}
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
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-bold transition-all btn-target ${
              isSelected
                ? "bg-card text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

