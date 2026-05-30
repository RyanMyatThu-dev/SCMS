import React from "react";

export function BrandLogoIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Precise diagonal gradients for the two L-shaped ribbons to render the curved sheen */}
        <linearGradient id="ribbon1Grad" x1="58" y1="10" x2="10" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="30%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#E0F2FE" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="ribbon2Grad" x1="42" y1="90" x2="90" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="30%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#E0F2FE" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Ribbon 1: Top-Vertical arm curving smoothly into the Left-Horizontal arm */}
      <path
        d="M 58 10 L 58 26 C 58 43.68, 43.68 58, 26 58 L 10 58 L 10 42 L 26 42 C 34.84 42, 42 34.84, 42 26 L 42 10 Z"
        fill="url(#ribbon1Grad)"
      />

      {/* Ribbon 2: Bottom-Vertical arm curving smoothly into the Right-Horizontal arm */}
      <path
        d="M 42 90 L 42 74 C 42 56.32, 56.32 42, 74 42 L 90 42 L 90 58 L 74 58 C 65.16 58, 58 65.16, 58 74 L 58 90 Z"
        fill="url(#ribbon2Grad)"
      />
    </svg>
  );
}

export function BrandLogoFull({ size = 48, className = "", textColor = "text-scms-text" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <BrandLogoIcon size={size} />
      <span className={`text-lg font-black tracking-tight ${textColor}`}>ကုမယ်</span>
    </div>
  );
}
