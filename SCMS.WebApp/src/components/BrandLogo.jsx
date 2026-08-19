export function BrandLogoIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="currentColor" fillOpacity="0.15" />
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

export default function BrandLogo({ subtitle, collapsed = false, className = "" }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm shrink-0">
        <BrandLogoIcon size={22} />
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-foreground leading-tight">
            ကုမယ်
          </span>
          {subtitle && (
            <span className="text-[11px] font-medium text-muted-foreground leading-tight">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

