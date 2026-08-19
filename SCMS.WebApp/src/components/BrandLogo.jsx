export function BrandLogoIcon({ size = 26, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="apricotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="8" fill="url(#apricotGradient)" />
      <path
        d="M14 6.5C14 6.5 8 9.5 8 14.5C8 18.5 11 21.5 14 21.5C17 21.5 20 18.5 20 14.5C20 9.5 14 6.5 14 6.5Z"
        fill="white"
        fillOpacity="0.25"
      />
      <path
        d="M14 8V20M8 14H20"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="14" r="2.2" fill="white" />
    </svg>
  );
}

export default function BrandLogo({ subtitle, collapsed = false, className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 shadow-xs border border-orange-500/20 shrink-0">
        <BrandLogoIcon size={24} />
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-tight text-foreground leading-tight">
              ကုမယ်
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 px-1.5 py-0.2 rounded-md font-mono">
              SCMS
            </span>
          </div>
          {subtitle && (
            <span className="text-[11px] font-medium text-muted-foreground leading-tight truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

