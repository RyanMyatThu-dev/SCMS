import { useState } from "react";

export default function DistributionDonutChart({
  title = "Traffic Sources",
  segments = [
    { label: "Direct", value: 40, color: "#F97316" },
    { label: "Organic Search", value: 30, color: "#FED7AA" },
    { label: "Social Media", value: 20, color: "#EA580C" },
    { label: "Referral", value: 10, color: "#475569" },
  ],
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const size = 180;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 100;

  let accumulatedOffset = 0;

  return (
    <div className="rounded-3xl border border-border/80 bg-card/95 p-6 sm:p-7 shadow-scms backdrop-blur-sm flex flex-col justify-between space-y-4">
      {/* Header */}
      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>

      {/* Donut & Legend Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* SVG Donut Graphic */}
        <div className="relative w-[150px] h-[150px] shrink-0">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full -rotate-90 transform overflow-visible"
            role="img"
            aria-label={`${title} distribution chart`}
          >
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-secondary/40"
            />

            {/* Segment Arcs */}
            {segments.map((seg, idx) => {
              const segmentPercent = seg.value / total;
              const strokeDasharray = `${segmentPercent * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedOffset * circumference;
              accumulatedOffset += segmentPercent;
              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer transition-all duration-200"
                />
              );
            })}
          </svg>

          {/* Center Cutout Label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
              Total
            </span>
            <span className="text-lg font-extrabold text-foreground font-mono">
              100%
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="w-full flex-1 space-y-2.5">
          {segments.map((seg, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer ${
                  isHovered ? "bg-secondary" : "hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {seg.label}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-muted-foreground ml-3 shrink-0">
                  {seg.value}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
