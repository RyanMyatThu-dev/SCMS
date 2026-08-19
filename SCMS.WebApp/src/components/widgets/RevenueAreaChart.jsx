import { useState } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";

export default function RevenueAreaChart({
  title = "Revenue Overview",
  data = [
    { label: "May 12", value: 8200 },
    { label: "May 13", value: 18500 },
    { label: "May 14", value: 14200 },
    { label: "May 15", value: 24780 },
    { label: "May 16", value: 26100 },
    { label: "May 17", value: 16800 },
    { label: "May 18", value: 28450 },
  ],
  currency = "MMK",
  periodOptions = ["This Week", "This Month", "Last 30 Days"],
  onPeriodChange,
}) {
  const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const width = 560;
  const height = 220;
  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const values = data.map((d) => d.value);
  const rawMax = Math.max(...values, 30000);
  const maxValue = Math.ceil(rawMax / 10000) * 10000;
  const minValue = 0;

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.value - minValue) / (maxValue - minValue)) * chartHeight;
    return { ...d, x, y };
  });

  // Generate smooth cubic bezier SVG path
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${
        paddingTop + chartHeight
      } Z`
    : "";

  const yTicks = [0, maxValue * 0.333, maxValue * 0.666, maxValue];

  const formatYLabel = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-7 shadow-scms backdrop-blur-sm flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
          {title}
        </h3>

        <div className="relative inline-block">
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              onPeriodChange && onPeriodChange(e.target.value);
            }}
            className="appearance-none rounded-xl border border-border/80 bg-secondary/60 dark:bg-secondary/40 py-1.5 pl-3 pr-8 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            aria-label="Select chart time period"
          >
            {periodOptions.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          role="img"
          aria-label={`${title} chart showing values over time`}
        >
          <defs>
            {/* Smooth Warm Apricot Gradient Fill */}
            <linearGradient id="apricotAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#F97316" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / maxValue) * chartHeight;
            return (
              <g key={i} className="text-muted-foreground/50">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  className="text-border/80"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] font-medium font-sans"
                >
                  {formatYLabel(tick)}
                </text>
              </g>
            );
          })}

          {/* Area Gradient Background */}
          <path d={areaPath} fill="url(#apricotAreaGrad)" />

          {/* Glowing Orange Line Curve */}
          <path
            d={linePath}
            fill="none"
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points with Hover Focus */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.index === idx;
            return (
              <g
                key={idx}
                tabIndex={0}
                role="button"
                aria-label={`${pt.label}: ${Number(pt.value).toLocaleString()} ${currency}`}
                onMouseEnter={() => setHoveredPoint({ ...pt, index: idx })}
                onMouseLeave={() => setHoveredPoint(null)}
                onFocus={() => setHoveredPoint({ ...pt, index: idx })}
                onBlur={() => setHoveredPoint(null)}
                className="cursor-pointer focus-visible:outline-none"
              >
                {/* Invisible larger hit target */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Point dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#F97316"
                  strokeWidth={isHovered ? 3 : 2.5}
                  className="transition-all duration-150"
                />

                {/* X-axis date labels */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[11px] font-sans transition-colors ${
                    isHovered
                      ? "fill-orange-600 dark:fill-orange-400 font-bold"
                      : "fill-muted-foreground font-medium"
                  }`}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-2xl bg-foreground text-background dark:bg-card dark:text-card-foreground border border-border px-3 py-1.5 text-xs font-bold shadow-xl animate-fadeIn whitespace-nowrap transition-all"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 8}%`,
            }}
          >
            <div className="text-[10px] text-muted-foreground font-medium">
              {hoveredPoint.label}
            </div>
            <div className="font-mono text-xs font-extrabold text-orange-500">
              {Number(hoveredPoint.value).toLocaleString()} {currency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
